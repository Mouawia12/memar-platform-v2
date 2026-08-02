import type { CSSProperties } from 'react';

import { STAGE_COLOR_FALLBACK, TEMPERATURE_META, type Lead } from '../types';

interface Props {
  lead: Lead;
  onOpen: (l: Lead) => void;
  stageColor?: string;
}

const money = (v: string) => `${Number(v).toLocaleString('ar', { minimumFractionDigits: 0 })} د.ك`;
const AVATAR_COLORS = ['#6366f1', '#22c55e', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ef4444'];

/** بطاقة فرصة — طبق أصل بطاقة CRM: صورة + اسم، وسم الجهة، القيمة + الحرارة. */
export function LeadCard({ lead, onOpen, stageColor }: Props) {
  const temp = TEMPERATURE_META[lead.temperature];
  const avatarColor = AVATAR_COLORS[lead.id % AVATAR_COLORS.length];

  return (
    <div className="card" style={{ ...card, borderInlineStart: `4px solid ${stageColor ?? STAGE_COLOR_FALLBACK}` }} onClick={() => onOpen(lead)}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <div style={{ ...avatar, background: avatarColor }}>{lead.full_name.trim().charAt(0)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <b style={{ fontSize: '13.5px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.full_name}</b>
          {lead.company && <div style={{ fontSize: '11px', color: '#8A93A3', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>🏢 {lead.company}</div>}
        </div>
      </div>

      {(lead.effective_project_name || lead.project_name) && (
        <div style={projectTag} title={lead.effective_project_name ?? lead.project_name ?? ''}>
          🏗️ {lead.effective_project_name ?? lead.project_name}
        </div>
      )}

      <div style={metaRow}>
        {lead.phone && <span dir="ltr" style={{ ...metaItem, direction: 'ltr' }}>📞 {lead.phone}</span>}
        {lead.owner && <span style={metaItem} title={`المسؤول: ${lead.owner.name}`}>👤 {lead.owner.name}</span>}
      </div>

      <div style={footer}>
        <span style={{ ...tempPill, background: `${temp.color}18`, color: temp.color }}>{temp.icon} {temp.label}</span>
        {Number(lead.deal_value_kwd) > 0 && <b style={{ fontSize: '13px', color: '#059669' }}>{money(lead.deal_value_kwd)}</b>}
      </div>
    </div>
  );
}

const card: CSSProperties = { padding: '10px 11px', marginBottom: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.08)', cursor: 'pointer' };
const avatar: CSSProperties = { width: '32px', height: '32px', borderRadius: '50%', display: 'grid', placeItems: 'center', color: '#fff', fontWeight: 800, fontSize: '14px', flexShrink: 0 };
const tempPill: CSSProperties = { fontSize: '11px', fontWeight: 700, padding: '2px 9px', borderRadius: '999px' };
const projectTag: CSSProperties = { marginTop: '6px', fontSize: '11.5px', color: '#274A78', background: '#EEF3FA', borderRadius: '6px', padding: '3px 8px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
// صفّ بيانات مضغوط: هاتف + المسؤول جنبًا إلى جنب لملء الكارت بمعلومات مفيدة.
const metaRow: CSSProperties = { display: 'flex', flexWrap: 'wrap', gap: '4px 12px', marginTop: '6px', fontSize: '11.5px', color: '#5A6478' };
const metaItem: CSSProperties = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' };
const footer: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '7px', paddingTop: '7px', borderTop: '1px solid #F1F5F9' };
