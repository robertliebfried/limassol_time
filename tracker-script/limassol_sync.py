"""
Limassol Tracker v1.2.0
Production-Grade Windows 24/7 ActivityWatch & Time Sync Client
"""

import time
import json
import os
import sys
import socket
import threading
import tkinter as tk
from tkinter import ttk, messagebox
import requests
from datetime import datetime, timezone
import winreg as reg
import ctypes
import subprocess

try:
    import pystray
    from PIL import Image, ImageDraw
    HAS_TRAY = True
except ImportError:
    HAS_TRAY = False

# -------------------------------------------------------------------
# SINGLE INSTANCE MUTEX (PREVENTS DUPLICATE PROCESSES / TRAY ICONS)
# -------------------------------------------------------------------
MUTEX_HANDLE = None

def acquire_single_instance_mutex():
    global MUTEX_HANDLE
    mutex_name = "Global\\LimassolTracker_SingleInstance_Mutex_v120"
    kernel32 = ctypes.windll.kernel32
    MUTEX_HANDLE = kernel32.CreateMutexW(None, False, mutex_name)
    last_error = kernel32.GetLastError()
    ERROR_ALREADY_EXISTS = 183
    if last_error == ERROR_ALREADY_EXISTS:
        # Another instance is already running on this PC
        sys.exit(0)

acquire_single_instance_mutex()

# -------------------------------------------------------------------
# CONFIGURATION & PERSISTENT PATHS
# -------------------------------------------------------------------
CURRENT_VERSION = "1.2.2"
FIREBASE_API_KEY = "AIzaSyBOQaJrFF6opjdymkh2fd4nmEw4A6r3tOY"
FIREBASE_PROJECT = "karfigestsa"
CLOCKIFY_API_KEY = "ZWVlYjQ1ZDMtODMzNS00NWZmLTg2NjAtYmMxZDQ0MWM1NzQ5"
AW_URL = "http://127.0.0.1:5600"
CHECK_INTERVAL = 30  # seconds

APP_DATA_DIR = os.path.join(os.environ.get("APPDATA", ""), "LimassolTracker")
if not os.path.exists(APP_DATA_DIR):
    try:
        os.makedirs(APP_DATA_DIR, exist_ok=True)
    except Exception:
        pass

USER_FILE = os.path.join(APP_DATA_DIR, "selected_user.json")

def get_machine_hostname():
    try:
        name = socket.gethostname().lower().strip()
        cleaned = "".join(c for c in name if c.isalnum() or c in ("-", "_"))
        return cleaned or "station"
    except Exception:
        return "station"

HOSTNAME = get_machine_hostname()

# -------------------------------------------------------------------
# CLEAN STARTUP & SHORTCUTS (NEVER DUPLICATE)
# -------------------------------------------------------------------
def configure_clean_startup():
    exe_path = sys.executable if getattr(sys, 'frozen', False) else os.path.abspath(__file__)
    
    # 1. Register only in Windows Registry Run key
    try:
        key_value = r"Software\Microsoft\Windows\CurrentVersion\Run"
        open_key = reg.OpenKey(reg.HKEY_CURRENT_USER, key_value, 0, reg.KEY_ALL_ACCESS)
        reg.SetValueEx(open_key, "LimassolTracker", 0, reg.REG_SZ, f'"{exe_path}" --startup')
        reg.CloseKey(open_key)
    except Exception as e:
        print(f"Registry startup error: {e}")

    # 2. Clean up any leftover duplicate shortcuts in shell:startup to avoid launching twice
    try:
        startup_dir = os.path.join(os.environ.get("APPDATA", ""), r"Microsoft\Windows\Start Menu\Programs\Startup")
        legacy_lnk = os.path.join(startup_dir, "LimassolTracker.lnk")
        if os.path.exists(legacy_lnk):
            os.remove(legacy_lnk)
    except Exception:
        pass

    # 3. Create desktop shortcut if missing
    try:
        import winshell
        desktop = winshell.desktop()
        shortcut_path = os.path.join(desktop, "Limassol Tracker.lnk")
        if not os.path.exists(shortcut_path):
            with winshell.shortcut(shortcut_path) as shortcut:
                shortcut.path = exe_path
                shortcut.description = "Limassol Tracker"
                shortcut.working_directory = os.path.dirname(exe_path)
    except Exception:
        pass

