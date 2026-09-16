/**
 * نموذج لوحة إدارة الفرص (2026-09-16) — كل ما تعرضه البطاقات والجدول والمؤشّرات
 * والتقارير مشتقٌّ هنا من الفرص الحيّة، فلا يختلف رقمٌ في التقرير عمّا على اللوحة.
 */
import type { Lead, PipelineStage, Priority, Temperature } from '../types';

/**
 * حالات البطاقة الأربع:
 * question         — سؤال من الإدارة ينتظر ردّ صاحب الفرصة (أحمر)
 * update_requested — طلب تحديث بلا سؤال، أو حان موعد التواصل (أحمر)
 * answered         — ردّ صاحب الفرصة على آخر طلب (أخضر)
 * idle             — لا شيء جديد (رمادي)
 */
export type BoardStatus = 'question' | 'update_requested' | 'answered' | 'idle';

export const STATUS_ORDER: BoardStatus[] = ['question', 'update_requested', 'answered', 'idle'];

export interface StatusMeta {
  label: string;
  short: string;
  accent: string;
  tint: string;
  tintBorder: string;
  chip: { color: string; background: string; borderColor: string };
}

export const STATUS_META: Record<BoardStatus, StatusMeta> = {
  question: {
    label: 'سؤال من الإدارة — مطلوب رد',
    short: 'تحديث مطلوب',
    accent: '#DC4A3D', tint: '#FFF7F6', tintBorder: '#F6CFCB',
    chip: { color: '#C0382C', background: '#FEF2F2', borderColor: '#FCA5A5' },
  },
  update_requested: {
    label: 'مطلوب تحديث من الإدارة',
    short: 'تحديث مطلوب',
    accent: '#DC4A3D', tint: '#FFF7F6', tintBorder: '#F6CFCB',
    chip: { color: '#C0382C', background: '#FEF2F2', borderColor: '#FCA5A5' },
  },
  answered: {
    label: 'تم الرد — بانتظار مراجعة الإدارة',
    short: 'تم الرد',
    accent: '#2D9B6F', tint: '#F6FCF9', tintBorder: '#CDEBDC',
    chip: { color: '#1F7A57', background: '#F0FBF6', borderColor: '#BFE8D5' },
  },
  idle: {
    label: 'لا يوجد تحديث جديد على هذه الفرصة',
    short: 'بدون تحديث',
    accent: '#CBD5E1', tint: '#FAFBFC', tintBorder: '#E9EDF2',
    chip: { color: '#64748B', background: '#F8FAFC', borderColor: '#E2E8F0' },
  },
};

/** لون السكة بعد أن تطّلع الإدارة على الرد. */
export const ACKNOWLEDGED_ACCENT = '#CBD5E1';

export const PRIORITY_META: Record<Priority, { label: string; color: string; background: string; border: string }> = {
  urgent: { label: 'أهمية حرجة', color: '#C0382C', background: '#FEE2E2', border: '#FCA5A5' },
  high: { label: 'أهمية عالية', color: '#C2410C', background: '#FFF7ED', border: '#FED7AA' },
  medium: { label: 'أهمية متوسطة', color: '#1B6CA8', background: '#EFF6FF', border: '#BFDBFE' },
  low: { label: 'أهمية منخفضة', color: '#64748B', background: '#F1F5F9', border: '#CBD5E1' },
};

export const PRIORITY_RANK: Priority[] = ['urgent', 'high', 'medium', 'low'];

export const TEMPERATURE_LABEL: Record<Temperature, string> = { hot: 'ساخنة', warm: 'دافئة', cold: 'باردة', normal: 'عادية' };

/** حالة البطاقة — الأولوية: طلب الإدارة، ثم استحقاق التواصل، ثم الرد. */
export function boardStatus(lead: Lead): BoardStatus {
  if (lead.directive_state === 'awaiting') {
    return lead.directive?.body?.trim() || promptMessageBody(lead) ? 'question' : 'update_requested';
  }
  if (lead.reminder?.due || lead.is_urgent) return 'update_requested';
  if (lead.directive_state === 'replied') return 'answered';
  return 'idle';
}

/** رسالة متابعة من الإدارة بعد التوجيه (نصّها يُعدّ سؤالًا). */
function promptMessageBody(lead: Lead): string {
  const last = lead.directive?.last_message;
  if (!last || last.user?.id === lead.owner?.id) return '';
  return last.body?.trim() ?? '';
}

export const isActionRequired = (s: BoardStatus) => s === 'question' || s === 'update_requested';

