import type { ReactNode } from 'react';

/** إطار موحّد لأي رسم بياني: عنوان + مساحة رسم بارتفاع ثابت. */
export function ChartCard({ title, height = 240, children }: { title: string; height?: number; children: ReactNode }) {
  return (
    <div className="card" style={{ padding: '18px' }}>
      <h3 style={{ margin: '0 0 14px', fontSize: '15px' }}>{title}</h3>
      <div style={{ height: `${height}px`, position: 'relative' }}>{children}</div>
    </div>
  );
}