# -------------------------------------------------------------------
# SELF-INSTALLER (RUNS ONCE IF LAUNCHED OUTSIDE APPDATA)
# -------------------------------------------------------------------
def self_install():
    target_dir = APP_DATA_DIR
    target_exe = os.path.join(target_dir, "LimassolTracker.exe")
    current_exe = os.path.abspath(sys.executable)

    if current_exe.lower() == target_exe.lower():
        return  # Already installed in target directory

    try:
        is_admin = ctypes.windll.shell32.IsUserAnAdmin()
    except Exception:
        is_admin = False

    if not is_admin:
        try:
            ctypes.windll.shell32.ShellExecuteW(None, "runas", sys.executable, "--install", None, 1)
        except Exception:
            pass
        sys.exit(0)

    try:
        os.makedirs(target_dir, exist_ok=True)
        # Add Defender exceptions
        subprocess.run(["powershell", "-Command", f"Add-MpPreference -ExclusionPath '{target_dir}'"], shell=True, creationflags=subprocess.CREATE_NO_WINDOW)
        subprocess.run(["powershell", "-Command", "Add-MpPreference -ExclusionProcess 'LimassolTracker.exe'"], shell=True, creationflags=subprocess.CREATE_NO_WINDOW)
        
        # Kill old process lock if any and copy
        target_exe_escaped = target_exe.replace('\\', '\\\\')
        subprocess.run(["wmic", "process", "where", f"executablepath='{target_exe_escaped}'", "delete"], creationflags=subprocess.CREATE_NO_WINDOW)
        time.sleep(1)
        import shutil
        shutil.copy2(current_exe, target_exe)
        
        configure_clean_startup()
        subprocess.Popen([target_exe])
        sys.exit(0)
    except Exception as e:
        print(f"Self-install error: {e}")

if getattr(sys, 'frozen', False):
    if len(sys.argv) > 1 and sys.argv[1] == "--install":
        self_install()
        sys.exit(0)
    target_check = os.path.join(APP_DATA_DIR, "LimassolTracker.exe")
    if os.path.abspath(sys.executable).lower() != target_check.lower():
        self_install()
        sys.exit(0)

# -------------------------------------------------------------------
# BULLETPROOF AUTO-UPDATE
# -------------------------------------------------------------------
def parse_version_tuple(v_str):
    try:
        clean = str(v_str).lower().replace('v', '').strip()
        parts = [int(p) for p in clean.split('.') if p.isdigit()]
        while len(parts) < 3:
            parts.append(0)
        return tuple(parts)
    except Exception:
        return (0, 0, 0)

def auto_update(manual=False):
    def _update():
        try:
            import urllib.request
            req = urllib.request.Request("https://limassoltime.web.app/downloads/version.txt", headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req, timeout=10) as response:
                latest_version = response.read().decode('utf-8-sig').strip()

            cur_v = parse_version_tuple(CURRENT_VERSION)
            lat_v = parse_version_tuple(latest_version)

            if lat_v > cur_v:
                if manual:
                    messagebox.showinfo("Update Found", f"New version v{latest_version} found!\nDownloading and installing update automatically...")
                print(f"[{now()}] New version {latest_version} found (current: {CURRENT_VERSION}). Downloading...")
                
                target_dir = APP_DATA_DIR if os.path.exists(APP_DATA_DIR) else os.path.dirname(os.path.abspath(sys.executable))
                target_exe = os.path.join(target_dir, "LimassolTracker.exe")
                new_exe_path = os.path.join(target_dir, f"LimassolTracker_v{latest_version}.exe")

                exe_url = f"https://limassoltime.web.app/downloads/LimassolTracker_v{latest_version}.exe"
                req_exe = urllib.request.Request(exe_url, headers={'User-Agent': 'Mozilla/5.0'})
                with urllib.request.urlopen(req_exe, timeout=90) as response, open(new_exe_path, 'wb') as out_file:
                    while True:
                        chunk = response.read(65536)
                        if not chunk:
                            break
                        out_file.write(chunk)

                if os.path.exists(new_exe_path) and os.path.getsize(new_exe_path) > 1000000:
                    print(f"[{now()}] Download complete ({os.path.getsize(new_exe_path)} bytes). Upgrading...")

                    bat_path = os.path.join(target_dir, "updater.bat")
                    bat_content = f'''@echo off
setlocal
set RETRY=0
:loop
timeout /t 1 /nobreak >nul
taskkill /pid {os.getpid()} /f >nul 2>&1
move /y "{new_exe_path}" "{target_exe}" >nul 2>&1
if not exist "{new_exe_path}" (
    start "" "{target_exe}"
    (goto) 2>nul & del "%~f0"
    exit
)
set /a RETRY+=1
if %RETRY% lss 12 goto loop
start "" "{target_exe}"
(goto) 2>nul & del "%~f0"
exit
'''
                    with open(bat_path, "w", encoding="utf-8") as f:
                        f.write(bat_content)

                    subprocess.Popen(["cmd.exe", "/c", bat_path], cwd=target_dir, creationflags=subprocess.CREATE_NO_WINDOW)
                    os._exit(0)
                else:
                    raise Exception("Downloaded file is incomplete.")
            else:
                if manual:
                    messagebox.showinfo("Up to date", f"You have the latest version (v{CURRENT_VERSION}).")
                print(f"[{now()}] Up to date (v{CURRENT_VERSION})")
        except Exception as e:
            if manual:
                messagebox.showerror("Update Error", f"Failed to check for updates:\n{e}")
            print(f"[{now()}] Update check failed: {e}")
    threading.Thread(target=_update, daemon=True).start()

