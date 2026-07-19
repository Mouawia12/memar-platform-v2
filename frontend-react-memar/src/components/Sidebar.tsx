import { useMemo, useState } from 'react';
import { NavLink } from 'react-router-dom';

import { NAV_SECTIONS } from '../config/nav';
import { useAuthStore } from '../store/auth';

interface Props {
  open: boolean;
  onNavigate: () => void;
}

/**
 * الشريط الجانبي — يطابق بنية الـERP الأصلي (شعار + أقسام قابلة للطي).
 * الدرج على الموبايل عبر صنف `.sidebar.open` (آلية التصميم الأصلي).
 */
export function Sidebar({ open, onNavigate }: Props) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setCollapsed((c) => ({ ...c, [id]: !c[id] }));

  const permissions = useAuthStore((s) => s.user?.permissions);

  // إظهار العناصر التي يملك المستخدم صلاحيتها فقط (بلا صلاحية = للجميع)،
  // وإخفاء الأقسام التي تصبح فارغة — يمنع أخطاء 403 ويطابق قوائم الأصل حسب الدور.
  const sections = useMemo(() => {
    const allow = (perm?: string) => !perm || !permissions || permissions.includes(perm);
    return NAV_SECTIONS
      .map((s) => ({ ...s, items: s.items.filter((i) => allow(i.perm)) }))
      .filter((s) => s.items.length > 0);
  }, [permissions]);

  return (
    <aside className={`sidebar${open ? ' open' : ''}`} id="sidebar">
      <div className="sb-logo">
        <div className="sb-logo-icon">م</div>
        <div className="sb-logo-text">
          <h1>معمار ERP</h1>
          <span>مجموعة معمار للاستشارات</span>
        </div>
      </div>

      <nav id="sidebar-nav">
        {sections.map((section) => (
          <div className={`sidebar-block${collapsed[section.id] ? ' collapsed' : ''}`} data-id={`block-${section.id}`} key={section.id}>
            <div className="sb-section-label" onClick={() => toggle(section.id)}>
              <span>{section.title}</span>
              <span className="chevron">▾</span>
            </div>
            <div className="sidebar-sub-container">
              {section.items.map((item) => (
                <NavLink
                  key={item.key}
                  to={item.path}
                  onClick={onNavigate}
                  className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="lbl">{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        ))}
      </nav>
    </aside>
  );
}
