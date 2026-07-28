import { useMemo, useState, type CSSProperties } from 'react';
import { NavLink } from 'react-router-dom';

import { NAV_SECTIONS, type NavItem } from '../../config/nav';
import { useAuthStore } from '../../store/auth';

const STORAGE_KEY = 'memar_top_shortcuts';

/** الاختصارات الافتراضية فوق (أمثلة أيمن: المواعيد، التواصل، العملاء، التسعير + الأساسية). */
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
 * شريط اختصارات علوي (نمط Bitrix) — أيقونات قابلة للتخصيص في المساحة العلوية الفارغة (CRM-1).
 * يختار المستخدم العناصر ويُحفظ اختياره محليًا.
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
  const shortcuts = keys.map((k) => byKey.get(k)).filter((i): i is NavItem => Boolean(i));

  const persist = (next: string[]) => {
    setKeys(next);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  };

  const toggle = (key: string) =>
    persist(keys.includes(key) ? keys.filter((k) => k !== key) : [...keys, key]);

  return (
    <div style={wrap} className="top-shortcuts">
      {shortcuts.map((i) => (
        <NavLink
          key={i.key}
          to={i.path}
          title={i.label}
          style={({ isActive }) => ({ ...pill, ...(isActive ? pillActive : null) })}
        >
          <span style={{ fontSize: '16px' }}>{i.icon}</span>
        </NavLink>
      ))}

      <div style={{ position: 'relative' }}>
        <button type="button" title="تخصيص الاختصارات" onClick={() => setCustomizing((v) => !v)} style={gear}>⚙️</button>
        {customizing && (
          <>
            <div style={backdrop} onClick={() => setCustomizing(false)} />
            <div style={panel}>
              <div style={{ fontSize: '12px', fontWeight: 800, color: '#5A6478', marginBottom: '8px' }}>اختصارات الأعلى</div>
              <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {allowed.map((i) => (
                  <label key={i.key} style={row}>
                    <input type="checkbox" checked={keys.includes(i.key)} onChange={() => toggle(i.key)} />
                    <span style={{ fontSize: '15px' }}>{i.icon}</span>
                    <span style={{ fontSize: '13px' }}>{i.label}</span>
                  </label>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const wrap: CSSProperties = { display: 'flex', alignItems: 'center', gap: '4px', flexWrap: 'nowrap', overflow: 'hidden' };
const pill: CSSProperties = { display: 'grid', placeItems: 'center', width: '32px', height: '32px', borderRadius: '9px', background: '#F0F4F8', textDecoration: 'none', flexShrink: 0, transition: 'all .15s' };
const pillActive: CSSProperties = { background: '#274A78', boxShadow: '0 2px 8px rgba(39,74,120,.3)' };
const gear: CSSProperties = { width: '32px', height: '32px', borderRadius: '9px', border: '1px dashed #CBD5E1', background: 'transparent', cursor: 'pointer', fontSize: '13px', flexShrink: 0, padding: 0 };
const backdrop: CSSProperties = { position: 'fixed', inset: 0, zIndex: 290 };
const panel: CSSProperties = { position: 'absolute', top: 'calc(100% + 8px)', insetInlineStart: 0, width: '240px', background: '#fff', border: '1px solid #E4E8EF', borderRadius: '12px', boxShadow: '0 12px 32px rgba(0,0,0,.14)', zIndex: 300, padding: '10px' };
const row: CSSProperties = { display: 'flex', alignItems: 'center', gap: '9px', padding: '6px 4px', cursor: 'pointer', borderRadius: '6px' };
