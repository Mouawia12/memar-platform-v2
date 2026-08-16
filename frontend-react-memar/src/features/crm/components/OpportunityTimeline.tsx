import { type CSSProperties, useState } from 'react';

import { useLogUpdate, useOpportunityUpdates, useQuickActions } from '../hooks/useCrm';

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

const chipWrap: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '6px' };
const chip: CSSProperties = { padding: '4px 11px', borderRadius: '16px', border: '1.5px solid', background: '#fff', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' };
const followRow: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center', marginTop: '8px' };
const preset: CSSProperties = { padding: '4px 10px', borderRadius: '8px', border: '1px solid #E4E8EF', background: '#F7F9FC', fontSize: '11.5px', fontWeight: 700, cursor: 'pointer', color: '#5A6478', fontFamily: 'inherit' };
const presetOn: CSSProperties = { background: '#274A78', borderColor: '#274A78', color: '#fff' };
const item: CSSProperties = { display: 'flex', gap: '10px', alignItems: 'flex-start' };
const dot: CSSProperties = { width: '8px', height: '8px', borderRadius: '50%', background: '#1B6CA8', marginTop: '5px', flexShrink: 0 };
