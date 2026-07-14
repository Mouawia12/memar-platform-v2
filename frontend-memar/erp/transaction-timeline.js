/**
 * Simple Transaction Timeline - Baseline Layout
 * Shows a vertical list of stages. Clicking stage opens details (Newest -> Oldest).
 */
class TransactionTimeline {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    if (!this.container) return;

    // ── 1. Mock Data ──
    this.transaction = {
      id: "TRX-2026-0491", clientName: "شركة الفرسان للتجارة", currentStageIdx: 2,
      stages: [
        { id: 's1', title: 'تسجيل العميل (Lead)', status: 'done', integrations: ['crm'], user: 'نظام', date: '10 أبريل' },
        { id: 's2', title: 'التفاوض والدراسة', status: 'done', integrations: ['crm', 'tasks'], user: 'أحمد', date: '12 أبريل' },
        { id: 's3', title: 'توقيع العقد والدفعة', status: 'active', integrations: ['contracts', 'finance'], user: 'المحاسبة', date: '18 أبريل' },
        { id: 's4', title: 'التنفيذ والمخططات', status: 'upcoming', integrations: ['tasks'], user: 'سارة', date: '-' },
        { id: 's5', title: 'التسليم والإغلاق', status: 'upcoming', integrations: ['finance', 'crm'], user: '-', date: '-' }
      ],
      auditLog: [
        { id: 1, time: '2026-04-10 09:00', user: 'النظام', action: 'إنشاء', text: 'تم التسجيل' },
        { id: 2, time: '2026-04-12 11:30', user: 'أحمد', action: 'تعديل', text: 'تغيير الحالة للمفاوضات' }
      ],
      events: [
        { id: 'e1', stageIdx: 0, type: 'system', user: 'نظام', time: '10 أبريل 09:00', text: 'تم تسجيل العميل (Lead) وتحويله.' },
        { id: 'e2', stageIdx: 1, type: 'employee', user: 'أحمد', time: '12 أبريل 10:00', text: 'تم إرسال عرض السعر المبدئي.' },
        { id: 'e3', stageIdx: 1, type: 'client', user: 'العميل', time: '13 أبريل 15:00', text: 'هل يمكن تقديم خصم على مساحة فوق 500م؟' },
        { id: 'e4', stageIdx: 1, type: 'employee', user: 'أحمد', time: '14 أبريل 09:30', text: 'نعم، تم تحديث عرض السعر وإرفاقه.', isFile: true, fileName: 'Quote_V2.pdf' },
        { id: 'e5', stageIdx: 2, type: 'system', user: 'عقود', time: '15 أبريل 14:30', text: 'تم إصدار مسودة العقد رقم #C-991' },
        { id: 'e6', stageIdx: 2, type: 'employee', user: 'المحاسبة', time: '18 أبريل 11:00', text: 'تم استلام الدفعة المقدمة (30%). فاتورة #INV-402' },
        { id: 'e7', stageIdx: 2, type: 'client', user: 'العميل', time: '19 أبريل 10:15', text: 'تم توقيع العقد من طرفنا، أرجو البدء.' }
      ]
    };

