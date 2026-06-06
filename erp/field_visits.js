/* ═══════════════════════════════════════════════════════
   MEMAR ERP — Field Visits Module (الزيارات الميدانية)
   GPS-enabled site visit tracking for engineering projects
   Version: 2.0.0 — Enhanced with search, edit, photos
═══════════════════════════════════════════════════════ */

window.FieldVisits = {
  visits: [],
  _LS_KEY: 'memar_field_visits',
  _filter: 'all',
  _search: '',

  init() {
    try { this.visits = JSON.parse(localStorage.getItem(this._LS_KEY) || '[]'); } catch(e) { this.visits = []; }
    if (this.visits.length === 0) this._seedDemo();
  },

  _seedDemo() {
    this.visits = [
      { id:'FV-001', project:'فيلا السالمية الفاخرة', engineer:'م. سارة الخالد', date:'2026-05-04', time:'09:30', status:'completed', lat:29.3375, lng:48.0750, notes:'تم معاينة أعمال الحفر والتأكد من مطابقة المخططات الإنشائية. التربة مستقرة ولا حاجة لأعمال تدعيم إضافية.', photos:[], createdAt:'2026-05-04T09:30:00Z', createdBy:'م. سارة الخالد', completedAt:'2026-05-04T12:00:00Z' },
      { id:'FV-002', project:'عمارة حولي التجارية', engineer:'م. أحمد البندر', date:'2026-05-03', time:'11:00', status:'completed', lat:29.3327, lng:48.0237, notes:'زيارة تفقدية لموقع المشروع. تم التأكد من حدود الأرض ومواقع الخدمات (كهرباء، ماء، صرف).', photos:[], createdAt:'2026-05-03T11:00:00Z', createdBy:'م. أحمد البندر', completedAt:'2026-05-03T14:30:00Z' },
      { id:'FV-003', project:'فيلا السالمية الفاخرة', engineer:'م. سارة الخالد', date:'2026-05-05', time:'10:00', status:'in_progress', lat:29.3375, lng:48.0750, notes:'متابعة أعمال صب الأساسات. جاري التأكد من جودة الخرسانة ونسب الخلط.', photos:[], createdAt:'2026-05-05T10:00:00Z', createdBy:'م. سارة الخالد' },
      { id:'FV-004', project:'عمارة حولي التجارية', engineer:'م. خالد الديحاني', date:'2026-05-07', time:'08:30', status:'pending', lat:null, lng:null, notes:'زيارة مجدولة لتسليم نتائج فحص التربة ومناقشة التعديلات مع المقاول.', photos:[], createdAt:'2026-05-02T14:00:00Z', createdBy:'الإدارة' },
      { id:'FV-005', project:'فيلا السالمية الفاخرة', engineer:'م. سارة الخالد', date:'2026-05-10', time:'09:00', status:'pending', lat:null, lng:null, notes:'زيارة متابعة لأعمال العزل المائي والحراري للأساسات قبل الردم.', photos:[], createdAt:'2026-05-04T16:00:00Z', createdBy:'م. سارة الخالد' },
      { id:'FV-006', project:'عمارة حولي التجارية', engineer:'م. أحمد البندر', date:'2026-04-28', time:'14:00', status:'cancelled', lat:29.3327, lng:48.0237, notes:'تم إلغاء الزيارة بسبب ظروف جوية غير مناسبة. سيتم إعادة الجدولة.', photos:[], createdAt:'2026-04-25T10:00:00Z', createdBy:'الإدارة' },
    ];
    this.save();
  },

  save() {
    localStorage.setItem(this._LS_KEY, JSON.stringify(this.visits));
  },

  render() {
    this.init();
    const pg = document.getElementById('p-field_visits');
    if (!pg) return;

    const visits = this.visits;
    const statusMap = { pending: { label:'مجدولة', cls:'badge-blue' }, in_progress: { label:'جارية', cls:'badge-orange' }, completed: { label:'مكتملة', cls:'badge-green' }, cancelled: { label:'ملغاة', cls:'badge-red' }};

    // Apply filters
    let filtered = visits;
    if (this._filter !== 'all') filtered = filtered.filter(v => v.status === this._filter);
    if (this._search) {
      const s = this._search.toLowerCase();
      filtered = filtered.filter(v => (v.project||'').toLowerCase().includes(s) || (v.engineer||'').toLowerCase().includes(s) || (v.notes||'').toLowerCase().includes(s));
    }

    pg.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px">
      <div>
        <h2 style="font-size:20px;font-weight:900;color:var(--text)">📍 الزيارات الميدانية</h2>
        <p style="font-size:13px;color:var(--text-3);margin-top:4px">🏗️ تتبع زيارات المواقع والمشاريع مع تحديد الموقع الجغرافي</p>
      </div>
      <button class="btn btn-primary" onclick="FieldVisits.openVisitModal()">➕ زيارة جديدة</button>
    </div>

    <!-- KPIs -->
    <div class="kpi-grid" style="margin-bottom:20px">
      <div class="kpi-card"><div class="kpi-icon blue">📍</div><div class="kpi-body"><div class="kpi-label">إجمالي الزيارات</div><div class="kpi-value">${visits.length}</div></div></div>
      <div class="kpi-card"><div class="kpi-icon green">✅</div><div class="kpi-body"><div class="kpi-label">مكتملة</div><div class="kpi-value">${visits.filter(v=>v.status==='completed').length}</div></div></div>
      <div class="kpi-card"><div class="kpi-icon orange">🔄</div><div class="kpi-body"><div class="kpi-label">جارية</div><div class="kpi-value">${visits.filter(v=>v.status==='in_progress').length}</div></div></div>
      <div class="kpi-card"><div class="kpi-icon purple">📅</div><div class="kpi-body"><div class="kpi-label">مجدولة</div><div class="kpi-value">${visits.filter(v=>v.status==='pending').length}</div></div></div>
    </div>

    <!-- Search & Filter Bar -->
    <div class="card" style="margin-bottom:16px;padding:14px 16px">
      <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:center">
        <input type="text" id="fv-search" placeholder="🔍 بحث بالمشروع أو المهندس..." value="${this._search}" oninput="FieldVisits._search=this.value;FieldVisits.render()" style="flex:1;min-width:200px;padding:8px 12px;border:1px solid var(--border);border-radius:8px;font-family:Cairo;font-size:12px;outline:none">
        ${['all','pending','in_progress','completed','cancelled'].map(s => {
          const lbl = s==='all'?'الكل':statusMap[s].label;
          const cnt = s==='all'?visits.length:visits.filter(v=>v.status===s).length;
          return `<button onclick="FieldVisits._filter='${s}';FieldVisits.render()" style="padding:6px 12px;border-radius:8px;border:1px solid ${this._filter===s?'var(--primary)':'var(--border)'};background:${this._filter===s?'var(--primary-50)':'#fff'};color:${this._filter===s?'var(--primary)':'var(--text-2)'};font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">${lbl} (${cnt})</button>`;
        }).join('')}
      </div>
    </div>

    <!-- Visits Table -->
    <div class="card">
      <div class="card-header"><h3 class="card-title">🗂️ سجل الزيارات (${filtered.length})</h3></div>
      <div class="card-body">
        ${filtered.length === 0 ? '<div style="text-align:center;padding:40px;color:var(--text-3)"><div style="font-size:48px;margin-bottom:12px">📍</div><div style="font-size:15px;font-weight:700">لا توجد زيارات مطابقة</div></div>' : `
        <div class="table-wrap">
          <table>
            <thead><tr>
              <th>#</th><th>المشروع</th><th>المهندس</th><th>التاريخ</th><th>الوقت</th><th>الموقع</th><th>📸</th><th>الحالة</th><th>إجراءات</th>
            </tr></thead>
            <tbody>
              ${filtered.map((v, i) => {
                const origIdx = visits.indexOf(v);
                const photoCount = (v.photos || []).length;
                return `<tr>
                <td class="td-bold">${i+1}</td>
                <td class="td-bold">${v.project || '—'}</td>
                <td>${v.engineer || '—'}</td>
                <td>${v.date || '—'}</td>
                <td>${v.time || '—'}</td>
                <td>${v.lat ? `<a href="https://maps.google.com/?q=${v.lat},${v.lng}" target="_blank" style="color:var(--primary);text-decoration:none">📍 خريطة</a>` : '—'}</td>
                <td style="text-align:center">${photoCount ? `<span class="badge badge-blue" style="cursor:pointer" onclick="FieldVisits.viewPhotos(${origIdx})">${photoCount} 📸</span>` : '—'}</td>
                <td><span class="badge ${(statusMap[v.status]||statusMap.pending).cls}">${(statusMap[v.status]||statusMap.pending).label}</span></td>
                <td>
                  <div style="display:flex;gap:4px">
                    <button class="btn btn-xs btn-ghost" onclick="FieldVisits.viewDetails(${origIdx})" title="عرض">👁️</button>
                    <button class="btn btn-xs btn-ghost" onclick="FieldVisits.openVisitModal(${origIdx})" title="تعديل">✏️</button>
                    <select onchange="FieldVisits.changeStatus(${origIdx},this.value);this.value=''" style="padding:2px 4px;border:1px solid var(--border);border-radius:4px;font-size:10px;font-family:inherit;width:50px">
                      <option value="">⚡</option>
                      <option value="pending">مجدولة</option>
                      <option value="in_progress">جارية</option>
                      <option value="completed">مكتملة</option>
                      <option value="cancelled">ملغاة</option>
                    </select>
                    <button class="btn btn-xs btn-danger" onclick="FieldVisits.deleteVisit(${origIdx})" title="حذف">🗑️</button>
                  </div>
                </td>
              </tr>`;}).join('')}
            </tbody>
          </table>
        </div>`}
      </div>
    </div>`;
  },

  openVisitModal(idx) {
    const isEdit = idx !== undefined && idx !== null;
    const v = isEdit ? this.visits[idx] : { project:'', engineer:'', date:new Date().toISOString().split('T')[0], time:new Date().toTimeString().slice(0,5), notes:'', lat:null, lng:null, photos:[] };
    const projects = (window.DATA?.projects || []).map(p => `<option value="${p.name}" ${v.project===p.name?'selected':''}>${p.name}</option>`).join('');
    const engineers = (window.DATA?.employees || []).filter(e => (e.role||'').includes('مهندس')).map(e => `<option value="${e.name}" ${v.engineer===e.name?'selected':''}>${e.name}</option>`).join('');
    
    ERP.openModal(isEdit ? '✏️ تعديل زيارة' : '📍 زيارة ميدانية جديدة', `
      <div style="display:grid;gap:14px;direction:rtl">
        <div><label style="font-size:12px;font-weight:700;color:var(--text-3)">المشروع</label>
          <select id="fv-project" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;font-family:Cairo;font-size:13px;margin-top:4px">
            <option value="">— اختر المشروع —</option>${projects}
          </select></div>
        <div><label style="font-size:12px;font-weight:700;color:var(--text-3)">المهندس المسؤول</label>
          <select id="fv-engineer" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;font-family:Cairo;font-size:13px;margin-top:4px">
            <option value="">— اختر المهندس —</option>${engineers}
            <option value="other" ${v.engineer&&!engineers.includes(v.engineer)?'selected':''}>أخرى</option>
          </select></div>
        <div class="grid-2">
          <div><label style="font-size:12px;font-weight:700;color:var(--text-3)">التاريخ</label>
            <input type="date" id="fv-date" value="${v.date}" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;font-family:Cairo;font-size:13px;margin-top:4px"></div>
          <div><label style="font-size:12px;font-weight:700;color:var(--text-3)">الوقت</label>
            <input type="time" id="fv-time" value="${v.time||''}" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;font-family:Cairo;font-size:13px;margin-top:4px"></div>
        </div>
        <div>
          <label style="font-size:12px;font-weight:700;color:var(--text-3)">📍 الموقع الجغرافي</label>
          <div id="fv-location-status" style="margin-top:6px;padding:12px;background:var(--bg);border-radius:8px;font-size:12px;color:var(--text-3);text-align:center">
            ${v.lat ? `<span style="color:var(--success)">✅ ${v.lat.toFixed(6)}, ${v.lng.toFixed(6)}</span>` : `<button class="btn btn-sm btn-outline" onclick="FieldVisits.captureGPS()">📡 تحديد موقعي الحالي</button>`}
          </div>
          <input type="hidden" id="fv-lat" value="${v.lat||''}"><input type="hidden" id="fv-lng" value="${v.lng||''}">
        </div>
        <div>
          <label style="font-size:12px;font-weight:700;color:var(--text-3)">📸 صور الموقع</label>
          <div style="border:2px dashed var(--border);border-radius:10px;padding:16px;text-align:center;cursor:pointer;margin-top:6px;position:relative" onclick="document.getElementById('fv-photos-input').click()">
            <div style="font-size:24px">📸</div>
            <div style="font-size:12px;color:var(--text-3);font-weight:600">اضغط لاختيار صور (يمكنك اختيار أكثر من صورة)</div>
            <input type="file" id="fv-photos-input" style="display:none" accept="image/*" multiple onchange="FieldVisits._previewPhotos(this)">
          </div>
          <div id="fv-photos-preview" style="display:flex;gap:8px;flex-wrap:wrap;margin-top:8px">
            ${(v.photos||[]).map((p,pi) => `<div style="width:60px;height:60px;border-radius:6px;background:#f0f0f0;overflow:hidden;position:relative"><img src="${p}" style="width:100%;height:100%;object-fit:cover"><div onclick="event.stopPropagation();FieldVisits._removePreviewPhoto(${pi})" style="position:absolute;top:2px;right:2px;width:16px;height:16px;background:#dc2626;color:#fff;border-radius:50%;font-size:10px;cursor:pointer;display:flex;align-items:center;justify-content:center">✕</div></div>`).join('')}
          </div>
        </div>
        <div><label style="font-size:12px;font-weight:700;color:var(--text-3)">ملاحظات</label>
          <textarea id="fv-notes" rows="3" placeholder="وصف الزيارة وملاحظات الموقع..." style="width:100%;padding:10px;border:1px solid var(--border);border-radius:8px;font-family:Cairo;font-size:13px;margin-top:4px;resize:vertical">${v.notes||''}</textarea></div>
      </div>
    `, `<button class="btn btn-primary" onclick="FieldVisits.saveVisit(${isEdit?idx:'null'})">${isEdit?'💾 حفظ التعديلات':'💾 حفظ الزيارة'}</button>
        <button class="btn btn-secondary" onclick="ERP.closeModal()">إلغاء</button>`);
    
    // Store existing photos for edit mode
    this._editPhotos = [...(v.photos||[])];
    this._newPhotos = [];
  },

  _editPhotos: [],
  _newPhotos: [],

  _previewPhotos(input) {
    const container = document.getElementById('fv-photos-preview');
    Array.from(input.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (e) => {
        this._newPhotos.push(e.target.result);
        const div = document.createElement('div');
        div.style.cssText = 'width:60px;height:60px;border-radius:6px;background:#f0f0f0;overflow:hidden';
        div.innerHTML = `<img src="${e.target.result}" style="width:100%;height:100%;object-fit:cover">`;
        container.appendChild(div);
      };
      reader.readAsDataURL(file);
    });
  },

  _removePreviewPhoto(idx) {
    this._editPhotos.splice(idx, 1);
    // Re-render modal would be complex, just hide visually
    const preview = document.getElementById('fv-photos-preview');
    if (preview && preview.children[idx]) preview.children[idx].style.display = 'none';
  },

  captureGPS() {
    const statusEl = document.getElementById('fv-location-status');
    if (!navigator.geolocation) {
      statusEl.innerHTML = '<span style="color:var(--danger)">❌ المتصفح لا يدعم تحديد الموقع</span>';
      return;
    }
    statusEl.innerHTML = '<span style="color:var(--primary)">📡 جاري تحديد الموقع...</span>';
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        document.getElementById('fv-lat').value = pos.coords.latitude;
        document.getElementById('fv-lng').value = pos.coords.longitude;
        statusEl.innerHTML = `<span style="color:var(--success)">✅ تم التحديد: ${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}</span>
          <a href="https://maps.google.com/?q=${pos.coords.latitude},${pos.coords.longitude}" target="_blank" style="display:block;margin-top:6px;font-size:11px;color:var(--primary)">🗺️ عرض على الخريطة</a>`;
      },
      (err) => {
        statusEl.innerHTML = `<span style="color:var(--danger)">❌ فشل التحديد: ${err.message}</span>`;
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  },

  saveVisit(editIdx) {
    const project = document.getElementById('fv-project')?.value;
    const engineer = document.getElementById('fv-engineer')?.value;
    const date = document.getElementById('fv-date')?.value;
    const time = document.getElementById('fv-time')?.value;
    const notes = document.getElementById('fv-notes')?.value;
    const lat = parseFloat(document.getElementById('fv-lat')?.value) || null;
    const lng = parseFloat(document.getElementById('fv-lng')?.value) || null;

    if (!project) { toast('يرجى اختيار المشروع', 'error'); return; }
    if (!date) { toast('يرجى تحديد التاريخ', 'error'); return; }

    const photos = [...this._editPhotos, ...this._newPhotos];

    if (editIdx !== null && editIdx !== undefined) {
      // Edit existing
      const v = this.visits[editIdx];
      v.project = project; v.engineer = engineer; v.date = date;
      v.time = time; v.notes = notes; v.lat = lat; v.lng = lng;
      v.photos = photos;
      v.updatedAt = new Date().toISOString();
      v.updatedBy = DATA.user?.name || 'مستخدم';
    } else {
      // New visit
      this.visits.unshift({
        id: 'FV-' + Date.now(),
        project, engineer, date, time, notes, lat, lng, photos,
        status: 'pending',
        createdAt: new Date().toISOString(),
        createdBy: DATA.user?.name || 'مستخدم'
      });
    }

    this.save();
    ERP.closeModal();
    toast(editIdx !== null ? '✅ تم تحديث الزيارة' : '✅ تم إضافة الزيارة الميدانية بنجاح');
    this.render();
    if (window.MemarNotify) MemarNotify.send('field_visit', { project, engineer, date, time });
  },

  changeStatus(idx, status) {
    if (!status) return;
    if (this.visits[idx]) {
      this.visits[idx].status = status;
      if (status === 'completed') this.visits[idx].completedAt = new Date().toISOString();
      this.save();
      toast('✅ تم تحديث الحالة');
      this.render();
    }
  },

  viewDetails(idx) {
    const v = this.visits[idx];
    if (!v) return;
    const statusMap = { pending:'مجدولة', in_progress:'جارية', completed:'مكتملة', cancelled:'ملغاة' };
    const photosHTML = (v.photos||[]).length ? `<div style="margin-top:12px"><div style="font-size:12px;font-weight:700;color:var(--text-3);margin-bottom:8px">📸 صور الموقع (${v.photos.length})</div><div style="display:flex;gap:8px;flex-wrap:wrap">${v.photos.map(p => `<img src="${p}" style="width:100px;height:80px;object-fit:cover;border-radius:8px;border:1px solid var(--border);cursor:pointer" onclick="window.open('${p}','_blank')">`).join('')}</div></div>` : '';
    
    ERP.openModal('📍 تفاصيل الزيارة', `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px;direction:rtl">
        <div><strong style="color:var(--text-3);font-size:11px">المشروع</strong><div style="font-weight:700">${v.project||'—'}</div></div>
        <div><strong style="color:var(--text-3);font-size:11px">المهندس</strong><div>${v.engineer||'—'}</div></div>
        <div><strong style="color:var(--text-3);font-size:11px">التاريخ</strong><div>${v.date||'—'}</div></div>
        <div><strong style="color:var(--text-3);font-size:11px">الوقت</strong><div>${v.time||'—'}</div></div>
        <div><strong style="color:var(--text-3);font-size:11px">الحالة</strong><div>${statusMap[v.status]||'—'}</div></div>
        <div><strong style="color:var(--text-3);font-size:11px">الموقع</strong><div>${v.lat ? `<a href="https://maps.google.com/?q=${v.lat},${v.lng}" target="_blank" style="color:var(--primary)">📍 عرض الخريطة</a>` : '—'}</div></div>
        <div style="grid-column:1/span 2"><strong style="color:var(--text-3);font-size:11px">ملاحظات</strong><div style="background:var(--bg);padding:10px;border-radius:8px;line-height:1.7">${v.notes||'لا توجد ملاحظات'}</div></div>
      </div>
      ${photosHTML}
      <div style="margin-top:12px;font-size:10px;color:var(--text-4)">أُنشئت: ${new Date(v.createdAt).toLocaleString('ar-KW')} بواسطة ${v.createdBy||'—'}${v.updatedAt ? ' | آخر تعديل: '+new Date(v.updatedAt).toLocaleString('ar-KW') : ''}</div>
    `);
  },

  viewPhotos(idx) {
    const v = this.visits[idx];
    if (!v || !v.photos?.length) return;
    ERP.openModal(`📸 صور الزيارة — ${v.project}`, `
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:12px">
        ${v.photos.map(p => `<img src="${p}" style="width:100%;height:150px;object-fit:cover;border-radius:10px;border:1px solid var(--border);cursor:pointer" onclick="window.open('${p}','_blank')">`).join('')}
      </div>
    `);
  },

  markComplete(idx) {
    if (this.visits[idx]) {
      this.visits[idx].status = 'completed';
      this.visits[idx].completedAt = new Date().toISOString();
      this.save();
      toast('✅ تم إكمال الزيارة');
      this.render();
    }
  },

  deleteVisit(idx) {
    if (confirm('هل تريد حذف هذه الزيارة؟')) {
      this.visits.splice(idx, 1);
      this.save();
      toast('🗑️ تم حذف الزيارة');
      this.render();
    }
  }
};
