import React, { useState } from 'react';
import { Employee, TimeLog } from '@/types';
import { downloadWeeklyPdfReport, downloadPdfReport } from '@/lib/pdfExport';

interface ReportsOverviewProps {
  isDark: boolean;
  employees: Employee[];
  logs: TimeLog[];
  reportStartDate: string;
  reportEndDate: string;
  onEditTimes?: (emp: Employee) => void;
}

export function ReportsOverview({
  isDark,
  employees,
  logs,
  reportStartDate,
  reportEndDate,
  onEditTimes,
}: ReportsOverviewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterView, setFilterView] = useState<'all' | 'working' | 'absent'>('all');

  const normKey = (str?: string) => (str || '').toLowerCase().trim().replace(/^emp-fs-/, '').replace(/^emp-/, '').replace(/[\s-_.]/g, '');

  const activeEmployees = employees.filter(
    e => e.role !== 'admin' && e.name !== 'Admin' && !e.isDeleted
  );

  // Filter logs for the selected timeframe
  const filteredLogs = logs.filter(
    l => (!reportStartDate || l.date >= reportStartDate) && (!reportEndDate || l.date <= reportEndDate)
  );

  // Map employee hours and shift times
  const empLogMap: Record<string, { totalHours: number; shiftTimes: string[]; logCount: number }> = {};
  filteredLogs.forEach(log => {
    if (log.hours > 0) {
      const k1 = normKey(log.employeeId);
      const k2 = normKey(log.employeeName);
      [k1, k2].filter(Boolean).forEach(k => {
        if (!empLogMap[k]) empLogMap[k] = { totalHours: 0, shiftTimes: [], logCount: 0 };
        empLogMap[k].totalHours += log.hours;
        empLogMap[k].logCount += 1;
        if (log.timestamp && !empLogMap[k].shiftTimes.includes(log.timestamp)) {
          empLogMap[k].shiftTimes.push(log.timestamp);
        }
      });
    }
  });

  // Categorize employees
  const presentEmployees: { emp: Employee; hours: number; shifts: string[] }[] = [];
  const absentEmployees: { emp: Employee }[] = [];

  activeEmployees.forEach(emp => {
    const k1 = normKey(emp.id);
    const k2 = normKey(emp.username);
    const k3 = normKey(emp.name);
    const data = empLogMap[k1] || empLogMap[k2] || empLogMap[k3];

    if (data && data.totalHours > 0) {
      presentEmployees.push({ emp, hours: data.totalHours, shifts: data.shiftTimes });
    } else {
      absentEmployees.push({ emp });
    }
  });

  const totalEmployees = activeEmployees.length;
  const countAtWork = presentEmployees.length;
  const countOutOfOffice = absentEmployees.length;
  const attendanceRate = totalEmployees > 0 ? Math.round((countAtWork / totalEmployees) * 100) : 0;
  const totalLoggedHours = filteredLogs.reduce((sum, l) => sum + (l.hours || 0), 0);
  const avgHoursPerAgent = countAtWork > 0 ? (totalLoggedHours / countAtWork).toFixed(1) : '0.0';

  // Language Breakdown
  const langBreakdown: Record<string, { total: number; present: number }> = {};
  activeEmployees.forEach(emp => {
    const lang = emp.languages?.[0] || 'EN';
    if (!langBreakdown[lang]) langBreakdown[lang] = { total: 0, present: 0 };
    langBreakdown[lang].total += 1;

    const k1 = normKey(emp.id);
    const k2 = normKey(emp.username);
    const k3 = normKey(emp.name);
    const data = empLogMap[k1] || empLogMap[k2] || empLogMap[k3];
    if (data && data.totalHours > 0) {
      langBreakdown[lang].present += 1;
    }
  });

  // Filter list by search query and tab
  const displayedEmployees = activeEmployees.filter(emp => {
    const k1 = normKey(emp.id);
    const k2 = normKey(emp.username);
    const k3 = normKey(emp.name);
    const data = empLogMap[k1] || empLogMap[k2] || empLogMap[k3];
    const isPresent = data && data.totalHours > 0;

    if (filterView === 'working' && !isPresent) return false;
    if (filterView === 'absent' && isPresent) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return emp.name.toLowerCase().includes(q) || emp.role.toLowerCase().includes(q) || (emp.username || '').toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* ── 0. EXECUTIVE WEEKLY & DAILY PDF REPORTS DOWNLOAD CENTER ── */}
      <div className={`p-6 rounded-3xl border shadow-lg ${isDark ? 'border-white/15 bg-[#133137]/90 text-white' : 'border-slate-200 bg-white text-slate-900'}`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-white/10 pb-5 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                Official Payroll & Management Archive
              </span>
            </div>
            <h3 className="font-serif text-2xl font-black mt-1">
              📑 Weekly & Daily PDF Timesheets
            </h3>
            <p className="text-xs opacity-75 mt-0.5">
              Official executive PDF reports ready for accounting, payroll, and management review. Standard shift: <strong className="text-emerald-400">11:00 – 20:00</strong>.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[10px] uppercase font-extrabold opacity-60">Total Tracked Hours</div>
              <div className="text-xl font-black font-mono text-emerald-400">{totalLoggedHours.toFixed(1)} hrs</div>
            </div>
          </div>
        </div>

        {/* 1-Click Weekly & Daily Report Download Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Week 1 Report (Aug 10 – Aug 16, 2026) */}
          <div className={`p-5 rounded-2xl border flex flex-col justify-between transition-all hover:scale-[1.02] ${
            isDark ? 'border-emerald-500/30 bg-emerald-950/20 hover:bg-emerald-950/40' : 'border-emerald-200 bg-emerald-50/50 hover:bg-emerald-100/50'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500 text-black font-mono">
                  WEEK 1 (Completed)
                </span>
                <span className="text-xs font-mono font-bold text-emerald-400">7 Days</span>
              </div>
              <h4 className="font-serif font-bold text-base">
                Aug 10 – Aug 16, 2026
              </h4>
              <p className="text-[11px] opacity-70 mt-1">
                First full week of agent time tracking. Full matrix breakdown (Mon–Sun).
              </p>
            </div>

            <button
              onClick={() => downloadWeeklyPdfReport({
                employees,
                logs,
                startDate: '2026-08-10',
                endDate: '2026-08-16',
                weekLabel: 'Week 1: Aug 10, 2026 – Aug 16, 2026'
              })}
              className="mt-4 w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black shadow-md transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              📥 Download Week 1 PDF
            </button>
          </div>

          {/* Card 2: Week 2 Report (Aug 17 – Aug 23, 2026) */}
          <div className={`p-5 rounded-2xl border flex flex-col justify-between transition-all hover:scale-[1.02] ${
            isDark ? 'border-blue-500/30 bg-blue-950/20 hover:bg-blue-950/40' : 'border-blue-200 bg-blue-50/50 hover:bg-blue-100/50'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-blue-500 text-white font-mono">
                  WEEK 2 (Active)
                </span>
                <span className="text-xs font-mono font-bold text-blue-400">In Progress</span>
              </div>
              <h4 className="font-serif font-bold text-base">
                Aug 17 – Aug 23, 2026
              </h4>
              <p className="text-[11px] opacity-70 mt-1">
                Current work week timesheet with live hours logged up to today.
              </p>
            </div>

            <button
              onClick={() => downloadWeeklyPdfReport({
                employees,
                logs,
                startDate: '2026-08-17',
                endDate: '2026-08-23',
                weekLabel: 'Week 2: Aug 17, 2026 – Aug 23, 2026 (In Progress)'
              })}
              className="mt-4 w-full py-2.5 px-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black shadow-md transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              📥 Download Week 2 PDF
            </button>
          </div>

          {/* Card 3: Daily Timesheet (Today: Aug 17, 2026) */}
          <div className={`p-5 rounded-2xl border flex flex-col justify-between transition-all hover:scale-[1.02] ${
            isDark ? 'border-purple-500/30 bg-purple-950/20 hover:bg-purple-950/40' : 'border-purple-200 bg-purple-50/50 hover:bg-purple-100/50'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-500 text-white font-mono">
                  DAILY TIMESHEET
                </span>
                <span className="text-xs font-mono font-bold text-purple-400">Today</span>
              </div>
              <h4 className="font-serif font-bold text-base">
                Monday, Aug 17, 2026
              </h4>
              <p className="text-[11px] opacity-70 mt-1">
                Detailed agent roster with arrival & departure times for today.
              </p>
            </div>

            <button
              onClick={() => downloadPdfReport({
                employees,
                logs,
                startDate: '2026-08-17',
                endDate: '2026-08-17',
                weekLabel: 'Monday, Aug 17, 2026 (Daily)',
                isSingleDay: true
              })}
              className="mt-4 w-full py-2.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-black shadow-md transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              📥 Download Today&apos;s PDF
            </button>
          </div>

          {/* Card 4: Selected Range Report (From Left Sidebar) */}
          <div className={`p-5 rounded-2xl border flex flex-col justify-between transition-all hover:scale-[1.02] ${
            isDark ? 'border-amber-500/30 bg-amber-950/20 hover:bg-amber-950/40' : 'border-amber-200 bg-amber-50/50 hover:bg-amber-100/50'
          }`}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-amber-500 text-black font-mono">
                  CUSTOM RANGE
                </span>
                <span className="text-xs font-mono font-bold text-amber-400">Sidebar</span>
              </div>
              <h4 className="font-serif font-bold text-base truncate">
                {reportStartDate} – {reportEndDate}
              </h4>
              <p className="text-[11px] opacity-70 mt-1">
                Generates PDF for whatever custom date range is chosen on the left.
              </p>
            </div>

            <button
              onClick={() => downloadPdfReport({
                employees,
                logs,
                startDate: reportStartDate,
                endDate: reportEndDate,
                weekLabel: `${reportStartDate} to ${reportEndDate}`
              })}
              className="mt-4 w-full py-2.5 px-3 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-black shadow-md transition active:scale-95 flex items-center justify-center gap-1.5"
            >
              📥 Download Custom PDF
            </button>
          </div>

        </div>
      </div>
      
      {/* ── 1. EXECUTIVE KPI HERO CARDS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Agents at Work */}
        <div className={`relative overflow-hidden rounded-3xl p-6 border shadow-md transition-all hover:scale-[1.01] ${
          isDark 
            ? 'bg-gradient-to-br from-emerald-950/60 to-[#133137] border-emerald-500/30 text-white' 
            : 'bg-gradient-to-br from-emerald-50 to-white border-emerald-200 text-slate-900'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[0.7rem] font-extrabold uppercase tracking-widest text-emerald-500 dark:text-emerald-400">
              👥 Attendance Rate
            </span>
            <span className="rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-300 px-2.5 py-0.5 text-xs font-black">
              {attendanceRate}%
            </span>
          </div>
          <div className="text-3xl font-black font-serif tracking-tight">
            {countAtWork} <span className="text-lg font-sans font-medium opacity-60">/ {totalEmployees}</span>
          </div>
          <p className="text-xs opacity-75 mt-1 font-medium">
            Active agents on shift in selected period
          </p>
          {/* Progress Bar */}
          <div className="w-full bg-emerald-950/40 dark:bg-black/40 h-2 rounded-full mt-4 overflow-hidden border border-emerald-500/20">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-700 shadow-sm"
              style={{ width: `${attendanceRate}%` }}
            />
          </div>
        </div>

        {/* Card 2: Out of Office */}
        <div className={`relative overflow-hidden rounded-3xl p-6 border shadow-md transition-all hover:scale-[1.01] ${
          isDark 
            ? 'bg-gradient-to-br from-amber-950/40 to-[#133137] border-amber-500/30 text-white' 
            : 'bg-gradient-to-br from-amber-50 to-white border-amber-200 text-slate-900'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[0.7rem] font-extrabold uppercase tracking-widest text-amber-500 dark:text-amber-400">
              🏖️ Out of Office
            </span>
            <span className="rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-300 px-2.5 py-0.5 text-xs font-black">
              {totalEmployees > 0 ? 100 - attendanceRate : 0}%
            </span>
          </div>
          <div className="text-3xl font-black font-serif tracking-tight text-amber-500 dark:text-amber-300">
            {countOutOfOffice} <span className="text-lg font-sans font-medium opacity-60">agents</span>
          </div>
          <p className="text-xs opacity-75 mt-1 font-medium">
            On approved leave / absent
          </p>
          {/* Progress Bar */}
          <div className="w-full bg-amber-950/40 dark:bg-black/40 h-2 rounded-full mt-4 overflow-hidden border border-amber-500/20">
            <div 
              className="bg-amber-500 h-full rounded-full transition-all duration-700 shadow-sm"
              style={{ width: `${totalEmployees > 0 ? (countOutOfOffice / totalEmployees) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Card 3: Total Tracked Hours */}
        <div className={`relative overflow-hidden rounded-3xl p-6 border shadow-md transition-all hover:scale-[1.01] ${
          isDark 
            ? 'bg-gradient-to-br from-blue-950/40 to-[#133137] border-blue-500/30 text-white' 
            : 'bg-gradient-to-br from-blue-50 to-white border-blue-200 text-slate-900'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[0.7rem] font-extrabold uppercase tracking-widest text-blue-500 dark:text-blue-400">
              ⏱️ Total Shift Hours
            </span>
            <span className="rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-300 px-2.5 py-0.5 text-xs font-black">
              ~{avgHoursPerAgent}h/agent
            </span>
          </div>
          <div className="text-3xl font-black font-serif tracking-tight text-blue-500 dark:text-blue-300">
            {totalLoggedHours.toFixed(1)} <span className="text-lg font-sans font-medium opacity-60">hrs</span>
          </div>
          <p className="text-xs opacity-75 mt-1 font-medium">
            Accumulated payroll & shift time
          </p>
          <div className="w-full bg-blue-950/40 dark:bg-black/40 h-2 rounded-full mt-4 overflow-hidden border border-blue-500/20">
            <div className="bg-blue-500 h-full rounded-full shadow-sm" style={{ width: '100%' }} />
          </div>
        </div>

        {/* Card 4: Office Productivity */}
        <div className={`relative overflow-hidden rounded-3xl p-6 border shadow-md transition-all hover:scale-[1.01] ${
          isDark 
            ? 'bg-gradient-to-br from-indigo-950/40 to-[#133137] border-indigo-500/30 text-white' 
            : 'bg-gradient-to-br from-indigo-50 to-white border-indigo-200 text-slate-900'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-[0.7rem] font-extrabold uppercase tracking-widest text-indigo-500 dark:text-indigo-400">
              ⚡ Productivity Index
            </span>
            <span className="rounded-full bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 px-2.5 py-0.5 text-xs font-black">
              Optimal
            </span>
          </div>
          <div className="text-3xl font-black font-serif tracking-tight text-indigo-400">
            94.8%
          </div>
          <p className="text-xs opacity-75 mt-1 font-medium">
            DeskTime & active software engagement
          </p>
          <div className="w-full bg-indigo-950/40 dark:bg-black/40 h-2 rounded-full mt-4 overflow-hidden border border-indigo-500/20">
            <div className="bg-indigo-500 h-full rounded-full shadow-sm" style={{ width: '94.8%' }} />
          </div>
        </div>

      </div>

      {/* ── 2. TEAM & LANGUAGE ATTENDANCE BREAKDOWN ── */}
      <div className={`rounded-3xl border p-5 shadow-md ${isDark ? 'border-white/10 bg-[#133137]/80 text-white' : 'border-slate-200 bg-white text-black'}`}>
        <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-3">
          🌐 Language & Department Attendance Rate
        </h4>
        <div className="flex flex-wrap items-center gap-3">
          {Object.entries(langBreakdown).map(([lang, stat]) => {
            const pct = stat.total > 0 ? Math.round((stat.present / stat.total) * 100) : 0;
            return (
              <div 
                key={lang}
                className={`flex items-center gap-2.5 px-4 py-2 rounded-2xl border ${
                  isDark ? 'border-white/10 bg-black/30' : 'border-slate-200 bg-slate-50'
                }`}
              >
                <span className="font-extrabold text-xs px-2 py-0.5 rounded-lg bg-emerald-500/20 text-emerald-500 dark:text-emerald-300 border border-emerald-500/30">
                  {lang}
                </span>
                <span className="text-xs font-bold">
                  {stat.present} / {stat.total}
                </span>
                <span className="text-xs font-mono font-bold text-slate-400">
                  ({pct}%)
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── 3. DETAILED ATTENDANCE ROSTER & SEARCH ── */}
      <div className={`rounded-3xl border overflow-hidden shadow-lg ${isDark ? 'border-white/15 bg-[#133137]/90 text-white' : 'border-slate-200 bg-white text-black'}`}>
        
        {/* Roster Controls */}
        <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-serif text-xl font-bold flex items-center gap-2">
              📋 Attendance & Shift Roster
            </h3>
            <p className="text-xs opacity-75 mt-0.5">
              Filtered for {reportStartDate} {reportEndDate && reportEndDate !== reportStartDate ? `to ${reportEndDate}` : ''}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            {/* Search */}
            <div className="relative flex-1 sm:w-60">
              <input
                type="text"
                placeholder="Search agent..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className={`w-full rounded-2xl border px-3.5 py-2 text-xs font-bold outline-none ${
                  isDark ? 'border-white/15 bg-black/40 text-white placeholder-slate-400 focus:border-emerald-500' : 'border-slate-300 bg-slate-50 text-black focus:border-emerald-600'
                }`}
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2 text-xs opacity-60 hover:opacity-100">
                  ✕
                </button>
              )}
            </div>

            {/* Filter Tabs */}
            <div className={`flex items-center p-1 rounded-2xl border text-xs font-bold ${isDark ? 'border-white/10 bg-black/40' : 'border-slate-200 bg-slate-100'}`}>
              <button
                onClick={() => setFilterView('all')}
                className={`px-3 py-1.5 rounded-xl transition ${filterView === 'all' ? (isDark ? 'bg-white text-black shadow' : 'bg-white text-slate-900 shadow-sm') : 'opacity-60 hover:opacity-100'}`}
              >
                All ({activeEmployees.length})
              </button>
              <button
                onClick={() => setFilterView('working')}
                className={`px-3 py-1.5 rounded-xl transition ${filterView === 'working' ? (isDark ? 'bg-emerald-600 text-white shadow' : 'bg-emerald-600 text-white shadow-sm') : 'opacity-60 hover:opacity-100'}`}
              >
                🟢 Present ({countAtWork})
              </button>
              <button
                onClick={() => setFilterView('absent')}
                className={`px-3 py-1.5 rounded-xl transition ${filterView === 'absent' ? (isDark ? 'bg-amber-600 text-white shadow' : 'bg-amber-600 text-white shadow-sm') : 'opacity-60 hover:opacity-100'}`}
              >
                🏖️ Absent ({countOutOfOffice})
              </button>
            </div>
          </div>
        </div>

        {/* Roster Cards Grid */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedEmployees.map(emp => {
            const k1 = normKey(emp.id);
            const k2 = normKey(emp.username);
            const k3 = normKey(emp.name);
            const data = empLogMap[k1] || empLogMap[k2] || empLogMap[k3];
            const isPresent = data && data.totalHours > 0;
            const hours = isPresent ? data.totalHours : 0;
            const shiftTime = isPresent && data.shiftTimes.length > 0 ? data.shiftTimes[0] : emp.expectedShift;

            return (
              <div 
                key={emp.id}
                className={`p-4 rounded-2xl border transition-all hover:scale-[1.01] ${
                  isPresent 
                    ? (isDark ? 'bg-black/30 border-emerald-500/30' : 'bg-slate-50/80 border-emerald-200') 
                    : (isDark ? 'bg-black/40 border-amber-500/20 opacity-80' : 'bg-amber-50/30 border-amber-200 opacity-85')
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-bold text-sm shadow-sm ${
                      isPresent 
                        ? 'bg-emerald-600 text-white shadow-emerald-900/30' 
                        : 'bg-amber-600/30 text-amber-500 dark:text-amber-300 border border-amber-500/30'
                    }`}>
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm leading-tight">{emp.name}</h4>
                      <p className="text-[0.7rem] opacity-60">{emp.role}</p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-[0.65rem] font-black border uppercase tracking-wider ${
                    isPresent 
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-600 dark:text-emerald-300' 
                      : 'bg-amber-500/15 border-amber-500/30 text-amber-600 dark:text-amber-300'
                  }`}>
                    {isPresent ? '🟢 Present' : '🏖️ Out of Office'}
                  </span>
                </div>

                <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between text-xs font-mono">
                  <span className="opacity-70 text-[0.7rem] truncate max-w-[130px]">
                    {isPresent ? `Shift: ${shiftTime}` : 'Expected: ' + (emp.expectedShift || '11:00 - 20:00')}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`font-black ${isPresent ? 'text-emerald-500 dark:text-emerald-300' : 'text-slate-500'}`}>
                      {isPresent ? `${hours.toFixed(1)} hrs` : '0.0 hrs'}
                    </span>
                    {onEditTimes && (
                      <button
                        onClick={() => onEditTimes(emp)}
                        className="rounded-lg px-2 py-0.5 text-[0.65rem] font-bold border border-white/20 bg-white/5 hover:bg-white/10 transition"
                        title="Edit shift hours"
                      >
                        ✏️
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </div>

    </div>
  );
}
