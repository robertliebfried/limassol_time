const FIREBASE_API_KEY = 'AIzaSyBOQaJrFF6opjdymkh2fd4nmEw4A6r3tOY';
const FIREBASE_PROJECT = 'karfigestsa';
fetch('https://firestore.googleapis.com/v1/projects/' + FIREBASE_PROJECT + '/databases/(default)/documents/employees?key=' + FIREBASE_API_KEY)
  .then(r => r.json())
  .then(data => {
    const docs = data.documents || [];
    let report = [];
    docs.forEach(doc => {
      const fields = doc.fields || {};
      if (fields.isDeleted && fields.isDeleted.booleanValue) return;
      const name = fields.name ? fields.name.stringValue : doc.name.split('/').pop();
      const status = fields.status ? fields.status.stringValue : 'unknown';
      const checkInTime = fields.checkInTime ? fields.checkInTime.stringValue : 'none';
      const lastSeen = fields.lastSeen ? fields.lastSeen.timestampValue : 'none';
      
      report.push({ name, status, checkInTime, lastSeen });
    });
    console.log(JSON.stringify(report, null, 2));
  });
