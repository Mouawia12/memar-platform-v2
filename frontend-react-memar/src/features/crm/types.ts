// المرحلة = مفتاح ديناميكي يأتي من جدول pipeline_stages (قابل للتعديل والإضافة)
export type Stage = string;
export type ContactType = 'lead' | 'client' | 'contact';
export type Temperature = 'hot' | 'warm' | 'cold' | 'normal';

/** مرحلة (عمود) في لوحة الفرص — تُدار من الأدمن. */
export interface PipelineStage {
  id: number;
  key: string;
  label: string;
  color: string;
  position: number;
  is_won: boolean;
  is_lost: boolean;
  is_protected: boolean;
}

export interface Lead {
  id: number;
  full_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  position: string | null;
  type: ContactType;
  status: string;
  stage: Stage;
  temperature: Temperature;
  deal_value_kwd: string;
  notes: string | null;
  project_name: string | null;
  project_details: string | null;
  converted_project_id: number | null;
  // الاسم الموحّد للمشروع (حيّ من سجل المشاريع بعد التحويل)
  effective_project_name: string | null;
  // المشروع المرتبط بعد التحويل (حيّ من سجل المشاريع)
  project: { id: number; code: string; name: string; status: string } | null;
  owner: { id: number; name: string } | null;
  // أقرب تذكير معلّق + هل حان وقته (لتنبيه الكرت) — اجتماع 2026-08-05
  reminder: { id: number; remind_at: string | null; note: string | null; due: boolean } | null;
  // تقييم داخلي خاص بالفريق (اجتماع 2026-08-05)
  internal_rating: number | null;
  internal_notes: string | null;
  created_at: string | null;
}

/** تذكير متابعة على فرصة. */
export interface LeadReminder {
  id: number;
  remind_at: string | null;
  note: string | null;
  done: boolean;
  due: boolean;
  creator: string | null;
}

export interface LeadFormData {
  full_name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  type: ContactType;
  stage: Stage;
  temperature: Temperature;
  deal_value_kwd: string;
  notes: string;
  project_name: string;
  project_details: string;
}

// حرارة الفرصة (طبق أصل PRIORITY_OPTS) — ساخنة/دافئة/باردة/عادية
export const TEMPERATURE_ORDER: Temperature[] = ['hot', 'warm', 'cold', 'normal'];

export const TEMPERATURE_META: Record<Temperature, { label: string; icon: string; color: string }> = {
  hot: { label: 'ساخنة', icon: '🔥', color: '#DC2626' },
  warm: { label: 'دافئة', icon: '🌤', color: '#D97706' },
  cold: { label: 'باردة', icon: '❄️', color: '#0891B2' },
  normal: { label: 'عادية', icon: '⚪', color: '#6B7280' },
};

/** تسميات/ألوان احتياطية للمراحل القديمة في السجل (لو حُذفت المرحلة من اللوحة). */
export const STAGE_LABELS_FALLBACK: Record<string, string> = {
  new: 'عميل محتمل', contacted: 'تم التواصل', qualified: 'مؤهّل',
  proposal: 'عرض سعر', won: 'صفقة رابحة', lost: 'خسارة',
};

export const STAGE_COLOR_FALLBACK = '#6B7280';
