import { Fragment, type CSSProperties, useMemo, useState } from 'react';

import type { Lead, PipelineStage } from '../types';
import { SlaQuickPicker } from './SlaRail';
import {
  PRIORITY_META, STATUS_META, boardStatus, compareLeads, contactCountdown, formatDate, formatKwd, hasPendingPoints,
  initials, isActionRequired, isAnswerUnread, isFreshAnswer, mailtoLink, nextStageOf, slaOf, totalPointsOf, valueOf,
  whatsappLink, type SortKey,
} from './model';

const PAGE_SIZE = 15;

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: 'code', label: '#' },
  { key: 'name', label: 'العميل' },
  { key: 'stage', label: 'المرحلة' },
  { key: 'priority', label: 'الأهمية' },
  { key: 'value', label: 'السعر (د.ك)' },
  { key: 'points', label: 'النقاط' },
  { key: 'owner', label: 'المكلّف' },
  { key: 'due', label: 'موعد التواصل' },
];

interface Props {
  leads: Lead[];
  stages: PipelineStage[];
  isManager: boolean;
  meId?: number;
  showTotals: boolean;
  flashing: Set<number>;
  onOpen: (lead: Lead) => void;
  onEdit: (lead: Lead) => void;
  onArchive: (lead: Lead) => void;
  onAdvance: (lead: Lead) => void;
  onWriteEntry: (lead: Lead, text: string) => Promise<unknown>;
  onRequestUpdate: (lead: Lead, body: string, hours: number | null) => Promise<unknown>;
}

