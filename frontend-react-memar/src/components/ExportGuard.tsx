import { createContext, useContext, type ReactNode } from 'react';

import { usePermission } from '../features/auth/hooks/usePermission';

/**
 * يعطّل أزرار تصدير البيانات (CSV/إكسل) داخل شجرة معيّنة — تُستخدم في بوابة الموظف
 * لمنع الموظفين من تصدير بيانات النظام (طلب أيمن 2026-08-16). لا يؤثّر على لوحة الإدارة.
 */
const ExportDisabledContext = createContext(false);

export function ExportDisabledProvider({ children }: { children: ReactNode }) {
  return <ExportDisabledContext.Provider value={true}>{children}</ExportDisabledContext.Provider>;
}

export function useExportDisabled(): boolean {
  return useContext(ExportDisabledContext);
}

/**
 * من يملك تصدير البيانات (طلب أيمن 2026-09-17): «التصدير ما ينفعش حد يعمله، عايزها
 * بس خاصة للإدارة مش للموظفين».
 *
 * كان المنع سياق React داخل بوابة الموظف وحدها، فكل دور وجهته لوحة الإدارة (محاسب،
 * موارد بشرية، مدير مشاريع) يصدّر، بل يكفي الموظف أن يكتب /clients في شريط العنوان.
 * صار الحقّ صلاحيةً `exports.view` تُمنح للأدمن ومدير النظام، ويمنحها الأدمن لغيرهما
 * من شاشة الصلاحيات إن أراد. (إخفاء لا منع: من يرى البيانات يظلّ قادرًا على نسخها.)
 */
export function useCanExport(): boolean {
  const disabledHere = useExportDisabled();
  const allowed = usePermission('exports.view');

  return allowed && !disabledHere;
}
