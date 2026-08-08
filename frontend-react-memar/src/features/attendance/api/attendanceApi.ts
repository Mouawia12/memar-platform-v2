import { apiGet, apiGetPaginated, apiPost } from '../../../lib/api';
import type { Attendance, AttendanceSummary } from '../types';

/** فلاتر سجل الحضور — يشاركها الجدول والملخّص والتصدير. */
export interface AttendanceQuery {
  user_id?: number;
  from?: string;
  to?: string;
  page?: number;
  per_page?: number;
}

export const attendanceApi = {
  today: () => apiGet<Attendance | null>('/attendance/today'),
  checkIn: (payload: { lat?: number; lng?: number }) => apiPost<Attendance>('/attendance/check-in', payload),
  checkOut: () => apiPost<Attendance>('/attendance/check-out', {}),
  list: (params: AttendanceQuery) => apiGetPaginated<Attendance>('/attendance', { params }),
  summary: (params: AttendanceQuery) => apiGet<AttendanceSummary[]>('/attendance/summary', { params }),
  record: (payload: Record<string, unknown>) => apiPost<Attendance>('/attendance', payload),
  // خدمة ذاتية للموظف الحالي (بلا صلاحية hr) — لصفحة الحضور في بوابته.
  mine: (params: AttendanceQuery = {}) => apiGetPaginated<Attendance>('/attendance/mine', { params }),
  mineSummary: (params: AttendanceQuery = {}) => apiGet<AttendanceSummary>('/attendance/mine/summary', { params }),
};
