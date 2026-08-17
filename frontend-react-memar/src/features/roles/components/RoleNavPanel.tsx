import { type CSSProperties, useEffect, useMemo, useState } from 'react';

import { NAV_SECTIONS } from '../../../config/nav';
import { ACCOUNT as EP_ACCOUNT, GROUPS as EP_GROUPS, TOP as EP_TOP } from '../../employeePortal/EmployeePortalPage';
import { useSetRoleNav } from '../hooks/useRoles';
import type { Role } from '../types';

interface CatSection { id: string; title: string; items: { key: string; label: string; icon: string }[] }

/** فهرس السايدبار المناسب لنوع لوحة الدور: بوابة الموظف لأدوار الموظف، ولوحة الإدارة لغيرها. */
function catalogFor(dashboard: string | undefined): CatSection[] {
  if (dashboard === 'employee') {
    return [
      { id: EP_TOP.id, title: `${EP_TOP.icon} ${EP_TOP.text}`, items: [] },
      ...EP_GROUPS.map((g) => ({ id: g.id, title: `${g.icon} ${g.title}`, items: g.links.map((l) => ({ key: l.id, label: l.text, icon: l.icon })) })),
      { id: 'g-account', title: '👤 حسابي', items: EP_ACCOUNT.map((l) => ({ key: l.id, label: l.text, icon: l.icon })) },
    ];
  }

  return NAV_SECTIONS.map((s) => ({ id: s.id, title: s.title, items: s.items.map((i) => ({ key: i.key, label: i.label, icon: i.icon })) }));
}

/**
 * تحكّم الأدمن في ظهور أقسام/عناصر السايدبار لهذا الدور (طلب أيمن 2026-08-17).
 * كل مفتاح مخفي = معرّف قسم (يُخفي القسم كاملًا) أو مفتاح عنصر (يُخفي رابطًا مفردًا).
 */
export function RoleNavPanel({ role }: { role: Role }) {
  const setNav = useSetRoleNav();
  const sections = useMemo(() => catalogFor(role.dashboard), [role.dashboard]);
  const [hidden, setHidden] = useState<Set<string>>(new Set(role.nav_hidden ?? []));
  const [saved, setSaved] = useState(false);

  // إعادة التهيئة عند تبديل الدور المحدَّد.
  useEffect(() => { setHidden(new Set(role.nav_hidden ?? [])); setSaved(false); }, [role.id, role.nav_hidden]);

  const toggle = (key: string) => setHidden((prev) => {
    const next = new Set(prev);
    if (next.has(key)) next.delete(key); else next.add(key);
    setSaved(false);

    return next;
  });

  const dirty = (() => {
    const orig = new Set(role.nav_hidden ?? []);
    if (orig.size !== hidden.size) return true;
    for (const k of hidden) if (!orig.has(k)) return true;

    return false;
  })();

  const save = () => setNav.mutate({ id: role.id, navHidden: [...hidden] }, { onSuccess: () => { setSaved(true); window.setTimeout(() => setSaved(false), 2500); } });

  return (
    <div>
      <div style={hint}>حدِّد ما يظهر لهذا الدور في القائمة الجانبية. إخفاء قسم يُخفي كل عناصره. (لا يمنح صلاحية — يخفي العرض فقط.)</div>
      <div style={grid}>
        {sections.map((section) => {
          const secHidden = hidden.has(section.id);

          return (
            <div key={section.id} style={{ ...secBox, ...(secHidden ? secOff : null) }}>
              <label style={secHead}>
                <input type="checkbox" checked={!secHidden} onChange={() => toggle(section.id)} style={{ width: '15px', height: '15px', accentColor: '#1B6CA8' }} />
                <span style={{ fontWeight: 800, fontSize: '13px', color: '#1E293B' }}>{section.title}</span>
              </label>
              <div style={itemsWrap}>
                {section.items.map((item) => {
                  const itemHidden = secHidden || hidden.has(item.key);

                  return (
                    <label key={item.key} style={{ ...itemRow, opacity: secHidden ? 0.4 : 1 }} title={secHidden ? 'القسم مخفي' : ''}>
                      <input type="checkbox" disabled={secHidden} checked={!itemHidden} onChange={() => toggle(item.key)} style={{ width: '14px', height: '14px', accentColor: '#1B6CA8' }} />
                      <span style={{ fontSize: '15px' }}>{item.icon}</span>
                      <span style={{ fontSize: '12.5px', color: '#334155' }}>{item.label}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '12px' }}>
        <button type="button" className="btn btn-primary btn-sm" onClick={save} disabled={!dirty || setNav.isPending}>
          {setNav.isPending ? 'جارٍ الحفظ…' : 'حفظ ظهور القائمة'}
        </button>
        {saved && <span style={{ color: '#2D9B6F', fontSize: '12.5px', fontWeight: 700 }}>✓ حُفظ — يُطبَّق لأصحاب هذا الدور عند تحديث الصفحة.</span>}
        {dirty && !saved && <span style={{ color: '#B45309', fontSize: '12px' }}>لديك تغييرات غير محفوظة.</span>}
      </div>
    </div>
  );
}

const hint: CSSProperties = { fontSize: '12px', color: '#5A6478', background: '#eaeff6', borderRadius: '8px', padding: '9px 12px', lineHeight: 1.6, marginBottom: '12px' };
const grid: CSSProperties = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '10px' };
const secBox: CSSProperties = { border: '1px solid #E2E8F0', borderRadius: '10px', padding: '10px 12px', background: '#fff' };
const secOff: CSSProperties = { background: '#F8FAFC', borderStyle: 'dashed' };
const secHead: CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', paddingBottom: '8px', borderBottom: '1px solid #EEF2F7', marginBottom: '8px' };
const itemsWrap: CSSProperties = { display: 'flex', flexDirection: 'column', gap: '5px' };
const itemRow: CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', padding: '3px 2px' };
