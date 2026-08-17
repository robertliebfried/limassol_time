import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Employee, TimeLog } from '@/types';
import { FirestoreShiftEvent } from './firebase';

interface GeneratePdfOptions {
  employees: Employee[];
  logs: TimeLog[];
  historicalShiftEvents?: FirestoreShiftEvent[];
  startDate: string;
  endDate: string;
  weekLabel?: string;
  isSingleDay?: boolean;
}

// Normalize key helper
function normKey(str?: string) {
  if (!str) return '';
  return str.toLowerCase().trim().replace(/^emp-fs-/, '').replace(/^emp-/, '').replace(/[\s-_.]/g, '');
}

/**
 * 1. WEEKLY COMPREHENSIVE PDF REPORT (Landscape)
 * Generates an executive-ready Monday-Sunday weekly matrix report with totals per agent.
 */
export function downloadWeeklyPdfReport({
  employees,
  logs,
  startDate,
  endDate,
  weekLabel,
}: {
  employees: Employee[];
  logs: TimeLog[];
  startDate: string;
  endDate: string;
  weekLabel?: string;
}) {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'pt',
    format: 'a4', // 841.89 x 595.28 pt
  });

  const activeEmps = employees.filter(e => e.role !== 'admin' && e.name !== 'Admin' && !e.isDeleted);
  
  // Calculate 7 dates in the week
  const startD = new Date(startDate);
  const weekDates: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(startD);
    d.setDate(startD.getDate() + i);
    weekDates.push(d);
  }

  // Group logs by employee and date
  const logsMap: Record<string, Record<string, number>> = {};
  logs.forEach(l => {
    if (l.hours > 0) {
      const k1 = normKey(l.employeeId);
      const k2 = normKey(l.employeeName);
      [k1, k2].filter(Boolean).forEach(k => {
        if (!logsMap[k]) logsMap[k] = {};
        logsMap[k][l.date] = (logsMap[k][l.date] || 0) + l.hours;
      });
    }
  });

  let grandTotalHours = 0;
  let totalActiveShifts = 0;
  const dayColumnTotals = [0, 0, 0, 0, 0, 0, 0];

  const tableRows = activeEmps.map((emp, idx) => {
    const k1 = normKey(emp.id);
    const k2 = normKey(emp.username);
    const k3 = normKey(emp.name);

    let empWeeklyTotal = 0;
    const dayCols = weekDates.map((dateObj, dayIdx) => {
      const iso = dateObj.toISOString().split('T')[0];
      const hrs = logsMap[k1]?.[iso] || logsMap[k2]?.[iso] || logsMap[k3]?.[iso] || 0;
      if (hrs > 0) {
        empWeeklyTotal += hrs;
        grandTotalHours += hrs;
        totalActiveShifts += 1;
        dayColumnTotals[dayIdx] += hrs;
        return `${hrs.toFixed(1)}h`;
      }
      return dayIdx >= 5 ? '-' : '0.0h';
    });

    const status = empWeeklyTotal > 0 ? 'Active' : 'Out of Office';

    return [
      idx + 1,
      emp.name,
      emp.team || 'General',
      emp.role || 'Agent',
      ...dayCols,
      `${empWeeklyTotal.toFixed(1)} hrs`,
      status,
    ];
  });

  // Header Banner
  doc.setFillColor(19, 49, 55); // #133137 dark teal
  doc.rect(0, 0, 841.89, 85, 'F');

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('LIMASSOL TIME', 40, 38);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(167, 243, 208); // emerald-200
  doc.text('Official Weekly Employee Timesheet & Attendance Report', 40, 56);

  // Period on the right
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text(`Week: ${weekLabel || `${startDate} to ${endDate}`}`, 800, 36, { align: 'right' });
  doc.setFontSize(8.5);
  doc.setTextColor(203, 213, 225);
  doc.text(`Standard Shift: 11:00 AM - 08:00 PM (11:00-20:00)`, 800, 52, { align: 'right' });
  doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 800, 66, { align: 'right' });

  // Top KPI Cards Strip
  const cardY = 98;
  const cardW = 175;
  const cardH = 46;

  const drawKpiCard = (x: number, label: string, val: string, sub: string, bg: [number, number, number], border: [number, number, number]) => {
    doc.setFillColor(bg[0], bg[1], bg[2]);
    doc.setDrawColor(border[0], border[1], border[2]);
    doc.roundedRect(x, cardY, cardW, cardH, 6, 6, 'FD');

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(label.toUpperCase(), x + 10, cardY + 13);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(val, x + 10, cardY + 29);

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(sub, x + 10, cardY + 40);
  };

  drawKpiCard(40, 'Total Hours Logged', `${grandTotalHours.toFixed(1)} hrs`, 'Across all teams this week', [240, 253, 244], [187, 247, 208]);
  drawKpiCard(235, 'Completed Shifts', `${totalActiveShifts} Shifts`, `${(grandTotalHours / (totalActiveShifts || 1)).toFixed(1)} hrs average shift`, [239, 246, 255], [191, 219, 254]);
  drawKpiCard(430, 'Active Team Roster', `${activeEmps.length} Agents`, `${activeEmps.filter(e => {
    const k = normKey(e.id || e.username || e.name);
    return Object.values(logsMap[k] || {}).some(h => h > 0);
  }).length} active this week`, [245, 243, 255], [221, 214, 254]);
  drawKpiCard(625, 'Standard Work Week', 'Mon – Sun', '11:00 to 20:00 daily', [254, 243, 199], [253, 230, 138]);

  // Headers for days
  const dayHeaders = weekDates.map(d => `${d.toLocaleDateString('en-US', { weekday: 'short' })}\n${d.getDate()} ${d.toLocaleDateString('en-US', { month: 'short' })}`);

  // Main Table
  autoTable(doc, {
    startY: 155,
    head: [['#', 'Employee Name', 'Team', 'Role', ...dayHeaders, 'Total (hrs)', 'Status']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [19, 49, 55],
      textColor: [255, 255, 255],
      fontSize: 8,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle',
    },
    styles: {
      fontSize: 7.5,
      cellPadding: 4,
      valign: 'middle',
      textColor: [30, 41, 59],
      lineColor: [226, 232, 240],
      lineWidth: 0.5,
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 20, halign: 'center' },
      1: { cellWidth: 95, fontStyle: 'bold' },
      2: { cellWidth: 55, halign: 'center' },
      3: { cellWidth: 65 },
      4: { cellWidth: 50, halign: 'center', fontStyle: 'bold' },
      5: { cellWidth: 50, halign: 'center', fontStyle: 'bold' },
      6: { cellWidth: 50, halign: 'center', fontStyle: 'bold' },
      7: { cellWidth: 50, halign: 'center', fontStyle: 'bold' },
      8: { cellWidth: 50, halign: 'center', fontStyle: 'bold' },
      9: { cellWidth: 45, halign: 'center', fontStyle: 'bold', textColor: [148, 163, 184] },
      10: { cellWidth: 45, halign: 'center', fontStyle: 'bold', textColor: [148, 163, 184] },
      11: { cellWidth: 65, halign: 'right', fontStyle: 'bold', fillColor: [236, 253, 245], textColor: [5, 150, 105] },
      12: { cellWidth: 65, halign: 'center', fontStyle: 'bold' },
    },
    didParseCell: function(data) {
      if (data.column.index === 12 && data.section === 'body') {
        const val = data.cell.raw;
        if (val === 'Active') {
          data.cell.styles.textColor = [5, 150, 105]; // emerald-600
        } else {
          data.cell.styles.textColor = [217, 119, 6]; // amber-600
        }
      }
    },
    margin: { left: 40, right: 40, bottom: 40 },
  });

  // Add summary footer on bottom
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184);
    doc.text(`Limassol Time Management System • Week Report (${startDate} to ${endDate})`, 40, 580);
    doc.text(`Page ${i} of ${pageCount}`, 800, 580, { align: 'right' });
  }

  const filename = `LimassolTime_Weekly_Report_${startDate}_to_${endDate}.pdf`;
  doc.save(filename);
}

