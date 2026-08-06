import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost } from '../../../lib/api';
import type { Company, CompanyType } from '../types';

export interface CompaniesQuery {
  search?: string;
  type?: string;
  page?: number;
  per_page?: number;
}

export interface CompanyMember {
  id: number;
  name: string;
  position: string | null;
  kunya: string | null;
  account_number: string | null;
  project_count: number;
  is_top: boolean;
}

export interface CompanyProjectRow {
  id: number;
  code: string | null;
  name: string;
  status: string;
  progress: number;
  manager: string | null;
}

export interface CompanyOverview {
  company: {
    id: number;
    name: string;
    type: CompanyType;
    industry: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
    since: string | null;
    internal_rating: number | null;
    internal_notes: string | null;
  };
  stats: { members: number; projects: number; active: number; done: number };
  members: CompanyMember[];
  projects: CompanyProjectRow[];
}

export const companiesApi = {
  list: (params: CompaniesQuery) => apiGetPaginated<Company>('/companies', { params }),
  overview: (id: number) => apiGet<CompanyOverview>(`/companies/${id}/overview`),
  create: (payload: Record<string, unknown>) => apiPost<Company>('/companies', payload),
  update: (id: number, payload: Record<string, unknown>) => apiPatch<Company>(`/companies/${id}`, payload),
  remove: (id: number) => apiDelete<null>(`/companies/${id}`),
};
