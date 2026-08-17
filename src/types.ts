export interface Employee {
  id: string;
  name: string;
  username?: string;
  pin?: string;
  email?: string;
  languages: string[];
  role: string;
  expectedShift: string;
  status: 'expected' | 'checked_in' | 'on_break' | 'completed' | 'absent';
  breakType?: string;
  breakStartTimestamp?: number;
  checkInTime?: string;
  checkOutTime?: string;
  checkInTimestamp?: number;
  accumulatedSeconds?: number;
  sortOrder?: number;
  archivedAt?: number;
  team?: string;
  trackingClient?: string;
  lastSeen?: string;
  // AW Telemetry
  awActiveSecondsToday?: number;
  awIdleSecondsToday?: number;
  awProductivityScore?: number;
  awActiveApp?: string;
  awActiveTitle?: string;
  awTopAppsJson?: string;
  isDeleted?: boolean;
}

export interface TimeLog {
  id: string;
  date: string;
  employeeId: string;
  employeeName: string;
  hours: number;
  projectTask: string;
  timestamp: string;
  source?: 'aw_auto' | 'manual_admin' | 'manual_agent';
}

export interface ShiftEvent {
  id: string;
  type: 'clock_in' | 'clock_out' | 'break_start' | 'break_end' | 'system' | 'absent';
  label: string;
  time: string;
  timestamp: number;
  breakType?: string;
  source?: 'aw_auto' | 'manual_admin' | 'manual_agent';
}
