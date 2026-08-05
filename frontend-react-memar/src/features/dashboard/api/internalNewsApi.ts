import { apiGet } from '../../../lib/api';

/** خبر داخلي يظهر على هيرو لوحة الموظف (اجتماع 2026-08-05). */
export interface InternalNewsItem {
  id: number;
  title: string;
  body: string | null;
  type: 'announcement' | 'decision' | 'alert' | 'update';
  cta_label: string | null;
  cta_url: string | null;
  is_active: boolean;
  sort_order: number;
  date: string | null;
}

export const internalNewsApi = {
  list: () => apiGet<InternalNewsItem[]>('/internal-news'),
};
