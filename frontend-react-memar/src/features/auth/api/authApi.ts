import { apiGet, apiPatch, apiPost } from '../../../lib/api';
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

/** استدعاءات وحدة المصادقة. */
export const authApi = {
  login: (payload: LoginPayload) => apiPost<LoginResult>('/auth/login', payload),
  register: (payload: RegisterPayload) => apiPost<LoginResult>('/auth/register', payload),
  forgotPassword: (email: string) => apiPost<null>('/auth/forgot-password', { email }),
  resetPassword: (payload: ResetPayload) => apiPost<null>('/auth/reset-password', payload),
  me: () => apiGet<AuthUser>('/auth/me'),
  updateUiPrefs: (prefs: UiPrefs) => apiPatch<UiPrefs>('/auth/me/ui-prefs', prefs),
  logout: () => apiPost<null>('/auth/logout'),
};
