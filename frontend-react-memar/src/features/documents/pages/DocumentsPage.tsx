import { type CSSProperties, useState } from 'react';

import { DocumentEditModal } from '../components/DocumentEditModal';
import { GenerateModal } from '../components/GenerateModal';
import { TemplateFormModal } from '../components/TemplateFormModal';
import { useDeleteDocument, useDeleteTemplate, useGeneratedDocs, useTemplates } from '../hooks/useDocuments';
import { printDocument } from '../print';
import { TEMPLATE_TYPE_LABELS, type DocumentTemplate, type GeneratedDocument } from '../types';

type Tab = 'generated' | 'templates';

export function DocumentsPage() {
  const [tab, setTab] = useState<Tab>('generated');
  const [tplModal, setTplModal] = useState(false);
  const [genModal, setGenModal] = useState(false);
  const [editingTpl, setEditingTpl] = useState<DocumentTemplate | null>(null);
  const [editingDoc, setEditingDoc] = useState<GeneratedDocument | null>(null);

  const templates = useTemplates();
  const generated = useGeneratedDocs();
  const delTpl = useDeleteTemplate();
  const delDoc = useDeleteDocument();

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', gap: '12px', flexWrap: 'wrap' }}>
        <h1 style={{ margin: 0 }}>أتمتة المستندات</h1>
        {tab === 'generated'
          ? <button className="btn btn-primary" onClick={() => setGenModal(true)} type="button">📄 توليد مستند</button>
          : <button className="btn btn-primary" onClick={() => { setEditingTpl(null); setTplModal(true); }} type="button">+ قالب جديد</button>}
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button type="button" style={chip(tab === 'generated')} onClick={() => setTab('generated')}>المستندات المولّدة</button>
        <button type="button" style={chip(tab === 'templates')} onClick={() => setTab('templates')}>القوالب</button>
      </div>

      <div className="card" style={{ padding: '16px' }}>
        {tab === 'generated' ? (
          generated.isLoading ? <p>جارٍ التحميل…</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr><th style={th}>العنوان</th><th style={th}>القالب</th><th style={th}>المشروع</th><th style={th}>التاريخ</th><th style={th}>إجراءات</th></tr></thead>
                <tbody>
                  {(generated.data?.data ?? []).map((d) => (
                    <tr key={d.id}>
                      <td style={td}><b>{d.title}</b></td>
                      <td style={td}>{d.template ?? '—'}</td>
                      <td style={td}>{d.project?.name ?? '—'}</td>
                      <td style={td}>{d.created_at ? new Date(d.created_at).toLocaleDateString('ar') : '—'}</td>
                      <td style={{ ...td, whiteSpace: 'nowrap' }}>
                        <button className="btn btn-sm" type="button" onClick={() => setEditingDoc(d)}>✍️ تحرير</button>{' '}
                        <button className="btn btn-sm" type="button" style={{ background: '#274A78', color: '#fff' }} onClick={() => printDocument(d.title, d.body_html)}>🖨️ طباعة</button>{' '}
                        <button className="btn btn-sm" type="button" style={{ color: '#ef4444' }} onClick={() => confirm(`حذف "${d.title}"؟`) && delDoc.mutate(d.id)}>حذف</button>
                      </td>
                    </tr>
                  ))}
                  {(generated.data?.data.length ?? 0) === 0 && <tr><td style={td} colSpan={5}><span style={{ opacity: 0.6 }}>لا توجد مستندات مولّدة.</span></td></tr>}
                </tbody>
              </table>
            </div>
          )
        ) : (
          templates.isLoading ? <p>جارٍ التحميل…</p> : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead><tr><th style={th}>القالب</th><th style={th}>النوع</th><th style={th}>الحالة</th><th style={th}>إجراءات</th></tr></thead>
                <tbody>
                  {(templates.data?.data ?? []).map((t) => (
                    <tr key={t.id}>
                      <td style={td}><b>{t.name}</b></td>
                      <td style={td}>{TEMPLATE_TYPE_LABELS[t.type]}</td>
                      <td style={td}><span style={{ color: t.is_active ? '#059669' : '#9ca3af' }}>{t.is_active ? '● مفعّل' : '○ موقوف'}</span></td>
                      <td style={{ ...td, whiteSpace: 'nowrap' }}>
                        <button className="btn btn-sm" type="button" onClick={() => { setEditingTpl(t); setTplModal(true); }}>تعديل</button>{' '}
                        <button className="btn btn-sm" type="button" style={{ color: '#ef4444' }} onClick={() => confirm(`حذف "${t.name}"؟`) && delTpl.mutate(t.id)}>حذف</button>
                      </td>
                    </tr>
                  ))}
                  {(templates.data?.data.length ?? 0) === 0 && <tr><td style={td} colSpan={4}><span style={{ opacity: 0.6 }}>لا توجد قوالب — أنشئ قالبًا أولاً.</span></td></tr>}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {editingDoc && <DocumentEditModal document={editingDoc} onClose={() => setEditingDoc(null)} />}
      {tplModal && <TemplateFormModal template={editingTpl} onClose={() => setTplModal(false)} />}
      {genModal && <GenerateModal onClose={() => setGenModal(false)} />}
    </div>
  );
}

const chip = (active: boolean): CSSProperties => ({
  padding: '8px 18px', borderRadius: '999px', border: '1px solid', borderColor: active ? '#274A78' : '#e2e8f0',
  background: active ? '#274A78' : '#fff', color: active ? '#fff' : '#475569', fontFamily: 'inherit', fontSize: '14px', cursor: 'pointer',
});
const th: CSSProperties = { textAlign: 'right', padding: '10px 12px', borderBottom: '2px solid #e5e7eb', fontSize: '13px', opacity: 0.7 };
const td: CSSProperties = { padding: '10px 12px', borderBottom: '1px solid #f0f0f0' };
