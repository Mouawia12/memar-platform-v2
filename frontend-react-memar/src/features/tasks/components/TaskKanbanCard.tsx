import { type CSSProperties } from 'react';

import { personColor, personInitials, shortName } from '../../crm/types';
import { CARD_ACTIVITY_STYLES, fullStamp, shortStamp } from './cardActivityStyles';
import { PRIORITY_COLORS, dueDiffDays, isDone, type Task } from '../types';

interface Props {
  task: Task;
  onOpen: (t: Task) => void;
  /** صورة المكلّف (data URI) — إن غابت تُعرض أحرف اسمه بلونه. */
  avatarUrl?: string | null;
  /** أُطفئ تنبيه تأخّرها فتوقّف وميضها. */
  acked?: boolean;
  /** إطفاء تنبيه التأخّر (زرّ الجرس على البطاقة). */
  onAck?: (t: Task) => void;
  /** مهمّة المستخدم الحالي — تُبرَز وسط مهام الفريق. */
  mine?: boolean;
  /** مهمّة غيري وأنا أعرض «جميع المهام» — تُخفَّف لتبرز مهامي فوقها. */
  muted?: boolean;
  /** فتح نافذة التوجيهات — إن غابت لا يظهر زرّ التوجيه على البطاقة. */
  onDirective?: (t: Task) => void;
  /** فتح محادثة المهمة من أيقونة التعليقات — إن غابت تفتح البطاقة كالمعتاد. */
  onComments?: (t: Task) => void;
}

/**
 * بطاقة مهمة بشكل كروت الفرص في CRM (طلب أيمن 2026-08-24): شريط لون جانبي
 * حسب الأولوية، صورة المكلّف أو أحرفه بلونه الثابت، وسطر موعد بلون قربه،
 * وشريط تقدّم. المحتوى محتوى المهمة — الشكل فقط هو المشترك.
 */
