import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { clientPortalApi, type ClientProfilePayload, type ClientRequestPayload, type NotificationPrefs } from '../api/clientPortalApi';

/**
 * بيانات البوابة. بلا وسيط = بيانات العميل الحالي (self).
 * مع asContact = عرض إداري «كأنه العميل» عبر نقطة الطاقم (يتطلّب صلاحية clients.view)،
 * ويعيد نفس الشكل مضافًا إليه التقييم الداخلي.
 */
export function useClientPortal(asContact?: number) {
  return useQuery({
    queryKey: asContact ? ['staff-client-profile', asContact] : ['client-portal'],
    queryFn: () => (asContact ? clientPortalApi.staffProfile(asContact) : clientPortalApi.get()),
  });
}

/** إرسال طلب من العميل: مشروع/اجتماع/استفسار (CLIENT-2). */
export function useSubmitClientRequest() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: ClientRequestPayload) => clientPortalApi.submitRequest(payload),
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

/** إشعارات العميل. (تُعطَّل في العرض الإداري كي لا تُخلط بإشعارات الأدمن) */
export function useClientNotifications(enabled = true) {
  return useQuery({ queryKey: ['client-notifications'], queryFn: () => clientPortalApi.notifications(), enabled });
}

/** تحديث بيانات العميل (الإعدادات). */
export function useUpdateClientProfile() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: ClientProfilePayload) => clientPortalApi.updateProfile(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client-portal'] }),
  });
}

/** رفع/تغيير الصورة الشخصية (اجتماع 2026-08-03، بند 10). */
export function useUploadAvatar() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => clientPortalApi.uploadAvatar(file),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client-portal'] }),
  });
}

/** حذف الصورة الشخصية. */
export function useDeleteAvatar() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => clientPortalApi.deleteAvatar(),
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

/** برنامج الولاء — كود الإحالة + الإحصاءات + السجل. (يُعطَّل في العرض الإداري) */
export function useLoyalty(enabled = true) {
  return useQuery({ queryKey: ['client-loyalty'], queryFn: () => clientPortalApi.loyalty(), enabled });
}

/** تسجيل مشاركة كود الإحالة (عدّاد حقيقي). */
export function useRecordReferralShare() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => clientPortalApi.recordShare(),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client-loyalty'] }),
  });
}

/** استبدال نقاط برصيد خصم (قسيمة). */
export function useRedeemLoyalty() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (points: number) => clientPortalApi.redeemLoyalty(points),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client-loyalty'] }),
  });
}

/** تطبيق قسيمة خصم على فاتورة. */
export function useApplyLoyaltyCredit() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ voucher, invoiceId }: { voucher: string; invoiceId: number }) =>
      clientPortalApi.applyLoyaltyCredit(voucher, invoiceId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client-loyalty'] });
      qc.invalidateQueries({ queryKey: ['client-portal'] });
    },
  });
}

/** خيوط محادثات العميل (فريق + دعم فني + مخصّصة) — بند 8. */
export function useChatThreads() {
  return useQuery({ queryKey: ['client-chat-threads'], queryFn: () => clientPortalApi.chatThreads(), refetchInterval: 20000 });
}

/** رسائل خيط محدّد (تحديث دوري لالتقاط ردود الطاقم). */
export function useThreadMessages(threadId: number | null) {
  return useQuery({
    queryKey: ['client-chat-thread', threadId],
    queryFn: () => clientPortalApi.threadMessages(threadId as number),
    enabled: threadId !== null,
    refetchInterval: 15000,
  });
}

/** إرسال رسالة في خيط. */
export function useSendThreadMessage(threadId: number) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (body: string) => clientPortalApi.sendThreadMessage(threadId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['client-chat-thread', threadId] });
      qc.invalidateQueries({ queryKey: ['client-chat-threads'] });
    },
  });
}

/** إنشاء محادثة جديدة. */
export function useCreateChatThread() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (title: string) => clientPortalApi.createChatThread(title),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client-chat-threads'] }),
  });
}

/** إعادة تسمية محادثة (زر ✏️). */
export function useRenameChatThread() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, title }: { id: number; title: string }) => clientPortalApi.renameChatThread(id, title),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client-chat-threads'] }),
  });
}

/** إضافة مشارك للمحادثة. */
export function useAddThreadParticipant() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name, role }: { id: number; name: string; role: string }) => clientPortalApi.addThreadParticipant(id, name, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client-chat-threads'] }),
  });
}

/** إزالة مشارك من المحادثة. */
export function useRemoveThreadParticipant() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, participantId }: { id: number; participantId: number }) => clientPortalApi.removeThreadParticipant(id, participantId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client-chat-threads'] }),
  });
}

/** المنتدى — مواضيع العميل وردود الطاقم. */
export function useForumThreads() {
  return useQuery({ queryKey: ['client-forum'], queryFn: () => clientPortalApi.forum() });
}

/** نشر سؤال جديد في المنتدى. */
export function useCreateForumThread() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ title, body }: { title: string; body: string }) => clientPortalApi.createThread(title, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client-forum'] }),
  });
}

/** أعضاء فريق شركة العميل. */
export function useTeamMembers() {
  return useQuery({ queryKey: ['client-team'], queryFn: () => clientPortalApi.team() });
}

/** إضافة عضو للفريق. */
export function useAddTeamMember() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ name, role }: { name: string; role: string }) => clientPortalApi.addTeamMember(name, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client-team'] }),
  });
}

/** إزالة عضو من الفريق. */
export function useRemoveTeamMember() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => clientPortalApi.removeTeamMember(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['client-team'] }),
  });
}

/** تفاصيل مشروع للعميل (CLIENT-4): مراحله وتقدّمه ودفعاته. asContact للعرض الإداري. */
export function useClientProject(id: number, asContact?: number) {
  return useQuery({
    queryKey: ['client-portal-project', id, asContact ?? null],
    queryFn: () => clientPortalApi.project(id, asContact),
    enabled: Number.isFinite(id) && id > 0,
  });
}
