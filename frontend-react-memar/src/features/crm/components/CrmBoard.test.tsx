import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { type ReactNode } from 'react';
import { expect, test, vi } from 'vitest';

import { CrmBoard } from './CrmBoard';
import type { PipelineStage } from '../types';

/**
 * اختبار انحدار: كانت لوحة CRM تدخل حلقة إعادة رندر لانهائية (setState داخل effect بتبعيّات غير ثابتة)
 * تجعل الصفحة بطيئة وتبتلع نقرات التنقّل بين الصفحات (طلب أيمن — إصلاح التوجيه).
 * إن عادت الحلقة، يرمي React «Maximum update depth exceeded» أثناء الرندر فيفشل هذا الاختبار.
 */

const STAGES: PipelineStage[] = [
  { id: 1, key: 'new', label: 'عميل جديد', color: '#1B6CA8', position: 1, is_won: false, is_lost: false, is_protected: true },
  { id: 2, key: 'contacted', label: 'تم التواصل', color: '#E8A838', position: 2, is_won: false, is_lost: false, is_protected: false },
  { id: 3, key: 'won', label: 'صفقة رابحة', color: '#2D9B6F', position: 3, is_won: true, is_lost: false, is_protected: false },
];

const wrap = (node: ReactNode) => <QueryClientProvider client={new QueryClient()}>{node}</QueryClientProvider>;

test('CrmBoard يُعرض دون حلقة إعادة رندر لانهائية (انحدار توجيه الصفحات)', () => {
  const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

  render(wrap(
    <CrmBoard leads={[]} stages={STAGES} onMove={() => {}} onOpen={() => {}} onReorder={() => {}} />,
  ));

  // الأعمدة تُعرض = اكتمل الرندر ولم توقفه حلقة لا نهائية.
  expect(screen.getByText('عميل جديد', { exact: false })).toBeTruthy();
  expect(screen.getByText('صفقة رابحة', { exact: false })).toBeTruthy();

  // لم يُسجَّل خطأ «Maximum update depth» (حلقة إعادة الرندر).
  const loopError = errorSpy.mock.calls.some((args) => String(args[0]).includes('Maximum update depth'));
  expect(loopError).toBe(false);

  errorSpy.mockRestore();
});
