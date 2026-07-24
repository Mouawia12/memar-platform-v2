import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { attendanceApi, type AttendanceQuery } from '../api/attendanceApi';

const TODAY = ['attendance-today'];
const LIST = 'attendance-list';
const SUMMARY = 'attendance-summary';

/** يُبطل كل ما يتأثر بتغيّر سجلات الحضور. */
function invalidateAll(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: TODAY });
  qc.invalidateQueries({ queryKey: [LIST] });
  qc.invalidateQueries({ queryKey: [SUMMARY] });
}

export function useToday() {
  return useQuery({ queryKey: TODAY, queryFn: () => attendanceApi.today() });
}

/** السجل الكامل يتطلّب hr.view — لذا يُعطَّل الاستعلام لمن لا يملكها بدل أن يرتدّ بـ403. */
export function useAttendanceList(params: AttendanceQuery = {}, enabled = true) {
  return useQuery({ queryKey: [LIST, params], queryFn: () => attendanceApi.list(params), enabled });
}

export function useAttendanceSummary(params: AttendanceQuery = {}, enabled = true) {
  return useQuery({ queryKey: [SUMMARY, params], queryFn: () => attendanceApi.summary(params), enabled });
}

export function useCheckIn() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: { lat?: number; lng?: number }) => attendanceApi.checkIn(payload),
    onSuccess: () => invalidateAll(qc),
  });
}

export function useCheckOut() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: () => attendanceApi.checkOut(),
    onSuccess: () => invalidateAll(qc),
  });
}

/** تسجيل يدوي من الموارد البشرية (غياب/إجازة/تصحيح). */
export function useRecordAttendance() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => attendanceApi.record(payload),
    onSuccess: () => invalidateAll(qc),
  });
}
