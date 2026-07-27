export type Stage = 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';
export type ContactType = 'lead' | 'client' | 'contact';
export type Temperature = 'hot' | 'warm' | 'cold' | 'normal';

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
  temperature: Temperature;
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
  temperature: Temperature;
  deal_value_kwd: string;
  notes: string;
}

// حرارة الفرصة (طبق أصل PRIORITY_OPTS) — ساخنة/دافئة/باردة/عادية
export const TEMPERATURE_ORDER: Temperature[] = ['hot', 'warm', 'cold', 'normal'];

export const TEMPERATURE_META: Record<Temperature, { label: string; icon: string; color: string }> = {
  hot: { label: 'ساخنة', icon: '🔥', color: '#DC2626' },
  warm: { label: 'دافئة', icon: '🌤', color: '#D97706' },
  cold: { label: 'باردة', icon: '❄️', color: '#0891B2' },
  normal: { label: 'عادية', icon: '⚪', color: '#6B7280' },
};

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
