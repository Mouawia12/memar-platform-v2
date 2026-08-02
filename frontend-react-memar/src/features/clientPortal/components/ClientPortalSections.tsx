import { useState } from 'react';

import type { Appointment } from '../../appointments/types';
import type { ClientInfo } from '../api/clientPortalApi';
import { useClientNotifications, useMyRequests, useSubmitClientRequest, useUpdateClientProfile } from '../hooks/useClientPortal';

const fmtDateTime = (iso: string | null) => (iso ? new Date(iso).toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short' }) : '');
const dayOf = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('ar', { day: 'numeric' }) : '—');
const monthOf = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('ar', { month: 'long' }) : '');

const STATUS_CLS: Record<string, string> = { open: 'badge-orange', in_progress: 'badge-blue', resolved: 'badge-green', closed: 'badge-gray' };

/** طلباتي — قائمة طلبات العميل الحقيقية + إرسال طلب جديد. */
export function RequestsSection() {
  const { data, isLoading } = useMyRequests();
  const submit = useSubmitClientRequest();

  return (
    <div className="card" style={{ maxWidth: 820 }}>
      <div className="card-header">
        <h3 className="card-title">طلباتي</h3>
        <button className="btn hero-ad-btn" style={{ padding: '8px 14px' }} disabled={submit.isPending} onClick={() => submit.mutate({ type: 'project' })}><i className="fas fa-plus" /> طلب مشروع جديد</button>
      </div>
      <div className="card-body">
        {isLoading && <p style={{ color: '#64748B' }}>جارٍ التحميل…</p>}
        {data && data.length === 0 && <p style={{ color: '#64748B', padding: 8 }}>لا طلبات بعد — استخدم زر «طلب مشروع جديد» أعلاه.</p>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data?.map((r) => (
            <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)' }}>
              <i className="fas fa-clipboard-list" style={{ color: 'var(--primary)', fontSize: 18 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{r.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{fmtDateTime(r.created_at)}</div>
              </div>
              <span className={`badge ${STATUS_CLS[r.status] ?? 'badge-gray'}`}>{r.status_label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** الإشعارات — بنود تحتاج انتباه العميل (فواتير/مواعيد/طلبات). */
export function NotificationsSection() {
  const { data, isLoading } = useClientNotifications();

  return (
    <div className="card" style={{ maxWidth: 820 }}>
      <div className="card-header"><h3 className="card-title">الإشعارات {data && data.count > 0 && <span className="badge badge-blue">{data.count}</span>}</h3></div>
      <div className="card-body">
        {isLoading && <p style={{ color: '#64748B' }}>جارٍ التحميل…</p>}
        {data && data.items.length === 0 && <p style={{ color: '#64748B', padding: 8 }}>لا إشعارات جديدة 🎉</p>}
        <div className="activity-list">
          {data?.items.map((n, i) => (
            <div key={i} className="activity-item">
              <div className={`activity-dot ${n.kind === 'warning' ? 'orange' : 'blue'}`} />
              <div className="activity-content">
                <p><i className={`fas ${n.icon}`} style={{ marginInlineEnd: 6, color: 'var(--text-3)' }} /><strong>{n.title}</strong> — {n.text}</p>
                {n.at && <span className="activity-time">{fmtDateTime(n.at)}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** الاجتماعات — مواعيد العميل القادمة (من بيانات البوابة). */
export function MeetingsSection({ appts }: { appts: Appointment[] }) {
  return (
    <div className="card" style={{ maxWidth: 820 }}>
      <div className="card-header"><h3 className="card-title">الاجتماعات القادمة</h3></div>
      <div className="card-body">
        {appts.length === 0 && <p style={{ color: '#64748B', padding: 8 }}>لا اجتماعات قادمة.</p>}
        {appts.map((a) => (
          <div key={a.id} className="meeting-mini-card">
            <div className="meeting-mini-date"><span className="meeting-mini-day">{dayOf(a.start_at)}</span><span className="meeting-mini-month">{monthOf(a.start_at)}</span></div>
            <div className="meeting-mini-info"><h4>{a.title}</h4><p><i className="fas fa-clock" /> {fmtDateTime(a.start_at)}</p><p><i className={`fas ${a.is_video ? 'fa-video' : 'fa-location-dot'}`} /> {a.is_video ? 'اجتماع مرئي' : 'حضوري'}</p></div>
            <span className="badge badge-blue">قادم</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/** الإعدادات — تعديل بيانات العميل الحقيقية. */
export function SettingsSection({ client }: { client: ClientInfo }) {
  const update = useUpdateClientProfile();
  const [name, setName] = useState(client.name ?? '');
  const [phone, setPhone] = useState(client.phone ?? '');
  const [company, setCompany] = useState(client.company ?? '');
  const [saved, setSaved] = useState(false);

  const save = () => {
    if (name.trim().length < 2) return;
    update.mutate({ full_name: name.trim(), phone: phone.trim() || null, company: company.trim() || null }, { onSuccess: () => { setSaved(true); setTimeout(() => setSaved(false), 2500); } });
  };

  return (
    <div className="card" style={{ maxWidth: 620 }}>
      <div className="card-header"><h3 className="card-title">الإعدادات — بياناتي</h3></div>
      <div className="card-body">
        <Field label="الاسم"><input value={name} onChange={(e) => setName(e.target.value)} style={inp} /></Field>
        <Field label="رقم الهاتف"><input value={phone} onChange={(e) => setPhone(e.target.value)} style={inp} placeholder="+965…" /></Field>
        <Field label="الشركة"><input value={company} onChange={(e) => setCompany(e.target.value)} style={inp} /></Field>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 16 }}>
          <button className="btn hero-ad-btn" style={{ padding: '9px 18px' }} disabled={update.isPending} onClick={save}>{update.isPending ? 'جارٍ الحفظ…' : 'حفظ البيانات'}</button>
          {saved && <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: 13 }}>✓ حُفظ</span>}
        </div>
      </div>
    </div>
  );
}

/** التواصل — راسل فريق معمار (يُنشئ استفسارًا واردًا). */
export function ChatSection() {
  const submit = useSubmitClientRequest();
  const [msg, setMsg] = useState('');
  const [sent, setSent] = useState(false);

  const send = () => {
    if (msg.trim().length < 2) return;
    submit.mutate({ type: 'inquiry', note: msg.trim() }, { onSuccess: () => { setSent(true); setMsg(''); setTimeout(() => setSent(false), 3000); } });
  };

  return (
    <div className="card" style={{ maxWidth: 620 }}>
      <div className="card-header"><h3 className="card-title">راسل فريق معمار</h3></div>
      <div className="card-body">
        <p style={{ color: 'var(--text-3)', fontSize: 13, marginBottom: 12 }}>اكتب رسالتك وسيتواصل معك فريقنا في أقرب وقت.</p>
        <textarea value={msg} onChange={(e) => setMsg(e.target.value)} rows={5} style={{ ...inp, resize: 'vertical' }} placeholder="رسالتك…" />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 12 }}>
          <button className="btn hero-ad-btn" style={{ padding: '9px 18px' }} disabled={submit.isPending || !msg.trim()} onClick={send}><i className="fas fa-paper-plane" /> إرسال</button>
          {sent && <span style={{ color: 'var(--success)', fontWeight: 700, fontSize: 13 }}>✓ أُرسلت — شكرًا لتواصلك.</span>}
        </div>
      </div>
    </div>
  );
}

/** صفحة الشركة — بيانات شركة العميل. */
export function CompanySection({ client }: { client: ClientInfo }) {
  return (
    <div className="card" style={{ maxWidth: 620 }}>
      <div className="card-header"><h3 className="card-title">صفحة الشركة</h3></div>
      <div className="card-body">
        {client.company ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: 14, background: 'var(--primary-gradient)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}><i className="fas fa-building-columns" /></div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 17 }}>{client.company}</div>
              <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 3 }}>ممثّلها: {client.name}{client.phone ? ` · ${client.phone}` : ''}</div>
            </div>
          </div>
        ) : (
          <p style={{ color: '#64748B' }}>لم تُضِف اسم شركتك بعد — أضِفه من «الإعدادات».</p>
        )}
      </div>
    </div>
  );
}

/** المنتدى — قيد الإعداد. */
export function ForumSection() {
  return (
    <div className="card" style={{ maxWidth: 620, textAlign: 'center' }}>
      <div className="card-body" style={{ padding: 40 }}>
        <div style={{ fontSize: 40, marginBottom: 10 }}>💬</div>
        <h3 style={{ margin: 0 }}>منتدى العملاء</h3>
        <p style={{ color: 'var(--text-3)', marginTop: 8 }}>قريبًا — مساحة لتبادل الخبرات مع عملاء معمار.</p>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

const inp: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontFamily: 'inherit', fontSize: 14, background: '#fff', color: 'var(--text)' };
