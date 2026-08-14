import React, { useEffect, useState } from 'react';
import { FirestoreShiftEvent, fetchFirestoreShiftEventsForEmployee } from '@/lib/firebase';

import { Employee } from '@/app/[[...slug]]/ClientPage';

interface AgentProfileViewProps {
  username: string;
  employees: Employee[];
  isDark: boolean;
  onBack: () => void;
}

export default function AgentProfileView({ username, employees, isDark, onBack }: AgentProfileViewProps) {
  const [events, setEvents] = useState<FirestoreShiftEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const emp = employees.find(e => (e.username || e.name.toLowerCase().replace(/\s+/g, '')) === username);

  useEffect(() => {
    if (emp) {
      setLoading(true);
      fetchFirestoreShiftEventsForEmployee(emp.id).then(data => {
        setEvents(data.sort((a, b) => b.timestamp - a.timestamp));
        setLoading(false);
      });
    }
  }, [emp]);

  if (!emp) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Agent Not Found</h2>
        <button onClick={onBack} className="text-blue-500 hover:underline">← Back to Directory</button>
      </div>
    );
  }

  // Parse top apps
  let topApps: {app: string, time: number}[] = [];
  try {
    if (emp.awTopAppsJson) {
      topApps = JSON.parse(emp.awTopAppsJson);
    }
  } catch(e) {}

  // Format seconds to h m s
  const formatSecs = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  // Group events by date for the calendar list
  const eventsByDate = events.reduce((acc, ev) => {
    if (!acc[ev.date]) acc[ev.date] = [];
    acc[ev.date].push(ev);
    return acc;
  }, {} as Record<string, FirestoreShiftEvent[]>);

  const isOnline = emp.status === 'checked_in';

  return (
    <div className={`max-w-5xl mx-auto space-y-6 ${isDark ? 'text-white' : 'text-slate-900'}`}>
      
      {/* Navigation */}
      <div className="flex items-center gap-4">
        <button onClick={onBack} className={`p-2 rounded-xl border transition ${isDark ? 'border-white/20 hover:bg-white/10' : 'border-slate-300 hover:bg-slate-100'}`}>
          ← Back
        </button>
        <h1 className="text-3xl font-black">{emp.name}</h1>
        <div className={`px-3 py-1 text-sm font-bold rounded-full ${isOnline ? 'bg-emerald-500/20 text-emerald-500' : 'bg-slate-500/20 text-slate-500'}`}>
          {isOnline ? '🟢 Online' : '⚪ Offline'}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column: Live Status */}
        <div className="md:col-span-1 space-y-6">
          <div className={`p-6 rounded-3xl border shadow-sm ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
            <h2 className="text-sm font-bold uppercase tracking-widest opacity-50 mb-4">Live Activity</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-xs opacity-60">Current Window</p>
                <p className="font-bold text-sm truncate">{emp.awCurrentTitle || 'N/A'}</p>
                <p className="text-xs opacity-50">{emp.awCurrentApp || ''}</p>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className={`p-3 rounded-2xl ${isDark ? 'bg-black/30' : 'bg-slate-50'}`}>
                  <p className="text-xs opacity-60">Active Today</p>
                  <p className="text-xl font-black text-emerald-500">{formatSecs(emp.awActiveSecondsToday || 0)}</p>
                </div>
                <div className={`p-3 rounded-2xl ${isDark ? 'bg-black/30' : 'bg-slate-50'}`}>
                  <p className="text-xs opacity-60">AFK Today</p>
                  <p className="text-xl font-black text-amber-500">{formatSecs(emp.awAfkSecondsToday || 0)}</p>
                </div>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-3xl border shadow-sm ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
            <h2 className="text-sm font-bold uppercase tracking-widest opacity-50 mb-4">Top Apps Today</h2>
            <div className="space-y-3">
              {topApps.length > 0 ? topApps.slice(0, 5).map((app, i) => (
                <div key={i} className="flex justify-between items-center text-sm">
                  <span className="truncate font-semibold max-w-[150px]" title={app.app}>{app.app.replace('.exe', '')}</span>
                  <span className="font-mono opacity-80">{formatSecs(app.time)}</span>
                </div>
              )) : (
                <p className="text-sm opacity-50 text-center py-4">No activity data for today</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Calendar / History */}
        <div className={`md:col-span-2 p-6 rounded-3xl border shadow-sm ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
          <h2 className="text-sm font-bold uppercase tracking-widest opacity-50 mb-6">Shift History</h2>
          
          {loading ? (
            <div className="text-center py-10 opacity-50 animate-pulse">Loading history...</div>
          ) : Object.keys(eventsByDate).length === 0 ? (
            <div className="text-center py-10 opacity-50">No shift history found.</div>
          ) : (
            <div className="space-y-6">
              {Object.entries(eventsByDate).slice(0, 10).map(([date, dayEvents]) => (
                <div key={date} className={`p-4 rounded-2xl border ${isDark ? 'border-white/10 bg-black/20' : 'border-slate-100 bg-slate-50'}`}>
                  <h3 className="font-bold mb-3">{new Date(date + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}</h3>
                  <div className="space-y-2">
                    {dayEvents.map(ev => (
                      <div key={ev.id} className="flex items-center gap-3 text-sm">
                        <span className="font-mono opacity-60 w-20">{ev.time}</span>
                        <span className="font-semibold">{ev.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
