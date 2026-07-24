import { type CSSProperties, useState } from 'react';

import { BADGE_COLORS, DEMO_GROUPS, type DemoAccount } from '../demoAccounts';

interface Props {
  onPick: (account: DemoAccount) => void;
  disabled?: boolean;
}

/** لوحة الحسابات التجريبية — مجموعات بشارات ملوّنة وزر طيّ (مطابقة للأصل). */
export function DemoAccountsPanel({ onPick, disabled }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [first, ...rest] = DEMO_GROUPS;

  return (
    <div style={box}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '11px', fontWeight: 700, color: '#1B6CA8' }}>🎯 حسابات تجريبية – مسماة بأسماء الموظفين</span>
        <button type="button" onClick={() => setExpanded((e) => !e)} style={toggleBtn}>
          {expanded ? '▲ طي' : '▼ عرض الكل'}
        </button>
      </div>

      <Group group={first} onPick={onPick} disabled={disabled} />
      {expanded && rest.map((g) => <Group key={g.title} group={g} onPick={onPick} disabled={disabled} />)}
    </div>
  );
}

function Group({ group, onPick, disabled }: { group: (typeof DEMO_GROUPS)[number]; onPick: (a: DemoAccount) => void; disabled?: boolean }) {
  return (
    <div style={{ marginBottom: '9px' }}>
      <div style={groupLabel}>{group.title}</div>
      <div style={grid}>
        {group.accounts.map((a) => {
          const c = BADGE_COLORS[a.tone];
          return (
            <button key={a.email} type="button" className="ml-demo" style={accountBtn} disabled={disabled} onClick={() => onPick(a)} title={a.email}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.label}</span>
              <span style={{ ...badge, background: c.bg, color: c.fg }}>{a.badge}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const box: CSSProperties = { background: '#F8FAFF', border: '1px solid #D0E4F5', borderRadius: '10px', padding: '11px', marginTop: '12px' };
const toggleBtn: CSSProperties = { fontSize: '10px', color: '#5A6478', cursor: 'pointer', background: 'none', border: '1px solid #E4E8EF', borderRadius: '5px', padding: '2px 8px', fontFamily: 'inherit' };
const groupLabel: CSSProperties = { fontSize: '10px', fontWeight: 700, color: '#5A6478', letterSpacing: '.4px', marginBottom: '5px', paddingBottom: '3px', borderBottom: '1px solid #E4E8EF' };
const grid: CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' };
const accountBtn: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', width: '100%', padding: '5px 9px', borderRadius: '6px', border: '1.5px solid transparent', background: '#fff', fontFamily: 'inherit', fontSize: '11px', cursor: 'pointer', color: '#1A1F2E', transition: 'all .18s' };
const badge: CSSProperties = { fontSize: '9px', padding: '2px 5px', borderRadius: '4px', flexShrink: 0, direction: 'ltr' };
