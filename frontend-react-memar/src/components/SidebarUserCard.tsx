import { useRef, useState, type CSSProperties } from 'react';

import { authApi } from '../features/auth/api/authApi';
import { useAuthStore } from '../store/auth';

/**
 * بطاقة تعريف الموظف/المهندس في الشريط الجانبي — نظير بطاقة العميل في بوابة العميل
 * (طلب أيمن، اجتماع 2026-08-03، مقطع 15): الاسم + المنصب + رقم الحساب + كود إحالة
 * (اقترحنا لأصدقائك) للمبيعات مع بونص على العملاء القادمين عبره.
 *
 * البيانات تُشتق من المستخدم الحالي (client-side) بلا اعتماد على الباك اند:
 * - رقم الحساب: MEM-<السنة>-<تسلسل> (بادئة MEM للطاقم تمييزًا عن MEE للعملاء).
 * - كود الإحالة: MEMAR-<الاسم الأول><السنة> (نفس صيغة العملاء).
 */

// مسمّيات الأدوار بالعربية (نظام الصلاحيات).
const ROLE_LABELS: Record<string, string> = {
  super_admin: 'مدير النظام',
  admin: 'مدير',
  architect: 'مهندس / مصمم',
  engineer: 'مهندس',
  accountant: 'محاسب',
  sales: 'مبيعات',
  secretary: 'سكرتارية',
  hr: 'موارد بشرية',
  client: 'عميل',
};

const roleLabel = (roles?: string[]): string => {
  if (!roles || roles.length === 0) return 'موظّف';
  const primary = roles.find((r) => r !== 'client') ?? roles[0];

  return ROLE_LABELS[primary] ?? primary;
};

/** رقم حساب ثابت للموظف: MEM-<السنة>-<تسلسل بثلاث خانات>. */
const staffAccountNumber = (id: number): string => `MEM-${new Date().getFullYear()}-${String(id).padStart(3, '0')}`;

/**
 * كود الإحالة: MEMAR-<الاسم الأول باللاتينية><السنة> مثل MEMAR-AHMED2026؛
 * وإن كان الاسم عربيًا (لا لاتيني) نستخدم تسلسل الحساب: MEMAR-001-2026.
 */
const referralCodeOf = (name: string, id: number): string => {
  const first = (name || '').trim().split(/\s+/)[0] ?? '';
  const ascii = first.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
  const year = new Date().getFullYear();

  return ascii !== '' ? `MEMAR-${ascii}${year}` : `MEMAR-${String(id).padStart(3, '0')}-${year}`;
};

export function SidebarUserCard() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  if (!user) return null;

  const onPickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // للسماح برفع نفس الملف ثانيةً
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { window.alert('حجم الصورة يجب أن يكون أقل من 3 ميجابايت.'); return; }
    setUploading(true);
    authApi.uploadAvatar(file)
      .then((updated) => setUser(updated))
      .catch(() => window.alert('تعذّر رفع الصورة — جرّب صورة JPG أو PNG أصغر.'))
      .finally(() => setUploading(false));
  };

  const removeAvatar = () => {
    if (!window.confirm('حذف الصورة الشخصية؟')) return;
    setUploading(true);
    authApi.deleteAvatar()
      .then((updated) => setUser(updated))
      .catch(() => {})
      .finally(() => setUploading(false));
  };

  const initial = (user.name || 'م').trim().charAt(0) || 'م';
  // المصدر الرسمي من الباك اند، ومع غيابه (بيانات قديمة) نحسب محليًا.
  const account = user.account_number || staffAccountNumber(user.id);
  const referral = user.referral_code || referralCodeOf(user.name, user.id);
  const referredClients = user.referred_clients ?? 0;

  const copyReferral = () => {
    navigator.clipboard?.writeText(referral);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div style={card} className="sb-user-card">
      {/* رأس البطاقة — يطابق بطاقة العميل: صورة كبيرة بإطار + نقطة حالة + اسم + مسمّى + كود الحساب */}
      <div style={header}>
        <div
          style={{ ...avatarWrap, cursor: uploading ? 'wait' : 'pointer' }}
          onClick={() => !uploading && fileRef.current?.click()}
          title="انقر لتغيير صورتك الشخصية"
        >
          {user.avatar_url
            ? <img src={user.avatar_url} alt={user.name} style={avatarImg} />
            : <div style={avatarFallback}>{initial}</div>}
          <span style={statusDot} />
          <span style={avatarOverlay}><i className={`fas ${uploading ? 'fa-spinner fa-spin' : 'fa-camera'}`} /></span>
          <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onPickAvatar} style={{ display: 'none' }} />
        </div>
        <div style={info}>
          <strong style={name} title={user.name}>{user.name}</strong>
          <span style={role}><i className="fas fa-id-badge" /> {roleLabel(user.roles)}</span>
          <span style={memberChip} title="رقم الحساب الشخصي"><i className="fas fa-hashtag" /> {account}</span>
        </div>
      </div>

      <div style={details}>
        {user.avatar_url && <button type="button" onClick={removeAvatar} style={removeAvatarBtn} disabled={uploading}>إزالة الصورة</button>}
        {user.email && <span style={detailItem} title={user.email}><i className="fas fa-envelope" /> {user.email}</span>}
        {user.phone && <span style={detailItem}><i className="fas fa-phone" /> {user.phone}</span>}

      {/* كود الإحالة (اقترحنا لأصدقائك) — للمبيعات مع بونص على العملاء القادمين عبره */}
      <div style={referralBox}>
        <div style={referralLabel}><i className="fas fa-handshake-angle" /> كود الإحالة — اقترحنا لأصدقائك</div>
        <div style={referralValue}>
          <span style={{ fontWeight: 800, color: '#B87514', letterSpacing: '.4px' }}>{referral}</span>
          <button type="button" onClick={copyReferral} style={copyBtn} title="نسخ الكود">
            <i className={`fas ${copied ? 'fa-check' : 'fa-copy'}`} />
          </button>
        </div>
        <p style={referralNote}>احصل على بونص مبيعات على كل عميل يسجّل ويتعاقد عبر كودك.</p>
        {referredClients > 0 && (
          <div style={referredBadge}><i className="fas fa-users" /> {referredClients} عميل عبر كودك</div>
        )}
      </div>
      </div>
    </div>
  );
}

