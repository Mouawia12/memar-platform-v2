import { api, apiDelete, apiGet, apiGetPaginated, apiPatch } from '../../../lib/api';
import type { FileStats, StoredFile } from '../types';

export interface FilesQuery {
  search?: string;
  folder?: string;
  project_id?: number;
  page?: number;
  per_page?: number;
}

export const filesApi = {
  list: (params: FilesQuery) => apiGetPaginated<StoredFile>('/files', { params }),
  stats: () => apiGet<FileStats>('/files/stats'),

  upload: async (form: FormData): Promise<StoredFile> => {
    const res = await api.post('/files', form);
    return res.data.data as StoredFile;
  },

  update: (id: number, payload: Record<string, unknown>) => apiPatch<StoredFile>(`/files/${id}`, payload),
  remove: (id: number) => apiDelete<null>(`/files/${id}`),

  /** تنزيل محميّ بالتوكن ثم حفظه في المتصفح. */
  download: async (id: number, filename: string): Promise<void> => {
    const res = await api.get(`/files/${id}/download`, { responseType: 'blob' });
    const url = URL.createObjectURL(res.data as Blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  },
};
