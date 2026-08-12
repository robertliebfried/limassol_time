import time
import json
import os
import sys
import threading
import tkinter as tk
from tkinter import ttk, messagebox
import requests
from datetime import datetime, timezone

# -------------------------------------------------------------------
# CONFIGURATION
# -------------------------------------------------------------------
FIREBASE_API_KEY = "AIzaSyBOQaJrFF6opjdymkh2fd4nmEw4A6r3tOY"
FIREBASE_PROJECT = "karfigestsa"

CLOCKIFY_API_KEY = "ZWVlYjQ1ZDMtODMzNS00NWZmLTg2NjAtYmMxZDQ0MWM1NzQ5"
AW_URL = "http://127.0.0.1:5600"
CHECK_INTERVAL = 30  # seconds
USER_FILE = "selected_user.json"

# -------------------------------------------------------------------
# AUTO-UPDATE MECHANISM
# -------------------------------------------------------------------
def auto_update():
    try:
        import urllib.request
        import subprocess
        req = urllib.request.Request("https://limassoltime.web.app/downloads/version.txt", headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as response:
            version = response.read().decode('utf-8').strip()
            
        current_version = "1.0.0"
        if version > current_version:
            print(f"[{datetime.now().strftime('%H:%M:%S')}] New version {version} found! Downloading...")
            exe_url = "https://limassoltime.web.app/downloads/LimassolTracker.exe"
            new_exe = "LimassolTracker_new.exe"
            
            req_exe = urllib.request.Request(exe_url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req_exe, timeout=30) as response, open(new_exe, 'wb') as out_file:
                out_file.write(response.read())
                
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Download complete. Restarting...")
            bat_content = '''@echo off
timeout /t 2 /nobreak >nul
taskkill /f /im LimassolTracker.exe >nul
del LimassolTracker.exe
ren LimassolTracker_new.exe LimassolTracker.exe
start LimassolTracker.exe
del update.bat
'''
            with open("update.bat", "w") as f:
                f.write(bat_content)
                
            subprocess.Popen("update.bat", shell=True)
            sys.exit(0)
    except Exception as e:
        print(f"[{datetime.now().strftime('%H:%M:%S')}] Update check failed: {e}")

def update_loop():
    while True:
        auto_update()
        time.sleep(86400) # Check every 24 hours

threading.Thread(target=update_loop, daemon=True).start()

# -------------------------------------------------------------------
# LimassolTime Firebase Firestore API (Primary)
# -------------------------------------------------------------------
def update_firestore_status(username, status):
    doc_id = username.lower().strip().replace(" ", "")
    url = f"https://firestore.googleapis.com/v1/projects/{FIREBASE_PROJECT}/databases/(default)/documents/employees/{doc_id}?key={FIREBASE_API_KEY}"
    
    now_str = datetime.now().strftime("%I:%M %p")
    fields = {
        "username": {"stringValue": doc_id},
        "status": {"stringValue": status},
        "lastSeen": {"timestampValue": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")}
    }
    if status == "checked_in":
        fields["checkInTime"] = {"stringValue": now_str}
    elif status == "completed":
        fields["checkOutTime"] = {"stringValue": now_str}
        
    try:
        r = requests.patch(url, json={"fields": fields}, timeout=10)
        if r.status_code in [200, 201]:
            print(f"[{now()}] 🔥 LimassolTime status updated -> {status}")
            return True
        else:
            print(f"[{now()}] Firestore status code: {r.status_code}")
    except Exception as e:
        print(f"[{now()}] Firestore update error: {e}")
    return False

# -------------------------------------------------------------------
# Clockify API (Secondary Backup)
# -------------------------------------------------------------------
def clockify_get(path):
    try:
        r = requests.get(
            f"https://api.clockify.me/api/v1{path}",
            headers={"X-Api-Key": CLOCKIFY_API_KEY},
            timeout=10
        )
        if r.status_code == 200:
            return r.json()
    except Exception as e:
        print(f"Clockify GET error: {e}")
    return None

def get_workspace():
    user = clockify_get("/user")
    if user:
        return user["activeWorkspace"]
    return None

def get_running_timer(workspace_id, user_id):
    entries = clockify_get(
        f"/workspaces/{workspace_id}/user/{user_id}/time-entries?in-progress=true"
    )
    if entries and len(entries) > 0:
        return entries[0]
    return None

def start_timer(workspace_id):
    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    try:
        r = requests.post(
            f"https://api.clockify.me/api/v1/workspaces/{workspace_id}/time-entries",
            headers={"X-Api-Key": CLOCKIFY_API_KEY, "Content-Type": "application/json"},
            json={"start": now_iso, "description": "Auto-tracked (ActivityWatch)"},
            timeout=10
        )
        if r.status_code in [200, 201]:
            print(f"[{now()}] ✅ Clockify Timer STARTED")
            return True
    except Exception as e:
        print(f"Start timer error: {e}")
    return False

def stop_timer(workspace_id, user_id):
    now_iso = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    try:
        r = requests.patch(
            f"https://api.clockify.me/api/v1/workspaces/{workspace_id}/user/{user_id}/time-entries",
            headers={"X-Api-Key": CLOCKIFY_API_KEY, "Content-Type": "application/json"},
            json={"end": now_iso},
            timeout=10
        )
        if r.status_code == 200:
            print(f"[{now()}] ⏹ Clockify Timer STOPPED (AFK)")
            return True
    except Exception as e:
        print(f"Stop timer error: {e}")
    return False

# -------------------------------------------------------------------
# ActivityWatch API
# -------------------------------------------------------------------
def get_afk_bucket():
    try:
        r = requests.get(f"{AW_URL}/api/0/buckets", timeout=5)
        if r.status_code == 200:
            for bucket_id in r.json():
                if bucket_id.startswith("aw-watcher-afk_"):
                    return bucket_id
    except:
        pass
    return None

def is_active(bucket_id):
    try:
        r = requests.get(
            f"{AW_URL}/api/0/buckets/{bucket_id}/events?limit=1",
            timeout=5
        )
        if r.status_code == 200:
            events = r.json()
            if events:
                return events[0].get("data", {}).get("status") == "not-afk"
    except:
        pass
    return False

# -------------------------------------------------------------------
# Helpers & Storage
# -------------------------------------------------------------------
def now():
    return datetime.now().strftime("%H:%M:%S")

def load_user():
    if os.path.exists(USER_FILE):
        try:
            with open(USER_FILE, "r") as f:
                return json.load(f)
        except:
            pass
    return None

def save_user(username, pin):
    with open(USER_FILE, "w") as f:
        json.dump({
            "username": username.strip().lower(),
            "pin": pin.strip()
        }, f)

# -------------------------------------------------------------------
# GUI: First-time setup window (100% English, Username + PIN fields)
# -------------------------------------------------------------------
def show_setup_window():
    result = {}

    win = tk.Tk()
    win.title("Limassol Tracker Setup")
    win.geometry("380x280")
    win.resizable(False, False)
    win.configure(bg="#1a1a2e")

    win.eval('tk::PlaceWindow . center')

    tk.Label(
        win, text="🕐 Limassol Time Tracker",
        font=("Arial", 16, "bold"), bg="#1a1a2e", fg="white"
    ).pack(pady=(20, 5))

    tk.Label(
        win, text="Enter your agent credentials:",
        font=("Arial", 11), bg="#1a1a2e", fg="#aaaacc"
    ).pack(pady=(2, 12))

    frame = tk.Frame(win, bg="#1a1a2e")
    frame.pack(padx=25, fill="x")

    tk.Label(
        frame, text="Username:",
        font=("Arial", 10, "bold"), bg="#1a1a2e", fg="white", anchor="w"
    ).grid(row=0, column=0, sticky="w", pady=4)

    username_entry = ttk.Entry(frame, font=("Arial", 11), width=22)
    username_entry.grid(row=0, column=1, pady=4, padx=(10, 0))
    username_entry.insert(0, "philippe")

    tk.Label(
        frame, text="PIN:",
        font=("Arial", 10, "bold"), bg="#1a1a2e", fg="white", anchor="w"
    ).grid(row=1, column=0, sticky="w", pady=4)

    pin_entry = ttk.Entry(frame, font=("Arial", 11), show="*", width=22)
    pin_entry.grid(row=1, column=1, pady=4, padx=(10, 0))
    pin_entry.insert(0, "1234")

    def on_save():
        username = username_entry.get().strip().lower()
        pin = pin_entry.get().strip()

        if not username:
            messagebox.showwarning("Warning", "Please enter your username!")
            return
        if not pin:
            messagebox.showwarning("Warning", "Please enter your PIN!")
            return

        save_user(username, pin)
        result["username"] = username
        result["pin"] = pin
        win.destroy()

    btn = tk.Button(
        win, text="  Save & Start Tracker  ",
        font=("Arial", 11, "bold"),
        bg="#4f46e5", fg="white",
        relief="flat", padx=12, pady=7,
        cursor="hand2",
        command=on_save
    )
    btn.pack(pady=18)

    win.mainloop()
    return result if "username" in result else None

# -------------------------------------------------------------------
# Status Window (100% English)
# -------------------------------------------------------------------
def show_tray_notification(username):
    win = tk.Tk()
    win.title(f"Limassol Tracker — {username.capitalize()}")
    win.geometry("340x95")
    win.resizable(False, False)
    win.configure(bg="#0f172a")

    label = tk.Label(
        win, text=f"✅ LimassolTime Sync Active\n👤 Agent: {username.capitalize()}",
        font=("Arial", 10, "bold"), bg="#0f172a", fg="#4ade80"
    )
    label.pack(expand=True)

    tk.Label(
        win, text="Do not close this window while working",
        font=("Arial", 8), bg="#0f172a", fg="#64748b"
    ).pack(pady=(0, 8))

    win.mainloop()

# -------------------------------------------------------------------
# Main Sync Loop
# -------------------------------------------------------------------
def sync_loop(username, pin):
    print(f"\n[{now()}] 🚀 Starting LimassolTime Sync for {username}")
    print(f"[{now()}] Searching for ActivityWatch...")

    bucket_id = None
    while not bucket_id:
        bucket_id = get_afk_bucket()
        if not bucket_id:
            print(f"[{now()}] ⏳ Waiting for ActivityWatch (make sure aw-watcher-afk is running)...")
            time.sleep(5)

    print(f"[{now()}] ✅ ActivityWatch connected! Monitoring activity...\n")

    workspace_id = get_workspace()
    last_status = None

    while True:
        try:
            active = is_active(bucket_id)
            current_status = "checked_in" if active else "completed"

            # 1. Update LimassolTime Firebase (Primary)
            if current_status != last_status:
                update_firestore_status(username, current_status)
                last_status = current_status

            # 2. Update Clockify (Secondary Backup)
            if workspace_id:
                timer_running = get_running_timer(workspace_id, username) is not None
                if active and not timer_running:
                    start_timer(workspace_id)
                elif not active and timer_running:
                    stop_timer(workspace_id, username)

            status_disp = "🟢 Active (Working)" if active else "🔴 Inactive (AFK)"
            print(f"[{now()}] Status: {status_disp}")

        except Exception as e:
            print(f"[{now()}] Sync loop error: {e}")

        time.sleep(CHECK_INTERVAL)

# -------------------------------------------------------------------
# Entry Point
# -------------------------------------------------------------------
def main():
    user_data = load_user()

    if not user_data:
        user_data = show_setup_window()
        if not user_data:
            print("Setup cancelled.")
            return

    username = user_data["username"]
    pin = user_data.get("pin", "1234")

    sync_thread = threading.Thread(
        target=sync_loop,
        args=(username, pin),
        daemon=True
    )
    sync_thread.start()

    show_tray_notification(username)

if __name__ == "__main__":
    main()
