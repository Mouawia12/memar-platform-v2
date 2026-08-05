export type CompanyType = 'client' | 'supplier' | 'gov' | 'partner';

export interface Company {
  id: number;
  name: string;
  type: CompanyType;
  industry: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  internal_rating: number | null;
  internal_notes: string | null;
  created_at: string | null;
}

export interface CompanyFormData {
  name: string;
  type: CompanyType;
  industry: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  internal_rating: number;
  internal_notes: string;
}

export const COMPANY_TYPE_LABELS: Record<CompanyType, string> = {
  client: 'عميل',
  supplier: 'مورّد',
  gov: 'جهة حكومية',
  partner: 'شريك',
};
