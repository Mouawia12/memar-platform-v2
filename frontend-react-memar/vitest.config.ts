import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

// إعداد اختبارات الواجهة (vitest + jsdom) — منفصل عن vite.config.ts لتفادي تعارض أنواع vite المتداخلة.
// الهدف: التقاط أخطاء الرندر مثل حلقات إعادة الرندر اللانهائية (انحدار توجيه الصفحات في CRM).
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
  },
});
