import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { projectsApi, type TemplatePayload } from '../api/projectsApi';

/** يبطل نظرة المشروع (مؤشرات + مراحل + تايم‌لاين) بعد أي تغيير على المراحل. */
function useInvalidateOverview(projectId: number) {
  const qc = useQueryClient();

  return () => {
    qc.invalidateQueries({ queryKey: ['project-overview', projectId] });
    qc.invalidateQueries({ queryKey: ['project-stage'] });
    qc.invalidateQueries({ queryKey: ['stage-pipeline'] }); // بطاقة «مراحل المشاريع»
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

/** توزيع المشاريع على المراحل العامّة — يُنعَش مع أي تغيير على المراحل. */
export function useStagePipeline() {
  return useQuery({ queryKey: ['stage-pipeline'], queryFn: () => projectsApi.stagePipeline() });
}

/** قوالب المراحل — ثابتة في الخادم فتُخزَّن طويلًا. */
export function useStageTemplates() {
  return useQuery({
    queryKey: ['stage-templates'],
    queryFn: () => projectsApi.stageTemplates(),
    staleTime: 10 * 60_000,
  });
}

/**
 * إدارة القوالب (طلب أيمن 2026-09-09) — كل عملية تُرجع الكتالوج بعدها،
 * فنكتبه في الذاكرة مباشرةً بلا جولة ثانية إلى الخادم.
 */
/** تعديل مرحلة داخل مشروع: اسمها وأيامها وتصنيفها (طلب أيمن 2026-09-09). */
export function useUpdateStage(projectId: number) {
  const invalidate = useInvalidateOverview(projectId);

  return useMutation({
    mutationFn: ({ stageId, ...payload }: { stageId: number; name?: string; expected_days?: number | null; phase?: string | null }) =>
      projectsApi.updateStage(projectId, stageId, payload),
    onSuccess: invalidate,
  });
}

export function useSaveTemplate() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...payload }: TemplatePayload & { id?: number }) =>
      (id ? projectsApi.updateTemplate(id, payload) : projectsApi.createTemplate(payload)),
    onSuccess: (res) => qc.setQueryData(['stage-templates'], res.templates),
  });
}

export function useDeleteTemplate() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => projectsApi.deleteTemplate(id),
    onSuccess: (res) => qc.setQueryData(['stage-templates'], res.templates),
  });
}

export function useSeedStages(projectId: number) {
  const invalidate = useInvalidateOverview(projectId);

  return useMutation({
    mutationFn: (payload: { template?: string } = {}) => projectsApi.seedStages(projectId, payload),
    onSuccess: invalidate,
  });
}

export function useAddStage(projectId: number) {
  const invalidate = useInvalidateOverview(projectId);

  return useMutation({
    mutationFn: (payload: { name: string; expected_days?: number | null; after_stage_id?: number | null; phase?: string | null }) => projectsApi.addStage(projectId, payload),
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
