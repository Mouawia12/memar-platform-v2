import {
  ArcElement,
  BarElement,
  CategoryScale,
  Chart,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
} from 'chart.js';

/**
 * تسجيل مكوّنات Chart.js مرّة واحدة + الإعدادات المشتركة لكل رسوم النظام
 * (خط Cairo، شبكة فاتحة، بلا نِسَب ثابتة) — بنفس هوية تقارير معمار.
 */
Chart.register(
  ArcElement, BarElement, LineElement, PointElement,
  CategoryScale, LinearScale, Filler, Legend, Tooltip,
);

Chart.defaults.font.family = 'Cairo, system-ui, sans-serif';
Chart.defaults.font.size = 11;
Chart.defaults.color = '#5A6478';

/** ألوان النظام — تُستعمل في كل الرسوم لتبقى القراءة موحّدة. */
export const CHART_COLORS = {
  navy: '#274A78',
  blue: '#1B6CA8',
  green: '#2D9B6F',
  red: '#DC4A3D',
  orange: '#D97706',
  purple: '#7C3AED',
  sky: '#0284C7',
  grey: '#94A3B8',
} as const;

export const PALETTE = Object.values(CHART_COLORS);

const GRID = '#F1F5F9';

/**
 * خيارات أساسية تُنشر في كل رسم: يملأ حاويته، وبلا شبكة على المحور الأفقي.
 * بلا وسم نوع حتى تندمج مع خيارات أي نوع رسم (bar/line) دون تعارض.
 */
export const baseOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { labels: { boxWidth: 12, padding: 10 } } },
  scales: {
    x: { grid: { display: false } },
    y: { grid: { color: GRID }, beginAtZero: true },
  },
};

/** تنسيق مبالغ محور القيم بالآلاف (1500 → 1.5k) كما في النسخة القديمة. */
export const kwdTick = (value: string | number): string => {
  const n = Number(value);

  return Math.abs(n) >= 1000 ? `${n / 1000}k` : String(n);
};
