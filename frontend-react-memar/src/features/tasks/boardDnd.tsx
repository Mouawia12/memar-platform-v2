import { useDraggable, useDroppable } from '@dnd-kit/core';
import type { CSSProperties, ReactNode } from 'react';

/*
 * سحب البطاقات في لوحتَي المهام والمتابعة — نفس نمط لوحة الفرص في CRM:
 * الإفلات على العمود ينقل البطاقة إليه، والإفلات فوق بطاقة أخرى في العمود
 * نفسه يرفعها أو ينزلها إلى مكانها (طلب 2026-09-15).
 */

/** بطاقة تُسحب وتستقبل إفلات غيرها فوقها (لإعادة الترتيب). */
export function SortableCard({ id, children }: { id: number; children: ReactNode }) {
  const { attributes, listeners, setNodeRef: setDrag, isDragging } = useDraggable({ id });
  const { setNodeRef: setDrop, isOver } = useDroppable({ id });
  const ref = (node: HTMLElement | null) => { setDrag(node); setDrop(node); };

  return (
    <div ref={ref} {...attributes} {...listeners} style={{ ...cardWrap, ...(isDragging ? dragging : isOver ? dropTarget : null) }}>
      {children}
    </div>
  );
}

/**
 * ترتيب العمود بعد إفلات `activeId` فوق `overId` — نقل عنصر لا تبديل جارَين:
 * النازل يستقرّ بعد البطاقة المُفلَت عليها، والصاعد قبلها.
 * يُرجع null إن لم يتغيّر شيء.
 */
export function reorderedIds(colIds: number[], activeId: number, overId: number): number[] | null {
  const from = colIds.indexOf(activeId);
  const to = colIds.indexOf(overId);
  if (from === -1 || to === -1 || from === to) return null;
  const ids = [...colIds];
  ids.splice(from, 1);
  ids.splice(to, 0, activeId);

  return ids;
}

/** يطبّق ترتيب عمود على القائمة كاملة: أعضاء العمود يتبعون orderedIds في أماكنهم نفسها. */
export function applyOrder<T extends { id: number }>(list: T[], orderedIds: number[]): T[] {
  const inCol = new Set(orderedIds);
  const byId = new Map(list.map((x) => [x.id, x]));
  const reordered = orderedIds.map((id) => byId.get(id)).filter((x): x is T => !!x);
  let k = 0;

  return list.map((x) => (inCol.has(x.id) && k < reordered.length ? reordered[k++] : x));
}

const cardWrap: CSSProperties = { cursor: 'grab', touchAction: 'pan-x pan-y', borderRadius: '10px', transition: 'outline .12s ease' };
const dragging: CSSProperties = { opacity: 0.45 };
// خطّ منقّط حول البطاقة التي سيستقرّ فوقها الكرت المسحوب.
const dropTarget: CSSProperties = { outline: '2px dashed #1B6CA8', outlineOffset: '2px', background: 'rgba(27,108,168,.06)' };
