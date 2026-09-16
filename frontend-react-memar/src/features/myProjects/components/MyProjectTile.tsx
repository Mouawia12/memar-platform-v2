import { PROJECT_STATUS_COLORS, PROJECT_STATUS_LABELS, type ProjectStatus } from '../../projects/types';
import type { MyProjectCard, ProjectRelation } from '../api/myProjectsApi';
import { timeAgo } from './AssignedProjectCard';

/** شارة صلتي بالمشروع — لكل صلة لونها كي تُقرأ البطاقة بنظرة. */
const RELATIONS: Record<ProjectRelation, { label: string; icon: string; style: { color: string; background: string } } | null> = {
  member: { label: 'مُسنَد إليّ', icon: 'fa-user-check', style: { color: '#1B6CA8', background: '#E4F0FA' } },
  manager: { label: 'أُديره', icon: 'fa-user-gear', style: { color: '#0F766E', background: '#D8F5EC' } },
  tasks: { label: 'لي فيه مهامّ', icon: 'fa-list-check', style: { color: '#7C3AED', background: '#F3EEFF' } },
  none: null,
};

const R = 26; // نصف قطر حلقة التقدّم
const C = 2 * Math.PI * R;

/**
 * بطاقة مشروع في «مشاريعي» — حلقة تقدّم، وشارات الحالة والجديد والتأخّر،
 * وصلتي بالمشروع ومهامّي فيه (طلب أيمن 2026-09-16).
 */
export function MyProjectTile({ card, onOpen, index = 0 }: {
  card: MyProjectCard;
  onOpen: (id: number) => void;
  /** ترتيبها في الشبكة — لتتابع ظهور البطاقات لا ظهورها دفعةً واحدة. */
  index?: number;
}) {
  const accent = PROJECT_STATUS_COLORS[card.status as ProjectStatus] ?? '#5A6478';
  const relation = RELATIONS[card.relation ?? 'none'];
  const overdue = card.my_overdue_tasks ?? 0;
  const openTasks = card.my_open_tasks ?? 0;

  return (
    <button
      type="button"
      onClick={() => onOpen(card.id)}
      className={`mypr-tile${card.has_new ? ' is-new' : ''}`}
      style={{ ['--mypr-accent' as string]: accent, animationDelay: `${Math.min(index, 11) * 45}ms` }}
    >
      <div className="mypr-tile-top">
        <span className="mypr-badge" style={{ color: accent, background: `${accent}18` }}>
          <i style={{ width: 6, height: 6, borderRadius: 999, background: accent, display: 'inline-block' }} />
          {PROJECT_STATUS_LABELS[card.status as ProjectStatus] ?? card.status}
        </span>
        <span className="mypr-badges">
          {card.is_late && <span className="mypr-badge mypr-badge-late"><i className="fas fa-triangle-exclamation" /> تأخّر التسليم</span>}
          {card.has_new && <span className="mypr-badge mypr-badge-new"><i className="fas fa-bolt" /> جديد</span>}
        </span>
      </div>

      <div className="mypr-body">
        <div className="mypr-body-main">
          <h3 className="mypr-name">{card.name}</h3>
          <div className="mypr-meta">
            {card.code && <span className="mypr-mchip">#{card.code}</span>}
            {card.client && <span className="mypr-mchip"><i className="fas fa-building-columns" /> {card.client}</span>}
            {relation && <span className="mypr-mchip is-rel" style={relation.style}><i className={`fas ${relation.icon}`} /> {card.role_on_project ?? relation.label}</span>}
            {overdue > 0
              ? <span className="mypr-mchip is-overdue"><i className="fas fa-clock" /> {overdue} مهمّة متأخّرة</span>
              : openTasks > 0 && <span className="mypr-mchip is-tasks"><i className="fas fa-list-check" /> {openTasks} مهمّة لي</span>}
          </div>
        </div>

        {/* حلقة التقدّم — أوضح من شريط في بطاقة مزدحمة. */}
        <div className="mypr-ring" aria-hidden="true">
          <svg width="62" height="62" viewBox="0 0 62 62">
            <circle className="mypr-ring-bg" cx="31" cy="31" r={R} strokeWidth="6" />
            <circle
              className="mypr-ring-fg"
              cx="31"
              cy="31"
              r={R}
              strokeWidth="6"
              strokeDasharray={C}
              strokeDashoffset={C - (C * Math.min(Math.max(card.progress, 0), 100)) / 100}
            />
          </svg>
          <span className="mypr-ring-label">{card.progress}%</span>
        </div>
      </div>

      <div className="mypr-stage">
        <i className="fas fa-compass" style={{ color: accent }} />
        {card.current_stage ? <b>{card.current_stage}</b> : <span>لا مرحلة جارية</span>}
        {card.stages_total != null && <span className="mypr-stage-n">{card.stages_done}/{card.stages_total} مرحلة</span>}
      </div>

      <div className="mypr-foot">
        <span className={card.has_new ? 'is-new' : undefined}>
          <i className="fas fa-clock-rotate-left" /> آخر نشاط: {card.last_activity_at ? timeAgo(card.last_activity_at) : '—'}
        </span>
        <span><i className="fas fa-eye" /> آخر زيارة لك: {card.last_seen_at ? timeAgo(card.last_seen_at) : 'لم تُفتح بعد'}</span>
      </div>
    </button>
  );
}
