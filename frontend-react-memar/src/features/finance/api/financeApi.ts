import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost } from '../../../lib/api';
import type { Expense, FinanceOverview } from '../types';

export interface ExpensesQuery {
  search?: string;
  category?: string;
  page?: number;
  per_page?: number;
}

export const financeApi = {
  overview: () => apiGet<FinanceOverview>('/finance/overview'),
  list: (params: ExpensesQuery) => apiGetPaginated<Expense>('/expenses', { params }),
  create: (payload: Record<string, unknown>) => apiPost<Expense>('/expenses', payload),
  update: (id: number, payload: Record<string, unknown>) => apiPatch<Expense>(`/expenses/${id}`, payload),
  remove: (id: number) => apiDelete<null>(`/expenses/${id}`),
};
