export type AttendanceStatus = 'present' | 'late' | 'absent' | 'leave';

export interface Attendance {
  id: number;
  date: string | null;
  check_in_at: string | null;
  check_out_at: string | null;
  status: AttendanceStatus;
  work_minutes: number | null;
  method: string;
  user: { id: number; name: string } | null;
}

export const STATUS_LABELS: Record<AttendanceStatus, string> = {
  present: 'حاضر',
  late: 'متأخر',
  absent: 'غائب',
  leave: 'إجازة',
};

export const STATUS_COLORS: Record<AttendanceStatus, string> = {
  present: '#059669',
  late: '#D97706',
  absent: '#DC2626',
  leave: '#6B7280',
};
