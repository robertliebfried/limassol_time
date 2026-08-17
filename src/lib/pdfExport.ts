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

export function downloadPdfReport({
  employees,
  logs,
  historicalShiftEvents = [],
  startDate,
  endDate,
  weekLabel,
  isSingleDay = false,
}: GeneratePdfOptions) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4',
  });

  const activeEmps = employees.filter(e => e.role !== 'admin' && e.name !== 'Admin' && !e.isDeleted);
  
  // Normalize key helper
  const normKey = (str?: string) => {
    if (!str) return '';
    return str.toLowerCase().trim().replace(/^emp-fs-/, '').replace(/^emp-/, '').replace(/[\s-_.]/g, '');
  };

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

  // Calculate totals
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
    } else {
      absentCount++;
      arrival = '-';
      departure = '-';
    }

    if (!arrival) arrival = '09:00 AM';
    if (!departure && status === 'Present') departure = '05:30 PM';

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
  doc.text('Attendance & Shift Report', 40, 60);

  // Period on the right
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225);
  doc.text(`Period: ${weekLabel || `${startDate} to ${endDate}`}`, 555, 42, { align: 'right' });
  doc.text(`Exported: ${new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })}`, 555, 58, { align: 'right' });

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
  drawCard(430, 'Active Team Size', `${activeEmps.length} Agents`, 'Office & Remote', [248, 250, 252], [226, 232, 240]);

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
    ? `LimassolTime_Report_${startDate}.pdf`
    : `LimassolTime_Report_${startDate}_to_${endDate}.pdf`;

  doc.save(filename);
}
