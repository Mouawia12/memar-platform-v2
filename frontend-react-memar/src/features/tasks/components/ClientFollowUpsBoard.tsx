import { type CSSProperties, useRef, useState } from 'react';

import { useEdgeAutoScroll } from '../../../hooks/useEdgeAutoScroll';
import { personColor, personInitials, shortName } from '../../crm/types';
import { CARD_ACTIVITY_STYLES, fullStamp, shortStamp } from './cardActivityStyles';
import type { FollowUp } from '../api/followUpsApi';
import { FollowUpDetailModal } from './FollowUpDetailModal';
import { repeatLabel } from './RepeatPicker';

type Col = 'scheduled' | 'today' | 'overdue' | 'done';

const COLUMNS: { key: Col; label: string; icon: string; color: string }[] = [
  { key: 'scheduled', label: 'مجدولة', icon: '🗓️', color: '#1B6CA8' },
  { key: 'today', label: 'اليوم', icon: '📌', color: '#E8A838' },
  { key: 'overdue', label: 'متأخرة', icon: '⚠️', color: '#DC4A3D' },
  { key: 'done', label: 'منجزة', icon: '✅', color: '#2D9B6F' },
];


const todayStr = () => new Date().toISOString().slice(0, 10);

/** عمود المتابعة حسب موعدها وحالتها. */
function columnOf(f: FollowUp): Col {
  if (f.done) return 'done';
  const day = f.remind_at?.slice(0, 10);
  if (!day) return 'scheduled';
  if (day < todayStr()) return 'overdue';
  if (day === todayStr()) return 'today';

  return 'scheduled';
}

/**
 * شارة التوجيه على البطاقة — أيقونة ورقم، والشرح في التلميح (طلب أيمن
 * 2026-08-29). نفس حالات بطاقة المهمة حرفًا بحرف كي لا يختلف المعنى بينهما.
 */
function cardBadge(f: FollowUp) {
  if (!f.directive) return null;
  const unread = f.directive_unread ?? 0;
  if (unread > 0) {
    return f.directive_awaits_me
      ? { icon: '🔔', hint: 'رسالة جديدة من الإدارة — اضغط للقراءة والردّ', tone: awaitChip, dot: true }
      : { icon: '✅', hint: 'ردّ جديد في خيط التوجيه — اضغط لقراءته', tone: doneChip, dot: true };
  }
  if (f.directive_awaits_me) {
    return { icon: '📣', hint: 'بانتظار ردّك — اضغط للردّ', tone: awaitChip, dot: false };
  }

  return f.directive.replied
    ? { icon: '✅', hint: 'تم الرد — اضغط لعرض الخيط', tone: doneChip, dot: false }
    : { icon: '📤', hint: 'تم الإرسال — بانتظار ردّ صاحب المتابعة', tone: sentChip, dot: false };
}

/**
 * لوحة المتابعة (كانبان) — متابعات العملاء مستقلّة عن المهام، أسفل الصفحة
 * (طلب أيمن 2026-08-24). مصدرها تذكيرات الفرص، والضغط على بطاقة يفتح فرصتها.
 */
interface BoardProps {
  items: FollowUp[];
  /** معرّف المستخدم الحالي — لتمييز متابعاتي وسط متابعات الفريق. */
  meId?: number | null;
  /** تمييز متابعاتي (عند عرض «جميع المتابعات») — طلب أيمن 2026-08-29. */
  highlightMine?: boolean;
  /** فتح خيط التوجيهات لمتابعة. */
  onDirective?: (f: FollowUp) => void;
  /** يملك إرسال التوجيهات (الإدارة) — يرى الزرّ على كل البطاقات. */
  canSendDirective?: boolean;
}

