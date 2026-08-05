import { useMemo, useState, type CSSProperties } from 'react';

import { NAV_SECTIONS, type NavItem } from '../../config/nav';
import { useAuthStore } from '../../store/auth';
import { useTopShortcutsStore } from '../../store/topShortcuts';

/**
 * زرّ «تخصيص اختصارات الأعلى» — نُقل من داخل شريط الاختصارات إلى الهيدر جنب الإشعارات
 * (طلب أيمن، اجتماع 2026-08-06). يشارك الحالة مع الشريط عبر useTopShortcutsStore،
 * فيتحدّث الشريط فورًا عند الإضافة/الإزالة/إعادة الترتيب.
 */
export function TopShortcutsCustomize() {
  const permissions = useAuthStore((s) => s.user?.permissions);
  const keys = useTopShortcutsStore((s) => s.keys);
  const add = useTopShortcutsStore((s) => s.add);
  const remove = useTopShortcutsStore((s) => s.remove);
  const move = useTopShortcutsStore((s) => s.move);
  const reset = useTopShortcutsStore((s) => s.reset);
  const [open, setOpen] = useState(false);

  const allowed = useMemo(() => {
    const allow = (perm?: string) => !perm || !permissions || permissions.includes(perm);

    return NAV_SECTIONS.flatMap((s) => s.items).filter((i) => allow(i.perm));
  }, [permissions]);

  const byKey = useMemo(() => new Map(allowed.map((i) => [i.key, i])), [allowed]);
  const selected = keys.map((k) => byKey.get(k)).filter((i): i is NavItem => Boolean(i));
  const available = allowed.filter((i) => !keys.includes(i.key));

  return (
    <div style={{ position: 'relative', flexShrink: 0 }}>
      <button type="button" className="icon-btn" title="تخصيص الاختصارات" onClick={() => setOpen((v) => !v)}>⚙️</button>
      {open && (
        <>
          <div style={backdrop} onClick={() => setOpen(false)} />
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
  );
}

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
