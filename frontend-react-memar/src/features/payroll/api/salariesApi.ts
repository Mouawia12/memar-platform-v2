import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost } from '../../../lib/api';
import type { Salary } from '../types';

export interface SalariesQuery {
  month?: string;
  employee_id?: number;
  page?: number;
  per_page?: number;
}

export const salariesApi = {
  list: (params: SalariesQuery) => apiGetPaginated<Salary>('/salaries', { params }),
  mine: () => apiGet<Salary[]>('/salaries/mine'), // كشوف الموظف الحالي (خدمة ذاتية)
  create: (payload: Record<string, unknown>) => apiPost<Salary>('/salaries', payload),
  update: (id: number, payload: Record<string, unknown>) => apiPatch<Salary>(`/salaries/${id}`, payload),
  pay: (id: number) => apiPost<Salary>(`/salaries/${id}/pay`, {}),
  remove: (id: number) => apiDelete<null>(`/salaries/${id}`),
};
