import { apiDelete, apiGet, apiPatch, apiPost } from '../../../lib/api';
import type { PipelineStage } from '../types';

export interface StagePayload {
  label?: string;
  color?: string;
}

/** مراحل مسار الفرص (أعمدة اللوحة) — CRUD + إعادة ترتيب. */
export const stagesApi = {
  list: () => apiGet<PipelineStage[]>('/pipeline-stages'),
  create: (payload: StagePayload) => apiPost<PipelineStage>('/pipeline-stages', payload),
  update: (id: number, payload: StagePayload) => apiPatch<PipelineStage>(`/pipeline-stages/${id}`, payload),
  remove: (id: number) => apiDelete<null>(`/pipeline-stages/${id}`),
  reorder: (ids: number[]) => apiPatch<PipelineStage[]>('/pipeline-stages/reorder', { ids }),
};
