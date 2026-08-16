import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { loyaltyAdminApi } from '../api/loyaltyAdminApi';

const KEY = ['loyalty-dashboard'];

export function useLoyaltyDashboard() {
  return useQuery({ queryKey: KEY, queryFn: () => loyaltyAdminApi.dashboard() });
}

/** أي إجراء اعتماد/رفض يُبطل اللوحة فتتحدّث الأرقام والقوائم فورًا. */
function useAction<T>(fn: (arg: T) => Promise<unknown>) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: fn, onSuccess: () => qc.invalidateQueries({ queryKey: KEY }) });
}

export const useApproveTx = () => useAction((id: number) => loyaltyAdminApi.approveTx(id));
export const useCancelTx = () => useAction((id: number) => loyaltyAdminApi.cancelTx(id));
export const useApproveRedemption = () => useAction((id: number) => loyaltyAdminApi.approveRedemption(id));
export const useRejectRedemption = () => useAction((p: { id: number; reason?: string }) => loyaltyAdminApi.rejectRedemption(p.id, p.reason));
