'use client';

import React, { useState, useEffect } from 'react';
import { fetchFirestoreEmployees, saveFirestoreEmployee, deleteFirestoreEmployee, purgeFirestoreEmployee } from '@/lib/firebase';

const TRANSLATIONS = {
  en: {
    appTitle: 'Team Hours & Shift Tracker',
    appSubtitle: 'Limassol / Cyprus Timezone Shift Management',
    tabTimeTracker: 'Time Tracker',
    tabEmployees: 'Employees',
    tabReports: 'Reports & Payroll',
    pinTitle: 'Internal Team Tracker',
    pinSubtitle: 'Limassol / Cyprus Timezone Shift Management',
    pinPlaceholder: 'Enter PIN...',
    pinButton: 'Enter',
    pinError: 'Incorrect PIN. Try again.',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    totalEmployees: 'TOTAL EMPLOYEES',
    active: 'active',
    hoursToday: 'HOURS TODAY',
    totalLoggedToday: 'Total logged for today',
    hoursThisWeek: 'HOURS THIS WEEK (7 DAYS)',
    summaryPast7: 'Summary for past 7 days',
    hoursThisMonth: 'HOURS THIS MONTH',
    currentMonthTotal: 'Current month total',
    shiftTracker: 'Shift Arrival & Departure Tracker',
    flexibleShifts: 'Flexible shifts (Most staff: 11:00 AM – 7:00/8:00 PM Cyprus)',
    monthlyCalendar: 'Monthly Calendar',
    dailyTimesheetTable: 'Daily Timesheet Table',
    cardsView: 'Cards View',
    bulkArrive: 'Bulk Arrive 11 AM',
    bulkLeft: 'Bulk Left (End Shifts)',
    newDayReset: 'New Day Reset',
    addEmployee: 'Add Employee',
    logHours: 'Log Hours',
    searchEmployee: 'Search employee by name, role or shift...',
    statusAll: 'All',
    statusWorking: 'Working',
    statusExpected: 'Expected',
    statusDone: 'Done',
    statusOff: 'Off',
    arrived: 'Arrived',
    leftOffice: 'Left Office',
    resetReopen: 'Reset / Re-open',
    resetToExpected: 'Reset to Expected',
    noLogsDay: 'No logs',
    workedLabel: 'Worked:',
    employeeDirectory: 'Employee Directory',
    staffRoster: 'Full staff roster — 30+ CS Agents',
    nameCol: 'Name',
    roleCol: 'Role',
    targetShiftCol: 'Target Shift',
    languagesCol: 'Languages',
    todayStatusCol: "Today's Status",
    totalHoursCol: 'Total Worked Hours',
    actionsCol: 'Actions',
    editBtn: 'Edit',
    deleteBtn: 'Delete',
    deletedArchive: 'Deleted Employees Archive',
    restoreBtn: 'Restore',
    noArchived: 'No archived employees yet.',
    reportsTitle: 'Reports & Payroll Center',
    dateRange: 'Date Range:',
    fromLabel: 'From:',
    toLabel: 'To:',
    thisMonth: 'This Month',
    past30: 'Past 30 Days',
    exportPayroll: 'Export Payroll Summary CSV',
    exportDetailed: 'Export Detailed Shift CSV',
    printReport: 'Print / PDF Report',
    timeLogsTable: 'Time Logs Table',
    dateCol: 'Date',
    employeeCol: 'Employee',
    taskCol: 'Task / Project',
    hoursCol: 'Hours',
    timestampCol: 'Timestamp',
    deleteLog: 'Delete',
    noLogs: 'No logs yet for the selected filters.',
    addEmpTitle: 'Add New Employee',
    empNameLabel: 'Full Name:',
    empRoleLabel: 'Role / Position:',
    empLangLabel: 'Languages (comma separated):',
    empShiftLabel: 'Expected Shift Time:',
    cancelBtn: 'Cancel',
    saveBtn: 'Save Employee',
    editShiftTitle: 'Edit Shift',
    checkInLabel: 'Check-In Time:',
    checkOutLabel: 'Check-Out Time:',
    statusLabel: 'Status:',
    saveChanges: 'Save Changes',
    logWorkTitle: 'Log Work',
    selectEmpLabel: 'Select Employee:',
    selectEmpPlaceholder: '— Select employee —',
    dateLabel: 'Date:',
    hoursWorkedLabel: 'Hours Worked:',
    taskLabel: 'Task / Project Description:',
    submitLog: 'Submit Log',
    clockifyTitle: 'Clockify Integration',
    clockifyDesc: 'Connect your Clockify.me workspace to automatically back up attendance logs and provide your employees with Clockify\'s mobile/web app for self-tracking.',
    clockifyKeyLabel: 'Clockify API Key:',
    clockifyWsLabel: 'Workspace ID (Optional):',
    fullSetupBtn: 'Full Setup + Invite Employees',
    saveSyncBtn: 'Save & Sync Now',
    closeBtn: 'Close',
    hideLabel: 'Hide',
    showLabel: 'Show',
    // Admin dashboard
    shiftArrivalTracker: 'Shift Arrival & Departure Tracker',
    flexibleShiftsNote: 'Flexible shifts (Most staff: 11:00 AM – 7:00/8:00 PM Cyprus)',
    monthlyCalendarBtn: 'Monthly Calendar',
    dailyTimesheetBtn: 'Daily Timesheet Table',
    cardsViewBtn: 'Cards View',
    bulkArriveBtn: 'Bulk Arrive 11 AM',
    bulkLeftBtn: 'Bulk Left (End Shifts)',
    newDayResetBtn: 'New Day Reset',
    addEmployeeBtn: 'Add Employee',
    clickDayHint: 'Click any day to view/edit daily timesheet',
    prevMonth: 'Prev Month',
    todayBtn: 'Today',
    nextMonth: 'Next Month',
    workedLabel2: 'Worked:',
    noLogsLabel: 'No logs',
    searchPlaceholder: 'Search employee by name, role or shift...',
    filterAll: 'All',
    filterWorking: 'Working',
    filterExpected: 'Expected',
    filterDone: 'Done',
    filterOff: 'Off',
    colNameRole: 'Employee Name & Role',
    colShiftTarget: 'Shift Target',
    colArrival: 'Arrival (In)',
    colDeparture: 'Departure (Out)',
    colWorkedHrs: 'Worked Hours',
    colShiftStatus: 'Shift Status',
    colActions: 'Actions / Modify',
    noEmployeesFilter: 'No employees found matching filter criteria.',
    statusExpectedBadge: 'Expected',
    statusWorkingBadge: 'Working',
    statusDoneBadge: 'Shift Done',
    statusAbsentBadge: 'Absent',
    arrivedBtn: 'Arrived',
    leftBtn: 'Left',
    editTimesBtn: 'Edit Times',
    shiftTargetLabel: 'Shift Target:',
    notArrivedYet: 'Status: Not arrived yet',
    arrivedAtLabel: 'Arrived at:',
    leftOfficeBadge: 'Left Office',
    resetReopenBtn: 'Reset / Re-open',
    resetToExpectedBtn: 'Reset to Expected',
    noEmpMatchFilter: 'No employees match your search or filter criteria.',
    empDirectoryTitle: 'Employee Directory & Staff Roster',
    empDirectoryDesc: 'Manage all 30+ team members, shift targets, spoken languages, and roles',
    addNewEmpBtn: 'Add New Employee',
    colNum: '#',
    colEmpName: 'Employee Name',
    colRoleDept: 'Role / Department',
    colTargetShift: 'Target Shift',
    colLanguages: 'Languages',
    colTodayStatus: "Today's Status",
    colTotalHrs: 'Total Worked Hours',
    colActionsLbl: 'Actions',
    editShiftBtn: 'Edit Shift',
    deletedArchiveTitle: 'Deleted Employees Archive',
    noArchivedYet: 'No archived employees yet.',
    colName: 'Name',
    colRole: 'Role',
    colShift: 'Shift',
    colAction: 'Action',
    restoreBtn2: 'Restore',
    reportsAdvTitle: 'Advanced Reports & Payroll Center',
    reportsAdvDesc: 'Generate, filter and export attendance & payroll summaries for all 30+ employees',
    exportPayrollBtn: 'Export Payroll Summary CSV',
    exportDetailedBtn: 'Export Detailed Shift CSV',
    printPdfBtn: 'Print / PDF Report',
    automatedReports: 'Automated Reports Recipient:',
    fromLabel2: 'From:',
    toLabel2: 'To:',
    thisMonthBtn: 'This Month',
    past30Btn: 'Past 30 Days',
    timeLogsTableTitle: 'Time Logs Table',
    colDate: 'Date',
    colEmployee: 'Employee',
    colTask: 'Task / Project',
    colHours: 'Hours',
    colTimestamp: 'Recorded at',
    noLogsFilter: 'No logs yet for the selected filters.',
    totalHoursLabel: 'hrs total',
    // Kiosk
    kioskBadge: 'Kiosk Mode',
    welcomeLabel: 'Welcome,',
    roleLabel: 'Role:',
    targetShiftLabel: 'Target Shift:',
    billableTimerLabel: 'Billable Working Time',
    selectBreakType: 'Select Break Type:',
    smokBreak: 'Smoke Break',
    lunchBreak: 'Lunch Break',
    coffeeBreak: 'Coffee Break',
    shortBreak: 'Short Break',
    clockInBtn: 'Clock In (Start Work)',
    pauseBreakBtn: 'Pause / Break...',
    clockOutBtn: 'Clock Out (Left Office)',
    resumeWorkBtn: 'Resume Work',
    reopenBtn: 'Re-open / Clock In Again',
    shiftHistoryTitle: "Today's Shift History",
    liveLabel: 'LIVE — WORKED TODAY',
    onBreakLabel: 'ON BREAK',
    setupTabTitle: 'PC Setup',
    setupHeader: 'Work PC Setup',
    setupSubheader: 'Just 3 steps to enable automatic time tracking',
    step1Header: 'Install ActivityWatch',
    step1Text: 'This program monitors when you are active at your computer. Download and install it (click "Next" through setup).',
    step1DownloadBtn: 'Download ActivityWatch',
    step1TrayNote: 'After installation, a tray icon will appear near the clock',
    step2Header: 'Download Limassol Tracker',
    step2Text: 'A small helper app that connects ActivityWatch with the time tracking system.',
    step2DownloadBtn: 'Download LimassolTracker.exe',
    step2FolderNote: 'Place this executable file in any convenient folder on your Desktop',
    step3Header: 'Run & Select Your Name',
    step3Text: 'Launch LimassolTracker.exe — a window with a dropdown list will open. Select your name and click "Save and Run".',
    step3DoneBadge: 'Done! The timer will automatically track when you are active',
    step3AutostartNote: 'The tracker will automatically start with Windows on next login.',
    autostartTipTitle: 'Tip: To run the tracker automatically when your PC turns on:',
    autostartTipText: 'No manual setup needed — startup is configured automatically.',
  },
} as const;

interface Employee {
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
}

interface TimeLog {
  id: string;
  date: string;
  employeeId: string;
  employeeName: string;
  hours: number;
  projectTask: string;
  timestamp: string;
}

interface ShiftEvent {
  id: string;
  type: 'clock_in' | 'clock_out' | 'break_start' | 'break_end';
  label: string;
  time: string;   // Cyprus display time e.g. "11:03 AM"
  timestamp: number; // unix ms for calculations
  breakType?: string;
}

const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-8',
    name: 'Maximilian Talory',
    username: 'maximilian',
    pin: '9761',
    email: 'maximilian@mtquotes.co.uk',
    languages: ['EN', 'DE'],
    role: 'Senior CS Agent',
    expectedShift: '11:30 AM',
    status: 'checked_in',
    checkInTime: '11:30 AM',
  },
  {
    id: 'emp-9',
    name: 'James White',
    username: 'jameswhite',
    pin: '5731',
    email: 'james@mtquotes.co.uk',
    languages: ['EN'],
    role: 'CS Agent',
    expectedShift: '11:00 AM',
    status: 'checked_in',
    checkInTime: '10:00 AM',
  },
  {
    id: 'emp-10',
    name: 'Daniel Bryce',
    username: 'danielbryce',
    pin: '7192',
    languages: ['EN'],
    role: 'CS Agent',
    expectedShift: '11:00 AM',
    status: 'expected',
  },
  {
    id: 'emp-1',
    name: 'Philippe',
    username: 'philippe',
    pin: '1234',
    languages: ['FR'],
    role: 'CS Agent',
    expectedShift: '11:00 AM',
    status: 'expected',
  },
  {
    id: 'emp-2',
    name: 'Emily',
    username: 'emily',
    pin: '1234',
    languages: ['EN', 'ES'],
    role: 'CS Agent',
    expectedShift: '11:00 AM',
    status: 'expected',
  },
  {
    id: 'emp-3',
    name: 'Chriss Baker',
    username: 'chriss',
    pin: '1234',
    languages: ['EN'],
    role: 'CS Agent',
    expectedShift: '11:00 AM',
    status: 'expected',
  },
  {
    id: 'emp-4',
    name: 'Mark Owen',
    username: 'mark',
    pin: '1234',
    languages: ['EN'],
    role: 'CS Agent',
    expectedShift: '11:00 AM',
    status: 'expected',
  },
  {
    id: 'emp-5',
    name: 'Grace',
    username: 'grace',
    pin: '1234',
    languages: ['EN'],
    role: 'CS Agent',
    expectedShift: '11:00 AM',
    status: 'expected',
  },
  {
    id: 'emp-6',
    name: 'Mauna Hachem',
    username: 'mauna',
    pin: '1234',
    languages: ['AR', 'FR'],
    role: 'CS Agent',
    expectedShift: '11:00 AM',
    status: 'expected',
  },
  {
    id: 'emp-7',
    name: 'Alex Morgan',
    username: 'alex',
    pin: '1234',
    languages: ['EN'],
    role: 'CS Agent',
    expectedShift: '11:00 AM',
    status: 'expected',
  },
  { id: 'emp-10b', name: 'Lorenzo', username: 'lorenzo', pin: '1234', languages: ['EN'], role: 'Employee', expectedShift: '09:00 AM', status: 'expected' },
  { id: 'emp-11', name: 'Dario', username: 'dario', pin: '1234', languages: ['EN'], role: 'Employee', expectedShift: '09:00 AM', status: 'expected' },
  { id: 'emp-12', name: 'Tomas', username: 'tomas', pin: '1234', languages: ['EN'], role: 'Employee', expectedShift: '09:00 AM', status: 'expected' },
  { id: 'emp-13', name: 'Dylan 2', username: 'dylan2', pin: '1234', languages: ['EN'], role: 'Employee', expectedShift: '09:00 AM', status: 'expected' },
  { id: 'emp-14', name: 'John', username: 'john', pin: '1234', languages: ['EN'], role: 'Employee', expectedShift: '09:00 AM', status: 'expected' },
  { id: 'emp-15', name: 'Tony', username: 'tony', pin: '1234', languages: ['EN'], role: 'Employee', expectedShift: '09:00 AM', status: 'expected' },
  { id: 'emp-16', name: 'Damien', username: 'damien', pin: '1234', languages: ['EN'], role: 'Employee', expectedShift: '09:00 AM', status: 'expected' },
  { id: 'emp-17', name: 'Jonathan', username: 'jonathan', pin: '1234', languages: ['EN'], role: 'Employee', expectedShift: '09:00 AM', status: 'expected' },
  { id: 'emp-18', name: 'Wolfgang', username: 'wolfgang', pin: '1234', languages: ['EN'], role: 'Employee', expectedShift: '09:00 AM', status: 'expected' },
  { id: 'emp-19', name: 'Mila', username: 'mila', pin: '1234', languages: ['EN'], role: 'Employee', expectedShift: '09:00 AM', status: 'expected' },
  { id: 'emp-20', name: 'Daniel N', username: 'danieln', pin: '1234', languages: ['EN'], role: 'Employee', expectedShift: '09:00 AM', status: 'expected' },
  { id: 'emp-21', name: 'Daniel B', username: 'danielb', pin: '1234', languages: ['EN'], role: 'Employee', expectedShift: '09:00 AM', status: 'expected' },
  { id: 'emp-22', name: 'ger1', username: 'ger1', pin: '1234', languages: ['EN'], role: 'Employee', expectedShift: '09:00 AM', status: 'expected' },
  { id: 'emp-23', name: 'ger2', username: 'ger2', pin: '1234', languages: ['EN'], role: 'Employee', expectedShift: '09:00 AM', status: 'expected' },
  { id: 'emp-24', name: 'ger3', username: 'ger3', pin: '1234', languages: ['EN'], role: 'Employee', expectedShift: '09:00 AM', status: 'expected' },
  { id: 'emp-25', name: 'Messi', username: 'messi', pin: '1234', languages: ['EN'], role: 'Employee', expectedShift: '09:00 AM', status: 'expected' },
  { id: 'emp-26', name: 'Andres', username: 'andres', pin: '1234', languages: ['EN', 'ES'], role: 'CS Agent', expectedShift: '11:00 AM', status: 'expected' },
  { id: 'emp-27', name: 'Christine', username: 'christine', pin: '1234', languages: ['EN'], role: 'CS Agent', expectedShift: '09:00 AM', status: 'expected' },
];

const INITIAL_LOGS: TimeLog[] = [];

