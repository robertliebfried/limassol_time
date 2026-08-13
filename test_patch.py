import requests, json
from datetime import datetime, timezone

key = "AIzaSyBOQaJrFF6opjdymkh2fd4nmEw4A6r3tOY"
doc_id = 'jameswhite'
url = f'https://firestore.googleapis.com/v1/projects/karfigestsa/databases/(default)/documents/employees/{doc_id}?key={key}'
fields = {
    'username': {'stringValue': doc_id},
    'status': {'stringValue': 'checked_in'},
    'trackingClient': {'stringValue': 'AW'},
    'lastSeen': {'timestampValue': datetime.now(timezone.utc).strftime('%Y-%m-%dT%H:%M:%SZ')}
}
r = requests.patch(url, json={'fields': fields}, timeout=10)
print(r.status_code)
print(r.text)
