import { Employee, TimeLog } from '@/types';

interface CsvExportOptions {
  employees: Employee[];
  logs: TimeLog[];
  startDate: string;
  endDate: string;
}

export function downloadCsvReport({
  employees,
  logs,
  startDate,
  endDate,
}: CsvExportOptions) {
  const normKey = (str?: string) => (str || '').toLowerCase().trim().replace(/^emp-fs-/, '').replace(/^emp-/, '').replace(/[\s-_.]/g, '');
  const activeEmps = employees.filter(e => e.role !== 'admin' && e.name !== 'Admin' && !e.isDeleted);

  const filteredLogs = logs.filter(l => 
    (!startDate || l.date >= startDate) &&
    (!endDate || l.date <= endDate)
  );

  const empLogMap: Record<string, { totalHours: number; daysCount: number; logs: TimeLog[] }> = {};
  filteredLogs.forEach(l => {
    const k1 = normKey(l.employeeId);
    const k2 = normKey(l.employeeName);
    [k1, k2].filter(Boolean).forEach(k => {
      if (!empLogMap[k]) empLogMap[k] = { totalHours: 0, daysCount: 0, logs: [] };
      empLogMap[k].totalHours += l.hours;
      if (l.hours > 0) empLogMap[k].daysCount += 1;
      empLogMap[k].logs.push(l);
    });
  });

  const headers = ['Employee Name', 'Username', 'Role', 'Languages', 'Date Range', 'Total Hours Logged', 'Days Worked', 'Attendance Status'];
  
  const rows = activeEmps.map(emp => {
    const k1 = normKey(emp.id);
    const k2 = normKey(emp.username);
    const k3 = normKey(emp.name);
    const data = empLogMap[k1] || empLogMap[k2] || empLogMap[k3];
    const totalHours = data ? data.totalHours : 0;
    const daysWorked = data ? data.daysCount : 0;
    const status = totalHours > 0 ? 'Present' : 'Out of Office';

    return [
      `"${emp.name.replace(/"/g, '""')}"`,
      `"${emp.username || ''}"`,
      `"${emp.role || 'Agent'}"`,
      `"${(emp.languages || []).join(', ')}"`,
      `"${startDate} to ${endDate}"`,
      totalHours.toFixed(2),
      daysWorked,
      status
    ];
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `LimassolTime_Report_${startDate}_${endDate}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
