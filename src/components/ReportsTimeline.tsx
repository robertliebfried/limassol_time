import React, { useState } from 'react';
import { Employee, TimeLog } from '@/types';
import { FirestoreShiftEvent } from '@/lib/firebase';

interface ReportsTimelineProps {
  isDark: boolean;
  employees: Employee[];
  historicalShiftEvents: FirestoreShiftEvent[];
  logs?: TimeLog[];
  reportStartDate: string;
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

export function ReportsTimeline({
  isDark,
  employees,
  historicalShiftEvents,
  logs = [],
  reportStartDate,
  onSaveShift,
  onDeleteShift,
}: ReportsTimelineProps) {
  // We plot hours from 06:00 to 24:00 (18 hours)
  const HOURS = Array.from({ length: 19 }, (_, i) => i + 6);

  // Active editing modal state
  const [activeEmp, setActiveEmp] = useState<Employee | null>(null);
  const [shiftIn24, setShiftIn24] = useState('09:00');
  const [shiftOut24, setShiftOut24] = useState('17:00');
  const [shiftHours, setShiftHours] = useState(8.0);
  const [shiftNote, setShiftNote] = useState('');
  const [shiftIsAbsent, setShiftIsAbsent] = useState(false);

  const calculateLeftPercent = (timeStr: string) => {
    try {
      let hrs = 0;
      let mins = 0;
      if (timeStr.toLowerCase().includes('am') || timeStr.toLowerCase().includes('pm')) {
        const [timeMatch, modifier] = timeStr.split(' ');
        const [hStr, mStr] = timeMatch.split(':');
        hrs = parseInt(hStr, 10);
        mins = parseInt(mStr || '0', 10);
        if (modifier && modifier.toLowerCase() === 'pm' && hrs !== 12) hrs += 12;
        if (modifier && modifier.toLowerCase() === 'am' && hrs === 12) hrs = 0;
      } else {
        const [hStr, mStr] = timeStr.split(':');
        hrs = parseInt(hStr, 10);
        mins = parseInt(mStr || '0', 10);
      }
      
      const totalMinutes = hrs * 60 + mins;
      const startMinutes = 6 * 60; // 06:00 AM
      const endMinutes = 24 * 60; // 24:00

      if (totalMinutes <= startMinutes) return 0;
      if (totalMinutes >= endMinutes) return 100;
      
      return ((totalMinutes - startMinutes) / (endMinutes - startMinutes)) * 100;
    } catch {
      return 0;
    }
  };

  const normKey = (idOrUnameOrName?: string) => {
    if (!idOrUnameOrName) return '';
    return idOrUnameOrName.toLowerCase().trim().replace(/^emp-fs-/, '').replace(/^emp-/, '').replace(/[\s-_.]/g, '');
  };

  const activeEmployees = employees.filter(emp => emp.role !== 'admin' && emp.name !== 'Admin' && !emp.isDeleted);

  const handleOpenEditor = (emp: Employee) => {
    setActiveEmp(emp);
    const empK = normKey(emp.id || emp.username || emp.name);
    const dayLogs = logs.filter(l => {
      const lK = normKey(l.employeeId || l.employeeName);
      return lK === empK && l.date === reportStartDate;
    });
    const totalHrs = dayLogs.reduce((sum, l) => sum + l.hours, 0);
    const isAbsent = totalHrs === 0 && (emp.status === 'absent' || dayLogs.some(l => l.projectTask?.toLowerCase().includes('absent')));

    if (totalHrs > 0) {
      setShiftIn24('09:00');
      setShiftOut24('17:00');
      setShiftHours(Math.round(totalHrs * 10) / 10);
      setShiftNote(dayLogs[0]?.projectTask || 'Shift Attendance');
      setShiftIsAbsent(false);
    } else {
      setShiftIn24('09:00');
      setShiftOut24('17:00');
      setShiftHours(isAbsent ? 0 : 8.0);
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
    if (!activeEmp) return;

    if (onSaveShift) {
      const inTime12 = shiftIsAbsent ? undefined : format24To12(shiftIn24);
      const outTime12 = shiftIsAbsent ? undefined : format24To12(shiftOut24);
      onSaveShift(
        activeEmp,
        reportStartDate,
        shiftIsAbsent ? 0 : shiftHours,
        inTime12,
        outTime12,
        shiftIsAbsent,
        shiftNote
      );
    }

    setActiveEmp(null);
  };

  const handleDeleteModal = () => {
    if (!activeEmp) return;
    if (onDeleteShift) {
      onDeleteShift(activeEmp, reportStartDate);
    }
    setActiveEmp(null);
  };

  return (
    <div className={`overflow-hidden rounded-3xl border shadow-lg ${isDark ? 'border-white/15 bg-[#133137]/80 text-white' : 'border-slate-200 bg-white text-black'}`}>
      
      {/* Timeline Header */}
      <div className="p-6 border-b border-white/10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="font-serif text-2xl font-bold flex items-center gap-2">
            ⏳ Daily Visual Timeline
          </h3>
          <p className="text-xs opacity-75 mt-1">
            Visual check-in and check-out schedule for <strong className="text-emerald-400">{reportStartDate}</strong>. Click any row or shift bar to edit hours.
          </p>
        </div>

        <button
          onClick={() => {
            if (activeEmployees.length > 0) {
              handleOpenEditor(activeEmployees[0]);
            }
          }}
          className="rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 text-xs font-black shadow-lg transition active:scale-95 flex items-center gap-1.5 flex-shrink-0"
        >
          + Add / Edit Shift Hours
        </button>
      </div>
      
      {/* 24-Hour Gantt Timeline */}
      <div className="overflow-x-auto">
        <div className="min-w-[900px]">
          {/* Header row with hours */}
          <div className={`flex border-b text-xs font-black ${isDark ? 'border-white/15 bg-black/60 text-slate-300' : 'border-slate-200 bg-slate-100 text-slate-700'}`}>
            <div className="w-56 shrink-0 p-3.5 border-r border-white/10">Agent</div>
            <div className="flex-1 relative h-10 flex items-center">
              {HOURS.map(hour => (
                <div key={hour} className="absolute h-full border-l border-white/10 px-1 pt-2 opacity-60 text-[11px] font-mono" style={{ left: `${((hour - 6) / 18) * 100}%` }}>
                  {hour.toString().padStart(2, '0')}:00
                </div>
              ))}
            </div>
          </div>

          {/* Rows for each employee */}
          <div className="divide-y divide-white/10">
            {activeEmployees.map(emp => {
              const empK1 = normKey(emp.id);
              const empK2 = normKey(emp.username);
              const empK3 = normKey(emp.name);

              // Get logs for employee on this date
              const dayLogs = logs.filter(l => {
                const lK = normKey(l.employeeId || l.employeeName);
                return (lK === empK1 || lK === empK2 || lK === empK3) && l.date === reportStartDate;
              });
              const totalHrs = dayLogs.reduce((sum, l) => sum + l.hours, 0);
              const isAbsent = totalHrs === 0 && (emp.status === 'absent' || dayLogs.some(l => l.projectTask?.toLowerCase().includes('absent')));

              // Get shift events for this employee on this day
              const empEvents = historicalShiftEvents
                .filter(ev => {
                  const evKey = normKey(ev.employeeId);
                  return evKey === empK1 || evKey === empK2 || evKey === empK3;
                })
                .sort((a, b) => a.timestamp - b.timestamp);

              // Pair up IN and OUT events
              const blocks: { start: string, end: string, label?: string }[] = [];
              let currentIn: FirestoreShiftEvent | null = null;

              for (const ev of empEvents) {
                if (ev.type === 'clock_in' || ev.type === 'IN') {
                  currentIn = ev;
                } else if (ev.type === 'clock_out' || ev.type === 'OUT') {
                  if (currentIn) {
                    blocks.push({ start: currentIn.time, end: ev.time, label: currentIn.label || ev.label });
                    currentIn = null;
                  }
                }
              }
              // If there's a trailing IN, the shift is ongoing
              if (currentIn) {
                const now = new Date();
                let endStr = '23:59';
                if (reportStartDate === now.toISOString().split('T')[0]) {
                  const currentHrs = now.getHours();
                  const currentMins = now.getMinutes();
                  const ampm = currentHrs >= 12 ? 'PM' : 'AM';
                  const hrs12 = currentHrs % 12 || 12;
                  endStr = `${hrs12.toString().padStart(2, '0')}:${currentMins.toString().padStart(2, '0')} ${ampm}`;
                }
                blocks.push({ start: currentIn.time, end: endStr, label: currentIn.label || 'Ongoing' });
              }

              // Fallback to employee live status if today
              if (blocks.length === 0 && (emp.checkInTime || emp.checkOutTime)) {
                 const isToday = reportStartDate === new Date().toISOString().split('T')[0];
                 if (isToday && emp.checkInTime) {
                    let endStr = emp.checkOutTime;
                    if (!endStr) {
                      const now = new Date();
                      const currentHrs = now.getHours();
                      const currentMins = now.getMinutes();
                      const ampm = currentHrs >= 12 ? 'PM' : 'AM';
                      const hrs12 = currentHrs % 12 || 12;
                      endStr = `${hrs12.toString().padStart(2, '0')}:${currentMins.toString().padStart(2, '0')} ${ampm}`;
                    }
                    blocks.push({ start: emp.checkInTime, end: endStr, label: 'Live Session' });
                 }
              }

              // Fallback to day logs if no blocks but totalHrs > 0
              if (blocks.length === 0 && totalHrs > 0) {
                blocks.push({ start: '09:00 AM', end: `${Math.min(24, 9 + Math.round(totalHrs))}:00`, label: `${totalHrs.toFixed(1)}h Shift` });
              }

              return (
                <div 
                  key={emp.id} 
                  onClick={() => handleOpenEditor(emp)}
                  className={`flex relative transition-colors group cursor-pointer ${isDark ? 'hover:bg-white/10' : 'hover:bg-emerald-50/60'}`}
                  title={`Click to add/edit hours for ${emp.name}`}
                >
                  {/* Agent Info Col */}
                  <div className="w-56 shrink-0 p-3 border-r border-white/10 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {emp.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-extrabold text-xs truncate">{emp.name}</span>
                        <span className="text-[10px] opacity-60 font-mono">
                          {isAbsent ? '🏖️ Out of Office' : totalHrs > 0 ? `${totalHrs.toFixed(1)} hrs` : 'No shift'}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEditor(emp);
                      }}
                      className="px-2 py-0.5 rounded-lg border border-white/20 bg-white/5 hover:bg-emerald-600 hover:text-white text-[10px] font-bold opacity-70 group-hover:opacity-100 transition"
                      title="Edit shift"
                    >
                      ✏️ Edit
                    </button>
                  </div>

                  {/* Visual Gantt Bar Track */}
                  <div className="flex-1 relative min-h-[50px] flex items-center">
                    {/* Background Grid Lines */}
                    {HOURS.map(hour => (
                      <div key={hour} className="absolute h-full border-l border-white/5 pointer-events-none" style={{ left: `${((hour - 6) / 18) * 100}%` }} />
                    ))}

                    {/* Absent Indicator */}
                    {isAbsent && (
                      <div className="absolute inset-y-1.5 left-2 right-2 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-500 font-extrabold text-xs">
                        🏖️ Out of Office / Vacation (Absent)
                      </div>
                    )}

                    {/* Empty Slot Placeholder */}
                    {!isAbsent && blocks.length === 0 && (
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition text-[11px] font-bold text-emerald-400">
                        + Click to Add Shift Hours for {emp.name}
                      </div>
                    )}

                    {/* Shift Blocks */}
                    {!isAbsent && blocks.map((block, idx) => {
                      const left = calculateLeftPercent(block.start);
                      const right = calculateLeftPercent(block.end);
                      const width = Math.max(2, right - left);
                      
                      return (
                        <div 
                          key={idx}
                          className="absolute top-2 bottom-2 rounded-xl bg-emerald-500/30 border border-emerald-500 shadow-md flex items-center px-2 group-hover:bg-emerald-500/50 transition-colors overflow-hidden"
                          style={{ left: `${left}%`, width: `${width}%` }}
                          title={`${block.start} - ${block.end} (${block.label || 'Tracked'})`}
                        >
                          <span className="text-[10px] font-black text-emerald-300 truncate">
                            {block.start} – {block.end}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── INTERACTIVE SHIFT / HOURS EDITOR MODAL ── */}
      {activeEmp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className={`w-full max-w-lg rounded-3xl border p-6 shadow-2xl ${isDark ? 'border-white/20 bg-[#16363d] text-white' : 'border-slate-300 bg-white text-black'}`}>
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center font-black text-lg shadow-md">
                  {activeEmp.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold leading-tight flex items-center gap-2">
                    {activeEmp.name}
                    {activeEmp.team && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/10 border border-white/20">
                        {activeEmp.team}
                      </span>
                    )}
                  </h3>
                  <p className="text-xs opacity-70 mt-0.5">
                    Date: <strong className="text-emerald-400">{reportStartDate}</strong>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveEmp(null)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-sm font-bold opacity-75 hover:opacity-100 transition"
              >
                ✕
              </button>
            </div>

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
                    if (shiftHours === 0) setShiftHours(8.0);
                    setShiftNote('Shift Attendance');
                  }}
                  className={`p-3 rounded-2xl border text-center font-extrabold text-xs transition flex items-center justify-center gap-2 ${
                    !shiftIsAbsent
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg'
                      : isDark ? 'border-white/10 bg-black/30 hover:bg-white/10 opacity-70' : 'border-slate-200 bg-slate-100 hover:bg-slate-200 opacity-70'
                  }`}
                >
                  🟢 Present (Working Shift)
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
                  onClick={() => handleApplyPreset('09:00', '17:00', 8.0, false)}
                  className={`p-2 rounded-xl border text-left font-bold transition ${
                    shiftIn24 === '09:00' && shiftOut24 === '17:00' && !shiftIsAbsent
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                      : isDark ? 'border-white/10 bg-black/30 hover:bg-white/10' : 'border-slate-200 bg-slate-100 hover:bg-slate-200'
                  }`}
                >
                  09:00 - 17:00 (8h)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('10:00', '18:00', 8.0, false)}
                  className={`p-2 rounded-xl border text-left font-bold transition ${
                    shiftIn24 === '10:00' && shiftOut24 === '18:00' && !shiftIsAbsent
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                      : isDark ? 'border-white/10 bg-black/30 hover:bg-white/10' : 'border-slate-200 bg-slate-100 hover:bg-slate-200'
                  }`}
                >
                  10:00 - 18:00 (8h)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('11:00', '19:00', 8.0, false)}
                  className={`p-2 rounded-xl border text-left font-bold transition ${
                    shiftIn24 === '11:00' && shiftOut24 === '19:00' && !shiftIsAbsent
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                      : isDark ? 'border-white/10 bg-black/30 hover:bg-white/10' : 'border-slate-200 bg-slate-100 hover:bg-slate-200'
                  }`}
                >
                  11:00 - 19:00 (8h)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('12:00', '20:00', 8.0, false)}
                  className={`p-2 rounded-xl border text-left font-bold transition ${
                    shiftIn24 === '12:00' && shiftOut24 === '20:00' && !shiftIsAbsent
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                      : isDark ? 'border-white/10 bg-black/30 hover:bg-white/10' : 'border-slate-200 bg-slate-100 hover:bg-slate-200'
                  }`}
                >
                  12:00 - 20:00 (8h)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset('08:00', '16:00', 8.0, false)}
                  className={`p-2 rounded-xl border text-left font-bold transition ${
                    shiftIn24 === '08:00' && shiftOut24 === '16:00' && !shiftIsAbsent
                      ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                      : isDark ? 'border-white/10 bg-black/30 hover:bg-white/10' : 'border-slate-200 bg-slate-100 hover:bg-slate-200'
                  }`}
                >
                  08:00 - 16:00 (8h)
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

              {/* Action Buttons */}
              <div className="pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <button
                    type="button"
                    onClick={handleDeleteModal}
                    className="rounded-2xl border border-red-500/40 bg-red-500/10 hover:bg-red-500/20 text-red-400 px-3.5 py-2 text-xs font-bold transition"
                  >
                    🗑️ Delete Shift
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveEmp(null)}
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
