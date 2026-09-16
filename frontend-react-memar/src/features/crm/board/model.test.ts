import { describe, expect, it } from 'vitest';

import type { Lead, PipelineStage } from '../types';
import { boardMetrics, boardStatus, hasPendingPoints, nextStageOf, slaOf, valueOf } from './model';

const lead = (patch: Partial<Lead>): Lead => ({ id: 1, full_name: 'فرصة', stage: 'new', priority: 'medium', expected_points: 0, deal_value_kwd: '0', ...patch } as Lead);
const directive = (patch: Record<string, unknown> = {}) => ({ id: 9, body: 'ما الجديد؟', sender: { id: 1, name: 'مدير' }, created_at: '2026-09-16T10:00:00Z', messages: [], last_message: null, replied: false, ...patch });

const STAGES: PipelineStage[] = [
  { id: 1, key: 'new', label: 'عميل جديد', color: '#1B6CA8', position: 1, is_won: false, is_lost: false, is_protected: true },
  { id: 2, key: 'quote', label: 'عرض سعر', color: '#E8A838', position: 2, is_won: false, is_lost: false, is_protected: false },
  { id: 3, key: 'won', label: 'صفقة رابحة', color: '#2D9B6F', position: 3, is_won: true, is_lost: false, is_protected: false },
  { id: 4, key: 'lost', label: 'خسارة', color: '#DC4A3D', position: 4, is_won: false, is_lost: true, is_protected: false },
];

describe('boardStatus', () => {
  it('سؤال الإدارة المنتظر ردًّا', () => {
    expect(boardStatus(lead({ directive_state: 'awaiting', directive: directive() as Lead['directive'] }))).toBe('question');
  });
  it('طلب تحديث بلا سؤال', () => {
    expect(boardStatus(lead({ directive_state: 'awaiting', directive: directive({ body: '' }) as Lead['directive'] }))).toBe('update_requested');
  });
  it('حان موعد التواصل = تحديث مطلوب', () => {
    expect(boardStatus(lead({ reminder: { id: 1, remind_at: null, note: null, due: true } }))).toBe('update_requested');
  });
  it('تم الرد وبلا شيء = رمادي', () => {
    expect(boardStatus(lead({ directive_state: 'replied' }))).toBe('answered');
    expect(boardStatus(lead({}))).toBe('idle');
  });
});

describe('slaOf', () => {
  it('يحسب المهلة من التوجيه المنتظر فقط', () => {
    const d = directive({ deadline_at: '2026-09-16T14:00:00Z' }) as Lead['directive'];
    expect(slaOf(lead({ directive_state: 'awaiting', directive: d }))?.windowMs).toBe(4 * 3_600_000);
    expect(slaOf(lead({ directive_state: 'replied', directive: d }))).toBeNull();
  });
});

describe('الأسعار والمراحل والمؤشرات', () => {
  it('القيمة = السعر المرجّح ثم أعلى سعر', () => {
    expect(valueOf(lead({ price_1_kwd: '500', price_2_kwd: '900', expected_price_kwd: '500' }))).toBe(500);
    expect(valueOf(lead({ price_1_kwd: '500', price_2_kwd: '900' }))).toBe(900);
  });
  it('النقاط المعلّقة لا تُعرف لمن لا يرى حقولها', () => {
    expect(hasPendingPoints(lead({ price_1_kwd: '500' }))).toBe(false);
    expect(hasPendingPoints(lead({ price_1_kwd: '500', points_1: null, points_2: null, points_3: null }))).toBe(true);
  });
  it('المرحلة التالية لا تقفز إلى الخسارة ولا بعد الإغلاق', () => {
    expect(nextStageOf('quote', STAGES)?.key).toBe('won');
    expect(nextStageOf('won', STAGES)).toBeNull();
  });
  it('معدل الفوز ومتوسط زمن الرد', () => {
    const m = boardMetrics([
      lead({ id: 1, stage: 'won', response_hours: [2] }),
      lead({ id: 2, stage: 'lost', response_hours: [4] }),
      lead({ id: 3, stage: 'new' }),
    ], STAGES);
    expect(m.winRate).toBe(50);
    expect(m.avgResponse).toBe(3);
    expect(m.openCount).toBe(1);
  });
});
