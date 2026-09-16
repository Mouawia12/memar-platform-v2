import { type CSSProperties, useEffect, useState } from 'react';

import { SLA_PRESETS, clockLabel, slaLabel, type Sla } from './model';

/**
 * سكة المهلة الرأسية على حافّة البطاقة: تسع شرائح تُقرأ من الأعلى إلى الأسفل
 * كرملٍ ينسكب — الوقت المستهلك يُطفأ من الأعلى، والشريحة الحدّية تومض، والأخيرة
 * الحمراء آخر ما يبقى. عند انتهاء المهلة أو «بدون مهلة» تتحوّل إلى موجة إنذار حمراء.
 */
const STRIPS = 9;
const IDLE = '#E7ECF2';
const ALARM = '#C0382C';
const LADDER = ['#2D9B6F', '#3AA878', '#6FB958', '#C6C22E', '#E8A838', '#F0932B', '#F97316', '#E4573D', '#DC4A3D'];
const ALARM_STEP_MS = 85;
const ALARM_STEPS = STRIPS * 2 + 2;

// ساعة إنذار واحدة مشتركة: كل البطاقات المنذِرة تومض معًا بتكلفة مؤقّت واحد.
const listeners = new Set<(step: number) => void>();
let timer: number | null = null;
let cursor = 0;

function motionSuppressed(): boolean {
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  return reduced || !!document.querySelector('.crmx.no-blink');
}

function subscribeAlarm(fn: (step: number) => void): () => void {
  listeners.add(fn);
  fn(motionSuppressed() ? -1 : cursor);
  if (timer === null) {
    timer = window.setInterval(() => {
      cursor = (cursor + 1) % ALARM_STEPS;
      const step = motionSuppressed() ? -1 : cursor;
      listeners.forEach((l) => l(step));
    }, ALARM_STEP_MS);
  }
  return () => {
    listeners.delete(fn);
    if (listeners.size === 0 && timer !== null) {
      window.clearInterval(timer);
      timer = null;
      cursor = 0;
    }
  };
}

function useAlarmWave(active: boolean): number {
  const [step, setStep] = useState(-1);
  useEffect(() => (active ? subscribeAlarm(setStep) : undefined), [active]);
  return active ? step : -1;
}

/** موجة الإنذار: تضيء حمراء من الأسفل للأعلى ثم تنطفئ من الأعلى للأسفل. */
function alarmLit(index: number, step: number): boolean {
  if (step < 0) return true;
  if (step < STRIPS) return index >= STRIPS - 1 - step;
  return index >= step - STRIPS + 1;
}

function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return undefined;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [active]);
  return now;
}

interface RailProps {
  sla: Sla | null;
  /** طلبٌ قائم بلا مهلة — «الآن». */
  openEnded: boolean;
  /** رُدَّ عليه أو لا شيء قائم — تهدأ السكة. */
  dormant: boolean;
}

