import { useState } from 'react';

import { ExportCsvButton } from '../../../components/ExportCsvButton';
import { contactsApi } from '../api/contactsApi';
import { ContactFormModal } from '../components/ContactFormModal';
import { ContactsTable } from '../components/ContactsTable';
import { useContacts, useDeleteContact } from '../hooks/useContacts';
import { CONTACT_TYPE_LABELS, type Contact, type ContactType } from '../types';

export function ClientsPage() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState<'' | ContactType>('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);

  const { data, isLoading, isError } = useContacts({ search: search || undefined, type: type || undefined, page });
  const del = useDeleteContact();

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (c: Contact) => { setEditing(c); setModalOpen(true); };
  const handleDelete = (c: Contact) => { if (confirm(`حذف "${c.full_name}"؟`)) del.mutate(c.id); };

  const meta = data?.meta;

  /** يجلب كل جهات الاتصال المطابقة للفلاتر الحالية لتصديرها. */
  const fetchAllContacts = async () => {
    const all = await contactsApi.list({ search: search || undefined, type: type || undefined, per_page: 500 });

    return all.data;
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>سجل العملاء</h1>
        <div style={{ display: 'flex', gap: '8px' }}>
          <ExportCsvButton
            filename="clients"
            fetchRows={fetchAllContacts}
            columns={[
              { header: 'الاسم', value: (r: Contact) => r.full_name },
              { header: 'النوع', value: (r: Contact) => CONTACT_TYPE_LABELS[r.type] },
              { header: 'الهاتف', value: (r: Contact) => r.phone },
              { header: 'البريد', value: (r: Contact) => r.email },
              { header: 'الشركة', value: (r: Contact) => r.company },
              { header: 'المسمّى', value: (r: Contact) => r.position },
              { header: 'المسؤول', value: (r: Contact) => r.owner?.name },
            ]}
          />
          <button className="btn btn-primary" onClick={openCreate} type="button">+ عميل جديد</button>
        </div>
      </div>

      <div className="card" style={{ padding: '16px' }}>
        <div style={{ display: 'flex', gap: '10px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <input
            className="input"
            placeholder="بحث بالاسم/الهاتف/الشركة…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{ flex: 1, minWidth: '220px' }}
          />
          <select className="input" value={type} onChange={(e) => { setType(e.target.value as '' | ContactType); setPage(1); }}>
            <option value="">كل الأنواع</option>
            {(Object.keys(CONTACT_TYPE_LABELS) as ContactType[]).map((t) => (
              <option key={t} value={t}>{CONTACT_TYPE_LABELS[t]}</option>
            ))}
          </select>
        </div>

        {isLoading && <p>جارٍ التحميل…</p>}
        {isError && <p style={{ color: '#ef4444' }}>تعذّر تحميل العملاء.</p>}
        {data && <ContactsTable contacts={data.data} onEdit={openEdit} onDelete={handleDelete} />}

        {meta && meta.last_page > 1 && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '14px' }}>
            <button className="btn btn-sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} type="button">السابق</button>
            <span style={{ fontSize: '13px', opacity: 0.7 }}>صفحة {meta.current_page} من {meta.last_page} ({meta.total})</span>
            <button className="btn btn-sm" disabled={page >= meta.last_page} onClick={() => setPage((p) => p + 1)} type="button">التالي</button>
          </div>
        )}
      </div>

      {modalOpen && <ContactFormModal contact={editing} onClose={() => setModalOpen(false)} />}
    </div>
  );
}
