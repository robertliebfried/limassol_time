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

export function ReportsSchedule({ 
  isDark, 
  employees, 
  logs, 
  reportStartDate, 
  onSelectDay,
  onWeekChange,
  currentWeekStart,
  isAbsenceOnly: initialAbsenceOnly = false 
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

      {/* ── 2. CALENDAR HERO & FILTERS ── */}
      <div className={`overflow-hidden rounded-3xl border shadow-lg ${isDark ? 'border-white/15 bg-[#133137]/80 text-white' : 'border-slate-200 bg-white text-black'}`}>
        
        {/* Header Toolbar */}
        <div className="p-6 border-b border-white/10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div>
            <h3 className="font-serif text-2xl font-bold flex items-center gap-2.5">
              📅 Team Schedule & Absence Matrix
            </h3>
            <p className="text-xs opacity-75 mt-1">
              Click on any day column or shift cell to open the <strong className="text-emerald-400">⏳ Daily Timeline</strong> in Reports.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Week Switcher */}
            <div className={`flex items-center gap-1.5 p-1 rounded-2xl border ${isDark ? 'border-white/10 bg-black/40' : 'border-slate-200 bg-slate-100'}`}>
              <button 
                onClick={handlePrevWeek}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${isDark ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-200 text-slate-600'}`}
                title="Previous Week"
              >
                ◀
              </button>
              <button
                onClick={handleThisWeek}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-white shadow-sm text-slate-900'}`}
              >
                {weekDates[0].toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {weekDates[6].toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </button>
              <button 
                onClick={handleNextWeek}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${isDark ? 'hover:bg-white/10 text-slate-300' : 'hover:bg-slate-200 text-slate-600'}`}
                title="Next Week"
              >
                ▶
              </button>
            </div>

            {/* Filter Mode Switcher */}
            <div className={`flex items-center p-1 rounded-2xl border text-xs font-bold ${isDark ? 'border-white/10 bg-black/40' : 'border-slate-200 bg-slate-100'}`}>
              <button
                onClick={() => setFilterMode('all')}
                className={`px-3 py-1.5 rounded-xl transition ${filterMode === 'all' ? (isDark ? 'bg-emerald-600 text-white shadow' : 'bg-white text-emerald-700 shadow-sm') : 'opacity-60 hover:opacity-100'}`}
              >
                Unified (All)
              </button>
              <button
                onClick={() => setFilterMode('present')}
                className={`px-3 py-1.5 rounded-xl transition ${filterMode === 'present' ? (isDark ? 'bg-emerald-600 text-white shadow' : 'bg-white text-emerald-700 shadow-sm') : 'opacity-60 hover:opacity-100'}`}
              >
                📅 Work Schedules
              </button>
              <button
                onClick={() => setFilterMode('absence')}
                className={`px-3 py-1.5 rounded-xl transition ${filterMode === 'absence' ? (isDark ? 'bg-amber-600 text-white shadow' : 'bg-white text-amber-700 shadow-sm') : 'opacity-60 hover:opacity-100'}`}
              >
                ⛱️ Absence Calendar
              </button>
            </div>
          </div>
        </div>

        {/* Secondary Filter & Search Bar */}
        <div className="px-6 py-3 border-b border-white/10 flex flex-wrap items-center justify-between gap-3 bg-black/10">
          <div className="relative w-full sm:w-72">
            <input
              type="text"
              placeholder="Search agent in schedule..."
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

          <div className="flex flex-wrap items-center gap-1.5 text-xs font-bold">
            <button
              onClick={() => setTeamFilter('ALL')}
              className={`px-2.5 py-1 rounded-xl transition ${teamFilter === 'ALL' ? (isDark ? 'bg-white text-black font-extrabold shadow' : 'bg-[#133137] text-white font-extrabold shadow') : 'opacity-60 hover:opacity-100'}`}
            >
              All Teams
            </button>
            {uniqueTeams.map(t => (
              <button
                key={t}
                onClick={() => setTeamFilter(t as string)}
                className={`px-2.5 py-1 rounded-xl transition ${teamFilter === t ? 'bg-emerald-600 text-white font-extrabold shadow' : 'opacity-60 hover:opacity-100'}`}
              >
                {t}
              </button>
            ))}
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
                      title="Click to view Daily Timeline in Reports"
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
                          <div className="flex items-center gap-1.5">
                            <span className="font-extrabold text-sm truncate">{emp.name}</span>
                            {emp.team && (
                              <span className="px-1 py-0.2 rounded text-[9px] font-bold bg-white/10 border border-white/15">
                                {emp.team}
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
                      const isSelected = reportStartDate === dateIso;
                      const isToday = dateIso === new Date().toISOString().split('T')[0];
                      const isWeekend = i >= 5;
                      
                      let isAbsent = false;
                      let shiftTime = '';

                      if (isToday) {
                        if (emp.status === 'absent') isAbsent = true;
                        else if (emp.status === 'checked_in' || emp.status === 'completed' || emp.status === 'on_break' || hours > 0) {
                           shiftTime = hours > 0 ? `${hours}h` : 'Active';
                        }
                      } else if (date < new Date()) {
                        if (hours > 0) {
                           shiftTime = `${hours}h`;
                        } else if (!isWeekend) {
                           isAbsent = true;
                        }
                      }

                      return (
                        <td 
                          key={i} 
                          onClick={() => onSelectDay && onSelectDay(dateIso)}
                          className={`px-2.5 py-2.5 border-r border-white/10 last:border-0 align-top cursor-pointer transition-all ${
                            isSelected 
                              ? (isDark ? 'bg-emerald-950/30 border-x-2 border-emerald-500/40' : 'bg-emerald-50/70 border-x-2 border-emerald-600/40') 
                              : 'hover:bg-emerald-500/5'
                          }`}
                        >
                          {filterMode === 'absence' ? (
                            isAbsent ? (
                              <div className="h-full w-full rounded-xl p-2 bg-amber-500/15 text-amber-500 dark:text-amber-300 border border-amber-500/30 shadow-sm">
                                <div className="font-black text-[0.7rem]">🏖️ Out of Office</div>
                                <div className="opacity-70 text-[0.65rem]">{date.getDate()}. {date.toLocaleDateString('en-US', { month: 'short' })}</div>
                              </div>
                            ) : (
                              isWeekend && (
                                <div className="h-full w-full rounded p-2 text-slate-400 opacity-40 text-[0.65rem] text-center">
                                  Weekend
                                </div>
                              )
                            )
                          ) : filterMode === 'present' ? (
                            hours > 0 ? (
                              <div className="h-full w-full rounded-xl p-2 bg-blue-500/15 text-blue-600 dark:text-blue-300 border border-blue-500/30 shadow-sm">
                                <div className="font-black text-[0.7rem]">🏢 Office</div>
                                <div className="opacity-75 text-[0.65rem] font-mono">{shiftTime}</div>
                              </div>
                            ) : (
                              isWeekend && (
                                <div className="h-full w-full rounded p-2 text-slate-400 opacity-40 text-[0.65rem] text-center">
                                  Weekend
                                </div>
                              )
                            )
                          ) : (
                            /* Unified Mode */
                            isAbsent ? (
                              <div className="h-full w-full rounded-xl p-2 bg-amber-500/15 text-amber-600 dark:text-amber-300 border border-amber-500/30 shadow-sm">
                                <div className="font-black text-[0.7rem]">🏖️ Out of Office</div>
                                <div className="opacity-70 text-[0.65rem]">Absent</div>
                              </div>
                            ) : hours > 0 ? (
                              <div className="h-full w-full rounded-xl p-2 bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 shadow-sm">
                                <div className="font-black text-[0.7rem]">🟢 Present</div>
                                <div className="opacity-75 text-[0.65rem] font-mono font-bold">{hours}h logged</div>
                              </div>
                            ) : (
                              isWeekend ? (
                                <div className="h-full w-full rounded p-2 text-slate-400 opacity-40 text-[0.65rem] text-center">
                                  Weekend
                                </div>
                              ) : null
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

    </div>
  );
}
