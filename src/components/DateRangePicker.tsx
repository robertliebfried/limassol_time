import React, { useState } from 'react';

interface DateRangePickerProps {
  isDark: boolean;
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
  onChange: (start: string, end: string) => void;
  onPresetSelect?: (preset: 'this_week' | 'last_week' | 'this_month' | 'last_month') => void;
}

export function DateRangePicker({
  isDark,
  startDate,
  endDate,
  onChange,
  onPresetSelect,
}: DateRangePickerProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(() => {
    if (startDate) {
      const parts = startDate.split('-');
      if (parts.length === 3) {
        return new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
      }
    }
    return new Date();
  });

  const [hoverDate, setHoverDate] = useState<string | null>(null);
  const [selectingStart, setSelectingStart] = useState<boolean>(false);

  const prevMonth = () => {
    const d = new Date(currentMonth);
    d.setMonth(d.getMonth() - 1);
    setCurrentMonth(d);
  };

  const nextMonth = () => {
    const d = new Date(currentMonth);
    d.setMonth(d.getMonth() + 1);
    setCurrentMonth(d);
  };

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const daysInMonth = lastDayOfMonth.getDate();

  let startWeekday = firstDayOfMonth.getDay() - 1; // 0 = Mon, 6 = Sun
  if (startWeekday < 0) startWeekday = 6;

  const calendarDays: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

  // Previous month padding days
  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = startWeekday - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i;
    const pDate = new Date(year, month - 1, d);
    const mm = String(pDate.getMonth() + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    calendarDays.push({
      dateStr: `${pDate.getFullYear()}-${mm}-${dd}`,
      dayNum: d,
      isCurrentMonth: false,
    });
  }

  // Current month days
  for (let i = 1; i <= daysInMonth; i++) {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(i).padStart(2, '0');
    calendarDays.push({
      dateStr: `${year}-${mm}-${dd}`,
      dayNum: i,
      isCurrentMonth: true,
    });
  }

  // Next month padding days to round up to 35 or 42 cells
  const remaining = 35 - calendarDays.length > 0 ? 35 - calendarDays.length : 42 - calendarDays.length;
  for (let i = 1; i <= remaining; i++) {
    const nextDate = new Date(year, month + 1, i);
    const mm = String(nextDate.getMonth() + 1).padStart(2, '0');
    const dd = String(i).padStart(2, '0');
    calendarDays.push({
      dateStr: `${nextDate.getFullYear()}-${mm}-${dd}`,
      dayNum: i,
      isCurrentMonth: false,
    });
  }

  const handleDayClick = (dateStr: string) => {
    if (!selectingStart) {
      // First click: sets start date
      setSelectingStart(true);
      onChange(dateStr, dateStr);
    } else {
      // Second click: sets end date
      setSelectingStart(false);
      setHoverDate(null);
      if (dateStr < startDate) {
        // If clicked earlier date, set it as new start
        onChange(dateStr, dateStr);
        setSelectingStart(true);
      } else {
        onChange(startDate, dateStr);
      }
    }
  };

  const effectiveEnd = selectingStart && hoverDate && hoverDate >= startDate ? hoverDate : endDate;

  // Calculate day count
  let dayCount = 1;
  if (startDate && endDate) {
    const s = new Date(startDate).getTime();
    const e = new Date(endDate).getTime();
    dayCount = Math.max(1, Math.round((e - s) / (1000 * 60 * 60 * 24)) + 1);
  }

  return (
    <div className={`rounded-3xl border p-4 shadow-sm select-none ${isDark ? 'border-white/10 bg-[#16363d]/80 text-white' : 'border-slate-200 bg-white text-black'}`}>
      
      {/* Quick Presets Grid */}
      <div className="mb-4">
        <div className="text-[0.65rem] font-extrabold uppercase tracking-widest text-slate-400 mb-2">
          ⚡ Quick Presets
        </div>
        <div className="grid grid-cols-2 gap-1.5 text-xs font-bold">
          <button
            onClick={() => onPresetSelect && onPresetSelect('this_week')}
            className={`rounded-xl px-2.5 py-1.5 text-left border transition text-[0.7rem] ${
              isDark ? 'border-white/10 bg-white/5 hover:bg-white/15' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            📌 This Week
          </button>
          <button
            onClick={() => onPresetSelect && onPresetSelect('last_week')}
            className={`rounded-xl px-2.5 py-1.5 text-left border transition text-[0.7rem] ${
              isDark ? 'border-white/10 bg-white/5 hover:bg-white/15' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            ⏪ Last Week
          </button>
          <button
            onClick={() => onPresetSelect && onPresetSelect('this_month')}
            className={`rounded-xl px-2.5 py-1.5 text-left border transition text-[0.7rem] ${
              isDark ? 'border-white/10 bg-white/5 hover:bg-white/15' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            📅 This Month
          </button>
          <button
            onClick={() => onPresetSelect && onPresetSelect('last_month')}
            className={`rounded-xl px-2.5 py-1.5 text-left border transition text-[0.7rem] ${
              isDark ? 'border-white/10 bg-white/5 hover:bg-white/15' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
            }`}
          >
            ⏮️ Last Month
          </button>
        </div>
      </div>

      {/* Selected Range Display Banner */}
      <div className={`p-2.5 mb-3 rounded-2xl border flex items-center justify-between text-xs ${
        isDark ? 'border-emerald-500/30 bg-emerald-950/40 text-emerald-300' : 'border-emerald-200 bg-emerald-50 text-emerald-900'
      }`}>
        <div className="flex flex-col min-w-0">
          <span className="text-[0.65rem] font-extrabold uppercase opacity-75">
            {selectingStart ? '👉 Click End Date' : 'Active Date Range'}
          </span>
          <span className="font-mono font-bold text-xs truncate">
            {startDate} {startDate !== endDate ? `→ ${endDate}` : '(1 day)'}
          </span>
        </div>
        <span className="font-black text-[0.65rem] px-2 py-0.5 rounded-full bg-emerald-500 text-black shadow-sm flex-shrink-0">
          {dayCount} {dayCount === 1 ? 'day' : 'days'}
        </span>
      </div>

      {/* Interactive Month Range Calendar */}
      <div>
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={prevMonth}
            className={`p-1.5 rounded-xl border text-xs font-bold transition ${
              isDark ? 'border-white/10 hover:bg-white/10 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-600'
            }`}
          >
            ◀
          </button>
          <span className="font-serif font-black text-xs">
            {currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
          </span>
          <button
            onClick={nextMonth}
            className={`p-1.5 rounded-xl border text-xs font-bold transition ${
              isDark ? 'border-white/10 hover:bg-white/10 text-slate-300' : 'border-slate-200 hover:bg-slate-100 text-slate-600'
            }`}
          >
            ▶
          </button>
        </div>

        {/* Weekday Headers */}
        <div className="grid grid-cols-7 gap-1 text-center font-black text-[0.6rem] uppercase opacity-50 mb-1">
          <div>Mo</div>
          <div>Tu</div>
          <div>We</div>
          <div>Th</div>
          <div>Fr</div>
          <div>Sa</div>
          <div>Su</div>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 gap-y-1">
          {calendarDays.map((day, idx) => {
            const isStart = day.dateStr === startDate;
            const isEnd = day.dateStr === effectiveEnd;
            const inRange = startDate && effectiveEnd && day.dateStr >= startDate && day.dateStr <= effectiveEnd;
            const isToday = day.dateStr === new Date().toISOString().split('T')[0];

            let cellBg = '';
            let textColor = isDark ? 'text-slate-200' : 'text-slate-800';
            let shape = 'rounded-lg';

            if (!day.isCurrentMonth) {
              textColor = isDark ? 'text-slate-600 opacity-40' : 'text-slate-400 opacity-50';
            }

            if (isStart && isEnd) {
              cellBg = 'bg-emerald-600 text-white font-black shadow';
              shape = 'rounded-xl';
              textColor = 'text-white';
            } else if (isStart) {
              cellBg = 'bg-emerald-600 text-white font-black shadow';
              shape = 'rounded-l-xl';
              textColor = 'text-white';
            } else if (isEnd) {
              cellBg = 'bg-emerald-600 text-white font-black shadow';
              shape = 'rounded-r-xl';
              textColor = 'text-white';
            } else if (inRange) {
              cellBg = isDark ? 'bg-emerald-500/20 text-emerald-300' : 'bg-emerald-100 text-emerald-900';
              shape = 'rounded-none';
            } else {
              cellBg = isDark ? 'hover:bg-white/10' : 'hover:bg-slate-100';
            }

            return (
              <button
                key={idx}
                type="button"
                onClick={() => handleDayClick(day.dateStr)}
                onMouseEnter={() => selectingStart && setHoverDate(day.dateStr)}
                className={`h-7 w-full flex items-center justify-center text-xs transition-all relative ${cellBg} ${shape} ${textColor} ${
                  isToday && !inRange ? 'ring-1 ring-emerald-500 font-black' : ''
                }`}
                title={day.dateStr}
              >
                <span>{day.dayNum}</span>
                {isToday && !isStart && !isEnd && (
                  <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-emerald-500"></span>
                )}
              </button>
            );
          })}
        </div>
      </div>

    </div>
  );
}
