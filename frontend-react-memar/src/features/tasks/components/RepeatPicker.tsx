import { type CSSProperties } from 'react';

/** حدّ كل وحدة — مطابق لـ LeadReminder::MAX_PER_UNIT في الخادم. */
const MAX: Record<string, number> = { d: 365, w: 52, m: 24 };

/** طول الوحدة بالأيام — للمقارنة بين الدوريات فقط. */
const UNIT_DAYS: Record<string, number> = { d: 1, w: 7, m: 30 };

/** دوريات مسمّاة قديمة محفوظة في متابعات سابقة — تُقرأ ولا تُكتب. */
const LEGACY: Record<string, [number, string]> = { '3d': [3, 'd'], week: [7, 'd'], month: [30, 'd'] };

/** تفكيك الدورية إلى [العدد، الوحدة]، أو null إن لم تكن دوريّة صالحة. */
export function repeatParts(value?: string | null): [number, string] | null {
  if (!value) return null;
  if (LEGACY[value]) return LEGACY[value];
  const m = /^([1-9][0-9]{0,2})([dwm])$/.exec(value);
  if (!m) return null;
  const count = Number(m[1]);
  const unit = m[2];

  return count >= 1 && count <= MAX[unit] ? [count, unit] : null;
}

/** مقدار الدورية بالأيام تقريبًا — للمقارنة لا للجدولة. */
export function repeatDays(value?: string | null): number {
  const p = repeatParts(value);

  return p ? p[0] * UNIT_DAYS[p[1]] : 0;
}

/** اسم الوحدة مصرَّفًا مع العدد: «3 أيام» · «أسبوعان» · «5 أشهر». */
function unitWord(count: number, unit: string): string {
  const forms: Record<string, [string, string, string]> = {
    d: ['يوم', 'يومين', 'أيام'],
    w: ['أسبوع', 'أسبوعين', 'أسابيع'],
    m: ['شهر', 'شهرين', 'أشهر'],
  };
  const [one, two, many] = forms[unit] ?? forms.d;
  if (count === 1) return one;
  if (count === 2) return two;

  return count <= 10 ? many : one;
}

/** وصف عربيّ للدورية: «أسبوعيًا» · «كل أسبوعين» · «كل 5 أشهر». */
export function repeatLabel(value?: string | null): string {
  const p = repeatParts(value);
  if (!p) return 'بلا تكرار';
  const [count, unit] = p;
  if (count === 1 && unit === 'd') return 'يوميًا';
  if (count === 1 && unit === 'w') return 'أسبوعيًا';
  if (count === 1 && unit === 'm') return 'شهريًا';
  if (count === 7 && unit === 'd') return 'أسبوعيًا';
  if (count === 30 && unit === 'd') return 'شهريًا';
  if (count === 12 && unit === 'm') return 'سنويًا';

  return `كل ${count === 2 ? '' : `${count} `}${unitWord(count, unit)}`;
}

/**
 * دورية المتابعة: مؤقّتٌ يضبطه المستخدم بنفسه — عدد + وحدة (أيام · أسابيع ·
 * أشهر) بلا قائمة خيارات جاهزة (طلب أيمن 2026-08-30). الوحدة تُحفظ كما اختيرت
 * لا تُحوَّل أيامًا، فتقع «كل شهرين» في اليوم نفسه من الشهر. وساعة المتابعة
 * المختارة هي ساعة الدورة التالية (يضبطها الخادم).
 * القيمة المخزَّنة نصّ: '' بلا تكرار، أو «N» + d/w/m.
 */
export function RepeatPicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const parts = repeatParts(value);
  const on = parts !== null;
  const [count, unit] = parts ?? [1, 'w'];

  const set = (n: number, u: string) => onChange(`${Math.max(1, Math.min(MAX[u], Math.round(n) || 1))}${u}`);

  return (
    <div style={wrap}>
      <label style={toggle}>
        <input
          type="checkbox"
          checked={on}
          onChange={(e) => onChange(e.target.checked ? '1w' : '')}
          style={{ accentColor: '#1B6CA8', width: '15px', height: '15px' }}
        />
        <span>{on ? 'تتكرّر' : 'بلا تكرار'}</span>
      </label>

      {on && (
        <span style={everyBox}>
          <span style={everyWord}>كل</span>
          <input
            className="input"
            type="number"
            min={1}
            max={MAX[unit]}
            value={count}
            // الحقل الفارغ أثناء الكتابة يُترك كما هو، ويُضبط عند الخروج منه.
            onChange={(e) => e.target.value !== '' && set(Number(e.target.value), unit)}
            onBlur={(e) => set(Number(e.target.value), unit)}
            style={numInput}
            aria-label="عدد وحدات التكرار"
          />
          <select
            className="input"
            value={unit}
            onChange={(e) => set(count, e.target.value)}
            style={unitInput}
            aria-label="وحدة التكرار"
          >
            <option value="d">{unitWord(count, 'd')}</option>
            <option value="w">{unitWord(count, 'w')}</option>
            <option value="m">{unitWord(count, 'm')}</option>
          </select>
        </span>
      )}
    </div>
  );
}

const wrap: CSSProperties = { display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap', marginTop: '6px' };
const toggle: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '7px', fontSize: '13px', color: '#334155', cursor: 'pointer', whiteSpace: 'nowrap' };
const everyBox: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '9px', padding: '4px 9px' };
const everyWord: CSSProperties = { fontSize: '12.5px', fontWeight: 700, color: '#475569' };
const numInput: CSSProperties = { width: '68px', textAlign: 'center', fontWeight: 800, padding: '4px 6px', marginTop: 0 };
const unitInput: CSSProperties = { width: '90px', padding: '4px 6px', marginTop: 0, fontWeight: 700 };