def update_loop():
    while True:
        auto_update(manual=False)
        time.sleep(300)  # Check every 5 minutes

threading.Thread(target=update_loop, daemon=True).start()

# -------------------------------------------------------------------
# USER CREDENTIAL STORAGE & HELPERS
# -------------------------------------------------------------------
def now():
    return datetime.now().strftime("%H:%M:%S")

def load_user():
    if os.path.exists(USER_FILE):
        try:
            with open(USER_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                if data and "username" in data and data["username"]:
                    return data
        except Exception:
            pass
    return None

def save_user(username, pin):
    try:
        with open(USER_FILE, "w", encoding="utf-8") as f:
            json.dump({
                "username": username.strip().lower(),
                "pin": pin.strip()
            }, f)
    except Exception as e:
        print(f"Failed to save user: {e}")

def clear_user():
    if os.path.exists(USER_FILE):
        try:
            os.remove(USER_FILE)
        except Exception:
            pass

# -------------------------------------------------------------------
# ACTIVITYWATCH API INTEGRATION
# -------------------------------------------------------------------
def get_afk_bucket():
    try:
        r = requests.get(f"{AW_URL}/api/0/buckets", timeout=3)
        if r.status_code == 200:
            for b in r.json():
                if b.startswith("aw-watcher-afk_"):
                    return b
    except Exception:
        pass
    return None

def is_active(bucket_id):
    if not bucket_id:
        return False
    try:
        r = requests.get(f"{AW_URL}/api/0/buckets/{bucket_id}/events?limit=1", timeout=3)
        if r.status_code == 200 and r.json():
            return r.json()[0].get("data", {}).get("status") == "not-afk"
    except Exception:
        pass
    return False

def get_aw_stats_today():
    stats = {
        "active_seconds": 0,
        "afk_seconds": 0,
        "current_app": "",
        "current_title": "",
        "top_apps_json": "[]"
    }
    try:
        r = requests.get(f"{AW_URL}/api/0/buckets", timeout=3)
        if r.status_code != 200:
            return stats
        buckets = r.json()
        afk_bucket = next((b for b in buckets if b.startswith("aw-watcher-afk_")), None)
        win_bucket = next((b for b in buckets if b.startswith("aw-watcher-window_")), None)

        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0).strftime("%Y-%m-%dT%H:%M:%SZ")

        if afk_bucket:
            r2 = requests.get(f"{AW_URL}/api/0/buckets/{afk_bucket}/events", params={"start": today_start, "limit": 2000}, timeout=5)
            if r2.status_code == 200:
                for ev in r2.json():
                    dur = ev.get("duration", 0)
                    if ev.get("data", {}).get("status") == "not-afk":
                        stats["active_seconds"] += int(dur)
                    else:
                        stats["afk_seconds"] += int(dur)

        if win_bucket:
            r3 = requests.get(f"{AW_URL}/api/0/buckets/{win_bucket}/events?limit=1", timeout=3)
            if r3.status_code == 200 and r3.json():
                d = r3.json()[0].get("data", {})
                stats["current_app"] = d.get("app", "")
                title = d.get("title", "")
                if " - " in title:
                    title = title.split(" - ")[0].strip()
                stats["current_title"] = title[:60]

            r4 = requests.get(f"{AW_URL}/api/0/buckets/{win_bucket}/events", params={"start": today_start, "limit": 1000}, timeout=5)
            if r4.status_code == 200:
                app_sec = {}
                for ev in r4.json():
                    app = ev.get("data", {}).get("app", "Unknown")
                    app_sec[app] = app_sec.get(app, 0) + int(ev.get("duration", 0))
                top = sorted(app_sec.items(), key=lambda x: x[1], reverse=True)[:5]
                stats["top_apps_json"] = json.dumps([{"app": a, "seconds": s} for a, s in top])
    except Exception as e:
        print(f"[{now()}] AW stats error: {e}")
    return stats

