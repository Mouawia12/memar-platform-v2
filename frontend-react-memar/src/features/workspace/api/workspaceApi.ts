import { apiGet } from '../../../lib/api';

export interface SearchItem {
  title: string;
  subtitle: string | null;
  path: string;
}

export interface SearchGroup {
  label: string;
  icon: string;
  items: SearchItem[];
}

export interface SearchResult {
  query: string;
  groups: SearchGroup[];
}

export type NotificationTone = 'danger' | 'warning' | 'info';

export interface NotificationItem {
  icon: string;
  title: string;
  subtitle: string;
  path: string;
  tone: NotificationTone;
  count: number;
}

export interface NotificationsResult {
  total: number;
  items: NotificationItem[];
}

export const workspaceApi = {
  search: (q: string) => apiGet<SearchResult>('/search', { params: { q } }),
  notifications: () => apiGet<NotificationsResult>('/notifications'),
};
