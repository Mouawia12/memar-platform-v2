const fs = require('fs');

function updateFile() {
    let content = fs.readFileSync('erp/pricing2.js', 'utf8');

    // Add durations to services
    const oldServices = `services: [
    // Engineering Services
    { id: 'arch', group: 'engineering', name: 'التصميم المعماري', nameEn: 'Architectural Design', icon: '🏛️', desc: 'المخططات المعمارية الكاملة', baseRate: 35, unit: 'م²', visible: true, categories: ['residential','investment','commercial','industrial','medical','general'], documents: [] },
    { id: 'struct', group: 'engineering', name: 'التصميم الإنشائي', nameEn: 'Structural Design', icon: '⚙️', desc: 'تصميم الهيكل الإنشائي', baseRate: 20, unit: 'م²', visible: true, categories: ['residential','investment','commercial','industrial','medical','general'], documents: [] },
    { id: 'elec', group: 'engineering', name: 'المخططات الكهربائية', nameEn: 'Electrical Drawings', icon: '⚡', desc: 'تصميم التمديدات الكهربائية', baseRate: 10, unit: 'م²', visible: true, categories: ['residential','investment','commercial','industrial','medical','general'], documents: [] },
    { id: 'plumb', group: 'engineering', name: 'المخططات الصحية', nameEn: 'Plumbing Drawings', icon: '💧', desc: 'تصميم التمديدات الصحية (سباكة)', baseRate: 10, unit: 'م²', visible: true, categories: ['residential','investment','commercial','industrial','medical','general'], documents: [] },
    { id: 'facade3d', group: 'engineering', name: 'تصميم الواجهات 3D', nameEn: 'Facade Design (3D)', icon: '🖼️', desc: 'تصميم ثلاثي الأبعاد للواجهات', baseRate: 300, unit: 'مقطوع', visible: true, categories: ['residential','investment','commercial','medical'], documents: [] },
    { id: 'interior', group: 'engineering', name: 'التصميم الداخلي', nameEn: 'Interior Design', icon: '🛋️', desc: 'تصميم الفراغات الداخلية', baseRate: 28, unit: 'م²', visible: true, categories: ['residential','investment','commercial','medical'], documents: [] },
    { id: 'quantity', group: 'engineering', name: 'حساب الكميات', nameEn: 'Quantity Surveying', icon: '📊', desc: 'جداول الكميات الدقيقة للمشروع', baseRate: 150, unit: 'مقطوع', visible: true, categories: ['residential','investment','commercial','industrial','medical','general'], documents: [] },
    { id: 'soil_coord', group: 'engineering', name: 'تنسيق فحص التربة', nameEn: 'Soil Test Coordination', icon: '🔬', desc: 'التنسيق مع مختبرات التربة المعتمدة', baseRate: 50, unit: 'مقطوع', visible: true, categories: ['residential','investment','commercial','industrial','medical'], documents: [] },

    // Licensing Services
    { id: 'permit', group: 'licensing', name: 'إصدار رخصة بناء', nameEn: 'Building Permit Issuance', icon: '📝', desc: 'إجراءات استخراج رخصة البناء الجديدة', baseRate: 400, unit: 'مقطوع', visible: true, categories: ['residential','investment','commercial','industrial','medical','general'], documents: [] },
    { id: 'mod_license', group: 'licensing', name: 'رخصة تعديل', nameEn: 'Modification License', icon: '🛠️', desc: 'إصدار رخصة للتعديلات المعمارية', baseRate: 350, unit: 'مقطوع', visible: true, categories: ['residential','investment','commercial','industrial','medical'], documents: [] },
    { id: 'add_license', group: 'licensing', name: 'رخصة إضافة', nameEn: 'Addition License', icon: '🏗️', desc: 'إصدار رخصة لإضافة مساحات جديدة', baseRate: 350, unit: 'مقطوع', visible: true, categories: ['residential','investment','commercial','industrial','medical'], documents: [] },
    { id: 'data_mod', group: 'licensing', name: 'تعديل بيانات رخصة', nameEn: 'License Data Modification', icon: '🔄', desc: 'تعديل بيانات المالك أو البيانات الفنية للرخصة', baseRate: 0, unit: 'تسعير يدوي', emptyPrice: true, visible: true, categories: ['residential','investment','commercial','industrial','medical','general'], documents: [] },
    { id: 'fire_appr', group: 'licensing', name: 'موافقات الإطفاء', nameEn: 'Fire Dept Approvals', icon: '🚒', desc: 'اعتماد المخططات من قوة الإطفاء', baseRate: 250, unit: 'مقطوع', visible: true, categories: ['investment','commercial','industrial','medical','general'], documents: [] },
    { id: 'elec_appr', group: 'licensing', name: 'موافقة الكهرباء', nameEn: 'Electricity Approval', icon: '🔌', desc: 'اعتماد مخططات وزارة الكهرباء', baseRate: 150, unit: 'مقطوع', visible: true, categories: ['residential','investment','commercial','industrial','medical','general'], documents: [] },

    // Other Services
    { id: 'garden_permit', group: 'other', name: 'ترخيص حديقة', nameEn: 'Garden Permit', icon: '🌳', desc: 'استخراج ترخيص حديقة خارجية', baseRate: 120, unit: 'مقطوع', visible: true, categories: ['residential'], documents: [] },
    { id: 'canopy_permit', group: 'other', name: 'ترخيص مظلات', nameEn: 'Canopy Permit', icon: '☂️', desc: 'استخراج ترخيص للمظلات', baseRate: 100, unit: 'مقطوع', visible: true, categories: ['residential','investment','commercial'], documents: [] },
    { id: 'supervision', group: 'other', name: 'إشراف هندسي', nameEn: 'Supervision', icon: '👷', desc: 'إشراف على التنفيذ (شهري/مقطوع)', baseRate: 250, unit: 'شهر', visible: true, categories: ['residential','investment','commercial','industrial','medical','general'], documents: [] },
    { id: 'as_built', group: 'other', name: 'مخططات As-Built', nameEn: 'As-Built Drawings', icon: '📐', desc: 'مخططات مطابقة للتنفيذ الفعلي', baseRate: 200, unit: 'مقطوع', visible: true, categories: ['residential','investment','commercial','industrial','medical','general'], documents: [] },
  ],`;

    const newServices = `services: [
    // Engineering Services
    { id: 'arch', group: 'engineering', name: 'التصميم المعماري', nameEn: 'Architectural Design', icon: '🏛️', desc: 'المخططات المعمارية الكاملة', baseRate: 35, unit: 'م²', duration: 15, visible: true, categories: ['residential','investment','commercial','industrial','medical','general'], documents: [] },
    { id: 'struct', group: 'engineering', name: 'التصميم الإنشائي', nameEn: 'Structural Design', icon: '⚙️', desc: 'تصميم الهيكل الإنشائي', baseRate: 20, unit: 'م²', duration: 10, visible: true, categories: ['residential','investment','commercial','industrial','medical','general'], documents: [] },
    { id: 'elec', group: 'engineering', name: 'المخططات الكهربائية', nameEn: 'Electrical Drawings', icon: '⚡', desc: 'تصميم التمديدات الكهربائية', baseRate: 10, unit: 'م²', duration: 5, visible: true, categories: ['residential','investment','commercial','industrial','medical','general'], documents: [] },
    { id: 'plumb', group: 'engineering', name: 'المخططات الصحية', nameEn: 'Plumbing Drawings', icon: '💧', desc: 'تصميم التمديدات الصحية (سباكة)', baseRate: 10, unit: 'م²', duration: 5, visible: true, categories: ['residential','investment','commercial','industrial','medical','general'], documents: [] },
    { id: 'facade3d', group: 'engineering', name: 'تصميم الواجهات 3D', nameEn: 'Facade Design (3D)', icon: '🖼️', desc: 'تصميم ثلاثي الأبعاد للواجهات', baseRate: 300, unit: 'مقطوع', duration: 7, visible: true, categories: ['residential','investment','commercial','medical'], documents: [] },
    { id: 'interior', group: 'engineering', name: 'التصميم الداخلي', nameEn: 'Interior Design', icon: '🛋️', desc: 'تصميم الفراغات الداخلية', baseRate: 28, unit: 'م²', duration: 20, visible: true, categories: ['residential','investment','commercial','medical'], documents: [] },
    { id: 'quantity', group: 'engineering', name: 'حساب الكميات', nameEn: 'Quantity Surveying', icon: '📊', desc: 'جداول الكميات الدقيقة للمشروع', baseRate: 150, unit: 'مقطوع', duration: 7, visible: true, categories: ['residential','investment','commercial','industrial','medical','general'], documents: [] },
    { id: 'soil_coord', group: 'engineering', name: 'تنسيق فحص التربة', nameEn: 'Soil Test Coordination', icon: '🔬', desc: 'التنسيق مع مختبرات التربة المعتمدة', baseRate: 50, unit: 'مقطوع', duration: 7, visible: true, categories: ['residential','investment','commercial','industrial','medical'], documents: [] },

    // Licensing Services
    { id: 'permit', group: 'licensing', name: 'إصدار رخصة بناء', nameEn: 'Building Permit Issuance', icon: '📝', desc: 'إجراءات استخراج رخصة البناء الجديدة', baseRate: 400, unit: 'مقطوع', duration: 30, visible: true, categories: ['residential','investment','commercial','industrial','medical','general'], documents: [] },
    { id: 'mod_license', group: 'licensing', name: 'رخصة تعديل', nameEn: 'Modification License', icon: '🛠️', desc: 'إصدار رخصة للتعديلات المعمارية', baseRate: 350, unit: 'مقطوع', duration: 20, visible: true, categories: ['residential','investment','commercial','industrial','medical'], documents: [] },
    { id: 'add_license', group: 'licensing', name: 'رخصة إضافة', nameEn: 'Addition License', icon: '🏗️', desc: 'إصدار رخصة لإضافة مساحات جديدة', baseRate: 350, unit: 'مقطوع', duration: 20, visible: true, categories: ['residential','investment','commercial','industrial','medical'], documents: [] },
    { id: 'data_mod', group: 'licensing', name: 'تعديل بيانات رخصة', nameEn: 'License Data Modification', icon: '🔄', desc: 'تعديل بيانات المالك أو البيانات الفنية للرخصة', baseRate: 0, unit: 'تسعير يدوي', emptyPrice: true, duration: 10, visible: true, categories: ['residential','investment','commercial','industrial','medical','general'], documents: [] },
    { id: 'fire_appr', group: 'licensing', name: 'موافقات الإطفاء', nameEn: 'Fire Dept Approvals', icon: '🚒', desc: 'اعتماد المخططات من قوة الإطفاء', baseRate: 250, unit: 'مقطوع', duration: 15, visible: true, categories: ['investment','commercial','industrial','medical','general'], documents: [] },
    { id: 'elec_appr', group: 'licensing', name: 'موافقة الكهرباء', nameEn: 'Electricity Approval', icon: '🔌', desc: 'اعتماد مخططات وزارة الكهرباء', baseRate: 150, unit: 'مقطوع', duration: 10, visible: true, categories: ['residential','investment','commercial','industrial','medical','general'], documents: [] },

    // Other Services
    { id: 'garden_permit', group: 'other', name: 'ترخيص حديقة', nameEn: 'Garden Permit', icon: '🌳', desc: 'استخراج ترخيص حديقة خارجية', baseRate: 120, unit: 'مقطوع', duration: 7, visible: true, categories: ['residential'], documents: [] },
    { id: 'canopy_permit', group: 'other', name: 'ترخيص مظلات', nameEn: 'Canopy Permit', icon: '☂️', desc: 'استخراج ترخيص للمظلات', baseRate: 100, unit: 'مقطوع', duration: 7, visible: true, categories: ['residential','investment','commercial'], documents: [] },
    { id: 'supervision', group: 'other', name: 'إشراف هندسي', nameEn: 'Supervision', icon: '👷', desc: 'إشراف على التنفيذ (شهري/مقطوع)', baseRate: 250, unit: 'شهر', duration: null, visible: true, categories: ['residential','investment','commercial','industrial','medical','general'], documents: [] },
    { id: 'as_built', group: 'other', name: 'مخططات As-Built', nameEn: 'As-Built Drawings', icon: '📐', desc: 'مخططات مطابقة للتنفيذ الفعلي', baseRate: 200, unit: 'مقطوع', duration: 10, visible: true, categories: ['residential','investment','commercial','industrial','medical','general'], documents: [] },
  ],`;
    
    content = content.replace(oldServices, newServices);

    // Update PricingState2
    const oldState = `showDocs:    true,
  adminMode:   false,
  clientName:  '',`;
    const newState = `showDocs:    true,
  showTimeline: true,
  showConditions: true,
  showSupervision: true,
  adminMode:   false,
  clientName:  '',`;
    content = content.replace(oldState, newState);

    // Update Toggles UI
    const oldToggles = `<div class="toggles-row">
          <label class="toggle-row">
            <div>
              <div class="toggle-row-name">🏛 رسوم حكومية</div>
              <div class="toggle-row-desc">إضافة تكاليف رخص وتصاريح البلدية</div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="gov-fees-toggle" \${PricingState2.govFees ? 'checked' : ''}>
              <span class="toggle-track"></span>
            </label>
          </label>
          <label class="toggle-row">
            <div>
              <div class="toggle-row-name">📄 المستندات المطلوبة</div>
              <div class="toggle-row-desc">إظهار قائمة الوثائق في العرض</div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="docs-toggle" \${PricingState2.showDocs ? 'checked' : ''}>
              <span class="toggle-track"></span>
            </label>
          </label>
        </div>`;
    const newToggles = `<div class="toggles-row" style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
          <label class="toggle-row" style="margin:0;">
            <div>
              <div class="toggle-row-name">🏛 الرسوم الحكومية</div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="gov-fees-toggle" \${PricingState2.govFees ? 'checked' : ''}>
              <span class="toggle-track"></span>
            </label>
          </label>
          <label class="toggle-row" style="margin:0;">
            <div>
              <div class="toggle-row-name">📄 المستندات</div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="docs-toggle" \${PricingState2.showDocs ? 'checked' : ''}>
              <span class="toggle-track"></span>
            </label>
          </label>
          <label class="toggle-row" style="margin:0;">
            <div>
              <div class="toggle-row-name">⏳ الجدول الزمني</div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="timeline-toggle" \${PricingState2.showTimeline ? 'checked' : ''}>
              <span class="toggle-track"></span>
            </label>
          </label>
          <label class="toggle-row" style="margin:0;">
            <div>
              <div class="toggle-row-name">⚠️ الشروط والأحكام</div>
            </div>
            <label class="toggle-switch">
              <input type="checkbox" id="conditions-toggle" \${PricingState2.showConditions ? 'checked' : ''}>
              <span class="toggle-track"></span>
            </label>
          </label>
        </div>`;
    content = content.replace(oldToggles, newToggles);

    // Update Bind Events for new toggles
    const oldEvents = `document.getElementById('docs-toggle')?.addEventListener('change', e => {
      PricingState2.showDocs = e.target.checked;
      this.refreshSummary();
    });`;
    const newEvents = `document.getElementById('docs-toggle')?.addEventListener('change', e => {
      PricingState2.showDocs = e.target.checked;
      this.refreshSummary();
    });
    document.getElementById('timeline-toggle')?.addEventListener('change', e => {
      PricingState2.showTimeline = e.target.checked;
      this.refreshSummary();
    });
    document.getElementById('conditions-toggle')?.addEventListener('change', e => {
      PricingState2.showConditions = e.target.checked;
      this.refreshSummary();
    });`;
    content = content.replace(oldEvents, newEvents);

    // Update renderSummary to include Timeline and Conditions
    const summaryOldNotes = `<!-- Notes -->
        \${PricingState2.notes ? \`
        <div class="quote-notes">
          <div style="font-size:11px;font-weight:700;color:var(--text-3);margin-bottom:4px">ملاحظات</div>
          <div>\${PricingState2.notes}</div>
        </div>\` : ''}`;
    
    const summaryNewNotes = `
        <!-- Timeline Engine -->
        \${PricingState2.showTimeline && r.services.some(l => l.svc.duration) ? \`
        <div class="quote-section-title" style="margin-top:14px">⏳ الجدول الزمني المتوقع</div>
        <div class="docs-list" style="display:grid; grid-template-columns:1fr 1fr; gap:6px;">
          \${r.services.filter(l => l.svc.duration).map(l => \`
            <div class="doc-item" style="font-size:12px;">🕒 \${l.svc.name}: <strong style="color:var(--primary)">\${l.svc.duration} يوم</strong></div>
          \`).join('')}
        </div>\` : ''}

        <!-- Notes -->
        \${PricingState2.notes ? \`
        <div class="quote-notes">
          <div style="font-size:11px;font-weight:700;color:var(--text-3);margin-bottom:4px">ملاحظات</div>
          <div>\${PricingState2.notes}</div>
        </div>\` : ''}
        
        <!-- Conditions -->
        \${PricingState2.showConditions ? \`
        <div class="quote-notes" style="background:#F8FAFC; border-color:#E2E8F0; margin-top:10px;">
          <div style="font-size:11px;font-weight:700;color:var(--text-3);margin-bottom:4px">⚠️ الشروط والأحكام</div>
          <ul style="font-size:11px; padding-right:16px; color:#475569; margin:0;">
             <li>الأسعار بالدينار الكويتي (KWD).</li>
             <li>العرض غير شامل لأي تعديلات جوهرية على نطاق العمل بعد الاعتماد.</li>
             <li>الرسوم الحكومية قابلة للتغيير وفق تحديثات الجهات الرسمية.</li>
          </ul>
        </div>\` : ''}`;
    
    content = content.replace(summaryOldNotes, summaryNewNotes);

    fs.writeFileSync('erp/pricing2.js', content, 'utf8');
}

updateFile();
