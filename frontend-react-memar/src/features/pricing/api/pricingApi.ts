import { apiDelete, apiGet, apiPost, apiPut } from '../../../lib/api';
import type { AiEstimate, CalcResult, CostResult, PricingOptions, ServicePackage } from '../types';

export interface PackagePayload {
  name: string;
  icon: string | null;
  description: string | null;
  price_kwd: number;
  reference_area_sqm: number;
  is_featured: boolean;
  service_ids: number[];
}

export const pricingApi = {
  options: () => apiGet<PricingOptions>('/pricing/options'),
  calculate: (payload: Record<string, unknown>) => apiPost<CalcResult>('/pricing/calculate', payload),
  costBased: (payload: Record<string, unknown>) => apiPost<CostResult>('/pricing/cost-based', payload),
  aiEstimate: (payload: Record<string, unknown>) => apiPost<AiEstimate>('/pricing/ai-estimate', payload),

  packages: () => apiGet<ServicePackage[]>('/pricing/packages'),
  createPackage: (payload: PackagePayload) => apiPost<ServicePackage[]>('/pricing/packages', payload),
  updatePackage: (id: number, payload: PackagePayload) => apiPut<ServicePackage[]>(`/pricing/packages/${id}`, payload),
  deletePackage: (id: number) => apiDelete<ServicePackage[]>(`/pricing/packages/${id}`),
};
