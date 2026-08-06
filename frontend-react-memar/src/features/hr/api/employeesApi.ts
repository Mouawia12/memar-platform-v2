import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost } from '../../../lib/api';
import type { Employee, EmployeeStats } from '../types';

export interface EmployeesQuery {
  search?: string;
  status?: string;
  page?: number;
  per_page?: number;
}

export const employeesApi = {
  list: (params: EmployeesQuery) => apiGetPaginated<Employee>('/employees', { params }),
  stats: () => apiGet<EmployeeStats>('/employees/stats'),
  create: (payload: Record<string, unknown>) => apiPost<Employee>('/employees', payload),
  update: (id: number, payload: Record<string, unknown>) => apiPatch<Employee>(`/employees/${id}`, payload),
  remove: (id: number) => apiDelete<null>(`/employees/${id}`),
};
