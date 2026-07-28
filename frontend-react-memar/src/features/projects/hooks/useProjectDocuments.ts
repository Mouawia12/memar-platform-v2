import { useQuery } from '@tanstack/react-query';

import { projectsApi } from '../api/projectsApi';

/** مستندات المشروع وعقده: العقود + المستندات المولّدة + الملفات (PROJ-3). */
export function useProjectDocuments(projectId: number) {
  return useQuery({
    queryKey: ['project-documents', projectId],
    queryFn: () => projectsApi.documents(projectId),
    enabled: Number.isFinite(projectId) && projectId > 0,
  });
}
