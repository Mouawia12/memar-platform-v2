const fs = require('fs');

let indexHtml = fs.readFileSync('./erp/index.html', 'utf8');
let erpJs = fs.readFileSync('./erp/erp_app.js', 'utf8');

// 1. Fix "الموظفون" -> "الموظقين" and "الموظفين" -> "الموظقين"
indexHtml = indexHtml.replace(/الموظفون/g, 'الموظقين').replace(/الموظفين/g, 'الموظقين');
erpJs = erpJs.replace(/الموظفون/g, 'الموظقين').replace(/الموظفين/g, 'الموظقين');

// 2. Fix the `this.toast` error in checkStageDelays
erpJs = erpJs.replace("this.toast('النظام الذكي", "toast('النظام الذكي");
erpJs = erpJs.replace("this.toast('النظام الذكي", "toast('النظام الذكي"); // Just in case there are multiple
erpJs = erpJs.replace(/this\.toast\(/g, "toast(");

// 3. Add paySalary function to HR object
const hrObjStart = "const HR = {";
const paySalaryFn = `
  paySalary(empId) {
    const emp = window.GET_LEGACY_EMPLOYEES_FROM_DB().find(e => e.id === empId);
    if (!emp) return;
    const netSalary = Math.round(emp.salary * 1.25 - (emp.status === 'absent' ? emp.salary/22 : 0));
    
    if (typeof Finance !== 'undefined') {
       if (!window.DB_TABLES.transactions) window.DB_TABLES.transactions = [];
       window.DB_TABLES.transactions.push({
         id: 'TRX-PAY-' + Date.now().toString().slice(-4),
         date: new Date().toISOString().split('T')[0],
         type: 'expense',
         category: 'رواتب وأجور',
         amount: netSalary,
         desc: 'صرف راتب الموظف: ' + emp.name,
         account: 'البنك',
         status: 'completed'
       });
       if(typeof Sync !== 'undefined' && Sync.saveFinance) Sync.saveFinance();
    }
    
    if (typeof toast !== 'undefined') toast('✅ تم صرف الراتب للموظف ' + emp.name + ' وتقييده في الحسابات');
  },`;

if (erpJs.includes(hrObjStart)) {
  erpJs = erpJs.replace(hrObjStart, hrObjStart + paySalaryFn);
}

// 4. Update Payroll render to include the action button
const payrollRenderStr = "renderPayroll() {";
const payrollReturnStr = "return `";

const oldThead = "<th>الراتب الأساسي</th><th>البدلات</th><th>الخصومات</th><th>الصافي</th><th>الحالة</th></tr></thead>";
const newThead = "<th>الراتب الأساسي</th><th>البدلات</th><th>الخصومات</th><th>الصافي</th><th>الحالة</th><th>الإجراء</th></tr></thead>";

const oldTbody = "<td>${ERP.statusBadge(e.status==='present'||e.status==='late'?'approved':'pending')}</td>";
const newTbody = "<td>${ERP.statusBadge(e.status==='present'||e.status==='late'?'approved':'pending')}</td><td><button class=\"btn btn-sm btn-outline\" onclick=\"HR.paySalary('${e.id}')\">صرف الراتب</button></td>";

const oldColspan = "colspan=\"2\"";
const newColspan = "colspan=\"2\"";
const oldLastTd = "<td></td>\\s*</tr>\\s*</tbody>";
const newLastTd = "<td></td><td></td>\n                  </tr>\n                </tbody>";

erpJs = erpJs.replace(oldThead, newThead);
erpJs = erpJs.replace(oldTbody, newTbody);
erpJs = erpJs.replace(/<td><\/td>\s*<\/tr>\s*<\/tbody>/, "<td></td><td></td></tr></tbody>");

fs.writeFileSync('./erp/index.html', indexHtml, 'utf8');
fs.writeFileSync('./erp/erp_app.js', erpJs, 'utf8');

console.log("Changes applied successfully!");
