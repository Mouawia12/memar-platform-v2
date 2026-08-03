import { api, apiDelete, apiGet, apiPatch, apiPost } from '../../../lib/api';
import type { Appointment } from '../../appointments/types';
import type { Contract } from '../../contracts/types';
import type { GeneratedDocument } from '../../documents/types';
import type { Invoice } from '../../invoices/types';
import type { Project, ProjectStage, ProjectStatus } from '../../projects/types';

export interface ClientStats {
  projects: number;
  active_projects: number;
  done_projects: number;
  invoices: number;
  unpaid_invoices: number;
  total_due: number;
  contracts: number;
}

export interface NotificationPrefs {
  email: boolean;
  sms: boolean;
  meetings: boolean;
  invoices: boolean;
}

export interface ClientInfo {
  id: number;
  name: string | null;
  kunya: string | null;
  company: string | null;
  /** المقر الرئيسي للشركة (يظهر في بطاقات صفحة الشركة). */
  head_office?: string | null;
  /** نبذة الشركة (عنوان فرعي في هيرو صفحة الشركة). */
  company_about?: string | null;
  phone: string | null;
  /** المنصب/الصفة داخل الشركة (مثل: مالك الشركة، مدير تنفيذي، مهندس). */
  position?: string | null;
  /** رقم الحساب الشخصي الثابت المخزَّن في الباك اند (MEE-YYYY-NNN) — المصدر الرسمي. */
  account_number?: string | null;
  since: string | null;
  /** رابط الصورة الشخصية إن رفعها العميل. */
  avatar_url?: string | null;
  notification_prefs: NotificationPrefs;
}

/**
 * كود العضوية/الحساب الشخصي — الصيغة التي طلبها العميل: MEE (اختصار معمار) + سنة التسجيل + رقم تسلسلي.
 * ثابت لكل عميل (بخلاف كود الخصم المتغيّر). مثال: MEE-24-018.
 */
export const memarMemberCode = (id: number, since?: string | null): string => {
  const m = since ? String(since).match(/\d{4}/) : null;
  const yr = m ? m[0].slice(2) : '25';

  return `MEE-${yr}-${String(id).padStart(3, '0')}`;
};

/**
 * رقم الحساب المعروض للعميل — المصدر الرسمي هو `account_number` المخزَّن في الباك اند؛
 * وإن غاب (بيانات قديمة) نرجع للصيغة المحسوبة. يوحّد العرض في كل الصفحات (اجتماع 2026-08-03).
 */
export const clientAccountCode = (c: { id: number; since?: string | null; account_number?: string | null }): string =>
  c.account_number || memarMemberCode(c.id, c.since);

export interface ClientPortalData {
  linked: boolean;
  client: ClientInfo | null;
  stats: ClientStats | null;
  projects: Project[];
  invoices: Invoice[];
  contracts: Contract[];
  documents: GeneratedDocument[];
  appointments: Appointment[];
}

export interface ClientProjectDetail {
  project: {
    id: number;
    code: string | null;
    name: string;
    description: string | null;
    status: ProjectStatus;
    start_date: string | null;
    end_date: string | null;
    manager: string | null;
    stage_progress: number;
  };
  team: { name: string; role: string; is_lead: boolean }[];
  change_log: { text: string; at: string | null }[];
  stages: ProjectStage[];
  payments: {
    invoiced_kwd: number;
    paid_kwd: number;
    remaining_kwd: number;
    invoices: Invoice[];
  };
}

export type ClientRequestType = 'project' | 'meeting' | 'inquiry' | 'modification';

/** حمولة طلب من بوابة العميل — الحقول التفصيلية تُملأ في «طلب مشروع جديد» أو «طلب جديد». */
export interface ClientRequestPayload {
  type: ClientRequestType;
  note?: string;
  // «طلب مشروع جديد» المفصّل
  project_name?: string;
  project_type?: string;
  location?: string;
  area_sqm?: number | null;
  budget_range?: string;
  start_date?: string;
  services?: string[];
  // «طلب جديد» البسيط (تعديل/إضافة على مشروع قائم)
  project_id?: number;
  request_type?: string;
  title?: string;
}

export interface ClientRequestAttachment {
  id: number;
  original_name: string;
  size: number;
}

export interface ClientRequestItem {
  id: number;
  title: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  status_label: string;
  description: string | null;
  attachments?: ClientRequestAttachment[];
  created_at: string | null;
}

export interface ClientNotification {
  icon: string;
  kind: 'info' | 'warning';
  title: string;
  text: string;
  at: string | null;
}