# -------------------------------------------------------------------
# FIRESTORE TELEMETRY & EVENT LOGGING
# -------------------------------------------------------------------
def update_firestore_status(username, status, aw_stats=None, is_station=False):
    doc_id = username.lower().strip().replace(" ", "")
    mask_fields = [
        "username", "status", "trackingClient", "lastSeen",
        "awActiveSecondsToday", "awAfkSecondsToday",
        "awCurrentApp", "awCurrentTitle", "awTopAppsJson",
    ]
    if not is_station:
        mask_fields.extend(["checkInTime", "checkOutTime"])
    else:
        mask_fields.extend(["hostname", "isStation"])

    mask = "&".join(f"updateMask.fieldPaths={f}" for f in mask_fields)
    collection_name = "stations" if is_station else "employees"
    url = f"https://firestore.googleapis.com/v1/projects/{FIREBASE_PROJECT}/databases/(default)/documents/{collection_name}/{doc_id}?key={FIREBASE_API_KEY}&{mask}"
    
    now_str = datetime.now().strftime("%I:%M %p")
    fields = {
        "username": {"stringValue": doc_id},
        "status": {"stringValue": status},
        "trackingClient": {"stringValue": "AW"},
        "lastSeen": {"timestampValue": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")}
    }

    if is_station:
        fields["hostname"] = {"stringValue": HOSTNAME}
        fields["isStation"] = {"booleanValue": True}
    else:
        if status == "checked_in":
            fields["checkInTime"] = {"stringValue": now_str}
            create_shift_event(doc_id, "clock_in", "🟢 Clocked In (AW)", now_str)
        elif status == "completed":
            fields["checkOutTime"] = {"stringValue": now_str}
            create_shift_event(doc_id, "clock_out", "🔴 Clocked Out (AW)", now_str)

    if aw_stats:
        fields["awActiveSecondsToday"] = {"integerValue": str(aw_stats.get("active_seconds", 0))}
        fields["awAfkSecondsToday"]    = {"integerValue": str(aw_stats.get("afk_seconds", 0))}
        fields["awCurrentApp"]         = {"stringValue": aw_stats.get("current_app", "")}
        fields["awCurrentTitle"]       = {"stringValue": aw_stats.get("current_title", "")}
        fields["awTopAppsJson"]        = {"stringValue": aw_stats.get("top_apps_json", "[]")}
        
    try:
        requests.patch(url, json={"fields": fields}, timeout=8)
    except Exception as e:
        print(f"[{now()}] Firestore status error: {e}")

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

# -------------------------------------------------------------------
# CLOCKIFY BACKUP SYNC
# -------------------------------------------------------------------
def get_workspace():
    try:
        headers = {"X-Api-Key": CLOCKIFY_API_KEY}
        r = requests.get("https://api.clockify.me/api/v1/workspaces", headers=headers, timeout=5)
        if r.status_code == 200 and r.json():
            return r.json()[0]["id"]
    except Exception:
        pass
    return None

def get_running_timer(workspace_id, username):
    try:
        headers = {"X-Api-Key": CLOCKIFY_API_KEY}
        r = requests.get(f"https://api.clockify.me/api/v1/workspaces/{workspace_id}/user/{username}/time-entries?in-progress=true", headers=headers, timeout=5)
        if r.status_code == 200 and r.json():
            return r.json()[0]["id"]
    except Exception:
        pass
    return None

def start_timer(workspace_id):
    try:
        headers = {"X-Api-Key": CLOCKIFY_API_KEY, "Content-Type": "application/json"}
        payload = {"start": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "description": "LimassolTime Auto-Tracking"}
        requests.post(f"https://api.clockify.me/api/v1/workspaces/{workspace_id}/time-entries", json=payload, headers=headers, timeout=5)
    except Exception:
        pass

def stop_timer(workspace_id, username):
    try:
        headers = {"X-Api-Key": CLOCKIFY_API_KEY, "Content-Type": "application/json"}
        payload = {"end": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")}
        requests.patch(f"https://api.clockify.me/api/v1/workspaces/{workspace_id}/user/{username}/time-entries", json=payload, headers=headers, timeout=5)
    except Exception:
        pass

# -------------------------------------------------------------------
# APPLICATION CONTROLLER & UNIFIED GUI
# -------------------------------------------------------------------
class LimassolTrackerApp:
    def __init__(self):
        configure_clean_startup()
        
        self.is_startup = ("--startup" in sys.argv) or ("-silent" in sys.argv)
        self.current_user = load_user()
        
        # Tkinter Root (Window will be hidden when in tray)
        self.root = tk.Tk()
        self.root.title(f"Limassol Tracker v{CURRENT_VERSION}")
        self.root.geometry("600x450")
        self.root.resizable(False, False)
        self.root.configure(bg="#0f172a")
        
        # Withdraw immediately if starting up silently
        if self.is_startup:
            self.root.withdraw()
            
        self.tray_icon = None
        self.active_sync = True
        self.workspace_id = None
        
        # Build UI layout
        self.build_ui()
        
        # Start persistent tray icon
        self.init_tray()
        
        # Start background sync thread
        self.sync_thread = threading.Thread(target=self.run_sync_loop, daemon=True)
        self.sync_thread.start()

        # If not silent and no user logged in, present login dialog smoothly
        if not self.is_startup and not self.current_user:
            self.show_login_dialog()
        elif not self.is_startup and self.current_user:
            self.show_main_window()

    def create_tray_image(self):
        img = Image.new('RGBA', (64, 64), (0, 0, 0, 0))
        dc = ImageDraw.Draw(img)
        # Glowing cyan / emerald circle
        dc.ellipse((2, 2, 62, 62), fill=(16, 185, 129))
        dc.rectangle((20, 16, 28, 48), fill=(255, 255, 255))
        dc.rectangle((20, 40, 44, 48), fill=(255, 255, 255))
        return img

    def init_tray(self):
        if not HAS_TRAY:
            return

        def get_menu():
            user_label = f"👤 Agent: {self.current_user['username'].capitalize()}" if self.current_user else f"🏢 Station: {HOSTNAME} (Unassigned)"
            items = [
                pystray.MenuItem(user_label, lambda icon, item: None, enabled=False),
                pystray.MenuItem("Show Tracker", lambda icon, item: self.show_main_window()),
                pystray.Menu.SEPARATOR,
                pystray.MenuItem("🔄 Check for Updates", lambda icon, item: auto_update(manual=True)),
            ]
            if self.current_user:
                items.append(pystray.MenuItem("🚪 Logout / Switch Agent", lambda icon, item: self.logout()))
            else:
                items.append(pystray.MenuItem("🔑 Login Agent", lambda icon, item: self.show_login_dialog()))
                
            items.append(pystray.MenuItem("❌ Quit (Stop Tracking)", lambda icon, item: self.confirm_quit()))
            return pystray.Menu(*items)

        self.tray_icon = pystray.Icon(
            "LimassolTracker",
            self.create_tray_image(),
            f"Limassol Tracker v{CURRENT_VERSION}",
            get_menu()
        )
        self.tray_icon.default_action = lambda icon, item: self.show_main_window()
        threading.Thread(target=self.tray_icon.run, daemon=True).start()

    def update_tray_menu(self):
        if self.tray_icon:
            try:
                user_label = f"👤 Agent: {self.current_user['username'].capitalize()}" if self.current_user else f"🏢 Station: {HOSTNAME} (Unassigned)"
                items = [
                    pystray.MenuItem(user_label, lambda icon, item: None, enabled=False),
                    pystray.MenuItem("Show Tracker", lambda icon, item: self.show_main_window()),
                    pystray.Menu.SEPARATOR,
                    pystray.MenuItem("🔄 Check for Updates", lambda icon, item: auto_update(manual=True)),
                ]
                if self.current_user:
                    items.append(pystray.MenuItem("🚪 Logout / Switch Agent", lambda icon, item: self.logout()))
                else:
                    items.append(pystray.MenuItem("🔑 Login Agent", lambda icon, item: self.show_login_dialog()))
                    
                items.append(pystray.MenuItem("❌ Quit (Stop Tracking)", lambda icon, item: self.confirm_quit()))
                self.tray_icon.menu = pystray.Menu(*items)
            except Exception:
                pass

    def build_ui(self):
        self.main_frame = tk.Frame(self.root, bg="#0f172a")
        self.main_frame.pack(fill="both", expand=True)

        self.status_label = tk.Label(
            self.main_frame, text="Sync Active",
            font=("Segoe UI", 16, "bold"), bg="#0f172a", fg="#4ade80"
        )
        self.status_label.pack(pady=(20, 5))

        self.info_label = tk.Label(
            self.main_frame, text=f"v{CURRENT_VERSION} • ActivityWatch 24/7",
            font=("Segoe UI", 10), bg="#0f172a", fg="#94a3b8"
        )
        self.info_label.pack()

        # Kiosk shift controls
        self.kiosk_frame = tk.Frame(self.main_frame, bg="#0f172a")
        self.kiosk_frame.pack(pady=30)

        tk.Button(self.kiosk_frame, text="Clock In", command=self.on_clock_in, bg="#10b981", fg="white", font=("Segoe UI", 14, "bold"), relief="flat", width=15, height=2, cursor="hand2").grid(row=0, column=0, padx=10, pady=10)
        tk.Button(self.kiosk_frame, text="Start Break", command=self.on_start_break, bg="#f59e0b", fg="white", font=("Segoe UI", 14, "bold"), relief="flat", width=15, height=2, cursor="hand2").grid(row=0, column=1, padx=10, pady=10)
        tk.Button(self.kiosk_frame, text="End Break", command=self.on_end_break, bg="#3b82f6", fg="white", font=("Segoe UI", 14, "bold"), relief="flat", width=15, height=2, cursor="hand2").grid(row=1, column=0, padx=10, pady=10)
        tk.Button(self.kiosk_frame, text="Clock Out", command=self.on_clock_out, bg="#ef4444", fg="white", font=("Segoe UI", 14, "bold"), relief="flat", width=15, height=2, cursor="hand2").grid(row=1, column=1, padx=10, pady=10)

        # Bottom Actions
        self.btn_frame = tk.Frame(self.main_frame, bg="#0f172a")
        self.btn_frame.pack(side="bottom", pady=20)

        tk.Button(
            self.btn_frame, text="🔄 Check Updates", command=lambda: auto_update(manual=True),
            bg="#334155", fg="white", font=("Segoe UI", 10), relief="flat", cursor="hand2", padx=12, pady=6
        ).pack(side="left", padx=10)

        self.auth_btn = tk.Button(
            self.btn_frame, text="🚪 Logout", command=self.logout,
            bg="#b91c1c", fg="white", font=("Segoe UI", 10, "bold"), relief="flat", cursor="hand2", padx=12, pady=6
        )
        self.auth_btn.pack(side="left", padx=10)

        self.root.protocol("WM_DELETE_WINDOW", self.hide_to_tray)

    def refresh_ui_state(self):
        if self.current_user:
            u_name = self.current_user["username"].capitalize()
            self.status_label.config(text=f"Sync Active | Agent: {u_name}", fg="#4ade80")
            self.info_label.config(text=f"v{CURRENT_VERSION} • Logged In")
            self.auth_btn.config(text="🚪 Logout", command=self.logout, bg="#b91c1c")
            self.kiosk_frame.pack(pady=10)
        else:
            self.status_label.config(text=f"Station: {HOSTNAME}", fg="#38bdf8")
            self.info_label.config(text=f"v{CURRENT_VERSION} • Unassigned Station Telemetry Active")
            self.auth_btn.config(text="🔑 Login Agent", command=self.show_login_dialog, bg="#4f46e5")
            self.kiosk_frame.pack_forget()
        self.update_tray_menu()

    def show_main_window(self):
        self.root.after(0, lambda: (
            self.refresh_ui_state(),
            self.root.deiconify(),
            self.root.lift(),
            self.root.focus_force()
        ))

    def hide_to_tray(self):
        self.root.withdraw()

    def confirm_quit(self):
        self.root.after(0, lambda: self._do_confirm_quit())

    def _do_confirm_quit(self):
        self.root.deiconify()
        self.root.lift()
        
        # Admin Lock Prompt
        import simpledialog
        pin = simpledialog.askstring("Admin Required", "Enter Master PIN to Stop Tracking:", show="*", parent=self.root)
        
        if pin == "0000": # Master Admin PIN
            ans = messagebox.askyesno(
                "Stop Tracking?",
                "Are you sure you want to stop Limassol Tracker?\n\nActivity will no longer be tracked until restarted.",
                icon="warning"
            )
            if ans:
                if self.tray_icon:
                    self.tray_icon.stop()
                self.root.destroy()
                os._exit(0)
            else:
                self.hide_to_tray()
        elif pin is not None:
            messagebox.showerror("Access Denied", "Incorrect Admin PIN!")
            self.hide_to_tray()
        else:
            self.hide_to_tray()

    def show_login_dialog(self):
        def _build_dialog():
            dlg = tk.Toplevel(self.root)
            dlg.title(f"Agent Login — Limassol Tracker v{CURRENT_VERSION}")
            dlg.geometry("380x280")
            dlg.resizable(False, False)
            dlg.configure(bg="#1a1a2e")
            dlg.attributes("-topmost", True)
            dlg.tk.eval(f'tk::PlaceWindow {dlg._w} center')

            tk.Label(dlg, text="🕐 Limassol Time Tracker", font=("Segoe UI", 15, "bold"), bg="#1a1a2e", fg="white").pack(pady=(18, 4))
            tk.Label(dlg, text="Enter your agent credentials:", font=("Segoe UI", 10), bg="#1a1a2e", fg="#aaaacc").pack(pady=(0, 12))

            form = tk.Frame(dlg, bg="#1a1a2e")
            form.pack(padx=25, fill="x")

            tk.Label(form, text="Username:", font=("Segoe UI", 9, "bold"), bg="#1a1a2e", fg="white", anchor="w").grid(row=0, column=0, sticky="w", pady=4)
            u_entry = ttk.Entry(form, font=("Segoe UI", 10), width=22)
            u_entry.grid(row=0, column=1, pady=4, padx=(10, 0))
            u_entry.focus()

            tk.Label(form, text="PIN:", font=("Segoe UI", 9, "bold"), bg="#1a1a2e", fg="white", anchor="w").grid(row=1, column=0, sticky="w", pady=4)
            p_entry = ttk.Entry(form, font=("Segoe UI", 10), show="*", width=22)
            p_entry.grid(row=1, column=1, pady=4, padx=(10, 0))

            def on_submit():
                u = u_entry.get().strip().lower()
                p = p_entry.get().strip()
                if not u:
                    messagebox.showwarning("LimassolTime", "Please enter username!", parent=dlg)
                    return
                if not p:
                    messagebox.showwarning("LimassolTime", "Please enter PIN!", parent=dlg)
                    return
                save_user(u, p)
                self.current_user = {"username": u, "pin": p}
                dlg.destroy()
                self.refresh_ui_state()
                self.show_main_window()

            def on_close():
                dlg.destroy()
                self.refresh_ui_state()
                # Do NOT quit, remain in tray as unassigned station
                self.hide_to_tray()

            dlg.protocol("WM_DELETE_WINDOW", on_close)

            btn = tk.Button(
                dlg, text="  Save & Start Tracker  ", font=("Segoe UI", 10, "bold"),
                bg="#4f46e5", fg="white", relief="flat", padx=10, pady=6, cursor="hand2", command=on_submit
            )
            btn.pack(pady=16)

        self.root.after(0, _build_dialog)

    def logout(self):
        clear_user()
        self.current_user = None
        self.refresh_ui_state()
        self.show_login_dialog()

    def log_shift_event(self, ev_type, label):
        if not self.current_user:
            return
        user = self.current_user["username"]
        now_utc = datetime.now(timezone.utc)
        date_str = now_utc.strftime("%Y-%m-%d")
        time_str = now_utc.strftime("%H:%M")
        timestamp = int(now_utc.timestamp() * 1000)
        employee_id = user.lower().strip().replace(" ", "")
        fields = {
            "employeeId": {"stringValue": employee_id},
            "type": {"stringValue": ev_type},
            "label": {"stringValue": label},
            "time": {"stringValue": time_str},
            "timestamp": {"integerValue": str(timestamp)},
            "date": {"stringValue": date_str},
            "source": {"stringValue": "Tracker App"}
        }
        url = f"https://firestore.googleapis.com/v1/projects/{FIREBASE_PROJECT}/databases/(default)/documents/shift_events?key={FIREBASE_API_KEY}"
        try:
            requests.post(url, json={"fields": fields}, timeout=8)
        except Exception:
            pass

    def on_clock_in(self):
        if self.current_user:
            threading.Thread(target=self.log_shift_event, args=("check_in", "Check-in (App)")).start()
            threading.Thread(target=update_firestore_status, args=(self.current_user["username"], "checked_in")).start()
            messagebox.showinfo("LimassolTime", "Clocked In successfully!")

    def on_start_break(self):
        if self.current_user:
            threading.Thread(target=self.log_shift_event, args=("break_start", "Break Start (App)")).start()
            threading.Thread(target=update_firestore_status, args=(self.current_user["username"], "on_break")).start()
            messagebox.showinfo("LimassolTime", "Break Started!")

    def on_end_break(self):
        if self.current_user:
            threading.Thread(target=self.log_shift_event, args=("break_end", "Break End (App)")).start()
            threading.Thread(target=update_firestore_status, args=(self.current_user["username"], "checked_in")).start()
            messagebox.showinfo("LimassolTime", "Break Ended!")

    def on_clock_out(self):
        if self.current_user:
            threading.Thread(target=self.log_shift_event, args=("check_out", "Check-out (App)")).start()
            threading.Thread(target=update_firestore_status, args=(self.current_user["username"], "completed")).start()
            messagebox.showinfo("LimassolTime", "Clocked Out successfully!")

    def run_sync_loop(self):
        print(f"[{now()}] 🚀 Limassol Time Tracker 24/7 background worker started.")
        self.workspace_id = get_workspace()
        
        last_status = None
        last_heartbeat = 0

        while self.active_sync:
            try:
                bucket_id = get_afk_bucket()
                active = is_active(bucket_id) if bucket_id else False
                current_status = "checked_in" if active else "completed"

                cur_time = time.time()
                is_heartbeat = (cur_time - last_heartbeat) >= 120  # Heartbeat every 2 mins

                if self.current_user:
                    username = self.current_user["username"]
                    if current_status != last_status or is_heartbeat:
                        aw_stats = get_aw_stats_today() if active else None
                        update_firestore_status(username, current_status, aw_stats, is_station=False)
                        last_status = current_status
                        last_heartbeat = cur_time

                    if self.workspace_id:
                        timer_running = get_running_timer(self.workspace_id, username) is not None
                        if active and not timer_running:
                            start_timer(self.workspace_id)
                        elif not active and timer_running:
                            stop_timer(self.workspace_id, username)
                else:
                    # Unassigned Workstation Telemetry
                    station_id = f"station_{HOSTNAME}"
                    if current_status != last_status or is_heartbeat:
                        aw_stats = get_aw_stats_today() if active else None
                        update_firestore_status(station_id, "unassigned", aw_stats, is_station=True)
                        last_status = current_status
                        last_heartbeat = cur_time

                status_disp = "🟢 Active" if active else "🔴 Inactive"
                target_disp = self.current_user["username"] if self.current_user else f"Station {HOSTNAME}"
                print(f"[{now()}] [{target_disp}] Status: {status_disp}")

            except Exception as e:
                print(f"[{now()}] Sync worker error: {e}")

            time.sleep(CHECK_INTERVAL)

    def run(self):
        self.root.mainloop()

# -------------------------------------------------------------------
# ENTRYPOINT
# -------------------------------------------------------------------
def main():
    app = LimassolTrackerApp()
    app.run()

if __name__ == "__main__":
    main()
