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
  // AW telemetry fields (pushed by tracker every heartbeat)
  awActiveSecondsToday?: number;
  awAfkSecondsToday?: number;
  awCurrentApp?: string;
  awCurrentTitle?: string;
  awTopAppsJson?: string;
}

// Fetch all employees from Firestore REST API (0 dependencies)
export async function fetchFirestoreEmployees(): Promise<Record<string, FirestoreEmployeeDoc>> {
  try {
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/employees?pageSize=300&key=${FIREBASE_API_KEY}`,
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
        awActiveSecondsToday: fields.awActiveSecondsToday?.integerValue ? parseInt(fields.awActiveSecondsToday.integerValue) : undefined,
        awAfkSecondsToday: fields.awAfkSecondsToday?.integerValue ? parseInt(fields.awAfkSecondsToday.integerValue) : undefined,
        awCurrentApp: fields.awCurrentApp?.stringValue,
        awCurrentTitle: fields.awCurrentTitle?.stringValue,
        awTopAppsJson: fields.awTopAppsJson?.stringValue,
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

  const fields: Record<string, FieldValue> = {
    username: { stringValue: docId },
    status: { stringValue: profile.status || 'expected' },
    isDeleted: { booleanValue: false },
    lastUpdated: { timestampValue: new Date().toISOString() },
  };
  const maskPaths = ['username', 'status', 'isDeleted', 'lastUpdated'];

  if ('name' in profile) { if (profile.name) fields.name = { stringValue: profile.name }; maskPaths.push('name'); }
  if ('pin' in profile) { if (profile.pin) fields.pin = { stringValue: profile.pin }; maskPaths.push('pin'); }
  if ('role' in profile) { if (profile.role) fields.role = { stringValue: profile.role }; maskPaths.push('role'); }
  if ('expectedShift' in profile) { if (profile.expectedShift) fields.expectedShift = { stringValue: profile.expectedShift }; maskPaths.push('expectedShift'); }
  if ('team' in profile) { fields.team = { stringValue: profile.team || '' }; maskPaths.push('team'); }
  
  if ('languages' in profile) {
    if (profile.languages && profile.languages.length > 0) {
      fields.languages = { arrayValue: { values: profile.languages.map(l => ({ stringValue: l })) } };
    } else {
      fields.languages = { arrayValue: { values: [] } };
    }
    maskPaths.push('languages');
  }

  if ('checkInTime' in profile) { 
    if (profile.checkInTime) fields.checkInTime = { stringValue: profile.checkInTime }; 
    maskPaths.push('checkInTime'); 
  }
  if ('checkOutTime' in profile) { 
    if (profile.checkOutTime) fields.checkOutTime = { stringValue: profile.checkOutTime }; 
    maskPaths.push('checkOutTime'); 
  }
  if ('sortOrder' in profile) { 
    if (profile.sortOrder !== undefined) fields.sortOrder = { integerValue: String(profile.sortOrder) }; 
    maskPaths.push('sortOrder'); 
  }

  const maskQuery = maskPaths.map(p => `updateMask.fieldPaths=${p}`).join('&');
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/employees/${docId}?key=${FIREBASE_API_KEY}&${maskQuery}`;

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
  } catch (error) {
    console.error(`Failed to soft-delete employee ${username}:`, error);
  }
}

export async function purgeFirestoreEmployee(username: string) {
  const docId = username.toLowerCase().trim().replace(/\s+/g, '');
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/employees/${docId}?key=${FIREBASE_API_KEY}`;
  try {
    await fetch(url, { method: 'DELETE' });
  } catch (error) {
    console.error(`Failed to permanently delete employee ${username}:`, error);
  }
}

export interface FirestoreTimeLog {
  id?: string;
  date: string;
  employeeId: string;
  employeeName: string;
  hours: number;
  projectTask: string;
  timestamp: string;
  source?: string;
}

export interface FirestoreShiftEvent {
  id?: string;
  employeeId: string;
  type: string;
  label: string;
  time: string;
  timestamp: number;
  date: string;
  source?: string;
}

export async function fetchFirestoreLogs(startDate: string, endDate: string): Promise<FirestoreTimeLog[]> {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents:runQuery?key=${FIREBASE_API_KEY}`;
  
  // To keep it simple and avoid needing a composite index in Firestore initially,
  // we can fetch logs where date >= startDate, and then filter endDate locally.
  const query = {
    structuredQuery: {
      from: [{ collectionId: 'time_logs' }],
      where: {
        fieldFilter: {
          field: { fieldPath: 'date' },
          op: 'GREATER_THAN_OR_EQUAL',
          value: { stringValue: startDate }
        }
      }
    }
  };
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query)
    });
    if (!res.ok) return [];
    const data = await res.json();
    const results: FirestoreTimeLog[] = [];
    for (const item of data) {
      if (item.document && item.document.fields) {
        const fields = item.document.fields;
        const dateVal = fields.date?.stringValue || '';
        if (dateVal > endDate) continue;
        
        results.push({
          id: item.document.name.split('/').pop(),
          employeeId: fields.employeeId?.stringValue || '',
          employeeName: fields.employeeName?.stringValue || '',
          date: fields.date?.stringValue || '',
          hours: fields.hours?.doubleValue ? parseFloat(fields.hours.doubleValue) : (fields.hours?.integerValue ? parseInt(fields.hours.integerValue) : 0),
          projectTask: fields.projectTask?.stringValue || '',
          timestamp: fields.timestamp?.stringValue || '',
          source: fields.source?.stringValue || ''
        });
      }
    }
    results.sort((a, b) => {
      if (a.date !== b.date) return a.date.localeCompare(b.date);
      return a.timestamp.localeCompare(b.timestamp);
    });
    return results;
  } catch (e) {
    console.error('Fetch logs error:', e);
    return [];
  }
}

