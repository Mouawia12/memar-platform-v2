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

export interface PortalPerformance {
  done_total: number;
  done_this_week: number;
  completion_rate: number;
  on_time_rate: number;
}

export interface TodayItem {
  kind: 'task' | 'visit' | 'appointment';
  id: number;
  title: string;
  time: string | null;
  project: string | null;
  meta: string | null;
  status: string;
}

export interface PortalData {
  performance: PortalPerformance;
  today: TodayItem[];
  stats: PortalStats;
  tasks: Task[];
  visits: FieldVisit[];
  projects: Project[];
  appointments: Appointment[];
  calendar_appointments: Appointment[];
}

/** مساحة عمل موظف بعينه (DASH-2) — نفس بيانات البوابة + معلومات الموظف. */
export interface TeamMemberWorkspace extends PortalData {
  user: { id: number; name: string; email: string | null };
}

export const portalApi = {
  get: () => apiGet<PortalData>('/engineer-portal'),
  teamMember: (userId: number) => apiGet<TeamMemberWorkspace>(`/team/${userId}/workspace`),
};
