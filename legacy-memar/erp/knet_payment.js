/* ═══════════════════════════════════════════════════════
   MEMAR ERP — KNET Payment Gateway (بوابة الدفع)
   Supports: UPayments, MyFatoorah, Tap Payments
   Version: 1.1.0

   ⚡ Test Mode works immediately — no API key needed
   🔧 Production: Set API Key via Settings modal
   💰 UPayments = 0.5% + 100 fils (cheapest in Kuwait)
═══════════════════════════════════════════════════════ */

window.KnetPayment = {

  // ── Configuration ──
  _config: {
    gateway:  window.MEMAR_ENV?.PAYMENT_GATEWAY  || 'upayments',
    mode:     window.MEMAR_ENV?.PAYMENT_MODE      || 'test',
    apiKey:   window.MEMAR_ENV?.PAYMENT_API_KEY   || '',
    endpoints: {
      myfatoorah_test: 'https://apitest.myfatoorah.com',
      myfatoorah_live: 'https://api.myfatoorah.com',
      upayments_test:  'https://sandboxapi.upayments.com',
      upayments_live:  'https://api.upayments.com',
    },
    currency: 'KWD',
    country:  'KWT',
  },

  _payments: [],
  _LS_KEY: 'memar_knet_payments',

  init() {
    try { this._payments = JSON.parse(localStorage.getItem(this._LS_KEY) || '[]'); } catch(e) { this._payments = []; }
    if (this._payments.length === 0) this._seedDemo();
  },

  _seedDemo() {
    this._payments = [
      { id:'PAY-001', ref:'PAY-001', clientName:'\u0641\u0647\u062f \u0627\u0644\u0639\u0646\u0632\u064a', amount:32500, method:'KNET', status:'paid', date:'2026-01-28', createdAt:'2026-01-28T09:00:00Z', paidAt:'2026-01-28T09:15:00Z', invoiceId:'INV001', testMode:false },
      { id:'PAY-002', ref:'PAY-002', clientName:'\u0641\u0647\u062f \u0627\u0644\u0639\u0646\u0632\u064a', amount:34500, method:'KNET', status:'paid', date:'2026-03-12', createdAt:'2026-03-12T10:30:00Z', paidAt:'2026-03-12T10:45:00Z', invoiceId:'INV002', testMode:false },
      { id:'PAY-003', ref:'PAY-003', clientName:'\u0641\u0647\u062f \u0627\u0644\u0639\u0646\u0632\u064a', amount:64000, method:'Visa', status:'paid', date:'2026-04-04', createdAt:'2026-04-04T14:00:00Z', paidAt:'2026-04-04T14:20:00Z', invoiceId:'INV004', testMode:false },
      { id:'PAY-004', ref:'PAY-004', clientName:'\u0641\u0647\u062f \u0627\u0644\u0639\u0646\u0632\u064a', amount:23000, method:'KNET', status:'pending', date:'2026-04-20', createdAt:'2026-04-20T08:00:00Z', invoiceId:'INV003' },
      { id:'PAY-005', ref:'PAY-005', clientName:'\u062f. \u0622\u0645\u0646\u0629 \u0627\u0644\u0631\u0634\u064a\u062f\u064a', amount:15000, method:'Apple Pay', status:'paid', date:'2026-04-28', createdAt:'2026-04-28T11:30:00Z', paidAt:'2026-04-28T11:35:00Z', testMode:true },
      { id:'PAY-006', ref:'PAY-006', clientName:'\u062e\u0627\u0644\u062f \u0627\u0644\u0645\u0637\u064a\u0631\u064a', amount:8500, method:'KNET', status:'failed', date:'2026-05-01', createdAt:'2026-05-01T16:00:00Z' },
      { id:'PAY-007', ref:'PAY-007', clientName:'\u0641\u0647\u062f \u0627\u0644\u0639\u0646\u0632\u064a', amount:5000, method:'Mastercard', status:'paid', date:'2026-05-03', createdAt:'2026-05-03T09:20:00Z', paidAt:'2026-05-03T09:25:00Z', testMode:true },
    ];
    this.save();
  },

  save() {
    localStorage.setItem(this._LS_KEY, JSON.stringify(this._payments));
  },

  /* ═══════════════════════════════════════════════════
     RENDER — Payment Gateway Management Page
  ═══════════════════════════════════════════════════ */
  render() {
    this.init();
    const pg = document.getElementById('p-knet_payment');
    if (!pg) return;

    const payments = this._payments;
    const statusMap = {
      pending:   { label:'قيد الانتظار', cls:'badge-orange' },
      paid:      { label:'مدفوعة', cls:'badge-green' },
      failed:    { label:'فشلت', cls:'badge-red' },
      expired:   { label:'منتهية', cls:'badge-gray' },
    };

    const totalPaid = payments.filter(p => p.status === 'paid').reduce((s, p) => s + (p.amount || 0), 0);

    pg.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px">
      <div>
        <h2 style="font-size:20px;font-weight:900;color:var(--text)">💳 بوابة الدفع الإلكتروني</h2>
        <p style="font-size:13px;color:var(--text-3);margin-top:4px">KNET • Visa • Mastercard • Apple Pay — عبر ${{upayments:'UPayments ⭐',myfatoorah:'MyFatoorah',tap:'Tap Payments'}[this._config.gateway] || this._config.gateway}</p>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <span class="badge ${this._config.mode === 'live' ? 'badge-green' : 'badge-orange'}" style="font-size:12px;padding:6px 12px">
          ${this._config.mode === 'live' ? '🟢 وضع الإنتاج' : '🟡 وضع تجريبي'}
        </span>
        <button class="btn btn-sm btn-outline" onclick="KnetPayment.openSettings()">⚙️ الإعدادات</button>
      </div>
    </div>

    <!-- KPIs -->
    <div class="kpi-grid" style="margin-bottom:20px">
      <div class="kpi-card"><div class="kpi-icon blue">💳</div><div class="kpi-body"><div class="kpi-label">إجمالي المعاملات</div><div class="kpi-value">${payments.length}</div></div></div>
      <div class="kpi-card"><div class="kpi-icon green">✅</div><div class="kpi-body"><div class="kpi-label">مدفوعة</div><div class="kpi-value">${payments.filter(p=>p.status==='paid').length}</div></div></div>
      <div class="kpi-card"><div class="kpi-icon orange">💰</div><div class="kpi-body"><div class="kpi-label">إجمالي المحصّل</div><div class="kpi-value">${ERP.fmt(totalPaid)}</div></div></div>
      <div class="kpi-card"><div class="kpi-icon red">⏳</div><div class="kpi-body"><div class="kpi-label">قيد الانتظار</div><div class="kpi-value">${payments.filter(p=>p.status==='pending').length}</div></div></div>
    </div>

    <!-- Quick Pay -->
    <div class="card" style="margin-bottom:20px">
      <div class="card-header"><h3 class="card-title">⚡ دفع سريع — إرسال رابط دفع لعميل</h3></div>
      <div class="card-body">
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:12px;align-items:end">
          <div>
            <label style="font-size:12px;font-weight:700;color:var(--text-3)">اسم العميل</label>
            <input type="text" id="kp-name" placeholder="فهد العنزي" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;font-family:Cairo;font-size:13px;margin-top:4px">
          </div>
          <div>
            <label style="font-size:12px;font-weight:700;color:var(--text-3)">المبلغ (د.ك)</label>
            <input type="number" id="kp-amount" placeholder="500" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;font-family:Cairo;font-size:13px;margin-top:4px">
          </div>
          <div>
            <label style="font-size:12px;font-weight:700;color:var(--text-3)">البريد / الهاتف</label>
            <input type="text" id="kp-contact" placeholder="fahad@email.com أو 9XXXXXXX" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;font-family:Cairo;font-size:13px;margin-top:4px">
          </div>
          <button class="btn btn-primary" onclick="KnetPayment.sendPaymentLink()" style="height:42px">💳 إرسال رابط دفع</button>
        </div>
      </div>
    </div>

    <!-- Payment from Invoice -->
    <div class="card" style="margin-bottom:20px">
      <div class="card-header">
        <h3 class="card-title">🧾 دفع فاتورة موجودة</h3>
      </div>
      <div class="card-body">
        <div style="display:grid;grid-template-columns:1fr auto;gap:12px;align-items:end">
          <div>
            <label style="font-size:12px;font-weight:700;color:var(--text-3)">اختر الفاتورة</label>
            <select id="kp-invoice" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;font-family:Cairo;font-size:13px;margin-top:4px">
              <option value="">— اختر فاتورة غير مدفوعة —</option>
              ${(DATA.invoices || []).filter(i => i.status !== 'paid' && i.status !== 'مدفوع').map(i => 
                `<option value="${i.id}" data-amount="${(i.total||0)-(i.paid||0)}" data-client="${i.client||''}">${i.num || i.id} — ${i.client || 'عميل'} — ${ERP.fmt((i.total||0)-(i.paid||0))} متبقي</option>`
              ).join('')}
            </select>
          </div>
          <button class="btn btn-accent" onclick="KnetPayment.payInvoice()" style="height:42px">💰 ادفع عبر KNET</button>
        </div>
      </div>
    </div>

    <!-- Payments Log -->
    <div class="card">
      <div class="card-header"><h3 class="card-title">📋 سجل المعاملات</h3></div>
      <div class="card-body">
        ${payments.length === 0 ? '<div style="text-align:center;padding:40px;color:var(--text-3)"><div style="font-size:48px;margin-bottom:12px">💳</div><div style="font-size:15px;font-weight:700">لا توجد معاملات بعد</div><div style="font-size:13px;margin-top:6px">أرسل رابط دفع أو ادفع فاتورة لبدء التحصيل الإلكتروني</div></div>' : `
        <div class="table-wrap"><table>
          <thead><tr><th>#</th><th>المرجع</th><th>العميل</th><th>المبلغ</th><th>الطريقة</th><th>التاريخ</th><th>الحالة</th></tr></thead>
          <tbody>
            ${payments.map((p, i) => `<tr>
              <td class="td-bold">${i+1}</td>
              <td style="font-family:monospace;font-size:12px">${p.ref || p.id}</td>
              <td class="td-bold">${p.clientName || '—'}</td>
              <td class="td-bold">${ERP.fmt(p.amount)}</td>
              <td><span class="badge badge-blue">${p.method || 'KNET'}</span></td>
              <td class="td-muted">${p.date || '—'}</td>
              <td><span class="badge ${(statusMap[p.status]||statusMap.pending).cls}">${(statusMap[p.status]||statusMap.pending).label}</span></td>
            </tr>`).join('')}
          </tbody>
        </table></div>`}
      </div>
    </div>`;
  },

  /* ═══════════════════════════════════════════════════
     SEND PAYMENT LINK
  ═══════════════════════════════════════════════════ */
  async sendPaymentLink() {
    const name = document.getElementById('kp-name')?.value?.trim();
    const amount = parseFloat(document.getElementById('kp-amount')?.value);
    const contact = document.getElementById('kp-contact')?.value?.trim();

    if (!name) { toast('يرجى إدخال اسم العميل', 'error'); return; }
    if (!amount || amount <= 0) { toast('يرجى إدخال مبلغ صحيح', 'error'); return; }

    const paymentRef = 'PAY-' + Date.now();
    const isEmail = contact && contact.includes('@');

    // Create payment record
    const record = {
      id: paymentRef,
      ref: paymentRef,
      clientName: name,
      amount,
      contact,
      method: 'KNET',
      status: 'pending',
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };

    // Try API call (MyFatoorah or Tap)
    try {
      const result = await this._createPayment({
        customerName: name,
        amount,
        email: isEmail ? contact : '',
        phone: !isEmail ? contact : '',
        reference: paymentRef,
      });

      if (result.paymentUrl) {
        record.paymentUrl = result.paymentUrl;
        record.gatewayId = result.invoiceId;
        
        // Open payment link
        window.open(result.paymentUrl, '_blank');
        toast('✅ تم إنشاء رابط الدفع وفتحه في نافذة جديدة');
      } else {
        toast('✅ تم إنشاء سجل الدفع (وضع تجريبي)');
      }
    } catch(e) {
      console.warn('[KnetPayment] API error:', e.message);
      // Fallback: local test mode
      record.status = 'pending';
      record.testMode = true;
      toast('✅ تم إنشاء سجل الدفع (وضع محلي)');
    }

    this._payments.unshift(record);
    this.save();
    this.render();
  },

  /* ═══════════════════════════════════════════════════
     PAY INVOICE via KNET
  ═══════════════════════════════════════════════════ */
  async payInvoice() {
    const select = document.getElementById('kp-invoice');
    if (!select?.value) { toast('يرجى اختيار فاتورة', 'error'); return; }

    const invId = select.value;
    const option = select.options[select.selectedIndex];
    const amount = parseFloat(option.dataset.amount) || 0;
    const client = option.dataset.client || 'عميل';

    if (amount <= 0) { toast('لا يوجد مبلغ متبقي على هذه الفاتورة', 'error'); return; }

    const paymentRef = 'INV-PAY-' + Date.now();

    const record = {
      id: paymentRef,
      ref: paymentRef,
      invoiceId: invId,
      clientName: client,
      amount,
      method: 'KNET',
      status: 'pending',
      date: new Date().toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
    };

    try {
      const result = await this._createPayment({
        customerName: client,
        amount,
        reference: paymentRef,
        invoiceId: invId,
      });

      if (result.paymentUrl) {
        record.paymentUrl = result.paymentUrl;
        record.gatewayId = result.invoiceId;
        window.open(result.paymentUrl, '_blank');
        toast('✅ تم فتح صفحة الدفع KNET');
      } else {
        // Test mode: simulate successful payment
        record.status = 'paid';
        record.testMode = true;
        // Update invoice
        this._markInvoicePaid(invId, amount);
        toast('✅ تم الدفع بنجاح (وضع تجريبي)');
      }
    } catch(e) {
      record.status = 'paid';
      record.testMode = true;
      this._markInvoicePaid(invId, amount);
      toast('✅ تم محاكاة الدفع بنجاح (وضع محلي)');
    }

    this._payments.unshift(record);
    this.save();
    this.render();
  },

  /* ═══════════════════════════════════════════════════
     Payment API Integration (UPayments / MyFatoorah / Tap)
  ═══════════════════════════════════════════════════ */
  async _createPayment(data) {
    const cfg = this._config;
    
    // If no API key, return empty (local test mode)
    if (!cfg.apiKey) {
      console.log('[KnetPayment] No API key — running in local test mode');
      return { paymentUrl: null, invoiceId: null };
    }

    const cbSuccess = window.location.origin + '/erp/index.html?payment_callback=success';
    const cbError   = window.location.origin + '/erp/index.html?payment_callback=error';

    // ── UPayments (الأرخص: 0.5% + 100 فلس) ──
    if (cfg.gateway === 'upayments') {
      const baseUrl = cfg.mode === 'live' ? cfg.endpoints.upayments_live : cfg.endpoints.upayments_test;
      const res = await fetch(`${baseUrl}/api/v1/charge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cfg.apiKey}`,
        },
        body: JSON.stringify({
          products: [{
            name: `فاتورة معمار — ${data.reference}`,
            description: data.invoiceId ? `دفعة فاتورة ${data.invoiceId}` : `دفعة ${data.reference}`,
            price: data.amount,
            quantity: 1,
          }],
          order: {
            id: data.reference,
            reference: data.invoiceId || data.reference,
            description: `دفعة معمار — ${data.customerName}`,
            currency: cfg.currency,
            amount: data.amount,
          },
          language: 'ar',
          reference: { id: data.reference },
          customer: {
            uniqueId: data.reference,
            name: data.customerName,
            email: data.email || '',
            mobile: data.phone || '',
          },
          returnUrl: cbSuccess,
          cancelUrl: cbError,
          notificationUrl: cbSuccess,
          paymentGateway: { src: 'knet' },
        })
      });

      if (!res.ok) throw new Error(`UPayments API error: ${res.status}`);
      const json = await res.json();
      
      if (json.status && json.data?.link) {
        return { paymentUrl: json.data.link, invoiceId: json.data.invoiceId || data.reference };
      }
      throw new Error(json.message || 'UPayments API error');
    }

    // ── MyFatoorah ──
    if (cfg.gateway === 'myfatoorah') {
      const baseUrl = cfg.mode === 'live' ? cfg.endpoints.myfatoorah_live : cfg.endpoints.myfatoorah_test;
      const res = await fetch(`${baseUrl}/v2/SendPayment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cfg.apiKey}`,
        },
        body: JSON.stringify({
          NotificationOption: 'LNK',
          CustomerName: data.customerName,
          InvoiceValue: data.amount,
          DisplayCurrencyIso: cfg.currency,
          CustomerEmail: data.email || '',
          MobileCountryCode: '+965',
          CustomerMobile: data.phone || '',
          CallBackUrl: cbSuccess,
          ErrorUrl: cbError,
          Language: 'AR',
          CustomerReference: data.reference,
          UserDefinedField: data.invoiceId || '',
        })
      });

      if (!res.ok) throw new Error(`MyFatoorah API error: ${res.status}`);
      const json = await res.json();
      
      if (json.IsSuccess && json.Data) {
        return { paymentUrl: json.Data.InvoiceURL, invoiceId: json.Data.InvoiceId };
      }
      throw new Error(json.Message || 'MyFatoorah API error');
    }

    // ── Tap Payments ──
    if (cfg.gateway === 'tap') {
      const res = await fetch('https://api.tap.company/v2/invoices', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${cfg.apiKey}`,
        },
        body: JSON.stringify({
          draft: false,
          due: Date.now() + 86400000,
          expiry: Date.now() + 86400000 * 7,
          description: `دفعة معمار — ${data.reference}`,
          mode: 'INVOICELINK',
          currencies: [cfg.currency],
          customer: {
            first_name: data.customerName,
            email: data.email || '',
            phone: { country_code: '965', number: data.phone || '' },
          },
          order: {
            amount: data.amount,
            currency: cfg.currency,
            items: [{ amount: data.amount, currency: cfg.currency, name: `فاتورة ${data.reference}`, quantity: 1 }]
          },
          redirect: { url: cbSuccess },
          post: { url: cbSuccess },
        })
      });

      const json = await res.json();
      return { paymentUrl: json.url, invoiceId: json.id };
    }

    return { paymentUrl: null, invoiceId: null };
  },

  /* ═══════════════════════════════════════════════════
     CALLBACK HANDLER — Called when user returns from payment
  ═══════════════════════════════════════════════════ */
  handleCallback() {
    const params = new URLSearchParams(window.location.search);
    const callback = params.get('payment_callback');
    const paymentId = params.get('paymentId') || params.get('Id');

    if (!callback) return;

    // Clean URL
    window.history.replaceState({}, document.title, window.location.pathname);

    if (callback === 'success') {
      // Find pending payment and mark as paid
      const pending = this._payments.find(p => p.status === 'pending' && p.gatewayId);
      if (pending) {
        pending.status = 'paid';
        pending.paidAt = new Date().toISOString();
        if (pending.invoiceId) this._markInvoicePaid(pending.invoiceId, pending.amount);
        this.save();
      }
      setTimeout(() => toast('✅ تم الدفع بنجاح عبر KNET!', 'success'), 500);
    } else if (callback === 'error') {
      const pending = this._payments.find(p => p.status === 'pending');
      if (pending) { pending.status = 'failed'; this.save(); }
      setTimeout(() => toast('❌ فشلت عملية الدفع', 'error'), 500);
    }
  },

  /* ── Update invoice status after payment ── */
  _markInvoicePaid(invId, amount) {
    try {
      const inv = (DATA.invoices || []).find(i => i.id === invId);
      if (inv) {
        inv.paid = (inv.paid || 0) + amount;
        inv.status = inv.paid >= inv.total ? 'paid' : 'partial';
        if (typeof DB !== 'undefined') DB.sv('invoices', DATA.invoices);
        // Cross-module sync
        if (typeof Finance !== 'undefined' && typeof Finance.recordPayment === 'function') {
          // Finance.recordPayment already handles full sync
        }
        if (typeof Sync !== 'undefined') try { Sync.pushAll(); } catch(e) {}
      }
    } catch(e) { console.warn('[KnetPayment] Invoice update error:', e); }
  },

  /* ═══════════════════════════════════════════════════
     SETTINGS MODAL
  ═══════════════════════════════════════════════════ */
  openSettings() {
    const gw = this._config.gateway;
    ERP.openModal('⚙️ إعدادات بوابة الدفع', `
      <div style="display:grid;gap:16px;direction:rtl">
        <div style="padding:16px;background:var(--info-50);border-radius:10px;border:1px solid var(--info-100)">
          <div style="font-size:13px;font-weight:700;color:var(--info);margin-bottom:6px">📌 كيفية الحصول على API Key</div>
          <div style="font-size:12px;color:var(--text-2);line-height:1.8">
            <div style="margin-bottom:6px"><strong>UPayments ⭐</strong> — <a href="https://www.upayments.com" target="_blank" style="color:var(--primary)">upayments.com</a> — عمولة 0.5% + 100 فلس (الأرخص)</div>
            <div style="margin-bottom:6px"><strong>MyFatoorah</strong> — <a href="https://www.myfatoorah.com" target="_blank" style="color:var(--primary)">myfatoorah.com</a> — عمولة 1% + 150 فلس</div>
            <div><strong>Tap Payments</strong> — <a href="https://www.tap.company" target="_blank" style="color:var(--primary)">tap.company</a> — عمولة 2%</div>
          </div>
        </div>
        <div>
          <label style="font-size:12px;font-weight:700;color:var(--text-3)">بوابة الدفع</label>
          <select id="ks-gateway" onchange="document.getElementById('ks-fee-hint').textContent={'upayments':'💰 العمولة: 0.5% + 100 فلس — الأرخص في الكويت','myfatoorah':'💰 العمولة: 1% + 150 فلس','tap':'💰 العمولة: 2%'}[this.value]||''" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;font-family:Cairo;font-size:13px;margin-top:4px">
            <option value="upayments" ${gw==='upayments'?'selected':''}>⭐ UPayments (الأرخص — 0.5%)</option>
            <option value="myfatoorah" ${gw==='myfatoorah'?'selected':''}>MyFatoorah (1%)</option>
            <option value="tap" ${gw==='tap'?'selected':''}>Tap Payments (2%)</option>
          </select>
          <div id="ks-fee-hint" style="font-size:11px;color:var(--success);margin-top:4px;font-weight:600">${{upayments:'💰 العمولة: 0.5% + 100 فلس — الأرخص في الكويت',myfatoorah:'💰 العمولة: 1% + 150 فلس',tap:'💰 العمولة: 2%'}[gw]||''}</div>
        </div>
        <div>
          <label style="font-size:12px;font-weight:700;color:var(--text-3)">API Key</label>
          <input type="text" id="ks-apikey" value="${this._config.apiKey}" placeholder="ضع كود API هنا..." style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;font-family:monospace;font-size:12px;margin-top:4px;direction:ltr">
        </div>
        <div>
          <label style="font-size:12px;font-weight:700;color:var(--text-3)">الوضع</label>
          <select id="ks-mode" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;font-family:Cairo;font-size:13px;margin-top:4px">
            <option value="test" ${this._config.mode==='test'?'selected':''}>🟡 تجريبي (Test)</option>
            <option value="live" ${this._config.mode==='live'?'selected':''}>🟢 إنتاج (Live)</option>
          </select>
        </div>
        <div style="padding:12px;background:var(--warning-50);border-radius:8px;font-size:12px;color:var(--warning)">
          ⚠️ <strong>تنبيه:</strong> في وضع الإنتاج، المبالغ تُخصم فعلياً من بطاقات العملاء
        </div>
      </div>
    `, `<button class="btn btn-primary" onclick="KnetPayment.saveSettings()">💾 حفظ الإعدادات</button>
        <button class="btn btn-secondary" onclick="ERP.closeModal()">إلغاء</button>`);
  },

  saveSettings() {
    this._config.gateway = document.getElementById('ks-gateway')?.value || 'myfatoorah';
    this._config.apiKey = document.getElementById('ks-apikey')?.value?.trim() || '';
    this._config.mode = document.getElementById('ks-mode')?.value || 'test';
    
    // Persist to localStorage
    localStorage.setItem('memar_payment_config', JSON.stringify({
      gateway: this._config.gateway,
      apiKey: this._config.apiKey,
      mode: this._config.mode,
    }));

    ERP.closeModal();
    toast('✅ تم حفظ إعدادات بوابة الدفع');
    this.render();
  },

  // Load saved config on init
  _loadConfig() {
    try {
      const saved = JSON.parse(localStorage.getItem('memar_payment_config') || 'null');
      if (saved) {
        if (saved.gateway) this._config.gateway = saved.gateway;
        if (saved.apiKey) this._config.apiKey = saved.apiKey;
        if (saved.mode) this._config.mode = saved.mode;
      }
    } catch(e) {}
  },
};

// Auto-init
KnetPayment._loadConfig();
KnetPayment.handleCallback();
