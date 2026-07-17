export type Channel = 'whatsapp' | 'phone' | 'email' | 'sms' | 'meeting';
export type Direction = 'inbound' | 'outbound';

export interface Communication {
  id: number;
  contact_name: string;
  phone: string | null;
  channel: Channel;
  direction: Direction;
  subject: string | null;
  body: string | null;
  happened_at: string | null;
  logger: { id: number; name: string } | null;
  created_at: string | null;
}

export interface CommunicationFormData {
  contact_name: string;
  phone: string;
  channel: Channel;
  direction: Direction;
  subject: string;
  body: string;
}

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

export const DIRECTION_LABELS: Record<Direction, string> = {
  inbound: 'وارد',
  outbound: 'صادر',
};
