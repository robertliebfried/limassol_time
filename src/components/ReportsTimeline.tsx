import React from 'react';
import { Employee } from '@/types';
import { FirestoreShiftEvent } from '@/lib/firebase';

interface ReportsTimelineProps {
  isDark: boolean;
  employees: Employee[];
  historicalShiftEvents: FirestoreShiftEvent[];
  reportStartDate: string;
}

export function ReportsTimeline({
  isDark,
  employees,
  historicalShiftEvents,
  reportStartDate,
}: ReportsTimelineProps) {
  // We plot hours from 06:00 to 24:00 (18 hours)
  const HOURS = Array.from({ length: 19 }, (_, i) => i + 6);

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

  return (
    <div className={`mt-5 overflow-hidden rounded-2xl border ${isDark ? 'border-white/20 bg-black/40 text-white' : 'border-slate-200/60 bg-white text-black'}`}>
      <div className="p-4 border-b border-white/10 flex justify-between items-center">
        <h3 className="font-extrabold flex items-center gap-2">
          ⏳ Daily Timeline
        </h3>
        <div className="text-xs opacity-75">
          Shows precise check-in and check-out periods for {reportStartDate}
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* Header row with hours */}
          <div className={`flex border-b text-xs font-bold ${isDark ? 'border-white/20 bg-black/80' : 'border-slate-200 bg-slate-100'}`}>
            <div className="w-48 shrink-0 p-3 border-r border-white/10">Agent</div>
            <div className="flex-1 relative h-10 flex items-center">
              {HOURS.map(hour => (
                <div key={hour} className="absolute h-full border-l border-white/10 px-1 pt-1 opacity-50" style={{ left: `${((hour - 6) / 18) * 100}%` }}>
                  {hour.toString().padStart(2, '0')}:00
                </div>
              ))}
            </div>
          </div>

          {/* Rows for each employee */}
          <div className="divide-y divide-white/5">
            {activeEmployees.map(emp => {
              const empK1 = normKey(emp.id);
              const empK2 = normKey(emp.username);
              const empK3 = normKey(emp.name);

              // Get all events for this employee on this day
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

              return (
                <div key={emp.id} className="flex relative hover:bg-white/5 transition-colors group">
                  <div className="w-48 shrink-0 p-3 border-r border-white/10 flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0">
                      {emp.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-bold text-sm truncate">{emp.name}</span>
                  </div>
                  <div className="flex-1 relative min-h-[48px]">
                    {/* Background Grid Lines */}
                    {HOURS.map(hour => (
                      <div key={hour} className="absolute h-full border-l border-white/5 pointer-events-none" style={{ left: `${((hour - 6) / 18) * 100}%` }} />
                    ))}

                    {/* Time Blocks */}
                    {blocks.map((block, idx) => {
                      const left = calculateLeftPercent(block.start);
                      const right = calculateLeftPercent(block.end);
                      const width = Math.max(0.5, right - left);
                      
                      return (
                        <div 
                          key={idx}
                          className="absolute top-2 bottom-2 rounded bg-emerald-500/20 border border-emerald-500 shadow-sm flex items-center px-2 group-hover:bg-emerald-500/40 transition-colors cursor-pointer overflow-hidden"
                          style={{ left: `${left}%`, width: `${width}%` }}
                          title={`${block.start} - ${block.end} (${block.label || 'Tracked'})`}
                        >
                          {width > 5 && (
                            <span className="text-[10px] font-bold text-emerald-700 dark:text-emerald-300 truncate">
                              {block.start} - {block.end}
                            </span>
                          )}
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
    </div>
  );
}
