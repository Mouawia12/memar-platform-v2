import { useLayoutEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { NavLink } from 'react-router-dom';

import { NAV_SECTIONS, type NavItem } from '../../config/nav';
import { useAuthStore } from '../../store/auth';
import { useTopShortcutsStore } from '../../store/topShortcuts';

/**
 * شريط اختصارات علوي (نمط Bitrix) — تبويبات قابلة للتخصيص في المساحة العلوية (CRM-1).
 * التخصيص (إضافة/إزالة/ترتيب) عبر زرّ ⚙️ المنقول جنب الإشعارات (TopShortcutsCustomize)؛
 * الحالة مشتركة عبر useTopShortcutsStore فيتحدّث هذا الشريط فورًا.
 */
export function TopShortcuts() {
  const permissions = useAuthStore((s) => s.user?.permissions);
  const keys = useTopShortcutsStore((s) => s.keys);
  const [moreOpen, setMoreOpen] = useState(false);
  // عدد الاختصارات التي تتّسع فعلاً في الشريط؛ الباقي يذهب لقائمة «المزيد».
  const [visibleCount, setVisibleCount] = useState(99);
  const pillsRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);

  // كل عناصر التنقّل المسموح بها لهذا المستخدم
  const allowed = useMemo(() => {
    const allow = (perm?: string) => !perm || (permissions ?? []).includes(perm);

    return NAV_SECTIONS.flatMap((s) => s.items).filter((i) => allow(i.perm));
  }, [permissions]);

  const byKey = useMemo(() => new Map(allowed.map((i) => [i.key, i])), [allowed]);
  // العناصر المختارة بالترتيب المحفوظ.
  const selected = keys.map((k) => byKey.get(k)).filter((i): i is NavItem => Boolean(i));

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
      const MORE_W = 104; // مساحة زر «المزيد»
      let used = 0;
      let count = 0;
      for (let idx = 0; idx < items.length; idx++) {
        const cand = used + (count === 0 ? 0 : GAP) + items[idx].offsetWidth;
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
const backdrop: CSSProperties = { position: 'fixed', inset: 0, zIndex: 290 };
