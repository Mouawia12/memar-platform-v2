import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryClient } from '../../../lib/queryClient';
import { generatedApi, templatesApi } from '../api/documentsApi';
import type { TemplateFormData } from '../types';

const TKEY = ['doc-templates'];
const GKEY = ['generated-docs'];

export function useTemplates(search?: string) {
  return useQuery({ queryKey: [...TKEY, search], queryFn: () => templatesApi.list({ search: search || undefined }) });
}

export function useSaveTemplate() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: TemplateFormData }) =>
      id ? templatesApi.update(id, { ...data }) : templatesApi.create({ ...data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: TKEY }),
  });
}

export function useDeleteTemplate() {
  return useMutation({ mutationFn: (id: number) => templatesApi.remove(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: TKEY }) });
}

export function useGeneratedDocs() {
  return useQuery({ queryKey: GKEY, queryFn: () => generatedApi.list({}) });
}

export function useGenerateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: Record<string, unknown>) => generatedApi.generate(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: GKEY }),
  });
}

export function useDeleteDocument() {
  return useMutation({ mutationFn: (id: number) => generatedApi.remove(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: GKEY }) });
}

/** حفظ تعديلات مستند مولّد (المحرر الغني). */
export function useUpdateDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Record<string, unknown> }) => generatedApi.update(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: GKEY }),
  });
}
