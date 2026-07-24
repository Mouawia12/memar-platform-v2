import { apiDelete, apiGetPaginated, apiPatch, apiPost } from '../../../lib/api';
import type { Contract } from '../types';

export interface ContractsQuery {
  search?: string;
  status?: string;
  page?: number;
  per_page?: number;
}

export const contractsApi = {
  list: (params: ContractsQuery) => apiGetPaginated<Contract>('/contracts', { params }),
  create: (payload: Record<string, unknown>) => apiPost<Contract>('/contracts', payload),
  update: (id: number, payload: Record<string, unknown>) => apiPatch<Contract>(`/contracts/${id}`, payload),
  remove: (id: number) => apiDelete<null>(`/contracts/${id}`),
  /** توليد فواتير جدول الدفعات (40/30/30). */
  generateInvoices: (id: number) => apiPost<unknown>(`/contracts/${id}/generate-invoices`),
};
