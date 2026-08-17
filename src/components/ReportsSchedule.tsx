import React from 'react';
import { Employee, TimeLog } from '../types';

interface ReportsScheduleProps {
  isDark: boolean;
  employees: Employee[];
  logs: TimeLog[];
  reportStartDate: string;
  isAbsenceOnly?: boolean;
}

function getWeekDates(startDateStr: string) {
  // If no date, use today
  const baseDate = startDateStr ? new Date(startDateStr) : new Date();
  
  // Find the Monday of this week
  const day = baseDate.getDay();
  const diff = baseDate.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  const monday = new Date(baseDate.setDate(diff));
  
  const week = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    week.push(d);
  }
  return week;
}

export function ReportsSchedule({ isDark, employees, logs, reportStartDate, isAbsenceOnly }: ReportsScheduleProps) {
  const weekDates = getWeekDates(reportStartDate);

  // Group logs by employee and date for quick lookup
  // logsMap[employeeId][dateIsoString] = array of logs
  const logsMap: Record<string, Record<string, TimeLog[]>> = {};
  employees.forEach(emp => {
    logsMap[emp.id] = {};
  });

  logs.forEach(log => {
    if (logsMap[log.employeeId]) {
      if (!logsMap[log.employeeId][log.date]) {
        logsMap[log.employeeId][log.date] = [];
      }
      logsMap[log.employeeId][log.date].push(log);
    }
  });

  return (
    <div className={`mt-5 overflow-hidden rounded-2xl border ${isDark ? 'border-white/20 bg-black/40 text-white' : 'border-slate-200/60 bg-white text-black'} animate-in fade-in duration-300`}>
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead className={`font-extrabold text-slate-500 border-b ${isDark ? 'bg-black/80 border-white/20' : 'bg-slate-50 border-slate-200'}`}>
            <tr>
              <th className="px-4 py-4 min-w-[200px] border-r border-slate-200 dark:border-white/10">Employees</th>
              {weekDates.map((date, i) => {
                const isWeekend = i >= 5;
                return (
                  <th key={i} className={`px-2 py-4 text-center min-w-[120px] border-r border-slate-200 dark:border-white/10 last:border-0 ${isWeekend ? 'text-red-400' : ''}`}>
                    <div className="flex flex-col">
                      <span>{date.toLocaleDateString('en-US', { weekday: 'short' })}, {date.getDate()}</span>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody className={`divide-y ${isDark ? 'divide-white/15' : 'divide-slate-200'}`}>
            {employees.map(emp => {
              // Calculate weekly totals
              let totalSeconds = 0;
              weekDates.forEach(date => {
                const dateIso = date.toISOString().split('T')[0];
                const dayLogs = logsMap[emp.id][dateIso] || [];
                const hours = dayLogs.reduce((sum, l) => sum + l.hours, 0);
                totalSeconds += hours * 3600;
              });

              const h = Math.floor(totalSeconds / 3600);
              const m = Math.floor((totalSeconds % 3600) / 60);

              return (
                <tr key={emp.id} className="group">
                  {/* Employee Info Col */}
                  <td className="px-4 py-4 border-r border-slate-200 dark:border-white/10">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center text-xs font-bold opacity-70 flex-shrink-0">
                        {emp.name.charAt(0)}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-bold text-sm">{emp.name}</span>
                        {!isAbsenceOnly && <span className="text-[0.65rem] opacity-60">0s / {h}h {m}m</span>}
                      </div>
                    </div>
                  </td>

                  {/* Days Cols */}
                  {weekDates.map((date, i) => {
                    const dateIso = date.toISOString().split('T')[0];
                    const dayLogs = logsMap[emp.id][dateIso] || [];
                    const hours = dayLogs.reduce((sum, l) => sum + l.hours, 0);
                    const isToday = dateIso === new Date().toISOString().split('T')[0];
                    
                    // Determine status for this cell
                    let isAbsent = false;
                    let blockLabel = '';
                    let blockTime = '';

                    if (isToday) {
                      if (emp.status === 'absent') isAbsent = true;
                      else if (emp.status === 'checked_in' || emp.status === 'completed') {
                         blockLabel = 'Office';
                         blockTime = hours > 0 ? `${hours}h` : 'Active';
                      }
                    } else if (date < new Date()) {
                      // Past date
                      if (hours > 0) {
                         blockLabel = 'Office';
                         blockTime = `${hours}h`;
                      } else {
                         // We could assume absent if no hours in the past
                         // But skip weekends?
                         const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                         if (!isWeekend) isAbsent = true;
                      }
                    }

                    return (
                      <td key={i} className={`px-2 py-2 border-r border-slate-200 dark:border-white/10 last:border-0 align-top ${isToday ? (isDark ? 'bg-white/5' : 'bg-slate-50') : ''}`}>
                        {isAbsenceOnly ? (
                          isAbsent && (
                            <div className="h-full w-full rounded p-2 bg-slate-200 dark:bg-white/10 text-slate-600 dark:text-slate-300 border border-slate-300 dark:border-white/20">
                              <div className="font-bold text-[0.65rem]">Out of Office</div>
                              <div className="opacity-70 text-[0.65rem]">{date.getDate()}. {date.toLocaleDateString('en-US', { month: 'short' })}</div>
                            </div>
                          )
                        ) : (
                          // Work Schedule
                          (blockLabel) && (
                            <div className="h-full w-full rounded p-2 bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800/50">
                              <div className="font-bold text-[0.65rem]">{blockLabel}</div>
                              <div className="opacity-70 text-[0.65rem]">{blockTime}</div>
                            </div>
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
  );
}
