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
# HARDCODED CONFIG (do not share this file)
# -------------------------------------------------------------------
CLOCKIFY_API_KEY = "ZWVlYjQ1ZDMtODMzNS00NWZmLTg2NjAtYmMxZDQ0MWM1NzQ5"
AW_URL = "http://127.0.0.1:5600"
CHECK_INTERVAL = 30  # seconds
USER_FILE = "selected_user.json"

# -------------------------------------------------------------------
# Clockify API
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

def get_all_users(workspace_id):
    return clockify_get(f"/workspaces/{workspace_id}/users") or []

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
            print(f"[{now()}] ✅ Timer STARTED")
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
            print(f"[{now()}] ⏹ Timer STOPPED (AFK)")
            return True
    except Exception as e:
        print(f"Stop timer error: {e}")
    return False

# -------------------------------------------------------------------
# ActivityWatch
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
# Helpers
# -------------------------------------------------------------------
def now():
    return datetime.now().strftime("%H:%M:%S")

def load_user():
    if os.path.exists(USER_FILE):
        with open(USER_FILE, "r") as f:
            return json.load(f)
    return None

def save_user(user_id, user_name, workspace_id):
    with open(USER_FILE, "w") as f:
        json.dump({
            "user_id": user_id,
            "user_name": user_name,
            "workspace_id": workspace_id
        }, f)

# -------------------------------------------------------------------
# GUI: First-time setup window
# -------------------------------------------------------------------
def show_setup_window():
    result = {}

    win = tk.Tk()
    win.title("Limassol Time Tracker")
    win.geometry("380x220")
    win.resizable(False, False)
    win.configure(bg="#1a1a2e")

    # Center the window
    win.eval('tk::PlaceWindow . center')

    tk.Label(
        win, text="🕐 Limassol Time Tracker",
        font=("Arial", 16, "bold"), bg="#1a1a2e", fg="white"
    ).pack(pady=(20, 5))

    tk.Label(
        win, text="Выберите своё имя из списка:",
        font=("Arial", 11), bg="#1a1a2e", fg="#aaaacc"
    ).pack(pady=(5, 10))

    # Fetch users from Clockify
    status_label = tk.Label(
        win, text="Загружаю список сотрудников...",
        font=("Arial", 9), bg="#1a1a2e", fg="#888"
    )
    status_label.pack()

    combo = ttk.Combobox(win, state="readonly", width=35, font=("Arial", 11))
    combo.pack(pady=10)

    users_map = {}  # name -> (user_id, workspace_id)

    def load_users():
        workspace_id = get_workspace()
        if not workspace_id:
            status_label.config(text="❌ Ошибка подключения к Clockify", fg="red")
            return
        users = get_all_users(workspace_id)
        if not users:
            status_label.config(text="❌ Нет сотрудников в Clockify", fg="red")
            return
        for u in users:
            name = u.get("name", u.get("email", "Unknown"))
            users_map[name] = (u["id"], workspace_id)
        combo["values"] = list(users_map.keys())
        if combo["values"]:
            combo.current(0)
        status_label.config(text="✅ Выберите имя и нажмите Сохранить", fg="#88cc88")

    threading.Thread(target=load_users, daemon=True).start()

    def on_save():
        selected = combo.get()
        if not selected:
            messagebox.showwarning("Внимание", "Пожалуйста, выберите имя!")
            return
        user_id, workspace_id = users_map[selected]
        save_user(user_id, selected, workspace_id)
        result["user_id"] = user_id
        result["user_name"] = selected
        result["workspace_id"] = workspace_id
        win.destroy()

    btn = tk.Button(
        win, text="  Сохранить и Запустить  ",
        font=("Arial", 11, "bold"),
        bg="#4f46e5", fg="white",
        relief="flat", padx=10, pady=6,
        cursor="hand2",
        command=on_save
    )
    btn.pack(pady=5)

    win.mainloop()
    return result if "user_id" in result else None

# -------------------------------------------------------------------
# Tray Icon (simple notification in terminal)
# -------------------------------------------------------------------
def show_tray_notification(user_name):
    """Show a small persistent status window in system tray area"""
    win = tk.Tk()
    win.title(f"Limassol Tracker — {user_name}")
    win.geometry("300x80")
    win.resizable(False, False)
    win.configure(bg="#0f172a")
    win.attributes("-topmost", False)

    label = tk.Label(
        win, text=f"✅ Синхронизация активна\n👤 {user_name}",
        font=("Arial", 10), bg="#0f172a", fg="#4ade80"
    )
    label.pack(expand=True)

    tk.Label(
        win, text="Не закрывайте это окно",
        font=("Arial", 8), bg="#0f172a", fg="#555"
    ).pack()

    win.mainloop()

# -------------------------------------------------------------------
# Main Sync Loop
# -------------------------------------------------------------------
def sync_loop(user_id, workspace_id, user_name):
    print(f"\n[{now()}] 🚀 Запуск синхронизации для {user_name}")
    print(f"[{now()}] Ищу ActivityWatch...")

    bucket_id = None
    while not bucket_id:
        bucket_id = get_afk_bucket()
        if not bucket_id:
            print(f"[{now()}] ⏳ Жду ActivityWatch...")
            time.sleep(5)

    print(f"[{now()}] ✅ ActivityWatch найден! Начинаю мониторинг...\n")

    while True:
        try:
            active = is_active(bucket_id)
            timer_running = get_running_timer(workspace_id, user_id) is not None

            if active and not timer_running:
                start_timer(workspace_id)
            elif not active and timer_running:
                stop_timer(workspace_id, user_id)
            else:
                status = "🟢 Активен" if active else "🔴 AFK"
                timer_status = "⏱ Таймер идет" if timer_running else "⏸ Таймер стоит"
                print(f"[{now()}] {status} | {timer_status}")

        except Exception as e:
            print(f"[{now()}] Ошибка: {e}")

        time.sleep(CHECK_INTERVAL)

# -------------------------------------------------------------------
# Entry Point
# -------------------------------------------------------------------
def main():
    user_data = load_user()

    if not user_data:
        # First launch — show setup GUI
        user_data = show_setup_window()
        if not user_data:
            print("Настройка отменена.")
            return

    user_id = user_data["user_id"]
    user_name = user_data["user_name"]
    workspace_id = user_data["workspace_id"]

    # Run sync loop in background thread
    sync_thread = threading.Thread(
        target=sync_loop,
        args=(user_id, workspace_id, user_name),
        daemon=True
    )
    sync_thread.start()

    # Show status window (keeps program alive)
    show_tray_notification(user_name)


if __name__ == "__main__":
    main()
