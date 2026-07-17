import { apiDelete, apiGet, apiGetPaginated, apiPost } from '../../../lib/api';
import type { ForumCategory, ForumTopic } from '../types';

export const forumApi = {
  categories: () => apiGet<ForumCategory[]>('/forum/categories'),
  topics: (params: { category_id?: number; search?: string; page?: number }) => apiGetPaginated<ForumTopic>('/forum/topics', { params }),
  topic: (id: number) => apiGet<ForumTopic>(`/forum/topics/${id}`),
  createTopic: (payload: Record<string, unknown>) => apiPost<ForumTopic>('/forum/topics', payload),
  deleteTopic: (id: number) => apiDelete<null>(`/forum/topics/${id}`),
  addReply: (topicId: number, body: string) => apiPost<ForumTopic>(`/forum/topics/${topicId}/replies`, { body }),
};
