// نموذج التنقّل — مطابق للقائمة الجانبية في الـERP الحالي (6 أقسام).

export interface NavItem {
  key: string;
  label: string;
  icon: string;
  path: string;
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
      { key: 'tasks', label: 'المهام والمتابعة', icon: '✅', path: '/tasks' },
      { key: 'meetings', label: 'الاجتماعات', icon: '📹', path: '/meetings' },
      { key: 'forum', label: 'المنتدى', icon: '🗨️', path: '/forum' },
      { key: 'requests', label: 'الطلبات', icon: '📩', path: '/requests' },
    ],
  },
  {
    id: 'business',
    title: '💼 إدارة الأعمال',
    items: [
      { key: 'crm', label: 'CRM', icon: '🎯', path: '/crm' },
      { key: 'companies', label: 'الشركات (B2B)', icon: '🏢', path: '/companies' },
      { key: 'clients', label: 'سجل العملاء', icon: '📖', path: '/clients' },
      { key: 'projects', label: 'المشاريع', icon: '🏗️', path: '/projects' },
      { key: 'documents', label: 'المستندات', icon: '📄', path: '/documents' },
      { key: 'appointments', label: 'المواعيد', icon: '📅', path: '/appointments' },
      { key: 'whatsapp', label: 'التواصل', icon: '💬', path: '/whatsapp' },
    ],
  },
  {
    id: 'pricing',
    title: '💰 الأسعار',
    items: [
      { key: 'services', label: 'الخدمات والأسعار', icon: '💼', path: '/services' },
      { key: 'pricing', label: 'محرك التسعير', icon: '⚡', path: '/pricing' },
      { key: 'chatbot', label: 'المساعد الذكي', icon: '🤖', path: '/chatbot' },
    ],
  },
  {
    id: 'employees',
    title: '👥 إدارة الموظفين',
    items: [
      { key: 'hr', label: 'الموظفين', icon: '👤', path: '/hr' },
      { key: 'attendance', label: 'الحضور', icon: '⏱️', path: '/hr/attendance' },
      { key: 'payroll', label: 'الرواتب', icon: '💵', path: '/hr/payroll' },
      { key: 'careers', label: 'التوظيف', icon: '💼', path: '/careers' },
    ],
  },
  {
    id: 'permissions',
    title: '🔐 المستخدمون والصلاحيات',
    items: [
      { key: 'user_logs', label: 'سجل المستخدمين', icon: '📝', path: '/user-logs' },
      { key: 'roles', label: 'الصلاحيات', icon: '🔐', path: '/roles' },
      { key: 'web_builder', label: 'إدارة الموقع', icon: '🌐', path: '/web-builder' },
      { key: 'hero_ads', label: 'واجهة الإعلانات', icon: '🎬', path: '/hero-ads' },
      { key: 'reports', label: 'التقارير', icon: '📊', path: '/reports' },
    ],
  },
  {
    id: 'accounts',
    title: '💳 الحسابات',
    items: [
      { key: 'finance', label: 'الحسابات', icon: '💰', path: '/finance' },
      { key: 'invoices', label: 'الفواتير', icon: '🧾', path: '/finance/invoices' },
      { key: 'contracts', label: 'العقود والتحصيل', icon: '📄', path: '/finance/contracts' },
    ],
  },
];
