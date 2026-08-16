/* ══════════════════════════════════════════════════════
   MEMAR ERP — Client Portal Style — JavaScript
   Navigation, Interactions, Dynamic Behavior
══════════════════════════════════════════════════════ */

// ── Navigation System ──────────────────────────
function navigateTo(page) {
  // Hide all pages
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  
  // Show target page
  const target = document.getElementById('p-' + page);
  if (target) {
    target.classList.add('active');
  }
  
  // Update nav items
  document.querySelectorAll('.nav-item').forEach(item => item.classList.remove('active'));
  const navItem = document.querySelector(`.nav-item[data-page="${page}"]`);
  if (navItem) navItem.classList.add('active');
  
  // Update page title
  const titles = {
    'dashboard': 'لوحة التحكم',
    'crm': 'إدارة علاقات العملاء',
    'companies': 'الشركات (B2B)',
    'clients': 'سجل العملاء',
    'projects': 'المشاريع',
    'tasks': 'المهام والمتابعة',
    'appointments': 'المواعيد',
    'services': 'الخدمات والأسعار',
    'pricing': 'محرك التسعير',
    'hr': 'إدارة الموظفين',
    'finance': 'الحسابات المالية',
    'reports': 'التقارير',
    'whatsapp': 'التواصل',
    'requests': 'الطلبات',
    'crm_meetings': 'الاجتماعات',
    'user_logs': 'سجل المستخدمين',
    'roles': 'الصلاحيات',
    'web_builder': 'إدارة الموقع',
    'hero_ads': 'مدير الإعلانات',
    'audit': 'مراقبة النظام',
    'chatbot': 'المساعد الذكي',
    'field_visits': 'الزيارات الميدانية',
    'file_manager': 'مدير الملفات',
    'engineer_portal': 'بوابة المهندسين',
    'knet_payment': 'بوابة الدفع KNET',
    'careers': 'التوظيف',
    'doc_editor': 'محرر المستندات'
  };
  
  document.getElementById('page-title').textContent = titles[page] || page;
  
  // Close sidebar on mobile
  if (window.innerWidth <= 900) {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').style.display = 'none';
  }
}

// ── Modal System ──────────────────────────────
function openModal(title, body) {
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').innerHTML = body;
  document.getElementById('modal-backdrop').classList.add('open');
}

function closeModal() {
  document.getElementById('modal-backdrop').classList.remove('open');
}

// ── Notification Panel ──────────────────────────
function toggleNotifPanel() {
  // Navigate to notifications page
  const navItem = document.querySelector('[data-page="notifications"]');
  if (navItem) navItem.click();
  else showToast('🔔 مركز الإشعارات', 'info');
}

// ── Toast System ──────────────────────────────
function showToast(message, type = 'info') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.style.cssText = `
    background: #fff;
    border-radius: 12px;
    padding: 14px 20px;
    box-shadow: 0 8px 24px rgba(0,0,0,0.12);
    border-right: 4px solid ${type === 'success' ? '#2D9B6F' : type === 'danger' ? '#DC4A3D' : '#1B6CA8'};
    font-size: 13px;
    font-weight: 600;
    color: #1E293B;
    font-family: 'Cairo', sans-serif;
    animation: slideIn .3s ease;
    min-width: 250px;
  `;
  toast.textContent = message;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(-20px)';
    toast.style.transition = 'all .3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}

// ── Date Display ──────────────────────────────
function updateDate() {
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  const dateStr = now.toLocaleDateString('ar-SA', options);
  const dateEl = document.getElementById('topbar-date');
  if (dateEl) dateEl.textContent = dateStr;
}

// ── Notifications & Workflow Functions (Part 16) ─────────────────
function filterNotifs(level) {
  const items = document.querySelectorAll('#notif-list-container .wf-notif-item');
  items.forEach(item => {
    if (level === 'all') { item.style.display = 'flex'; return; }
    const map = { critical: 'wf-notif-critical', high: 'wf-notif-high', normal: 'wf-notif-normal', low: 'wf-notif-low' };
    item.style.display = item.classList.contains(map[level]) ? 'flex' : 'none';
  });
  showToast('🔍 تصفية: ' + level, 'info');
}

function switchDbTab(tab) {
  const tabs = ['core','crm','projects','finance','hr','docs','comm','workflow'];
  tabs.forEach(t => {
    const el = document.getElementById('dbtab-' + t);
    if (el) el.classList.toggle('active', t === tab);
  });
  document.querySelectorAll('.db-tab').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.includes(
      tab === 'core' ? 'النظام' : tab === 'crm' ? 'CRM' : tab === 'projects' ? 'المشاريع' :
      tab === 'finance' ? 'المالية' : tab === 'hr' ? 'الموارد' : tab === 'docs' ? 'المستندات' :
      tab === 'comm' ? 'التواصل' : 'العمليات'
    ));
  });
}

function switchApiTab(tab) {
  const tabs = ['auth','users','crm','projects','hr','finance','docs','notif','ai','reports'];
  tabs.forEach(t => {
    const el = document.getElementById('apitab-' + t);
    if (el) el.classList.toggle('active', t === tab);
  });
  document.querySelectorAll('.api-tab').forEach(btn => {
    const map = { auth:'Auth', users:'Users', crm:'CRM', projects:'Projects', hr:'HR', finance:'Finance', docs:'Docs', notif:'Notifications', ai:'AI', reports:'Reports' };
    btn.classList.toggle('active', btn.textContent.includes(map[tab] || tab));
  });
}

/* ─── Part 19: Automation Tabs ─── */
function switchAutoTab(tab) {
  const tabs = ['crm-auto','project-auto','contract-auto','finance-auto','hr-auto','eng-auto','docs-auto','ai-auto'];
  tabs.forEach(t => {
    const el = document.getElementById('auto-' + t);
    if (el) el.classList.toggle('active', t === tab);
  });
  document.querySelectorAll('.auto-tab').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('onclick') && btn.getAttribute('onclick').includes(tab));
  });
}

function switchWfTab(tab) {
  const tabs = ['active','builder','history','triggers'];
  tabs.forEach(t => {
    const el = document.getElementById('wf-tab-' + t);
    if (el) el.style.display = t === tab ? 'block' : 'none';
  });
}

function notifSettingsHTML() {
  return `
    <div style="display:flex;flex-direction:column;gap:14px">
      <div style="font-size:12px;font-weight:900;color:var(--text-1);margin-bottom:4px">📧 قنوات الإشعارات</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <label class="prc-check"><input type="checkbox" checked> إشعارات داخلية</label>
        <label class="prc-check"><input type="checkbox" checked> البريد الإلكتروني</label>
        <label class="prc-check"><input type="checkbox"> WhatsApp</label>
        <label class="prc-check"><input type="checkbox"> Push Notifications</label>
      </div>
      <div style="font-size:12px;font-weight:900;color:var(--text-1);margin-top:8px">🔔 أنواع الإشعارات</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <label class="prc-check"><input type="checkbox" checked> المشاريع</label>
        <label class="prc-check"><input type="checkbox" checked> المهام</label>
        <label class="prc-check"><input type="checkbox" checked> المالية</label>
        <label class="prc-check"><input type="checkbox" checked> العقود</label>
        <label class="prc-check"><input type="checkbox" checked> CRM</label>
        <label class="prc-check"><input type="checkbox" checked> الموافقات</label>
        <label class="prc-check"><input type="checkbox"> النظام</label>
        <label class="prc-check"><input type="checkbox" checked> المستندات</label>
      </div>
      <div style="font-size:12px;font-weight:900;color:var(--text-1);margin-top:8px">⏰ التوقيت</div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">ساعات العمل فقط</label><select class="form-input"><option>نعم (8ص - 5م)</option><option>لا — 24 ساعة</option></select></div>
        <div class="form-group"><label class="form-label">تجميع الإشعارات</label><select class="form-input"><option>فوري</option><option>كل ساعة</option><option>يومي</option></select></div>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;padding-top:10px;border-top:1px solid var(--divider)">
        <button class="btn btn-secondary" onclick="closeModal()">إلغاء</button>
        <button class="btn btn-primary" onclick="closeModal();showToast('✅ تم حفظ الإعدادات','success')">💾 حفظ</button>
      </div>
    </div>
  `;
}

function wfBuilderHTML() {
  return `
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="form-group"><label class="form-label">اسم الـ Workflow *</label><input class="form-input" placeholder="مثال: عقد جديد → إنشاء مشروع"></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">المحفز (Trigger) *</label>
          <select class="form-input"><option>Contract Signed</option><option>Lead Created</option><option>Payment Overdue</option><option>Project Delayed</option><option>Leave Requested</option><option>Document Uploaded</option><option>Invoice Created</option><option>Employee Added</option></select>
        </div>
        <div class="form-group"><label class="form-label">الشرط (Condition)</label>
          <select class="form-input"><option>بدون شرط</option><option>المبلغ > 10,000</option><option>الأولوية = عاجل</option><option>القسم = التصميم</option><option>المشروع = نشط</option></select>
        </div>
      </div>
      <div class="form-group"><label class="form-label">الإجراءات (Actions) *</label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:4px">
          <label class="prc-check"><input type="checkbox" checked> إنشاء مهمة</label>
          <label class="prc-check"><input type="checkbox" checked> إرسال إشعار</label>
          <label class="prc-check"><input type="checkbox"> تحديث حالة</label>
          <label class="prc-check"><input type="checkbox"> تعيين مسؤول</label>
          <label class="prc-check"><input type="checkbox"> إنشاء مستند</label>
          <label class="prc-check"><input type="checkbox"> طلب موافقة</label>
          <label class="prc-check"><input type="checkbox"> إرسال Email</label>
          <label class="prc-check"><input type="checkbox"> إرسال WhatsApp</label>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">إشعار إلى</label>
          <select class="form-input"><option>مدير المشروع</option><option>الفريق</option><option>المدير العام</option><option>المالية</option><option>HR</option></select>
        </div>
        <div class="form-group"><label class="form-label">طلب موافقة من</label>
          <select class="form-input"><option>غير مطلوب</option><option>مدير المشروع</option><option>المدير العام</option><option>المالية + المدير العام</option></select>
        </div>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;padding-top:10px;border-top:1px solid var(--divider)">
        <button class="btn btn-secondary" onclick="closeModal()">إلغاء</button>
        <button class="btn btn-primary" onclick="closeModal();showToast('✅ تم إنشاء Workflow بنجاح — سيبدأ العمل فوراً','success')">⚙️ إنشاء وتفعيل</button>
      </div>
    </div>
  `;
}

// ── Permissions & Security Functions ─────────────────────────────
function switchSecTab(tab) {
  const tabs = ['roles','users','matrix','settings'];
  tabs.forEach(t => {
    const el = document.getElementById('sec-tab-' + t);
    if (el) el.style.display = t === tab ? 'block' : 'none';
  });
}

function secRoleFormHTML() {
  return `
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="form-group"><label class="form-label">اسم الدور *</label><input class="form-input" placeholder="مثال: مدير قسم"></div>
      <div class="form-group"><label class="form-label">الوصف</label><textarea class="form-input" rows="2" placeholder="وصف صلاحيات هذا الدور"></textarea></div>
      <div class="form-group"><label class="form-label">الصلاحيات</label>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-top:4px">
          <label class="prc-check"><input type="checkbox" checked> عرض المشاريع</label>
          <label class="prc-check"><input type="checkbox" checked> إنشاء مشروع</label>
          <label class="prc-check"><input type="checkbox"> حذف مشروع</label>
          <label class="prc-check"><input type="checkbox" checked> عرض CRM</label>
          <label class="prc-check"><input type="checkbox"> عرض المالية</label>
          <label class="prc-check"><input type="checkbox" checked> رفع ملفات</label>
          <label class="prc-check"><input type="checkbox"> تصدير تقارير</label>
          <label class="prc-check"><input type="checkbox"> إدارة المستخدمين</label>
          <label class="prc-check"><input type="checkbox" checked> عرض التقارير</label>
          <label class="prc-check"><input type="checkbox"> اعتماد عقود</label>
        </div>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;padding-top:10px;border-top:1px solid var(--divider)">
        <button class="btn btn-secondary" onclick="closeModal()">إلغاء</button>
        <button class="btn btn-primary" onclick="closeModal();showToast('✅ تم إنشاء الدور بنجاح','success')">🔐 إنشاء</button>
      </div>
    </div>
  `;
}

function secUserFormHTML() {
  return `
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="form-row">
        <div class="form-group"><label class="form-label">الاسم الكامل *</label><input class="form-input" placeholder="الاسم"></div>
        <div class="form-group"><label class="form-label">البريد الإلكتروني *</label><input class="form-input" type="email" placeholder="user@memar.kw"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">الدور *</label>
          <select class="form-input"><option>مهندس</option><option>مدير مشاريع</option><option>محاسب</option><option>مبيعات</option><option>HR</option><option>مراقب مستندات</option></select>
        </div>
        <div class="form-group"><label class="form-label">القسم *</label>
          <select class="form-input"><option>التصميم المعماري</option><option>الإنشاء</option><option>الكهرباء</option><option>المالية</option><option>المبيعات</option><option>HR</option><option>التسويق</option></select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">الهاتف</label><input class="form-input" placeholder="9XXXXXXX"></div>
        <div class="form-group"><label class="form-label">المدير المباشر</label>
          <select class="form-input"><option>م. خالد العنزي</option><option>المدير العام</option><option>م. سارة المطيري</option></select>
        </div>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;padding-top:10px;border-top:1px solid var(--divider)">
        <button class="btn btn-secondary" onclick="closeModal()">إلغاء</button>
        <button class="btn btn-primary" onclick="closeModal();showToast('✅ تم إضافة المستخدم — تم إرسال رابط التفعيل','success')">👤 إضافة</button>
      </div>
    </div>
  `;
}

// ── Website Builder & Hero Ads Functions ──────────────────────────
function switchWebTab(tab) {
  const tabs = ['pages','services','portfolio','media','seo','analytics','forms'];
  tabs.forEach(t => {
    const el = document.getElementById('web-tab-' + t);
    if (el) el.style.display = t === tab ? 'block' : 'none';
  });
}

function webPageFormHTML() {
  return `
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="form-row">
        <div class="form-group"><label class="form-label">عنوان الصفحة *</label><input class="form-input" placeholder="مثال: عروض رمضان"></div>
        <div class="form-group"><label class="form-label">الرابط (Slug)</label><input class="form-input" placeholder="/offers-ramadan"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">القالب</label>
          <select class="form-input"><option>صفحة عامة</option><option>صفحة خدمة</option><option>صفحة هبوط</option><option>مقال</option></select>
        </div>
        <div class="form-group"><label class="form-label">الحالة</label>
          <select class="form-input"><option>مسودة</option><option>منشورة</option></select>
        </div>
      </div>
      <div class="form-group"><label class="form-label">Meta Description</label><textarea class="form-input" rows="2" placeholder="وصف قصير للصفحة (SEO)"></textarea></div>
      <div style="display:flex;gap:8px;justify-content:flex-end;padding-top:10px;border-top:1px solid var(--divider)">
        <button class="btn btn-secondary" onclick="closeModal()">إلغاء</button>
        <button class="btn btn-primary" onclick="closeModal();showToast('✅ تم إنشاء الصفحة','success')">📄 إنشاء</button>
      </div>
    </div>
  `;
}

function webServiceFormHTML() {
  return `
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="form-row">
        <div class="form-group"><label class="form-label">اسم الخدمة *</label><input class="form-input" placeholder="مثال: التصميم المعماري"></div>
        <div class="form-group"><label class="form-label">التصنيف</label>
          <select class="form-input"><option>تصميم</option><option>إشراف</option><option>تراخيص</option><option>استشارات</option></select>
        </div>
      </div>
      <div class="form-group"><label class="form-label">الوصف</label><textarea class="form-input" rows="2" placeholder="وصف الخدمة للموقع"></textarea></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">الأيقونة</label><input class="form-input" placeholder="📐"></div>
        <div class="form-group"><label class="form-label">الحالة</label>
          <select class="form-input"><option>منشور</option><option>مسودة</option></select>
        </div>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;padding-top:10px;border-top:1px solid var(--divider)">
        <button class="btn btn-secondary" onclick="closeModal()">إلغاء</button>
        <button class="btn btn-primary" onclick="closeModal();showToast('✅ تم إضافة الخدمة','success')">🛠️ إضافة</button>
      </div>
    </div>
  `;
}

function webPortfolioFormHTML() {
  return `
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="form-row">
        <div class="form-group"><label class="form-label">اسم المشروع *</label><input class="form-input" placeholder="فيلا الجابرية"></div>
        <div class="form-group"><label class="form-label">النوع</label>
          <select class="form-input"><option>فلل</option><option>تجاري</option><option>حكومي</option><option>سكني</option><option>داخلي</option></select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">الموقع</label><input class="form-input" placeholder="الجابرية"></div>
        <div class="form-group"><label class="form-label">السنة</label><input class="form-input" type="number" value="2024"></div>
      </div>
      <div class="form-group"><label class="form-label">الوصف</label><textarea class="form-input" rows="2" placeholder="وصف المشروع"></textarea></div>
      <div style="display:flex;gap:8px;justify-content:flex-end;padding-top:10px;border-top:1px solid var(--divider)">
        <button class="btn btn-secondary" onclick="closeModal()">إلغاء</button>
        <button class="btn btn-primary" onclick="closeModal();showToast('✅ تم إضافة المشروع للمعرض','success')">🖼️ إضافة</button>
      </div>
    </div>
  `;
}

