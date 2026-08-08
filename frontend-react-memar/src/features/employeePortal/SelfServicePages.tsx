import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiErrorMessage } from '../../lib/api';
import { useAuthStore } from '../../store/auth';
import { authApi } from '../auth/api/authApi';
import { useToday, useCheckIn, useCheckOut } from '../attendance/hooks/useAttendance';
import { attendanceApi } from '../attendance/api/attendanceApi';
import { STATUS_LABELS, STATUS_COLORS } from '../attendance/types';
import { salariesApi } from '../payroll/api/salariesApi';
import { leavesApi } from '../leaves/leavesApi';
import { dailyReportsApi } from '../dailyReports/dailyReportsApi';
import { myProjectsApi } from '../myProjects/api/myProjectsApi';

/**
 * صفحات «شؤوني» + «حسابي» في بوابة الموظف — منقولة طبق الأصل من مرجع Atoms
 * (employee-portal.html). كل الأصناف مسبوقة بـ ep- ومعزولة تحت .ep-root.
 * الحضور (بطاقة اليوم) والملف الشخصي مربوطان ببيانات حيّة؛ بقية الصفحات
 * تعرض تصميم Atoms طبق الأصل ريثما تُبنى وحداتها في الـbackend.
 */

const fmtTime = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleTimeString('ar-KW', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—';

export const ROLE_AR: Record<string, string> = {
  super_admin: 'مدير النظام',
  manager: 'مدير مشاريع',
  architect: 'مهندس معماري',
  accountant: 'محاسب',
  hr_manager: 'مدير الموارد البشرية',
  sales: 'مسؤول مبيعات',
  secretary: 'سكرتير',
  client: 'عميل',
};

/* ═══════════════════ الحضور والانصراف (بطاقة اليوم حيّة) ═══════════════════ */
export function AttendanceEp() {
  const { data: today, isLoading } = useToday();
  const checkIn = useCheckIn();
  const checkOut = useCheckOut();
  const checkedIn = !!today?.check_in_at;
  const checkedOut = !!today?.check_out_at;

  // سجل وملخّص الموظف الحالي — بيانات حيّة (خدمة ذاتية).
  const { data: summary } = useQuery({ queryKey: ['attendance-mine-summary'], queryFn: () => attendanceApi.mineSummary() });
  const { data: log } = useQuery({ queryKey: ['attendance-mine'], queryFn: () => attendanceApi.mine() });
  const rows = log?.data ?? [];
  const hours = summary ? Math.round((summary.work_minutes ?? 0) / 60) : 0;
  const dayName = (d: string | null) => (d ? new Date(d).toLocaleDateString('ar', { weekday: 'long' }) : '—');
  const dayDate = (d: string | null) => (d ? new Date(d).toLocaleDateString('ar', { day: 'numeric', month: 'long' }) : '—');
  const hm = (iso: string | null) => (iso ? new Date(iso).toLocaleTimeString('ar-KW', { hour: '2-digit', minute: '2-digit', hour12: false }) : '—');

  return (
    <div className="ep-page ep-active">
      <div className="ep-page-header">
        <div><h1 className="ep-page-title">⏰ الحضور والانصراف</h1><p className="ep-page-subtitle">تسجيل الحضور ومتابعة السجل الشهري</p></div>
      </div>

      {/* بطاقة الحضور — بيانات حيّة (تسجيل حضور/انصراف فعلي) */}
      <div className="ep-checkin-card">
        <div className="ep-checkin-status">
          <div className="ep-checkin-icon">{checkedOut ? '🏁' : checkedIn ? '✅' : '🕐'}</div>
          <div className="ep-checkin-info">
            <h3>{isLoading ? 'جارٍ التحميل…' : checkedOut ? 'انتهى دوام اليوم' : checkedIn ? 'تم تسجيل الحضور' : 'لم تسجّل الحضور بعد'}</h3>
            <p>
              {checkedIn
                ? `الحضور: ${fmtTime(today?.check_in_at)}${checkedOut ? ` — الانصراف: ${fmtTime(today?.check_out_at)}` : ''}`
                : 'سجّل حضورك لبدء يوم العمل'}
            </p>
          </div>
        </div>
        <div className="ep-checkin-actions">
          {!checkedIn && (
            <button className="ep-btn ep-btn-primary ep-btn-lg" disabled={checkIn.isPending} onClick={() => checkIn.mutate({})}>
              {checkIn.isPending ? '…' : '📥 تسجيل حضور'}
            </button>
          )}
          {checkedIn && !checkedOut && (
            <button className="ep-btn ep-btn-primary ep-btn-lg" disabled={checkOut.isPending} onClick={() => checkOut.mutate()}>
              {checkOut.isPending ? '…' : '🚪 تسجيل انصراف'}
            </button>
          )}
          {checkedOut && <span className="ep-badge ep-badge-green">تم تسجيل الانصراف ✓</span>}
        </div>
      </div>

      {/* إحصاءات الشهر — حيّة */}
      <div className="ep-kpi-grid ep-sm">
        <div className="ep-kpi-card ep-mini"><div className="ep-kpi-icon ep-green">✅</div><div className="ep-kpi-body"><div className="ep-kpi-value">{summary?.present ?? 0}</div><div className="ep-kpi-label">أيام حضور</div></div></div>
        <div className="ep-kpi-card ep-mini"><div className="ep-kpi-icon ep-red">❌</div><div className="ep-kpi-body"><div className="ep-kpi-value">{summary?.absent ?? 0}</div><div className="ep-kpi-label">غياب</div></div></div>
        <div className="ep-kpi-card ep-mini"><div className="ep-kpi-icon ep-orange">⏰</div><div className="ep-kpi-body"><div className="ep-kpi-value">{summary?.late ?? 0}</div><div className="ep-kpi-label">تأخير</div></div></div>
        <div className="ep-kpi-card ep-mini"><div className="ep-kpi-icon ep-blue">🕐</div><div className="ep-kpi-body"><div className="ep-kpi-value">{hours}h</div><div className="ep-kpi-label">ساعات العمل</div></div></div>
      </div>

      {/* سجل الحضور — حيّ */}
      <div className="ep-card">
        <div className="ep-card-header"><div className="ep-card-title">📋 سجل الحضور</div></div>
        <div className="ep-card-body">
          <div className="ep-table-wrap">
            <table>
              <thead><tr><th>اليوم</th><th>التاريخ</th><th>الحضور</th><th>الانصراف</th><th>الساعات</th><th>الحالة</th></tr></thead>
              <tbody>
                {rows.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: '#94A3B8', padding: '20px' }}>لا سجلّات حضور بعد.</td></tr>}
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td>{dayName(r.date)}</td>
                    <td>{dayDate(r.date)}</td>
                    <td className="ep-td-bold">{hm(r.check_in_at)}</td>
                    <td>{hm(r.check_out_at)}</td>
                    <td>{r.work_minutes ? `${(r.work_minutes / 60).toFixed(1)}h` : '—'}</td>
                    <td><span className="ep-badge" style={{ background: `${STATUS_COLORS[r.status]}1a`, color: STATUS_COLORS[r.status] }}>{STATUS_LABELS[r.status]}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════ الإجازات — طبق أصل Atoms ═══════════════════ */
export function LeavesEp() {
  const qc = useQueryClient();
  const { data: balance } = useQuery({ queryKey: ['leaves-balance'], queryFn: () => leavesApi.balance() });
  const { data: mine } = useQuery({ queryKey: ['leaves-mine'], queryFn: () => leavesApi.mine() });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ type: 'annual', from_date: '', to_date: '', reason: '' });
  const create = useMutation({
    mutationFn: () => leavesApi.create(form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['leaves-mine'] });
      qc.invalidateQueries({ queryKey: ['leaves-balance'] });
      setOpen(false);
      setForm({ type: 'annual', from_date: '', to_date: '', reason: '' });
    },
  });
  const rows = mine ?? [];
  const used = (balance?.annual_used ?? 0) + (balance?.sick_used ?? 0);
  const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString('ar', { day: 'numeric', month: 'long' }) : '—');
  const badgeClass = (s: string) => (s === 'approved' ? 'ep-badge-green' : s === 'rejected' ? 'ep-badge-red' : 'ep-badge-orange');
  const canSubmit = !!form.from_date && !!form.to_date && !create.isPending;

  return (
    <div className="ep-page ep-active">
      <div className="ep-page-header">
        <div><h1 className="ep-page-title">🏖️ طلبات الإجازات</h1><p className="ep-page-subtitle">تقديم ومتابعة طلبات الإجازة</p></div>
        <button className="ep-btn ep-btn-primary" onClick={() => setOpen((o) => !o)}>{open ? '✕ إلغاء' : '+ طلب إجازة جديد'}</button>
      </div>

      {/* رصيد الإجازات — حيّ */}
      <div className="ep-kpi-grid ep-sm">
        <div className="ep-kpi-card ep-mini"><div className="ep-kpi-icon ep-green">🌴</div><div className="ep-kpi-body"><div className="ep-kpi-value">{balance?.annual_remaining ?? 0}</div><div className="ep-kpi-label">رصيد سنوي متبقٍّ</div></div></div>
        <div className="ep-kpi-card ep-mini"><div className="ep-kpi-icon ep-blue">🤒</div><div className="ep-kpi-body"><div className="ep-kpi-value">{balance?.sick_remaining ?? 0}</div><div className="ep-kpi-label">رصيد مرضي متبقٍّ</div></div></div>
        <div className="ep-kpi-card ep-mini"><div className="ep-kpi-icon ep-orange">✈️</div><div className="ep-kpi-body"><div className="ep-kpi-value">{used}</div><div className="ep-kpi-label">مستخدمة</div></div></div>
        <div className="ep-kpi-card ep-mini"><div className="ep-kpi-icon ep-purple">📅</div><div className="ep-kpi-body"><div className="ep-kpi-value">{balance?.annual_entitlement ?? 0}</div><div className="ep-kpi-label">الرصيد السنوي</div></div></div>
      </div>

      {/* نموذج طلب إجازة — حيّ */}
      {open && (
        <div className="ep-card" style={{ marginBottom: 20 }}>
          <div className="ep-card-header"><div className="ep-card-title">📝 طلب إجازة جديد</div></div>
          <div className="ep-card-body">
            <div className="ep-report-form">
              <div className="ep-form-group"><label>النوع</label>
                <select className="ep-form-input" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}>
                  <option value="annual">سنوية</option><option value="sick">مرضية</option><option value="unpaid">بدون راتب</option>
                </select>
              </div>
              <div className="ep-form-group"><label>من</label><input type="date" className="ep-form-input" value={form.from_date} onChange={(e) => setForm((f) => ({ ...f, from_date: e.target.value }))} /></div>
              <div className="ep-form-group"><label>إلى</label><input type="date" className="ep-form-input" value={form.to_date} onChange={(e) => setForm((f) => ({ ...f, to_date: e.target.value }))} /></div>
              <div className="ep-form-group"><label>السبب</label><textarea className="ep-form-input" rows={2} value={form.reason} onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))} placeholder="سبب الإجازة (اختياري)" /></div>
              <div className="ep-form-actions">
                <button className="ep-btn ep-btn-primary" disabled={!canSubmit} onClick={() => create.mutate()}>{create.isPending ? '…جارٍ الإرسال' : '📤 إرسال الطلب'}</button>
              </div>
              {create.isError && <div style={{ color: '#DC4A3D', fontSize: 12.5, marginTop: 8 }}>{apiErrorMessage(create.error) || 'تعذّر الإرسال.'}</div>}
            </div>
          </div>
        </div>
      )}

      {/* طلباتي — حيّ */}
      <div className="ep-card">
        <div className="ep-card-header"><div className="ep-card-title">📋 طلباتي</div></div>
        <div className="ep-card-body">
          <div className="ep-table-wrap">
            <table>
              <thead><tr><th>النوع</th><th>من</th><th>إلى</th><th>المدة</th><th>السبب</th><th>الحالة</th></tr></thead>
              <tbody>
                {rows.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: '#94A3B8', padding: '20px' }}>لا طلبات إجازة بعد.</td></tr>}
                {rows.map((l) => (
                  <tr key={l.id}>
                    <td><span className="ep-badge ep-badge-blue">{l.type_label}</span></td>
                    <td>{fmt(l.from_date)}</td>
                    <td>{fmt(l.to_date)}</td>
                    <td>{l.days} يوم</td>
                    <td>{l.reason ?? '—'}</td>
                    <td><span className={`ep-badge ${badgeClass(l.status)}`}>{l.status_label}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════ كشف الراتب — طبق أصل Atoms ═══════════════════ */
export function SalaryEp() {
  const { data: salaries, isLoading } = useQuery({ queryKey: ['salaries-mine'], queryFn: () => salariesApi.mine() });
  const list = salaries ?? [];
  const latest = list[0];
  const kwd = (v: string | number) => `${Number(v).toLocaleString('ar', { minimumFractionDigits: 0 })} د.ك`;
  const num = (v: string | number) => Number(v).toLocaleString('ar');
  const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  const monthAr = (m: string) => { const [y, mo] = m.split('-'); return `${MONTHS[Number(mo) - 1] ?? mo} ${y}`; };
  const paid = (s?: string) => s === 'paid';

  return (
    <div className="ep-page ep-active">
      <div className="ep-page-header">
        <div><h1 className="ep-page-title">💰 كشف الراتب</h1><p className="ep-page-subtitle">تفاصيل الراتب الشهري والسجل</p></div>
      </div>

      {isLoading && <div className="ep-card"><div className="ep-card-body" style={{ textAlign: 'center', padding: '32px', color: '#94A3B8' }}>جارٍ التحميل…</div></div>}
      {!isLoading && !latest && <div className="ep-card"><div className="ep-card-body" style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>لا كشوف راتب مسجّلة بعد.</div></div>}

      {latest && (
        <div className="ep-salary-card">
          <div className="ep-salary-header">
            <h3>كشف راتب — {monthAr(latest.month)}</h3>
            <span className={`ep-badge ${paid(latest.status) ? 'ep-badge-green' : 'ep-badge-orange'}`}>{paid(latest.status) ? 'تم الصرف ✓' : 'مسودّة'}</span>
          </div>
          <div className="ep-salary-grid">
            <div className="ep-salary-item"><span className="ep-salary-label">الراتب الأساسي</span><span className="ep-salary-val">{kwd(latest.base_kwd)}</span></div>
            <div className="ep-salary-item ep-add"><span className="ep-salary-label">البدلات</span><span className="ep-salary-val ep-green">+{kwd(latest.allowances_kwd)}</span></div>
            <div className="ep-salary-item ep-deduct"><span className="ep-salary-label">الخصومات</span><span className="ep-salary-val ep-red">-{kwd(latest.deductions_kwd)}</span></div>
            <div className="ep-salary-total"><span className="ep-salary-label">صافي الراتب</span><span className="ep-salary-val ep-total">{kwd(latest.net_kwd)}</span></div>
          </div>
        </div>
      )}

      <div className="ep-card">
        <div className="ep-card-header"><div className="ep-card-title">📊 سجل الرواتب</div></div>
        <div className="ep-card-body">
          <div className="ep-table-wrap">
            <table>
              <thead><tr><th>الشهر</th><th>الأساسي</th><th>البدلات</th><th>الخصومات</th><th>الصافي</th><th>الحالة</th></tr></thead>
              <tbody>
                {list.length === 0 && <tr><td colSpan={6} style={{ textAlign: 'center', color: '#94A3B8', padding: '20px' }}>لا سجلّات.</td></tr>}
                {list.map((s) => (
                  <tr key={s.id}>
                    <td className="ep-td-bold">{monthAr(s.month)}</td>
                    <td>{num(s.base_kwd)}</td>
                    <td>{num(s.allowances_kwd)}</td>
                    <td>-{num(s.deductions_kwd)}</td>
                    <td className="ep-td-bold">{num(s.net_kwd)}</td>
                    <td><span className={`ep-badge ${paid(s.status) ? 'ep-badge-green' : 'ep-badge-orange'}`}>{paid(s.status) ? 'مصروف ✓' : 'مسودّة'}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════ التقارير اليومية — طبق أصل Atoms ═══════════════════ */
export function ReportsEp() {
  const qc = useQueryClient();
  const { data: reports } = useQuery({ queryKey: ['daily-reports-mine'], queryFn: () => dailyReportsApi.mine() });
  const { data: myProj } = useQuery({ queryKey: ['my-projects'], queryFn: () => myProjectsApi.mine() });
  const [form, setForm] = useState({ project_id: '', accomplished: '', challenges: '', tomorrow_plan: '' });
  const create = useMutation({
    mutationFn: () => dailyReportsApi.create({
      project_id: form.project_id ? Number(form.project_id) : null,
      accomplished: form.accomplished,
      challenges: form.challenges || undefined,
      tomorrow_plan: form.tomorrow_plan || undefined,
    }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['daily-reports-mine'] }); setForm({ project_id: '', accomplished: '', challenges: '', tomorrow_plan: '' }); },
  });
  const projects = myProj?.projects ?? [];
  const rows = reports ?? [];
  const todayLabel = new Date().toLocaleDateString('ar', { day: 'numeric', month: 'long', year: 'numeric' });
  const fmt = (d: string | null) => (d ? new Date(d).toLocaleDateString('ar', { day: 'numeric', month: 'long' }) : '—');
  const canSubmit = form.accomplished.trim().length > 0 && !create.isPending;

  return (
    <div className="ep-page ep-active">
      <div className="ep-page-header">
        <div><h1 className="ep-page-title">📝 التقارير اليومية</h1><p className="ep-page-subtitle">كتابة وإرسال التقارير اليومية</p></div>
      </div>

      {/* نموذج التقرير — حيّ */}
      <div className="ep-card" style={{ marginBottom: 20 }}>
        <div className="ep-card-header"><div className="ep-card-title">✍️ تقرير اليوم — {todayLabel}</div></div>
        <div className="ep-card-body">
          <div className="ep-report-form">
            <div className="ep-form-group">
              <label>المشروع</label>
              <select className="ep-form-input" value={form.project_id} onChange={(e) => setForm((f) => ({ ...f, project_id: e.target.value }))}>
                <option value="">— بلا مشروع —</option>
                {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div className="ep-form-group"><label>ما تم إنجازه اليوم</label><textarea className="ep-form-input" rows={3} value={form.accomplished} onChange={(e) => setForm((f) => ({ ...f, accomplished: e.target.value }))} placeholder="اكتب ما أنجزته اليوم..." /></div>
            <div className="ep-form-group"><label>التحديات / الملاحظات</label><textarea className="ep-form-input" rows={2} value={form.challenges} onChange={(e) => setForm((f) => ({ ...f, challenges: e.target.value }))} placeholder="أي تحديات واجهتها..." /></div>
            <div className="ep-form-group"><label>خطة الغد</label><textarea className="ep-form-input" rows={2} value={form.tomorrow_plan} onChange={(e) => setForm((f) => ({ ...f, tomorrow_plan: e.target.value }))} placeholder="ما تخطط لإنجازه غداً..." /></div>
            <div className="ep-form-actions">
              <button className="ep-btn ep-btn-primary" disabled={!canSubmit} onClick={() => create.mutate()}>{create.isPending ? '…جارٍ الإرسال' : '📤 إرسال التقرير'}</button>
            </div>
            {create.isSuccess && <div style={{ color: '#2D9B6F', fontWeight: 700, fontSize: 12.5, marginTop: 8 }}>✓ تم إرسال التقرير.</div>}
            {create.isError && <div style={{ color: '#DC4A3D', fontSize: 12.5, marginTop: 8 }}>{apiErrorMessage(create.error) || 'تعذّر الإرسال.'}</div>}
          </div>
        </div>
      </div>

      {/* تقاريري السابقة — حيّ */}
      <div className="ep-card">
        <div className="ep-card-header"><div className="ep-card-title">📋 تقاريري السابقة</div></div>
        <div className="ep-card-body">
          <div className="ep-table-wrap">
            <table>
              <thead><tr><th>التاريخ</th><th>المشروع</th><th>ملخص</th><th>الحالة</th></tr></thead>
              <tbody>
                {rows.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: '#94A3B8', padding: '20px' }}>لا تقارير بعد — اكتب أول تقرير أعلاه.</td></tr>}
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="ep-td-bold">{fmt(r.report_date)}</td>
                    <td>{r.project ?? '—'}</td>
                    <td>{r.accomplished.length > 60 ? `${r.accomplished.slice(0, 60)}…` : r.accomplished}</td>
                    <td><span className={`ep-badge ${r.status === 'accepted' ? 'ep-badge-green' : 'ep-badge-blue'}`}>{r.status_label}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════ المستندات — طبق أصل Atoms ═══════════════════ */
export function DocumentsEp() {
  return (
    <div className="ep-page ep-active">
      <div className="ep-page-header">
        <div><h1 className="ep-page-title">📄 المستندات</h1><p className="ep-page-subtitle">الوصول لمستندات المشاريع المسموح بها</p></div>
        <div className="ep-page-actions">
          <select className="ep-filter-select"><option>جميع المشاريع</option><option>فيلا المنصور</option><option>مبنى العليا</option><option>مجمع تجاري</option></select>
        </div>
      </div>

      <div className="ep-card">
        <div className="ep-card-body">
          <div className="ep-table-wrap">
            <table>
              <thead><tr><th>المستند</th><th>المشروع</th><th>النوع</th><th>الإصدار</th><th>آخر تحديث</th><th>إجراء</th></tr></thead>
              <tbody>
                <tr><td className="ep-td-bold">📐 مخطط الواجهة الرئيسية</td><td>فيلا المنصور</td><td>DWG</td><td>v3.2</td><td className="ep-td-muted">6 أغسطس</td><td><button className="ep-btn ep-btn-xs ep-btn-outline">⬇️ تحميل</button></td></tr>
                <tr><td className="ep-td-bold">📐 المسقط الأفقي — أرضي</td><td>فيلا المنصور</td><td>DWG</td><td>v2.1</td><td className="ep-td-muted">5 أغسطس</td><td><button className="ep-btn ep-btn-xs ep-btn-outline">⬇️ تحميل</button></td></tr>
                <tr><td className="ep-td-bold">📄 مخطط BIM — الطابق 3</td><td>مبنى العليا</td><td>IFC</td><td>v1.4</td><td className="ep-td-muted">4 أغسطس</td><td><button className="ep-btn ep-btn-xs ep-btn-outline">⬇️ تحميل</button></td></tr>
                <tr><td className="ep-td-bold">📋 تقرير إشراف أسبوعي</td><td>مبنى العليا</td><td>PDF</td><td>v1.0</td><td className="ep-td-muted">3 أغسطس</td><td><button className="ep-btn ep-btn-xs ep-btn-outline">⬇️ تحميل</button></td></tr>
                <tr><td className="ep-td-bold">📐 تصميم مبدئي — الواجهات</td><td>مجمع تجاري</td><td>DWG</td><td>v1.0</td><td className="ep-td-muted">1 أغسطس</td><td><button className="ep-btn ep-btn-xs ep-btn-outline">⬇️ تحميل</button></td></tr>
                <tr><td className="ep-td-bold">📄 عقد المشروع</td><td>فيلا المنصور</td><td>PDF</td><td>v1.0</td><td className="ep-td-muted">1 مارس</td><td><button className="ep-btn ep-btn-xs ep-btn-outline">⬇️ تحميل</button></td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════ ملفي الشخصي — بيانات المستخدم الحيّة ═══════════════════ */
export function ProfileEp() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const roleAr = user?.roles?.[0] ? (ROLE_AR[user.roles[0]] ?? user.roles[0]) : 'موظف';

  // بيانات قابلة للتعديل — الاسم والهاتف (البريد والرقم التعريفي مقفلان).
  const [name, setName] = useState(user?.name ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ ok: boolean; text: string } | null>(null);

  // تغيير كلمة المرور.
  const [curPw, setCurPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confPw, setConfPw] = useState('');
  const [savingPw, setSavingPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const saveProfile = async () => {
    setSavingProfile(true); setProfileMsg(null);
    try {
      const updated = await authApi.updateProfile({ name: name.trim(), phone: phone.trim() || null });
      setUser(updated);
      setProfileMsg({ ok: true, text: '✓ تم حفظ التعديلات' });
    } catch (e) {
      setProfileMsg({ ok: false, text: apiErrorMessage(e) || 'تعذّر الحفظ — تحقّق من البيانات.' });
    } finally { setSavingProfile(false); }
  };

  const changePassword = async () => {
    setPwMsg(null);
    if (newPw.length < 8) { setPwMsg({ ok: false, text: 'كلمة المرور الجديدة 8 أحرف على الأقل.' }); return; }
    if (newPw !== confPw) { setPwMsg({ ok: false, text: 'كلمتا المرور غير متطابقتين.' }); return; }
    setSavingPw(true);
    try {
      await authApi.changePassword({ current_password: curPw, password: newPw, password_confirmation: confPw });
      setCurPw(''); setNewPw(''); setConfPw('');
      setPwMsg({ ok: true, text: '✓ تم تغيير كلمة المرور بنجاح' });
    } catch (e) {
      setPwMsg({ ok: false, text: apiErrorMessage(e) || 'تعذّر تغيير كلمة المرور — تحقّق من الحالية.' });
    } finally { setSavingPw(false); }
  };

  const msgStyle = (ok: boolean) => ({ fontSize: '12.5px', fontWeight: 700 as const, color: ok ? '#2D9B6F' : '#DC4A3D', marginTop: '4px' });

  return (
    <div className="ep-page ep-active">
      <div className="ep-page-header">
        <div><h1 className="ep-page-title">👤 ملفي الشخصي</h1><p className="ep-page-subtitle">عرض وتعديل البيانات الشخصية</p></div>
        <button className="ep-btn ep-btn-primary" disabled={savingProfile} onClick={saveProfile}>
          {savingProfile ? '…جارٍ الحفظ' : '💾 حفظ التعديلات'}
        </button>
      </div>

      <div className="ep-grid-2">
        <div className="ep-card">
          <div className="ep-card-header"><div className="ep-card-title">📋 البيانات الشخصية</div></div>
          <div className="ep-card-body">
            <div className="ep-profile-form">
              <div className="ep-form-group"><label>الاسم الكامل</label><input type="text" className="ep-form-input" value={name} onChange={(e) => setName(e.target.value)} /></div>
              <div className="ep-form-group"><label>البريد الإلكتروني (غير قابل للتعديل)</label><input type="email" className="ep-form-input" value={user?.email ?? ''} disabled /></div>
              <div className="ep-form-group"><label>الهاتف</label><input type="tel" className="ep-form-input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="—" /></div>
              <div className="ep-form-group"><label>الرقم التعريفي (غير قابل للتعديل)</label><input type="text" className="ep-form-input" value={user?.id ? `USR-${user.id}` : ''} disabled /></div>
              {profileMsg && <div style={msgStyle(profileMsg.ok)}>{profileMsg.text}</div>}
            </div>
          </div>
        </div>

        <div className="ep-card">
          <div className="ep-card-header"><div className="ep-card-title">🏢 البيانات الوظيفية</div></div>
          <div className="ep-card-body">
            <div className="ep-profile-form">
              <div className="ep-form-group"><label>المسمى الوظيفي / الدور</label><input type="text" className="ep-form-input" value={roleAr} disabled /></div>
              <div className="ep-form-group"><label>الأدوار الممنوحة</label><input type="text" className="ep-form-input" value={(user?.roles ?? []).map((r) => ROLE_AR[r] ?? r).join('، ') || '—'} disabled /></div>
              <div className="ep-form-group"><label>عدد الصلاحيات</label><input type="text" className="ep-form-input" value={`${user?.permissions?.length ?? 0} صلاحية`} disabled /></div>
              <div className="ep-form-group"><label>الحساب</label><input type="text" className="ep-form-input" value="نشِط ✓" disabled /></div>
            </div>
          </div>
        </div>
      </div>

      {/* تغيير كلمة المرور */}
      <div className="ep-card" style={{ marginTop: 20, maxWidth: 560 }}>
        <div className="ep-card-header"><div className="ep-card-title">🔒 تغيير كلمة المرور</div></div>
        <div className="ep-card-body">
          <div className="ep-profile-form">
            <div className="ep-form-group"><label>كلمة المرور الحالية</label><input type="password" className="ep-form-input" value={curPw} onChange={(e) => setCurPw(e.target.value)} autoComplete="current-password" /></div>
            <div className="ep-form-group"><label>كلمة المرور الجديدة (8 أحرف على الأقل)</label><input type="password" className="ep-form-input" value={newPw} onChange={(e) => setNewPw(e.target.value)} autoComplete="new-password" /></div>
            <div className="ep-form-group"><label>تأكيد كلمة المرور الجديدة</label><input type="password" className="ep-form-input" value={confPw} onChange={(e) => setConfPw(e.target.value)} autoComplete="new-password" /></div>
            {pwMsg && <div style={msgStyle(pwMsg.ok)}>{pwMsg.text}</div>}
            <div style={{ marginTop: 6 }}>
              <button className="ep-btn ep-btn-primary" disabled={savingPw || !curPw || !newPw} onClick={changePassword}>
                {savingPw ? '…جارٍ التغيير' : '🔒 تغيير كلمة المرور'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════ كود الإحالة — طبق أصل Atoms ═══════════════════ */
export function ReferralEp() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['employee-points'], queryFn: () => authApi.getPoints() });
  const convert = useMutation({
    mutationFn: (points: number) => authApi.convertPoints(points),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['employee-points'] }),
  });

  const rate = data?.rate_points_per_kwd ?? 50;
  const maxConvertPoints = data ? Math.floor(data.balance / rate) * rate : 0;
  const perDeal = data?.points_per_deal ?? 500;
  const copyCode = () => { if (data?.code) navigator.clipboard?.writeText(data.code); };
  const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('ar', { day: 'numeric', month: 'short' }) : '—');

  return (
    <div className="ep-page ep-active">
      <div className="ep-page-header">
        <div><h1 className="ep-page-title">🎁 كود الإحالة</h1><p className="ep-page-subtitle">اكسب {perDeal} نقطة على كل عميل يتعاقد عبر كودك — وحوّلها إلى راتب</p></div>
      </div>

      {/* البطل — كود ونقاط حيّة */}
      <div className="ep-referral-hero">
        <div className="ep-ref-code-box">
          <div className="ep-ref-label">كود الإحالة الخاص بك</div>
          <div className="ep-ref-code">{data?.code ?? '—'}</div>
          <button className="ep-btn ep-btn-primary" onClick={copyCode}>📋 نسخ الكود</button>
        </div>
        <div className="ep-ref-stats">
          <div className="ep-ref-stat"><span className="ep-ref-num">{data?.balance ?? 0}</span><span className="ep-ref-label">نقاطي الحالية</span></div>
          <div className="ep-ref-stat"><span className="ep-ref-num">{data?.deals_won ?? 0}</span><span className="ep-ref-label">صفقات ناجحة</span></div>
          <div className="ep-ref-stat"><span className="ep-ref-num">{data?.pending_count ?? 0}</span><span className="ep-ref-label">فرص بانتظار الفوز</span></div>
        </div>
      </div>

      {/* تحويل النقاط إلى راتب — حيّ */}
      <div className="ep-card" style={{ marginBottom: 20 }}>
        <div className="ep-card-header"><div className="ep-card-title">💰 تحويل النقاط إلى راتب</div></div>
        <div className="ep-card-body">
          <p style={{ margin: '0 0 12px', color: '#475569', fontSize: 13 }}>
            المعدّل <b>{rate} نقطة = 1 د.ك</b>. رصيدك <b>{data?.balance ?? 0}</b> نقطة ≈ <b style={{ color: '#2D9B6F' }}>{data?.convertible_kwd ?? 0} د.ك</b> قابلة للتحويل الآن.
          </p>
          <button className="ep-btn ep-btn-primary" disabled={!maxConvertPoints || convert.isPending} onClick={() => convert.mutate(maxConvertPoints)}>
            {convert.isPending ? '…جارٍ التحويل' : `تحويل ${maxConvertPoints} نقطة ← ${data?.convertible_kwd ?? 0} د.ك`}
          </button>
          {convert.isSuccess && <div style={{ marginTop: 8, color: '#2D9B6F', fontWeight: 700, fontSize: 12.5 }}>✓ تم التحويل — ستُضاف لراتبك.</div>}
          {convert.isError && <div style={{ marginTop: 8, color: '#DC4A3D', fontWeight: 700, fontSize: 12.5 }}>{apiErrorMessage(convert.error) || 'تعذّر التحويل.'}</div>}
        </div>
      </div>

      {/* كيف يعمل النظام (شرح ثابت) */}
      <div className="ep-card" style={{ marginBottom: 20 }}>
        <div className="ep-card-header"><div className="ep-card-title">📖 كيف يعمل النظام؟</div></div>
        <div className="ep-card-body">
          <div className="ep-ref-steps">
            <div className="ep-ref-step"><div className="ep-ref-step-num">1</div><div className="ep-ref-step-info"><h4>شارك الكود</h4><p>أرسل كود الإحالة الخاص بك للعملاء المحتملين</p></div></div>
            <div className="ep-ref-step"><div className="ep-ref-step-num">2</div><div className="ep-ref-step-info"><h4>العميل يتواصل</h4><p>يُسجَّل العميل كفرصة باسمك (مسؤول الفرصة)</p></div></div>
            <div className="ep-ref-step"><div className="ep-ref-step-num">3</div><div className="ep-ref-step-info"><h4>فوز الصفقة</h4><p>عند تحويل الفرصة لمشروع تحصل على {perDeal} نقطة تلقائيًا</p></div></div>
            <div className="ep-ref-step"><div className="ep-ref-step-num">4</div><div className="ep-ref-step-info"><h4>حوّلها لراتب</h4><p>كل {rate} نقطة = 1 د.ك تُضاف لراتبك</p></div></div>
          </div>
        </div>
      </div>

      {/* سجل النقاط — حيّ */}
      <div className="ep-card">
        <div className="ep-card-header"><div className="ep-card-title">📊 سجل النقاط</div></div>
        <div className="ep-card-body">
          <div className="ep-table-wrap">
            <table>
              <thead><tr><th>التاريخ</th><th>الحركة</th><th>النقاط</th><th>الرصيد</th></tr></thead>
              <tbody>
                {isLoading && <tr><td colSpan={4} style={{ textAlign: 'center', color: '#94A3B8' }}>جارٍ التحميل…</td></tr>}
                {data && data.transactions.length === 0 && <tr><td colSpan={4} style={{ textAlign: 'center', color: '#94A3B8', padding: '20px' }}>لا حركات بعد — شارك كودك وابدأ بكسب النقاط.</td></tr>}
                {data?.transactions.map((t) => (
                  <tr key={t.id}>
                    <td>{fmtDate(t.created_at)}</td>
                    <td className="ep-td-bold">{t.description ?? t.source}</td>
                    <td><span className={`ep-badge ${t.points >= 0 ? 'ep-badge-green' : 'ep-badge-orange'}`}>{t.points >= 0 ? '+' : ''}{t.points}</span></td>
                    <td>{t.balance_after}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
