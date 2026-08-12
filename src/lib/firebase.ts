const FIREBASE_API_KEY = "AIzaSyBOQaJrFF6opjdymkh2fd4nmEw4A6r3tOY";
const FIREBASE_PROJECT = "karfigestsa";

export interface FirestoreEmployeeDoc {
  username: string;
  name?: string;
  pin?: string;
  role?: string;
  languages?: string[];
  expectedShift?: string;
  team?: string;
  status: 'expected' | 'checked_in' | 'on_break' | 'completed' | 'absent';
  checkInTime?: string;
  checkOutTime?: string;
  sortOrder?: number;
  trackingClient?: string;
  lastSeen?: string;
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
      const statusStr = fields.status?.stringValue;
      const isDel = fields.isDeleted?.booleanValue;
      if (statusStr === 'deleted' || isDel === true) continue;

      const username = fields.username?.stringValue || doc.name.split('/').pop() || '';
      const langs = fields.languages?.arrayValue?.values?.map((v: { stringValue?: string }) => v.stringValue || '') || [];
      result[username.toLowerCase()] = {
        username: username.toLowerCase(),
        name: fields.name?.stringValue,
        pin: fields.pin?.stringValue,
        role: fields.role?.stringValue,
        languages: langs,
        expectedShift: fields.expectedShift?.stringValue,
        team: fields.team?.stringValue,
        status: (fields.status?.stringValue as FirestoreEmployeeDoc['status']) || 'expected',
        checkInTime: fields.checkInTime?.stringValue,
        checkOutTime: fields.checkOutTime?.stringValue,
        sortOrder: fields.sortOrder?.integerValue ? parseInt(fields.sortOrder.integerValue) : undefined,
        trackingClient: fields.trackingClient?.stringValue,
        lastSeen: fields.lastSeen?.timestampValue,
      };
    }
    return result;
  } catch (e) {
    console.error('Firestore REST fetch error:', e);
    return {};
  }
}

type FieldValue = { stringValue?: string; timestampValue?: string; integerValue?: string; booleanValue?: boolean; arrayValue?: { values: { stringValue: string }[] } };

// Save full employee profile to Firestore (used when adding/editing employees)
export async function saveFirestoreEmployee(
  username: string,
  profile: Partial<FirestoreEmployeeDoc>
) {
  const docId = username.toLowerCase().trim().replace(/\s+/g, '');
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/employees/${docId}?key=${FIREBASE_API_KEY}`;

  const fields: Record<string, FieldValue> = {
    username: { stringValue: docId },
    status: { stringValue: profile.status || 'expected' },
    isDeleted: { booleanValue: false },
    lastUpdated: { timestampValue: new Date().toISOString() },
  };
  if (profile.name) fields.name = { stringValue: profile.name };
  if (profile.pin) fields.pin = { stringValue: profile.pin };
  if (profile.role) fields.role = { stringValue: profile.role };
  if (profile.expectedShift) fields.expectedShift = { stringValue: profile.expectedShift };
  if (profile.team !== undefined) fields.team = { stringValue: profile.team || '' };
  if (profile.languages && profile.languages.length > 0) {
    fields.languages = { arrayValue: { values: profile.languages.map(l => ({ stringValue: l })) } };
  }
  if (profile.checkInTime) fields.checkInTime = { stringValue: profile.checkInTime };
  if (profile.checkOutTime) fields.checkOutTime = { stringValue: profile.checkOutTime };
  if (profile.sortOrder !== undefined) fields.sortOrder = { integerValue: String(profile.sortOrder) };

  try {
    await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields }),
    });
  } catch (e) {
    console.error('Firestore REST save error:', e);
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

  const now = new Date().toISOString();
  const fields: Record<string, FieldValue> = {
    username: { stringValue: docId },
    status: { stringValue: status },
    trackingClient: { stringValue: 'WEB' },
    lastUpdated: { timestampValue: now },
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

// Delete employee document from Firestore
export async function deleteFirestoreEmployee(username: string) {
  const docId = username.toLowerCase().trim().replace(/\s+/g, '');
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/employees/${docId}?key=${FIREBASE_API_KEY}`;
  try {
    await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fields: {
          status: { stringValue: 'deleted' },
          isDeleted: { booleanValue: true },
          lastUpdated: { timestampValue: new Date().toISOString() },
        },
      }),
    });
    await fetch(url, { method: 'DELETE' });
  } catch (e) {
    console.error('Firestore REST delete error:', e);
  }
}
