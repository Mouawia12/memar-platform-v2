import { apiGet, apiGetPaginated, apiPost } from '../../../lib/api';
import type { Attendance } from '../types';

export const attendanceApi = {
  today: () => apiGet<Attendance | null>('/attendance/today'),
  checkIn: (payload: { lat?: number; lng?: number }) => apiPost<Attendance>('/attendance/check-in', payload),
  checkOut: () => apiPost<Attendance>('/attendance/check-out', {}),
  list: (params: { page?: number }) => apiGetPaginated<Attendance>('/attendance', { params }),
};