    // Modal DOM
    this.createModal();
    this.render();
  }

  createModal() {
    if(document.getElementById('tl-modal')) return;
    const m = document.createElement('div');
    m.id = 'tl-modal';
    m.className = 'tl-modal-overlay';
    document.body.appendChild(m);
  }

  // ── 2. Rendering Main List ──
  render() {
    this.container.innerHTML = `
      <div class="tl-header-box">
        <div>
          <div class="tl-header-title">مسار المعاملة رقم ${this.transaction.id}</div>
          <div class="tl-header-sub">العميل: ${this.transaction.clientName} | المرحلة الحالية: ${this.transaction.stages[this.transaction.currentStageIdx].title}</div>
        </div>
        <button class="btn btn-primary btn-sm" onclick="transTimeline.nextStage()">نقل للمرحلة التالية ✓</button>
      </div>
      <div class="tl-stage-list" id="tl-stage-list"></div>
    `;

    const listContainer = document.getElementById('tl-stage-list');
    this.transaction.stages.forEach((stage, idx) => {
      let isDone = idx < this.transaction.currentStageIdx;
      let isActive = idx === this.transaction.currentStageIdx;
      
      const card = document.createElement('div');
      card.className = `tl-stage-card ${isDone ? 'done' : isActive ? 'active' : 'upcoming'}`;
      card.onclick = () => this.openStageDetails(idx);

      card.innerHTML = `
        <div class="tl-status-dot"></div>
        <div class="tl-card-main">
          <div class="tl-card-row-1">
            <div class="tl-stage-name">${stage.title}</div>
            <div class="tl-stage-badge ${isDone ? 'done' : isActive ? 'active' : 'upcoming'}">
              ${isDone ? 'مكتمل' : isActive ? 'قيد العمل' : 'قادم'}
            </div>
          </div>
          <div class="tl-card-row-2">
            <span>👤 مسؤول: ${stage.user}</span>
            <span>📅 ${stage.date}</span>
          </div>
          <div class="tl-integrations">
            ${stage.integrations.map(int => `<span class="tl-int-badge">${int}</span>`).join('')}
          </div>
        </div>
      `;
      listContainer.appendChild(card);
    });
  }

  // ── 3. Stage Details Modal ──
  openStageDetails(idx) {
    const stage = this.transaction.stages[idx];
    // Filter events and reverse for Newest -> Oldest
    const events = this.transaction.events.filter(e => e.stageIdx === idx).reverse();

    const m = document.getElementById('tl-modal');
    m.innerHTML = `
      <div class="tl-modal-box">
        <div class="tl-modal-header">
          <div class="tl-modal-title">تفاصيل: ${stage.title}</div>
          <button class="tl-modal-close" onclick="transTimeline.closeModal()">✕</button>
        </div>
        <div class="tl-modal-body">
          <div class="tl-msg-list">
            ${events.map(e => `
              <div class="tl-msg-item">
                <div class="tl-msg-hdr">
                  <span class="tl-msg-user">${e.type === 'system' ? '⚙️' : ''} ${e.user}</span>
                  <span class="tl-msg-time">${e.time}</span>
                </div>
                <div class="tl-msg-content ${e.type === 'system' ? 'system' : ''}">
                  ${e.text}
                  ${e.isFile ? `<div class="tl-msg-content file">📎 <strong>${e.fileName}</strong></div>` : ''}
                </div>
              </div>
            `).join('')}
            ${events.length === 0 ? '<div style="text-align:center;color:var(--text-3);font-size:12px">لا توجد تفاصيل أو سجلات في هذه المرحلة.</div>' : ''}
          </div>
        </div>
        <div class="tl-modal-footer">
          <input type="text" class="tl-chat-input" id="tl-chat-input-${idx}" placeholder="أضف ملاحظة أو مجادثة..." onkeypress="if(event.key === 'Enter') transTimeline.addMessage(${idx})">
          <button class="tl-btn-primary" onclick="transTimeline.addMessage(${idx})">إرسال</button>
        </div>
      </div>
    `;
    m.classList.add('open');
  }

  closeModal() {
    document.getElementById('tl-modal').classList.remove('open');
  }

  addMessage(idx) {
    const inp = document.getElementById(`tl-chat-input-${idx}`);
    if(!inp || !inp.value.trim()) return;

    this.transaction.events.push({
      id: 'e' + Date.now(),
      stageIdx: idx,
      type: 'employee',
      user: 'المستخدم الحالي',
      time: 'الآن',
      text: inp.value.trim()
    });
    // Refresh modal to show newest on top
    this.openStageDetails(idx);
  }

  nextStage() {
    let curr = this.transaction.currentStageIdx;
    if (curr >= this.transaction.stages.length - 1) { alert("المعاملة مكتملة"); return; }
    
    this.transaction.stages[curr].status = 'done';
    this.transaction.currentStageIdx = curr + 1;
    this.transaction.stages[curr + 1].status = 'active';
    this.transaction.stages[curr + 1].date = 'الآن';

    this.transaction.auditLog.push({ id: Date.now(), time: 'الآن', user: 'نظام', action: 'انتقال', text: 'تمت للمرحلة التالية' });
    this.render();
  }
}

let transTimeline;
document.addEventListener('click', (e) => {
    const navItem = e.target.closest('.nav-item');
    if (navItem && navItem.getAttribute('data-page') === 'transaction-timeline') {
        if(!transTimeline && document.getElementById('p-transaction-timeline')) {
            transTimeline = new TransactionTimeline('p-transaction-timeline');
        } else if (transTimeline) {
            transTimeline.render();
        }
    }
});
