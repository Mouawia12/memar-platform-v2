import { useMemo, useState, type CSSProperties } from 'react';
import { NavLink } from 'react-router-dom';

import { NAV_SECTIONS, visibleNavSections } from '../config/nav';
import { useAuthStore } from '../store/auth';

interface Props {
  open: boolean;
  onNavigate: () => void;
}

/**
 * الشريط الجانبي — يطابق بنية الـERP الأصلي (شعار + أقسام قابلة للطي).
 * الدرج على الموبايل عبر صنف `.sidebar.open` (آلية التصميم الأصلي).
 */
const COLLAPSE_KEY = 'memar_nav_collapsed';
const HIDDEN_KEY = 'memar_nav_hidden';

function loadMap(key: string): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '{}') as Record<string, boolean>;
  } catch {
    return {};
  }
}

function persist(key: string, value: Record<string, boolean>): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // تجاهل أخطاء التخزين المحلي
  }
}

export function Sidebar({ open, onNavigate }: Props) {
  // طيّ أقسام القائمة يبقى محفوظًا بين الجلسات (DASH-3).
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => loadMap(COLLAPSE_KEY));
  // إخفاء روابط بعينها من القائمة (DASH-3): تفضيل شخصي محفوظ محليًا.
  const [hidden, setHidden] = useState<Record<string, boolean>>(() => loadMap(HIDDEN_KEY));
  const [editing, setEditing] = useState(false);

  const toggleCollapse = (id: string) => setCollapsed((c) => {
    const next = { ...c, [id]: !c[id] };
    persist(COLLAPSE_KEY, next);

    return next;
  });

  const toggleHidden = (key: string) => setHidden((h) => {
    const next = { ...h, [key]: !h[key] };
    persist(HIDDEN_KEY, next);

    return next;
  });

  const permissions = useAuthStore((s) => s.user?.permissions);
  const roles = useAuthStore((s) => s.user?.roles);

  // إظهار العناصر حسب الصلاحية والدور: العميل يرى بوابته فقط (AUTH-1)،
  // وبقية المستخدمين يرون ما يملكون صلاحيته — ويُخفى القسم إذا فرغ.
  const permitted = useMemo(
    () => visibleNavSections(NAV_SECTIONS, { permissions, roles }),
    [permissions, roles],
  );

  // في وضع التحرير تظهر كل العناصر (لإعادة تفعيل المخفيّة)؛ خارجه نُخفي غير المحدَّدة.
  const sections = useMemo(() => {
    if (editing) return permitted;

    return permitted
      .map((s) => ({ ...s, items: s.items.filter((i) => !hidden[i.key]) }))
      .filter((s) => s.items.length > 0);
  }, [permitted, hidden, editing]);

  return (
    <aside className={`sidebar${open ? ' open' : ''}`} id="sidebar">
      <div className="sb-logo">
        <div className="sb-logo-icon">م</div>
        <div className="sb-logo-text">
          <h1>معمار ERP</h1>
          <span>مجموعة معمار للاستشارات</span>
        </div>
      </div>

      {/* تخصيص القائمة (DASH-3): إظهار/إخفاء الروابط */}
      <button type="button" onClick={() => setEditing((e) => !e)} style={{ ...customizeBtn, ...(editing ? customizeOn : null) }}>
        {editing ? '✓ تم — حفظ القائمة' : '⚙️ تخصيص القائمة'}
      </button>
      {editing && <div style={editHint}>حدِّد الروابط التي تريد إظهارها؛ أزِل التحديد لإخفائها.</div>}

      <nav id="sidebar-nav">
        {sections.map((section) => (
          <div className={`sidebar-block${!editing && collapsed[section.id] ? ' collapsed' : ''}`} data-id={`block-${section.id}`} key={section.id}>
            <div className="sb-section-label" onClick={() => !editing && toggleCollapse(section.id)}>
              <span>{section.title}</span>
              {!editing && <span className="chevron">▾</span>}
            </div>
            <div className="sidebar-sub-container">
              {section.items.map((item) => (
                editing ? (
                  <label key={item.key} style={editRow} title={hidden[item.key] ? 'مخفي — حدِّد لإظهاره' : 'ظاهر'}>
                    <input type="checkbox" checked={!hidden[item.key]} onChange={() => toggleHidden(item.key)} style={{ accentColor: '#274A78', width: '15px', height: '15px' }} />
                    <span className="nav-icon">{item.icon}</span>
                    <span className="lbl" style={{ opacity: hidden[item.key] ? 0.45 : 1 }}>{item.label}</span>
                  </label>
                ) : (
                  <NavLink
                    key={item.key}
                    to={item.path}
                    onClick={onNavigate}
                    className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="lbl">{item.label}</span>
                  </NavLink>
                )
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}

const customizeBtn: CSSProperties = { display: 'block', width: 'calc(100% - 24px)', margin: '4px 12px 8px', padding: '8px 12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,.18)', background: 'rgba(255,255,255,.06)', color: '#fff', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12.5px', fontWeight: 700, textAlign: 'center' };
const customizeOn: CSSProperties = { background: '#2D9B6F', borderColor: '#2D9B6F' };
const editHint: CSSProperties = { margin: '0 12px 8px', fontSize: '10.5px', color: 'rgba(255,255,255,.6)', lineHeight: 1.6, textAlign: 'center' };
const editRow: CSSProperties = { display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 14px', cursor: 'pointer', color: '#fff', fontSize: '13px' };
