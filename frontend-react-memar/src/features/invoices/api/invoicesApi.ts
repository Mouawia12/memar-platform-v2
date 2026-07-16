import { apiDelete, apiGetPaginated, apiPatch, apiPost } from '../../../lib/api';
import type { Invoice } from '../types';

export interface InvoicesQuery {
  search?: string;
  status?: string;
  page?: number;
  per_page?: number;
}

export const invoicesApi = {
  list: (params: InvoicesQuery) => apiGetPaginated<Invoice>('/invoices', { params }),
  create: (payload: Record<string, unknown>) => apiPost<Invoice>('/invoices', payload),
  update: (id: number, payload: Record<string, unknown>) => apiPatch<Invoice>(`/invoices/${id}`, payload),
  remove: (id: number) => apiDelete<null>(`/invoices/${id}`),
  recordPayment: (id: number, payload: Record<string, unknown>) => apiPost<Invoice>(`/invoices/${id}/payments`, payload),
};
