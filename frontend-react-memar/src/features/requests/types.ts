export type RequestType = 'design' | 'supervision' | 'inquiry' | 'maintenance' | 'other';
export type Priority = 'low' | 'normal' | 'high' | 'urgent';
export type RequestStatus = 'open' | 'in_progress' | 'resolved' | 'closed';

export interface ServiceRequest {
  id: number;
  title: string;
  type: RequestType;
  client_name: string | null;
  contact_phone: string | null;
  priority: Priority;
  status: RequestStatus;
  description: string | null;
  requester: { id: number; name: string } | null;
  created_at: string | null;
}

export interface ServiceRequestFormData {
  title: string;
  type: RequestType;
  client_name: string;
  contact_phone: string;
  priority: Priority;
  status: RequestStatus;
  description: string;
}

export const TYPE_LABELS: Record<RequestType, string> = {
  design: 'تصميم',
  supervision: 'إشراف',
  inquiry: 'استفسار',
  maintenance: 'صيانة',
  other: 'أخرى',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: 'منخفضة',
  normal: 'عادية',
  high: 'عالية',
  urgent: 'عاجلة',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  low: '#6B7280',
  normal: '#0891B2',
  high: '#D97706',
  urgent: '#DC2626',
};

export const STATUS_LABELS: Record<RequestStatus, string> = {
  open: 'مفتوح',
  in_progress: 'قيد المعالجة',
  resolved: 'تم الحل',
  closed: 'مغلق',
};

export const STATUS_COLORS: Record<RequestStatus, string> = {
  open: '#6B7280',
  in_progress: '#274A78',
  resolved: '#059669',
  closed: '#9CA3AF',
};
