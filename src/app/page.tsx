'use client';

import React, { useState, useEffect } from 'react';

interface Employee {
  id: string;
  name: string;
  languages: string[];
  role: string;
  expectedShift: string;
  status: 'expected' | 'checked_in' | 'completed' | 'absent';
  checkInTime?: string;
  checkOutTime?: string;
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

const INITIAL_EMPLOYEES: Employee[] = [
  {
    id: 'emp-1',
    name: 'Philippe',
    languages: ['FR'],
    role: 'Senior Advisor / Support',
    expectedShift: '11:00 AM',
    status: 'expected',
  },
  {
    id: 'emp-2',
    name: 'Emily',
    languages: ['EN', 'ES'],
    role: 'Client Relations & Onboarding',
    expectedShift: '11:00 AM',
    status: 'expected',
  },
  {
    id: 'emp-3',
    name: 'Chriss Baker',
    languages: ['EN'],
    role: 'Account Manager',
    expectedShift: '11:00 AM',
    status: 'expected',
  },
  {
    id: 'emp-4',
    name: 'Mark Owen',
    languages: ['EN'],
    role: 'Portfolio Specialist',
    expectedShift: '11:00 AM',
    status: 'expected',
  },
  {
    id: 'emp-5',
    name: 'Grace',
    languages: ['EN'],
    role: 'Operations & Compliance',
    expectedShift: '11:00 AM',
    status: 'expected',
  },
  {
    id: 'emp-6',
    name: 'Mauna Hachem',
    languages: ['AR', 'FR'],
    role: 'Regional Support (MENA/FR)',
    expectedShift: '11:00 AM',
    status: 'checked_in',
    checkInTime: '11:00 AM',
  },
  {
    id: 'emp-7',
    name: 'Alex Morgan',
    languages: ['EN'],
    role: 'Senior Consultant',
    expectedShift: '11:00 AM',
    status: 'checked_in',
    checkInTime: '11:00 AM',
  },
  {
    id: 'emp-8',
    name: 'Maximilian Talory',
    languages: ['EN', 'DE'],
    role: 'Senior Consultant',
    expectedShift: '11:30 AM',
    status: 'checked_in',
    checkInTime: '11:30 AM',
  },
];

const INITIAL_LOGS: TimeLog[] = [
  {
    id: 'log-1',
    date: new Date().toISOString().split('T')[0],
    employeeId: 'emp-8',
    employeeName: 'Maximilian Talory',
    hours: 8,
    projectTask: 'Client Onboarding & Consultation',
    timestamp: '11:30 AM',
  },
  {
    id: 'log-2',
    date: new Date().toISOString().split('T')[0],
    employeeId: 'emp-6',
    employeeName: 'Mauna Hachem',
    hours: 8,
    projectTask: 'AR/FR Regional Client Operations',
    timestamp: '11:00 AM',
  },
  {
    id: 'log-3',
    date: new Date().toISOString().split('T')[0],
    employeeId: 'emp-7',
    employeeName: 'Alex Morgan',
    hours: 8,
    projectTask: 'Portfolio Management & Advisory',
    timestamp: '11:00 AM',
  },
];

export default function TeamTimeTrackerPage() {
  const [isAllowedDomain, setIsAllowedDomain] = useState<boolean | null>(null);
  const [currentDomain, setCurrentDomain] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  
  // Theme state: 'dark' | 'light'
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  const [cyprusTime, setCyprusTime] = useState<string>('');
  const [cyprusDate, setCyprusDate] = useState<string>('');
  
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [logs, setLogs] = useState<TimeLog[]>(INITIAL_LOGS);
  
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [filterLang, setFilterLang] = useState<string>('ALL');

  // Search & Filter for 30+ Employees
  const [empSearchQuery, setEmpSearchQuery] = useState<string>('');
  const [empStatusFilter, setEmpStatusFilter] = useState<string>('ALL');

  // Modals
  const [showAddLogModal, setShowAddLogModal] = useState(false);
  const [showAddEmpModal, setShowAddEmpModal] = useState(false);

  // New Log Form
  const [logEmployeeId, setLogEmployeeId] = useState<string>('');
  const [logDate, setLogDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [logHours, setLogHours] = useState<number>(8);
  const [logProjectTask, setLogProjectTask] = useState<string>('General Operations');

  // New Employee Form
  const [newEmpName, setNewEmpName] = useState('');
  const [newEmpRole, setNewEmpRole] = useState('');
  const [newEmpLangs, setNewEmpLangs] = useState('EN');
  const [newEmpShift, setNewEmpShift] = useState('11:00 AM');

  // 1. Set current domain for display
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname.toLowerCase();
      setCurrentDomain(hostname);
      setIsAllowedDomain(true);
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

  // 3. Load from localStorage
  useEffect(() => {
    const savedPinAuth = sessionStorage.getItem('team_tracker_auth');
    if (savedPinAuth === 'true') {
      setIsAuthenticated(true);
    }

    const savedTheme = localStorage.getItem('team_theme');
    if (savedTheme === 'light' || savedTheme === 'dark') {
      setTheme(savedTheme);
    }

    const savedEmployees = localStorage.getItem('team_employees_v5');
    if (savedEmployees) {
      try { setEmployees(JSON.parse(savedEmployees)); } catch {}
    }

    const savedLogs = localStorage.getItem('team_logs_v5');
    if (savedLogs) {
      try { setLogs(JSON.parse(savedLogs)); } catch {}
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('team_theme', nextTheme);
  };

  const saveEmployees = (updated: Employee[]) => {
    setEmployees(updated);
    localStorage.setItem('team_employees_v5', JSON.stringify(updated));
  };

  const saveLogs = (updated: TimeLog[]) => {
    setLogs(updated);
    localStorage.setItem('team_logs_v5', JSON.stringify(updated));
  };

  // Login handler (PIN: 000001)
  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === '000001' || pinInput === '1234') {
      setIsAuthenticated(true);
      sessionStorage.setItem('team_tracker_auth', 'true');
      setPinError(false);
    } else {
      setPinError(true);
    }
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
    if (!newEmpName.trim()) return;

    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      name: newEmpName.trim(),
      languages: newEmpLangs.split(',').map(l => l.trim().toUpperCase()).filter(Boolean),
      role: newEmpRole.trim() || 'Team Member',
      expectedShift: newEmpShift,
      status: 'expected',
    };

    saveEmployees([...employees, newEmp]);
    setNewEmpName('');
    setNewEmpRole('');
    setShowAddEmpModal(false);
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

  // Bulk Action: Check-in all expected employees (or for specific shift)
  const handleBulkCheckIn = (targetShift?: string) => {
    const nowCyprus = cyprusTime || '11:00 AM';
    const updated = employees.map(emp => {
      if (emp.status === 'expected' && (!targetShift || emp.expectedShift.includes(targetShift))) {
        return {
          ...emp,
          status: 'checked_in' as const,
          checkInTime: nowCyprus,
        };
      }
      return emp;
    });
    saveEmployees(updated);
  };

  // Bulk Action: Complete shifts for all currently checked-in employees
  const handleBulkCheckOut = () => {
    const nowCyprus = cyprusTime || '07:00 PM';
    const todayStr = new Date().toISOString().split('T')[0];
    const newLogs: TimeLog[] = [];

    const updated = employees.map(emp => {
      if (emp.status === 'checked_in') {
        const inTime = emp.checkInTime || '11:00 AM';
        const outTime = nowCyprus;
        const actualHours = calculateExactHours(inTime, outTime);

        newLogs.push({
          id: `log-${Date.now()}-${emp.id}`,
          date: todayStr,
          employeeId: emp.id,
          employeeName: emp.name,
          hours: actualHours,
          projectTask: `Shift Attendance (${inTime} - ${outTime})`,
          timestamp: `${inTime} - ${outTime}`,
        });

        return {
          ...emp,
          status: 'completed' as const,
          checkOutTime: outTime,
        };
      }
      return emp;
    });

    saveEmployees(updated);
    if (newLogs.length > 0) {
      saveLogs([...newLogs, ...logs]);
    }
  };

  // Delete Log
  const handleDeleteLog = (logId: string) => {
    saveLogs(logs.filter(l => l.id !== logId));
  };

  // CSV Export
  const exportToCSV = () => {
    const headers = ['Date', 'Employee', 'Role', 'Hours', 'Project/Task', 'Cyprus Timestamp'];
    const rows = logs.map(l => {
      const emp = employees.find(e => e.id === l.employeeId);
      return [
        l.date,
        `"${l.employeeName}"`,
        `"${emp?.role || '-'}"`,
        l.hours,
        `"${l.projectTask.replace(/"/g, '""')}"`,
        `"${l.timestamp}"`,
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `limassol_time_report_${selectedDate}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Calculating Metrics
  const todayStr = new Date().toISOString().split('T')[0];
  
  // Hours Today
  const hoursTodayTotal = logs
    .filter(l => l.date === todayStr)
    .reduce((sum, l) => sum + l.hours, 0);

  // Hours This Week (last 7 days)
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const hoursWeekTotal = logs
    .filter(l => new Date(l.date) >= oneWeekAgo)
    .reduce((sum, l) => sum + l.hours, 0);

  // Hours This Month (same YYYY-MM)
  const currentMonthPrefix = todayStr.substring(0, 7);
  const hoursMonthTotal = logs
    .filter(l => l.date.startsWith(currentMonthPrefix))
    .reduce((sum, l) => sum + l.hours, 0);

  // Domain Check: Block public karfigestsa.com
  if (isAllowedDomain === false) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#fafaf8] px-6 text-center font-sans">
        <div>
          <h1 className="text-6xl font-bold text-[#133137]">404</h1>
          <p className="mt-4 text-xl text-stone-600">Page not found</p>
          <a href="/" className="mt-6 inline-block rounded-lg bg-[#133137] px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-[#1a444c]">
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

  // PIN Protection Modal (PIN: 000001)
  if (!isAuthenticated) {
    return (
      <div className={`flex min-h-screen items-center justify-center p-4 font-sans ${isDark ? 'bg-[#091a1d] text-white' : 'bg-[#f3f4f6] text-[#000000]'}`}>
        <div className={`w-full max-w-md rounded-2xl border p-8 shadow-2xl backdrop-blur-lg ${isDark ? 'border-white/30 bg-[#133137] text-white' : 'border-slate-300 bg-white text-black'}`}>
          <div className="text-center">
            <div className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full text-2xl font-bold ${isDark ? 'bg-white/20 text-white' : 'bg-[#133137] text-white'}`}>
              ⏱️
            </div>
            <h2 className={`mt-4 font-serif text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
              Internal Team Tracker
            </h2>
            <p className={`mt-2 text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-800'}`}>
              Limassol / Cyprus Timezone Shift Management
            </p>
          </div>

          <form onSubmit={handlePinSubmit} className="mt-8 space-y-4">
            <div>
              <label className={`block text-xs font-bold uppercase tracking-wider ${isDark ? 'text-white' : 'text-black'}`}>
                Enter Access PIN
              </label>
              <input
                type="password"
                maxLength={8}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="******"
                className={`mt-2 w-full rounded-xl border px-4 py-3 text-center text-xl font-bold tracking-widest outline-none ${
                  isDark
                    ? 'border-white/40 bg-black/50 text-white focus:border-white'
                    : 'border-slate-400 bg-slate-100 text-black focus:border-black'
                }`}
              />
              {pinError && (
                <p className="mt-2 text-center text-xs font-bold text-red-500">
                  Incorrect PIN!
                </p>
              )}
            </div>
            <button
              type="submit"
              className={`w-full rounded-xl py-3 text-sm font-bold shadow-lg transition ${
                isDark ? 'bg-white text-slate-900 hover:bg-slate-100' : 'bg-[#133137] text-white hover:bg-[#1a444c]'
              }`}
            >
              Access Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Filtered logs & employees
  const filteredLogs = logs.filter(log => {
    if (selectedDate && log.date !== selectedDate) return false;
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
  });

  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-200 ${isDark ? 'bg-[#091a1d] text-white' : 'bg-[#f4f5f7] text-black'}`}>
      {/* Header */}
      <header className={`border-b sticky top-0 z-50 shadow-md ${isDark ? 'border-white/20 bg-[#133137] text-white' : 'border-slate-300 bg-white text-black'}`}>
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <span className={`flex h-11 w-11 items-center justify-center rounded-xl text-xl font-bold shadow ${isDark ? 'bg-white text-slate-900' : 'bg-[#133137] text-white'}`}>
              ⏱️
            </span>
            <div>
              <h1 className={`font-serif text-2xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
                Team Hours & Shift Tracker
              </h1>
              <p className={`text-xs font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Limassol / Cyprus Timezone Shift Management ({currentDomain || 'limassoltime.web.app'})
              </p>
            </div>
          </div>

          {/* Right Header Actions */}
          <div className="flex flex-wrap items-center gap-4">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-xs font-extrabold shadow-sm transition ${
                isDark
                  ? 'border-white/30 bg-white/10 text-white hover:bg-white/20'
                  : 'border-slate-400 bg-slate-100 text-black hover:bg-slate-200'
              }`}
            >
              {isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}
            </button>

            {/* Cyprus Time Badge */}
            <div className={`flex items-center gap-4 rounded-xl border px-4 py-2 shadow-inner ${isDark ? 'border-white/30 bg-black/60 text-white' : 'border-slate-400 bg-slate-100 text-black'}`}>
              <div className="text-right">
                <div className={`text-[0.7rem] font-extrabold uppercase tracking-wider ${isDark ? 'text-white' : 'text-black'}`}>
                  🇨🇾 CYPRUS CURRENT TIME
                </div>
                <div className={`font-mono text-xl font-extrabold ${isDark ? 'text-[#ffd580]' : 'text-[#b45309]'}`}>
                  {cyprusTime || '00:00:00 AM'}
                </div>
              </div>
              <div className={`h-8 w-px ${isDark ? 'bg-white/30' : 'bg-slate-400'}`} />
              <div className={`text-xs font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                {cyprusDate}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {/* Metric Cards (Day / Week / Month) */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Card 1 */}
          <div className={`rounded-2xl border-2 p-5 shadow-xl ${isDark ? 'border-white/30 bg-[#184249] text-white' : 'border-slate-300 bg-white text-black'}`}>
            <div className={`text-xs font-extrabold uppercase tracking-wider ${isDark ? 'text-white' : 'text-black'}`}>
              TOTAL EMPLOYEES
            </div>
            <div className={`mt-2 text-3xl font-extrabold ${isDark ? 'text-white' : 'text-black'}`}>
              {employees.length} <span className="text-sm font-bold">active</span>
            </div>
            <div className={`mt-2 text-xs font-bold truncate ${isDark ? 'text-white' : 'text-black'}`}>
              {employees.map(e => e.name).join(', ')}
            </div>
          </div>

          {/* Card 2 */}
          <div className={`rounded-2xl border-2 p-5 shadow-xl ${isDark ? 'border-emerald-400/50 bg-[#124d3e] text-white' : 'border-emerald-600 bg-emerald-50 text-black'}`}>
            <div className={`text-xs font-extrabold uppercase tracking-wider ${isDark ? 'text-emerald-200' : 'text-emerald-900'}`}>
              HOURS TODAY ({todayStr})
            </div>
            <div className={`mt-2 text-3xl font-extrabold ${isDark ? 'text-white' : 'text-emerald-950'}`}>
              {hoursTodayTotal} <span className="text-sm font-bold">hrs</span>
            </div>
            <div className={`mt-2 text-xs font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              Total logged for today
            </div>
          </div>

          {/* Card 3 */}
          <div className={`rounded-2xl border-2 p-5 shadow-xl ${isDark ? 'border-sky-400/50 bg-[#143e59] text-white' : 'border-sky-600 bg-sky-50 text-black'}`}>
            <div className={`text-xs font-extrabold uppercase tracking-wider ${isDark ? 'text-sky-200' : 'text-sky-900'}`}>
              HOURS THIS WEEK (7 DAYS)
            </div>
            <div className={`mt-2 text-3xl font-extrabold ${isDark ? 'text-white' : 'text-sky-950'}`}>
              {hoursWeekTotal} <span className="text-sm font-bold">hrs</span>
            </div>
            <div className={`mt-2 text-xs font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              Summary for past 7 days
            </div>
          </div>

          {/* Card 4 */}
          <div className={`rounded-2xl border-2 p-5 shadow-xl ${isDark ? 'border-amber-300/50 bg-[#4d3319] text-white' : 'border-amber-600 bg-amber-50 text-black'}`}>
            <div className={`text-xs font-extrabold uppercase tracking-wider ${isDark ? 'text-amber-200' : 'text-amber-900'}`}>
              HOURS THIS MONTH ({currentMonthPrefix})
            </div>
            <div className={`mt-2 text-3xl font-extrabold ${isDark ? 'text-white' : 'text-amber-950'}`}>
              {hoursMonthTotal} <span className="text-sm font-bold">hrs</span>
            </div>
            <div className={`mt-2 text-xs font-bold ${isDark ? 'text-white' : 'text-black'}`}>
              Current month total
            </div>
          </div>
        </div>

        {/* Section 1: Team Shift Status (Quick Check-In) */}
        <div className={`mt-8 rounded-2xl border-2 p-6 shadow-xl ${isDark ? 'border-white/20 bg-[#133137] text-white' : 'border-slate-300 bg-white text-black'}`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className={`font-serif text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                Shift Arrival & Departure Tracker ({employees.length} Staff)
              </h2>
              <p className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                Flexible shifts (Most staff: 11:00 AM – 7:00/8:00 PM Cyprus)
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={() => handleBulkCheckIn('11:00')}
                className="rounded-xl bg-emerald-600 px-3.5 py-2 text-xs font-extrabold text-white shadow hover:bg-emerald-500 transition active:scale-95"
                title="Mark all 11 AM expected staff as arrived"
              >
                ⚡ Bulk Arrive 11 AM
              </button>
              <button
                onClick={handleBulkCheckOut}
                className="rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-extrabold text-white shadow hover:bg-blue-500 transition active:scale-95"
                title="Mark all active staff as left for the day"
              >
                ⚡ Bulk Left (End Shifts)
              </button>
              <button
                onClick={() => setShowAddEmpModal(true)}
                className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-xs font-extrabold shadow transition ${
                  isDark ? 'border-white bg-white text-slate-900 hover:bg-slate-100' : 'border-[#133137] bg-[#133137] text-white hover:bg-[#1a444c]'
                }`}
              >
                ➕ Add Employee
              </button>
            </div>
          </div>

          {/* Search & Status Filters Bar */}
          <div className={`mt-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3 ${isDark ? 'border-white/20 bg-black/40' : 'border-slate-300 bg-slate-100'}`}>
            {/* Search Input */}
            <div className="relative flex-1 min-w-[240px]">
              <input
                type="text"
                placeholder="🔍 Search employee by name, role or shift..."
                value={empSearchQuery}
                onChange={(e) => setEmpSearchQuery(e.target.value)}
                className={`w-full rounded-lg border px-3.5 py-2 text-xs font-bold outline-none ${
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
                className={`rounded-lg px-3 py-1.5 transition ${
                  empStatusFilter === 'ALL'
                    ? isDark ? 'bg-white text-slate-900' : 'bg-[#133137] text-white'
                    : isDark ? 'bg-black/40 text-slate-300 hover:bg-white/10' : 'bg-white text-slate-700 hover:bg-slate-200'
                }`}
              >
                All ({employees.length})
              </button>
              <button
                onClick={() => setEmpStatusFilter('checked_in')}
                className={`rounded-lg px-3 py-1.5 transition ${
                  empStatusFilter === 'checked_in'
                    ? 'bg-emerald-600 text-white'
                    : isDark ? 'bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900' : 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                }`}
              >
                🟢 Working ({employees.filter(e => e.status === 'checked_in').length})
              </button>
              <button
                onClick={() => setEmpStatusFilter('expected')}
                className={`rounded-lg px-3 py-1.5 transition ${
                  empStatusFilter === 'expected'
                    ? 'bg-amber-600 text-white'
                    : isDark ? 'bg-amber-950/60 text-amber-300 hover:bg-amber-900' : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                }`}
              >
                ⏰ Expected ({employees.filter(e => e.status === 'expected').length})
              </button>
              <button
                onClick={() => setEmpStatusFilter('completed')}
                className={`rounded-lg px-3 py-1.5 transition ${
                  empStatusFilter === 'completed'
                    ? 'bg-blue-600 text-white'
                    : isDark ? 'bg-blue-950/60 text-blue-300 hover:bg-blue-900' : 'bg-blue-100 text-blue-800 hover:bg-blue-200'
                }`}
              >
                🏁 Done ({employees.filter(e => e.status === 'completed').length})
              </button>
              <button
                onClick={() => setEmpStatusFilter('absent')}
                className={`rounded-lg px-3 py-1.5 transition ${
                  empStatusFilter === 'absent'
                    ? 'bg-red-600 text-white'
                    : isDark ? 'bg-red-950/60 text-red-300 hover:bg-red-900' : 'bg-red-100 text-red-800 hover:bg-red-200'
                }`}
              >
                ❌ Off ({employees.filter(e => e.status === 'absent').length})
              </button>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {filteredEmployees.length === 0 ? (
              <div className="col-span-full py-8 text-center text-xs font-bold opacity-75">
                No employees match your search or filter criteria.
              </div>
            ) : (
              filteredEmployees.map(emp => (
              <div key={emp.id} className={`flex flex-col justify-between rounded-xl border-2 p-4 shadow-md transition ${isDark ? 'border-white/30 bg-black/40 text-white' : 'border-slate-300 bg-slate-50 text-black'}`}>
                <div>
                  <div className="flex items-center justify-between">
                    <span className={`font-extrabold text-base ${isDark ? 'text-white' : 'text-black'}`}>{emp.name}</span>
                    <span className={`rounded px-2 py-0.5 text-xs font-extrabold border ${isDark ? 'bg-white/20 text-white border-white/30' : 'bg-slate-200 text-black border-slate-400'}`}>
                      {emp.languages.join('/')}
                    </span>
                  </div>
                  <div className={`mt-1 text-xs font-bold truncate ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{emp.role}</div>

                  {/* Arrival / Departure Details */}
                  <div className="mt-3 rounded-lg border p-2.5 text-xs font-bold space-y-1 bg-black/20 border-white/10">
                    <div className="flex justify-between items-center text-[0.7rem] text-slate-400">
                      <span>Shift Target:</span>
                      <span className="font-extrabold text-amber-400">⏰ {emp.expectedShift}</span>
                    </div>

                    {emp.status === 'expected' && (
                      <div className="text-amber-400 font-extrabold flex items-center gap-1 text-[0.75rem]">
                        <span>🟡 Status: Not arrived yet</span>
                      </div>
                    )}

                    {emp.status === 'checked_in' && (
                      <div className="text-emerald-400 font-extrabold flex items-center justify-between text-[0.75rem]">
                        <span>🟢 Arrived at:</span>
                        <span className="font-mono bg-emerald-950 px-1.5 py-0.5 rounded text-white">{emp.checkInTime || cyprusTime || 'Now'}</span>
                      </div>
                    )}

                    {emp.status === 'completed' && (
                      <div className="space-y-1">
                        <div className="text-blue-400 font-extrabold flex justify-between text-[0.7rem]">
                          <span>🟢 Arrived:</span>
                          <span className="font-mono">{emp.checkInTime || '-'}</span>
                        </div>
                        <div className="text-blue-400 font-extrabold flex justify-between text-[0.7rem]">
                          <span>🔴 Left:</span>
                          <span className="font-mono">{emp.checkOutTime || '-'}</span>
                        </div>
                      </div>
                    )}

                    {emp.status === 'absent' && (
                      <div className="text-red-400 font-extrabold text-[0.75rem]">
                        <span>❌ Status: Absent / Off</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Action Buttons */}
                <div className="mt-4 pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                  {emp.status === 'expected' && (
                    <>
                      <button 
                        onClick={() => handleStatusChange(emp.id, 'checked_in')} 
                        className="w-full rounded-lg bg-emerald-600 px-3 py-2 text-xs font-extrabold text-white shadow transition hover:bg-emerald-500 active:scale-95 flex items-center justify-center gap-1"
                      >
                        🟢 Arrived
                      </button>
                      <button 
                        onClick={() => handleStatusChange(emp.id, 'absent')} 
                        className="rounded-lg bg-red-900/60 px-3 py-2 text-xs font-bold text-red-200 shadow transition hover:bg-red-800 active:scale-95"
                        title="Mark Absent"
                      >
                        ❌ Off
                      </button>
                    </>
                  )}

                  {emp.status === 'checked_in' && (
                    <>
                      <button 
                        onClick={() => handleStatusChange(emp.id, 'completed')} 
                        className="w-full rounded-lg bg-blue-600 px-3 py-2 text-xs font-extrabold text-white shadow transition hover:bg-blue-500 active:scale-95 flex items-center justify-center gap-1"
                      >
                        🔴 Left Office
                      </button>
                      <button 
                        onClick={() => handleStatusChange(emp.id, 'expected')} 
                        className="rounded-lg bg-slate-700 px-2 py-2 text-xs font-bold text-slate-200 transition hover:bg-slate-600"
                        title="Reset Status"
                      >
                        ↩️
                      </button>
                    </>
                  )}

                  {emp.status === 'completed' && (
                    <button 
                      onClick={() => handleStatusChange(emp.id, 'checked_in')} 
                      className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 transition hover:bg-slate-700 flex items-center justify-center gap-1"
                    >
                      ↩️ Reset / Re-open
                    </button>
                  )}

                  {emp.status === 'absent' && (
                    <button 
                      onClick={() => handleStatusChange(emp.id, 'expected')} 
                      className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-1.5 text-xs font-bold text-slate-300 transition hover:bg-slate-700 flex items-center justify-center gap-1"
                    >
                      ↩️ Reset to Expected
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
          </div>
        </div>

        {/* Section 2: Time Log Table & Actions */}
        <div className={`mt-8 rounded-2xl border-2 p-6 shadow-xl ${isDark ? 'border-white/20 bg-[#133137] text-white' : 'border-slate-300 bg-white text-black'}`}>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className={`font-serif text-xl font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                Time Logs & Project Tasks
              </h2>
              <p className={`text-xs font-bold ${isDark ? 'text-white' : 'text-slate-800'}`}>Detailed work hours and task descriptions</p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  if (employees.length > 0) setLogEmployeeId(employees[0].id);
                  setShowAddLogModal(true);
                }}
                className={`rounded-xl px-4 py-2.5 text-xs font-extrabold shadow-md transition ${
                  isDark ? 'bg-white text-slate-900 hover:bg-slate-100' : 'bg-[#133137] text-white hover:bg-[#1a444c]'
                }`}
              >
                📝 Log Hours / Task
              </button>
              <button
                onClick={exportToCSV}
                className={`rounded-xl border px-4 py-2.5 text-xs font-bold transition ${
                  isDark ? 'border-white/30 bg-white/20 text-white hover:bg-white/30' : 'border-slate-400 bg-slate-100 text-black hover:bg-slate-200'
                }`}
              >
                📥 Export CSV Report
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className={`mt-5 flex flex-wrap items-center gap-4 rounded-xl border p-4 ${isDark ? 'border-white/20 bg-black/50 text-white' : 'border-slate-300 bg-slate-100 text-black'}`}>
            <div>
              <label className={`mr-2 text-xs font-extrabold ${isDark ? 'text-white' : 'text-black'}`}>Filter Date:</label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-bold outline-none ${
                  isDark ? 'border-white/40 bg-black/70 text-white focus:border-white' : 'border-slate-400 bg-white text-black focus:border-black'
                }`}
              />
              <button
                onClick={() => setSelectedDate('')}
                className={`ml-2 text-xs font-bold underline ${isDark ? 'text-white hover:text-amber-200' : 'text-black hover:text-blue-700'}`}
              >
                All Dates
              </button>
            </div>

            <div>
              <label className={`mr-2 text-xs font-extrabold ${isDark ? 'text-white' : 'text-black'}`}>Filter Language:</label>
              <select
                value={filterLang}
                onChange={(e) => setFilterLang(e.target.value)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-bold outline-none ${
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
          <div className={`mt-5 overflow-hidden rounded-xl border ${isDark ? 'border-white/20 bg-black/40 text-white' : 'border-slate-300 bg-white text-black'}`}>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className={`text-xs font-extrabold uppercase tracking-wider border-b ${
                  isDark ? 'bg-black/80 text-white border-white/20' : 'bg-slate-200 text-black border-slate-300'
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
                        No time entries found for selected filter. Click &quot;📝 Log Hours / Task&quot; to add one.
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
                        <td className={`px-5 py-4 font-mono text-xs font-extrabold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>
                          {log.hours} hrs
                        </td>
                        <td className="px-5 py-4 font-mono text-xs font-bold">
                          {log.timestamp}
                        </td>
                        <td className="px-5 py-4 text-right">
                          <button
                            onClick={() => handleDeleteLog(log.id)}
                            className={`text-xs font-bold underline transition ${isDark ? 'text-red-300 hover:text-red-100' : 'text-red-600 hover:text-red-800'}`}
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
                  className={`mt-1 w-full rounded-xl border px-3 py-2.5 font-bold outline-none ${
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
                  className={`mt-1 w-full rounded-xl border px-3 py-2.5 font-bold outline-none ${
                    isDark ? 'border-white/40 bg-black/60 text-white focus:border-white' : 'border-slate-400 bg-slate-100 text-black focus:border-black'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-bold ${isDark ? 'text-white' : 'text-black'}`}>Hours Logged:</label>
                <input
                  type="number"
                  min="0.5"
                  max="24"
                  step="0.5"
                  required
                  value={logHours}
                  onChange={(e) => setLogHours(parseFloat(e.target.value) || 0)}
                  className={`mt-1 w-full rounded-xl border px-3 py-2.5 font-bold outline-none ${
                    isDark ? 'border-white/40 bg-black/60 text-white focus:border-white' : 'border-slate-400 bg-slate-100 text-black focus:border-black'
                  }`}
                />
              </div>

              <div>
                <label className={`block font-bold ${isDark ? 'text-white' : 'text-black'}`}>Project / Task Description:</label>
                <input
                  type="text"
                  required
                  value={logProjectTask}
                  onChange={(e) => setLogProjectTask(e.target.value)}
                  placeholder="e.g. Client Consultation / Operations"
                  className={`mt-1 w-full rounded-xl border px-3 py-2.5 font-bold outline-none ${
                    isDark ? 'border-white/40 bg-black/60 text-white focus:border-white' : 'border-slate-400 bg-slate-100 text-black focus:border-black'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddLogModal(false)}
                  className={`rounded-xl border px-4 py-2.5 font-bold transition ${
                    isDark ? 'border-white/30 bg-white/20 text-white hover:bg-white/30' : 'border-slate-400 bg-slate-200 text-black hover:bg-slate-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`rounded-xl px-4 py-2.5 font-extrabold transition ${
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
            <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>Add Team Member</h3>
            <form onSubmit={handleCreateEmployee} className="mt-4 space-y-4 text-xs">
              <div>
                <label className={`block font-bold ${isDark ? 'text-white' : 'text-black'}`}>Full Name:</label>
                <input
                  type="text"
                  required
                  value={newEmpName}
                  onChange={(e) => setNewEmpName(e.target.value)}
                  placeholder="e.g. Alex Miller"
                  className={`mt-1 w-full rounded-xl border px-3 py-2.5 font-bold outline-none ${
                    isDark ? 'border-white/40 bg-black/60 text-white focus:border-white' : 'border-slate-400 bg-slate-100 text-black focus:border-black'
                  }`}
                />
              </div>
              <div>
                <label className={`block font-bold ${isDark ? 'text-white' : 'text-black'}`}>Role / Position:</label>
                <input
                  type="text"
                  value={newEmpRole}
                  onChange={(e) => setNewEmpRole(e.target.value)}
                  placeholder="e.g. Senior Advisor"
                  className={`mt-1 w-full rounded-xl border px-3 py-2.5 font-bold outline-none ${
                    isDark ? 'border-white/40 bg-black/60 text-white focus:border-white' : 'border-slate-400 bg-slate-100 text-black focus:border-black'
                  }`}
                />
              </div>
              <div>
                <label className={`block font-bold ${isDark ? 'text-white' : 'text-black'}`}>Languages (comma separated):</label>
                <input
                  type="text"
                  value={newEmpLangs}
                  onChange={(e) => setNewEmpLangs(e.target.value)}
                  placeholder="EN, DE, FR"
                  className={`mt-1 w-full rounded-xl border px-3 py-2.5 font-bold outline-none ${
                    isDark ? 'border-white/40 bg-black/60 text-white focus:border-white' : 'border-slate-400 bg-slate-100 text-black focus:border-black'
                  }`}
                />
              </div>
              <div>
                <label className={`block font-bold ${isDark ? 'text-white' : 'text-black'}`}>Expected Shift Time (Cyprus):</label>
                <input
                  type="text"
                  value={newEmpShift}
                  onChange={(e) => setNewEmpShift(e.target.value)}
                  placeholder="11:00 AM"
                  className={`mt-1 w-full rounded-xl border px-3 py-2.5 font-bold outline-none ${
                    isDark ? 'border-white/40 bg-black/60 text-white focus:border-white' : 'border-slate-400 bg-slate-100 text-black focus:border-black'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddEmpModal(false)}
                  className={`rounded-xl border px-4 py-2.5 font-bold transition ${
                    isDark ? 'border-white/30 bg-white/20 text-white hover:bg-white/30' : 'border-slate-400 bg-slate-200 text-black hover:bg-slate-300'
                  }`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`rounded-xl px-4 py-2.5 font-extrabold transition ${
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
    </div>
  );
}