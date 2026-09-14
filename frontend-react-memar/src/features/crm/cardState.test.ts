import { describe, expect, it } from 'vitest';

import { cardStateOf, type Lead } from './types';

/**
 * أولوية لون بطاقة الفرصة (طلب أيمن 2026-09-13). الاختبار يحرس الترتيب نفسه
 * الذي يقرؤه شريط العدّادات، فلا يفترقان.
 */
const lead = (patch: Partial<Lead>): Lead => ({ id: 1, full_name: 'فرصة', ...patch } as Lead);

describe('cardStateOf', () => {
  it('بلا توجيه ولا استحقاق: بيضاء', () => {
    expect(cardStateOf(lead({}))).toBeNull();
  });

  it('توجيه بلا ردّ: حمراء', () => {
    expect(cardStateOf(lead({ directive_state: 'awaiting' }))).toBe('awaiting');
  });

  it('حان موعد التواصل: صفراء', () => {
    expect(cardStateOf(lead({ reminder: { id: 1, remind_at: null, note: null, due: true } }))).toBe('needs_update');
  });

  it('مُعلَّمة عاجلة: صفراء ولو بلا تذكير', () => {
    expect(cardStateOf(lead({ is_urgent: true }))).toBe('needs_update');
  });

  it('رُدَّ على التوجيه: خضراء', () => {
    expect(cardStateOf(lead({ directive_state: 'replied' }))).toBe('replied');
  });

  it('سؤال الإدارة يتقدّم على استحقاق التواصل', () => {
    expect(cardStateOf(lead({ directive_state: 'awaiting', is_urgent: true }))).toBe('awaiting');
  });

  it('استحقاق التواصل يتقدّم على «تم الرد» — فهو عملٌ مفتوح', () => {
    expect(cardStateOf(lead({ directive_state: 'replied', is_urgent: true }))).toBe('needs_update');
  });
});
