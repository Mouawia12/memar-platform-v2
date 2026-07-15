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

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  roles?: string[];
  permissions?: string[];
}
