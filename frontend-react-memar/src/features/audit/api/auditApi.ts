import { apiGet, apiGetPaginated } from '../../../lib/api';
import type { Activity, AuditFilterOptions } from '../types';

export interface AuditQuery {
  event?: string;
  subject_type?: string;
  causer_id?: number;
  from?: string;
  to?: string;
  page?: number;
  per_page?: number;
}

export const auditApi = {
  list: (params: AuditQuery) => apiGetPaginated<Activity>('/activity-log', { params }),
  filters: () => apiGet<AuditFilterOptions>('/activity-log/filters'),
};