function webAdFormHTML() {
  return `
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="form-group"><label class="form-label">عنوان الإعلان *</label><input class="form-input" placeholder="مثال: باقة معمار الشاملة"></div>
      <div class="form-group"><label class="form-label">العنوان الفرعي</label><input class="form-input" placeholder="خصم 20% لفترة محدودة"></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">نوع الوسائط</label>
          <select class="form-input"><option>صورة</option><option>فيديو</option><option>صورة متحركة</option><option>بانر تفاعلي</option></select>
        </div>
        <div class="form-group"><label class="form-label">الأولوية</label>
          <select class="form-input"><option>1 — الأعلى</option><option>2</option><option>3</option><option>4</option><option>5</option></select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">تاريخ البداية</label><input class="form-input" type="date"></div>
        <div class="form-group"><label class="form-label">تاريخ النهاية</label><input class="form-input" type="date"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">نص الزر (CTA)</label><input class="form-input" placeholder="احجز الآن"></div>
        <div class="form-group"><label class="form-label">رابط الزر</label><input class="form-input" placeholder="/contact"></div>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;padding-top:10px;border-top:1px solid var(--divider)">
        <button class="btn btn-secondary" onclick="closeModal()">إلغاء</button>
        <button class="btn btn-primary" onclick="closeModal();showToast('✅ تم إنشاء الإعلان','success')">🎬 إنشاء</button>
      </div>
    </div>
  `;
}

function webCampaignFormHTML() {
  return `
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="form-group"><label class="form-label">اسم الحملة *</label><input class="form-input" placeholder="حملة الصيف 2024"></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">الهدف (Leads)</label><input class="form-input" type="number" placeholder="500"></div>
        <div class="form-group"><label class="form-label">الميزانية (د.ك)</label><input class="form-input" type="number" placeholder="2000"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">تاريخ البداية</label><input class="form-input" type="date"></div>
        <div class="form-group"><label class="form-label">تاريخ النهاية</label><input class="form-input" type="date"></div>
      </div>
      <div class="form-group"><label class="form-label">الإعلان المرتبط</label>
        <select class="form-input"><option>باقة معمار الشاملة</option><option>التصميم المعماري</option><option>الإشراف الهندسي</option><option>عرض الصيف</option></select>
      </div>
      <div class="form-group"><label class="form-label">الجمهور المستهدف</label>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px">
          <label class="prc-check"><input type="checkbox" checked> أصحاب أراضي</label>
          <label class="prc-check"><input type="checkbox" checked> شركات</label>
          <label class="prc-check"><input type="checkbox"> مستثمرين</label>
          <label class="prc-check"><input type="checkbox"> جهات حكومية</label>
        </div>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;padding-top:10px;border-top:1px solid var(--divider)">
        <button class="btn btn-secondary" onclick="closeModal()">إلغاء</button>
        <button class="btn btn-primary" onclick="closeModal();showToast('✅ تم إنشاء الحملة','success')">📢 إنشاء</button>
      </div>
    </div>
  `;
}

// ── Reports & Analytics Engine Functions ──────────────────────────
function switchRptTab(tab) {
  const tabs = ['executive','projects','financial','crm','hr','engineering','pricing'];
  tabs.forEach(t => {
    const el = document.getElementById('rpt-tab-' + t);
    if (el) el.style.display = t === tab ? 'block' : 'none';
  });
}

function rptAIAsk() {
  const input = document.getElementById('rpt-ai-input');
  const q = input.value.trim();
  if (!q) return;
  const resultDiv = document.getElementById('rpt-ai-result');
  const textDiv = document.getElementById('rpt-ai-text');
  resultDiv.style.display = 'block';
  textDiv.innerHTML = '⏳ جاري التحليل...';
  setTimeout(() => {
    const answers = {
      'ما أكثر المشاريع ربحية هذا العام؟': '<strong>أكثر 3 مشاريع ربحية:</strong><br>1. فيلا الجابرية — ربح 45,000 د.ك (هامش 62%)<br>2. مبنى تجاري حولي — ربح 38,000 د.ك (هامش 48%)<br>3. عمارة السالمية — ربح 32,000 د.ك (هامش 44%)<br><br>💡 <strong>توصية:</strong> التركيز على مشاريع الفلل الفاخرة يحقق أعلى هامش ربح.',
      'لماذا انخفضت الأرباح الشهر الماضي؟': '<strong>تحليل انخفاض الأرباح (يوليو):</strong><br>• الإيرادات انخفضت 15% بسبب تأخر 3 تحصيلات<br>• المصروفات ارتفعت 8% (رواتب إضافية + موردين)<br>• 2 مشاريع توقفت مؤقتاً<br><br>💡 <strong>توصية:</strong> متابعة التحصيلات المتأخرة (43,000 د.ك) ستعيد الأرباح للمستوى الطبيعي.',
      'ما أداء فريق المبيعات هذا الربع؟': '<strong>أداء المبيعات Q3:</strong><br>• Leads جديدة: 156 (+12% عن Q2)<br>• معدل التحويل: 22% (مستقر)<br>• قيمة الصفقات: 892,000 د.ك<br>• أفضل موظف: أحمد — 12 صفقة<br><br>💡 <strong>توصية:</strong> زيادة حملات إنستغرام (أعلى مصدر تحويل).',
      'توقعات الإيرادات للربع القادم': '<strong>توقعات Q4:</strong><br>• إيرادات متوقعة: 1,050,000 د.ك (+18%)<br>• مشاريع جديدة متوقعة: 12<br>• تحصيلات مجدولة: 340,000 د.ك<br><br>💡 <strong>الأساس:</strong> 8 عقود قيد التوقيع + موسم البناء الشتوي.'
    };
    textDiv.innerHTML = answers[q] || '<strong>تحليل: "' + q + '"</strong><br><br>بناءً على بيانات النظام، تم تحليل الطلب. النتائج تشير إلى أداء إيجابي بشكل عام مع وجود فرص تحسين في التحصيلات ومتابعة العملاء المحتملين.<br><br>💡 <strong>توصية:</strong> مراجعة التقارير التفصيلية للحصول على بيانات أدق.';
  }, 1200);
}

function rptCustomReportHTML() {
  return `
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="form-group"><label class="form-label">اسم التقرير *</label><input class="form-input" placeholder="مثال: تقرير المشاريع المتأخرة"></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">مصدر البيانات *</label>
          <select class="form-input"><option>المشاريع</option><option>العملاء (CRM)</option><option>المالية</option><option>الموظفين</option><option>المستندات</option><option>التسعير</option></select>
        </div>
        <div class="form-group"><label class="form-label">الفترة</label>
          <select class="form-input"><option>هذا الشهر</option><option>هذا الربع</option><option>هذا العام</option><option>مخصص</option></select>
        </div>
      </div>
      <div class="form-group"><label class="form-label">الأعمدة المطلوبة</label>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px">
          <label class="prc-check"><input type="checkbox" checked> الاسم</label>
          <label class="prc-check"><input type="checkbox" checked> الحالة</label>
          <label class="prc-check"><input type="checkbox" checked> التاريخ</label>
          <label class="prc-check"><input type="checkbox"> المسؤول</label>
          <label class="prc-check"><input type="checkbox"> القيمة</label>
          <label class="prc-check"><input type="checkbox"> النسبة</label>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">فلتر الحالة</label>
          <select class="form-input"><option>الكل</option><option>نشط</option><option>متأخر</option><option>مكتمل</option></select>
        </div>
        <div class="form-group"><label class="form-label">التصدير</label>
          <select class="form-input"><option>PDF</option><option>Excel</option><option>CSV</option></select>
        </div>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;padding-top:10px;border-top:1px solid var(--divider)">
        <button class="btn btn-secondary" onclick="closeModal()">إلغاء</button>
        <button class="btn btn-primary" onclick="closeModal();showToast('✅ تم إنشاء التقرير بنجاح','success')">📊 إنشاء</button>
      </div>
    </div>
  `;
}

function rptScheduleHTML() {
  return `
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="form-group"><label class="form-label">التقرير</label>
        <select class="form-input"><option>تقرير المشاريع الأسبوعي</option><option>التقرير المالي الشهري</option><option>تقرير المهام المتأخرة</option><option>تقرير الحضور اليومي</option></select>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">التكرار</label>
          <select class="form-input"><option>يومي</option><option>أسبوعي</option><option>شهري</option></select>
        </div>
        <div class="form-group"><label class="form-label">الوقت</label><input class="form-input" type="time" value="08:00"></div>
      </div>
      <div class="form-group"><label class="form-label">إرسال إلى</label>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px">
          <label class="prc-check"><input type="checkbox" checked> المدير العام</label>
          <label class="prc-check"><input type="checkbox"> المدير المالي</label>
          <label class="prc-check"><input type="checkbox"> مدير المشاريع</label>
          <label class="prc-check"><input type="checkbox"> HR</label>
        </div>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;padding-top:10px;border-top:1px solid var(--divider)">
        <button class="btn btn-secondary" onclick="closeModal()">إلغاء</button>
        <button class="btn btn-primary" onclick="closeModal();showToast('✅ تم جدولة التقرير','success')">⏰ جدولة</button>
      </div>
    </div>
  `;
}

// ── Pricing Engines & Quotation Functions ─────────────────────────
function prcServiceFormHTML() {
  return `
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="form-row">
        <div class="form-group"><label class="form-label">اسم الخدمة *</label><input class="form-input" placeholder="مثال: تصميم معماري"></div>
        <div class="form-group"><label class="form-label">التصنيف *</label>
          <select class="form-input"><option>تصميم</option><option>تراخيص</option><option>هندسة</option><option>إشراف</option><option>دراسات</option></select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">الوحدة</label>
          <select class="form-input"><option>م²</option><option>معاملة</option><option>شهر</option><option>تقرير</option><option>قطعة</option><option>ساعة</option></select>
        </div>
        <div class="form-group"><label class="form-label">السعر الأساسي (د.ك) *</label><input class="form-input" type="number" placeholder="0"></div>
      </div>
      <div class="form-group"><label class="form-label">الوصف</label><textarea class="form-input" rows="2" placeholder="وصف الخدمة..."></textarea></div>
      <div style="display:flex;gap:8px;justify-content:flex-end;padding-top:10px;border-top:1px solid var(--divider)">
        <button class="btn btn-secondary" onclick="closeModal()">إلغاء</button>
        <button class="btn btn-primary" onclick="closeModal();showToast('✅ تم إضافة الخدمة بنجاح','success')">➕ إضافة</button>
      </div>
    </div>
  `;
}

function prcQuotationFormHTML() {
  return `
    <div style="display:flex;flex-direction:column;gap:14px;max-height:65vh;overflow-y:auto">
      <div class="form-row">
        <div class="form-group"><label class="form-label">العميل *</label>
          <select class="form-input"><option>أحمد الصباح</option><option>شركة الأفق</option><option>مجموعة الخليج</option><option>عميل جديد</option></select>
        </div>
        <div class="form-group"><label class="form-label">المشروع *</label><input class="form-input" placeholder="اسم المشروع"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">نوع المبنى</label>
          <select class="form-input"><option>فيلا</option><option>عمارة</option><option>تجاري</option><option>إداري</option><option>صناعي</option></select>
        </div>
        <div class="form-group"><label class="form-label">المساحة (م²)</label><input class="form-input" type="number" placeholder="800"></div>
      </div>
      <div class="form-group"><label class="form-label">الخدمات المطلوبة</label>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px">
          <label class="prc-check"><input type="checkbox" checked> تصميم معماري</label>
          <label class="prc-check"><input type="checkbox" checked> تصميم إنشائي</label>
          <label class="prc-check"><input type="checkbox"> MEP</label>
          <label class="prc-check"><input type="checkbox"> تصميم داخلي</label>
          <label class="prc-check"><input type="checkbox" checked> رخصة بناء</label>
          <label class="prc-check"><input type="checkbox"> إشراف</label>
          <label class="prc-check"><input type="checkbox"> فحص تربة</label>
          <label class="prc-check"><input type="checkbox"> واجهات 3D</label>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">شروط الدفع</label>
          <select class="form-input"><option>40/30/20/10</option><option>50/50</option><option>دفعات شهرية</option></select>
        </div>
        <div class="form-group"><label class="form-label">خصم (%)</label><input class="form-input" type="number" placeholder="0" value="0"></div>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;padding-top:10px;border-top:1px solid var(--divider)">
        <button class="btn btn-secondary" onclick="closeModal()">إلغاء</button>
        <button class="btn btn-primary" onclick="closeModal();showToast('✅ تم إنشاء عرض السعر — بانتظار المراجعة','success')">📋 إنشاء عرض</button>
      </div>
    </div>
  `;
}

function prcPackageFormHTML() {
  return `
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="form-group"><label class="form-label">اسم الباقة *</label><input class="form-input" placeholder="مثال: باقة التصميم الشاملة"></div>
      <div class="form-group"><label class="form-label">الخدمات المشمولة</label>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:4px">
          <label class="prc-check"><input type="checkbox" checked> تصميم معماري</label>
          <label class="prc-check"><input type="checkbox" checked> تصميم إنشائي</label>
          <label class="prc-check"><input type="checkbox"> MEP</label>
          <label class="prc-check"><input type="checkbox"> تصميم داخلي</label>
          <label class="prc-check"><input type="checkbox"> رخصة بناء</label>
          <label class="prc-check"><input type="checkbox"> إشراف</label>
          <label class="prc-check"><input type="checkbox"> فحص تربة</label>
          <label class="prc-check"><input type="checkbox"> رفع مساحي</label>
          <label class="prc-check"><input type="checkbox"> واجهات 3D</label>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">سعر الباقة (د.ك) *</label><input class="form-input" type="number" placeholder="0"></div>
        <div class="form-group"><label class="form-label">نسبة الخصم (%)</label><input class="form-input" type="number" placeholder="15"></div>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;padding-top:10px;border-top:1px solid var(--divider)">
        <button class="btn btn-secondary" onclick="closeModal()">إلغاء</button>
        <button class="btn btn-primary" onclick="closeModal();showToast('✅ تم إنشاء الباقة بنجاح','success')">📦 إنشاء باقة</button>
      </div>
    </div>
  `;
}

function calcPricing1() {
  showToast('🧮 تم حساب السعر — 4,950 د.ك', 'success');
}

function filterServices(val) {
  showToast('🔍 تصفية: ' + val, 'info');
}

function sendAIChat() {
  const input = document.getElementById('ai-chat-input');
  const msg = input.value.trim();
  if (!msg) return;
  const container = document.getElementById('ai-chat-messages');
  container.innerHTML += '<div class="ai-msg ai-msg-user"><div class="ai-msg-bubble">' + msg + '</div></div>';
  input.value = '';
  setTimeout(() => {
    container.innerHTML += '<div class="ai-msg ai-msg-bot"><div class="ai-msg-avatar">🤖</div><div class="ai-msg-bubble">شكراً لسؤالك! جاري تحليل الطلب... سأقوم بحساب السعر المناسب بناءً على قاعدة البيانات والمشاريع المشابهة.</div></div>';
    container.scrollTop = container.scrollHeight;
  }, 800);
}