export function ClientFollowUpsBoard({ items, meId, highlightMine, onDirective, canSendDirective }: BoardProps) {
  const boardRef = useRef<HTMLDivElement>(null);
  useEdgeAutoScroll(boardRef);
  // النقر على بطاقة المتابعة يفتح تفاصيلها (طلب أيمن 2026-08-25).
  const [detail, setDetail] = useState<FollowUp | null>(null);
  // «متابعتي» = المكلَّف بها أنا؛ وبلا مكلَّف تبقى لمنشئها — نفس قاعدة الخادم
  // في فلتر «متابعاتي فقط»، فلا يختلف معنى «لي» بين الفلتر والتمييز.
  const isMine = (f: FollowUp) => !!meId && (f.assignee ? f.assignee.id === meId : f.creator?.id === meId);
  /*
   * لا نميّز إن كان المعروض متابعاتي وحدها (كلّها لي فلا مقارنة)، ولا إن لم
   * تكن لي متابعة في المعروض أصلًا — وإلا بدت اللوحة كلّها باهتة بلا فائدة.
   */
  const markMine = !!highlightMine && !!meId && items.some(isMine);
  const directiveFor = (f: FollowUp) =>
    onDirective && (canSendDirective || f.directive) ? onDirective : undefined;

  return (
    <div ref={boardRef} className="crm-hscroll" style={board}>
      {COLUMNS.map((col) => {
        const list = items.filter((f) => columnOf(f) === col.key);
        return (
          <div key={col.key} style={column}>
            <div style={{ ...header, borderTop: `3px solid ${col.color}` }}>
              <span style={{ fontWeight: 800, fontSize: '13px', color: '#1A1F2E' }}>{col.icon} {col.label}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                {/* «منها لي» يقول للموظف كم يخصّه في العمود دون أن يعدّ البطاقات. */}
                {markMine && list.filter(isMine).length > 0 && (
                  <span style={mineChip} title="متابعاتي في هذا العمود">{list.filter(isMine).length} لي</span>
                )}
                <span style={{ ...count, color: col.color, background: `${col.color}1a` }}>{list.length}</span>
              </span>
            </div>
            <div style={body}>
              {list.length === 0 && <p style={{ opacity: 0.4, fontSize: '12.5px', textAlign: 'center', padding: '18px 0' }}>لا متابعات</p>}
              {list.map((f) => {
                const c = f.owner ? personColor(f.owner.id) : '#94A3B8';
                const mine = markMine && isMine(f);
                const unread = f.directive_unread ?? 0;
                const badge = cardBadge(f);
                const directive = f.directive ?? null;
                const lastMessage = directive?.last_message ?? null;
                return (
                  <div
                    key={f.id}
                    className={`crm-lead-card${unread > 0 ? ' task-card-directive' : ''}`}
                    style={{ ...card, borderRight: `5px solid ${col.color}`, ...(mine ? mineRing : null) }}
                    onClick={() => setDetail(f)} title="فتح تفاصيل المتابعة">
                    <div style={topLine}>
                      <span style={code}>#FUP-{String(f.id).padStart(3, '0')}</span>
                      {mine && <span style={mineTag}>متابعتي</span>}
                      {/* عدد المتابعات الفائتة مع سهم تأخّر (طلب أيمن 2026-08-25). */}
                      {f.late_cycles > 0 && (
                        <span style={lateBadge} title={`فاتت ${f.late_cycles} متابعة`}>↩ {f.late_cycles}</span>
                      )}
                      {f.repeat_every && (
                        <span style={repeatBadge} title="متابعة دورية">🔁 {repeatLabel(f.repeat_every)}</span>
                      )}
                    </div>
                    <div style={title}>{f.contact ?? 'عميل'}</div>
                    <div style={metaRow}>
                      {f.owner && (
                        <span style={ownerRow} title={`المكلّف: ${f.owner.name}`}>
                          <span style={{ ...avatar, background: c }}>{personInitials(f.owner.name)}</span>
                          <span style={{ fontSize: '9.5px', fontWeight: 800, color: c }}>{shortName(f.owner.name)}</span>
                        </span>
                      )}
                      {f.remind_at && <span style={date}>📅 {f.remind_at.slice(0, 10)}</span>}
                    </div>
                    {f.note && <div style={note}>{f.note}</div>}
                    {f.project && <div style={projectLine} title={f.project.name}>🏗️ {f.project.name}</div>}

                    {/* نصّ التوجيه ثم آخر ردّ عليه — كان الردّ يظهر وحده فيصل
                        التوجيه الجديد بلا نصّ (طلب أيمن 2026-08-29). */}
                    {directive && (
                      <div
                        style={directiveLine}
                        title={`${directive.sender?.name ?? 'الإدارة'} · ${fullStamp(directive.created_at)}\n${directive.body}`}
                        onClick={(e) => { e.stopPropagation(); directiveFor(f)?.(f); }}
                      >
                        <span style={replyHead}>
                          <span style={{ fontSize: '10px', lineHeight: 1 }}>📣</span>
                          <b style={{ color: '#92400E' }}>{directive.sender ? shortName(directive.sender.name) : 'الإدارة'}</b>
                          <span style={replyDate}>{shortStamp(directive.created_at)}</span>
                          {!lastMessage && directiveFor(f) && <span style={replyMark} title="الردّ على هذا التوجيه">↩ ردّ</span>}
                        </span>
                        <span style={replyBody}>{directive.body}</span>
                      </div>
                    )}

                    {lastMessage && (
                      <div
                        style={{ ...replyLine, ...(unread > 0 ? replyLineNew : null) }}
                        title={`${lastMessage.user?.name ?? 'مستخدم'} · ${fullStamp(lastMessage.created_at)}\n${lastMessage.body}`}
                        onClick={(e) => { e.stopPropagation(); directiveFor(f)?.(f); }}
                      >
                        <span style={replyHead}>
                          <span style={{ fontSize: '10px', lineHeight: 1 }}>↩️</span>
                          <b style={{ color: '#475569' }}>{lastMessage.user ? shortName(lastMessage.user.name) : 'مستخدم'}</b>
                          <span style={replyDate}>{shortStamp(lastMessage.created_at)}</span>
                          {unread > 0 && <span style={replyNewTag}>جديد</span>}
                          {directiveFor(f) && <span style={replyMark} title="الردّ على هذه الرسالة">↩ ردّ</span>}
                        </span>
                        <span style={replyBody}>{lastMessage.body}</span>
                      </div>
                    )}

                    <div style={foot}>
                      {badge && (
                        <button
                          type="button"
                          className={unread > 0 ? 'directive-badge-new' : undefined}
                          title={`${badge.hint}\n${f.directive?.sender?.name ?? 'الإدارة'}: ${f.directive?.body ?? ''}`}
                          aria-label={badge.hint}
                          disabled={!directiveFor(f)}
                          onClick={(e) => { e.stopPropagation(); directiveFor(f)?.(f); }}
                          style={{ ...chip, ...badge.tone, ...badgeBtn, cursor: directiveFor(f) ? 'pointer' : 'default' }}
                        >
                          {badge.dot && <span style={dot}>●</span>}
                          {badge.icon}
                          {(f.directive_messages_count ?? 0) > 0 && <b>{f.directive_messages_count}</b>}
                        </button>
                      )}
                      {directiveFor(f) && !f.directive && (
                        <button
                          type="button"
                          title="إرسال توجيه لصاحب المتابعة"
                          onClick={(e) => { e.stopPropagation(); directiveFor(f)?.(f); }}
                          style={directiveBtn}
                        >📣 توجيه</button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
      {detail && <FollowUpDetailModal item={detail} onClose={() => setDetail(null)} />}
    </div>
  );
}

// صفّ أفقي واحد بتمرير جانبي — لا التفاف للأعمدة (طلب أيمن 2026-08-24).
const board: CSSProperties = { display: 'flex', gap: '12px', alignItems: 'flex-start', overflowX: 'auto', paddingBottom: '8px', scrollbarWidth: 'thin', scrollbarColor: '#CBD5E1 transparent' };
const column: CSSProperties = { display: 'flex', flexDirection: 'column', background: '#F0F4F8', borderRadius: '10px', padding: '9px', minHeight: '120px', flex: '0 0 300px', width: '300px', minWidth: '300px' };
const header: CSSProperties = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', background: '#fff', border: '1px solid #E9EEF4', borderRadius: '8px', padding: '8px 10px', marginBottom: '8px', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' };
const count: CSSProperties = { fontSize: '11px', fontWeight: 900, borderRadius: '999px', padding: '1px 9px' };
const body: CSSProperties = { display: 'flex', flexDirection: 'column', maxHeight: '420px', overflowY: 'auto' };
const card: CSSProperties = { position: 'relative', background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: '10px', padding: '8px 12px 8px 10px', marginBottom: '7px', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' };
const topLine: CSSProperties = { display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap' };
const lateBadge: CSSProperties = { background: '#FEF2F2', color: '#DC4A3D', border: '1px solid #FCA5A5', borderRadius: '999px', padding: '0 7px', fontSize: '9.5px', fontWeight: 900 };
const repeatBadge: CSSProperties = { background: '#F1F5F9', color: '#5A6478', borderRadius: '999px', padding: '0 7px', fontSize: '9px', fontWeight: 800 };
const code: CSSProperties = { fontSize: '9px', color: '#94A3B8', fontWeight: 700, letterSpacing: '.4px' };
const title: CSSProperties = { fontSize: '12px', fontWeight: 800, color: '#1A1F2E', marginTop: '1px' };
const metaRow: CSSProperties = { display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center', marginTop: '5px' };
const ownerRow: CSSProperties = { display: 'inline-flex', alignItems: 'center', gap: '5px' };
const avatar: CSSProperties = { width: '18px', height: '18px', borderRadius: '50%', color: '#fff', fontSize: '8px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' };
const date: CSSProperties = { fontSize: '9.5px', color: '#64748B', fontWeight: 700 };
const projectLine: CSSProperties = { fontSize: '9.5px', color: '#64748B', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const note: CSSProperties = { fontSize: '10px', color: '#475569', background: '#F1F5F9', borderRadius: '7px', padding: '5px 9px', marginTop: '6px', lineHeight: 1.6 };
// أنماط نشاط البطاقة مشتركة مع بطاقة المهمة — مصدر واحد كي لا يتباعد الشكلان.
const {
  mineRing, mineTag, mineChip, chip, badgeBtn, dot, sentChip, awaitChip, doneChip,
  directiveBtn, directiveLine, replyLine, replyLineNew, replyHead, replyDate, replyNewTag, replyBody, replyMark, foot,
} = CARD_ACTIVITY_STYLES;
