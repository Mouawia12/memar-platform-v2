import { useMemo, useState } from 'react';
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
export function Sidebar({ open, onNavigate }: Props) {
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setCollapsed((c) => ({ ...c, [id]: !c[id] }));

  const permissions = useAuthStore((s) => s.user?.permissions);
  const roles = useAuthStore((s) => s.user?.roles);

  // إظهار العناصر حسب الصلاحية والدور: العميل يرى بوابته فقط (AUTH-1)،
  // وبقية المستخدمين يرون ما يملكون صلاحيته — ويُخفى القسم إذا فرغ.
  const sections = useMemo(
    () => visibleNavSections(NAV_SECTIONS, { permissions, roles }),
    [permissions, roles],
  );

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
