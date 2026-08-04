import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { NavLink } from 'react-router-dom';

import { NAV_SECTIONS, type NavItem } from '../../config/nav';
import { useAuthStore } from '../../store/auth';

// v2: بعد اجتماع 2026-08-03 غيّرنا الافتراضي (أيمن طلب إزالة «المهام» و«CRM» من الأعلى)؛
// رفع رقم النسخة يتجاهل الاختيار القديم المحفوظ محليًا فيظهر الافتراضي الجديد للجميع.
const STORAGE_KEY = 'memar_top_shortcuts_v2';

/** الاختصارات الافتراضية فوق — طلب أيمن (اجتماع 4): «المواعيد» و«التواصل» فقط، والباقي في القائمة الجانبية. */
const DEFAULT_KEYS = ['appointments', 'whatsapp'];

function loadKeys(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    return raw ? (JSON.parse(raw) as string[]) : DEFAULT_KEYS;
  } catch {
    return DEFAULT_KEYS;
  }
}

/**
 * شريط اختصارات علوي (نمط Bitrix) — تبويبات قابلة للتخصيص في المساحة العلوية (CRM-1).
 * يختار المستخدم العناصر ويرتّبها ويُحفظ اختياره محليًا. تُعرض بأيقونة + عنوان ليقرأها بوضوح.
 */
