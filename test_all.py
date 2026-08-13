import requests, json

key = "AIzaSyBOQaJrFF6opjdymkh2fd4nmEw4A6r3tOY"
url = f'https://firestore.googleapis.com/v1/projects/karfigestsa/databases/(default)/documents/employees?key={key}'
r = requests.get(url, timeout=10)
data = r.json()
for doc in data.get('documents', []):
    print("---")
    print(json.dumps(doc['fields'], indent=2))
