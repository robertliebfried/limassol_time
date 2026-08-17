import React, { useState } from 'react';
import { Employee, TimeLog } from '../types';

interface ReportsScheduleProps {
  isDark: boolean;
  employees: Employee[];
  logs: TimeLog[];
  reportStartDate: string;
  onSelectDay?: (dateIso: string) => void;
  onWeekChange?: (newWeekStart: Date) => void;
  currentWeekStart?: Date;
  isAbsenceOnly?: boolean;
  onSaveShift?: (
    emp: Employee,
    dateIso: string,
    hours: number,
    inTime?: string,
    outTime?: string,
    isAbsent?: boolean,
    note?: string
  ) => void;
  onDeleteShift?: (emp: Employee, dateIso: string) => void;
}

function getWeekDates(startDateStr: string | Date) {
  const baseDate = typeof startDateStr === 'string' ? (startDateStr ? new Date(startDateStr) : new Date()) : new Date(startDateStr);
  const day = baseDate.getDay();
  const diff = baseDate.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(baseDate.setDate(diff));
  
  const week = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    week.push(d);
  }
  return week;
}

// Convert "09:00" to "09:00 AM"
function format24To12(time24: string): string {
  if (!time24) return '';
  const [hStr, mStr] = time24.split(':');
  let h = parseInt(hStr, 10);
  const m = mStr || '00';
  const period = h >= 12 ? 'PM' : 'AM';
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, '0')}:${m} ${period}`;
}

// Calculate hours between two 24-hr times
function calculateHoursBetween(in24: string, out24: string): number {
  if (!in24 || !out24) return 8;
  const [h1, m1] = in24.split(':').map(Number);
  const [h2, m2] = out24.split(':').map(Number);
  let mins = (h2 * 60 + m2) - (h1 * 60 + m1);
  if (mins < 0) mins += 24 * 60;
  return Math.round((mins / 60) * 10) / 10;
}

export function ReportsSchedule({ 
  isDark, 
  employees, 
  logs, 
  reportStartDate, 
  onSelectDay,
  onWeekChange,
  currentWeekStart,
  isAbsenceOnly: initialAbsenceOnly = false,
  onSaveShift,
  onDeleteShift
}: ReportsScheduleProps) {
  const [internalWeekStart, setInternalWeekStart] = useState<Date>(() => {
    if (currentWeekStart) return currentWeekStart;
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [teamFilter, setTeamFilter] = useState('ALL');

  const activeWeekStart = currentWeekStart || internalWeekStart;
  const weekDates = getWeekDates(activeWeekStart);
  const [filterMode, setFilterMode] = useState<'all' | 'present' | 'absence'>(initialAbsenceOnly ? 'absence' : 'all');

  // Modal State for Editing / Adding Shift
  const [activeSlot, setActiveSlot] = useState<{
    emp: Employee;
    date: Date;
    dateIso: string;
    existingLogs: TimeLog[];
    hours: number;
    isAbsent: boolean;
  } | null>(null);

  const [shiftIn24, setShiftIn24] = useState('11:00');
  const [shiftOut24, setShiftOut24] = useState('20:00');
  const [shiftHours, setShiftHours] = useState(9.0);
  const [shiftNote, setShiftNote] = useState('');
  const [shiftIsAbsent, setShiftIsAbsent] = useState(false);
  const [applyToWholeWeek, setApplyToWholeWeek] = useState(false);

  const handlePrevWeek = () => {
    const d = new Date(activeWeekStart);
    d.setDate(d.getDate() - 7);
    if (onWeekChange) onWeekChange(d);
    else setInternalWeekStart(d);
  };

  const handleNextWeek = () => {
    const d = new Date(activeWeekStart);
    d.setDate(d.getDate() + 7);
    if (onWeekChange) onWeekChange(d);
    else setInternalWeekStart(d);
  };

  const handleThisWeek = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(d.setDate(diff));
    if (onWeekChange) onWeekChange(mon);
    else setInternalWeekStart(mon);
  };

  // CSV Export for the current week schedule
  const handleExportCSV = () => {
    const headers = ['Employee', 'Team', 'Weekly Total (hrs)', ...weekDates.map(d => d.toISOString().split('T')[0])];
    const rows = displayedEmployees.map(emp => {
      const k1 = normKey(emp.id);
      const k2 = normKey(emp.username);
      const k3 = normKey(emp.name);

      let totalHrs = 0;
      const dayValues = weekDates.map(d => {
        const iso = d.toISOString().split('T')[0];
        const dayLogs = logsMap[k1]?.[iso] || logsMap[k2]?.[iso] || logsMap[k3]?.[iso] || [];
        const hrs = dayLogs.reduce((sum, l) => sum + l.hours, 0);
        totalHrs += hrs;
        return hrs > 0 ? `${hrs.toFixed(1)}h` : '';
      });

      return [
        `"${emp.name}"`,
        `"${emp.team || ''}"`,
        totalHrs.toFixed(1),
        ...dayValues
      ].join(',');
    });

    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Schedule_${weekDates[0].toISOString().split('T')[0]}_to_${weekDates[6].toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Normalize key helper
  const normKey = (idOrUnameOrName?: string) => {
    if (!idOrUnameOrName) return '';
    return idOrUnameOrName.toLowerCase().trim().replace(/^emp-fs-/, '').replace(/^emp-/, '').replace(/[\s-_.]/g, '');
  };

  // Group logs by employee and date for quick lookup
  const logsMap: Record<string, Record<string, TimeLog[]>> = {};

  logs.forEach(log => {
    const k1 = normKey(log.employeeId);
    const k2 = normKey(log.employeeName);
    
    [k1, k2].filter(Boolean).forEach(k => {
      if (!logsMap[k]) logsMap[k] = {};
      if (!logsMap[k][log.date]) logsMap[k][log.date] = [];
      logsMap[k][log.date].push(log);
    });
  });

  const activeEmployees = employees.filter(emp => emp.role !== 'admin' && emp.name !== 'Admin' && !emp.isDeleted);

  const displayedEmployees = activeEmployees.filter(emp => {
    if (teamFilter !== 'ALL' && emp.team?.trim() !== teamFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return emp.name.toLowerCase().includes(q) || emp.role.toLowerCase().includes(q) || (emp.username || '').toLowerCase().includes(q);
    }
    return true;
  });

  // Calculate week-wide metrics
  let totalWeeklyHours = 0;
  let totalActiveShifts = 0;

  activeEmployees.forEach(emp => {
    const k1 = normKey(emp.id);
    const k2 = normKey(emp.username);
    const k3 = normKey(emp.name);

    weekDates.forEach(d => {
      const iso = d.toISOString().split('T')[0];
      const dayLogs = logsMap[k1]?.[iso] || logsMap[k2]?.[iso] || logsMap[k3]?.[iso] || [];
      const hrs = dayLogs.reduce((sum, l) => sum + l.hours, 0);
      if (hrs > 0) {
        totalWeeklyHours += hrs;
        totalActiveShifts += 1;
      }
    });
  });

  const uniqueTeams = Array.from(new Set(activeEmployees.map(e => e.team?.trim()).filter(Boolean)));

  // Open slot editor
  const handleSlotClick = (emp: Employee, date: Date, dateIso: string) => {
    const k1 = normKey(emp.id);
    const k2 = normKey(emp.username);
    const k3 = normKey(emp.name);
    const dayLogs = logsMap[k1]?.[dateIso] || logsMap[k2]?.[dateIso] || logsMap[k3]?.[dateIso] || [];
    const totalHrs = dayLogs.reduce((sum, l) => sum + l.hours, 0);
    const isAbsent = totalHrs === 0 && (emp.status === 'absent' || dayLogs.some(l => l.projectTask?.toLowerCase().includes('absent')));

    setActiveSlot({
      emp,
      date,
      dateIso,
      existingLogs: dayLogs,
      hours: totalHrs,
      isAbsent,
    });
    setApplyToWholeWeek(false);

    if (totalHrs > 0) {
      setShiftIn24('11:00');
      setShiftOut24('20:00');
      setShiftHours(Math.round(totalHrs * 10) / 10);
      setShiftNote(dayLogs[0]?.projectTask || 'Shift Attendance');
      setShiftIsAbsent(false);
    } else {
      setShiftIn24('11:00');
      setShiftOut24('20:00');
      setShiftHours(isAbsent ? 0 : 9.0);
      setShiftNote(isAbsent ? 'Out of Office / Vacation' : 'Shift Attendance');
      setShiftIsAbsent(isAbsent);
    }
  };

  const handleApplyPreset = (inStr: string, outStr: string, hrs: number, isAbs: boolean) => {
    setShiftIn24(inStr);
    setShiftOut24(outStr);
    setShiftHours(hrs);
    setShiftIsAbsent(isAbs);
    if (isAbs) setShiftNote('Out of Office / Vacation');
    else setShiftNote(`Shift Attendance (${format24To12(inStr)} - ${format24To12(outStr)})`);
  };

  const handleSaveModal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeSlot) return;

    if (onSaveShift) {
      const inTime12 = shiftIsAbsent ? undefined : format24To12(shiftIn24);
      const outTime12 = shiftIsAbsent ? undefined : format24To12(shiftOut24);
      const targetHours = shiftIsAbsent ? 0 : shiftHours;

      if (applyToWholeWeek) {
        // Apply to all 5 weekdays (Mon - Fri)
        weekDates.slice(0, 5).forEach(d => {
          const iso = d.toISOString().split('T')[0];
          onSaveShift(
            activeSlot.emp,
            iso,
            targetHours,
            inTime12,
            outTime12,
            shiftIsAbsent,
            shiftNote
          );
        });
      } else {
        onSaveShift(
          activeSlot.emp,
          activeSlot.dateIso,
          targetHours,
          inTime12,
          outTime12,
          shiftIsAbsent,
          shiftNote
        );
      }
    }

    setActiveSlot(null);
  };

  const handleDeleteModal = () => {
    if (!activeSlot) return;
    if (onDeleteShift) {
      if (applyToWholeWeek) {
        weekDates.slice(0, 5).forEach(d => {
          const iso = d.toISOString().split('T')[0];
          onDeleteShift(activeSlot.emp, iso);
        });
      } else {
        onDeleteShift(activeSlot.emp, activeSlot.dateIso);
      }
    }
    setActiveSlot(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* ── 1. KPI SUMMARY STRIP ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={`p-5 rounded-3xl border shadow-sm ${isDark ? 'border-white/10 bg-[#133137]/80 text-white' : 'border-slate-200 bg-white text-black'}`}>
          <div className="text-[0.65rem] font-extrabold uppercase tracking-widest text-emerald-400 mb-1">
            ⏱️ Total Hours This Week
          </div>
          <div className="font-serif text-2xl font-black text-emerald-400">
            {totalWeeklyHours.toFixed(1)} <span className="text-xs font-sans font-medium opacity-60">hrs logged</span>
          </div>
        </div>

        <div className={`p-5 rounded-3xl border shadow-sm ${isDark ? 'border-white/10 bg-[#133137]/80 text-white' : 'border-slate-200 bg-white text-black'}`}>
          <div className="text-[0.65rem] font-extrabold uppercase tracking-widest text-blue-400 mb-1">
            🟢 Completed Shifts
          </div>
          <div className="font-serif text-2xl font-black text-blue-400">
            {totalActiveShifts} <span className="text-xs font-sans font-medium opacity-60">shifts filled</span>
          </div>
        </div>

        <div className={`p-5 rounded-3xl border shadow-sm ${isDark ? 'border-white/10 bg-[#133137]/80 text-white' : 'border-slate-200 bg-white text-black'}`}>
          <div className="text-[0.65rem] font-extrabold uppercase tracking-widest text-indigo-400 mb-1">
            👥 Active Roster
          </div>
          <div className="font-serif text-2xl font-black text-indigo-400">
            {activeEmployees.length} <span className="text-xs font-sans font-medium opacity-60">team members</span>
          </div>
        </div>
      </div>

      {/* ── 2. CALENDAR HERO & COMPACT TOOLBAR ── */}
      <div className={`overflow-hidden rounded-3xl border shadow-lg ${isDark ? 'border-white/15 bg-[#133137]/80 text-white' : 'border-slate-200 bg-white text-black'}`}>
        
        {/* Compact All-in-One Toolbar */}
        <div className="p-4 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-black/20">
          
          {/* Week Navigation (Prominent & Easy to click) */}
          <div className="flex items-center gap-2">
            <div className={`flex items-center gap-1 p-1 rounded-2xl border ${isDark ? 'border-white/20 bg-black/60 shadow-inner' : 'border-slate-300 bg-white shadow-sm'}`}>
              <button 
                onClick={handlePrevWeek}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition active:scale-95 flex items-center gap-1 ${
                  isDark ? 'bg-white/10 hover:bg-emerald-600 text-white' : 'bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-800'
                }`}
                title="Previous Week"
              >
                ◀ <span className="hidden sm:inline">Prev Week</span>
              </button>

              <div className="px-3 py-1 text-xs font-black font-mono tracking-tight flex items-center gap-1.5 text-emerald-400">
                <span>📅</span>
                <span>
                  {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                </span>
              </div>

              <button 
                onClick={handleNextWeek}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition active:scale-95 flex items-center gap-1 ${
                  isDark ? 'bg-white/10 hover:bg-emerald-600 text-white' : 'bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-800'
                }`}
                title="Next Week"
              >
                <span className="hidden sm:inline">Next Week</span> ▶
              </button>
            </div>

            <button
              onClick={handleThisWeek}
              className={`px-3 py-2 rounded-2xl border text-xs font-extrabold transition active:scale-95 ${
                isDark ? 'border-white/15 bg-white/5 hover:bg-white/15 text-emerald-300' : 'border-slate-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
              }`}
              title="Return to Current Week"
            >
              Today
            </button>
          </div>

          {/* Filters & Actions Bar */}
          <div className="flex flex-wrap items-center gap-2.5">
            
            {/* Search Input */}
            <div className="relative w-40 sm:w-48">
              <input
                type="text"
                placeholder="🔍 Search agent..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full rounded-2xl border px-3 py-1.5 text-xs font-bold outline-none ${
                  isDark ? 'border-white/15 bg-black/40 text-white placeholder-slate-400 focus:border-emerald-500' : 'border-slate-300 bg-white text-black focus:border-emerald-600'
                }`}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-2.5 top-1.5 text-xs opacity-60 hover:opacity-100">
                  ✕
                </button>
              )}
            </div>

            {/* Teams Filter Dropdown */}
            <div className="flex items-center gap-1.5">
              <select
                value={teamFilter}
                onChange={(e) => setTeamFilter(e.target.value)}
                className={`rounded-2xl border px-3 py-1.5 text-xs font-extrabold outline-none cursor-pointer ${
                  isDark ? 'border-white/15 bg-black/60 text-white' : 'border-slate-300 bg-white text-black'
                }`}
              >
                <option value="ALL">👥 All Teams ({activeEmployees.length})</option>
                {uniqueTeams.map(t => (
                  <option key={t} value={t as string}>
                    📍 {t} ({activeEmployees.filter(e => e.team?.trim() === t).length})
                  </option>
                ))}
              </select>
            </div>

            {/* View Mode Toggle */}
            <div className={`flex items-center p-0.5 rounded-2xl border text-[11px] font-bold ${isDark ? 'border-white/10 bg-black/40' : 'border-slate-200 bg-slate-100'}`}>
              <button
                onClick={() => setFilterMode('all')}
                className={`px-2.5 py-1 rounded-xl transition ${filterMode === 'all' ? (isDark ? 'bg-emerald-600 text-white shadow' : 'bg-white text-emerald-700 shadow-sm') : 'opacity-60 hover:opacity-100'}`}
              >
                All
              </button>
              <button
                onClick={() => setFilterMode('present')}
                className={`px-2.5 py-1 rounded-xl transition ${filterMode === 'present' ? (isDark ? 'bg-emerald-600 text-white shadow' : 'bg-white text-emerald-700 shadow-sm') : 'opacity-60 hover:opacity-100'}`}
              >
                Work
              </button>
              <button
                onClick={() => setFilterMode('absence')}
                className={`px-2.5 py-1 rounded-xl transition ${filterMode === 'absence' ? (isDark ? 'bg-amber-600 text-white shadow' : 'bg-white text-amber-700 shadow-sm') : 'opacity-60 hover:opacity-100'}`}
              >
                Absence
              </button>
            </div>

            {/* Export CSV Button */}
            <button
              onClick={handleExportCSV}
              className={`px-3 py-1.5 rounded-2xl border text-xs font-extrabold transition flex items-center gap-1 ${
                isDark ? 'border-white/20 bg-white/5 hover:bg-white/10 text-white' : 'border-slate-300 bg-white hover:bg-slate-50 text-slate-800 shadow-sm'
              }`}
              title="Export weekly schedule to CSV"
            >
              📥 CSV
            </button>

          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className={`font-extrabold border-b ${isDark ? 'bg-black/60 text-slate-300 border-white/10' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
              <tr>
                <th className="px-5 py-4 min-w-[220px] border-r border-white/10">Employees</th>
                {weekDates.map((date, i) => {
                  const dateIso = date.toISOString().split('T')[0];
                  const isSelected = reportStartDate === dateIso;
                  const isWeekend = i >= 5;

                  return (
                    <th 
                      key={i} 
                      onClick={() => onSelectDay && onSelectDay(dateIso)}
                      className={`px-3 py-4 text-center min-w-[130px] border-r border-white/10 last:border-0 cursor-pointer transition-all hover:bg-emerald-500/10 ${
                        isSelected 
                          ? (isDark ? 'bg-emerald-950/70 text-emerald-300 ring-2 ring-emerald-500 border-emerald-500 shadow-inner' : 'bg-emerald-100/90 text-emerald-900 ring-2 ring-emerald-600 font-black') 
                          : isWeekend 
                            ? 'text-red-400 opacity-60' 
                            : ''
                      }`}
                      title="Click column header to view 24h Daily Timeline"
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[0.75rem] font-black">{date.toLocaleDateString('en-US', { weekday: 'short' })}, {date.getDate()}</span>
                        {isSelected ? (
                          <span className="text-[0.6rem] font-extrabold uppercase tracking-wider px-2 py-0.2 rounded-full bg-emerald-500 text-black shadow">
                            Active Day
                          </span>
                        ) : (
                          <span className="text-[0.6rem] font-medium opacity-50">View Timeline ↗</span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-white/10' : 'divide-slate-200'}`}>
              {displayedEmployees.map(emp => {
                const k1 = normKey(emp.id);
                const k2 = normKey(emp.username);
                const k3 = normKey(emp.name);

                const getDayLogs = (dateIso: string) => {
                  return logsMap[k1]?.[dateIso] || logsMap[k2]?.[dateIso] || logsMap[k3]?.[dateIso] || [];
                };

                // Calculate weekly totals
                let totalSeconds = 0;
                weekDates.forEach(date => {
                  const dateIso = date.toISOString().split('T')[0];
                  const dayLogs = getDayLogs(dateIso);
                  const hours = dayLogs.reduce((sum, l) => sum + l.hours, 0);
                  totalSeconds += hours * 3600;
                });

                const h = Math.floor(totalSeconds / 3600);
                const m = Math.floor((totalSeconds % 3600) / 60);

                return (
                  <tr key={emp.id} className={`group transition ${isDark ? 'hover:bg-white/5' : 'hover:bg-slate-50'}`}>
                    {/* Employee Info Col */}
                    <td className="px-5 py-3.5 border-r border-white/10">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 flex items-center justify-center text-xs font-bold flex-shrink-0">
                          {emp.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-extrabold text-sm truncate">{emp.name}</span>
                            {emp.team && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-white/10 border border-white/15">
                                {emp.team}
                              </span>
                            )}
                            {emp.languages && emp.languages.length > 0 && (
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-blue-500/15 text-blue-500 dark:text-blue-300 border border-blue-500/20 uppercase font-mono">
                                🌐 {emp.languages.join('/')}
                              </span>
                            )}
                          </div>
                          <span className="text-[0.65rem] opacity-60 font-mono">{h}h {m}m weekly total</span>
                        </div>
                      </div>
                    </td>

                    {/* Days Cols */}
                    {weekDates.map((date, i) => {
                      const dateIso = date.toISOString().split('T')[0];
                      const dayLogs = getDayLogs(dateIso);
                      const hours = dayLogs.reduce((sum, l) => sum + l.hours, 0);
                      const displayHours = Math.round(hours * 10) / 10;
                      const isSelected = reportStartDate === dateIso;
                      const isToday = dateIso === new Date().toISOString().split('T')[0];
                      const isWeekend = i >= 5;
                      
                      let isAbsent = false;
                      let shiftTime = '';

                      if (isToday) {
                        if (emp.status === 'absent') isAbsent = true;
                        else if (emp.status === 'checked_in' || emp.status === 'completed' || emp.status === 'on_break' || hours > 0) {
                           shiftTime = hours > 0 ? `${displayHours}h` : 'Active';
                        }
                      } else if (date < new Date()) {
                        if (hours > 0) {
                           shiftTime = `${displayHours}h`;
                        } else if (!isWeekend) {
                           isAbsent = true;
                        }
                      }

                      return (
                        <td 
                          key={i} 
                          onClick={() => handleSlotClick(emp, date, dateIso)}
                          className={`px-2.5 py-2.5 border-r border-white/10 last:border-0 align-top cursor-pointer transition-all hover:ring-2 hover:ring-emerald-500/50 rounded-lg ${
                            isSelected 
                              ? (isDark ? 'bg-emerald-950/30 border-x-2 border-emerald-500/40' : 'bg-emerald-50/70 border-x-2 border-emerald-600/40') 
                              : 'hover:bg-emerald-500/10'
                          }`}
                          title={`Click to add/edit shift for ${emp.name} on ${dateIso}`}
                        >
                          {filterMode === 'absence' ? (
                            isAbsent ? (
                              <div className="h-full w-full rounded-xl p-2 bg-amber-500/15 text-amber-500 dark:text-amber-300 border border-amber-500/30 shadow-sm group-hover:scale-[1.02] transition">
                                <div className="font-black text-[0.7rem]">🏖️ Out of Office</div>
                                <div className="opacity-70 text-[0.65rem]">{date.getDate()}. {date.toLocaleDateString('en-US', { month: 'short' })}</div>
                              </div>
                            ) : (
                              isWeekend ? (
                                <div className="h-full w-full rounded p-2 text-slate-400 opacity-40 text-[0.65rem] text-center">
                                  Weekend
                                </div>
                              ) : (
                                <div className="h-full w-full rounded p-2 text-slate-500 opacity-30 text-[0.65rem] text-center hover:opacity-100 hover:text-emerald-400">
                                  + Add
                                </div>
                              )
                            )
                          ) : filterMode === 'present' ? (
                            hours > 0 ? (
                              <div className="h-full w-full rounded-xl p-2 bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/30 shadow-sm group-hover:scale-[1.02] transition">
                                <div className="font-black text-[0.7rem]">🏢 Office</div>
                                <div className="opacity-75 text-[0.65rem] font-mono">{shiftTime}</div>
                              </div>
                            ) : (
                              isWeekend ? (
                                <div className="h-full w-full rounded p-2 text-slate-400 opacity-40 text-[0.65rem] text-center">
                                  Weekend
                                </div>
                              ) : (
                                <div className="h-full w-full rounded p-2 text-slate-500 opacity-30 text-[0.65rem] text-center hover:opacity-100 hover:text-emerald-400">
                                  + Add
                                </div>
                              )
                            )
                          ) : (
                            /* Unified Mode */
                            isAbsent ? (
                              <div className="h-full w-full rounded-xl p-2 bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30 shadow-sm group-hover:scale-[1.02] transition">
                                <div className="font-black text-[0.7rem]">🏖️ Out of Office</div>
                                <div className="opacity-70 text-[0.65rem]">Absent</div>
                              </div>
                            ) : hours > 0 ? (
                              <div className="h-full w-full rounded-xl p-2 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shadow-sm group-hover:scale-[1.02] transition">
                                <div className="font-black text-[0.7rem]">🟢 Present</div>
                                <div className="opacity-75 text-[0.65rem] font-mono font-bold">{displayHours}h logged</div>
                              </div>
                            ) : (
                              isWeekend ? (
                                <div className="h-full w-full rounded p-2 text-slate-400 opacity-40 text-[0.65rem] text-center">
                                  Weekend
                                </div>
                              ) : (
                                <div className="h-full w-full rounded p-2 text-slate-500 opacity-20 text-[0.65rem] text-center hover:opacity-100 hover:text-emerald-400 font-bold transition">
                                  + Add Shift
                                </div>
                              )
                            )
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 3. INTERACTIVE SHIFT / HOURS EDITOR MODAL ── */}
      {activeSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className={`w-full max-w-lg rounded-3xl border p-6 shadow-2xl ${isDark ? 'border-white/20 bg-[#16363d] text-white' : 'border-slate-300 bg-white text-black'}`}>
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg shadow-md">
                  {activeSlot.emp.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold leading-tight flex items-center gap-2">
                    {activeSlot.emp.name}
                    {activeSlot.emp.team && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 border border-white/20">
                        {activeSlot.emp.team}
                      </span>
                    )}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <p className="text-xs opacity-70">
                      {activeSlot.date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                    {onSelectDay && (
                      <button
                        type="button"
                        onClick={() => {
                          onSelectDay(activeSlot.dateIso);
                          setActiveSlot(null);
                        }}
                        className="text-[10px] font-extrabold text-emerald-400 hover:underline flex items-center gap-0.5"
                        title="Jump to 24h timeline view"
                      >
                        ⏳ Timeline ↗
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveSlot(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-sm font-bold opacity-75 hover:opacity-100 transition"
              >
                ✕
              </button>
            </div>

            {/* Existing Logs List (if any) */}
            {activeSlot.existingLogs && activeSlot.existingLogs.length > 0 && (
              <div className="mb-4 p-3 rounded-2xl border border-white/10 bg-black/20 text-xs">
                <div className="font-bold opacity-75 mb-1.5 flex items-center justify-between">
                  <span>Recorded Logs for this Day:</span>
                  <span className="font-mono text-emerald-400 font-extrabold">
                    {activeSlot.hours.toFixed(1)} hrs total
                  </span>
                </div>
                <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
                  {activeSlot.existingLogs.map((l, idx) => (
                    <div key={l.id || idx} className="flex items-center justify-between py-1 border-b border-white/5 last:border-0 text-[11px]">
                      <span className="truncate opacity-80">{l.projectTask || l.timestamp || 'Shift Log'}</span>
                      <span className="font-mono font-bold text-emerald-300 ml-2">{l.hours}h</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Attendance Status Toggle */}
            <div className="mb-4">
              <label className="text-xs font-extrabold uppercase tracking-wider opacity-60 block mb-2">
                Shift Status
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShiftIsAbsent(false);
                    if (shiftHours === 0) setShiftHours(9.0);
                    setShiftNote('Shift Attendance (11:00 AM - 08:00 PM)');
                  }}
                  className={`p-3 rounded-2xl border text-center font-extrabold text-xs transition flex items-center justify-center gap-2 ${
                    !shiftIsAbsent
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg'
                      : isDark ? 'border-white/10 bg-black/30 hover:bg-white/10 opacity-70' : 'border-slate-200 bg-slate-100 hover:bg-slate-200 opacity-70'
                  }`}
                >
                  🟢 Present (11:00 - 20:00)
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShiftIsAbsent(true);
                    setShiftHours(0);
                    setShiftNote('Out of Office / Vacation');
                  }}
                  className={`p-3 rounded-2xl border text-center font-extrabold text-xs transition flex items-center justify-center gap-2 ${
                    shiftIsAbsent
                      ? 'bg-amber-600 text-white border-amber-500 shadow-lg'
                      : isDark ? 'border-white/10 bg-black/30 hover:bg-white/10 opacity-70' : 'border-slate-200 bg-slate-100 hover:bg-slate-200 opacity-70'
                  }`}
                >
                  🏖️ Out of Office (Absent)
                </button>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="mb-4">
              <label className="text-xs font-extrabold uppercase tracking-wider opacity-60 block mb-2">
                ⚡ Quick Shift Presets
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => handleApplyPreset('11:00', '20:00', 9.0, false)}
                  className={`p-2 rounded-xl border text-left font-bold transition ${
                    shiftIn24 === '11:00' && shiftOut24 === '20:00' && !shiftIsAbsent
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                      : isDark ? 'border-white/10 bg-black/30 hover:bg-white/10' : 'border-slate-200 bg-slate-100 hover:bg-slate-200'
                  }`}
                >
                  ⭐ 11:00 - 20:00 (Standard)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('10:00', '19:00', 9.0, false)}
                  className={`p-2 rounded-xl border text-left font-bold transition ${
                    shiftIn24 === '10:00' && shiftOut24 === '19:00' && !shiftIsAbsent
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                      : isDark ? 'border-white/10 bg-black/30 hover:bg-white/10' : 'border-slate-200 bg-slate-100 hover:bg-slate-200'
                  }`}
                >
                  10:00 - 19:00 (9h)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('12:00', '21:00', 9.0, false)}
                  className={`p-2 rounded-xl border text-left font-bold transition ${
                    shiftIn24 === '12:00' && shiftOut24 === '21:00' && !shiftIsAbsent
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                      : isDark ? 'border-white/10 bg-black/30 hover:bg-white/10' : 'border-slate-200 bg-slate-100 hover:bg-slate-200'
                  }`}
                >
                  12:00 - 21:00 (9h)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('09:00', '18:00', 9.0, false)}
                  className={`p-2 rounded-xl border text-left font-bold transition ${
                    shiftIn24 === '09:00' && shiftOut24 === '18:00' && !shiftIsAbsent
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                      : isDark ? 'border-white/10 bg-black/30 hover:bg-white/10' : 'border-slate-200 bg-slate-100 hover:bg-slate-200'
                  }`}
                >
                  09:00 - 18:00 (9h)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('08:00', '17:00', 9.0, false)}
                  className={`p-2 rounded-xl border text-left font-bold transition ${
                    shiftIn24 === '08:00' && shiftOut24 === '17:00' && !shiftIsAbsent
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                      : isDark ? 'border-white/10 bg-black/30 hover:bg-white/10' : 'border-slate-200 bg-slate-100 hover:bg-slate-200'
                  }`}
                >
                  08:00 - 17:00 (9h)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('00:00', '00:00', 0, true)}
                  className={`p-2 rounded-xl border text-left font-bold transition ${
                    shiftIsAbsent
                      ? 'bg-amber-600 text-white border-amber-500 shadow'
                      : isDark ? 'border-white/10 bg-black/30 hover:bg-white/10' : 'border-slate-200 bg-slate-100 hover:bg-slate-200'
                  }`}
                >
                  🏖️ Out of Office (0h)
                </button>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSaveModal} className="space-y-4">
              {!shiftIsAbsent && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-extrabold opacity-75 block mb-1">
                      🟢 Check In Time (Arrival)
                    </label>
                    <input
                      type="time"
                      value={shiftIn24}
                      onChange={(e) => {
                        setShiftIn24(e.target.value);
                        setShiftHours(calculateHoursBetween(e.target.value, shiftOut24));
                      }}
                      className={`w-full rounded-2xl border px-3 py-2 text-xs font-mono font-bold outline-none ${
                        isDark ? 'border-white/20 bg-black/50 text-white' : 'border-slate-300 bg-white text-black'
                      }`}
                    />
                  </div>

                  <div>
                    <label className="text-xs font-extrabold opacity-75 block mb-1">
                      🔴 Check Out Time (Departure)
                    </label>
                    <input
                      type="time"
                      value={shiftOut24}
                      onChange={(e) => {
                        setShiftOut24(e.target.value);
                        setShiftHours(calculateHoursBetween(shiftIn24, e.target.value));
                      }}
                      className={`w-full rounded-2xl border px-3 py-2 text-xs font-mono font-bold outline-none ${
                        isDark ? 'border-white/20 bg-black/50 text-white' : 'border-slate-300 bg-white text-black'
                      }`}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-extrabold opacity-75 block mb-1">
                    ⏱️ Total Worked Hours
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="24"
                    disabled={shiftIsAbsent}
                    value={shiftIsAbsent ? 0 : shiftHours}
                    onChange={(e) => setShiftHours(parseFloat(e.target.value) || 0)}
                    className={`w-full rounded-2xl border px-3 py-2 text-xs font-mono font-bold outline-none ${
                      shiftIsAbsent ? 'opacity-40 cursor-not-allowed' : ''
                    } ${isDark ? 'border-white/20 bg-black/50 text-white' : 'border-slate-300 bg-white text-black'}`}
                  />
                </div>

                <div>
                  <label className="text-xs font-extrabold opacity-75 block mb-1">
                    📝 Shift Task / Project Note
                  </label>
                  <input
                    type="text"
                    value={shiftNote}
                    onChange={(e) => setShiftNote(e.target.value)}
                    placeholder="e.g. Shift Attendance"
                    className={`w-full rounded-2xl border px-3 py-2 text-xs font-bold outline-none ${
                      isDark ? 'border-white/20 bg-black/50 text-white' : 'border-slate-300 bg-white text-black'
                    }`}
                  />
                </div>
              </div>

              {/* Apply to entire week checkbox */}
              <div className="p-3 rounded-2xl border border-white/10 bg-black/20 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    id="applyWholeWeek"
                    checked={applyToWholeWeek}
                    onChange={(e) => setApplyToWholeWeek(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
                  />
                  <label htmlFor="applyWholeWeek" className="text-xs font-bold cursor-pointer">
                    ⚡ Apply to entire week (Mon – Fri, 5 days)
                  </label>
                </div>
                <span className="text-[10px] opacity-60 font-mono">
                  {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} - {weekDates[4].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                <div>
                  {activeSlot.hours > 0 && (
                    <button
                      type="button"
                      onClick={handleDeleteModal}
                      className="rounded-2xl border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3.5 py-2 text-xs font-bold transition"
                    >
                      🗑️ Delete Shift
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveSlot(null)}
                    className={`rounded-2xl px-4 py-2 text-xs font-bold transition ${
                      isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                    }`}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white px-5 py-2 text-xs font-extrabold shadow-lg transition active:scale-95 flex items-center gap-1.5"
                  >
                    💾 Save Shift
                  </button>
                </div>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}
