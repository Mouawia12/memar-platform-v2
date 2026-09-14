import { type CSSProperties, useState } from 'react';

import { usePermission } from '../../auth/hooks/usePermission';
import { useApproveCrmTag, useCreateCrmTag, useCrmTags, useLogUpdate, useOpportunityUpdates, useQuickActions, useRejectCrmTag } from '../hooks/useCrm';
import { tagColor } from '../types';

interface Props {
  leadId: number;
  canManage?: boolean;
}

// خيارات موعد المتابعة السريعة (طلب أيمن) — تُحسب لحظة الإرسال.
const PRESETS: { label: string; days: number }[] = [
  { label: 'بعد 3 أيام', days: 3 },
  { label: 'بعد أسبوع', days: 7 },
  { label: 'بعد 10 أيام', days: 10 },
  { label: 'بعد أسبوعين', days: 14 },
];

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short' }) : '');
const iso = (days: number) => { const d = new Date(); d.setDate(d.getDate() + days); return d.toISOString(); };

/**
 * تسجيل التحديثات (اختصارات جاهزة + ملاحظة + موعد متابعة) وعرض تايملاين الفرصة (المرحلة 4).
 */
export function OpportunityTimeline({ leadId, canManage = true }: Props) {
  const { data: updates } = useOpportunityUpdates(leadId);
  const { data: actions } = useQuickActions();
  const log = useLogUpdate(leadId);
  const [note, setNote] = useState('');
  const [followup, setFollowup] = useState('');

  const quick = (key: string) => log.mutate({ action_key: key });
  const submitNote = () => {
    const n = note.trim();
    if (!n && !followup) return;
    log.mutate(
      { note: n || undefined, next_followup_at: followup || undefined },
      { onSuccess: () => { setNote(''); setFollowup(''); } },
    );
  };

  return (
    <div>
      {canManage && (
        <>
          {/* اختصارات جاهزة */}
          <div style={chipWrap}>
            {(actions ?? []).map((a) => (
              <button key={a.id} type="button" disabled={log.isPending} title={a.clears_urgent ? 'يُزيل حالة عاجل' : undefined}
                onClick={() => quick(a.key)}
                style={{ ...chip, borderColor: `${a.color ?? '#CBD5E1'}66`, color: a.color ?? '#334155' }}>
                {a.icon} {a.label}
              </button>
            ))}
          </div>

          {/* ملاحظة + موعد متابعة */}
          <textarea className="input" style={{ width: '100%', minHeight: '46px', marginTop: '8px' }}
            placeholder="اكتب تحديثًا/ملاحظة… (يُنشر باسمك)" value={note} onChange={(e) => setNote(e.target.value)} />
          <div style={followRow}>
            {PRESETS.map((p) => (
              <button key={p.days} type="button" onClick={() => setFollowup(iso(p.days))}
                style={{ ...preset, ...(followup === iso(p.days) ? presetOn : null) }}>{p.label}</button>
            ))}
            <input type="datetime-local" className="input" style={{ flex: 1, minWidth: '150px' }}
              onChange={(e) => setFollowup(e.target.value ? new Date(e.target.value).toISOString() : '')} />
          </div>
          {followup && <div style={{ fontSize: '11.5px', color: '#B45309', marginTop: '4px' }}>🔔 متابعة قادمة: {fmt(followup)}</div>}
          <button type="button" className="btn btn-primary" style={{ marginTop: '8px' }} disabled={log.isPending || (!note.trim() && !followup)} onClick={submitNote}>
            {log.isPending ? 'جارٍ…' : 'تسجيل التحديث'}
          </button>

          <TagRequestBox />
        </>
      )}

      {/* التايملاين */}
      <div style={{ marginTop: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {(updates ?? []).length === 0 && <p style={{ color: '#8A93A3', fontSize: '13px' }}>لا تحديثات بعد.</p>}
        {(updates ?? []).map((u) => (
          <div key={u.id} style={item}>
            <span style={dot} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px' }}>
                <b>{u.user ?? 'النظام'}</b>
                {u.note ? ` — ${u.note}` : ''}
                {!u.note && u.action_key && <span style={{ color: '#5A6478' }}> — {u.action_key}</span>}
              </div>
              <div style={{ fontSize: '10.5px', color: '#8A93A3' }}>
                {fmt(u.created_at)}{u.next_followup_at ? ` · 🔔 متابعة: ${fmt(u.next_followup_at)}` : ''}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * طلب/إضافة اختصار من داخل قسم «المتابعات وتحديثات الموظفين» (طلب أيمن 2026-08-22)
 * بدل نافذة مستقلة في شريط اللوحة: الموظف يُرسل طلبًا، والمدير يضيف مباشرة ويعتمد
 * الطلبات المعلّقة من هنا.
 */
function TagRequestBox() {
  // «المدير» = crm.delete (الموظف يملك crm.manage لكن ليس crm.delete).
  const isManager = usePermission('crm.delete');
  const { data: catalog } = useCrmTags();
  const createTag = useCreateCrmTag();
  const approveTag = useApproveCrmTag();
  const rejectTag = useRejectCrmTag();
  const [name, setName] = useState('');
  const [msg, setMsg] = useState('');

  const approved = (catalog ?? []).filter((t) => t.status === 'approved');
  const pending = (catalog ?? []).filter((t) => t.status === 'pending');

  const submit = () => {
    const v = name.trim();
    if (!v) return;
    createTag.mutate(v, {
      onSuccess: (t) => {
        setName('');
        setMsg(t.status === 'approved' ? `✓ أُضيف الاختصار «${t.name}»` : `📨 أُرسل «${t.name}» كطلب للإدارة`);
        window.setTimeout(() => setMsg(''), 2800);
      },
    });
  };

  return (
    <div style={tagBox}>
      <div style={tagTitle}>🏷️ الاختصارات — {isManager ? 'إضافة واعتماد' : 'طلب اختصار جديد'}</div>

      {approved.length > 0 && (
        <div style={{ ...chipWrap, marginBottom: '8px' }}>
          {approved.map((t) => {
            const c = t.color ?? tagColor(t.name);
            return <span key={t.id} style={{ ...chip, borderColor: c, color: c, cursor: 'default' }}>{t.name}</span>;
          })}
        </div>
      )}

      <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
        <input className="input" style={{ flex: 1, minWidth: 0 }} value={name} onChange={(e) => setName(e.target.value)}
          placeholder="مثال: حكومي" onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }} />
        <button type="button" className="btn" onClick={submit} disabled={createTag.isPending} style={{ whiteSpace: 'nowrap' }}>
          {isManager ? '➕ إضافة الاختصار' : '📨 إرسال طلب للإدارة'}
        </button>
      </div>
      <div style={tagNote}>
        {isManager
          ? 'الاختصار الذي تضيفه الإدارة يظهر مباشرة على السيستم.'
          : 'الاختصار الجديد يُسجَّل باسمك ويُرسل كطلب للإدارة — ولا يظهر إلا بعد اعتماده.'}
      </div>
      {msg && <div style={{ fontSize: '11.5px', fontWeight: 700, color: '#0F766E', marginTop: '6px' }}>{msg}</div>}

      {pending.length > 0 && (
        <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ fontSize: '11.5px', fontWeight: 900, color: '#8A5A08' }}>📨 بانتظار اعتماد الإدارة ({pending.length})</div>
          {pending.map((r) => (
            <div key={r.id} style={pendingRow}>
              <span style={{ fontSize: '12px', fontWeight: 800, color: '#92400E' }}>{r.name}</span>
              <span style={{ fontSize: '10.5px', color: '#A16207', fontWeight: 700 }}>👤 {r.requested_by ?? '—'}</span>
              {isManager ? (
                <span style={{ display: 'flex', gap: '6px', marginInlineStart: 'auto' }}>
                  <button type="button" onClick={() => approveTag.mutate(r.id)} style={{ ...miniBtn, background: '#0F766E', color: '#fff' }}>✔ اعتماد</button>
                  <button type="button" onClick={() => rejectTag.mutate(r.id)} style={{ ...miniBtn, background: '#FEE2E2', color: '#B91C1C' }}>✕ رفض</button>
                </span>
              ) : <span style={{ fontSize: '10.5px', color: '#A16207', fontWeight: 800, marginInlineStart: 'auto' }}>بانتظار الإدارة</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const tagBox: CSSProperties = { marginTop: '14px', paddingTop: '12px', borderTop: '1px dashed #E2E8F0' };
const tagTitle: CSSProperties = { fontSize: '12px', fontWeight: 800, color: '#1B6CA8', marginBottom: '8px' };
const tagNote: CSSProperties = { fontSize: '11.5px', color: '#5A6478', background: '#eaeff6', borderRadius: '8px', padding: '7px 10px', lineHeight: 1.6, marginTop: '8px' };
const pendingRow: CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', background: '#FFFBEB', border: '1px dashed #F59E0B', borderRadius: '10px', padding: '7px 10px' };
const miniBtn: CSSProperties = { border: 'none', borderRadius: '8px', padding: '4px 9px', fontSize: '10.5px', fontWeight: 900, cursor: 'pointer', fontFamily: 'inherit' };

const chipWrap: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '6px' };
const chip: CSSProperties = { padding: '4px 11px', borderRadius: '16px', border: '1.5px solid', background: '#fff', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' };
const followRow: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', marginTop: '8px' };
const preset: CSSProperties = { padding: '4px 10px', borderRadius: '8px', border: '1px solid #E4E8EF', background: '#F7F9FC', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', color: '#5A6478', fontFamily: 'inherit' };
const presetOn: CSSProperties = { background: '#274A78', borderColor: '#274A78', color: '#fff' };
const item: CSSProperties = { display: 'flex', gap: '10px', alignItems: 'flex-start' };
const dot: CSSProperties = { width: '8px', height: '8px', borderRadius: '50%', background: '#1B6CA8', marginTop: '5px', flexShrink: 0 };