export default function TeamTimeTrackerPage({ initialTab = 'timeTracker' }: { initialTab?: 'timeTracker' | 'employees' | 'reports' | 'setup' }) {
  const [isAllowedDomain, setIsAllowedDomain] = useState<boolean | null>(null);
  // const [currentDomain, setCurrentDomain] = useState<string>('');
  
  // Auth & Roles System
  type AuthRole = 'admin' | 'user';
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authRole, setAuthRole] = useState<AuthRole | null>(null);
  const [activeEmployee, setActiveEmployee] = useState<Employee | null>(null);

  // Login Form States
  // Login Form States
  const [loginUsername, setLoginUsername] = useState<string>('');
  const [loginPin, setLoginPin] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');
  
  // Theme state: 'dark' | 'light'
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const T = TRANSLATIONS.en;

  const [cyprusTime, setCyprusTime] = useState<string>('');
  const [cyprusDate, setCyprusDate] = useState<string>('');
  
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [deletedEmployees, setDeletedEmployees] = useState<Employee[]>([]);
  const [logs, setLogs] = useState<TimeLog[]>(INITIAL_LOGS);
  const [showDeletedArchive, setShowDeletedArchive] = useState(false);
  
  const [filterLang, setFilterLang] = useState<string>('ALL');

  // Main Navigation Pages/Tabs: 'timeTracker' | 'employees' | 'reports'
  const [activeTab, setActiveTab] = useState<'timeTracker' | 'employees' | 'reports' | 'setup'>(initialTab);

  const handleTabChange = (tab: 'timeTracker' | 'employees' | 'reports' | 'setup', url: string) => {
    setActiveTab(tab);
    if (tab === 'reports') {
      const today = new Date().toISOString().split('T')[0];
      setReportStartDate(today);
      setLogDate(today);
    }
    if (typeof window !== 'undefined') {
      window.history.pushState(null, '', url);
    }
  };

  // Clockify Backup Integration State
  const [clockifyApiKey, setClockifyApiKey] = useState<string>('');
  const [clockifyWorkspaceId, setClockifyWorkspaceId] = useState<string>('');
  const [showClockifyModal, setShowClockifyModal] = useState<boolean>(false);
  const [clockifySyncStatus, setClockifySyncStatus] = useState<string>('');
  const [clockifyConnectedUser, setClockifyConnectedUser] = useState<string>('');
  const [clockifyLastSynced, setClockifyLastSynced] = useState<string>('');

  // Real-Time Dashboard State
  type LiveStatus = { employeeId: string; employeeName?: string; status: 'online' | 'offline'; task: string; duration: string; startTime: string; };
  const [liveStatuses, setLiveStatuses] = useState<Record<string, LiveStatus>>({});


  // View mode & Shift Editing State
  const [viewMode] = useState<'calendar' | 'grid' | 'cards'>('grid');
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [editingTimesEmp, setEditingTimesEmp] = useState<Employee | null>(null);
  const [editTimesCheckIn, setEditTimesCheckIn] = useState<string>('');
  const [editTimesCheckOut, setEditTimesCheckOut] = useState<string>('');
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => new Date());

  // Advanced Reporting State
  const [reportStartDate, setReportStartDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [reportEndDate, setReportEndDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [showPrintReportModal, setShowPrintReportModal] = useState<boolean>(false);


  // Search & Filter for 30+ Employees
  const [empSearchQuery, setEmpSearchQuery] = useState('');
  const [breakElapsedSeconds, setBreakElapsedSeconds] = useState(0);
  const [empStatusFilter, setEmpStatusFilter] = useState<string>('ALL');
  const [empSortOrder, setEmpSortOrder] = useState<'name_asc' | 'name_desc' | 'last_online' | 'last_registered'>('name_asc');

  // Modals
  const [showAddLogModal, setShowAddLogModal] = useState(false);
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);

  // New Log Form
  const [logEmployeeId, setLogEmployeeId] = useState<string>('');
  const [logDate, setLogDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [logHours, setLogHours] = useState<number>(8);
  const [logProjectTask, setLogProjectTask] = useState<string>('General Operations');

  // New Employee Form
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpUsername, setNewEmpUsername] = useState('');
  const [newEmpPin, setNewEmpPin] = useState('1234');
  const [newEmpRole, setNewEmpRole] = useState('');
  const [newEmpLangs, setNewEmpLangs] = useState('EN');
  const [newEmpShift, setNewEmpShift] = useState('11:00 AM');
  const [newEmpTeam, setNewEmpTeam] = useState('');

  // Edit Employee Form
  const [editEmpName, setEditEmpName] = useState('');
  const [editEmpUsername, setEditEmpUsername] = useState('');
  const [editEmpPin, setEditEmpPin] = useState('');
  const [editEmpRole, setEditEmpRole] = useState('');
  const [editEmpLangs, setEditEmpLangs] = useState('');
  const [editEmpShift, setEditEmpShift] = useState('');
  const [editEmpTeam, setEditEmpTeam] = useState('');

  // Kiosk Live Timer & Break Menu State
  const [showBreakMenu, setShowBreakMenu] = useState<boolean>(false);
  const [kioskBillableTime, setKioskBillableTime] = useState<string>('00:00:00');
  const [lastActivityMap, setLastActivityMap] = useState<Record<string, number>>({});

  // Shift Event History (persisted per employee per day)
  const [shiftEvents, setShiftEvents] = useState<ShiftEvent[]>([]);

  // ----------------------------------------------------
  // Break Auto-Switch Ticking Clock Effect
  // ----------------------------------------------------
  useEffect(() => {
    if (authRole === 'user' && activeEmployee && activeEmployee.status === 'on_break' && activeEmployee.breakStartTimestamp) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - activeEmployee.breakStartTimestamp!) / 1000);
        setBreakElapsedSeconds(elapsed);
        
        let maxSec = -1;
        if (activeEmployee.breakType === '🚬 Smoke Break' || activeEmployee.breakType?.includes('Smoke')) maxSec = 10 * 60;
        else if (activeEmployee.breakType === '🥪 Lunch Break' || activeEmployee.breakType?.includes('Lunch')) maxSec = 60 * 60;
        else if (activeEmployee.breakType === '☕ Coffee / Rest' || activeEmployee.breakType?.includes('Coffee')) maxSec = 15 * 60;
        
        if (maxSec > 0 && elapsed >= maxSec) {
          handleTakeBreak('❓ Short Break / Other');
        }
      }, 1000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authRole, activeEmployee]);

  const formatBreakTime = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // ----------------------------------------------------
  // Component Render
  // ----------------------------------------------------

  // Helper: persist events — used via addShiftEvent
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const saveShiftEvents = (empId: string, events: ShiftEvent[]) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const key = `shift_events_${empId}_${todayStr}`;
    localStorage.setItem(key, JSON.stringify(events));
    setShiftEvents(events);
  };

  const addShiftEvent = (empId: string, event: Omit<ShiftEvent, 'id'>) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const key = `shift_events_${empId}_${todayStr}`;
    const existing: ShiftEvent[] = (() => {
      try { return JSON.parse(localStorage.getItem(key) || '[]'); } catch { return []; }
    })();
    const newEvent: ShiftEvent = { ...event, id: `ev-${Date.now()}` };
    const updated = [...existing, newEvent];
    localStorage.setItem(key, JSON.stringify(updated));
    setShiftEvents(updated);
    return updated;
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (authRole === 'user' && activeEmployee && (activeEmployee.status === 'checked_in' || activeEmployee.status === 'on_break')) {
      const updateClock = () => {
        let elapsedSec = activeEmployee.accumulatedSeconds || 0;
        if (activeEmployee.status === 'checked_in' && activeEmployee.checkInTimestamp) {
          elapsedSec += Math.max(0, Math.floor((Date.now() - activeEmployee.checkInTimestamp) / 1000));
        }
        const hrs = Math.floor(elapsedSec / 3600);
        const mins = Math.floor((elapsedSec % 3600) / 60);
        const secs = elapsedSec % 60;
        setKioskBillableTime(
          `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
        );
      };

      updateClock();
      timer = setInterval(updateClock, 1000);
    }
    return () => clearInterval(timer);
  }, [authRole, activeEmployee]);

  // 1. Set current domain & load Clockify settings
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsAllowedDomain(true);

      // Always ensure API key and workspace ID are set
      const DEFAULT_KEY = atob('ZjUzNDMxOTUtNGZlMi00NGE1LWFlMzAtMWNkOWY2NmNkMDY5');
      const DEFAULT_WS  = '6a7af4d0c9b4fd88dbd1eaa9';
      // Only set if missing (don't overwrite manual user changes)
      if (!localStorage.getItem('clockify_api_key') || !localStorage.getItem('clockify_api_key')?.trim()) {
        localStorage.setItem('clockify_api_key', DEFAULT_KEY);
      }
      if (!localStorage.getItem('clockify_workspace_id') || !localStorage.getItem('clockify_workspace_id')?.trim()) {
        localStorage.setItem('clockify_workspace_id', DEFAULT_WS);
      }

      const savedKey = localStorage.getItem('clockify_api_key') || DEFAULT_KEY;
      const savedWs  = localStorage.getItem('clockify_workspace_id') || DEFAULT_WS;
      setClockifyApiKey(savedKey);
      setClockifyWorkspaceId(savedWs);
      localStorage.setItem('clockify_api_key', savedKey);
      localStorage.setItem('clockify_workspace_id', savedWs);

      const savedUser = localStorage.getItem('clockify_connected_user') || '';
      if (savedUser) setClockifyConnectedUser(savedUser);
    }
  }, []);

  // 2. Cyprus Live Clock (Asia/Nicosia timezone)
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const timeFormatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Nicosia',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
      const dateFormatter = new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Nicosia',
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      setCyprusTime(timeFormatter.format(now));
      setCyprusDate(dateFormatter.format(now));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Helper to filter out archived/deleted employees
  const filterActiveEmps = (list: Employee[], deletedList: Employee[]): Employee[] => {
    const deletedKeys = new Set(
      deletedList.map(d => (d.username || d.name).toLowerCase().trim().replace(/\s+/g, ''))
    );
    return list.filter(e => {
      const key = (e.username || e.name).toLowerCase().trim().replace(/\s+/g, '');
      return !deletedKeys.has(key);
    });
  };

  // 3. Load employees from Firestore (source of truth), fallback to localStorage
  useEffect(() => {
    const loadEmployees = async () => {
      let currentDeleted: Employee[] = [];
      const savedDeleted = localStorage.getItem('team_deleted_employees_v1');
      if (savedDeleted) {
        try {
          const parsed = JSON.parse(savedDeleted) as Employee[];
          const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
          const now = Date.now();
          currentDeleted = parsed.filter(emp => {
            const age = now - (emp.archivedAt || now);
            return age <= SEVEN_DAYS_MS;
          });
          setDeletedEmployees(currentDeleted);
          localStorage.setItem('team_deleted_employees_v1', JSON.stringify(currentDeleted));
        } catch {}
      }

      try {
        const fsData = await fetchFirestoreEmployees();
        if (fsData && Object.keys(fsData).length > 0) {
          const fsEmps: Employee[] = Object.values(fsData).map((doc, idx) => ({
            id: `emp-fs-${doc.username}`,
            name: doc.name || doc.username,
            username: doc.username,
            pin: doc.pin || '1234',
            role: doc.role || 'Team Member',
            languages: doc.languages || [],
            expectedShift: doc.expectedShift || '',
            status: doc.status || 'expected',
            checkInTime: doc.checkInTime,
            checkOutTime: doc.checkOutTime,
            sortOrder: doc.sortOrder ?? idx,
            team: doc.team || '',
            trackingClient: doc.trackingClient,
            lastSeen: doc.lastSeen,
          }));
          
          const activeOnly = filterActiveEmps(fsEmps, currentDeleted);
          activeOnly.sort((a, b) => (a.sortOrder ?? 999) - (b.sortOrder ?? 999));
          
          setEmployees(activeOnly);
          localStorage.setItem('team_employees_v5', JSON.stringify(activeOnly));

          // Restore session
          const savedPinAuth = sessionStorage.getItem('team_tracker_auth');
          const savedRole = sessionStorage.getItem('team_tracker_role') as AuthRole;
          const savedEmpId = sessionStorage.getItem('team_tracker_emp_id');
          if (savedPinAuth === 'true') {
            setIsAuthenticated(true);
            if (savedRole === 'admin') {
              setAuthRole('admin');
            } else if (savedRole === 'user' && savedEmpId) {
              setAuthRole('user');
              const emp = activeOnly.find((e: Employee) => e.id === savedEmpId || e.username === savedEmpId);
              if (emp) setActiveEmployee(emp);
            }
          }
          return;
        }
      } catch {}

      // Fallback to localStorage if Firestore unavailable
      const savedEmployees = localStorage.getItem('team_employees_v5');
      let parsedEmployees: Employee[] = INITIAL_EMPLOYEES;
      if (savedEmployees) {
        try {
          parsedEmployees = JSON.parse(savedEmployees);
          parsedEmployees = filterActiveEmps(parsedEmployees, currentDeleted);
          setEmployees(parsedEmployees);
        } catch {}
      }
      const savedPinAuth = sessionStorage.getItem('team_tracker_auth');
      const savedRole = sessionStorage.getItem('team_tracker_role') as AuthRole;
      const savedEmpId = sessionStorage.getItem('team_tracker_emp_id');
      if (savedPinAuth === 'true') {
        setIsAuthenticated(true);
        if (savedRole === 'admin') { setAuthRole('admin'); }
        else if (savedRole === 'user' && savedEmpId) {
          setAuthRole('user');
          const emp = parsedEmployees.find((e: Employee) => e.id === savedEmpId);
          if (emp) setActiveEmployee(emp);
        }
      }
    };

    loadEmployees();

    const savedTheme = localStorage.getItem('team_theme');
    if (savedTheme === 'light' || savedTheme === 'dark') setTheme(savedTheme);

    const savedLogs = localStorage.getItem('team_logs_v5');
    if (savedLogs) { try { setLogs(JSON.parse(savedLogs)); } catch {} }
  }, []);

  // Firestore REST API Real-Time Sync (poll every 4 seconds)
  useEffect(() => {
    const syncFirestore = async () => {
      const fsData = await fetchFirestoreEmployees();
      if (!fsData || Object.keys(fsData).length === 0) return;

      setEmployees((prevEmps) => {
        let hasChanges = false;
        const deletedKeys = new Set(
          deletedEmployees.map(d => (d.username || d.name).toLowerCase().trim().replace(/\s+/g, ''))
        );

        const newEmps = prevEmps.filter(e => {
          const k = (e.username || e.name).toLowerCase().trim().replace(/\s+/g, '');
          return !deletedKeys.has(k);
        }).map((emp) => {
          const docId = (emp.username || emp.name).toLowerCase().replace(/\s+/g, '');
          const data = fsData[docId];
          if (data) {
            const updatedStatus = data.status || emp.status;
            const updatedIn = data.checkInTime !== undefined ? data.checkInTime : emp.checkInTime;
            const updatedOut = data.checkOutTime !== undefined ? data.checkOutTime : emp.checkOutTime;
            const updatedLastSeen = data.lastSeen || emp.lastSeen;
            const updatedTrackingClient = data.trackingClient || emp.trackingClient;
            if (
              updatedStatus !== emp.status ||
              updatedIn !== emp.checkInTime ||
              updatedOut !== emp.checkOutTime ||
              updatedLastSeen !== emp.lastSeen ||
              updatedTrackingClient !== emp.trackingClient
            ) {
              hasChanges = true;
              return {
                ...emp,
                status: updatedStatus,
                checkInTime: updatedIn,
                checkOutTime: updatedOut,
                lastSeen: updatedLastSeen,
                trackingClient: updatedTrackingClient,
              };
            }
          }
          return emp;
        });
        if (hasChanges || newEmps.length !== prevEmps.length) {
          localStorage.setItem('team_employees_v5', JSON.stringify(newEmps));
          return newEmps;
        }
        return prevEmps;
      });

    };

    syncFirestore();
    const interval = setInterval(syncFirestore, 4000);
    return () => clearInterval(interval);
  }, [deletedEmployees]);

  // Load shift events when employee logs in
  useEffect(() => {
    if (authRole === 'user' && activeEmployee) {
      const todayStr = new Date().toISOString().split('T')[0];
      const key = `shift_events_${activeEmployee.id}_${todayStr}`;
      try {
        const saved = JSON.parse(localStorage.getItem(key) || '[]');
        setShiftEvents(saved);
      } catch { setShiftEvents([]); }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authRole, activeEmployee?.id]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('team_theme', nextTheme);
  };

  const saveEmployees = (updated: Employee[]) => {
    setEmployees(updated);
    localStorage.setItem('team_employees_v5', JSON.stringify(updated));
    // Sync ALL employee data to Firestore (single source of truth)
    updated.forEach((emp, idx) => {
      const username = emp.username || emp.name.toLowerCase().replace(/\s+/g, '');
      saveFirestoreEmployee(username, {
        name: emp.name,
        pin: emp.pin,
        role: emp.role,
        languages: emp.languages,
        expectedShift: emp.expectedShift,
        status: emp.status,
        checkInTime: emp.checkInTime,
        checkOutTime: emp.checkOutTime,
        sortOrder: idx,
        team: emp.team || '',
      });
    });
  };

  const saveLogs = (updated: TimeLog[]) => {
    setLogs(updated);
    localStorage.setItem('team_logs_v5', JSON.stringify(updated));
  };

  // Login handler
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const u = loginUsername.trim().toLowerCase();
    
    // Admin check
    if ((u === 'robert' || u === 'admin' || u === 'manager') && loginPin === '347581') {
      setIsAuthenticated(true);
      setAuthRole('admin');
      setActiveEmployee(null);
      sessionStorage.setItem('team_tracker_auth', 'true');
      sessionStorage.setItem('team_tracker_role', 'admin');
      sessionStorage.removeItem('team_tracker_emp_id');
      return;
    }

    // Employee check — only search in currently active (non-deleted) employees list
    const targetEmp = employees.find(e =>
      (e.username && e.username.toLowerCase() === u) ||
      e.name.toLowerCase() === u
    );

    if (!targetEmp) {
      // Could be a deleted employee trying old credentials — block with generic error
      setLoginError('Invalid Username or PIN.');
      return;
    }

    const expectedPin = targetEmp.pin || '1234';
    if (loginPin === expectedPin || loginPin === '347581') {
      setIsAuthenticated(true);
      setAuthRole('user');
      setActiveEmployee(targetEmp);
      sessionStorage.setItem('team_tracker_auth', 'true');
      sessionStorage.setItem('team_tracker_role', 'user');
      sessionStorage.setItem('team_tracker_emp_id', targetEmp.id);
    } else {
      setLoginError('Invalid Username or PIN.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setAuthRole(null);
    setActiveEmployee(null);
    setLoginPin('');
    setLoginError('');
    sessionStorage.removeItem('team_tracker_auth');
    sessionStorage.removeItem('team_tracker_role');
    sessionStorage.removeItem('team_tracker_emp_id');
  };

  // Kiosk Break & Clock Out Handlers
  const handleTakeBreak = (bType: string) => {
    if (!activeEmployee) return;
    const startTs = activeEmployee.checkInTimestamp || Date.now();
    const currentSessionSec = Math.max(0, Math.floor((Date.now() - startTs) / 1000));
    const totalAccumulated = (activeEmployee.accumulatedSeconds || 0) + currentSessionSec;
    const nowTime = cyprusTime || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const nowMs = Date.now();

    addShiftEvent(activeEmployee.id, {
      type: 'break_start',
      label: bType,
      time: nowTime,
      timestamp: nowMs,
      breakType: bType,
    });

    const updated = employees.map(e => e.id === activeEmployee.id ? {
      ...e,
      status: 'on_break' as const,
      breakType: bType,
      breakStartTimestamp: nowMs,
      accumulatedSeconds: totalAccumulated,
    } : e);

    saveEmployees(updated);
    setActiveEmployee(prev => prev ? {
      ...prev,
      status: 'on_break',
      breakType: bType,
      breakStartTimestamp: nowMs,
      accumulatedSeconds: totalAccumulated,
    } : null);
    setShowBreakMenu(false);
    setBreakElapsedSeconds(0);
  };

  const handleResumeWork = () => {
    if (!activeEmployee) return;
    const nowTs = Date.now();
    const nowTime = cyprusTime || new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    addShiftEvent(activeEmployee.id, {
      type: 'break_end',
      label: '▶️ Resumed Work',
      time: nowTime,
      timestamp: nowTs,
    });

    const updated = employees.map(e => e.id === activeEmployee.id ? {
      ...e,
      status: 'checked_in' as const,
      breakType: undefined,
      breakStartTimestamp: undefined,
      checkInTimestamp: nowTs,
    } : e);

    saveEmployees(updated);
    setActiveEmployee(prev => prev ? {
      ...prev,
      status: 'checked_in',
      breakType: undefined,
      breakStartTimestamp: undefined,
      checkInTimestamp: nowTs,
    } : null);
  };

  const handleClockOutSimple = () => {
    if (!activeEmployee) return;
    const nowTime = cyprusTime || '07:00 PM';
    const nowTs = Date.now();

    let finalSec = activeEmployee.accumulatedSeconds || 0;
    if (activeEmployee.status === 'checked_in' && activeEmployee.checkInTimestamp) {
      finalSec += Math.max(0, Math.floor((nowTs - activeEmployee.checkInTimestamp) / 1000));
    }
    const finalHours = Number((finalSec / 3600).toFixed(1)) || 8;
    const hh = Math.floor(finalSec / 3600);
    const mm = Math.floor((finalSec % 3600) / 60);
    const totalLabel = `${hh}h ${mm}m total`;

    addShiftEvent(activeEmployee.id, {
      type: 'clock_out',
      label: `🔴 Left Office — ${totalLabel}`,
      time: nowTime,
      timestamp: nowTs,
    });

    const updated = employees.map(e => e.id === activeEmployee.id ? {
      ...e,
      status: 'completed' as const,
      checkOutTime: nowTime,
    } : e);

    saveEmployees(updated);
    setActiveEmployee(prev => prev ? {
      ...prev,
      status: 'completed',
      checkOutTime: nowTime,
    } : null);

    const todayStr = new Date().toISOString().split('T')[0];
    const autoLog: TimeLog = {
      id: `log-${Date.now()}`,
      date: todayStr,
      employeeId: activeEmployee.id,
      employeeName: activeEmployee.name,
      hours: finalHours,
      projectTask: `Shift Attendance (${activeEmployee.checkInTime || '11:00 AM'} - ${nowTime})`,
      timestamp: `${activeEmployee.checkInTime || '11:00 AM'} - ${nowTime}`,
    };
    saveLogs([autoLog, ...logs]);
  };

  // Add Time Log Submit
  const handleCreateLog = (e: React.FormEvent) => {
    e.preventDefault();
    const targetEmp = employees.find(e => e.id === logEmployeeId);
    if (!targetEmp) return;

    const newLog: TimeLog = {
      id: `log-${Date.now()}`,
      date: logDate,
      employeeId: targetEmp.id,
      employeeName: targetEmp.name,
      hours: Number(logHours),
      projectTask: logProjectTask.trim() || 'General Operations',
      timestamp: cyprusTime || '11:00 AM',
    };

    saveLogs([newLog, ...logs]);
    setShowAddLogModal(false);
    setLogProjectTask('General Operations');
  };

  // Add Employee Submit
  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpUsername.trim()) return;

    const uname = newEmpUsername.trim().toLowerCase().replace(/\s+/g, '');

    // Purge from deleted list if restoring or re-creating
    const newDeleted = deletedEmployees.filter(d => (d.username || d.name).toLowerCase().trim().replace(/\s+/g, '') !== uname);
    if (newDeleted.length !== deletedEmployees.length) {
      setDeletedEmployees(newDeleted);
      localStorage.setItem('team_deleted_employees_v1', JSON.stringify(newDeleted));
    }

    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      name: newEmpName.trim() || newEmpUsername.trim(),
      username: uname,
      pin: newEmpPin.trim() || '1234',
      languages: newEmpLangs ? newEmpLangs.split(',').map(l => l.trim().toUpperCase()).filter(Boolean) : [],
      role: newEmpRole.trim() || 'Team Member',
      expectedShift: newEmpShift,
      status: 'expected',
      team: newEmpTeam.trim() || '',
    };

    saveEmployees([...employees.filter(e => (e.username || '').toLowerCase().replace(/\s+/g, '') !== uname), newEmp]);
    setNewEmpName('');
    setNewEmpUsername('');
    setNewEmpPin('1234');
    setNewEmpRole('');
    setNewEmpLangs('');
    setNewEmpShift('');
    setNewEmpTeam('');
    setShowAddEmpModal(false);
  };

  // Helper to parse time strings like "11:04 AM" or "05:27:16 pm" into "HH:mm" 24h format for input type="time"
  const parseTo24HourTime = (timeStr?: string): string => {
    if (!timeStr) return '';
    const match = timeStr.match(/(\d+):(\d+)(?::\d+)?(?:\s*(AM|PM))?/i);
    if (!match) return '';
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[3] ? match[3].toUpperCase() : null;
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
  };

  // Helper to format 24h "HH:mm" time back to "hh:mm AM/PM" for display
  const format24To12Hour = (time24?: string): string => {
    if (!time24) return '';
    const parts = time24.split(':');
    if (parts.length < 2) return time24;
    let hours = parseInt(parts[0], 10);
    const minutes = parseInt(parts[1], 10);
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
  };

  // Converts ANY raw time string ("08 pm", "12 pm", "20 00", "2000", "1100", "08:00:00 pm", "17:27") into clean "08:00 PM"
  const formatNiceDisplayTime = (timeStr?: string): string => {
    if (!timeStr) return '-';
    const clean = timeStr.trim();
    if (clean === '-' || clean === '') return '-';

    if (/^\d{4}$/.test(clean)) {
      const hrs = parseInt(clean.slice(0, 2), 10);
      const mins = parseInt(clean.slice(2, 4), 10);
      return format24To12Hour(`${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}`);
    }

    if (/^\d{1,2}\s+\d{2}$/.test(clean)) {
      const parts = clean.split(/\s+/);
      return format24To12Hour(`${String(parseInt(parts[0], 10)).padStart(2, '0')}:${parts[1]}`);
    }

    const hrOnlyMatch = clean.match(/^(\d{1,2})\s*(AM|PM)$/i);
    if (hrOnlyMatch) {
      let hrs = parseInt(hrOnlyMatch[1], 10);
      const period = hrOnlyMatch[2].toUpperCase();
      if (period === 'PM' && hrs < 12) hrs += 12;
      if (period === 'AM' && hrs === 12) hrs = 0;
      return format24To12Hour(`${String(hrs).padStart(2, '0')}:00`);
    }

    if (/^\d{1,2}$/.test(clean)) {
      const hrs = parseInt(clean, 10);
      return format24To12Hour(`${String(hrs).padStart(2, '0')}:00`);
    }

    const h24 = parseTo24HourTime(clean);
    if (h24) {
      return format24To12Hour(h24);
    }

    return clean;
  };

  // Helper to parse time strings like "11:04 AM" or "19:15" into total minutes
  const parseTimeToMinutes = (timeStr?: string): number => {
    if (!timeStr) return 0;
    const match = timeStr.match(/(\d+):(\d+)(?:\s*(AM|PM))?/i);
    if (!match) return 0;
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const period = match[3] ? match[3].toUpperCase() : null;
    if (period === 'PM' && hours < 12) hours += 12;
    if (period === 'AM' && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  // Helper to calculate exact hours between arrival and departure
  const calculateExactHours = (checkIn?: string, checkOut?: string): number => {
    if (!checkIn || !checkOut) return 8;
    const inMins = parseTimeToMinutes(checkIn);
    const outMins = parseTimeToMinutes(checkOut);
    if (outMins <= inMins) return 8;
    const diff = (outMins - inMins) / 60;
    return Math.round(diff * 10) / 10;
  };

  // Helper to merge local state with Clockify live statuses
  const getMergedEmployeeState = (emp: Employee) => {
    let status = emp.status;
    let checkIn = emp.checkInTime;
    let checkOut = emp.checkOutTime;
    let liveDurationStr = '';
    let isLiveFromClockify = false;
    let isLiveFromAW = false;

    if (liveStatuses[emp.id] && liveStatuses[emp.id].status === 'online') {
      status = 'checked_in';
      checkIn = liveStatuses[emp.id].startTime;
      checkOut = undefined;
      liveDurationStr = liveStatuses[emp.id].duration;
      isLiveFromClockify = true;
    }

    if (emp.trackingClient === 'AW' && status === 'checked_in') {
      if (emp.lastSeen) {
        const diffMins = (Date.now() - new Date(emp.lastSeen).getTime()) / 60000;
        if (diffMins < 5) {
          isLiveFromAW = true;
        }
      }
    }

    // Calculate live hours if working
    let activeHrsDisplay = '';
    if (status === 'checked_in' && checkIn) {
      if (isLiveFromClockify) {
        activeHrsDisplay = liveDurationStr; // Format e.g., '2h 15m'
      } else {
        const now = cyprusTime || new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Nicosia', hour: '2-digit', minute: '2-digit', hour12: true });
        const inMins = parseTimeToMinutes(checkIn);
        const outMins = parseTimeToMinutes(now);
        if (outMins > inMins) {
          const diffMs = (outMins - inMins) * 60000;
          const hrs = Math.floor(diffMs / 3600000);
          const mins = Math.floor((diffMs % 3600000) / 60000);
          activeHrsDisplay = `${hrs > 0 ? hrs + 'h ' : ''}${mins}m`;
        } else {
          activeHrsDisplay = '0m';
        }
      }
    }

    return { status, checkIn, checkOut, liveDurationStr, isLiveFromClockify, isLiveFromAW, activeHrsDisplay };
  };

  // Calendar Helpers
  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    let startingDay = firstDay.getDay() - 1;
    if (startingDay < 0) startingDay = 6;

    const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];
    
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startingDay - 1; i >= 0; i--) {
      const pDate = new Date(year, month - 1, prevMonthLastDay - i);
      const yyyy = pDate.getFullYear();
      const mm = String(pDate.getMonth() + 1).padStart(2, '0');
      const dd = String(prevMonthLastDay - i).padStart(2, '0');
      days.push({
        dateStr: `${yyyy}-${mm}-${dd}`,
        dayNum: prevMonthLastDay - i,
        isCurrentMonth: false,
      });
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const yyyy = year;
      const mm = String(month + 1).padStart(2, '0');
      const dd = String(i).padStart(2, '0');
      days.push({
        dateStr: `${yyyy}-${mm}-${dd}`,
        dayNum: i,
        isCurrentMonth: true,
      });
    }

    return days;
  };

  // Shift Status Handler with Auto-Log Creation on Departure
  const handleStatusChange = (id: string, newStatus: Employee['status'], customCheckIn?: string, customCheckOut?: string) => {
    const nowCyprus = cyprusTime || new Date().toLocaleTimeString('en-GB', { timeZone: 'Asia/Nicosia', hour: '2-digit', minute: '2-digit', hour12: true });
    
    const targetEmp = employees.find(e => e.id === id);
    if (!targetEmp) return;

    const inTime = customCheckIn || targetEmp.checkInTime || nowCyprus;
    const outTime = customCheckOut || (newStatus === 'completed' ? nowCyprus : targetEmp.checkOutTime);

    const updated = employees.map(emp => {
      if (emp.id === id) {
        return {
          ...emp,
          status: newStatus,
          checkInTime: newStatus === 'checked_in' || newStatus === 'completed' ? inTime : undefined,
          checkOutTime: newStatus === 'completed' ? outTime : undefined,
        };
      }
      return emp;
    });

    saveEmployees(updated);

    // Auto-create log entry when shift is completed with exact calculated hours
    if (newStatus === 'completed') {
      const todayStr = new Date().toISOString().split('T')[0];
      const actualHours = calculateExactHours(inTime, outTime);
      const autoLog: TimeLog = {
        id: `log-${Date.now()}`,
        date: todayStr,
        employeeId: targetEmp.id,
        employeeName: targetEmp.name,
        hours: actualHours,
        projectTask: `Shift Attendance (${inTime} - ${outTime})`,
        timestamp: `${inTime} - ${outTime}`,
      };
      saveLogs([autoLog, ...logs]);
    }
  };



  // Open Edit Times Modal (for Reports page)
  const handleOpenEditTimes = (emp: Employee) => {
    setEditingTimesEmp(emp);
    setEditTimesCheckIn(parseTo24HourTime(emp.checkInTime));
    setEditTimesCheckOut(parseTo24HourTime(emp.checkOutTime));
  };

  // Save Modified Times
  const handleSaveEditedTimes = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTimesEmp) return;

    const updatedEmployees = employees.map(emp => {
      if (emp.id === editingTimesEmp.id) {
        const updatedEmp = { ...emp };
        if (editTimesCheckIn) {
          updatedEmp.checkInTime = format24To12Hour(editTimesCheckIn);
          const parts = editTimesCheckIn.split(':');
          if (parts.length >= 2) {
            const hrs = parseInt(parts[0], 10);
            const mins = parseInt(parts[1], 10);
            const d = new Date();
            d.setHours(hrs, mins, 0, 0);
            updatedEmp.checkInTimestamp = d.getTime();
          }
        }
        if (editTimesCheckOut) {
          updatedEmp.checkOutTime = format24To12Hour(editTimesCheckOut);
          updatedEmp.status = 'completed';
        }
        return updatedEmp;
      }
      return emp;
    });
    saveEmployees(updatedEmployees);
    setEditingTimesEmp(null);
  };

  // Clear/Remove Times for an employee (e.g. if didn't arrive or wrong check in)
  const handleClearEditedTimes = (empId: string) => {
    const updatedEmployees = employees.map(emp => {
      if (emp.id === empId || emp.username === empId) {
        return {
          ...emp,
          status: 'expected' as const,
          checkInTime: undefined,
          checkOutTime: undefined,
          checkInTimestamp: undefined,
          accumulatedSeconds: 0
        };
      }
      return emp;
    });
    saveEmployees(updatedEmployees);
    setEditingTimesEmp(null);
  };


  const handleOpenEditShift = (emp: Employee) => {
    setEditingEmp(emp);
    setEditEmpName(emp.name);
    setEditEmpUsername(emp.username || emp.name.toLowerCase().replace(/\s+/g, ''));
    setEditEmpPin(emp.pin || '1234');
    setEditEmpRole(emp.role || '');
    setEditEmpLangs((emp.languages || []).join(', '));
    setEditEmpShift(emp.expectedShift || '');
    setEditEmpTeam(emp.team || '');
  };

  // Save Modified User Credentials & Info
  const handleSaveEditedShift = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmp) return;

    const langs = editEmpLangs
      ? editEmpLangs.split(',').map(l => l.trim().toUpperCase()).filter(Boolean)
      : [];

    const newUsername = editEmpUsername.trim().toLowerCase() || editingEmp.username;
    if (editingEmp.username && newUsername !== editingEmp.username) {
      deleteFirestoreEmployee(editingEmp.username);
    }

    const updated = employees.map(emp => {
      if (emp.id === editingEmp.id) {
        return {
          ...emp,
          name: editEmpName.trim() || emp.name,
          username: newUsername,
          pin: editEmpPin.trim() || emp.pin || '1234',
          role: editEmpRole.trim() || 'Team Member',
          languages: langs,
          expectedShift: editEmpShift.trim(),
          team: editEmpTeam.trim() || emp.team || '',
        };
      }
      return emp;
    });

    saveEmployees(updated);

    if (activeEmployee && (activeEmployee.id === editingEmp.id || activeEmployee.username === editingEmp.username)) {
      const selfUpdated = updated.find(e => e.id === editingEmp.id || e.username === editingEmp.username);
      if (selfUpdated) setActiveEmployee(selfUpdated);
    }

    setEditingEmp(null);
  };

  // Clean Reset for New Day
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleResetAllForNewDay = () => {
    if (window.confirm('Start a new clean day? This will reset all shift statuses to Expected for today.')) {
      const resetList = employees.map(emp => ({
        ...emp,
        status: 'expected' as const,
        checkInTime: undefined,
        checkOutTime: undefined,
      }));
      saveEmployees(resetList);
    }
  };

  // Delete Log
  const handleDeleteLog = (logId: string) => {
    saveLogs(logs.filter(l => l.id !== logId));
  };

  // Archive/Delete Employee (Auto-purged after 7 days)
  const handleDeleteEmp = (empId: string) => {
    if (window.confirm('Archive this employee? They will be kept in the Deleted folder for 7 days before auto-removal.')) {
      const emp = employees.find(e => e.id === empId || e.username === empId);
      if (!emp) return;
      const key = (emp.username || emp.name).toLowerCase().trim().replace(/\s+/g, '');
      const archivedEmp: Employee = { ...emp, archivedAt: Date.now() };
      const newDeleted = [archivedEmp, ...deletedEmployees.filter(d => (d.username || d.name).toLowerCase().trim().replace(/\s+/g, '') !== key)];
      setDeletedEmployees(newDeleted);
      localStorage.setItem('team_deleted_employees_v1', JSON.stringify(newDeleted));
      
      const username = emp.username || emp.name.toLowerCase().replace(/\s+/g, '');
      deleteFirestoreEmployee(username);

      const activeOnly = employees.filter(e => e.id !== empId && (e.username || '').toLowerCase().replace(/\s+/g, '') !== key);
      saveEmployees(activeOnly);
    }
  };

  // Delete Employee Forever (Immediate Purge)
  const handleDeleteForeverEmp = (empId: string) => {
    const emp = deletedEmployees.find(e => e.id === empId || e.username === empId);
    if (!emp) return;
    if (window.confirm(`Permanently delete "${emp.name}" forever? This action cannot be undone.`)) {
      const key = (emp.username || emp.name).toLowerCase().trim().replace(/\s+/g, '');
      const newDeleted = deletedEmployees.filter(e => (e.username || e.name).toLowerCase().trim().replace(/\s+/g, '') !== key);
      setDeletedEmployees(newDeleted);
      localStorage.setItem('team_deleted_employees_v1', JSON.stringify(newDeleted));
      
      const username = emp.username || emp.name.toLowerCase().replace(/\s+/g, '');
      purgeFirestoreEmployee(username);
    }
  };

  // Restore Employee from Archive
  const handleRestoreEmp = (empId: string) => {
    const emp = deletedEmployees.find(e => e.id === empId || e.username === empId);
    if (!emp) return;
    const key = (emp.username || emp.name).toLowerCase().trim().replace(/\s+/g, '');
    const newDeleted = deletedEmployees.filter(e => (e.username || e.name).toLowerCase().trim().replace(/\s+/g, '') !== key);
    setDeletedEmployees(newDeleted);
    localStorage.setItem('team_deleted_employees_v1', JSON.stringify(newDeleted));

    const restored: Employee = { ...emp, status: 'expected', checkInTime: undefined, checkOutTime: undefined };
    const username = restored.username || restored.name.toLowerCase().replace(/\s+/g, '');
    saveFirestoreEmployee(username, restored);
    saveEmployees([...employees.filter(e => e.id !== empId && (e.username || '').toLowerCase().replace(/\s+/g, '') !== key), restored]);
  };


  // Export Detailed CSV for Selected Date Range
  const exportFilteredLogsCSV = () => {
    const filtered = logs.filter(l => {
      if (reportStartDate && l.date < reportStartDate) return false;
      if (reportEndDate && l.date > reportEndDate) return false;
      return true;
    });

    const headers = ['Date', 'Employee Name', 'Hours Worked', 'Shift / Task Description', 'Timestamps'];
    const rows = filtered.map(l => {
      return [
        l.date,
        `"${l.employeeName}"`,
        l.hours,
        `"${l.projectTask.replace(/"/g, '""')}"`,
        `"${l.timestamp}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `limassol_logs_${reportStartDate}_to_${reportEndDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Payroll Summary CSV per Employee
  const syncToClockify = async () => {
    const apiKey = clockifyApiKey || localStorage.getItem('clockify_api_key') || '';
    const wsId = clockifyWorkspaceId || localStorage.getItem('clockify_workspace_id') || '';
    
    if (!apiKey || !wsId) {
      alert('Please configure Clockify API Key and Workspace ID in Setup first.');
      return;
    }

    if (!confirm('Are you sure you want to sync ' + filteredLogs.length + ' logs to Clockify?')) return;

    let successCount = 0;
    let failCount = 0;

    for (const log of filteredLogs) {
      const emp = employees.find(e => e.id === log.employeeId);
      if (!emp) continue;

      const [y, m, d] = log.date.split('-');
      const [h, min] = log.timestamp.split(':');
      const dateObj = new Date(Number(y), Number(m)-1, Number(d), Number(h), Number(min));
      const endObj = new Date(dateObj.getTime() + log.hours * 3600000);

      const payload = {
        start: dateObj.toISOString(),
        end: endObj.toISOString(),
        description: `${emp.name}: ${log.projectTask}`,
      };

      try {
        const res = await fetch(`https://api.clockify.me/api/v1/workspaces/${wsId}/time-entries`, {
          method: 'POST',
          headers: {
            'X-Api-Key': apiKey,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        if (res.ok) successCount++;
        else failCount++;
      } catch {
        failCount++;
      }
    }
    
    alert(`Sync complete! Successfully synced: ${successCount}, Failed: ${failCount}`);
  };

  const exportPayrollSummaryCSV = () => {
    const filtered = logs.filter(l => {
      if (reportStartDate && l.date < reportStartDate) return false;
      if (reportEndDate && l.date > reportEndDate) return false;
      return true;
    });

    const headers = ['Employee Name', 'Role', 'Languages', 'Shifts Worked', 'Total Hours Logged', 'Avg Hours / Shift'];
    const rows = employees.map(emp => {
      const empLogs = filtered.filter(l => l.employeeId === emp.id);
      const totalHours = empLogs.reduce((sum, l) => sum + l.hours, 0);
      const shiftsCount = empLogs.length;
      const avgHours = shiftsCount > 0 ? (totalHours / shiftsCount).toFixed(1) : '0.0';

      return [
        `"${emp.name}"`,
        `"${emp.role}"`,
        `"${emp.languages.join('/')}"`,
        shiftsCount,
        totalHours.toFixed(1),
        avgHours,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `limassol_payroll_summary_${reportStartDate}_to_${reportEndDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Clockify Integration Actions
  const handleSaveClockifyConfig = (key: string, ws: string) => {
    setClockifyApiKey(key);
    setClockifyWorkspaceId(ws);
    if (typeof window !== 'undefined') {
      localStorage.setItem('clockify_api_key', key);
      localStorage.setItem('clockify_workspace_id', ws);
    }
    setClockifySyncStatus('✅ Settings saved safely to your local browser storage!');
  };

  const handleSyncToClockify = async (silent = false) => {
    const apiKey = clockifyApiKey || localStorage.getItem('clockify_api_key') || '';
    if (!apiKey.trim()) {
      if (!silent) {
        alert('Please enter your Clockify API Key first!');
        setShowClockifyModal(true);
      }
      return;
    }
    if (!silent) setClockifySyncStatus('⏳ Connecting to Clockify...');
    try {
      // Step 1: Get current user + workspace
      const userRes = await fetch('https://api.clockify.me/api/v1/user', {
        headers: { 'X-Api-Key': apiKey }
      });
      if (!userRes.ok) {
        setClockifySyncStatus('❌ Connection failed. Please check your API Key.');
        return;
      }
      const userData = await userRes.json();
      const wsId = clockifyWorkspaceId || userData.defaultWorkspace;
      if (!clockifyWorkspaceId && wsId) {
        setClockifyWorkspaceId(wsId);
        localStorage.setItem('clockify_workspace_id', wsId);
      }
      const userName = userData.name;
      setClockifyConnectedUser(userName);
      localStorage.setItem('clockify_connected_user', userName);

      // Step 2: Get or create a project "Limassol Time Tracker"
      let projectId = localStorage.getItem('clockify_project_id') || '';
      if (!projectId) {
        const projRes = await fetch(`https://api.clockify.me/api/v1/workspaces/${wsId}/projects`, {
          method: 'POST',
          headers: { 'X-Api-Key': apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Limassol Time Tracker', color: '#1B998B', isPublic: false })
        });
        if (projRes.ok) {
          const projData = await projRes.json();
          projectId = projData.id;
          localStorage.setItem('clockify_project_id', projectId);
        }
      }

      // Step 3: Sync all logs for today as time entries
      const todayKey = new Date().toISOString().split('T')[0];
      const todayLogs = logs.filter(l => l.date === todayKey);
      const syncedIds: string[] = JSON.parse(localStorage.getItem('clockify_synced_ids') || '[]');
      let newSynced = 0;

      for (const log of todayLogs) {
        if (syncedIds.includes(log.id)) continue;
        const startDate = new Date(`${log.date}T09:00:00`);
        const endDate = new Date(startDate.getTime() + log.hours * 3600 * 1000);
        const entryRes = await fetch(`https://api.clockify.me/api/v1/workspaces/${wsId}/time-entries`, {
          method: 'POST',
          headers: { 'X-Api-Key': apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            start: startDate.toISOString(),
            end: endDate.toISOString(),
            description: `${log.employeeName} – ${log.projectTask}`,
            projectId: projectId || undefined,
            billable: false,
          })
        });
        if (entryRes.ok) {
          syncedIds.push(log.id);
          newSynced++;
        }
      }
      localStorage.setItem('clockify_synced_ids', JSON.stringify(syncedIds));

      const now = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
      setClockifyLastSynced(now);
      if (!silent) {
        setClockifySyncStatus(`✅ Synced to Clockify as "${userName}" — ${newSynced} new entries pushed. (${now})`);
      }
    } catch {
      if (!silent) setClockifySyncStatus('⚠️ Network error. Will retry next auto-sync.');
    }
  };

  // Auto-sync to Clockify every 60 seconds
  useEffect(() => {
    const apiKey = clockifyApiKey || localStorage.getItem('clockify_api_key') || '';
    if (!apiKey) return;
    // Initial silent sync
    handleSyncToClockify(true);
    const interval = setInterval(() => handleSyncToClockify(true), 60000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clockifyApiKey, logs]);

  // Fetch Live Statuses from Clockify for Dashboard
  const fetchLiveStatuses = async () => {
    const apiKey = clockifyApiKey || localStorage.getItem('clockify_api_key') || '';
    const wsId = clockifyWorkspaceId || localStorage.getItem('clockify_workspace_id') || '';
    if (!apiKey || !wsId) return;

    try {
      // 1. Get all users in workspace
      const usersRes = await fetch(`https://api.clockify.me/api/v1/workspaces/${wsId}/users`, {
        headers: { 'X-Api-Key': apiKey }
      });
      if (!usersRes.ok) return;
      const wsUsers = await usersRes.json();

      const newStatuses: Record<string, LiveStatus> = {};

      // 2. For each user, check if they have an in-progress timer
      for (const user of wsUsers) {
        // Attempt to match Clockify user to our Employee by name or email
        const empMatch = employees.find(e => 
          (e.email && e.email.toLowerCase() === user.email.toLowerCase()) || 
          e.name.toLowerCase() === user.name.toLowerCase()
        );
        
        const empId = empMatch ? empMatch.id : `clockify-${user.id}`;
        
        const timerRes = await fetch(`https://api.clockify.me/api/v1/workspaces/${wsId}/user/${user.id}/time-entries?in-progress=true`, {
          headers: { 'X-Api-Key': apiKey }
        });
        
        if (timerRes.ok) {
          const timers = await timerRes.json();
          if (timers.length > 0) {
            const activeTimer = timers[0];
            const start = new Date(activeTimer.timeInterval.start);
            const durationMs = new Date().getTime() - start.getTime();
            const hrs = Math.floor(durationMs / 3600000);
            const mins = Math.floor((durationMs % 3600000) / 60000);
            
            newStatuses[empId] = {
              employeeId: empId,
              employeeName: user.name,
              status: 'online',
              task: activeTimer.description || 'Working on task...',
              duration: `${hrs > 0 ? hrs + 'h ' : ''}${mins}m`,
              startTime: start.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
            };
          }
        }
      }
      setLiveStatuses(newStatuses);
    } catch (e) {
      console.error("Failed to fetch live statuses", e);
    }
  };

  useEffect(() => {
    if (activeTab === 'timeTracker') {
      fetchLiveStatuses();
      const interval = setInterval(fetchLiveStatuses, 10000); // Poll every 10s
      return () => clearInterval(interval);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab, clockifyApiKey, clockifyWorkspaceId]);

  // AW Auto-Status Sync for Kiosk (Clock In)
  useEffect(() => {
    if (authRole === 'user' && activeEmployee) {
      const now = Date.now();
      const liveData = liveStatuses[activeEmployee.id];
      
      if (liveData && liveData.status === 'online') {
        // AW is tracking
        setLastActivityMap(prev => ({...prev, [activeEmployee.id]: now}));
        
        // Auto clock-in if expected or completed or on break
        if (activeEmployee.status === 'expected' || activeEmployee.status === 'completed' || activeEmployee.status === 'on_break') {
          const cTime = cyprusTime || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Nicosia' });
          const updated = employees.map(e => e.id === activeEmployee.id ? { ...e, status: 'checked_in' as const, checkInTime: cTime } : e);
          
          saveEmployees(updated);
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveStatuses, activeEmployee, authRole]);

  // AW Auto-Status Sync for Kiosk (Auto Break on Inactivity)
  useEffect(() => {
    if (authRole === 'user' && activeEmployee && activeEmployee.status === 'checked_in') {
      const interval = setInterval(() => {
        const lastActive = lastActivityMap[activeEmployee.id];
        // If we have a last active time and it's been > 30 seconds
        if (lastActive && Date.now() - lastActive > 30000) {
          const cTime = cyprusTime || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Nicosia' });
          const updated = employees.map(e => e.id === activeEmployee.id ? { ...e, status: 'on_break' as const, checkOutTime: cTime } : e);
          
          saveEmployees(updated);
        }
      }, 5000); // check every 5 seconds
      return () => clearInterval(interval);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authRole, activeEmployee, lastActivityMap, cyprusTime]);

  // Full Clockify Workspace Setup
  const handleFullClockifySetup = async () => {
    const apiKey = clockifyApiKey || localStorage.getItem('clockify_api_key') || '';
    if (!apiKey.trim()) {
      alert('No Clockify API Key found!');
      return;
    }
    setClockifySyncStatus('🚀 Starting full workspace setup...');
    const log: string[] = [];
    try {
      // Step 1: Get user + workspace
      const userRes = await fetch('https://api.clockify.me/api/v1/user', {
        headers: { 'X-Api-Key': apiKey }
      });
      if (!userRes.ok) { setClockifySyncStatus('❌ Auth failed. Check API key.'); return; }
      const userData = await userRes.json();
      const wsId = clockifyWorkspaceId || userData.defaultWorkspace;
      if (!clockifyWorkspaceId) {
        setClockifyWorkspaceId(wsId);
        localStorage.setItem('clockify_workspace_id', wsId);
      }
      log.push(`✅ Connected as ${userData.name}`);

      // Step 2: Create project "Karfigest SA — Limassol Office"
      let projectId = localStorage.getItem('clockify_project_id') || '';
      if (!projectId) {
        const projRes = await fetch(`https://api.clockify.me/api/v1/workspaces/${wsId}/projects`, {
          method: 'POST',
          headers: { 'X-Api-Key': apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: 'Karfigest SA — Limassol Office', color: '#1B998B', isPublic: false, billable: false })
        });
        if (projRes.ok) {
          const p = await projRes.json();
          projectId = p.id;
          localStorage.setItem('clockify_project_id', projectId);
          log.push('✅ Project "Karfigest SA — Limassol Office" created');
        } else {
          log.push('⚠️ Project already exists or creation failed');
        }
      } else {
        log.push('ℹ️ Project already set up');
      }

      // Step 3: Create tags for languages and roles
      const tagsToCreate = [
        'EN', 'RU', 'FR', 'AR', 'DE', 'ES',
        'Senior Consultant', 'Account Manager', 'Client Relations',
        'Operations', 'Regional Support', 'Portfolio Specialist', 'Compliance'
      ];
      let tagsCreated = 0;
      for (const tag of tagsToCreate) {
        const tagRes = await fetch(`https://api.clockify.me/api/v1/workspaces/${wsId}/tags`, {
          method: 'POST',
          headers: { 'X-Api-Key': apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: tag })
        });
        if (tagRes.ok) tagsCreated++;
      }
      log.push(`✅ ${tagsCreated} tags created (languages + roles)`);

      // Step 4: Invite employees with emails
      const empWithEmails = employees.filter(e => e.email && e.email.trim());
      const invitesFailed: string[] = [];
      for (const emp of empWithEmails) {
        const invRes = await fetch(`https://api.clockify.me/api/v1/workspaces/${wsId}/invitations`, {
          method: 'POST',
          headers: { 'X-Api-Key': apiKey, 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: emp.email })
        });
        if (invRes.ok) {
          log.push(`📧 Invited ${emp.name} (${emp.email})`);
        } else {
          invitesFailed.push(emp.name);
        }
      }
      if (invitesFailed.length > 0) {
        log.push(`⚠️ Could not invite: ${invitesFailed.join(', ')} (may already be members)`);
      }

      setClockifySyncStatus(log.join('\n'));
    } catch (err) {
      setClockifySyncStatus('❌ Setup failed: ' + String(err));
    }
  };



  // Domain Check: Block public karfigestsa.com
  if (isAllowedDomain === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafaf8] px-6 text-center font-sans">
        <div>
          <h1 className="text-6xl font-bold text-[#133137]">404</h1>
          <p className="mt-4 text-xl text-stone-600">Page not found</p>
          <a href="/" className="mt-6 inline-block rounded-2xl bg-[#133137] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1a444c]">
            Return Home
          </a>
        </div>
      </div>
    );
  }

  if (isAllowedDomain === null) {
    return <div className={theme === 'dark' ? "min-h-screen bg-[#091a1d]" : "min-h-screen bg-[#f3f4f6]"} />;
  }

  const isDark = theme === 'dark';

  // Username + PIN Auth Screen (USER & ADMIN)
  if (!isAuthenticated) {
    return (
      <div className={`flex min-h-screen items-center justify-center p-4 font-sans ${isDark ? 'bg-[#091a1d] text-white' : 'bg-[#f3f4f6] text-[#000000]'}`}>
        <div className={`w-full max-w-md rounded-2xl border p-8 shadow-2xl backdrop-blur-lg ${isDark ? 'border-white/30 bg-[#133137] text-white' : 'border-slate-200/60 bg-white text-black'}`}>
          <div className="text-center">
            <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold ${isDark ? 'bg-white/20 text-white' : 'bg-[#133137] text-white'}`}>
              ⏱️
            </div>
            <h2 className={`mt-4 font-serif text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
              Limassol Shift Tracker
            </h2>
            <p className={`mt-1 text-xs font-semibold ${isDark ? 'text-white/80' : 'text-slate-700'}`}>
              Limassol / Cyprus Timezone Shift Management
            </p>
          </div>

          <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4 text-xs">
            <div>
              <label className="block font-extrabold uppercase tracking-wider mb-1">Username:</label>
              <input
                type="text"
                value={loginUsername}
                onChange={(e) => setLoginUsername(e.target.value)}
                className={`w-full rounded-2xl border px-3.5 py-2.5 font-bold outline-none ${isDark ? 'border-white/40 bg-black/60 text-white' : 'border-slate-400 bg-slate-100 text-black'}`}
              />
            </div>

            <div>
              <label className="block font-extrabold uppercase tracking-wider mb-1">PIN / Password:</label>
              <input
                type="password"
                maxLength={8}
                value={loginPin}
                onChange={(e) => setLoginPin(e.target.value)}
                className={`w-full rounded-2xl border px-4 py-2.5 text-center text-lg font-bold tracking-widest outline-none ${isDark ? 'border-white/40 bg-black/60 text-white focus:border-white' : 'border-slate-400 bg-slate-100 text-black focus:border-black'}`}
              />
            </div>

            {loginError && (
              <p className="text-center font-bold text-red-300 bg-slate-800/20 border border-red-500/30 p-2.5 rounded-2xl">
                {loginError}
              </p>
            )}

            <button
              type="submit"
              className={`w-full rounded-2xl py-3 text-sm font-extrabold shadow-lg transition ${
                isDark ? 'bg-white text-slate-900 hover:bg-slate-100' : 'bg-[#133137] text-white hover:bg-[#1a444c]'
              }`}
            >
              Log In
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Filtered logs & employees
  const filteredLogs = logs.filter(log => {
    if (reportStartDate && log.date < reportStartDate) return false;
    if (reportEndDate && log.date > reportEndDate) return false;
    if (filterLang !== 'ALL') {
      const emp = employees.find(e => e.id === log.employeeId);
      if (!emp || !emp.languages.includes(filterLang)) return false;
    }
    return true;
  });

  // Filtered employees for 30+ staff management
  const filteredEmployees = employees.filter(emp => {
    if (empStatusFilter !== 'ALL' && emp.status !== empStatusFilter) return false;
    if (empSearchQuery.trim()) {
      const q = empSearchQuery.toLowerCase();
      return (
        emp.name.toLowerCase().includes(q) ||
        emp.role.toLowerCase().includes(q) ||
        emp.expectedShift.toLowerCase().includes(q)
      );
    }
    return true;
  }).sort((a, b) => {
    if (empSortOrder === 'name_desc') {
      return b.name.localeCompare(a.name, undefined, { sensitivity: 'base' });
    }
    if (empSortOrder === 'last_online') {
      const statusWeight = (s: string) => (s === 'checked_in' ? 2 : s === 'on_break' ? 1 : 0);
      const weightDiff = statusWeight(b.status) - statusWeight(a.status);
      if (weightDiff !== 0) return weightDiff;
      const tsA = a.checkInTimestamp || 0;
      const tsB = b.checkInTimestamp || 0;
      return tsB - tsA;
    }
    if (empSortOrder === 'last_registered') {
      return (b.sortOrder ?? 0) - (a.sortOrder ?? 0);
    }
    // Default: name_asc (A - Z)
    return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
  });

  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-200 ${isDark ? 'bg-[#091a1d] text-white' : 'bg-[#f4f5f7] text-black'}`}>
      {/* Header & Sticky Navigation Menu */}
      <header className={`border-b sticky top-0 z-50 shadow-md backdrop-blur-md transition-colors duration-200 ${isDark ? 'border-white/10 bg-[#091a1d]/80 text-white' : 'border-slate-200/60 bg-white/80 text-black'}`}>
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-6 py-2">
          
          {/* Left: Logo & Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 mr-2">
              <span className={`flex h-8 w-8 items-center justify-center rounded-2xl text-lg font-bold shadow-sm ${isDark ? 'bg-white text-slate-900' : 'bg-[#133137] text-white'}`}>
                ⏱️
              </span>
              <span className="font-serif font-bold tracking-tight hidden sm:block">
                Limassol Time
              </span>
            </div>

            {/* Navigation (Admin) */}
            {authRole === 'admin' && (
              <div className="flex flex-wrap items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-2xl">
                <button
                  onClick={() => handleTabChange('timeTracker', '/dashboard')}
                  className={`flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-[0.75rem] font-bold transition ${
                    activeTab === 'timeTracker'
                      ? isDark ? 'bg-white/20 text-white shadow-sm' : 'bg-white text-black shadow-sm'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <span>⏱️</span> Dashboard
                </button>
                <button
                  onClick={() => handleTabChange('employees', '/team')}
                  className={`flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-[0.75rem] font-bold transition ${
                    activeTab === 'employees'
                      ? isDark ? 'bg-white/20 text-white shadow-sm' : 'bg-white text-black shadow-sm'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <span>👥</span> Team
                </button>
                <button
                  onClick={() => window.location.href = '/reports'}
                  className={`flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-[0.75rem] font-bold transition ${
                    activeTab === 'reports'
                      ? isDark ? 'bg-white/20 text-white shadow-sm' : 'bg-white text-black shadow-sm'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <span>📊</span> Reports
                </button>
                <button
                  onClick={() => window.location.href = '/setup'}
                  className={`flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-[0.75rem] font-bold transition ${
                    activeTab === 'setup'
                      ? isDark ? 'bg-white/20 text-white shadow-sm' : 'bg-white text-black shadow-sm'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  ⚙️ Setup
                </button>
              </div>
            )}

            {/* Navigation (User) */}
            {authRole === 'user' && (
              <div className="flex flex-wrap items-center gap-1 bg-black/5 dark:bg-white/5 p-1 rounded-2xl">
                <button
                  onClick={() => window.location.href = '/dashboard'}
                  className={`flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-[0.75rem] font-bold transition ${
                    activeTab === 'timeTracker'
                      ? isDark ? 'bg-white/20 text-white shadow-sm' : 'bg-white text-black shadow-sm'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <span>🏠</span> My Shift
                </button>
                <button
                  onClick={() => window.location.href = '/setup'}
                  className={`flex items-center gap-1.5 rounded-2xl px-3 py-1.5 text-[0.75rem] font-bold transition ${
                    activeTab === 'setup'
                      ? isDark ? 'bg-white/20 text-white shadow-sm' : 'bg-white text-black shadow-sm'
                      : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  ⚙️ Setup
                </button>
              </div>
            )}
          </div>

          {/* Right: Actions */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Live Clock Block */}
            <div className={`flex items-center gap-2 rounded-2xl border px-3 py-1.5 shadow-inner ${isDark ? 'border-white/10 bg-black/40 text-white' : 'border-slate-200 bg-black/5 text-black'}`}>
              <div className="text-right flex items-center gap-2">
                <div className="font-mono text-[0.8rem] font-black text-slate-500">
                  {cyprusTime || '00:00 AM'}
                </div>
                <div className={`h-4 w-px ${isDark ? 'bg-white/20' : 'bg-slate-300'}`} />
                <div className="text-[0.65rem] font-bold opacity-75">
                  {cyprusDate}
                </div>
              </div>
            </div>

            {/* Live Timer (User Only) */}
            {authRole === 'user' && activeEmployee && (activeEmployee.status === 'checked_in' || activeEmployee.status === 'on_break') && (
              <div className={`flex items-center rounded-2xl border px-3 py-1.5 shadow-inner ${
                activeEmployee.status === 'checked_in'
                  ? isDark ? 'border-slate-300/30 bg-emerald-950/40' : 'border-emerald-300 bg-slate-50'
                  : isDark ? 'border-amber-500/30 bg-amber-950/40' : 'border-amber-300 bg-slate-50'
              }`}>
                <div className="text-right flex items-center gap-2">
                  <div className={`text-[0.6rem] font-extrabold uppercase ${
                    activeEmployee.status === 'checked_in' ? 'text-slate-500' : 'text-slate-500'
                  }`}>
                    {activeEmployee.status === 'checked_in' ? 'LIVE' : 'BREAK'}
                  </div>
                  <div className={`font-mono text-[0.8rem] font-black ${
                    activeEmployee.status === 'checked_in' ? 'text-slate-500' : 'text-slate-500'
                  }`}>
                    {kioskBillableTime}
                  </div>
                </div>
              </div>
            )}

            {/* Quick Action (User Only) */}
            {authRole === 'user' && activeEmployee && (
              activeEmployee.status === 'checked_in' ? (
                <button
                  onClick={() => handleClockOutSimple()}
                  className="rounded-2xl bg-slate-900 px-3 py-1.5 text-[0.75rem] font-extrabold text-white hover:bg-slate-800 transition shadow-sm"
                >
                  🔴 Out
                </button>
              ) : activeEmployee.status === 'on_break' ? (
                <button
                  onClick={() => handleResumeWork()}
                  className="rounded-2xl bg-slate-900 px-3 py-1.5 text-[0.75rem] font-extrabold text-white hover:bg-slate-800 transition shadow-sm animate-pulse"
                >
                  ▶️ Resume
                </button>
              ) : (
                <button
                  onClick={() => {
                    const nowTime = cyprusTime || '11:00 AM';
                    const nowTs = Date.now();
                    const updated = employees.map(e => e.id === activeEmployee.id ? { ...e, status: 'checked_in' as const, checkInTime: nowTime, checkInTimestamp: nowTs, accumulatedSeconds: 0 } : e);
                    saveEmployees(updated);
                    setActiveEmployee(prev => prev ? { ...prev, status: 'checked_in', checkInTime: nowTime, checkInTimestamp: nowTs, accumulatedSeconds: 0 } : null);
                    addShiftEvent(activeEmployee.id, { type: 'clock_in', label: '🟢 Clocked In', time: nowTime, timestamp: nowTs });
                  }}
                  className="rounded-2xl bg-slate-900 px-3 py-1.5 text-[0.75rem] font-extrabold text-white hover:bg-slate-800 transition shadow-sm"
                >
                  🟢 In
                </button>
              )
            )}

            {/* Auth Button */}
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                title={`Log Out (${authRole === 'admin' ? 'Admin' : activeEmployee?.name})`}
                className="flex items-center justify-center px-3 h-8 rounded-2xl border border-red-500/30 bg-slate-800/10 text-[0.75rem] font-extrabold text-red-500 hover:bg-slate-800/20 transition shadow-sm"
              >
                Logout
              </button>
            ) : (
              <button
                onClick={() => setIsAuthenticated(false)}
                title="Log In"
                className="flex items-center justify-center px-3 h-8 rounded-2xl bg-slate-900 text-[0.75rem] font-extrabold text-white hover:bg-slate-800 transition shadow-sm"
              >
                Login
              </button>
            )}

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              title="Toggle Theme"
              className={`flex items-center justify-center h-8 w-8 rounded-2xl border transition shadow-sm ${
                isDark
                  ? 'border-white/20 bg-white/10 text-[0.95rem] hover:bg-white/20'
                  : 'border-slate-200/60 bg-slate-100 text-[0.95rem] hover:bg-slate-200'
              }`}
            >
              {isDark ? '☀️' : '🌙'}
            </button>
            
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* User / Employee View */}
        {authRole === 'user' && activeEmployee && activeTab !== 'setup' && (
          <div className="space-y-8">
            <div className={`rounded-3xl border-2 p-8 shadow-2xl ${isDark ? 'border-white/30 bg-[#133137] text-white' : 'border-slate-200/60 bg-white text-black'}`}>
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                <div>
                  <div className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1 text-xs font-extrabold ${isDark ? 'bg-slate-800/20 border-slate-300/30 text-emerald-300' : 'bg-slate-100 border-emerald-300 text-emerald-800'}`}>
                    🟢 Employee Shift Kiosk
                  </div>
                  <div className="flex flex-wrap items-center gap-3 mt-3">
                    <h2 className="text-3xl font-serif font-bold tracking-tight">
                      {T.welcomeLabel} {activeEmployee.name}!
                    </h2>
                    <button
                      onClick={() => handleOpenEditShift(activeEmployee)}
                      className={`rounded-2xl border px-3 py-1.5 text-xs font-extrabold shadow transition active:scale-95 flex items-center gap-1 ${
                        isDark ? 'border-white/30 bg-white/10 text-white hover:bg-white/20' : 'border-slate-400 bg-slate-100 text-slate-900 hover:bg-slate-200'
                      }`}
                      title="Edit your optional profile info"
                    >
                      ✏️ Edit Profile
                    </button>
                  </div>
                  <p className="mt-1 text-xs font-semibold opacity-85">
                    {T.roleLabel} {activeEmployee.role || 'Team Member'} {activeEmployee.languages && activeEmployee.languages.length > 0 && `| Languages: ${activeEmployee.languages.join(' / ')}`}
                  </p>

                  {/* Status Badge & Live Billable Ticking Timer */}
                  <div className="mt-4 flex flex-wrap items-center gap-3">
                    <span className={`rounded-2xl px-3.5 py-2 font-mono text-sm font-extrabold shadow border ${
                      activeEmployee.status === 'checked_in'
                        ? isDark ? 'bg-emerald-950/80 text-emerald-300 border-slate-300/50 animate-pulse' : 'bg-slate-100 text-emerald-800 border-emerald-400 animate-pulse'
                        : activeEmployee.status === 'on_break'
                        ? isDark ? 'bg-amber-950/80 text-amber-300 border-amber-500/50' : 'bg-slate-100 text-amber-800 border-slate-300'
                        : activeEmployee.status === 'completed'
                        ? isDark ? 'bg-blue-950/80 text-blue-300 border-slate-300/50' : 'bg-slate-100 text-blue-800 border-blue-400'
                        : isDark ? 'bg-black/40 text-slate-300 border-white/20' : 'bg-slate-100 text-slate-600 border-slate-200/60'
                    }`}>
                      {activeEmployee.status === 'checked_in' && `🟢 WORKING (Arrived at ${activeEmployee.checkInTime || '11:00 AM'})`}
                      {activeEmployee.status === 'on_break' && (
                        <div className="flex flex-col items-center">
                          <div>{`${T.onBreakLabel}: ${activeEmployee.breakType || 'Pause'}`}</div>
                          <div className="text-4xl mt-2 mb-1 font-mono tracking-widest text-amber-400 drop-shadow-md">
                            {formatBreakTime(breakElapsedSeconds)}
                          </div>
                        </div>
                      )}
                      {activeEmployee.status === 'completed' && `🏁 SHIFT COMPLETED (Left at ${activeEmployee.checkOutTime || '7:00 PM'})`}
                      {activeEmployee.status === 'expected' && `⏰ EXPECTED TODAY`}
                    </span>

                    {/* Live Billable Ticking Time */}
                    {(activeEmployee.status === 'checked_in' || activeEmployee.status === 'on_break') && (
                      <div className={`rounded-2xl border px-4 py-2 text-center shadow-inner ${isDark ? 'border-amber-500/50 bg-black/60' : 'border-slate-300 bg-slate-50'}`}>
                        <div className={`text-[0.65rem] font-extrabold uppercase tracking-wider ${isDark ? 'text-amber-400' : 'text-slate-700'}`}>
                          ⏱️ BILLABLE WORKING TIME
                        </div>
                        <div className={`font-mono text-xl font-black tracking-wider ${isDark ? 'text-amber-300' : 'text-amber-800'}`}>
                          {kioskBillableTime}
                        </div>
                      </div>
                    )}

                    {/* AW Live Tracker Status */}
                    {(() => {
                      const { isLiveFromAW, isLiveFromClockify, liveDurationStr } = getMergedEmployeeState(activeEmployee);
                      const isTrackerLive = isLiveFromAW || isLiveFromClockify;
                      return (
                        <div className={`rounded-2xl border px-4 py-2 flex flex-col justify-center shadow-inner ${
                          isTrackerLive 
                            ? isDark ? 'border-slate-300/50 bg-sky-950/60' : 'border-sky-400 bg-slate-100'
                            : isDark ? 'border-rose-500/50 bg-rose-950/60' : 'border-rose-400 bg-slate-100'
                        }`}>
                          <div className={`text-[0.65rem] font-extrabold uppercase tracking-wider ${
                            isTrackerLive
                              ? isDark ? 'text-sky-400' : 'text-slate-700'
                              : isDark ? 'text-rose-400' : 'text-slate-700'
                          }`}>
                            {isTrackerLive ? '⚡ AW TRACKER: CONNECTED' : '🔴 AW TRACKER: OFFLINE'}
                          </div>
                          {isLiveFromClockify && liveStatuses[activeEmployee.id] && (
                            <div className={`font-mono text-xs font-black tracking-wider mt-1 ${isDark ? 'text-sky-300' : 'text-sky-800'}`}>
                              {liveStatuses[activeEmployee.id].task} ({liveDurationStr})
                            </div>
                          )}
                          {isLiveFromAW && !isLiveFromClockify && (
                            <div className={`font-mono text-xs font-black tracking-wider mt-1 ${isDark ? 'text-sky-300' : 'text-sky-800'}`}>
                              Tracking Activity (Desktop)
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>

                {/* Kiosk Action Buttons (Clock In, Pause / Break, Resume, Clock Out) */}
                <div className="flex flex-col gap-3 sm:flex-row items-center">
                  
                  {/* State 1: Expected -> Clock In */}
                  {activeEmployee.status === 'expected' && (
                    <button
                      onClick={() => {
                        const nowTime = cyprusTime || '11:00 AM';
                        const nowTs = Date.now();
                        addShiftEvent(activeEmployee.id, { type: 'clock_in', label: '🟢 Clocked In (Start of Shift)', time: nowTime, timestamp: nowTs });
                        const updated = employees.map(e => e.id === activeEmployee.id ? { 
                          ...e, 
                          status: 'checked_in' as const, 
                          checkInTime: nowTime,
                          checkInTimestamp: nowTs,
                          accumulatedSeconds: 0
                        } : e);
                        saveEmployees(updated);
                        setActiveEmployee(prev => prev ? { 
                          ...prev, 
                          status: 'checked_in', 
                          checkInTime: nowTime,
                          checkInTimestamp: nowTs,
                          accumulatedSeconds: 0
                        } : null);
                      }}
                      className="w-full sm:w-auto rounded-2xl bg-slate-900 px-8 py-5 text-base font-extrabold text-white shadow-xl hover:bg-slate-800 transition flex items-center justify-center gap-2 active:scale-95"
                    >
                      <span>🟢</span> {T.clockInBtn.replace('🟢 ', '')}
                    </button>
                  )}

                  {/* State 2: Working -> Pause / Break or Clock Out */}
                  {activeEmployee.status === 'checked_in' && (
                    <>
                      {/* Pause / Break Dropdown Menu */}
                      <div className="relative">
                        <button
                          onClick={() => setShowBreakMenu(v => !v)}
                          className="rounded-2xl bg-slate-900 px-6 py-4 text-sm font-extrabold text-white shadow-xl hover:bg-slate-800 transition flex items-center gap-2"
                        >
                          <span>⏸️</span> {T.pauseBreakBtn.replace('⏸️ ', '')}
                        </button>

                        {showBreakMenu && (
                          <div className="absolute left-0 mt-2 z-50 w-56 rounded-2xl border-2 border-white/20 bg-slate-900 p-2 shadow-2xl text-xs font-bold text-white">
                            <div className="px-3 py-1.5 text-[0.7rem] uppercase font-extrabold text-amber-400 border-b border-white/10">
                              Select Break Type:
                            </div>
                            <button
                              onClick={() => handleTakeBreak('🚬 Smoke Break')}
                              className="w-full text-left rounded-2xl px-3 py-2 hover:bg-white/10 transition flex items-center gap-2"
                            >
                              🚬 Smoke Break (5-10m)
                            </button>
                            <button
                              onClick={() => handleTakeBreak('🥪 Lunch Break')}
                              className="w-full text-left rounded-2xl px-3 py-2 hover:bg-white/10 transition flex items-center gap-2"
                            >
                              🥪 Lunch Break (30-60m)
                            </button>
                            <button
                              onClick={() => handleTakeBreak('☕ Coffee / Rest')}
                              className="w-full text-left rounded-2xl px-3 py-2 hover:bg-white/10 transition flex items-center gap-2"
                            >
                              ☕ Coffee / Rest Break
                            </button>
                            <button
                              onClick={() => handleTakeBreak('❓ Short Break')}
                              className="w-full text-left rounded-2xl px-3 py-2 hover:bg-white/10 transition flex items-center gap-2"
                            >
                              ❓ Short Break / Other
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Clock Out (Simple: No Popup!) */}
                      <button
                        onClick={() => handleClockOutSimple()}
                        className="rounded-2xl bg-slate-900 px-6 py-4 text-sm font-extrabold text-white shadow-xl hover:bg-slate-800 transition flex items-center gap-2"
                      >
                        <span>🔴</span> {T.clockOutBtn.replace('🔴 ', '')}
                      </button>
                    </>
                  )}

                  {/* State 3: On Break -> Resume Work or Clock Out */}
                  {activeEmployee.status === 'on_break' && (
                    <>
                      <button
                        onClick={() => handleResumeWork()}
                        className="rounded-2xl bg-slate-900 px-6 py-4 text-sm font-extrabold text-white shadow-xl hover:bg-slate-800 transition flex items-center gap-2 animate-pulse"
                      >
                        <span>▶️</span> {T.resumeWorkBtn.replace('▶️ ', '')}
                      </button>

                      <button
                        onClick={() => handleClockOutSimple()}
                        className="rounded-2xl bg-slate-900 px-6 py-4 text-sm font-extrabold text-white shadow-xl hover:bg-slate-800 transition flex items-center gap-2"
                      >
                        <span>🔴</span> Clock Out (Left Office)
                      </button>
                    </>
                  )}

                  {/* State 4: Shift Completed */}
                  {activeEmployee.status === 'completed' && (
                    <button
                      onClick={() => {
                        const nowTime = cyprusTime || '11:00 AM';
                        const nowTs = Date.now();
                        addShiftEvent(activeEmployee.id, { type: 'clock_in', label: '🟢 Clocked In Again', time: nowTime, timestamp: nowTs });
                        const updated = employees.map(e => e.id === activeEmployee.id ? { 
                          ...e, 
                          status: 'checked_in' as const, 
                          checkInTime: nowTime,
                          checkInTimestamp: nowTs,
                          accumulatedSeconds: 0
                        } : e);
                        saveEmployees(updated);
                        setActiveEmployee(prev => prev ? { 
                          ...prev, 
                          status: 'checked_in', 
                          checkInTime: nowTime,
                          checkInTimestamp: nowTs,
                          accumulatedSeconds: 0
                        } : null);
                      }}
                      className="rounded-2xl border border-slate-500 bg-slate-800 px-6 py-4 text-sm font-bold text-slate-200 hover:bg-slate-700 transition flex items-center gap-2"
                    >
                      <span>↩️</span> {T.reopenBtn.replace('↩️ ', '')}
                    </button>
                  )}

                </div>
              </div>

              {/* ── TODAY'S SHIFT EVENT HISTORY TIMELINE ── */}
              {shiftEvents.length > 0 && (
                <div className={`mt-6 rounded-2xl border p-5 ${
                  isDark ? 'border-white/10 bg-black/30' : 'border-slate-200 bg-slate-50'
                }`}>
                  <div className={`mb-3 text-xs font-extrabold uppercase tracking-widest ${
                    isDark ? 'text-slate-400' : 'text-slate-500'
                  }`}>
                    📋 Today&apos;s Shift History
                  </div>
                  <div className="relative pl-5">
                    {/* vertical line */}
                    <div className={`absolute left-[7px] top-0 bottom-0 w-px ${
                      isDark ? 'bg-white/10' : 'bg-slate-300'
                    }`} />
                    <div className="space-y-3">
                      {shiftEvents.map((ev, idx) => {
                        const dot =
                          ev.type === 'clock_in'   ? 'bg-slate-800' :
                          ev.type === 'clock_out'  ? 'bg-slate-800' :
                          ev.type === 'break_start'? 'bg-slate-400' :
                                                    'bg-slate-400';
                        const textColor =
                          ev.type === 'clock_in'   ? (isDark ? 'text-emerald-300' : 'text-slate-700') :
                          ev.type === 'clock_out'  ? (isDark ? 'text-rose-300'    : 'text-slate-700') :
                          ev.type === 'break_start'? (isDark ? 'text-amber-300'   : 'text-slate-700') :
                                                    (isDark ? 'text-sky-300'     : 'text-slate-700');
                        return (
                          <div key={ev.id} className="flex items-start gap-3">
                            <div className={`relative z-10 mt-1 h-3.5 w-3.5 rounded-full border-2 border-[#133137] flex-shrink-0 ${dot}`} />
                            <div>
                              <span className={`text-xs font-extrabold ${textColor}`}>{ev.label}</span>
                              <span className={`ml-2 font-mono text-[0.7rem] ${
                                isDark ? 'text-slate-400' : 'text-slate-500'
                              }`}>{ev.time}</span>
                              {idx > 0 && (() => {
                                const prevTs = shiftEvents[idx - 1].timestamp;
                                const diffSec = Math.floor((ev.timestamp - prevTs) / 1000);
                                const dm = Math.floor(diffSec / 60);
                                const dh = Math.floor(dm / 60);
                                const label = dh > 0 ? `+${dh}h ${dm % 60}m` : `+${dm}m`;
                                return (
                                  <span className={`ml-1.5 text-[0.65rem] font-bold opacity-50`}>{label}</span>
                                );
                              })()}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

            </div>
          </div>
        )}

        {/* Admin / Manager Combined Command Center */}
        {authRole === 'admin' && activeTab === 'timeTracker' && (
          <div className="space-y-6">
            
            {/* Top Toolbar Actions */}
            <div className={`rounded-2xl border-2 p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-4 ${isDark ? 'border-white/10 bg-[#161b22] text-white' : 'border-slate-200 bg-white text-slate-800'}`}>
              <div className="flex items-center gap-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-slate-800"></span>
                </span>
                <div>
                  <h2 className="font-serif text-lg font-bold flex items-center gap-2">
                    Live Team Status
                    <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-slate-300/30 px-2.5 py-0.5 rounded-full">
                      ⚡ Live Sync (LimassolTracker & Firestore)
                    </span>
                  </h2>
                  <p className="text-xs text-slate-400">ActivityWatch tracking active across {Object.keys(liveStatuses).length} agents</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">

                <button
                  onClick={() => setShowAddEmpModal(true)}
                  className={`inline-flex items-center gap-2 rounded-2xl border px-3.5 py-2 text-xs font-extrabold shadow transition ${
                    isDark ? 'border-white bg-white text-slate-900 hover:bg-slate-100' : 'border-[#133137] bg-[#133137] text-white hover:bg-[#1a444c]'
                  }`}
                >
                  {T.addEmployeeBtn}
                </button>
              </div>
            </div>

            {/* REAL-TIME DASHBOARD WIDGETS */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Live Status Breakdown Grid */}
              <div className={`lg:col-span-2 rounded-2xl border-2 p-5 shadow-lg ${isDark ? 'border-white/10 bg-[#161b22] text-white' : 'border-slate-200 bg-white text-slate-800'}`}>
                <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                  <h3 className="font-extrabold text-base flex items-center gap-2">
                    <span>🟢 Live Agents Roster</span>
                    <span className="text-xs text-slate-400 font-normal">({filteredEmployees.length} shown)</span>
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-400">Sort:</span>
                      <select
                        value={empSortOrder}
                        onChange={(e) => setEmpSortOrder(e.target.value as 'name_asc' | 'name_desc' | 'last_online' | 'last_registered')}
                        className={`rounded-2xl border px-2.5 py-1 text-xs font-extrabold outline-none cursor-pointer transition ${
                          isDark ? 'border-white/20 bg-black/60 text-white' : 'border-slate-200/60 bg-white text-slate-900'
                        }`}
                      >
                        <option value="name_asc">🔤 Name (A - Z)</option>
                        <option value="name_desc">🔤 Name (Z - A)</option>
                        <option value="last_online">🟢 Last Online / Active</option>
                        <option value="last_registered">🆕 Last Registered</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-emerald-400 font-bold bg-emerald-950/40 border border-slate-300/20 px-2 py-0.5 rounded">
                        🟢 {employees.filter(e => e.status === 'checked_in').length} Working
                      </span>
                      <span className="text-slate-400 font-bold bg-slate-800/40 border border-slate-700/20 px-2 py-0.5 rounded">
                        ⚫ {employees.filter(e => e.status !== 'checked_in').length} Off
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {filteredEmployees.length === 0 ? (
                    <div className="col-span-full py-8 text-center text-xs font-bold opacity-75">
                      {T.noEmpMatchFilter}
                    </div>
                  ) : (
                    filteredEmployees.map(emp => {
                      const { status, checkIn, activeHrsDisplay, isLiveFromClockify, isLiveFromAW } = getMergedEmployeeState(emp);
                      const isOnline = status === 'checked_in';
                      return (
                        <div key={emp.id} className={`flex items-center justify-between p-3 rounded-2xl border transition-all ${
                          isOnline 
                            ? (isDark ? 'border-slate-300/40 bg-emerald-950/30 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'border-emerald-300 bg-slate-50')
                            : (isDark ? 'border-white/5 bg-white/5 opacity-60' : 'border-slate-200 bg-slate-50 opacity-70')
                        }`}>
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className={`h-8 w-8 rounded-full flex items-center justify-center font-extrabold text-xs flex-shrink-0 ${
                              isOnline ? 'bg-slate-800 text-white shadow-lg shadow-emerald-500/40 animate-pulse' : 'bg-slate-700 text-slate-300'
                            }`}>
                              {emp.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0 flex-1 py-1">
                              <div className="font-extrabold text-sm mb-1">
                                <div className="leading-tight break-words whitespace-normal">{emp.name}</div>
                                <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
                                  <span className="text-[0.65rem] font-bold opacity-60">({emp.role})</span>
                                  {emp.team?.trim() && (
                                    <span className={`rounded px-1.5 py-0 text-[9px] font-extrabold leading-4 flex-shrink-0 ${
                                      ({'Swiss':'bg-slate-800/20 text-red-300','Japan':'bg-slate-800/20 text-rose-300','Spain':'bg-slate-800/20 text-amber-300','France':'bg-slate-800/20 text-sky-300','Germany':'bg-slate-800/20 text-yellow-300','UK':'bg-violet-500/20 text-violet-300','AU':'bg-slate-800/20 text-emerald-300'} as Record<string,string>)[emp.team.trim()] || 'bg-slate-500/20 text-slate-400'
                                    }`}>{emp.team.trim()}</span>
                                  )}
                                </div>
                              </div>
                                <span className={`text-[0.65rem] font-bold flex items-center gap-1.5 flex-wrap ${isOnline ? 'text-emerald-400' : 'text-slate-500'}`}>
                                  <span>{isOnline ? `🟢 ONLINE (${formatNiceDisplayTime(checkIn || '11:00 AM')}) ${activeHrsDisplay ? `• ${activeHrsDisplay}` : ''}` : '⚫ OFFLINE'}</span>
                                  {(isLiveFromClockify || isLiveFromAW) && (
                                    <span className="px-1 py-0.5 rounded text-[8px] border border-emerald-500/40 bg-emerald-500/20 text-emerald-300 shadow-sm" title={isLiveFromAW ? "Tracking via ActivityWatch (Desktop)" : "Tracking via Clockify"}>💻 AW</span>
                                  )}
                                </span>
                            </div>
                          </div>
                          
                          {/* Manual Override Action Button */}
                          <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                            {isOnline ? (
                              <button
                                onClick={() => handleStatusChange(emp.id, 'completed')}
                                className="rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 px-3 py-1 text-[0.75rem] font-extrabold shadow-sm transition active:scale-95 flex items-center justify-center"
                                title="Manual override: Stop billing time (e.g. empty chair / YouTube open)"
                              >
                                Out
                              </button>
                            ) : (
                              <button
                                onClick={() => handleStatusChange(emp.id, 'checked_in')}
                                className="rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 text-[0.75rem] font-extrabold shadow-md transition active:scale-95 flex items-center justify-center"
                                title="Manual override: Start billing time"
                              >
                                In
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Top Metrics & Activity Feed */}
              <div className="space-y-6">
                <div className={`rounded-2xl border-2 p-5 shadow-lg flex flex-col justify-center items-center text-center ${isDark ? 'border-slate-300/20 bg-gradient-to-b from-[#133137] to-[#0a191c] text-white' : 'border-emerald-200 bg-slate-50 text-slate-800'}`}>
                  <div className="text-sm font-extrabold text-emerald-400 mb-2 uppercase tracking-widest">Active Now</div>
                  <div className="text-6xl font-black drop-shadow-md">{employees.filter(e => e.status === 'checked_in').length}</div>
                  <div className="text-xs font-bold mt-2 opacity-80">out of {employees.length} team members</div>
                </div>

                <div className={`rounded-2xl border-2 p-5 shadow-lg h-[320px] overflow-hidden flex flex-col ${isDark ? 'border-white/10 bg-[#161b22] text-white' : 'border-slate-200 bg-white text-slate-800'}`}>
                  <h3 className="font-extrabold text-sm mb-4 border-b border-white/10 pb-2">Recent Activity Feed</h3>
                  <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {employees.filter(e => e.status === 'checked_in').length === 0 ? (
                      <div className="text-xs text-center opacity-50 mt-10">No active team members right now.</div>
                    ) : (
                      employees
                        .filter(e => e.status === 'checked_in')
                        .map(emp => ({ emp, state: getMergedEmployeeState(emp) }))
                        .sort((a, b) => {
                          // AW-connected machines first
                          const aAW = a.state.isLiveFromAW || a.state.isLiveFromClockify ? 1 : 0;
                          const bAW = b.state.isLiveFromAW || b.state.isLiveFromClockify ? 1 : 0;
                          return bAW - aAW;
                        })
                        .map(({ emp, state: { checkIn, isLiveFromAW, isLiveFromClockify, activeHrsDisplay } }, i) => (
                          <div key={i} className="flex gap-3 items-start">
                            <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 animate-pulse ${(isLiveFromAW || isLiveFromClockify) ? 'bg-emerald-400' : 'bg-blue-400'}`}></div>
                            <div>
                              <div className="text-xs font-bold flex items-center gap-1.5 flex-wrap">
                                {emp.name}
                                <span className="opacity-70 font-normal">checked in</span>
                                {(isLiveFromAW || isLiveFromClockify) ? (
                                  <span className="px-1 py-0.5 rounded text-[8px] border border-emerald-500/40 bg-emerald-500/20 text-emerald-300 shadow-sm">AW Active</span>
                                ) : (
                                  <span className="px-1 py-0.5 rounded text-[8px] border border-blue-500/40 bg-blue-500/20 text-blue-300 shadow-sm">Web Manual</span>
                                )}
                              </div>
                              <div className="text-[0.65rem] text-slate-500 mt-0.5">
                                Since {formatNiceDisplayTime(checkIn || '')} {activeHrsDisplay ? `(${activeHrsDisplay})` : ''}
                              </div>
                            </div>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
              
            </div>

          </div>
        )}

        {/* Page Tab 2: Employees Directory Page */}
        {activeTab === 'employees' && (
          <div className="space-y-6">
            <div className={`rounded-2xl border-2 p-6 shadow-xl ${isDark ? 'border-white/20 bg-[#133137] text-white' : 'border-slate-200/60 bg-white text-black'}`}>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-serif text-2xl font-bold flex items-center gap-2">
                    {T.empDirectoryTitle}
                  </h2>
                  <p className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {T.empDirectoryDesc}
                  </p>
                </div>
                <button
                  onClick={() => setShowAddEmpModal(true)}
                  className="rounded-2xl bg-slate-900 px-4 py-2.5 text-xs font-extrabold text-white shadow transition hover:bg-slate-800 active:scale-95 flex items-center gap-1.5"
                >
                  {T.addNewEmpBtn}
                </button>
              </div>

              {/* Toolbar with Sort Options */}
              <div className="mt-4 flex flex-wrap gap-2 items-center justify-between border-t border-b py-2.5 my-2 border-white/10">
                <div className="text-xs font-bold text-slate-400">
                  Showing {filteredEmployees.length} of {employees.length} team members
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="font-bold text-slate-400">Sort by:</span>
                  <select
                    value={empSortOrder}
                    onChange={(e) => setEmpSortOrder(e.target.value as 'name_asc' | 'name_desc' | 'last_online' | 'last_registered')}
                    className={`rounded-2xl border px-3 py-1.5 text-xs font-extrabold outline-none cursor-pointer transition ${
                      isDark ? 'border-white/20 bg-black/60 text-white' : 'border-slate-200/60 bg-white text-slate-900'
                    }`}
                  >
                    <option value="name_asc">🔤 Name (A - Z)</option>
                    <option value="name_desc">🔤 Name (Z - A)</option>
                    <option value="last_online">🟢 Last Online / Active</option>
                    <option value="last_registered">🆕 Last Registered</option>
                  </select>
                </div>
              </div>

              {/* Flat Employees Table */}
              {(() => {
                const teamColors: Record<string, string> = {
                  'Swiss':   'bg-slate-800/20 text-red-300 border border-red-500/30',
                  'Japan':   'bg-slate-800/20 text-rose-300 border border-rose-500/30',
                  'Spain':   'bg-slate-800/20 text-amber-300 border border-amber-500/30',
                  'France':  'bg-slate-800/20 text-sky-300 border border-slate-300/30',
                  'Germany': 'bg-slate-800/20 text-yellow-300 border border-yellow-500/30',
                  'UK':      'bg-violet-500/20 text-violet-300 border border-violet-500/30',
                  'AU':      'bg-slate-800/20 text-emerald-300 border border-slate-300/30',
                };
                const defaultBadge = 'bg-slate-500/20 text-slate-400 border border-slate-500/30';

                return (
                  <div className="mt-4">
                    {filteredEmployees.length === 0 ? (
                      <div className={`rounded-2xl border-2 p-8 text-center text-sm font-bold opacity-60 ${isDark ? 'border-white/10 text-white' : 'border-slate-200 text-slate-500'}`}>
                        {T.noEmpMatchFilter}
                      </div>
                    ) : (
                      <div className={`rounded-2xl border overflow-hidden ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                        <table className="w-full text-left text-xs">
                          <thead className={`font-extrabold uppercase text-[10px] tracking-wider border-b ${isDark ? 'text-slate-400 bg-black/30 border-white/10' : 'text-slate-500 bg-slate-100 border-slate-200'}`}>
                            <tr>
                              <th className="px-4 py-2">#</th>
                              <th className="px-4 py-2">{T.colEmpName}</th>
                              <th className="px-4 py-2">Username</th>
                              <th className="px-4 py-2">PIN</th>
                              <th className="px-4 py-2">{T.colRoleDept}</th>
                              <th className="px-4 py-2">{T.colLanguages}</th>
                              <th className="px-4 py-2">Team</th>
                              <th className="px-4 py-2 text-right">{T.colActionsLbl}</th>
                            </tr>
                          </thead>
                          <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-200'}`}>
                            {filteredEmployees.map((emp, idx) => {
                              const teamKey = emp.team?.trim() || '';
                              const badgeClass = teamKey ? (teamColors[teamKey] || defaultBadge) : '';
                              return (
                                <tr key={emp.id} className={`transition ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                                  <td className="px-4 py-2.5 font-mono font-bold text-slate-500">{idx + 1}</td>
                                  <td className="px-4 py-2.5 font-extrabold">{emp.name}</td>
                                  <td className="px-4 py-2.5 font-mono font-bold text-sky-400">{emp.username || emp.name.toLowerCase()}</td>
                                  <td className="px-4 py-2.5 font-mono font-extrabold text-amber-300">{emp.pin || '1234'}</td>
                                  <td className="px-4 py-2.5 opacity-80">{emp.role}</td>
                                  <td className="px-4 py-2.5">
                                    <span className={`rounded px-2 py-0.5 font-mono text-[0.7rem] font-bold ${isDark ? 'bg-white/10' : 'bg-slate-100 text-slate-700'}`}>
                                      {emp.languages.join(' / ')}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2.5">
                                    {teamKey ? (
                                      <span className={`rounded px-1.5 py-0 text-[9px] font-extrabold leading-4 ${badgeClass}`}>
                                        {teamKey}
                                      </span>
                                    ) : (
                                      <span className="opacity-30 text-[0.65rem]">—</span>
                                    )}
                                  </td>
                                  <td className="px-4 py-2.5 text-right">
                                    <div className="flex justify-end gap-1.5">
                                      <button
                                        onClick={() => handleOpenEditShift(emp)}
                                        className="rounded-2xl bg-slate-900 px-2.5 py-1 text-[0.7rem] font-bold text-white hover:bg-slate-800 transition"
                                      >
                                        Edit Info
                                      </button>
                                      <button
                                        onClick={() => handleDeleteEmp(emp.id)}
                                        className="rounded-2xl bg-black/60 px-2 py-1 text-[0.7rem] font-bold text-red-200 hover:bg-black transition"
                                        title="Remove Employee"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* Deleted Employees Archive */}
            <div className={`rounded-2xl border-2 p-5 shadow-xl ${isDark ? 'border-red-900/40 bg-[#1a0f0f] text-white' : 'border-red-200 bg-slate-50 text-black'}`}>
              <button
                onClick={() => setShowDeletedArchive(v => !v)}
                className="flex w-full items-center justify-between text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🗑️</span>
                  <span className={`text-sm font-extrabold ${isDark ? 'text-red-300' : 'text-slate-700'}`}>
                    {T.deletedArchiveTitle} ({deletedEmployees.length})
                  </span>
                </div>
                <span className={`text-xs font-bold ${isDark ? 'text-red-400' : 'text-slate-600'}`}>
                  {showDeletedArchive ? '▲ ' + T.hideLabel : '▼ ' + T.showLabel}
                </span>
              </button>

              {showDeletedArchive && (
                <div className="mt-4">
                  {deletedEmployees.length === 0 ? (
                    <p className={`text-xs font-bold opacity-60 text-center py-4 ${isDark ? 'text-white' : 'text-black'}`}>
                      {T.noArchivedYet}
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className={`font-extrabold uppercase border-b ${isDark ? 'bg-black/40 text-red-300' : 'bg-slate-100 text-red-800'}`}>
                          <tr>
                            <th className="p-3">{T.colName}</th>
                            <th className="p-3">{T.colRole}</th>
                            <th className="p-3">Auto-Purge Status</th>
                            <th className="p-3 text-right">{T.colAction}</th>
                          </tr>
                        </thead>
                        <tbody className={`divide-y ${isDark ? 'divide-red-900/30' : 'divide-red-100'}`}>
                          {deletedEmployees.map(emp => {
                            const archivedAt = emp.archivedAt || Date.now();
                            const daysLeft = Math.max(1, Math.ceil((7 * 86400 * 1000 - (Date.now() - archivedAt)) / (86400 * 1000)));
                            return (
                              <tr key={emp.id} className="opacity-80 hover:opacity-100 transition">
                                <td className="p-3 font-extrabold">{emp.name}</td>
                                <td className="p-3">{emp.role}</td>
                                <td className="p-3">
                                  <span className="inline-flex items-center gap-1 rounded bg-slate-800/10 px-2.5 py-1 text-[11px] font-bold text-amber-400 border border-amber-500/30">
                                    ⏳ Auto-deletes in {daysLeft}d
                                  </span>
                                </td>
                                <td className="p-3 text-right">
                                  <div className="flex items-center justify-end gap-2">
                                    <button
                                      onClick={() => handleRestoreEmp(emp.id)}
                                      className="rounded-2xl bg-black/80 px-3 py-1.5 text-xs font-bold text-emerald-100 hover:bg-slate-900 transition flex items-center gap-1"
                                    >
                                      <span>↩️</span> {T.restoreBtn2}
                                    </button>
                                    <button
                                      onClick={() => handleDeleteForeverEmp(emp.id)}
                                      className="rounded-2xl bg-black/80 px-3 py-1.5 text-xs font-bold text-red-100 hover:bg-slate-900 transition flex items-center gap-1"
                                      title="Permanently delete from database"
                                    >
                                      <span>🔥</span> Delete Forever
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Page Tab 3: Reports & Payroll Page */}
        {/* ===================== PC SETUP TAB ===================== */}
        {activeTab === 'setup' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className={`rounded-3xl p-8 shadow-2xl border-2 ${ isDark ? 'bg-[#0f172a] border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
              <h2 className="text-2xl font-black mb-2">{T.setupHeader}</h2>
              <p className={`text-sm mb-8 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {T.setupSubheader}
              </p>

              {/* Step 1 */}
              <div className={`rounded-2xl p-6 mb-4 border ${ isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-start gap-4">
                  <div className="text-3xl">1️⃣</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">{T.step1Header}</h3>
                    <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {T.step1Text}
                    </p>
                    <a
                      href="https://github.com/ActivityWatch/activitywatch/releases/download/v0.12.2/activitywatch-v0.12.2-windows-x86_64-setup.exe"
                      className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-black transition"
                    >
                      {T.step1DownloadBtn}
                    </a>
                    <p className={`text-xs mt-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {T.step1TrayNote}
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 2 */}
              <div className={`rounded-2xl p-6 mb-4 border ${ isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-start gap-4">
                  <div className="text-3xl">2️⃣</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">{T.step2Header}</h3>
                    <p className={`text-sm mb-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {T.step2Text}
                    </p>
                    <a
                      href="/downloads/LimassolTracker_v1.1.3.exe"
                      download
                      className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 text-sm font-bold text-white hover:bg-black transition"
                    >
                      {T.step2DownloadBtn}
                    </a>
                    <p className={`text-xs mt-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {T.step2FolderNote}
                    </p>
                  </div>
                </div>
              </div>

              {/* Step 3 */}
              <div className={`rounded-2xl p-6 border ${ isDark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-start gap-4">
                  <div className="text-3xl">3️⃣</div>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg mb-1">{T.step3Header}</h3>
                    <p className={`text-sm mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                      {T.step3Text}
                    </p>
                    <div className={`rounded-2xl p-3 text-sm font-mono mt-3 ${ isDark ? 'bg-black/40 text-green-400' : 'bg-slate-100 text-slate-700'}`}>
                      {T.step3DoneBadge}
                    </div>
                    <p className={`text-xs mt-3 ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                      {T.step3AutostartNote}
                    </p>
                  </div>
                </div>
              </div>

              {/* Autostart tip */}
              <div className={`rounded-2xl p-4 mt-4 border ${ isDark ? 'bg-slate-800/10 border-yellow-500/30' : 'bg-slate-50 border-yellow-200'}`}>
                <p className={`text-sm font-semibold ${ isDark ? 'text-yellow-300' : 'text-slate-700'}`}>
                  {T.autostartTipTitle}
                </p>
                <p className={`text-xs mt-1 ${ isDark ? 'text-yellow-400/70' : 'text-slate-600'}`}>
                  {T.autostartTipText}
                </p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* Reports & Payroll Center */}
            <div className={`rounded-2xl border-2 p-6 shadow-xl ${isDark ? 'border-slate-300/30 bg-[#16363d] text-white' : 'border-slate-200/60 bg-white text-black'}`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-serif text-xl font-bold flex items-center gap-2">
                {T.reportsAdvTitle}
              </h2>
              <p className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {T.reportsAdvDesc}
              </p>
            </div>

            {/* Export Actions */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={exportPayrollSummaryCSV}
                className="rounded-2xl bg-slate-900 px-4 py-2.5 text-xs font-extrabold text-white shadow transition hover:bg-slate-800 flex items-center gap-1.5"
              >
                {T.exportPayrollBtn}
              </button>
              <button
                onClick={exportFilteredLogsCSV}
                className="rounded-2xl bg-slate-900 px-4 py-2.5 text-xs font-extrabold text-white shadow transition hover:bg-slate-800 flex items-center gap-1.5"
              >
                {T.exportDetailedBtn}
              </button>
              <button
                onClick={syncToClockify}
                className="rounded-2xl bg-black dark:bg-white px-4 py-2.5 text-xs font-extrabold text-white dark:text-black shadow transition hover:opacity-80 flex items-center gap-1.5"
              >
                ⏱️ Sync to Clockify
              </button>
              <button
                onClick={() => setShowPrintReportModal(true)}
                className="rounded-2xl bg-slate-900 px-4 py-2.5 text-xs font-extrabold text-white shadow transition hover:bg-slate-800 flex items-center gap-1.5"
              >
                {T.printPdfBtn}
              </button>
            </div>
          </div>

          

          {/* ── Rich Date Navigation Bar ── */}
          {(() => {
            const todayStr = new Date().toISOString().split('T')[0];
            const yesterStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];

            // Parse selected date to build month dropdown
            const selDate = reportStartDate ? new Date(reportStartDate + 'T12:00:00') : new Date();
            const viewYear = selDate.getFullYear();
            const viewMonth = selDate.getMonth();
            const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
            const monthDays: { label: string; date: string }[] = [];
            for (let d = 1; d <= daysInMonth; d++) {
              const dt = new Date(viewYear, viewMonth, d);
              const iso = dt.toISOString().split('T')[0];
              const dayName = dt.toLocaleDateString('en-GB', { weekday: 'short' });
              monthDays.push({ label: `${String(d).padStart(2,'0')} ${dayName}`, date: iso });
            }
            const monthLabel = selDate.toLocaleString('en-US', { month: 'long', year: 'numeric' });
            const goToDate = (iso: string) => { setReportStartDate(iso); setReportEndDate(iso); };
            const shiftDay = (delta: number) => {
              const base = reportStartDate ? new Date(reportStartDate + 'T12:00:00') : new Date();
              base.setDate(base.getDate() + delta);
              goToDate(base.toISOString().split('T')[0]);
            };
            const shiftMonth = (delta: number) => {
              const base = reportStartDate ? new Date(reportStartDate + 'T12:00:00') : new Date();
              base.setMonth(base.getMonth() + delta);
              const maxDay = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();
              if (base.getDate() > maxDay) base.setDate(maxDay);
              goToDate(base.toISOString().split('T')[0]);
            };
            const isTodaySelected = reportStartDate === todayStr && reportEndDate === todayStr;
            // const isThisMonth = viewYear >= new Date().getFullYear() && viewMonth >= new Date().getMonth();

            return (
              <div className={`mt-5 rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-black/40 text-white' : 'border-slate-200 bg-white text-black'}`}>
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => goToDate(todayStr)}
                    className={`rounded-2xl px-3 py-1.5 text-xs font-extrabold shadow transition ${
                      isTodaySelected
                        ? 'bg-slate-900 text-white'
                        : isDark ? 'border border-white/20 bg-transparent hover:bg-white/10 text-white' : 'border border-slate-200/60 bg-slate-100 hover:bg-slate-200 text-black'
                    }`}
                  >
                    Today
                  </button>

                  {/* Yesterday chip */}
                  <button
                    onClick={() => goToDate(yesterStr)}
                    className={`rounded-2xl px-3 py-1.5 text-xs font-extrabold shadow transition ${
                      reportStartDate === yesterStr && reportEndDate === yesterStr
                        ? 'bg-slate-900 text-white'
                        : isDark ? 'border border-white/20 bg-transparent hover:bg-white/10 text-white' : 'border border-slate-200/60 bg-slate-100 hover:bg-slate-200 text-black'
                    }`}
                  >
                    Yesterday
                  </button>

                  <div className="flex-1" />
                </div>

                {/* Row 2: Day navigator */}
                <div className={`flex items-center gap-2 rounded-2xl border px-3 py-2 ${isDark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
                  {/* Prev month */}
                  <button
                    onClick={() => shiftMonth(-1)}
                    title="Previous month"
                    className={`rounded-2xl px-2 py-1 text-xs font-black transition opacity-70 hover:opacity-100 ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-200'}`}
                  >
                    «
                  </button>

                  {/* Prev day */}
                  <button
                    onClick={() => shiftDay(-1)}
                    title="Previous day"
                    className={`rounded-2xl px-2.5 py-1 text-sm font-black transition ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-200'}`}
                  >
                    ‹
                  </button>

                  {/* Month dropdown */}
                  <div className="flex items-center gap-2 flex-1 justify-center">
                    <span className={`text-xs font-extrabold opacity-60`}>{monthLabel}</span>
                    <select
                      value={reportStartDate || todayStr}
                      onChange={e => goToDate(e.target.value)}
                      className={`rounded-2xl border px-3 py-1.5 text-sm font-extrabold outline-none cursor-pointer transition ${
                        isDark ? 'border-white/20 bg-black/60 text-white' : 'border-slate-200/60 bg-white text-slate-900'
                      }`}
                    >
                      {monthDays.map(d => (
                        <option key={d.date} value={d.date}>
                          {d.label}{d.date === todayStr ? ' — Today' : d.date === yesterStr ? ' — Yesterday' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Next day */}
                  <button
                    onClick={() => shiftDay(1)}
                    title="Next day"
                    disabled={reportStartDate === todayStr || !reportStartDate}
                    className={`rounded-2xl px-2.5 py-1 text-sm font-black transition ${
                      (reportStartDate === todayStr || !reportStartDate)
                        ? 'opacity-20 cursor-not-allowed'
                        : isDark ? 'hover:bg-white/10' : 'hover:bg-slate-200'
                    }`}
                  >
                    ›
                  </button>

                  {/* Next month */}
                  <button
                    onClick={() => shiftMonth(1)}
                    title="Next month"
                    disabled={viewYear >= new Date().getFullYear() && viewMonth >= new Date().getMonth()}
                    className={`rounded-2xl px-2 py-1 text-xs font-black transition opacity-70 hover:opacity-100 ${
                      (viewYear >= new Date().getFullYear() && viewMonth >= new Date().getMonth())
                        ? 'opacity-20 cursor-not-allowed'
                        : isDark ? 'hover:bg-white/10' : 'hover:bg-slate-200'
                    }`}
                  >
                    »
                  </button>

                  {/* Native date picker */}
                  <input
                    type="date"
                    max={todayStr}
                    value={reportStartDate || todayStr}
                    onChange={e => goToDate(e.target.value)}
                    title="Pick any date"
                    className={`rounded-2xl border px-2 py-1 text-xs font-bold outline-none cursor-pointer transition ${
                      isDark ? 'border-white/20 bg-black/60 text-white' : 'border-slate-200/60 bg-white text-slate-900'
                    }`}
                  />
                </div>
              </div>
              </div>
            );
          })()}

{/* VIEW MODE 0: Interactive Monthly Calendar */}
          {viewMode === 'calendar' && (
            <div className={`mt-5 rounded-2xl border p-5 ${isDark ? 'border-white/20 bg-black/40 text-white' : 'border-slate-200/60 bg-white text-black'}`}>
              {/* Calendar Header Navigation */}
              <div className="flex items-center justify-between border-b pb-4 mb-4 border-white/10">
                <div className="flex items-center gap-3">
                  <h3 className="font-serif text-lg font-bold">
                    📅 {calendarMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' })}
                  </h3>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-slate-300/40">
                    {T.clickDayHint}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const prev = new Date(calendarMonth);
                      prev.setMonth(prev.getMonth() - 1);
                      setCalendarMonth(prev);
                    }}
                    className="rounded-2xl border px-3 py-1 text-xs font-extrabold transition hover:bg-white/10"
                  >
                    {T.prevMonth}
                  </button>
                  <button
                    onClick={() => setCalendarMonth(new Date())}
                    className="rounded-2xl border px-3 py-1 text-xs font-extrabold bg-white/20 transition hover:bg-white/30"
                  >
                    {T.todayBtn}
                  </button>
                  <button
                    onClick={() => {
                      const next = new Date(calendarMonth);
                      next.setMonth(next.getMonth() + 1);
                      setCalendarMonth(next);
                    }}
                    className="rounded-2xl border px-3 py-1 text-xs font-extrabold transition hover:bg-white/10"
                  >
                    {T.nextMonth}
                  </button>
                </div>
              </div>

              {/* Days of Week */}
              <div className="grid grid-cols-7 gap-1 text-center font-extrabold text-xs uppercase text-slate-400 mb-2">
                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
                <div>Sun</div>
              </div>

              {/* Month Grid Cells */}
              <div className="grid grid-cols-7 gap-2">
                {getDaysInMonth(calendarMonth).map((dayObj, idx) => {
                  const todayStr = new Date().toISOString().split('T')[0];
                  const isToday = dayObj.dateStr === todayStr;
                  const isSelected = reportStartDate === dayObj.dateStr;

                  // Logs for this specific day
                  const dayLogs = logs.filter(l => l.date === dayObj.dateStr);
                  const dayTotalHours = dayLogs.reduce((sum, l) => sum + l.hours, 0);

                  return (
                    <div
                      key={idx}
                      onClick={() => {
                        setReportStartDate(dayObj.dateStr);
                        setReportEndDate(dayObj.dateStr);
                        setLogDate(dayObj.dateStr);
                      }}
                      className={`min-h-[85px] rounded-2xl border p-2.5 flex flex-col justify-between cursor-pointer transition active:scale-95 ${
                        !dayObj.isCurrentMonth
                          ? 'opacity-40 border-transparent bg-transparent'
                          : isToday
                          ? 'border-slate-300 bg-emerald-950/40 text-white shadow-lg ring-2 ring-emerald-500'
                          : isSelected
                          ? 'border-amber-500 bg-amber-950/40 text-white'
                          : isDark
                          ? 'border-white/15 bg-black/50 hover:border-white/40 hover:bg-black/70'
                          : 'border-slate-200/60 bg-slate-50 hover:border-slate-400 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-extrabold text-sm ${isToday ? 'text-emerald-400 font-black' : ''}`}>
                          {dayObj.dayNum}
                        </span>
                        {isToday && (
                          <span className="text-[0.6rem] font-bold bg-slate-800 text-slate-950 px-1.5 py-0.2 rounded uppercase">
                            {'Today'}
                          </span>
                        )}
                      </div>

                      <div className="mt-2 space-y-1 text-[0.65rem] font-bold">
                        {dayTotalHours > 0 ? (
                          <div className="rounded bg-emerald-950 text-emerald-300 px-1.5 py-0.5 border border-slate-300/30 flex justify-between">
                            <span>{T.workedLabel2}</span>
                            <span className="font-mono">{dayTotalHours}h</span>
                          </div>
                        ) : (
                          <div className="text-slate-500 font-normal italic">{T.noLogsLabel}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Search & Status Filters Bar */}
          <div className={`mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-3 ${isDark ? 'border-white/20 bg-black/40' : 'border-slate-200/60 bg-slate-100'}`}>
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <input
                type="text"
                placeholder={T.searchPlaceholder}
                value={empSearchQuery}
                onChange={(e) => setEmpSearchQuery(e.target.value)}
                className={`w-full rounded-2xl border px-3.5 py-2 text-xs font-bold outline-none ${
                  isDark ? 'border-white/30 bg-black/60 text-white placeholder-slate-400 focus:border-white' : 'border-slate-400 bg-white text-black focus:border-black'
                }`}
              />
              {empSearchQuery && (
                <button 
                  onClick={() => setEmpSearchQuery('')}
                  className="absolute right-3 top-2 text-xs font-extrabold text-slate-400 hover:text-white"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Status Filter Tabs */}
            <div className="flex flex-wrap items-center gap-1.5 text-xs font-extrabold">
              <button
                onClick={() => setEmpStatusFilter('ALL')}
                className={`rounded-2xl px-3 py-1.5 transition ${
                  empStatusFilter === 'ALL'
                    ? isDark ? 'bg-white text-slate-900' : 'bg-[#133137] text-white'
                    : isDark ? 'bg-black/40 text-slate-300 hover:bg-white/10' : 'bg-white text-slate-700 hover:bg-slate-200'
                }`}
              >
                {T.filterAll} ({employees.length})
              </button>
              <button
                onClick={() => setEmpStatusFilter('checked_in')}
                className={`rounded-2xl px-3 py-1.5 transition ${
                  empStatusFilter === 'checked_in'
                    ? 'bg-slate-900 text-white'
                    : isDark ? 'bg-emerald-950/60 text-emerald-300 hover:bg-black' : 'bg-slate-100 text-emerald-800 hover:bg-slate-200'
                }`}
              >
                {T.filterWorking} ({employees.filter(e => e.status === 'checked_in').length})
              </button>
              <button
                onClick={() => setEmpStatusFilter('expected')}
                className={`rounded-2xl px-3 py-1.5 transition ${
                  empStatusFilter === 'expected'
                    ? 'bg-slate-900 text-white'
                    : isDark ? 'bg-amber-950/60 text-amber-300 hover:bg-black' : 'bg-slate-100 text-amber-800 hover:bg-slate-200'
                }`}
              >
                {T.filterExpected} ({employees.filter(e => e.status === 'expected').length})
              </button>
              <button
                onClick={() => setEmpStatusFilter('completed')}
                className={`rounded-2xl px-3 py-1.5 transition ${
                  empStatusFilter === 'completed'
                    ? 'bg-slate-900 text-white'
                    : isDark ? 'bg-blue-950/60 text-blue-300 hover:bg-black' : 'bg-slate-100 text-blue-800 hover:bg-slate-200'
                }`}
              >
                {T.filterDone} ({employees.filter(e => e.status === 'completed').length})
              </button>
              <button
                onClick={() => setEmpStatusFilter('absent')}
                className={`rounded-2xl px-3 py-1.5 transition ${
                  empStatusFilter === 'absent'
                    ? 'bg-slate-900 text-white'
                    : isDark ? 'bg-red-950/60 text-red-300 hover:bg-black' : 'bg-slate-100 text-red-800 hover:bg-slate-200'
                }`}
              >
                {T.filterOff} ({employees.filter(e => e.status === 'absent').length})
              </button>
            </div>
          </div>

          
{/* VIEW MODE 1: Clean Timesheet Table View */}
          {viewMode === 'grid' && (
            <div className={`mt-5 overflow-hidden rounded-2xl border ${isDark ? 'border-white/20 bg-black/40 text-white' : 'border-slate-200/60 bg-white text-black'}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className={`font-extrabold uppercase tracking-wider border-b ${
                    isDark ? 'bg-black/80 text-white border-white/20' : 'bg-slate-200 text-black border-slate-200/60'
                  }`}>
                    <tr>
                      <th className="px-4 py-3.5">{T.colNameRole}</th>
                      <th className="px-4 py-3.5">{T.colArrival}</th>
                      <th className="px-4 py-3.5">{T.colDeparture}</th>
                      <th className="px-4 py-3.5 text-center">{T.colWorkedHrs}</th>
                      <th className="px-4 py-3.5">{T.colShiftStatus}</th>
                      <th className="px-4 py-3.5 text-right">{T.colActions}</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-white/15' : 'divide-slate-200'}`}>
                    {filteredEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="px-5 py-8 text-center font-bold opacity-75">
                          {T.noEmployeesFilter}
                        </td>
                      </tr>
                    ) : (
                      filteredEmployees.map((emp) => {
                        const { status, checkIn, checkOut, isLiveFromClockify, activeHrsDisplay } = getMergedEmployeeState(emp);
                        const calculatedHrs = calculateExactHours(checkIn, checkOut);
                        
                        return (
                          <tr key={emp.id} className={`transition ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}>
                            <td className="px-4 py-3 font-extrabold">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm">{emp.name}</span>
                                {isLiveFromClockify && (
                                  <span className="animate-pulse rounded bg-slate-800/20 border border-indigo-500/50 px-1 py-0.5 text-[0.6rem] font-bold text-indigo-400" title="Clockify Timer Active">
                                    ⏱️ CLOCKIFY
                                  </span>
                                )}
                                <span className={`rounded px-1.5 py-0.5 text-[0.65rem] font-bold border ${isDark ? 'bg-white/20 text-white border-white/30' : 'bg-slate-200 text-black border-slate-400'}`}>
                                  {emp.languages.join('/')}
                                </span>
                              </div>
                              <div className="text-[0.7rem] font-medium opacity-75">{emp.role}</div>
                            </td>
                            <td className="px-4 py-3 font-mono font-bold">
                              {checkIn ? (
                                <span className={`rounded px-2 py-1 border ${isDark ? 'bg-emerald-950/80 text-emerald-300 border-slate-300/40' : 'bg-slate-100 text-emerald-800 border-emerald-400'}`}>
                                  🟢 {formatNiceDisplayTime(checkIn)}
                                </span>
                              ) : (
                                <span className="text-slate-500 font-normal">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 font-mono font-bold">
                              {checkOut ? (
                                <span className={`rounded px-2 py-1 border ${isDark ? 'bg-blue-950/80 text-blue-300 border-slate-300/40' : 'bg-slate-100 text-blue-800 border-blue-400'}`}>
                                  🔴 {formatNiceDisplayTime(checkOut)}
                                </span>
                              ) : (
                                <span className="text-slate-500 font-normal">-</span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center font-mono font-extrabold text-emerald-400">
                              {status === 'completed' ? `${calculatedHrs} hrs` : status === 'checked_in' ? (activeHrsDisplay || `${calculatedHrs} hrs`) : '-'}
                            </td>
                            <td className="px-4 py-3 font-bold">
                              {status === 'expected' && <span className={`rounded-xl px-2.5 py-1 border ${isDark ? 'bg-amber-950/80 text-amber-300 border-amber-500/40' : 'bg-slate-100 text-amber-800 border-slate-300'}`}>{T.statusExpectedBadge}</span>}
                              {status === 'checked_in' && <span className={`rounded-xl px-2.5 py-1 border ${isDark ? 'bg-emerald-950/80 text-emerald-300 border-slate-300/40' : 'bg-slate-100 text-emerald-800 border-emerald-400'}`}>{T.statusWorkingBadge}</span>}
                              {status === 'completed' && <span className={`rounded-xl px-2.5 py-1 border ${isDark ? 'bg-blue-950/80 text-blue-300 border-slate-300/40' : 'bg-slate-100 text-blue-800 border-blue-400'}`}>{T.statusDoneBadge}</span>}
                              {status === 'absent' && <span className={`rounded-xl px-2.5 py-1 border ${isDark ? 'bg-red-950/80 text-red-300 border-red-500/40' : 'bg-slate-100 text-red-800 border-red-400'}`}>{T.statusAbsentBadge}</span>}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {status !== 'checked_in' && (
                                  <button onClick={() => handleStatusChange(emp.id, 'checked_in')} className="rounded bg-slate-900 px-2.5 py-1 font-bold text-white hover:bg-slate-800 transition">
                                    In
                                  </button>
                                )}
                                {status === 'checked_in' && (
                                  <button onClick={() => handleStatusChange(emp.id, 'completed')} className="rounded bg-slate-900 px-2.5 py-1 font-bold text-white hover:bg-slate-800 transition">
                                    Out
                                  </button>
                                )}
                                <button
                                  onClick={() => handleOpenEditTimes(emp)}
                                  className="rounded border border-slate-500 bg-slate-800 px-2.5 py-1 font-bold text-slate-200 hover:bg-slate-700 transition"
                                  title="Modify entry/leave hours"
                                >
                                  {T.editTimesBtn}
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          
{/* Date Range Selection */}
          <div className={`mt-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-4 ${isDark ? 'border-white/20 bg-black/40' : 'border-slate-200/60 bg-slate-100'}`}>
            <div className="flex flex-wrap items-center gap-4 text-xs font-extrabold">
              <div className="flex items-center gap-2">
                <label>{T.fromLabel2}</label>
                <input
                  type="date"
                  value={reportStartDate}
                  onChange={(e) => setReportStartDate(e.target.value)}
                  className={`rounded-2xl border px-3 py-1.5 font-bold outline-none ${
                    isDark ? 'border-white/40 bg-black/60 text-white' : 'border-slate-400 bg-white text-black'
                  }`}
                />
              </div>
              <div className="flex items-center gap-2">
                <label>{T.toLabel2}</label>
                <input
                  type="date"
                  value={reportEndDate}
                  onChange={(e) => setReportEndDate(e.target.value)}
                  className={`rounded-2xl border px-3 py-1.5 font-bold outline-none ${
                    isDark ? 'border-white/40 bg-black/60 text-white' : 'border-slate-400 bg-white text-black'
                  }`}
                />
              </div>

              {/* Presets */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    const start = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
                    const end = d.toISOString().split('T')[0];
                    setReportStartDate(start);
                    setReportEndDate(end);
                  }}
                  className={`rounded-2xl border px-2.5 py-1 text-[0.7rem] font-bold ${isDark ? 'border-white/30 bg-white/10 hover:bg-white/20' : 'border-slate-400 bg-white hover:bg-slate-200'}`}
                >
                  This Month
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const d = new Date();
                    const end = d.toISOString().split('T')[0];
                    d.setDate(d.getDate() - 30);
                    const start = d.toISOString().split('T')[0];
                    setReportStartDate(start);
                    setReportEndDate(end);
                  }}
                  className={`rounded-2xl border px-2.5 py-1 text-[0.7rem] font-bold ${isDark ? 'border-white/30 bg-white/10 hover:bg-white/20' : 'border-slate-400 bg-white hover:bg-slate-200'}`}
                >
                  Past 30 Days
                </button>
              </div>
            </div>

            {/* Summary Stat for Selected Period */}
            <div className="text-right text-xs font-bold">
              <span className="text-slate-400">Total Hours in Period: </span>
              <span className="font-mono text-sm font-extrabold text-emerald-400">
                {logs
                  .filter(l => (!reportStartDate || l.date >= reportStartDate) && (!reportEndDate || l.date <= reportEndDate))
                  .reduce((sum, l) => sum + l.hours, 0)
                  .toFixed(1)} hrs
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Time Log Table & Actions */}
        <div className={`mt-8 rounded-2xl border-2 p-6 shadow-xl ${isDark ? 'border-white/20 bg-[#133137] text-white' : 'border-slate-200/60 bg-white text-black'}`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className={`font-serif text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                {T.timeLogsTableTitle}
              </h2>
              <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Detailed work hours and task descriptions</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  if (employees.length > 0) setLogEmployeeId(employees[0].id);
                  setShowAddLogModal(true);
                }}
                className={`rounded-2xl px-4 py-2.5 text-xs font-extrabold shadow-md transition ${
                  isDark ? 'bg-white text-slate-900 hover:bg-slate-100' : 'bg-[#133137] text-white hover:bg-[#1a444c]'
                }`}
              >
                📝 Log Hours / Task
              </button>
              <button
                onClick={exportFilteredLogsCSV}
                className={`rounded-2xl border px-4 py-2.5 text-xs font-bold transition ${
                  isDark ? 'border-white/30 bg-white/20 text-white hover:bg-white/30' : 'border-slate-400 bg-slate-100 text-black hover:bg-slate-200'
                }`}
              >
                📥 Export CSV Report
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className={`mt-5 flex flex-wrap items-center gap-4 rounded-2xl border p-4 ${isDark ? 'border-white/20 bg-black/50 text-white' : 'border-slate-200/60 bg-slate-100 text-black'}`}>
            <div>
              <label className={`mr-2 text-xs font-extrabold ${isDark ? 'text-white' : 'text-black'}`}>Filter Language:</label>
              <select
                value={filterLang}
                onChange={(e) => setFilterLang(e.target.value)}
                className={`rounded-2xl border px-3 py-1.5 text-xs font-bold outline-none ${
                  isDark ? 'border-white/40 bg-black/70 text-white focus:border-white' : 'border-slate-400 bg-white text-black focus:border-black'
                }`}
              >
                <option value="ALL" className={isDark ? "bg-[#091a1d] text-white" : "bg-white text-black"}>All Languages</option>
                <option value="EN" className={isDark ? "bg-[#091a1d] text-white" : "bg-white text-black"}>EN (English)</option>
                <option value="DE" className={isDark ? "bg-[#091a1d] text-white" : "bg-white text-black"}>DE (German)</option>
                <option value="FR" className={isDark ? "bg-[#091a1d] text-white" : "bg-white text-black"}>FR (French)</option>
                <option value="ES" className={isDark ? "bg-[#091a1d] text-white" : "bg-white text-black"}>ES (Spanish)</option>
                <option value="AR" className={isDark ? "bg-[#091a1d] text-white" : "bg-white text-black"}>AR (Arabic)</option>
              </select>
            </div>
          </div>

          {/* Log Table */}
          <div className={`mt-5 overflow-hidden rounded-2xl border ${isDark ? 'border-white/20 bg-black/40 text-white' : 'border-slate-200/60 bg-white text-black'}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className={`text-xs font-extrabold uppercase tracking-wider border-b ${
                  isDark ? 'bg-black/80 text-white border-white/20' : 'bg-slate-200 text-black border-slate-200/60'
                }`}>
                  <tr>
                    <th className="px-5 py-4">Date</th>
                    <th className="px-5 py-4">Employee</th>
                    <th className="px-5 py-4">Project / Task</th>
                    <th className="px-5 py-4">Hours Logged</th>
                    <th className="px-5 py-4">Check-In Time</th>
                    <th className="px-5 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-white/15' : 'divide-slate-200'}`}>
                  {filteredLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className={`px-5 py-8 text-center text-xs font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                        {T.noLogsFilter}
                      </td>
                    </tr>
                  ) : (
                    filteredLogs.map((log) => (
                      <tr key={log.id} className={`transition ${isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}>
                        <td className="px-5 py-4 font-mono text-xs font-bold">{log.date}</td>
                        <td className="px-5 py-4 font-extrabold">
                          {log.employeeName}
                        </td>
                        <td className="px-5 py-4 text-xs font-bold">
                          {log.projectTask}
                        </td>
                        <td className={`px-5 py-4 font-mono text-xs font-extrabold ${isDark ? 'text-emerald-300' : 'text-slate-700'}`}>
                          {log.hours} hrs
                        </td>
                        <td className="px-5 py-4 font-mono text-xs font-bold">
                          {log.timestamp}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            className={`text-xs font-bold underline transition ${isDark ? 'text-red-300 hover:text-red-100' : 'text-slate-600 hover:text-red-800'}`}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
          </div>
        )}
      </main>

      {/* Modal 1: Add Time Log */}
      {showAddLogModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl border-2 p-6 shadow-2xl ${isDark ? 'border-white/30 bg-[#133137] text-white' : 'border-slate-400 bg-white text-black'}`}>
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>Log Work Hours & Task</h3>
            <form onSubmit={handleCreateLog} className="mt-4 space-y-4 text-xs">
              <div>
                <label className={`block font-bold ${isDark ? 'text-white' : 'text-black'}`}>Select Employee:</label>
                <select
                  value={logEmployeeId}
                  onChange={(e) => setLogEmployeeId(e.target.value)}
                  className={`mt-1 w-full rounded-2xl border px-3 py-2.5 font-bold outline-none ${
                    isDark ? 'border-white/40 bg-black/60 text-white focus:border-white' : 'border-slate-400 bg-slate-100 text-black focus:border-black'
                  }`}
                >
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id} className={isDark ? "bg-[#091a1d] text-white" : "bg-white text-black"}>
                      {emp.name} ({emp.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className={`block font-bold ${isDark ? 'text-white' : 'text-black'}`}>Date:</label>
                <input
                  type="date"
                  required
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  className={`mt-1 w-full rounded-2xl border px-3 py-2.5 font-bold outline-none ${
                    isDark ? 'border-white/40 bg-black/60 text-white focus:border-white' : 'border-slate-400 bg-slate-100 text-black focus:border-black'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-bold ${isDark ? 'text-white' : 'text-black'}`}>{T.hoursWorkedLabel}</label>
                <input
                  type="number"
                  min="0.5"
                  max="24"
                  step="0.5"
                  required
                  value={logHours}
                  onChange={(e) => setLogHours(parseFloat(e.target.value) || 0)}
                  className={`mt-1 w-full rounded-2xl border px-3 py-2.5 font-bold outline-none ${
                    isDark ? 'border-white/40 bg-black/60 text-white focus:border-white' : 'border-slate-400 bg-slate-100 text-black focus:border-black'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-bold ${isDark ? 'text-white' : 'text-black'}`}>{T.taskLabel}</label>
                <input
                  type="text"
                  required
                  value={logProjectTask}
                  onChange={(e) => setLogProjectTask(e.target.value)}
                  placeholder="e.g. Client Consultation / Operations"
                  className={`mt-1 w-full rounded-2xl border px-3 py-2.5 font-bold outline-none ${
                    isDark ? 'border-white/40 bg-black/60 text-white focus:border-white' : 'border-slate-400 bg-slate-100 text-black focus:border-black'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddLogModal(false)}
                  className={`rounded-2xl border px-4 py-2.5 font-bold transition ${
                    isDark ? 'border-white/30 bg-white/20 text-white hover:bg-white/30' : 'border-slate-400 bg-slate-200 text-black hover:bg-slate-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`rounded-2xl px-4 py-2.5 font-extrabold transition ${
                    isDark ? 'bg-white text-slate-900 hover:bg-slate-100' : 'bg-[#133137] text-white hover:bg-[#1a444c]'
                  }`}
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Add Employee */}
      {showAddEmpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl border-2 p-6 shadow-2xl ${isDark ? 'border-white/30 bg-[#133137] text-white' : 'border-slate-400 bg-white text-black'}`}>
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>{T.addEmpTitle}</h3>
            <form onSubmit={handleCreateEmployee} className="mt-4 space-y-4 text-xs">

              {/* === REQUIRED FIELDS === */}
              <div>
                <label className={`block font-extrabold ${isDark ? 'text-white' : 'text-black'}`}>
                  Username <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newEmpUsername}
                  onChange={(e) => setNewEmpUsername(e.target.value)}
                  placeholder="e.g. philippe, maximilian..."
                  className={`mt-1 w-full rounded-2xl border px-3 py-2.5 font-bold outline-none ${
                    isDark ? 'border-white/40 bg-black/60 text-white focus:border-white' : 'border-slate-400 bg-slate-100 text-black focus:border-black'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-extrabold ${isDark ? 'text-white' : 'text-black'}`}>
                  PIN (4–6 digits) <span className="text-red-400">*</span>
                </label>
                <input
                  type="text"
                  required
                  maxLength={8}
                  value={newEmpPin}
                  onChange={(e) => setNewEmpPin(e.target.value)}
                  placeholder="e.g. 1234"
                  className={`mt-1 w-full rounded-2xl border px-3 py-2.5 font-bold font-mono outline-none ${
                    isDark ? 'border-white/40 bg-black/60 text-white focus:border-white' : 'border-slate-400 bg-slate-100 text-black focus:border-black'
                  }`}
                />
              </div>

              {/* === OPTIONAL FIELDS === */}
              <details className={`rounded-2xl border p-3 ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
                <summary className={`cursor-pointer text-[0.7rem] font-extrabold uppercase tracking-wider ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  Optional fields (Full name, Role, Languages, Shift)
                </summary>
                <div className="mt-3 space-y-3">
                  <div>
                    <label className={`block font-bold ${isDark ? 'text-white' : 'text-black'}`}>{T.empNameLabel}</label>
                    <input
                      type="text"
                      value={newEmpName}
                      onChange={(e) => setNewEmpName(e.target.value)}
                      placeholder="e.g. Alex Miller"
                      className={`mt-1 w-full rounded-2xl border px-3 py-2.5 font-bold outline-none ${
                        isDark ? 'border-white/40 bg-black/60 text-white focus:border-white' : 'border-slate-400 bg-slate-100 text-black focus:border-black'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block font-bold ${isDark ? 'text-white' : 'text-black'}`}>{T.empRoleLabel}</label>
                    <input
                      type="text"
                      value={newEmpRole}
                      onChange={(e) => setNewEmpRole(e.target.value)}
                      placeholder="e.g. Senior Advisor"
                      className={`mt-1 w-full rounded-2xl border px-3 py-2.5 font-bold outline-none ${
                        isDark ? 'border-white/40 bg-black/60 text-white focus:border-white' : 'border-slate-400 bg-slate-100 text-black focus:border-black'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block font-bold ${isDark ? 'text-white' : 'text-black'}`}>{T.empLangLabel}</label>
                    <input
                      type="text"
                      value={newEmpLangs}
                      onChange={(e) => setNewEmpLangs(e.target.value)}
                      placeholder="EN, DE, FR"
                      className={`mt-1 w-full rounded-2xl border px-3 py-2.5 font-bold outline-none ${
                        isDark ? 'border-white/40 bg-black/60 text-white focus:border-white' : 'border-slate-400 bg-slate-100 text-black focus:border-black'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block font-bold ${isDark ? 'text-white' : 'text-black'}`}>{T.empShiftLabel}</label>
                    <input
                      type="text"
                      value={newEmpShift}
                      onChange={(e) => setNewEmpShift(e.target.value)}
                      placeholder="11:00 AM"
                      className={`mt-1 w-full rounded-2xl border px-3 py-2.5 font-bold outline-none ${
                        isDark ? 'border-white/40 bg-black/60 text-white focus:border-white' : 'border-slate-400 bg-slate-100 text-black focus:border-black'
                      }`}
                    />
                  </div>
                  <div>
                    <label className={`block font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                      Team Name
                    </label>
                    <select
                      value={newEmpTeam}
                      onChange={(e) => setNewEmpTeam(e.target.value)}
                      className={`mt-1 w-full rounded-2xl border px-3 py-2.5 font-bold outline-none cursor-pointer ${
                        isDark ? 'border-white/40 bg-black/60 text-white focus:border-white' : 'border-slate-400 bg-slate-100 text-black focus:border-black'
                      }`}
                    >
                      <option value="">-- No Team Assigned --</option>
                      <option value="Swiss">Swiss</option>
                      <option value="Japan">Japan</option>
                      <option value="Spain">Spain</option>
                      <option value="France">France</option>
                      <option value="Germany">Germany</option>
                      <option value="UK">UK</option>
                      <option value="AU">AU</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
              </details>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddEmpModal(false)}
                  className={`rounded-2xl border px-4 py-2.5 font-bold transition ${
                    isDark ? 'border-white/30 bg-white/20 text-white hover:bg-white/30' : 'border-slate-400 bg-slate-200 text-black hover:bg-slate-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`rounded-2xl px-4 py-2.5 font-extrabold transition ${
                    isDark ? 'bg-white text-slate-900 hover:bg-slate-100' : 'bg-[#133137] text-white hover:bg-[#1a444c]'
                  }`}
                >
                  Save Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 3: Modify User Credentials */}
      {/* Edit Times Modal (Reports Page) */}
      {editingTimesEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-sm rounded-2xl border-2 p-6 shadow-2xl animate-fade-in-up ${
            isDark ? 'border-white/10 bg-[#161b22] text-white' : 'border-slate-200 bg-white text-slate-800'
          }`}>
            <h2 className="mb-4 text-xl font-black">Edit Times: {editingTimesEmp.name}</h2>
            <form onSubmit={handleSaveEditedTimes} className="space-y-4">
              <div>
                <label className="block font-extrabold mb-1 text-sm">Clock In Time:</label>
                <input
                  type="time"
                  value={editTimesCheckIn}
                  onChange={(e) => setEditTimesCheckIn(e.target.value)}
                  className={`w-full rounded-2xl border px-4 py-2.5 font-bold outline-none text-base ${
                    isDark ? 'border-white/40 bg-black/60 text-white' : 'border-slate-400 bg-slate-100 text-black'
                  }`}
                />
              </div>

              <div>
                <label className="block font-extrabold mb-1 text-sm">Clock Out Time:</label>
                <input
                  type="time"
                  value={editTimesCheckOut}
                  onChange={(e) => setEditTimesCheckOut(e.target.value)}
                  className={`w-full rounded-2xl border px-4 py-2.5 font-bold outline-none text-base ${
                    isDark ? 'border-white/40 bg-black/60 text-white' : 'border-slate-400 bg-slate-100 text-black'
                  }`}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleClearEditedTimes(editingTimesEmp.id)}
                  className="rounded-2xl border border-rose-500/50 bg-rose-950/40 text-rose-300 hover:bg-black/60 px-3 py-2 text-xs font-extrabold transition"
                  title="Remove in/out times for today & set status back to expected"
                >
                  🗑️ Clear Times
                </button>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingTimesEmp(null)}
                    className={`rounded-2xl border px-3 py-2 text-xs font-bold transition ${
                      isDark ? 'border-white/30 bg-white/20 text-white hover:bg-white/30' : 'border-slate-400 bg-slate-200 text-black hover:bg-slate-300'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className={`rounded-2xl px-4 py-2 text-xs font-extrabold transition ${
                      isDark ? 'bg-slate-900 text-white hover:bg-slate-800' : 'bg-slate-900 text-white hover:bg-black'
                    }`}
                  >
                    Save Times
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl border-2 p-6 shadow-2xl ${isDark ? 'border-white/30 bg-[#133137] text-white' : 'border-slate-400 bg-white text-black'}`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                ✏️ Edit Credentials ({editingEmp.name})
              </h3>
              <button onClick={() => setEditingEmp(null)} className="text-sm font-bold text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveEditedShift} className="mt-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-extrabold mb-1">Username:</label>
                  <input
                    type="text"
                    value={editEmpUsername}
                    onChange={(e) => setEditEmpUsername(e.target.value)}
                    className={`w-full rounded-2xl border px-3 py-2 font-mono font-bold outline-none ${
                      isDark ? 'border-white/40 bg-black/60 text-white' : 'border-slate-400 bg-slate-100 text-black'
                    }`}
                  />
                </div>
                <div>
                  <label className="block font-extrabold mb-1">PIN (4-6 digits):</label>
                  <input
                    type="text"
                    maxLength={8}
                    value={editEmpPin}
                    onChange={(e) => setEditEmpPin(e.target.value)}
                    className={`w-full rounded-2xl border px-3 py-2 font-mono font-bold outline-none ${
                      isDark ? 'border-white/40 bg-black/60 text-white' : 'border-slate-400 bg-slate-100 text-black'
                    }`}
                  />
                </div>
              </div>

              <div>
                <label className="block font-extrabold mb-1">Full Name (Optional):</label>
                <input
                  type="text"
                  value={editEmpName}
                  onChange={(e) => setEditEmpName(e.target.value)}
                  placeholder="e.g. Alex Miller"
                  className={`w-full rounded-2xl border px-3 py-2 font-bold outline-none ${
                    isDark ? 'border-white/40 bg-black/60 text-white' : 'border-slate-400 bg-slate-100 text-black'
                  }`}
                />
              </div>

              <div>
                <label className="block font-extrabold mb-1">Role / Position (Optional):</label>
                <input
                  type="text"
                  value={editEmpRole}
                  onChange={(e) => setEditEmpRole(e.target.value)}
                  placeholder="e.g. Senior Advisor"
                  className={`w-full rounded-2xl border px-3 py-2 font-bold outline-none ${
                    isDark ? 'border-white/40 bg-black/60 text-white' : 'border-slate-400 bg-slate-100 text-black'
                  }`}
                />
              </div>

              <div>
                <label className="block font-extrabold mb-1">Language:</label>
                <select
                  value={editEmpLangs}
                  onChange={(e) => setEditEmpLangs(e.target.value)}
                  className={`w-full rounded-2xl border px-3 py-2 font-bold outline-none cursor-pointer ${
                    isDark ? 'border-white/40 bg-black/60 text-white' : 'border-slate-400 bg-slate-100 text-black'
                  }`}
                >
                  <option value="">-- Select Language --</option>
                  <option value="EN">EN</option>
                  <option value="DE">DE</option>
                  <option value="FR">FR</option>
                  <option value="ES">ES</option>
                  <option value="IT">IT</option>
                  <option value="RU">RU</option>
                  <option value="NL">NL</option>
                  <option value="PT">PT</option>
                  <option value="GR">GR</option>
                  <option value="TR">TR</option>
                </select>
              </div>

              <div>
                <label className="block font-extrabold mb-1">
                  Team Name:
                </label>
                <select
                  value={editEmpTeam}
                  onChange={(e) => setEditEmpTeam(e.target.value)}
                  className={`w-full rounded-2xl border px-3 py-2 font-bold outline-none cursor-pointer ${
                    isDark ? 'border-white/40 bg-black/60 text-white' : 'border-slate-400 bg-slate-100 text-black'
                  }`}
                >
                  <option value="">-- No Team Assigned --</option>
                  <option value="Swiss">Swiss</option>
                  <option value="Japan">Japan</option>
                  <option value="Spain">Spain</option>
                  <option value="France">France</option>
                  <option value="Germany">Germany</option>
                  <option value="UK">UK</option>
                  <option value="AU">AU</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingEmp(null)}
                  className={`rounded-2xl border px-4 py-2 font-bold transition ${
                    isDark ? 'border-white/30 bg-white/20 text-white hover:bg-white/30' : 'border-slate-400 bg-slate-200 text-black hover:bg-slate-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`rounded-2xl px-4 py-2 font-extrabold transition ${
                    isDark ? 'bg-white text-slate-900 hover:bg-slate-100' : 'bg-[#133137] text-white hover:bg-[#1a444c]'
                  }`}
                >
                  Save Info
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 4: Print/PDF Report Preview */}
      {showPrintReportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md overflow-y-auto">
          <div className={`w-full max-w-4xl rounded-2xl border-2 p-8 shadow-2xl ${isDark ? 'border-white/30 bg-[#133137] text-white' : 'border-slate-400 bg-white text-black'}`}>
            <div className="flex items-center justify-between border-b pb-4 mb-6 border-white/20">
              <div>
                <h2 className="text-xl font-bold font-serif">🇨🇾 Limassol Time Tracker — Executive Attendance & Payroll Report</h2>
                <p className="text-xs opacity-75">Period: {reportStartDate} to {reportEndDate} | Limassol, Cyprus</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="rounded-2xl bg-slate-900 px-4 py-2 text-xs font-extrabold text-white shadow hover:bg-slate-800"
                >
                  🖨️ Print / Save as PDF
                </button>
                <button
                  onClick={() => setShowPrintReportModal(false)}
                  className="rounded-2xl border px-3 py-2 text-xs font-bold opacity-75 hover:opacity-100"
                >
                  Close ✕
                </button>
              </div>
            </div>

            {/* Summary Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border">
                <thead className={`font-extrabold uppercase border-b ${isDark ? 'bg-black/60 text-white' : 'bg-slate-200 text-black'}`}>
                  <tr>
                    <th className="p-3 border-r">#</th>
                    <th className="p-3 border-r">Employee Name</th>
                    <th className="p-3 border-r">Role</th>
                    <th className="p-3 border-r">Languages</th>
                    <th className="p-3 border-r text-center">Shifts Worked</th>
                    <th className="p-3 border-r text-center">Total Hours</th>
                    <th className="p-3 text-center">Avg Hours / Shift</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-white/10' : 'divide-slate-200'}`}>
                  {employees.map((emp, idx) => {
                    const empLogs = logs.filter(l => l.employeeId === emp.id && (!reportStartDate || l.date >= reportStartDate) && (!reportEndDate || l.date <= reportEndDate));
                    const totalHours = empLogs.reduce((sum, l) => sum + l.hours, 0);
                    const shiftsCount = empLogs.length;
                    const avgHours = shiftsCount > 0 ? (totalHours / shiftsCount).toFixed(1) : '0.0';

                    return (
                      <tr key={emp.id} className={idx % 2 === 0 ? 'bg-black/10' : ''}>
                        <td className="p-3 border-r font-mono">{idx + 1}</td>
                        <td className="p-3 border-r font-extrabold">{emp.name}</td>
                        <td className="p-3 border-r opacity-90">{emp.role}</td>
                        <td className="p-3 border-r font-mono">{emp.languages.join('/')}</td>
                        <td className="p-3 border-r text-center font-mono font-bold">{shiftsCount}</td>
                        <td className="p-3 border-r text-center font-mono font-extrabold text-emerald-400">{totalHours.toFixed(1)} hrs</td>
                        <td className="p-3 text-center font-mono">{avgHours} hrs</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Total Grand Summary */}
            <div className="mt-6 flex justify-between items-center rounded-2xl border p-4 bg-black/20 border-white/15">
              <div>
                <span className="text-xs font-bold opacity-75">Total Active Employees: </span>
                <span className="text-sm font-extrabold">{employees.length}</span>
              </div>
              <div>
                <span className="text-xs font-bold opacity-75">Grand Total Logged Hours: </span>
                <span className="text-base font-extrabold text-emerald-400 font-mono">
                  {logs
                    .filter(l => (!reportStartDate || l.date >= reportStartDate) && (!reportEndDate || l.date <= reportEndDate))
                    .reduce((sum, l) => sum + l.hours, 0)
                    .toFixed(1)} hrs
                </span>
              </div>
            </div>

            {/* Signatures */}
            <div className="mt-12 pt-6 border-t border-white/20 flex justify-between text-xs opacity-75">
              <div>
                <p>Prepared By: Operations & HR</p>
                <div className="mt-6 w-48 border-b border-white/40"></div>
              </div>
              <div>
                <p>Approved By: Management / Karfigest SA</p>
                <div className="mt-6 w-48 border-b border-white/40"></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Clockify Integration Modal */}
      {showClockifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
          <div className={`w-full max-w-xl rounded-2xl border p-6 shadow-2xl ${isDark ? 'border-white/20 bg-[#133137] text-white' : 'border-slate-200/60 bg-white text-black'}`}>
            <div className="flex items-center justify-between border-b pb-4 border-white/20">
              <h3 className="text-lg font-bold flex items-center gap-2">
                ⚡ Clockify.me API Backup & Sync
              </h3>
              <button
                onClick={() => setShowClockifyModal(false)}
                className="rounded-2xl px-2.5 py-1 hover:bg-white/10 text-xs font-bold border border-white/20"
              >
                ✕ Close
              </button>
            </div>
            
            <p className="mt-3 text-xs opacity-90 leading-relaxed">
              {T.clockifyDesc}
            </p>

            {clockifyConnectedUser && (
              <div className="mt-3 rounded-2xl bg-slate-800/20 border border-slate-300/30 p-2.5 text-xs font-semibold text-emerald-300 flex items-center justify-between">
                <span>👤 Connected User: <strong>{clockifyConnectedUser}</strong></span>
                {clockifyLastSynced && <span>Last Synced: {clockifyLastSynced}</span>}
              </div>
            )}

            <div className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1">{T.clockifyKeyLabel}</label>
                <input
                  type="password"
                  value={clockifyApiKey}
                  onChange={(e) => setClockifyApiKey(e.target.value)}
                  placeholder="Paste your Clockify API Key..."
                  className={`w-full rounded-2xl border px-3.5 py-2 text-xs outline-none ${isDark ? 'border-white/30 bg-black/50 text-white' : 'border-slate-400 bg-slate-100 text-black'}`}
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1">{T.clockifyWsLabel}</label>
                <input
                  type="text"
                  value={clockifyWorkspaceId}
                  onChange={(e) => setClockifyWorkspaceId(e.target.value)}
                  placeholder="Leave empty for default workspace..."
                  className={`w-full rounded-2xl border px-3.5 py-2 text-xs outline-none ${isDark ? 'border-white/30 bg-black/50 text-white' : 'border-slate-400 bg-slate-100 text-black'}`}
                />
              </div>

              {clockifySyncStatus && (
                <div className="rounded-2xl bg-black/40 border border-white/20 p-3 text-xs font-mono whitespace-pre-wrap max-h-36 overflow-y-auto">
                  {clockifySyncStatus}
                </div>
              )}

              <div className="flex flex-wrap items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => handleSaveClockifyConfig(clockifyApiKey, clockifyWorkspaceId)}
                  className="rounded-2xl border border-white/30 bg-white/10 px-4 py-2 text-xs font-bold hover:bg-white/20"
                >
                  💾 Save Config
                </button>
                <button
                  onClick={() => handleSyncToClockify(false)}
                  className="rounded-2xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-black shadow"
                >
                  ⚡ Sync Now
                </button>
                <button
                  onClick={handleFullClockifySetup}
                  className="rounded-2xl bg-slate-900 px-4 py-2 text-xs font-bold text-white hover:bg-black shadow"
                >
                  🚀 Full Setup + Invite Staff
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer & Premium Language Switcher */}
      <footer className={`mt-16 border-t py-8 px-6 ${isDark ? 'border-white/10 bg-black/40 text-slate-300' : 'border-slate-200/60 bg-slate-100 text-slate-700'}`}>
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-6 sm:flex-row text-xs font-bold">
          
          <div className="flex items-center gap-2">
            <span>⏱️ Limassol Time Tracker</span>
            <span>•</span>
            <span>Asia/Nicosia (Cyprus Time)</span>
          </div>


        </div>
      </footer>

    </div>
  );
}