import { useMutation, useQueryClient } from '@tanstack/react-query';

import { projectsApi } from '../api/projectsApi';

/** تغيير حالة المشروع مع سبب يُسجَّل في التايم‌لاين (PROJ-5). */
export function useChangeStatus(projectId: number) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ status, reason }: { status: string; reason: string }) => projectsApi.changeStatus(projectId, status, reason),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-overview', projectId] });
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
