import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useGlobalSearch } from '../../features/workspace/hooks/useWorkspace';

/** البحث الشامل في الشريط العلوي — نتائج مجمّعة تنتقل للوحدة المعنيّة. */
export function GlobalSearch() {
  const navigate = useNavigate();
  const [term, setTerm] = useState('');
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // تأخير الاستعلام حتى يتوقّف المستخدم عن الكتابة
  useEffect(() => {
    const t = setTimeout(() => setDebounced(term), 300);
    return () => clearTimeout(t);
  }, [term]);

  // إغلاق النتائج عند النقر خارجها
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, []);

  const { data, isFetching } = useGlobalSearch(debounced);
  const groups = data?.groups ?? [];
  const hasQuery = debounced.trim().length >= 2;

  const go = (path: string) => {
    setOpen(false);
    setTerm('');
    navigate(path);
  };

  return (
    <div ref={boxRef} className="topbar-search" style={{ position: 'relative' }}>
      <span className="topbar-search-icon">🔍</span>
      <input
        type="text"
        placeholder="بحث في النظام..."
        value={term}
        onChange={(e) => { setTerm(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
      />

      {open && hasQuery && (
        <div style={panel}>
          {isFetching && groups.length === 0 && <div style={hint}>جارٍ البحث…</div>}
          {!isFetching && groups.length === 0 && <div style={hint}>لا توجد نتائج مطابقة.</div>}

          {groups.map((g) => (
            <div key={g.label}>
              <div style={groupLabel}>{g.icon} {g.label}</div>
              {g.items.map((it, i) => (
                <button key={`${g.label}-${i}`} type="button" style={row} onClick={() => go(it.path)}>
                  <span style={{ fontWeight: 600 }}>{it.title}</span>
                  {it.subtitle && <span style={{ fontSize: '11.5px', color: '#5A6478' }}>{it.subtitle}</span>}
                </button>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const panel: CSSProperties = { position: 'absolute', top: 'calc(100% + 6px)', insetInlineStart: 0, insetInlineEnd: 0, background: '#fff', border: '1px solid #E4E8EF', borderRadius: '12px', boxShadow: '0 12px 32px rgba(0,0,0,.12)', zIndex: 300, maxHeight: '60vh', overflowY: 'auto', padding: '6px' };
const groupLabel: CSSProperties = { fontSize: '11px', fontWeight: 700, color: '#5A6478', padding: '8px 10px 4px' };
const row: CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px', width: '100%', textAlign: 'start', padding: '8px 10px', border: 'none', background: 'transparent', borderRadius: '8px', cursor: 'pointer', fontFamily: 'inherit', fontSize: '13px', color: '#1A1F2E' };
const hint: CSSProperties = { padding: '14px', textAlign: 'center', color: '#5A6478', fontSize: '13px' };
