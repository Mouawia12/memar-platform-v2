import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { contactsApi } from '../../clients/api/contactsApi';
import { companiesApi } from '../../companies/api/companiesApi';
import { usersApi } from '../../users/api/usersApi';
import type { ContactType } from '../types';
import { Avatar } from './CommunicationCard';

export interface PickedEntity {
  id: number;
  name: string;
  phone: string | null;
  sub?: string | null;
}

interface Props {
  type: ContactType;
  value: PickedEntity | null;
  onChange: (entity: PickedEntity | null) => void;
}

const PLACEHOLDER: Record<ContactType, string> = {
  client: 'ابحث عن عميل بالاسم أو الهاتف…',
  company: 'ابحث عن شركة…',
  staff: 'ابحث عن موظف…',
};

function useDebounced(value: string, ms = 250) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

/** يربط السجل بعميل أو شركة أو موظف موجود بدل كتابة الاسم يدويًّا. */
export function LinkedEntityPicker({ type, value, onChange }: Props) {
  const [term, setTerm] = useState('');
  const [open, setOpen] = useState(false);
  const search = useDebounced(term.trim());

  const results = useQuery({
    queryKey: ['communications', 'picker', type, search],
    enabled: open,
    staleTime: 30_000,
    queryFn: async (): Promise<PickedEntity[]> => {
      if (type === 'client') {
        const res = await contactsApi.list({ search: search || undefined, per_page: 8 });
        return res.data.map((c) => ({ id: c.id, name: c.full_name, phone: c.phone, sub: c.phone }));
      }
      if (type === 'company') {
        const res = await companiesApi.list({ search: search || undefined, per_page: 8 });
        return res.data.map((c) => ({ id: c.id, name: c.name, phone: c.phone, sub: c.industry }));
      }
      // قائمة الطاقم صغيرة — تُجلب كاملة وتُصفّى محليًّا.
      const users = await usersApi.assignable();
      return users.filter((u) => !search || u.name.includes(search)).slice(0, 8).map((u) => ({ id: u.id, name: u.name, phone: null }));
    },
  });

  if (value) {
    return (
      <div className="comms-picked">
        <Avatar name={value.name} />
        <div><b>{value.name}</b>{value.sub && <div className="comms-hint" style={{ margin: 0 }} dir="auto">{value.sub}</div>}</div>
        <button type="button" onClick={() => onChange(null)}>تغيير</button>
      </div>
    );
  }

  return (
    <div className="comms-picker">
      <input className="input" style={{ width: '100%', marginTop: 4 }} placeholder={PLACEHOLDER[type]} value={term}
        onChange={(e) => { setTerm(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)} role="combobox" aria-expanded={open} aria-autocomplete="list" />
      {open && (
        <ul className="comms-picker-list" role="listbox">
          {results.isFetching && !results.data && <li className="comms-hint" style={{ padding: '8px 10px' }}>جارٍ البحث…</li>}
          {results.data?.length === 0 && <li className="comms-hint" style={{ padding: '8px 10px' }}>لا نتائج — يمكنك كتابة الاسم يدويًّا بالأسفل.</li>}
          {results.data?.map((r) => (
            <li key={r.id}>
              <button type="button" role="option" aria-selected={false} onMouseDown={(e) => e.preventDefault()} onClick={() => { onChange(r); setTerm(''); setOpen(false); }}>
                <Avatar name={r.name} />
                <span style={{ minWidth: 0 }}><b>{r.name}</b>{r.sub && <span className="comms-hint" style={{ display: 'block', margin: 0 }} dir="auto">{r.sub}</span>}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
