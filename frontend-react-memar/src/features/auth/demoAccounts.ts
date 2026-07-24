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

/** المجموعة الأولى تظهر دائمًا؛ الباقي خلف زر «عرض الكل». */
export const DEMO_GROUPS: DemoGroup[] = [
  {
    title: '👑 الإدارة العليا',
    accounts: [
      { email: 'admin@memar.kw', password: 'admin123', label: '👑 م. أيمن', badge: 'Admin', tone: 'primary' },
      { email: 'pm@memar.kw', password: 'pm123', label: '🎯 م. عبدالله', badge: 'PM', tone: 'primary' },
    ],
  },
  {
    title: '🏢 مهندسون ومصممون',
    accounts: [
      { email: 'arch1@memar.kw', password: 'arch123', label: '🏗️ م. دعاء', badge: 'Arch', tone: 'green' },
      { email: 'arch2@memar.kw', password: 'arch123', label: '🏗️ م. خالد', badge: 'Arch', tone: 'green' },
      { email: 'struct1@memar.kw', password: 'struct123', label: '⚙️ م. إسماعيل', badge: 'Struct', tone: 'green' },
      { email: 'struct2@memar.kw', password: 'struct123', label: '⚙️ م. بيشوي', badge: 'Struct', tone: 'green' },
    ],
  },
  {
    title: '📋 إداريون وطاقم العمل',
    accounts: [
      { email: 'acc@memar.kw', password: 'acc123', label: '💰 أ. وليد', badge: 'Finance', tone: 'orange' },
      { email: 'sec@memar.kw', password: 'sec123', label: '📋 أ. رنا', badge: 'Office', tone: 'primary' },
      { email: 'rep@memar.kw', password: 'rep123', label: '🤝 أبو علي', badge: 'Sales', tone: 'orange' },
      { email: 'draft@memar.kw', password: 'draft123', label: '✏️ نشأت', badge: 'Draft', tone: 'green' },
      { email: 'office@memar.kw', password: 'office123', label: '☕ جميل', badge: 'Staff', tone: 'primary' },
    ],
  },
  {
    title: '🎨 فري لانسر',
    accounts: [
      { email: '3d@memar.kw', password: '3d123', label: '🖥️ م. أحمد سمير', badge: '3D', tone: 'purple' },
      { email: 'interior@memar.kw', password: 'int123', label: '🛋️ م. سمر', badge: 'Interior', tone: 'purple' },
      { email: 'ui@memar.kw', password: 'ui123', label: '📱 م. آلاء', badge: 'UI/UX', tone: 'purple' },
    ],
  },
  {
    title: '🏠 العملاء',
    accounts: [
      { email: 'client1@memar.kw', password: 'client123', label: '🏠 أحمد العلي', badge: 'Client', tone: 'orange' },
      { email: 'client2@memar.kw', password: 'client123', label: '🏠 خالد خلف العازمي', badge: 'Client', tone: 'orange' },
      { email: 'client3@memar.kw', password: 'client123', label: '🏠 د. آمنة الرشيدي', badge: 'Client', tone: 'orange' },
    ],
  },
];

/** هل تُعرض لوحة الحسابات التجريبية؟ (تطوير، أو تفعيل صريح لسيرفر العرض) */
export const SHOW_DEMO_ACCOUNTS =
  import.meta.env.DEV || import.meta.env.VITE_SHOW_DEMO_ACCOUNTS === 'true';
