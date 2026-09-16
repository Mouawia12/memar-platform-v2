import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { myProjectsApi } from '../api/myProjectsApi';

/** مشاريع الموظف الحالي («مشاريعي») + عدّاد الجديد. */
export function useMyProjects() {
  return useQuery({ queryKey: ['my-projects'], queryFn: myProjectsApi.mine });
}

/** نظرة الأدمن على مشاريع الفريق. */
export function useTeamProjects() {
  return useQuery({ queryKey: ['team-projects'], queryFn: myProjectsApi.team });
}

/** مشاريع موظف بعينه (توسّع الأدمن). */
export function useTeamMemberProjects(userId: number | null) {
  return useQuery({
    queryKey: ['team-member-projects', userId],
    queryFn: () => myProjectsApi.teamMember(userId as number),
    enabled: !!userId,
  });
}

/** الأعضاء المُسنَدون لمشروع. */
export function useProjectMembers(projectId: number) {
  return useQuery({
    queryKey: ['project-members', projectId],
    queryFn: () => myProjectsApi.members(projectId),
    enabled: Number.isFinite(projectId) && projectId > 0,
  });
}

/** الموظفون القابلون للإسناد (غير مُسنَدين بعد). */
export function useAssignableMembers(projectId: number, enabled: boolean) {
  return useQuery({
    queryKey: ['assignable-members', projectId],
    queryFn: () => myProjectsApi.assignable(projectId),
    enabled: enabled && Number.isFinite(projectId) && projectId > 0,
  });
}

export function useAssignMember(projectId: number) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (p: { userId: number; role?: string | null }) => myProjectsApi.assign(projectId, p.userId, p.role),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-members', projectId] });
      qc.invalidateQueries({ queryKey: ['assignable-members', projectId] });
      qc.invalidateQueries({ queryKey: ['team-projects'] });
    },
  });
}

export function useUnassignMember(projectId: number) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (userId: number) => myProjectsApi.unassign(projectId, userId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-members', projectId] });
      qc.invalidateQueries({ queryKey: ['assignable-members', projectId] });
      qc.invalidateQueries({ queryKey: ['team-projects'] });
    },
  });
}
