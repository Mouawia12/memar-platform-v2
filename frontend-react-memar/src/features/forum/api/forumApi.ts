import { apiDelete, apiGet, apiGetPaginated, apiPatch, apiPost } from '../../../lib/api';
import type { BoardThread } from '../components/ForumBoard';
import type { ForumCategory, ForumTopic } from '../types';

export const forumApi = {
  // لوحة المنتدى الموحّدة (نفس تصميم بوابة العميل، جدول مشترك)
  board: () => apiGet<BoardThread[]>('/forum/board'),
  createBoardTopic: (title: string, body: string) => apiPost<{ id: number }>('/forum/board', { title, body }),
  categories: () => apiGet<ForumCategory[]>('/forum/categories'),
  topics: (params: { category_id?: number; search?: string; page?: number }) => apiGetPaginated<ForumTopic>('/forum/topics', { params }),
  topic: (id: number) => apiGet<ForumTopic>(`/forum/topics/${id}`),
  createTopic: (payload: Record<string, unknown>) => apiPost<ForumTopic>('/forum/topics', payload),
  deleteTopic: (id: number) => apiDelete<null>(`/forum/topics/${id}`),
  addReply: (topicId: number, body: string) => apiPost<ForumTopic>(`/forum/topics/${topicId}/replies`, { body }),
  // اعتماد/إلغاء اعتماد موضوع للعرض العام على اللاندنج (بند 9)
  setPublic: (topicId: number, isPublic: boolean) => apiPatch<{ id: number; is_public: boolean }>(`/forum/topics/${topicId}/public`, { is_public: isPublic }),
};
