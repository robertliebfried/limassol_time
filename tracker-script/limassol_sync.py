import time
import json
import os
import sys
import threading
import tkinter as tk
from tkinter import ttk, messagebox
import requests
from datetime import datetime, timezone
import winreg as reg
import pystray
from PIL import Image, ImageDraw

# -------------------------------------------------------------------
# SELF-INSTALLER & ANTIVIRUS EXCLUSIONS
# -------------------------------------------------------------------
import ctypes
import shutil
import subprocess

def self_install():
    target_dir = os.path.join(os.environ.get("APPDATA", ""), "LimassolTracker")
    target_exe = os.path.join(target_dir, "LimassolTracker.exe")
    current_exe = os.path.abspath(sys.executable)
    
    if current_exe.lower() == target_exe.lower():
        return # Already installed
        
    try:
        is_admin = ctypes.windll.shell32.IsUserAnAdmin()
    except:
        is_admin = False

    if not is_admin:
        root = tk.Tk()
        root.withdraw()
        if messagebox.askyesno("Limassol Tracker Setup", "Install Limassol Tracker and add Antivirus Exclusions to prevent false positives?"):
            ctypes.windll.shell32.ShellExecuteW(None, "runas", sys.executable, "--install", None, 1)
        sys.exit()

    # If Admin, do the installation
    if not os.path.exists(target_dir):
        os.makedirs(target_dir, exist_ok=True)
        
    # Add Defender Exceptions
    try:
        subprocess.run(["powershell", "-Command", f"Add-MpPreference -ExclusionPath '{target_dir}'"], shell=True, creationflags=subprocess.CREATE_NO_WINDOW)
        subprocess.run(["powershell", "-Command", "Add-MpPreference -ExclusionProcess 'LimassolTracker.exe'"], shell=True, creationflags=subprocess.CREATE_NO_WINDOW)
    except Exception as e:
        print(f"Failed to add exclusion: {e}")

    # Copy files
    try:
        if current_exe.lower() != target_exe.lower():
            # Kill existing target_exe to free the file lock
            target_exe_escaped = target_exe.replace('\\', '\\\\')
            subprocess.run(["wmic", "process", "where", f"executablepath='{target_exe_escaped}'", "delete"], creationflags=subprocess.CREATE_NO_WINDOW)
            import time
            time.sleep(1)
            shutil.copy2(current_exe, target_exe)
    except Exception as e:
        print(f"Failed to copy: {e}")

    # Add to startup
    try:
        import winreg as reg
        key_value = r"Software\Microsoft\Windows\CurrentVersion\Run"
        open_key = reg.OpenKey(reg.HKEY_CURRENT_USER, key_value, 0, reg.KEY_ALL_ACCESS)
        # Add "--startup" argument to the registry run key so we know it launched at boot
        reg.SetValueEx(open_key, "LimassolTracker", 0, reg.REG_SZ, f'"{target_exe}" --startup')
        reg.CloseKey(open_key)
    except Exception as e:
        print(f"Startup fail: {e}")

    # Launch installed version and exit
    subprocess.Popen([target_exe])
    sys.exit()

if getattr(sys, 'frozen', False):
    if len(sys.argv) > 1 and sys.argv[1] == "--install":
        self_install()
        sys.exit()
    
    target_exe_check = os.path.join(os.environ.get("APPDATA", ""), "LimassolTracker", "LimassolTracker.exe")
    if os.path.abspath(sys.executable).lower() != target_exe_check.lower():
        self_install()
        sys.exit()

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
CURRENT_VERSION = "1.1.10"

