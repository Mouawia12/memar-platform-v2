/* ═══════════════════════════════════════════════════════
   MEMAR ERP — Notification System (نظام الإشعارات)
   Supports: In-app, Email (via EmailJS/Supabase Edge Functions)
   Version: 1.0.0
═══════════════════════════════════════════════════════ */

window.MemarNotify = {

  // ── Configuration ──
  _config: {
    emailEnabled: false,
    emailService: 'emailjs', // 'emailjs' | 'supabase_edge' | 'smtp_proxy'
    // EmailJS config (free tier: 200 emails/month)
    emailjs: {
      serviceId:  window.MEMAR_ENV?.EMAILJS_SERVICE  || '',
      templateId: window.MEMAR_ENV?.EMAILJS_TEMPLATE || '',
      publicKey:  window.MEMAR_ENV?.EMAILJS_KEY      || '',
    },
    // Supabase Edge Function URL
    edgeFnUrl: window.MEMAR_ENV?.NOTIFY_EDGE_FN || '',
    // Admin email
    adminEmail: window.MEMAR_ENV?.ADMIN_EMAIL || 'admin@memar.kw',
  },

  _log: [],
  _LS_KEY: 'memar_notify_log',

  init() {
    try { this._log = JSON.parse(localStorage.getItem(this._LS_KEY) || '[]'); } catch(e) { this._log = []; }
    // Auto-detect EmailJS
    if (window.emailjs && this._config.emailjs.serviceId) {
      this._config.emailEnabled = true;
    }
  },

  /* ── Main send method ── */
  async send(type, data = {}, recipients = []) {
    const templates = {
      field_visit:   { subject: '📍 زيارة ميدانية جديدة', body: `تم جدولة زيارة ميدانية لمشروع "${data.project || '—'}" بتاريخ ${data.date || '—'} الساعة ${data.time || '—'}.` },
      invoice_paid:  { subject: '💰 تم تسجيل دفعة جديدة', body: `تم تسجيل دفعة على فاتورة ${data.invoiceNum || '—'} بمبلغ ${data.amount || '—'} د.ك.` },
      deal_won:      { subject: '🎉 تم الفوز بصفقة جديدة', body: `تم تحويل العميل "${data.clientName || '—'}" إلى مشروع جديد بقيمة ${data.value || '—'} د.ك.` },
      task_assigned: { subject: '📋 مهمة جديدة', body: `تم تعيين مهمة "${data.taskName || '—'}" إلى ${data.assignee || '—'}.` },
      project_delay: { subject: '⚠️ تنبيه تأخير مشروع', body: `المشروع "${data.projectName || '—'}" متأخر عن الجدول الزمني.` },
      general:       { subject: data.subject || '📌 إشعار من معمار', body: data.body || data.message || '' },
    };

    const tmpl = templates[type] || templates.general;

    // 1. Log notification
    const entry = {
      id: 'NOTIF-' + Date.now(),
      type,
      subject: tmpl.subject,
      body: tmpl.body,
      recipients: recipients.length ? recipients : [this._config.adminEmail],
      status: 'pending',
      createdAt: new Date().toISOString(),
      data
    };
    this._log.unshift(entry);

    // 2. In-app notification
    try {
      if (window.DATA && Array.isArray(DATA.notifications)) {
        DATA.notifications.unshift({
          id: entry.id,
          type: 'upcoming',
          title: tmpl.subject,
          due: new Date().toISOString().split('T')[0],
          entity: type === 'invoice_paid' ? 'invoice' : type === 'task_assigned' ? 'task' : 'project'
        });
      }
    } catch(e) {}

    // 3. Try email delivery
    if (this._config.emailEnabled) {
      try {
        await this._sendEmail(entry);
        entry.status = 'sent';
      } catch(e) {
        entry.status = 'failed';
        entry.error = e.message;
        console.warn('[MemarNotify] Email failed:', e.message);
      }
    } else {
      entry.status = 'email_disabled';
    }

    // 4. Try BroadcastChannel
    try {
      const bc = new BroadcastChannel('memar_erp_sync');
      bc.postMessage({ action: 'new_notification', data: { id: entry.id, type: 'upcoming', title: tmpl.subject, due: new Date().toISOString().split('T')[0] } });
    } catch(e) {}

    // Save log
    this._log = this._log.slice(0, 100); // keep last 100
    localStorage.setItem(this._LS_KEY, JSON.stringify(this._log));

    return entry;
  },

  /* ── Email delivery via EmailJS ── */
  async _sendEmail(entry) {
    const cfg = this._config;
    
    if (cfg.emailService === 'emailjs' && window.emailjs) {
      await emailjs.send(cfg.emailjs.serviceId, cfg.emailjs.templateId, {
        to_email: entry.recipients.join(','),
        subject: entry.subject,
        message: entry.body,
        from_name: 'معمار ERP',
      }, cfg.emailjs.publicKey);
      return;
    }

    if (cfg.emailService === 'supabase_edge' && cfg.edgeFnUrl) {
      const res = await fetch(cfg.edgeFnUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${MEMAR_SUPABASE_KEY}` },
        body: JSON.stringify({ to: entry.recipients, subject: entry.subject, body: entry.body })
      });
      if (!res.ok) throw new Error('Edge function returned ' + res.status);
      return;
    }

    throw new Error('No email service configured');
  },

  /* ── Get notification log ── */
  getLog() { return this._log; },

  /* ── Quick helpers ── */
  notifyAdmin(subject, body) {
    return this.send('general', { subject, body }, [this._config.adminEmail]);
  },
};

// Auto-init
MemarNotify.init();
