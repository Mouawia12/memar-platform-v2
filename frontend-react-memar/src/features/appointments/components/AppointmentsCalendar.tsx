import { useMemo, useState, type CSSProperties } from 'react';

import type { Appointment } from '../types';

type View = 'year' | 'month' | 'week' | 'day';

interface Props {
  appointments: Appointment[];
  onDayClick: (dateStr: string) => void;
  onEventClick: (a: Appointment) => void;
}

const MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
const WEEKDAYS = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const CHIP = ['#6366f1', '#22c55e', '#0ea5e9', '#f59e0b', '#8b5cf6', '#ef4444'];
const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // 7ص → 8م

const iso = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dayKey = (a: Appointment) => (a.start_at ? iso(new Date(a.start_at)) : '');
const hourOf = (a: Appointment) => (a.start_at ? new Date(a.start_at).getHours() : -1);
const fmtTime = (s: string | null) => {
  if (!s) return '';
  const d = new Date(s);
  const h = d.getHours();

  return `${h % 12 || 12}:${String(d.getMinutes()).padStart(2, '0')} ${h >= 12 ? 'م' : 'ص'}`;
};
const fmtDate = (d: Date) => `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;

/** تقويم المواعيد — عروض سنة/شهر/أسبوع/يوم (طبق أصل وحدة Appointments). */
export function AppointmentsCalendar({ appointments, onDayClick, onEventClick }: Props) {
  const [view, setView] = useState<View>('month');
  const [cursor, setCursor] = useState(new Date());

  const byDay = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    for (const a of appointments) {
      const k = dayKey(a);
      if (!k) continue;
      (map.get(k) ?? map.set(k, []).get(k)!).push(a);
    }
    for (const list of map.values()) list.sort((a, b) => (a.start_at ?? '').localeCompare(b.start_at ?? ''));

    return map;
  }, [appointments]);

  const todayStr = iso(new Date());

  const nav = (dir: number) => {
    const c = new Date(cursor);
    if (view === 'day') c.setDate(c.getDate() + dir);
    else if (view === 'week') c.setDate(c.getDate() + dir * 7);
    else if (view === 'month') c.setMonth(c.getMonth() + dir);
    else c.setFullYear(c.getFullYear() + dir);
    setCursor(c);
  };

  const label = (() => {
    if (view === 'day') return fmtDate(cursor);
    if (view === 'week') {
      const ws = weekStart(cursor); const we = new Date(ws); we.setDate(we.getDate() + 6);

      return `${ws.getDate()} — ${we.getDate()} ${MONTHS[we.getMonth()]} ${we.getFullYear()}`;
    }
    if (view === 'year') return `${cursor.getFullYear()}`;

    return `${MONTHS[cursor.getMonth()]} ${cursor.getFullYear()}`;
  })();

  return (
    <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
      {/* شريط التنقّل والعروض */}
      <div style={bar}>
        <div style={tabs}>
          {(['year', 'month', 'week', 'day'] as View[]).map((v) => (
            <button key={v} type="button" onClick={() => setView(v)} style={{ ...tab, ...(view === v ? tabActive : null) }}>
              {{ year: 'سنة', month: 'شهر', week: 'أسبوع', day: 'يوم' }[v]}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button type="button" onClick={() => setCursor(new Date())} style={todayBtn}>اليوم</button>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button type="button" onClick={() => nav(1)} style={navBtn}>‹</button>
            <div style={{ fontSize: '16px', fontWeight: 800, color: '#274A78', minWidth: '150px', textAlign: 'center' }}>{label}</div>
            <button type="button" onClick={() => nav(-1)} style={navBtn}>›</button>
          </div>
        </div>
      </div>

      {view === 'month' && <MonthView cursor={cursor} byDay={byDay} todayStr={todayStr} onDayClick={onDayClick} onEventClick={onEventClick} />}
      {view === 'week' && <WeekView cursor={cursor} byDay={byDay} todayStr={todayStr} onEventClick={onEventClick} />}
      {view === 'day' && <DayView cursor={cursor} byDay={byDay} onEventClick={onEventClick} />}
      {view === 'year' && <YearView cursor={cursor} byDay={byDay} todayStr={todayStr} onGoDay={(d) => { setCursor(new Date(d)); setView('day'); }} />}
    </div>
  );
}

function weekStart(d: Date): Date {
  const x = new Date(d);
  x.setDate(x.getDate() - x.getDay());
  x.setHours(0, 0, 0, 0);

  return x;
}

// ── شهر ──
function MonthView({ cursor, byDay, todayStr, onDayClick, onEventClick }: { cursor: Date; byDay: Map<string, Appointment[]>; todayStr: string; onDayClick: (d: string) => void; onEventClick: (a: Appointment) => void }) {
  const y = cursor.getFullYear(); const m = cursor.getMonth();
  const firstDay = new Date(y, m, 1).getDay();
  const daysInM = new Date(y, m + 1, 0).getDate();
  const cells: React.ReactNode[] = [];

  for (let i = 0; i < firstDay; i++) cells.push(<div key={`e${i}`} style={{ ...cell, background: '#fafbfc' }} />);
  for (let day = 1; day <= daysInM; day++) {
    const ds = `${y}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const evts = byDay.get(ds) ?? [];
    const isTd = ds === todayStr;
    cells.push(
      <div key={ds} onClick={() => onDayClick(ds)} title="إضافة موعد" style={{ ...cell, cursor: 'pointer', background: isTd ? '#EFF6FF' : '#fff' }}>
        <div style={{ fontSize: '12px', fontWeight: isTd ? 800 : 600, color: isTd ? '#1D4ED8' : '#334155', textAlign: 'center' }}>{day}</div>
        {evts.slice(0, 2).map((e, i) => (
          <div key={e.id} onClick={(ev) => { ev.stopPropagation(); onEventClick(e); }}
            style={{ ...chip, background: `${CHIP[i % CHIP.length]}18`, color: CHIP[i % CHIP.length] }}>
            {fmtTime(e.start_at)} {e.title}
          </div>
        ))}
        {evts.length > 2 && <div style={{ fontSize: '9px', color: '#8A93A3', textAlign: 'center', marginTop: '2px' }}>+{evts.length - 2}</div>}
      </div>,
    );
  }

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
        {WEEKDAYS.map((d) => <div key={d} style={head}>{d}</div>)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>{cells}</div>
    </div>
  );
}

