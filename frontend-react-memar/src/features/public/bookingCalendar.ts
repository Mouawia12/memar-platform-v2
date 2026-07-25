/**
 * تقويم حجز موعد مناقشة السعر — منقول عن محرك التسعير القديم (renderPECalendar)
 * لكن مربوطًا بالخلفية: يقرأ الفتحات المتاحة فعليًا ويحجز موعدًا حقيقيًا في الجدول،
 * فيُمنع تعارض موعدين على الساعة نفسها.
 *
 * يُركَّب داخل عنصر واحد ويُدير حالته بنفسه؛ يُعاد استدعاؤه لإعادة الرسم.
 */

import { apiGet, apiPost, apiErrorMessage } from '../../lib/api';

interface Hour {
  hour: number;
  label: string;
  available: boolean;
}

interface Day {
  date: string;
  day_name: string;
  day_month: string;
  is_holiday: boolean;
  is_past: boolean;
  is_short: boolean;
  has_availability: boolean;
  hours: Hour[];
}

interface WeekData {
  week_offset: number;
  can_go_back: boolean;
  can_go_forward: boolean;
  label: string;
  days: Day[];
  formats: { value: string; label: string }[];
}

interface BookingResult {
  reference: string;
  day_label: string;
  hour_label: string;
  format_label: string;
}

export interface BookingOptions {
  /** يعيد الاسم/الهاتف المُدخلين مسبقًا في نموذج التسعير (إن وُجدا). */
  getContact: () => { name: string; phone: string };
  /** زر الرجوع لعرض السعر. */
  onBack: () => void;
}

/** حالة داخلية للتقويم — لا تتسرّب خارج الوحدة. */
interface State {
  weekOffset: number;
  format: string | null;
  selectedDate: string | null;
  selectedHour: number | null;
  week: WeekData | null;
  loading: boolean;
}

const C = {
  border: '#E5E7EB',
  navy: '#1B6CA8',
  navyDark: '#0D4A7A',
  text: '#374151',
  muted: '#6B7280',
  holiday: '#FEF3C7',
  disabled: '#F3F4F6',
};

