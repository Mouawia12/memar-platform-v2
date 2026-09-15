import { timeAgo } from '../myProjects/components/AssignedProjectCard';
import type { Communication } from './types';

export { timeAgo };

const AVATAR_COLORS = ['#274A78', '#0F766E', '#B45309', '#7C3AED', '#BE185D', '#0369A1', '#4D7C0F', '#C2410C'];

/** لون ثابت لكل اسم (نفس الجهة بنفس اللون في كل مرة). */
export function avatarColor(name: string): string {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

/** أول حرف من الاسم بعد تجاوز الألقاب الشائعة (م. / د. / أ.). */
export function initial(name: string): string {
  const word = name.trim().split(/\s+/).find((w) => !/^(م|د|أ|ا)\.?$/.test(w)) ?? name.trim();
  return word.charAt(0) || '؟';
}

const ARABIC_MAP: Record<string, string> = { 'أ': 'ا', 'إ': 'ا', 'آ': 'ا', 'ٱ': 'ا', 'ة': 'ه', 'ى': 'ي', 'ؤ': 'و', 'ئ': 'ي' };

/** نفس تطبيع البحث في الباك إند (App\Support\ArabicSearch): «احمد» = «أحمد». */
export function normalizeArabic(text: string): string {
  return text.trim().replace(/[\u064B-\u065F\u0670\u0640]/g, '').replace(/[أإآٱةىؤئ]/g, (ch) => ARABIC_MAP[ch]).toLowerCase();
}

export const digits = (phone: string) => phone.replace(/[^0-9]/g, '');

export const fmtDateTime = (iso: string | null) =>
  iso ? new Date(iso).toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();

/** عنوان مجموعة اليوم في الخط الزمني. */
export function dayLabel(iso: string | null): string {
  if (!iso) return 'بلا تاريخ';
  const d = new Date(iso);
  const diff = Math.round((startOfDay(new Date()) - startOfDay(d)) / 86_400_000);
  if (diff <= 0) return 'اليوم';
  if (diff === 1) return 'أمس';
  if (diff < 7) return d.toLocaleDateString('ar', { weekday: 'long' });
  return d.toLocaleDateString('ar', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function groupByDay(rows: Communication[]): Array<{ label: string; items: Communication[] }> {
  const groups: Array<{ label: string; items: Communication[] }> = [];
  for (const row of rows) {
    const label = dayLabel(row.happened_at ?? row.created_at);
    const last = groups[groups.length - 1];
    if (last?.label === label) last.items.push(row);
    else groups.push({ label, items: [row] });
  }
  return groups;
}

export type FollowUpState = 'none' | 'done' | 'due' | 'upcoming';

export function followUpState(c: Communication): FollowUpState {
  if (!c.follow_up_at) return 'none';
  if (c.follow_up_done_at) return 'done';
  return new Date(c.follow_up_at).getTime() <= Date.now() ? 'due' : 'upcoming';
}

/** «بعد N يوم» كنص ISO، الساعة 9 صباحًا. */
export function inDays(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

/** تحويل ISO إلى قيمة input[type=datetime-local] بالتوقيت المحلي. */
export function toLocalInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** موعد المتابعة القادم كنص قصير («غدًا»، «بعد 3 أيام»). */
export function timeUntil(iso: string): string {
  const days = Math.round((startOfDay(new Date(iso)) - startOfDay(new Date())) / 86_400_000);
  if (days <= 0) return 'اليوم';
  if (days === 1) return 'غدًا';
  return `بعد ${days} يوم`;
}
