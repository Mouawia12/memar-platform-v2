// نموذج التنقّل — مطابق للقائمة الجانبية في الـERP الحالي (6 أقسام).

export interface NavItem {
  key: string;
  label: string;
  icon: string;
  path: string;
  /** صلاحية العرض المطلوبة لإظهار العنصر (فارغة = متاح للجميع). */
  perm?: string;
}

export interface NavSection {
  id: string;
  title: string;
  items: NavItem[];
}

/** عنوان الصفحة الحالي من المسار (للشريط العلوي). */
export function getPageTitle(pathname: string): string {
  const items = NAV_SECTIONS.flatMap((s) => s.items);
  const exact = items.find((i) => i.path === pathname);
  if (exact) return exact.label;
  const partial = items.find((i) => i.path !== '/dashboard' && pathname.startsWith(i.path));
  return partial?.label ?? 'لوحة التحكم';
}

export const NAV_SECTIONS: NavSection[] = [
  {
    id: 'home',
    title: '🏠 الرئيسية',
    items: [
      { key: 'dashboard', label: 'لوحة التحكم', icon: '⊞', path: '/dashboard' },
      { key: 'engineer_portal', label: 'بوابة المهندس', icon: '🧑\u200d💼', path: '/engineer-portal' },
      { key: 'tasks', label: 'المهام والمتابعة', icon: '✅', path: '/tasks', perm: 'tasks.view' },
      { key: 'meetings', label: 'الاجتماعات', icon: '📹', path: '/meetings', perm: 'appointments.view' },
      { key: 'forum', label: 'المنتدى', icon: '🗨️', path: '/forum' },
      { key: 'requests', label: 'الطلبات', icon: '📩', path: '/requests', perm: 'requests.view' },
    ],
  },
  {
    id: 'business',
    title: '💼 إدارة الأعمال',
    items: [
      { key: 'crm', label: 'CRM', icon: '🎯', path: '/crm', perm: 'crm.view' },
      { key: 'companies', label: 'الشركات (B2B)', icon: '🏢', path: '/companies', perm: 'crm.view' },
      { key: 'clients', label: 'سجل العملاء', icon: '📖', path: '/clients', perm: 'crm.view' },
      { key: 'projects', label: 'المشاريع', icon: '🏗️', path: '/projects', perm: 'projects.view' },
      { key: 'field_visits', label: 'الزيارات الميدانية', icon: '🚧', path: '/field-visits', perm: 'projects.view' },
      { key: 'documents', label: 'المستندات', icon: '📄', path: '/documents', perm: 'documents.view' },
      { key: 'file_manager', label: 'مدير الملفات', icon: '🗂️', path: '/files', perm: 'documents.view' },
      { key: 'appointments', label: 'المواعيد', icon: '📅', path: '/appointments', perm: 'appointments.view' },
      { key: 'whatsapp', label: 'التواصل', icon: '💬', path: '/whatsapp', perm: 'crm.view' },
    ],
  },
  {
    id: 'pricing',
    title: '💰 الأسعار',
    items: [
      { key: 'services', label: 'الخدمات والأسعار', icon: '💼', path: '/services', perm: 'pricing.view' },
      { key: 'pricing', label: 'محرك التسعير', icon: '⚡', path: '/pricing', perm: 'pricing.view' },
      { key: 'chatbot', label: 'المساعد الذكي', icon: '🤖', path: '/chatbot' },
    ],
  },
  {
    id: 'employees',
    title: '👥 إدارة الموظفين',
    items: [
      { key: 'hr', label: 'الموظفين', icon: '👤', path: '/hr', perm: 'hr.view' },
      { key: 'attendance', label: 'الحضور', icon: '⏱️', path: '/hr/attendance', perm: 'hr.view' },
      { key: 'payroll', label: 'الرواتب', icon: '💵', path: '/hr/payroll', perm: 'hr.view' },
      { key: 'careers', label: 'التوظيف', icon: '💼', path: '/careers', perm: 'hr.view' },
    ],
  },
  {
    id: 'permissions',
    title: '🔐 المستخدمون والصلاحيات',
    items: [
      { key: 'user_logs', label: 'سجل المستخدمين', icon: '📝', path: '/user-logs', perm: 'users.view' },
      { key: 'audit', label: 'سجل التدقيق', icon: '🕵️', path: '/audit', perm: 'users.view' },
      { key: 'roles', label: 'الصلاحيات', icon: '🔐', path: '/roles', perm: 'users.view' },
      { key: 'web_builder', label: 'إدارة الموقع', icon: '🌐', path: '/web-builder', perm: 'settings.manage' },
      { key: 'hero_ads', label: 'واجهة الإعلانات', icon: '🎬', path: '/hero-ads', perm: 'settings.manage' },
      { key: 'reports', label: 'التقارير', icon: '📊', path: '/reports', perm: 'finance.view' },
    ],
  },
  {
    id: 'accounts',
    title: '💳 الحسابات',
    items: [
      { key: 'finance', label: 'الحسابات', icon: '💰', path: '/finance', perm: 'finance.view' },
      { key: 'invoices', label: 'الفواتير', icon: '🧾', path: '/finance/invoices', perm: 'finance.view' },
      { key: 'contracts', label: 'العقود والتحصيل', icon: '📄', path: '/finance/contracts', perm: 'contracts.view' },
    ],
  },
];
