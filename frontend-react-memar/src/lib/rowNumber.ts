import type { CSSProperties } from 'react';

import type { PaginationMeta } from '../types/api';

/**
 * عمود الترقيم «#» في الجداول (طلب 2026-09-15): رقم متسلسل للصف المعروض.
 *
 * في الجداول المقسّمة صفحات يستمر العدّ عبرها — الصفحة الثانية بخمسة عشر
 * صفًّا تبدأ من 16 لا من 1 — فيُمرَّر للجدول `rowOffset(meta)`.
 */
export function rowOffset(meta: Pick<PaginationMeta, 'current_page' | 'per_page'> | null | undefined): number {
  if (!meta) return 0;

  return Math.max(0, (meta.current_page - 1) * meta.per_page);
}

/**
 * نمط خلية الترقيم — يُدمج فوق نمط خلية الجدول نفسه (`{ ...td, ...ROW_NO_CELL }`)
 * فيبقى الحشو والحدود كبقية الأعمدة، والعمود ضيّقًا باهتًا لا ينافس البيانات.
 */
export const ROW_NO_CELL: CSSProperties = {
  width: '44px',
  textAlign: 'center',
  color: '#94A3B8',
  fontWeight: 700,
  fontVariantNumeric: 'tabular-nums',
  whiteSpace: 'nowrap',
};
