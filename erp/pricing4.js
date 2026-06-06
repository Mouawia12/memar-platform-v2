'use strict';
/* ═══════════════════════════════════════════════════════════════
   MEMAR Pricing Engine 4 — Main Controller (Phase 1–4)
   محرك التسعير 4 — كامل المراحل
   ═══════════════════════════════════════════════════════════════ */

const Pricing4 = {

  /* ── Constants ─────────────────────────────────── */
  STEPS: [
    { num: 1, label: 'القطاع والمساحة' },
    { num: 2, label: 'الباقة والخدمات' },
    { num: 3, label: 'بيانات العميل' },
    { num: 4, label: 'المراجعة النهائية' },
  ],

  /* ── Shorthand refs (populated on first render) ── */
  _root: null,     // #p-pricing4
  _toast: null,    // toast element

  /* ════════════════════════════════════════════════════════════
     render()  —  Main entry point
     ════════════════════════════════════════════════════════════ */
  render() {
    const pg = document.getElementById('p-pricing4');
    if (!pg) return;
    this._root = pg;

    /* Inject external stylesheet link once */
    if (!document.getElementById('pricing4-css')) {
      const link = document.createElement('link');
      link.id   = 'pricing4-css';
      link.rel  = 'stylesheet';
      link.href = 'pricing4.css';
      document.head.appendChild(link);
    }

    /* Build skeleton */
    pg.innerHTML = '';
    pg.className = 'p4-container p4-animate-in';
    pg.setAttribute('dir', 'rtl');

    /* Toolbar */
    const toolbar = document.createElement('div');
    toolbar.id = 'p4-toolbar';
    pg.appendChild(toolbar);

    /* Progress bar */
    const progress = document.createElement('div');
    progress.id = 'p4-progress';
    pg.appendChild(progress);

    /* Main grid: left (workspace) + right (summary) */
    const main = document.createElement('div');
    main.className = 'p4-main';
    main.id = 'p4-main';

    const workspace = document.createElement('div');
    workspace.id = 'p4-workspace';
    main.appendChild(workspace);

    const summary = document.createElement('div');
    summary.id = 'p4-summary';
    main.appendChild(summary);

    pg.appendChild(main);

    /* Toast container */
    if (!this._toast) {
      const t = document.createElement('div');
      t.className = 'p4-toast';
      t.id = 'p4-toast';
      document.body.appendChild(t);
      this._toast = t;
    }

    /* Initial renders */
    this.renderToolbar();
    this.renderProgress();
    this.refresh();
  },

  /* ════════════════════════════════════════════════════════════
     renderToolbar()  —  Navy header bar
     ════════════════════════════════════════════════════════════ */
  renderToolbar() {
    const el = document.getElementById('p4-toolbar');
    if (!el) return;

    const S = PricingState4;
    const adminToggle = S.admin.enabled
      ? '<span class="p4-admin-badge active" id="p4-admin-toggle">🔓 وضع المسؤول</span>'
      : '<span class="p4-admin-badge" id="p4-admin-toggle">🔒 وضع المسؤول</span>';

    el.className = 'p4-toolbar';
    el.innerHTML = `
      <div class="p4-toolbar-brand">
        <div class="p4-toolbar-mark">م</div>
        <div class="p4-toolbar-titlewrap">
          <div class="p4-toolbar-title">
            محرك التسعير
            <span class="p4-toolbar-title-chip">v4</span>
          </div>
          <div class="p4-toolbar-sub">مجموعة معمار للاستشارات الهندسية · Memar Engineering Consultants</div>
        </div>
      </div>
      <div class="p4-toolbar-actions">
        ${adminToggle}
        <button class="p4-btn p4-btn-outline" id="p4-btn-reset" style="padding:8px 14px;font-size:12px;">🔄 إعادة تعيين</button>
      </div>
    `;

    /* Admin toggle */
    const adminBtn = document.getElementById('p4-admin-toggle');
    if (adminBtn) {
      adminBtn.onclick = () => {
        S.admin.enabled = !S.admin.enabled;
        this.renderToolbar();
        this.refresh();
        this.showToast(S.admin.enabled ? '🔓 وضع المسؤول مفعّل' : '🔒 وضع المسؤول معطّل');
      };
    }

    /* Reset button */
    const resetBtn = document.getElementById('p4-btn-reset');
    if (resetBtn) {
      resetBtn.onclick = () => {
        Object.assign(S.client, { id: '', name: '', phone: '', email: '' });
        Object.assign(S.project, { region: '', block: '', plot: '', category: 'residential', type: 'new_const', area: 400, floors: 1, customArea: false });
        Object.assign(S.pricing, { mode: 'package', packageId: 'licensing', services: ['arch','struct','elec','plumb','facade3d','permit','elec_appr','soil_coord'], addons: [], editedPrices: {}, discount: { type: 'none', value: 0 }, includeGovFees: true });
        S.step = 1;
        S.notes = '';
        S.activeSvcTab = 'licensing';
        this.renderProgress();
        this.refresh();
        this.showToast('✅ تم إعادة التعيين');
      };
    }
  },

  /* ════════════════════════════════════════════════════════════
     renderProgress()  —  Step indicator dots + lines
     ════════════════════════════════════════════════════════════ */
  renderProgress() {
    const el = document.getElementById('p4-progress');
    if (!el) return;

    const current = PricingState4.step;
    let html = '';

    this.STEPS.forEach((s, i) => {
      const isDone   = s.num < current;
      const isActive = s.num === current;
      const cls      = isDone ? 'done' : (isActive ? 'active' : '');

      html += `
        <div class="p4-step-indicator ${cls}" data-step="${s.num}">
          <div class="p4-step-dot ${cls}">${isDone ? '✓' : s.num}</div>
          <div class="p4-step-label">${s.label}</div>
        </div>
      `;
      if (i < this.STEPS.length - 1) {
        html += `<div class="p4-step-line ${isDone ? 'done' : ''}"></div>`;
      }
    });

    el.className = 'p4-progress';
    el.innerHTML = html;

    /* Step click navigation */
    el.querySelectorAll('.p4-step-indicator').forEach(ind => {
      ind.onclick = () => {
        const target = parseInt(ind.dataset.step);
        if (target <= current) {
          PricingState4.step = target;
          this.renderProgress();
          this.refresh();
        }
      };
    });
  },

  /* ════════════════════════════════════════════════════════════
     refresh()  —  Re-renders the workspace for current step
     ════════════════════════════════════════════════════════════ */
  refresh() {
    const ws = document.getElementById('p4-workspace');
    if (!ws) return;

    const step = PricingState4.step;
    let html = '';

    const main = document.getElementById('p4-main');
    const sideEl = document.getElementById('p4-summary');
    if (main) {
      if (step === 2) {
        main.style.gridTemplateColumns = '1fr';
        if (sideEl) sideEl.style.display = 'none';
      } else {
        main.style.gridTemplateColumns = '';
        if (sideEl) sideEl.style.display = '';
      }
    }

    switch (step) {
      case 1:  html = this.renderStep1(); break;
      case 2:  html = this.renderStep2(); break;
      case 3:  html = this.renderStep3(); break;
      case 4:  html = this.renderStep4(); break;
    }

    /* Navigation buttons */
    html += `
      <div class="p4-nav-btns">
        ${step > 1 ? '<button class="p4-nav-btn prev" id="p4-prev">→ السابق</button>' : '<div></div>'}
        ${step < 4 ? '<button class="p4-nav-btn next" id="p4-next">التالي ←</button>' : '<button class="p4-nav-btn next" id="p4-generate" style="background:var(--p4-success)">📄 إنشاء التسعيرة</button>'}
      </div>
    `;

    ws.innerHTML = html;
    ws.className = 'p4-slide-right';

    /* Bind step-specific events */
    if (step === 1) this._bindStep1();
    if (step === 2) this._bindStep2();
    if (step === 3) this._bindStep3();

    /* Nav button listeners */
    const prevBtn = document.getElementById('p4-prev');
    if (prevBtn) {
      prevBtn.onclick = () => {
        if (PricingState4.step > 1) {
          PricingState4.step--;
          this.renderProgress();
          this.refresh();
        }
      };
    }

    const nextBtn = document.getElementById('p4-next');
    if (nextBtn) {
      nextBtn.onclick = () => {
        const S = PricingState4;
        /* ── Step Validation ── */
        if (S.step === 2 && S.pricing.services.length === 0) {
          this.showToast('⚠️ يرجى اختيار خدمة واحدة على الأقل', 3000);
          return;
        }
        if (S.step === 3 && !S.client.name.trim()) {
          this.showToast('⚠️ يرجى إدخال اسم العميل', 3000);
          return;
        }
        if (S.step < 4) {
          S.step++;
          this.renderProgress();
          this.refresh();
        }
      };
    }

    const genBtn = document.getElementById('p4-generate');
    if (genBtn) {
      genBtn.onclick = () => {
        this.saveQuote();
        this.printQuote();
      };
    }

    /* Always refresh the summary panel */
    this.refreshSummary();
  },

  /* ════════════════════════════════════════════════════════════
     renderStep1()  —  القطاع + نوع المشروع + المساحة
     ════════════════════════════════════════════════════════════ */
  renderStep1() {
    const S = PricingState4;
    const cat = S.project.category;
    const tier = PriceCalc4.getAreaTier(S.project.area);

    /* ── Category grid ── */
    let catCards = '';
    PricingDB4.categories.forEach(c => {
      const active = c.id === cat ? 'active' : '';
      catCards += `
        <div class="p4-cat-card ${active}" data-cat="${c.id}" style="--cat-c:${c.color}">
          <div class="p4-cat-icon">${c.icon}</div>
          <div class="p4-cat-label">${c.label}</div>
          <div class="p4-cat-desc">${c.desc}</div>
        </div>`;
    });

    /* ── Project type pills ── */
    const types = [
      { id: 'new_const', label: '🏗️ بناء جديد', icon: '' },
      { id: 'mod_add',   label: '🔧 تعديل / إضافة', icon: '' },
    ];
    let typePills = '';
    types.forEach(t => {
      const active = S.project.type === t.id ? 'active' : '';
      typePills += `<div class="p4-type-pill ${active}" data-type="${t.id}">${t.label}</div>`;
    });

    /* ── Area presets ── */
    const presets = [200, 300, 400, 500, 600, 750, 1000, 1500];
    let presetBtns = '';
    presets.forEach(v => {
      const active = S.project.area === v ? 'active' : '';
      presetBtns += `<div class="p4-area-preset ${active}" data-area="${v}">${v} م²</div>`;
    });

    /* ── Tier badge ── */
    const tierCls = tier.custom ? 'custom' : 'normal';
    const tierLabel = tier.custom ? '⚠️ تسعير يدوي' : `${tier.label} — معامل ×${tier.mult}`;

    return `
      <!-- Category Card -->
      <div class="p4-card p4-animate-in">
        <div class="p4-card-header">
          <span class="p4-card-icon">🏗️</span>
          <div>
            <div class="p4-card-title">القطاع ونوع المشروع</div>
            <div class="p4-card-sub">اختر قطاع المشروع ونوع الخدمة</div>
          </div>
        </div>
        <div class="p4-card-body">
          <div class="p4-cat-grid" id="p4-cat-grid">
            ${catCards}
          </div>
          <div class="p4-type-pills" id="p4-type-pills">
            ${typePills}
          </div>
        </div>
      </div>

      <!-- Area Card -->
      <div class="p4-card p4-animate-in" style="animation-delay:.1s">
        <div class="p4-card-header">
          <span class="p4-card-icon">📐</span>
          <div>
            <div class="p4-card-title">مساحة المشروع</div>
            <div class="p4-card-sub">حدد المساحة الإجمالية بالمتر المربع</div>
          </div>
        </div>
        <div class="p4-card-body">
          <div class="p4-area-wrap">
            <div class="p4-area-display">
              <span class="p4-area-num" id="p4-area-val">${S.project.area}</span>
              <span class="p4-area-unit">م²</span>
            </div>
            <input type="range" class="p4-area-slider" id="p4-area-slider"
                   min="100" max="3000" step="50" value="${S.project.area}">
            <div class="p4-area-presets" id="p4-area-presets">
              ${presetBtns}
            </div>
            <div style="text-align:center;margin-top:10px;">
              <span class="p4-tier-badge ${tierCls}" id="p4-tier-badge">${tierLabel}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Floors Card (for multi-story sectors) -->
      <div class="p4-card p4-animate-in" style="animation-delay:.15s">
        <div class="p4-card-header">
          <span class="p4-card-icon">🏢</span>
          <div>
            <div class="p4-card-title">عدد الأدوار</div>
            <div class="p4-card-sub">عدد طوابق المبنى</div>
          </div>
        </div>
        <div class="p4-card-body">
          <div class="p4-input-row" style="max-width:280px;margin:0 auto;">
            <div class="p4-field">
              <label class="p4-label">الأدوار</label>
              <input type="number" class="p4-input" id="p4-floors" min="1" max="50" value="${S.project.floors}" style="text-align:center;font-size:18px;font-weight:800;">
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /** Bind events for Step 1 */
  _bindStep1() {
    const S = PricingState4;
    const self = this;

    /* Category cards */
    document.querySelectorAll('#p4-cat-grid .p4-cat-card').forEach(card => {
      card.onclick = () => {
        S.project.category = card.dataset.cat;
        /* Auto-select best default package for this sector */
        const sectorPkgs = PricingDB4.packages.filter(p => p.sectors && p.sectors.includes(S.project.category) && p.id !== 'custom');
        if (sectorPkgs.length) {
          const popular = sectorPkgs.find(p => p.popular) || sectorPkgs[0];
          S.pricing.packageId = popular.id;
          S.pricing.services = [...(popular.services || [])];
        } else {
          S.pricing.packageId = 'custom';
          S.pricing.services = [];
        }
        self.refresh();
      };
    });

    /* Project type pills */
    document.querySelectorAll('#p4-type-pills .p4-type-pill').forEach(pill => {
      pill.onclick = () => {
        S.project.type = pill.dataset.type;
        self.refresh();
      };
    });

    /* Area slider */
    const slider = document.getElementById('p4-area-slider');
    const areaVal = document.getElementById('p4-area-val');
    const tierBadge = document.getElementById('p4-tier-badge');
    if (slider) {
      slider.oninput = () => {
        const v = parseInt(slider.value);
        S.project.area = v;
        if (areaVal) areaVal.textContent = v;
        /* Update tier badge live */
        const t = PriceCalc4.getAreaTier(v);
        if (tierBadge) {
          tierBadge.className = 'p4-tier-badge ' + (t.custom ? 'custom' : 'normal');
          tierBadge.textContent = t.custom ? '⚠️ تسعير يدوي' : `${t.label} — معامل ×${t.mult}`;
        }
        /* Update preset active states */
        document.querySelectorAll('#p4-area-presets .p4-area-preset').forEach(p => {
          p.classList.toggle('active', parseInt(p.dataset.area) === v);
        });
        self.refreshSummary();
      };
    }

    /* Area presets */
    document.querySelectorAll('#p4-area-presets .p4-area-preset').forEach(btn => {
      btn.onclick = () => {
        const v = parseInt(btn.dataset.area);
        S.project.area = v;
        if (slider) slider.value = v;
        if (areaVal) areaVal.textContent = v;
        /* Refresh fully to update tier + presets */
        self.refresh();
      };
    });

    /* Floors input */
    const floorsInput = document.getElementById('p4-floors');
    if (floorsInput) {
      floorsInput.oninput = () => {
        S.project.floors = Math.max(1, parseInt(floorsInput.value) || 1);
        self.refreshSummary();
      };
    }
  },

  /* ════════════════════════════════════════════════════════════
     renderStep2()  —  الباقات + الخدمات + الإضافات
     ════════════════════════════════════════════════════════════ */
  renderStep2() {
    const S = PricingState4;
    const area = S.project.area;
    const cat = S.project.category;

    /* ── Filter packages ── */
    const allPkgs = PricingDB4.packages.filter(p => {
      if (!p.sectors || !p.sectors.includes(cat)) return false;
      if (p.projectType && p.projectType !== S.project.type) return false;
      return true;
    });

    /* ── Dropdown options ── */
    const pkgOptions = `<option value="custom" ${S.pricing.packageId==='custom'?'selected':''}>📋 تسعير مفصّل (اختيار يدوي)</option>`
      + allPkgs.filter(p=>p.id!=='custom').map(p=>`<option value="${p.id}" ${S.pricing.packageId===p.id?'selected':''}>${p.icon} ${p.name}</option>`).join('');

    /* ── Selected package card ── */
    let pkgCardHtml = '';
    const selPkg = allPkgs.find(p=>p.id===S.pricing.packageId);
    if (selPkg && selPkg.id !== 'custom') {
      const p = selPkg;
      const price = PriceCalc4.calcPackagePrice(p, area);
      const priceStr = price===null ? 'يُحدد لاحقاً' : this.fmt(price);
      let svcsHtml = '';
      (p.services||[]).slice(0,6).forEach(sid=>{
        const svc = PricingDB4.services.find(s=>s.id===sid);
        if(svc) svcsHtml += `<div style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:12px;color:var(--p4-text-2);"><span style="color:var(--p4-success);font-weight:700;">✓</span>${svc.name}</div>`;
      });
      if((p.services||[]).length>6) svcsHtml += `<div style="font-size:11px;color:var(--p4-primary);font-weight:700;margin-top:4px;">+${p.services.length-6} خدمات أخرى</div>`;
      pkgCardHtml = `
        <div style="margin-top:14px;border-radius:14px;border:2px solid var(--p4-primary);overflow:hidden;background:linear-gradient(135deg,var(--p4-primary-50) 0%,#fff 100%);">
          <div style="background:linear-gradient(135deg,var(--p4-primary),${p.color||'#4338CA'});padding:16px 20px;display:flex;align-items:center;gap:12px;">
            <div style="font-size:32px;">${p.icon}</div>
            <div>
              <div style="font-size:17px;font-weight:900;color:#fff;">${p.name}</div>
              <div style="font-size:12px;color:rgba(255,255,255,.75);margin-top:2px;">${p.desc}</div>
            </div>
            <div style="margin-right:auto;text-align:left;">
              <div style="font-size:22px;font-weight:900;color:#fff;">${priceStr}</div>
              ${p.duration?`<div style="font-size:11px;color:rgba(255,255,255,.7);">⏱ ${p.duration} يوم</div>`:''}
            </div>
          </div>
          <div style="padding:14px 20px;">${svcsHtml}</div>
        </div>`;
    }

    /* ── Service lists per group (No Tabs) ── */
    const activePkg = PricingDB4.packages.find(p => p.id === S.pricing.packageId);
    let svcsListHtml = '';
    
    // Fallback in case localStorage overwrote the DB without the new serviceGroups array
    if (!PricingDB4.serviceGroups || PricingDB4.serviceGroups.length === 0) {
      PricingDB4.serviceGroups = [
        { id: 'licensing', name: 'التراخيص' },
        { id: 'engineering', name: 'الخدمات الهندسية' },
        { id: 'other', name: 'خدمات أخرى' }
      ];
    }
    
    (PricingDB4.serviceGroups || []).forEach(g => {
      // If no category selected yet, show all visible services; otherwise filter by category
      // Show all visible services when no category selected yet; otherwise filter by category
      const svcsInGroup = PricingDB4.services.filter(s => s.group === g.id && (S.admin.enabled || (s.visible && (!cat || s.categories.includes(cat)))));
      if (!S.admin.enabled && svcsInGroup.length === 0) return;
      
      let groupHtml = `<div class="p4-svc-group-section" style="background:#f8fafc; padding:16px; border-radius:12px; border:1px solid var(--p4-border); display:flex; flex-direction:column; height:100%;">`;
      
      // Group Header
      if (S.admin.enabled) {
        groupHtml += `
          <div style="margin-bottom:12px; display:flex; align-items:center; border-bottom:2px solid var(--p4-border); padding-bottom:6px;">
            <input type="text" class="p4-admin-group-name" data-group-id="${g.id}" value="${g.name}" style="font-size:16px; font-weight:800; color:var(--p4-primary); border:1px solid transparent; background:transparent; outline:none; font-family:inherit; transition:0.2s;" onfocus="this.style.border='1px solid var(--p4-border)'; this.style.background='#fff';" onblur="this.style.border='1px solid transparent'; this.style.background='transparent';">
            <span style="font-size:11px; margin-right:8px; color:var(--p4-text-2);">(اسحب خدمة إلى هنا لنقلها)</span>
          </div>
        `;
      } else {
        groupHtml += `<h3 style="font-size:16px; font-weight:800; color:var(--p4-primary); margin-bottom:12px; border-bottom:2px solid var(--p4-border); padding-bottom:6px;">${g.name}</h3>`;
      }
      
      // Group list container (droppable in admin mode)
      groupHtml += `<div class="p4-svc-group-list" data-group-id="${g.id}" style="display:flex; flex-direction:column; gap:8px; flex:1; min-height:50px; padding-bottom:10px;">`;
      
      svcsInGroup.forEach(svc => {
        const isSelected = S.pricing.services.includes(svc.id);
        const inPkg = activePkg && activePkg.id !== 'custom' && (activePkg.services || []).includes(svc.id);
        const rate = PriceCalc4.getServiceRate(svc.id);
        const amount = PriceCalc4.calcService(svc.id, area);
        const isManual = rate === null;
        const isEdited = S.pricing.editedPrices[svc.id] !== undefined;

        /* Badge */
        let badge = '';
        if (inPkg) badge = '<span class="p4-svc-badge pkg">في الباقة</span>';
        else if (isManual) badge = '<span class="p4-svc-badge manual">يدوي</span>';

        /* Price column */
        let priceCol = '';
        if (S.admin.enabled) {
          priceCol = `<div class="p4-svc-price-col">
            <input type="number" class="p4-admin-input" data-svc="${svc.id}" value="${rate !== null ? rate : ''}" placeholder="السعر">
            <div class="p4-svc-rate">${svc.unit}</div>
          </div>`;
        } else {
          priceCol = `<div class="p4-svc-price-col">
            <div class="p4-svc-amt">${isManual ? '—' : this.fmt(amount)}</div>
            <div class="p4-svc-rate">${rate !== null ? rate + '/' + svc.unit : svc.unit}</div>
          </div>`;
        }

        /* Duration & phase chips */
        const durationChip = svc.duration ? `<span class="p4-svc-chip">⏱ ${svc.duration} يوم</span>` : '';
        const phaseChip = svc.phase ? `<span class="p4-svc-chip phase">📌 ${svc.phase}</span>` : '';
        
        const draggableAttr = S.admin.enabled ? `draggable="true" style="cursor:grab;"` : '';

        const cardBg = isSelected ? 'linear-gradient(135deg,var(--p4-primary-50),#fff)' : '#fff';
        const cardBorder = isSelected ? '2px solid var(--p4-primary)' : '1.5px solid var(--p4-border)';
        const chkBg = isSelected ? 'var(--p4-primary)' : '#fff';
        const chkBorder = isSelected ? 'var(--p4-primary)' : 'var(--p4-border)';
        groupHtml += `
          <div class="p4-svc-item ${isSelected?'active':''}" data-svc="${svc.id}" ${draggableAttr}
            style="display:flex;align-items:flex-start;gap:10px;padding:14px;border-radius:14px;border:${cardBorder};background:${cardBg};box-shadow:0 2px 8px rgba(0,0,0,0.05);transition:all .2s;cursor:pointer;">
            <div style="width:22px;height:22px;border-radius:6px;border:2px solid ${chkBorder};background:${chkBg};color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:900;flex-shrink:0;margin-top:2px;">${isSelected?'✓':''}</div>
            <div style="width:44px;height:44px;border-radius:10px;background:${isSelected?'var(--p4-primary)':'var(--p4-bg)'};display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;box-shadow:0 2px 6px rgba(0,0,0,0.08);${S.admin.enabled?'pointer-events:none;':''}">${svc.icon}</div>
            <div style="flex:1;min-width:0;${S.admin.enabled?'pointer-events:none;':''}">
              <div style="font-size:14px;font-weight:800;color:${isSelected?'var(--p4-primary)':'var(--p4-text)'};margin-bottom:3px;display:flex;align-items:center;gap:6px;flex-wrap:wrap;">${svc.name} ${badge}</div>
              <div style="font-size:11.5px;color:var(--p4-text-2);line-height:1.5;margin-bottom:6px;">${svc.desc}</div>
              <div style="display:flex;gap:4px;flex-wrap:wrap;">${durationChip}${phaseChip}</div>
            </div>
            ${priceCol}
            <button class="p4-svc-detail-btn" data-svc-detail="${svc.id}" title="تفاصيل الخدمة"
              style="width:28px;height:28px;border-radius:7px;border:1px solid var(--p4-border);background:#fff;cursor:pointer;display:flex;align-items:center;justify-content:center;flex-shrink:0;font-size:13px;">ℹ️</button>
          </div>`;
      });
      
      groupHtml += `</div></div>`; // Close list and section
      svcsListHtml += groupHtml;
    });

    /* ── Addons ── */
    let addonsHtml = '';
    PricingDB4.addons.filter(a => a.visible).forEach(a => {
      const active = S.pricing.addons.includes(a.id) ? 'active' : '';
      addonsHtml += `
        <div class="p4-cat-card ${active}" data-addon="${a.id}" style="--cat-c:var(--p4-primary);padding:12px 8px;">
          <div class="p4-cat-icon">${a.icon}</div>
          <div class="p4-cat-label" style="font-size:11px;">${a.name}</div>
          <div class="p4-cat-desc" style="color:var(--p4-primary);font-weight:700;">${this.fmt(a.price)}</div>
        </div>`;
    });

    return `
      <!-- Top row: Package selector + Quote summary -->
      <div style="display:grid;grid-template-columns:1fr 380px;gap:20px;margin-bottom:20px;align-items:start;">

        <!-- Package selector card -->
        <div class="p4-card p4-animate-in">
          <div class="p4-card-header">
            <span class="p4-card-icon">📦</span>
            <div>
              <div class="p4-card-title">اختيار الباقة</div>
              <div class="p4-card-sub">اختر باقة أو تسعير مفصّل حسب الخدمات</div>
            </div>
          </div>
          <div class="p4-card-body">
            <select id="p4-pkg-selector"
              style="width:100%;padding:13px 16px;font-family:inherit;font-size:15px;font-weight:800;color:var(--p4-primary);border:2px solid var(--p4-primary);border-radius:10px;outline:none;cursor:pointer;background:#fff;appearance:none;-webkit-appearance:none;">
              ${pkgOptions}
            </select>
            ${pkgCardHtml}
          </div>
        </div>

        <!-- Inline quote summary -->
        <div id="p4-step2-summary" class="p4-animate-in" style="animation-delay:.05s;"></div>
      </div>

      <!-- Services Card -->
      <div class="p4-card p4-animate-in" style="animation-delay:.1s">
        <div class="p4-card-header">
          <span class="p4-card-icon">🔧</span>
          <div style="flex:1;">
            <div class="p4-card-title">الخدمات المتاحة</div>
            <div class="p4-card-sub">اختر الخدمات المطلوبة — المختار: ${S.pricing.services.length}</div>
          </div>
          ${S.admin.enabled ? `<button id="p4-add-new-svc-btn" style="padding:6px 12px; background:var(--p4-primary); color:#fff; border-radius:8px; font-size:12px; font-weight:800; border:none; cursor:pointer; box-shadow:0 2px 8px rgba(67,56,202,0.25);">+ إضافة خدمة</button>` : ''}
        </div>
        <div class="p4-card-body" style="padding:16px; display:grid; grid-template-columns:repeat(3, 1fr); gap:16px; align-items:stretch;" id="p4-svc-list-container">
          ${svcsListHtml}
        </div>
      </div>

      <!-- Addons Card -->
      <div class="p4-card p4-animate-in" style="animation-delay:.15s">
        <div class="p4-card-header">
          <span class="p4-card-icon">🎁</span>
          <div>
            <div class="p4-card-title">إضافات</div>
            <div class="p4-card-sub">خدمات إضافية اختيارية</div>
          </div>
        </div>
        <div class="p4-card-body">
          <div class="p4-cat-grid" id="p4-addon-grid" style="grid-template-columns:repeat(3,1fr);">
            ${addonsHtml}
          </div>
        </div>
      </div>
    `;
  },

  /** Bind events for Step 2 */
  _bindStep2() {
    const S = PricingState4;
    const self = this;

    /* Populate inline summary on first load */
    this.refreshSummary();

    /* Package dropdown */
    const pkgSel = document.getElementById('p4-pkg-selector');
    if (pkgSel) {
      pkgSel.onchange = () => {
        const pkgId = pkgSel.value;
        S.pricing.packageId = pkgId;
        const pkg = PricingDB4.packages.find(p => p.id === pkgId);
        if (pkg && pkg.id !== 'custom') {
          const merged = new Set([...S.pricing.services, ...(pkg.services||[])]);
          S.pricing.services = [...merged];
        }
        self.refresh();
        self.showToast(`📦 تم اختيار: ${pkg ? pkg.name : 'تسعير مفصّل'}`);
      };
    }

    /* Service toggle */
    document.querySelectorAll('.p4-svc-item').forEach(item => {
      item.onclick = (e) => {
        /* Don't toggle if clicking admin input or detail button */
        if (e.target.closest('.p4-admin-input') || e.target.closest('.p4-svc-detail-btn')) return;
        const sid = item.dataset.svc;
        const idx = S.pricing.services.indexOf(sid);
        if (idx >= 0) S.pricing.services.splice(idx, 1);
        else S.pricing.services.push(sid);
        self.refresh();
      };
      
      /* Drag and Drop Setup */
      if (S.admin.enabled) {
        item.ondragstart = (e) => {
          e.dataTransfer.setData('text/plain', item.dataset.svc);
          item.style.opacity = '0.5';
        };
        item.ondragend = () => {
          item.style.opacity = '1';
        };
      }
    });

    /* Group Droppable Areas & Group Name Editing */
    if (S.admin.enabled) {
      document.querySelectorAll('.p4-svc-group-list').forEach(list => {
        list.ondragover = (e) => { e.preventDefault(); list.style.background = 'rgba(67,56,202,0.05)'; };
        list.ondragleave = (e) => { list.style.background = 'transparent'; };
        list.ondrop = (e) => {
          e.preventDefault();
          list.style.background = 'transparent';
          const sid = e.dataTransfer.getData('text/plain');
          const targetGroupId = list.dataset.groupId;
          if (sid && targetGroupId) {
            const svc = PricingDB4.services.find(s => s.id === sid);
            if (svc && svc.group !== targetGroupId) {
              svc.group = targetGroupId;
              if (PricingDB4.saveToStorage) PricingDB4.saveToStorage();
              self.refresh();
              self.showToast('✅ تم نقل الخدمة بنجاح');
            }
          }
        };
      });

      document.querySelectorAll('.p4-admin-group-name').forEach(inp => {
        inp.onchange = () => {
          const groupId = inp.dataset.groupId;
          const val = inp.value.trim();
          if (val) {
            const grp = PricingDB4.serviceGroups.find(g => g.id === groupId);
            if (grp) {
              grp.name = val;
              if (PricingDB4.saveToStorage) PricingDB4.saveToStorage();
              self.showToast('✅ تم تعديل مسمى القسم');
            }
          }
        };
      });
    }

    /* Service detail button */
    document.querySelectorAll('.p4-svc-detail-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        self.openServiceDetail(btn.dataset.svcDetail);
      };
    });

    const addNewSvcBtn = document.getElementById('p4-add-new-svc-btn');
    if (addNewSvcBtn) {
      addNewSvcBtn.onclick = (e) => {
        e.stopPropagation();
        const newId = 'svc_' + Date.now();
        const group = PricingDB4.serviceGroups && PricingDB4.serviceGroups.length ? PricingDB4.serviceGroups[0].id : 'licensing';
        const newSvc = {
          id: newId, group: group, name: 'خدمة جديدة', nameEn: 'New Service', icon: '⚙️', desc: '', baseRate: 0, unit: 'مقطوع', duration: null, phase: '', visible: true, categories: ['residential','investment','commercial','industrial','medical','general'], requires: [], conflicts: [], docs: [], notes: '', govFees: 0, conditions: [], steps: [], displayConfig: {showDuration:true,showPhase:true,showDocs:true,showGovFees:false,showConditions:true,showSteps:true}
        };
        PricingDB4.services.push(newSvc);
        Object.keys(PricingDB4.sectorRates).forEach(sector => { PricingDB4.sectorRates[sector][newId] = 0; });
        if (PricingDB4.saveToStorage) PricingDB4.saveToStorage();
        self.refresh();
        self.openServiceDetail(newId);
      };
    }

    /* Admin price inputs */
    if (S.admin.enabled) {
      document.querySelectorAll('#p4-svc-list-container .p4-admin-input').forEach(inp => {
        inp.onclick = (e) => e.stopPropagation();
        inp.oninput = () => {
          const sid = inp.dataset.svc;
          const val = parseFloat(inp.value);
          if (!isNaN(val) && val >= 0) {
            S.pricing.editedPrices[sid] = val;
          } else {
            delete S.pricing.editedPrices[sid];
          }
          self.refreshSummary();
        };
      });
    }

    /* Addon toggle */
    document.querySelectorAll('#p4-addon-grid .p4-cat-card').forEach(card => {
      card.onclick = () => {
        const aid = card.dataset.addon;
        const idx = S.pricing.addons.indexOf(aid);
        if (idx >= 0) S.pricing.addons.splice(idx, 1);
        else S.pricing.addons.push(aid);
        self.refresh();
      };
    });
  },

  /* ════════════════════════════════════════════════════════════
     renderStep4()  —  المراجعة النهائية
     ════════════════════════════════════════════════════════════ */
  renderStep4() {
    const S = PricingState4;
    const calc = PriceCalc4.calcTotal();
    const cat = PricingDB4.categories.find(c => c.id === S.project.category);
    const pkg = PricingDB4.packages.find(p => p.id === S.pricing.packageId);
    const today = new Date().toLocaleDateString('ar-KW', {year:'numeric',month:'long',day:'numeric'});

    /* ── Documents ── */
    const docSet = PricingDB4.documentsBySector?.[S.project.category]?.[S.project.type] || [];
    let docsHtml = '';
    docSet.forEach(d => {
      docsHtml += `<div style="display:flex;align-items:center;gap:8px;padding:5px 0;font-size:12px;color:${d.required ? 'var(--p4-success)' : 'var(--p4-text-2)'}">
        <span>${d.required ? '✅' : '○'}</span><span>${d.name}${d.required ? ' *' : ''}</span></div>`;
    });

    /* ── Timeline ── */
    let timelineHtml = '';
    const selectedSvcs = S.pricing.services.map(id => PricingDB4.services.find(s => s.id === id)).filter(Boolean);
    selectedSvcs.filter(s => s.duration).forEach(s => {
      timelineHtml += `<div style="display:flex;align-items:center;gap:6px;font-size:11px;color:var(--p4-text-2);padding:4px 8px;background:#F8FAFC;border-radius:8px;">
        <span>${s.icon}</span><span>${s.name}</span>
        <span style="margin-right:auto;font-weight:700;color:var(--p4-primary)">${s.duration} يوم</span></div>`;
    });

    /* ── Payment terms ── */
    let payHtml = '';
    PricingDB4.paymentTerms.forEach(t => {
      payHtml += `<div style="display:flex;justify-content:space-between;padding:6px 10px;font-size:12px;border-radius:8px;background:#F8FAFC;">
        <span style="color:var(--p4-text-2)">${t.desc}</span>
        <span style="font-weight:800;color:var(--p4-primary)">${t.pct}%</span></div>`;
    });

    /* ── Conditions ── */
    let condHtml = '<ul style="margin:0;padding:0 16px;font-size:11px;color:var(--p4-text-2);line-height:2;">';
    PricingDB4.generalConditions.forEach(c => { condHtml += `<li>${c}</li>`; });
    condHtml += '</ul>';

    /* ── Gifts ── */
    let giftsHtml = '';
    const gifts = (pkg && pkg.gifts) ? pkg.gifts : [];
    gifts.forEach(g => {
      giftsHtml += `<div style="display:flex;align-items:center;gap:6px;padding:4px 0;font-size:12px;color:var(--p4-success)"><span>🎁</span>${g}</div>`;
    });

    return `
      <!-- Review Header -->
      <div class="p4-card p4-animate-in">
        <div class="p4-card-header">
          <span class="p4-card-icon">✅</span>
          <div>
            <div class="p4-card-title">المراجعة النهائية</div>
            <div class="p4-card-sub">راجع العرض قبل الإنشاء — ${today}</div>
          </div>
        </div>
        <div class="p4-card-body">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
            <div style="padding:12px;background:#F8FAFC;border-radius:10px;">
              <div style="font-size:10px;color:var(--p4-text-3);font-weight:600;">العميل</div>
              <div style="font-size:14px;font-weight:800;color:var(--p4-text);margin-top:4px;">${S.client.name || '—'}</div>
              <div style="font-size:11px;color:var(--p4-text-2);margin-top:2px;">${S.client.phone || ''} ${S.client.email ? '· ' + S.client.email : ''}</div>
            </div>
            <div style="padding:12px;background:#F8FAFC;border-radius:10px;">
              <div style="font-size:10px;color:var(--p4-text-3);font-weight:600;">المشروع</div>
              <div style="font-size:14px;font-weight:800;color:var(--p4-text);margin-top:4px;">${cat ? cat.icon + ' ' + cat.label : '—'} — ${S.project.area} م²</div>
              <div style="font-size:11px;color:var(--p4-text-2);margin-top:2px;">${S.project.region || ''} ${S.project.block ? 'قطعة ' + S.project.block : ''} ${S.project.plot ? 'قسيمة ' + S.project.plot : ''}</div>
            </div>
          </div>
        </div>
      </div>

      ${gifts.length ? `
      <!-- Gifts -->
      <div class="p4-card p4-animate-in" style="animation-delay:.05s">
        <div class="p4-card-header"><span class="p4-card-icon">🎁</span><div><div class="p4-card-title">هدايا الباقة</div></div></div>
        <div class="p4-card-body">${giftsHtml}</div>
      </div>` : ''}

      ${docSet.length ? `
      <!-- Documents -->
      <div class="p4-card p4-animate-in" style="animation-delay:.1s">
        <div class="p4-card-header"><span class="p4-card-icon">📂</span><div><div class="p4-card-title">المستندات المطلوبة</div><div class="p4-card-sub">حسب القطاع ونوع المشروع</div></div></div>
        <div class="p4-card-body">${docsHtml}</div>
      </div>` : ''}

      ${timelineHtml ? `
      <!-- Timeline -->
      <div class="p4-card p4-animate-in" style="animation-delay:.15s">
        <div class="p4-card-header"><span class="p4-card-icon">⏱️</span><div><div class="p4-card-title">الجدول الزمني</div><div class="p4-card-sub">مدة تنفيذ كل خدمة</div></div></div>
        <div class="p4-card-body"><div style="display:flex;flex-direction:column;gap:6px;">${timelineHtml}</div></div>
      </div>` : ''}

      <!-- Payment Terms -->
      <div class="p4-card p4-animate-in" style="animation-delay:.2s">
        <div class="p4-card-header"><span class="p4-card-icon">💳</span><div><div class="p4-card-title">شروط الدفع</div></div></div>
        <div class="p4-card-body"><div style="display:flex;flex-direction:column;gap:6px;">${payHtml}</div></div>
      </div>

      <!-- Conditions -->
      <div class="p4-card p4-animate-in" style="animation-delay:.25s">
        <div class="p4-card-header"><span class="p4-card-icon">📋</span><div><div class="p4-card-title">الشروط العامة</div></div></div>
        <div class="p4-card-body">${condHtml}</div>
      </div>

      ${S.notes ? `
      <!-- Notes -->
      <div class="p4-card p4-animate-in" style="animation-delay:.3s">
        <div class="p4-card-header"><span class="p4-card-icon">📝</span><div><div class="p4-card-title">ملاحظات</div></div></div>
        <div class="p4-card-body"><div style="font-size:12px;color:#92400E;padding:10px 12px;background:#FFFBEB;border-radius:8px;border-right:3px solid #FCD34D;">${S.notes}</div></div>
      </div>` : ''}
    `;
  },

  /* ════════════════════════════════════════════════════════════
     renderStep3()  —  بيانات العميل والمشروع
     ════════════════════════════════════════════════════════════ */
  renderStep3() {
    const S = PricingState4;

    return `
      <!-- Client Info Card -->
      <div class="p4-card p4-animate-in">
        <div class="p4-card-header">
          <span class="p4-card-icon">👤</span>
          <div>
            <div class="p4-card-title">بيانات العميل</div>
            <div class="p4-card-sub">معلومات العميل للعرض</div>
          </div>
        </div>
        <div class="p4-card-body">
          <div class="p4-input-row">
            <div class="p4-field">
              <label class="p4-label">اسم العميل</label>
              <input type="text" class="p4-input" id="p4-client-name" placeholder="الاسم الكامل" value="${S.client.name}">
            </div>
            <div class="p4-field">
              <label class="p4-label">رقم الهاتف</label>
              <input type="tel" class="p4-input" id="p4-client-phone" placeholder="9XXXXXXX" value="${S.client.phone}" dir="ltr">
            </div>
          </div>
          <div class="p4-input-row" style="margin-top:12px;">
            <div class="p4-field">
              <label class="p4-label">البريد الإلكتروني</label>
              <input type="email" class="p4-input" id="p4-client-email" placeholder="email@example.com" value="${S.client.email}" dir="ltr">
            </div>
            <div class="p4-field">
              <label class="p4-label">الرقم المدني</label>
              <input type="text" class="p4-input" id="p4-client-id" placeholder="الرقم المدني" value="${S.client.id}">
            </div>
          </div>
        </div>
      </div>

      <!-- Project Location Card -->
      <div class="p4-card p4-animate-in" style="animation-delay:.1s">
        <div class="p4-card-header">
          <span class="p4-card-icon">📍</span>
          <div>
            <div class="p4-card-title">موقع المشروع</div>
            <div class="p4-card-sub">بيانات العقار</div>
          </div>
        </div>
        <div class="p4-card-body">
          <div class="p4-input-row-3">
            <div class="p4-field">
              <label class="p4-label">المنطقة</label>
              <input type="text" class="p4-input" id="p4-region" placeholder="مثال: السالمية" value="${S.project.region}">
            </div>
            <div class="p4-field">
              <label class="p4-label">القطعة</label>
              <input type="text" class="p4-input" id="p4-block" placeholder="رقم القطعة" value="${S.project.block}">
            </div>
            <div class="p4-field">
              <label class="p4-label">القسيمة</label>
              <input type="text" class="p4-input" id="p4-plot" placeholder="رقم القسيمة" value="${S.project.plot}">
            </div>
          </div>
        </div>
      </div>

      <!-- Notes Card -->
      <div class="p4-card p4-animate-in" style="animation-delay:.15s">
        <div class="p4-card-header">
          <span class="p4-card-icon">📝</span>
          <div>
            <div class="p4-card-title">ملاحظات</div>
            <div class="p4-card-sub">ملاحظات إضافية على العرض</div>
          </div>
        </div>
        <div class="p4-card-body">
          <div class="p4-field">
            <textarea class="p4-input" id="p4-notes" rows="3" placeholder="ملاحظات إضافية..." style="resize:vertical;">${S.notes}</textarea>
          </div>
        </div>
      </div>
    `;
  },

  /** Bind events for Step 3 */
  _bindStep3() {
    const S = PricingState4;
    const bind = (id, obj, key) => {
      const el = document.getElementById(id);
      if (el) el.oninput = () => { obj[key] = el.value; this.refreshSummary(); };
    };
    bind('p4-client-name',  S.client,  'name');
    bind('p4-client-phone', S.client,  'phone');
    bind('p4-client-email', S.client,  'email');
    bind('p4-client-id',    S.client,  'id');
    bind('p4-region',       S.project, 'region');
    bind('p4-block',        S.project, 'block');
    bind('p4-plot',         S.project, 'plot');
    bind('p4-notes',        S,         'notes');
  },

  /* ════════════════════════════════════════════════════════════
     refreshSummary()  —  Right-side quote card
     ════════════════════════════════════════════════════════════ */
  refreshSummary() {
    // If on step 2, update the inline summary inside workspace
    const s2el = document.getElementById('p4-step2-summary');
    if (s2el) { s2el.innerHTML = this.renderSummary(); return; }

    const el = document.getElementById('p4-summary');
    if (!el) return;

    const S   = PricingState4;
    const calc = PriceCalc4.calcTotal();
    const cat  = PricingDB4.categories.find(c => c.id === S.project.category);
    const pkg  = PricingDB4.packages.find(p => p.id === S.pricing.packageId);

    /* Header gradient uses category color */
    const hdrColor = cat ? cat.color : '#4338CA';

    el.innerHTML = `
      <div class="p4-quote">
        <!-- Header -->
        <div class="p4-quote-header" style="background:linear-gradient(135deg,${hdrColor} 0%, ${hdrColor}dd 60%, ${hdrColor}c0 100%)">
          <div class="p4-quote-brandrow">
            <div class="p4-quote-mark">م</div>
            <div>
              <div class="p4-quote-company">مجموعة معمار</div>
              <div class="p4-quote-en">Memar Engineering Consultants</div>
            </div>
          </div>
          <div class="p4-quote-tagline">📄 عرض سعر — صالح لمدة 30 يوماً</div>
        </div>

        <!-- Meta -->
        <div class="p4-quote-meta">
          <div class="p4-quote-meta-cell">
            <div class="p4-quote-meta-lbl">القطاع</div>
            <div class="p4-quote-meta-val">${cat ? cat.icon + ' ' + cat.label : '—'}</div>
          </div>
          <div class="p4-quote-meta-cell">
            <div class="p4-quote-meta-lbl">المساحة</div>
            <div class="p4-quote-meta-val">${S.project.area} م²</div>
          </div>
          <div class="p4-quote-meta-cell">
            <div class="p4-quote-meta-lbl">الباقة</div>
            <div class="p4-quote-meta-val">${pkg ? pkg.icon + ' ' + pkg.name : 'تسعير مفصّل'}</div>
          </div>
          <div class="p4-quote-meta-cell">
            <div class="p4-quote-meta-lbl">الخدمات</div>
            <div class="p4-quote-meta-val">${S.pricing.services.length} خدمة</div>
          </div>
        </div>

        <!-- Body -->
        <div class="p4-quote-body">
          ${this._renderSummaryLines(calc)}
        </div>

        <!-- Totals -->
        <div class="p4-quote-body" style="padding-top:0">
          <div class="p4-qtotals">
            ${calc.mode === 'package' ? `
              <div class="p4-qtotal-row"><span>سعر الباقة</span><span>${calc.isManualPkg ? 'يُحدد لاحقاً' : this.fmt(calc.pkgPrice)}</span></div>
              <div class="p4-qtotal-row"><span>خدمات إضافية</span><span>${this.fmt(calc.extrasTotal)}</span></div>
            ` : `
              <div class="p4-qtotal-row"><span>إجمالي الخدمات</span><span>${this.fmt(calc.servicesTotal)}</span></div>
            `}
            <div class="p4-qtotal-row"><span>الإضافات</span><span>${this.fmt(calc.addonsTotal)}</span></div>
            <div class="p4-qtotal-row"><span>الرسوم الحكومية</span><span>${this.fmt(calc.feesTotal)}</span></div>
            <div class="p4-qgrand">
              <span class="p4-qgrand-lbl">الإجمالي</span>
              <span class="p4-qgrand-val">${calc.hasManualPricing ? '⚠️' : ''} ${this.fmt(calc.grandTotal)}</span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="p4-actions">
          <button class="p4-btn p4-btn-wa" id="p4-btn-wa">📱 إرسال عبر واتساب</button>
          <div class="p4-btn-row">
            <button class="p4-btn p4-btn-outline" id="p4-btn-copy">📋 نسخ</button>
            <button class="p4-btn p4-btn-primary" id="p4-btn-pdf">🖨️ طباعة</button>
          </div>
          <button class="p4-btn p4-btn-outline" id="p4-btn-save" style="color:var(--p4-success);border-color:var(--p4-success);">💾 حفظ العرض</button>
        </div>
      </div>
    `;

    /* Action buttons */
    const waBtn = document.getElementById('p4-btn-wa');
    if (waBtn) waBtn.onclick = () => this.exportWhatsApp();

    const copyBtn = document.getElementById('p4-btn-copy');
    if (copyBtn) copyBtn.onclick = () => this.copyQuote();

    const pdfBtn = document.getElementById('p4-btn-pdf');
    if (pdfBtn) pdfBtn.onclick = () => this.printQuote();

    const saveBtn = document.getElementById('p4-btn-save');
    if (saveBtn) saveBtn.onclick = () => this.saveQuote();
  },

  /* ════════════════════════════════════════════════════════════
     fmt(n)  —  Format number as Kuwaiti Dinar
     ════════════════════════════════════════════════════════════ */
  fmt(n) {
    if (n === null || n === undefined) return '—';
    return Number(n).toLocaleString('ar-KW', { minimumFractionDigits: 3, maximumFractionDigits: 3 }) + ' د.ك';
  },

  /* ════════════════════════════════════════════════════════════
     showToast(msg, duration)  —  Bottom notification
     ════════════════════════════════════════════════════════════ */
  showToast(msg, duration = 2500) {
    const t = document.getElementById('p4-toast') || this._toast;
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(this._toastTimer);
    this._toastTimer = setTimeout(() => t.classList.remove('show'), duration);
  },

  /* ══════════════════════════════════════════════════════════
     INTERNAL HELPERS
     ══════════════════════════════════════════════════════════ */

  /* (_placeholderCard removed — no longer needed) */

  /** Render summary line items from calc result */
  _renderSummaryLines(calc) {
    let html = '';

    if (calc.mode === 'package' && calc.pkg) {
      /* Package services */
      html += '<div class="p4-quote-section">📦 خدمات الباقة</div>';
      (calc.pkgServices || []).forEach(svc => {
        html += `
          <div class="p4-qline">
            <span class="p4-qline-name">${svc.icon} ${svc.name}</span>
            <span class="p4-qline-amt" style="color:var(--p4-success);font-size:11px;">مشمولة ✓</span>
          </div>`;
      });

      /* Extra services */
      if (calc.extraLines && calc.extraLines.length) {
        html += '<div class="p4-quote-section">➕ خدمات إضافية</div>';
        calc.extraLines.forEach(l => {
          html += `
            <div class="p4-qline">
              <span class="p4-qline-name">${l.svc.icon} ${l.svc.name}</span>
              <span class="p4-qline-amt">${l.isManual ? '<span style="color:var(--p4-danger);font-size:11px;">يُحدد لاحقاً</span>' : this.fmt(l.amount)}</span>
            </div>`;
        });
      }
    } else {
      /* Custom mode — all services */
      html += '<div class="p4-quote-section">🔧 الخدمات المختارة</div>';
      (calc.services || []).forEach(l => {
        html += `
          <div class="p4-qline">
            <span class="p4-qline-name">${l.svc.icon} ${l.svc.name}</span>
            <span class="p4-qline-amt">${l.isManual ? '<span style="color:var(--p4-danger);font-size:11px;">يُحدد لاحقاً</span>' : this.fmt(l.amount)}</span>
          </div>`;
      });
    }

    /* Addons */
    if (calc.addonLines && calc.addonLines.length) {
      html += '<div class="p4-quote-section">🎁 إضافات</div>';
      calc.addonLines.forEach(a => {
        html += `
          <div class="p4-qline">
            <span class="p4-qline-name">${a.icon} ${a.name}</span>
            <span class="p4-qline-amt">${this.fmt(a.total)}</span>
          </div>`;
      });
    }

    /* Gov fees */
    if (calc.feeLines && calc.feeLines.length) {
      html += '<div class="p4-quote-section">🏛️ الرسوم الحكومية</div>';
      calc.feeLines.forEach(f => {
        html += `
          <div class="p4-qline">
            <span class="p4-qline-name">📌 ${f.name}</span>
            <span class="p4-qline-amt">${this.fmt(f.total)}</span>
          </div>`;
      });
    }

    return html;
  },

  /* ════════════════════════════════════════════════════════════
     PHASE 5 — Export & Save Methods
     ════════════════════════════════════════════════════════════ */

  /** Build plain-text quote for WhatsApp / Copy */
  _buildQuoteText() {
    const S = PricingState4;
    const calc = PriceCalc4.calcTotal();
    const cat = PricingDB4.categories.find(c => c.id === S.project.category);
    const pkg = PricingDB4.packages.find(p => p.id === S.pricing.packageId);
    const line = '━━━━━━━━━━━━━━━━━━━━';
    let t = '';
    t += `🏛️ *مجموعة معمار للاستشارات الهندسية*\n`;
    t += `Memar Engineering Consultants\n`;
    t += `${line}\n`;
    if (S.client.name) t += `👤 العميل: ${S.client.name}\n`;
    if (S.client.phone) t += `📞 الهاتف: ${S.client.phone}\n`;
    t += `🏗️ القطاع: ${cat ? cat.label : '—'}\n`;
    t += `📐 المساحة: ${S.project.area} م²\n`;
    if (S.project.region) t += `📍 الموقع: ${S.project.region} ${S.project.block ? 'ق' + S.project.block : ''} ${S.project.plot ? 'قسيمة ' + S.project.plot : ''}\n`;
    t += `${line}\n`;
    if (calc.mode === 'package' && pkg) {
      t += `📦 الباقة: ${pkg.name}\n`;
      t += `💰 سعر الباقة: ${calc.isManualPkg ? 'يُحدد لاحقاً' : this.fmt(calc.pkgPrice)}\n`;
      if (calc.extraLines && calc.extraLines.length) {
        t += `\n➕ خدمات إضافية:\n`;
        calc.extraLines.forEach(l => { t += `  • ${l.svc.name}: ${l.isManual ? 'يُحدد' : this.fmt(l.amount)}\n`; });
      }
    } else {
      t += `🔧 تسعير مفصّل:\n`;
      (calc.services || []).forEach(l => { t += `  • ${l.svc.name}: ${l.isManual ? 'يُحدد' : this.fmt(l.amount)}\n`; });
    }
    if (calc.addonLines && calc.addonLines.length) {
      t += `\n🎁 إضافات:\n`;
      calc.addonLines.forEach(a => { t += `  • ${a.name}: ${this.fmt(a.total)}\n`; });
    }
    if (calc.feeLines && calc.feeLines.length) {
      t += `\n🏛️ رسوم حكومية:\n`;
      calc.feeLines.forEach(f => { t += `  • ${f.name}: ${this.fmt(f.total)}\n`; });
    }
    t += `${line}\n`;
    t += `💰 *الإجمالي: ${this.fmt(calc.grandTotal)}*\n`;
    if (calc.hasManualPricing) t += `⚠️ بعض الأسعار تُحدد لاحقاً\n`;
    t += `${line}\n`;
    t += `📅 صلاحية العرض: 30 يوماً\n`;
    if (S.notes) t += `\n📝 ملاحظات: ${S.notes}\n`;
    t += `\n🌐 مجموعة معمار — جودة تصميم بلا حدود`;
    return t;
  },

  /** Export to WhatsApp */
  exportWhatsApp() {
    const S = PricingState4;
    const text = this._buildQuoteText();
    const phone = S.client.phone ? S.client.phone.replace(/\D/g, '') : '';
    const fullPhone = phone.startsWith('965') ? phone : '965' + phone;
    const url = phone
      ? `https://wa.me/${fullPhone}?text=${encodeURIComponent(text)}`
      : `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
    this.showToast('📱 تم فتح واتساب');
  },

  /** Copy quote text to clipboard */
  copyQuote() {
    const text = this._buildQuoteText();
    navigator.clipboard.writeText(text).then(() => {
      this.showToast('📋 تم نسخ العرض للحافظة');
    }).catch(() => {
      /* Fallback */
      const ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select(); document.execCommand('copy');
      document.body.removeChild(ta);
      this.showToast('📋 تم نسخ العرض للحافظة');
    });
  },

  /** Print quote (opens print dialog) */
  printQuote() {
    const S = PricingState4;
    const calc = PriceCalc4.calcTotal();
    const cat = PricingDB4.categories.find(c => c.id === S.project.category);
    const pkg = PricingDB4.packages.find(p => p.id === S.pricing.packageId);
    const today = new Date().toLocaleDateString('ar-KW', {year:'numeric',month:'long',day:'numeric'});
    const hdrColor = cat ? cat.color : '#4F46E5';

    /* Build service rows */
    let rows = '';
    if (calc.mode === 'package' && calc.pkg) {
      (calc.pkgServices || []).forEach(s => { rows += `<tr><td>${s.icon} ${s.name}</td><td style="color:#059669">مشمولة ✓</td></tr>`; });
      (calc.extraLines || []).forEach(l => { rows += `<tr><td>${l.svc.icon} ${l.svc.name}</td><td>${l.isManual ? 'يُحدد' : this.fmt(l.amount)}</td></tr>`; });
    } else {
      (calc.services || []).forEach(l => { rows += `<tr><td>${l.svc.icon} ${l.svc.name}</td><td>${l.isManual ? 'يُحدد' : this.fmt(l.amount)}</td></tr>`; });
    }
    (calc.addonLines || []).forEach(a => { rows += `<tr><td>🎁 ${a.name}</td><td>${this.fmt(a.total)}</td></tr>`; });
    (calc.feeLines || []).forEach(f => { rows += `<tr><td>🏛️ ${f.name}</td><td>${this.fmt(f.total)}</td></tr>`; });

    const html = `<!DOCTYPE html><html dir="rtl" lang="ar"><head><meta charset="UTF-8">
    <title>عرض سعر — معمار</title>
    <style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:'Cairo','Tajawal',sans-serif;padding:40px;color:#1E293B;font-size:13px}
    .hdr{background:linear-gradient(135deg,${hdrColor},${hdrColor}dd);color:#fff;padding:28px;border-radius:12px;margin-bottom:24px}
    .hdr h1{font-size:20px;font-weight:800}.hdr p{opacity:.7;font-size:12px;margin-top:4px}
    .meta{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:20px}
    .meta div{background:#F8FAFC;padding:10px;border-radius:8px}.meta small{color:#94A3B8;font-size:10px}.meta strong{display:block;margin-top:2px}
    table{width:100%;border-collapse:collapse;margin:16px 0}th,td{padding:8px 12px;text-align:right;border-bottom:1px solid #E2E8F0}
    th{background:#F8FAFC;font-size:11px;color:#64748B;font-weight:700}
    .total{font-size:18px;font-weight:900;color:${hdrColor};text-align:center;padding:16px;background:#F8FAFC;border-radius:12px;margin-top:16px}
    .footer{margin-top:24px;font-size:10px;color:#94A3B8;text-align:center;border-top:1px solid #E2E8F0;padding-top:12px}
    @media print{body{padding:20px}}</style></head><body>
    <div class="hdr"><h1>🏛️ مجموعة معمار للاستشارات الهندسية</h1><p>Memar Engineering Consultants — عرض سعر</p></div>
    <div class="meta">
      <div><small>العميل</small><strong>${S.client.name || '—'}</strong></div>
      <div><small>القطاع</small><strong>${cat ? cat.icon + ' ' + cat.label : '—'}</strong></div>
      <div><small>المساحة</small><strong>${S.project.area} م²</strong></div>
      <div><small>التاريخ</small><strong>${today}</strong></div>
      <div><small>الموقع</small><strong>${S.project.region || '—'} ${S.project.block ? 'ق' + S.project.block : ''}</strong></div>
      <div><small>الباقة</small><strong>${pkg ? pkg.icon + ' ' + pkg.name : 'تسعير مفصّل'}</strong></div>
    </div>
    <table><thead><tr><th>الخدمة</th><th>المبلغ</th></tr></thead><tbody>${rows}</tbody></table>
    <div class="total">💰 الإجمالي: ${this.fmt(calc.grandTotal)}</div>
    ${S.notes ? '<p style="margin-top:12px;padding:8px;background:#FFFBEB;border-radius:8px;font-size:11px;color:#92400E">📝 ' + S.notes + '</p>' : ''}
    <div class="footer">صلاحية العرض 30 يوماً من تاريخه — مجموعة معمار للاستشارات الهندسية</div>
    </body></html>`;

    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    setTimeout(() => w.print(), 400);
    this.showToast('🖨️ جاري الطباعة...');
  },

  /** Save quote to localStorage */
  saveQuote() {
    const S = PricingState4;
    const calc = PriceCalc4.calcTotal();
    const key = 'memar_pricing4_quotes';
    const saved = JSON.parse(localStorage.getItem(key) || '[]');
    const quote = {
      id: 'Q4-' + Date.now(),
      date: new Date().toISOString(),
      client: { ...S.client },
      project: { ...S.project },
      pricing: { ...S.pricing, services: [...S.pricing.services], addons: [...S.pricing.addons] },
      total: calc.grandTotal,
      notes: S.notes,
    };
    saved.unshift(quote);
    if (saved.length > 50) saved.length = 50;
    localStorage.setItem(key, JSON.stringify(saved));
    this.showToast(`💾 تم حفظ العرض: ${quote.id}`);
  },

  /* ════════════════════════════════════════════════════════════
     Service Detail Modal v2 — صفحة تفاصيل وتعديل الخدمة الشاملة
     ════════════════════════════════════════════════════════════ */
  _svcModalSvcId: null,

  openServiceDetail(svcId) {
    this._svcModalSvcId = svcId;
    const svc = PricingDB4.services.find(s => s.id === svcId);
    if (!svc) return;
    const isAdmin = PricingState4.admin.enabled;
    const self = this;
    /* ensure fields exist */
    if (!svc.govFees && svc.govFees !== 0) svc.govFees = 0;
    if (!svc.conditions) svc.conditions = [];
    if (!svc.steps) svc.steps = [];
    if (!svc.displayConfig) svc.displayConfig = {showDuration:true,showPhase:true,showDocs:true,showGovFees:false,showConditions:true,showSteps:true};

    const wrapper = document.createElement('div');
    wrapper.id = 'p4-modal-wrapper';
    wrapper.innerHTML = `<div class="p4-modal-overlay" id="p4-svc-modal-overlay"><div class="p4-modal-container" id="p4-modal-ctr"></div></div>`;
    document.body.appendChild(wrapper);
    this._renderModalContent(svc, isAdmin);
    requestAnimationFrame(() => { const o = document.getElementById('p4-svc-modal-overlay'); if(o) o.classList.add('visible'); });
    document.getElementById('p4-svc-modal-overlay').onclick = e => { if(e.target.id==='p4-svc-modal-overlay') self.closeServiceDetail(); };
  },

  /** Render / re-render modal inner content */
  _renderModalContent(svc, isAdmin) {
    const self = this;
    const svcId = svc.id;
    const SL = {residential:'🏠 سكني',investment:'🏢 استثماري',commercial:'🏬 تجاري',industrial:'🏭 صناعي',medical:'🏥 طبي',general:'📋 عام'};
    const dc = svc.displayConfig || {};
    const allSvcs = PricingDB4.services;
    const fmt = v => Number(v).toLocaleString('en-US');

    /* ── Autocomplete Datalists ── */
    const allNames = new Set();
    const allDocs = new Set();
    const allConds = new Set();
    const allSteps = new Set();
    
    allSvcs.forEach(s => {
      allNames.add(s.name);
      (s.docs||[]).forEach(d => allDocs.add(d));
      (s.conditions||[]).forEach(c => allConds.add(c));
      (s.steps||[]).forEach(st => allSteps.add(st));
    });

    const dlNames = Array.from(allNames).map(n => `<option value="${n}">`).join('');
    const dlDocs = Array.from(allDocs).map(d => `<option value="${d}">`).join('');
    const dlConds = Array.from(allConds).map(c => `<option value="${c}">`).join('');
    const dlSteps = Array.from(allSteps).map(s => `<option value="${s}">`).join('');
    
    const datalists = isAdmin ? `
      <datalist id="p4m-dl-names">${dlNames}</datalist>
      <datalist id="p4m-dl-docs">${dlDocs}</datalist>
      <datalist id="p4m-dl-conds">${dlConds}</datalist>
      <datalist id="p4m-dl-steps">${dlSteps}</datalist>
    ` : '';

    /* ── helpers ── */
    const tagsDel = (arr, cls, prefix, renderName) => {
      if (!arr || !arr.length) return '<span class="p4-modal-empty">لا يوجد</span>';
      return arr.map((v,i) => {
        const name = renderName ? renderName(v) : v;
        const del = isAdmin ? `<span class="p4-modal-tag-del" data-arr="${cls}" data-idx="${i}">✕</span>` : '';
        return `<span class="p4-modal-tag ${cls}">${prefix}${name}${del}</span>`;
      }).join('');
    };

    /* ── Meta editable row ── */
    let metaHtml;
    if (isAdmin) {
      const unitOpts = (PricingDB4.unitOptions||['م²','مقطوع','شهر']).map(u => `<option value="${u}" ${svc.unit===u?'selected':''}>${u}</option>`).join('');
      const phaseOpts = (PricingDB4.phaseOptions||['تصميم','ترخيص']).map(p => `<option value="${p}" ${svc.phase===p?'selected':''}>${p}</option>`).join('');
      metaHtml = `<div class="p4-modal-meta-edit">
        <label>⏱ المدة (يوم)<input type="number" id="p4m-duration" value="${svc.duration||''}" min="0" placeholder="—"></label>
        <label>📌 المرحلة<select id="p4m-phase">${phaseOpts}</select></label>
        <label>📐 الوحدة<select id="p4m-unit">${unitOpts}</select></label>
      </div>`;
    } else {
      metaHtml = `<div class="p4-modal-meta">
        ${svc.duration ? `<span class="p4-modal-chip">⏱ ${svc.duration} يوم</span>` : ''}
        ${svc.phase ? `<span class="p4-modal-chip phase">📌 ${svc.phase}</span>` : ''}
        <span class="p4-modal-chip unit">📐 ${svc.unit}</span>
      </div>`;
    }

    /* ── Sector rates ── */
    let rateRows = '';
    const allSectors = ['residential','investment','commercial','industrial','medical','general'];
    allSectors.forEach(c => {
      const isEnabled = svc.categories.includes(c);
      const r = (PricingDB4.sectorRates[c]&&PricingDB4.sectorRates[c][svcId]) || svc.baseRate || 0;
      if (isAdmin) {
        rateRows += `<tr>
          <td>
            <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:13px; font-weight:700;">
              <input type="checkbox" class="p4-sector-toggle" data-sector="${c}" ${isEnabled?'checked':''}>
              ${SL[c]||c}
            </label>
          </td>
          <td><input type="number" class="p4-modal-rate-input" data-sector="${c}" value="${r}" min="0" ${!isEnabled?'disabled':''} style="width:100px; padding:6px; border:1px solid var(--p4-border); border-radius:6px; ${!isEnabled?'opacity:0.4;':''}"></td>
          <td>${svc.unit}</td>
        </tr>`;
      } else {
        if (isEnabled) {
          rateRows += `<tr><td>${SL[c]||c}</td><td>${fmt(r)}</td><td>${svc.unit}</td></tr>`;
        }
      }
    });
    if (!isAdmin && rateRows === '') {
      rateRows = `<tr><td colspan="3" style="text-align:center; color:var(--p4-text-2);">الخدمة غير متاحة لأي قطاع</td></tr>`;
    }

    /* ── Gov Fees ── */
    const govHtml = isAdmin
      ? `<input type="number" id="p4m-govfees" class="p4-modal-inline-input" value="${svc.govFees}" min="0"> د.ك`
      : (svc.govFees > 0 ? `<span class="p4-modal-chip unit">🏛️ ${fmt(svc.govFees)} د.ك</span>` : '<span class="p4-modal-empty">لا يوجد</span>');

    /* ── Display Config toggles ── */
    const toggles = isAdmin ? [
      {k:'showDuration',l:'المدة الزمنية'},{k:'showPhase',l:'المرحلة'},{k:'showDocs',l:'الأوراق المطلوبة'},
      {k:'showGovFees',l:'الرسوم الحكومية'},{k:'showConditions',l:'الشروط الخاصة'},{k:'showSteps',l:'خطوات التنفيذ'}
    ].map(t => `<label class="p4-modal-toggle"><input type="checkbox" data-dckey="${t.k}" ${dc[t.k]?'checked':''}><span>${t.l}</span></label>`).join('') : '';

    /* ── Svc select dropdown for requires/conflicts ── */
    const svcOptions = allSvcs.filter(s => s.id !== svcId).map(s => `<option value="${s.id}">${s.icon} ${s.name}</option>`).join('');

    const ctr = document.getElementById('p4-modal-ctr');
    ctr.innerHTML = `
      <div class="p4-modal-header">
        <div class="p4-modal-title-row">
          ${isAdmin ? `<input type="text" id="p4m-svc-icon" value="${svc.icon}" style="width:45px; text-align:center; font-size:24px; border:1px solid var(--p4-border); border-radius:8px; outline:none; background:transparent;">` : `<span class="p4-modal-icon">${svc.icon}</span>`}
          <div style="flex:1;">
            ${isAdmin ? `
              <input type="text" id="p4m-svc-name" list="p4m-dl-names" value="${svc.name}" autocomplete="off" style="width:100%; font-size:16px; font-weight:800; border:1px solid var(--p4-border); border-radius:4px; padding:4px 6px; margin-bottom:4px; outline:none; font-family:inherit; color:var(--p4-text);">
              <div id="p4m-name-warn" style="color:var(--p4-danger); font-size:11px; font-weight:700; display:none; margin-bottom:4px;">⚠️ اسم مشابه موجود مسبقاً!</div>
              <input type="text" id="p4m-svc-name-en" value="${svc.nameEn||''}" placeholder="English Name" style="width:100%; font-size:11px; border:1px solid var(--p4-border); border-radius:4px; padding:4px 6px; outline:none; font-family:inherit; color:var(--p4-text-2);">
            ` : `<h3>${svc.name}</h3><span class="p4-modal-subtitle">${svc.nameEn||''}</span>`}
          </div>
        </div>
        <button class="p4-modal-close" id="p4-modal-close-btn">✕</button>
      </div>
      ${datalists}
      <div class="p4-modal-body">
        ${isAdmin ? `<textarea id="p4m-svc-desc" rows="2" style="width:100%; padding:8px; border:1px solid var(--p4-border); border-radius:8px; outline:none; font-family:inherit; font-size:13px; color:var(--p4-text); margin-bottom:15px; resize:vertical;" placeholder="وصف الخدمة...">${svc.desc}</textarea>
        <div style="margin-bottom:15px;">
          <label style="font-size:12px; font-weight:700; color:var(--p4-text-2); display:block; margin-bottom:6px;">القسم الرئيسي:</label>
          <select id="p4m-svc-group" style="width:100%; padding:8px; border:1px solid var(--p4-border); border-radius:8px; outline:none; font-family:inherit; font-size:13px;">
            <option value="licensing" ${svc.group==='licensing'?'selected':''}>التراخيص</option>
            <option value="engineering" ${svc.group==='engineering'?'selected':''}>الخدمات الهندسية</option>
            <option value="other" ${svc.group==='other'?'selected':''}>خدمات أخرى</option>
          </select>
        </div>` : `<p class="p4-modal-desc">${svc.desc}</p>`}
        ${metaHtml}

        <div class="p4-modal-section"><h4>💰 أسعار القطاعات</h4>
          <table class="p4-modal-table"><thead><tr><th>القطاع</th><th>السعر</th><th>الوحدة</th></tr></thead><tbody>${rateRows}</tbody></table>
        </div>

        <div class="p4-modal-section"><h4>🏛️ الرسوم الحكومية</h4><div class="p4-modal-gov-row">${govHtml}</div></div>

        <div class="p4-modal-section"><h4>📋 الأوراق المطلوبة</h4>
          <div class="p4-modal-tags" id="p4m-docs">${tagsDel(svc.docs,'doc','📄 ')}</div>
          ${isAdmin ? `<div class="p4-modal-add-row"><input type="text" id="p4m-add-doc" list="p4m-dl-docs" class="p4-modal-add-input" placeholder="أضف وثيقة..."><button class="p4-modal-add-btn" data-target="docs">+ أضف</button></div>` : ''}
        </div>

        <div class="p4-modal-section"><h4>🔗 خدمات مطلوبة (متطلبات مسبقة)</h4>
          <div class="p4-modal-tags" id="p4m-reqs">${tagsDel(svc.requires,'req','',rid=>{const s=allSvcs.find(x=>x.id===rid);return s?s.icon+' '+s.name:rid;})}</div>
          ${isAdmin ? `<div class="p4-modal-add-row"><select id="p4m-add-req" class="p4-modal-add-select"><option value="">اختر خدمة...</option>${svcOptions}</select><button class="p4-modal-add-btn" data-target="reqs">+ أضف</button></div>` : ''}
        </div>

        <div class="p4-modal-section"><h4>⚠️ خدمات متعارضة</h4>
          <div class="p4-modal-tags" id="p4m-confl">${tagsDel(svc.conflicts,'conflict','⚠️ ',cid=>{const s=allSvcs.find(x=>x.id===cid);return s?s.icon+' '+s.name:cid;})}</div>
          ${isAdmin ? `<div class="p4-modal-add-row"><select id="p4m-add-confl" class="p4-modal-add-select"><option value="">اختر خدمة...</option>${svcOptions}</select><button class="p4-modal-add-btn" data-target="confl">+ أضف</button></div>` : ''}
        </div>

        <div class="p4-modal-section"><h4>📜 الشروط الخاصة</h4>
          <div class="p4-modal-tags" id="p4m-conds">${tagsDel(svc.conditions,'cond','📌 ')}</div>
          ${isAdmin ? `<div class="p4-modal-add-row"><input type="text" id="p4m-add-cond" list="p4m-dl-conds" class="p4-modal-add-input" placeholder="أضف شرط..."><button class="p4-modal-add-btn" data-target="conds">+ أضف</button></div>` : ''}
        </div>

        <div class="p4-modal-section"><h4>📋 خطوات التنفيذ</h4>
          <div class="p4-modal-steps" id="p4m-steps">${(svc.steps||[]).length ? svc.steps.map((s,i)=>`<div class="p4-modal-step">${isAdmin?`<span class="p4-modal-tag-del" data-arr="steps" data-idx="${i}">✕</span>`:''}<span class="p4-modal-step-num">${i+1}</span><span>${s}</span></div>`).join('') : '<span class="p4-modal-empty">لا يوجد</span>'}</div>
          ${isAdmin ? `<div class="p4-modal-add-row"><input type="text" id="p4m-add-step" list="p4m-dl-steps" class="p4-modal-add-input" placeholder="أضف خطوة..."><button class="p4-modal-add-btn" data-target="steps">+ أضف</button></div>` : ''}
        </div>

        <div class="p4-modal-section"><h4>📝 ملاحظات</h4>
          ${isAdmin ? `<textarea class="p4-modal-notes" id="p4m-notes" rows="3" placeholder="ملاحظات إدارية...">${svc.notes||''}</textarea>` : (svc.notes ? `<p class="p4-modal-notes-display">${svc.notes}</p>` : '<span class="p4-modal-empty">لا يوجد</span>')}
        </div>

        ${isAdmin ? `<div class="p4-modal-section"><h4>👁️ إعدادات العرض — ما يظهر في عرض السعر وكارت الخدمة</h4><div class="p4-modal-toggles">${toggles}</div></div>` : ''}
      </div>
      ${isAdmin ? `<div class="p4-modal-footer"><button class="p4-modal-save-btn" id="p4-modal-save-btn">💾 حفظ التعديلات</button></div>` : ''}`;

    /* ── Bind events ── */
    document.getElementById('p4-modal-close-btn').onclick = () => self.closeServiceDetail();

    if (!isAdmin) return;

    /* Name validation warning */
    const nameInput = document.getElementById('p4m-svc-name');
    const warnSpan = document.getElementById('p4m-name-warn');
    if (nameInput && warnSpan) {
      nameInput.oninput = () => {
        const val = nameInput.value.trim();
        if (!val) { warnSpan.style.display = 'none'; return; }
        const exists = allSvcs.some(s => s.id !== svcId && s.name === val);
        warnSpan.style.display = exists ? 'block' : 'none';
      };
    }
    
    /* Sector toggle logic */
    ctr.querySelectorAll('.p4-sector-toggle').forEach(chk => {
      chk.onchange = () => {
        const input = ctr.querySelector(`.p4-modal-rate-input[data-sector="${chk.dataset.sector}"]`);
        if (input) {
          input.disabled = !chk.checked;
          input.style.opacity = chk.checked ? '1' : '0.4';
        }
      };
    });

    /* Delete tags */
    ctr.querySelectorAll('.p4-modal-tag-del').forEach(btn => {
      btn.onclick = e => {
        e.stopPropagation();
        const arrKey = btn.dataset.arr;
        const idx = parseInt(btn.dataset.idx);
        const map = {doc:'docs',req:'requires',conflict:'conflicts',cond:'conditions',steps:'steps'};
        const field = map[arrKey] || arrKey;
        if (svc[field] && svc[field][idx] !== undefined) { 
          svc[field].splice(idx, 1); 
          if (PricingDB4.saveToStorage) PricingDB4.saveToStorage();
          self._renderModalContent(svc, true); 
        }
      };
    });

    /* Add buttons */
    ctr.querySelectorAll('.p4-modal-add-btn').forEach(btn => {
      btn.onclick = () => {
        const target = btn.dataset.target;
        const map = {docs:{field:'docs',input:'p4m-add-doc',type:'text'},reqs:{field:'requires',input:'p4m-add-req',type:'select'},confl:{field:'conflicts',input:'p4m-add-confl',type:'select'},conds:{field:'conditions',input:'p4m-add-cond',type:'text'},steps:{field:'steps',input:'p4m-add-step',type:'text'}};
        const cfg = map[target]; if (!cfg) return;
        const el = document.getElementById(cfg.input);
        const val = (cfg.type==='select' ? el.value : el.value.trim());
        if (!val) return;
        if (!svc[cfg.field]) svc[cfg.field] = [];
        if (svc[cfg.field].includes(val)) { self.showToast('⚠️ موجود مسبقاً'); return; }
        svc[cfg.field].push(val);
        if (PricingDB4.saveToStorage) PricingDB4.saveToStorage();
        self._renderModalContent(svc, true);
      };
    });

    /* Save */
    const saveBtn = document.getElementById('p4-modal-save-btn');
    if (saveBtn) saveBtn.onclick = () => {
      /* names & basic info */
      const sName = document.getElementById('p4m-svc-name');
      if (sName && sName.value.trim()) svc.name = sName.value.trim();
      const sNameEn = document.getElementById('p4m-svc-name-en');
      if (sNameEn) svc.nameEn = sNameEn.value.trim();
      
      const sIcon = document.getElementById('p4m-svc-icon');
      if (sIcon && sIcon.value.trim()) svc.icon = sIcon.value.trim();
      
      const sDesc = document.getElementById('p4m-svc-desc');
      if (sDesc) svc.desc = sDesc.value.trim();
      
      const sGroup = document.getElementById('p4m-svc-group');
      if (sGroup) svc.group = sGroup.value;

      /* meta */
      const dur = document.getElementById('p4m-duration');
      if (dur) svc.duration = dur.value ? parseInt(dur.value) : null;
      const ph = document.getElementById('p4m-phase');
      if (ph) svc.phase = ph.value;
      const un = document.getElementById('p4m-unit');
      if (un) svc.unit = un.value;
      /* gov fees */
      const gf = document.getElementById('p4m-govfees');
      if (gf) svc.govFees = parseFloat(gf.value) || 0;
      /* notes */
      const nt = document.getElementById('p4m-notes');
      if (nt) svc.notes = nt.value.trim();
      
      /* categories (sector availability) */
      const newCats = [];
      ctr.querySelectorAll('.p4-sector-toggle').forEach(chk => {
        if (chk.checked) newCats.push(chk.dataset.sector);
      });
      svc.categories = newCats;

      /* sector rates */
      ctr.querySelectorAll('.p4-modal-rate-input').forEach(inp => {
        const sector = inp.dataset.sector;
        const val = parseFloat(inp.value);
        if (!isNaN(val) && val >= 0 && PricingDB4.sectorRates[sector]) PricingDB4.sectorRates[sector][svcId] = val;
      });
      
      /* display config */
      ctr.querySelectorAll('[data-dckey]').forEach(cb => { svc.displayConfig[cb.dataset.dckey] = cb.checked; });
      
      if (PricingDB4.saveToStorage) PricingDB4.saveToStorage();
      self.closeServiceDetail();
      self.refresh();
      self.showToast('✅ تم حفظ تعديلات الخدمة في قاعدة البيانات');
    };
  },

  closeServiceDetail() {
    const overlay = document.getElementById('p4-svc-modal-overlay');
    if (overlay) overlay.classList.remove('visible');
    setTimeout(() => { const w = document.getElementById('p4-modal-wrapper'); if(w) w.remove(); }, 300);
  },
};

/* ── Register globally ── */
window.Pricing4 = Pricing4;
