/**
 * تفاعلات الصفحة الرئيسية — منقولة من الموقع القديم (website/index.html)
 * تُثبّت دوالًا عامّة على window يستدعيها الـHTML عبر onclick، وتُنظَّف عند الإلغاء.
 */

type Nav = (path: string) => void;

const DURATIONS: Record<string, number> = { residential: 60, investment: 90, commercial: 90, industrial: 90, hotel: 120 };
const TYPE_LABELS: Record<string, string> = { residential: 'سكن خاص', investment: 'استثماري', commercial: 'تجاري', industrial: 'صناعي', hotel: 'فندقي' };
const SVC_LABELS: Record<string, string> = { full: 'باقة شاملة', design: 'تصميم معماري', license: 'تراخيص', supervision: 'إشراف هندسي', facade: 'تصميم واجهة', interior: 'تصميم داخلي', survey: 'رفع قياسات', consulting: 'استشارة' };

// نموذج تسعير مبسّط مطابق في السلوك لمحرك ERP القديم (تقديري)
const RATE: Record<string, number> = { full: 3.2, design: 1.3, license: 0, supervision: 1.6, facade: 0, interior: 1.9, survey: 0, consulting: 0 };
const FIXED: Record<string, number> = { license: 400, facade: 300, survey: 120, consulting: 50 };
const CAT: Record<string, number> = { residential: 1.0, investment: 1.15, commercial: 1.25, industrial: 0.9, hotel: 1.35 };

const WHATSAPP = '96566227785';

function $(id: string): HTMLElement | null {
  return document.getElementById(id);
}
function val(id: string): string {
  const el = $(id) as HTMLInputElement | HTMLSelectElement | null;
  return el ? el.value : '';
}

