export type Stage = 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';
export type ContactType = 'lead' | 'client' | 'contact';

export interface Lead {
  id: number;
  full_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  position: string | null;
  type: ContactType;
  status: string;
  stage: Stage;
  deal_value_kwd: string;
  notes: string | null;
  owner: { id: number; name: string } | null;
  created_at: string | null;
}

export interface LeadFormData {
  full_name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  type: ContactType;
  stage: Stage;
  deal_value_kwd: string;
  notes: string;
}

export const STAGE_ORDER: Stage[] = ['new', 'contacted', 'qualified', 'proposal', 'won', 'lost'];

export const STAGE_LABELS: Record<Stage, string> = {
  new: 'عميل محتمل',
  contacted: 'تم التواصل',
  qualified: 'مؤهّل',
  proposal: 'عرض سعر',
  won: 'صفقة رابحة',
  lost: 'خسارة',
};

export const STAGE_COLORS: Record<Stage, string> = {
  new: '#6B7280',
  contacted: '#0891B2',
  qualified: '#274A78',
  proposal: '#D97706',
  won: '#059669',
  lost: '#DC2626',
};
