import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import cssText from './homepage.css?raw';
import htmlText from './homepage.html?raw';
import { initHomepage } from './homepageInteractions';

/**
 * الصفحة الرئيسية العامة — منقولة طبق الأصل عن الموقع القديم
 * (نفس الـHTML والـCSS)، مع ربط أزرار الدخول بمنصة React وبرمجة التفاعلات.
 */
export function HomePage() {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // حقن ستايل الموقع القديم (مقصور على وجود الصفحة فقط)
    const style = document.createElement('style');
    style.id = 'homepage-legacy-css';
    style.textContent = cssText;
    document.head.appendChild(style);

    // تفعيل التفاعلات (تسعير، فلترة، اجتماعات، وضع ليلي…)
    const cleanupInteractions = initHomepage((path) => navigate(path));

    // اعتراض روابط المنصة الداخلية لتعمل ضمن الـSPA
    const container = ref.current;
    const onClick = (e: MouseEvent) => {
      const anchor = (e.target as HTMLElement).closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href') ?? '';
      if (href.startsWith('/') && !href.startsWith('//')) {
        e.preventDefault();
        navigate(href);
      }
    };
    container?.addEventListener('click', onClick);

    return () => {
      container?.removeEventListener('click', onClick);
      cleanupInteractions();
      document.getElementById('homepage-legacy-css')?.remove();
    };
  }, [navigate]);

  // eslint-disable-next-line react/no-danger
  return <div ref={ref} dangerouslySetInnerHTML={{ __html: htmlText }} />;
}
