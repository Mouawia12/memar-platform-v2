import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryClient } from '../../../lib/queryClient';
import { financeApi, type ExpensesQuery } from '../api/financeApi';
import type { ExpenseFormData } from '../types';

const KEY = ['expenses'];
const OVERVIEW_KEY = ['finance-overview'];

export function useFinanceOverview() {
  return useQuery({ queryKey: OVERVIEW_KEY, queryFn: () => financeApi.overview() });
}

export function useExpenses(params: ExpensesQuery) {
  return useQuery({ queryKey: [...KEY, params], queryFn: () => financeApi.list(params) });
}

export function useSaveExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: ExpenseFormData }) =>
      id ? financeApi.update(id, { ...data }) : financeApi.create({ ...data }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: OVERVIEW_KEY });
    },
  });
}

export function useDeleteExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => financeApi.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: KEY });
      qc.invalidateQueries({ queryKey: OVERVIEW_KEY });
    },
  });
}
