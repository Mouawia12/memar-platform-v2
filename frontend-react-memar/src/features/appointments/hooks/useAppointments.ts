import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryClient } from '../../../lib/queryClient';
import { appointmentsApi, type AppointmentsQuery } from '../api/appointmentsApi';
import type { AppointmentFormData } from '../types';

const KEY = ['appointments'];

export function useAppointments(params: AppointmentsQuery) {
  return useQuery({
    queryKey: [...KEY, params],
    queryFn: () => appointmentsApi.list(params),
  });
}

function toPayload(data: AppointmentFormData): Record<string, unknown> {
  return {
    ...data,
    project_id: data.project_id === '' ? null : data.project_id,
    end_at: data.end_at || null,
  };
}

export function useSaveAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: AppointmentFormData }) =>
      id ? appointmentsApi.update(id, toPayload(data)) : appointmentsApi.create(toPayload(data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteAppointment() {
  return useMutation({
    mutationFn: (id: number) => appointmentsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
