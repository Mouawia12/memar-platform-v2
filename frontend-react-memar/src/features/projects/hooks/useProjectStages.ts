import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { projectsApi } from '../api/projectsApi';

/** يبطل نظرة المشروع (مؤشرات + مراحل + تايم‌لاين) بعد أي تغيير على المراحل. */
function useInvalidateOverview(projectId: number) {
  const qc = useQueryClient();

  return () => {
    qc.invalidateQueries({ queryKey: ['project-overview', projectId] });
    qc.invalidateQueries({ queryKey: ['project-stage'] });
  };
}

/** تفاصيل مرحلة واحدة مع سجل محادثتها — يُفعّل عند فتح المرحلة. */
export function useStageDetail(projectId: number, stageId: number | null) {
  return useQuery({
    queryKey: ['project-stage', projectId, stageId],
    queryFn: () => projectsApi.stage(projectId, stageId as number),
    enabled: !!stageId && Number.isFinite(projectId) && projectId > 0,
  });
}

export function useSeedStages(projectId: number) {
  const invalidate = useInvalidateOverview(projectId);

  return useMutation({
    mutationFn: () => projectsApi.seedStages(projectId),
    onSuccess: invalidate,
  });
}

export function useAddStage(projectId: number) {
  const invalidate = useInvalidateOverview(projectId);

  return useMutation({
    mutationFn: (payload: { name: string; expected_days?: number | null; after_stage_id?: number | null }) => projectsApi.addStage(projectId, payload),
    onSuccess: invalidate,
  });
}

export function useAdvanceStage(projectId: number) {
  const invalidate = useInvalidateOverview(projectId);

  return useMutation({
    mutationFn: (stageId: number) => projectsApi.advanceStage(projectId, stageId),
    onSuccess: invalidate,
  });
}

/** بدء مرحلة منتظرة (تصبح «جارية») — لحلّ حالة عدم وجود مرحلة جارية. */
export function useActivateStage(projectId: number) {
  const invalidate = useInvalidateOverview(projectId);

  return useMutation({
    mutationFn: (stageId: number) => projectsApi.activateStage(projectId, stageId),
    onSuccess: invalidate,
  });
}

export function useRemoveStage(projectId: number) {
  const invalidate = useInvalidateOverview(projectId);

  return useMutation({
    mutationFn: (stageId: number) => projectsApi.removeStage(projectId, stageId),
    onSuccess: invalidate,
  });
}

export function useAddStageComment(projectId: number) {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ stageId, body }: { stageId: number; body: string }) => projectsApi.addStageComment(projectId, stageId, body),
    onSuccess: (_data, { stageId }) => {
      qc.invalidateQueries({ queryKey: ['project-stage', projectId, stageId] });
      qc.invalidateQueries({ queryKey: ['project-overview', projectId] });
    },
  });
}
