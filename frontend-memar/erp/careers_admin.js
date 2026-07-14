/* ═══════════════════════════════════════════════════
   MEMAR ERP — Careers Admin Module
   ═══════════════════════════════════════════════════ */
window.CareersAdmin = {
  getJobs() {
    try { return JSON.parse(localStorage.getItem('memar_careers_jobs') || '[]'); } catch(e) { return []; }
  },
  saveJobs(jobs) { localStorage.setItem('memar_careers_jobs', JSON.stringify(jobs)); },
  getApps() {
    try { return JSON.parse(localStorage.getItem('memar_job_applications') || '[]'); } catch(e) { return []; }
  },
  saveApps(apps) { localStorage.setItem('memar_job_applications', JSON.stringify(apps)); },

  _tab: 'apps', // 'apps' or 'jobs'
  _filter: 'all',

  render() {
    const p = document.getElementById('p-careers');
    if (!p) return;
    const apps = this.getApps();
    const jobs = this.getJobs();
    const newCount = apps.filter(a => a.status === 'new').length;

    p.innerHTML = `
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;flex-wrap:wrap;gap:12px">
        <div>
          <h2 style="font-size:22px;font-weight:800;margin-bottom:4px">💼 إدارة التوظيف</h2>
          <p style="font-size:12px;color:var(--text-3)">إدارة الوظائف المتاحة ومراجعة طلبات المتقدمين</p>
        </div>
        <div style="display:flex;gap:8px">
          <button class="btn ${this._tab==='apps'?'btn-primary':'btn-outline'}" onclick="CareersAdmin._tab='apps';CareersAdmin.render()" style="font-size:12px;padding:8px 16px">📋 الطلبات ${newCount?'<span style=\"background:#dc2626;color:#fff;padding:2px 6px;border-radius:10px;font-size:10px;margin-right:4px\">'+newCount+'</span>':''}</button>
          <button class="btn ${this._tab==='jobs'?'btn-primary':'btn-outline'}" onclick="CareersAdmin._tab='jobs';CareersAdmin.render()" style="font-size:12px;padding:8px 16px">🏢 الوظائف (${jobs.length})</button>
        </div>
      </div>
      <div id="careers-content"></div>
    `;

    if (this._tab === 'apps') this.renderApps();
    else this.renderJobs();
  },

  renderApps() {
    const c = document.getElementById('careers-content');
    let apps = this.getApps().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    const f = this._filter;
    if (f !== 'all') apps = apps.filter(a => a.status === f);

    const statusMap = { new: { l: 'جديد', c: '#3b82f6', bg: '#dbeafe' }, reviewing: { l: 'قيد المراجعة', c: '#d97706', bg: '#fef3c7' }, accepted: { l: 'مقبول', c: '#16a34a', bg: '#dcfce7' }, rejected: { l: 'مرفوض', c: '#dc2626', bg: '#fee2e2' } };

    c.innerHTML = `
      <div style="display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap">
        ${['all','new','reviewing','accepted','rejected'].map(s => {
          const lbl = s === 'all' ? 'الكل' : statusMap[s].l;
          const cnt = s === 'all' ? this.getApps().length : this.getApps().filter(a => a.status === s).length;
          return `<button onclick="CareersAdmin._filter='${s}';CareersAdmin.renderApps()" style="padding:6px 14px;border-radius:8px;border:1px solid ${this._filter===s?'var(--primary)':'var(--border)'};background:${this._filter===s?'var(--primary-50)':'#fff'};color:${this._filter===s?'var(--primary)':'var(--text-2)'};font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">${lbl} (${cnt})</button>`;
        }).join('')}
      </div>
      ${!apps.length ? '<div style="text-align:center;padding:40px;color:var(--text-3)">لا توجد طلبات</div>' : `
        <div style="background:#fff;border:1px solid var(--border);border-radius:12px;overflow:hidden">
          <table style="width:100%;border-collapse:collapse;font-size:12px">
            <thead><tr style="background:var(--bg);border-bottom:1px solid var(--border)">
              <th style="padding:10px 14px;text-align:right;font-weight:700">المتقدم</th>
              <th style="padding:10px 14px;text-align:right;font-weight:700">الوظيفة</th>
              <th style="padding:10px 14px;text-align:right;font-weight:700">الخبرة</th>
              <th style="padding:10px 14px;text-align:right;font-weight:700">الحالة</th>
              <th style="padding:10px 14px;text-align:right;font-weight:700">التاريخ</th>
              <th style="padding:10px 14px;text-align:center;font-weight:700">إجراءات</th>
            </tr></thead>
            <tbody>
              ${apps.map(a => {
                const st = statusMap[a.status] || statusMap.new;
                const d = new Date(a.created_at);
                return `<tr style="border-bottom:1px solid var(--divider)">
                  <td style="padding:10px 14px"><strong>${a.applicant_name}</strong><br><span style="color:var(--text-3);font-size:11px">${a.phone} ${a.email?'· '+a.email:''}</span></td>
                  <td style="padding:10px 14px">${a.position_applied||'—'}</td>
                  <td style="padding:10px 14px">${a.experience||'—'}</td>
                  <td style="padding:10px 14px"><span style="background:${st.bg};color:${st.c};padding:3px 10px;border-radius:12px;font-size:11px;font-weight:700">${st.l}</span></td>
                  <td style="padding:10px 14px;font-size:11px;color:var(--text-3)">${d.toLocaleDateString('ar-KW')}</td>
                  <td style="padding:10px 14px;text-align:center">
                    <button onclick="CareersAdmin.viewApp('${a.id}')" style="background:none;border:1px solid var(--border);border-radius:6px;padding:4px 8px;cursor:pointer;font-size:11px;margin:0 2px" title="عرض">👁️</button>
                    <select onchange="CareersAdmin.changeStatus('${a.id}',this.value)" style="padding:4px 6px;border:1px solid var(--border);border-radius:6px;font-size:10px;font-family:inherit">
                      <option value="new" ${a.status==='new'?'selected':''}>جديد</option>
                      <option value="reviewing" ${a.status==='reviewing'?'selected':''}>مراجعة</option>
                      <option value="accepted" ${a.status==='accepted'?'selected':''}>مقبول</option>
                      <option value="rejected" ${a.status==='rejected'?'selected':''}>مرفوض</option>
                    </select>
                  </td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>`}
    `;
  },

  changeStatus(id, status) {
    const apps = this.getApps();
    const app = apps.find(a => a.id === id);
    if (app) { app.status = status; this.saveApps(apps); this.renderApps(); }
  },

  viewApp(id) {
    const app = this.getApps().find(a => a.id === id);
    if (!app) return;
    const body = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px;direction:rtl">
        <div><strong style="color:var(--text-3);font-size:11px">الاسم</strong><div style="font-weight:700">${app.applicant_name}</div></div>
        <div><strong style="color:var(--text-3);font-size:11px">الهاتف</strong><div>${app.phone}</div></div>
        <div><strong style="color:var(--text-3);font-size:11px">البريد</strong><div>${app.email||'—'}</div></div>
        <div><strong style="color:var(--text-3);font-size:11px">الوظيفة</strong><div>${app.position_applied||'—'}</div></div>
        <div><strong style="color:var(--text-3);font-size:11px">الخبرة</strong><div>${app.experience||'—'}</div></div>
        <div><strong style="color:var(--text-3);font-size:11px">المهارات</strong><div>${app.skills||'—'}</div></div>
        <div style="grid-column:1/span 2"><strong style="color:var(--text-3);font-size:11px">السيرة الذاتية</strong><div>${app.cv_file||'لم يتم رفع ملف'}</div></div>
        <div style="grid-column:1/span 2"><strong style="color:var(--text-3);font-size:11px">الرسالة</strong><div style="background:var(--bg);padding:10px;border-radius:8px;font-size:12px;line-height:1.7">${app.message||'—'}</div></div>
      </div>
    `;
    if (window.ERP) ERP.openModal('تفاصيل طلب: ' + app.applicant_name, body);
  },

  renderJobs() {
    const c = document.getElementById('careers-content');
    const jobs = this.getJobs();
    const typeMap = { full: 'دوام كامل', part: 'دوام جزئي', contract: 'عقد مؤقت' };
    const locMap = { office: 'في المكتب', remote: 'عن بعد', hybrid: 'هجين' };

    c.innerHTML = `
      <div style="margin-bottom:16px"><button class="btn btn-primary" onclick="CareersAdmin.openJobEditor()" style="font-size:12px;padding:8px 16px">➕ إضافة وظيفة</button></div>
      <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(300px,1fr));gap:14px">
        ${jobs.map(j => `
          <div style="background:#fff;border:1px solid var(--border);border-radius:12px;padding:16px;${j.active?'':'opacity:.6;background:#f8fafc'}">
            <div style="display:flex;justify-content:space-between;align-items:start;margin-bottom:8px">
              <div><div style="font-size:15px;font-weight:800">${j.title}</div><div style="font-size:11px;color:var(--text-3)">${j.dept} · ${typeMap[j.type]||j.type} · ${locMap[j.location]||j.location}</div></div>
              <span style="background:${j.active?'#dcfce7':'#fee2e2'};color:${j.active?'#16a34a':'#dc2626'};padding:3px 8px;border-radius:8px;font-size:10px;font-weight:700">${j.active?'نشطة':'معطلة'}</span>
            </div>
            <div style="font-size:12px;color:var(--text-3);margin-bottom:12px;line-height:1.6">${j.desc}</div>
            <div style="display:flex;gap:6px">
              <button onclick="CareersAdmin.openJobEditor('${j.id}')" style="padding:4px 10px;border:1px solid var(--border);border-radius:6px;background:#fff;cursor:pointer;font-size:11px;font-family:inherit">✏️ تعديل</button>
              <button onclick="CareersAdmin.toggleJob('${j.id}')" style="padding:4px 10px;border:1px solid var(--border);border-radius:6px;background:#fff;cursor:pointer;font-size:11px;font-family:inherit">${j.active?'⏸️ تعطيل':'▶️ تفعيل'}</button>
              <button onclick="CareersAdmin.deleteJob('${j.id}')" style="padding:4px 10px;border:1px solid var(--border);border-radius:6px;background:#fff;cursor:pointer;font-size:11px;font-family:inherit;color:#dc2626">🗑️</button>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  },

  toggleJob(id) {
    const jobs = this.getJobs(); const j = jobs.find(x => x.id === id);
    if (j) { j.active = !j.active; this.saveJobs(jobs); this.render(); }
  },

  deleteJob(id) {
    if (!confirm('حذف هذه الوظيفة؟')) return;
    this.saveJobs(this.getJobs().filter(j => j.id !== id)); this.render();
  },

  openJobEditor(id) {
    const jobs = this.getJobs();
    const j = id ? jobs.find(x => x.id === id) : { id: 'j' + Date.now(), title: '', dept: '', type: 'full', location: 'office', desc: '', active: true };
    const depts = ['التصميم', 'الإنشاء', 'المالية', 'الإدارة', 'المبيعات', 'تقنية المعلومات'];
    const body = `
      <div style="display:flex;flex-direction:column;gap:14px;direction:rtl;font-family:'Cairo',sans-serif">
        <div><label style="font-size:12px;font-weight:700;display:block;margin-bottom:4px">اسم الوظيفة</label><input id="je_title" class="crm-input" value="${j.title}" placeholder="مثال: مهندس معماري"></div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px">
          <div><label style="font-size:12px;font-weight:700;display:block;margin-bottom:4px">القسم</label><select id="je_dept" class="crm-select">${depts.map(d=>'<option'+(j.dept===d?' selected':'')+'>'+d+'</option>').join('')}</select></div>
          <div><label style="font-size:12px;font-weight:700;display:block;margin-bottom:4px">النوع</label><select id="je_type" class="crm-select"><option value="full"${j.type==='full'?' selected':''}>دوام كامل</option><option value="part"${j.type==='part'?' selected':''}>دوام جزئي</option><option value="contract"${j.type==='contract'?' selected':''}>عقد مؤقت</option></select></div>
          <div><label style="font-size:12px;font-weight:700;display:block;margin-bottom:4px">الموقع</label><select id="je_loc" class="crm-select"><option value="office"${j.location==='office'?' selected':''}>في المكتب</option><option value="remote"${j.location==='remote'?' selected':''}>عن بعد</option><option value="hybrid"${j.location==='hybrid'?' selected':''}>هجين</option></select></div>
        </div>
        <div><label style="font-size:12px;font-weight:700;display:block;margin-bottom:4px">الوصف</label><textarea id="je_desc" class="crm-input" style="height:80px;resize:vertical">${j.desc}</textarea></div>
      </div>
    `;
    const footer = `<button class="btn btn-outline" onclick="ERP.closeModal()">إلغاء</button><button class="btn btn-primary" onclick="CareersAdmin.saveJob('${id||''}')">حفظ</button>`;
    ERP.openModal(id ? 'تعديل وظيفة' : 'إضافة وظيفة', body, footer);
  },

  saveJob(idStr) {
    const jobs = this.getJobs();
    const data = {
      id: idStr || 'j' + Date.now(),
      title: document.getElementById('je_title').value.trim(),
      dept: document.getElementById('je_dept').value,
      type: document.getElementById('je_type').value,
      location: document.getElementById('je_loc').value,
      desc: document.getElementById('je_desc').value.trim(),
      active: true
    };
    if (!data.title) { alert('أدخل اسم الوظيفة'); return; }
    if (idStr) { const i = jobs.findIndex(j => j.id === idStr); if (i >= 0) { data.active = jobs[i].active; jobs[i] = data; } }
    else jobs.push(data);
    this.saveJobs(jobs); ERP.closeModal(); this.render();
    if (ERP.toast) ERP.toast('تم حفظ الوظيفة', 'success');
  }
};
