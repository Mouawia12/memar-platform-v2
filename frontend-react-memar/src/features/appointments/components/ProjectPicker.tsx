import { type CSSProperties, useEffect, useRef, useState } from 'react';

import { useProjects } from '../../projects/hooks/useProjects';

interface Props {
  value: number | '';
  onChange: (id: number | '') => void;
  /** اسم المشروع المختار حين يأتي من موعد محفوظ ولم يُحمَّل بعد. */
  initialLabel?: string | null;
}

/**
 * اختيار المشروع بالبحث لا بقائمة طويلة (طلب أيمن 2026-09-16): يُكتب جزءٌ من
 * اسم المشروع فيُبحث في الخادم، فلا يقف الاختيار عند أول مئة مشروع.
 */
export function ProjectPicker({ value, onChange, initialLabel }: Props) {
  const [term, setTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [picked, setPicked] = useState<string | null>(initialLabel ?? null);
  const [debounced, setDebounced] = useState('');
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => { setPicked(initialLabel ?? null); }, [initialLabel]);
  useEffect(() => {
    const id = window.setTimeout(() => setDebounced(term.trim()), 250);

    return () => window.clearTimeout(id);
  }, [term]);

  // إغلاق القائمة عند النقر خارجها.
  useEffect(() => {
    if (!open) return undefined;
    const close = (e: MouseEvent) => { if (!boxRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener('mousedown', close);

    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const { data, isFetching } = useProjects({ search: debounced || undefined, per_page: 20 }, open);
  const results = data?.data ?? [];

  const choose = (id: number, name: string) => {
    onChange(id);
    setPicked(name);
    setTerm('');
    setOpen(false);
  };

  const clear = () => {
    onChange('');
    setPicked(null);
    setTerm('');
  };

  if (value !== '' && picked) {
    return (
      <span style={chosen}>
        <i className="fa-solid fa-diagram-project" style={{ color: '#1B6CA8' }} />
        <span style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{picked}</span>
        <button type="button" onClick={clear} style={clearBtn} aria-label="إزالة المشروع">تغيير</button>
      </span>
    );
  }

  return (
    <div ref={boxRef} style={{ position: 'relative' }}>
      <input
        className="input"
        style={{ width: '100%', marginTop: '4px' }}
        value={term}
        placeholder="ابحث باسم المشروع… (اختياري)"
        onChange={(e) => { setTerm(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        role="combobox"
        aria-expanded={open}
        aria-autocomplete="list"
      />
      {open && (
        <ul style={list} role="listbox">
          {isFetching && results.length === 0 && <li style={hint}>جارٍ البحث…</li>}
          {!isFetching && results.length === 0 && <li style={hint}>لا مشاريع مطابقة — يمكن ترك الموعد بلا مشروع.</li>}
          {results.map((p) => (
            <li key={p.id}>
              <button type="button" role="option" aria-selected={false} style={row} onMouseDown={(e) => e.preventDefault()} onClick={() => choose(p.id, p.name)}>
                <b style={{ fontSize: '13px' }}>{p.name}</b>
                {p.code && <span style={{ fontSize: '11px', color: '#94A3B8' }}>{p.code}</span>}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

const chosen: CSSProperties = { display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px', padding: '8px 10px', border: '1px solid #BFDBF0', borderRadius: '10px', background: '#EEF4FB', fontSize: '13px' };
const clearBtn: CSSProperties = { marginInlineStart: 'auto', border: 0, background: 'none', color: '#5A6478', fontSize: '12px', cursor: 'pointer', fontFamily: 'inherit' };
const list: CSSProperties = { position: 'absolute', insetInline: 0, top: 'calc(100% + 4px)', zIndex: 20, margin: 0, padding: '4px', listStyle: 'none', maxHeight: '240px', overflowY: 'auto', background: '#fff', border: '1px solid #E2E8F0', borderRadius: '10px', boxShadow: '0 12px 28px rgba(15,23,42,.12)' };
const row: CSSProperties = { display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px', width: '100%', padding: '7px 10px', border: 0, borderRadius: '8px', background: 'none', cursor: 'pointer', textAlign: 'start', fontFamily: 'inherit' };
const hint: CSSProperties = { padding: '8px 10px', fontSize: '12.5px', color: '#8A93A3' };
