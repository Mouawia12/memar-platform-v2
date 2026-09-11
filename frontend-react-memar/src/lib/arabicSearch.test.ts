import { describe, expect, it } from 'vitest';

import { matchesArabic, normalizeArabic } from './arabicSearch';

/** الموظف يكتب بسرعة وبلا همزات — والبحث يجب أن يجد رغم ذلك. */
describe('matchesArabic', () => {
  it('يتجاوز الهمزات: «امنة» تجد «د. آمنة الرشيدي»', () => {
    expect(matchesArabic('د. آمنة الرشيدي', 'امنة')).toBe(true);
    expect(matchesArabic('أحمد المنصور', 'احمد')).toBe(true);
    expect(matchesArabic('إبراهيم', 'ابراهيم')).toBe(true);
  });

  it('يتجاوز التاء المربوطة والألف المقصورة', () => {
    expect(matchesArabic('دعاء مصطفى', 'مصطفي')).toBe(true);
    expect(matchesArabic('فاطمة', 'فاطمه')).toBe(true);
  });

  it('يتجاوز التشكيل والتطويل', () => {
    expect(matchesArabic('م. خَالِد العتيبي', 'خالد')).toBe(true);
    expect(matchesArabic('محـــمد', 'محمد')).toBe(true);
  });

  it('يقبل كلمات متفرّقة بأي ترتيب', () => {
    expect(matchesArabic('خالد خلف العازمي', 'خالد عازمي')).toBe(true);
    expect(matchesArabic('خالد خلف العازمي', 'عازمي خالد')).toBe(true);
  });

  it('لا يطابق اسمًا آخر', () => {
    expect(matchesArabic('م. سارة الحربي', 'دعاء')).toBe(false);
    expect(matchesArabic('خالد خلف العازمي', 'خالد مطيري')).toBe(false);
  });

  it('بحث فارغ يُبقي الكل', () => {
    expect(matchesArabic('أي اسم', '')).toBe(true);
    expect(matchesArabic('أي اسم', '   ')).toBe(true);
  });

  it('يتجاهل حالة الأحرف اللاتينية', () => {
    expect(matchesArabic('Sara Al-Harbi', 'sara')).toBe(true);
  });
});

describe('normalizeArabic', () => {
  it('يوحّد الرسم', () => {
    expect(normalizeArabic('أإآٱ')).toBe('اااا');
    expect(normalizeArabic('ة')).toBe('ه');
    expect(normalizeArabic('ى')).toBe('ي');
    // الهمزة على النبرة تصير ياءً، والتاء المربوطة هاءً — فـ«زائدة» تُطبَّع «زايده»
    expect(normalizeArabic('زائدة')).toBe('زايده');
  });

  it('يطوي المسافات الزائدة', () => {
    expect(normalizeArabic('  محمد   سالم  ')).toBe('محمد سالم');
  });
});
