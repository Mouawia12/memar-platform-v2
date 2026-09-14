import { useEffect, type RefObject } from 'react';

const EDGE_ZONE = 96;
const EDGE_SLACK = 40;
const MIN_STEP = 6;
const MAX_STEP = 26;

/**
 * تمرير أفقي تلقائي عند اقتراب المؤشّر من حافّتَي الحاوية — لا يلزم إصابة شريط
 * التمرير، وكلما اقترب المؤشّر من الحافة زادت السرعة. الاستماع على window
 * ليعمل أثناء سحب البطاقات أيضًا (طبقة السحب تلتقط أحداث المؤشّر).
 */
export function useEdgeAutoScroll(ref: RefObject<HTMLElement | null>, enabled = true) {
  useEffect(() => {
    if (!enabled) return;

    let step = 0;
    let timer: number | null = null;
    const stop = () => { step = 0; if (timer) { window.clearInterval(timer); timer = null; } };

    const onMove = (e: PointerEvent) => {
      const el = ref.current;
      if (!el) { stop(); return; }
      const r = el.getBoundingClientRect();
      if (e.clientY < r.top || e.clientY > r.bottom) { stop(); return; }

      const fromLeft = e.clientX - r.left;
      const fromRight = r.right - e.clientX;
      let v = 0;
      if (fromLeft > -EDGE_SLACK && fromLeft < EDGE_ZONE) v = -(MIN_STEP + (1 - Math.max(0, fromLeft) / EDGE_ZONE) * (MAX_STEP - MIN_STEP));
      else if (fromRight > -EDGE_SLACK && fromRight < EDGE_ZONE) v = MIN_STEP + (1 - Math.max(0, fromRight) / EDGE_ZONE) * (MAX_STEP - MIN_STEP);

      if (v === 0) { stop(); return; }
      step = v;
      // scrollBy أفقي فيزيائي — يعمل في RTL وLTR سواء.
      if (!timer) timer = window.setInterval(() => { if (ref.current && step !== 0) ref.current.scrollBy({ left: step }); }, 16);
    };

    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerleave', stop);
    window.addEventListener('blur', stop);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerleave', stop);
      window.removeEventListener('blur', stop);
      stop();
    };
  }, [ref, enabled]);
}
