export interface Service {
  id: number;
  name: string;
  category: string | null;
  unit: string | null;
  price_kwd: string;
  description: string | null;
  is_active: boolean;
  created_at: string | null;
  /** آخر تعديل على الخدمة — عمود «آخر تحديث». */
  updated_at?: string | null;
}

/** مؤشّرات أعلى صفحة «الخدمات والأسعار» (طلب أيمن 2026-09-14). */
export interface ServiceStats {
  services_count: number;
  quotations_this_year: number;
  acceptance_rate: number;
  quotations_sent: number;
  categories_count: number;
}

/**
 * ألوان التصنيفات — كل تصنيف بلونه الثابت في كل مكان، وما لا لون له يأخذ
 * لونًا مشتقًّا من اسمه فلا يبقى تصنيفٌ بلا هويّة.
 */
const CATEGORY_COLORS: Record<string, string> = {
  'تصميم': '#1B6CA8',
  'تراخيص': '#E8A838',
  'هندسة': '#7C3AED',
  'إشراف': '#DC4A3D',
  'دراسات': '#2D9B6F',
  'تصميم داخلي': '#0EA5E9',
  'مساحة': '#64748B',
};

const FALLBACK_COLORS = ['#1B6CA8', '#E8A838', '#7C3AED', '#DC4A3D', '#2D9B6F', '#0EA5E9'];

export function categoryColor(category: string | null): string {
  if (!category) return '#94A3B8';
  if (CATEGORY_COLORS[category]) return CATEGORY_COLORS[category];
  const hash = [...category].reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

  return FALLBACK_COLORS[hash % FALLBACK_COLORS.length];
}

export interface ServiceFormData {
  name: string;
  category: string;
  unit: string;
  price_kwd: string;
  description: string;
  is_active: boolean;
}
