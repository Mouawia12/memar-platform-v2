export interface HeroSlide {
  id: number;
  title: string;
  subtitle: string | null;
  cta_label: string | null;
  cta_url: string | null;
  bg_gradient: string;
  sort_order: number;
  is_active: boolean;
}

export interface HeroSlideFormData {
  title: string;
  subtitle: string;
  cta_label: string;
  cta_url: string;
  bg_gradient: string;
  sort_order: number;
  is_active: boolean;
}

export const GRADIENT_PRESETS: { label: string; value: string }[] = [
  { label: 'كحلي', value: 'linear-gradient(135deg, #274A78 0%, #1A3356 100%)' },
  { label: 'أخضر', value: 'linear-gradient(135deg, #0F766E 0%, #134E4A 100%)' },
  { label: 'برتقالي', value: 'linear-gradient(135deg, #B45309 0%, #7C2D12 100%)' },
  { label: 'بنفسجي', value: 'linear-gradient(135deg, #6D28D9 0%, #4C1D95 100%)' },
  { label: 'أزرق', value: 'linear-gradient(135deg, #0369A1 0%, #075985 100%)' },
  { label: 'رمادي', value: 'linear-gradient(135deg, #334155 0%, #1E293B 100%)' },
];
