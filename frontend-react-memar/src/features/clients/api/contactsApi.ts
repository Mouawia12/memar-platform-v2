import { apiDelete, apiGetPaginated, apiPatch, apiPost } from '../../../lib/api';
import type { Contact } from '../types';

export interface ContactsQuery {
  search?: string;
  type?: string;
  page?: number;
  per_page?: number;
}

export const contactsApi = {
  list: (params: ContactsQuery) => apiGetPaginated<Contact>('/contacts', { params }),
  create: (payload: Record<string, unknown>) => apiPost<Contact>('/contacts', payload),
  update: (id: number, payload: Record<string, unknown>) => apiPatch<Contact>(`/contacts/${id}`, payload),
  remove: (id: number) => apiDelete<null>(`/contacts/${id}`),
};