// ── أسبوع ──
function WeekView({ cursor, byDay, todayStr, onEventClick }: { cursor: Date; byDay: Map<string, Appointment[]>; todayStr: string; onEventClick: (a: Appointment) => void }) {
  const ws = weekStart(cursor);
  const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(ws); d.setDate(ws.getDate() + i); return d; });

  return (
    <div style={{ overflowX: 'auto' }}>
      <div style={{ minWidth: '620px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '50px repeat(7,1fr)' }}>
          <div style={head} />
          {days.map((d) => <div key={iso(d)} style={{ ...head, background: iso(d) === todayStr ? '#EFF6FF' : undefined }}>{WEEKDAYS[d.getDay()].slice(0, 3)} {d.getDate()}</div>)}
        </div>
        <div style={{ maxHeight: '440px', overflowY: 'auto' }}>
          {HOURS.map((h) => (
            <div key={h} style={{ display: 'grid', gridTemplateColumns: '50px repeat(7,1fr)', borderBottom: '1px solid #EEF2F7' }}>
              <div style={hourLabel}>{h % 12 || 12}:00 {h >= 12 ? 'م' : 'ص'}</div>
              {days.map((d) => {
                const evts = (byDay.get(iso(d)) ?? []).filter((e) => hourOf(e) === h);

                return (
                  <div key={iso(d) + h} style={{ borderInlineStart: '1px solid #EEF2F7', padding: '2px', minHeight: '34px' }}>
                    {evts.map((e) => (
                      <div key={e.id} onClick={() => onEventClick(e)} style={{ ...weekEvt, background: `${CHIP[e.id % CHIP.length]}18`, color: CHIP[e.id % CHIP.length] }}>{e.title}</div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── يوم ──
function DayView({ cursor, byDay, onEventClick }: { cursor: Date; byDay: Map<string, Appointment[]>; onEventClick: (a: Appointment) => void }) {
  const evts = byDay.get(iso(cursor)) ?? [];

  return (
    <div style={{ maxHeight: '460px', overflowY: 'auto' }}>
      {HOURS.map((h) => {
        const hEvts = evts.filter((e) => hourOf(e) === h);

        return (
          <div key={h} style={{ display: 'grid', gridTemplateColumns: '64px 1fr', minHeight: '44px', borderBottom: '1px solid #EEF2F7' }}>
            <div style={hourLabel}>{h % 12 || 12}:00 {h >= 12 ? 'م' : 'ص'}</div>
            <div style={{ padding: '4px 8px' }}>
              {hEvts.map((e) => (
                <div key={e.id} onClick={() => onEventClick(e)} style={dayEvt}>
                  <div style={{ fontSize: '12.5px', fontWeight: 700 }}>{e.title}</div>
                  <div style={{ fontSize: '11px', color: '#8A93A3' }}>{e.project?.name ? `🏗️ ${e.project.name} · ` : ''}{fmtTime(e.start_at)}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
      {evts.length === 0 && <div style={{ textAlign: 'center', padding: '32px', color: '#8A93A3' }}>لا مواعيد في هذا اليوم</div>}
    </div>
  );
}

// ── سنة ──
function YearView({ cursor, byDay, todayStr, onGoDay }: { cursor: Date; byDay: Map<string, Appointment[]>; todayStr: string; onGoDay: (d: string) => void }) {
  const y = cursor.getFullYear();

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(min(150px,100%),1fr))', gap: '8px', padding: '12px' }}>
      {MONTHS.map((mn, mi) => {
        const daysInM = new Date(y, mi + 1, 0).getDate();
        const firstDay = new Date(y, mi, 1).getDay();
        const dots: React.ReactNode[] = [];
        for (let i = 0; i < firstDay; i++) dots.push(<div key={`e${i}`} style={{ width: '18px', height: '18px' }} />);
        for (let day = 1; day <= daysInM; day++) {
          const ds = `${y}-${String(mi + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
          const has = byDay.has(ds);
          const isTd = ds === todayStr;
          dots.push(
            <div key={ds} onClick={() => onGoDay(ds)}
              style={{ width: '18px', height: '18px', borderRadius: '50%', display: 'grid', placeItems: 'center', cursor: 'pointer', fontSize: '9px', fontWeight: isTd ? 800 : 400, background: isTd ? '#1B6CA8' : has ? '#6366f118' : 'transparent', color: isTd ? '#fff' : has ? '#1B6CA8' : '#475569', border: has && !isTd ? '1px solid #6366f144' : 'none' }}>
              {day}
            </div>,
          );
        }

        return (
          <div key={mn} style={{ padding: '10px', background: '#fff', border: '1px solid #E4E8EF', borderRadius: '8px' }}>
            <div style={{ fontSize: '11px', fontWeight: 800, color: '#274A78', marginBottom: '6px', textAlign: 'center' }}>{mn}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1px' }}>{dots}</div>
          </div>
        );
      })}
    </div>
  );
}

const bar: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #EEF2F7', flexWrap: 'wrap', gap: '10px' };
const tabs: CSSProperties = { display: 'flex', background: '#F0F4F8', padding: '4px', borderRadius: '8px', gap: '4px' };
const tab: CSSProperties = { cursor: 'pointer', fontSize: '12px', fontWeight: 600, padding: '6px 14px', borderRadius: '6px', border: 'none', background: 'transparent', color: '#5A6478', fontFamily: 'inherit' };
const tabActive: CSSProperties = { background: '#fff', color: '#274A78', boxShadow: '0 1px 3px rgba(0,0,0,.1)' };
const todayBtn: CSSProperties = { fontSize: '12px', padding: '6px 14px', borderRadius: '6px', border: '1px solid #E4E8EF', background: '#fff', color: '#5A6478', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit' };
const navBtn: CSSProperties = { width: '30px', height: '30px', borderRadius: '6px', display: 'grid', placeItems: 'center', background: '#fff', border: '1px solid #E4E8EF', cursor: 'pointer', fontSize: '16px' };
const head: CSSProperties = { padding: '8px', textAlign: 'center', fontSize: '11.5px', fontWeight: 700, color: '#8A93A3', background: '#F7F9FC', borderBottom: '1px solid #EEF2F7' };
const cell: CSSProperties = { minHeight: '84px', border: '1px solid #F1F5F9', padding: '4px', overflow: 'hidden' };
const chip: CSSProperties = { fontSize: '9.5px', padding: '1px 4px', borderRadius: '4px', marginTop: '2px', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: 700 };
const hourLabel: CSSProperties = { fontSize: '10px', color: '#8A93A3', padding: '4px 6px', borderInlineEnd: '1px solid #EEF2F7' };
const weekEvt: CSSProperties = { fontSize: '9.5px', padding: '2px 4px', borderRadius: '3px', marginBottom: '2px', cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' };
const dayEvt: CSSProperties = { borderInlineStart: '3px solid #274A78', background: '#F7F9FC', borderRadius: '6px', padding: '6px 10px', marginBottom: '4px', cursor: 'pointer' };
