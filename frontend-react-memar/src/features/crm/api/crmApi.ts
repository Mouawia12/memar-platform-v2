import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost } from '../../../lib/api';
import type { Lead, LeadReminder, Stage, Temperature } from '../types';

export interface CrmQuery {
  search?: string;
  /** لوحة CRM تعرض الفرص فقط (type=lead) — منفصلة عن سجل العملاء. */
  type?: string;
  per_page?: number;
  /** without = خارج الأرشيف · only = المؤرشفة وحدها. */
  archived?: 'without' | 'only';
}

/** عنصر في سجل تعديلات الصفقة (من ActivityResource). */
export interface LeadActivity {
  id: number;
  event: string;
  event_label: string;
  causer: { id: number; name: string } | null;
  changes: { field: string; old: unknown; new: unknown }[];
  created_at: string | null;
}

/** حركة في تايملاين الفرصة (المرحلة 4). */
export interface OpportunityUpdate {
  id: number;
  action_key: string | null;
  note: string | null;
  next_followup_at: string | null;
  user: string | null;
  created_at: string | null;
}

/** اختصار (وسم) فرصة — كتالوج + طلب اعتماد (طبق أصل V42). */
export interface CrmTag {
  id: number;
  name: string;
  /** لون الشريحة كما ضبطته الإدارة؛ null = تشتقّه الواجهة من الاسم. */
  color: string | null;
  status: 'pending' | 'approved' | 'rejected';
  requested_by: string | null;
  decided_by: string | null;
  decided_at: string | null;
  created_at: string | null;
}

/** اختصار متابعة جاهز يحرّره الأدمن. */
export interface QuickAction {
  id: number;
  key: string;
  label: string;
  icon: string | null;
  color: string | null;
  clears_urgent: boolean;
  position: number;
  is_active: boolean;
}

/** صفّ فرصة في ملف النسخة الاحتياطية — حقول الفرصة كما حفظها الخادم. */
export interface CrmBackupRow extends Record<string, unknown> {
  id?: number;
  full_name: string;
}

export interface CrmBackup {
  version: number;
  exported_at: string;
  count: number;
  opportunities: CrmBackupRow[];
}

/** حصيلة الاستعادة: كم فرصة حُدّثت، وكم أُعيدت من المحذوفة، وكم أُنشئت. */
export interface CrmRestoreResult {
  updated: number;
  restored: number;
  created: number;
}

export const crmApi = {
  list: (params: CrmQuery) => apiGetPaginated<Lead>('/contacts', { params }),
  create: (payload: Record<string, unknown>) => apiPost<Lead>('/contacts', payload),
  update: (id: number, payload: Record<string, unknown>) => apiPatch<Lead>(`/contacts/${id}`, payload),
  moveStage: (id: number, stage: Stage) => apiPatch<Lead>(`/contacts/${id}`, { stage }),
  setTemperature: (id: number, temperature: Temperature) => apiPatch<Lead>(`/contacts/${id}`, { temperature }),
  /** إعادة ترتيب الفرص داخل عمود (قائمة المعرّفات بالترتيب الجديد) — متاح لكل الأدوار. */
  reorder: (ids: number[]) => apiPost<null>('/contacts/reorder', { ids }),
  /**
   * إزالة الفرصة من اللوحة فقط — يبقى صاحبها في سجلّ العملاء وشركتُه في سجلّ
   * الشركات. الحذف النهائي من السجلات وحدها (طلب أيمن 2026-08-25).
   */
  remove: (id: number) => apiDelete<null>(`/crm/opportunities/${id}`),
  /** أرشفة الفرصة أو إرجاعها (لوحة الفرص 2026-09-16). */
  archive: (id: number) => apiPost<{ archived_at: string | null }>(`/crm/opportunities/${id}/archive`),
  unarchive: (id: number) => apiPost<{ archived_at: string | null }>(`/crm/opportunities/${id}/unarchive`),
  /** نسخة احتياطية من فرص اللوحة، واستعادتها من ملف (لا تحذف شيئًا). */
  backup: () => apiGet<CrmBackup>('/crm/backup'),
  restore: (opportunities: CrmBackupRow[]) => apiPost<CrmRestoreResult>('/crm/restore', { opportunities }),
  /** «اسأل / اطلب تحديث»: السؤال اختياري، والمهلة بالساعات أو null = بدون مهلة. */
  requestUpdate: (id: number, body: string, hours: number | null) => apiPost<unknown>(`/contacts/${id}/directives`, { body, hours }),
  replyDirective: (id: number, directiveId: number, body: string) => apiPost<unknown>(`/contacts/${id}/directives/${directiveId}/messages`, { body }),
  /** فتح خيط التوجيه يعلّمه مقروءًا — مرور الإدارة على الرد يكفي اطّلاعًا. */
  readDirectives: (id: number) => apiGet<unknown>(`/contacts/${id}/directives`),
  /** سجل تعديلات الصفقة (AUDIT-1). */
  history: (id: number) => apiGetPaginated<LeadActivity>('/activity-log', { params: { subject_type: 'Contact', subject_id: id, per_page: 40 } }),

  // تايملاين تحديثات الفرصة + الاختصارات (المرحلة 4)
  updates: (id: number) => apiGet<OpportunityUpdate[]>(`/contacts/${id}/updates`),
  logUpdate: (id: number, payload: { action_key?: string; note?: string; next_followup_at?: string }) =>
    apiPost<OpportunityUpdate>(`/contacts/${id}/updates`, payload),
  quickActions: () => apiGet<QuickAction[]>('/quick-actions'),

  // اختصارات (وسوم) الفرص + طلبات الاعتماد (طبق أصل V42)
  tags: () => apiGet<CrmTag[]>('/crm/tags'),
  createTag: (name: string) => apiPost<CrmTag>('/crm/tags', { name }),
  updateTag: (id: number, payload: { name?: string; color?: string | null }) => apiPatch<CrmTag>(`/crm/tags/${id}`, payload),
  approveTag: (id: number) => apiPost<CrmTag>(`/crm/tags/${id}/approve`),
  rejectTag: (id: number) => apiPost<CrmTag>(`/crm/tags/${id}/reject`),
  deleteTag: (id: number) => apiDelete<null>(`/crm/tags/${id}`),

  // تذكيرات المتابعة (اجتماع 2026-08-05)
  /** عدّاد الفرص العاجلة/المستحقّة — لتنبيه الجرس العام. */
  urgentCount: () => apiGet<{ urgent: number; due: number; first_urgent_id: number | null }>('/crm/urgent-count'),
  reminders: (id: number) => apiGet<LeadReminder[]>(`/contacts/${id}/reminders`),
  addReminder: (id: number, payload: { remind_at: string; note?: string; repeat_every?: string }) => apiPost<LeadReminder>(`/contacts/${id}/reminders`, payload),
  toggleReminder: (reminderId: number) => apiPatch<LeadReminder>(`/reminders/${reminderId}`, {}),
  deleteReminder: (reminderId: number) => apiDelete<null>(`/reminders/${reminderId}`),
};
