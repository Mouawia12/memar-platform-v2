import { lazy, type ComponentType } from 'react';

/**
 * يحمّل صفحة عند أول زيارة لمسارها بدل حزمها كلّها في ملف واحد.
 *
 * الصفحات تُصدَّر بأسماء (`export function XPage`) لا افتراضيًّا، فنلتقط الاسم هنا
 * بدل تحويل 40 ملفًا إلى default export.
 */
export function lazyPage<K extends string>(
  loader: () => Promise<Record<K, ComponentType<Record<string, never>>>>,
  name: K,
) {
  return lazy(async () => ({ default: (await loader())[name] }));
}
