import { apiDelete, apiGet, apiPatch, apiPost } from '../../../lib/api';
import type { Followup, FollowupStats } from '../types';

export interface FollowupsQuery { search?: string; assigned_to?: number }

export const followupsApi = {
  list: (params: FollowupsQuery) => apiGet<Followup[]>('/followups', { params }),
  stats: (params: FollowupsQuery) => apiGet<FollowupStats>('/followups/stats', { params }),
  create: (payload: Record<string, unknown>) => apiPost<Followup>('/followups', payload),
  update: (id: number, payload: Record<string, unknown>) => apiPatch<Followup>(`/followups/${id}`, payload),
  remove: (id: number) => apiDelete<null>(`/followups/${id}`),
};