export function TableView({ leads, stages, isManager, meId, showTotals, flashing, onOpen, onEdit, onArchive, onAdvance, onWriteEntry, onRequestUpdate }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>('due');
  const [dir, setDir] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(0);
  const [composing, setComposing] = useState<number | null>(null);
  const [asking, setAsking] = useState<number | null>(null);
  const [draft, setDraft] = useState('');
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);

  const stageBy = useMemo(() => new Map(stages.map((s) => [s.key, s])), [stages]);
  const sorted = useMemo(() => [...leads].sort((a, b) => compareLeads(a, b, sortKey, dir, stages)), [leads, sortKey, dir, stages]);
  const pageCount = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(page, pageCount - 1);
  const rows = sorted.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  const toggleSort = (key: SortKey) => {
    if (key === sortKey) { setDir((d) => (d === 'asc' ? 'desc' : 'asc')); return; }
    setSortKey(key); setDir('asc'); setPage(0);
  };

  const saveDraft = async (lead: Lead) => {
    const text = draft.trim();
    if (!text || busy) return;
    setBusy(true);
    try { await onWriteEntry(lead, text); setDraft(''); setComposing(null); } finally { setBusy(false); }
  };

  const sendRequest = async (lead: Lead, hours: number | null) => {
    if (busy) return;
    setBusy(true);
    try { await onRequestUpdate(lead, question.trim(), hours); setQuestion(''); setAsking(null); } finally { setBusy(false); }
  };

  return (
    <div className="crmx-table-wrap">
      <div className="crmx-scroll">
        <table className="crmx-table">
          <thead>
            <tr>
              {COLUMNS.map((c) => (
                <th key={c.key}>
                  <button type="button" className={sortKey === c.key ? 'on' : ''} onClick={() => toggleSort(c.key)} aria-sort={sortKey === c.key ? (dir === 'asc' ? 'ascending' : 'descending') : undefined}>
                    {c.label}
                    {sortKey === c.key && <i className={`fa-solid fa-arrow-${dir === 'asc' ? 'up' : 'down'}`} style={{ fontSize: 10 }} />}
                  </button>
                </th>
              ))}
              <th>الحالة</th>
              <th>إجراءات</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 && (
              <tr><td colSpan={COLUMNS.length + 2} style={{ padding: '40px 12px', textAlign: 'center', fontWeight: 600, color: '#94A3B8' }}>لا توجد فرص مطابقة للفلاتر الحالية</td></tr>
            )}
            {rows.map((lead) => {
              const status = boardStatus(lead);
              const meta = STATUS_META[status];
              const action = isActionRequired(status);
              const answered = status === 'answered';
              const sla = slaOf(lead);
              const overdue = action && !!sla && sla.deadlineAt <= Date.now();
              const countdown = contactCountdown(lead.reminder?.remind_at);
              const stage = stageBy.get(lead.stage);
              const next = nextStageOf(lead.stage, stages);
              const emphasis = overdue ? 'expired x-expired' : action ? 'action x-need-action' : answered && isFreshAnswer(lead) ? 'x-answered' : '';
              const dotColor = answered && !isAnswerUnread(lead) ? '#CBD5E1' : meta.accent;
              const canWrite = isManager || lead.owner?.id === meId;
              const wa = whatsappLink(lead);
              const mail = mailtoLink(lead);

              return (
                <Fragment key={lead.id}>
                  <tr className={`row ${emphasis}${flashing.has(lead.id) ? (answered ? ' x-flash-green' : ' x-flash') : ''}`} onClick={() => onOpen(lead)}>
                    <td className="num" style={{ fontWeight: 700, color: '#94A3B8' }}>#{lead.id}</td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        {overdue
                          ? <i className="fa-solid fa-phone-volume x-phone" style={{ color: '#C0382C', fontSize: 11 }} aria-hidden />
                          : <span className={`crmx-dot${action || countdown?.late ? ' x-timer-pulse' : ''}`} style={{ width: 8, height: 8, background: dotColor }} aria-hidden />}
                        <span style={{ fontWeight: 800, color: '#1E293B', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>{lead.full_name}</span>
                        {lead.is_vip && <span style={{ color: '#E8A838' }}>★</span>}
                      </span>
                      <span className="num" style={{ display: 'block', fontSize: 10.5, fontWeight: 600, color: '#94A3B8' }}>
                        {[lead.phone, lead.project_type].filter(Boolean).join(' • ') || '—'}
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', fontSize: 11.5, fontWeight: 800, color: stage?.color }}>
                        <span className="crmx-dot" style={{ width: 6, height: 6, background: stage?.color }} />{stage?.label ?? lead.stage}
                      </span>
                    </td>
                    <td>
                      <span className="crmx-chip" style={{ color: PRIORITY_META[lead.priority]?.color, background: PRIORITY_META[lead.priority]?.background, borderColor: PRIORITY_META[lead.priority]?.border, fontSize: 10 }}>
                        {PRIORITY_META[lead.priority]?.label}
                      </span>
                    </td>
                    <td className="num" style={{ fontWeight: 800, color: '#1760A0' }}>{showTotals ? formatKwd(valueOf(lead)) : '—'}</td>
                    <td>
                      {hasPendingPoints(lead)
                        ? <span className="crmx-chip" style={{ color: '#D09520', background: '#FFFBEB', borderColor: '#FDE68A', fontSize: 10 }}>بانتظار المدير</span>
                        : <span className="crmx-chip num" style={{ color: '#1F7A57', background: '#ECFDF5', borderColor: '#A7F3D0', fontSize: 10.5, fontWeight: 800 }}>{totalPointsOf(lead)}</span>}
                    </td>
                    <td>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span className="num" style={{ display: 'grid', placeItems: 'center', width: 20, height: 20, borderRadius: '50%', background: '#1B6CA8', color: '#fff', fontSize: 9, fontWeight: 800, flexShrink: 0 }}>{initials(lead.owner?.name ?? '')}</span>
                        <span style={{ fontSize: 11, fontWeight: 700, whiteSpace: 'nowrap' }}>{lead.owner?.name ?? '—'}</span>
                      </span>
                    </td>
                    <td>
                      <span className="num" style={{ display: 'block', whiteSpace: 'nowrap', fontSize: 11, fontWeight: 700 }}>{formatDate(lead.reminder?.remind_at)}</span>
                      {countdown && (
                        <span style={{ display: 'block', fontSize: 10, fontWeight: 800, color: countdown.late ? '#C0382C' : countdown.urgent ? '#D09520' : '#1F7A57' }}>{countdown.short}</span>
                      )}
                    </td>
                    <td><span className="crmx-chip" style={{ ...meta.chip, fontSize: 10 }}>{meta.short}</span></td>
                    <td onClick={(e) => e.stopPropagation()}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        {canWrite && (
                          <button type="button" className="crmx-icon-btn" title="اكتب تحديثاً" aria-label="اكتب تحديثاً"
                            style={composing === lead.id ? { ...btn.blue, background: '#1B6CA8', color: '#fff' } : btn.blue}
                            onClick={() => { setAsking(null); setDraft(''); setComposing(composing === lead.id ? null : lead.id); }}>
                            <i className="fa-regular fa-note-sticky" />
                          </button>
                        )}
                        {canWrite && (
                          <button type="button" className="crmx-icon-btn" disabled={!next} title={next ? `النقل إلى: ${next.label}` : 'هذه آخر مرحلة'} aria-label="المرحلة التالية" style={btn.green} onClick={() => onAdvance(lead)}>
                            <i className="fa-solid fa-arrow-left" />
                          </button>
                        )}
                        {isManager && (
                          <button type="button" className="crmx-icon-btn" title="اسأل أو اطلب تحديثاً" aria-label="اسأل أو اطلب تحديثاً" style={btn.red}
                            onClick={() => { setComposing(null); setQuestion(''); setAsking(asking === lead.id ? null : lead.id); }}>
                            <i className="fa-solid fa-bell" />
                          </button>
                        )}
                        {wa && <a className="crmx-icon-btn" href={wa} target="_blank" rel="noreferrer" title="مراسلة واتساب" aria-label="مراسلة واتساب" style={btn.green}><i className="fa-brands fa-whatsapp" /></a>}
                        {mail && <a className="crmx-icon-btn" href={mail} title="إرسال بريد" aria-label="إرسال بريد" style={btn.blue}><i className="fa-regular fa-envelope" /></a>}
                        {canWrite && (
                          <button type="button" className="crmx-icon-btn" title="تعديل الفرصة" aria-label="تعديل الفرصة" style={btn.orange} onClick={() => onEdit(lead)}>
                            <i className="fa-solid fa-pen" />
                          </button>
                        )}
                        {isManager && (
                          <button type="button" className="crmx-icon-btn" title={lead.archived_at ? 'إرجاع من الأرشيف' : 'أرشفة الفرصة'} aria-label={lead.archived_at ? 'إرجاع من الأرشيف' : 'أرشفة الفرصة'} style={btn.grey} onClick={() => onArchive(lead)}>
                            <i className={`fa-solid ${lead.archived_at ? 'fa-box-open' : 'fa-box-archive'}`} />
                          </button>
                        )}
                      </span>
                    </td>
                  </tr>

                  {composing === lead.id && (
                    <tr style={{ background: '#F8FBFF' }}>
                      <td colSpan={COLUMNS.length + 2}>
                        <div style={{ maxWidth: 720, marginInline: 'auto' }}>
                          <p style={{ display: 'flex', alignItems: 'center', gap: 4, margin: '0 0 6px', fontSize: 11.5, fontWeight: 800, color: '#1760A0' }}>
                            <i className="fa-solid fa-pen" /> {action ? 'ردّك على طلب الإدارة' : 'اكتب تحديثاً'} — {lead.full_name}
                          </p>
                          <textarea className="crmx-textarea" style={{ minHeight: 64, fontSize: 11.5, borderColor: '#D1E9F9' }} value={draft} autoFocus
                            onChange={(e) => setDraft(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Escape') setComposing(null); if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void saveDraft(lead); }}
                            placeholder="اكتب تحديث المشروع هنا..." />
                          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                            <button type="button" className="crmx-btn sm primary" disabled={!draft.trim() || busy} onClick={() => void saveDraft(lead)}><i className="fa-solid fa-check-double" /> حفظ</button>
                            <button type="button" className="crmx-btn sm muted" onClick={() => setComposing(null)}><i className="fa-solid fa-xmark" /> إلغاء</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}

                  {asking === lead.id && (
                    <tr style={{ background: '#FFF7F6' }}>
                      <td colSpan={COLUMNS.length + 2}>
                        <div style={{ maxWidth: 720, marginInline: 'auto' }}>
                          <p style={{ display: 'flex', alignItems: 'center', gap: 4, margin: '0 0 6px', fontSize: 11.5, fontWeight: 800, color: '#C0382C' }}>
                            <i className="fa-solid fa-bell" /> اسأل أو اطلب تحديثاً — {lead.full_name}
                          </p>
                          <textarea className="crmx-textarea" style={{ minHeight: 64, fontSize: 11.5, borderColor: '#FBC5C0' }} value={question} autoFocus
                            onChange={(e) => setQuestion(e.target.value)} onKeyDown={(e) => { if (e.key === 'Escape') setAsking(null); }}
                            placeholder="اكتب سؤالك للموظف، أو اتركه فارغاً لطلب تحديث فقط..." />
                          <div style={{ marginTop: 8, padding: 10, border: '1px solid #FED7AA', borderRadius: 12, background: '#FFF7ED' }}>
                            <p style={{ margin: '0 0 2px', fontSize: 12, fontWeight: 800, color: '#C2410C' }}><i className="fa-regular fa-clock" /> اختر مهلة الرد</p>
                            <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 600, color: '#9A3412' }}>اضغط على المهلة ليُرسل الطلب فوراً، أو «بدون مهلة» فيظهر للموظف كـ «مطلوب الآن».</p>
                            <SlaQuickPicker onPick={(h) => void sendRequest(lead, h)} disabled={busy} />
                            <button type="button" className="crmx-btn sm muted" style={{ marginTop: 8 }} onClick={() => setAsking(null)}><i className="fa-solid fa-xmark" /> إلغاء</button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="crmx-pager">
        <p className="num" style={{ margin: 0, fontSize: 11.5, fontWeight: 600, color: '#64748B' }}>
          {sorted.length === 0 ? 'لا نتائج' : `عرض ${safePage * PAGE_SIZE + 1}–${Math.min((safePage + 1) * PAGE_SIZE, sorted.length)} من ${sorted.length}`}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button type="button" className="crmx-btn sm" disabled={safePage === 0} onClick={() => setPage(Math.max(0, safePage - 1))}><i className="fa-solid fa-chevron-right" /> السابق</button>
          <span className="num" style={{ padding: '6px 10px', borderRadius: 8, background: '#fff', fontSize: 11.5, fontWeight: 800, color: '#1760A0' }}>{safePage + 1} / {pageCount}</span>
          <button type="button" className="crmx-btn sm" disabled={safePage >= pageCount - 1} onClick={() => setPage(Math.min(pageCount - 1, safePage + 1))}>التالي <i className="fa-solid fa-chevron-left" /></button>
        </div>
      </div>
    </div>
  );
}

const btn: Record<'blue' | 'green' | 'red' | 'orange' | 'grey', CSSProperties> = {
  blue: { borderColor: '#D1E9F9', background: '#EBF5FF', color: '#1760A0' },
  green: { borderColor: '#A7F3D0', background: '#ECFDF5', color: '#1F7A57' },
  red: { borderColor: '#FBC5C0', background: '#FEF2F2', color: '#C0382C' },
  orange: { borderColor: '#FED7AA', background: '#FFF7ED', color: '#C2410C' },
  grey: { borderColor: '#E2E8F0', background: '#fff', color: '#64748B' },
};
