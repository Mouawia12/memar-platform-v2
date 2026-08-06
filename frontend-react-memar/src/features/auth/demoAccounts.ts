/**
 * الحسابات التجريبية — مطابقة للوحة الدخول في الموقع القديم.
 * تُبذر في الباك عبر: php artisan db:seed --class=DemoUsersSeeder --force
 *
 * ⚠️ تظهر في التطوير فقط افتراضيًا (كلمات المرور معروفة).
 * لإظهارها على سيرفر عرض: VITE_SHOW_DEMO_ACCOUNTS=true قبل البناء.
 */

export type BadgeTone = 'primary' | 'green' | 'orange' | 'purple' | 'red';

export interface DemoAccount {
  email: string;
  password: string;
  label: string;
  badge: string;
  tone: BadgeTone;
}

export interface DemoGroup {
  title: string;
  accounts: DemoAccount[];
}

export const BADGE_COLORS: Record<BadgeTone, { bg: string; fg: string }> = {
  primary: { bg: '#1B6CA8', fg: '#fff' },
  green: { bg: '#2D9B6F', fg: '#fff' },
  orange: { bg: '#E8A838', fg: '#333' },
  purple: { bg: '#7B2D8B', fg: '#fff' },
  red: { bg: '#DC4A3D', fg: '#fff' },
};

/**
 * حساب واحد لكل دور (تنظيف طلبه أيمن 2026-08-06) — يطابق DemoUsersSeeder تمامًا.
 * المجموعة الأولى تظهر دائمًا؛ الباقي خلف زر «عرض الكل».
 */
export const DEMO_GROUPS: DemoGroup[] = [
  {
    title: '👑 الإدارة العليا',
    accounts: [
      { email: 'admin@memar.kw', password: 'admin123', label: '👑 م. أيمن (مدير النظام)', badge: 'Admin', tone: 'primary' },
      { email: 'pm@memar.kw', password: 'pm123', label: '🎯 م. عبدالله (مدير مشاريع)', badge: 'Manager', tone: 'primary' },
    ],
  },
  {
    title: '🏢 الفريق الفني والمالي',
    accounts: [
      { email: 'arch1@memar.kw', password: 'arch123', label: '🏗️ م. دعاء (مهندسة)', badge: 'Architect', tone: 'green' },
      { email: 'acc@memar.kw', password: 'acc123', label: '💰 أ. وليد (محاسب)', badge: 'Accountant', tone: 'orange' },
      { email: 'hr@memar.kw', password: 'hr123', label: '👔 أ. منى (موارد بشرية)', badge: 'HR', tone: 'purple' },
    ],
  },
  {
    title: '📋 المكتب والمبيعات',
    accounts: [
      { email: 'sec@memar.kw', password: 'sec123', label: '📋 أ. رنا (سكرتارية)', badge: 'Secretary', tone: 'primary' },
      { email: 'rep@memar.kw', password: 'rep123', label: '🤝 أبو علي (مبيعات)', badge: 'Sales', tone: 'orange' },
    ],
  },
  {
    title: '🏠 العملاء',
    accounts: [
      // الاسم يطابق users.name في DemoUsersSeeder + AtomsDemoSeeder (لا فجوة اسم في البوابة).
      { email: 'client1@memar.kw', password: 'client123', label: '🏢 أحمد بن عبدالله المنصور', badge: 'Client', tone: 'orange' },
    ],
  },
];

/** هل تُعرض لوحة الحسابات التجريبية؟ (تطوير، أو تفعيل صريح لسيرفر العرض) */
export const SHOW_DEMO_ACCOUNTS =
  import.meta.env.DEV || import.meta.env.VITE_SHOW_DEMO_ACCOUNTS === 'true';
