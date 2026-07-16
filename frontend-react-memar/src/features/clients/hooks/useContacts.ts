import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryClient } from '../../../lib/queryClient';
import { contactsApi, type ContactsQuery } from '../api/contactsApi';
import type { ContactFormData } from '../types';

const KEY = ['contacts'];

export function useContacts(params: ContactsQuery) {
  return useQuery({
    queryKey: [...KEY, params],
    queryFn: () => contactsApi.list(params),
  });
}

export function useSaveContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: ContactFormData }) =>
      id ? contactsApi.update(id, { ...data }) : contactsApi.create({ ...data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteContact() {
  return useMutation({
    mutationFn: (id: number) => contactsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
