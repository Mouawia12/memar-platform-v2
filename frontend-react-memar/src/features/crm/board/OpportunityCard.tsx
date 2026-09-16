import { type CSSProperties, type KeyboardEvent, type MouseEvent, useEffect, useRef, useState } from 'react';

import { tagColor, type Lead, type PipelineStage } from '../types';
import { SlaQuickPicker, SlaRail } from './SlaRail';
import {
  ACKNOWLEDGED_ACCENT, STATUS_META, boardStatus, contactCountdown, formatKwd, formatRelative, hasPendingPoints,
  initials, isActionRequired, isAnswerUnread, isFreshAnswer, latestEntryOf, likelyPointsOf, promptOf, slaOf, tiersOf,
  valueOf, whatsappLink,
} from './model';
import { playSound } from '../opsNotify';

export interface CardHandlers {
  onOpen: (lead: Lead) => void;
  /** الإدارة: مرورها على ردٍّ جديد اطّلاعٌ عليه. */
  onAcknowledge: (lead: Lead) => void;
  /** الإدارة: «اطلب تحديث» — سؤال اختياري + مهلة. */
  onRequestUpdate: (lead: Lead, body: string, hours: number | null) => Promise<unknown>;
  /** الموظف: «رد الآن» أو «تحديث» من البطاقة. */
  onWriteEntry: (lead: Lead, text: string) => Promise<unknown>;
  /** الموظف: «تم الاتصال» / «لم يرد». */
  onQuickFollowUp: (lead: Lead, label: string) => void;
  /** نقل الفرصة للمرحلة التالية. */
  onAdvance: (lead: Lead) => void;
  /** الإدارة: اعتماد نقاط الأسعار. */
  onPoints: (lead: Lead) => void;
}

interface Props extends CardHandlers {
  lead: Lead;
  isManager: boolean;
  /** يستطيع الردّ/التحديث: صاحب الفرصة أو الإدارة. */
  canWrite: boolean;
  nextStage: PipelineStage | null;
  flashing: boolean;
  dimmed?: boolean;
  tagColors: Map<string, string>;
}

const HOVER_INTENT_MS = 110;
/** مواعيد انتهاء رنّ جرسها في هذه الجلسة — لا يتكرّر مع كل رسم. */
const RUNG = new Set<string>();

