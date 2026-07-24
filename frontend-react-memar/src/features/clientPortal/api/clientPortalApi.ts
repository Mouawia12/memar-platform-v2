import { apiGet } from '../../../lib/api';
import type { Appointment } from '../../appointments/types';
import type { Contract } from '../../contracts/types';
import type { GeneratedDocument } from '../../documents/types';
import type { Invoice } from '../../invoices/types';
import type { Project } from '../../projects/types';

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

export const clientPortalApi = {
  get: () => apiGet<ClientPortalData>('/client-portal'),
};