/**
 * 2. DAILY OR CUSTOM RANGE DETAILED PDF REPORT (Portrait)
 */
export function downloadPdfReport({
  employees,
  logs,
  historicalShiftEvents = [],
  startDate,
  endDate,
  weekLabel,
  isSingleDay = false,
}: GeneratePdfOptions) {
  // If date range is a full 7-day week, route to the weekly landscape report
  const isWeekRange = startDate && endDate && startDate !== endDate;
  if (isWeekRange && !isSingleDay) {
    downloadWeeklyPdfReport({
      employees,
      logs,
      startDate,
      endDate,
      weekLabel,
    });
    return;
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4', // 595.28 x 841.89 pt
  });

  const activeEmps = employees.filter(e => e.role !== 'admin' && e.name !== 'Admin' && !e.isDeleted);
  
  // Filter logs in range
  const filteredLogs = logs.filter(l => 
    (!startDate || l.date >= startDate) &&
    (!endDate || l.date <= endDate)
  );

  // Group logs by employee
  const empLogMap: Record<string, { totalHours: number; daysCount: number; shiftTimes: string[] }> = {};
  filteredLogs.forEach(l => {
    if (l.hours > 0) {
      const k1 = normKey(l.employeeId);
      const k2 = normKey(l.employeeName);
      [k1, k2].filter(Boolean).forEach(k => {
        if (!empLogMap[k]) empLogMap[k] = { totalHours: 0, daysCount: 0, shiftTimes: [] };
        empLogMap[k].totalHours += l.hours;
        empLogMap[k].daysCount += 1;
        if (l.timestamp) empLogMap[k].shiftTimes.push(l.timestamp);
      });
    }
  });

  let totalHours = 0;
  let presentCount = 0;
  let absentCount = 0;

  const rows = activeEmps.map((emp, idx) => {
    const k1 = normKey(emp.id);
    const k2 = normKey(emp.username);
    const k3 = normKey(emp.name);
    const data = empLogMap[k1] || empLogMap[k2] || empLogMap[k3];

    // Events for single day if available
    const empEvents = historicalShiftEvents.filter(ev => {
      const evK = normKey(ev.employeeId);
      return evK === k1 || evK === k2 || evK === k3;
    }).sort((a, b) => a.timestamp - b.timestamp);

    const inEvents = empEvents.filter(ev => ev.type === 'clock_in' || ev.type === 'IN');
    const outEvents = empEvents.filter(ev => ev.type === 'clock_out' || ev.type === 'OUT');
    
    let arrival = inEvents.length > 0 ? inEvents[0].time : '';
    let departure = outEvents.length > 0 ? outEvents[outEvents.length - 1].time : '';
    const hours = data ? data.totalHours : 0;
    let status = 'Out of Office';

    if (data && data.totalHours > 0) {
      status = 'Present';
      presentCount++;
      totalHours += hours;
      if (!arrival && data.shiftTimes.length > 0 && data.shiftTimes[0].includes(' - ')) {
        const [inT, outT] = data.shiftTimes[0].split(' - ');
        arrival = inT.trim();
        departure = outT.trim();
      }
      if (!arrival) arrival = '11:00 AM';
      if (!departure) departure = '08:00 PM';
    } else {
      absentCount++;
      arrival = '-';
      departure = '-';
    }

    return [
      idx + 1,
      emp.name,
      emp.role || 'Team Member',
      emp.team || 'Standard',
      arrival,
      departure,
      status === 'Present' ? `${hours.toFixed(1)} hrs` : '0.0 hrs',
      status
    ];
  });

  const attendancePercent = activeEmps.length > 0 ? Math.round((presentCount / activeEmps.length) * 100) : 0;

  // Header Banner
  doc.setFillColor(19, 49, 55); // #133137 dark teal
  doc.rect(0, 0, 595.28, 90, 'F');

  // Brand Name & Title
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('LIMASSOL TIME', 40, 42);

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(167, 243, 208); // emerald-200
  doc.text('Daily Attendance & Shift Timesheet Report', 40, 60);

  // Period on the right
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text(`Date: ${weekLabel || (startDate === endDate ? startDate : `${startDate} to ${endDate}`)}`, 555, 42, { align: 'right' });
  doc.text(`Standard Shift: 11:00 - 20:00`, 555, 56, { align: 'right' });
  doc.text(`Exported: ${new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`, 555, 70, { align: 'right' });

  // Metric Cards
  const cardY = 105;
  const cardWidth = 120;
  const cardHeight = 50;

  const drawCard = (x: number, title: string, value: string, sub: string, fillCol: [number, number, number], borderCol: [number, number, number]) => {
    doc.setFillColor(fillCol[0], fillCol[1], fillCol[2]);
    doc.setDrawColor(borderCol[0], borderCol[1], borderCol[2]);
    doc.roundedRect(x, cardY, cardWidth, cardHeight, 6, 6, 'FD');

    doc.setTextColor(100, 116, 139);
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text(title.toUpperCase(), x + 10, cardY + 14);

    doc.setTextColor(15, 23, 42);
    doc.setFontSize(13);
    doc.setFont('helvetica', 'bold');
    doc.text(value, x + 10, cardY + 32);

    doc.setTextColor(148, 163, 184);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(sub, x + 10, cardY + 44);
  };

  drawCard(40, 'Agents at Work', `${presentCount} / ${activeEmps.length}`, `${attendancePercent}% Present`, [240, 253, 244], [187, 247, 208]);
  drawCard(170, 'Out of Office', `${absentCount}`, `${100 - attendancePercent}% Absent`, [254, 243, 199], [253, 230, 138]);
  drawCard(300, 'Total Work Hours', `${totalHours.toFixed(1)} hrs`, `${(totalHours / (presentCount || 1)).toFixed(1)} avg/agent`, [239, 246, 255], [191, 219, 254]);
  drawCard(430, 'Active Team Size', `${activeEmps.length} Agents`, 'Standard 11:00-20:00', [248, 250, 252], [226, 232, 240]);

  // Main Table
  autoTable(doc, {
    startY: 170,
    head: [['#', 'Agent Name', 'Role', 'Team', 'Arrival', 'Departure', 'Worked', 'Status']],
    body: rows,
    theme: 'striped',
    headStyles: {
      fillColor: [19, 49, 55],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
      halign: 'left',
    },
    styles: {
      fontSize: 8,
      cellPadding: 5,
      valign: 'middle',
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    columnStyles: {
      0: { cellWidth: 24, halign: 'center' },
      1: { cellWidth: 110, fontStyle: 'bold' },
      2: { cellWidth: 90 },
      3: { cellWidth: 60 },
      4: { cellWidth: 60 },
      5: { cellWidth: 60 },
      6: { cellWidth: 60, fontStyle: 'bold', halign: 'right' },
      7: { cellWidth: 65, halign: 'center' },
    },
    didParseCell: function(data) {
      if (data.column.index === 7 && data.section === 'body') {
        const val = data.cell.raw;
        if (val === 'Present') {
          data.cell.styles.textColor = [5, 150, 105]; // emerald-600
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [217, 119, 6]; // amber-600
          data.cell.styles.fontStyle = 'bold';
        }
      }
    },
    margin: { left: 40, right: 40 },
  });

  const filename = isSingleDay 
    ? `LimassolTime_Daily_Report_${startDate}.pdf`
    : `LimassolTime_Report_${startDate}_to_${endDate}.pdf`;

  doc.save(filename);
}