// ── Contracts & Collections Module Functions ──────────────────────
function switchCntTab(tab) {
  document.querySelectorAll('#p-contracts .hr-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('#p-contracts .hr-tab-content').forEach(c => c.classList.remove('active'));
  event.target.classList.add('active');
  const el = document.getElementById('cnt-tab-' + tab);
  if (el) el.classList.add('active');
}

function cntContractFormHTML() {
  return `
    <div style="display:flex;flex-direction:column;gap:14px;max-height:65vh;overflow-y:auto">
      <div class="form-row">
        <div class="form-group"><label class="form-label">العميل *</label>
          <select class="form-input"><option>أحمد الصباح</option><option>شركة الأفق</option><option>مجموعة الخليج</option><option>شركة النخبة</option><option>شركة الصناعات</option></select>
        </div>
        <div class="form-group"><label class="form-label">المشروع *</label>
          <select class="form-input"><option>فيلا الياسمين</option><option>مجمع الأفق</option><option>مبنى إداري</option><option>مستودع صناعي</option><option>فيلا سكنية</option></select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">نوع العقد *</label>
          <select class="form-input"><option>تصميم</option><option>إشراف</option><option>ترخيص</option><option>استشارات</option><option>فحص هندسي</option><option>إدارة مشروع</option><option>تصميم + إشراف</option></select>
        </div>
        <div class="form-group"><label class="form-label">القالب</label>
          <select class="form-input"><option>عقد تصميم معماري</option><option>عقد إشراف هندسي</option><option>عقد استخراج رخصة</option><option>عقد استشارات</option><option>عقد فحص</option><option>مخصص</option></select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">قيمة العقد (د.ك) *</label><input class="form-input" type="number" placeholder="0"></div>
        <div class="form-group"><label class="form-label">مدة العقد (أشهر)</label><input class="form-input" type="number" placeholder="12"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">تاريخ البداية</label><input class="form-input" type="date"></div>
        <div class="form-group"><label class="form-label">تاريخ النهاية</label><input class="form-input" type="date"></div>
      </div>
      <div class="form-group"><label class="form-label">شروط الدفع</label>
        <select class="form-input"><option>40% توقيع / 30% اعتماد / 20% تنفيذ / 10% تسليم</option><option>50% مقدم / 50% تسليم</option><option>دفعات شهرية متساوية</option><option>مخصص</option></select>
      </div>
      <div class="form-group"><label class="form-label">المهندس المسؤول</label>
        <select class="form-input"><option>م. خالد العلي</option><option>م. فاطمة الأحمد</option><option>م. عبدالله السالم</option></select>
      </div>
      <div class="form-group"><label class="form-label">ملاحظات</label><textarea class="form-input" rows="2" placeholder="ملاحظات إضافية..."></textarea></div>
      <div style="display:flex;gap:8px;justify-content:flex-end;padding-top:10px;border-top:1px solid var(--divider)">
        <button class="btn btn-secondary" onclick="closeModal()">إلغاء</button>
        <button class="btn btn-primary" onclick="closeModal();showToast('✅ تم إنشاء مسودة العقد — بانتظار المراجعة','success')">📄 إنشاء مسودة</button>
      </div>
    </div>
  `;
}

function cntCollectionFormHTML() {
  return `
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="form-row">
        <div class="form-group"><label class="form-label">العميل *</label>
          <select class="form-input"><option>شركة الأفق</option><option>أحمد الصباح</option><option>مجموعة الخليج</option><option>شركة الصناعات</option></select>
        </div>
        <div class="form-group"><label class="form-label">العقد</label>
          <select class="form-input"><option>CNT-2024-015 — مجمع الأفق</option><option>CNT-2024-018 — فيلا الياسمين</option><option>CNT-2024-020 — مبنى إداري</option></select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">المبلغ المحصل (د.ك) *</label><input class="form-input" type="number" placeholder="0"></div>
        <div class="form-group"><label class="form-label">طريقة الدفع *</label>
          <select class="form-input"><option>تحويل بنكي</option><option>KNET</option><option>شيك</option><option>نقدي</option></select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">التاريخ</label><input class="form-input" type="date"></div>
        <div class="form-group"><label class="form-label">رقم الإيصال</label><input class="form-input" placeholder="رقم المرجع"></div>
      </div>
      <div class="form-group"><label class="form-label">نوع الإجراء</label>
        <select class="form-input"><option>تحصيل مبلغ</option><option>اتصال متابعة</option><option>رسالة تذكير</option><option>اجتماع</option><option>مطالبة مالية</option></select>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;padding-top:10px;border-top:1px solid var(--divider)">
        <button class="btn btn-secondary" onclick="closeModal()">إلغاء</button>
        <button class="btn btn-primary" onclick="closeModal();showToast('✅ تم تسجيل التحصيل بنجاح','success')">💰 تسجيل</button>
      </div>
    </div>
  `;
}

function cntTemplatesHTML() {
  return `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;max-height:60vh;overflow-y:auto">
      <div class="cnt-template-card" onclick="closeModal();showToast('📄 تم تحميل قالب عقد التصميم','info')">
        <div style="font-size:24px;margin-bottom:6px">🏗️</div>
        <div style="font-size:12px;font-weight:800">عقد تصميم معماري</div>
        <div style="font-size:10px;color:var(--text-3)">تصميم كامل + مخططات + تقارير</div>
      </div>
      <div class="cnt-template-card" onclick="closeModal();showToast('📄 تم تحميل قالب عقد الإشراف','info')">
        <div style="font-size:24px;margin-bottom:6px">👷</div>
        <div style="font-size:12px;font-weight:800">عقد إشراف هندسي</div>
        <div style="font-size:10px;color:var(--text-3)">إشراف ميداني + تقارير دورية</div>
      </div>
      <div class="cnt-template-card" onclick="closeModal();showToast('📄 تم تحميل قالب عقد الترخيص','info')">
        <div style="font-size:24px;margin-bottom:6px">📋</div>
        <div style="font-size:12px;font-weight:800">عقد استخراج رخصة</div>
        <div style="font-size:10px;color:var(--text-3)">تراخيص بلدية + متابعة</div>
      </div>
      <div class="cnt-template-card" onclick="closeModal();showToast('📄 تم تحميل قالب عقد الاستشارات','info')">
        <div style="font-size:24px;margin-bottom:6px">💡</div>
        <div style="font-size:12px;font-weight:800">عقد استشارات</div>
        <div style="font-size:10px;color:var(--text-3)">استشارات فنية + توصيات</div>
      </div>
      <div class="cnt-template-card" onclick="closeModal();showToast('📄 تم تحميل قالب عقد الفحص','info')">
        <div style="font-size:24px;margin-bottom:6px">🔍</div>
        <div style="font-size:12px;font-weight:800">عقد فحص هندسي</div>
        <div style="font-size:10px;color:var(--text-3)">فحص + تقرير اعتماد</div>
      </div>
      <div class="cnt-template-card" onclick="closeModal();showToast('📄 تم تحميل قالب عقد الكميات','info')">
        <div style="font-size:24px;margin-bottom:6px">📊</div>
        <div style="font-size:12px;font-weight:800">عقد خدمات كمية</div>
        <div style="font-size:10px;color:var(--text-3)">حصر كميات + جداول</div>
      </div>
    </div>
  `;
}

function openContractFullDetail(cntId) {
  const contracts = {
    'CNT-2024-020': { client: 'مجموعة الخليج', project: 'مبنى إداري', type: 'تصميم + إشراف', value: '85,000', collected: '34,000', remaining: '51,000', progress: 55, collPct: 40, status: 'نشط', engineer: 'م. خالد العلي', start: '2024/03/01', end: '2025/03/01' },
    'CNT-2024-018': { client: 'أحمد الصباح', project: 'فيلا الياسمين', type: 'تصميم', value: '5,000', collected: '3,500', remaining: '1,500', progress: 85, collPct: 70, status: 'نشط', engineer: 'م. فاطمة الأحمد', start: '2024/06/15', end: '2024/12/15' },
    'CNT-2024-015': { client: 'شركة الأفق', project: 'مجمع الأفق', type: 'تصميم + ترخيص', value: '45,000', collected: '18,000', remaining: '27,000', progress: 60, collPct: 40, status: 'نشط', engineer: 'م. عبدالله السالم', start: '2024/04/01', end: '2025/04/01' },
    'CNT-2024-022': { client: 'شركة النخبة', project: 'فيلا سكنية', type: 'إشراف', value: '8,000', collected: '0', remaining: '8,000', progress: 0, collPct: 0, status: 'بانتظار التوقيع', engineer: 'م. خالد العلي', start: '—', end: '—' },
    'CNT-2024-010': { client: 'شركة المعالي', project: 'مجمع تجاري', type: 'استشارات', value: '12,000', collected: '12,000', remaining: '0', progress: 100, collPct: 100, status: 'مكتمل', engineer: 'م. فاطمة الأحمد', start: '2024/01/01', end: '2024/06/30' }
  };
  const c = contracts[cntId] || contracts['CNT-2024-020'];
  const statusBadge = c.status === 'نشط' ? 'badge-green' : c.status === 'مكتمل' ? 'badge-blue' : 'badge-orange';
  const html = `
    <div style="display:flex;flex-direction:column;gap:14px;max-height:70vh;overflow-y:auto">
      <div style="display:flex;align-items:center;gap:12px;padding-bottom:12px;border-bottom:1px solid var(--divider)">
        <div style="width:44px;height:44px;border-radius:var(--r-sm);background:var(--primary-50);display:flex;align-items:center;justify-content:center;font-size:20px">📄</div>
        <div style="flex:1"><div style="font-size:15px;font-weight:900">${cntId}</div><div style="font-size:12px;color:var(--text-3)">${c.project} — ${c.client}</div></div>
        <span class="badge ${statusBadge}">${c.status}</span>
      </div>
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;background:var(--bg);padding:12px;border-radius:var(--r-sm)">
        <div><div style="font-size:10px;color:var(--text-4)">قيمة العقد</div><div style="font-size:13px;font-weight:900;color:var(--primary)">${c.value} د.ك</div></div>
        <div><div style="font-size:10px;color:var(--text-4)">المحصل</div><div style="font-size:13px;font-weight:900;color:var(--success)">${c.collected} د.ك</div></div>
        <div><div style="font-size:10px;color:var(--text-4)">المتبقي</div><div style="font-size:13px;font-weight:900;color:var(--warning)">${c.remaining} د.ك</div></div>
        <div><div style="font-size:10px;color:var(--text-4)">النوع</div><div style="font-size:13px;font-weight:900;color:var(--text-1)">${c.type}</div></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
        <div>
          <div style="font-size:11px;color:var(--text-4);margin-bottom:4px">نسبة الإنجاز</div>
          <div style="height:8px;background:var(--bg);border-radius:4px;overflow:hidden"><div style="height:100%;width:${c.progress}%;background:var(--primary);border-radius:4px"></div></div>
          <div style="font-size:10px;color:var(--text-3);margin-top:2px">${c.progress}%</div>
        </div>
        <div>
          <div style="font-size:11px;color:var(--text-4);margin-bottom:4px">نسبة التحصيل</div>
          <div style="height:8px;background:var(--bg);border-radius:4px;overflow:hidden"><div style="height:100%;width:${c.collPct}%;background:var(--success);border-radius:4px"></div></div>
          <div style="font-size:10px;color:var(--text-3);margin-top:2px">${c.collPct}%</div>
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;font-size:11px">
        <div><span style="color:var(--text-4)">المهندس:</span> <strong>${c.engineer}</strong></div>
        <div><span style="color:var(--text-4)">البداية:</span> <strong>${c.start}</strong></div>
        <div><span style="color:var(--text-4)">النهاية:</span> <strong>${c.end}</strong></div>
      </div>
      <div>
        <div style="font-size:12px;font-weight:800;margin-bottom:8px">📅 جدول الدفعات</div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <div style="display:flex;align-items:center;gap:10px;padding:8px;background:var(--success-50);border-radius:var(--r-sm)">
            <span style="font-weight:800;color:var(--success);font-size:11px;min-width:35px">40%</span><div style="flex:1;font-size:11px">عند التوقيع</div><span class="badge badge-green" style="font-size:9px">مدفوع</span>
          </div>
          <div style="display:flex;align-items:center;gap:10px;padding:8px;background:${c.collPct >= 70 ? 'var(--success-50)' : 'var(--warning-50)'};border-radius:var(--r-sm)">
            <span style="font-weight:800;color:${c.collPct >= 70 ? 'var(--success)' : 'var(--warning)'};font-size:11px;min-width:35px">30%</span><div style="flex:1;font-size:11px">بعد الاعتماد</div><span class="badge ${c.collPct >= 70 ? 'badge-green' : 'badge-orange'}" style="font-size:9px">${c.collPct >= 70 ? 'مدفوع' : 'مستحق'}</span>
          </div>
          <div style="display:flex;align-items:center;gap:10px;padding:8px;background:var(--bg);border-radius:var(--r-sm);border:1px solid var(--border)">
            <span style="font-weight:800;color:var(--text-4);font-size:11px;min-width:35px">20%</span><div style="flex:1;font-size:11px">أثناء التنفيذ</div><span class="badge badge-blue" style="font-size:9px">قادم</span>
          </div>
          <div style="display:flex;align-items:center;gap:10px;padding:8px;background:var(--bg);border-radius:var(--r-sm);border:1px solid var(--border)">
            <span style="font-weight:800;color:var(--text-4);font-size:11px;min-width:35px">10%</span><div style="flex:1;font-size:11px">التسليم النهائي</div><span class="badge badge-blue" style="font-size:9px">قادم</span>
          </div>
        </div>
      </div>
      <div style="display:flex;gap:8px;padding-top:10px;border-top:1px solid var(--divider);flex-wrap:wrap">
        <button class="btn btn-sm btn-primary" onclick="closeModal();showToast('🧾 إنشاء فاتورة للدفعة المستحقة','info')">🧾 إنشاء فاتورة</button>
        <button class="btn btn-sm btn-outline" onclick="closeModal();showToast('📥 تحميل العقد PDF','info')">📥 PDF</button>
        <button class="btn btn-sm btn-outline" onclick="closeModal();showToast('📎 عرض المرفقات','info')">📎 المرفقات</button>
        <button class="btn btn-sm btn-outline" onclick="closeModal();showToast('📋 سجل التعديلات','info')">📋 السجل</button>
      </div>
    </div>
  `;
  openModal('تفاصيل العقد — ' + cntId, html);
}

// ── Finance Module Functions ──────────────────────────────────────
function switchFinTab(tab) {
  document.querySelectorAll('#p-finance .hr-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('#p-finance .hr-tab-content').forEach(c => c.classList.remove('active'));
  event.target.classList.add('active');
  const el = document.getElementById('fin-tab-' + tab);
  if (el) el.classList.add('active');
}

function finInvoiceFormHTML() {
  return `
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="form-row">
        <div class="form-group"><label class="form-label">العميل *</label>
          <select class="form-input"><option>أحمد الصباح</option><option>شركة الأفق</option><option>شركة الصناعات</option><option>مجموعة الخليج</option></select>
        </div>
        <div class="form-group"><label class="form-label">المشروع *</label>
          <select class="form-input"><option>فيلا الياسمين</option><option>مجمع الأفق</option><option>مستودع صناعي</option><option>مبنى إداري</option></select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">المبلغ (د.ك) *</label><input class="form-input" type="number" placeholder="0"></div>
        <div class="form-group"><label class="form-label">تاريخ الاستحقاق</label><input class="form-input" type="date"></div>
      </div>
      <div class="form-group"><label class="form-label">البنود</label><textarea class="form-input" rows="2" placeholder="وصف البنود..."></textarea></div>
      <div style="display:flex;gap:8px;justify-content:flex-end;padding-top:10px;border-top:1px solid var(--divider)">
        <button class="btn btn-secondary" onclick="closeModal()">إلغاء</button>
        <button class="btn btn-primary" onclick="closeModal();showToast('✅ تم إنشاء الفاتورة بنجاح', 'success')">🧾 إنشاء فاتورة</button>
      </div>
    </div>
  `;
}

function finPaymentFormHTML() {
  return `
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="form-row">
        <div class="form-group"><label class="form-label">العميل *</label>
          <select class="form-input"><option>أحمد الصباح</option><option>شركة الأفق</option><option>شركة الصناعات</option><option>مجموعة الخليج</option></select>
        </div>
        <div class="form-group"><label class="form-label">الفاتورة</label>
          <select class="form-input"><option>INV-2024-089</option><option>INV-2024-087</option><option>INV-2024-086</option><option>بدون فاتورة</option></select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">المبلغ (د.ك) *</label><input class="form-input" type="number" placeholder="0"></div>
        <div class="form-group"><label class="form-label">طريقة الدفع *</label>
          <select class="form-input"><option>تحويل بنكي</option><option>KNET</option><option>نقدي</option><option>شيك</option><option>بطاقة</option></select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">التاريخ</label><input class="form-input" type="date"></div>
        <div class="form-group"><label class="form-label">رقم المرجع</label><input class="form-input" placeholder="رقم التحويل/الشيك"></div>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;padding-top:10px;border-top:1px solid var(--divider)">
        <button class="btn btn-secondary" onclick="closeModal()">إلغاء</button>
        <button class="btn btn-primary" onclick="closeModal();showToast('✅ تم تسجيل الدفعة بنجاح', 'success')">💳 تسجيل</button>
      </div>
    </div>
  `;
}

function finExpenseFormHTML() {
  return `
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="form-row">
        <div class="form-group"><label class="form-label">التصنيف *</label>
          <select class="form-input"><option>رواتب</option><option>إيجار</option><option>برامج</option><option>معدات</option><option>تسويق</option><option>مصروفات مشاريع</option><option>سيارات</option><option>أخرى</option></select>
        </div>
        <div class="form-group"><label class="form-label">المشروع</label>
          <select class="form-input"><option>عام (غير مرتبط)</option><option>فيلا الياسمين</option><option>مجمع الأفق</option><option>مستودع صناعي</option></select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">المبلغ (د.ك) *</label><input class="form-input" type="number" placeholder="0"></div>
        <div class="form-group"><label class="form-label">طريقة الدفع</label>
          <select class="form-input"><option>تحويل بنكي</option><option>KNET</option><option>نقدي</option><option>شيك</option></select>
        </div>
      </div>
      <div class="form-group"><label class="form-label">الوصف</label><input class="form-input" placeholder="وصف المصروف..."></div>
      <div style="display:flex;gap:8px;justify-content:flex-end;padding-top:10px;border-top:1px solid var(--divider)">
        <button class="btn btn-secondary" onclick="closeModal()">إلغاء</button>
        <button class="btn btn-primary" onclick="closeModal();showToast('✅ تم تسجيل المصروف — بانتظار الاعتماد', 'success')">💸 تسجيل</button>
      </div>
    </div>
  `;
}

function openContractDetail(cntId) {
  const html = `
    <div style="display:flex;flex-direction:column;gap:14px;max-height:70vh;overflow-y:auto">
      <div style="display:flex;align-items:center;gap:12px;padding-bottom:12px;border-bottom:1px solid var(--divider)">
        <div style="width:40px;height:40px;border-radius:var(--r-sm);background:var(--primary-50);display:flex;align-items:center;justify-content:center;font-size:18px">📄</div>
        <div style="flex:1"><div style="font-size:15px;font-weight:900">${cntId}</div><div style="font-size:12px;color:var(--text-3)">فيلا الياسمين — أحمد الصباح</div></div>
        <span class="badge badge-green">نشط</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;background:var(--bg);padding:12px;border-radius:var(--r-sm)">
        <div><div style="font-size:10px;color:var(--text-4)">قيمة العقد</div><div style="font-size:13px;font-weight:900;color:var(--primary)">5,000 د.ك</div></div>
        <div><div style="font-size:10px;color:var(--text-4)">المحصل</div><div style="font-size:13px;font-weight:900;color:var(--success)">3,500 د.ك</div></div>
        <div><div style="font-size:10px;color:var(--text-4)">المتبقي</div><div style="font-size:13px;font-weight:900;color:var(--warning)">1,500 د.ك</div></div>
      </div>
      <div>
        <div style="font-size:12px;font-weight:800;margin-bottom:8px">📅 جدول الدفعات</div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <div style="display:flex;align-items:center;gap:10px;padding:8px;background:var(--success-50);border-radius:var(--r-sm)">
            <span style="font-weight:800;color:var(--success);font-size:11px">40%</span><div style="flex:1;font-size:11px">عند التوقيع — 2,000 د.ك</div><span class="badge badge-green" style="font-size:9px">مدفوع</span>
          </div>
          <div style="display:flex;align-items:center;gap:10px;padding:8px;background:var(--success-50);border-radius:var(--r-sm)">
            <span style="font-weight:800;color:var(--success);font-size:11px">30%</span><div style="flex:1;font-size:11px">بعد اعتماد البلدية — 1,500 د.ك</div><span class="badge badge-green" style="font-size:9px">مدفوع</span>
          </div>
          <div style="display:flex;align-items:center;gap:10px;padding:8px;background:var(--warning-50);border-radius:var(--r-sm)">
            <span style="font-weight:800;color:var(--warning);font-size:11px">20%</span><div style="flex:1;font-size:11px">أثناء التنفيذ — 1,000 د.ك</div><span class="badge badge-orange" style="font-size:9px">مستحق</span>
          </div>
          <div style="display:flex;align-items:center;gap:10px;padding:8px;background:var(--bg);border-radius:var(--r-sm);border:1px solid var(--border)">
            <span style="font-weight:800;color:var(--text-4);font-size:11px">10%</span><div style="flex:1;font-size:11px">التسليم النهائي — 500 د.ك</div><span class="badge badge-blue" style="font-size:9px">قادم</span>
          </div>
        </div>
      </div>
      <div style="display:flex;gap:8px;padding-top:10px;border-top:1px solid var(--divider)">
        <button class="btn btn-sm btn-primary" onclick="closeModal();showToast('🧾 إنشاء فاتورة للدفعة المستحقة', 'info')">🧾 إنشاء فاتورة</button>
        <button class="btn btn-sm btn-outline" onclick="closeModal();showToast('📄 تحميل العقد PDF', 'info')">📥 تحميل</button>
      </div>
    </div>
  `;
  openModal('تفاصيل العقد — ' + cntId, html);
}

// ── Employee Portal Functions ─────────────────────────────────────
function switchEmpTab(tab) {
  document.querySelectorAll('#p-emp_portal .hr-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('#p-emp_portal .hr-tab-content').forEach(c => c.classList.remove('active'));
  event.target.classList.add('active');
  const el = document.getElementById('emp-tab-' + tab);
  if (el) el.classList.add('active');
}

function empDailyReportHTML() {
  return `
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="form-row">
        <div class="form-group"><label class="form-label">المشروع *</label>
          <select class="form-input"><option>فيلا الياسمين</option><option>مجمع الأفق</option><option>مستودع صناعي</option><option>مبنى إداري العليا</option></select>
        </div>
        <div class="form-group"><label class="form-label">التاريخ</label><input class="form-input" type="date"></div>
      </div>
      <div class="form-group"><label class="form-label">الأعمال المنفذة *</label><textarea class="form-input" rows="3" placeholder="وصف الأعمال التي تمت اليوم..."></textarea></div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">نسبة الإنجاز</label><input class="form-input" type="number" placeholder="%" min="0" max="100"></div>
        <div class="form-group"><label class="form-label">المشاكل (إن وجدت)</label><input class="form-input" placeholder="أي عوائق..."></div>
      </div>
      <div class="form-group"><label class="form-label">ملاحظات</label><textarea class="form-input" rows="2" placeholder="ملاحظات إضافية..."></textarea></div>
      <div style="display:flex;gap:8px;justify-content:flex-end;padding-top:10px;border-top:1px solid var(--divider)">
        <button class="btn btn-secondary" onclick="closeModal()">إلغاء</button>
        <button class="btn btn-primary" onclick="closeModal();showToast('✅ تم إرسال التقرير اليومي للمراجعة', 'success')">📤 إرسال التقرير</button>
      </div>
    </div>
  `;
}

// ── HR Module Functions ──────────────────────────────────────────
function switchHRTab(tab) {
  document.querySelectorAll('.hr-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.hr-tab-content').forEach(c => c.classList.remove('active'));
  event.target.classList.add('active');
  const el = document.getElementById('hr-tab-' + tab);
  if (el) el.classList.add('active');
}

function hrEmployeeFormHTML() {
  return `
    <div style="display:flex;flex-direction:column;gap:14px;max-height:65vh;overflow-y:auto">
      <div style="font-size:12px;font-weight:800;color:var(--primary);margin-bottom:4px">البيانات الشخصية</div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">الاسم الكامل *</label><input class="form-input" placeholder="الاسم رباعي"></div>
        <div class="form-group"><label class="form-label">الرقم المدني *</label><input class="form-input" placeholder="الرقم المدني"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">الجنسية</label><input class="form-input" placeholder="كويتي"></div>
        <div class="form-group"><label class="form-label">الهاتف</label><input class="form-input" placeholder="+965 xxxxxxxx"></div>
      </div>
      <div style="font-size:12px;font-weight:800;color:var(--primary);margin-bottom:4px;margin-top:8px">البيانات الوظيفية</div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">المسمى الوظيفي *</label><input class="form-input" placeholder="مهندس معماري"></div>
        <div class="form-group"><label class="form-label">القسم *</label>
          <select class="form-input"><option>المعماري</option><option>الإنشائي</option><option>MEP</option><option>الإشراف</option><option>الإدارة</option><option>المالية</option></select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">نوع العقد</label>
          <select class="form-input"><option>دائم</option><option>مؤقت</option><option>تجربة</option><option>استشاري</option></select>
        </div>
        <div class="form-group"><label class="form-label">تاريخ التعيين</label><input class="form-input" type="date"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">الراتب الأساسي (د.ك)</label><input class="form-input" type="number" placeholder="0"></div>
        <div class="form-group"><label class="form-label">المدير المباشر</label>
          <select class="form-input"><option>م. أحمد الشهري</option><option>م. سارة القحطاني</option><option>المدير العام</option></select>
        </div>
      </div>
      <div style="font-size:12px;font-weight:800;color:var(--primary);margin-bottom:4px;margin-top:8px">البيانات الهندسية</div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">التخصص الهندسي</label><input class="form-input" placeholder="معماري، إنشائي..."></div>
        <div class="form-group"><label class="form-label">رقم العضوية المهنية</label><input class="form-input" placeholder="رقم العضوية"></div>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;padding-top:10px;border-top:1px solid var(--divider)">
        <button class="btn btn-secondary" onclick="closeModal()">إلغاء</button>
        <button class="btn btn-primary" onclick="closeModal();showToast('✅ تم إضافة الموظف بنجاح', 'success')">💾 حفظ الموظف</button>
      </div>
    </div>
  `;
}

function hrLeaveFormHTML() {
  return `
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="form-row">
        <div class="form-group"><label class="form-label">الموظف *</label>
          <select class="form-input"><option>م. أحمد الشهري</option><option>م. سارة القحطاني</option><option>م. خالد العتيبي</option><option>م. نورة الدوسري</option></select>
        </div>
        <div class="form-group"><label class="form-label">نوع الإجازة *</label>
          <select class="form-input"><option>سنوية</option><option>مرضية</option><option>طارئة</option><option>بدون راتب</option><option>مهمة رسمية</option></select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">من تاريخ *</label><input class="form-input" type="date"></div>
        <div class="form-group"><label class="form-label">إلى تاريخ *</label><input class="form-input" type="date"></div>
      </div>
      <div class="form-group"><label class="form-label">السبب</label><textarea class="form-input" rows="2" placeholder="سبب الإجازة..."></textarea></div>
      <div style="display:flex;gap:8px;justify-content:flex-end;padding-top:10px;border-top:1px solid var(--divider)">
        <button class="btn btn-secondary" onclick="closeModal()">إلغاء</button>
        <button class="btn btn-primary" onclick="closeModal();showToast('✅ تم تقديم طلب الإجازة', 'success')">📤 تقديم الطلب</button>
      </div>
    </div>
  `;
}

function hrJobFormHTML() {
  return `
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="form-row">
        <div class="form-group"><label class="form-label">المسمى الوظيفي *</label><input class="form-input" placeholder="مهندس معماري أول"></div>
        <div class="form-group"><label class="form-label">القسم *</label>
          <select class="form-input"><option>المعماري</option><option>الإنشائي</option><option>MEP</option><option>الإشراف</option><option>الإدارة</option><option>المالية</option></select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">الخبرة المطلوبة</label><input class="form-input" placeholder="5+ سنوات"></div>
        <div class="form-group"><label class="form-label">المؤهل</label><input class="form-input" placeholder="بكالوريوس هندسة"></div>
      </div>
      <div class="form-group"><label class="form-label">الوصف الوظيفي</label><textarea class="form-input" rows="3" placeholder="المهام والمسؤوليات..."></textarea></div>
      <div style="display:flex;gap:8px;justify-content:flex-end;padding-top:10px;border-top:1px solid var(--divider)">
        <button class="btn btn-secondary" onclick="closeModal()">إلغاء</button>
        <button class="btn btn-primary" onclick="closeModal();showToast('✅ تم نشر الوظيفة', 'success')">📋 نشر الوظيفة</button>
      </div>
    </div>
  `;
}

function openEmployeeDetail(empId) {
  const html = `
    <div style="display:flex;flex-direction:column;gap:14px;max-height:70vh;overflow-y:auto">
      <div style="display:flex;align-items:center;gap:14px;padding-bottom:14px;border-bottom:1px solid var(--divider)">
        <div style="width:50px;height:50px;border-radius:50%;background:var(--primary);color:#fff;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:900">م.أ</div>
        <div style="flex:1">
          <div style="font-size:16px;font-weight:900;color:var(--text)">م. أحمد الشهري</div>
          <div style="font-size:12px;color:var(--text-3)">مدير قسم التصميم • المعماري • ${empId}</div>
        </div>
        <span class="badge badge-green">نشط</span>
      </div>

      <!-- Quick Stats -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
        <div style="padding:10px;background:var(--bg);border-radius:var(--r-sm);border:1px solid var(--border);text-align:center">
          <div style="font-size:16px;font-weight:900;color:var(--primary)">6</div>
          <div style="font-size:9px;color:var(--text-4)">مشاريع نشطة</div>
        </div>
        <div style="padding:10px;background:var(--bg);border-radius:var(--r-sm);border:1px solid var(--border);text-align:center">
          <div style="font-size:16px;font-weight:900;color:var(--success)">92%</div>
          <div style="font-size:9px;color:var(--text-4)">تقييم الأداء</div>
        </div>
        <div style="padding:10px;background:var(--bg);border-radius:var(--r-sm);border:1px solid var(--border);text-align:center">
          <div style="font-size:16px;font-weight:900;color:var(--warning)">5</div>
          <div style="font-size:9px;color:var(--text-4)">سنوات خبرة</div>
        </div>
        <div style="padding:10px;background:var(--bg);border-radius:var(--r-sm);border:1px solid var(--border);text-align:center">
          <div style="font-size:16px;font-weight:900;color:var(--secondary)">14</div>
          <div style="font-size:9px;color:var(--text-4)">إجازة متبقية</div>
        </div>
      </div>

      <!-- Personal Info -->
      <div>
        <div style="font-size:12px;font-weight:800;color:var(--text);margin-bottom:8px">📋 البيانات الشخصية</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;background:var(--bg);padding:12px;border-radius:var(--r-sm)">
          <div><span style="font-size:10px;color:var(--text-4)">الجنسية:</span> <span style="font-size:11px;font-weight:700">كويتي</span></div>
          <div><span style="font-size:10px;color:var(--text-4)">الرقم المدني:</span> <span style="font-size:11px;font-weight:700">284xxxxxxxx</span></div>
          <div><span style="font-size:10px;color:var(--text-4)">الهاتف:</span> <span style="font-size:11px;font-weight:700">+965 9xxx xxxx</span></div>
          <div><span style="font-size:10px;color:var(--text-4)">البريد:</span> <span style="font-size:11px;font-weight:700">ahmed@memar.com</span></div>
        </div>
      </div>

      <!-- Employment Info -->
      <div>
        <div style="font-size:12px;font-weight:800;color:var(--text);margin-bottom:8px">💼 البيانات الوظيفية</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;background:var(--bg);padding:12px;border-radius:var(--r-sm)">
          <div><span style="font-size:10px;color:var(--text-4)">تاريخ التعيين:</span> <span style="font-size:11px;font-weight:700">2019-03-15</span></div>
          <div><span style="font-size:10px;color:var(--text-4)">نوع العقد:</span> <span style="font-size:11px;font-weight:700">دائم</span></div>
          <div><span style="font-size:10px;color:var(--text-4)">المدير المباشر:</span> <span style="font-size:11px;font-weight:700">المدير العام</span></div>
          <div><span style="font-size:10px;color:var(--text-4)">الراتب:</span> <span style="font-size:11px;font-weight:700">2,200 د.ك</span></div>
        </div>
      </div>

      <!-- Engineering Info -->
      <div>
        <div style="font-size:12px;font-weight:800;color:var(--text);margin-bottom:8px">📐 البيانات الهندسية</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;background:var(--bg);padding:12px;border-radius:var(--r-sm)">
          <div><span style="font-size:10px;color:var(--text-4)">التخصص:</span> <span style="font-size:11px;font-weight:700">هندسة معمارية</span></div>
          <div><span style="font-size:10px;color:var(--text-4)">رقم العضوية:</span> <span style="font-size:11px;font-weight:700">KSE-2019-4521</span></div>
          <div><span style="font-size:10px;color:var(--text-4)">جهة الاعتماد:</span> <span style="font-size:11px;font-weight:700">جمعية المهندسين</span></div>
          <div><span style="font-size:10px;color:var(--text-4)">انتهاء الاعتماد:</span> <span style="font-size:11px;font-weight:700">2025-06-30</span></div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div>
        <div style="font-size:12px;font-weight:800;color:var(--text);margin-bottom:8px">🕐 آخر النشاطات</div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <div style="display:flex;align-items:center;gap:8px;font-size:11px;padding:6px 8px;background:var(--bg);border-radius:var(--r-sm)">
            <span>✅</span><span style="flex:1">اعتمد مخطط الدور الثاني — فيلا الياسمين</span><span style="color:var(--text-4)">اليوم</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px;font-size:11px;padding:6px 8px;background:var(--bg);border-radius:var(--r-sm)">
            <span>📤</span><span style="flex:1">رفع تقرير زيارة ميدانية #12</span><span style="color:var(--text-4)">أمس</span>
          </div>
          <div style="display:flex;align-items:center;gap:8px;font-size:11px;padding:6px 8px;background:var(--bg);border-radius:var(--r-sm)">
            <span>🎯</span><span style="flex:1">أكمل مهمة: مراجعة BOQ مستودع صناعي</span><span style="color:var(--text-4)">قبل يومين</span>
          </div>
        </div>
      </div>

      <div style="display:flex;gap:8px;flex-wrap:wrap;padding-top:10px;border-top:1px solid var(--divider)">
        <button class="btn btn-sm btn-primary" onclick="closeModal();showToast('📋 فتح ملف الموظف الكامل', 'info')">📋 الملف الكامل</button>
        <button class="btn btn-sm btn-outline" onclick="closeModal();showToast('📊 عرض تقرير الأداء', 'info')">📊 تقرير الأداء</button>
        <button class="btn btn-sm btn-outline" onclick="closeModal();showToast('📄 عرض المستندات', 'info')">📄 المستندات</button>
      </div>
    </div>
  `;
  openModal('ملف الموظف — ' + empId, html);
}

// ── Document Management Functions ──────────────────────────────
function dmsUploadFormHTML() {
  return `
    <div style="display:flex;flex-direction:column;gap:14px">
      <div style="padding:30px;border:2px dashed var(--primary-100);border-radius:var(--r);text-align:center;background:var(--primary-50);cursor:pointer" onclick="showToast('📤 اختر ملفات للرفع...', 'info')">
        <div style="font-size:32px;margin-bottom:8px">📤</div>
        <div style="font-size:13px;font-weight:700;color:var(--primary)">اسحب الملفات هنا أو انقر للاختيار</div>
        <div style="font-size:11px;color:var(--text-4);margin-top:4px">PDF, DWG, DOCX, XLSX, صور، فيديو — حتى 100MB</div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">المشروع *</label>
          <select class="form-input"><option>فيلا الياسمين</option><option>مجمع الأفق</option><option>مستودع صناعي</option><option>مبنى إداري العليا</option></select>
        </div>
        <div class="form-group"><label class="form-label">التصنيف *</label>
          <select class="form-input"><option>عقود</option><option>معماري</option><option>إنشائي</option><option>كهرباء</option><option>ميكانيكا</option><option>حريق</option><option>بلدية</option><option>تقارير</option><option>صور</option></select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">مستوى السرية</label>
          <select class="form-input"><option>عام</option><option>داخلي</option><option>سري</option><option>سري للغاية</option></select>
        </div>
        <div class="form-group"><label class="form-label">الكلمات المفتاحية</label><input class="form-input" placeholder="مفصولة بفاصلة..."></div>
      </div>
      <div class="form-group"><label class="form-label">ملاحظات</label><textarea class="form-input" rows="2" placeholder="وصف المستند..."></textarea></div>
      <div style="display:flex;gap:8px;justify-content:flex-end;padding-top:10px;border-top:1px solid var(--divider)">
        <button class="btn btn-secondary" onclick="closeModal()">إلغاء</button>
        <button class="btn btn-primary" onclick="closeModal();showToast('✅ تم رفع المستند بنجاح وبدء الفهرسة', 'success')">📤 رفع وحفظ</button>
      </div>
    </div>
  `;
}

function dmsCreateFormHTML() {
  return `
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="form-row">
        <div class="form-group"><label class="form-label">نوع المستند *</label>
          <select class="form-input"><option>كتاب رسمي</option><option>مذكرة داخلية</option><option>تقرير</option><option>محضر اجتماع</option><option>أمر موقع</option><option>أمر تغيير</option><option>خطاب عميل</option></select>
        </div>
        <div class="form-group"><label class="form-label">القالب</label>
          <select class="form-input"><option>قالب كتاب بلدية</option><option>قالب كتاب إطفاء</option><option>قالب تقرير زيارة</option><option>قالب محضر اجتماع</option><option>بدون قالب</option></select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">المشروع</label>
          <select class="form-input"><option>فيلا الياسمين</option><option>مجمع الأفق</option><option>مستودع صناعي</option></select>
        </div>
        <div class="form-group"><label class="form-label">الجهة المرسل إليها</label><input class="form-input" placeholder="مثال: بلدية الكويت"></div>
      </div>
      <div class="form-group"><label class="form-label">الموضوع</label><input class="form-input" placeholder="موضوع المستند..."></div>
      <div style="display:flex;gap:8px;justify-content:flex-end;padding-top:10px;border-top:1px solid var(--divider)">
        <button class="btn btn-secondary" onclick="closeModal()">إلغاء</button>
        <button class="btn btn-primary" onclick="closeModal();showToast('📝 تم إنشاء المستند — فتح المحرر...', 'success')">📝 إنشاء وتحرير</button>
      </div>
    </div>
  `;
}

function openDocDetail(docId) {
  const html = `
    <div style="display:flex;flex-direction:column;gap:14px;max-height:70vh;overflow-y:auto">
      <div style="display:flex;align-items:center;gap:12px;padding-bottom:12px;border-bottom:1px solid var(--divider)">
        <div style="width:44px;height:44px;border-radius:var(--r-sm);background:#FEE2E2;display:flex;align-items:center;justify-content:center;font-size:16px;font-weight:900;color:#DC2626">PDF</div>
        <div style="flex:1">
          <div style="font-size:15px;font-weight:900;color:var(--text)">${docId}</div>
          <div style="font-size:12px;color:var(--text-3)">تقرير الزيارة الميدانية #12 • فيلا الياسمين</div>
        </div>
        <span class="badge badge-green">معتمد</span>
      </div>

      <!-- Doc Info -->
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;background:var(--bg);padding:12px;border-radius:var(--r-sm)">
        <div><div style="font-size:10px;color:var(--text-4)">المشروع</div><div style="font-size:12px;font-weight:700">فيلا الياسمين</div></div>
        <div><div style="font-size:10px;color:var(--text-4)">القسم</div><div style="font-size:12px;font-weight:700">إشراف ميداني</div></div>
        <div><div style="font-size:10px;color:var(--text-4)">الإصدار</div><div style="font-size:12px;font-weight:700;color:var(--primary)">V2.0</div></div>
        <div><div style="font-size:10px;color:var(--text-4)">الرافع</div><div style="font-size:12px;font-weight:700">م. خالد العتيبي</div></div>
        <div><div style="font-size:10px;color:var(--text-4)">المعتمد</div><div style="font-size:12px;font-weight:700">م. أحمد الشهري</div></div>
        <div><div style="font-size:10px;color:var(--text-4)">الحجم</div><div style="font-size:12px;font-weight:700">2.4 MB</div></div>
      </div>

      <!-- Version History -->
      <div>
        <div style="font-size:12px;font-weight:800;color:var(--text);margin-bottom:8px">📝 سجل الإصدارات (Version Control)</div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <div style="display:flex;align-items:center;gap:10px;padding:8px;background:var(--success-50);border-radius:var(--r-sm);border:1px solid var(--success-100)">
            <span style="font-weight:900;color:var(--success);font-size:12px">V2.0</span>
            <div style="flex:1"><div style="font-size:11px;font-weight:700">النسخة الحالية — معتمد</div><div style="font-size:10px;color:var(--text-4)">اليوم • م. خالد • إضافة صور الموقع</div></div>
            <span style="font-size:9px;color:var(--success);font-weight:700">✓ موقع رقمياً</span>
          </div>
          <div style="display:flex;align-items:center;gap:10px;padding:8px;background:var(--bg);border-radius:var(--r-sm);border:1px solid var(--border)">
            <span style="font-weight:900;color:var(--text-3);font-size:12px">V1.1</span>
            <div style="flex:1"><div style="font-size:11px;font-weight:700">تعديل الملاحظات</div><div style="font-size:10px;color:var(--text-4)">أمس • م. خالد • تصحيح بند 3</div></div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;padding:8px;background:var(--bg);border-radius:var(--r-sm);border:1px solid var(--border)">
            <span style="font-weight:900;color:var(--text-4);font-size:12px">V1.0</span>
            <div style="flex:1"><div style="font-size:11px;font-weight:700">الإصدار الأول</div><div style="font-size:10px;color:var(--text-4)">قبل 3 أيام • م. خالد • إنشاء التقرير</div></div>
          </div>
        </div>
      </div>

      <!-- Approval Workflow -->
      <div>
        <div style="font-size:12px;font-weight:800;color:var(--text);margin-bottom:8px">🔄 دورة الاعتماد</div>
        <div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap">
          <span style="padding:5px 8px;background:var(--success-50);color:var(--success);border-radius:10px;font-size:9px;font-weight:700">مسودة ✓</span>
          <span style="color:var(--text-4);font-size:10px">→</span>
          <span style="padding:5px 8px;background:var(--success-50);color:var(--success);border-radius:10px;font-size:9px;font-weight:700">مراجعة داخلية ✓</span>
          <span style="color:var(--text-4);font-size:10px">→</span>
          <span style="padding:5px 8px;background:var(--success-50);color:var(--success);border-radius:10px;font-size:9px;font-weight:700">QA/QC ✓</span>
          <span style="color:var(--text-4);font-size:10px">→</span>
          <span style="padding:5px 8px;background:var(--success-50);color:var(--success);border-radius:10px;font-size:9px;font-weight:700">معتمد ✓</span>
          <span style="color:var(--text-4);font-size:10px">→</span>
          <span style="padding:5px 8px;background:var(--success-50);color:var(--success);border-radius:10px;font-size:9px;font-weight:700">منشور ✓</span>
        </div>
      </div>

      <!-- Actions -->
      <div style="display:flex;gap:8px;flex-wrap:wrap;padding-top:10px;border-top:1px solid var(--divider)">
        <button class="btn btn-sm btn-primary" onclick="closeModal();showToast('📥 جاري التحميل...', 'info')">📥 تحميل</button>
        <button class="btn btn-sm btn-accent" onclick="closeModal();showToast('👁️ فتح المعاينة...', 'info')">👁️ معاينة</button>
        <button class="btn btn-sm btn-outline" onclick="closeModal();showToast('🔄 إنشاء نسخة جديدة...', 'info')">🔄 نسخة جديدة</button>
        <button class="btn btn-sm btn-outline" onclick="closeModal();showToast('🔗 مشاركة الرابط...', 'success')">🔗 مشاركة</button>
        <button class="btn btn-sm btn-outline" onclick="closeModal();showToast('📋 نسخ إلى مشروع آخر...', 'info')">📋 ربط</button>
      </div>
    </div>
  `;
  openModal('تفاصيل المستند — ' + docId, html);
}

// ── Government Approvals Functions ──────────────────────────────
function govPermitFormHTML() {
  return `
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="form-row">
        <div class="form-group"><label class="form-label">الجهة الحكومية *</label>
          <select class="form-input"><option>بلدية الكويت</option><option>وزارة الكهرباء والماء</option><option>وزارة الأشغال</option><option>قوة الإطفاء العام</option><option>الهيئة العامة للطرق</option><option>أخرى</option></select>
        </div>
        <div class="form-group"><label class="form-label">نوع المعاملة *</label>
          <select class="form-input"><option>رخصة بناء</option><option>اعتماد مخططات</option><option>اعتماد أحمال</option><option>صرف صحي</option><option>Fire Fighting</option><option>Fire Alarm</option><option>مداخل ومخارج</option><option>شهادة إتمام</option><option>أخرى</option></select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">المشروع *</label>
          <select class="form-input"><option>فيلا الياسمين</option><option>مجمع الأفق</option><option>مستودع صناعي</option><option>مبنى إداري العليا</option><option>فيلا النرجس</option></select>
        </div>
        <div class="form-group"><label class="form-label">المهندس المسؤول</label>
          <select class="form-input"><option>م. خالد العتيبي</option><option>م. سارة الحربي</option><option>م. أحمد الشهري</option><option>م. نورة المالكي</option><option>م. فهد</option></select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">تاريخ التقديم</label><input class="form-input" type="date"></div>
        <div class="form-group"><label class="form-label">الأولوية</label>
          <select class="form-input"><option>عاجل</option><option>عالي</option><option>متوسط</option><option>منخفض</option></select>
        </div>
      </div>
      <div class="form-group"><label class="form-label">ملاحظات</label><textarea class="form-input" rows="2" placeholder="تفاصيل إضافية عن المعاملة..."></textarea></div>
      <div style="display:flex;gap:8px;justify-content:flex-end;padding-top:10px;border-top:1px solid var(--divider)">
        <button class="btn btn-secondary" onclick="closeModal()">إلغاء</button>
        <button class="btn btn-primary" onclick="closeModal();showToast('✅ تم إنشاء المعاملة وبدء التجهيز', 'success')">📋 إنشاء المعاملة</button>
      </div>
    </div>
  `;
}

function openPermitDetail(permitId) {
  const html = `
    <div style="display:flex;flex-direction:column;gap:16px;max-height:70vh;overflow-y:auto">
      <!-- Permit Header -->
      <div style="display:flex;align-items:center;gap:14px;padding-bottom:14px;border-bottom:1px solid var(--divider)">
        <div style="width:50px;height:50px;border-radius:var(--r-sm);background:linear-gradient(135deg,#1D4ED8,#3B82F6);display:flex;align-items:center;justify-content:center;font-size:20px">🏛️</div>
        <div style="flex:1">
          <div style="font-size:16px;font-weight:900;color:var(--text)">${permitId}</div>
          <div style="font-size:12px;color:var(--text-3)">رخصة بناء • فيلا الياسمين • البلدية</div>
        </div>
        <span class="badge badge-orange">ملاحظات واردة</span>
      </div>

      <!-- Permit Info -->
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;background:var(--bg);padding:12px;border-radius:var(--r-sm)">
        <div><div style="font-size:10px;color:var(--text-4)">الجهة</div><div style="font-size:12px;font-weight:700">بلدية الكويت</div></div>
        <div><div style="font-size:10px;color:var(--text-4)">النوع</div><div style="font-size:12px;font-weight:700">رخصة بناء</div></div>
        <div><div style="font-size:10px;color:var(--text-4)">المهندس</div><div style="font-size:12px;font-weight:700">م. خالد العتيبي</div></div>
        <div><div style="font-size:10px;color:var(--text-4)">تاريخ التقديم</div><div style="font-size:12px;font-weight:700">2024/01/15</div></div>
        <div><div style="font-size:10px;color:var(--text-4)">آخر تحديث</div><div style="font-size:12px;font-weight:700">2024/02/05</div></div>
        <div><div style="font-size:10px;color:var(--text-4)">عدد التقديمات</div><div style="font-size:12px;font-weight:700;color:var(--warning)">2</div></div>
      </div>

      <!-- Workflow Status -->
      <div>
        <div style="font-size:13px;font-weight:800;color:var(--text);margin-bottom:10px">🔄 حالة سير المعاملة</div>
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          <span style="padding:6px 10px;background:var(--success-50);color:var(--success);border-radius:12px;font-size:10px;font-weight:700">تجهيز ✓</span>
          <span style="color:var(--text-4)">→</span>
          <span style="padding:6px 10px;background:var(--success-50);color:var(--success);border-radius:12px;font-size:10px;font-weight:700">تقديم ✓</span>
          <span style="color:var(--text-4)">→</span>
          <span style="padding:6px 10px;background:var(--success-50);color:var(--success);border-radius:12px;font-size:10px;font-weight:700">مراجعة ✓</span>
          <span style="color:var(--text-4)">→</span>
          <span style="padding:6px 10px;background:var(--warning-50);color:var(--warning);border-radius:12px;font-size:10px;font-weight:700;border:1.5px solid var(--warning)">ملاحظات ⏳</span>
          <span style="color:var(--text-4)">→</span>
          <span style="padding:6px 10px;background:var(--divider);color:var(--text-4);border-radius:12px;font-size:10px;font-weight:700">إعادة تقديم</span>
          <span style="color:var(--text-4)">→</span>
          <span style="padding:6px 10px;background:var(--divider);color:var(--text-4);border-radius:12px;font-size:10px;font-weight:700">اعتماد</span>
          <span style="color:var(--text-4)">→</span>
          <span style="padding:6px 10px;background:var(--divider);color:var(--text-4);border-radius:12px;font-size:10px;font-weight:700">إصدار</span>
        </div>
      </div>

      <!-- Government Comments -->
      <div>
        <div style="font-size:13px;font-weight:800;color:var(--text);margin-bottom:10px">📝 ملاحظات الجهة (3 ملاحظات)</div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <div style="padding:10px;background:#FEF2F2;border-radius:var(--r-sm);border:1px solid #FECACA;border-right:3px solid var(--danger)">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
              <span style="font-size:11px;font-weight:800;color:var(--danger)">ملاحظة #1 — عاجل</span>
              <span class="badge badge-red" style="font-size:9px">مفتوح</span>
            </div>
            <div style="font-size:11.5px;color:var(--text)">تعديل الارتدادات الجانبية لتتوافق مع اشتراطات المنطقة السكنية</div>
            <div style="font-size:10px;color:var(--text-4);margin-top:4px">القسم المعماري • DWG-A-001 • م. خالد</div>
          </div>
          <div style="padding:10px;background:#FFFBEB;border-radius:var(--r-sm);border:1px solid #FDE68A;border-right:3px solid var(--warning)">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
              <span style="font-size:11px;font-weight:800;color:var(--warning)">ملاحظة #2 — متوسط</span>
              <span class="badge badge-orange" style="font-size:9px">قيد المعالجة</span>
            </div>
            <div style="font-size:11.5px;color:var(--text)">إضافة تفاصيل السور الخارجي وبوابة الدخول</div>
            <div style="font-size:10px;color:var(--text-4);margin-top:4px">القسم المعماري • DWG-A-003 • م. سارة</div>
          </div>
          <div style="padding:10px;background:var(--success-50);border-radius:var(--r-sm);border:1px solid var(--success-100);border-right:3px solid var(--success)">
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
              <span style="font-size:11px;font-weight:800;color:var(--success)">ملاحظة #3</span>
              <span class="badge badge-green" style="font-size:9px">تم الحل</span>
            </div>
            <div style="font-size:11.5px;color:var(--text)">تحديث جدول المساحات وفق النموذج المعتمد</div>
            <div style="font-size:10px;color:var(--text-4);margin-top:4px">القسم المعماري • تم الحل 2024/02/01</div>
          </div>
        </div>
      </div>

      <!-- Submission History -->
      <div>
        <div style="font-size:13px;font-weight:800;color:var(--text);margin-bottom:10px">📋 سجل التقديمات</div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <div style="display:flex;align-items:center;gap:10px;padding:8px;background:var(--bg);border-radius:var(--r-sm);border:1px solid var(--border)">
            <span style="font-weight:900;color:var(--warning);font-size:13px">02</span>
            <div style="flex:1"><div style="font-size:11px;font-weight:700">التقديم الثاني — بعد معالجة ملاحظة #3</div><div style="font-size:10px;color:var(--text-4)">2024/02/05 • 📎 8 ملفات</div></div>
            <span class="badge badge-orange" style="font-size:9px">ملاحظات جديدة</span>
          </div>
          <div style="display:flex;align-items:center;gap:10px;padding:8px;background:var(--bg);border-radius:var(--r-sm);border:1px solid var(--border)">
            <span style="font-weight:900;color:var(--text-4);font-size:13px">01</span>
            <div style="flex:1"><div style="font-size:11px;font-weight:700">التقديم الأول</div><div style="font-size:10px;color:var(--text-4)">2024/01/15 • 📎 12 ملف</div></div>
            <span class="badge badge-red" style="font-size:9px">ملاحظات</span>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div style="display:flex;gap:8px;flex-wrap:wrap;padding-top:12px;border-top:1px solid var(--divider)">
        <button class="btn btn-sm btn-primary" onclick="closeModal();showToast('📋 جاري تجهيز إعادة التقديم...', 'info')">🔄 إعادة تقديم</button>
        <button class="btn btn-sm btn-accent" onclick="closeModal();showToast('📄 جاري إنشاء كتاب رسمي...', 'info')">📄 كتاب رسمي</button>
        <button class="btn btn-sm btn-outline" onclick="closeModal();showToast('📎 فتح المرفقات...', 'info')">📎 المرفقات</button>
        <button class="btn btn-sm btn-outline" onclick="closeModal();showToast('✅ فحص الاكتمال...', 'info')">✅ فحص Checklist</button>
      </div>
    </div>
  `;
  openModal('تفاصيل المعاملة — ' + permitId, html);
}

// ── Engineering Department Functions ──────────────────────────────
function switchEngDept(btn, dept) {
  document.querySelectorAll('.eng-dept-tab').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  showToast('📐 عرض قسم: ' + (dept === 'all' ? 'جميع الأقسام' : dept), 'info');
}

function drawingFormHTML() {
  return `
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="form-row">
        <div class="form-group"><label class="form-label">اسم الرسم *</label><input class="form-input" placeholder="مثال: مخطط الدور الأرضي"></div>
        <div class="form-group"><label class="form-label">رقم الرسم</label><input class="form-input" placeholder="DWG-A-XXX" dir="ltr"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">المشروع *</label>
          <select class="form-input"><option>فيلا الياسمين</option><option>مجمع الأفق</option><option>مستودع صناعي</option><option>مبنى إداري العليا</option></select>
        </div>
        <div class="form-group"><label class="form-label">القسم *</label>
          <select class="form-input"><option>معماري</option><option>إنشائي</option><option>كهرباء</option><option>ميكانيكا</option><option>حريق</option><option>كميات</option><option>داخلي</option><option>تنسيق حدائق</option></select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">المقياس</label>
          <select class="form-input"><option>1:100</option><option>1:50</option><option>1:200</option><option>1:500</option><option>1:20</option></select>
        </div>
        <div class="form-group"><label class="form-label">حجم الورقة</label>
          <select class="form-input"><option>A1</option><option>A0</option><option>A2</option><option>A3</option></select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">المصمم</label>
          <select class="form-input"><option>م. خالد العتيبي</option><option>م. سارة الحربي</option><option>م. أحمد الشهري</option><option>م. نورة المالكي</option></select>
        </div>
        <div class="form-group"><label class="form-label">المراجع</label>
          <select class="form-input"><option>م. خالد العتيبي</option><option>م. سارة الحربي</option><option>م. أحمد الشهري</option></select>
        </div>
      </div>
      <div class="form-group"><label class="form-label">ملاحظات</label><textarea class="form-input" rows="2" placeholder="وصف الرسم أو ملاحظات خاصة..."></textarea></div>
      <div style="display:flex;gap:8px;justify-content:flex-end;padding-top:10px;border-top:1px solid var(--divider)">
        <button class="btn btn-secondary" onclick="closeModal()">إلغاء</button>
        <button class="btn btn-primary" onclick="closeModal();showToast('✅ تم إنشاء الرسم وتعيينه للمصمم', 'success')">📐 إنشاء الرسم</button>
      </div>
    </div>
  `;
}

function engTaskFormHTML() {
  return `
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="form-row">
        <div class="form-group"><label class="form-label">عنوان المهمة *</label><input class="form-input" placeholder="مثال: تعديل الواجهة الشمالية"></div>
        <div class="form-group"><label class="form-label">المشروع *</label>
          <select class="form-input"><option>فيلا الياسمين</option><option>مجمع الأفق</option><option>مستودع صناعي</option></select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">القسم</label>
          <select class="form-input"><option>معماري</option><option>إنشائي</option><option>كهرباء</option><option>ميكانيكا</option><option>حريق</option><option>كميات</option></select>
        </div>
        <div class="form-group"><label class="form-label">الأولوية</label>
          <select class="form-input"><option>عاجل</option><option>عالي</option><option>متوسط</option><option>منخفض</option></select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">المكلف</label>
          <select class="form-input"><option>م. خالد</option><option>م. سارة</option><option>م. أحمد</option><option>م. نورة</option></select>
        </div>
        <div class="form-group"><label class="form-label">تاريخ التسليم</label><input class="form-input" type="date"></div>
      </div>
      <div class="form-group"><label class="form-label">الوصف</label><textarea class="form-input" rows="2" placeholder="تفاصيل المهمة..."></textarea></div>
      <div style="display:flex;gap:8px;justify-content:flex-end;padding-top:10px;border-top:1px solid var(--divider)">
        <button class="btn btn-secondary" onclick="closeModal()">إلغاء</button>
        <button class="btn btn-primary" onclick="closeModal();showToast('✅ تم إنشاء المهمة الهندسية', 'success')">📋 إنشاء المهمة</button>
      </div>
    </div>
  `;
}

function openDeptDetail(deptName) {
  const html = `
    <div style="display:flex;flex-direction:column;gap:16px;max-height:70vh;overflow-y:auto">
      <div style="display:flex;align-items:center;gap:14px;padding-bottom:14px;border-bottom:1px solid var(--divider)">
        <div style="width:50px;height:50px;border-radius:var(--r-sm);background:linear-gradient(135deg,var(--primary),var(--secondary));display:flex;align-items:center;justify-content:center;font-size:22px">📐</div>
        <div style="flex:1">
          <div style="font-size:16px;font-weight:900;color:var(--text)">القسم ${deptName}</div>
          <div style="font-size:12px;color:var(--text-3)">لوحة تحكم القسم • الأداء والإنتاجية</div>
        </div>
      </div>

      <!-- Department KPIs -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
        <div style="text-align:center;padding:12px;background:var(--bg);border-radius:var(--r-sm);border:1px solid var(--border)">
          <div style="font-size:20px;font-weight:900;color:var(--primary)">86</div>
          <div style="font-size:10px;color:var(--text-4)">رسم</div>
        </div>
        <div style="text-align:center;padding:12px;background:var(--bg);border-radius:var(--r-sm);border:1px solid var(--border)">
          <div style="font-size:20px;font-weight:900;color:var(--success)">92%</div>
          <div style="font-size:10px;color:var(--text-4)">نسبة الاعتماد</div>
        </div>
        <div style="text-align:center;padding:12px;background:var(--bg);border-radius:var(--r-sm);border:1px solid var(--border)">
          <div style="font-size:20px;font-weight:900;color:var(--warning)">3.8</div>
          <div style="font-size:10px;color:var(--text-4)">يوم/رسم</div>
        </div>
      </div>

      <!-- Engineers -->
      <div>
        <div style="font-size:13px;font-weight:800;color:var(--text);margin-bottom:10px">👥 فريق القسم</div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:var(--bg);border-radius:var(--r-sm);border:1px solid var(--border)">
            <div style="width:28px;height:28px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:800">خ</div>
            <div style="flex:1"><div style="font-size:12px;font-weight:700">م. خالد العتيبي</div><div style="font-size:10px;color:var(--text-4)">رئيس القسم • 8 مشاريع</div></div>
            <div style="font-size:11px;font-weight:800;color:var(--danger)">حمل: 90%</div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:var(--bg);border-radius:var(--r-sm);border:1px solid var(--border)">
            <div style="width:28px;height:28px;border-radius:50%;background:var(--secondary);display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:800">س</div>
            <div style="flex:1"><div style="font-size:12px;font-weight:700">م. سارة الحربي</div><div style="font-size:10px;color:var(--text-4)">مهندسة أولى • 6 مشاريع</div></div>
            <div style="font-size:11px;font-weight:800;color:var(--warning)">حمل: 75%</div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;padding:8px 10px;background:var(--bg);border-radius:var(--r-sm);border:1px solid var(--border)">
            <div style="width:28px;height:28px;border-radius:50%;background:var(--success);display:flex;align-items:center;justify-content:center;color:#fff;font-size:10px;font-weight:800">أ</div>
            <div style="flex:1"><div style="font-size:12px;font-weight:700">م. أحمد الشهري</div><div style="font-size:10px;color:var(--text-4)">مهندس • 4 مشاريع</div></div>
            <div style="font-size:11px;font-weight:800;color:var(--success)">حمل: 55%</div>
          </div>
        </div>
      </div>

      <!-- Review Workflow -->
      <div>
        <div style="font-size:13px;font-weight:800;color:var(--text);margin-bottom:10px">🔄 سير المراجعة (Review Workflow)</div>
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
          <span style="padding:6px 10px;background:var(--success-50);color:var(--success);border-radius:12px;font-size:10px;font-weight:700">المصمم ✓</span>
          <span style="color:var(--text-4)">→</span>
          <span style="padding:6px 10px;background:var(--success-50);color:var(--success);border-radius:12px;font-size:10px;font-weight:700">المهندس الأول ✓</span>
          <span style="color:var(--text-4)">→</span>
          <span style="padding:6px 10px;background:var(--primary-50);color:var(--primary);border-radius:12px;font-size:10px;font-weight:700;border:1.5px solid var(--primary)">مدير القسم ⏳</span>
          <span style="color:var(--text-4)">→</span>
          <span style="padding:6px 10px;background:var(--divider);color:var(--text-4);border-radius:12px;font-size:10px;font-weight:700">QA/QC</span>
          <span style="color:var(--text-4)">→</span>
          <span style="padding:6px 10px;background:var(--divider);color:var(--text-4);border-radius:12px;font-size:10px;font-weight:700">المدير العام</span>
          <span style="color:var(--text-4)">→</span>
          <span style="padding:6px 10px;background:var(--divider);color:var(--text-4);border-radius:12px;font-size:10px;font-weight:700">إصدار</span>
        </div>
      </div>

      <!-- Actions -->
      <div style="display:flex;gap:8px;flex-wrap:wrap;padding-top:12px;border-top:1px solid var(--divider)">
        <button class="btn btn-sm btn-primary" onclick="closeModal();showToast('📐 فتح مركز الرسومات...', 'info')">📐 الرسومات</button>
        <button class="btn btn-sm btn-accent" onclick="closeModal();showToast('📋 فتح المهام...', 'info')">📋 المهام</button>
        <button class="btn btn-sm btn-outline" onclick="closeModal();showToast('📊 فتح تقارير الأداء...', 'info')">📊 التقارير</button>
        <button class="btn btn-sm btn-outline" onclick="closeModal();showToast('📚 فتح مكتبة المواد...', 'info')">📚 المواد</button>
      </div>
    </div>
  `;
  openModal('القسم ' + deptName + ' — لوحة التحكم', html);
}

function openDrawingDetail(dwgId) {
  const html = `
    <div style="display:flex;flex-direction:column;gap:14px">
      <div style="display:flex;align-items:center;gap:12px;padding-bottom:12px;border-bottom:1px solid var(--divider)">
        <div style="width:44px;height:44px;border-radius:var(--r-sm);background:var(--primary-50);display:flex;align-items:center;justify-content:center;font-size:18px">📐</div>
        <div style="flex:1">
          <div style="font-size:15px;font-weight:900;color:var(--text)">${dwgId}</div>
          <div style="font-size:12px;color:var(--text-3)">مخطط الدور الأرضي • فيلا الياسمين</div>
        </div>
        <span class="badge badge-green">معتمد</span>
      </div>

      <!-- Drawing Info -->
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;background:var(--bg);padding:12px;border-radius:var(--r-sm)">
        <div><div style="font-size:10px;color:var(--text-4)">القسم</div><div style="font-size:12px;font-weight:700">معماري</div></div>
        <div><div style="font-size:10px;color:var(--text-4)">المقياس</div><div style="font-size:12px;font-weight:700">1:100</div></div>
        <div><div style="font-size:10px;color:var(--text-4)">الورقة</div><div style="font-size:12px;font-weight:700">A1</div></div>
        <div><div style="font-size:10px;color:var(--text-4)">المصمم</div><div style="font-size:12px;font-weight:700">م. خالد</div></div>
        <div><div style="font-size:10px;color:var(--text-4)">المراجع</div><div style="font-size:12px;font-weight:700">م. سارة</div></div>
        <div><div style="font-size:10px;color:var(--text-4)">المعتمد</div><div style="font-size:12px;font-weight:700">م. أحمد</div></div>
      </div>

      <!-- Revision History -->
      <div>
        <div style="font-size:12px;font-weight:800;color:var(--text);margin-bottom:8px">📝 سجل المراجعات (Revision History)</div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <div style="display:flex;align-items:center;gap:10px;padding:8px;background:var(--success-50);border-radius:var(--r-sm);border:1px solid var(--success-100)">
            <span style="font-weight:900;color:var(--success);font-size:14px">C</span>
            <div style="flex:1"><div style="font-size:11px;font-weight:700">النسخة الحالية — معتمد</div><div style="font-size:10px;color:var(--text-4)">15 فبراير 2024 • م. خالد</div></div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;padding:8px;background:var(--bg);border-radius:var(--r-sm);border:1px solid var(--border)">
            <span style="font-weight:900;color:var(--text-3);font-size:14px">B</span>
            <div style="flex:1"><div style="font-size:11px;font-weight:700">تعديل الواجهة الشمالية</div><div style="font-size:10px;color:var(--text-4)">8 فبراير 2024 • ملاحظات العميل</div></div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;padding:8px;background:var(--bg);border-radius:var(--r-sm);border:1px solid var(--border)">
            <span style="font-weight:900;color:var(--text-4);font-size:14px">A</span>
            <div style="flex:1"><div style="font-size:11px;font-weight:700">الإصدار الأول</div><div style="font-size:10px;color:var(--text-4)">25 يناير 2024 • إصدار أولي</div></div>
          </div>
        </div>
      </div>

      <div style="display:flex;gap:8px;flex-wrap:wrap;padding-top:10px;border-top:1px solid var(--divider)">
        <button class="btn btn-sm btn-primary" onclick="closeModal();showToast('📥 جاري تحميل الملف DWG...', 'info')">📥 تحميل DWG</button>
        <button class="btn btn-sm btn-outline" onclick="closeModal();showToast('📄 جاري تحميل PDF...', 'info')">📄 تحميل PDF</button>
        <button class="btn btn-sm btn-accent" onclick="closeModal();showToast('🔄 طلب مراجعة جديدة...', 'info')">🔄 طلب مراجعة</button>
      </div>
    </div>
  `;
  openModal('تفاصيل الرسم — ' + dwgId, html);
}

// ── Project Functions ──────────────────────────────
function projectFormHTML() {
  return `
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="form-row">
        <div class="form-group"><label class="form-label">اسم المشروع *</label><input class="form-input" placeholder="مثال: فيلا حي الياسمين"></div>
        <div class="form-group"><label class="form-label">العميل *</label>
          <select class="form-input"><option>اختر من العملاء...</option><option>أحمد السالم</option><option>شركة الأفق</option><option>خالد النور</option><option>سلطان الدوسري</option><option>محمد الفهد</option></select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">نوع المشروع *</label>
          <select class="form-input"><option>فيلا سكنية</option><option>مجمع سكني</option><option>مبنى تجاري</option><option>مبنى إداري</option><option>مستودع/مصنع</option><option>ترميم وتجديد</option></select>
        </div>
        <div class="form-group"><label class="form-label">رقم العقد</label><input class="form-input" placeholder="CNT-2024-XXX" dir="ltr"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">قيمة العقد (ر.س)</label><input class="form-input" placeholder="850,000" dir="ltr"></div>
        <div class="form-group"><label class="form-label">الأولوية</label>
          <select class="form-input"><option>عالية</option><option>متوسطة</option><option>منخفضة</option></select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">تاريخ البدء</label><input class="form-input" type="date"></div>
        <div class="form-group"><label class="form-label">تاريخ التسليم المتوقع</label><input class="form-input" type="date"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">مدير المشروع</label>
          <select class="form-input"><option>م. خالد العتيبي</option><option>م. سارة الحربي</option><option>م. أحمد الشهري</option><option>م. نورة المالكي</option></select>
        </div>
        <div class="form-group"><label class="form-label">المعماري المسؤول</label>
          <select class="form-input"><option>م. خالد العتيبي</option><option>م. سارة الحربي</option><option>م. أحمد الشهري</option></select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">المدينة</label><input class="form-input" placeholder="الرياض"></div>
        <div class="form-group"><label class="form-label">الحي</label><input class="form-input" placeholder="حي الياسمين"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">مساحة الأرض (م²)</label><input class="form-input" placeholder="500" dir="ltr"></div>
        <div class="form-group"><label class="form-label">عدد الطوابق</label><input class="form-input" placeholder="3" dir="ltr"></div>
      </div>
      <div class="form-group"><label class="form-label">ملاحظات</label><textarea class="form-input" rows="2" placeholder="تفاصيل إضافية عن المشروع..."></textarea></div>
      <div style="display:flex;gap:8px;justify-content:flex-end;padding-top:10px;border-top:1px solid var(--divider)">
        <button class="btn btn-secondary" onclick="closeModal()">إلغاء</button>
        <button class="btn btn-primary" onclick="closeModal();showToast('✅ تم إنشاء المشروع بنجاح وتعيين الفريق', 'success')">🏗️ إنشاء المشروع</button>
      </div>
    </div>
  `;
}

function openProjectDetail(projId) {
  const html = `
    <div style="display:flex;flex-direction:column;gap:16px;max-height:70vh;overflow-y:auto">
      <!-- Project Header -->
      <div class="proj-detail-header">
        <div class="proj-detail-avatar">🏗️</div>
        <div class="proj-detail-info">
          <div class="proj-detail-name">فيلا الياسمين — حي الياسمين</div>
          <div class="proj-detail-sub">${projId} • أحمد السالم • فيلا سكنية</div>
        </div>
        <span class="badge badge-green">نشط</span>
      </div>

      <!-- Quick Stats -->
      <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px">
        <div style="text-align:center;padding:10px;background:var(--bg);border-radius:var(--r-sm);border:1px solid var(--border)">
          <div style="font-size:18px;font-weight:900;color:var(--primary)">65%</div>
          <div style="font-size:10px;color:var(--text-4)">الإنجاز</div>
        </div>
        <div style="text-align:center;padding:10px;background:var(--bg);border-radius:var(--r-sm);border:1px solid var(--border)">
          <div style="font-size:18px;font-weight:900;color:var(--success)">850K</div>
          <div style="font-size:10px;color:var(--text-4)">قيمة العقد</div>
        </div>
        <div style="text-align:center;padding:10px;background:var(--bg);border-radius:var(--r-sm);border:1px solid var(--border)">
          <div style="font-size:18px;font-weight:900;color:var(--warning)">42</div>
          <div style="font-size:10px;color:var(--text-4)">يوم متبقي</div>
        </div>
        <div style="text-align:center;padding:10px;background:var(--bg);border-radius:var(--r-sm);border:1px solid var(--border)">
          <div style="font-size:18px;font-weight:900;color:var(--secondary)">12</div>
          <div style="font-size:10px;color:var(--text-4)">مهمة نشطة</div>
        </div>
      </div>

      <!-- Project Stages -->
      <div>
        <div style="font-size:13px;font-weight:800;color:var(--text);margin-bottom:10px">📋 مراحل المشروع</div>
        <div class="proj-stage-list">
          <div class="proj-stage-item">
            <div class="proj-stage-num done">✓</div>
            <div class="proj-stage-info">
              <div class="proj-stage-name">جمع البيانات</div>
              <div class="proj-stage-meta">م. سارة • اكتمل 15 يناير</div>
            </div>
            <span class="proj-stage-status" style="background:var(--success-50);color:var(--success)">مكتمل</span>
          </div>
          <div class="proj-stage-item">
            <div class="proj-stage-num done">✓</div>
            <div class="proj-stage-info">
              <div class="proj-stage-name">التصميم المبدئي (Concept)</div>
              <div class="proj-stage-meta">م. خالد • اكتمل 28 يناير</div>
            </div>
            <span class="proj-stage-status" style="background:var(--success-50);color:var(--success)">مكتمل</span>
          </div>
          <div class="proj-stage-item">
            <div class="proj-stage-num done">✓</div>
            <div class="proj-stage-info">
              <div class="proj-stage-name">التصميم المعماري</div>
              <div class="proj-stage-meta">م. خالد • اكتمل 15 فبراير</div>
            </div>
            <span class="proj-stage-status" style="background:var(--success-50);color:var(--success)">مكتمل</span>
          </div>
          <div class="proj-stage-item" style="border-color:var(--primary-100);background:var(--primary-50)">
            <div class="proj-stage-num current">4</div>
            <div class="proj-stage-info">
              <div class="proj-stage-name">التصميم الإنشائي</div>
              <div class="proj-stage-meta">م. أحمد • بدأ 16 فبراير • 70% مكتمل</div>
            </div>
            <span class="proj-stage-status" style="background:var(--primary-50);color:var(--primary)">جاري</span>
          </div>
          <div class="proj-stage-item">
            <div class="proj-stage-num pending">5</div>
            <div class="proj-stage-info">
              <div class="proj-stage-name">تقديم البلدية</div>
              <div class="proj-stage-meta">لم يبدأ بعد</div>
            </div>
            <span class="proj-stage-status" style="background:var(--divider);color:var(--text-4)">قادم</span>
          </div>
          <div class="proj-stage-item">
            <div class="proj-stage-num pending">6</div>
            <div class="proj-stage-info">
              <div class="proj-stage-name">الرسومات التنفيذية</div>
              <div class="proj-stage-meta">لم يبدأ بعد</div>
            </div>
            <span class="proj-stage-status" style="background:var(--divider);color:var(--text-4)">قادم</span>
          </div>
          <div class="proj-stage-item">
            <div class="proj-stage-num pending">7</div>
            <div class="proj-stage-info">
              <div class="proj-stage-name">الإشراف الميداني</div>
              <div class="proj-stage-meta">لم يبدأ بعد</div>
            </div>
            <span class="proj-stage-status" style="background:var(--divider);color:var(--text-4)">قادم</span>
          </div>
          <div class="proj-stage-item">
            <div class="proj-stage-num pending">8</div>
            <div class="proj-stage-info">
              <div class="proj-stage-name">التسليم النهائي</div>
              <div class="proj-stage-meta">لم يبدأ بعد</div>
            </div>
            <span class="proj-stage-status" style="background:var(--divider);color:var(--text-4)">قادم</span>
          </div>
        </div>
      </div>

      <!-- Project Timeline -->
      <div>
        <div style="font-size:13px;font-weight:800;color:var(--text);margin-bottom:10px">🕐 سجل الأحداث (Timeline)</div>
        <div style="display:flex;flex-direction:column;gap:8px;padding-right:16px;border-right:2px solid var(--primary-100)">
          <div style="display:flex;gap:10px;align-items:flex-start">
            <div style="width:8px;height:8px;border-radius:50%;background:var(--primary);margin-top:5px;flex-shrink:0"></div>
            <div><div style="font-size:12px;font-weight:700;color:var(--text)">إنشاء المشروع وتعيين الفريق</div><div style="font-size:11px;color:var(--text-3)">5 يناير 2024 • م. خالد العتيبي • إدارة</div></div>
          </div>
          <div style="display:flex;gap:10px;align-items:flex-start">
            <div style="width:8px;height:8px;border-radius:50%;background:var(--success);margin-top:5px;flex-shrink:0"></div>
            <div><div style="font-size:12px;font-weight:700;color:var(--text)">توقيع العقد واستلام الدفعة الأولى (30%)</div><div style="font-size:11px;color:var(--text-3)">7 يناير 2024 • المالية • 255,000 ر.س</div></div>
          </div>
          <div style="display:flex;gap:10px;align-items:flex-start">
            <div style="width:8px;height:8px;border-radius:50%;background:var(--info);margin-top:5px;flex-shrink:0"></div>
            <div><div style="font-size:12px;font-weight:700;color:var(--text)">اكتمال جمع البيانات والرفع المساحي</div><div style="font-size:11px;color:var(--text-3)">15 يناير 2024 • م. سارة • هندسة</div></div>
          </div>
          <div style="display:flex;gap:10px;align-items:flex-start">
            <div style="width:8px;height:8px;border-radius:50%;background:var(--secondary);margin-top:5px;flex-shrink:0"></div>
            <div><div style="font-size:12px;font-weight:700;color:var(--text)">اعتماد التصميم المبدئي من العميل</div><div style="font-size:11px;color:var(--text-3)">28 يناير 2024 • م. خالد • معماري</div></div>
          </div>
          <div style="display:flex;gap:10px;align-items:flex-start">
            <div style="width:8px;height:8px;border-radius:50%;background:var(--warning);margin-top:5px;flex-shrink:0"></div>
            <div><div style="font-size:12px;font-weight:700;color:var(--text)">رفع المخططات المعمارية (Rev.02)</div><div style="font-size:11px;color:var(--text-3)">15 فبراير 2024 • م. خالد • 📎 3 ملفات DWG</div></div>
          </div>
          <div style="display:flex;gap:10px;align-items:flex-start">
            <div style="width:8px;height:8px;border-radius:50%;background:var(--primary);margin-top:5px;flex-shrink:0"></div>
            <div><div style="font-size:12px;font-weight:700;color:var(--text)">بدء التصميم الإنشائي</div><div style="font-size:11px;color:var(--text-3)">16 فبراير 2024 • م. أحمد • إنشائي</div></div>
          </div>
        </div>
      </div>

      <!-- Engineering Team -->
      <div>
        <div style="font-size:13px;font-weight:800;color:var(--text);margin-bottom:10px">👥 فريق المشروع</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <div style="display:flex;align-items:center;gap:8px;padding:8px;background:var(--bg);border-radius:var(--r-sm);border:1px solid var(--border)">
            <div style="width:30px;height:30px;border-radius:50%;background:var(--primary);display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:800">خ</div>
            <div><div style="font-size:11.5px;font-weight:700">م. خالد العتيبي</div><div style="font-size:10px;color:var(--text-4)">مدير المشروع + معماري</div></div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;padding:8px;background:var(--bg);border-radius:var(--r-sm);border:1px solid var(--border)">
            <div style="width:30px;height:30px;border-radius:50%;background:var(--secondary);display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:800">أ</div>
            <div><div style="font-size:11.5px;font-weight:700">م. أحمد الشهري</div><div style="font-size:10px;color:var(--text-4)">مهندس إنشائي</div></div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;padding:8px;background:var(--bg);border-radius:var(--r-sm);border:1px solid var(--border)">
            <div style="width:30px;height:30px;border-radius:50%;background:var(--success);display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:800">س</div>
            <div><div style="font-size:11.5px;font-weight:700">م. سارة الحربي</div><div style="font-size:10px;color:var(--text-4)">مهندسة كهربائية</div></div>
          </div>
          <div style="display:flex;align-items:center;gap:8px;padding:8px;background:var(--bg);border-radius:var(--r-sm);border:1px solid var(--border)">
            <div style="width:30px;height:30px;border-radius:50%;background:var(--warning);display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;font-weight:800">ن</div>
            <div><div style="font-size:11.5px;font-weight:700">م. نورة المالكي</div><div style="font-size:10px;color:var(--text-4)">تصميم داخلي</div></div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div style="display:flex;gap:8px;flex-wrap:wrap;padding-top:12px;border-top:1px solid var(--divider)">
        <button class="btn btn-sm btn-primary" onclick="closeModal();showToast('📋 فتح لوحة المهام...', 'info')">📋 المهام</button>
        <button class="btn btn-sm btn-accent" onclick="closeModal();showToast('📐 فتح المستندات...', 'info')">📐 المستندات</button>
        <button class="btn btn-sm btn-success" onclick="closeModal();showToast('💰 فتح الحسابات...', 'info')">💰 المالية</button>
        <button class="btn btn-sm btn-outline" onclick="closeModal();showToast('📅 فتح الاجتماعات...', 'info')">📅 اجتماعات</button>
        <button class="btn btn-sm btn-outline" onclick="closeModal();showToast('👷 فتح الزيارات الميدانية...', 'info')">👷 زيارات</button>
      </div>
    </div>
  `;
  openModal('تفاصيل المشروع — ' + projId, html);
}

function filterProjects(value) {
  showToast('🔍 تم تطبيق الفلتر: ' + (value === 'all' ? 'جميع المشاريع' : value), 'info');
}

function toggleProjectView(view) {
  document.querySelectorAll('.proj-view-btn').forEach(b => b.classList.remove('active'));
  event.target.classList.add('active');
  showToast(view === 'table' ? '📋 عرض جدول' : '🗂️ عرض بطاقات', 'info');
}

// ── Engineering Workflow Functions ──────────────
function showEngPhaseDetail(phase) {
  const phases = {
    concept: { title: 'التصميم المبدئي (Concept Design)', icon: '💡', color: 'var(--primary)',
      steps: ['دراسة متطلبات العميل', 'تحليل الموقع والمحيط', 'إعداد المخطط المبدئي', 'عرض الخيارات على العميل', 'اعتماد التصميم المبدئي'],
      deliverables: ['Concept Proposal', 'Initial Sketches', 'Site Analysis Report', 'Client Brief Document'],
      duration: '2-3 أسابيع', team: 'م. خالد + م. نورة', projects: 3
    },
    architectural: { title: 'التصميم المعماري (Architectural Design)', icon: '📐', color: 'var(--secondary)',
      steps: ['إعداد المخططات الأفقية', 'تصميم الواجهات', 'إعداد القطاعات', 'توزيع الفراغات الداخلية', 'مراجعة الكود المعماري', 'إنتاج المناظير 3D'],
      deliverables: ['Floor Plans', 'Elevations', 'Sections', '3D Renderings', 'Material Schedule'],
      duration: '4-6 أسابيع', team: 'م. خالد + م. نورة + م. سارة', projects: 4
    },
    structural: { title: 'التصميم الإنشائي (Structural Design)', icon: '🏗️', color: 'var(--warning)',
      steps: ['اختيار النظام الإنشائي', 'حساب الأحمال', 'تصميم الأساسات', 'تصميم الأعمدة والبلاطات', 'إعداد جداول التسليح', 'المراجعة الإنشائية'],
      deliverables: ['Structural Calculations', 'Foundation Plans', 'Column/Beam Schedules', 'Reinforcement Details'],
      duration: '3-5 أسابيع', team: 'م. أحمد الشهري', projects: 2
    },
    mep: { title: 'التصميم الكهروميكانيكي (MEP)', icon: '⚡', color: 'var(--success)',
      steps: ['حساب الأحمال الكهربائية', 'تصميم شبكة الصرف والتغذية', 'تصميم نظام التكييف', 'تنسيق MEP مع المعماري', 'إعداد BOQ', 'مراجعة Clash Detection'],
      deliverables: ['Electrical Drawings', 'Plumbing Drawings', 'HVAC Drawings', 'Load Calculations', 'BOQ'],
      duration: '3-4 أسابيع', team: 'م. سارة الحربي', projects: 3
    },
    municipality: { title: 'اعتمادات البلدية (Municipality Approvals)', icon: '🏛️', color: 'var(--danger)',
      steps: ['تجهيز ملف التقديم', 'مراجعة الاشتراطات', 'التقديم الإلكتروني', 'متابعة المراجعة', 'استلام الملاحظات', 'التعديل وإعادة التقديم', 'استلام الاعتماد'],
      deliverables: ['Submission Package', 'Municipality Comments Response', 'Approved Drawings', 'Building Permit'],
      duration: '4-8 أسابيع', team: 'م. خالد + م. نورة', projects: 5
    }
  };
  const p = phases[phase];
  if (!p) return;
  const stepsHtml = p.steps.map((s, i) => `<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;background:var(--bg);border-radius:6px"><span style="width:22px;height:22px;border-radius:50%;background:${p.color};color:#fff;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;flex-shrink:0">${i+1}</span><span style="font-size:11px;color:var(--text-1)">${s}</span></div>`).join('');
  const delHtml = p.deliverables.map(d => `<span style="display:inline-block;padding:4px 10px;background:var(--primary-50);color:var(--primary);border-radius:20px;font-size:10px;font-weight:600">📄 ${d}</span>`).join(' ');
  const html = `
    <div style="display:flex;flex-direction:column;gap:16px;max-height:70vh;overflow-y:auto">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="width:50px;height:50px;border-radius:12px;background:${p.color}20;display:flex;align-items:center;justify-content:center;font-size:28px">${p.icon}</div>
        <div><div style="font-size:15px;font-weight:800;color:var(--text)">${p.title}</div><div style="font-size:11px;color:var(--text-3)">${p.projects} مشاريع نشطة • المدة: ${p.duration}</div></div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
        <div style="text-align:center;padding:10px;background:var(--bg);border-radius:8px;border:1px solid var(--border)"><div style="font-size:16px;font-weight:900;color:${p.color}">${p.projects}</div><div style="font-size:10px;color:var(--text-4)">مشاريع نشطة</div></div>
        <div style="text-align:center;padding:10px;background:var(--bg);border-radius:8px;border:1px solid var(--border)"><div style="font-size:16px;font-weight:900;color:var(--text-1)">${p.duration}</div><div style="font-size:10px;color:var(--text-4)">المدة المتوقعة</div></div>
        <div style="text-align:center;padding:10px;background:var(--bg);border-radius:8px;border:1px solid var(--border)"><div style="font-size:16px;font-weight:900;color:var(--text-1)">${p.steps.length}</div><div style="font-size:10px;color:var(--text-4)">خطوات</div></div>
      </div>
      <div><div style="font-size:12px;font-weight:800;color:var(--text);margin-bottom:8px">📋 خطوات المرحلة</div><div style="display:flex;flex-direction:column;gap:6px">${stepsHtml}</div></div>
      <div><div style="font-size:12px;font-weight:800;color:var(--text);margin-bottom:8px">📦 المخرجات (Deliverables)</div><div style="display:flex;flex-wrap:wrap;gap:6px">${delHtml}</div></div>
      <div style="padding:10px;background:var(--bg);border-radius:8px;border:1px solid var(--border)"><div style="font-size:11px;color:var(--text-3)">👥 الفريق المسؤول: <strong>${p.team}</strong></div></div>
    </div>`;
  openModal(p.title, html);
}

function showMunicipalityDetail(munId) {
  const html = `
    <div style="display:flex;flex-direction:column;gap:16px;max-height:70vh;overflow-y:auto">
      <div style="display:flex;align-items:center;gap:12px">
        <div style="width:44px;height:44px;border-radius:10px;background:#FEE2E2;display:flex;align-items:center;justify-content:center;font-size:22px">🏛️</div>
        <div><div style="font-size:14px;font-weight:800">معاملة ${munId}</div><div style="font-size:11px;color:var(--text-3)">فيلا الياسمين • بلدية الرياض</div></div>
        <span class="badge badge-orange">تحت المراجعة</span>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px">
        <div style="text-align:center;padding:10px;background:var(--bg);border-radius:8px;border:1px solid var(--border)"><div style="font-size:10px;color:var(--text-4)">تاريخ التقديم</div><div style="font-size:13px;font-weight:800">15/01/2024</div></div>
        <div style="text-align:center;padding:10px;background:var(--bg);border-radius:8px;border:1px solid var(--border)"><div style="font-size:10px;color:var(--text-4)">عدد التعديلات</div><div style="font-size:13px;font-weight:800">2</div></div>
        <div style="text-align:center;padding:10px;background:var(--bg);border-radius:8px;border:1px solid var(--border)"><div style="font-size:10px;color:var(--text-4)">المدة الإجمالية</div><div style="font-size:13px;font-weight:800">45 يوم</div></div>
      </div>
      <div><div style="font-size:12px;font-weight:800;margin-bottom:8px">📋 سجل المتابعة</div>
        <div style="display:flex;flex-direction:column;gap:6px;padding-right:12px;border-right:2px solid var(--primary-100)">
          <div style="display:flex;gap:8px"><div style="width:8px;height:8px;border-radius:50%;background:var(--primary);margin-top:4px;flex-shrink:0"></div><div><div style="font-size:11px;font-weight:700">تقديم المعاملة</div><div style="font-size:10px;color:var(--text-3)">15/01/2024 • م. خالد</div></div></div>
          <div style="display:flex;gap:8px"><div style="width:8px;height:8px;border-radius:50%;background:var(--warning);margin-top:4px;flex-shrink:0"></div><div><div style="font-size:11px;font-weight:700">استلام ملاحظات — تعديل الارتدادات</div><div style="font-size:10px;color:var(--text-3)">25/01/2024 • البلدية</div></div></div>
          <div style="display:flex;gap:8px"><div style="width:8px;height:8px;border-radius:50%;background:var(--success);margin-top:4px;flex-shrink:0"></div><div><div style="font-size:11px;font-weight:700">إعادة التقديم بعد التعديل</div><div style="font-size:10px;color:var(--text-3)">01/02/2024 • م. خالد</div></div></div>
          <div style="display:flex;gap:8px"><div style="width:8px;height:8px;border-radius:50%;background:var(--info);margin-top:4px;flex-shrink:0"></div><div><div style="font-size:11px;font-weight:700">تحت المراجعة النهائية</div><div style="font-size:10px;color:var(--text-3)">05/08/2026 • بانتظار الاعتماد</div></div></div>
        </div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap;padding-top:10px;border-top:1px solid var(--divider)">
        <button class="btn btn-sm btn-primary" onclick="closeModal();showToast('📤 إعادة تقديم...','info')">📤 إعادة تقديم</button>
        <button class="btn btn-sm btn-outline" onclick="closeModal();showToast('📄 طباعة التقرير...','info')">🖨️ طباعة</button>
        <button class="btn btn-sm btn-outline" onclick="closeModal();showToast('📞 اتصال بالبلدية...','info')">📞 متابعة</button>
      </div>
    </div>`;
  openModal('تفاصيل المعاملة — ' + munId, html);
}

function municipalityFormHTML() {
  return `
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="form-row">
        <div class="form-group"><label class="form-label">المشروع *</label>
          <select class="form-input"><option>فيلا الياسمين</option><option>مجمع الأفق التجاري</option><option>مبنى إداري العليا</option><option>فيلا النرجس</option></select>
        </div>
        <div class="form-group"><label class="form-label">الجهة *</label>
          <select class="form-input"><option>بلدية الرياض</option><option>أمانة المنطقة</option><option>الدفاع المدني</option><option>شركة الكهرباء</option><option>شركة المياه</option></select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">نوع المعاملة *</label>
          <select class="form-input"><option>رخصة بناء</option><option>اعتماد مخططات</option><option>شهادة إتمام</option><option>تعديل رخصة</option><option>فحص ميداني</option></select>
        </div>
        <div class="form-group"><label class="form-label">المهندس المسؤول *</label>
          <select class="form-input"><option>م. خالد العتيبي</option><option>م. أحمد الشهري</option><option>م. سارة الحربي</option><option>م. نورة المالكي</option></select>
        </div>
      </div>
      <div class="form-group"><label class="form-label">ملاحظات</label><textarea class="form-input" rows="3" placeholder="أي ملاحظات إضافية..."></textarea></div>
      <div class="form-group"><label class="form-label">المرفقات</label><input type="file" class="form-input" multiple></div>
      <div style="display:flex;gap:8px;justify-content:flex-end;padding-top:10px;border-top:1px solid var(--divider)">
        <button class="btn btn-outline" onclick="closeModal()">إلغاء</button>
        <button class="btn btn-primary" onclick="closeModal();showToast('✅ تم تسجيل المعاملة بنجاح','success')">💾 حفظ وتقديم</button>
      </div>
    </div>`;
}

function siteVisitFormHTML() {
  return `
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="form-row">
        <div class="form-group"><label class="form-label">المشروع *</label>
          <select class="form-input"><option>فيلا الياسمين</option><option>مجمع الأفق التجاري</option><option>مبنى إداري العليا</option><option>فيلا النرجس</option><option>مجمع سكني — 12 وحدة</option></select>
        </div>
        <div class="form-group"><label class="form-label">المهندس *</label>
          <select class="form-input"><option>م. خالد العتيبي</option><option>م. أحمد الشهري</option><option>م. سارة الحربي</option><option>م. نورة المالكي</option></select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">تاريخ الزيارة *</label><input class="form-input" type="date"></div>
        <div class="form-group"><label class="form-label">نسبة الإنجاز *</label><input class="form-input" type="number" min="0" max="100" placeholder="75"></div>
      </div>
      <div class="form-group"><label class="form-label">نوع الزيارة</label>
        <select class="form-input"><option>زيارة دورية</option><option>فحص مرحلة</option><option>متابعة ملاحظات</option><option>استلام أعمال</option><option>طارئة</option></select>
      </div>
      <div class="form-group"><label class="form-label">ملاحظات الزيارة *</label><textarea class="form-input" rows="3" placeholder="وصف حالة الموقع والملاحظات..."></textarea></div>
      <div class="form-group"><label class="form-label">صور الموقع</label><input type="file" class="form-input" multiple accept="image/*"></div>
      <div style="display:flex;gap:8px;justify-content:flex-end;padding-top:10px;border-top:1px solid var(--divider)">
        <button class="btn btn-outline" onclick="closeModal()">إلغاء</button>
        <button class="btn btn-primary" onclick="closeModal();showToast('✅ تم تسجيل الزيارة الميدانية','success')">💾 حفظ التقرير</button>
      </div>
    </div>`;
}

// ── CRM Functions ──────────────────────────────
function crmLeadFormHTML() {
  return `
    <div style="display:flex;flex-direction:column;gap:14px">
      <div class="form-row">
        <div class="form-group"><label class="form-label">الاسم الكامل *</label><input class="form-input" placeholder="أدخل اسم العميل"></div>
        <div class="form-group"><label class="form-label">رقم الهاتف *</label><input class="form-input" placeholder="05xxxxxxxx" dir="ltr"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">البريد الإلكتروني</label><input class="form-input" placeholder="email@example.com" dir="ltr"></div>
        <div class="form-group"><label class="form-label">الشركة</label><input class="form-input" placeholder="اسم الشركة (اختياري)"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">نوع المشروع *</label>
          <select class="form-input"><option>فيلا سكنية</option><option>مجمع سكني</option><option>مبنى تجاري</option><option>مبنى إداري</option><option>مستودع/مصنع</option><option>ترميم وتجديد</option><option>تصميم داخلي</option><option>تنسيق حدائق</option><option>أخرى</option></select>
        </div>
        <div class="form-group"><label class="form-label">الميزانية التقديرية</label>
          <select class="form-input"><option>أقل من 500,000</option><option>500,000 - 1,000,000</option><option>1,000,000 - 3,000,000</option><option>3,000,000 - 5,000,000</option><option>أكثر من 5,000,000</option></select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">المدينة</label><input class="form-input" placeholder="الرياض"></div>
        <div class="form-group"><label class="form-label">مصدر العميل</label>
          <select class="form-input"><option>موقع إلكتروني</option><option>إحالة عميل</option><option>إعلان مدفوع</option><option>معرض</option><option>اتصال مباشر</option><option>وسائل التواصل</option></select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">المساحة التقريبية (م²)</label><input class="form-input" placeholder="مثال: 500" dir="ltr"></div>
        <div class="form-group"><label class="form-label">درجة الأهمية</label>
          <select class="form-input"><option>ساخن 🔥</option><option>دافئ ☀️</option><option>بارد ❄️</option></select>
        </div>
      </div>
      <div class="form-group"><label class="form-label">ملاحظات</label><textarea class="form-input" rows="3" placeholder="أي تفاصيل إضافية عن العميل أو المشروع..."></textarea></div>
      <div style="display:flex;gap:8px;justify-content:flex-end;padding-top:10px;border-top:1px solid var(--divider)">
        <button class="btn btn-secondary" onclick="closeModal()">إلغاء</button>
        <button class="btn btn-primary" onclick="closeModal();showToast('✅ تم إضافة العميل بنجاح', 'success')">💾 حفظ العميل</button>
      </div>
    </div>
  `;
}

function openLeadDetail(name) {
  const html = `
    <div style="display:flex;flex-direction:column;gap:16px">
      <!-- Lead Header -->
      <div style="display:flex;align-items:center;gap:14px;padding-bottom:14px;border-bottom:1px solid var(--divider)">
        <div style="width:50px;height:50px;border-radius:50%;background:linear-gradient(135deg,var(--primary),var(--secondary));display:flex;align-items:center;justify-content:center;color:#fff;font-size:18px;font-weight:800">${name.charAt(0)}</div>
        <div style="flex:1">
          <div style="font-size:16px;font-weight:800;color:var(--text)">${name}</div>
          <div style="font-size:12px;color:var(--text-3)">عميل محتمل • مرحلة التواصل</div>
        </div>
        <span class="badge badge-orange">ساخن 🔥</span>
      </div>

      <!-- Quick Info -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;background:var(--bg);padding:14px;border-radius:var(--r-sm)">
        <div><div style="font-size:10.5px;color:var(--text-4)">الهاتف</div><div style="font-size:13px;font-weight:700;color:var(--text)" dir="ltr">+966 55 123 4567</div></div>
        <div><div style="font-size:10.5px;color:var(--text-4)">البريد</div><div style="font-size:13px;font-weight:700;color:var(--text)" dir="ltr">client@email.com</div></div>
        <div><div style="font-size:10.5px;color:var(--text-4)">نوع المشروع</div><div style="font-size:13px;font-weight:700;color:var(--text)">فيلا سكنية</div></div>
        <div><div style="font-size:10.5px;color:var(--text-4)">الميزانية</div><div style="font-size:13px;font-weight:700;color:var(--primary)">850,000 ر.س</div></div>
        <div><div style="font-size:10.5px;color:var(--text-4)">المدينة</div><div style="font-size:13px;font-weight:700;color:var(--text)">الرياض — حي الياسمين</div></div>
        <div><div style="font-size:10.5px;color:var(--text-4)">المسؤول</div><div style="font-size:13px;font-weight:700;color:var(--text)">م. خالد العتيبي</div></div>
      </div>

      <!-- Timeline -->
      <div>
        <div style="font-size:13px;font-weight:800;color:var(--text);margin-bottom:10px">📋 سجل النشاط (Timeline)</div>
        <div style="display:flex;flex-direction:column;gap:8px;padding-right:16px;border-right:2px solid var(--primary-100)">
          <div style="display:flex;gap:10px;align-items:flex-start">
            <div style="width:8px;height:8px;border-radius:50%;background:var(--primary);margin-top:5px;flex-shrink:0"></div>
            <div><div style="font-size:12px;font-weight:700;color:var(--text)">تم إنشاء العميل</div><div style="font-size:11px;color:var(--text-3)">منذ 5 أيام • م. سارة الحربي</div></div>
          </div>
          <div style="display:flex;gap:10px;align-items:flex-start">
            <div style="width:8px;height:8px;border-radius:50%;background:var(--success);margin-top:5px;flex-shrink:0"></div>
            <div><div style="font-size:12px;font-weight:700;color:var(--text)">تم الاتصال — مهتم بالخدمة</div><div style="font-size:11px;color:var(--text-3)">منذ 4 أيام • م. خالد العتيبي</div></div>
          </div>
          <div style="display:flex;gap:10px;align-items:flex-start">
            <div style="width:8px;height:8px;border-radius:50%;background:var(--warning);margin-top:5px;flex-shrink:0"></div>
            <div><div style="font-size:12px;font-weight:700;color:var(--text)">تم إرسال رسالة واتساب</div><div style="font-size:11px;color:var(--text-3)">منذ 3 أيام • النظام</div></div>
          </div>
          <div style="display:flex;gap:10px;align-items:flex-start">
            <div style="width:8px;height:8px;border-radius:50%;background:var(--info);margin-top:5px;flex-shrink:0"></div>
            <div><div style="font-size:12px;font-weight:700;color:var(--text)">تم جدولة اجتماع</div><div style="font-size:11px;color:var(--text-3)">منذ يومين • م. خالد العتيبي</div></div>
          </div>
        </div>
      </div>

      <!-- Actions -->
      <div style="display:flex;gap:8px;flex-wrap:wrap;padding-top:12px;border-top:1px solid var(--divider)">
        <button class="btn btn-sm btn-primary" onclick="closeModal();showToast('📞 جاري الاتصال...', 'info')">📞 اتصال</button>
        <button class="btn btn-sm btn-success" onclick="closeModal();showToast('💬 فتح محادثة واتساب', 'success')">💬 واتساب</button>
        <button class="btn btn-sm btn-accent" onclick="closeModal();showToast('📋 جاري إعداد عرض السعر', 'info')">📋 عرض سعر</button>
        <button class="btn btn-sm btn-outline" onclick="closeModal();showToast('📅 تم جدولة اجتماع', 'success')">📅 اجتماع</button>
        <button class="btn btn-sm btn-danger" onclick="closeModal();showToast('❌ تم نقل العميل للمفقودين', 'danger')">❌ مفقود</button>
      </div>
    </div>
  `;
  openModal('تفاصيل العميل — ' + name, html);
}

function filterPipeline(value) {
  showToast('🔍 تم تطبيق الفلتر: ' + (value === 'all' ? 'جميع العملاء' : value), 'info');
}

// ── Initialize ──────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  updateDate();
  
  // Wire sidebar nav clicks
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', (e) => {
      e.stopPropagation();
      const page = item.getAttribute('data-page');
      navigateTo(page);
    });
  });
  
  // Sidebar toggle for mobile
  const toggleBtn = document.getElementById('topbar-toggle-btn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      const sidebar = document.getElementById('sidebar');
      const overlay = document.getElementById('sidebar-overlay');
      sidebar.classList.toggle('open');
      overlay.style.display = sidebar.classList.contains('open') ? 'block' : 'none';
    });
  }
  
  // Close modal on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeModal();
  });
  
  // Animate KPI values on load
  document.querySelectorAll('.kpi-value').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(10px)';
    setTimeout(() => {
      el.style.transition = 'all .5s ease';
      el.style.opacity = '1';
      el.style.transform = 'translateY(0)';
    }, 200 + Math.random() * 300);
  });

  // ── Dashboard Date ──
  initDashDate();

  // ── Hero Slider Auto-Rotate ──
  initHeroSlider();

  // ── Task Tabs ──
  initTaskTabs();
});

