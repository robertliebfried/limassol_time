import React, { useState } from 'react';
import { Employee, TimeLog } from '../types';
import { FirestoreShiftEvent } from '@/lib/firebase';
import { ReportsTimeline } from './ReportsTimeline';

interface ReportsScheduleProps {
  isDark: boolean;
  employees: Employee[];
  logs: TimeLog[];
  reportStartDate: string;
  historicalShiftEvents?: FirestoreShiftEvent[];
  isAbsenceOnly?: boolean;
}

function getWeekDates(startDateStr: string) {
  const baseDate = startDateStr ? new Date(startDateStr) : new Date();
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
  historicalShiftEvents = [],
  isAbsenceOnly: initialAbsenceOnly = false 
}: ReportsScheduleProps) {
  const weekDates = getWeekDates(reportStartDate);
  const [filterMode, setFilterMode] = useState<'all' | 'present' | 'absence'>(initialAbsenceOnly ? 'absence' : 'all');

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

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* ── 1. UNIFIED WEEKLY CALENDAR (SCHEDULE + ABSENCE) ── */}
      <div className={`overflow-hidden rounded-3xl border shadow-lg ${isDark ? 'border-white/15 bg-[#133137]/80 text-white' : 'border-slate-200 bg-white text-black'}`}>
        
        {/* Header Toolbar */}
        <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-serif text-xl font-bold flex items-center gap-2.5">
              📅 Weekly Schedule & Absence Matrix
            </h3>
            <p className="text-xs opacity-75 mt-0.5">
              Full overview of agent shifts and out-of-office status. The active selected day is highlighted in green.
            </p>
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
              📅 Schedules Only
            </button>
            <button
              onClick={() => setFilterMode('absence')}
              className={`px-3 py-1.5 rounded-xl transition ${filterMode === 'absence' ? (isDark ? 'bg-amber-600 text-white shadow' : 'bg-white text-amber-700 shadow-sm') : 'opacity-60 hover:opacity-100'}`}
            >
              ⛱️ Absence Only
            </button>
          </div>
        </div>

        {/* Matrix Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead className={`font-extrabold border-b ${isDark ? 'bg-black/60 text-slate-300 border-white/10' : 'bg-slate-50 text-slate-700 border-slate-200'}`}>
              <tr>
                <th className="px-5 py-4 min-w-[200px] border-r border-white/10">Employees</th>
                {weekDates.map((date, i) => {
                  const dateIso = date.toISOString().split('T')[0];
                  const isSelected = reportStartDate === dateIso;
                  const isWeekend = i >= 5;

                  return (
                    <th 
                      key={i} 
                      className={`px-3 py-4 text-center min-w-[130px] border-r border-white/10 last:border-0 transition-all ${
                        isSelected 
                          ? (isDark ? 'bg-emerald-950/70 text-emerald-300 ring-2 ring-emerald-500 border-emerald-500 shadow-inner' : 'bg-emerald-100/90 text-emerald-900 ring-2 ring-emerald-600 font-black') 
                          : isWeekend 
                            ? 'text-red-400 opacity-60' 
                            : ''
                      }`}
                    >
                      <div className="flex flex-col items-center gap-0.5">
                        <span className="text-[0.75rem] font-black">{date.toLocaleDateString('en-US', { weekday: 'short' })}, {date.getDate()}</span>
                        {isSelected && (
                          <span className="text-[0.6rem] font-extrabold uppercase tracking-wider px-2 py-0.2 rounded-full bg-emerald-500 text-black shadow">
                            Active Day
                          </span>
                        )}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-white/10' : 'divide-slate-200'}`}>
              {activeEmployees.map(emp => {
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
                          <span className="font-extrabold text-sm truncate">{emp.name}</span>
                          <span className="text-[0.65rem] opacity-60 font-mono">{h}h {m}m total</span>
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
                          className={`px-2.5 py-2.5 border-r border-white/10 last:border-0 align-top transition-all ${
                            isSelected 
                              ? (isDark ? 'bg-emerald-950/30 border-x-2 border-emerald-500/40' : 'bg-emerald-50/70 border-x-2 border-emerald-600/40') 
                              : ''
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
                            /* Unified Mode (shows both clearly) */
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

      {/* ── 2. DAILY VISUAL TIMELINE FOR SELECTED DAY ── */}
      <ReportsTimeline
        isDark={isDark}
        employees={employees}
        historicalShiftEvents={historicalShiftEvents}
        reportStartDate={reportStartDate}
      />

    </div>
  );
}