export async function saveFirestoreLog(log: FirestoreTimeLog) {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/time_logs?key=${FIREBASE_API_KEY}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fields: Record<string, any> = {
    employeeId: { stringValue: log.employeeId },
    employeeName: { stringValue: log.employeeName },
    date: { stringValue: log.date },
    hours: { doubleValue: log.hours },
    projectTask: { stringValue: log.projectTask },
    timestamp: { stringValue: log.timestamp }
  };
  if (log.source) fields.source = { stringValue: log.source };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });
    const data = await res.json();
    return data.name ? data.name.split('/').pop() : null;
  } catch (e) {
    console.error('Save log error:', e);
    return null;
  }
}

export async function fetchFirestoreShiftEvents(dateStr: string): Promise<FirestoreShiftEvent[]> {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents:runQuery?key=${FIREBASE_API_KEY}`;
  const query = {
    structuredQuery: {
      from: [{ collectionId: 'shift_events' }],
      where: {
        fieldFilter: {
          field: { fieldPath: 'date' },
          op: 'EQUAL',
          value: { stringValue: dateStr }
        }
      }
    }
  };
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query)
    });
    if (!res.ok) return [];
    const data = await res.json();
    const results: FirestoreShiftEvent[] = [];
    for (const item of data) {
      if (item.document && item.document.fields) {
        const fields = item.document.fields;
        results.push({
          id: item.document.name.split('/').pop(),
          employeeId: fields.employeeId?.stringValue || '',
          type: fields.type?.stringValue || '',
          label: fields.label?.stringValue || '',
          time: fields.time?.stringValue || '',
          timestamp: fields.timestamp?.integerValue ? parseInt(fields.timestamp.integerValue, 10) : 0,
          date: fields.date?.stringValue || '',
          source: fields.source?.stringValue || ''
        });
      }
    }
    results.sort((a, b) => a.timestamp - b.timestamp);
    return results;
  } catch {
    return [];
  }
}

export async function fetchFirestoreShiftEventsForEmployee(employeeId: string): Promise<FirestoreShiftEvent[]> {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents:runQuery?key=${FIREBASE_API_KEY}`;
  const query = {
    structuredQuery: {
      from: [{ collectionId: 'shift_events' }],
      where: {
        fieldFilter: {
          field: { fieldPath: 'employeeId' },
          op: 'EQUAL',
          value: { stringValue: employeeId }
        }
      }
    }
  };
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(query)
    });
    if (!res.ok) return [];
    const data = await res.json();
    const results: FirestoreShiftEvent[] = [];
    for (const item of data) {
      if (item.document && item.document.fields) {
        const fields = item.document.fields;
        results.push({
          id: item.document.name.split('/').pop(),
          employeeId: fields.employeeId?.stringValue || '',
          type: fields.type?.stringValue || '',
          label: fields.label?.stringValue || '',
          time: fields.time?.stringValue || '',
          timestamp: fields.timestamp?.integerValue ? parseInt(fields.timestamp.integerValue, 10) : 0,
          date: fields.date?.stringValue || '',
          source: fields.source?.stringValue || ''
        });
      }
    }
    results.sort((a, b) => a.timestamp - b.timestamp);
    return results;
  } catch {
    return [];
  }
}

export async function saveFirestoreShiftEvent(event: FirestoreShiftEvent) {
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT}/databases/(default)/documents/shift_events?key=${FIREBASE_API_KEY}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const fields: Record<string, any> = {
    employeeId: { stringValue: event.employeeId },
    type: { stringValue: event.type },
    label: { stringValue: event.label },
    time: { stringValue: event.time },
    timestamp: { integerValue: String(event.timestamp) },
    date: { stringValue: event.date }
  };
  if (event.source) fields.source = { stringValue: event.source };

  try {
    await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fields })
    });
  } catch (e) {
    console.error('Save shift event error:', e);
  }
}
