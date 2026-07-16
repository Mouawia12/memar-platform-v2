export type AppointmentType = 'meeting' | 'appointment';
export type AppointmentStatus = 'scheduled' | 'done' | 'cancelled';

export interface Appointment {
  id: number;
  title: string;
  type: AppointmentType;
  start_at: string | null;
  end_at: string | null;
  location: string | null;
  is_video: boolean;
  video_room: string | null;
  video_url: string | null;
  status: AppointmentStatus;
  notes: string | null;
  project: { id: number; name: string } | null;
  created_at: string | null;
}

export interface AppointmentFormData {
  title: string;
  type: AppointmentType;
  project_id: number | '';
  start_at: string;
  end_at: string;
  location: string;
  is_video: boolean;
  status: AppointmentStatus;
  notes: string;
}

export const TYPE_LABELS: Record<AppointmentType, string> = {
  meeting: 'اجتماع',
  appointment: 'موعد',
};

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  scheduled: 'مجدول',
  done: 'منتهٍ',
  cancelled: 'ملغى',
};

export const STATUS_COLORS: Record<AppointmentStatus, string> = {
  scheduled: '#059669',
  done: '#6B7280',
  cancelled: '#DC2626',
};
