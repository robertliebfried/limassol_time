import requests, json

key = "AIzaSyBOQaJrFF6opjdymkh2fd4nmEw4A6r3tOY"
url = f'https://firestore.googleapis.com/v1/projects/karfigestsa/databases/(default)/documents/employees?key={key}'
r = requests.get(url, timeout=10)
print(r.status_code)
data = r.json()
for doc in data.get('documents', []):
    if 'jameswhite' in doc['name']:
        print(json.dumps(doc, indent=2))
