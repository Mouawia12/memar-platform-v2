import type { CSSProperties } from 'react';

/**
 * أنماط نشاط البطاقة المشتركة بين بطاقة المهمة وبطاقة المتابعة (طلب أيمن
 * 2026-08-29): التمييز، شارة التوجيه، وسطر التعليق وأيقونته. مصدر واحد كي لا
 * يتباعد شكل اللوحتين مع الوقت.
 */
export const CARD_ACTIVITY_STYLES = {
  // حلقة زرقاء + خلفية مائلة للأزرق: تُميّز بطاقتي بلا تغيير شريطها الجانبي.
  mineRing: { background: '#F7FBFF', borderColor: '#9DC4E4', boxShadow: '0 0 0 2px rgba(27,108,168,.30), 0 4px 12px rgba(27,108,168,.16)' },
  mineTag: { fontSize: '8.5px', fontWeight: 900, color: '#1B6CA8', background: '#E4F0FA', border: '1px solid #BFDBF0', borderRadius: '20px', padding: '1px 6px', whiteSpace: 'nowrap' },
  mineChip: { fontSize: '9.5px', fontWeight: 900, color: '#1B6CA8', background: '#E4F0FA', border: '1px solid #BFDBF0', borderRadius: '999px', padding: '1px 7px', whiteSpace: 'nowrap' },

  foot: { display: 'flex', gap: '4px', flexWrap: 'wrap', alignItems: 'center', marginTop: '6px' },
  chip: { fontSize: '9.5px', fontWeight: 800, padding: '2px 8px', borderRadius: '20px', whiteSpace: 'nowrap' },
  // الشارة زرّ: نُلغي مظهر الأزرار الافتراضي ونُبقي شكل الـchip.
  badgeBtn: { display: 'inline-flex', alignItems: 'center', gap: '4px', border: 'none', fontFamily: 'inherit', lineHeight: 1.6, padding: '2px 9px' },
  dot: { color: '#DC4A3D', fontSize: '8px', lineHeight: 1 },
  // تم الإرسال (أزرق) — وصلت ولم يُردّ؛ بانتظار ردّك (كهرماني) — عليّ أنا؛
  // تم الرد (أخضر) — أُغلقت الدورة.
  sentChip: { background: '#E4F0FA', color: '#1B6CA8' },
  awaitChip: { background: '#FEF3C7', color: '#92400E' },
  doneChip: { background: '#DCFCE7', color: '#166534' },
  directiveBtn: { fontSize: '9.5px', fontWeight: 800, lineHeight: 1, padding: '3px 8px', borderRadius: '20px', border: '1px solid #BFDBF0', background: '#EFF6FC', color: '#1B6CA8', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' },

  // سطر التوجيه نفسه (رأس الخيط): كهرمانيّ كنبرة «بانتظار الرد» في النافذة —
  // كان لا يظهر على البطاقة إطلاقًا حتى يردّ أحد، فالتوجيه الجديد يصل صامتًا
  // (طلب أيمن 2026-08-29). يظهر الآن دائمًا ما دام على البطاقة توجيه.
  directiveLine: { marginTop: '6px', background: '#FFFBEB', border: '1px solid #FDE9B4', borderInlineStart: '3px solid #E8A838', borderRadius: '8px', padding: '5px 7px', cursor: 'pointer' },

  // سطر آخر رسالة في خيط التوجيه: صاحبها وتاريخها ثم نصّها في سطرين.
  replyLine: { marginTop: '6px', background: '#F0FDF4', border: '1px solid #DCFCE7', borderInlineStart: '3px solid #86EFAC', borderRadius: '8px', padding: '5px 7px', cursor: 'pointer' },
  // رسالة لم أرَها بعد: كهرمانية كي تُقرأ لا أن تُنسى.
  replyLineNew: { background: '#FFFCF3', borderColor: '#FDE9B4', borderInlineStartColor: '#E8A838' },
  replyHead: { display: 'flex', alignItems: 'center', gap: '5px', fontSize: '9px', flexWrap: 'wrap' },
  replyDate: { color: '#94A3B8', fontWeight: 700 },
  replyNewTag: { color: '#92400E', background: '#FEF3C7', border: '1px solid #FCD34D', borderRadius: '999px', padding: '0 5px', fontWeight: 900 },
  replyBody: { display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', fontSize: '10px', color: '#475569', lineHeight: 1.6, marginTop: '2px', wordBreak: 'break-word' },
  // علامة الردّ الصغيرة على السطر — تفتح الخيط عند حقل الكتابة.
  replyMark: { marginInlineStart: 'auto', fontSize: '9px', fontWeight: 900, lineHeight: 1, padding: '2px 7px', borderRadius: '999px', border: '1px solid #BFDBF0', background: '#EFF6FC', color: '#1B6CA8', cursor: 'pointer', fontFamily: 'inherit', whiteSpace: 'nowrap' },
} satisfies Record<string, CSSProperties>;

/** ختم مختصر للبطاقة: «اليوم 14:20» / «أمس 14:20» / «12 أغسطس». */
export function shortStamp(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const time = d.toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' });
  const diffDays = Math.round((today - day) / 86_400_000);
  if (diffDays === 0) return `اليوم ${time}`;
  if (diffDays === 1) return `أمس ${time}`;

  return d.toLocaleDateString('ar', { day: 'numeric', month: 'short' });
}

/** التاريخ الكامل — في تلميح السطر وحده حيث تتّسع المساحة. */
export const fullStamp = (iso: string | null): string =>
  iso ? new Date(iso).toLocaleString('ar', { dateStyle: 'medium', timeStyle: 'short' }) : '';

/**
 * في وضع «مهامي مميزة» وحده: ما يخصّ غيري يخفت فتبرز مهامي فوقه
 * (طلب أيمن 2026-09-09). في «جميع المهام» لا يخفت شيء — الكلّ سواء.
 */
export const OTHERS_MUTED: CSSProperties = { opacity: 0.5, filter: 'saturate(0.55)' };
