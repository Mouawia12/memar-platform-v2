import DOMPurify from 'dompurify';

/**
 * تنقية HTML قبل حقنه في الصفحة.
 *
 * المستندات المولّدة (`body_html`) يكتبها موظف يملك `documents.manage` — وهي صلاحية
 * يحملها دور «الموظف» الأساسي وأغلب الأدوار المهنية — ثم تُعرض في **بوابة العميل**.
 * بلا تنقية يستطيع أي موظف تنفيذ JS في متصفح العميل وسرقة توكنه من localStorage.
 * القائمة البيضاء هنا تغطّي ما ينتجه محرّر النصوص (RichTextEditor) وقوالب العقود،
 * ولا شيء غيره: لا <script> ولا <iframe> ولا معالجات on*.
 */
const ALLOWED_TAGS = [
  'p', 'br', 'hr', 'div', 'span',
  'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'b', 'strong', 'i', 'em', 'u', 's', 'sub', 'sup', 'small', 'mark',
  'ul', 'ol', 'li', 'blockquote', 'pre', 'code',
  'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'caption', 'colgroup', 'col',
  'a', 'img', 'figure', 'figcaption',
];

const ALLOWED_ATTR = [
  'href', 'title', 'target', 'rel',
  'src', 'alt', 'width', 'height',
  'colspan', 'rowspan', 'align', 'dir', 'lang',
  'style', 'class',
];

/** ينظّف HTML المستند ويُعيد نصًّا آمنًا للحقن. */
export function sanitizeHtml(html: string | null | undefined): string {
  if (!html) return '';

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    // لا بروتوكولات تنفيذية (javascript:, data: على الوسوم التفاعلية)
    ALLOWED_URI_REGEXP: /^(?:https?:|mailto:|tel:|#|\/)/i,
    FORBID_TAGS: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
    FORBID_ATTR: ['onerror', 'onload', 'onclick', 'formaction', 'srcdoc'],
  });
}

/** يهرّب نصًّا عاديًّا ليُدرج داخل HTML (للعناوين ونحوها). */
export function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';

  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
