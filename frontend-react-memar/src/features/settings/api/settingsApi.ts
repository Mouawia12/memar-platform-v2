import { apiGet, apiPatch } from '../../../lib/api';

/** أرقام نافذة «إعدادات النقاط والاختصارات» — مرآة config/crm.php. */
export interface CrmSettings {
  points: {
    enabled: boolean;
    unit_points: number;
    /** قيمة الوحدة بالدينار — يُحجب عن غير الإدارة (خصوصية الأرقام المالية). */
    unit_kwd?: number;
    suggested: { price_1: number; price_2: number; price_3: number };
  };
  /** تكرار نغمة جرس الفرصة العاجلة بالدقائق (0 = مرّة واحدة). */
  alerts: { urgent_repeat_minutes: number };
  finance_privacy: { hide_totals_from_staff: boolean };
}

interface SettingsEnvelope<T> {
  group: string;
  effective: T;
  overrides: Record<string, unknown>;
}

export const settingsApi = {
  /** قراءة متاحة لكل من يرى الفرص (الأرقام المالية محجوبة عن غير الإدارة). */
  crm: () => apiGet<SettingsEnvelope<CrmSettings>>('/crm/settings'),
  saveCrm: (settings: Record<string, unknown>) =>
    apiPatch<SettingsEnvelope<CrmSettings>>('/settings/crm', { settings }),
};

/** القيم الافتراضية — تُستخدم قبل وصول الإعدادات أو لمن لا يملك صلاحية قراءتها. */
export const CRM_SETTINGS_FALLBACK: CrmSettings = {
  points: { enabled: true, unit_points: 100, unit_kwd: 10, suggested: { price_1: 10, price_2: 20, price_3: 50 } },
  alerts: { urgent_repeat_minutes: 30 },
  finance_privacy: { hide_totals_from_staff: true },
};
