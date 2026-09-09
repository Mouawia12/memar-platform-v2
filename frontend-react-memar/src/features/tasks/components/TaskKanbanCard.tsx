import { type CSSProperties } from 'react';

import { personColor, personInitials, shortName } from '../../crm/types';
import { CARD_ACTIVITY_STYLES, fullStamp, shortStamp, OTHERS_MUTED } from './cardActivityStyles';
import { TaskProgressBar } from './TaskProgressBar';
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
  /** في وضع التمييز: مهمة غيري تخفت ليبرز ما يخصّني فوقها. */
  muted?: boolean;
  /** فتح نافذة التوجيهات — إن غابت لا يظهر زرّ التوجيه على البطاقة. */
  onDirective?: (t: Task) => void;
  /** حفظ نسبة الإنجاز المعدَّلة من الشريط — إن غابت كان الشريط للعرض فقط. */
  onProgress?: (t: Task, pct: number) => void;
}

/**
 * بطاقة مهمة بشكل كروت الفرص في CRM (طلب أيمن 2026-08-24): شريط لون جانبي
 * حسب الأولوية، صورة المكلّف أو أحرفه بلونه الثابت، وسطر موعد بلون قربه،
 * وشريط تقدّم. المحتوى محتوى المهمة — الشكل فقط هو المشترك.
 */