/** يُنشئ نسخة تقويم تُدير عنصرها. استدعِ mount() لأول رسم. */
export function createBookingCalendar(container: HTMLElement, opts: BookingOptions) {
  const state: State = {
    weekOffset: 0,
    format: null,
    selectedDate: null,
    selectedHour: null,
    week: null,
    loading: false,
  };

  async function loadWeek(offset: number) {
    state.loading = true;
    state.weekOffset = offset;
    state.selectedDate = null;
    state.selectedHour = null;
    render();
    try {
      state.week = await apiGet<WeekData>('/public/booking/slots', { params: { week_offset: offset } });
    } catch {
      state.week = null;
    } finally {
      state.loading = false;
      render();
    }
  }

  async function confirmBooking() {
    if (!state.format || !state.selectedDate || state.selectedHour === null) return;
    const { name, phone } = opts.getContact();
    if (!name || !phone) {
      alert('يرجى إدخال الاسم ورقم الهاتف في نموذج التسعير أولًا.');

      return;
    }

    const btn = container.querySelector<HTMLButtonElement>('#bk-confirm');
    if (btn) { btn.disabled = true; btn.textContent = 'جارٍ الإرسال…'; }

    try {
      const result = await apiPost<BookingResult>('/public/booking', {
        name, phone, format: state.format, date: state.selectedDate, hour: state.selectedHour,
      });
      renderSuccess(result);
    } catch (err) {
      alert(apiErrorMessage(err, 'تعذّر إتمام الحجز. حاول مجددًا.'));
      // الفتحة قد تكون حُجزت للتو — أعِد تحميل الأسبوع لتحديث التوفّر
      void loadWeek(state.weekOffset);
    }
  }

  // ── الرسم ──────────────────────────────────────────────
  function render() {
    container.innerHTML = shell(bodyHtml());
    wire();
  }

  function bodyHtml(): string {
    const formats = state.week?.formats ?? DEFAULT_FORMATS;

    return `
      <div style="font-size:11px;font-weight:800;color:${C.muted};margin-bottom:8px">① طريقة الاجتماع</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:14px" id="bk-formats">
        ${formats.map((f) => formatChip(f.value, f.label)).join('')}
      </div>
      <div id="bk-week">${weekHtml()}</div>
      <div id="bk-hours"></div>
      <div id="bk-confirm-wrap"></div>
    `;
  }

  function weekHtml(): string {
    if (state.loading) return `<div style="text-align:center;padding:24px;color:${C.muted};font-size:12px">جارٍ تحميل المواعيد…</div>`;
    const wk = state.week;
    if (!wk) return `<div style="text-align:center;padding:24px;color:#DC4A3D;font-size:12px">تعذّر تحميل المواعيد.</div>`;

    return `
      <div style="font-size:11px;font-weight:800;color:${C.muted};margin-bottom:8px">② اختر اليوم المناسب</div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
        <button data-nav="prev" ${wk.can_go_back ? '' : 'disabled'} style="padding:5px 12px;background:#fff;border:1px solid ${C.border};border-radius:6px;cursor:${wk.can_go_back ? 'pointer' : 'not-allowed'};opacity:${wk.can_go_back ? 1 : 0.4};font-size:11px;color:${C.text};font-weight:700;font-family:inherit">◀ السابق</button>
        <span style="font-size:12px;font-weight:800;color:${C.navy}">${wk.label}</span>
        <button data-nav="next" ${wk.can_go_forward ? '' : 'disabled'} style="padding:5px 12px;background:#fff;border:1px solid ${C.border};border-radius:6px;cursor:${wk.can_go_forward ? 'pointer' : 'not-allowed'};opacity:${wk.can_go_forward ? 1 : 0.4};font-size:11px;color:${C.text};font-weight:700;font-family:inherit">التالي ▶</button>
      </div>
      <div style="display:grid;grid-template-columns:repeat(6,1fr);gap:5px">
        ${wk.days.map(dayCell).join('')}
      </div>
    `;
  }

  function dayCell(d: Day): string {
    const disabled = !d.has_availability;
    const bg = disabled ? C.disabled : d.is_holiday ? C.holiday : '#fff';
    const col = disabled ? '#9CA3AF' : C.text;
    const selected = state.selectedDate === d.date;
    const border = selected ? `2px solid #3B82F6` : `1px solid ${C.border}`;
    const note = d.is_holiday ? '🎌' : d.is_past ? '—' : d.is_short ? 'قصير' : '';

    return `
      <div ${disabled ? '' : `data-day="${d.date}"`} style="padding:7px 2px;background:${bg};border:${border};border-radius:8px;text-align:center;cursor:${disabled ? 'not-allowed' : 'pointer'};transition:all .15s">
        <div style="font-size:9px;font-weight:700;color:${col}">${d.day_name}</div>
        <div style="font-size:12px;font-weight:800;color:${col};margin:3px 0">${d.day_month}</div>
        <div style="font-size:8px;color:${d.is_holiday ? '#D97706' : '#9CA3AF'};min-height:10px">${note}</div>
      </div>
    `;
  }

  function hoursHtml(day: Day): string {
    const avail = day.hours.filter((h) => h.available);
    const heading = `<div style="font-size:11px;font-weight:800;color:${C.muted};margin-bottom:8px">③ اختر الوقت — <strong style="color:#111827">${day.day_name} ${day.day_month}</strong></div>`;

    if (avail.length === 0) {
      return `<div style="margin-top:12px;padding-top:12px;border-top:1px solid ${C.border}">${heading}<div style="text-align:center;padding:12px;color:${C.muted};font-size:11px;background:${C.disabled};border-radius:10px">لا تتوفّر مواعيد في هذا اليوم</div></div>`;
    }

    return `
      <div style="margin-top:12px;padding-top:12px;border-top:1px solid ${C.border}">
        ${heading}
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
          ${avail.map((h) => {
            const sel = state.selectedHour === h.hour;

            return `<div data-hour="${h.hour}" style="padding:8px 2px;background:${sel ? C.navy : '#fff'};border:1px solid ${sel ? C.navy : C.border};border-radius:6px;text-align:center;cursor:pointer;transition:all .15s;color:${sel ? '#fff' : C.text};font-size:11px;font-weight:700">${h.label}</div>`;
          }).join('')}
        </div>
      </div>
    `;
  }

  function confirmHtml(day: Day): string {
    const hour = day.hours.find((h) => h.hour === state.selectedHour);
    const fmt = (state.week?.formats ?? DEFAULT_FORMATS).find((f) => f.value === state.format);

    return `
      <div style="margin-top:12px;padding-top:10px;border-top:1px solid ${C.border}">
        <div style="background:#F0FDF4;border:1px solid #86EFAC;border-radius:10px;padding:12px">
          <div style="font-size:11px;color:#16A34A;font-weight:800;margin-bottom:10px">✅ تأكيد تفاصيل الموعد</div>
          <div style="display:grid;grid-template-columns:auto 1fr;gap:6px 10px;font-size:11px;margin-bottom:12px;color:${C.text};border-bottom:1px solid #DCFCE7;padding-bottom:10px">
            <span style="color:${C.muted};font-weight:700">📅 اليوم:</span><strong style="color:#111827">${day.day_name} ${day.day_month}</strong>
            <span style="color:${C.muted};font-weight:700">🕐 الساعة:</span><strong style="color:#111827">${hour?.label ?? ''}</strong>
            <span style="color:${fmt ? C.muted : '#DC2626'};font-weight:700">📋 الطريقة:</span><strong style="color:#111827">${fmt?.label ?? 'يرجى تحديدها من الخطوة ①'}</strong>
          </div>
          <button id="bk-confirm" ${state.format ? '' : 'disabled'} style="width:100%;padding:9px;background:${state.format ? '#16A34A' : '#DC2626'};border:none;border-radius:8px;color:#fff;cursor:${state.format ? 'pointer' : 'not-allowed'};font-size:12px;font-weight:800;font-family:inherit">✓ تأكيد إرسال الطلب</button>
        </div>
      </div>
    `;
  }

  function renderSuccess(r: BookingResult) {
    const card = container.querySelector('#bk-card');
    if (!card) return;
    card.innerHTML = `
      <div style="text-align:center;padding:20px 4px;background:#F0FDF4;border:1px solid #86EFAC;border-radius:12px;color:#16A34A">
        <div style="font-size:38px;margin-bottom:12px">✅</div>
        <div style="font-weight:800;font-size:16px;margin-bottom:10px;color:#111827">تم استلام طلب الحجز بنجاح!</div>
        <div style="font-size:12px;color:${C.text};margin-bottom:5px">🔖 رقم الحجز: <strong>${r.reference}</strong></div>
        <div style="font-size:12px;color:${C.text};margin-bottom:5px">📅 ${r.day_label} · 🕐 ${r.hour_label}</div>
        <div style="font-size:12px;color:${C.text};margin-bottom:14px">📋 ${r.format_label}</div>
        <div style="font-size:11px;color:#111827;background:#fff;border:1px solid #DCFCE7;border-radius:8px;padding:12px;line-height:1.7">سيتواصل فريق معمار معك في هذا الموعد لمناقشة التفاصيل.<br>شكرًا لثقتك 🙏</div>
      </div>
    `;
  }

  function shell(inner: string): string {
    return `
      <div style="margin-bottom:12px;text-align:right">
        <button id="bk-back" style="background:none;border:none;color:${C.navy};cursor:pointer;font-size:13px;font-weight:700;font-family:inherit">← العودة لعرض السعر</button>
      </div>
      <div id="bk-card" style="background:#fff;border:1px solid ${C.border};border-radius:12px;padding:14px;direction:rtl;box-shadow:0 4px 12px rgba(0,0,0,.05)">
        <div style="font-weight:800;font-size:13px;color:${C.navy};margin-bottom:12px">📅 احجز موعدًا لمناقشة السعر</div>
        ${inner}
      </div>
    `;
  }

  function formatChip(value: string, label: string): string {
    const sel = state.format === value;

    return `<div data-format="${value}" style="padding:9px;background:${sel ? C.navy : '#fff'};border:1.5px solid ${sel ? C.navy : C.border};border-radius:8px;cursor:pointer;text-align:center;font-size:11px;font-weight:700;color:${sel ? '#fff' : C.text};transition:all .15s">${label}</div>`;
  }

  // ── ربط الأحداث بعد كل رسم ──
  function wire() {
    container.querySelector('#bk-back')?.addEventListener('click', opts.onBack);

    container.querySelectorAll<HTMLElement>('[data-format]').forEach((el) => {
      el.addEventListener('click', () => { state.format = el.dataset.format ?? null; render(); refreshDetails(); });
    });
    container.querySelectorAll<HTMLElement>('[data-nav]').forEach((el) => {
      el.addEventListener('click', () => {
        const next = el.dataset.nav === 'next' ? state.weekOffset + 1 : state.weekOffset - 1;
        void loadWeek(next);
      });
    });
    container.querySelectorAll<HTMLElement>('[data-day]').forEach((el) => {
      el.addEventListener('click', () => { state.selectedDate = el.dataset.day ?? null; state.selectedHour = null; render(); refreshDetails(); });
    });
    container.querySelectorAll<HTMLElement>('[data-hour]').forEach((el) => {
      el.addEventListener('click', () => { state.selectedHour = Number(el.dataset.hour); render(); refreshDetails(); });
    });
    container.querySelector('#bk-confirm')?.addEventListener('click', () => void confirmBooking());
  }

  /** يعيد ملء قسمي الساعات والتأكيد بعد اختيار يوم/ساعة/طريقة. */
  function refreshDetails() {
    const day = state.week?.days.find((d) => d.date === state.selectedDate);
    const hoursEl = container.querySelector('#bk-hours');
    const confirmEl = container.querySelector('#bk-confirm-wrap');
    if (hoursEl) hoursEl.innerHTML = day ? hoursHtml(day) : '';
    if (confirmEl) confirmEl.innerHTML = day && state.selectedHour !== null ? confirmHtml(day) : '';
    wire();
  }

  return {
    mount() { void loadWeek(0); },
  };
}

const DEFAULT_FORMATS = [
  { value: 'office', label: '🏢 حضوري في المكتب' },
  { value: 'video', label: '📹 اجتماع أونلاين' },
  { value: 'voice', label: '📞 مكالمة صوتية' },
  { value: 'whatsapp', label: '💬 تواصل واتساب' },
];
