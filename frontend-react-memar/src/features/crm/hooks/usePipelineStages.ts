import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { stagesApi, type StagePayload } from '../api/stagesApi';
import type { PipelineStage } from '../types';

const KEY = ['pipeline-stages'];

/** مراحل اللوحة مرتّبة حسب position. */
export function usePipelineStages() {
  return useQuery({
    queryKey: KEY,
    queryFn: stagesApi.list,
    staleTime: 60_000,
  });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: KEY });
}

export function useCreateStage() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (p: StagePayload) => stagesApi.create(p), onSuccess: invalidate });
}

export function useUpdateStage() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: ({ id, ...p }: { id: number } & StagePayload) => stagesApi.update(id, p), onSuccess: invalidate });
}

export function useDeleteStage() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (id: number) => stagesApi.remove(id), onSuccess: invalidate });
}

export function useReorderStages() {
  const invalidate = useInvalidate();
  return useMutation({ mutationFn: (ids: number[]) => stagesApi.reorder(ids), onSuccess: invalidate });
}

/** خريطة مفتاح المرحلة → بياناتها، مع احتياطي للمفاتيح المحذوفة. */
export function stageMap(stages: PipelineStage[] | undefined): Record<string, PipelineStage> {
  const map: Record<string, PipelineStage> = {};
  (stages ?? []).forEach((s) => { map[s.key] = s; });
  return map;
}
