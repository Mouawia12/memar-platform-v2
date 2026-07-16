import { apiDelete, apiGetPaginated, apiPatch, apiPost } from '../../../lib/api';
import type { DocumentTemplate, GeneratedDocument } from '../types';

export const templatesApi = {
  list: (params: { search?: string; page?: number }) => apiGetPaginated<DocumentTemplate>('/document-templates', { params }),
  create: (payload: Record<string, unknown>) => apiPost<DocumentTemplate>('/document-templates', payload),
  update: (id: number, payload: Record<string, unknown>) => apiPatch<DocumentTemplate>(`/document-templates/${id}`, payload),
  remove: (id: number) => apiDelete<null>(`/document-templates/${id}`),
};

export const generatedApi = {
  list: (params: { page?: number }) => apiGetPaginated<GeneratedDocument>('/documents', { params }),
  generate: (payload: Record<string, unknown>) => apiPost<GeneratedDocument>('/documents', payload),
  remove: (id: number) => apiDelete<null>(`/documents/${id}`),
};
