import { useMemo, useState, type CSSProperties } from 'react';
import { NavLink } from 'react-router-dom';

import { NAV_SECTIONS, type NavItem } from '../../config/nav';
import { useAuthStore } from '../../store/auth';

const STORAGE_KEY = 'memar_top_shortcuts';

/** الاختصارات الافتراضية فوق (أمثلة أيمن: المهام، CRM، المواعيد، التواصل، العملاء، المشاريع، الخدمات). */
const DEFAULT_KEYS = ['tasks', 'crm', 'appointments', 'whatsapp', 'clients', 'projects', 'services'];

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

  return (
    <div style={wrap} className="top-shortcuts">
      {/* صفّ التبويبات: يُقصّ عند الامتلاء دون أن يقصّ قائمة التخصيص المنبثقة. */}
      <div style={pillsRow}>
        {selected.map((i) => (
          <NavLink
            key={i.key}
            to={i.path}
            title={i.label}
            style={({ isActive }) => ({ ...pill, ...(isActive ? pillActive : null) })}
          >
            <span style={{ fontSize: '15px' }}>{i.icon}</span>
            <span style={pillLabel}>{i.label}</span>
          </NavLink>
        ))}
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

const wrap: CSSProperties = { display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'nowrap', minWidth: 0 };
const pillsRow: CSSProperties = { display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'nowrap', overflow: 'hidden', minWidth: 0 };
const pill: CSSProperties = { display: 'flex', alignItems: 'center', gap: '6px', height: '32px', padding: '0 11px', borderRadius: '9px', background: '#F0F4F8', color: '#334155', textDecoration: 'none', flexShrink: 0, transition: 'all .15s', fontSize: '13px', fontWeight: 600 };
const pillActive: CSSProperties = { background: '#274A78', color: '#fff', boxShadow: '0 2px 8px rgba(39,74,120,.3)' };
const pillLabel: CSSProperties = { whiteSpace: 'nowrap', maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis' };
const gear: CSSProperties = { display: 'grid', placeItems: 'center', width: '32px', height: '32px', borderRadius: '9px', border: '1px dashed #CBD5E1', background: 'transparent', cursor: 'pointer', fontSize: '13px', flexShrink: 0, padding: 0 };
const backdrop: CSSProperties = { position: 'fixed', inset: 0, zIndex: 290 };
const panel: CSSProperties = { position: 'absolute', top: 'calc(100% + 8px)', insetInlineEnd: 0, width: '280px', maxWidth: 'none', boxSizing: 'border-box', background: '#fff', border: '1px solid #E4E8EF', borderRadius: '12px', boxShadow: '0 12px 32px rgba(0,0,0,.14)', zIndex: 300, padding: '10px' };
const panelHead: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '8px' };
const resetBtn: CSSProperties = { border: '1px solid #E2E8F0', background: '#F8FAFC', color: '#5A6478', borderRadius: '7px', padding: '4px 8px', fontSize: '11px', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit' };
const groupLabel: CSSProperties = { fontSize: '11px', fontWeight: 800, color: '#94A3B8', margin: '10px 4px 4px' };
const emptyHint: CSSProperties = { fontSize: '12px', color: '#94A3B8', padding: '4px 6px' };
const row: CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', padding: '5px 6px', borderRadius: '7px', color: '#334155' };
const iconBtn: CSSProperties = { width: '24px', height: '24px', borderRadius: '6px', border: '1px solid #E2E8F0', background: '#fff', color: '#64748B', cursor: 'pointer', fontSize: '10px', padding: 0, lineHeight: 1 };
const removeBtn: CSSProperties = { width: '24px', height: '24px', borderRadius: '6px', border: '1px solid #FECACA', background: '#FEF2F2', color: '#DC2626', cursor: 'pointer', fontSize: '11px', padding: 0, lineHeight: 1 };
const addRow: CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '7px 6px', borderRadius: '7px', border: 'none', background: 'transparent', color: '#334155', cursor: 'pointer', fontFamily: 'inherit' };
const addPlus: CSSProperties = { display: 'grid', placeItems: 'center', width: '22px', height: '22px', borderRadius: '6px', background: '#E8F5EE', color: '#2D9B6F', fontSize: '14px', fontWeight: 800 };
