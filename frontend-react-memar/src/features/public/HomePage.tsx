import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { LoginView } from '../auth/components/LoginView';
import { ChatWidget } from '../chatbot/components/ChatWidget';
import cssText from './homepage.css?raw';
import htmlText from './homepage.html?raw';
import { initHomepage } from './homepageInteractions';

/**
 * الصفحة الرئيسية العامة — منقولة طبق الأصل عن الموقع القديم
 * (نفس الـHTML والـCSS)، مع نافذة دخول منبثقة ومساعد ذكي ضمن React.
 */
export function HomePage() {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'homepage-legacy-css';
    style.textContent = cssText;
    document.head.appendChild(style);

    const cleanupInteractions = initHomepage((path) => navigate(path), () => setAuthOpen(true));

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

  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <div ref={ref} dangerouslySetInnerHTML={{ __html: htmlText }} />

      {/* نافذة تسجيل الدخول المنبثقة */}
      {authOpen && (
        <div style={authOverlay} onClick={() => setAuthOpen(false)}>
          <div style={authModal} onClick={(e) => e.stopPropagation()}>
            <LoginView onClose={() => setAuthOpen(false)} />
          </div>
        </div>
      )}

      {/* مساعد معمار الذكي — يمين الصفحة (أزرار الموقع العائمة على اليسار) */}
      <ChatWidget side="right" />
    </>
  );
}

const authOverlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(10,25,45,0.55)', backdropFilter: 'blur(3px)', display: 'grid', placeItems: 'center', zIndex: 10000, padding: '20px' };
const authModal: CSSProperties = { width: '960px', maxWidth: '100%', height: '580px', maxHeight: '92vh', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.35)' };
