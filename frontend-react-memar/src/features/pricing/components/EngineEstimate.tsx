import { useState, type CSSProperties } from 'react';

import { useAiEstimate, usePricingOptions } from '../hooks/usePricing';
import { money } from '../types';

/**
 * المحرّك الرابع — التقدير المستند إلى مشاريع المكتب: يبحث عن مشاريع سابقة
 * من نوع المشروع نفسه، ويأخذ متوسّط ميزانياتها أساسًا. وإن كان مفتاح النموذج
 * اللغويّ مضبوطًا أضاف توصيةً مكتوبة؛ وبدونه يبقى التقدير قائمًا على بياناتك.
 */
export function EngineEstimate() {
  const { data: opts } = usePricingOptions();
  const run = useAiEstimate();
  const [desc, setDesc] = useState('');
  const [type, setType] = useState('فيلا');
  const [area, setArea] = useState('1200');

  const submit = () => run.mutate({ description: desc.trim() || undefined, building_type: type, area_sqm: Number(area) || undefined });
  const r = run.data;

  return (
    <div style={cols}>
      <div className="card" style={pane}>
        <b style={paneTitle}>🔎 تحليل المشروع</b>

        <label style={lbl}>وصف المشروع
          <textarea
            className="input"
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            placeholder="مثال: فيلا مساحة ١٢٠٠م² في السرة، ٣ طوابق، تصميم فاخر مع مسبح"
            style={{ minHeight: '90px' }}
          />
        </label>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <label style={lbl}>نوع المبنى
            <select className="input" value={type} onChange={(e) => setType(e.target.value)}>
              {opts?.building_types.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </label>
          <label style={lbl}>المساحة (م²)
            <input className="input" type="number" min={0} value={area} onChange={(e) => setArea(e.target.value)} />
          </label>
        </div>

        <button className="btn btn-primary" type="button" onClick={submit} disabled={run.isPending} style={{ width: '100%' }}>
          {run.isPending ? 'جارٍ التحليل…' : '⚡ حلّل واقترح سعرًا'}
        </button>
      </div>

      <div className="card" style={pane}>
        <b style={paneTitle}>📊 المشاريع المشابهة والتقدير</b>

        {!r && <p style={{ color: '#8A93A6', textAlign: 'center', marginTop: '40px', fontSize: '13px' }}>صِف المشروع واضغط «حلّل».</p>}

        {r && (
          <>
            {r.similar_projects.length > 0 ? (
              <>
                <div style={sectionLbl}>مشاريع سابقة من نوعه:</div>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
                  <tbody>
                    {r.similar_projects.map((p) => (
                      <tr key={p.id}>
                        <td style={ltd}>{p.name}</td>
                        <td style={ltdEnd}>{money(p.budget_kwd)}</td>
                      </tr>
                    ))}
                    <tr>
                      <td style={{ ...ltd, fontWeight: 800, color: '#0F2A4A' }}>المتوسّط</td>
                      <td style={{ ...ltdEnd, color: '#1B6CA8' }}>{money(r.average_kwd ?? 0)}</td>
                    </tr>
                  </tbody>
                </table>

                <div style={finalBox}>
                  <div style={{ fontSize: '11.5px', color: '#8A93A6' }}>السعر المقترح</div>
                  <div style={{ fontSize: '32px', fontWeight: 900, color: '#067A4B' }}>{money(r.suggested_price_kwd ?? 0)}</div>
                </div>
              </>
            ) : (
              <div style={emptyBox}>
                لا مشاريع سابقة من هذا النوع بميزانية مسجَّلة. التقدير يحتاج مرجعًا — سجّل ميزانيات مشاريعك
                في سجلّ المشاريع، وسيصير هذا المحرّك أدقّ مع كل مشروع.
              </div>
            )}

            <div style={noteBox}>
              <b style={{ fontSize: '12.5px', color: '#A5710F' }}>💡 التوصية:</b>
              <div style={{ fontSize: '12.5px', color: '#5A6478', marginTop: '5px', lineHeight: 1.9 }}>{r.note}</div>
            </div>

            {!r.has_ai && (
              <div style={aiNote}>
                التحليل مبنيّ على بياناتك وحدها — لم يُضبَط مفتاح النموذج اللغويّ في الخادم
                (<code>OPENAI_API_KEY</code>)، ومع ضبطه تُضاف توصيةٌ مكتوبة تقرأ وصف المشروع.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

const cols: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' };
const pane: CSSProperties = { padding: '18px' };
const paneTitle: CSSProperties = { fontSize: '15px', display: 'block', marginBottom: '14px', color: '#0F2A4A' };
const lbl: CSSProperties = { display: 'block', fontSize: '12.5px', color: '#5A6478', fontWeight: 700, marginBottom: '10px' };
const sectionLbl: CSSProperties = { fontSize: '12.5px', color: '#5A6478', fontWeight: 800, marginBottom: '8px' };
const ltd: CSSProperties = { padding: '7px 0', borderBottom: '1px solid #F3F5F9', color: '#5A6478' };
const ltdEnd: CSSProperties = { ...ltd, textAlign: 'left', fontWeight: 700, whiteSpace: 'nowrap' };
const finalBox: CSSProperties = { textAlign: 'center', background: '#F0FDF6', border: '1px solid #A7E3C4', borderRadius: '12px', padding: '16px', marginTop: '12px' };
const emptyBox: CSSProperties = { background: '#FAFBFD', border: '1px solid #EDF1F6', borderRadius: '10px', padding: '14px', fontSize: '12.5px', color: '#7A8394', lineHeight: 1.9 };
const noteBox: CSSProperties = { marginTop: '12px', background: '#FFFBF2', border: '1px solid #F0DFB8', borderRadius: '10px', padding: '11px 13px' };
const aiNote: CSSProperties = { marginTop: '10px', fontSize: '11.5px', color: '#8A93A6', lineHeight: 1.8 };