// بطاقة الموظف — بنفس تصميم بطاقة العميل: رأس متدرّج + صورة 72px بإطار + نقطة حالة
// + مسمّى بلون accent + كود حساب برقاقة بنفسجية، ثم تفاصيل (بريد + كود إحالة).
// flexShrink:0 يمنع حاوية السايدبار (flex عمودي) من ضغط البطاقة إلى صفر عند
// امتلاء القائمة — فتبقى بكامل ارتفاعها ويُمرَّر السايدبار بدلها.
const card: CSSProperties = { flexShrink: 0, margin: '0 12px 10px', borderRadius: '14px', background: '#fff', border: '1px solid #E7ECF3', boxShadow: '0 2px 10px rgba(39,74,120,.06)', overflow: 'hidden' };
const header: CSSProperties = { display: 'flex', alignItems: 'center', gap: '14px', padding: '20px 14px 16px', background: 'linear-gradient(145deg, rgba(26,31,54,.05) 0%, rgba(45,53,97,.04) 50%, rgba(27,108,168,.06) 100%)', borderBottom: '1px solid rgba(27,108,168,.08)' };
const avatarWrap: CSSProperties = { position: 'relative', width: '72px', height: '72px', flexShrink: 0 };
const avatarImg: CSSProperties = { width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #1B6CA8', boxShadow: '0 4px 14px rgba(27,108,168,.18)' };
const avatarFallback: CSSProperties = { width: '72px', height: '72px', borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#274A78,#1B6CA8)', color: '#fff', fontSize: '26px', fontWeight: 800, border: '3px solid #1B6CA8', boxShadow: '0 4px 14px rgba(27,108,168,.18)' };
const statusDot: CSSProperties = { position: 'absolute', bottom: '2px', insetInlineEnd: '2px', width: '13px', height: '13px', borderRadius: '50%', background: '#2D9B6F', border: '2.5px solid #fff' };
const avatarOverlay: CSSProperties = { position: 'absolute', insetInlineStart: -1, bottom: -1, width: '20px', height: '20px', borderRadius: '50%', background: '#E8A838', color: '#fff', display: 'grid', placeItems: 'center', fontSize: '9px', border: '2px solid #fff' };
const info: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '4px', minWidth: 0, flex: 1, textAlign: 'right' };
const name: CSSProperties = { display: 'block', fontSize: '14.5px', color: '#1E293B', fontWeight: 800, lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const role: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', color: '#7C3AED', fontWeight: 700 };
const memberChip: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '5px', alignSelf: 'flex-start', marginTop: '3px', fontSize: '11px', fontWeight: 700, color: '#7C3AED', background: 'rgba(124,58,237,.08)', border: '1px solid rgba(124,58,237,.15)', padding: '3px 10px', borderRadius: '12px', letterSpacing: '.5px', whiteSpace: 'nowrap', maxWidth: '100%' };
const details: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '10px', padding: '12px 14px 14px' };
const removeAvatarBtn: CSSProperties = { alignSelf: 'flex-start', padding: 0, border: 'none', background: 'none', color: '#B0483C', fontSize: '10.5px', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' };
const detailItem: CSSProperties = { display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11.5px', color: '#64748B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' };
const referralBox: CSSProperties = { background: 'rgba(232,168,56,.08)', border: '1px dashed rgba(232,168,56,.5)', borderRadius: '10px', padding: '9px 10px' };
const referralLabel: CSSProperties = { fontSize: '10.5px', fontWeight: 700, color: '#9A6B12', display: 'flex', alignItems: 'center', gap: '5px', marginBottom: '6px' };
const referralValue: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', background: '#fff', border: '1px solid rgba(232,168,56,.4)', borderRadius: '8px', padding: '5px 8px 5px 5px' };
const copyBtn: CSSProperties = { display: 'grid', placeItems: 'center', width: '26px', height: '26px', borderRadius: '6px', border: 'none', background: '#E8A838', color: '#fff', cursor: 'pointer', fontSize: '11px', flexShrink: 0 };
const referralNote: CSSProperties = { margin: '7px 2px 0', fontSize: '10.5px', lineHeight: 1.6, color: '#8A7328' };
const referredBadge: CSSProperties = { marginTop: '7px', display: 'inline-flex', alignItems: 'center', gap: '5px', background: '#E8A838', color: '#fff', fontSize: '10.5px', fontWeight: 700, padding: '3px 9px', borderRadius: '999px' };
