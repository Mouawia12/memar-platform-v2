import { NavLink } from 'react-router-dom';

import { NAV_SECTIONS } from '../config/nav';

/**
 * القائمة الجانبية — تعيد نفس بنية وأصناف الـERP الحالي للحفاظ على التصميم.
 */
export function Sidebar() {
  return (
    <aside className="sidebar" id="sidebar">
      <div className="sidebar-brand" style={{ padding: '16px', fontWeight: 800, fontSize: '20px' }}>
        معمار <span style={{ opacity: 0.6, fontWeight: 400, fontSize: '13px' }}>ERP</span>
      </div>

      {NAV_SECTIONS.map((section) => (
        <div className="sidebar-block" data-id={`block-${section.id}`} key={section.id}>
          <div className="nav-header" style={{ padding: '10px 16px', opacity: 0.7, fontSize: '13px' }}>
            <span>{section.title}</span>
          </div>
          <div className="sidebar-sub-container">
            {section.items.map((item) => (
              <NavLink
                key={item.key}
                to={item.path}
                className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="lbl">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      ))}
    </aside>
  );
}