/* ═══════════════════════════════════════════════════════════════
   Part 02-A: Dashboard Workspace & CRM Operations Enhancement
   ═══════════════════════════════════════════════════════════════ */

// ── Dashboard Date ──────────────────────────────────────────────
function initDashDate() {
  const el = document.getElementById('dashDate');
  if (!el) return;
  const now = new Date();
  const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
  el.textContent = now.toLocaleDateString('ar-SA', options);
}

// ── Hero News Slider ────────────────────────────────────────────
let heroCurrentSlide = 0;
let heroAutoInterval = null;

function switchHeroSlide(index) {
  const slides = document.querySelectorAll('.dash-hero-slide');
  const dots = document.querySelectorAll('.dash-hero-dot');
  if (!slides.length) return;
  
  slides.forEach((s, i) => {
    s.classList.toggle('active', i === index);
    s.style.opacity = i === index ? '1' : '0';
    s.style.transform = i === index ? 'translateX(0)' : 'translateX(30px)';
  });
  dots.forEach((d, i) => d.classList.toggle('active', i === index));
  heroCurrentSlide = index;
}

function heroNext() {
  const slides = document.querySelectorAll('.dash-hero-slide');
  if (!slides.length) return;
  const next = (heroCurrentSlide + 1) % slides.length;
  switchHeroSlide(next);
}

