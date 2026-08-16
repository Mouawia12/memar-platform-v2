import { apiGet, apiPost } from '../../../lib/api';

export interface LoyaltyDashboard {
  leads: { total: number; active: number; urgent: number; vip: number; won: number; lost: number; due_today: number; overdue: number };
  points: { earned_pending: number; available_total: number; redeemed_total: number };
  financial: { discounts_given_kwd: number; referral_project_value_kwd: number; pending_redemption_kwd: number; rewards_paid_kwd: number };
  ranking: { user_id: number; name: string; lifetime: number; available: number; referrals: number; contracts: number }[];
  approvals: {
    earned: { id: number; user: string | null; points: number; description: string | null; created_at: string | null }[];
    redemptions: { id: number; user: string | null; points: number; amount_kwd: string; created_at: string | null }[];
  };
}

export const loyaltyAdminApi = {
  dashboard: () => apiGet<LoyaltyDashboard>('/loyalty/dashboard'),
  approveTx: (id: number) => apiPost<unknown>(`/loyalty/transactions/${id}/approve`, {}),
  cancelTx: (id: number) => apiPost<unknown>(`/loyalty/transactions/${id}/cancel`, {}),
  approveRedemption: (id: number) => apiPost<unknown>(`/loyalty/redemptions/${id}/approve`, {}),
  rejectRedemption: (id: number, reason?: string) => apiPost<unknown>(`/loyalty/redemptions/${id}/reject`, { reason }),
};
