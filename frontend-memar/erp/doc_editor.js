/* ═══════════════════════════════════════════════════════════
   MEMAR ERP — License & Document Automation Engine
   Version: 2.0 | Advanced PDF/OCR Automation (Frontend Logic)
   ═══════════════════════════════════════════════════════════ */

const DOC_DB = {
  licenseTypes: [
    { id: 'LT_RES_NEW', name: 'ترخيص بناء جديد', category: 'سكني', requiredDocs: ['عقد تصميم', 'نموذج طلب رخصة', 'إقرار كهرباء', 'تعهد إشراف'] },
    { id: 'LT_RES_ADD', name: 'ترخيص إضافة وتعديل', category: 'سكني', requiredDocs: ['عقد تصميم', 'تعهد سلامة هيكل', 'نموذج طلب رخصة'] },
    { id: 'LT_RES_DEM', name: 'ترخيص هدم', category: 'سكني', requiredDocs: ['عقد هدم', 'تعهد إشراف هدم', 'براءة ذمة كهرباء'] },
    { id: 'LT_COM_NEW', name: 'بناء تجاري / استثماري', category: 'تجاري', requiredDocs: ['عقد تصميم متكامل', 'موافقة مطافي', 'إقرار كهرباء', 'تعهد إشراف'] },
    { id: 'LT_EXCAV',   name: 'ترخيص حفر وسند جوانب', category: 'أعمال ترابية', requiredDocs: ['عقد حفر', 'تعهد أمن وسلامة', 'مخطط حفر'] }
  ],
  templates: [
    { id: 'T1', type: 'contract', name: 'عقد تصميم معماري وإنشائي', file: 'contract_design.pdf', fields: 12 },
    { id: 'T2', type: 'municipality', name: 'نموذج طلب رخصة بناء', file: 'mun_request_form.pdf', fields: 24 },
    { id: 'T3', type: 'municipality', name: 'تعهد إشراف هندسي', file: 'supervision_dec.pdf', fields: 8 },
    { id: 'T4', type: 'contract', name: 'عقد إشراف على التنفيذ', file: 'contract_sup.pdf', fields: 15 },
    { id: 'T5', type: 'municipality', name: 'إقرار أحمال كهربائية', file: 'elec_load.pdf', fields: 6 },
    { id: 'T6', type: 'municipality', name: 'تعهد أمن وسلامة', file: 'safety_dec.pdf', fields: 5 }
  ],
  workflows: [] // Active generated projects
};

