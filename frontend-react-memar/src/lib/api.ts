import axios, { type AxiosRequestConfig } from 'axios';

import { useAuthStore } from '../store/auth';
import type { ApiEnvelope, PaginationMeta } from '../types/api';

export interface Paginated<T> {
  data: T[];
  meta: PaginationMeta;
}

/**
 * عميل HTTP موحّد للتواصل مع Laravel API.
 * - يضيف توكن Sanctum تلقائيًا.
 * - يفكّ الظرف الموحّد ويعيد data مباشرة.
 * - عند 401 يسجّل الخروج تلقائيًا.
 */
export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  headers: { Accept: 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout();
    }
    return Promise.reject(error);
  },
);

// ── مساعدات تفكّ الظرف وتعيد data فقط ─────────────────────────
export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.get<ApiEnvelope<T>>(url, config);
  return res.data.data;
}

export async function apiPost<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.post<ApiEnvelope<T>>(url, body, config);
  return res.data.data;
}

export async function apiPatch<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.patch<ApiEnvelope<T>>(url, body, config);
  return res.data.data;
}

export async function apiDelete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await api.delete<ApiEnvelope<T>>(url, config);
  return res.data.data;
}

/** جلب قائمة مصفّحة — يعيد data + meta معًا. */
export async function apiGetPaginated<T>(url: string, config?: AxiosRequestConfig): Promise<Paginated<T>> {
  const res = await api.get<ApiEnvelope<T[]>>(url, config);
  return { data: res.data.data, meta: res.data.meta as PaginationMeta };
}

/** استخراج رسالة خطأ عربية من استجابة الـAPI. */
export function apiErrorMessage(error: unknown, fallback = 'حدث خطأ ما'): string {
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message ?? fallback;
  }
  return fallback;
}
