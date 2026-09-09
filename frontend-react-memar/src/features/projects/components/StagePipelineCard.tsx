import type { CSSProperties } from 'react';

import { useStagePipeline } from '../hooks/useProjectStages';

/**
 * مراحل المشاريع (طلب أيمن 2026-09-09): أين تقف مشاريع المكتب الآن.
 *
 * لكل مشروع مراحله الخاصّة بحسب قالبه، فلا يصحّ التجميع بأسماء المراحل — كلّ
 * قالبٍ يسمّيها بغير اسم. التجميع هنا بـ«المرحلة العامّة»: تصنيفٌ موحّد تحمله
 * كل مرحلة مهما كان اسمها، فتعمل البطاقة مع القوالب الستّة ومع أي مرحلة
 * يضيفها المكتب يدويًّا.
 */
export function StagePipelineCard() {
  const { data, isLoading } = useStagePipeline();
  const total = (data ?? []).reduce((sum, c) => sum + c.count, 0);

  return (
    <div className="card" style={{ padding: '16px 18px', marginTop: '16px' }}>
      <div style={{ marginBottom: '14px' }}>
        <h2 style={{ margin: 0, fontSize: '15.5px' }}>🧭 مراحل المشاريع</h2>
        <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#8A93A3' }}>
          توزيع المشاريع الجارية حسب مرحلتها الحالية — {total} مشروع قيد العمل
        </p>
      </div>

      {isLoading && <p style={{ fontSize: '13px', color: '#8A93A3' }}>جارٍ التحميل…</p>}

      <div style={row}>
        {data?.map((c) => (
          <div
            key={c.phase}
            style={{ ...cell, borderColor: `${c.color}55`, background: `${c.color}0f` }}
            title={c.count === 0 ? `لا مشروع في مرحلة ${c.label}` : `${c.count} مشروع في مرحلة ${c.label}`}
          >
            <div style={{ ...cellLabel, color: c.color }}>{c.label}</div>
            <div style={{ ...cellCount, color: c.count > 0 ? '#0F2A4A' : '#C0C7D2' }}>{c.count}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

const row: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '10px' };
const cell: CSSProperties = { border: '1.5px solid', borderRadius: '11px', padding: '14px 10px', textAlign: 'center' };
const cellLabel: CSSProperties = { fontSize: '13px', fontWeight: 800, marginBottom: '6px' };
const cellCount: CSSProperties = { fontSize: '22px', fontWeight: 900, lineHeight: 1, fontVariantNumeric: 'tabular-nums' };
