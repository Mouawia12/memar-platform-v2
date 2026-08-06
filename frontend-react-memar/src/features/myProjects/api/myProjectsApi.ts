import { apiDelete, apiGet, apiPost } from '../../../lib/api';

/** بطاقة مشروع مُسنَد (صفحة «مشاريعي» ونظرة الأدمن). */
export interface MyProjectCard {
  id: number;
  code: string | null;
  name: string;
  status: string;
  client: string | null;
  manager?: string | null;
  role_on_project: string | null;
  progress: number;
  stages_done?: number;
  stages_total?: number;
  current_stage: string | null;
  has_new: boolean;
  last_activity_at: string | null;
  last_seen_at: string | null;
  assigned_at?: string | null;
}

export interface ProjectMemberRow {
  id: number;
  name: string;
  avatar_url: string | null;
  role_on_project: string | null;
  assigned_at: string | null;
  last_seen_at: string | null;
}

export interface AssignableStaff { id: number; name: string }

export interface TeamStaffRow {
  id: number;
  name: string;
  avatar_url: string | null;
  role: string | null;
  projects_count: number;
  new_count: number;
  last_seen_at: string | null;
}

export interface TeamOverview {
  team: TeamStaffRow[];
  totals: { staff: number; assignments: number; with_new: number };
}

export const myProjectsApi = {
  mine: () => apiGet<{ projects: MyProjectCard[]; new_count: number }>('/my/projects'),
  markSeen: (projectId: number) => apiPost<null>(`/projects/${projectId}/seen`, {}),
  // إسناد الموظفين (الأدمن)
  members: (projectId: number) => apiGet<ProjectMemberRow[]>(`/projects/${projectId}/members`),
  assignable: (projectId: number) => apiGet<AssignableStaff[]>(`/projects/${projectId}/assignable-members`),
  assign: (projectId: number, user_id: number, role_on_project?: string | null) =>
    apiPost<null>(`/projects/${projectId}/members`, { user_id, role_on_project: role_on_project || null }),
  unassign: (projectId: number, userId: number) => apiDelete<null>(`/projects/${projectId}/members/${userId}`),
  // نظرة الأدمن على مشاريع الفريق
  team: () => apiGet<TeamOverview>('/team/projects'),
  teamMember: (userId: number) => apiGet<{ user: { id: number; name: string; avatar_url: string | null }; projects: MyProjectCard[] }>(`/team/projects/${userId}`),
};
