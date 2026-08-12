const FIREBASE_API_KEY = "AIzaSyBOQaJrFF6opjdymkh2fd4nmEw4A6r3tOY";
const FIREBASE_PROJECT = "karfigestsa";

export interface FirestoreEmployeeDoc {
  username: string;
  name?: string;
  status: 'expected' | 'checked_in' | 'on_break' | 'completed' | 'absent';
  checkInTime?: string;
  checkOutTime?: string;
}

// Fetch all employees from Firestore REST API (0 dependencies)
export async function fetchFirestoreEmployees(): Promise<Record<string, FirestoreEmployeeDoc>> {
  try {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/employees?key=${FIREBASE_API_KEY}`,
      { cache: 'no-store' }
    );
    if (!res.ok) return {};
    const data = await res.json();
    if (!data.documents) return {};

    const result: Record<string, FirestoreEmployeeDoc> = {};
    for (const doc of data.documents) {
      const fields = doc.fields || {};
      const username = fields.username?.stringValue || doc.name.split('/').pop() || '';
      result[username.toLowerCase()] = {
        username: username.toLowerCase(),
        name: fields.name?.stringValue,
        status: (fields.status?.stringValue as FirestoreEmployeeDoc['status']) || 'expected',
        checkInTime: fields.checkInTime?.stringValue,
        checkOutTime: fields.checkOutTime?.stringValue,
      };
    }
    return result;
  } catch (e) {
    console.error('Firestore REST fetch error:', e);
    return {};
  }
}

// Update single employee status in Firestore REST API (0 dependencies)
export async function updateFirestoreEmployee(
  username: string,
  status: string,
  checkInTime?: string,
  checkOutTime?: string
) {
  const docId = username.toLowerCase().trim().replace(/\s+/g, '');
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/employees/${docId}?key=${FIREBASE_API_KEY}`;

  const fields: Record<string, { stringValue?: string; timestampValue?: string }> = {
    username: { stringValue: docId },
    status: { stringValue: status },
    lastUpdated: { timestampValue: new Date().toISOString() },
  };
  if (checkInTime) fields.checkInTime = { stringValue: checkInTime };
  if (checkOutTime) fields.checkOutTime = { stringValue: checkOutTime };

  try {
    await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    });
  } catch (e) {
    console.error('Firestore REST update error:', e);
  }
}
