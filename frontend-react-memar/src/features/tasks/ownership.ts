import type { FollowUp } from './api/followUpsApi';
import type { Task } from './types';

/**
 * صاحب البطاقة — تعريف واحد يستعمله الفلتر والتمييز معًا.
 *
 * المتابعة لصاحبها = المكلَّف بها، وإن لم يُحدَّد مكلَّف فهي لمنشئها (متابعات سُجّلت
 * قبل إضافة حقل المكلَّف). هذا نصّ ما يفعله الخادم في `mine=1`، فلا يختلف معنى «لفلان»
 * بين ما يرشّحه الخادم وما ترشّحه الواجهة.
 */
export function isFollowUpOf(f: FollowUp, userId: number | null | undefined): boolean {
  if (!userId) return false;

  return f.assignee ? f.assignee.id === userId : f.creator?.id === userId;
}

/** المهمة لصاحبها = المكلَّف بها. */
export function isTaskOf(t: Task, userId: number | null | undefined): boolean {
  return !!userId && t.assignee?.id === userId;
}
