import { apiGet } from '../../lib/api';

export interface EmployeeDocRow {
  id: number;
  name: string;
  original_name: string;
  extension: string;
  folder: string | null;
  project: string | null;
  created_at: string | null;
}

/** مستندات مشاريع الموظف — خدمة ذاتية. */
export const employeeDocumentsApi = {
  mine: () => apiGet<EmployeeDocRow[]>('/me/documents'),
};
