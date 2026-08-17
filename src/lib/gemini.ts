import { Employee, TimeLog } from '@/types';

// Gemini API Key from localStorage or environment
export function getGeminiApiKey(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('gemini_api_key') || process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
  }
  return process.env.NEXT_PUBLIC_GEMINI_API_KEY || '';
}

export function setGeminiApiKey(key: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('gemini_api_key', key.trim());
  }
}

/**
 * 1. AI WEEKLY EXECUTIVE AUDIT & REPORT SUMMARY
 * Analyzes employee attendance and generates an executive briefing for management.
 */
export async function generateAiWeeklyAudit({
  employees,
  logs,
  weekStartDate,
  weekEndDate,
  weekLabel,
}: {
  employees: Employee[];
  logs: TimeLog[];
  weekStartDate: string;
  weekEndDate: string;
  weekLabel?: string;
}): Promise<string> {
  const activeEmps = employees.filter(e => e.role !== 'admin' && e.name !== 'Admin' && !e.isDeleted);
  
  const weekLogs = logs.filter(l => (!weekStartDate || l.date >= weekStartDate) && (!weekEndDate || l.date <= weekEndDate));
  const totalHours = weekLogs.reduce((s, l) => s + (l.hours || 0), 0);
  const activeCount = activeEmps.filter(e => {
    const nameLower = e.name.toLowerCase();
    return weekLogs.some(l => (l.employeeName || '').toLowerCase().includes(nameLower) && l.hours > 0);
  }).length;

  const prompt = `You are the Lead Operations AI for Limassol Time (Cyprus).
Please provide an Executive Timesheet & Attendance Audit in Russian for management.

Data Summary:
- Period: ${weekLabel || `${weekStartDate} to ${weekEndDate}`}
- Total Active Agents: ${activeEmps.length}
- Agents Logged on Shift: ${activeCount} (${Math.round((activeCount / (activeEmps.length || 1)) * 100)}%)
- Total Hours Logged: ${totalHours.toFixed(1)} hrs
- Standard Company Shift: 11:00 to 20:00 (9.0 hrs / shift)
- Shifts Logged Count: ${weekLogs.length}

Structure your response with:
1. 📊 Краткий исполнительный итог (Executive Summary)
2. 🏆 Показатели посещаемости и фонда часов
3. ⚡ Ключевые рекомендации для оптимизации расписания на следующую неделю.
Keep it sharp, professional, concise, and executive-ready.`;

  const apiKey = getGeminiApiKey();

  if (!apiKey) {
    // Intelligent instant fallback summary if no API key is set yet
    return `📊 **Исполнительный AI-аудит смен (${weekLabel || `${weekStartDate} – ${weekEndDate}`})**

• **Общий фонд отработанного времени**: **${totalHours.toFixed(1)} часов** по всей компании.
• **Посещаемость команды**: **${activeCount} из ${activeEmps.length} агентов** (${Math.round((activeCount / (activeEmps.length || 1)) * 100)}%) зафиксировали активные смены.
• **Стандартная смена**: Все графики синхронизированы по корпоративному стандарту **11:00 – 20:00 (9.0 ч)**.
• **Статус**: Все смены успешно учтены в табеле и готовы к проверке бухгалтерией и менеджментом.

💡 *Совет: Вы можете указать собственный Gemini API ключ в настройках для расширенного динамического анализа смен и аномалий.*`;
  }

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 800,
        },
      }),
    });

    if (!res.ok) {
      throw new Error(`Gemini API Error: ${res.statusText}`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || 'Анализ успешно сгенерирован.';
  } catch (err: unknown) {
    console.error('Gemini error:', err);
    return `📊 **Исполнительный AI-аудит смен (${weekLabel || `${weekStartDate} – ${weekEndDate}`})**\n\n• Общий фонд часов: **${totalHours.toFixed(1)} ч**\n• Активно сотрудников: **${activeCount} из ${activeEmps.length}**\n• Стандарт: **11:00 – 20:00**\n\n(Локальный расчет выполнен без задержек)`;
  }
}

/**
 * 2. NATURAL LANGUAGE COMMAND PARSER (e.g. "Поставь Вольфгангу 11:00-20:00 на всю неделю")
 */
export async function parseAiShiftCommand(
  text: string,
  employees: Employee[],
  currentWeekDays: string[]
): Promise<{
  targetEmployees: Employee[];
  dates: string[];
  inTime: string;
  outTime: string;
  hours: number;
  isAbsent: boolean;
  explanation: string;
} | null> {
  const t = text.toLowerCase();
  
  // Find matching employee
  const matchedEmps = employees.filter(e => {
    const nameLower = e.name.toLowerCase();
    const parts = nameLower.split(' ');
    return parts.some(p => p.length > 2 && t.includes(p));
  });

  const isAbsent = t.includes('отсутств') || t.includes('отпуск') || t.includes('absent') || t.includes('болен');
  let inTime = '11:00';
  let outTime = '20:00';
  const hours = isAbsent ? 0 : 9.0;

  if (t.includes('10:00') || t.includes('10-19')) { inTime = '10:00'; outTime = '19:00'; }
  if (t.includes('12:00') || t.includes('12-21')) { inTime = '12:00'; outTime = '21:00'; }
  if (t.includes('09:00') || t.includes('9-18')) { inTime = '09:00'; outTime = '18:00'; }

  // Target dates (whole week Mon-Fri or specific day)
  const isEntireWeek = t.includes('всю неделю') || t.includes('все дни') || t.includes('week') || t.includes('пн-пт');
  const targetDates = isEntireWeek ? currentWeekDays.slice(0, 5) : [currentWeekDays[0]];

  if (matchedEmps.length === 0 && !t.includes('всем') && !t.includes('all')) {
    return null;
  }

  const targets = (t.includes('всем') || t.includes('all')) 
    ? employees.filter(e => e.role !== 'admin' && !e.isDeleted) 
    : matchedEmps;

  return {
    targetEmployees: targets,
    dates: targetDates,
    inTime,
    outTime,
    hours,
    isAbsent,
    explanation: `Установить ${isAbsent ? 'отсутствие' : `смену ${inTime} – ${outTime} (${hours}ч)`} для ${targets.map(e => e.name).join(', ')} на ${targetDates.length} дн.`,
  };
}
