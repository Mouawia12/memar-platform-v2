import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { filesApi, type FilesQuery } from '../api/filesApi';

const KEY = ['files'];
const STATS_KEY = ['files-stats'];

export function useFiles(params: FilesQuery) {
  return useQuery({ queryKey: [...KEY, params], queryFn: () => filesApi.list(params) });
}

export function useFileStats() {
  return useQuery({ queryKey: STATS_KEY, queryFn: () => filesApi.stats() });
}

function useInvalidate() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: KEY });
    qc.invalidateQueries({ queryKey: STATS_KEY });
  };
}

export function useUploadFile() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (form: FormData) => filesApi.upload(form),
    onSuccess: invalidate,
  });
}

export function useDeleteFile() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: number) => filesApi.remove(id),
    onSuccess: invalidate,
  });
}
