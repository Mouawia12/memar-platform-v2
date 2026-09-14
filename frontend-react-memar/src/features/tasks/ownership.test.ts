import { describe, expect, it } from 'vitest';

import type { FollowUp } from './api/followUpsApi';
import { isFollowUpOf, isTaskOf } from './ownership';
import type { Task } from './types';

const fup = (over: Partial<FollowUp>): FollowUp => ({
  id: 1, contact_id: 1, contact: 'عميل', note: null, remind_at: null,
  repeat_every: null, late_cycles: 0, done: false, owner: null, creator: null, ...over,
} as FollowUp);

const task = (assigneeId: number | null): Task => ({
  id: 1, title: 'مهمة', assignee: assigneeId ? { id: assigneeId, name: 'موظف' } : null,
} as Task);

/**
 * هذه القاعدة تحكم فلتر الموظف وشارة «لي» معًا، ويجب أن تطابق ما يرشّحه الخادم
 * في `mine=1` — وإلّا اختلف معنى «شغل فلان» بين الخادم والشاشة.
 */
describe('isFollowUpOf', () => {
  it('المتابعة لمكلَّفها', () => {
    expect(isFollowUpOf(fup({ assignee: { id: 7, name: 'دعاء' } }), 7)).toBe(true);
    expect(isFollowUpOf(fup({ assignee: { id: 7, name: 'دعاء' } }), 9)).toBe(false);
  });

  it('المتابعة بلا مكلَّف تبقى لمنشئها — كما يحسبها الخادم', () => {
    expect(isFollowUpOf(fup({ assignee: null, creator: { id: 7, name: 'دعاء' } }), 7)).toBe(true);
    expect(isFollowUpOf(fup({ assignee: null, creator: { id: 9, name: 'خالد' } }), 7)).toBe(false);
  });

  it('المكلَّف يتقدّم على المنشئ عند وجود الاثنين', () => {
    const f = fup({ assignee: { id: 7, name: 'دعاء' }, creator: { id: 9, name: 'خالد' } });

    expect(isFollowUpOf(f, 7)).toBe(true);
    expect(isFollowUpOf(f, 9)).toBe(false);
  });

  it('بلا موظف مختار لا تخصّ أحدًا', () => {
    expect(isFollowUpOf(fup({ creator: { id: 7, name: 'دعاء' } }), null)).toBe(false);
    expect(isFollowUpOf(fup({ creator: { id: 7, name: 'دعاء' } }), undefined)).toBe(false);
  });
});

describe('isTaskOf', () => {
  it('المهمة لمكلَّفها وحده', () => {
    expect(isTaskOf(task(7), 7)).toBe(true);
    expect(isTaskOf(task(7), 9)).toBe(false);
    expect(isTaskOf(task(null), 7)).toBe(false);
    expect(isTaskOf(task(7), null)).toBe(false);
  });
});
