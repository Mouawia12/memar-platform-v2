import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { attendanceApi } from '../api/attendanceApi';

const TODAY = ['attendance-today'];
const LIST = ['attendance-list'];

export function useToday() {
  return useQuery({ queryKey: TODAY, queryFn: () => attendanceApi.today() });
}

export function useAttendanceList() {
  return useQuery({ queryKey: LIST, queryFn: () => attendanceApi.list({}) });
}

export function useCheckIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: { lat?: number; lng?: number }) => attendanceApi.checkIn(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TODAY });
      qc.invalidateQueries({ queryKey: LIST });
    },
  });
}

export function useCheckOut() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => attendanceApi.checkOut(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: TODAY });
      qc.invalidateQueries({ queryKey: LIST });
    },
  });
}
