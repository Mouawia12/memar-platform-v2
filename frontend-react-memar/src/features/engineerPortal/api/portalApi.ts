import { apiGet } from '../../../lib/api';
import type { Appointment } from '../../appointments/types';
import type { FieldVisit } from '../../fieldVisits/types';
import type { Project } from '../../projects/types';
import type { Task } from '../../tasks/types';

export interface PortalStats {
  open_tasks: number;
  overdue_tasks: number;
  today_visits: number;
  upcoming_visits: number;
  my_projects: number;
}

export interface PortalData {
  stats: PortalStats;
  tasks: Task[];
  visits: FieldVisit[];
  projects: Project[];
  appointments: Appointment[];
}

export const portalApi = {
  get: () => apiGet<PortalData>('/engineer-portal'),
};
