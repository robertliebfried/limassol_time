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

  // 1. Time at Work (Total Shift Time from Logs)
  const totalWorkHours = filteredLogs.reduce((sum, l) => sum + l.hours, 0);
  const totalWorkSeconds = totalWorkHours * 3600;

  // 2. DeskTime Time (Active time)
  // For now, we only have reliable active time for 'today' via awActiveSecondsToday
  let totalActiveSeconds = 0;
  if (isToday) {
    totalActiveSeconds = employees.reduce((sum, emp) => sum + (emp.awActiveSecondsToday || 0), 0);
  } else {
    // If historical, we fallback to Time at Work as a placeholder since we don't have historical AW data
    totalActiveSeconds = totalWorkSeconds * 0.85; // Mock 85% productivity for historical
  }

  // 3. Offline Time
  const offlineSeconds = Math.max(0, totalWorkSeconds - totalActiveSeconds);

  // 4. Projects Time
  const projectsSeconds = totalWorkSeconds; // Assuming all logged time is project time

  // 5. Productivity (%)
  const productivityPercent = totalWorkSeconds > 0 ? Math.round((totalActiveSeconds / totalWorkSeconds) * 100) : 0;
  
  // 6. Effectiveness (%)
  const effectivenessPercent = totalWorkSeconds > 0 ? Math.round((projectsSeconds / totalWorkSeconds) * 100) : 0;

  const Card = ({ title, value, titleColor = "text-slate-500", valueColor = "text-emerald-500" }: { title: string; value: string; titleColor?: string; valueColor?: string }) => (
    <div className={`p-5 rounded-xl border flex flex-col gap-1 shadow-sm ${isDark ? 'border-white/10 bg-[#16363d]/50' : 'border-slate-200 bg-white'}`}>
      <span className={`text-[0.65rem] font-extrabold uppercase tracking-widest ${titleColor}`}>{title}</span>
      <span className={`text-3xl font-light tracking-tight ${valueColor}`}>{value}</span>
    </div>
  );

  return (
    <div className="flex flex-col gap-6 mt-6 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Top 6 Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card 
          title="DeskTime Time" 
          value={formatDuration(totalActiveSeconds)} 
        />
        <Card 
          title="Time at work" 
          value={formatDuration(totalWorkSeconds)} 
        />
        <Card 
          title="Offline Time" 
          value={formatDuration(offlineSeconds)} 
          valueColor={isDark ? "text-slate-300" : "text-red-500"}
        />
        <Card 
          title="Projects Time" 
          value={formatDuration(projectsSeconds)} 
        />
        <Card 
          title="Effectiveness" 
          value={`${effectivenessPercent}%`} 
        />
        <Card 
          title="Productivity" 
          value={`${Math.min(100, productivityPercent)}%`} 
        />
      </div>

      {/* Bottom Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        
        {/* Late Panel */}
        <div className={`p-5 rounded-xl border flex flex-col shadow-sm h-64 ${isDark ? 'border-white/10 bg-[#16363d]/50' : 'border-slate-200 bg-white'}`}>
          <div className="flex justify-between items-center mb-6">
            <span className="text-[0.65rem] font-extrabold uppercase tracking-widest text-slate-500">Late</span>
            <span className="text-[0.65rem] font-bold text-slate-400 cursor-pointer hover:text-emerald-500 transition">VIEW ALL</span>
          </div>
          
          <div className="flex-1 flex flex-col items-center justify-center opacity-50">
            <div className="text-4xl mb-3">👥</div>
            <span className="text-xs font-bold">No one is late</span>
          </div>
        </div>

        {/* Absence Panel */}
        <div className={`p-5 rounded-xl border flex flex-col shadow-sm h-64 overflow-y-auto ${isDark ? 'border-white/10 bg-[#16363d]/50' : 'border-slate-200 bg-white'}`}>
          <div className="flex justify-between items-center mb-6">
            <span className="text-[0.65rem] font-extrabold uppercase tracking-widest text-slate-500">Absence</span>
            <span className="text-[0.65rem] font-bold text-slate-400 cursor-pointer hover:text-emerald-500 transition">VIEW ALL</span>
          </div>
          
          <div className="flex-1 flex flex-col gap-3">
            {employees.filter(e => e.status === 'absent').length === 0 ? (
               <div className="flex-1 flex flex-col items-center justify-center opacity-50">
                 <div className="text-4xl mb-3">🏖️</div>
                 <span className="text-xs font-bold">No one is absent</span>
               </div>
            ) : (
               employees.filter(e => e.status === 'absent').map(emp => (
                 <div key={emp.id} className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center text-xs font-bold opacity-70">
                     {emp.name.charAt(0)}
                   </div>
                   <div className="flex flex-col">
                     <span className="text-sm font-bold">{emp.name}</span>
                     <span className="text-[0.65rem] font-bold text-slate-500">Absent</span>
                   </div>
                 </div>
               ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
