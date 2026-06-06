/* ═══════════════════════════════════════════════════════
   MEMAR ERP — File Manager Module (مدير الملفات)
   Supabase Storage integration for document management
   Version: 2.0.0 — Enhanced with search & validation
═══════════════════════════════════════════════════════ */

window.FileManager = {
  files: [],
  _LS_KEY: 'memar_file_manager',
  _BUCKET: 'memar-docs',
  activeFolder: 'all',
  _search: '',

  init() {
    try { this.files = JSON.parse(localStorage.getItem(this._LS_KEY) || '[]'); } catch(e) { this.files = []; }
    if (this.files.length === 0) this._seedDemo();
  },

  _seedDemo() {
    this.files = [
      { id:'FILE-001', name:'\u0639\u0642\u062f \u0641\u064a\u0644\u0627 \u0627\u0644\u0633\u0627\u0644\u0645\u064a\u0629 - \u0645\u0648\u0642\u0651\u0639.pdf', size:2457600, type:'pdf', folder:'contracts', project:'\u0641\u064a\u0644\u0627 \u0627\u0644\u0633\u0627\u0644\u0645\u064a\u0629 \u0627\u0644\u0641\u0627\u062e\u0631\u0629', notes:'\u0627\u0644\u0639\u0642\u062f \u0627\u0644\u0631\u0626\u064a\u0633\u064a \u0627\u0644\u0645\u0648\u0642\u0651\u0639 \u0645\u0639 \u0627\u0644\u0639\u0645\u064a\u0644', url:null, uploadedAt:'2026-01-16T10:00:00Z', uploadedBy:'\u0631\u064a\u0645 \u0627\u0644\u0639\u0628\u062f\u0627\u0644\u0644\u0647' },
      { id:'FILE-002', name:'\u0645\u062e\u0637\u0637 \u0627\u0644\u0637\u0627\u0628\u0642 \u0627\u0644\u0623\u0631\u0636\u064a.dwg', size:5242880, type:'dwg', folder:'drawings', project:'\u0641\u064a\u0644\u0627 \u0627\u0644\u0633\u0627\u0644\u0645\u064a\u0629 \u0627\u0644\u0641\u0627\u062e\u0631\u0629', notes:'\u0645\u062e\u0637\u0637 \u0627\u0644\u062f\u0648\u0631 \u0627\u0644\u0623\u0631\u0636\u064a - \u0627\u0644\u0625\u0635\u062f\u0627\u0631 \u0627\u0644\u0646\u0647\u0627\u0626\u064a', url:null, uploadedAt:'2026-02-20T14:30:00Z', uploadedBy:'\u0645. \u0633\u0627\u0631\u0629 \u0627\u0644\u062e\u0627\u0644\u062f' },
      { id:'FILE-003', name:'\u0648\u0627\u062c\u0647\u0627\u062a 3D - \u0645\u0642\u062a\u0631\u062d \u0623.jpg', size:3145728, type:'img', folder:'drawings', project:'\u0641\u064a\u0644\u0627 \u0627\u0644\u0633\u0627\u0644\u0645\u064a\u0629 \u0627\u0644\u0641\u0627\u062e\u0631\u0629', notes:'\u062a\u0635\u0645\u064a\u0645 \u0627\u0644\u0648\u0627\u062c\u0647\u0629 \u0627\u0644\u0623\u0645\u0627\u0645\u064a\u0629 - \u0627\u0644\u0637\u0631\u0627\u0632 \u0627\u0644\u062d\u062f\u064a\u062b', url:null, uploadedAt:'2026-03-05T09:15:00Z', uploadedBy:'\u0645. \u0633\u0627\u0631\u0629 \u0627\u0644\u062e\u0627\u0644\u062f' },
      { id:'FILE-004', name:'\u0631\u062e\u0635\u0629 \u0628\u0646\u0627\u0621 - \u0637\u0644\u0628 \u0645\u0628\u062f\u0626\u064a.pdf', size:1048576, type:'pdf', folder:'permits', project:'\u0641\u064a\u0644\u0627 \u0627\u0644\u0633\u0627\u0644\u0645\u064a\u0629 \u0627\u0644\u0641\u0627\u062e\u0631\u0629', notes:'\u0646\u0645\u0648\u0630\u062c \u0637\u0644\u0628 \u0627\u0644\u0631\u062e\u0635\u0629 \u0627\u0644\u0645\u0642\u062f\u0645 \u0644\u0644\u0628\u0644\u062f\u064a\u0629', url:null, uploadedAt:'2026-03-22T11:00:00Z', uploadedBy:'\u0627\u0644\u0625\u062f\u0627\u0631\u0629' },
      { id:'FILE-005', name:'\u0641\u0627\u062a\u0648\u0631\u0629 MEI-2026-001.pdf', size:524288, type:'pdf', folder:'invoices', project:'\u0641\u064a\u0644\u0627 \u0627\u0644\u0633\u0627\u0644\u0645\u064a\u0629 \u0627\u0644\u0641\u0627\u062e\u0631\u0629', notes:'\u0627\u0644\u062f\u0641\u0639\u0629 \u0627\u0644\u0623\u0648\u0644\u0649 - \u0627\u0644\u062f\u0631\u0627\u0633\u0629 \u0648\u0627\u0644\u062a\u0635\u0645\u064a\u0645', url:null, uploadedAt:'2026-02-01T08:30:00Z', uploadedBy:'\u0645\u062d\u0645\u062f \u0627\u0644\u0635\u0627\u0644\u062d' },
      { id:'FILE-006', name:'\u0635\u0648\u0631 \u0627\u0644\u0645\u0648\u0642\u0639 - \u0632\u064a\u0627\u0631\u0629 \u0645\u0627\u0631\u0633.zip', size:15728640, type:'zip', folder:'photos', project:'\u0641\u064a\u0644\u0627 \u0627\u0644\u0633\u0627\u0644\u0645\u064a\u0629 \u0627\u0644\u0641\u0627\u062e\u0631\u0629', notes:'\u062d\u0632\u0645\u0629 \u0635\u0648\u0631 \u0627\u0644\u0632\u064a\u0627\u0631\u0629 \u0627\u0644\u0645\u064a\u062f\u0627\u0646\u064a\u0629 - \u0645\u0627\u0631\u0633 2026', url:null, uploadedAt:'2026-03-15T16:00:00Z', uploadedBy:'\u0645. \u0633\u0627\u0631\u0629 \u0627\u0644\u062e\u0627\u0644\u062f' },
      { id:'FILE-007', name:'\u0639\u0642\u062f \u0639\u0645\u0627\u0631\u0629 \u062d\u0648\u0644\u064a.pdf', size:1835008, type:'pdf', folder:'contracts', project:'\u0639\u0645\u0627\u0631\u0629 \u062d\u0648\u0644\u064a \u0627\u0644\u062a\u062c\u0627\u0631\u064a\u0629', notes:'\u0627\u0644\u0639\u0642\u062f \u0627\u0644\u0627\u0633\u062a\u0634\u0627\u0631\u064a \u0627\u0644\u0645\u0648\u0642\u0651\u0639', url:null, uploadedAt:'2026-04-03T10:00:00Z', uploadedBy:'\u0631\u064a\u0645 \u0627\u0644\u0639\u0628\u062f\u0627\u0644\u0644\u0647' },
      { id:'FILE-008', name:'\u0645\u062e\u0637\u0637 \u0645\u0628\u062f\u0626\u064a - \u062d\u0648\u0644\u064a.dwg', size:4194304, type:'dwg', folder:'drawings', project:'\u0639\u0645\u0627\u0631\u0629 \u062d\u0648\u0644\u064a \u0627\u0644\u062a\u062c\u0627\u0631\u064a\u0629', notes:'\u0627\u0644\u0645\u062e\u0637\u0637 \u0627\u0644\u0645\u0628\u062f\u0626\u064a \u0644\u0644\u0645\u0634\u0631\u0648\u0639', url:null, uploadedAt:'2026-04-10T13:45:00Z', uploadedBy:'\u0645. \u0623\u062d\u0645\u062f \u0627\u0644\u0628\u0646\u062f\u0631' },
      { id:'FILE-009', name:'\u062a\u0642\u0631\u064a\u0631 \u0641\u062d\u0635 \u0627\u0644\u062a\u0631\u0628\u0629.pdf', size:786432, type:'pdf', folder:'other', project:'\u0639\u0645\u0627\u0631\u0629 \u062d\u0648\u0644\u064a \u0627\u0644\u062a\u062c\u0627\u0631\u064a\u0629', notes:'\u0646\u062a\u0627\u0626\u062c \u0641\u062d\u0635 \u0627\u0644\u062a\u0631\u0628\u0629 \u0627\u0644\u062c\u064a\u0648\u062a\u0642\u0646\u064a\u0629', url:null, uploadedAt:'2026-04-15T09:30:00Z', uploadedBy:'\u0645\u062e\u062a\u0628\u0631 \u0627\u0644\u0643\u0648\u064a\u062a' },
      { id:'FILE-010', name:'\u062d\u0633\u0627\u0628\u0627\u062a \u0625\u0646\u0634\u0627\u0626\u064a\u0629 - \u0627\u0644\u0633\u0627\u0644\u0645\u064a\u0629.xls', size:2097152, type:'xls', folder:'drawings', project:'\u0641\u064a\u0644\u0627 \u0627\u0644\u0633\u0627\u0644\u0645\u064a\u0629 \u0627\u0644\u0641\u0627\u062e\u0631\u0629', notes:'\u062c\u062f\u0627\u0648\u0644 \u0627\u0644\u062d\u0633\u0627\u0628\u0627\u062a \u0627\u0644\u0625\u0646\u0634\u0627\u0626\u064a\u0629 \u0648\u0627\u0644\u0623\u062d\u0645\u0627\u0644', url:null, uploadedAt:'2026-03-18T12:00:00Z', uploadedBy:'\u0645. \u0633\u0627\u0631\u0629 \u0627\u0644\u062e\u0627\u0644\u062f' },
    ];
    this.save();
  },

  save() {
    localStorage.setItem(this._LS_KEY, JSON.stringify(this.files));
  },

  render() {
    this.init();
    const pg = document.getElementById('p-file_manager');
    if (!pg) return;

    const folders = [
      { id:'all',       label:'الكل',            icon:'📁', count: this.files.length },
      { id:'contracts', label:'العقود',          icon:'📄', count: this.files.filter(f=>f.folder==='contracts').length },
      { id:'drawings',  label:'المخططات',        icon:'📐', count: this.files.filter(f=>f.folder==='drawings').length },
      { id:'permits',   label:'التراخيص',        icon:'🏛️', count: this.files.filter(f=>f.folder==='permits').length },
      { id:'invoices',  label:'الفواتير',         icon:'🧾', count: this.files.filter(f=>f.folder==='invoices').length },
      { id:'photos',    label:'صور الموقع',      icon:'📸', count: this.files.filter(f=>f.folder==='photos').length },
      { id:'other',     label:'أخرى',            icon:'📎', count: this.files.filter(f=>f.folder==='other').length },
    ];

    let filtered = this.activeFolder === 'all' ? this.files : this.files.filter(f => f.folder === this.activeFolder);
    if (this._search) {
      const s = this._search.toLowerCase();
      filtered = filtered.filter(f => (f.name||'').toLowerCase().includes(s) || (f.notes||'').toLowerCase().includes(s) || (f.project||'').toLowerCase().includes(s));
    }
    const typeIcons = { pdf:'📄', dwg:'📐', doc:'📝', xls:'📊', img:'🖼️', zip:'📦', other:'📎' };

    pg.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px">
      <div>
        <h2 style="font-size:20px;font-weight:900;color:var(--text)">📁 مدير الملفات</h2>
        <p style="font-size:13px;color:var(--text-3);margin-top:4px">رفع وإدارة مستندات المشاريع والعقود</p>
      </div>
      <div style="display:flex;gap:8px">
        <input type="text" placeholder="🔍 بحث..." value="${this._search}" oninput="FileManager._search=this.value;FileManager.render()" style="padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-family:Cairo;font-size:12px;outline:none;width:180px">
        <button class="btn btn-primary" onclick="FileManager.openUploadModal()">📤 رفع ملف</button>
      </div>
    </div>

    <!-- KPIs -->
    <div class="kpi-grid" style="margin-bottom:20px">
      <div class="kpi-card"><div class="kpi-icon blue">📁</div><div class="kpi-body"><div class="kpi-label">إجمالي الملفات</div><div class="kpi-value">${this.files.length}</div></div></div>
      <div class="kpi-card"><div class="kpi-icon green">💾</div><div class="kpi-body"><div class="kpi-label">الحجم الإجمالي</div><div class="kpi-value">${this._formatSize(this.files.reduce((s,f)=>s+(f.size||0),0))}</div></div></div>
      <div class="kpi-card"><div class="kpi-icon orange">📤</div><div class="kpi-body"><div class="kpi-label">آخر رفع</div><div class="kpi-value" style="font-size:14px">${this.files.length ? new Date(this.files[0].uploadedAt).toLocaleDateString('ar-KW') : '—'}</div></div></div>
    </div>

    <div style="display:flex;gap:20px;align-items:flex-start">
      <!-- Folders Sidebar -->
      <div class="card" style="min-width:200px;flex-shrink:0">
        <div class="card-header"><h3 class="card-title">📂 المجلدات</h3></div>
        <div style="padding:8px">
          ${folders.map(f => `
            <div onclick="FileManager.activeFolder='${f.id}';FileManager.render()" style="display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:8px;cursor:pointer;transition:all .15s;${this.activeFolder===f.id?'background:var(--primary-50);color:var(--primary);font-weight:700':'color:var(--text-2)'}" onmouseover="this.style.background=this.style.background||'var(--bg)'" onmouseout="if('${f.id}'!=='${this.activeFolder}')this.style.background=''">
              <span style="font-size:16px">${f.icon}</span>
              <span style="flex:1;font-size:13px">${f.label}</span>
              <span style="font-size:11px;background:var(--divider);padding:2px 8px;border-radius:10px;font-weight:600">${f.count}</span>
            </div>`).join('')}
        </div>
      </div>

      <!-- Files Grid -->
      <div class="card" style="flex:1;min-width:0">
        <div class="card-header"><h3 class="card-title">📋 الملفات (${filtered.length})</h3></div>
        <div class="card-body">
          ${filtered.length === 0 ? '<div style="text-align:center;padding:40px;color:var(--text-3)"><div style="font-size:48px;margin-bottom:12px">📭</div><div>لا توجد ملفات في هذا المجلد</div></div>' : `
          <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px">
            ${filtered.map((f,i) => `
            <div style="border:1px solid var(--border);border-radius:10px;padding:16px;background:var(--bg);transition:all .2s;cursor:pointer" onmouseover="this.style.borderColor='var(--primary)';this.style.boxShadow='var(--sh-md)'" onmouseout="this.style.borderColor='var(--border)';this.style.boxShadow='none'">
              <div style="font-size:32px;text-align:center;margin-bottom:10px">${typeIcons[f.type]||typeIcons.other}</div>
              <div style="font-size:13px;font-weight:700;color:var(--text);text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis" title="${f.name}">${f.name}</div>
              <div style="font-size:11px;color:var(--text-3);text-align:center;margin-top:4px">${this._formatSize(f.size)} • ${f.folder || 'أخرى'}</div>
              <div style="font-size:10px;color:var(--text-4);text-align:center;margin-top:2px">رفع: ${new Date(f.uploadedAt).toLocaleDateString('ar-KW')}</div>
              <div style="display:flex;gap:6px;justify-content:center;margin-top:10px">
                ${f.url ? `<a href="${f.url}" target="_blank" class="btn btn-xs btn-outline" style="text-decoration:none">📥 تحميل</a>` : ''}
                <button class="btn btn-xs btn-danger" onclick="event.stopPropagation();FileManager.deleteFile(${i})">🗑️</button>
              </div>
            </div>`).join('')}
          </div>`}
        </div>
      </div>
    </div>`;
  },

  openUploadModal() {
    const projects = (window.DATA?.projects || []).map(p => `<option value="${p.name}">${p.name}</option>`).join('');
    ERP.openModal('📤 رفع ملف جديد', `
      <div style="display:grid;gap:14px;direction:rtl">
        <div style="border:2px dashed var(--border);border-radius:12px;padding:32px;text-align:center;background:var(--bg);cursor:pointer;transition:all .2s" id="fm-dropzone" onclick="document.getElementById('fm-file-input').click()" onmouseover="this.style.borderColor='var(--primary)'" onmouseout="this.style.borderColor='var(--border)'">
          <div style="font-size:48px;margin-bottom:12px">📁</div>
          <div style="font-size:14px;font-weight:700;color:var(--text)">اضغط هنا أو اسحب الملف</div>
          <div style="font-size:12px;color:var(--text-3);margin-top:6px">PDF, DWG, DOC, XLS, JPG, PNG, ZIP — حد أقصى 50MB</div>
          <input type="file" id="fm-file-input" style="display:none" onchange="FileManager._handleFileSelect(this)" accept=".pdf,.dwg,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip,.rar">
        </div>
        <div id="fm-file-preview" style="display:none;padding:12px;background:var(--success-50);border-radius:8px;font-size:13px;color:var(--success)"></div>
        <div class="grid-2">
          <div><label style="font-size:12px;font-weight:700;color:var(--text-3)">المجلد</label>
            <select id="fm-folder" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;font-family:Cairo;font-size:13px;margin-top:4px">
              <option value="contracts">📄 العقود</option><option value="drawings">📐 المخططات</option>
              <option value="permits">🏛️ التراخيص</option><option value="invoices">🧾 الفواتير</option>
              <option value="photos">📸 صور الموقع</option><option value="other">📎 أخرى</option>
            </select></div>
          <div><label style="font-size:12px;font-weight:700;color:var(--text-3)">المشروع (اختياري)</label>
            <select id="fm-project" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;font-family:Cairo;font-size:13px;margin-top:4px">
              <option value="">— كل المشاريع —</option>${projects}
            </select></div>
        </div>
        <div><label style="font-size:12px;font-weight:700;color:var(--text-3)">ملاحظات</label>
          <input type="text" id="fm-notes" placeholder="وصف مختصر للملف..." style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;font-family:Cairo;font-size:13px;margin-top:4px"></div>
      </div>
    `, `<button class="btn btn-primary" onclick="FileManager.uploadFile()">📤 رفع وحفظ</button>
        <button class="btn btn-secondary" onclick="ERP.closeModal()">إلغاء</button>`);
  },

  _selectedFile: null,
  _handleFileSelect(input) {
    const file = input.files[0];
    if (!file) return;
    if (file.size > 50 * 1024 * 1024) { toast('❌ حجم الملف أكبر من 50MB', 'error'); return; }
    this._selectedFile = file;
    const preview = document.getElementById('fm-file-preview');
    if (preview) {
      preview.style.display = 'block';
      preview.innerHTML = `✅ تم اختيار: <strong>${file.name}</strong> (${this._formatSize(file.size)})`;
    }
  },

  async uploadFile() {
    if (!this._selectedFile) { toast('يرجى اختيار ملف أولاً', 'error'); return; }
    
    const file = this._selectedFile;
    const folder = document.getElementById('fm-folder')?.value || 'other';
    const project = document.getElementById('fm-project')?.value || '';
    const notes = document.getElementById('fm-notes')?.value || '';
    const ext = file.name.split('.').pop().toLowerCase();
    const typeMap = { pdf:'pdf', dwg:'dwg', doc:'doc', docx:'doc', xls:'xls', xlsx:'xls', jpg:'img', jpeg:'img', png:'img', zip:'zip', rar:'zip' };

    // Try Supabase Storage upload
    let url = null;
    try {
      const sb = window.getSB ? window.getSB() : null;
      if (sb) {
        const path = `${folder}/${Date.now()}_${file.name}`;
        const { data, error } = await sb.storage.from(this._BUCKET).upload(path, file, { upsert: true });
        if (!error && data) {
          const { data: urlData } = sb.storage.from(this._BUCKET).getPublicUrl(path);
          url = urlData?.publicUrl || null;
        }
      }
    } catch(e) { console.warn('[FileManager] Supabase upload skipped:', e.message); }

    // If no Supabase, create blob URL for local preview
    if (!url) {
      url = URL.createObjectURL(file);
    }

    this.files.unshift({
      id: 'FILE-' + Date.now(),
      name: file.name,
      size: file.size,
      type: typeMap[ext] || 'other',
      folder,
      project,
      notes,
      url,
      uploadedAt: new Date().toISOString(),
      uploadedBy: DATA.user?.name || 'مستخدم'
    });

    this.save();
    this._selectedFile = null;
    ERP.closeModal();
    toast('✅ تم رفع الملف بنجاح');
    this.render();
  },

  deleteFile(idx) {
    if (!confirm('هل تريد حذف هذا الملف؟')) return;
    this.files.splice(idx, 1);
    this.save();
    toast('🗑️ تم حذف الملف');
    this.render();
  },

  _formatSize(bytes) {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }
};
