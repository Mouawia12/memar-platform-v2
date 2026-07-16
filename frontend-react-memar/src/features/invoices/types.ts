export type InvoiceStatus = 'draft' | 'sent' | 'partial' | 'paid' | 'cancelled';
export type PaymentMethod = 'cash' | 'knet' | 'transfer' | 'cheque';

export interface Payment {
  id: number;
  amount_kwd: string;
  method: PaymentMethod;
  reference: string | null;
  paid_at: string | null;
  created_at: string | null;
}

export interface Invoice {
  id: number;
  number: string | null;
  subtotal_kwd: string;
  tax_kwd: string;
  total_kwd: string;
  paid_kwd: string;
  balance_kwd: string;
  status: InvoiceStatus;
  issue_date: string | null;
  due_date: string | null;
  is_overdue: boolean;
  notes: string | null;
  client: { id: number; name: string } | null;
  project: { id: number; name: string } | null;
  payments?: Payment[];
  created_at: string | null;
}

export interface InvoiceFormData {
  client_id: number | '';
  project_id: number | '';
  subtotal_kwd: string;
  tax_kwd: string;
  status: InvoiceStatus;
  issue_date: string;
  due_date: string;
  notes: string;
}

export interface PaymentFormData {
  amount_kwd: string;
  method: PaymentMethod;
  reference: string;
  paid_at: string;
}

export const STATUS_LABELS: Record<InvoiceStatus, string> = {
  draft: 'مسودة',
  sent: 'مُرسلة',
  partial: 'مدفوعة جزئيًا',
  paid: 'مدفوعة',
  cancelled: 'ملغاة',
};

export const STATUS_COLORS: Record<InvoiceStatus, string> = {
  draft: '#6B7280',
  sent: '#274A78',
  partial: '#D97706',
  paid: '#059669',
  cancelled: '#DC2626',
};

export const METHOD_LABELS: Record<PaymentMethod, string> = {
  cash: 'نقدًا',
  knet: 'كي نت',
  transfer: 'تحويل',
  cheque: 'شيك',
};
