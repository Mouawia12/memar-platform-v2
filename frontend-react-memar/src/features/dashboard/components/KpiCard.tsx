import type { CSSProperties, ReactNode } from 'react';

export type KpiColor = 'blue' | 'green' | 'orange' | 'red' | 'purple';

const COLORS: Record<KpiColor, string> = {
  blue: '#1B6CA8',
  green: '#2D9B6F',
  orange: '#E8A838',
  red: '#DC4A3D',
  purple: '#7B2D8B',
};

interface Props {
  icon: string;
  color: KpiColor;
  label: string;
  value: ReactNode;
  sub?: ReactNode;
}

/** بطاقة مؤشر (KPI) — بحدّ جانبي ملوّن وأيقونة، مطابقة للوحة الـERP الأصلية. */
export function KpiCard({ icon, color, label, value, sub }: Props) {
  const c = COLORS[color];
  return (
    <div style={{ ...card, borderInlineEnd: `4px solid ${c}` }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={lbl}>{label}</div>
        <div style={val}>{value}</div>
        {sub !== undefined && <div style={{ fontSize: '11.5px', marginTop: '6px', color: '#5A6478' }}>{sub}</div>}
      </div>
      <div style={{ ...iconBox, background: `${c}1a` }}>{icon}</div>
    </div>
  );
}

const card: CSSProperties = { background: '#fff', border: '1px solid #E4E8EF', borderRadius: '12px', padding: '16px 18px', display: 'flex', alignItems: 'center', gap: '14px', boxShadow: '0 1px 3px rgba(0,0,0,.05)' };
const lbl: CSSProperties = { fontSize: '12.5px', color: '#5A6478', fontWeight: 600, marginBottom: '6px' };
const val: CSSProperties = { fontSize: '26px', fontWeight: 800, color: '#1A1F2E', lineHeight: 1.05 };
const iconBox: CSSProperties = { width: '46px', height: '46px', borderRadius: '12px', display: 'grid', placeItems: 'center', fontSize: '22px', flexShrink: 0 };
