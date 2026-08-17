import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';

import { authApi } from '../features/auth/api/authApi';
import { useLogout } from '../features/auth/hooks/useAuth';
import { useAuthStore } from '../store/auth';

/**
 * بطاقة المستخدم في الشريط الجانبي — طبق أصل V42: بطاقة مدمجة (صورة + اسم + مسمّى)
 * تُفتح/تُغلق كقائمة منسدلة تُظهر التفاصيل (الرقم/البريد/الهاتف) وإجراءات الحساب
 * (الملف الشخصي · كود الإحالة · تغيير كلمة المرور · تسجيل الخروج) — بخلفية بيضاء (طلب العميل).
 */

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

const staffAccountNumber = (id: number): string => `MEM-${new Date().getFullYear()}-${String(id).padStart(3, '0')}`;

export function SidebarUserCard() {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useLogout();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);

  // إغلاق القائمة عند النقر خارجها (سلوك القوائم المنسدلة).
  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', onDoc);

    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  if (!user) return null;

  const onPickAvatar = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { window.alert('حجم الصورة يجب أن يكون أقل من 3 ميجابايت.'); return; }
    setUploading(true);
    authApi.uploadAvatar(file)
      .then((updated) => setUser(updated))
      .catch(() => window.alert('تعذّر رفع الصورة — جرّب صورة JPG أو PNG أصغر.'))
      .finally(() => setUploading(false));
  };

  const initial = (user.name || 'م').trim().charAt(0) || 'م';
  const account = user.account_number || staffAccountNumber(user.id);

  const goTab = (tab: string) => { setOpen(false); navigate(`/employee-portal?tab=${tab}`); };

  return (
    <div ref={boxRef} style={wrap} className="sb-user-card">
      {/* رأس البطاقة المدمج — النقر يفتح/يغلق القائمة */}
      <div style={header} onClick={() => setOpen((o) => !o)} role="button" tabIndex={0}>
        <div
          style={{ ...avatarWrap, cursor: uploading ? 'wait' : 'pointer' }}
          onClick={(e) => { e.stopPropagation(); if (!uploading) fileRef.current?.click(); }}
          title="انقر لتغيير صورتك الشخصية"
        >
          {user.avatar_url ? <img src={user.avatar_url} alt={user.name} style={avatarImg} /> : <div style={avatarFallback}>{initial}</div>}
          <span style={statusDot} />
          <span style={avatarCam}><i className={`fas ${uploading ? 'fa-spinner fa-spin' : 'fa-camera'}`} /></span>
        </div>
        <div style={info}>
          <div style={name} title={user.name}>{user.name}</div>
          <div style={role}>{roleLabel(user.roles)}</div>
        </div>
        <span style={{ ...chevron, transform: open ? 'rotate(180deg)' : 'none' }}>▾</span>
      </div>
      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={onPickAvatar} style={{ display: 'none' }} />

      {/* القائمة المنسدلة — تفاصيل + إجراءات (طبق أصل V42) */}
      {open && (
        <div style={dropdown}>
          <div style={detailRow}><span style={detIcon}>🆔</span> {account}</div>
          {user.email && <div style={detailRow} title={user.email}><span style={detIcon}>📧</span> <span style={ellip}>{user.email}</span></div>}
          {user.phone && <div style={detailRow}><span style={detIcon}>📱</span> {user.phone}</div>}
          <div style={divider} />
          <button type="button" style={actionRow} onClick={() => goTab('ep-profile')}><span style={detIcon}>👤</span> الملف الشخصي</button>
          <button type="button" style={actionRow} onClick={() => goTab('ep-referral')}><span style={detIcon}>🎁</span> كود الإحالة</button>
          <button type="button" style={actionRow} onClick={() => goTab('ep-profile')}><span style={detIcon}>🔑</span> تغيير كلمة المرور</button>
          <div style={divider} />
          <button type="button" style={{ ...actionRow, ...actionDanger }} onClick={() => logout.mutate()} disabled={logout.isPending}>
            <span style={detIcon}>🚪</span> {logout.isPending ? 'جارٍ الخروج…' : 'تسجيل الخروج'}
          </button>
        </div>
      )}
    </div>
  );
}

// بطاقة بيضاء مدمجة بأسلوب V42 — رأس قابل للنقر + قائمة منسدلة.
const wrap: CSSProperties = { flexShrink: 0, margin: '0 12px 10px', borderRadius: '14px', background: '#fff', border: '1px solid #E7ECF3', boxShadow: '0 2px 10px rgba(39,74,120,.06)', overflow: 'hidden' };
const header: CSSProperties = { display: 'flex', alignItems: 'center', gap: '11px', padding: '12px 13px', cursor: 'pointer', userSelect: 'none' };
const avatarWrap: CSSProperties = { position: 'relative', width: '44px', height: '44px', flexShrink: 0 };
const avatarImg: CSSProperties = { width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #1B6CA8' };
const avatarFallback: CSSProperties = { width: '44px', height: '44px', borderRadius: '50%', display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg,#274A78,#1B6CA8)', color: '#fff', fontSize: '18px', fontWeight: 800, border: '2px solid #1B6CA8' };
const statusDot: CSSProperties = { position: 'absolute', bottom: '0', insetInlineEnd: '0', width: '11px', height: '11px', borderRadius: '50%', background: '#10B981', border: '2px solid #fff' };
const avatarCam: CSSProperties = { position: 'absolute', insetInlineStart: -2, bottom: -2, width: '18px', height: '18px', borderRadius: '50%', background: '#E8A838', color: '#fff', display: 'grid', placeItems: 'center', fontSize: '7px', border: '1.5px solid #fff' };
const info: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '2px', minWidth: 0, flex: 1, textAlign: 'right' };
const name: CSSProperties = { fontSize: '13.5px', color: '#0F172A', fontWeight: 800, lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const role: CSSProperties = { fontSize: '11px', color: '#64748B', fontWeight: 600 };
const chevron: CSSProperties = { color: '#94A3B8', fontSize: '12px', flexShrink: 0, transition: 'transform .2s ease' };
const dropdown: CSSProperties = { borderTop: '1px solid #EEF2F7', padding: '8px', display: 'flex', flexDirection: 'column', gap: '2px', background: '#FBFCFE' };
const detailRow: CSSProperties = { display: 'flex', alignItems: 'center', gap: '9px', padding: '7px 10px', fontSize: '11.5px', color: '#5A6478', fontWeight: 600 };
const detIcon: CSSProperties = { fontSize: '12px', width: '16px', textAlign: 'center', flexShrink: 0 };
const ellip: CSSProperties = { whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const divider: CSSProperties = { height: '1px', background: '#EEF2F7', margin: '4px 6px' };
const actionRow: CSSProperties = { display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 10px', fontSize: '12.5px', color: '#334155', fontWeight: 600, background: 'none', border: 'none', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', width: '100%', textAlign: 'right' };
const actionDanger: CSSProperties = { color: '#DC2626' };
