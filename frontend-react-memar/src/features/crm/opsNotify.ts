/* نظام التنبيهات الصوتية والاحتفال — طبق أصل V42 ops-notify.js.
   • نغمات مولّدة عبر WebAudio (بدون ملفات صوت خارجية).
   • احتفال (Confetti + بانر) عند الفرصة الرابحة.
   • مفتاح تشغيل/إيقاف الصوت محفوظ في localStorage. */

const SOUND_KEY = 'memar_sound_enabled';

/** نغمات كل حالة: [تردد Hz, مدة ثانية] لكل نوتة. */
const TONES: Record<string, [number, number][]> = {
  notification: [[880, 0.12], [1174, 0.16]],
  win: [[523, 0.14], [659, 0.14], [784, 0.14], [1046, 0.34]],
  delay: [[440, 0.18], [392, 0.22]],
  late: [[330, 0.2], [294, 0.2], [247, 0.3]],
  urgent: [[988, 0.1], [0, 0.06], [988, 0.1], [0, 0.06], [988, 0.16]],
  success: [[659, 0.12], [880, 0.2]],
  error: [[311, 0.16], [233, 0.26]],
  reminder: [[784, 0.12], [988, 0.12], [784, 0.16]],
};

let audioCtx: AudioContext | null = null;
const lastPlayed: Record<string, number> = {};

export function isSoundEnabled(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) !== '0';
  } catch {
    return true;
  }
}

export function toggleSound(): boolean {
  const next = !isSoundEnabled();
  try {
    localStorage.setItem(SOUND_KEY, next ? '1' : '0');
  } catch { /* ignore */ }
  if (next) playSound('success');
  return next;
}

function ensureCtx(): AudioContext | null {
  if (audioCtx) return audioCtx;
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  try {
    audioCtx = new Ctor();
  } catch {
    audioCtx = null;
  }
  return audioCtx;
}

/** تشغيل نغمة تنبيه حسب النوع، مع throttle اختياري لمنع التكرار السريع. */
export function playSound(type: string, options: { throttleMs?: number } = {}): void {
  if (!isSoundEnabled()) return;
  const tones = TONES[type] || TONES.notification;
  const throttle = Number(options.throttleMs || 0);
  const now = Date.now();
  if (throttle && lastPlayed[type] && now - lastPlayed[type] < throttle) return;
  lastPlayed[type] = now;

  const ctx = ensureCtx();
  if (!ctx) return;
  if (ctx.state === 'suspended') ctx.resume().catch(() => {});

  let cursor = ctx.currentTime + 0.01;
  tones.forEach(([freq, dur]) => {
    if (!freq) { cursor += dur; return; }
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type === 'late' || type === 'error' ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(freq, cursor);
    gain.gain.setValueAtTime(0.0001, cursor);
    gain.gain.exponentialRampToValueAtTime(0.16, cursor + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, cursor + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(cursor);
    osc.stop(cursor + dur + 0.02);
    cursor += dur;
  });
}

const CONFETTI_COLORS = ['#1B6CA8', '#2D9B6F', '#E8A838', '#DC4A3D', '#7C3AED', '#0EA5E9'];

function ensureCelebrationStyles(): void {
  if (document.getElementById('crm-celebrate-styles')) return;
  const style = document.createElement('style');
  style.id = 'crm-celebrate-styles';
  style.textContent = `
  .crm-celebrate-layer { position:fixed; inset:0; pointer-events:none; z-index:12000; overflow:hidden; }
  .crm-confetti { position:absolute; top:-16px; width:9px; height:15px; border-radius:2px; opacity:.95; animation: crmConfettiFall linear forwards; }
  @keyframes crmConfettiFall { 0% { transform: translateY(-20px) rotate(0deg); opacity:1; } 100% { transform: translateY(105vh) rotate(760deg); opacity:.15; } }
  .crm-win-banner { position:fixed; top:16%; left:50%; transform:translate(-50%,-50%) scale(.7); background:linear-gradient(135deg,#2D9B6F,#1B6CA8); color:#fff; border-radius:18px; padding:20px 34px; text-align:center; z-index:12001; font-family:'Cairo',sans-serif; box-shadow:0 22px 60px rgba(15,23,42,.35); animation: crmWinPop .5s cubic-bezier(.2,1.4,.4,1) forwards; }
  .crm-win-banner .cwb-icon { font-size:40px; display:block; margin-bottom:6px; animation: crmWinSpin 1.5s ease-in-out infinite; }
  .crm-win-banner .cwb-title { font-size:19px; font-weight:900; }
  .crm-win-banner .cwb-sub { font-size:12.5px; font-weight:600; opacity:.92; margin-top:5px; }
  @keyframes crmWinPop { to { transform:translate(-50%,-50%) scale(1); } }
  @keyframes crmWinSpin { 0%,100%{ transform:rotate(-9deg) } 50%{ transform:rotate(9deg) scale(1.1) } }
  .crm-win-banner.cwb-out { animation: crmWinOut .45s ease forwards; }
  @keyframes crmWinOut { to { opacity:0; transform:translate(-50%,-90%) scale(.85); } }
  `;
  document.head.appendChild(style);
}

/** شكل احتفالي (Confetti + بانر) عند ربح الفرصة — طبق أصل celebrate. */
export function celebrate(title?: string, subtitle?: string): void {
  ensureCelebrationStyles();
  playSound('win');

  const layer = document.createElement('div');
  layer.className = 'crm-celebrate-layer';
  for (let i = 0; i < 70; i += 1) {
    const piece = document.createElement('div');
    piece.className = 'crm-confetti';
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.background = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
    piece.style.animationDuration = `${1.9 + Math.random() * 1.5}s`;
    piece.style.animationDelay = `${Math.random() * 0.7}s`;
    piece.style.height = `${10 + Math.random() * 11}px`;
    layer.appendChild(piece);
  }
  document.body.appendChild(layer);

  const banner = document.createElement('div');
  banner.className = 'crm-win-banner';
  banner.innerHTML = '<span class="cwb-icon">🏆</span>'
    + `<div class="cwb-title">${title || 'فرصة رابحة!'}</div>`
    + `<div class="cwb-sub">${subtitle || 'مبروك — تم نقل الفرصة إلى «صفقة رابحة»'}</div>`;
  document.body.appendChild(banner);

  setTimeout(() => { banner.classList.add('cwb-out'); setTimeout(() => banner.remove(), 480); }, 2600);
  setTimeout(() => layer.remove(), 4200);
}
