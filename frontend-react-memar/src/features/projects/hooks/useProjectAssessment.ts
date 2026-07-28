import { useMutation, useQueryClient } from '@tanstack/react-query';

import { projectsApi } from '../api/projectsApi';
import type { AssessmentPayload } from '../types';

/** حفظ تقييم المشروع/العميل + VIP + الملاحظات الداخلية (PROJ-4). */
export function useSaveAssessment(projectId: number) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: AssessmentPayload) => projectsApi.saveAssessment(projectId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['project-overview', projectId] });
      qc.invalidateQueries({ queryKey: ['projects'] });
    },
  });
}
