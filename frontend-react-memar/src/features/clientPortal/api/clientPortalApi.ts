import { apiGet, apiPatch, apiPost } from '../../../lib/api';
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
  phone: string | null;
  since: string | null;
  notification_prefs: NotificationPrefs;
}

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
    status: ProjectStatus;
    start_date: string | null;
    end_date: string | null;
    manager: string | null;
    stage_progress: number;
  };
  stages: ProjectStage[];
  payments: {
    invoiced_kwd: number;
    paid_kwd: number;
    remaining_kwd: number;
    invoices: Invoice[];
  };
}

export type ClientRequestType = 'project' | 'meeting' | 'inquiry';

export interface ClientRequestItem {
  id: number;
  title: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  status_label: string;
  description: string | null;
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
  stats: { successful: number; gifts_sent: number; shares: number; discount: number };
  history: { id: number; name: string | null; status: 'pending' | 'joined' | 'contracted'; status_label: string; is_gift: boolean }[];
}

export interface ClientMessage {
  id: number;
  from_staff: boolean;
  body: string;
  at: string | null;
}

export const clientPortalApi = {
  get: () => apiGet<ClientPortalData>('/client-portal'),
  loyalty: () => apiGet<LoyaltyData>('/client-portal/loyalty'),
  recordShare: () => apiPost<{ code: string; shares: number }>('/client-portal/loyalty/share', {}),
  messages: () => apiGet<ClientMessage[]>('/client-portal/messages'),
  sendMessage: (body: string) => apiPost<ClientMessage>('/client-portal/messages', { body }),
  project: (id: number) => apiGet<ClientProjectDetail>(`/client-portal/projects/${id}`),
  submitRequest: (type: ClientRequestType, note?: string) => apiPost<{ id: number }>('/client-portal/requests', { type, note }),
  myRequests: () => apiGet<ClientRequestItem[]>('/client-portal/requests'),
  notifications: () => apiGet<{ count: number; items: ClientNotification[] }>('/client-portal/notifications'),
  updateProfile: (payload: ClientProfilePayload) => apiPatch<{ id: number; name: string; phone: string | null; company: string | null }>('/client-portal/profile', payload),
  updatePreferences: (prefs: NotificationPrefs) => apiPatch<NotificationPrefs>('/client-portal/preferences', prefs),
};
