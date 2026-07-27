import type { CSSProperties } from 'react';

import { STAGE_COLORS, STAGE_ORDER, TEMPERATURE_META, TEMPERATURE_ORDER, type Lead, type Stage, type Temperature } from '../types';

interface Props {
  lead: Lead;
  onEdit: (l: Lead) => void;
  onDelete: (l: Lead) => void;
  onMove: (l: Lead, stage: Stage) => void;
  onAddTask?: (l: Lead) => void;
  onHistory?: (l: Lead) => void;
  onSetTemp?: (l: Lead, t: Temperature) => void;
}

const money = (v: string) => `${Number(v).toLocaleString('ar', { minimumFractionDigits: 0 })} د.ك`;

export function LeadCard({ lead, onEdit, onDelete, onMove, onAddTask, onHistory, onSetTemp }: Props) {
  const idx = STAGE_ORDER.indexOf(lead.stage);
  const prev = idx > 0 ? STAGE_ORDER[idx - 1] : null;
  const next = idx < STAGE_ORDER.length - 1 ? STAGE_ORDER[idx + 1] : null;
  const temp = TEMPERATURE_META[lead.temperature];

  /** نقرة الحرارة تدور: ساخنة → دافئة → باردة → عادية (CRM-2). */
  const cycleTemp = () => {
    const i = TEMPERATURE_ORDER.indexOf(lead.temperature);
    onSetTemp?.(lead, TEMPERATURE_ORDER[(i + 1) % TEMPERATURE_ORDER.length]);
  };

  return (
    <div className="card" style={{ ...card, borderInlineStart: `4px solid ${STAGE_COLORS[lead.stage]}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '6px' }}>
        <b style={{ fontSize: '14px' }}>{lead.full_name}</b>
        <button
          type="button"
          onClick={cycleTemp}
          title={`الحرارة: ${temp.label} — اضغط للتغيير`}
          style={{ ...tempBadge, background: `${temp.color}18`, color: temp.color, border: `1px solid ${temp.color}40` }}
        >
          {temp.icon} {temp.label}
        </button>
      </div>

      <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '6px', lineHeight: 1.7 }}>
        {lead.company && <div>🏢 {lead.company}</div>}
        {lead.phone && <div dir="ltr" style={{ textAlign: 'right' }}>📞 {lead.phone}</div>}
        {Number(lead.deal_value_kwd) > 0 && <div style={{ color: '#059669', fontWeight: 700 }}>💰 {money(lead.deal_value_kwd)}</div>}
      </div>

      <div style={{ display: 'flex', gap: '4px', marginTop: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
        <button className="btn btn-sm" type="button" disabled={!prev} onClick={() => prev && onMove(lead, prev)} title="للخلف">‹</button>
        <button className="btn btn-sm" type="button" disabled={!next} onClick={() => next && onMove(lead, next)} title="للأمام">›</button>
        {onHistory && <button className="btn btn-sm" type="button" onClick={() => onHistory(lead)} title="سجل التعديلات">🕐</button>}
        {onAddTask && <button className="btn btn-sm" type="button" title="إسناد مهمة" onClick={() => onAddTask(lead)} style={{ background: '#274A78', color: '#fff' }}>+ مهمة</button>}
        <span style={{ flex: 1 }} />
        <button className="btn btn-sm" type="button" onClick={() => onEdit(lead)}>تعديل</button>
        <button className="btn btn-sm" type="button" style={{ color: '#ef4444' }} onClick={() => onDelete(lead)}>حذف</button>
      </div>
    </div>
  );
}

const card: CSSProperties = { padding: '12px', marginBottom: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' };
const tempBadge: CSSProperties = { fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '999px', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap', height: 'fit-content' };
