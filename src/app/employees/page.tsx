'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

interface Employee {
  id: string;
  name: string;
  username?: string;
  pin?: string;
  email?: string;
  languages: string[];
  role: string;
  expectedShift: string;
  status: 'expected' | 'checked_in' | 'completed' | 'absent';
  checkInTime?: string;
  checkOutTime?: string;
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
];

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<Employee[]>(INITIAL_EMPLOYEES);
  const [deletedEmployees, setDeletedEmployees] = useState<Employee[]>([]);
  const [isDark, setIsDark] = useState<boolean>(true);
  const [cyprusTime, setCyprusTime] = useState<string>('');
  const [cyprusDate, setCyprusDate] = useState<string>('');

  // Search & Modals
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showAddEmpModal, setShowAddEmpModal] = useState<boolean>(false);
  const [editingEmp, setEditingEmp] = useState<Employee | null>(null);
  const [showDeletedArchive, setShowDeletedArchive] = useState<boolean>(false);

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loginUsername, setLoginUsername] = useState<string>('');
  const [loginPin, setLoginPin] = useState<string>('');
  const [loginError, setLoginError] = useState<string>('');

  // New Employee State
  const [newEmpName, setNewEmpName] = useState<string>('');
  const [newEmpUsername, setNewEmpUsername] = useState<string>('');
  const [newEmpPin, setNewEmpPin] = useState<string>('1234');
  const [newEmpRole, setNewEmpRole] = useState<string>('');
  const [newEmpLangs, setNewEmpLangs] = useState<string>('EN');
  const [newEmpShift, setNewEmpShift] = useState<string>('11:00 AM');

  // Edit Employee State
  const [editEmpName, setEditEmpName] = useState<string>('');
  const [editEmpUsername, setEditEmpUsername] = useState<string>('');
  const [editEmpPin, setEditEmpPin] = useState<string>('');
  const [editEmpRole, setEditEmpRole] = useState<string>('');
  const [editEmpLangs, setEditEmpLangs] = useState<string>('');
  const [editEmpShift, setEditEmpShift] = useState<string>('');

  // Load state from localStorage & check auth
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Check Theme
    const savedTheme = localStorage.getItem('team_tracker_theme');
    if (savedTheme) setIsDark(savedTheme === 'dark');

    // Check Auth Role
    const savedAuth = sessionStorage.getItem('team_tracker_auth');
    const savedRole = sessionStorage.getItem('team_tracker_role');
    if (savedAuth === 'true' && savedRole === 'admin') {
      setIsAuthenticated(true);
    }

    // Load Employees
    const savedEmp = localStorage.getItem('team_tracker_employees_v2');
    if (savedEmp) {
      try {
        setEmployees(JSON.parse(savedEmp));
      } catch (e) {
        console.error('Failed to parse saved employees', e);
      }
    }

    // Load Deleted Employees
    const savedDel = localStorage.getItem('team_tracker_deleted_employees_v2');
    if (savedDel) {
      try {
        setDeletedEmployees(JSON.parse(savedDel));
      } catch (e) {
        console.error('Failed to parse deleted employees', e);
      }
    }
  }, []);

  // Cyprus Live Time Clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Nicosia',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      };
      const dateOptions: Intl.DateTimeFormatOptions = {
        timeZone: 'Asia/Nicosia',
        weekday: 'short',
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      };
      setCyprusTime(new Intl.DateTimeFormat('en-US', options).format(now));
      setCyprusDate(new Intl.DateTimeFormat('en-US', dateOptions).format(now));
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Helper Save Employees
  const saveEmployees = (updatedList: Employee[]) => {
    setEmployees(updatedList);
    localStorage.setItem('team_tracker_employees_v2', JSON.stringify(updatedList));
  };

  const saveDeletedEmployees = (updatedList: Employee[]) => {
    setDeletedEmployees(updatedList);
    localStorage.setItem('team_tracker_deleted_employees_v2', JSON.stringify(updatedList));
  };

  // Login Submit Handler
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const u = loginUsername.trim().toLowerCase();
    const isAdminUser = !u || u === 'robert' || u === 'admin' || u === 'manager';
    const isAdminPin = loginPin === '347581' || loginPin === '4973' || loginPin === '000001';

    if (isAdminUser && isAdminPin) {
      setIsAuthenticated(true);
      sessionStorage.setItem('team_tracker_auth', 'true');
      sessionStorage.setItem('team_tracker_role', 'admin');
    } else {
      setLoginError('Incorrect Admin Username or PIN (Admin PIN: 347581).');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('team_tracker_auth');
    sessionStorage.removeItem('team_tracker_role');
  };

  // Add Employee Submit
  const handleCreateEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmpName.trim()) return;

    const newEmp: Employee = {
      id: `emp-${Date.now()}`,
      name: newEmpName.trim(),
      username: newEmpUsername.trim().toLowerCase() || newEmpName.trim().toLowerCase().replace(/\s+/g, ''),
      pin: newEmpPin.trim() || '1234',
      languages: newEmpLangs.split(',').map(l => l.trim().toUpperCase()).filter(Boolean),
      role: newEmpRole.trim() || 'CS Agent',
      expectedShift: newEmpShift,
      status: 'expected',
    };

    saveEmployees([...employees, newEmp]);
    setNewEmpName('');
    setNewEmpUsername('');
    setNewEmpPin('1234');
    setNewEmpRole('');
    setShowAddEmpModal(false);
  };

  // Open Edit Modal
  const handleOpenEditModal = (emp: Employee) => {
    setEditingEmp(emp);
    setEditEmpName(emp.name);
    setEditEmpUsername(emp.username || emp.name.toLowerCase().replace(/\s+/g, ''));
    setEditEmpPin(emp.pin || '1234');
    setEditEmpRole(emp.role);
    setEditEmpLangs(emp.languages.join(', '));
    setEditEmpShift(emp.expectedShift);
  };

  // Save Edit Employee Submit
  const handleSaveEditedEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEmp) return;

    const updated = employees.map(emp => {
      if (emp.id === editingEmp.id) {
        return {
          ...emp,
          name: editEmpName.trim() || emp.name,
          username: editEmpUsername.trim().toLowerCase() || emp.username,
          pin: editEmpPin.trim() || emp.pin || '1234',
          role: editEmpRole.trim() || emp.role,
          languages: editEmpLangs.split(',').map(l => l.trim().toUpperCase()).filter(Boolean),
          expectedShift: editEmpShift.trim() || emp.expectedShift,
        };
      }
      return emp;
    });

    saveEmployees(updated);
    setEditingEmp(null);
  };

  // Delete Employee (Move to Archive)
  const handleDeleteEmployee = (empId: string) => {
    const target = employees.find(e => e.id === empId);
    if (!target) return;

    if (window.confirm(`Are you sure you want to remove ${target.name} from the active staff directory? They will be saved in the Deleted Archive.`)) {
      saveEmployees(employees.filter(e => e.id !== empId));
      saveDeletedEmployees([target, ...deletedEmployees]);
    }
  };

  // Restore Employee from Archive
  const handleRestoreEmployee = (emp: Employee) => {
    saveDeletedEmployees(deletedEmployees.filter(e => e.id !== emp.id));
    saveEmployees([...employees, emp]);
  };

  // Filtered employees list
  const filteredEmployees = employees.filter(emp => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      emp.name.toLowerCase().includes(q) ||
      (emp.username && emp.username.toLowerCase().includes(q)) ||
      emp.role.toLowerCase().includes(q) ||
      emp.languages.join(' ').toLowerCase().includes(q)
    );
  });

  return (
    <div className={`min-h-screen font-sans antialiased transition-colors duration-200 ${isDark ? 'bg-[#091a1d] text-white' : 'bg-[#f4f5f7] text-black'}`}>
      
      {/* Sticky Header Navigation */}
      <header className={`border-b sticky top-0 z-50 shadow-md ${isDark ? 'border-white/20 bg-[#133137] text-white' : 'border-slate-300 bg-white text-black'}`}>
        <div className="mx-auto flex max-w-7xl flex-col gap-3 px-6 py-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className={`flex h-10 w-10 items-center justify-center rounded-xl text-xl font-bold shadow hover:scale-105 transition ${isDark ? 'bg-white text-slate-900' : 'bg-[#133137] text-white'}`}>
              👥
            </Link>
            <div>
              <h1 className={`font-serif text-xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-black'}`}>
                Limassol Staff &amp; Employee Management
              </h1>
              <p className={`text-[0.7rem] font-semibold opacity-80 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Dedicated Staff Roster &amp; Login PIN Manager (limassoltime.web.app/employees)
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Cyprus Live Clock */}
            <div className={`flex items-center gap-3 rounded-xl border px-3.5 py-1.5 shadow-inner ${isDark ? 'border-white/30 bg-black/60 text-white' : 'border-slate-400 bg-slate-100 text-black'}`}>
              <div className="text-right">
                <div className="text-[0.65rem] font-extrabold uppercase tracking-wider text-amber-400">
                  🇨🇾 CYPRUS TIME NOW
                </div>
                <div className="font-mono text-base font-black text-amber-400">
                  {cyprusTime || '00:00:00 AM'}
                </div>
              </div>
              <div className={`h-6 w-px ${isDark ? 'bg-white/30' : 'bg-slate-400'}`} />
              <div className="text-[0.7rem] font-bold opacity-90">
                {cyprusDate}
              </div>
            </div>

            {/* Link to Time Tracker */}
            <Link
              href="/"
              className="flex items-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-500/20 px-3.5 py-1.5 text-xs font-extrabold text-sky-300 hover:bg-sky-500/30 transition shadow-sm"
            >
              <span>⏱️</span> Main Time Tracker Page
            </Link>

            {/* Login / Logout */}
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 rounded-xl border border-red-500/40 bg-red-500/20 px-3.5 py-1.5 text-xs font-extrabold text-red-300 hover:bg-red-500/30 transition shadow-sm"
              >
                <span>🚪</span> Log Out (Robert)
              </button>
            ) : (
              <button
                onClick={() => setIsAuthenticated(false)}
                className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-1.5 text-xs font-extrabold text-white hover:bg-emerald-500 transition shadow-sm"
              >
                <span>🔑</span> Admin Login
              </button>
            )}

            {/* Theme Toggle */}
            <button
              onClick={() => {
                const next = !isDark;
                setIsDark(next);
                localStorage.setItem('team_tracker_theme', next ? 'dark' : 'light');
              }}
              className={`rounded-xl border px-3 py-1.5 text-xs font-extrabold shadow-sm transition ${
                isDark ? 'border-white/30 bg-white/10 text-white hover:bg-white/20' : 'border-slate-400 bg-slate-100 text-black hover:bg-slate-200'
              }`}
            >
              {isDark ? '☀️ Light' : '🌙 Dark'}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-6 py-8">
        {!isAuthenticated ? (
          /* Admin Login Prompt */
          <div className="mx-auto max-w-md my-12 rounded-3xl border-2 p-8 shadow-2xl backdrop-blur-md border-white/20 bg-[#133137] text-white">
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-3xl">
                🔐
              </div>
              <h2 className="mt-4 text-2xl font-serif font-bold">Admin Staff Portal Access</h2>
              <p className="mt-1 text-xs opacity-75">
                Log in as Manager (Robert) to edit employee credentials and pins
              </p>
            </div>

            <form onSubmit={handleLoginSubmit} className="mt-6 space-y-4 text-xs">
              {loginError && (
                <div className="rounded-xl border border-red-500/50 bg-red-500/20 p-3 font-bold text-red-200">
                  ⚠️ {loginError}
                </div>
              )}
              <div>
                <label className="block font-extrabold mb-1">Admin Username:</label>
                <input
                  type="text"
                  value={loginUsername}
                  onChange={(e) => setLoginUsername(e.target.value)}
                  placeholder="robert"
                  className="w-full rounded-xl border border-white/40 bg-black/60 px-3.5 py-2.5 font-mono font-bold text-white outline-none focus:border-white"
                />
              </div>
              <div>
                <label className="block font-extrabold mb-1">Admin PIN (6 digits):</label>
                <input
                  type="password"
                  maxLength={8}
                  value={loginPin}
                  onChange={(e) => setLoginPin(e.target.value)}
                  placeholder="347581"
                  className="w-full rounded-xl border border-white/40 bg-black/60 px-3.5 py-2.5 font-mono font-bold text-white outline-none focus:border-white"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-extrabold text-white shadow-lg transition hover:bg-emerald-500 active:scale-95"
              >
                🔓 Authenticate &amp; Access Roster
              </button>
            </form>
          </div>
        ) : (
          /* Dedicated Employee Management View */
          <div className="space-y-6">
            <div className={`rounded-2xl border-2 p-6 shadow-xl ${isDark ? 'border-white/20 bg-[#133137] text-white' : 'border-slate-300 bg-white text-black'}`}>
              
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-serif text-2xl font-bold flex items-center gap-2">
                    👥 Employee Directory &amp; Roster Management
                  </h2>
                  <p className={`text-xs font-bold ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    Create, edit staff profiles, assign custom 4 or 6-digit login PINs, roles and target shift times
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowAddEmpModal(true)}
                    className="rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-extrabold text-white shadow transition hover:bg-emerald-500 active:scale-95 flex items-center gap-1.5"
                  >
                    ➕ Add New Employee
                  </button>
                </div>
              </div>

              {/* Search Bar */}
              <div className="mt-5">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="🔍 Search employees by name, username, role or language..."
                  className={`w-full max-w-md rounded-xl border px-4 py-2.5 text-xs font-bold outline-none ${
                    isDark ? 'border-white/30 bg-black/50 text-white focus:border-white' : 'border-slate-400 bg-slate-100 text-black focus:border-black'
                  }`}
                />
              </div>

              {/* Dedicated Employees Table (Pure Management: No shift time tracking columns) */}
              <div className="mt-6 overflow-x-auto rounded-xl border border-white/10">
                <table className="w-full text-left text-xs">
                  <thead className={`font-extrabold uppercase border-b ${isDark ? 'bg-black/60 text-white' : 'bg-slate-200 text-black'}`}>
                    <tr>
                      <th className="p-3">#</th>
                      <th className="p-3">Employee Name</th>
                      <th className="p-3">Username (Login)</th>
                      <th className="p-3">PIN Code</th>
                      <th className="p-3">Role / Department</th>
                      <th className="p-3">Target Shift</th>
                      <th className="p-3">Languages</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={`divide-y ${isDark ? 'divide-white/10' : 'divide-slate-200'}`}>
                    {filteredEmployees.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="p-6 text-center text-xs font-bold opacity-75">
                          No employees match your search query.
                        </td>
                      </tr>
                    ) : (
                      filteredEmployees.map((emp, idx) => (
                        <tr key={emp.id} className="hover:bg-white/5 transition">
                          <td className="p-3 font-mono font-bold text-slate-400">{idx + 1}</td>
                          <td className="p-3 font-extrabold text-sm">{emp.name}</td>
                          <td className="p-3 font-mono font-bold text-sky-400">{emp.username || emp.name.toLowerCase()}</td>
                          <td className="p-3 font-mono font-extrabold text-amber-300">{emp.pin || '1234'}</td>
                          <td className="p-3 opacity-90">{emp.role}</td>
                          <td className="p-3 font-mono font-bold text-emerald-400">{emp.expectedShift}</td>
                          <td className="p-3">
                            <span className="rounded bg-white/10 px-2 py-0.5 font-mono text-[0.7rem] font-bold">
                              {emp.languages.join(' / ')}
                            </span>
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => handleOpenEditModal(emp)}
                                className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-extrabold text-white hover:bg-amber-500 transition"
                              >
                                ✏️ Edit Member &amp; PIN
                              </button>
                              <button
                                onClick={() => handleDeleteEmployee(emp.id)}
                                className="rounded-lg bg-red-900/60 px-2.5 py-1.5 text-xs font-bold text-red-200 hover:bg-red-800 transition"
                                title="Remove Employee"
                              >
                                🗑️ Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Deleted Employees Archive */}
            <div className={`rounded-2xl border-2 p-5 shadow-xl ${isDark ? 'border-red-900/40 bg-[#1a0f0f] text-white' : 'border-red-200 bg-red-50 text-black'}`}>
              <button
                onClick={() => setShowDeletedArchive(v => !v)}
                className="flex w-full items-center justify-between text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="text-base">🗑️</span>
                  <span className={`text-sm font-extrabold ${isDark ? 'text-red-300' : 'text-red-700'}`}>
                    Deleted Employees Archive ({deletedEmployees.length})
                  </span>
                </div>
                <span className="text-xs font-bold text-slate-400">
                  {showDeletedArchive ? '▲ Hide' : '▼ Show Archive'}
                </span>
              </button>

              {showDeletedArchive && (
                <div className="mt-4 border-t border-red-900/30 pt-4">
                  {deletedEmployees.length === 0 ? (
                    <p className="text-xs font-bold text-slate-400 italic">No deleted employees in archive.</p>
                  ) : (
                    <div className="space-y-2">
                      {deletedEmployees.map(emp => (
                        <div key={emp.id} className="flex items-center justify-between rounded-xl bg-black/40 p-3 text-xs">
                          <div>
                            <span className="font-extrabold text-white">{emp.name}</span>
                            <span className="ml-2 font-mono text-slate-400">({emp.role} - PIN: {emp.pin})</span>
                          </div>
                          <button
                            onClick={() => handleRestoreEmployee(emp)}
                            className="rounded bg-emerald-700 px-3 py-1 font-bold text-white hover:bg-emerald-600 transition"
                          >
                            ↩️ Restore Employee
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Modal 1: Add New Employee */}
      {showAddEmpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl border-2 p-6 shadow-2xl ${isDark ? 'border-white/30 bg-[#133137] text-white' : 'border-slate-400 bg-white text-black'}`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                ➕ Add New Employee
              </h3>
              <button onClick={() => setShowAddEmpModal(false)} className="text-sm font-bold text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleCreateEmployee} className="mt-4 space-y-3 text-xs">
              <div>
                <label className={`block font-bold ${isDark ? 'text-white' : 'text-black'}`}>Full Name:</label>
                <input
                  type="text"
                  value={newEmpName}
                  onChange={(e) => setNewEmpName(e.target.value)}
                  placeholder="e.g. Maximilian Talory"
                  required
                  className={`mt-1 w-full rounded-xl border px-3 py-2 font-bold outline-none ${
                    isDark ? 'border-white/40 bg-black/60 text-white' : 'border-slate-400 bg-slate-100 text-black'
                  }`}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className={`block font-bold ${isDark ? 'text-white' : 'text-black'}`}>Username:</label>
                  <input
                    type="text"
                    value={newEmpUsername}
                    onChange={(e) => setNewEmpUsername(e.target.value)}
                    placeholder="maximilian"
                    className={`mt-1 w-full rounded-xl border px-3 py-2 font-mono font-bold outline-none ${
                      isDark ? 'border-white/40 bg-black/60 text-white' : 'border-slate-400 bg-slate-100 text-black'
                    }`}
                  />
                </div>
                <div>
                  <label className={`block font-bold ${isDark ? 'text-white' : 'text-black'}`}>PIN (4-6 digits):</label>
                  <input
                    type="text"
                    maxLength={8}
                    value={newEmpPin}
                    onChange={(e) => setNewEmpPin(e.target.value)}
                    placeholder="9761"
                    className={`mt-1 w-full rounded-xl border px-3 py-2 font-mono font-bold outline-none ${
                      isDark ? 'border-white/40 bg-black/60 text-white' : 'border-slate-400 bg-slate-100 text-black'
                    }`}
                  />
                </div>
              </div>
              <div>
                <label className={`block font-bold ${isDark ? 'text-white' : 'text-black'}`}>Role / Position:</label>
                <input
                  type="text"
                  value={newEmpRole}
                  onChange={(e) => setNewEmpRole(e.target.value)}
                  placeholder="e.g. Senior CS Agent"
                  className={`mt-1 w-full rounded-xl border px-3 py-2 font-bold outline-none ${
                    isDark ? 'border-white/40 bg-black/60 text-white' : 'border-slate-400 bg-slate-100 text-black'
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
                  className={`mt-1 w-full rounded-xl border px-3 py-2 font-bold outline-none ${
                    isDark ? 'border-white/40 bg-black/60 text-white' : 'border-slate-400 bg-slate-100 text-black'
                  }`}
                />
              </div>
              <div>
                <label className={`block font-bold ${isDark ? 'text-white' : 'text-black'}`}>Expected Shift Time:</label>
                <input
                  type="text"
                  value={newEmpShift}
                  onChange={(e) => setNewEmpShift(e.target.value)}
                  placeholder="11:00 AM"
                  className={`mt-1 w-full rounded-xl border px-3 py-2 font-bold outline-none ${
                    isDark ? 'border-white/40 bg-black/60 text-white' : 'border-slate-400 bg-slate-100 text-black'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddEmpModal(false)}
                  className="rounded-xl border border-slate-500 bg-slate-700 px-4 py-2 font-bold text-white hover:bg-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-4 py-2 font-extrabold text-white hover:bg-emerald-500"
                >
                  Save Member
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal 2: Edit Employee & PIN */}
      {editingEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-2xl border-2 p-6 shadow-2xl ${isDark ? 'border-white/30 bg-[#133137] text-white' : 'border-slate-400 bg-white text-black'}`}>
            <div className="flex items-center justify-between">
              <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-black'}`}>
                ✏️ Edit Member &amp; PIN ({editingEmp.name})
              </h3>
              <button onClick={() => setEditingEmp(null)} className="text-sm font-bold text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleSaveEditedEmployee} className="mt-4 space-y-3 text-xs">
              <div>
                <label className="block font-extrabold mb-1">Full Name:</label>
                <input
                  type="text"
                  value={editEmpName}
                  onChange={(e) => setEditEmpName(e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2 font-bold outline-none ${
                    isDark ? 'border-white/40 bg-black/60 text-white' : 'border-slate-400 bg-slate-100 text-black'
                  }`}
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-extrabold mb-1">Username:</label>
                  <input
                    type="text"
                    value={editEmpUsername}
                    onChange={(e) => setEditEmpUsername(e.target.value)}
                    className={`w-full rounded-xl border px-3 py-2 font-mono font-bold outline-none ${
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
                    className={`w-full rounded-xl border px-3 py-2 font-mono font-bold outline-none ${
                      isDark ? 'border-white/40 bg-black/60 text-white' : 'border-slate-400 bg-slate-100 text-black'
                    }`}
                  />
                </div>
              </div>
              <div>
                <label className="block font-extrabold mb-1">Role / Position:</label>
                <input
                  type="text"
                  value={editEmpRole}
                  onChange={(e) => setEditEmpRole(e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2 font-bold outline-none ${
                    isDark ? 'border-white/40 bg-black/60 text-white' : 'border-slate-400 bg-slate-100 text-black'
                  }`}
                />
              </div>
              <div>
                <label className="block font-extrabold mb-1">Languages (comma separated):</label>
                <input
                  type="text"
                  value={editEmpLangs}
                  onChange={(e) => setEditEmpLangs(e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2 font-bold outline-none ${
                    isDark ? 'border-white/40 bg-black/60 text-white' : 'border-slate-400 bg-slate-100 text-black'
                  }`}
                />
              </div>
              <div>
                <label className="block font-extrabold mb-1">Expected Shift Time:</label>
                <input
                  type="text"
                  value={editEmpShift}
                  onChange={(e) => setEditEmpShift(e.target.value)}
                  className={`w-full rounded-xl border px-3 py-2 font-bold outline-none ${
                    isDark ? 'border-white/40 bg-black/60 text-white' : 'border-slate-400 bg-slate-100 text-black'
                  }`}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setEditingEmp(null)}
                  className="rounded-xl border border-slate-500 bg-slate-700 px-4 py-2 font-bold text-white hover:bg-slate-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-600 px-4 py-2 font-extrabold text-white hover:bg-amber-500"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
