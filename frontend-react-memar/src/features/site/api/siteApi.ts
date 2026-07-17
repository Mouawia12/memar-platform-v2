import { apiGet, apiPatch } from '../../../lib/api';
import type { SiteSettings } from '../types';

export const siteApi = {
  get: () => apiGet<SiteSettings>('/site-settings'),
  update: (settings: SiteSettings) => apiPatch<SiteSettings>('/site-settings', { settings }),
};
