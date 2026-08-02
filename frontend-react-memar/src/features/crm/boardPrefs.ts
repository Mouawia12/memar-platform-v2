import { useSyncExternalStore } from 'react';

/**
 * تفضيلات لوحة الفرص المحلية (لكل مستخدم على جهازه):
 *  - طيّ عمود المرحلة إلى شريط جانبي رفيع (مثل بيتريكس). مراحل «الخسارة» مطويّة افتراضيًا.
 *  - إخفاء/إظهار مرحلة كاملة من اللوحة (يُدار من نافذة تخصيص المراحل).
 * تُخزَّن محليًا لأن الخادم لا يحمل هذه الحقول، وهي تفضيل عرض شخصي.
 */
type BoolMap = Record<string, boolean>;

const COLLAPSE_KEY = 'memar_crm_stage_collapsed';
const HIDDEN_KEY = 'memar_crm_stage_hidden';

function load(key: string): BoolMap {
  try {
    return JSON.parse(localStorage.getItem(key) ?? '{}') as BoolMap;
  } catch {
    return {};
  }
}

function save(key: string, value: BoolMap): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // تجاهل أخطاء التخزين المحلي
  }
}

let collapsed = load(COLLAPSE_KEY);
let hidden = load(HIDDEN_KEY);

const listeners = new Set<() => void>();
const subscribe = (l: () => void) => { listeners.add(l); return () => { listeners.delete(l); }; };
const emit = () => { listeners.forEach((l) => l()); };

/** تعيين حالة الطيّ لمرحلة صراحةً (نمرّر القيمة الفعلية لأن للخسارة افتراضًا مطويًّا). */
export function setStageCollapsed(key: string, value: boolean): void {
  collapsed = { ...collapsed, [key]: value };
  save(COLLAPSE_KEY, collapsed);
  emit();
}

/** قلب حالة الإخفاء لمرحلة (إظهار ↔ إخفاء من اللوحة). */
export function toggleStageHidden(key: string): void {
  hidden = { ...hidden, [key]: !hidden[key] };
  save(HIDDEN_KEY, hidden);
  emit();
}

export function useCollapsedStages(): BoolMap {
  return useSyncExternalStore(subscribe, () => collapsed);
}

export function useHiddenStages(): BoolMap {
  return useSyncExternalStore(subscribe, () => hidden);
}

/**
 * الطيّ الفعلي لمرحلة: تفضيل المستخدم الصريح إن وُجد، وإلا فمراحل الخسارة
 * مطويّة افتراضيًا (تمتلئ بمعاملات غير مهتمة ولا نريدها تزاحم اللوحة).
 */
export function isStageCollapsed(map: BoolMap, key: string, isLost: boolean): boolean {
  return Object.prototype.hasOwnProperty.call(map, key) ? map[key] : isLost;
}