export function SlaRail({ sla, openEnded, dormant }: RailProps) {
  const now = useNow(!!sla && !dormant);
  const remaining = sla ? Math.max(0, sla.deadlineAt - now) : 0;
  const expired = !!sla && remaining <= 0;
  const quiet = dormant || (!sla && !openEnded);
  const alarming = !quiet && (expired || openEnded);
  const step = useAlarmWave(alarming);

  const elapsed = sla ? 1 - remaining / sla.windowMs : 0;
  const active = quiet || !sla || expired ? -1 : Math.min(STRIPS - 1, Math.max(0, Math.floor(elapsed * STRIPS)));
  const color = quiet ? IDLE : expired ? ALARM : sla ? LADDER[Math.max(active, 0)] : '#DC4A3D';
  const blink = sla ? Math.min(1.6, Math.max(0.85, sla.windowMs / STRIPS / 1000 / 14)) : 1.2;

  const title = quiet
    ? 'لا توجد مهلة جارية'
    : sla
      ? expired ? 'انتهى وقت الرد — مطلوب إجراء فوري' : `متبقٍ ${clockLabel(remaining)} من مهلة الرد`
      : 'طلب تحديث بدون مهلة — مطلوب الآن';

  return (
    <div className="crmx-rail" style={{ backgroundColor: quiet ? '#F7F9FC' : `${color}0F` }} title={title} role="img" aria-label={title}>
      <div className="crmx-rail-content">
        {alarming ? (
          <i className="fa-solid fa-bell x-bell" style={{ fontSize: 10, color: expired ? ALARM : '#DC4A3D' }} aria-hidden />
        ) : sla && !quiet ? (
          <span className="x-timer-pulse" style={{ width: 6, height: 6, borderRadius: '50%', background: color }} aria-hidden />
        ) : <span />}
        {quiet ? null : (
          <span className={`crmx-rail-clock num${!sla ? ' x-timer-pulse' : ''}`} style={{ color }} aria-hidden>
            {sla ? (expired ? '00:00' : clockLabel(remaining)) : 'الآن'}
          </span>
        )}
      </div>
      <div className="crmx-strips" aria-hidden>
        {Array.from({ length: STRIPS }, (_, i) => {
          if (alarming) {
            const lit = alarmLit(i, step);
            return <span key={i} style={{ background: lit ? ALARM : IDLE, opacity: lit ? 1 : 0.85 }} />;
          }
          if (quiet || !sla) return <span key={i} style={{ background: IDLE, opacity: 0.9 }} />;
          if (i === active) {
            return <span key={i} className="x-slice" style={{ '--slice-color': LADDER[i], '--slice-blink': `${blink}s` } as CSSProperties} />;
          }
          return <span key={i} style={{ background: i < active ? IDLE : LADDER[i], opacity: i < active ? 0.9 : 0.95 }} />;
        })}
      </div>
    </div>
  );
}

/** أزرار المهلة — نقرة واحدة تُرسل. «بدون مهلة» يظهر للموظف «مطلوب الآن». */
export function SlaQuickPicker({ onPick, disabled }: { onPick: (hours: number | null) => void; disabled?: boolean }) {
  const [custom, setCustom] = useState('');
  const hours = Number.parseFloat(custom);
  const valid = Number.isFinite(hours) && hours > 0 && hours <= 720;

  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
        <button type="button" disabled={disabled} onClick={() => onPick(null)} style={{ ...presetBtn, background: '#C0382C', borderColor: '#C0382C', color: '#fff' }}>
          بدون مهلة
        </button>
        {SLA_PRESETS.map((p) => (
          <button key={p} type="button" disabled={disabled} onClick={() => onPick(p)} style={presetBtn} className="num">{slaLabel(p)}</button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && valid) { e.preventDefault(); onPick(hours); } }}
          inputMode="decimal"
          placeholder="مهلة مخصّصة بالساعات"
          className="num"
          style={customInput}
        />
        <button type="button" disabled={!valid || disabled} onClick={() => valid && onPick(hours)} style={{ ...presetBtn, background: '#DC4A3D', borderColor: '#DC4A3D', color: '#fff', flexShrink: 0 }}>
          <i className="fa-solid fa-bell" /> أرسل
        </button>
      </div>
      {custom.trim() && !valid && <p style={{ margin: '4px 0 0', fontSize: 10, fontWeight: 700, color: '#C0382C' }}>أدخل عدد ساعات بين 1 و 720.</p>}
    </div>
  );
}

const presetBtn: CSSProperties = { padding: '4px 8px', border: '1px solid #FED7AA', borderRadius: 6, background: '#fff', color: '#C2410C', fontSize: 10, fontWeight: 800, cursor: 'pointer' };
const customInput: CSSProperties = { flex: 1, minWidth: 0, height: 30, border: '1px solid #FED7AA', borderRadius: 6, padding: '0 8px', fontSize: 10.5, fontWeight: 700, outline: 'none' };
