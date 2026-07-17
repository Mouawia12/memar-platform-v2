export type ContractStatus = 'draft' | 'signed' | 'active' | 'closed' | 'cancelled';

export interface Contract {
  id: number;
  number: string | null;
  value_kwd: string;
  status: ContractStatus;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  project: { id: number; name: string } | null;
  client: { id: number; name: string } | null;
  quotation: { id: number; number: string | null } | null;
  created_at: string | null;
}

export interface ContractFormData {
  project_id: number | '';
  client_id: number | '';
  quotation_id: number | '';
  value_kwd: string;
  status: ContractStatus;
  start_date: string;
  end_date: string;
  notes: string;
}

export const STATUS_LABELS: Record<ContractStatus, string> = {
  draft: 'مسودة',
  signed: 'موقّع',
  active: 'ساري',
  closed: 'منتهٍ',
  cancelled: 'ملغى',
};

export const STATUS_COLORS: Record<ContractStatus, string> = {
  draft: '#6B7280',
  signed: '#274A78',
  active: '#059669',
  closed: '#0891B2',
  cancelled: '#DC2626',
};