export function TaskKanbanCard({ task, onOpen, avatarUrl, acked, onAck, mine, muted, onDirective, onComments }: Props) {
  const color = PRIORITY_COLORS[task.priority] ?? '#1B6CA8';
  const done = isDone(task);
  const diff = dueDiffDays(task.due_date);
  const assigneeColor = task.assignee ? personColor(task.assignee.id) : '#94A3B8';
  // المهمة المتأخّرة تومض كتنبيه حتى تُعالَج (طلب أيمن 2026-08-24).
  const overdue = !done && diff !== null && diff < 0 && !acked;
  /*
   * شارة التوجيه على البطاقة (طلب أيمن 2026-08-29): رقم الرسائل + حالة يفهمها
   * كلٌّ من موقعه — المُرسِل يرى «تم الإرسال» ثم «تم الرد» حين يردّ الموظف،
   * والمكلَّف يرى «بانتظار ردّك». النقطة الحمراء = جديد لم يُطَّلع عليه بعد.
   */
  const directive = task.directive ?? null;
  const msgCount = task.directives_count ?? 0;
  const repliedUnseen = task.directives_replied_unseen ?? 0;
  // توجيه وصل للموظف ولم يفتحه بعد — تُنبّه البطاقة كلّها لا الشارة وحدها.
  const newDirective = !!task.directive_is_new;
  /*
   * شارة التوجيه: أيقونة ورقم فقط على البطاقة (طلب أيمن 2026-08-29) — العبارة
   * في التلميح عند تقريب المؤشّر كي تبقى البطاقة نظيفة. والضغط عليها يفتح خيط
   * التوجيه مباشرةً (حيث الردّ)، لا تفاصيل المهمة.
   */
  const badge = !directive
    ? null
    : repliedUnseen > 0
      ? { icon: '✅', hint: 'تم الرد على توجيهك — اضغط لقراءة الردّ', tone: doneChip, dot: true }
      : newDirective
        ? { icon: '🔔', hint: 'رسالة جديدة من الإدارة — اضغط للقراءة والردّ', tone: awaitChip, dot: true }
        : task.directive_awaits_me
          ? { icon: '📣', hint: 'بانتظار ردّك — اضغط للردّ', tone: awaitChip, dot: true }
          : directive.replied
            ? { icon: '✅', hint: 'تم الرد — اضغط لعرض التوجيه وردّه', tone: doneChip, dot: false }
            : { icon: '📤', hint: 'تم الإرسال — بانتظار ردّ المكلَّف', tone: sentChip, dot: false };
  // المهمة المكتملة تُعرض 100% مهما كانت النسبة المسجّلة.
  const pct = done ? 100 : Math.max(0, Math.min(100, task.progress ?? 0));

  const comment = task.last_comment ?? null;
  const commentCount = task.comments_count ?? 0;
  // تعليقات كتبها غيري بعد آخر قراءة لي — تُنبّه الأيقونة وتُبرز سطر التعليق.
  const unreadComments = task.unread_comments ?? 0;
  const openComments = onComments ?? onOpen;

  const due = task.due_date
    ? {
      label: diff === null ? '' : diff < 0 ? `متأخرة ${Math.abs(diff)} يوم` : diff === 0 ? 'اليوم' : `بعد ${diff} يوم`,
      tone: diff === null ? '#64748B' : diff < 0 ? '#DC4A3D' : diff === 0 ? '#E8A838' : '#2D9B6F',
    }
    : null;

  return (
    <div
      className={`crm-lead-card${overdue ? ' task-card-late' : ''}${newDirective && !overdue ? ' task-card-directive' : ''}${muted ? ' task-card-muted' : ''}`}
      onClick={() => onOpen(task)}
      style={{
        ...card,
        borderRight: `5px solid ${done ? '#2D9B6F' : color}`,
        // الظلّ inline يغلب أي قاعدة CSS، فحلقة الإبراز تُضبط هنا لا في ملف الأنماط.
        ...(mine ? mineRing : null),
      }}
    >
      <div style={topRow}>
        {task.assignee && (
          avatarUrl
            ? <img src={avatarUrl} alt={task.assignee.name} title={`المكلّف: ${task.assignee.name}`}
                style={{ ...avatar, objectFit: 'cover', border: `1.5px solid ${assigneeColor}` }} />
            : <span title={`المكلّف: ${task.assignee.name}`} style={{ ...avatar, background: assigneeColor }}>
                {personInitials(task.assignee.name)}
              </span>
        )}
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={codeRow}>
            <span style={code}>#TSK-{String(task.id).padStart(3, '0')}</span>
            {mine && <span style={mineTag}>مهمتي</span>}
          </div>
          <div style={{ ...title, textDecoration: done ? 'line-through' : 'none', opacity: done ? 0.62 : 1 }}>{task.title}</div>
        </div>
      </div>

      <div style={metaRow}>
        {task.assignee && <span style={{ ...meta, color: assigneeColor, fontWeight: 800 }}>{shortName(task.assignee.name)}</span>}
        {due && <span style={{ ...meta, color: due.tone, fontWeight: 800 }}>📅 {task.due_date?.slice(0, 10)} · {due.label}</span>}
      </div>

      {task.project && <div style={projectLine} title={task.project.name}>🏗️ {task.project.name}</div>}

      {/* آخر تعليق بنصّه وصاحبه وتاريخه — الضغط عليه يفتح المحادثة كاملةً. */}
      {comment && (
        <div
          style={{ ...commentLine, ...(unreadComments > 0 ? commentLineNew : null) }}
          title={`${comment.user?.name ?? 'مستخدم'} · ${fullStamp(comment.created_at)}\n${comment.body}`}
          onClick={(e) => { e.stopPropagation(); openComments(task); }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <span style={commentHead}>
            <span style={commentIcon}>💬</span>
            <b style={{ color: '#475569' }}>{comment.user ? shortName(comment.user.name) : 'مستخدم'}</b>
            <span style={commentDate}>{shortStamp(comment.created_at)}</span>
            {unreadComments > 0 && <span style={commentNewTag}>جديد</span>}
            {commentCount > 1 && <span style={commentMore}>+{commentCount - 1}</span>}
          </span>
          <span style={commentBody}>{comment.body}</span>
        </div>
      )}

      {/* شريط نسبة الإنجاز (طلب أيمن 2026-08-24) — النسبة على يمينه. */}
      <div style={progressRow}>
        <span style={progressPct}>{pct}%</span>
        <span style={progressTrack}>
          <span style={{ ...progressFill, width: `${pct}%`, background: done ? '#2D9B6F' : '#1B6CA8' }} />
        </span>
      </div>

      <div style={foot}>
        {/* إطفاء وميض التأخّر بزرّ مستقلّ — لا بفتح المهمة (طلب أيمن 2026-08-25). */}
        {overdue && onAck && (
          <button
            type="button"
            title="إخفاء تنبيه التأخّر — تبقى المهمة متأخّرة"
            aria-label="إخفاء تنبيه التأخّر"
            onClick={(e) => { e.stopPropagation(); onAck(task); }}
            onPointerDown={(e) => e.stopPropagation()}
            style={ackBtn}
          >🔕</button>
        )}
        <span style={{ ...chip, background: `${color}1a`, color }}>{PRIORITY_LABELS[task.priority]}</span>
        {/* أيقونة التعليقات — تفتح المحادثة مباشرةً لا تفاصيل المهمة عامّةً. */}
        <button
          type="button"
          className={unreadComments > 0 ? 'comment-badge-new' : undefined}
          title={
            unreadComments > 0
              ? `${unreadComments} تعليق جديد — اضغط للقراءة · المجموع ${commentCount}`
              : commentCount > 0
                ? `${commentCount} تعليق — اضغط لفتح التعليقات`
                : 'لا تعليقات — اضغط لكتابة أول تعليق'
          }
          aria-label={unreadComments > 0 ? `${unreadComments} تعليق جديد` : 'تعليقات المهمة'}
          onClick={(e) => { e.stopPropagation(); openComments(task); }}
          onPointerDown={(e) => e.stopPropagation()}
          style={{ ...commentBtn, ...(commentCount > 0 ? commentBtnOn : null), ...(unreadComments > 0 ? commentBtnNew : null) }}
        >
          {unreadComments > 0 && <span style={dot}>●</span>}
          💬{commentCount > 0 && <b style={{ marginInlineStart: '3px' }}>{commentCount}</b>}
        </button>
        {task.has_unread && <span style={{ ...chip, background: '#FEF2F2', color: '#DC4A3D' }}>● جديد</span>}
        {/* شارة التوجيه: أيقونة + رقم، والشرح في التلميح. تفتح الخيط لا التفاصيل. */}
        {badge && (
          <button
            type="button"
            className={newDirective ? 'directive-badge-new' : undefined}
            title={`${badge.hint}\n${directive?.sender?.name ?? 'الإدارة'}: ${directive?.body ?? ''}`}
            aria-label={badge.hint}
            disabled={!onDirective}
            onClick={(e) => { e.stopPropagation(); onDirective?.(task); }}
            onPointerDown={(e) => e.stopPropagation()}
            style={{ ...chip, ...badge.tone, ...badgeBtn, cursor: onDirective ? 'pointer' : 'default' }}
          >
            {badge.dot && <span style={dot}>●</span>}
            {badge.icon}
            {msgCount > 0 && <b>{msgCount}</b>}
          </button>
        )}
        {/* بلا توجيه بعد: زرّ بدء التوجيه — للإدارة وحدها (onDirective يصلها فقط). */}
        {onDirective && !directive && (
          <button
            type="button"
            title="إرسال توجيه للمكلَّف بالمهمة"
            onClick={(e) => { e.stopPropagation(); onDirective(task); }}
            onPointerDown={(e) => e.stopPropagation()}
            style={directiveBtn}
          >📣 توجيه</button>
        )}
      </div>
    </div>
  );
}

const PRIORITY_LABELS: Record<Task['priority'], string> = {
  urgent: 'عاجلة', high: 'عالية', medium: 'متوسطة', low: 'منخفضة',
};

// أنماط نشاط البطاقة مشتركة مع بطاقة المتابعة — مصدر واحد كي لا يتباعد الشكلان.
const {
  mineRing, mineTag, foot, chip, badgeBtn, dot, sentChip, awaitChip, doneChip,
  directiveBtn, commentLine, commentLineNew, commentHead, commentDate, commentMore,
  commentNewTag, commentBody, commentBtn, commentBtnOn, commentBtnNew,
} = CARD_ACTIVITY_STYLES;

const card: CSSProperties = { position: 'relative', background: '#fff', border: '1.5px solid #E2E8F0', borderRadius: '10px', padding: '8px 12px 8px 10px', marginBottom: '7px', cursor: 'pointer', boxShadow: '0 1px 2px rgba(0,0,0,0.05)', transition: 'all .2s ease' };
const topRow: CSSProperties = { display: 'flex', gap: '8px', alignItems: 'flex-start' };
const avatar: CSSProperties = { width: '26px', height: '26px', borderRadius: '50%', color: '#fff', fontSize: '9.5px', fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 };
const codeRow: CSSProperties = { display: 'flex', alignItems: 'center', gap: '6px' };
const code: CSSProperties = { fontSize: '9px', color: '#94A3B8', fontWeight: 700, letterSpacing: '.4px' };
const title: CSSProperties = { fontSize: '12px', fontWeight: 800, color: '#1A1F2E', lineHeight: 1.5, marginTop: '1px' };
const metaRow: CSSProperties = { display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '5px' };
const meta: CSSProperties = { fontSize: '9.5px', whiteSpace: 'nowrap' };
const projectLine: CSSProperties = { fontSize: '9.5px', color: '#64748B', marginTop: '3px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' };
const commentIcon: CSSProperties = { fontSize: '10px', lineHeight: 1 };
const progressRow: CSSProperties = { display: 'flex', alignItems: 'center', gap: '7px', marginTop: '7px' };
const progressPct: CSSProperties = { fontSize: '10px', fontWeight: 900, color: '#475569', minWidth: '28px' };
const progressTrack: CSSProperties = { flex: 1, height: '7px', background: '#EEF2F7', borderRadius: '5px', overflow: 'hidden' };
const progressFill: CSSProperties = { display: 'block', height: '100%', borderRadius: '5px', transition: 'width .3s ease' };
const ackBtn: CSSProperties = { fontSize: '11px', lineHeight: 1, padding: '3px 7px', borderRadius: '20px', border: '1px solid #FCA5A5', background: '#FEF2F2', cursor: 'pointer', fontFamily: 'inherit' };
