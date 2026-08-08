import { useState } from 'react';

import { apiErrorMessage } from '../../lib/api';
import { useAuthStore } from '../../store/auth';
import { authApi } from '../auth/api/authApi';
import { useToday, useCheckIn, useCheckOut } from '../attendance/hooks/useAttendance';

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

      {/* إحصاءات الشهر — طبق أصل Atoms */}
      <div className="ep-kpi-grid ep-sm">
        <div className="ep-kpi-card ep-mini"><div className="ep-kpi-icon ep-green">✅</div><div className="ep-kpi-body"><div className="ep-kpi-value">22</div><div className="ep-kpi-label">أيام حضور</div></div></div>
        <div className="ep-kpi-card ep-mini"><div className="ep-kpi-icon ep-red">❌</div><div className="ep-kpi-body"><div className="ep-kpi-value">1</div><div className="ep-kpi-label">غياب</div></div></div>
        <div className="ep-kpi-card ep-mini"><div className="ep-kpi-icon ep-orange">⏰</div><div className="ep-kpi-body"><div className="ep-kpi-value">2</div><div className="ep-kpi-label">تأخير</div></div></div>
        <div className="ep-kpi-card ep-mini"><div className="ep-kpi-icon ep-blue">🕐</div><div className="ep-kpi-body"><div className="ep-kpi-value">176h</div><div className="ep-kpi-label">ساعات العمل</div></div></div>
      </div>

      {/* سجل الحضور — طبق أصل Atoms */}
      <div className="ep-card">
        <div className="ep-card-header"><div className="ep-card-title">📋 سجل الحضور — أغسطس 2026</div></div>
        <div className="ep-card-body">
          <div className="ep-table-wrap">
            <table>
              <thead><tr><th>اليوم</th><th>التاريخ</th><th>الحضور</th><th>الانصراف</th><th>الساعات</th><th>الحالة</th></tr></thead>
              <tbody>
                <tr><td>الخميس</td><td>7 أغسطس</td><td className="ep-td-bold">08:02</td><td className="ep-td-muted">—</td><td>—</td><td><span className="ep-badge ep-badge-green">حاضر ✓</span></td></tr>
                <tr><td>الأربعاء</td><td>6 أغسطس</td><td className="ep-td-bold">07:58</td><td>04:30</td><td>8.5h</td><td><span className="ep-badge ep-badge-green">حاضر ✓</span></td></tr>
                <tr><td>الثلاثاء</td><td>5 أغسطس</td><td className="ep-td-bold">08:15</td><td>04:45</td><td>8.5h</td><td><span className="ep-badge ep-badge-orange">تأخير 15د</span></td></tr>
                <tr><td>الاثنين</td><td>4 أغسطس</td><td className="ep-td-bold">07:55</td><td>05:00</td><td>9h</td><td><span className="ep-badge ep-badge-green">حاضر ✓</span></td></tr>
                <tr><td>الأحد</td><td>3 أغسطس</td><td className="ep-td-bold">08:00</td><td>04:30</td><td>8.5h</td><td><span className="ep-badge ep-badge-green">حاضر ✓</span></td></tr>
                <tr><td>السبت</td><td>2 أغسطس</td><td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-3)' }}>— عطلة نهاية الأسبوع —</td></tr>
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
  return (
    <div className="ep-page ep-active">
      <div className="ep-page-header">
        <div><h1 className="ep-page-title">🏖️ طلبات الإجازات</h1><p className="ep-page-subtitle">تقديم ومتابعة طلبات الإجازة</p></div>
        <button className="ep-btn ep-btn-primary">+ طلب إجازة جديد</button>
      </div>

      <div className="ep-kpi-grid ep-sm">
        <div className="ep-kpi-card ep-mini"><div className="ep-kpi-icon ep-green">🌴</div><div className="ep-kpi-body"><div className="ep-kpi-value">18</div><div className="ep-kpi-label">رصيد سنوي</div></div></div>
        <div className="ep-kpi-card ep-mini"><div className="ep-kpi-icon ep-blue">🤒</div><div className="ep-kpi-body"><div className="ep-kpi-value">10</div><div className="ep-kpi-label">رصيد مرضي</div></div></div>
        <div className="ep-kpi-card ep-mini"><div className="ep-kpi-icon ep-orange">✈️</div><div className="ep-kpi-body"><div className="ep-kpi-value">5</div><div className="ep-kpi-label">مستخدمة</div></div></div>
        <div className="ep-kpi-card ep-mini"><div className="ep-kpi-icon ep-purple">📅</div><div className="ep-kpi-body"><div className="ep-kpi-value">13</div><div className="ep-kpi-label">متبقية</div></div></div>
      </div>

      <div className="ep-card">
        <div className="ep-card-header"><div className="ep-card-title">📋 طلباتي</div></div>
        <div className="ep-card-body">
          <div className="ep-table-wrap">
            <table>
              <thead><tr><th>النوع</th><th>من</th><th>إلى</th><th>المدة</th><th>السبب</th><th>الحالة</th></tr></thead>
              <tbody>
                <tr><td><span className="ep-badge ep-badge-green">سنوية</span></td><td>15 أغسطس</td><td>15 أغسطس</td><td>1 يوم</td><td>أمور شخصية</td><td><span className="ep-badge ep-badge-green">موافق عليها ✓</span></td></tr>
                <tr><td><span className="ep-badge ep-badge-blue">مرضية</span></td><td>20 يوليو</td><td>21 يوليو</td><td>2 يوم</td><td>مراجعة طبية</td><td><span className="ep-badge ep-badge-green">موافق عليها ✓</span></td></tr>
                <tr><td><span className="ep-badge ep-badge-green">سنوية</span></td><td>1 سبتمبر</td><td>5 سبتمبر</td><td>5 أيام</td><td>إجازة عائلية</td><td><span className="ep-badge ep-badge-orange">بانتظار الموافقة</span></td></tr>
                <tr><td><span className="ep-badge ep-badge-green">سنوية</span></td><td>10 يونيو</td><td>12 يونيو</td><td>3 أيام</td><td>سفر</td><td><span className="ep-badge ep-badge-green">موافق عليها ✓</span></td></tr>
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
  return (
    <div className="ep-page ep-active">
      <div className="ep-page-header">
        <div><h1 className="ep-page-title">💰 كشف الراتب</h1><p className="ep-page-subtitle">تفاصيل الراتب الشهري والسجل</p></div>
      </div>

      <div className="ep-salary-card">
        <div className="ep-salary-header">
          <h3>كشف راتب — أغسطس 2026</h3>
          <span className="ep-badge ep-badge-green">تم الصرف ✓</span>
        </div>
        <div className="ep-salary-grid">
          <div className="ep-salary-item"><span className="ep-salary-label">الراتب الأساسي</span><span className="ep-salary-val">1,200 د.ك</span></div>
          <div className="ep-salary-item"><span className="ep-salary-label">بدل سكن</span><span className="ep-salary-val">250 د.ك</span></div>
          <div className="ep-salary-item"><span className="ep-salary-label">بدل مواصلات</span><span className="ep-salary-val">100 د.ك</span></div>
          <div className="ep-salary-item"><span className="ep-salary-label">بدل هاتف</span><span className="ep-salary-val">30 د.ك</span></div>
          <div className="ep-salary-item ep-add"><span className="ep-salary-label">مكافأة أداء</span><span className="ep-salary-val ep-green">+150 د.ك</span></div>
          <div className="ep-salary-item ep-deduct"><span className="ep-salary-label">خصم تأمينات</span><span className="ep-salary-val ep-red">-86 د.ك</span></div>
          <div className="ep-salary-item ep-deduct"><span className="ep-salary-label">خصم تأخير (2 مرة)</span><span className="ep-salary-val ep-red">-15 د.ك</span></div>
          <div className="ep-salary-total"><span className="ep-salary-label">صافي الراتب</span><span className="ep-salary-val ep-total">1,629 د.ك</span></div>
        </div>
      </div>

      <div className="ep-card">
        <div className="ep-card-header"><div className="ep-card-title">📊 سجل الرواتب</div></div>
        <div className="ep-card-body">
          <div className="ep-table-wrap">
            <table>
              <thead><tr><th>الشهر</th><th>الأساسي</th><th>البدلات</th><th>المكافآت</th><th>الخصومات</th><th>الصافي</th><th>الحالة</th></tr></thead>
              <tbody>
                <tr><td className="ep-td-bold">أغسطس 2026</td><td>1,200</td><td>380</td><td>150</td><td>-101</td><td className="ep-td-bold">1,629</td><td><span className="ep-badge ep-badge-green">مصروف ✓</span></td></tr>
                <tr><td className="ep-td-bold">يوليو 2026</td><td>1,200</td><td>380</td><td>100</td><td>-86</td><td className="ep-td-bold">1,594</td><td><span className="ep-badge ep-badge-green">مصروف ✓</span></td></tr>
                <tr><td className="ep-td-bold">يونيو 2026</td><td>1,200</td><td>380</td><td>200</td><td>-86</td><td className="ep-td-bold">1,694</td><td><span className="ep-badge ep-badge-green">مصروف ✓</span></td></tr>
                <tr><td className="ep-td-bold">مايو 2026</td><td>1,200</td><td>380</td><td>0</td><td>-86</td><td className="ep-td-bold">1,494</td><td><span className="ep-badge ep-badge-green">مصروف ✓</span></td></tr>
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
  return (
    <div className="ep-page ep-active">
      <div className="ep-page-header">
        <div><h1 className="ep-page-title">📝 التقارير اليومية</h1><p className="ep-page-subtitle">كتابة وإرسال التقارير اليومية</p></div>
      </div>

      <div className="ep-card" style={{ marginBottom: 20 }}>
        <div className="ep-card-header"><div className="ep-card-title">✍️ تقرير اليوم — 7 أغسطس 2026</div></div>
        <div className="ep-card-body">
          <div className="ep-report-form">
            <div className="ep-form-group">
              <label>المشروع</label>
              <select className="ep-form-input"><option>فيلا المنصور</option><option>مبنى العليا</option><option>مجمع تجاري — الري</option></select>
            </div>
            <div className="ep-form-group"><label>ما تم إنجازه اليوم</label><textarea className="ep-form-input" rows={3} placeholder="اكتب ما أنجزته اليوم..." /></div>
            <div className="ep-form-group"><label>التحديات / الملاحظات</label><textarea className="ep-form-input" rows={2} placeholder="أي تحديات واجهتها..." /></div>
            <div className="ep-form-group"><label>خطة الغد</label><textarea className="ep-form-input" rows={2} placeholder="ما تخطط لإنجازه غداً..." /></div>
            <div className="ep-form-actions">
              <button className="ep-btn ep-btn-primary">📤 إرسال التقرير</button>
              <button className="ep-btn ep-btn-outline">💾 حفظ مسودة</button>
            </div>
          </div>
        </div>
      </div>

      <div className="ep-card">
        <div className="ep-card-header"><div className="ep-card-title">📋 تقاريري السابقة</div></div>
        <div className="ep-card-body">
          <div className="ep-table-wrap">
            <table>
              <thead><tr><th>التاريخ</th><th>المشروع</th><th>ملخص</th><th>الحالة</th></tr></thead>
              <tbody>
                <tr><td className="ep-td-bold">6 أغسطس</td><td>فيلا المنصور</td><td>رفع مخططات الإنشائي + تنسيق مع المقاول</td><td><span className="ep-badge ep-badge-green">مقبول ✓</span></td></tr>
                <tr><td className="ep-td-bold">5 أغسطس</td><td>مبنى العليا</td><td>تحديث BIM Model الطابق 2 + زيارة موقع</td><td><span className="ep-badge ep-badge-green">مقبول ✓</span></td></tr>
                <tr><td className="ep-td-bold">4 أغسطس</td><td>مجمع تجاري</td><td>تصميم المسقط الأفقي — الطابق الأرضي</td><td><span className="ep-badge ep-badge-green">مقبول ✓</span></td></tr>
                <tr><td className="ep-td-bold">3 أغسطس</td><td>فيلا المنصور</td><td>مراجعة ملاحظات العميل + تعديل الواجهة</td><td><span className="ep-badge ep-badge-green">مقبول ✓</span></td></tr>
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
  return (
    <div className="ep-page ep-active">
      <div className="ep-page-header">
        <div><h1 className="ep-page-title">🎁 كود الإحالة</h1><p className="ep-page-subtitle">اكسب نقاطًا على كل مشروع يتم توقيعه من خلال كود الإحالة الخاص بك</p></div>
      </div>

      <div className="ep-referral-hero">
        <div className="ep-ref-code-box">
          <div className="ep-ref-label">كود الإحالة الخاص بك</div>
          <div className="ep-ref-code">AHMED-MEM-2023</div>
          <button className="ep-btn ep-btn-primary">📋 نسخ الكود</button>
        </div>
        <div className="ep-ref-stats">
          <div className="ep-ref-stat"><span className="ep-ref-num">850</span><span className="ep-ref-label">نقاطي الحالية</span></div>
          <div className="ep-ref-stat"><span className="ep-ref-num">6</span><span className="ep-ref-label">إحالات ناجحة</span></div>
          <div className="ep-ref-stat"><span className="ep-ref-num">2</span><span className="ep-ref-label">بانتظار التوقيع</span></div>
        </div>
      </div>

      <div className="ep-card" style={{ marginBottom: 20 }}>
        <div className="ep-card-header"><div className="ep-card-title">📖 كيف يعمل النظام؟</div></div>
        <div className="ep-card-body">
          <div className="ep-ref-steps">
            <div className="ep-ref-step"><div className="ep-ref-step-num">1</div><div className="ep-ref-step-info"><h4>شارك الكود</h4><p>أرسل كود الإحالة الخاص بك للعملاء المحتملين</p></div></div>
            <div className="ep-ref-step"><div className="ep-ref-step-num">2</div><div className="ep-ref-step-info"><h4>العميل يتواصل</h4><p>عندما يتواصل العميل ويذكر كود الإحالة</p></div></div>
            <div className="ep-ref-step"><div className="ep-ref-step-num">3</div><div className="ep-ref-step-info"><h4>توقيع العقد</h4><p>عند توقيع عقد المشروع تحصل على النقاط</p></div></div>
            <div className="ep-ref-step"><div className="ep-ref-step-num">4</div><div className="ep-ref-step-info"><h4>اكسب المكافآت</h4><p>استبدل النقاط بمكافآت مالية أو إجازات</p></div></div>
          </div>
        </div>
      </div>

      <div className="ep-grid-2">
        <div className="ep-card">
          <div className="ep-card-header"><div className="ep-card-title">📊 سجل النقاط</div></div>
          <div className="ep-card-body">
            <div className="ep-table-wrap">
              <table>
                <thead><tr><th>التاريخ</th><th>العميل</th><th>المشروع</th><th>النقاط</th></tr></thead>
                <tbody>
                  <tr><td>6 أغسطس</td><td className="ep-td-bold">خالد الصباح</td><td>فيلا سكنية</td><td><span className="ep-badge ep-badge-green">+150</span></td></tr>
                  <tr><td>20 يوليو</td><td className="ep-td-bold">سارة العلي</td><td>تصميم داخلي</td><td><span className="ep-badge ep-badge-green">+100</span></td></tr>
                  <tr><td>5 يوليو</td><td className="ep-td-bold">فهد المطيري</td><td>ملحق سكني</td><td><span className="ep-badge ep-badge-green">+100</span></td></tr>
                  <tr><td>15 يونيو</td><td className="ep-td-bold">مؤسسة الأمل</td><td>مبنى إداري</td><td><span className="ep-badge ep-badge-green">+200</span></td></tr>
                  <tr><td>1 يونيو</td><td className="ep-td-bold">عبدالله النور</td><td>فيلا سكنية</td><td><span className="ep-badge ep-badge-green">+150</span></td></tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="ep-card">
          <div className="ep-card-header"><div className="ep-card-title">🎁 المكافآت المتاحة</div></div>
          <div className="ep-card-body">
            <div className="ep-rewards-list">
              <div className="ep-reward-item"><div className="ep-reward-icon">💰</div><div className="ep-reward-info"><div className="ep-reward-name">مكافأة 50 د.ك</div><div className="ep-reward-cost">500 نقطة</div></div><button className="ep-btn ep-btn-xs ep-btn-primary">استبدال</button></div>
              <div className="ep-reward-item"><div className="ep-reward-icon">💰</div><div className="ep-reward-info"><div className="ep-reward-name">مكافأة 100 د.ك</div><div className="ep-reward-cost">900 نقطة</div></div><button className="ep-btn ep-btn-xs ep-btn-outline" disabled>غير كافٍ</button></div>
              <div className="ep-reward-item"><div className="ep-reward-icon">🏖️</div><div className="ep-reward-info"><div className="ep-reward-name">يوم إجازة إضافي</div><div className="ep-reward-cost">300 نقطة</div></div><button className="ep-btn ep-btn-xs ep-btn-primary">استبدال</button></div>
              <div className="ep-reward-item"><div className="ep-reward-icon">🎓</div><div className="ep-reward-info"><div className="ep-reward-name">دورة تدريبية مجانية</div><div className="ep-reward-cost">600 نقطة</div></div><button className="ep-btn ep-btn-xs ep-btn-primary">استبدال</button></div>
              <div className="ep-reward-item"><div className="ep-reward-icon">📱</div><div className="ep-reward-info"><div className="ep-reward-name">بدل هاتف إضافي (شهر)</div><div className="ep-reward-cost">200 نقطة</div></div><button className="ep-btn ep-btn-xs ep-btn-primary">استبدال</button></div>
            </div>
          </div>
        </div>
      </div>

      <div className="ep-card">
        <div className="ep-card-header"><div className="ep-card-title">⏳ إحالات بانتظار التوقيع</div></div>
        <div className="ep-card-body">
          <div className="ep-table-wrap">
            <table>
              <thead><tr><th>العميل</th><th>تاريخ الإحالة</th><th>نوع المشروع</th><th>الحالة</th><th>النقاط المتوقعة</th></tr></thead>
              <tbody>
                <tr><td className="ep-td-bold">ناصر الحربي</td><td>1 أغسطس</td><td>فيلا سكنية</td><td><span className="ep-badge ep-badge-orange">عرض سعر مرسل</span></td><td>150</td></tr>
                <tr><td className="ep-td-bold">شركة المستقبل</td><td>28 يوليو</td><td>مبنى تجاري</td><td><span className="ep-badge ep-badge-blue">قيد التفاوض</span></td><td>200</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
