import { api, apiDelete, apiGet, apiPatch, apiPost } from '../../../lib/api';
import type { AuthUser, UiPrefs } from '../../../types/api';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResult {
  token: string;
  user: AuthUser;
}

export interface RegisterPayload {
  name: string;
  email: string;
  phone: string;
  password: string;
  password_confirmation: string;
  account_type?: 'client' | 'company';
  company?: string;
  position?: string;
}

export interface ResetPayload {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}

/** محفظة نقاط الموظف (إحالة→نقاط→راتب). */
export interface EmployeePointsTx {
  id: number;
  points: number;
  balance_after: number;
  source: string;
  description: string | null;
  created_at: string | null;
}
export interface EmployeePoints {
  code: string;
  balance: number;
  lifetime: number;
  rate_points_per_kwd: number;
  convertible_kwd: number;
  min_points: number;
  points_per_deal: number;
  deals_won: number;
  pending_count: number;
  transactions: EmployeePointsTx[];
}

/** استدعاءات وحدة المصادقة. */
export const authApi = {
  login: (payload: LoginPayload) => apiPost<LoginResult>('/auth/login', payload),
  register: (payload: RegisterPayload) => apiPost<LoginResult>('/auth/register', payload),
  forgotPassword: (email: string) => apiPost<null>('/auth/forgot-password', { email }),
  resetPassword: (payload: ResetPayload) => apiPost<null>('/auth/reset-password', payload),
  me: () => apiGet<AuthUser>('/auth/me'),
  /** تحديث الملف الشخصي (الاسم/الهاتف) — تُعيد المستخدم المحدَّث. */
  updateProfile: (payload: { name?: string; phone?: string | null }) => apiPatch<AuthUser>('/auth/me', payload),
  /** تغيير كلمة المرور من داخل الجلسة (بالتحقق من الحالية). */
  changePassword: (payload: { current_password: string; password: string; password_confirmation: string }) =>
    apiPost<null>('/auth/me/password', payload),
  /** محفظة نقاط الموظف. */
  getPoints: () => apiGet<EmployeePoints>('/auth/me/points'),
  convertPoints: (points: number) => apiPost<{ points: number; kwd: number; balance: number }>('/auth/me/points/convert', { points }),
  updateUiPrefs: (prefs: UiPrefs) => apiPatch<UiPrefs>('/auth/me/ui-prefs', prefs),
  /** رفع الصورة الشخصية للموظف — تُعيد بيانات المستخدم المحدّثة (تتضمّن avatar_url). */
  uploadAvatar: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);

    return api.post('/auth/me/avatar', fd).then((r) => r.data.data as AuthUser);
  },
  deleteAvatar: () => apiDelete<AuthUser>('/auth/me/avatar'),
  logout: () => apiPost<null>('/auth/logout'),
};