export function TaskKanbanCard({ task, onOpen, avatarUrl, acked, onAck, mine, muted, onDirective, onProgress }: Props) {
  const color = PRIORITY_COLORS[task.priority] ?? '#1B6CA8';
  const done = isDone(task);
  const diff = dueDiffDays(task.due_date);
  const assigneeColor = task.assignee ? personColor(task.assignee.id) : '#94A3B8';
  // المهمة المتأخّرة تومض كتنبيه حتى تُعالَج (طلب أيمن 2026-08-24).
  const overdue = !done && diff !== null && diff < 0 && !acked;
  // المهمة المكتملة تُعرض 100% مهما كانت النسبة المسجّلة.
  const pct = done ? 100 : Math.max(0, Math.min(100, task.progress ?? 0));

  const directive = task.directive ?? null;
  // رسائل لم أرَها في خيوط هذه البطاقة — تُنبّه البطاقة كلّها لا الشارة وحدها.
  const unread = task.directive_unread ?? 0;
  const msgCount = task.directive_messages_count ?? 0;
  // آخر رسالة في الخيط: ردّ الموظف أو ردّ المدير عليه — تظهر تحت البطاقة.
  const lastMessage = directive?.last_message ?? null;
  /*
   * شارة الخيط: أيقونة ورقم فقط، والشرح في التلميح (طلب أيمن 2026-08-29).
   * الدور يُقرأ منها: بانتظار ردّك لصاحب البطاقة، وتم الرد لمن ردّوا عليه.
   */
  const badge = !directive
    ? null
    : unread > 0
      ? task.directive_awaits_me
        ? { icon: '🔔', hint: 'رسالة جديدة من الإدارة — اضغط للقراءة والردّ', tone: awaitChip, dot: true }
        : { icon: '✅', hint: 'ردّ جديد في خيط التوجيه — اضغط لقراءته', tone: doneChip, dot: true }
      : task.directive_awaits_me
        ? { icon: '📣', hint: 'بانتظار ردّك — اضغط للردّ', tone: awaitChip, dot: false }
        : directive.replied
          ? { icon: '✅', hint: 'تم الرد — اضغط لعرض الخيط', tone: doneChip, dot: false }
          : { icon: '📤', hint: 'تم الإرسال — بانتظار ردّ المكلَّف', tone: sentChip, dot: false };

  const due = task.due_date
    ? {
      label: diff === null ? '' : diff < 0 ? `متأخرة ${Math.abs(diff)} يوم` : diff === 0 ? 'اليوم' : `بعد ${diff} يوم`,
      tone: diff === null ? '#64748B' : diff < 0 ? '#DC4A3D' : diff === 0 ? '#E8A838' : '#2D9B6F',
    }
    : null;

  return (
    <div
      className={`crm-lead-card${overdue ? ' task-card-late' : ''}${unread > 0 && !overdue ? ' task-card-directive' : ''}`}
      onClick={() => onOpen(task)}
      style={{
        ...card,
        borderRight: `5px solid ${done ? '#2D9B6F' : color}`,
        // الظلّ inline يغلب أي قاعدة CSS، فحلقة الإبراز تُضبط هنا لا في ملف الأنماط.
        ...(mine ? mineRing : null),
        ...(muted ? OTHERS_MUTED : null),
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

      {/* نصّ التوجيه نفسه ثم آخر ردّ عليه (طلب أيمن 2026-08-29) — كان يظهر
          الردّ وحده، فالتوجيه الجديد يصل بلا نصّ حتى يردّ أحد. كلا السطرين
          يفتحان الخيط، وعلامة ↩ على الأخير تفتحه عند حقل الكتابة. */}
      {directive && (
        <div
          style={directiveLine}
          title={`${directive.sender?.name ?? 'الإدارة'} · ${fullStamp(directive.created_at)}\n${directive.body}`}
          onClick={(e) => { e.stopPropagation(); onDirective?.(task); }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <span style={replyHead}>
            <span style={{ fontSize: '10px', lineHeight: 1 }}>📣</span>
            <b style={{ color: '#92400E' }}>{directive.sender ? shortName(directive.sender.name) : 'الإدارة'}</b>
            <span style={replyDate}>{shortStamp(directive.created_at)}</span>
            {!lastMessage && onDirective && <span style={replyMark} title="الردّ على هذا التوجيه">↩ ردّ</span>}
          </span>
          <span style={replyBody}>{directive.body}</span>
        </div>
      )}

      {lastMessage && (
        <div
          style={{ ...replyLine, ...(unread > 0 ? replyLineNew : null) }}
          title={`${lastMessage.user?.name ?? 'مستخدم'} · ${fullStamp(lastMessage.created_at)}\n${lastMessage.body}`}
          onClick={(e) => { e.stopPropagation(); onDirective?.(task); }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <span style={replyHead}>
            <span style={{ fontSize: '10px', lineHeight: 1 }}>↩️</span>
            <b style={{ color: '#475569' }}>{lastMessage.user ? shortName(lastMessage.user.name) : 'مستخدم'}</b>
            <span style={replyDate}>{shortStamp(lastMessage.created_at)}</span>
            {unread > 0 && <span style={replyNewTag}>جديد</span>}
            {msgCount > 1 && <span style={replyDate}>· {msgCount} رسائل</span>}
            {onDirective && <span style={replyMark} title="الردّ على هذه الرسالة">↩ ردّ</span>}
          </span>
          <span style={replyBody}>{lastMessage.body}</span>
        </div>
      )}

      {/* شريط نسبة الإنجاز (طلب أيمن 2026-08-24) — النسبة على يمينه، ويُعدَّل
          بالضغط أو السحب عليه مباشرةً مع اسم آخر من عدّله (طلب أيمن 2026-08-29). */}
      <TaskProgressBar
        value={pct}
        done={done}
        by={task.progress_by ?? null}
        at={task.progress_at ?? null}
        onChange={onProgress ? (next) => onProgress(task, next) : undefined}
      />

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
        {/* شارة التوجيه: أيقونة + رقم، والشرح في التلميح. تفتح الخيط لا التفاصيل. */}
        {badge && (
          <button
            type="button"
            className={unread > 0 ? 'directive-badge-new' : undefined}
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
  directiveBtn, directiveLine, replyLine, replyLineNew, replyHead, replyDate, replyNewTag, replyBody, replyMark,
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
const ackBtn: CSSProperties = { fontSize: '11px', lineHeight: 1, padding: '3px 7px', borderRadius: '20px', border: '1px solid #FCA5A5', background: '#FEF2F2', cursor: 'pointer', fontFamily: 'inherit' };
