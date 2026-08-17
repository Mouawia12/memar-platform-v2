import { type CSSProperties } from 'react';

import { useWorkload } from '../hooks/useTasks';

/** لون شريط حمل العمل حسب مستواه — طبق أصل progress-fill (blue/green/orange/red). */
const wlColor = (w: number) => (w >= 85 ? '#DC4A3D' : w >= 65 ? '#E8A838' : w >= 45 ? '#2D9B6F' : '#1B6CA8');

/**
 * جدول توزيع المهام على الفريق — طبق أصل «توزيع المهام على الفريق» في المرجع.
 * البيانات من نقطة النهاية /tasks/workload (مجمّعة في الباك اند): نشطة/مكتملة/متأخرة + القسم الغالب.
 */
export function TeamWorkloadTable() {
  const { data, isLoading } = useWorkload();
  const rows = data ?? [];
  const maxOpen = Math.max(1, ...rows.map((r) => r.open));

  return (
    <div style={card}>
      <div style={header}>
        <div style={title}>📊 توزيع المهام على الفريق</div>
        <div style={sub}>حمل العمل الحالي لكل مهندس</div>
      </div>
      <div style={{ padding: '8px 16px 16px', overflowX: 'auto' }}>
        <table style={table}>
          <thead>
            <tr style={{ borderBottom: '1px solid #E2E8F0' }}>
              {['المهندس', 'القسم', 'مهام نشطة', 'مكتملة', 'متأخرة', 'حمل العمل'].map((h) => <th key={h} style={th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const workload = Math.round((r.open / maxOpen) * 100);
              return (
                <tr key={r.user.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ ...td, fontWeight: 800 }}>{r.user.name}</td>
                  <td style={td}>{r.department ?? '—'}</td>
                  <td style={td}>{r.open}</td>
                  <td style={td}>{r.done}</td>
                  <td style={{ ...td, color: r.overdue > 0 ? '#DC4A3D' : '#64748B', fontWeight: r.overdue > 0 ? 700 : 400 }}>{r.overdue}</td>
                  <td style={td}>
                    <div style={barTrack}><div style={{ ...barFill, width: `${workload}%`, background: wlColor(workload) }} /></div>
                  </td>
                </tr>
              );
            })}
            {!isLoading && rows.length === 0 && <tr><td colSpan={6} style={{ ...td, textAlign: 'center', color: '#94A3B8' }}>لا مهام مُسنَدة بعد.</td></tr>}
            {isLoading && <tr><td colSpan={6} style={{ ...td, textAlign: 'center', color: '#94A3B8' }}>جارٍ التحميل…</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const card: CSSProperties = { background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', marginTop: '20px', boxShadow: '0 2px 8px rgba(27,108,168,.06)' };
const header: CSSProperties = { padding: '16px 18px 8px' };
const title: CSSProperties = { fontSize: '15px', fontWeight: 800, color: '#1E293B' };
const sub: CSSProperties = { fontSize: '12px', color: '#64748B', marginTop: '2px' };
const table: CSSProperties = { width: '100%', borderCollapse: 'collapse', fontSize: '13px', minWidth: '560px' };
const th: CSSProperties = { textAlign: 'start', padding: '10px', fontSize: '12px', fontWeight: 700, color: '#64748B', whiteSpace: 'nowrap' };
const td: CSSProperties = { padding: '11px 10px', color: '#1E293B', whiteSpace: 'nowrap' };
const barTrack: CSSProperties = { width: '120px', height: '8px', background: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' };
const barFill: CSSProperties = { height: '100%', borderRadius: '4px', transition: 'width .3s ease' };
