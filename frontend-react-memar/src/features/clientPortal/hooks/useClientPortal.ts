import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { clientPortalApi, type ClientProfilePayload, type ClientRequestType, type NotificationPrefs } from '../api/clientPortalApi';

export function useClientPortal() {
  return useQuery({ queryKey: ['client-portal'], queryFn: () => clientPortalApi.get() });
}

/** إرسال طلب من العميل: مشروع/اجتماع/استفسار (CLIENT-2). */
export function useSubmitClientRequest() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ type, note }: { type: ClientRequestType; note?: string }) => clientPortalApi.submitRequest(type, note),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client-requests'] });
      qc.invalidateQueries({ queryKey: ['client-notifications'] });
    },
  });
}

/** طلباتي — قائمة طلبات العميل. */
export function useMyRequests() {
  return useQuery({ queryKey: ['client-requests'], queryFn: () => clientPortalApi.myRequests() });
}

/** إشعارات العميل. */
export function useClientNotifications() {
  return useQuery({ queryKey: ['client-notifications'], queryFn: () => clientPortalApi.notifications() });
}

/** تحديث بيانات العميل (الإعدادات). */
export function useUpdateClientProfile() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: ClientProfilePayload) => clientPortalApi.updateProfile(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client-portal'] }),
  });
}

/** حفظ تفضيلات الإشعارات (مفاتيح الإعدادات). */
export function useUpdateClientPreferences() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (prefs: NotificationPrefs) => clientPortalApi.updatePreferences(prefs),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client-portal'] }),
  });
}

/** برنامج الولاء — كود الإحالة + الإحصاءات + السجل. */
export function useLoyalty() {
  return useQuery({ queryKey: ['client-loyalty'], queryFn: () => clientPortalApi.loyalty() });
}

/** تسجيل مشاركة كود الإحالة (عدّاد حقيقي). */
export function useRecordReferralShare() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => clientPortalApi.recordShare(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client-loyalty'] }),
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