export function initHomepage(navigate: Nav, onAuthPopup?: () => void): () => void {
  const w = window as unknown as Record<string, unknown>;
  let currentPricingMode: string | null = null;

  // ── تمرير سلس لعنصر عبر محدّد (يستبدل window.scrollTo مؤقتًا) ──
  const originalScrollTo = window.scrollTo.bind(window);
  const scrollToImpl = (arg: unknown, y?: number) => {
    if (typeof arg === 'string') {
      document.querySelector(arg)?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    // @ts-expect-error تمرير الأصل
    return originalScrollTo(arg as never, y as never);
  };

  const setDisplay = (id: string, display: string) => { const el = $(id); if (el) el.style.display = display; };

  // ── محرك التسعير ──
  function selectPricingMode(mode: string) {
    currentPricingMode = mode;
    if (mode === 'instant') {
      setDisplay('pricing-mode-selection', 'none');
      setDisplay('pricing-login-container', 'none');
      setDisplay('instant-pricing-details', 'block');
      setDisplay('step1-err', 'none');
    } else {
      setDisplay('pricing-mode-selection', 'none');
      setDisplay('instant-pricing-details', 'none');
      setDisplay('pricing-login-container', 'block');
      setDisplay('step1-err', 'none');
    }
  }
  function startInstantPricing() {
    const name = val('c-name').trim();
    const phone = val('c-phone').trim();
    const err = $('step1-err');
    if (!name || !phone) {
      if (err) { err.innerText = '⚠️ يرجى إدخال الاسم ورقم الهاتف للمتابعة'; err.style.display = 'block'; }
      return;
    }
    if (err) err.style.display = 'none';
    goStep(2);
  }
  function resetPricingMode() {
    currentPricingMode = null;
    setDisplay('pricing-login-container', 'none');
    setDisplay('instant-pricing-details', 'none');
    setDisplay('pricing-mode-selection', 'block');
  }

  function onTypeChange() {
    const t = val('p-type');
    const fi = $('p-floors') as HTMLInputElement | null;
    if (!fi) return;
    if (t === 'residential') { fi.max = '3'; if (Number(fi.value) > 3) fi.value = '3'; }
    else fi.max = '100';
  }
  function syncFloors() {
    const t = val('p-type');
    const fi = $('p-floors') as HTMLInputElement | null;
    if (fi && t === 'residential' && Number(fi.value) > 3) fi.value = '3';
  }
  function toggleAddons() {
    const el = $('m-addons-list');
    if (el) el.style.display = el.style.display === 'none' ? 'flex' : 'none';
  }
  function updateAddonsLabel() {
    const boxes = document.querySelectorAll('#m-addons-list input[type="checkbox"]:checked');
    const label = $('m-addons-label');
    if (label) label.textContent = boxes.length > 0 ? `تم اختيار (${boxes.length}) خدمات` : 'اختر الخدمات الإضافية...';
  }

  function calcPrice(): { price: number } | null {
    const pType = val('p-type'); const pSvc = val('p-service');
    const area = parseFloat(val('p-area')) || 0;
    if (!pType || !pSvc || !area) return null;
    const floors = parseInt(val('p-floors')) || 1;
    const basement = val('p-basement');
    const addSup = ($('add-supervision') as HTMLInputElement | null)?.checked;
    const addInt = ($('add-interior') as HTMLInputElement | null)?.checked;
    const addFire = ($('add-fire') as HTMLInputElement | null)?.checked;
    const addElec = ($('add-electric') as HTMLInputElement | null)?.checked;

    let price = (RATE[pSvc] || 0) * area + (FIXED[pSvc] || 0);
    price *= CAT[pType] || 1;
    price *= 1 + Math.max(0, floors - 1) * 0.05;
    if (basement === 'yes') price *= 1.08;
    if (addSup && pSvc !== 'supervision' && pSvc !== 'full') price += area * 1.4;
    if (addInt && pSvc !== 'interior') price += area * 1.6;
    if (addFire) price += 250;
    if (addElec) price += 150;
    price += 150; // رسوم حكومية تقديرية
    return { price: Math.max(50, Math.round(price)) };
  }

  function goStep(n: number) {
    if (n === 2 && !currentPricingMode) { setDisplay('step1-err', 'block'); return; }
    if (n === 2) setDisplay('step1-err', 'none');
    if (n === 3) {
      if (!val('p-type') || !val('p-service') || !val('p-area')) { setDisplay('step2-err', 'block'); return; }
      setDisplay('step2-err', 'none');
      generateQuote();
    }
    [1, 2, 3].forEach((i) => {
      $(`panel${i}`)?.classList.toggle('active', i === n);
      const tab = $(`tab${i}`);
      if (tab) { tab.classList.toggle('active', i === n); if (i < n) tab.classList.add('done'); else tab.classList.remove('done'); }
    });
  }

  function generateQuote() {
    const name = val('c-name'); const pType = val('p-type'); const pSvc = val('p-service'); const area = val('p-area');
    const floors = val('p-floors'); const basement = val('p-basement');
    const qNum = 'MEQ-' + Date.now().toString().slice(-6);
    const set = (id: string, txt: string) => { const el = $(id); if (el) el.textContent = txt; };
    set('q-client-name', name); set('q-number', qNum); set('q-area', area + ' م²');
    let tStr = `${TYPE_LABELS[pType] || pType} – ${SVC_LABELS[pSvc] || pSvc} (${floors} أدوار`;
    tStr += pType === 'residential' ? (basement === 'yes' ? ' مع سرداب)' : ' بدون سرداب)') : ')';
    set('q-project-type', tStr);
    set('q-type-badge', TYPE_LABELS[pType] || pType);
    set('q-service-badge', SVC_LABELS[pSvc] || pSvc);
    set('q-duration', (DURATIONS[pType] || 90) + ' يوم تقريباً');

    const result = calcPrice();
    const priceEl = $('q-price');
    if (result && result.price && priceEl) {
      priceEl.innerHTML = result.price + '<span> د.ك</span>';
      set('p1', Math.round(result.price * 0.4) + ' د.ك');
      set('p2', Math.round(result.price * 0.3) + ' د.ك');
      set('p3', Math.round(result.price * 0.3) + ' د.ك');
    }
    const grid = document.querySelector('.qr-details-grid') as HTMLElement | null;
    const pays = document.querySelector('.qr-payments') as HTMLElement | null;
    if (currentPricingMode === 'instant') { if (grid) grid.style.display = 'none'; if (pays) pays.style.display = 'none'; }
    else { if (grid) grid.style.display = 'grid'; if (pays) pays.style.display = 'block'; }
  }

  function acceptQuote() {
    const name = val('c-name'); const phone = val('c-phone');
    alert(`شكراً ${name}!\nسيتواصل معك فريقنا على الرقم ${phone} لاستكمال إجراءات التعاقد.`);
  }
  function discussQuote() {
    $('panel3')?.classList.remove('active');
    $('panel-auth-discuss')?.classList.add('active');
  }
  function cancelDiscussAuth() {
    $('panel-auth-discuss')?.classList.remove('active');
    $('panel3')?.classList.add('active');
  }
  function sendWhatsApp() {
    const name = val('c-name');
    const price = $('q-price')?.textContent || '';
    const t = $('q-project-type')?.textContent || '';
    const msg = `مرحباً، أنا ${name}. حصلت على عرض سعر فوري من الموقع:\nالمشروع: ${t}\nالسعر التقديري: ${price}\nأرغب بمناقشة التفاصيل.`;
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(msg)}`, '_blank');
  }
  function downloadPDF() {
    alert('سيتم إرسال نسخة PDF من عرض السعر إلى هاتفك بعد التواصل مع الفريق.');
  }

  // ── معرض الأعمال — فلترة ──
  function filterPortfolio(cat: string, btn: HTMLElement) {
    document.querySelectorAll('.filter-btn').forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');
    document.querySelectorAll<HTMLElement>('.portfolio-card').forEach((card) => {
      card.style.display = cat === 'all' || card.dataset.cat === cat ? '' : 'none';
    });
  }

  // ── الاجتماعات ──
  function selectMeet(el: HTMLElement, type: string) {
    document.querySelectorAll('.meet-type').forEach((m) => m.classList.remove('active'));
    el.classList.add('active');
    const label = $('meet-type-label');
    if (label) label.textContent = type;
  }
  function bookMeetingSubmit() {
    const name = val('meet-name'); const phone = val('meet-phone');
    if (!name || !phone) { alert('يرجى إدخال الاسم ورقم الهاتف'); return; }
    setDisplay('meet-success', 'block');
  }
  function sendMessage() {
    const phone = val('msg-phone');
    if (!phone) { alert('يرجى إدخال رقم الهاتف للتواصل'); return; }
    alert('✅ تم إرسال رسالتك بنجاح! سنتواصل معك في أقرب وقت.');
    const b = $('msg-body') as HTMLTextAreaElement | null; if (b) b.value = '';
  }

  // ── أزرار عائمة ──
  function togglePNav() {
    const m = $('pnav-menu');
    if (m) m.style.display = m.style.display === 'flex' ? 'none' : 'flex';
  }
  function toggleTheme() {
    document.documentElement.classList.toggle('theme-premium');
  }
  function toggleAuthPopup() {
    if (onAuthPopup) onAuthPopup();
    else navigate('/login');
  }

  // ── مستمعو الإغلاق عند النقر خارج القوائم ──
  const outsideClick = (e: MouseEvent) => {
    const target = e.target as Node;
    const box = $('m-addons-box'); const list = $('m-addons-list');
    if (box && list && !box.contains(target) && !list.contains(target)) list.style.display = 'none';
    const pBtn = document.querySelector('#float-extras button'); const pMenu = $('pnav-menu');
    if (pBtn && pMenu && !pBtn.contains(target) && !pMenu.contains(target)) pMenu.style.display = 'none';
  };
  document.addEventListener('click', outsideClick);

  // ── تثبيت الدوال على window (يستدعيها الـHTML عبر onclick) ──
  const fns: Record<string, unknown> = {
    scrollTo: scrollToImpl,
    selectPricingMode, startInstantPricing, resetPricingMode,
    onTypeChange, syncFloors, toggleAddons, updateAddonsLabel, updatePricing: () => {},
    goStep, generateQuote, calcPrice, acceptQuote, discussQuote, cancelDiscussAuth,
    sendWhatsApp, downloadPDF, filterPortfolio, selectMeet, bookMeetingSubmit, sendMessage,
    togglePNav, toggleTheme, toggleAuthPopup,
  };
  const prev: Record<string, unknown> = {};
  Object.keys(fns).forEach((k) => { prev[k] = w[k]; w[k] = fns[k]; });

  // ── التنظيف ──
  return () => {
    document.removeEventListener('click', outsideClick);
    window.scrollTo = originalScrollTo;
    Object.keys(fns).forEach((k) => { w[k] = prev[k]; });
    document.documentElement.classList.remove('theme-premium');
  };
}
