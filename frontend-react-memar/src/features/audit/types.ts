export interface ActivityChange {
  field: string;
  old: string | number | boolean | null;
  new: string | number | boolean | null;
}

export interface Activity {
  id: number;
  event: string;
  event_label: string;
  subject_type: string;
  subject_label: string;
  subject_id: number | null;
  title: string | null;
  causer: { id: number; name: string } | null;
  changes: ActivityChange[];
  created_at: string | null;
}

export interface AuditFilterOptions {
  subjects: { value: string; label: string }[];
  events: { value: string; label: string }[];
  users: { id: number; name: string }[];
}

export const EVENT_COLORS: Record<string, string> = {
  created: '#2D9B6F',
  updated: '#1B6CA8',
  deleted: '#DC4A3D',
  restored: '#E8A838',
};

/** تسميات عربية للحقول الشائعة في تفاصيل التغيير. */
export const FIELD_LABELS: Record<string, string> = {
  name: 'الاسم',
  full_name: 'الاسم الكامل',
  title: 'العنوان',
  code: 'الكود',
  number: 'الرقم',
  status: 'الحالة',
  stage: 'المرحلة',
  priority: 'الأولوية',
  type: 'النوع',
  email: 'البريد',
  phone: 'الهاتف',
  company: 'الشركة',
  department: 'القسم',
  job_title: 'المسمى الوظيفي',
  base_salary_kwd: 'الراتب الأساسي',
  price_kwd: 'السعر',
  value_kwd: 'القيمة',
  total_kwd: 'الإجمالي',
  paid_kwd: 'المدفوع',
  amount_kwd: 'المبلغ',
  budget_kwd: 'الميزانية',
  deal_value_kwd: 'قيمة الصفقة',
  due_date: 'تاريخ الاستحقاق',
  start_date: 'تاريخ البداية',
  end_date: 'تاريخ النهاية',
  spent_at: 'تاريخ الصرف',
  is_active: 'مفعّل',
  category: 'التصنيف',
  location: 'الموقع',
  description: 'الوصف',
};
