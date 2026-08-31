export type AppointmentType = 'meeting' | 'appointment';
export type AppointmentStatus = 'pending' | 'scheduled' | 'done' | 'cancelled';
/** نوع مكان الاجتماع — و`location` يبقى تفصيلَه. */
export type LocationKind = 'office' | 'site' | 'online' | 'call';

export interface Appointment {
  id: number;
  title: string;
  type: AppointmentType;
  start_at: string | null;
  end_at: string | null;
  location: string | null;
  location_kind: LocationKind | null;
  is_video: boolean;
  video_room: string | null;
  video_url: string | null;
  status: AppointmentStatus;
  notes: string | null;
  project: { id: number; name: string } | null;
  /** الموظف المكلَّف بالموعد — يظهر اسمه في القوائم والتقويم. */
  assignee: { id: number; name: string } | null;
  created_at: string | null;
}

export interface AppointmentFormData {
  title: string;
  type: AppointmentType;
  project_id: number | '';
  assignee_id: number | '';
  start_at: string;
  end_at: string;
  location: string;
  location_kind: LocationKind | '';
  is_video: boolean;
  status: AppointmentStatus;
  notes: string;
}

/** أنواع المكان بأسمائها وأيقوناتها — مصدر واحد للنموذج والجدول. */
export const LOCATION_KINDS: { key: LocationKind; label: string; icon: string; detailLabel: string; detailHint: string }[] = [
  { key: 'office', label: 'في المكتب', icon: '🏢', detailLabel: 'القاعة أو الدور', detailHint: 'مثال: قاعة الاجتماعات — الدور الثاني' },
  { key: 'site', label: 'في موقع المشروع', icon: '🏗️', detailLabel: 'العنوان أو القسيمة', detailHint: 'مثال: حولي — قطعة 3، قسيمة 12' },
  { key: 'online', label: 'أونلاين', icon: '💻', detailLabel: 'رابط الاجتماع', detailHint: 'يُترك فارغًا إن أُنشئ الرابط تلقائيًا' },
  { key: 'call', label: 'اتصال هاتفي', icon: '📞', detailLabel: 'رقم الاتصال', detailHint: 'مثال: 9xxxxxxx' },
];

export const LOCATION_KIND_LABELS: Record<LocationKind, string> = Object.fromEntries(
  LOCATION_KINDS.map((k) => [k.key, `${k.icon} ${k.label}`]),
) as Record<LocationKind, string>;

export const TYPE_LABELS: Record<AppointmentType, string> = {
  meeting: 'اجتماع',
  appointment: 'موعد',
};

export const STATUS_LABELS: Record<AppointmentStatus, string> = {
  pending: 'طلب منتظر',
  scheduled: 'مؤكّد',
  done: 'منتهٍ',
  cancelled: 'ملغى',
};

export const STATUS_COLORS: Record<AppointmentStatus, string> = {
  pending: '#D97706',
  scheduled: '#059669',
  done: '#6B7280',
  cancelled: '#DC2626',
};
