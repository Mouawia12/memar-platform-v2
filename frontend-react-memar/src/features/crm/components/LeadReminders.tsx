import { type CSSProperties, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { crmApi } from '../api/crmApi';

const fmt = (iso: string | null) => (iso ? new Date(iso).toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short' }) : '');

/**
 * تذكيرات متابعة الفرصة (اجتماع 2026-08-05): إضافة تذكير بتاريخ ووقت + ملاحظة،
 * وقائمة التذكيرات (المستحقّ منها بارز)، مع إنجاز/حذف. يظهر التنبيه على كرت الفرصة.
 */
export function LeadReminders({ leadId }: { leadId: number }) {
  const qc = useQueryClient();
  const { data: reminders = [] } = useQuery({ queryKey: ['lead-reminders', leadId], queryFn: () => crmApi.reminders(leadId) });
  const [at, setAt] = useState('');
  const [note, setNote] = useState('');

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ['lead-reminders', leadId] });
    qc.invalidateQueries({ queryKey: ['crm-leads'] }); // يحدّث تنبيه الكرت على اللوحة
  };
  const add = useMutation({ mutationFn: () => crmApi.addReminder(leadId, { remind_at: at, note: note.trim() || undefined }), onSuccess: () => { setAt(''); setNote(''); refresh(); } });
  const toggle = useMutation({ mutationFn: (id: number) => crmApi.toggleReminder(id), onSuccess: refresh });
  const del = useMutation({ mutationFn: (id: number) => crmApi.deleteReminder(id), onSuccess: refresh });

  return (
    <div>
      <div style={addRow}>
        <input type="datetime-local" className="input" value={at} onChange={(e) => setAt(e.target.value)} style={{ flex: '0 0 auto' }} />
        <input className="input" placeholder="ملاحظة التذكير (اختياري)…" value={note} onChange={(e) => setNote(e.target.value)} style={{ flex: 1, minWidth: '120px' }} />
        <button className="btn btn-primary btn-sm" type="button" disabled={!at || add.isPending} onClick={() => add.mutate()}>
          <i className="fas fa-bell" /> أضف تذكيرًا
        </button>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
        {reminders.length === 0 && <span style={{ fontSize: '12px', color: '#8A93A3' }}>لا تذكيرات — أضِف واحدًا لتُنبّه عند موعد المتابعة.</span>}
        {reminders.map((r) => (
          <div key={r.id} style={{ ...row, ...(r.due ? rowDue : r.done ? rowDone : null) }}>
            <button type="button" title={r.done ? 'إعادة فتح' : 'تم'} onClick={() => toggle.mutate(r.id)} style={{ ...check, ...(r.done ? checkOn : null) }}>{r.done ? '✓' : ''}</button>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '13px', textDecoration: r.done ? 'line-through' : 'none', opacity: r.done ? 0.6 : 1 }}>
                {r.due && !r.done && <span style={dueTag}><i className="fas fa-bell" /> مستحق</span>}
                {r.note || 'تذكير متابعة'}
              </div>
              <div style={{ fontSize: '10.5px', color: '#8A93A3' }}><i className="fas fa-clock" /> {fmt(r.remind_at)}{r.creator ? ` · ${r.creator}` : ''}</div>
            </div>
            <button type="button" title="حذف" onClick={() => del.mutate(r.id)} style={delBtn}>🗑</button>
          </div>
        ))}
      </div>
    </div>
  );
}

const addRow: CSSProperties = { display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' };
const row: CSSProperties = { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '9px', background: '#F7F9FC', border: '1px solid #EEF2F7' };
const rowDue: CSSProperties = { background: 'rgba(220,38,38,.05)', borderColor: '#FCA5A5' };
const rowDone: CSSProperties = { opacity: 0.7 };
const check: CSSProperties = { flexShrink: 0, width: '20px', height: '20px', borderRadius: '6px', border: '1.5px solid #CBD5E1', background: '#fff', cursor: 'pointer', fontSize: '11px', display: 'grid', placeItems: 'center', color: '#fff', padding: 0 };
const checkOn: CSSProperties = { background: '#059669', borderColor: '#059669' };
const dueTag: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '4px', background: '#DC2626', color: '#fff', fontSize: '10px', fontWeight: 800, padding: '1px 7px', borderRadius: '999px', marginInlineEnd: '6px' };
const delBtn: CSSProperties = { flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', opacity: 0.4 };
