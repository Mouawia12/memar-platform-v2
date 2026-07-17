import type { CSSProperties } from 'react';

import { STAGE_COLORS, STAGE_ORDER, type Lead, type Stage } from '../types';

interface Props {
  lead: Lead;
  onEdit: (l: Lead) => void;
  onDelete: (l: Lead) => void;
  onMove: (l: Lead, stage: Stage) => void;
}

const money = (v: string) => `${Number(v).toLocaleString('ar', { minimumFractionDigits: 0 })} د.ك`;

export function LeadCard({ lead, onEdit, onDelete, onMove }: Props) {
  const idx = STAGE_ORDER.indexOf(lead.stage);
  const prev = idx > 0 ? STAGE_ORDER[idx - 1] : null;
  const next = idx < STAGE_ORDER.length - 1 ? STAGE_ORDER[idx + 1] : null;

  return (
    <div className="card" style={{ ...card, borderInlineStart: `4px solid ${STAGE_COLORS[lead.stage]}` }}>
      <b style={{ fontSize: '14px' }}>{lead.full_name}</b>

      <div style={{ fontSize: '12px', opacity: 0.7, marginTop: '6px', lineHeight: 1.7 }}>
        {lead.company && <div>🏢 {lead.company}</div>}
        {lead.phone && <div dir="ltr" style={{ textAlign: 'right' }}>📞 {lead.phone}</div>}
        {Number(lead.deal_value_kwd) > 0 && <div style={{ color: '#059669', fontWeight: 700 }}>💰 {money(lead.deal_value_kwd)}</div>}
      </div>

      <div style={{ display: 'flex', gap: '4px', marginTop: '10px', alignItems: 'center' }}>
        <button className="btn btn-sm" type="button" disabled={!prev} onClick={() => prev && onMove(lead, prev)} title="للخلف">‹</button>
        <button className="btn btn-sm" type="button" disabled={!next} onClick={() => next && onMove(lead, next)} title="للأمام">›</button>
        <span style={{ flex: 1 }} />
        <button className="btn btn-sm" type="button" onClick={() => onEdit(lead)}>تعديل</button>
        <button className="btn btn-sm" type="button" style={{ color: '#ef4444' }} onClick={() => onDelete(lead)}>حذف</button>
      </div>
    </div>
  );
}

const card: CSSProperties = { padding: '12px', marginBottom: '10px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)' };
