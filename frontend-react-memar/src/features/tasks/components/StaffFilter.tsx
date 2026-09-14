import { useEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';

import { matchesArabic } from '../../../lib/arabicSearch';
import { useAssignableUsers } from '../../users/hooks/useUsers';

interface Props {
  value: number | '';
  onChange: (id: number | '') => void;
  /** عدد البطاقات الظاهرة للموظف المختار — يُعرض بجانب الفلتر ليعرف أنه فعّال. */
  shown?: number;
}

const ALL = 'كل الموظفين';

/**
 * فلتر «شغل موظف بعينه» (طلب أيمن 2026-09-11): يُختار موظف فتُعرض مهامه ومتابعاته
 * في اللوحتين معًا. هو والنطاق (ما يخصّني/الكل) سؤالٌ واحد — «شغل مَن أرى؟» — فاختيار
 * موظف يُطفئ أزرار النطاق، وضغط أيّ منها يُلغي اختيار الموظف.
 *
 * بقائمة بحث لا `select` أصلية (طلب أيمن 2026-09-11): الطاقم تجاوز العشرين وسيزيد،
 * والتمرير في قائمة طويلة أبطأ من كتابة حرفين. والبحث يطبّع العربية فيجد «امنة» آمنةَ.
 */
export function StaffFilter({ value, onChange, shown }: Props) {
  const { data } = useAssignableUsers();
  const staff = useMemo(() => data?.data ?? [], [data]);

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0); // الخيار المُظلَّل بلوحة المفاتيح
  const boxRef = useRef<HTMLSpanElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const selected = staff.find((u) => u.id === value);
  const matched = useMemo(() => staff.filter((u) => matchesArabic(u.name, query)), [staff, query]);
  // «كل الموظفين» يبقى أوّل الخيارات دائمًا — مخرجٌ من الفلتر ولو لم يطابق البحث أحدًا.
  const options = useMemo(() => [{ id: '' as number | '', name: ALL }, ...matched], [matched]);

  // كل فتحة تبدأ ببحث نظيف ومؤشّر على الأول، والتركيز في حقل البحث فيكتب مباشرةً.
  useEffect(() => {
    if (!open) return;
    setQuery('');
    setCursor(0);
    const t = setTimeout(() => inputRef.current?.focus(), 0);

    return () => clearTimeout(t);
  }, [open]);

  // الضغط خارج الصندوق يُغلق — وإلا بقيت القائمة معلّقة فوق اللوحة.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onDown);

    return () => document.removeEventListener('mousedown', onDown);
  }, [open]);

  // إبقاء الخيار المُظلَّل داخل مجال الرؤية أثناء التنقّل بالأسهم.
  useEffect(() => {
    listRef.current?.querySelector<HTMLElement>('[data-cursor="1"]')?.scrollIntoView({ block: 'nearest' });
  }, [cursor, query]);

  const pick = (id: number | '') => { onChange(id); setOpen(false); };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      setCursor((c) => (c + (e.key === 'ArrowDown' ? 1 : -1) + options.length) % options.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const opt = options[cursor];
      if (opt) pick(opt.id);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setOpen(false);
    }
  };

  return (
    <span ref={boxRef} style={wrap}>
      <span style={icon} aria-hidden>👤</span>

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{ ...trigger, ...(value !== '' ? triggerOn : null) }}
        title="اعرض شغل موظف بعينه"
        aria-label="فلترة بالموظف"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <span style={triggerText}>{selected?.name ?? ALL}</span>
        <span style={caret} aria-hidden>▾</span>
      </button>

      {open && (
        <div style={popover}>
          <input
            ref={inputRef}
            className="input"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setCursor(0); }}
            onKeyDown={onKeyDown}
            placeholder="ابحث باسم الموظف…"
            style={searchInput}
            aria-label="ابحث باسم الموظف"
          />

          <div ref={listRef} style={list} role="listbox" aria-label="الموظفون">
            {options.map((opt, i) => {
              const isSel = opt.id === value;

              return (
                <button
                  key={opt.id === '' ? 'all' : opt.id}
                  type="button"
                  data-cursor={i === cursor ? '1' : undefined}
                  onClick={() => pick(opt.id)}
                  onMouseEnter={() => setCursor(i)}
                  style={{ ...row, ...(i === cursor ? rowCursor : null), ...(isSel ? rowSelected : null) }}
                  role="option"
                  aria-selected={isSel}
                >
                  <span style={{ opacity: isSel ? 1 : 0 }} aria-hidden>✓</span>
                  <span style={rowName}>{opt.name}</span>
                </button>
              );
            })}

            {query.trim() !== '' && matched.length === 0 && (
              <div style={empty}>لا موظف بهذا الاسم</div>
            )}
          </div>
        </div>
      )}

      {value !== '' && (
        <>
          {shown !== undefined && <span style={count}>{shown.toLocaleString('ar')}</span>}
          <button type="button" onClick={() => onChange('')} style={clearBtn} title="إلغاء فلتر الموظف">✕</button>
        </>
      )}
    </span>
  );
}

const wrap: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '5px', position: 'relative' };
const icon: CSSProperties = { fontSize: '14px', opacity: 0.7 };
const trigger: CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px',
  padding: '6px 10px', borderRadius: '999px', border: '1.5px solid #E2E8F0', background: '#fff',
  color: '#5A6478', fontFamily: 'inherit', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer',
  // عرض ثابت: الاسم الطويل لا يوسّع الحبّة فيدفع بقيّة الشريط إلى سطر ثانٍ.
  width: '132px',
};
const triggerOn: CSSProperties = { background: '#EBF5FF', color: '#1B6CA8', borderColor: '#1B6CA8' };
const triggerText: CSSProperties = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const caret: CSSProperties = { fontSize: '10px', opacity: 0.65, flexShrink: 0 };

const popover: CSSProperties = {
  position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 30, width: '236px',
  background: '#fff', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '8px',
  boxShadow: '0 10px 28px rgba(15,23,42,.16)',
};
const searchInput: CSSProperties = { width: '100%', padding: '7px 10px', fontSize: '12.5px', borderRadius: '9px', marginBottom: '6px' };
const list: CSSProperties = { maxHeight: '232px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1px' };
const row: CSSProperties = {
  display: 'flex', alignItems: 'center', gap: '7px', width: '100%', textAlign: 'right',
  padding: '7px 9px', borderRadius: '8px', border: 'none', background: 'transparent',
  color: '#334155', fontFamily: 'inherit', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer',
};
const rowCursor: CSSProperties = { background: '#F1F5F9' };
const rowSelected: CSSProperties = { background: '#EBF5FF', color: '#1B6CA8' };
const rowName: CSSProperties = { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const empty: CSSProperties = { padding: '12px 9px', fontSize: '12px', color: '#94A3B8', textAlign: 'center' };

const count: CSSProperties = { fontSize: '12px', fontWeight: 800, color: '#1B6CA8', background: '#EBF5FF', borderRadius: '999px', padding: '3px 8px' };
const clearBtn: CSSProperties = { width: '20px', height: '20px', borderRadius: '50%', border: 'none', background: '#DC4A3D', color: '#fff', fontSize: '11px', lineHeight: 1, cursor: 'pointer', fontFamily: 'inherit' };
