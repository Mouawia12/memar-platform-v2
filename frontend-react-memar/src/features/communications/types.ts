export type Channel = 'whatsapp' | 'phone' | 'email' | 'sms' | 'meeting';
export type Direction = 'inbound' | 'outbound';
export type ContactType = 'client' | 'company' | 'staff';

export const CONTACT_TYPE_LABELS: Record<ContactType, string> = {
  client: 'عميل',
  company: 'شركة',
  staff: 'موظف',
};

/** الجهة الحقيقية المربوطة بالسجل (عميل/شركة/موظف). */
export interface LinkedEntity {
  type: ContactType;
  id: number;
  name: string;
}

export interface Communication {
  id: number;
  contact_name: string;
  contact_type: ContactType;
  contact_id: number | null;
  company_id: number | null;
  user_id: number | null;
  linked: LinkedEntity | null;
  phone: string | null;
  channel: Channel;
  direction: Direction;
  subject: string | null;
  body: string | null;
  happened_at: string | null;
  follow_up_at: string | null;
  follow_up_done_at: string | null;
  logger: { id: number; name: string } | null;
  created_at: string | null;
}

export interface CommunicationFormData {
  contact_name: string;
  contact_type: ContactType;
  linked_key: LinkKey | null;
  linked_id: number | null;
  phone: string;
  channel: Channel;
  direction: Direction;
  subject: string;
  body: string;
  follow_up_at: string | null;
}

export interface CommunicationStats {
  today: number;
  week_inbound: number;
  week_outbound: number;
  follow_up_due: number;
  my_follow_up_due: number;
  top_channel: { channel: Channel; count: number } | null;
  by_type: Partial<Record<ContactType, number>>;
}

export type LinkKey = 'contact_id' | 'company_id' | 'user_id';

/** مفتاح الربط الافتراضي لكل نوع جهة (الشركة قد تُربط أيضًا بعميل نوعه شركة عبر contact_id). */
export const LINK_KEYS: Record<ContactType, LinkKey> = {
  client: 'contact_id',
  company: 'company_id',
  staff: 'user_id',
};

export const CHANNEL_LABELS: Record<Channel, string> = {
  whatsapp: 'واتساب',
  phone: 'اتصال',
  email: 'بريد',
  sms: 'رسالة',
  meeting: 'اجتماع',
};

export const CHANNEL_ICONS: Record<Channel, string> = {
  whatsapp: '💬',
  phone: '📞',
  email: '✉️',
  sms: '📱',
  meeting: '🤝',
};

/** لون وأيقونة Font Awesome لكل قناة — في الخط الزمني والفلاتر. */
export const CHANNEL_META: Record<Channel, { color: string; icon: string }> = {
  whatsapp: { color: '#16A34A', icon: 'fa-brands fa-whatsapp' },
  phone: { color: '#2563EB', icon: 'fa-solid fa-phone' },
  email: { color: '#EA580C', icon: 'fa-solid fa-envelope' },
  sms: { color: '#0891B2', icon: 'fa-solid fa-comment-sms' },
  meeting: { color: '#7C3AED', icon: 'fa-solid fa-handshake' },
};

export const DIRECTION_LABELS: Record<Direction, string> = {
  inbound: 'وارد',
  outbound: 'صادر',
};
