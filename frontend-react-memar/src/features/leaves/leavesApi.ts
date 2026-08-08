import { apiGet, apiPost } from '../../lib/api';

export interface LeaveBalance {
  annual_entitlement: number;
  annual_used: number;
  annual_remaining: number;
  sick_entitlement: number;
  sick_used: number;
  sick_remaining: number;
}

export interface LeaveRow {
  id: number;
  type: string;
  type_label: string;
  from_date: string | null;
  to_date: string | null;
  days: number;
  reason: string | null;
  status: 'pending' | 'approved' | 'rejected';
  status_label: string;
}

/** إجازات الموظف — خدمة ذاتية. */
export const leavesApi = {
  mine: () => apiGet<LeaveRow[]>('/leaves/mine'),
  balance: () => apiGet<LeaveBalance>('/leaves/balance'),
  create: (payload: { type: string; from_date: string; to_date: string; reason?: string }) =>
    apiPost<{ id: number; days: number }>('/leaves', payload),
};
