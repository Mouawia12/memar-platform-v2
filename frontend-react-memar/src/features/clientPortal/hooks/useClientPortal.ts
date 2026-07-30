import { useMutation, useQuery } from '@tanstack/react-query';

import { clientPortalApi, type ClientRequestType } from '../api/clientPortalApi';

export function useClientPortal() {
  return useQuery({ queryKey: ['client-portal'], queryFn: () => clientPortalApi.get() });
}

/** إرسال طلب من العميل: مشروع/اجتماع/استفسار (CLIENT-2). */
export function useSubmitClientRequest() {
  return useMutation({
    mutationFn: ({ type, note }: { type: ClientRequestType; note?: string }) => clientPortalApi.submitRequest(type, note),
  });
}

/** تفاصيل مشروع للعميل (CLIENT-4): مراحله وتقدّمه ودفعاته. */
export function useClientProject(id: number) {
  return useQuery({
    queryKey: ['client-portal-project', id],
    queryFn: () => clientPortalApi.project(id),
    enabled: Number.isFinite(id) && id > 0,
  });
}
