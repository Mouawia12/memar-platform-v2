import { apiDelete, apiGetPaginated, apiPatch, apiPost } from '../../../lib/api';
import type { Appointment } from '../types';

export interface AppointmentsQuery {
  search?: string;
  type?: string;
  /** نوع الموعد = مكانه: office · site · online · call */
  location_kind?: string;
  status?: string;
  page?: number;
  per_page?: number;
  /** مواعيدي وحدها: ما كُلّفتُ به أو سجّلتُه. */
  mine?: boolean;
}

export const appointmentsApi = {
  list: (params: AppointmentsQuery) => apiGetPaginated<Appointment>('/appointments', { params }),
  create: (payload: Record<string, unknown>) => apiPost<Appointment>('/appointments', payload),
  update: (id: number, payload: Record<string, unknown>) => apiPatch<Appointment>(`/appointments/${id}`, payload),
  remove: (id: number) => apiDelete<null>(`/appointments/${id}`),
};
