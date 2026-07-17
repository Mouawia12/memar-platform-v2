import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { siteApi } from '../api/siteApi';
import type { SiteSettings } from '../types';

const KEY = ['site-settings'];

export function useSiteSettings() {
  return useQuery({ queryKey: KEY, queryFn: () => siteApi.get() });
}

export function useSaveSiteSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (settings: SiteSettings) => siteApi.update(settings),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