function initHeroSlider() {
  const slider = document.getElementById('heroSlider');
  if (!slider) return;
  
  // Set initial styles
  const slides = slider.querySelectorAll('.dash-hero-slide');
  slides.forEach((s, i) => {
    s.style.transition = 'all 0.6s cubic-bezier(0.4,0,0.2,1)';
    if (i !== 0) {
      s.style.opacity = '0';
      s.style.transform = 'translateX(30px)';
    }
  });
  
  // Auto rotate every 5 seconds
  heroAutoInterval = setInterval(heroNext, 5000);
  
  // Pause on hover
  slider.addEventListener('mouseenter', () => clearInterval(heroAutoInterval));
  slider.addEventListener('mouseleave', () => {
    heroAutoInterval = setInterval(heroNext, 5000);
  });
}

// ── Task Tabs (My Tasks / Team / Overdue / Completed) ───────────
function initTaskTabs() {
  const container = document.getElementById('dashTaskTabs');
  if (!container) return;
  // Default: show "my-tasks" tab
  switchDashTaskTab('my-tasks');
}

function switchDashTaskTab(tab) {
  const tabs = ['my-tasks', 'team-tasks', 'overdue-tasks', 'completed-tasks'];
  tabs.forEach(t => {
    const panel = document.getElementById('dtab-' + t);
    if (panel) panel.style.display = t === tab ? 'block' : 'none';
  });
  // Update tab buttons
  document.querySelectorAll('.dash-task-tab').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tab') === tab);
  });
}