/** نصّ الطلب المعروض على البطاقة ووقته. */
export function promptOf(lead: Lead): { text: string; at: string | null } | null {
  if (lead.directive_state === 'awaiting' && lead.directive) {
    const followUp = promptMessageBody(lead);
    const text = followUp || lead.directive.body?.trim() || 'مطلوب تحديث عاجل على هذه الفرصة من الإدارة — بدون سؤال محدد.';
    return { text, at: lead.directive.last_message?.created_at ?? lead.directive.created_at };
  }
  if (lead.reminder?.due) {
    return { text: lead.reminder.note?.trim() || 'حان موعد التواصل مع العميل — سجّل تحديثًا.', at: lead.reminder.remind_at };
  }
  if (lead.is_urgent) return { text: 'فرصة عاجلة — بانتظار تحديث الموظف.', at: null };
  return null;
}

/** آخر ما كتبه صاحب الفرصة: ردّه في الخيط أو آخر تحديث مسجّل — الأحدث يفوز. */
export function latestEntryOf(lead: Lead): { text: string; at: string | null; author: string | null } | null {
  const candidates: { text: string; at: string | null; author: string | null }[] = [];
  const last = lead.directive?.last_message;
  if (last && last.user?.id === lead.owner?.id && last.body?.trim()) {
    candidates.push({ text: last.body.trim(), at: last.created_at, author: last.user?.name ?? null });
  }
  if (lead.last_update?.note?.trim()) {
    candidates.push({ text: lead.last_update.note.trim(), at: lead.last_update.at, author: lead.last_update.user });
  }
  if (candidates.length === 0) return null;
  return candidates.reduce((a, b) => (time(b.at) > time(a.at) ? b : a));
}

const time = (iso: string | null | undefined) => (iso ? new Date(iso).getTime() : 0);

/** مهلة الرد الجارية على طلب الإدارة، إن حُدّدت مهلة. */
export interface Sla {
  deadlineAt: number;
  windowMs: number;
}

export function slaOf(lead: Lead): Sla | null {
  const d = lead.directive;
  if (lead.directive_state !== 'awaiting' || !d?.deadline_at || !d.created_at) return null;
  const deadlineAt = new Date(d.deadline_at).getTime();
  const windowMs = Math.max(60_000, deadlineAt - new Date(d.created_at).getTime());
  return { deadlineAt, windowMs };
}

/** ردٌّ لم تطّلع عليه الإدارة بعد — تبقى سكته خضراء حتى تمرّ عليه. */
export const isAnswerUnread = (lead: Lead) => lead.directive_state === 'replied' && (lead.directive_unread ?? 0) > 0;

/** ردٌّ حديث (أقل من 10 دقائق) لم يُقرأ — يومض أخضر لحظات. */
export function isFreshAnswer(lead: Lead): boolean {
  if (!isAnswerUnread(lead)) return false;
  const at = lead.directive?.last_message?.created_at;
  return !!at && Date.now() - new Date(at).getTime() < 10 * 60_000;
}

// ── الأسعار والنقاط ──

export interface PriceTier { index: 1 | 2 | 3; value: number; points: number | null; likely: boolean }

export function tiersOf(lead: Lead): PriceTier[] {
  const expected = Number(lead.expected_price_kwd ?? 0);
  const raw: [1 | 2 | 3, string | null, number | null | undefined][] = [
    [1, lead.price_1_kwd, lead.points_1], [2, lead.price_2_kwd, lead.points_2], [3, lead.price_3_kwd, lead.points_3],
  ];
  return raw
    .filter(([, price]) => Number(price ?? 0) > 0)
    .map(([index, price, points]) => ({
      index,
      value: Number(price),
      points: points === undefined ? null : points,
      likely: expected > 0 && Number(price) === expected,
    }));
}

/** قيمة الفرصة: السعر المرجّح، وإلا أعلى الأسعار، وإلا قيمة الصفقة. */
export function valueOf(lead: Lead): number {
  const expected = Number(lead.expected_price_kwd ?? 0);
  if (expected > 0) return expected;
  const max = Math.max(0, ...tiersOf(lead).map((t) => t.value));
  return max > 0 ? max : Number(lead.deal_value_kwd ?? 0);
}

/** نقاط السعر المرجّح (null قبل أن يعتمدها المدير أو إن كانت محجوبة عن المستخدم). */
export function likelyPointsOf(lead: Lead): number | null {
  const likely = tiersOf(lead).find((t) => t.likely);
  if (likely) return likely.points && likely.points > 0 ? likely.points : null;
  return lead.expected_points > 0 ? lead.expected_points : null;
}

export const totalPointsOf = (lead: Lead) => tiersOf(lead).reduce((s, t) => s + (t.points ?? 0), 0);