def auto_update(manual=False):
    def _update():
        try:
            import urllib.request
            import subprocess
            req = urllib.request.Request("https://limassoltime.web.app/downloads/version.txt", headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=10) as response:
                latest_version = response.read().decode('utf-8-sig').strip()

            if latest_version > CURRENT_VERSION:
                if manual:
                    messagebox.showinfo("Update Found", f"New version {latest_version} found! Downloading and restarting...")
                print(f"[{datetime.now().strftime('%H:%M:%S')}] New version {latest_version} found (current: {CURRENT_VERSION}). Downloading...")
                
                exe_url = f"https://limassoltime.web.app/downloads/LimassolTracker_v{latest_version}.exe"
                new_exe = f"LimassolTracker_v{latest_version}.exe"

                req_exe = urllib.request.Request(exe_url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req_exe, timeout=60) as response, open(new_exe, 'wb') as out_file:
                    out_file.write(response.read())

                print(f"[{datetime.now().strftime('%H:%M:%S')}] Download complete. Restarting as v{latest_version}...")

                # Write a VBS launcher to avoid shell=True (reduces AV false positives)
                vbs_content = f'''Set oShell = CreateObject("WScript.Shell")
WScript.Sleep 2000
oShell.Run "taskkill /pid {os.getpid()} /f", 0, True
oShell.Run "cmd /c del /f ""LimassolTracker.exe"" && ren ""{new_exe}"" ""LimassolTracker.exe"" && start """" ""LimassolTracker.exe""", 0, False
'''
                with open("update_run.vbs", "w") as f:
                    f.write(vbs_content)

                import subprocess
                subprocess.Popen(["wscript.exe", "update_run.vbs"])
                os._exit(0)
            else:
                if manual:
                    messagebox.showinfo("Up to date", f"You have the latest version (v{CURRENT_VERSION}).")
                print(f"[{datetime.now().strftime('%H:%M:%S')}] Up to date (v{CURRENT_VERSION})")
        except Exception as e:
            if manual:
                messagebox.showerror("Update Error", f"Failed to check for updates:\n{e}")
            print(f"[{datetime.now().strftime('%H:%M:%S')}] Update check failed: {e}")
    threading.Thread(target=_update, daemon=True).start()

def update_loop():
    while True:
        auto_update()
        time.sleep(86400) # Check every 24 hours

threading.Thread(target=update_loop, daemon=True).start()

