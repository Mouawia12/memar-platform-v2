import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryClient } from '../../../lib/queryClient';
import { heroApi } from '../api/heroApi';
import type { HeroSlideFormData } from '../types';

const KEY = ['hero-slides'];

export function useHeroSlides() {
  return useQuery({ queryKey: KEY, queryFn: () => heroApi.list() });
}

export function useSaveHeroSlide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: HeroSlideFormData }) =>
      id ? heroApi.update(id, { ...data }) : heroApi.create({ ...data }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useToggleHeroSlide() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, is_active }: { id: number; is_active: boolean }) => heroApi.update(id, { is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteHeroSlide() {
  return useMutation({
    mutationFn: (id: number) => heroApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}