/** سعرٌ بلا نقاط معتمدة — لا يُعرف إلا لمن يرى حقول النقاط (الإدارة). */
export function hasPendingPoints(lead: Lead): boolean {
  if (lead.points_1 === undefined) return false;
  return tiersOf(lead).some((t) => !(t.points && t.points > 0));
}

// ── موعد التواصل ──

export interface Countdown { late: boolean; urgent: boolean; label: string; short: string }

export function contactCountdown(iso: string | null | undefined, now = Date.now()): Countdown | null {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - now;
  const late = diff < 0;
  const total = Math.abs(diff);
  const days = Math.floor(total / 86_400_000);
  const hours = Math.floor((total % 86_400_000) / 3_600_000);
  const minutes = Math.floor((total % 3_600_000) / 60_000);
  const parts = [...(days > 0 ? [`${days} ي`] : []), `${hours} س`, `${minutes} د`].join(' : ');
  return {
    late,
    urgent: !late && diff < 86_400_000,
    label: late ? `تواصل متأخر ${parts}` : `متبقٍ للتواصل ${parts}`,
    short: late ? 'متأخر' : diff < 86_400_000 ? 'قريب جداً' : 'في الوقت',
  };
}

export const isLate = (lead: Lead) => !!lead.reminder?.due;

// ── المراحل ──

export const isClosedStage = (stage: PipelineStage | undefined) => !!stage && (stage.is_won || stage.is_lost);

/** المرحلة التالية في المسار — لا تقفز إلى «خسارة»، ولا شيء بعد الإغلاق. */
export function nextStageOf(stageKey: string, stages: PipelineStage[]): PipelineStage | null {
  const index = stages.findIndex((s) => s.key === stageKey);
  if (index === -1 || isClosedStage(stages[index])) return null;
  return stages.slice(index + 1).find((s) => !s.is_lost) ?? null;
}

// ── التحليلات ──

export const formatKwd = (v: number) => Math.round(v).toLocaleString('en-US');

export function formatHours(hours: number | null): string {
  if (hours === null) return '—';
  if (hours < 1) return `${Math.round(hours * 60)} دقيقة`;
  if (hours < 48) return `${hours.toFixed(1)} ساعة`;
  return `${(hours / 24).toFixed(1)} يوم`;
}

function average(values: number[]): number | null {
  return values.length ? values.reduce((s, v) => s + v, 0) / values.length : null;
}

export interface BoardMetrics {
  openCount: number;
  openValue: number;
  wonCount: number;
  wonValue: number;
  lostCount: number;
  winRate: number;
  lateCount: number;
  pendingQuestions: number;
  pendingPoints: number;
  dueReminders: number;
  avgResponse: number | null;
  totalPoints: number;
}

export function boardMetrics(leads: Lead[], stages: PipelineStage[]): BoardMetrics {
  const byKey = new Map(stages.map((s) => [s.key, s]));
  const won = leads.filter((l) => byKey.get(l.stage)?.is_won);
  const lost = leads.filter((l) => byKey.get(l.stage)?.is_lost);
  const open = leads.filter((l) => !isClosedStage(byKey.get(l.stage)));
  return {
    openCount: open.length,
    openValue: open.reduce((s, l) => s + valueOf(l), 0),
    wonCount: won.length,
    wonValue: won.reduce((s, l) => s + valueOf(l), 0),
    lostCount: lost.length,
    winRate: won.length + lost.length ? (won.length / (won.length + lost.length)) * 100 : 0,
    lateCount: open.filter(isLate).length,
    pendingQuestions: leads.filter((l) => l.directive_state === 'awaiting').length,
    pendingPoints: leads.filter(hasPendingPoints).length,
    dueReminders: leads.filter((l) => l.reminder?.due).length,
    avgResponse: average(leads.flatMap((l) => l.response_hours ?? [])),
    totalPoints: leads.reduce((s, l) => s + totalPointsOf(l), 0),
  };
}

export interface FunnelRow { stage: PipelineStage; count: number; value: number; share: number }

export function funnelRows(leads: Lead[], stages: PipelineStage[]): FunnelRow[] {
  const total = leads.length || 1;
  return stages.map((stage) => {
    const inStage = leads.filter((l) => l.stage === stage.key);
    return { stage, count: inStage.length, value: inStage.reduce((s, l) => s + valueOf(l), 0), share: (inStage.length / total) * 100 };
  });
}

export interface EmployeeStat {
  id: number;
  name: string;
  total: number;
  openCount: number;
  wonCount: number;
  lostCount: number;
  value: number;
  points: number;
  lateCount: number;
  pendingAnswers: number;
  avgResponse: number | null;
  winRate: number;
}

