export type FollowupStage = 'scheduled' | 'today' | 'late' | 'done';
export type FollowupPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface Followup {
  id: number;
  code: string;
  contact_id: number | null;
  client_name: string;
  channel: string;
  due_date: string | null;
  done: boolean;
  priority: FollowupPriority;
  notes: string | null;
  stage: FollowupStage;
  assignee?: { id: number; name: string } | null;
  created_at?: string | null;
}

export interface FollowupFormData {
  contact_id: number | '';
  client_name: string;
  channel: string;
  assigned_to: number | '';
  due_date: string;
  priority: FollowupPriority;
  notes: string;
}

export interface FollowupStats { scheduled: number; today: number; late: number; done: number }

/** قنوات المتابعة — طبق أصل المرجع. */
export const FU_CHANNELS = ['اتصال هاتفي', 'واتساب', 'بريد إلكتروني', 'زيارة ميدانية', 'اجتماع'] as const;

/** أعمدة لوحة المتابعة — طبق أصل FU_STAGES. */
export const FU_BOARD: { key: FollowupStage; label: string; icon: string; color: string }[] = [
  { key: 'scheduled', label: 'مجدولة', icon: '🗓️', color: '#1B6CA8' },
  { key: 'today', label: 'اليوم', icon: '📌', color: '#E8A838' },
  { key: 'late', label: 'متأخرة', icon: '⚠️', color: '#DC4A3D' },
  { key: 'done', label: 'منجزة', icon: '✅', color: '#2D9B6F' },
];
