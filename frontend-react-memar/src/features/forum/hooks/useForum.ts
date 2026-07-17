import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryClient } from '../../../lib/queryClient';
import { forumApi } from '../api/forumApi';
import type { TopicFormData } from '../types';

const TOPICS = ['forum-topics'];

export function useForumCategories() {
  return useQuery({ queryKey: ['forum-categories'], queryFn: () => forumApi.categories(), staleTime: 5 * 60_000 });
}

export function useTopics(params: { category_id?: number; search?: string; page?: number }) {
  return useQuery({ queryKey: [...TOPICS, params], queryFn: () => forumApi.topics(params) });
}

export function useTopic(id: number | null) {
  return useQuery({ queryKey: ['forum-topic', id], queryFn: () => forumApi.topic(id as number), enabled: id !== null });
}

export function useCreateTopic() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: TopicFormData) => forumApi.createTopic({ ...data, category_id: data.category_id === '' ? null : data.category_id }),
    onSuccess: () => qc.invalidateQueries({ queryKey: TOPICS }),
  });
}

export function useDeleteTopic() {
  return useMutation({ mutationFn: (id: number) => forumApi.deleteTopic(id), onSuccess: () => queryClient.invalidateQueries({ queryKey: TOPICS }) });
}

export function useAddReply(topicId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: string) => forumApi.addReply(topicId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['forum-topic', topicId] });
      qc.invalidateQueries({ queryKey: TOPICS });
    },
  });
}
