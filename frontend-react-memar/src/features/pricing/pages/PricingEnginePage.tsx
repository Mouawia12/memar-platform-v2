import { useState, type CSSProperties } from 'react';

import { QuotationsPage } from '../../quotations/pages/QuotationsPage';
import { EngineCalculator } from '../components/EngineCalculator';
import { EngineCostBased } from '../components/EngineCostBased';
import { EngineEstimate } from '../components/EngineEstimate';
import { EnginePackages } from '../components/EnginePackages';

/**
 * محرّك التسعير — مدخلٌ واحد في القائمة الجانبية، وبداخله أنواع التسعير
 * تُختار بالضغط (طلب أيمن 2026-09-14: «واحدة فقط اسمها محرك التسعير ولما
 * ادخل اجد ٤ انواع للتسعير وانا اختار النوع»).
 *
 * وعروض الأسعار تبقى تبويبًا هنا: كانت الصفحةَ الوحيدة خلف /pricing، فلو
 * أزحناها بلا بديلٍ لانقطع الطريق إليها من النظام كلّه.
 */
const ENGINES = [
  { key: 'calc', icon: '📐', title: 'الحاسبة الهندسية', hint: 'السعر من نوع المشروع ومساحته وطوابقه وخدماته' },
  { key: 'packages', icon: '📦', title: 'باقات الخدمات', hint: 'خدمات مجمَّعة بسعرٍ واحد أقلّ من مجموعها' },
  { key: 'cost', icon: '💰', title: 'التسعير حسب التكلفة', hint: 'ساعات الفريق وتكاليفه، ثم هامش الربح' },
  { key: 'estimate', icon: '⚡', title: 'التقدير من مشاريعك', hint: 'متوسّط مشاريعك السابقة من النوع نفسه' },
  { key: 'quotations', icon: '📋', title: 'عروض الأسعار', hint: 'العروض المُصدَرة ومتابعة حالتها' },
] as const;

type EngineKey = (typeof ENGINES)[number]['key'];

export function PricingEnginePage() {
  const [engine, setEngine] = useState<EngineKey>('calc');
  const active = ENGINES.find((e) => e.key === engine)!;

  return (
    <div>
      <div style={{ marginBottom: '16px' }}>
        <h1 style={{ margin: 0 }}>محرك التسعير</h1>
        <p style={sub}>اختر طريقة التسعير المناسبة للحالة — لكلٍّ منها مدخلاتها ومنطقها</p>
      </div>

      {/* اختيار النوع: بطاقاتٌ تشرح متى يُستعمل كلٌّ منها، لا أرقامًا مبهمة */}
      <div style={picker}>
        {ENGINES.map((e) => (
          <button
            key={e.key}
            type="button"
            onClick={() => setEngine(e.key)}
            style={{ ...engineBtn, ...(engine === e.key ? engineOn : null) }}
          >
            <span style={{ fontSize: '20px' }}>{e.icon}</span>
            <span style={{ fontWeight: 800, fontSize: '13px' }}>{e.title}</span>
            <span style={{ fontSize: '11px', opacity: 0.75, lineHeight: 1.5 }}>{e.hint}</span>
          </button>
        ))}
      </div>

      <div style={activeHead}>
        <b style={{ fontSize: '15px', color: '#0F2A4A' }}>{active.icon} {active.title}</b>
        <span style={{ fontSize: '12px', color: '#8A93A6' }}>{active.hint}</span>
      </div>

      {engine === 'calc' && <EngineCalculator />}
      {engine === 'packages' && <EnginePackages />}
      {engine === 'cost' && <EngineCostBased />}
      {engine === 'estimate' && <EngineEstimate />}
      {engine === 'quotations' && <QuotationsPage />}
    </div>
  );
}

const sub: CSSProperties = { margin: '4px 0 0', fontSize: '13px', color: '#8A93A6' };
const picker: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: '10px', marginBottom: '18px' };
const engineBtn: CSSProperties = {
  display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '4px',
  padding: '13px 15px', borderRadius: '12px', border: '1.5px solid #E7ECF3', background: '#fff',
  color: '#5A6478', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'start',
};
const engineOn: CSSProperties = { borderColor: '#1B6CA8', background: '#F2F8FD', color: '#1B6CA8', boxShadow: '0 0 0 1.5px rgba(27,108,168,.18)' };
const activeHead: CSSProperties = { display: 'flex', alignItems: 'baseline', gap: '10px', flexWrap: 'wrap', marginBottom: '12px' };