export function OpportunityCard({ lead, isManager, canWrite, nextStage, flashing, dimmed, tagColors, ...h }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [writing, setWriting] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [draft, setDraft] = useState('');
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const intent = useRef<number | null>(null);
  useEffect(() => () => { if (intent.current) window.clearTimeout(intent.current); }, []);

  const status = boardStatus(lead);
  const meta = STATUS_META[status];
  const actionRequired = isActionRequired(status);
  const answered = status === 'answered';
  const sla = slaOf(lead);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!sla) return undefined;
    const ms = sla.deadlineAt - Date.now();
    if (ms <= 0) return undefined;
    const id = window.setTimeout(() => setNow(Date.now()), ms + 50);
    return () => window.clearTimeout(id);
  }, [sla]);
  const overdue = actionRequired && !!sla && sla.deadlineAt <= now;
  const openEnded = actionRequired && !sla;
  const unreadAnswer = isAnswerUnread(lead);
  const fresh = answered && isFreshAnswer(lead);
  const prompt = actionRequired ? promptOf(lead) : null;
  const entry = latestEntryOf(lead);
  const countdown = contactCountdown(lead.reminder?.remind_at);
  const unread = lead.directive_unread ?? 0;
  const likelyPoints = likelyPointsOf(lead);
  const pendingPoints = hasPendingPoints(lead);
  const tiers = tiersOf(lead);
  const wa = whatsappLink(lead);

  // جرس ناعم مرّة واحدة لحظة انتهاء المهلة.
  const deadlineKey = overdue && lead.directive ? `${lead.id}:${lead.directive.id}` : null;
  useEffect(() => {
    if (!deadlineKey || RUNG.has(deadlineKey)) return;
    RUNG.add(deadlineKey);
    playSound('expired');
  }, [deadlineKey]);

  const emphasis = overdue ? 'expired' : actionRequired ? 'action' : fresh ? 'answer' : 'none';
  const railColor = overdue ? '#C0382C' : answered && !unreadAnswer ? ACKNOWLEDGED_ACCENT : meta.accent;

  const nextAction = (() => {
    if (overdue) return 'انتهت المهلة — مطلوب رد فوري';
    if (actionRequired) return isManager ? 'بانتظار رد الموظف' : 'مطلوب رد على طلب الإدارة';
    if (countdown?.late) return 'موعد الاتصال متأخر';
    if (answered && isManager) return 'مراجعة رد الموظف';
    if (isManager && pendingPoints) return 'اعتماد نقاط الأسعار';
    if (lead.reminder?.note) return lead.reminder.note;
    return 'لا يوجد إجراء مطلوب الآن';
  })();

  const open = expanded || writing || requesting;
  const stop = (e: MouseEvent | KeyboardEvent) => e.stopPropagation();

  const enter = () => {
    if (isManager && unreadAnswer) h.onAcknowledge(lead);
    if (intent.current) window.clearTimeout(intent.current);
    intent.current = window.setTimeout(() => setExpanded(true), HOVER_INTENT_MS);
  };
  const leave = () => {
    if (intent.current) window.clearTimeout(intent.current);
    if (!writing && !requesting) setExpanded(false);
  };

  const sendEntry = async () => {
    const text = draft.trim();
    if (!text || busy) return;
    setBusy(true);
    try {
      await h.onWriteEntry(lead, text);
      setDraft(''); setWriting(false); setExpanded(false);
    } finally { setBusy(false); }
  };

  const sendRequest = async (hours: number | null) => {
    if (busy) return;
    setBusy(true);
    try {
      await h.onRequestUpdate(lead, question.trim(), hours);
      setQuestion(''); setRequesting(false); setExpanded(false);
    } finally { setBusy(false); }
  };

  const vip = lead.is_vip && !(lead.tags ?? []).includes('VIP');
  const tags = [...(vip ? ['VIP'] : []), ...(lead.tags ?? [])];
  const project = lead.effective_project_name || lead.project_name || lead.project_type || '—';

  return (
    <article
      role="button"
      tabIndex={0}
      onClick={() => h.onOpen(lead)}
      onKeyDown={(e) => { if (!writing && !requesting && (e.key === 'Enter' || e.key === ' ') && e.target === e.currentTarget) { e.preventDefault(); h.onOpen(lead); } }}
      onMouseEnter={enter}
      onMouseLeave={leave}
      aria-label={`الفرصة رقم ${lead.id} — ${lead.full_name} — ${meta.label}`}
      className={[
        'crmx-card',
        emphasis === 'expired' ? 'expired x-expired' : emphasis === 'action' ? 'action x-need-action' : emphasis === 'answer' ? 'x-answered' : '',
        open ? 'open' : '',
        flashing ? (answered ? 'x-flash-green' : 'x-flash') : '',
        dimmed ? 'mine-dim' : '',
      ].join(' ')}
    >
      <SlaRail sla={actionRequired ? sla : null} openEnded={openEnded} dormant={!actionRequired} />
      <span className={`crmx-card-rail${fresh ? ' x-accent-pulse' : ''}`} style={{ backgroundColor: railColor }} aria-hidden />

      <div className="crmx-card-body">
        <div className="crmx-core">
          <div className="crmx-card-top">
            <div style={{ minWidth: 0 }}>
              <h3 className="crmx-card-name" title={lead.full_name}>{lead.full_name}</h3>
              <p className="crmx-card-proj" title={project}>{project}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
              {unread > 0 && (
                <span className="crmx-unread num" style={{ background: actionRequired ? '#DC4A3D' : '#2D9B6F' }} title={`${unread} رسالة غير مقروءة`}>{unread}</span>
              )}
              <span className="crmx-code num">#{lead.id}</span>
            </div>
          </div>

          <div className="crmx-tags">
            {tags.slice(0, 2).map((t) => {
              const c = tagColors.get(t) ?? tagColor(t);
              return t === 'VIP'
                ? <span key={t} className="crmx-tag" style={{ borderColor: '#EBD08A', background: '#FDF8EC', color: '#9A6B08' }}><i className="fa-solid fa-star" style={{ fontSize: 7, color: '#E8A838' }} /> VIP</span>
                : <span key={t} className="crmx-tag" style={{ borderColor: `${c}66`, color: c, background: `${c}10` }}>{t}</span>;
            })}
            {tags.length > 2 && <span className="num" style={{ fontSize: 8.5, fontWeight: 700, color: '#94A3B8' }}>+{tags.length - 2}</span>}
          </div>

          <p className="crmx-price num">
            {valueOf(lead) > 0 ? `${formatKwd(valueOf(lead))} د.ك` : '—'}
            {likelyPoints !== null && (
              <>
                <span style={{ color: '#CBD5E1' }} aria-hidden>·</span>
                <span style={{ fontWeight: 700, color: '#1F7A57' }}>{likelyPoints} نقطة</span>
              </>
            )}
          </p>

          <div className="crmx-msg" style={{ backgroundColor: overdue ? '#FFEDEA' : meta.tint, borderColor: overdue ? '#F0B4AD' : meta.tintBorder }}>
            {actionRequired ? (
              <>
                <p className="crmx-msg-head" style={{ color: '#C0382C' }}>
                  <i className={`fa-solid ${overdue ? 'fa-hourglass-end' : 'fa-circle-exclamation'}`} style={{ fontSize: 9 }} />
                  {overdue ? 'انتهى الوقت' : openEnded ? 'تحديث مطلوب الآن' : 'تحديث مطلوب'}
                  {prompt?.at && <span className="num">{formatRelative(prompt.at)}</span>}
                </p>
                <p className="crmx-msg-text" style={{ color: '#7F1D1D' }} title={prompt?.text}>{prompt?.text}</p>
              </>
            ) : answered ? (
              <>
                <p className="crmx-msg-head" style={{ color: '#1F7A57' }}>
                  <i className="fa-solid fa-circle-check" style={{ fontSize: 9 }} /> تم الرد
                  {entry?.at && <span className="num">{formatRelative(entry.at)}</span>}
                </p>
                <p className="crmx-msg-text" style={{ color: '#334155', fontWeight: 600 }} title={entry?.text}>{entry?.text ?? 'تم تسجيل الرد.'}</p>
              </>
            ) : (
              <p className="crmx-msg-head" style={{ color: '#64748B', fontWeight: 700, height: 24 }}>
                <i className="fa-regular fa-clock" style={{ fontSize: 9, color: '#B6C0CD' }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={entry ? `آخر تحديث: ${entry.text}` : undefined}>
                  {entry ? `آخر تحديث: ${entry.text}` : 'لا يوجد تحديث جديد'}
                </span>
              </p>
            )}
          </div>
        </div>

        <div className="crmx-expand">
          <div>
            <div className="crmx-expand-inner" onClick={stop}>
              <div className="crmx-line">
                <span><i className="fa-solid fa-phone" /><span className="num">{lead.phone || '—'}</span></span>
                {wa && <a className="crmx-mini-link" href={wa} target="_blank" rel="noreferrer" onClick={stop}><i className="fa-brands fa-whatsapp" /> واتساب</a>}
              </div>

              <div className="crmx-line">
                <span><span className="crmx-avatar num">{initials(lead.owner?.name ?? '')}</span>{lead.owner?.name ?? '—'}</span>
                <span className="num" style={{ flexShrink: 0 }}>
                  {tiers.map((t, i) => (
                    <span key={t.index}>
                      {i > 0 && <span style={{ color: '#CBD5E1' }}> / </span>}
                      <span style={t.likely ? { fontWeight: 800, color: '#0F3F63' } : undefined}>{formatKwd(t.value)}</span>
                    </span>
                  ))}
                </span>
              </div>

              <div className="crmx-line">
                <span style={{ color: countdown?.late ? '#C0382C' : undefined, fontWeight: 700 }}>
                  <i className="fa-regular fa-clock" style={{ color: 'inherit' }} />
                  <span className="num">{countdown ? countdown.label : 'لا يوجد موعد تواصل'}</span>
                </span>
                <span className="num" style={{ flexShrink: 0, fontSize: 9, color: '#B6C0CD' }}>
                  <i className="fa-regular fa-message" /> {lead.directive_messages_count ?? 0}
                </span>
              </div>

              <p className="crmx-next"><span>التالي: </span>{nextAction}</p>

              {requesting ? (
                <div className="crmx-composer" style={{ borderColor: '#FED7AA', background: '#FFF7ED' }}>
                  <p style={{ color: '#C2410C' }}><i className="fa-solid fa-bell" /> اطلب تحديث — اكتب السؤال (اختياري) ثم اختر المهلة</p>
                  <textarea
                    className="crmx-textarea"
                    style={{ borderColor: '#FED7AA' }}
                    value={question}
                    autoFocus
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Escape') setRequesting(false); }}
                    placeholder="اكتب سؤالك للموظف، أو اتركه فارغاً لطلب تحديث فقط..."
                  />
                  <div style={{ marginTop: 6 }}><SlaQuickPicker onPick={sendRequest} disabled={busy} /></div>
                  <button type="button" className="crmx-act" style={{ marginTop: 6, flex: 'none' }} onClick={() => { setQuestion(''); setRequesting(false); }}>
                    <i className="fa-solid fa-xmark" /> إلغاء
                  </button>
                </div>
              ) : writing ? (
                <div className="crmx-composer" style={{ borderColor: actionRequired ? '#F6CFCB' : '#E4E9F0', background: actionRequired ? '#FFFAFA' : '#FAFBFD' }}>
                  <p style={{ color: actionRequired ? '#C0382C' : '#475569' }}>
                    <i className={`fa-solid ${actionRequired ? 'fa-comment' : 'fa-pen'}`} />
                    {actionRequired ? 'ردّك على طلب الإدارة' : 'اكتب تحديث المشروع'}
                  </p>
                  <textarea
                    className="crmx-textarea"
                    style={{ borderColor: actionRequired ? '#F6CFCB' : '#E4E9F0' }}
                    value={draft}
                    autoFocus
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') setWriting(false);
                      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void sendEntry();
                    }}
                    placeholder={actionRequired ? 'اكتب ردّك هنا ثم أرسل...' : 'اكتب آخر تحديث للفرصة...'}
                  />
                  <div className="crmx-actions" style={{ marginTop: 4 }}>
                    <button type="button" className="crmx-send" disabled={!draft.trim() || busy} onClick={() => void sendEntry()}>
                      <i className="fa-solid fa-paper-plane" /> {actionRequired ? 'إرسال الرد' : 'إرسال التحديث'}
                    </button>
                    <button type="button" className="crmx-act" style={{ flex: 'none' }} onClick={() => { setDraft(''); setWriting(false); }}>
                      <i className="fa-solid fa-xmark" /> إلغاء
                    </button>
                  </div>
                </div>
              ) : isManager ? (
                <>
                  <div className="crmx-actions">
                    <button type="button" className="crmx-act red" onClick={() => setRequesting(true)}>
                      <i className="fa-solid fa-bell" /> اطلب تحديث
                    </button>
                    <AdvanceButton next={nextStage} onClick={() => h.onAdvance(lead)} />
                  </div>
                  <button type="button" className="crmx-act" onClick={() => h.onPoints(lead)}>
                    <i className="fa-solid fa-trophy" /> {pendingPoints ? 'اعتماد النقاط' : 'نقاط الأسعار'}
                  </button>
                </>
              ) : canWrite ? (
                <>
                  <div className="crmx-actions">
                    <button type="button" className={`crmx-act${actionRequired ? ' red' : ''}`} onClick={() => setWriting(true)}>
                      <i className={`fa-solid ${actionRequired ? 'fa-comment' : 'fa-pen'}`} /> {actionRequired ? 'رد الآن' : 'تحديث'}
                    </button>
                    <AdvanceButton next={nextStage} onClick={() => h.onAdvance(lead)} />
                  </div>
                  <div className="crmx-actions">
                    <button type="button" className="crmx-act" onClick={() => h.onQuickFollowUp(lead, 'تم الاتصال')}><i className="fa-solid fa-phone" /> تم الاتصال</button>
                    <button type="button" className="crmx-act" onClick={() => h.onQuickFollowUp(lead, 'لم يرد')}><i className="fa-solid fa-phone-slash" /> لم يرد</button>
                  </div>
                </>
              ) : null}

              {lead.reminder?.note && (
                <p style={{ display: 'flex', gap: 4, margin: 0, fontSize: 9.5, fontWeight: 600, color: '#64748B' }}>
                  <i className="fa-regular fa-bell" style={{ fontSize: 8, marginTop: 3, color: '#94A3B8' }} />
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lead.reminder.note}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}

function AdvanceButton({ next, onClick }: { next: PipelineStage | null; onClick: () => void }) {
  const title = next ? `النقل إلى: ${next.label}` : 'هذه آخر مرحلة';
  return (
    <button type="button" className="crmx-act go" disabled={!next} onClick={onClick} title={title} aria-label={title} style={iconOnly}>
      <i className="fa-solid fa-arrow-left" />
    </button>
  );
}

const iconOnly: CSSProperties = { fontSize: 11 };
