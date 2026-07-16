import type { ReactNode } from 'react';

interface Props {
  icon: string;
  color: 'blue' | 'green' | 'orange' | 'red' | 'purple';
  label: string;
  value: ReactNode;
  sub?: string;
}

/** بطاقة مؤشر (KPI) — تعيد بنية وأصناف الأصل (.kpi-card). */
export function KpiCard({ icon, color, label, value, sub }: Props) {
  return (
    <div className="kpi-card">
      <div className={`kpi-icon ${color}`}>{icon}</div>
      <div className="kpi-body">
        <div className="kpi-label">{label}</div>
        <div className="kpi-value">{value}</div>
        {sub && <div className="kpi-sub">{sub}</div>}
      </div>
    </div>
  );
}
