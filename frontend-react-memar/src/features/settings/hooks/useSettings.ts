import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { usePermission } from '../../auth/hooks/usePermission';
import { CRM_SETTINGS_FALLBACK, settingsApi, type CrmSettings } from '../api/settingsApi';

const KEY = ['crm-settings'];

/**
 * إعدادات CRM الفعّالة — يقرأها كل من يرى الفرص، والخادم يحجب قيمة النقطة
 * بالدينار عن غير الإدارة. canManage يفرّق بين من يعدّلها ومن يقرأها فقط.
 */
export function useCrmSettings() {
  const canManage = usePermission('loyalty.manage');
  const query = useQuery({
    queryKey: KEY,
    queryFn: () => settingsApi.crm(),
    staleTime: 5 * 60_000,
  });

  const settings: CrmSettings = query.data?.effective ?? CRM_SETTINGS_FALLBACK;

  return { ...query, settings, canManage };
}

export function useSaveCrmSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (settings: Record<string, unknown>) => settingsApi.saveCrm(settings),
    onSuccess: () => { qc.invalidateQueries({ queryKey: KEY }); },
  });
}
