const fs = require('fs');
let content = fs.readFileSync('src/app/page.tsx', 'utf-8');

const replacements = [
  // Header / Common
  ["Limassol, Cyprus ({currentDomain || 'limassoltime.web.app'})", "{T.appSubtitle} ({currentDomain || 'limassoltime.web.app'})"],
  ["🇨🇾 CYPRUS TIME NOW", "🇨🇾 {T.appSubtitle}"],

  // Kiosk View
  ["{activeEmployee.status === 'checked_in' ? '🟢 LIVE — WORKED TODAY' : `🟡 ON BREAK`}", "{activeEmployee.status === 'checked_in' ? T.liveLabel : T.onBreakLabel}"],
  ["🟢 Employee Shift Kiosk", "{T.kioskBadge}"],
  ["Welcome, {activeEmployee.name}!", "{T.welcomeLabel} {activeEmployee.name}!"],
  ["Role: {activeEmployee.role} | Target Shift: {activeEmployee.expectedShift} (Cyprus Time)", "{T.roleLabel} {activeEmployee.role} | {T.targetShiftLabel} {activeEmployee.expectedShift}"],
  ["🟡 ON BREAK: ${activeEmployee.breakType || 'Pause'}", "${T.onBreakLabel}: ${activeEmployee.breakType || 'Pause'}"],
  ["⏱️ BILLABLE WORKING TIME", "{T.billableTimerLabel}"],
  ["<span>🟢</span> Clock In (Start Work)", "<span>🟢</span> {T.clockInBtn.replace('🟢 ', '')}"],
  ["<span>⏸️</span> Pause / Break...", "<span>⏸️</span> {T.pauseBreakBtn.replace('⏸️ ', '')}"],
  ["Select Break Type:", "{T.selectBreakType}"],
  ["🚬 Smoke Break (5-10m)", "{T.smokBreak}"],
  ["🥪 Lunch Break (30-60m)", "{T.lunchBreak}"],
  ["☕ Coffee / Rest Break", "{T.coffeeBreak}"],
  ["❓ Short Break / Other", "{T.shortBreak}"],
  ["<span>🔴</span> Clock Out (Left Office)", "<span>🔴</span> {T.clockOutBtn.replace('🔴 ', '')}"],
  ["<span>▶️</span> Resume Work", "<span>▶️</span> {T.resumeWorkBtn.replace('▶️ ', '')}"],
  ["<span>↩️</span> Re-open / Clock In Again", "<span>↩️</span> {T.reopenBtn.replace('↩️ ', '')}"],

  // Admin Modals & Sections
  ["Time Logs & Project Tasks", "{T.timeLogsTableTitle}"],
  ["No time entries found for selected filter. Click &quot;📝 Log Hours / Task&quot; to add one.", "{T.noLogsFilter}"],

  // Log Modal
  ["Log Work Hours & Task", "{T.logWorkTitle}"],
  ["Select Employee:", "{T.selectEmpLabel}"],
  ["Hours Logged:", "{T.hoursWorkedLabel}"],
  ["Project / Task Description:", "{T.taskLabel}"],
  [">Cancel<", ">{T.cancelBtn}<"],
  [">Save Entry<", ">{T.submitLog}<"],

  // Add Employee Modal
  ["Add Team Member", "{T.addEmpTitle}"],
  [">Full Name:<", ">{T.empNameLabel}<"],
  [">Role / Position:<", ">{T.empRoleLabel}<"],
  [">Languages (comma separated):<", ">{T.empLangLabel}<"],
  [">Expected Shift Time (Cyprus):<", ">{T.empShiftLabel}<"],
  [">Save Member<", ">{T.saveBtn}<"],

  // Edit Employee Modal
  ["✏️ Edit Member &amp; PIN", "✏️ {T.editShiftTitle}"],
  [">Shift Status:<", ">{T.statusLabel}<"],
  [">Arrival Time (In):<", ">{T.checkInLabel}<"],
  [">Departure Time (Out):<", ">{T.checkOutLabel}<"],
  [">Save Shift Times<", ">{T.saveChanges}<"],

  // Report Modal
  ["🖨️ Print / Save as PDF", "{T.printReport}"],
  [">Close ✕<", ">{T.closeBtn} ✕<"],

  // Clockify
  ["⚡ Clockify.me API Backup & Sync", "{T.clockifyTitle}"],
  ["Connect your Clockify.me workspace to automatically back up attendance logs and invite your employees for self-tracking.", "{T.clockifyDesc}"],
  [">Clockify API Key:<", ">{T.clockifyKeyLabel}<"],
  [">Workspace ID (Optional):<", ">{T.clockifyWsLabel}<"],
  [">💾 Save Config<", ">💾 {T.saveSyncBtn}<"],
  [">⚡ Sync Now<", ">⚡ {T.saveSyncBtn}<"],
  [">🚀 Full Setup + Invite Staff<", ">🚀 {T.fullSetupBtn}<"],
];

for (const [search, replace] of replacements) {
  content = content.replace(search, replace);
}

fs.writeFileSync('src/app/page.tsx', content, 'utf-8');
console.log('Replacements done.');
