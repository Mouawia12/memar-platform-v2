import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { NavLink } from 'react-router-dom';

import { NAV_SECTIONS, visibleNavSections } from '../config/nav';
import { authApi } from '../features/auth/api/authApi';
import { SidebarUserCard } from './SidebarUserCard';
import { useAuthStore } from '../store/auth';
import type { UiPrefs } from '../types/api';

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
// «وضع المدير» (طلب أيمن 2026-08-05): تبديل يُخفي الروابط الاختيارية (الباهتة) تمامًا
// من السايدبار لعرض نظيف مركّز، أو يُظهرها. حالة عرض محلية لكل جهاز.
const HIDE_OPTIONAL_KEY = 'memar_nav_hide_optional';

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
  // تفضيلات القائمة تُحفظ في قاعدة البيانات لكل مستخدم فتبقى ثابتة عبر الأجهزة
  // وتحديثات السيرفر؛ والتخزين المحلي يُستخدم كذاكرة سريعة للعرض الفوري (DASH-3).
  const serverPrefs = useAuthStore((s) => s.user?.ui_prefs);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => serverPrefs?.nav_collapsed ?? loadMap(COLLAPSE_KEY));
  const [hidden, setHidden] = useState<Record<string, boolean>>(() => serverPrefs?.nav_hidden ?? loadMap(HIDDEN_KEY));
  const [editing, setEditing] = useState(false);
  const [hideOptional, setHideOptional] = useState<boolean>(() => {
    try { return localStorage.getItem(HIDE_OPTIONAL_KEY) === '1'; } catch { return false; }
  });
  const saveTimer = useRef<number | undefined>(undefined);

  const toggleHideOptional = () => setHideOptional((v) => {
    const next = !v;
    try { localStorage.setItem(HIDE_OPTIONAL_KEY, next ? '1' : '0'); } catch { /* تجاهل */ }

    return next;
  });

  // عند وصول تفضيلات الخادم (تسجيل الدخول / تحديث /auth/me) نعتمدها كمصدر الحقيقة.
  useEffect(() => {
    if (!serverPrefs) return;
    if (serverPrefs.nav_collapsed) { setCollapsed(serverPrefs.nav_collapsed); persist(COLLAPSE_KEY, serverPrefs.nav_collapsed); }
    if (serverPrefs.nav_hidden) { setHidden(serverPrefs.nav_hidden); persist(HIDDEN_KEY, serverPrefs.nav_hidden); }
  }, [serverPrefs]);

  // حفظ مؤجَّل في قاعدة البيانات (يتجنّب الإرسال عند كل نقرة سريعة).
  const saveServer = (partial: UiPrefs) => {
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => { void authApi.updateUiPrefs(partial).catch(() => {}); }, 600);
  };

  const toggleCollapse = (id: string) => setCollapsed((c) => {
    const next = { ...c, [id]: !c[id] };
    persist(COLLAPSE_KEY, next);
    saveServer({ nav_collapsed: next });

    return next;
  });

  const toggleHidden = (key: string) => setHidden((h) => {
    const next = { ...h, [key]: !h[key] };
    persist(HIDDEN_KEY, next);
    saveServer({ nav_hidden: next });

    return next;
  });

  const permissions = useAuthStore((s) => s.user?.permissions);
  const roles = useAuthStore((s) => s.user?.roles);
  const dashboard = useAuthStore((s) => s.user?.dashboard);

  // إظهار العناصر حسب الصلاحية والدور: العميل يرى بوابته فقط (AUTH-1)،
  // وبقية المستخدمين يرون ما يملكون صلاحيته — ويُخفى القسم إذا فرغ.
  const permitted = useMemo(
    () => visibleNavSections(NAV_SECTIONS, { permissions, roles, dashboard }),
    [permissions, roles, dashboard],
  );

  // الروابط غير المحدَّدة لا تُحذف بعد الآن؛ تبقى ظاهرة لكن معطّلة (باهتة وغير قابلة
  // للضغط) حتى يُعيد المستخدم تحديدها من وضع التخصيص (DASH-3).
  const sections = permitted;

  return (
    <aside className={`sidebar${open ? ' open' : ''}`} id="sidebar">
      <div className="sb-logo">
        <div className="sb-logo-icon">م</div>
        <div className="sb-logo-text">
          <h1>معمار ERP</h1>
          <span>مجموعة معمار للاستشارات</span>
        </div>
      </div>

      {/* بطاقة تعريف الموظف/المهندس — نظير بطاقة العميل (اجتماع 2026-08-03، مقطع 15) */}
      <SidebarUserCard />

      {/* تخصيص القائمة (DASH-3): إظهار/إخفاء الروابط */}
      <button type="button" onClick={() => setEditing((e) => !e)} style={{ ...customizeBtn, ...(editing ? customizeOn : null) }}>
        {editing ? '✓ تم — حفظ القائمة' : '⚙️ تخصيص القائمة'}
      </button>
      {editing && <div style={editHint}>حدِّد الروابط التي تريد إظهارها؛ أزِل التحديد لإخفائها.</div>}

      <nav id="sidebar-nav">
        {sections.map((section) => {
          // في وضع المدير (خارج التحرير) نستبعد الروابط الباهتة كليًّا، ونُخفي القسم إن فرغ.
          const itemsToRender = !editing && hideOptional
            ? section.items.filter((it) => !hidden[it.key])
            : section.items;
          if (itemsToRender.length === 0) return null;

          return (
          <div className={`sidebar-block${!editing && collapsed[section.id] ? ' collapsed' : ''}`} data-id={`block-${section.id}`} key={section.id}>
            <div className="sb-section-label" onClick={() => !editing && toggleCollapse(section.id)}>
              <span>{section.title}</span>
              {!editing && <span className="chevron">▾</span>}
            </div>
            <div className="sidebar-sub-container">
              {itemsToRender.map((item) => (
                editing ? (
                  <label key={item.key} style={editRow} title={hidden[item.key] ? 'مخفي — حدِّد لإظهاره' : 'ظاهر'}>
                    <input type="checkbox" checked={!hidden[item.key]} onChange={() => toggleHidden(item.key)} style={{ accentColor: '#274A78', width: '15px', height: '15px' }} />
                    <span className="nav-icon">{item.icon}</span>
                    <span className="lbl" style={{ opacity: hidden[item.key] ? 0.45 : 1 }}>{item.label}</span>
                  </label>
                ) : hidden[item.key] ? (
                  // رابط معطّل: ظاهر ليقرأه المستخدم لكن غير قابل للضغط حتى يُعيد تفعيله.
                  <div
                    key={item.key}
                    className="nav-item nav-item-disabled"
                    aria-disabled="true"
                    title="رابط معطّل — فعِّله من ⚙️ تخصيص القائمة"
                    style={disabledRow}
                  >
                    <span className="nav-icon">{item.icon}</span>
                    <span className="lbl">{item.label}</span>
                  </div>
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
          );
        })}
      </nav>

      {/* وضع المدير — آخر عنصر في السايدبار: يُخفي الروابط الاختيارية (الباهتة) لعرض نظيف، أو يُظهرها. */}
      {!editing && (
        <button type="button" onClick={toggleHideOptional} style={{ ...managerBtn, ...(hideOptional ? managerOn : null) }} title="إخفاء/إظهار الروابط الاختيارية الباهتة">
          {hideOptional ? '👁️ إظهار كل الروابط' : '🎯 وضع المدير — إخفاء الاختيارية'}
        </button>
      )}
    </aside>
  );
}

const customizeBtn: CSSProperties = { display: 'block', width: 'calc(100% - 24px)', margin: '4px 12px 8px', padding: '8px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#F0F4F8', color: '#274A78', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12.5px', fontWeight: 700, textAlign: 'center' };
const customizeOn: CSSProperties = { background: '#2D9B6F', borderColor: '#2D9B6F', color: '#fff' };
// margin-top:auto يدفعه لأسفل السايدبار (حاوية flex عمودية)، مع فاصل علوي وحد أدنى للمسافة.
const managerBtn: CSSProperties = { display: 'block', width: 'calc(100% - 24px)', margin: 'auto 12px 10px', marginTop: 'auto', padding: '7px 12px', borderRadius: '8px', border: '1px solid #E2E8F0', background: '#fff', color: '#5A6478', cursor: 'pointer', fontFamily: 'inherit', fontSize: '12px', fontWeight: 700, textAlign: 'center', flexShrink: 0 };
const managerOn: CSSProperties = { background: '#274A78', borderColor: '#274A78', color: '#fff' };
const editHint: CSSProperties = { margin: '0 12px 8px', fontSize: '10.5px', color: '#64748B', lineHeight: 1.6, textAlign: 'center' };
const editRow: CSSProperties = { display: 'flex', alignItems: 'center', gap: '9px', padding: '8px 14px', cursor: 'pointer', color: '#334155', fontSize: '13px' };
// رابط معطّل: باهت وبمؤشّر "ممنوع" مع إبقاء النص مقروءًا.
const disabledRow: CSSProperties = { opacity: 0.4, cursor: 'not-allowed', pointerEvents: 'none' };
