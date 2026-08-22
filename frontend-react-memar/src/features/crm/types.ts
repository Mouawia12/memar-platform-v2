// المرحلة = مفتاح ديناميكي يأتي من جدول pipeline_stages (قابل للتعديل والإضافة)
export type Stage = string;
export type ContactType = 'lead' | 'client' | 'contact';
export type Temperature = 'hot' | 'warm' | 'cold' | 'normal';
export type Priority = 'low' | 'medium' | 'high' | 'urgent';
// مصدر الفرصة — من أين جاء العميل المحتمل (طلب أيمن 2026-08-22)
export type LeadSource = 'website' | 'referral' | 'ads' | 'exhibition' | 'direct';

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
  /** فرد أو شركة — يشتقّه الخادم من وجود اسم شركة إن لم يُحدَّد. */
  client_kind: 'individual' | 'company';
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
  /** آخر تحديث سجّله الموظف على الفرصة — يظهر أسفل الكرت. */
  last_update: { note: string | null; user: string | null; at: string | null } | null;
  // تقييم داخلي خاص بالفريق (اجتماع 2026-08-05)
  internal_rating: number | null;
  internal_notes: string | null;
  // حقول الفرصة (المرحلة 3 — طلب أيمن 2026-08-15)
  priority: Priority;
  is_vip: boolean;
  is_urgent: boolean;
  price_1_kwd: string | null;
  price_2_kwd: string | null;
  price_3_kwd: string | null;
  expected_price_kwd: string | null;
  expected_points: number;
  // نقاط كل خيار سعر — يحددها المدير؛ يرسلها الخادم للإدارة فقط (loyalty.manage).
  points_1?: number | null;
  points_2?: number | null;
  points_3?: number | null;
  area_sqm: string | null;
  region: string | null;
  /** عنوان الموقع الكويتي — قطعة/قسيمة (نصّية لأنها قد تحمل حروفًا). */
  block_no: string | null;
  plot_no: string | null;
  project_type: string | null;
  /** مصدر الفرصة (موقع إلكتروني/إحالة/إعلان/معرض/اتصال) — قد يكون فارغًا للفرص القديمة. */
  source: LeadSource | null;
  /** وسوم/اختصارات معتمدة ملصقة على الفرصة (طبق أصل V42). */
  tags: string[] | null;
  address: string | null;
  parent_contact_id: number | null;
  // ملخّص العميل الأصل حين تكون فرصة لعميل موجود
  parent: { id: number; full_name: string; internal_rating: number | null } | null;
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
  // حقول الفرصة (المرحلة 3)
  priority: Priority;
  is_vip: boolean;
  is_urgent: boolean;
  price_1_kwd: string;
  price_2_kwd: string;
  price_3_kwd: string;
  expected_price_kwd: string;
  area_sqm: string;
  region: string;
  block_no: string;
  plot_no: string;
  project_type: string;
  source: LeadSource | '';
  tags: string[];
  address: string;
  parent_contact_id: number | '';
  // ① بيانات العميل: نوع العميل + تقييمه الداخلي (نجوم وتعليق)
  client_kind: 'individual' | 'company';
  internal_rating: number;
  internal_notes: string;
  // ⑤ بيانات الفرصة: منشئ الفرصة (يُختار من الطاقم)
  owner_id: number | '';
}

// حرارة الفرصة (طبق أصل PRIORITY_OPTS) — ساخنة/دافئة/باردة/عادية
export const TEMPERATURE_ORDER: Temperature[] = ['hot', 'warm', 'cold', 'normal'];

export const TEMPERATURE_META: Record<Temperature, { label: string; icon: string; color: string }> = {
  hot: { label: 'ساخنة', icon: '🔥', color: '#DC2626' },
  warm: { label: 'دافئة', icon: '🌤', color: '#D97706' },
  cold: { label: 'باردة', icon: '❄️', color: '#0891B2' },
  normal: { label: 'عادية', icon: '⚪', color: '#6B7280' },
};

// أولوية الفرصة (منفصلة عن الحرارة) — طلب أيمن 2026-08-15
export const PRIORITY_ORDER: Priority[] = ['urgent', 'high', 'medium', 'low'];

export const PRIORITY_META: Record<Priority, { label: string; icon: string; color: string }> = {
  urgent: { label: 'عاجلة', icon: '🔴', color: '#DC2626' },
  high: { label: 'عالية', icon: '🟠', color: '#EA580C' },
  medium: { label: 'متوسطة', icon: '🟡', color: '#CA8A04' },
  low: { label: 'منخفضة', icon: '🟢', color: '#16A34A' },
};

/** تسميات/ألوان احتياطية للمراحل القديمة في السجل (لو حُذفت المرحلة من اللوحة). */
export const STAGE_LABELS_FALLBACK: Record<string, string> = {
  new: 'عميل محتمل', contacted: 'تم التواصل', qualified: 'مؤهّل',
  proposal: 'عرض سعر', won: 'صفقة رابحة', lost: 'خسارة',
};