export function TopShortcuts() {
  const permissions = useAuthStore((s) => s.user?.permissions);
  const [keys, setKeys] = useState<string[]>(loadKeys);
  const [customizing, setCustomizing] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  // عدد الاختصارات التي تتّسع فعلاً في الشريط؛ الباقي يذهب لقائمة «المزيد».
  const [visibleCount, setVisibleCount] = useState(99);
  const pillsRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);

  // كل عناصر التنقّل المسموح بها لهذا المستخدم
  const allowed = useMemo(() => {
    const allow = (perm?: string) => !perm || !permissions || permissions.includes(perm);

    return NAV_SECTIONS.flatMap((s) => s.items).filter((i) => allow(i.perm));
  }, [permissions]);

  const byKey = useMemo(() => new Map(allowed.map((i) => [i.key, i])), [allowed]);
  // العناصر المختارة بالترتيب المحفوظ، ثم بقية المتاح لإضافته.
  const selected = keys.map((k) => byKey.get(k)).filter((i): i is NavItem => Boolean(i));
  const available = allowed.filter((i) => !keys.includes(i.key));

  const persist = (next: string[]) => {
    setKeys(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // تجاهل أخطاء التخزين المحلي
    }
  };

  const add = (key: string) => persist([...keys, key]);
  const remove = (key: string) => persist(keys.filter((k) => k !== key));
  const move = (index: number, dir: -1 | 1) => {
    const next = [...keys];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    persist(next);
  };
  const reset = () => persist(DEFAULT_KEYS);

  // قياس كم اختصاراً يتّسع فعلاً: نقيس عرض كل التبويبات في صفّ مخفي، ثم نُظهر ما يسع
  // ونُبقي فراغاً لزر «المزيد»؛ الباقي يُعرض كقائمة منسدلة. يُعاد الحساب مع تغيّر العرض/العناصر.
  const keySig = keys.join('|');
  useLayoutEffect(() => {
    let raf = 0;
    // نقيس عرض «الحاوية» (wrap) — تتمدّد بالـflex فتعكس المساحة المتاحة لا عرض محتواها (يكسر الدوران).
    const compute = () => {
      const box = pillsRef.current;
      const measurer = measureRef.current;
      if (!box || !measurer) return;
      const avail = box.clientWidth;
      if (avail <= 60) { raf = requestAnimationFrame(compute); return; } // لم يُرسَم التخطيط بعد — نعيد المحاولة
      const items = Array.from(measurer.children) as HTMLElement[];
      const GAP = 5;
      const GEAR_W = 40; // زر ⚙️ (ثابت في نهاية الشريط)
      const MORE_W = 104; // مساحة زر «المزيد»
      let used = GEAR_W;
      let count = 0;
      for (let idx = 0; idx < items.length; idx++) {
        const cand = used + GAP + items[idx].offsetWidth;
        const needMore = idx < items.length - 1; // سيظهر زر المزيد إن بقي عنصر بعده
        if (cand > avail - (needMore ? MORE_W + GAP : 0)) break;
        used = cand;
        count++;
      }
      setVisibleCount(count);
    };
    raf = requestAnimationFrame(compute);
    const ro = new ResizeObserver(() => compute());
    if (pillsRef.current) ro.observe(pillsRef.current);

    return () => { cancelAnimationFrame(raf); ro.disconnect(); };
  }, [keySig, selected.length]);

  const renderPill = (i: NavItem) => (
    <NavLink key={i.key} to={i.path} title={i.label} style={({ isActive }) => ({ ...pill, ...(isActive ? pillActive : null) })}>
      <span style={{ fontSize: '15px' }}>{i.icon}</span>
      <span style={pillLabel}>{i.label}</span>
    </NavLink>
  );

  const visible = selected.slice(0, visibleCount);
  const overflow = selected.slice(visibleCount);

  return (
    <div ref={pillsRef} style={wrap} className="top-shortcuts">
      <div style={pillsRow}>
        {/* صفّ القياس المخفي — كل التبويبات لقياس عرضها فقط (خارج التدفّق). */}
        <div ref={measureRef} style={measureRow} aria-hidden="true">
          {selected.map((i) => renderPill(i))}
        </div>
        {/* التبويبات الظاهرة فعلاً */}
        {visible.map((i) => renderPill(i))}

        {/* زر «المزيد» — يعرض الاختصارات التي لم تتّسع كقائمة منسدلة سريعة (طلب أيمن). */}
        {overflow.length > 0 && (
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <button type="button" onClick={() => setMoreOpen((v) => !v)} style={moreBtn} title="اختصارات أخرى">
              المزيد <span style={{ fontSize: '9px' }}>▾</span><span style={moreCount}>{overflow.length}</span>
            </button>
            {moreOpen && (
              <>
                <div style={backdrop} onClick={() => setMoreOpen(false)} />
                <div style={morePanel}>
                  {overflow.map((i) => (
                    <NavLink key={i.key} to={i.path} onClick={() => setMoreOpen(false)} style={({ isActive }) => ({ ...moreRow, ...(isActive ? moreRowActive : null) })}>
                      <span style={{ fontSize: '15px' }}>{i.icon}</span>
                      <span style={{ flex: 1 }}>{i.label}</span>
                    </NavLink>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>

      <div style={{ position: 'relative', flexShrink: 0 }}>
        <button type="button" title="تخصيص الاختصارات" onClick={() => setCustomizing((v) => !v)} style={gear}>⚙️</button>
        {customizing && (
          <>
            <div style={backdrop} onClick={() => setCustomizing(false)} />
            <div style={panel}>
              <div style={panelHead}>
                <span style={{ fontSize: '12.5px', fontWeight: 800, color: '#274A78' }}>تخصيص اختصارات الأعلى</span>
                <button type="button" onClick={reset} style={resetBtn} title="استعادة الافتراضي">استعادة الافتراضي</button>
              </div>
              <p style={panelHint}>اختصارات الشريط العلوي هي روابط سريعة لصفحاتك الأكثر استخدامًا. أضِف أو أزِل أو رتّب ما يظهر هنا.</p>
              <div style={{ maxHeight: '360px', overflowY: 'auto' }}>
                {/* المختارة — قابلة لإعادة الترتيب والإزالة */}
                <div style={groupLabel}>الظاهرة الآن ({selected.length})</div>
                {selected.length === 0 && <div style={emptyHint}>لا اختصارات — أضِف من الأسفل.</div>}
                {selected.map((i, idx) => (
                  <div key={i.key} style={row}>
                    <span style={{ fontSize: '15px' }}>{i.icon}</span>
                    <span style={{ fontSize: '13px', flex: 1 }}>{i.label}</span>
                    <button type="button" onClick={() => move(idx, -1)} disabled={idx === 0} style={iconBtn} title="أعلى">▲</button>
                    <button type="button" onClick={() => move(idx, 1)} disabled={idx === selected.length - 1} style={iconBtn} title="أسفل">▼</button>
                    <button type="button" onClick={() => remove(i.key)} style={removeBtn} title="إزالة">✕</button>
                  </div>
                ))}

                {/* المتاحة للإضافة */}
                {available.length > 0 && <div style={groupLabel}>إضافة اختصار</div>}
                {available.map((i) => (
                  <button key={i.key} type="button" onClick={() => add(i.key)} style={addRow} title={`إضافة ${i.label}`}>
                    <span style={{ fontSize: '15px' }}>{i.icon}</span>
                    <span style={{ fontSize: '13px', flex: 1, textAlign: 'start' }}>{i.label}</span>
                    <span style={addPlus}>＋</span>
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// flex-grow أعلى من البحث (flex:1) ليأخذ الشريط نصيباً أكبر من المساحة الحرّة فيتّسع لعدّة تبويبات.
const wrap: CSSProperties = { display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'nowrap', minWidth: 0, flex: '3 1 0' };
// صفّ التبويبات: يأخذ العرض المتاح (flex:1) ونحسب كم يتّسع؛ لا نستعمل overflow:hidden لئلّا نقصّ قائمة «المزيد».
const pillsRow: CSSProperties = { display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'nowrap', minWidth: 0, flex: '1 1 0', position: 'relative' };
const measureRow: CSSProperties = { position: 'absolute', top: 0, insetInlineStart: 0, display: 'flex', gap: '5px', visibility: 'hidden', pointerEvents: 'none', whiteSpace: 'nowrap' };
const moreBtn: CSSProperties = { display: 'flex', alignItems: 'center', gap: '5px', height: '32px', padding: '0 10px', borderRadius: '9px', background: '#EEF2F7', color: '#274A78', border: '1px dashed #C7D2E0', cursor: 'pointer', fontSize: '12.5px', fontWeight: 700, fontFamily: 'inherit', flexShrink: 0, whiteSpace: 'nowrap' };
const moreCount: CSSProperties = { display: 'inline-grid', placeItems: 'center', minWidth: '17px', height: '17px', padding: '0 4px', borderRadius: '9px', background: '#274A78', color: '#fff', fontSize: '10px', fontWeight: 800 };
const morePanel: CSSProperties = { position: 'absolute', top: 'calc(100% + 8px)', insetInlineEnd: 0, minWidth: '190px', maxWidth: 'none', boxSizing: 'border-box', background: '#fff', border: '1px solid #E4E8EF', borderRadius: '12px', boxShadow: '0 12px 32px rgba(0,0,0,.14)', zIndex: 300, padding: '6px' };
const moreRow: CSSProperties = { display: 'flex', alignItems: 'center', gap: '10px', padding: '8px 10px', borderRadius: '8px', color: '#1A1F2E', textDecoration: 'none', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap' };
const moreRowActive: CSSProperties = { background: '#274A78', color: '#fff' };
const pill: CSSProperties = { display: 'flex', alignItems: 'center', gap: '6px', height: '32px', padding: '0 11px', borderRadius: '9px', background: '#F0F4F8', color: '#334155', textDecoration: 'none', flexShrink: 0, transition: 'all .15s', fontSize: '13px', fontWeight: 600 };
const pillActive: CSSProperties = { background: '#274A78', color: '#fff', boxShadow: '0 2px 8px rgba(39,74,120,.3)' };
const pillLabel: CSSProperties = { whiteSpace: 'nowrap', maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis' };
const gear: CSSProperties = { display: 'grid', placeItems: 'center', width: '32px', height: '32px', borderRadius: '9px', border: '1px dashed #CBD5E1', background: 'transparent', cursor: 'pointer', fontSize: '13px', flexShrink: 0, padding: 0 };
const backdrop: CSSProperties = { position: 'fixed', inset: 0, zIndex: 290 };
const panel: CSSProperties = { position: 'absolute', top: 'calc(100% + 8px)', insetInlineEnd: 0, width: '280px', maxWidth: 'none', boxSizing: 'border-box', background: '#fff', border: '1px solid #E4E8EF', borderRadius: '12px', boxShadow: '0 12px 32px rgba(0,0,0,.14)', zIndex: 300, padding: '10px' };
const panelHead: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' };
const panelHint: CSSProperties = { fontSize: '11px', lineHeight: 1.6, color: '#7A869A', margin: '0 2px 8px', background: '#F8FAFC', border: '1px solid #EEF2F7', borderRadius: '7px', padding: '6px 8px' };
const resetBtn: CSSProperties = { border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#5A6478', borderRadius: '7px', padding: '4px 8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' };
const groupLabel: CSSProperties = { fontSize: '11px', fontWeight: 800, color: '#94A3B8', margin: '10px 4px 4px' };
const emptyHint: CSSProperties = { fontSize: '12px', color: '#94A3B8', padding: '4px 6px' };
const row: CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 6px', borderRadius: '7px', color: '#334155' };
const iconBtn: CSSProperties = { width: '24px', height: '24px', borderRadius: '6px', border: '1px solid #E2E8F0', background: '#fff', color: '#64748B', cursor: 'pointer', fontSize: '10px', padding: 0, lineHeight: 1 };
const removeBtn: CSSProperties = { width: '24px', height: '24px', borderRadius: '6px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', fontSize: '11px', padding: 0, lineHeight: 1 };
const addRow: CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '7px 6px', borderRadius: '7px', border: 'none', background: 'transparent', color: '#334155', cursor: 'pointer', fontFamily: 'inherit' };
const addPlus: CSSProperties = { display: 'grid', placeItems: 'center', width: '22px', height: '22px', borderRadius: '6px', background: '#E8F5EE', color: '#2D9B6F', fontSize: '14px', fontWeight: 800 };
