import { useState, type CSSProperties } from 'react';
import { useNavigate } from 'react-router-dom';

import { ExportCsvButton } from '../../../components/ExportCsvButton';
import { rowOffset } from '../../../lib/rowNumber';
import { usePermission } from '../../auth/hooks/usePermission';
import { contactsApi } from '../api/contactsApi';
import { ContactFormModal } from '../components/ContactFormModal';
import { ContactsTable } from '../components/ContactsTable';
import { useContacts, useDeleteContact } from '../hooks/useContacts';
import { CONTACT_TYPE_LABELS, type Contact } from '../types';

export function ClientsPage() {
  const navigate = useNavigate();
  const canViewProfile = usePermission('clients.view');
  // بوّابة الإجراءات: إضافة/تعديل = crm.manage؛ حذف = crm.delete. طلب أيمن 2026-08-12.
  const canManage = usePermission('crm.manage');
  const canDelete = usePermission('crm.delete');
  const [search, setSearch] = useState('');
  // سجل العملاء لا يعرض الفرص (leads) — تلك في لوحة CRM. فحذف فرصة لا يفرّغ السجل.
  // كل مَن يُسجَّل في CRM يظهر هنا تلقائيًا (طلب أيمن 2026-08-25): الافتراضي
  // «الكل» فيشمل العملاء المحتملين، مع إبقاء الفلترة بنوع بعينه.
  const [type, setType] = useState<'' | 'client' | 'contact' | 'lead'>('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Contact | null>(null);

  /*
   * فلتر التعاقد (طلب أيمن 2026-09-17): «أظهر العملاء اللي موقّعين عقود، واللي
   * تواصلوا معنا بس». المسودة التلقائية لكل مشروع لا تُحتسب عقدًا (يُنفّذه الخادم).
   */
  const [contractState, setContractState] = useState<'' | 'contracted' | 'prospect'>('');

  const { data, isLoading, isError } = useContacts({ search: search || undefined, type: type || undefined, page, contract_state: contractState || undefined });
  const del = useDeleteContact();

  const openCreate = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (c: Contact) => { setEditing(c); setModalOpen(true); };
  const handleDelete = (c: Contact) => { if (confirm(`حذف "${c.full_name}"؟`)) del.mutate(c.id); };

  const meta = data?.meta;

  /** يجلب كل جهات الاتصال المطابقة للفلاتر الحالية لتصديرها. */
  const fetchAllContacts = async () => {
    // التصدير يطابق ما يراه المستخدم على الشاشة — بالفلاتر نفسها.
    const all = await contactsApi.list({ search: search || undefined, type: type || undefined, contract_state: contractState || undefined, per_page: 500 });

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
              { header: 'حالة التعاقد', value: (r: Contact) => (r.has_signed_contract ? 'متعاقد' : 'تواصل فقط') },
            ]}
          />
          {canManage && <button className="btn btn-primary" onClick={openCreate} type="button">+ عميل جديد</button>}
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
          <select className="input" value={type} onChange={(e) => { setType(e.target.value as '' | 'client' | 'contact' | 'lead'); setPage(1); }}>
            <option value="">الكل</option>
            {(['client', 'lead', 'contact'] as const).map((t) => (
              <option key={t} value={t}>{CONTACT_TYPE_LABELS[t]}</option>
            ))}
          </select>
          {CONTRACT_FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              title={f.hint}
              onClick={() => { setContractState(f.key); setPage(1); }}
              style={{ ...chipBtn, ...(contractState === f.key ? chipOn : null) }}
            >{f.label}</button>
          ))}
        </div>

        {isLoading && <p>جارٍ التحميل…</p>}
        {isError && <p style={{ color: '#ef4444' }}>تعذّر تحميل العملاء.</p>}
        {data && (
          <ContactsTable
            contacts={data.data}
            onEdit={openEdit}
            onDelete={handleDelete}
            onViewProfile={canViewProfile ? (c) => navigate(`/clients/${c.id}/profile`) : undefined}
            canManage={canManage}
            canDelete={canDelete}
            rowOffset={rowOffset(meta)}
          />
        )}

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

const CONTRACT_FILTERS: { key: '' | 'contracted' | 'prospect'; label: string; hint: string }[] = [
  { key: '', label: 'الكل', hint: 'كل من في السجل' },
  { key: 'contracted', label: '📄 موقّعون عقودًا', hint: 'له عقد موقّع أو نشط أو منتهٍ — المسودة لا تُحتسب' },
  { key: 'prospect', label: '☎️ تواصل فقط', hint: 'تواصلنا معه ولا عقد رسميّ بيننا بعد' },
];

const chipBtn: CSSProperties = { padding: '0 12px', borderRadius: '999px', border: '1.5px solid #E2E8F0', background: '#fff', color: '#5A6478', fontFamily: 'inherit', fontSize: '12.5px', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' };
const chipOn: CSSProperties = { background: '#1B6CA8', color: '#fff', borderColor: '#1B6CA8' };
