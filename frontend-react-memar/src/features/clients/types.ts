export type ContactType = 'lead' | 'client' | 'contact';

/** نوع العميل: فرد أو شركة (طلب أيمن 2026-08-14). */
export type ClientKind = 'individual' | 'company';

export const CLIENT_KIND_LABELS: Record<ClientKind, string> = {
  individual: 'فرد',
  company: 'شركة',
};

export interface Contact {
  id: number;
  full_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  position: string | null;
  type: ContactType;
  client_kind: ClientKind;
  status: string | null;
  notes: string | null;
  owner: { id: number; name: string } | null;
  created_at: string | null;

  // ── أعمدة سجل العملاء (طلب أيمن 2026-09-09) ──
  /** عميل مميّز — شارة VIP في عمود الحالة. */
  is_vip?: boolean;
  /** تقييم داخلي 1–5 — نجومٌ تحت الاسم. */
  internal_rating?: number | null;
  /** عدد مشاريعه. */
  projects_count?: number;
  /** عدد الفرص المنسوبة إليه — يربط السجل بلوحة «عميل جديد». */
  opportunities_count?: number;
  /** إجمالي عقوده — لا يصل إلا من يملك clients.finance.view. */
  contracts_total_kwd?: string;
  /** له عقد موقّع/نشط/منتهٍ — شارة «متعاقد» (المسودة التلقائية لا تُحتسب). */
  has_signed_contract?: boolean;
  /** تاريخ آخر تواصل (آخر تحديث مسجَّل على العميل). */
  last_contact_at?: string | null;
}

export interface ContactFormData {
  full_name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  type: ContactType;
  notes: string;
  /** تقييم داخليّ 1–5 (0 = بلا تقييم) — يظهر نجومًا تحت اسم العميل في السجل. */
  internal_rating: number;
}

export const CONTACT_TYPE_LABELS: Record<ContactType, string> = {
  lead: 'عميل محتمل',
  client: 'عميل',
  contact: 'جهة اتصال',
};
