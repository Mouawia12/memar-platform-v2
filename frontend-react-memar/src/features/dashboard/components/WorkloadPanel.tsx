import { type CSSProperties } from 'react';
import { Link } from 'react-router-dom';

import { useWorkload } from '../../tasks/hooks/useTasks';

const AVATAR_COLORS = ['#274A78', '#1B6CA8', '#0F766E', '#B45309', '#6D28D9', '#BE185D'];
const colorFor = (id: number) => AVATAR_COLORS[id % AVATAR_COLORS.length];

/** حِمل العمل لكل موظف (DASH-1): من الأكثر انشغالًا، مع شريط توزيع الحالات والمتأخّرات. */
export function WorkloadPanel() {
  const { data, isLoading, isError } = useWorkload();

  return (
    <div className="card" style={{ padding: '18px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <h3 style={{ margin: 0, fontSize: '15px' }}>👥 حِمل عمل الفريق</h3>
        <Link to="/tasks" style={{ fontSize: '12px', color: '#1B6CA8', textDecoration: 'none' }}>لوحة المهام ←</Link>
      </div>

      {isLoading && <p style={{ fontSize: '13px', opacity: 0.6 }}>جارٍ التحميل…</p>}
      {isError && <p style={{ fontSize: '13px', color: '#ef4444' }}>تعذّر تحميل حِمل العمل.</p>}
      {data && data.length === 0 && <p style={{ fontSize: '13px', opacity: 0.6 }}>لا توجد مهام مُسندة بعد.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {data?.map((w) => {
          const total = Math.max(w.total, 1);
          const seg = (n: number) => `${(n / total) * 100}%`;

          return (
            <div key={w.user.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                <span style={{ ...avatar, background: colorFor(w.user.id) }}>{w.user.name.charAt(0)}</span>
                <span style={{ flex: 1, fontSize: '13.5px', fontWeight: 700, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.user.name}</span>
                <span style={{ fontSize: '12px', color: '#5A6478' }}>{w.open} مفتوحة / {w.total}</span>
                {w.overdue > 0 && <span style={overduePill}>⏰ {w.overdue} متأخّرة</span>}
              </div>
              {/* شريط توزيع الحالات */}
              <div style={bar} title={`قيد التنفيذ ${w.in_progress} · مراجعة ${w.review} · بانتظار ${w.todo} · منجزة ${w.done}`}>
                <span style={{ width: seg(w.in_progress), background: '#1B6CA8' }} />
                <span style={{ width: seg(w.review), background: '#7C3AED' }} />
                <span style={{ width: seg(w.todo), background: '#94A3B8' }} />
                <span style={{ width: seg(w.done), background: '#059669' }} />
              </div>
            </div>
          );
        })}
      </div>

      {data && data.length > 0 && (
        <div style={legend}>
          <Legend color="#1B6CA8" label="قيد التنفيذ" />
          <Legend color="#7C3AED" label="مراجعة" />
          <Legend color="#94A3B8" label="بانتظار" />
          <Legend color="#059669" label="منجزة" />
        </div>
      )}
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#5A6478' }}>
      <span style={{ width: '9px', height: '9px', borderRadius: '2px', background: color }} />{label}
    </span>
  );
}

const avatar: CSSProperties = { width: '26px', height: '26px', borderRadius: '50%', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 800, flexShrink: 0 };
const bar: CSSProperties = { display: 'flex', height: '9px', borderRadius: '5px', overflow: 'hidden', background: '#EEF2F7' };
const overduePill: CSSProperties = { fontSize: '10.5px', fontWeight: 700, color: '#DC2626', background: '#FEE2E2', padding: '2px 7px', borderRadius: '10px', whiteSpace: 'nowrap' };
const legend: CSSProperties = { display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid #F1F5F9' };
