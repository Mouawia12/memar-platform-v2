import { type CSSProperties, type PointerEvent as ReactPointerEvent, useRef, useState } from 'react';

import { shortName } from '../../crm/types';
import { shortStamp } from './cardActivityStyles';
import type { TaskRef } from '../types';

interface Props {
  /** النسبة المحفوظة (0–100). */
  value: number;
  /** أخضر عند الإكمال بدل الأزرق. */
  done: boolean;
  /** صاحب آخر تعديل للنسبة ووقته — يظهران تحت الشريط. */
  by?: TaskRef | null;
  at?: string | null;
  /** حفظ النسبة الجديدة — إن غابت كان الشريط للعرض فقط. */
  onChange?: (pct: number) => void;
}

/** أقرب خطوة 5% — يجعل السحب باليد يعطي أرقامًا مرتّبة لا 63% و«67%». */
const STEP = 5;
const snap = (n: number) => Math.max(0, Math.min(100, Math.round(n / STEP) * STEP));

/**
 * شريط نسبة الإنجاز، قابل للتعديل من البطاقة مباشرةً (طلب أيمن 2026-08-29):
 * ضغطة على موضع في الشريط تضبط النسبة، والسحب يزحفها، وتُحفظ عند الإفلات.
 * تحته اسم آخر من عدّلها.
 *
 * البطاقة كلّها قابلة للسحب (dnd-kit) وللنقر (فتح التفاصيل)، فكل أحداث المؤشّر
 * هنا توقَف عن الصعود — وإلّا سحبتَ البطاقةَ بين الأعمدة وأنت تظنّ أنك تحرّك
 * الشريط، أو انفتحت نافذة التفاصيل فوق يدك.
 */
export function TaskProgressBar({ value, done, by, at, onChange }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [dragPct, setDragPct] = useState<number | null>(null);
  const [hover, setHover] = useState(false);
  const editable = !!onChange && !done; // المكتملة 100% دائمًا، فلا معنى لتحريكها
  const shown = dragPct ?? value;

  /** النسبة من موضع المؤشّر — الشريط يبدأ من اليمين (RTL). */
  const pctFromEvent = (clientX: number): number => {
    const box = trackRef.current?.getBoundingClientRect();
    if (!box || box.width === 0) return value;

    return snap(((box.right - clientX) / box.width) * 100);
  };

  const start = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!editable) return;
    e.stopPropagation();
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragPct(pctFromEvent(e.clientX));
  };

  const move = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragPct === null) return;
    e.stopPropagation();
    setDragPct(pctFromEvent(e.clientX));
  };

  const end = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (dragPct === null) return;
    e.stopPropagation();
    const next = dragPct;
    setDragPct(null);
    if (next !== value) onChange?.(next);
  };

  return (
    <div onClick={(e) => editable && e.stopPropagation()}>
      <div style={row}>
        <span style={{ ...pctLabel, color: dragPct !== null ? '#1B6CA8' : '#475569' }}>{shown}%</span>
        <div
          role={editable ? 'slider' : undefined}
          aria-label={editable ? 'نسبة الإنجاز' : undefined}
          aria-valuenow={editable ? shown : undefined}
          aria-valuemin={editable ? 0 : undefined}
          aria-valuemax={editable ? 100 : undefined}
          tabIndex={editable ? 0 : undefined}
          title={editable ? 'اضغط أو اسحب لتعديل نسبة الإنجاز' : undefined}
          onPointerDown={start}
          onPointerMove={move}
          onPointerUp={end}
          onPointerCancel={end}
          // الأسهم للوحة المفاتيح — الشريط عنصر تحكّم لا زينة.
          onKeyDown={(e) => {
            if (!editable) return;
            const delta = e.key === 'ArrowLeft' ? STEP : e.key === 'ArrowRight' ? -STEP : 0;
            if (!delta) return;
            e.preventDefault();
            e.stopPropagation();
            const next = snap(value + delta);
            if (next !== value) onChange?.(next);
          }}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          style={{ ...hit, ...(editable ? hitEditable : null) }}
        >
          {/* الشريط المرئي يبقى رفيعًا كما كان (7px)؛ الحشو الشفّاف حوله وحده
              هو ما يوسّع مساحة الضغط، فيسهل إصابته بالإصبع بلا سماكة ظاهرة. */}
          <div ref={trackRef} style={{ ...track, ...(dragPct !== null ? trackActive : null) }}>
            <span style={{ ...fill, width: `${shown}%`, background: done ? '#2D9B6F' : '#1B6CA8', transition: dragPct !== null ? 'none' : 'width .3s ease' }} />
            {/* المقبض يظهر عند التحويم أو السحب فقط — البطاقة الساكنة تبقى نظيفة. */}
            {editable && (hover || dragPct !== null) && <span style={{ ...knob, insetInlineStart: `calc(${shown}% - 4px)` }} />}
          </div>
        </div>
      </div>

      {by && (
        <div style={author} title={`آخر من عدّل النسبة: ${by.name}${at ? ` — ${shortStamp(at)}` : ''}`}>
          ✎ {shortName(by.name)}{at ? ` · ${shortStamp(at)}` : ''}
        </div>
      )}
    </div>
  );
}

const row: CSSProperties = { display: 'flex', alignItems: 'center', gap: '7px', marginTop: '2px' };
const pctLabel: CSSProperties = { fontSize: '10px', fontWeight: 900, minWidth: '30px' };
// حاوية الضغط: حشو رأسي شفّاف يجعل الهدف ~17px للإصبع والشريط 7px للعين.
const hit: CSSProperties = { flex: 1, padding: '5px 0', display: 'flex', alignItems: 'center' };
const hitEditable: CSSProperties = { cursor: 'ew-resize', touchAction: 'none' };
const track: CSSProperties = { position: 'relative', width: '100%', height: '7px', background: '#EEF2F7', borderRadius: '5px' };
// الشريط القابل للتعديل أعلى قليلًا ليسهل إصابته بالإصبع، ومؤشّره يقول إنه يُسحب.
const trackActive: CSSProperties = { boxShadow: '0 0 0 2px rgba(27,108,168,.22)' };
const fill: CSSProperties = { display: 'block', height: '100%', borderRadius: '5px' };
const knob: CSSProperties = { position: 'absolute', top: '50%', transform: 'translateY(-50%)', width: '9px', height: '9px', borderRadius: '50%', background: '#fff', border: '2px solid #1B6CA8', boxShadow: '0 1px 3px rgba(0,0,0,.25)', pointerEvents: 'none' };
const author: CSSProperties = { fontSize: '9px', color: '#94A3B8', fontWeight: 700, marginTop: '3px', paddingInlineStart: '37px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
