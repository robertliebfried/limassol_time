import json
import datetime
# Let's reproduce the exact JS logic in python
def is_live_from_aw(last_seen_str):
    if not last_seen_str: return False
    # Date.now() equivalent
    now_ms = datetime.datetime.now(datetime.timezone.utc).timestamp() * 1000
    last_seen_ms = datetime.datetime.strptime(last_seen_str, "%Y-%m-%dT%H:%M:%SZ").replace(tzinfo=datetime.timezone.utc).timestamp() * 1000
    diff_mins = (now_ms - last_seen_ms) / 60000
    print(f"Now UTC: {datetime.datetime.now(datetime.timezone.utc)}")
    print(f"LastSeen UTC: {datetime.datetime.strptime(last_seen_str, '%Y-%m-%dT%H:%M:%SZ').replace(tzinfo=datetime.timezone.utc)}")
    print(f"Diff mins: {diff_mins}")
    return diff_mins < 5

print(is_live_from_aw("2026-08-12T16:54:30Z"))
