import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { fieldVisitsApi, type FieldVisitsQuery } from '../api/fieldVisitsApi';
import type { FieldVisitFormData } from '../types';

const KEY = ['field-visits'];
const STATS_KEY = ['field-visits-stats'];

export function useFieldVisits(params: FieldVisitsQuery) {
  return useQuery({ queryKey: [...KEY, params], queryFn: () => fieldVisitsApi.list(params) });
}

export function useVisitStats() {
  return useQuery({ queryKey: STATS_KEY, queryFn: () => fieldVisitsApi.stats() });
}

function toPayload(data: FieldVisitFormData): Record<string, unknown> {
  return {
    ...data,
    project_id: data.project_id === '' ? null : data.project_id,
    engineer_id: data.engineer_id === '' ? null : data.engineer_id,
    progress_pct: data.progress_pct === '' ? null : Number(data.progress_pct),
  };
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: KEY });
    qc.invalidateQueries({ queryKey: STATS_KEY });
  };
}

export function useSaveVisit() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: FieldVisitFormData }) =>
      id ? fieldVisitsApi.update(id, toPayload(data)) : fieldVisitsApi.create(toPayload(data)),
    onSuccess: invalidate,
  });
}

export function useDeleteVisit() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: number) => fieldVisitsApi.remove(id),
    onSuccess: invalidate,
  });
}
