import { describe, expect, it } from 'vitest';

import { escapeHtml, sanitizeHtml } from './sanitizeHtml';

/**
 * الحارس الأخير قبل حقن مستند كتبه موظف في بوابة العميل.
 * كل حالة هنا كانت تُنفَّذ في متصفّح العميل قبل إضافة التنقية.
 */
describe('sanitizeHtml', () => {
  it('يُسقط وسم script', () => {
    expect(sanitizeHtml('<p>عقد</p><script>alert(1)</script>')).toBe('<p>عقد</p>');
  });

  it('يُسقط معالجات الأحداث ويُبقي الصورة', () => {
    const out = sanitizeHtml('<img src="/logo.png" onerror="fetch(\'//evil.kw\')">');
    expect(out).not.toContain('onerror');
    expect(out).toContain('src="/logo.png"');
  });

  it('يمنع روابط javascript:', () => {
    expect(sanitizeHtml('<a href="javascript:alert(1)">اضغط</a>')).not.toContain('javascript:');
  });

  it('يُسقط iframe وobject', () => {
    const out = sanitizeHtml('<iframe src="//evil.kw"></iframe><object data="x"></object>');
    expect(out).not.toContain('<iframe');
    expect(out).not.toContain('<object');
  });

  it('يُسقط svg/onload المتخفّي', () => {
    expect(sanitizeHtml('<svg><animate onbegin="alert(1)" /></svg>')).not.toContain('onbegin');
  });

  it('يُبقي تنسيق العقود كما هو', () => {
    const contract = '<h1>عقد استشارة</h1><p><strong>العميل:</strong> فهد العنزي</p>'
      + '<table><tr><td>الدفعة الأولى</td><td>2500 د.ك</td></tr></table>';

    const out = sanitizeHtml(contract);

    expect(out).toContain('<h1>عقد استشارة</h1>');
    expect(out).toContain('<strong>العميل:</strong> فهد العنزي');
    expect(out).toContain('<td>2500 د.ك</td>');
    // tbody يضيفه محلّل HTML نفسه للجداول — لا فقدان محتوى.
    expect(out).toContain('<tbody>');
  });

  it('يُبقي الروابط والبريد المشروعة', () => {
    expect(sanitizeHtml('<a href="https://memar.kw">معمار</a>')).toContain('href="https://memar.kw"');
    expect(sanitizeHtml('<a href="mailto:info@memar.kw">راسلنا</a>')).toContain('mailto:');
  });

  it('يتحمّل القيم الفارغة', () => {
    expect(sanitizeHtml(null)).toBe('');
    expect(sanitizeHtml(undefined)).toBe('');
    expect(sanitizeHtml('')).toBe('');
  });
});

describe('escapeHtml', () => {
  it('يهرّب عنوان المستند فلا يكسر نافذة الطباعة', () => {
    expect(escapeHtml('عقد</title><script>alert(1)</script>'))
      .toBe('عقد&lt;/title&gt;&lt;script&gt;alert(1)&lt;/script&gt;');
  });

  it('يترك النص العربي العادي مقروءًا', () => {
    expect(escapeHtml('عقد فيلا الشعب')).toBe('عقد فيلا الشعب');
  });
});
