export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done' | 'cancelled';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface TaskRef {
  id: number;
  name: string;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string | null;
  project: TaskRef | null;
  assignee: TaskRef | null;
  created_at: string | null;
}

export interface TaskComment {
  id: number;
  body: string;
  user: TaskRef | null;
  created_at: string | null;
}

export interface TaskFile {
  id: number;
  name: string;
  original_name: string;
  extension: string | null;
  size: number;
  created_at: string | null;
}

/** تفاصيل المهمة الكاملة (TASK-4). */
export interface TaskDetail extends Task {
  rating: 'positive' | 'negative' | null;
  video_room: string | null;
  creator: TaskRef | null;
  participants: TaskRef[];
  comments: TaskComment[];
  files: TaskFile[];
}

export interface TaskFormData {
  title: string;
  description: string;
  project_id: number | '';
  assignee_id: number | '';
  status: TaskStatus;
  priority: TaskPriority;
  due_date: string;
}

export const STATUS_ORDER: TaskStatus[] = ['todo', 'in_progress', 'review', 'done'];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  todo: 'قيد الانتظار',
  in_progress: 'قيد التنفيذ',
  review: 'مراجعة',
  done: 'مكتمل',
  cancelled: 'لم تُنفَّذ',
};

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'منخفضة',
  medium: 'متوسطة',
  high: 'عالية',
  urgent: 'عاجلة',
};

export const PRIORITY_COLORS: Record<TaskPriority, string> = {
  low: '#10B981',
  medium: '#D97706',
  high: '#DC2626',
  urgent: '#DC2626',
};

// ── لوحة المتابعة: أعمدة حسب حالة الاستحقاق (طبق أصل «المهام والمتابعة») ──
export type FollowUpColumn = 'overdue' | 'today' | 'upcoming' | 'done';

export const isDone = (t: Task): boolean => t.status === 'done';
/** حالة نهائية (منجزة أو غير منفّذة) — تخرج من أعمدة العمل النشطة. */
export const isTerminal = (t: Task): boolean => t.status === 'done' || t.status === 'cancelled';

const todayStr = (): string => new Date().toISOString().slice(0, 10);

/** العمود الذي تقع فيه المهمة: منتهية، أو متأخرة/اليوم/قادمة حسب تاريخ الاستحقاق. */
export function taskColumn(t: Task): FollowUpColumn {
  if (isTerminal(t)) return 'done';
  if (!t.due_date) return 'upcoming'; // بلا موعد → ضمن القادمة
  const due = t.due_date.slice(0, 10);
  if (due < todayStr()) return 'overdue';
  if (due === todayStr()) return 'today';

  return 'upcoming';
}

/** فرق الأيام عن اليوم (سالب = تأخّر). */
export function dueDiffDays(due: string | null): number | null {
  if (!due) return null;
  const d = new Date(due.slice(0, 10) + 'T00:00:00');
  const now = new Date(todayStr() + 'T00:00:00');

  return Math.round((d.getTime() - now.getTime()) / 86_400_000);
}

/** تسمية الاستحقاق: اليوم / بعد N يوم / أمس / تأخّر N يوم / مكتمل (طبق الأصل). */
export function dueLabel(t: Task): string {
  if (t.status === 'cancelled') return 'لم تُنفَّذ';
  if (isDone(t)) return 'مكتمل';
  const diff = dueDiffDays(t.due_date);
  if (diff === null) return 'بلا موعد';
  if (diff === 0) return 'اليوم';
  if (diff > 0) return `بعد ${diff} يوم`;
  if (diff === -1) return 'أمس';

  return `تأخّر ${Math.abs(diff)} يوم`;
}

export const FOLLOWUP_COLUMNS: { key: FollowUpColumn; label: string; icon: string; color: string; border: string }[] = [
  { key: 'overdue', label: 'متأخرة', icon: '🔴', color: '#DC2626', border: '#FECACA' },
  { key: 'today', label: 'اليوم', icon: '⏰', color: '#D97706', border: '#FCD34D' },
  { key: 'upcoming', label: 'قادمة', icon: '📅', color: '#2563EB', border: '#BFDBFE' },
  { key: 'done', label: 'مكتملة', icon: '✅', color: '#059669', border: '#A7F3D0' },
];
