import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { queryClient } from '../../../lib/queryClient';
import { projectsApi, type ProjectsQuery } from '../api/projectsApi';
import type { ProjectFormData } from '../types';

const KEY = ['projects'];

export function useProjects(params: ProjectsQuery) {
  return useQuery({
    queryKey: [...KEY, params],
    queryFn: () => projectsApi.list(params),
  });
}

/** يحوّل قيم النموذج إلى حمولة API نظيفة (فراغ → null). */
function toPayload(data: ProjectFormData): Record<string, unknown> {
  return {
    ...data,
    client_id: data.client_id === '' ? null : data.client_id,
    manager_id: data.manager_id === '' ? null : data.manager_id,
    budget_kwd: data.budget_kwd === '' ? null : data.budget_kwd,
    start_date: data.start_date || null,
    end_date: data.end_date || null,
  };
}

export function useSaveProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id?: number; data: ProjectFormData }) =>
      id ? projectsApi.update(id, toPayload(data)) : projectsApi.create(toPayload(data)),
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteProject() {
  return useMutation({
    mutationFn: (id: number) => projectsApi.remove(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: KEY }),
  });
}

/**
 * إعادة تسمية المشروع من أي صفحة (مهام، CRM، تفاصيل المشروع…).
 * المشروع هو مصدر الحقيقة الوحيد للاسم، فأي تعديل يُكتب هنا وينعكس تلقائياً.
 * اسم المشروع يظهر في صفحات كثيرة (مهام، فرص، فواتير، عقود، مواعيد، بوابة العميل…)
 * لذا نُبطل كامل ذاكرة الاستعلام ليتحدّث الاسم أينما ظهر دون تعديل يدوي في كل مكان.
 */
export function useRenameProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, name }: { id: number; name: string }) => projectsApi.update(id, { name }),
    onSuccess: () => qc.invalidateQueries(),
  });
}
