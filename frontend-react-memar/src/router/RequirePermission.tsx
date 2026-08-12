import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';

import { isClientOnly, landingPath } from '../config/nav';
import { useAuthStore } from '../store/auth';

interface Props {
  /** الصلاحية المطلوبة لعرض الصفحة (فارغة = يكفي أن يكون من طاقم الإدارة). */
  perm?: string;
  children: ReactNode;
}

/**
 * حارس صلاحيات على مستوى المسار — دفاع أمامي فوق حماية الـAPI (permission middleware).
 *
 * إخفاء الرابط من السايدبار وحده لا يكفي: بكتابة العنوان مباشرة كان أي مستخدم مُصادَق
 * يفتح شِلّ صفحة لا يملكها. هنا من لا يملك الصلاحية يُعاد فورًا لصفحة هبوطه حسب دوره،
 * فلا يظهر له هيكل صفحة ممنوعة إطلاقًا. الحماية الحقيقية تبقى في الخادم؛ هذا يمنع التسريب
 * البصري ويعطي تجربة احترافية نظيفة.
 */
export function RequirePermission({ perm, children }: Props) {
  const user = useAuthStore((s) => s.user);

  const allowed = !perm || !!user?.permissions?.includes(perm);
  if (!allowed) {
    return <Navigate to={landingPath(user?.roles)} replace />;
  }

  return <>{children}</>;
}

/**
 * حارس الصفحة الرئيسية للوحة التحكم (/dashboard): مخصّصة لطاقم الإدارة فقط.
 * الموظفون → بوابة الموظف، والعملاء → بوابتهم — كلٌّ يُعاد لصفحة هبوطه.
 */
export function RequireDashboardHome({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  const home = landingPath(user?.roles);
  if (home !== '/dashboard') {
    return <Navigate to={home} replace />;
  }

  return <>{children}</>;
}

/** حارس بوابات الطاقم (موظف/مهندس): يمنع العميل من الدخول ويعيده لبوابته. */
export function RequireStaff({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user);
  if (isClientOnly(user?.roles)) {
    return <Navigate to="/client-portal" replace />;
  }

  return <>{children}</>;
}

/**
 * وجهة المسارات غير المعروفة (*): المُصادَق يُعاد لصفحة هبوطه حسب دوره (لا /dashboard
 * دائمًا)، وغير المُصادَق لصفحة الدخول.
 */
export function LandingRedirect() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={landingPath(user?.roles)} replace />;
}
