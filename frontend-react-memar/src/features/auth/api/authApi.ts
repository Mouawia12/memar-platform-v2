import { apiGet, apiPost } from '../../../lib/api';
import type { AuthUser } from '../../../types/api';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface LoginResult {
  token: string;
  user: AuthUser;
}

/** استدعاءات وحدة المصادقة. */
export const authApi = {
  login: (payload: LoginPayload) => apiPost<LoginResult>('/auth/login', payload),
  me: () => apiGet<AuthUser>('/auth/me'),
  logout: () => apiPost<null>('/auth/logout'),
};