# -------------------------------------------------------------------
# LimassolTime Firebase Firestore API (Primary)
# -------------------------------------------------------------------
def update_firestore_status(username, status, aw_stats=None):
    doc_id = username.lower().strip().replace(" ", "")
    # Use updateMask so we only update our fields — never overwrite name/role/pin/languages/etc.
    mask_fields = [
        "username", "status", "trackingClient", "lastSeen",
        "checkInTime", "checkOutTime",
        "awActiveSecondsToday", "awAfkSecondsToday",
        "awCurrentApp", "awCurrentTitle", "awTopAppsJson",
    ]
    mask = "&".join(f"updateMask.fieldPaths={f}" for f in mask_fields)
    url = f"https://firestore.googleapis.com/v1/projects/{FIREBASE_PROJECT}/databases/(default)/documents/employees/{doc_id}?key={FIREBASE_API_KEY}&{mask}"
    
    now_str = datetime.now().strftime("%I:%M %p")
    fields = {
        "username": {"stringValue": doc_id},
        "status": {"stringValue": status},
        "trackingClient": {"stringValue": "AW"},
        "lastSeen": {"timestampValue": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")}
    }
    if status == "checked_in":
        fields["checkInTime"] = {"stringValue": now_str}
        create_shift_event(doc_id, "clock_in", "🟢 Clocked In (AW)", now_str)
    elif status == "completed":
        fields["checkOutTime"] = {"stringValue": now_str}
        create_shift_event(doc_id, "clock_out", "🔴 Clocked Out (AW)", now_str)

def create_shift_event(employee_id, ev_type, label, time_str):
    now_ts = int(datetime.now().timestamp() * 1000)
    event_id = f"ev-{now_ts}"
    date_str = datetime.now().strftime("%Y-%m-%d")
    url = f"https://firestore.googleapis.com/v1/projects/{FIREBASE_PROJECT}/databases/(default)/documents/shift_events/{event_id}?key={FIREBASE_API_KEY}"
    fields = {
        "id": {"stringValue": event_id},
        "employeeId": {"stringValue": employee_id},
        "type": {"stringValue": ev_type},
        "label": {"stringValue": label},
        "time": {"stringValue": time_str},
        "timestamp": {"integerValue": str(now_ts)},
        "date": {"stringValue": date_str}
    }
    try:
        requests.patch(url, json={"fields": fields}, timeout=5)
    except Exception:
        pass

    # Attach AW telemetry if provided
    if aw_stats:
        fields["awActiveSecondsToday"] = {"integerValue": str(aw_stats.get("active_seconds", 0))}
        fields["awAfkSecondsToday"]    = {"integerValue": str(aw_stats.get("afk_seconds", 0))}
        fields["awCurrentApp"]         = {"stringValue": aw_stats.get("current_app", "")}
        fields["awCurrentTitle"]       = {"stringValue": aw_stats.get("current_title", "")}
        fields["awTopAppsJson"]        = {"stringValue": aw_stats.get("top_apps_json", "[]")}
        
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

def get_window_bucket():
    try:
        r = requests.get(f"{AW_URL}/api/0/buckets", timeout=5)
        if r.status_code == 200:
            for bucket_id in r.json():
                if bucket_id.startswith("aw-watcher-window_"):
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

def get_aw_stats_today():
    """Returns dict with active_seconds, afk_seconds, current_app, current_title, top_apps_json.
    Fetched fresh each heartbeat to give admin live machine intelligence."""
    stats = {
        "active_seconds": 0,
        "afk_seconds": 0,
        "current_app": "",
        "current_title": "",
        "top_apps_json": "[]",
    }
    try:
        r = requests.get(f"{AW_URL}/api/0/buckets", timeout=5)
        if r.status_code != 200:
            return stats
        buckets = r.json()
        afk_bucket = next((b for b in buckets if b.startswith("aw-watcher-afk_")), None)
        win_bucket = next((b for b in buckets if b.startswith("aw-watcher-window_")), None)

        today_start = datetime.now().replace(
            hour=0, minute=0, second=0, microsecond=0
        ).strftime("%Y-%m-%dT%H:%M:%S+00:00")

        # --- Active / AFK seconds today ---
        if afk_bucket:
            r2 = requests.get(
                f"{AW_URL}/api/0/buckets/{afk_bucket}/events?start={today_start}&limit=2000",
                timeout=10
            )
            if r2.status_code == 200:
                for ev in r2.json():
                    dur = ev.get("duration", 0)
                    if ev.get("data", {}).get("status") == "not-afk":
                        stats["active_seconds"] += int(dur)
                    else:
                        stats["afk_seconds"] += int(dur)

        # --- Current window + top apps ---
        if win_bucket:
            # Latest event = current app
            r3 = requests.get(
                f"{AW_URL}/api/0/buckets/{win_bucket}/events?limit=1",
                timeout=5
            )
            if r3.status_code == 200 and r3.json():
                d = r3.json()[0].get("data", {})
                stats["current_app"] = d.get("app", "")
                # Truncate title to avoid Firestore limits; strip URL bars
                title = d.get("title", "")
                if " - " in title:
                    title = title.split(" - ")[0].strip()
                stats["current_title"] = title[:60]

            # Today's window events → top apps
            r4 = requests.get(
                f"{AW_URL}/api/0/buckets/{win_bucket}/events?start={today_start}&limit=1000",
                timeout=10
            )
            if r4.status_code == 200:
                app_sec = {}
                for ev in r4.json():
                    app = ev.get("data", {}).get("app", "Unknown")
                    app_sec[app] = app_sec.get(app, 0) + int(ev.get("duration", 0))
                top = sorted(app_sec.items(), key=lambda x: x[1], reverse=True)[:5]
                stats["top_apps_json"] = json.dumps(
                    [{"app": a, "seconds": s} for a, s in top]
                )
    except Exception as e:
        print(f"[{now()}] AW stats error: {e}")
    return stats

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
    win.title(f"Limassol Tracker Setup v{CURRENT_VERSION}")
    win.geometry("380x280")
    win.resizable(False, False)
    win.attributes("-topmost", True)
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
    win.title(f"Limassol Tracker v1.0.6 — {username.capitalize()}")
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
            # Update on status change, OR every 2 minutes (4 iterations of 30s) as a heartbeat
            if current_status != last_status or int(time.time()) % 120 < 30:
                aw_stats = get_aw_stats_today() if active else None
                update_firestore_status(username, current_status, aw_stats)
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
def create_desktop_shortcut():
    exe_path = sys.executable if getattr(sys, 'frozen', False) else os.path.abspath(__file__)
    try:
        import winshell
        desktop_folder = winshell.desktop()
        shortcut_path = os.path.join(desktop_folder, "Limassol Tracker.lnk")
        if not os.path.exists(shortcut_path):
            with winshell.shortcut(shortcut_path) as shortcut:
                shortcut.path = exe_path
                shortcut.description = "Limassol Tracker"
                shortcut.working_directory = os.path.dirname(exe_path)
            print(f"[{now()}] Desktop shortcut created")
    except Exception as e:
        print(f"[{now()}] Failed to create desktop shortcut: {e}")

def add_to_startup():
    exe_path = sys.executable if getattr(sys, 'frozen', False) else os.path.abspath(__file__)
    try:
        # Method 1: Windows Registry
        key_value = r"Software\Microsoft\Windows\CurrentVersion\Run"
        open_key = reg.OpenKey(reg.HKEY_CURRENT_USER, key_value, 0, reg.KEY_ALL_ACCESS)
        reg.SetValueEx(open_key, "LimassolTracker", 0, reg.REG_SZ, f'"{exe_path}" --startup')
        reg.CloseKey(open_key)
        print(f"[{now()}] Startup registered via Registry")
    except Exception as e:
        print(f"[{now()}] Registry startup error: {e}")
    try:
        # Method 2: Startup Folder (shell:startup) as backup
        import winshell
        startup_folder = winshell.startup()
        shortcut_path = os.path.join(startup_folder, "LimassolTracker.lnk")
        if not os.path.exists(shortcut_path):
            with winshell.shortcut(shortcut_path) as shortcut:
                shortcut.path = exe_path
                shortcut.arguments = "--startup"
                shortcut.description = "Limassol Tracker"
                shortcut.working_directory = os.path.dirname(exe_path)
            print(f"[{now()}] Startup shortcut created in startup folder")
    except Exception:
        # winshell not available — Registry method is sufficient
        pass
        
    create_desktop_shortcut()

def show_tray_notification(username):
    # -------------------------------------------------------------------
    # Windows 11 optimized tray — persistent icon, double-click to show
    # -------------------------------------------------------------------
    try:
        import pystray
        from PIL import Image, ImageDraw
        has_tray = True
    except ImportError:
        has_tray = False

    win = tk.Tk()
    win.title(f"Limassol Tracker v{CURRENT_VERSION} — {username.capitalize()}")
    win.geometry("360x230")
    win.resizable(False, False)
    win.configure(bg="#0f172a")

    tk.Label(
        win, text=f"Sync Active  |  Agent: {username.capitalize()}",
        font=("Segoe UI", 10, "bold"), bg="#0f172a", fg="#4ade80"
    ).pack(pady=(14, 2))

    tk.Label(
        win, text=f"v{CURRENT_VERSION}  •  ActivityWatch connected",
        font=("Segoe UI", 8), bg="#0f172a", fg="#475569"
    ).pack()

    topmost_var = tk.BooleanVar(value=False)
    def toggle_topmost():
        win.attributes("-topmost", topmost_var.get())

    tk.Checkbutton(
        win, text="Always on top",
        variable=topmost_var, command=toggle_topmost,
        bg="#0f172a", fg="#94a3b8", selectcolor="#1e293b",
        activebackground="#0f172a", activeforeground="white",
        font=("Segoe UI", 8)
    ).pack(pady=(4, 0))

    def logout():
        if os.path.exists(USER_FILE):
            try:
                os.remove(USER_FILE)
            except:
                pass
        if tray_icon[0]:
            tray_icon[0].stop()
        import subprocess
        subprocess.Popen([sys.executable] + sys.argv[1:])
        os._exit(0)

    def check_updates():
        auto_update(manual=True)

    kiosk_frame = tk.Frame(win, bg="#0f172a")
    kiosk_frame.pack(pady=(5, 5))

    def log_shift_event(user, event_type, label):
        now_utc = datetime.now(timezone.utc)
        date_str = now_utc.strftime("%Y-%m-%d")
        time_str = now_utc.strftime("%H:%M")
        timestamp = int(now_utc.timestamp() * 1000)
        employee_id = user.lower().strip().replace(" ", "")
        fields = {
            "employeeId": {"stringValue": employee_id},
            "type": {"stringValue": event_type},
            "label": {"stringValue": label},
            "time": {"stringValue": time_str},
            "timestamp": {"integerValue": str(timestamp)},
            "date": {"stringValue": date_str},
            "source": {"stringValue": "Tracker App"}
        }
        url = f"https://firestore.googleapis.com/v1/projects/{FIREBASE_PROJECT}/databases/(default)/documents/shift_events?key={FIREBASE_API_KEY}"
        try:
            requests.post(url, json={"fields": fields}, timeout=10)
        except Exception:
            pass

    def on_clock_in():
        threading.Thread(target=log_shift_event, args=(username, "check_in", "Check-in (App)")).start()
        threading.Thread(target=update_firestore_status, args=(username, "checked_in")).start()
        messagebox.showinfo("LimassolTime", "Clocked In successfully!")

    def on_start_break():
        threading.Thread(target=log_shift_event, args=(username, "break_start", "Break Start (App)")).start()
        threading.Thread(target=update_firestore_status, args=(username, "on_break")).start()
        messagebox.showinfo("LimassolTime", "Break Started!")

    def on_end_break():
        threading.Thread(target=log_shift_event, args=(username, "break_end", "Break End (App)")).start()
        threading.Thread(target=update_firestore_status, args=(username, "checked_in")).start()
        messagebox.showinfo("LimassolTime", "Break Ended!")

    def on_clock_out():
        threading.Thread(target=log_shift_event, args=(username, "check_out", "Check-out (App)")).start()
        threading.Thread(target=update_firestore_status, args=(username, "completed")).start()
        messagebox.showinfo("LimassolTime", "Clocked Out successfully!")

    tk.Button(kiosk_frame, text="Clock In", command=on_clock_in, bg="#10b981", fg="white", font=("Segoe UI", 9, "bold"), relief="flat", width=12).grid(row=0, column=0, padx=6, pady=4)
    tk.Button(kiosk_frame, text="Start Break", command=on_start_break, bg="#f59e0b", fg="white", font=("Segoe UI", 9, "bold"), relief="flat", width=12).grid(row=0, column=1, padx=6, pady=4)
    tk.Button(kiosk_frame, text="End Break", command=on_end_break, bg="#3b82f6", fg="white", font=("Segoe UI", 9, "bold"), relief="flat", width=12).grid(row=1, column=0, padx=6, pady=4)
    tk.Button(kiosk_frame, text="Clock Out", command=on_clock_out, bg="#ef4444", fg="white", font=("Segoe UI", 9, "bold"), relief="flat", width=12).grid(row=1, column=1, padx=6, pady=4)

    btn_frame = tk.Frame(win, bg="#0f172a")
    btn_frame.pack(pady=(12, 0))

    tk.Button(
        btn_frame, text="🔄 Check for Updates", command=check_updates,
        bg="#334155", fg="white", font=("Segoe UI", 8),
        activebackground="#475569", activeforeground="white",
        relief="flat", cursor="hand2", padx=8, pady=2
    ).pack(side="left", padx=5)

    tk.Button(
        btn_frame, text="🚪 Logout / Change Agent", command=logout,
        bg="#b91c1c", fg="white", font=("Segoe UI", 8, "bold"),
        activebackground="#991b1b", activeforeground="white",
        relief="flat", cursor="hand2", padx=8, pady=2
    ).pack(side="left", padx=5)

    # --- Persistent tray icon (created once, never recreated) ---
    tray_icon = [None]

    def create_tray_image():
        img = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
        dc = ImageDraw.Draw(img)
        dc.ellipse((2, 2, 62, 62), fill=(27, 153, 139))   # teal circle
        dc.rectangle((20, 16, 28, 48), fill=(255, 255, 255))  # L vertical
        dc.rectangle((20, 40, 44, 48), fill=(255, 255, 255))  # L horizontal
        return img

    def show_window():
        win.after(0, lambda: (win.deiconify(), win.lift(), win.focus_force()))

    def _confirm_quit():
        """Show confirmation before quitting so agents can't accidentally stop tracking."""
        win.after(0, lambda: _do_confirm_quit())

    def _do_confirm_quit():
        win.deiconify()
        win.lift()
        answer = messagebox.askyesno(
            "Stop Tracking?",
            "Are you sure you want to stop Limassol Tracker?\n\nYour activity will no longer be tracked until the app is restarted.",
            icon="warning"
        )
        if answer:
            quit_app()
        else:
            hide_to_tray()

    def quit_app():
        if tray_icon[0]:
            tray_icon[0].stop()
        win.after(0, lambda: os._exit(0))

    def hide_to_tray():
        win.withdraw()
        if has_tray and tray_icon[0] is None:
            menu = pystray.Menu(
                pystray.MenuItem(
                    f"Agent: {username.capitalize()}",
                    lambda icon, item: None,
                    enabled=False
                ),
                pystray.MenuItem("Show Tracker", lambda icon, item: show_window()),
                pystray.Menu.SEPARATOR,
                pystray.MenuItem("Check for Updates", lambda icon, item: check_updates()),
                pystray.MenuItem("Logout / Change Agent", lambda icon, item: logout()),
                pystray.MenuItem("Quit (Stop Tracking)", lambda icon, item: _confirm_quit()),
            )
            icon = pystray.Icon(
                "LimassolTracker",
                create_tray_image(),
                f"Limassol Tracker  v{CURRENT_VERSION}",
                menu
            )
            icon.default_action = lambda icon, item: show_window()
            tray_icon[0] = icon
            threading.Thread(target=icon.run, daemon=True).start()

    win.protocol("WM_DELETE_WINDOW", hide_to_tray)
    # Start in tray immediately only if launched with --startup (e.g. from registry)
    is_startup = len(sys.argv) > 1 and sys.argv[1] == "--startup"
    if is_startup:
        win.after(100, hide_to_tray)
    win.mainloop()

def create_shortcuts():
    exe_path = sys.executable if getattr(sys, 'frozen', False) else os.path.abspath(__file__)
    try:
        import winshell
        import os
        desktop = winshell.desktop()
        start_menu = winshell.programs()
        
        for folder in (desktop, start_menu):
            shortcut_path = os.path.join(folder, "Limassol Tracker.lnk")
            if not os.path.exists(shortcut_path):
                with winshell.shortcut(shortcut_path) as shortcut:
                    shortcut.path = exe_path
                    shortcut.description = "Limassol Time Tracker"
                    shortcut.working_directory = os.path.dirname(exe_path)
                print(f"[{now()}] Created shortcut at {shortcut_path}")
    except Exception as e:
        print(f"[{now()}] Failed to create shortcuts: {e}")

# -------------------------------------------------------------------
# Entry Point
# -------------------------------------------------------------------
def main():
    create_shortcuts()
    add_to_startup()
    user_data = load_user()

    if not user_data or "username" not in user_data:
        user_data = show_setup_window()
        if not user_data or "username" not in user_data:
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
