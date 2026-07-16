export type ContactType = 'lead' | 'client' | 'contact';

export interface Contact {
  id: number;
  full_name: string;
  email: string | null;
  phone: string | null;
  company: string | null;
  position: string | null;
  type: ContactType;
  status: string | null;
  notes: string | null;
  owner: { id: number; name: string } | null;
  created_at: string | null;
}

export interface ContactFormData {
  full_name: string;
  email: string;
  phone: string;
  company: string;
  position: string;
  type: ContactType;
  notes: string;
}

export const CONTACT_TYPE_LABELS: Record<ContactType, string> = {
  lead: 'عميل محتمل',
  client: 'عميل',
  contact: 'جهة اتصال',
};
