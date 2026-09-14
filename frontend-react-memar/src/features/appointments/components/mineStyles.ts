import type { CSSProperties } from 'react';

/**
 * تمييز «موعدي/اجتماعي» وسط مواعيد الفريق (طلب أيمن 2026-08-31) — بنفس لغة
 * بطاقات المهام: حلقة زرقاء ووسم لما يخصّني، وتخفيفٌ لما يخصّ غيري.
 * مصدر واحد للوحة المواعيد والاجتماعات والجدول كي لا يتباعد الشكل.
 */
export const MINE_RING: CSSProperties = {
  background: '#F7FBFF',
  borderColor: '#9DC4E4',
  boxShadow: '0 0 0 2px rgba(27,108,168,.30), 0 4px 12px rgba(27,108,168,.16)',
};

export const MINE_TAG: CSSProperties = {
  fontSize: '9px',
  fontWeight: 900,
  color: '#1B6CA8',
  background: '#E4F0FA',
  border: '1px solid #BFDBF0',
  borderRadius: '20px',
  padding: '1px 7px',
  whiteSpace: 'nowrap',
};

/** ما يخصّ غيري يخفت ليبرز ما يخصّني فوقه — ويعود بالمرور بالمؤشّر. */
export const OTHERS_MUTED: CSSProperties = { opacity: 0.55, filter: 'saturate(0.6)' };

/** حلقة خفيفة للصفوف داخل بطاقة واحدة (الشريط الجانبي والسجل). */
export const MINE_ROW: CSSProperties = {
  background: '#F7FBFF',
  borderInlineStart: '3px solid #1B6CA8',
  borderRadius: '8px',
  paddingInlineStart: '8px',
};