export const STAGE_COLOR_FALLBACK = '#6B7280';

// مصادر الفرص (طبق أصل قائمة «جميع المصادر» في المرجع) — الترتيب هو ترتيب القائمة.
export const LEAD_SOURCE_ORDER: LeadSource[] = ['website', 'referral', 'ads', 'exhibition', 'direct'];

export const LEAD_SOURCE_META: Record<LeadSource, { label: string; icon: string; color: string }> = {
  website: { label: 'موقع إلكتروني', icon: '\u{1F310}', color: '#1B6CA8' },
  referral: { label: 'إحالة عميل', icon: '\u{1F91D}', color: '#2D9B6F' },
  ads: { label: 'إعلان مدفوع', icon: '\u{1F4E2}', color: '#E8A838' },
  exhibition: { label: 'معرض', icon: '\u{1F3DB}\u{FE0F}', color: '#7C3AED' },
  direct: { label: 'اتصال مباشر', icon: '\u{1F4DE}', color: '#DC4A3D' },
};

/** تسمية المصدر للعرض — «غير محدّد» للفرص التي لم يُسجَّل مصدرها. */
export const sourceLabel = (s: LeadSource | null | undefined) => (s ? LEAD_SOURCE_META[s]?.label ?? s : 'غير محدّد');

/** أنواع المشاريع الشائعة في نموذج الفرصة — «أخرى» تفتح إدخالًا حرًّا. */
export const PROJECT_TYPES: string[] = [
  'فيلا سكنية', 'بيت حكومي', 'شقة / دور', 'عمارة استثمارية', 'مبنى تجاري',
  'مبنى إداري', 'مجمع تجاري', 'مسجد', 'مخزن / مستودع', 'تصميم داخلي', 'ترميم / إضافة',
];

/** خيارات «يحتاج تواصل» — كل خيار يضبط تاريخ التذكير تلقائيًا بعدد أيامه. */
export const FOLLOWUP_PRESETS: { key: string; label: string; days: number | null }[] = [
  { key: '', label: 'بلا تذكير', days: null },
  { key: 'today', label: 'اليوم', days: 0 },
  { key: 'tomorrow', label: 'غدًا', days: 1 },
  { key: '3d', label: 'بعد 3 أيام', days: 3 },
  { key: '7d', label: 'بعد أسبوع (7 أيام)', days: 7 },
  { key: '14d', label: 'بعد أسبوعين', days: 14 },
  { key: '30d', label: 'بعد شهر', days: 30 },
];

// ── ألوان الاختصارات (الوسوم) ──
// الخمسة المعتمدة لها ألوان ثابتة من لوحة معمار؛ وأي اختصار تضيفه الإدارة لاحقًا
// يأخذ لونًا ثابتًا مشتقًّا من اسمه (نفس اللون في كل مرة) بدل الرمادي.
const TAG_PALETTE = ['#7C3AED', '#DC4A3D', '#E8A838', '#1B6CA8', '#2D9B6F', '#0F766E', '#DB2777'];

const TAG_COLORS: Record<string, string> = {
  VIP: '#7C3AED',
  'عاجل': '#DC4A3D',
  'مهم': '#E8A838',
  'معماري': '#1B6CA8',
  'إنشائي': '#2D9B6F',
};

export function tagColor(name: string): string {
  const fixed = TAG_COLORS[name.trim()];
  if (fixed) return fixed;
  let h = 0;
  for (const ch of name) h = (h * 31 + (ch.codePointAt(0) ?? 0)) % 99991;
  return TAG_PALETTE[h % TAG_PALETTE.length];
}

// ── هوية الموظف صاحب الفرصة ──
// لون ثابت لكل موظف يُشتقّ من معرّفه، فيُعرَف صاحب الفرصة من لون الدائرة على
// الكرت دون قراءة الاسم (طلب أيمن 2026-08-22). ألوان متباعدة كي يسهل تمييزها.
const PERSON_PALETTE = [
  '#1B6CA8', '#2D9B6F', '#DC4A3D', '#7C3AED', '#E8A838',
  '#0F766E', '#DB2777', '#4338CA', '#B45309', '#0EA5E9',
  '#65A30D', '#9333EA',
];

export function personColor(seed: string | number): string {
  const str = String(seed);
  let h = 0;
  for (const ch of str) h = (h * 31 + (ch.codePointAt(0) ?? 0)) % 99991;
  return PERSON_PALETTE[h % PERSON_PALETTE.length];
}

/** أول حرفين دالّين من الاسم («م. سارة الحربي» → «سا»). */
export function personInitials(name: string): string {
  const words = name.replace(/[.،]/g, ' ').split(/\s+/).filter((w) => w.length > 1);
  if (words.length === 0) return name.slice(0, 2);
  if (words.length === 1) return words[0].slice(0, 2);
  return `${words[0][0]}${words[1][0]}`;
}
