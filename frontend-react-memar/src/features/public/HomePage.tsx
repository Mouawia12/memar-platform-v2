import { type CSSProperties, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';

import { isClientOnly } from '../../config/nav';
import { useAuthStore } from '../../store/auth';
import { LoginView } from '../auth/components/LoginView';
import { ChatWidget } from '../chatbot/components/ChatWidget';
import animCssText from './homepageAnimations.css?raw';
import cssText from './homepage.css?raw';
import htmlText from './homepage.html?raw';
import { initHomepage } from './homepageInteractions';
import { PublicForumSection } from './PublicForumSection';

/**
 * الصفحة الرئيسية العامة — منقولة طبق الأصل عن الموقع القديم
 * (نفس الـHTML والـCSS)، مع نافذة دخول منبثقة ومساعد ذكي ضمن React.
 */
export function HomePage() {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [forumMount, setForumMount] = useState<HTMLElement | null>(null);
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    const style = document.createElement('style');
    style.id = 'homepage-legacy-css';
    style.textContent = cssText + '\n' + animCssText;
    document.head.appendChild(style);

    // زر الدخول واعٍ بالجلسة: المسجَّل يُوجَّه للوحته، وغير المسجَّل تُفتح له نافذة الدخول.
    const openAuthOrPortal = () => {
      const a = useAuthStore.getState();
      if (a.token && a.user) navigate(isClientOnly(a.user.roles) ? '/client-portal' : '/dashboard');
      else setAuthOpen(true);
    };
    const cleanupInteractions = initHomepage((path) => navigate(path), openAuthOrPortal);

    // نقطة تثبيت قسم المنتدى العام داخل الـHTML المحقون (بند 9)
    setForumMount(ref.current?.querySelector<HTMLElement>('#public-forum-mount') ?? null);

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

  // إصلاح خلل الجلسة (طلب أيمن 2026-08-07): الزائر المسجَّل يجب ألّا يرى «تسجيل الدخول»
  // كأنه خرج. نبدّل نصّ الزر ووجهته للوحته، ونعيد التطبيق عبر MutationObserver لأن سكربت
  // اللاندنغ القديم قد يعيد بناء الهيدر. يعمل فور توفّر بيانات المستخدم (بعد الترطيب).
  useEffect(() => {
    const root = ref.current;
    if (!root || !token || !user) return;
    const dest = isClientOnly(user.roles) ? '/client-portal' : '/dashboard';
    const apply = () => {
      root.querySelectorAll<HTMLButtonElement>('#btn-login').forEach((btn) => {
        if (btn.dataset.authAware !== '1') { btn.textContent = '🏠 الدخول إلى لوحتي'; btn.dataset.authAware = '1'; }
      });
      root.querySelectorAll<HTMLAnchorElement>('a[href="/login"]').forEach((a) => { a.href = dest; });
    };
    apply();
    const obs = new MutationObserver(apply);
    obs.observe(root, { childList: true, subtree: true });
    const t = window.setTimeout(() => obs.disconnect(), 3000); // يكفي لاستقرار الحقن
    return () => { obs.disconnect(); window.clearTimeout(t); };
  }, [token, user]);

  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <div ref={ref} dangerouslySetInnerHTML={{ __html: htmlText }} />

      {/* منتدى المجتمع — يُعرض داخل نقطة التثبيت في اللاندنج (بند 9) */}
      {forumMount && createPortal(<PublicForumSection />, forumMount)}

      {/* نافذة تسجيل الدخول المنبثقة — بنفس أنيميشن الأصل (popIn) */}
      {authOpen && (
        <div style={authOverlay} onClick={() => setAuthOpen(false)}>
          <style>{popInCss}</style>
          <div style={authModal} className="memar-auth-pop" onClick={(e) => e.stopPropagation()}>
            <LoginView onClose={() => setAuthOpen(false)} />
          </div>
        </div>
      )}

      {/* مساعد معمار الذكي — يمين الصفحة (أزرار الموقع العائمة على اليسار) */}
      <ChatWidget side="right" />
    </>
  );
}

/** أنيميشن الانبثاق — نفس منحنى وتوقيت الأصل (auth-popup / popIn). */
const popInCss = `
@keyframes memarPopIn {
  from { opacity: 0; transform: scale(.95) translateY(-10px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}
@keyframes memarFadeIn { from { opacity: 0 } to { opacity: 1 } }
.memar-auth-pop { animation: memarPopIn .2s cubic-bezier(0.1, 0.8, 0.2, 1); transform-origin: top center; }
`;

const authOverlay: CSSProperties = { position: 'fixed', inset: 0, background: 'rgba(10,25,45,0.55)', backdropFilter: 'blur(3px)', display: 'grid', placeItems: 'center', zIndex: 10000, padding: '20px', animation: 'memarFadeIn .18s ease' };
const authModal: CSSProperties = { width: '960px', maxWidth: '100%', height: '580px', maxHeight: '92vh', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 24px 60px rgba(0,0,0,0.35)' };