// ── Follow-up System ────────────────────────────────────────────
function toggleFollowUp(clientId) {
  const detail = document.getElementById('followup-' + clientId);
  if (detail) detail.classList.toggle('show');
}

// ── User Profile Dropdown (close on outside click) ──────────────
document.addEventListener('click', function(e) {
  const dropdown = document.getElementById('userProfileDropdown');
  const profile = document.querySelector('.sb-user-profile');
  if (dropdown && profile && !profile.contains(e.target) && !dropdown.contains(e.target)) {
    dropdown.classList.remove('show');
  }
});

// ══════════════════════════════════════════════════════════════════
// DOCUMENT MANAGEMENT SYSTEM — Tab Switching
// ══════════════════════════════════════════════════════════════════
function switchDocTab(tab) {
  const panels = ['browser', 'templates', 'pending', 'archive'];
  panels.forEach(p => {
    const el = document.getElementById('doc-tab-' + p);
    if (el) el.style.display = p === tab ? 'block' : 'none';
  });
  // Update tab buttons within DMS card
  const dmsCard = document.getElementById('p-doc_editor');
  if (dmsCard) {
    dmsCard.querySelectorAll('.dash-task-tab').forEach(btn => {
      const btnTab = btn.getAttribute('onclick');
      if (btnTab && btnTab.includes("'" + tab + "'")) {
        btn.classList.add('active');
      } else {
        btn.classList.remove('active');
      }
    });
  }
}