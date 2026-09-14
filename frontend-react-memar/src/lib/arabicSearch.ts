/**
 * تطبيع النص العربي للبحث — كي يجد «احمد» أحمدَ، و«دعاء» دعاءً، مهما اختلف الرسم.
 *
 * الموظف يكتب بسرعة وبلا همزات، والأسماء في القاعدة مكتوبة برسمها الصحيح. بلا تطبيع
 * يبحث عن «امنة» فلا يجد «د. آمنة»، فيظنّ الفلتر معطّلًا.
 */
export function normalizeArabic(text: string): string {
  return text
    .replace(/[ـ]/g, '') // تطويل ـــ
    .replace(/[ً-ْٰ]/g, '') // حركات وتشكيل
    .replace(/[أإآٱ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .replace(/ؤ/g, 'و')
    .replace(/ئ/g, 'ي')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * هل يطابق النصُّ الاستعلامَ؟ يقبل تطابق كلماتٍ متفرّقة: «خالد عازمي» تجد
 * «خالد خلف العازمي» — فلا يضطر الباحث لتذكّر الاسم كاملًا بترتيبه.
 */
export function matchesArabic(text: string, query: string): boolean {
  const q = normalizeArabic(query);
  if (!q) return true;

  const hay = normalizeArabic(text);

  return q.split(' ').every((word) => hay.includes(word));
}