export function employeeStats(leads: Lead[], stages: PipelineStage[]): EmployeeStat[] {
  const byKey = new Map(stages.map((s) => [s.key, s]));
  const owners = new Map<number, string>();
  leads.forEach((l) => { if (l.owner) owners.set(l.owner.id, l.owner.name); });
  return [...owners.entries()]
    .map(([id, name]) => {
      const mine = leads.filter((l) => l.owner?.id === id);
      const won = mine.filter((l) => byKey.get(l.stage)?.is_won).length;
      const lost = mine.filter((l) => byKey.get(l.stage)?.is_lost).length;
      return {
        id, name,
        total: mine.length,
        openCount: mine.filter((l) => !isClosedStage(byKey.get(l.stage))).length,
        wonCount: won,
        lostCount: lost,
        value: mine.reduce((s, l) => s + valueOf(l), 0),
        points: mine.reduce((s, l) => s + totalPointsOf(l), 0),
        lateCount: mine.filter((l) => !isClosedStage(byKey.get(l.stage)) && isLate(l)).length,
        pendingAnswers: mine.filter((l) => l.directive_state === 'awaiting').length,
        avgResponse: average(mine.flatMap((l) => l.response_hours ?? [])),
        winRate: won + lost ? (won / (won + lost)) * 100 : 0,
      };
    })
    .sort((a, b) => b.points - a.points || b.value - a.value);
}

// ── الجدول ──

export type SortKey = 'code' | 'name' | 'stage' | 'priority' | 'value' | 'points' | 'owner' | 'due';

export function compareLeads(a: Lead, b: Lead, key: SortKey, dir: 'asc' | 'desc', stages: PipelineStage[]): number {
  const stageIndex = (l: Lead) => stages.findIndex((s) => s.key === l.stage);
  const dueTime = (l: Lead) => (l.reminder?.remind_at ? new Date(l.reminder.remind_at).getTime() : Number.MAX_SAFE_INTEGER);
  let r = 0;
  switch (key) {
    case 'code': r = a.id - b.id; break;
    case 'name': r = a.full_name.localeCompare(b.full_name, 'ar'); break;
    case 'stage': r = stageIndex(a) - stageIndex(b); break;
    case 'priority': r = PRIORITY_RANK.indexOf(a.priority) - PRIORITY_RANK.indexOf(b.priority); break;
    case 'value': r = valueOf(a) - valueOf(b); break;
    case 'points': r = totalPointsOf(a) - totalPointsOf(b); break;
    case 'owner': r = (a.owner?.name ?? '').localeCompare(b.owner?.name ?? '', 'ar'); break;
    case 'due': r = dueTime(a) - dueTime(b); break;
  }
  return dir === 'asc' ? r : -r;
}

// ── روابط وتنسيقات ──

export function whatsappLink(lead: Lead): string | null {
  const digits = (lead.phone ?? '').replace(/\D/g, '');
  if (!digits) return null;
  const number = digits.length <= 8 ? `965${digits}` : digits;
  const text = `مرحباً ${lead.full_name}، نتواصل معكم بخصوص ${lead.project_type || 'مشروعكم'}.`;
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export const mailtoLink = (lead: Lead) => (lead.email ? `mailto:${lead.email}?subject=${encodeURIComponent(`متابعة الفرصة #${lead.id}`)}` : null);

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return '';
  const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return 'الآن';
  if (minutes < 60) return `منذ ${minutes} دقيقة`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `منذ ${hours} ساعة`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `منذ ${days} يوم`;
  return `منذ ${Math.floor(days / 30)} شهر`;
}

export function initials(name: string): string {
  const parts = name.replace(/[.]/g, ' ').split(' ').filter(Boolean);
  if (parts.length === 0) return '؟';
  if (parts.length === 1) return parts[0].slice(0, 2);
  return `${parts[0][0]}${parts[1][0]}`;
}

/** نصّ المهلة بالعربية («4 ساعات»، «يوم واحد»). */
export function slaLabel(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)} دقيقة`;
  if (hours === 1) return 'ساعة';
  if (hours === 2) return 'ساعتان';
  if (hours < 11) return `${hours} ساعات`;
  if (hours === 24) return 'يوم واحد';
  if (hours === 48) return 'يومان';
  if (hours % 24 === 0) return `${hours / 24} أيام`;
  return `${hours} ساعة`;
}

export const SLA_PRESETS = [1, 2, 4, 5, 8, 24, 48] as const;

export function clockLabel(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, '0');
  return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}
