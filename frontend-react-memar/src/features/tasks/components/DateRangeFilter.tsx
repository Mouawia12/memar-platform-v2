import { useState, type CSSProperties } from 'react';

/** نطاق تاريخ مفتوح الطرفين — أي طرف فارغ يعني «بلا حدّ من تلك الجهة». */
export interface DateRange {
  from: string;
  to: string;
}

export const EMPTY_RANGE: DateRange = { from: '', to: '' };

/** تنسيق محلّي (YYYY-MM-DD) — لا نستعمل toISOString لأنها تُحوّل لتوقيت UTC فتزحف يومًا. */
function ymd(d: Date): string {
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');

  return `${d.getFullYear()}-${m}-${day}`;
}

function shift(d: Date, days: number): Date {
  const c = new Date(d);
  c.setDate(c.getDate() + days);

  return c;
}

/** أسبوع العمل في الكويت يبدأ الأحد — فنحسب «هذا الأسبوع» من الأحد إلى السبت. */
function weekRange(): DateRange {
  const now = new Date();
  const start = shift(now, -now.getDay());

  return { from: ymd(start), to: ymd(shift(start, 6)) };
}

const PRESETS: { key: string; label: string; range: () => DateRange }[] = [
  { key: 'all', label: 'الكل', range: () => EMPTY_RANGE },
  { key: 'today', label: 'اليوم', range: () => ({ from: ymd(new Date()), to: ymd(new Date()) }) },
  { key: 'week', label: 'الأسبوع', range: weekRange },
  {
    key: 'month',
    label: 'الشهر',
    range: () => {
      const n = new Date();

      return { from: ymd(new Date(n.getFullYear(), n.getMonth(), 1)), to: ymd(new Date(n.getFullYear(), n.getMonth() + 1, 0)) };
    },
  },
];

/** هل يقع اليوم داخل النطاق؟ العناصر بلا تاريخ تخرج من النتائج متى فُعّل الفلتر. */
export function inRange(day: string | null | undefined, r: DateRange): boolean {
  if (!r.from && !r.to) return true;
  if (!day) return false;
  const d = day.slice(0, 10);

  return (!r.from || d >= r.from) && (!r.to || d <= r.to);
}

/**
 * فلتر التاريخ (طلب أيمن 2026-08-26) — فترات جاهزة + نطاق مخصّص.
 * يُستعمل للوحتين: المهام حسب تاريخ الاستحقاق، والمتابعات حسب موعد التذكير.
 */
export function DateRangeFilter({ value, onChange, shown, total, inline = false }: { value: DateRange; onChange: (r: DateRange) => void; shown: number; total: number; inline?: boolean }) {
  const matched = PRESETS.find((p) => {
    const r = p.range();

    return r.from === value.from && r.to === value.to;
  });
  const active = matched?.key ?? 'custom';
  const [customOpen, setCustomOpen] = useState(false);
  const showCustom = customOpen || active === 'custom';

  return (
    <div style={inline ? { ...wrap, ...wrapInline } : wrap}>
      <span style={icon}>📅</span>
      {PRESETS.map((p) => (
        <button
          key={p.key}
          type="button"
          onClick={() => { setCustomOpen(false); onChange(p.range()); }}
          style={{ ...pill, ...(active === p.key && !customOpen ? pillOn : null) }}
        >
          {p.label}
        </button>
      ))}
      <button type="button" onClick={() => setCustomOpen(true)} style={{ ...pill, ...(showCustom ? pillOn : null) }}>مخصّص</button>

      {showCustom && (
        <span style={customBox}>
          <label style={lbl}>من</label>
          <input className="input" type="date" value={value.from} max={value.to || undefined} onChange={(e) => onChange({ ...value, from: e.target.value })} style={dateInput} />
          <label style={lbl}>إلى</label>
          <input className="input" type="date" value={value.to} min={value.from || undefined} onChange={(e) => onChange({ ...value, to: e.target.value })} style={dateInput} />
        </span>
      )}

      {(value.from || value.to) && (
        <span style={summary}>
          عرض <b>{shown.toLocaleString('ar')}</b> من {total.toLocaleString('ar')}
          <button type="button" onClick={() => { setCustomOpen(false); onChange(EMPTY_RANGE); }} style={clearBtn} title="إلغاء فلتر التاريخ">✕</button>
        </span>
      )}
    </div>
  );
}

const wrap: CSSProperties = { display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '14px' };
// داخل شريط أدوات موحّد: بلا توسيط ولا هامش سفلي — الشريط الأب يتكفّل بهما.
const wrapInline: CSSProperties = { justifyContent: 'flex-start', marginBottom: 0 };
const icon: CSSProperties = { fontSize: '14px', opacity: 0.7 };
const pill: CSSProperties = { padding: '6px 10px', borderRadius: '999px', border: '1.5px solid #E2E8F0', background: '#fff', color: '#5A6478', fontFamily: 'inherit', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer' };
const pillOn: CSSProperties = { background: '#EBF5FF', color: '#1B6CA8', borderColor: '#1B6CA8' };
const customBox: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '4px 9px' };
const lbl: CSSProperties = { fontSize: '12px', color: '#64748B', fontWeight: 700 };
const dateInput: CSSProperties = { padding: '5px 8px', fontSize: '12.5px', width: '138px' };
const summary: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#5A6478', background: '#F1F5F9', borderRadius: '999px', padding: '5px 6px 5px 12px' };
const clearBtn: CSSProperties = { width: '20px', height: '20px', borderRadius: '50%', border: 'none', background: '#DC4A3D', color: '#fff', fontSize: '11px', lineHeight: 1, cursor: 'pointer', fontFamily: 'inherit' };
