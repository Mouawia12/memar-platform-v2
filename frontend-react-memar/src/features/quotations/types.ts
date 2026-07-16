export type QuotationStatus = 'draft' | 'sent' | 'accepted' | 'rejected';

export interface QuotationItem {
  id?: number;
  service_id: number | null;
  description: string;
  qty: string;
  unit_price_kwd: string;
  total_kwd?: string;
}

export interface Quotation {
  id: number;
  number: string | null;
  status: QuotationStatus;
  subtotal_kwd: string;
  discount_kwd: string;
  total_kwd: string;
  valid_until: string | null;
  notes: string | null;
  client: { id: number; name: string } | null;
  project: { id: number; name: string } | null;
  items?: QuotationItem[];
  created_at: string | null;
}

export interface QuotationItemInput {
  service_id: number | '';
  description: string;
  qty: string;
  unit_price_kwd: string;
}

export interface QuotationFormData {
  client_id: number | '';
  project_id: number | '';
  status: QuotationStatus;
  discount_kwd: string;
  valid_until: string;
  notes: string;
  items: QuotationItemInput[];
}

export const STATUS_LABELS: Record<QuotationStatus, string> = {
  draft: 'مسودة',
  sent: 'مُرسل',
  accepted: 'مقبول',
  rejected: 'مرفوض',
};

export const STATUS_COLORS: Record<QuotationStatus, string> = {
  draft: '#6B7280',
  sent: '#274A78',
  accepted: '#059669',
  rejected: '#DC2626',
};