export interface ClientProfilePayload {
  full_name?: string;
  kunya?: string | null;
  phone?: string | null;
  company?: string | null;
}

export interface LoyaltyData {
  code: string;
  /** نوع المُحيل: مهندس/شريك يُحيل عملاء (بند 7) أو عميل يقترح لصديق. */
  referrer_kind?: 'engineer' | 'client';
  stats: { successful: number; gifts_sent: number; shares: number; discount: number };
  history: { id: number; name: string | null; status: 'pending' | 'joined' | 'contracted'; status_label: string; is_gift: boolean }[];
}

export interface ClientMessage {
  id: number;
  from_staff: boolean;
  body: string;
  at: string | null;
}

export interface ChatParticipant {
  id: number;
  name: string;
  role: string | null;
}

export interface ChatThread {
  id: number;
  title: string;
  kind: 'team' | 'support' | 'custom';
  can_rename: boolean;
  unread_count: number;
  last_message: string | null;
  last_at: string | null;
  participants: ChatParticipant[];
}

export interface ForumReply {
  id: number;
  from_staff: boolean;
  author: string | null;
  body: string;
  at: string | null;
}

export interface ForumThread {
  id: number;
  title: string;
  body: string | null;
  status: 'open' | 'answered';
  status_label: string;
  created_at: string | null;
  replies: ForumReply[];
}

export interface TeamMember {
  id: number;
  name: string;
  role: string;
  projects_count?: number | null;
  member_code: string | null;
}

export const clientPortalApi = {
  get: () => apiGet<ClientPortalData>('/client-portal'),
  loyalty: () => apiGet<LoyaltyData>('/client-portal/loyalty'),
  recordShare: () => apiPost<{ code: string; shares: number }>('/client-portal/loyalty/share', {}),
  // محادثات متعددة الخيوط (بند 8)
  chatThreads: () => apiGet<ChatThread[]>('/client-portal/chat/threads'),
  createChatThread: (title: string) => apiPost<{ id: number; title: string; kind: string }>('/client-portal/chat/threads', { title }),
  renameChatThread: (id: number, title: string) => apiPatch<{ id: number; title: string }>(`/client-portal/chat/threads/${id}`, { title }),
  threadMessages: (id: number) => apiGet<ClientMessage[]>(`/client-portal/chat/threads/${id}/messages`),
  sendThreadMessage: (id: number, body: string) => apiPost<ClientMessage>(`/client-portal/chat/threads/${id}/messages`, { body }),
  addThreadParticipant: (id: number, name: string, role: string) => apiPost<ChatParticipant>(`/client-portal/chat/threads/${id}/participants`, { name, role }),
  removeThreadParticipant: (id: number, participantId: number) => apiDelete<null>(`/client-portal/chat/threads/${id}/participants/${participantId}`),
  forum: () => apiGet<ForumThread[]>('/client-portal/forum'),
  createThread: (title: string, body: string) => apiPost<{ id: number }>('/client-portal/forum', { title, body }),
  team: () => apiGet<TeamMember[]>('/client-portal/team'),
  addTeamMember: (name: string, role: string) => apiPost<TeamMember>('/client-portal/team', { name, role }),
  removeTeamMember: (id: number) => apiDelete<{ id: number }>(`/client-portal/team/${id}`),
  project: (id: number) => apiGet<ClientProjectDetail>(`/client-portal/projects/${id}`),
  submitRequest: (payload: ClientRequestPayload) => apiPost<{ id: number }>('/client-portal/requests', payload),
  uploadRequestAttachment: (requestId: number, file: File) => {
    const fd = new FormData();
    fd.append('file', file);

    return api.post(`/client-portal/requests/${requestId}/attachments`, fd).then((r) => r.data.data as ClientRequestAttachment);
  },
  uploadAvatar: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);

    return api.post('/client-portal/profile/avatar', fd).then((r) => r.data.data as { avatar_url: string });
  },
  deleteAvatar: () => apiDelete<null>('/client-portal/profile/avatar'),
  myRequests: () => apiGet<ClientRequestItem[]>('/client-portal/requests'),
  notifications: () => apiGet<{ count: number; items: ClientNotification[] }>('/client-portal/notifications'),
  updateProfile: (payload: ClientProfilePayload) => apiPatch<{ id: number; name: string; phone: string | null; company: string | null }>('/client-portal/profile', payload),
  updatePreferences: (prefs: NotificationPrefs) => apiPatch<NotificationPrefs>('/client-portal/preferences', prefs),
};
