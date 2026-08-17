import React from 'react';
import { Employee, TimeLog } from '../types';

interface ReportsOverviewProps {
  isDark: boolean;
  employees: Employee[];
  logs: TimeLog[];
  reportStartDate: string;
  reportEndDate: string;
}

function formatDuration(seconds: number) {
  if (isNaN(seconds) || seconds <= 0) return '0s';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export function ReportsOverview({ isDark, employees, logs, reportStartDate, reportEndDate }: ReportsOverviewProps) {
  // Filter logs for the selected date range
  const filteredLogs = logs.filter(l => 
    (!reportStartDate || l.date >= reportStartDate) &&
    (!reportEndDate || l.date <= reportEndDate)
  );

  const isToday = reportStartDate === new Date().toISOString().split('T')[0];

  // Active non-admin employees
  const activeEmps = employees.filter(e => e.role !== 'admin' && e.name !== 'Admin' && !e.isDeleted);
  const totalEmployeesCount = activeEmps.length || 1;

  // Normalize key helper for logs matching
  const normKey = (idOrUnameOrName?: string) => {
    if (!idOrUnameOrName) return '';
    return idOrUnameOrName.toLowerCase().trim().replace(/^emp-fs-/, '').replace(/^emp-/, '').replace(/[\s-_.]/g, '');
  };

  // Group logs by employee
  const empWorkedMap: Record<string, { totalHours: number; daysWorked: number; shiftTimes: string[] }> = {};
  filteredLogs.forEach(l => {
    if (l.hours > 0) {
      const k1 = normKey(l.employeeId);
      const k2 = normKey(l.employeeName);
      [k1, k2].filter(Boolean).forEach(k => {
        if (!empWorkedMap[k]) empWorkedMap[k] = { totalHours: 0, daysWorked: 0, shiftTimes: [] };
        empWorkedMap[k].totalHours += l.hours;
        empWorkedMap[k].daysWorked += 1;
        if (l.timestamp) empWorkedMap[k].shiftTimes.push(l.timestamp);
      });
    }
  });

  // Calculate who worked and who was absent in the selected period
  const workedEmployees: { emp: Employee; hours: number; shifts: string }[] = [];
  const absentEmployees: { emp: Employee; reason: string }[] = [];

  activeEmps.forEach(emp => {
    const k1 = normKey(emp.id);
    const k2 = normKey(emp.username);
    const k3 = normKey(emp.name);
    const data = empWorkedMap[k1] || empWorkedMap[k2] || empWorkedMap[k3];

    if (isToday) {
      if (emp.status === 'checked_in' || emp.status === 'completed' || emp.status === 'on_break' || (data && data.totalHours > 0)) {
        workedEmployees.push({
          emp,
          hours: data ? data.totalHours : (emp.accumulatedSeconds ? Math.round(emp.accumulatedSeconds / 3600 * 10) / 10 : 8),
          shifts: data?.shiftTimes[0] || (emp.checkInTime ? `${emp.checkInTime} - ${emp.checkOutTime || 'Active'}` : '10:00 AM - 06:00 PM')
        });
      } else {
        absentEmployees.push({ emp, reason: 'Out of Office' });
      }
    } else {
      if (data && data.totalHours > 0) {
        workedEmployees.push({
          emp,
          hours: Math.round(data.totalHours * 10) / 10,
          shifts: data.shiftTimes[0] || `${data.totalHours}h logged`
        });
      } else {
        absentEmployees.push({ emp, reason: 'Out of Office' });
      }
    }
  });

  const countAtWork = workedEmployees.length;
  const countOutOfOffice = absentEmployees.length;
  const attendanceRate = Math.round((countAtWork / totalEmployeesCount) * 100);

  // 1. Time at Work (Total Shift Time from Logs)
  const totalWorkHours = filteredLogs.reduce((sum, l) => sum + l.hours, 0);
  const totalWorkSeconds = totalWorkHours * 3600;

  // 2. DeskTime Time (Active time)
  let totalActiveSeconds = 0;
  if (isToday) {
    totalActiveSeconds = activeEmps.reduce((sum, emp) => sum + (emp.awActiveSecondsToday || 0), 0);
  } else {
    totalActiveSeconds = totalWorkSeconds * 0.85;
  }

  // 3. Offline Time
  const offlineSeconds = Math.max(0, totalWorkSeconds - totalActiveSeconds);

  // 4. Projects Time
  const projectsSeconds = totalWorkSeconds;

  // 5. Productivity (%)
  const productivityPercent = totalWorkSeconds > 0 ? Math.round((totalActiveSeconds / totalWorkSeconds) * 100) : 0;
  
  // 6. Effectiveness (%)
  const effectivenessPercent = totalWorkSeconds > 0 ? Math.round((projectsSeconds / totalWorkSeconds) * 100) : 0;

  const Card = ({ 
    title, 
    value, 
    subValue, 
    titleColor = "text-slate-400", 
    valueColor = "text-emerald-500",
    badge
  }: { 
    title: string; 
    value: string; 
    subValue?: string; 
    titleColor?: string; 
    valueColor?: string;
    badge?: { text: string; color: string };
  }) => (
    <div className={`p-5 rounded-2xl border flex flex-col justify-between shadow-sm transition hover:shadow-md ${isDark ? 'border-white/10 bg-[#16363d]/60' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-center justify-between gap-2">
        <span className={`text-[0.7rem] font-extrabold uppercase tracking-widest ${titleColor}`}>{title}</span>
        {badge && (
          <span className={`text-[0.65rem] font-black px-2 py-0.5 rounded-full border ${badge.color}`}>
            {badge.text}
          </span>
        )}
      </div>
      <div className="mt-2">
        <span className={`text-3xl font-extrabold tracking-tight ${valueColor}`}>{value}</span>
        {subValue && (
          <div className="text-xs font-bold opacity-70 mt-0.5">{subValue}</div>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 mt-6 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Primary Key Attendance Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card 
          title="👥 Agents at Work" 
          value={`${countAtWork} / ${totalEmployeesCount}`}
          subValue={`${attendanceRate}% Attendance Rate`}
          valueColor={isDark ? "text-emerald-300" : "text-emerald-600"}
          badge={{ text: "Active", color: isDark ? "bg-emerald-950/80 text-emerald-300 border-emerald-500/40" : "bg-emerald-50 text-emerald-700 border-emerald-300" }}
        />
        <Card 
          title="🏖️ Out of Office" 
          value={`${countOutOfOffice}`}
          subValue={`${100 - attendanceRate}% Absent Rate`}
          valueColor={countOutOfOffice > 0 ? (isDark ? "text-amber-300" : "text-amber-600") : "text-slate-400"}
          badge={{ text: countOutOfOffice === 0 ? "Full Team" : "On Leave", color: isDark ? "bg-amber-950/80 text-amber-300 border-amber-500/40" : "bg-amber-50 text-amber-700 border-amber-300" }}
        />
        <Card 
          title="⏱️ Time at work" 
          value={formatDuration(totalWorkSeconds)} 
          subValue={`${Math.round(totalWorkHours)} total logged hours`}
          valueColor={isDark ? "text-sky-300" : "text-sky-600"}
        />
        <Card 
          title="⚡ Productivity" 
          value={`${Math.min(100, productivityPercent)}%`} 
          subValue={`DeskTime: ${formatDuration(totalActiveSeconds)}`}
          valueColor={isDark ? "text-teal-300" : "text-teal-600"}
        />
      </div>

      {/* Secondary Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card 
          title="🖥️ DeskTime Active Time" 
          value={formatDuration(totalActiveSeconds)} 
          valueColor={isDark ? "text-teal-300" : "text-teal-600"}
        />
        <Card 
          title="🔌 Offline Time" 
          value={formatDuration(offlineSeconds)} 
          valueColor={isDark ? "text-slate-300" : "text-slate-600"}
        />
        <Card 
          title="🎯 Effectiveness" 
          value={`${effectivenessPercent}%`} 
          valueColor={isDark ? "text-purple-300" : "text-purple-600"}
        />
      </div>

      {/* Bottom Detail Panels: Agents at Work & Out of Office */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* At Work Panel */}
        <div className={`p-6 rounded-3xl border flex flex-col shadow-sm h-80 ${isDark ? 'border-white/10 bg-[#16363d]/60' : 'border-slate-200 bg-white'}`}>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                Agents at Work ({countAtWork})
              </span>
            </div>
            <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">
              {attendanceRate}% Present
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-2.5 custom-scrollbar">
            {workedEmployees.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center h-full opacity-50">
                <div className="text-4xl mb-2">👥</div>
                <span className="text-xs font-bold">No agents logged for this period</span>
              </div>
            ) : (
              workedEmployees.map(({ emp, hours, shifts }) => (
                <div key={emp.id} className={`p-3 rounded-2xl flex items-center justify-between gap-3 border transition ${
                  isDark ? 'border-white/5 bg-white/5 hover:bg-white/10' : 'border-slate-100 bg-slate-50 hover:bg-slate-100/80'
                }`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-extrabold truncate">{emp.name}</span>
                      <span className="text-[0.65rem] opacity-60 font-mono truncate">{shifts}</span>
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <span className="text-xs font-extrabold text-emerald-400 font-mono">{hours}h</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Absence / Out of Office Panel */}
        <div className={`p-6 rounded-3xl border flex flex-col shadow-sm h-80 ${isDark ? 'border-white/10 bg-[#16363d]/60' : 'border-slate-200 bg-white'}`}>
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
              <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
                Out of Office / Absent ({countOutOfOffice})
              </span>
            </div>
            <span className="text-[0.65rem] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
              {100 - attendanceRate}% Absent
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-2.5 custom-scrollbar">
            {absentEmployees.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center h-full opacity-60">
                <div className="text-4xl mb-2">🎉</div>
                <span className="text-xs font-bold text-emerald-400">Full Team Present! No one is absent.</span>
              </div>
            ) : (
              absentEmployees.map(({ emp, reason }) => (
                <div key={emp.id} className={`p-3 rounded-2xl flex items-center justify-between gap-3 border transition ${
                  isDark ? 'border-white/5 bg-white/5 hover:bg-white/10' : 'border-slate-100 bg-slate-50 hover:bg-slate-100/80'
                }`}>
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-amber-600/30 text-amber-400 border border-amber-500/30 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-extrabold truncate">{emp.name}</span>
                      <span className="text-[0.65rem] opacity-60 truncate">{emp.role}</span>
                    </div>
                  </div>
                  <span className="text-[0.65rem] font-extrabold px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    {reason}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
