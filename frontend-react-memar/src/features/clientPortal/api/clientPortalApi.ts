import { apiGet, apiPost } from '../../../lib/api';
import type { Appointment } from '../../appointments/types';
import type { Contract } from '../../contracts/types';
import type { GeneratedDocument } from '../../documents/types';
import type { Invoice } from '../../invoices/types';
import type { Project, ProjectStage, ProjectStatus } from '../../projects/types';

export interface ClientStats {
  projects: number;
  active_projects: number;
  invoices: number;
  total_due: number;
  contracts: number;
}

export interface ClientPortalData {
  linked: boolean;
  client: { id: number; name: string | null } | null;
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

export const clientPortalApi = {
  get: () => apiGet<ClientPortalData>('/client-portal'),
  project: (id: number) => apiGet<ClientProjectDetail>(`/client-portal/projects/${id}`),
  submitRequest: (type: ClientRequestType, note?: string) => apiPost<{ id: number }>('/client-portal/requests', { type, note }),
};
