import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost } from '../../../lib/api';
import type { Quotation } from '../types';

export interface QuotationsQuery {
  search?: string;
  status?: string;
  page?: number;
  per_page?: number;
}

export const quotationsApi = {
  list: (params: QuotationsQuery) => apiGetPaginated<Quotation>('/quotations', { params }),
  get: (id: number) => apiGet<Quotation>(`/quotations/${id}`),
  create: (payload: Record<string, unknown>) => apiPost<Quotation>('/quotations', payload),
  update: (id: number, payload: Record<string, unknown>) => apiPatch<Quotation>(`/quotations/${id}`, payload),
  remove: (id: number) => apiDelete<null>(`/quotations/${id}`),
  /** تحويل العرض إلى عقد. */
  convertToContract: (id: number) => apiPost<unknown>(`/quotations/${id}/convert-to-contract`),
};
