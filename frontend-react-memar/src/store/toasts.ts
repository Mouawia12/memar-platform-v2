import { create } from 'zustand';

/** إشعار عائم واحد على الشاشة. */
export interface FloatingToast {
  id: string;
  icon: string;
  title: string;
  body: string;
  /** المسار الذي يفتحه الضغط على الإشعار (اختياري). */
  link?: string | null;
  tone: 'info' | 'warning' | 'danger' | 'success';
}

interface ToastState {
  toasts: FloatingToast[];
  /** يُظهر إشعارًا؛ ويتجاهل تكرار المعرّف نفسه ما دام معروضًا. */
  push: (t: FloatingToast) => void;
  dismiss: (id: string) => void;
  clear: () => void;
}

/**
 * مخزن الإشعارات العائمة — تظهر في أي صفحة من النظام (طلب أيمن 2026-08-22):
 * الضغط عليها يفتح مصدرها، و«×» يخفيها. تُستعمل لكل أنواع الإشعارات.
 */
export const useToastStore = create<ToastState>()((set, get) => ({
  toasts: [],
  push: (t) => {
    if (get().toasts.some((x) => x.id === t.id)) return;
    set((s) => ({ toasts: [...s.toasts, t].slice(-4) }));
  },
  dismiss: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
  clear: () => set({ toasts: [] }),
}));
