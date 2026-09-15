import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { contactsApi } from '../../clients/api/contactsApi';
import { companiesApi } from '../../companies/api/companiesApi';
import { usersApi } from '../../users/api/usersApi';
import type { ContactType, LinkKey } from '../types';
import { normalizeArabic } from '../utils';
import { Avatar } from './CommunicationCard';

export interface PickedEntity {
  key: LinkKey;
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

const LIMIT = 20;

function useDebounced(value: string, ms = 250) {
  const [v, setV] = useState(value);
  useEffect(() => { const t = setTimeout(() => setV(value), ms); return () => clearTimeout(t); }, [value, ms]);
  return v;
}

async function searchEntities(type: ContactType, search: string): Promise<{ items: PickedEntity[]; total: number }> {
  const s = search || undefined;

  if (type === 'client') {
    const res = await contactsApi.list({ search: s, per_page: LIMIT });
    return {
      items: res.data.map((c) => ({ key: 'contact_id', id: c.id, name: c.full_name, phone: c.phone, sub: [c.company, c.phone].filter(Boolean).join(' · ') || null })),
      total: res.meta.total,
    };
  }

  if (type === 'company') {
    // كثير من الشركات مسجّلة كعميل «نوعه شركة» بلا سجل في «سجل الشركات» — نبحث في الاثنين.
    const [companies, contacts] = await Promise.all([
      companiesApi.list({ search: s, per_page: LIMIT }),
      contactsApi.list({ search: s, per_page: 100 }),
    ]);
    const companyNames = new Set(companies.data.map((c) => normalizeArabic(c.name)));
    const fromContacts = contacts.data
      .filter((c) => c.client_kind === 'company')
      .filter((c) => !companyNames.has(normalizeArabic(c.full_name)) && !(c.company && companyNames.has(normalizeArabic(c.company))));
    const items: PickedEntity[] = [
      ...companies.data.map((c) => ({ key: 'company_id' as const, id: c.id, name: c.name, phone: c.phone, sub: c.industry ?? 'سجل الشركات' })),
      ...fromContacts.map((c) => ({ key: 'contact_id' as const, id: c.id, name: c.full_name, phone: c.phone, sub: ['عميل شركة', c.phone].filter(Boolean).join(' · ') })),
    ];
    return { items: items.slice(0, LIMIT), total: companies.meta.total + fromContacts.length };
  }

  // قائمة الطاقم صغيرة — تُجلب كاملة وتُصفّى محليًّا بنفس تطبيع البحث العربي.
  const users = await usersApi.assignable();
  const needle = normalizeArabic(search);
  const matched = users.filter((u) => !needle || normalizeArabic(u.name).includes(needle));
  return { items: matched.slice(0, LIMIT).map((u) => ({ key: 'user_id', id: u.id, name: u.name, phone: null })), total: matched.length };
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
    queryFn: () => searchEntities(type, search),
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

  const items = results.data?.items;
  const hidden = results.data ? results.data.total - results.data.items.length : 0;

  return (
    <div className="comms-picker">
      <input className="input" style={{ width: '100%', marginTop: 4 }} placeholder={PLACEHOLDER[type]} value={term}
        onChange={(e) => { setTerm(e.target.value); setOpen(true); }} onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)} role="combobox" aria-expanded={open} aria-autocomplete="list" />
      {open && (
        <ul className="comms-picker-list" role="listbox">
          {results.isError && <li className="comms-hint" style={{ padding: '8px 10px', color: '#DC2626' }}>تعذّر البحث — تحقّق من الاتصال وحاول مجددًا.</li>}
          {!items && results.isFetching && <li className="comms-hint" style={{ padding: '8px 10px' }}>جارٍ البحث…</li>}
          {items?.length === 0 && <li className="comms-hint" style={{ padding: '8px 10px' }}>لا نتائج لـ «{search}» — يمكنك كتابة الاسم يدويًّا بالأسفل.</li>}
          {items?.map((r) => (
            <li key={`${r.key}-${r.id}`}>
              <button type="button" role="option" aria-selected={false} onMouseDown={(e) => e.preventDefault()} onClick={() => { onChange(r); setTerm(''); setOpen(false); }}>
                <Avatar name={r.name} />
                <span style={{ minWidth: 0 }}><b>{r.name}</b>{r.sub && <span className="comms-hint" style={{ display: 'block', margin: 0 }} dir="auto">{r.sub}</span>}</span>
              </button>
            </li>
          ))}
          {hidden > 0 && <li className="comms-hint" style={{ padding: '8px 10px', borderTop: '1px solid #E2E8F0' }}>و{hidden} غيرها — اكتب جزءًا من الاسم أو الهاتف لتضييق النتائج.</li>}
        </ul>
      )}
    </div>
  );
}
