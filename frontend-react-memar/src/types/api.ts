// الظرف الموحّد القادم من Laravel API: { success, message, data, errors, meta }

export interface ApiEnvelope<T> {
  success: boolean;
  message: string | null;
  data: T;
  errors?: Record<string, string[]> | null;
  meta?: PaginationMeta | Record<string, unknown> | null;
}

export interface PaginationMeta {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
}

/** تفضيلات القائمة الجانبية المحفوظة في قاعدة البيانات (تخصيص شخصي ثابت). */
export interface UiPrefs {
  nav_hidden?: Record<string, boolean>;
  nav_collapsed?: Record<string, boolean>;
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  roles?: string[];
  permissions?: string[];
  /** نوع اللوحة التي يهبط عليها المستخدم حسب دوره: admin | employee | client. */
  dashboard?: 'admin' | 'employee' | 'client';
  ui_prefs?: UiPrefs;
  /** أقسام/عناصر السايدبار المخفية حسب دور المستخدم (يضبطها الأدمن لكل دور). */
  role_nav_hidden?: string[];
  /** رقم حساب الموظف الثابت (MEM-YYYY-NNN) — من الباك اند. */
  account_number?: string | null;
  /** كود إحالة الموظف الثابت (MEMAR-…) — من الباك اند. */
  referral_code?: string | null;
  /** عدد العملاء الذين سجّلوا عبر كود إحالة هذا الموظف. */
  referred_clients?: number;
  /** الصورة الشخصية كـ data URI (إن رفعها الموظف) — من الباك اند. */
  avatar_url?: string | null;
}
