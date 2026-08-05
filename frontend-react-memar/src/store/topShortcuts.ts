import { create } from 'zustand';

// v2: بعد اجتماع 2026-08-03 (أيمن طلب إزالة «المهام» و«CRM» من الأعلى).
const STORAGE_KEY = 'memar_top_shortcuts_v2';

/** الاختصارات الافتراضية فوق — «المواعيد» و«التواصل» فقط، والباقي في القائمة الجانبية. */
export const DEFAULT_SHORTCUT_KEYS = ['appointments', 'whatsapp'];

function loadKeys(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);

    return raw ? (JSON.parse(raw) as string[]) : DEFAULT_SHORTCUT_KEYS;
  } catch {
    return DEFAULT_SHORTCUT_KEYS;
  }
}

function save(keys: string[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
  } catch {
    // تجاهل أخطاء التخزين المحلي
  }
}

interface TopShortcutsState {
  keys: string[];
  setKeys: (keys: string[]) => void;
  add: (key: string) => void;
  remove: (key: string) => void;
  move: (index: number, dir: -1 | 1) => void;
  reset: () => void;
}

/**
 * حالة اختصارات الشريط العلوي — مشتركة بين شريط الاختصارات (الأزرار) وزرّ التخصيص
 * (نُقل جنب الإشعارات، اجتماع 2026-08-06). نحفظ بنفس مفتاح/صيغة localStorage القديمة
 * حفاظًا على تخصيص المستخدم الحالي.
 */
export const useTopShortcutsStore = create<TopShortcutsState>((set, get) => ({
  keys: loadKeys(),
  setKeys: (keys) => { save(keys); set({ keys }); },
  add: (key) => { const next = [...get().keys, key]; save(next); set({ keys: next }); },
  remove: (key) => { const next = get().keys.filter((k) => k !== key); save(next); set({ keys: next }); },
  move: (index, dir) => {
    const next = [...get().keys];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    save(next);
    set({ keys: next });
  },
  reset: () => { save(DEFAULT_SHORTCUT_KEYS); set({ keys: DEFAULT_SHORTCUT_KEYS }); },
}));
