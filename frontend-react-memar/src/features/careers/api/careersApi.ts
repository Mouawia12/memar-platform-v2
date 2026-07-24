import { api, apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost } from '../../../lib/api';
import type { JobApplication, JobOpening } from '../types';

export interface CareersQuery {
  search?: string;
  status?: string;
  page?: number;
  per_page?: number;
}

export const careersApi = {
  list: (params: CareersQuery) => apiGetPaginated<JobOpening>('/job-openings', { params }),
  publicList: () => apiGet<JobOpening[]>('/public/job-openings'),
  /** تقديم طلب توظيف من الموقع العام (مع سيرة ذاتية اختيارية). */
  apply: async (form: FormData): Promise<void> => { await api.post('/public/job-applications', form); },
  create: (payload: Record<string, unknown>) => apiPost<JobOpening>('/job-openings', payload),
  update: (id: number, payload: Record<string, unknown>) => apiPatch<JobOpening>(`/job-openings/${id}`, payload),
  remove: (id: number) => apiDelete<null>(`/job-openings/${id}`),
};

export const applicationsApi = {
  list: (params: { search?: string; status?: string; job_opening_id?: number; page?: number }) =>
    apiGetPaginated<JobApplication>('/job-applications', { params }),
  update: (id: number, payload: Record<string, unknown>) => apiPatch<JobApplication>(`/job-applications/${id}`, payload),
  remove: (id: number) => apiDelete<null>(`/job-applications/${id}`),
  /** تنزيل السيرة الذاتية عبر نقطة محميّة بالتوكن. */
  downloadCv: async (id: number, filename: string): Promise<void> => {
    const res = await api.get(`/job-applications/${id}/cv`, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data as Blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  },
};