const DocEditor = {
  activeTab: 'dashboard',
  wizardState: { step: 1, licenseId: null, projectId: null, extractedData: null },

  init() {
    if (!window.DATA.docWorkflows) window.DATA.docWorkflows = [];
  },

  render() {
    const pg = document.getElementById('p-doc_editor');
    if (!pg) return;
    
    document.getElementById('page-title').textContent = '📝 محرر المستندات وأتمتة التراخيص';

    pg.innerHTML = `
      <div class="dc-module">
        <div class="dc-kpi-strip">
          <div class="dc-kpi kpi-total">
            <div class="dc-kpi-icon" style="background:#EEF2FF;color:#4F46E5">📄</div>
            <div class="dc-kpi-body"><div class="dc-kpi-label">إجمالي الملفات</div><div class="dc-kpi-value">${DOC_DB.templates.length}</div><div class="dc-kpi-sub">قالب جاهز</div></div>
          </div>
          <div class="dc-kpi kpi-active">
            <div class="dc-kpi-icon" style="background:#ECFDF5;color:#10B981">⚙️</div>
            <div class="dc-kpi-body"><div class="dc-kpi-label">أنواع التراخيص</div><div class="dc-kpi-value">${DOC_DB.licenseTypes.length}</div><div class="dc-kpi-sub">مسار أتمتة</div></div>
          </div>
          <div class="dc-kpi kpi-docs">
            <div class="dc-kpi-icon" style="background:#F0FDF4;color:#16A34A">🤖</div>
            <div class="dc-kpi-body"><div class="dc-kpi-label">جاهزية الـ OCR</div><div class="dc-kpi-value">متصل</div><div class="dc-kpi-sub">محرك الذكاء الاصطناعي</div></div>
          </div>
        </div>

        <div class="dc-tabs">
          <button class="dc-tab ${this.activeTab==='dashboard'?'active':''}" onclick="DocEditor.switchTab('dashboard')"><span class="dc-tab-icon">📋</span> لوحة التحكم</button>
          <button class="dc-tab ${this.activeTab==='automation'?'active':''}" onclick="DocEditor.switchTab('automation')"><span class="dc-tab-icon">⚡</span> معالج الأتمتة الذكي</button>
          <button class="dc-tab ${this.activeTab==='templates'||this.activeTab==='mapper'?'active':''}" onclick="DocEditor.switchTab('templates')"><span class="dc-tab-icon">📑</span> إدارة القوالب والنماذج</button>
          <button class="dc-tab ${this.activeTab==='archive'?'active':''}" onclick="DocEditor.switchTab('archive')"><span class="dc-tab-icon">🗄️</span> أرشيف التراخيص</button>
          <button class="dc-tab ${this.activeTab==='settings'?'active':''}" onclick="DocEditor.switchTab('settings')"><span class="dc-tab-icon">⚙️</span> إعدادات المكتب والأختام</button>
        </div>

        <div id="doc-content">${this.renderActiveTab()}</div>
      </div>
    `;
  },

  switchTab(tab) {
    this.activeTab = tab;
    this.render();
  },

  renderActiveTab() {
    switch(this.activeTab) {
      case 'dashboard': return this.renderDashboard();
      case 'automation': return this.renderAutomationWizard();
      case 'templates': return this.renderTemplates();
      case 'mapper': return this.renderMapper();
      case 'archive': return this.renderArchive();
      case 'settings': return this.renderSettings();
      default: return this.renderDashboard();
    }
  },

  // ── 1. Dashboard ──
  renderDashboard() {
    return `
      <div class="grid-2-1">
        <div class="card">
          <div class="card-header"><div class="card-title">🚀 إجراءات سريعة</div></div>
          <div class="card-body" style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <button class="btn btn-primary btn-lg" style="height:100px;flex-direction:column;gap:8px" onclick="DocEditor.switchTab('automation')">
              <span style="font-size:24px">⚡</span> بدء أتمتة رخصة جديدة
            </button>
            <button class="btn btn-secondary btn-lg" style="height:100px;flex-direction:column;gap:8px" onclick="DocEditor.switchTab('templates')">
              <span style="font-size:24px">📑</span> تعديل القوالب (Coordinates)
            </button>
          </div>
        </div>
        <div class="card">
          <div class="card-header"><div class="card-title">مسارات التراخيص المدعومة</div></div>
          <div class="card-body" style="padding:0">
            <div style="max-height:200px;overflow-y:auto">
              ${DOC_DB.licenseTypes.map(lt => `
                <div style="padding:12px;border-bottom:1px solid var(--border);display:flex;justify-content:space-between;align-items:center">
                  <div>
                    <div style="font-weight:700;font-size:13px;color:var(--text)">${lt.name}</div>
                    <div style="font-size:11px;color:var(--text-3)">${lt.requiredDocs.length} نماذج مطلوبة</div>
                  </div>
                  <span class="badge badge-blue">${lt.category}</span>
                </div>
              `).join('')}
            </div>
          </div>
        </div>
      </div>
    `;
  },

  // ── 2. Automation Wizard (The Core Value) ──
  renderAutomationWizard() {
    const s = this.wizardState;
    return `
      <div class="card" style="border-top: 4px solid var(--primary)">
        <div class="card-body">
          <!-- Wizard Progress -->
          <div class="dc-progress-stages">
            <div class="dc-progress-stage ${s.step>=1?'done':'pending'} ${s.step===1?'current':''}">
              <div class="dc-progress-dot">1</div><div class="dc-progress-label">اختيار الترخيص</div>
            </div>
            <div class="dc-progress-stage ${s.step>=2?'done':'pending'} ${s.step===2?'current':''}">
              <div class="dc-progress-dot">2</div><div class="dc-progress-label">الذكاء الاصطناعي و OCR</div>
            </div>
            <div class="dc-progress-stage ${s.step>=3?'done':'pending'} ${s.step===3?'current':''}">
              <div class="dc-progress-dot">3</div><div class="dc-progress-label">مراجعة البيانات</div>
            </div>
            <div class="dc-progress-stage ${s.step>=4?'done':'pending'} ${s.step===4?'current':''}">
              <div class="dc-progress-dot">4</div><div class="dc-progress-label">توليد الـ PDF</div>
            </div>
          </div>

          <div style="margin-top: 30px; min-height: 300px;">
            ${s.step === 1 ? this.wizStep1() : ''}
            ${s.step === 2 ? this.wizStep2() : ''}
            ${s.step === 3 ? this.wizStep3() : ''}
            ${s.step === 4 ? this.wizStep4() : ''}
          </div>
        </div>
      </div>
    `;
  },

  wizStep1() {
    const projs = window.DATA.projects || [];
    return `
      <div style="max-width: 600px; margin: 0 auto;">
        <h3 style="margin-bottom:20px;text-align:center;color:var(--primary)">ابدأ مسار الأتمتة</h3>
        
        <div class="form-group">
          <label class="form-label">نوع الترخيص المطلوب</label>
          <select id="wiz-license" class="form-input" style="height:45px;font-size:14px;font-weight:700">
            <option value="">-- اختر نوع الترخيص --</option>
            ${DOC_DB.licenseTypes.map(lt => `<option value="${lt.id}">${lt.name} (${lt.category})</option>`).join('')}
          </select>
        </div>

        <div class="form-group">
          <label class="form-label">ربط بمشروع قائم (اختياري لجلب البيانات)</label>
          <select id="wiz-project" class="form-input">
            <option value="">-- إنشاء مشروع جديد --</option>
            ${projs.map(p => `<option value="${p.id}">${p.num} - ${p.name}</option>`).join('')}
          </select>
        </div>

        <div style="background:#F8FAFC;border:1px solid var(--border);border-radius:12px;padding:20px;margin-top:20px">
          <h4 style="margin-bottom:14px;color:var(--text);font-size:13px">أسئلة لتحديد النماذج المطلوبة (محرك الشروط)</h4>
          <div class="form-group" style="display:flex;align-items:center;gap:10px">
            <input type="checkbox" id="wiz-cond-contractor" style="width:16px;height:16px;accent-color:var(--primary)">
            <label for="wiz-cond-contractor" style="font-size:13px;cursor:pointer">هل يوجد مقاول محدد للمشروع؟ (سيضيف نماذج المقاولين)</label>
          </div>
          <div class="form-group" style="display:flex;align-items:center;gap:10px;margin-bottom:0">
            <input type="checkbox" id="wiz-cond-basement" style="width:16px;height:16px;accent-color:var(--primary)">
            <label for="wiz-cond-basement" style="font-size:13px;cursor:pointer">هل البناء يحتوي على سرداب؟ (سيضيف تعهد سحب المياه)</label>
          </div>
        </div>

        <div style="text-align:center;margin-top:30px">
          <button class="btn btn-primary btn-lg" onclick="DocEditor.nextStep(2)">متابعة إلى سحب البيانات (OCR) ←</button>
        </div>
      </div>
    `;
  },

  wizStep2() {
    return `
      <div style="max-width: 700px; margin: 0 auto;">
        <h3 style="margin-bottom:10px;text-align:center;color:var(--primary)">رفع المستندات وسحب البيانات (OCR)</h3>
        <p style="text-align:center;color:var(--text-3);margin-bottom:24px">سيقوم محرك الذكاء الاصطناعي بقراءة الوثائق تلقائياً وحقنها في النماذج</p>
        
        <div class="grid-2">
          <!-- ID Card Upload -->
          <div style="border:2px dashed var(--border);border-radius:12px;padding:30px;text-align:center;background:#F8FAFC">
            <div style="font-size:40px;margin-bottom:10px">🪪</div>
            <div style="font-weight:700;margin-bottom:5px">البطاقة المدنية للمالك</div>
            <div style="font-size:11px;color:var(--text-4);margin-bottom:15px">اسحب وأفلت صورة البطاقة (الوجهين)</div>
            <button class="btn btn-secondary btn-sm" onclick="DocEditor.simulateUpload(this, 'civil')">اختر ملف...</button>
            <div class="upload-status" style="margin-top:10px;font-size:12px;color:var(--success);font-weight:700;display:none">✅ تم السحب بنجاح</div>
          </div>

          <!-- Title Deed Upload -->
          <div style="border:2px dashed var(--border);border-radius:12px;padding:30px;text-align:center;background:#F8FAFC">
            <div style="font-size:40px;margin-bottom:10px">📜</div>
            <div style="font-weight:700;margin-bottom:5px">وثيقة الملكية / المخطط المساحي</div>
            <div style="font-size:11px;color:var(--text-4);margin-bottom:15px">لسحب بيانات القسيمة والمساحة</div>
            <button class="btn btn-secondary btn-sm" onclick="DocEditor.simulateUpload(this, 'deed')">اختر ملف...</button>
            <div class="upload-status" style="margin-top:10px;font-size:12px;color:var(--success);font-weight:700;display:none">✅ تم السحب بنجاح</div>
          </div>
        </div>

        <div style="display:flex;justify-content:space-between;margin-top:40px">
          <button class="btn btn-secondary" onclick="DocEditor.nextStep(1)">→ رجوع</button>
          <button id="btn-wiz-3" class="btn btn-primary" onclick="DocEditor.runOCR()" disabled>تشغيل محرك الـ OCR ←</button>
        </div>
      </div>
    `;
  },

  simulateUpload(btn, type) {
    btn.textContent = 'جاري الرفع...';
    btn.disabled = true;
    setTimeout(() => {
      btn.style.display = 'none';
      btn.nextElementSibling.style.display = 'block';
      this.wizardState[type+'Uploaded'] = true;
      if (this.wizardState.civilUploaded && this.wizardState.deedUploaded) {
        document.getElementById('btn-wiz-3').disabled = false;
      }
    }, 800);
  },

  runOCR() {
    const btn = document.getElementById('btn-wiz-3');
    btn.innerHTML = '⚙️ جاري المعالجة وقراءة النصوص...';
    btn.disabled = true;
    setTimeout(() => {
      // Mock Extracted Data
      this.wizardState.extractedData = {
        ownerName: 'أحمد عبدالله خالد المرزوق',
        civilId: '280123456789',
        governorate: 'حولي',
        area: 'السلام',
        block: '4',
        street: '105',
        plot: '12',
        plotArea: '500'
      };
      this.nextStep(3);
    }, 1500);
  },

  wizStep3() {
    const data = this.wizardState.extractedData || {};
    const lt = DOC_DB.licenseTypes.find(l => l.id === this.wizardState.licenseId) || DOC_DB.licenseTypes[0];
    
    // Dynamic conditional docs
    let reqDocs = [...lt.requiredDocs];
    if(this.wizardState.condContractor) reqDocs.push('تعهد مقاول بسلامة البناء');
    if(this.wizardState.condBasement) reqDocs.push('تعهد سحب المياه الجوفية (سرداب)');

    return `
      <div class="grid-2-1">
        <div>
          <h3 style="margin-bottom:16px;color:var(--text)">البيانات المستخرجة <span style="font-size:11px;color:var(--text-3);font-weight:normal">(مقارنة بصرية - OCR Validation)</span></h3>
          <div style="background:#fff;border:1px solid var(--border);border-radius:12px;padding:20px;box-shadow:var(--sh-xs)">
            <div style="background:#F1F5F9;border-radius:8px;padding:12px;margin-bottom:20px;display:flex;align-items:center;gap:16px">
               <div style="width:120px;height:40px;background:#CBD5E1;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:10px;color:#475569">صورة مقصوصة (ID)</div>
               <div style="flex:1"><label class="form-label">اسم المالك المستخرج</label><input class="form-input" value="${data.ownerName}"></div>
            </div>
            <div style="background:#F1F5F9;border-radius:8px;padding:12px;margin-bottom:20px;display:flex;align-items:center;gap:16px">
               <div style="width:120px;height:40px;background:#CBD5E1;border-radius:4px;display:flex;align-items:center;justify-content:center;font-size:10px;color:#475569">صورة مقصوصة (ID)</div>
               <div style="flex:1"><label class="form-label">الرقم المدني المستخرج</label><input class="form-input" value="${data.civilId}"></div>
            </div>
            
            <div class="form-row">
              <div class="form-group"><label class="form-label">المحافظة</label><input class="form-input" value="${data.governorate}"></div>
              <div class="form-group"><label class="form-label">المنطقة</label><input class="form-input" value="${data.area}"></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label class="form-label">رقم القطعة</label><input class="form-input" value="${data.block}"></div>
              <div class="form-group"><label class="form-label">رقم القسيمة</label><input class="form-input" value="${data.plot}"></div>
            </div>
            <div class="form-row">
              <div class="form-group"><label class="form-label">مساحة القسيمة (م٢)</label><input class="form-input" value="${data.plotArea}"></div>
            </div>
          </div>
        </div>
        
        <div>
          <h3 style="margin-bottom:16px;color:var(--text)">حزمة النماذج المطلوبة</h3>
          <div style="background:#F8FAFC;border:1px solid var(--border);border-radius:12px;padding:20px">
            <div style="font-weight:700;color:var(--primary);margin-bottom:12px">${lt.name}</div>
            <ul style="list-style:none;padding:0;margin:0">
              ${reqDocs.map(doc => `
                <li style="display:flex;align-items:center;gap:8px;margin-bottom:10px;font-size:13px;font-weight:600;color:var(--text-2)">
                  <span style="color:var(--success)">✔️</span> ${doc}
                </li>
              `).join('')}
            </ul>
            <div style="margin-top:16px;padding-top:16px;border-top:1px dashed var(--border);font-size:11px;color:var(--text-4)">
              * سيتم حقن البيانات والتواقيع أوتوماتيكياً في الإحداثيات المحددة لكل قالب.
            </div>
          </div>
        </div>
      </div>

      <div style="display:flex;justify-content:space-between;margin-top:30px">
        <button class="btn btn-secondary" onclick="DocEditor.nextStep(2)">→ رجوع</button>
        <button class="btn btn-success btn-lg" onclick="DocEditor.generatePDFs()">🪄 توليد جميع المستندات (PDF) ←</button>
      </div>
    `;
  },

  generatePDFs() {
    this.nextStep(4);
    setTimeout(() => {
      document.getElementById('gen-loader').style.display = 'none';
      document.getElementById('gen-result').style.display = 'block';
    }, 2500);
  },

  wizStep4() {
    const lt = DOC_DB.licenseTypes.find(l => l.id === this.wizardState.licenseId) || DOC_DB.licenseTypes[0];
    return `
      <div style="max-width: 600px; margin: 0 auto; text-align:center">
        <div id="gen-loader" style="padding: 40px">
          <div style="font-size:48px;animation:spin 2s linear infinite">⚙️</div>
          <h3 style="margin-top:20px;color:var(--primary)">جاري إنشاء حزمة المستندات...</h3>
          <p style="color:var(--text-3);margin-top:10px">يتم الآن حقن البيانات ووضع أختام المكتب الهندسي على الإحداثيات الدقيقة لـ ${lt.requiredDocs.length} نماذج حكومية...</p>
        </div>

        <div id="gen-result" style="display:none;padding: 30px;background:#F0FDF4;border:2px solid #86EFAC;border-radius:16px">
          <div style="font-size:60px;margin-bottom:10px">🎉</div>
          <h2 style="color:#16A34A;margin-bottom:5px">اكتملت العملية بنجاح!</h2>
          <p style="color:#15803D;margin-bottom:20px">تم تجهيز ملف المعاملة بالكامل.</p>
          
          <div style="background:#fff;border-radius:10px;padding:15px;margin-bottom:20px;text-align:right">
            ${lt.requiredDocs.map(doc => `
              <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--divider)">
                <span style="font-weight:600;font-size:13px">📄 ${doc}.pdf</span>
                <span class="badge badge-green">جاهز</span>
              </div>
            `).join('')}
          </div>

          <div style="display:flex;gap:10px;justify-content:center">
            <button class="btn btn-primary" onclick="window.open('','_blank')">⬇️ تحميل الحزمة كـ ZIP</button>
            <button class="btn btn-secondary" onclick="DocEditor.switchTab('dashboard')">العودة للرئيسية</button>
          </div>
        </div>
      </div>
      <style>@keyframes spin { 100% { transform:rotate(360deg); } }</style>
    `;
  },

  nextStep(step) {
    if (step === 2) {
      this.wizardState.licenseId = document.getElementById('wiz-license').value;
      this.wizardState.condContractor = document.getElementById('wiz-cond-contractor').checked;
      this.wizardState.condBasement = document.getElementById('wiz-cond-basement').checked;
      if(!this.wizardState.licenseId) { alert('الرجاء اختيار نوع الترخيص أولاً'); return; }
    }
    this.wizardState.step = step;
    this.render();
  },

  // ── 3. Templates Manager ──
  renderTemplates() {
    return `
      <div class="dc-section-hdr">
        <div class="dc-section-title">📑 إدارة القوالب والنماذج المعتمدة</div>
        <div class="dc-section-actions">
          <button class="btn btn-primary">+ رفع قالب PDF جديد</button>
        </div>
      </div>
      
      <div class="dc-templates-grid">
        ${DOC_DB.templates.map(tpl => `
          <div class="dc-template-card">
            <div class="dc-template-icon" style="background:${tpl.type==='contract'?'#EFF6FF':'#FFFBEB'};color:${tpl.type==='contract'?'#3B82F6':'#F59E0B'}">
              ${tpl.type==='contract'?'🤝':'🏛️'}
            </div>
            <div class="dc-template-name">${tpl.name}</div>
            <div class="dc-template-desc">${tpl.file}</div>
            <div style="display:flex;justify-content:center;gap:6px;margin-top:14px">
              <span class="dc-template-badge">🎯 ${tpl.fields} حقل ربط (Coordinates)</span>
            </div>
            <div style="margin-top:14px;display:flex;gap:4px">
               <button class="btn btn-sm btn-ghost btn-block" onclick="DocEditor.openMapper('${tpl.id}')">تعديل الإحداثيات</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  openMapper(tplId) {
    this.activeTemplateId = tplId;
    this.switchTab('mapper');
  },

  // ── 3.5 Visual PDF Mapper ──
  renderMapper() {
    const tpl = DOC_DB.templates.find(t => t.id === this.activeTemplateId) || DOC_DB.templates[0];
    return `
      <div class="dc-section-hdr">
        <div>
           <button class="btn btn-sm btn-secondary" style="margin-bottom:10px" onclick="DocEditor.switchTab('templates')">← عودة للقوالب</button>
           <div class="dc-section-title">مخطط الإحداثيات البصري (Visual Mapper)</div>
           <div style="font-size:12px;color:var(--text-3);margin-top:4px">قالب: ${tpl.name} (${tpl.file})</div>
        </div>
        <div class="dc-section-actions">
          <button class="btn btn-success" onclick="toast('تم حفظ الإحداثيات بنجاح')">💾 حفظ الإحداثيات للـ Backend</button>
        </div>
      </div>

      <div class="dc-mapper-container">
        <!-- PDF Viewer Simulation -->
        <div class="dc-mapper-canvas-wrap">
          <div class="dc-mapper-page">
            <!-- Simulated draggable mapped fields -->
            <div class="dc-mapper-field active" style="top: 150px; left: 100px; width: 250px; height: 30px;">[client_name]</div>
            <div class="dc-mapper-field" style="top: 150px; left: 400px; width: 150px; height: 30px;">[civil_id]</div>
            <div class="dc-mapper-field" style="top: 200px; left: 100px; width: 200px; height: 30px;">[plot_number]</div>
            
            <!-- Stamp Coordinates -->
            <div class="dc-mapper-field" style="top: 700px; left: 150px; width: 120px; height: 120px; border-style: dashed; border-color: #F59E0B; color: #F59E0B; background: rgba(245,158,11,0.1)">
              (ختم المكتب الدائري)
            </div>
            <!-- Signature Coordinates -->
            <div class="dc-mapper-field" style="top: 720px; left: 400px; width: 150px; height: 60px; border-style: dashed; border-color: #8B5CF6; color: #8B5CF6; background: rgba(139,92,246,0.1)">
              (توقيع المهندس)
            </div>
          </div>
        </div>

        <!-- Fields Sidebar -->
        <div class="dc-mapper-sidebar">
          <div style="font-weight:700;font-size:13px;border-bottom:1px solid var(--border);padding-bottom:10px">الحقول المرتبطة (Mapped Fields)</div>
          
          <div class="dc-field-item active">
            <div style="font-weight:700;color:var(--primary);margin-bottom:4px">اسم المالك (client_name)</div>
            <div style="color:var(--text-3);font-size:10px">X: 100, Y: 150, W: 250, H: 30, P: 1</div>
          </div>
          <div class="dc-field-item">
            <div style="font-weight:700;color:var(--primary);margin-bottom:4px">الرقم المدني (civil_id)</div>
            <div style="color:var(--text-3);font-size:10px">X: 400, Y: 150, W: 150, H: 30, P: 1</div>
          </div>
          <div class="dc-field-item">
            <div style="font-weight:700;color:var(--primary);margin-bottom:4px">رقم القسيمة (plot_number)</div>
            <div style="color:var(--text-3);font-size:10px">X: 100, Y: 200, W: 200, H: 30, P: 1</div>
          </div>
          
          <div style="font-weight:700;font-size:13px;border-bottom:1px solid var(--border);padding-bottom:10px;margin-top:10px">الاعتمادات (Signatures)</div>
          <div class="dc-field-item">
            <div style="font-weight:700;color:#F59E0B;margin-bottom:4px">ختم المكتب</div>
            <div style="color:var(--text-3);font-size:10px">X: 150, Y: 700, W: 120, H: 120</div>
          </div>
          
          <button class="btn btn-sm btn-secondary" style="margin-top:auto" onclick="toast('انقر واسحب على المستند لإضافة حقل جديد')">+ إضافة حقل جديد</button>
        </div>
      </div>
    `;
  },

  // ── 4. Archive ──
  renderArchive() {
    return `
      <div class="dc-section-hdr">
        <div class="dc-section-title">🗄️ أرشيف التراخيص والملفات المكتملة</div>
      </div>
      <div class="dc-empty">
        <div class="dc-empty-icon">📁</div>
        <div class="dc-empty-title">الأرشيف فارغ حالياً</div>
        <div class="dc-empty-text">سيتم حفظ جميع الحزم المولدة من معالج الأتمتة هنا.</div>
      </div>
    `;
  },

  // ── 5. Office Profile Settings ──
  renderSettings() {
    return `
      <div class="dc-section-hdr">
        <div class="dc-section-title">⚙️ إعدادات المكتب الهندسي (الأختام والتواقيع)</div>
      </div>
      
      <div class="grid-2-1">
        <div>
          <div class="card" style="margin-bottom:20px">
             <div class="card-header"><div class="card-title">الختم الرسمي للمكتب</div></div>
             <div class="card-body">
                <div class="dc-profile-upload">
                  <div style="font-size:40px;margin-bottom:10px">🔴</div>
                  <div style="font-weight:700;margin-bottom:5px">رفع صورة الختم (دائري أو بيضاوي)</div>
                  <div style="font-size:11px;color:var(--text-4)">سيقوم النظام بإزالة الخلفية البيضاء وجعله شفافاً (PNG) لحقنه فوق النماذج.</div>
                </div>
             </div>
          </div>
          <div class="card">
             <div class="card-header"><div class="card-title">توقيع المهندس المعتمد</div></div>
             <div class="card-body">
                <div class="dc-profile-upload">
                  <div style="font-size:40px;margin-bottom:10px">✍️</div>
                  <div style="font-weight:700;margin-bottom:5px">رفع صورة التوقيع</div>
                  <div style="font-size:11px;color:var(--text-4)">يجب أن يكون توقيعاً واضحاً بحبر أزرق أو أسود.</div>
                </div>
             </div>
          </div>
        </div>
        
        <div class="card">
           <div class="card-header"><div class="card-title">معاينة الحفظ (Preview)</div></div>
           <div class="card-body" style="text-align:center">
              <div style="background:#F1F5F9;border-radius:12px;padding:30px;position:relative;height:250px;display:flex;align-items:center;justify-content:center;overflow:hidden">
                 <div style="position:absolute;font-size:24px;color:#CBD5E1;transform:rotate(-30deg);white-space:nowrap;font-weight:900">نص وثيقة وهمي لتجربة الختم</div>
                 <div style="width:120px;height:120px;border:3px solid #EF4444;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#EF4444;font-weight:900;transform:rotate(-15deg);box-shadow:inset 0 0 0 2px #EF4444, 0 0 0 2px #EF4444;position:relative;z-index:2;background:rgba(255,255,255,0.7)">
                   ختم المكتب الهندسي
                 </div>
              </div>
              <div style="margin-top:20px;font-size:12px;color:var(--text-3)">سيتم استخدام هذه الأصول تلقائياً في المرحلة 4 من أتمتة التراخيص بناءً على إحداثيات (Visual Mapper).</div>
           </div>
        </div>
      </div>
    `;
  }
};
