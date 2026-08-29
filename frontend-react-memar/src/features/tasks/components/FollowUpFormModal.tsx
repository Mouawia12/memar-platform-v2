import { type CSSProperties, type FormEvent, useMemo, useState } from 'react';

import { apiErrorMessage } from '../../../lib/api';
import { useLeads } from '../../crm/hooks/useCrm';
import { useCreateFollowUp } from '../hooks/useFollowUps';

interface Props {
  onClose: () => void;
}

/** دوريات التكرار كما يقبلها الخادم (LeadReminder::REPEATS). */
const REPEATS: { value: string; label: string }[] = [
  { value: '', label: 'بلا تكرار' },
  { value: '3d', label: 'كل 3 أيام' },
  { value: 'week', label: 'أسبوعيًا' },
  { value: 'month', label: 'شهريًا' },
];

/** الآن + ساعة، بصيغة datetime-local المحلّية (لا UTC كي لا يزحف اليوم). */
function defaultWhen(): string {
  const d = new Date();
  d.setHours(d.getHours() + 1, 0, 0, 0);
  const pad = (n: number) => `${n}`.padStart(2, '0');

  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/**
 * متابعة جديدة من لوحة المتابعة (طلب أيمن 2026-08-29) — بدل الدخول لنافذة
 * الفرصة لضبط تذكيرها. المتابعة تذكيرٌ على عميل، فاختيار العميل شرطها.
 */
export function FollowUpFormModal({ onClose }: Props) {
  const create = useCreateFollowUp();
  const [search, setSearch] = useState('');
  const { data: leads, isLoading } = useLeads({ per_page: 100 });

  const [contactId, setContactId] = useState<number | ''>('');
  const [when, setWhen] = useState(defaultWhen());
  const [note, setNote] = useState('');
  const [repeat, setRepeat] = useState('');
  const [error, setError] = useState('');

  // بحث محلّي: العملاء هنا عشرات لا آلاف، فلا داعي لرحلة خادم لكل حرف.
  const options = useMemo(() => {
    const all = leads?.data ?? [];
    const q = search.trim().toLowerCase();

    return q ? all.filter((c) => `${c.full_name} ${c.company ?? ''}`.toLowerCase().includes(q)) : all;
  }, [leads, search]);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (contactId === '') { setError('اختر العميل صاحب المتابعة.'); return; }
    if (!when) { setError('حدّد موعد التذكير.'); return; }
    setError('');
    create.mutate(
      { contactId, remind_at: when, note: note.trim() || undefined, repeat_every: repeat || undefined },
      { onSuccess: onClose, onError: (err) => setError(apiErrorMessage(err)) },
    );
  };

  return (
    <div style={overlay} onClick={onClose}>
      <form className="card" style={modal} onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <div style={head}>
          <div>
            <h2 style={{ margin: 0, fontSize: '16px' }}>🔄 متابعة جديدة</h2>
            <div style={sub}>تذكير متابعة على عميل — يظهر في لوحة المتابعة حسب موعده</div>
          </div>
          <button type="button" onClick={onClose} aria-label="إغلاق" style={closeBtn}>×</button>
        </div>

        <label style={label}>
          العميل *
          <input
            className="input"
            style={field}
            placeholder="ابحث بالاسم أو الشركة…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label>
        <select
          className="input"
          style={{ ...field, marginTop: '6px' }}
          value={contactId}
          onChange={(e) => setContactId(e.target.value ? Number(e.target.value) : '')}
          size={5}
        >
          {isLoading && <option value="">جارٍ التحميل…</option>}
          {!isLoading && options.length === 0 && <option value="">لا نتائج مطابقة</option>}
          {options.map((c) => (
            <option key={c.id} value={c.id}>{c.full_name}{c.company ? ` — ${c.company}` : ''}</option>
          ))}
        </select>

        <label style={label}>
          موعد التذكير *
          <input type="datetime-local" className="input" style={field} value={when} onChange={(e) => setWhen(e.target.value)} />
        </label>

        <label style={label}>
          سبب المتابعة
          <input
            className="input"
            style={field}
            maxLength={255}
            placeholder="مثال: متابعة عرض السعر المرسل"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </label>

        <label style={label}>
          التكرار
          <select className="input" style={field} value={repeat} onChange={(e) => setRepeat(e.target.value)}>
            {REPEATS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </label>

        {error && <p style={{ color: '#DC4A3D', fontSize: '12.5px', margin: '10px 0 0' }}>{error}</p>}

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
          <button type="button" className="btn" onClick={onClose}>إلغاء</button>
          <button type="submit" className="btn btn-primary" disabled={create.isPending}>
            {create.isPending ? 'جارٍ الحفظ…' : '＋ إضافة المتابعة'}
          </button>
        </div>
      </form>
    </div>
  );
}

const overlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(10,25,45,0.45)', backdropFilter: 'blur(2px)', display: 'grid', placeItems: 'center', zIndex: 11000, padding: '20px' };
const modal: CSSProperties = { padding: '20px 22px', width: '100%', maxWidth: '480px', maxHeight: '90vh', overflow: 'auto' };
const head: CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '10px', marginBottom: '14px' };
const sub: CSSProperties = { fontSize: '12px', color: '#8A93A3', marginTop: '3px' };
const closeBtn: CSSProperties = { background: 'none', border: 'none', fontSize: '24px', lineHeight: 1, cursor: 'pointer', color: '#94A3B8', fontFamily: 'inherit' };
const label: CSSProperties = { display: 'block', marginTop: '12px', fontSize: '12.5px', fontWeight: 800, color: '#334155' };
const field: CSSProperties = { width: '100%', marginTop: '5px', fontFamily: 'inherit', fontWeight: 400 };
