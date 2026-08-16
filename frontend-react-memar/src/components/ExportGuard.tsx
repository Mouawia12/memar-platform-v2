import { createContext, useContext, type ReactNode } from 'react';

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
