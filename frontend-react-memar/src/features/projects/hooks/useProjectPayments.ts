import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { projectsApi } from '../api/projectsApi';

/** دفعات المشروع: فواتيره + ملخّص المحصّل والمتبقّي (PROJ-3). */
export function useProjectPayments(projectId: number) {
  return useQuery({
    queryKey: ['project-payments', projectId],
    queryFn: () => projectsApi.payments(projectId),
    enabled: Number.isFinite(projectId) && projectId > 0,
  });
}

/** تسجيل دفعة على فاتورة المشروع (يعيد استخدام نظام الفواتير). */
export function useRecordPayment(projectId: number) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ invoiceId, amount_kwd, method, reference, paid_at }: { invoiceId: number; amount_kwd: number; method: string; reference?: string; paid_at?: string }) =>
      projectsApi.recordPayment(invoiceId, { amount_kwd, method, reference, paid_at }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-payments', projectId] });
      qc.invalidateQueries({ queryKey: ['project-overview', projectId] });
    },
  });
}
