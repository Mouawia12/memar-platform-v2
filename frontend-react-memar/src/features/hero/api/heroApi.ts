import { apiDelete, apiGet, apiPatch, apiPost } from '../../../lib/api';
import type { HeroSlide } from '../types';

export const heroApi = {
  list: () => apiGet<HeroSlide[]>('/hero-slides'),
  /** الشرائح الفعّالة فقط — نقطة عامة بلا صلاحيات (للبوابات والصفحة الرئيسية). */
  publicList: () => apiGet<HeroSlide[]>('/public/hero-slides'),
  create: (payload: Record<string, unknown>) => apiPost<HeroSlide>('/hero-slides', payload),
  update: (id: number, payload: Record<string, unknown>) => apiPatch<HeroSlide>(`/hero-slides/${id}`, payload),
  remove: (id: number) => apiDelete<null>(`/hero-slides/${id}`),
};
