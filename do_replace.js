const fs = require('fs');

const replacement = `  openClientProfile(id) {
    this._activeClient = id;
    this._viewMode = 'profile';
    this._activeProfileTab = 'overview';
    this.render();
  },

  closeClientProfile() {
    this._activeClient = null;
    this._viewMode = 'list';
    this._activeProfileTab = null;
    this.render();
  },
  
  setProfileTab(tabId) {
    this._activeProfileTab = tabId;
    this.render();
  },

  rClientProfile() {
    const allC = this.getAllClients();
    const c = allC.find(x => String(x.id) === String(this._activeClient));
    if (!c) {
      this._viewMode = 'list';
      this._activeClient = null;
      return this.rClients();
    }
    
    const isAdmin = ['admin', 'manager', 'management', 'المدير العام', 'المدير التنفيذي'].includes(window.getCurrentUserRole ? window.getCurrentUserRole() : (window.DATA && window.DATA.user && window.DATA.user.role) || '');
    const projects = (window.ORM && typeof window.ORM.getProjectsByClient === 'function') ? window.ORM.getProjectsByClient(c.id) : [];
    
    const tab = this._activeProfileTab || 'overview';
    
    const tabs = [
       { id: 'overview', icon: '👤', label: 'نظرة عامة' },
       { id: 'projects', icon: '🏗', label: 'المشاريع' },
       { id: 'financials', icon: '💰', label: 'المالية والعقود' },
       { id: 'files', icon: '📁', label: 'الملفات' },
       { id: 'appointments', icon: '⏱', label: 'المواعيد' },
       { id: 'messages', icon: '💬', label: 'الرسائل' }
    ];
    
    if (isAdmin) {
       tabs.push({ id: 'admin', icon: '🔒', label: 'إدارة العميل' });
    }

    let tabNavHtml = \`
      <div style="display:flex; gap:12px; border-bottom:1px solid var(--border); padding-bottom:16px; margin-bottom:24px; overflow-x:auto;">
         \${tabs.map(t => \`
            <button class="btn \${tab === t.id ? 'btn-primary' : 'btn-outline'}" onclick="ClientsPage.setProfileTab('\${t.id}')" style="white-space:nowrap; border-radius:24px; padding:8px 20px; font-weight:bold; transition:all 0.2s; border-color:\${tab===t.id?'transparent':'var(--border)'}; background:\${tab===t.id?'var(--primary)':'#fff'}; color:\${tab===t.id?'#fff':'var(--text-2)'}; box-shadow:\${tab===t.id?'0 4px 12px rgba(79,70,229,0.2)':'none'};">
               <span style="font-size:16px; margin-left:6px;">\${t.icon}</span> \${t.label}
            </button>
         \`).join('')}
      </div>
    \`;

    let contentHtml = '';
    
    if (tab === 'overview') {
       let linkedTeamHtml = '';
       if (c.type === 'company' && c.name) {
          const linked = allC.filter(u => u.company_name === c.name && u.id !== c.id);
          if (linked.length) {
            linkedTeamHtml = \`
              <div class="card" style="margin-top:20px;">
                <h4 style="margin-bottom:16px; font-weight:bold; color:var(--primary); font-size:16px;">الكوادر المرتبطة بالشركة</h4>
                <div style="border-radius:12px; overflow:hidden; border:1px solid var(--border);">
                   <table style="width:100%; text-align:right; border-collapse:collapse;">
                     <thead style="background:var(--bg-1);">
                        <tr>
                          <th style="padding:12px 16px; border-bottom:1px solid var(--border); font-size:12px; color:var(--text-3);">الاسم</th>
                          <th style="padding:12px 16px; border-bottom:1px solid var(--border); font-size:12px; color:var(--text-3);">المنصب</th>
                          <th style="padding:12px 16px; border-bottom:1px solid var(--border); font-size:12px; color:var(--text-3);">التواصل</th>
                        </tr>
                     </thead>
                     <tbody>
                       \${linked.map(l => \`
                          <tr style="transition:background 0.2s; cursor:pointer;" onmouseover="this.style.background='var(--bg-0)'" onmouseout="this.style.background='transparent'">
                            <td style="padding:12px 16px; border-bottom:1px solid var(--border); font-weight:bold; font-size:13px;">\${l.name||'—'}</td>
                            <td style="padding:12px 16px; border-bottom:1px solid var(--border); font-size:13px;"><span class="badge badge-gray">\${l.type === 'employee' ? 'موظف شركة' : l.type === 'collaborator' ? 'متعاون فني' : l.type === 'contractor' ? 'مقاول' : 'فرد'}</span></td>
                            <td style="padding:12px 16px; border-bottom:1px solid var(--border); font-size:13px;" dir="ltr">\${l.phone||'—'}<br><span style="font-size:11px;color:var(--text-3)">\${l.email||''}</span></td>
                          </tr>
                       \`).join('')}
                     </tbody>
                   </table>
                </div>
              </div>
            \`;
          }
       }

       contentHtml = \`
         <div style="display:grid; grid-template-columns: 2fr 1fr; gap: 24px;">
            <div>
               <div class="card" style="margin-bottom:20px; border:none; box-shadow:0 4px 20px rgba(0,0,0,0.03);">
                 <h4 style="margin-bottom:16px; font-weight:bold; font-size:16px;">المعلومات الأساسية</h4>
                 <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px;">
                    <div style="background:var(--bg-1); padding:16px; border-radius:12px;">
                       <div style="font-size:11px; color:var(--text-3); margin-bottom:4px;">تاريخ التسجيل</div>
                       <div style="font-weight:bold; font-size:14px;">\${c.created_at ? new Date(c.created_at).toLocaleDateString('ar-KW') : 'غير محدد'}</div>
                    </div>
                    <div style="background:var(--bg-1); padding:16px; border-radius:12px;">
                       <div style="font-size:11px; color:var(--text-3); margin-bottom:4px;">حالة الحساب</div>
                       <div style="font-weight:bold; font-size:14px; color:\${c.status==='frozen'?'var(--danger)':'var(--success)'};">\${c.status==='frozen'?'موقوف':'نشط'}</div>
                    </div>
                    <div style="background:var(--bg-1); padding:16px; border-radius:12px;">
                       <div style="font-size:11px; color:var(--text-3); margin-bottom:4px;">العنوان / المنطقة</div>
                       <div style="font-weight:bold; font-size:14px;">\${c.address || c.region || 'غير محدد'}</div>
                    </div>
                    <div style="background:var(--bg-1); padding:16px; border-radius:12px;">
                       <div style="font-size:11px; color:var(--text-3); margin-bottom:4px;">مصدر العميل</div>
                       <div style="font-weight:bold; font-size:14px;">\${c.source || 'إدخال يدوي'}</div>
                    </div>
                 </div>
               </div>
               \${linkedTeamHtml}
            </div>
            
            <div>
               <div class="card" style="border:none; box-shadow:0 4px 20px rgba(0,0,0,0.03);">
                  <h4 style="margin-bottom:16px; font-weight:bold; font-size:16px;">تصنيف الحساب الأساسي</h4>
                  <div style="margin-bottom:16px;">
                    <label class="form-label" style="font-size:12px; color:var(--text-2); font-weight:bold;">نوع الحساب / العميل</label>
                    <select class="form-input" id="prof_client_type" onchange="document.getElementById('prof_comp_wrap').style.display=(this.value==='company'?'block':'none')" style="border-radius:8px;">
                       <option value="client" \${c.type==='client'||c.type==='individual'?'selected':''}>👤 مالك قسيمة / فرد</option>
                       <option value="investor" \${c.type==='investor'?'selected':''}>💼 مستثمر عقاري</option>
                       <option value="company" \${c.type==='company'?'selected':''}>🏢 شركة / مؤسسة</option>
                       <option value="contractor" \${c.type==='contractor'?'selected':''}>👷‍♂️ مقاول منفذ</option>
                    </select>
                    
                    <div id="prof_comp_wrap" style="display:\${c.type==='company'?'block':'none'}; background:var(--bg-1); padding:12px; border-radius:8px; margin-top:12px; border:1px solid var(--border);">
                       <label class="form-label" style="font-size:11px;">المنصب / صفة الممثل</label>
                       <select class="form-input" id="prof_client_position" style="font-size:12px; border-radius:6px;">
                          <option value="owner" \${c.position==='owner'?'selected':''}>مالك</option>
                          <option value="ceo" \${c.position==='ceo'?'selected':''}>مدير تنفيذي</option>
                          <option value="engineer" \${c.position==='engineer'?'selected':''}>مهندس</option>
                          <option value="secretary" \${c.position==='secretary'?'selected':''}>سكرتير</option>
                          <option value="accountant" \${c.position==='accountant'?'selected':''}>محاسب</option>
                          <option value="employee" \${c.position==='employee'?'selected':''}>موظف</option>
                          <option value="partner" \${c.position==='partner'?'selected':''}>شريك</option>
                          <option value="other" \${c.position==='other'?'selected':''}>أخرى...</option>
                       </select>
                    </div>
                  </div>
                  <button class="btn btn-primary w-full" onclick="ClientsPage.saveProfileType('\${c.id}')" style="border-radius:8px;">تحديث التصنيف</button>
               </div>
            </div>
         </div>
       \`;
    } 
    else if (tab === 'projects') {
       contentHtml = \`
         <div class="card" style="border:none; box-shadow:0 4px 20px rgba(0,0,0,0.03);">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
               <h4 style="font-weight:bold; font-size:18px;">المشاريع الحالية والسابقة</h4>
               <button class="btn btn-outline btn-sm">➕ إضافة مشروع جديد</button>
            </div>
            \${projects.length ? \`
              <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap:16px;">
                \${projects.map(p => \`
                  <div style="border:1px solid var(--border); border-radius:12px; padding:16px; background:#fff; transition:transform 0.2s; cursor:pointer;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='none'">
                     <div style="display:flex; justify-content:space-between; margin-bottom:12px;">
                        <span class="badge \${p.status==='active'?'badge-success':'badge-gray'}">\${p.status==='active'?'جاري العمل':'مكتمل'}</span>
                        <span style="font-size:11px; color:var(--text-3);">\${p.start_date || 'غير محدد'}</span>
                     </div>
                     <h5 style="font-weight:bold; font-size:15px; margin-bottom:6px;">\${p.name}</h5>
                     <div style="font-size:12px; color:var(--text-2); margin-bottom:12px;">📍 \${p.location || 'بدون موقع'}</div>
                     
                     <div style="background:var(--bg-1); height:6px; border-radius:3px; margin-bottom:6px; overflow:hidden;">
                        <div style="background:var(--primary); height:100%; width:\${p.progress||0}%;"></div>
                     </div>
                     <div style="display:flex; justify-content:space-between; font-size:11px; color:var(--text-3);">
                        <span>نسبة الإنجاز</span>
                        <span style="font-weight:bold;">\${p.progress||0}%</span>
                     </div>
                  </div>
                \`).join('')}
              </div>
            \` : \`
              <div style="text-align:center; padding:40px; background:var(--bg-1); border-radius:12px; border:1px dashed var(--border);">
                 <div style="font-size:40px; margin-bottom:12px;">🏢</div>
                 <div style="font-weight:bold; color:var(--text-1);">لا توجد مشاريع مسجلة</div>
                 <div style="font-size:12px; color:var(--text-3); margin-top:8px;">هذا العميل ليس لديه أي مشاريع حالية أو سابقة.</div>
              </div>
            \`}
         </div>
       \`;
    }
    else if (tab === 'admin' && isAdmin) {
       contentHtml = \`
         <div style="display:grid; grid-template-columns: 1fr 2fr; gap: 24px;">
            <div>
               <div class="card" style="border:none; box-shadow:0 4px 20px rgba(0,0,0,0.03); background:linear-gradient(180deg, #fff, var(--bg-0));">
                 <h4 style="margin-bottom:20px; font-weight:bold; font-size:16px; color:var(--primary); display:flex; align-items:center; gap:8px;">
                    <span>🔒</span> تقييم ومراجعة الإدارة
                 </h4>
                 
                 <div style="margin-bottom:16px;">
                   <label class="form-label" style="font-size:12px; font-weight:bold;">التقييم الشامل للعميل (Score)</label>
                   <div style="display:flex; align-items:center; gap:12px;">
                      <input type="range" id="prof_eval_score" min="0" max="100" value="\${c.eval_score||50}" class="w-full" oninput="document.getElementById('prof_score_val').innerText=this.value+'%'">
                      <span id="prof_score_val" style="font-weight:bold; font-size:14px; width:40px; text-align:center; background:var(--primary); color:#fff; padding:4px 8px; border-radius:6px;">\${c.eval_score||50}%</span>
                   </div>
                 </div>

                 <div style="margin-bottom:16px;">
                   <label class="form-label" style="font-size:12px; font-weight:bold;">تصنيف المتابعة الإدارية</label>
                   <select class="form-input" id="prof_eval_tag" style="border-radius:8px;">
                      <option value="" \${!c.evaluation ? 'selected' : ''}>-- طبيعي / لم يتم التقييم --</option>
                      <option value="عميل استراتيجي" \${c.evaluation === 'عميل استراتيجي' ? 'selected' : ''}>🌟 عميل استراتيجي (VIP)</option>
                      <option value="فرصة" \${c.evaluation === 'فرصة' ? 'selected' : ''}>🎯 فرصة محتملة للمزيد</option>
                      <option value="مهم" \${c.evaluation === 'مهم' ? 'selected' : ''}>⭐ عميل مهم</option>
                      <option value="متأخر في الدفع" \${c.evaluation === 'متأخر في الدفع' ? 'selected' : ''}>💸 متأخر في الدفع دائماً</option>
                      <option value="مشاغب" \${c.evaluation === 'مشاغب' ? 'selected' : ''}>⚠️ مشاغب / متعب في التعامل</option>
                      <option value="غير منظم" \${c.evaluation === 'غير منظم' ? 'selected' : ''}>📝 غير منظم إدارياً</option>
                   </select>
                 </div>
                 
                 <div style="margin-bottom:20px;">
                   <label class="form-label" style="font-size:12px; font-weight:bold;">ملاحظات داخلية (تضاف للسجل الزمني)</label>
                   <textarea class="form-input" id="prof_eval_notes" rows="4" placeholder="مثال: يفضل التواصل هاتفياً في الفترة المسائية... لا يحب الرسائل النصية..." style="border-radius:8px; resize:none;"></textarea>
                   <div style="font-size:10px; color:var(--text-3); margin-top:6px;">* سيتم حفظ الملاحظة الجديدة في سجل الـ Timeline ولن تمسح الملاحظات القديمة.</div>
                 </div>
                 
                 <button class="btn btn-primary w-full" onclick="ClientsPage.saveAdminFollowUp('\${c.id}')" style="border-radius:8px; padding:12px; font-weight:bold; box-shadow:0 4px 12px rgba(79,70,229,0.2);">💾 حفظ التقييم والملاحظة</button>
               </div>
            </div>

            <div>
               <div class="card" style="border:none; box-shadow:0 4px 20px rgba(0,0,0,0.03); height:100%;">
                 <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
                    <h4 style="font-weight:bold; font-size:16px;">سجل النشاط الداخلي (Audit Log)</h4>
                    <span class="badge badge-gray" style="font-size:11px;">مخفي عن العميل</span>
                 </div>
                 
                 <div style="max-height: 500px; overflow-y: auto; padding-right: 8px;">
                   \${(c.eval_history && c.eval_history.length) ? [...c.eval_history].reverse().map((h, i) => \`
                      <div style="position:relative; padding-right:24px; margin-bottom:20px;">
                        <div style="position:absolute; right:6px; top:0; bottom:-20px; width:2px; background:var(--border);"></div>
                        <div style="position:absolute; right:0; top:4px; width:14px; height:14px; border-radius:50%; background:\${i===0?'var(--primary)':'var(--text-3)'}; border:3px solid #fff; box-shadow:0 0 0 1px var(--border);"></div>
                        
                        <div style="background:var(--bg-0); border-radius:12px; padding:14px; border:1px solid var(--border); transition:all 0.2s; box-shadow:0 2px 8px rgba(0,0,0,0.02);">
                          <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">
                            <div>
                               <span class="badge \${h.eval_tag ? 'badge-blue' : 'badge-gray'}" style="font-weight:bold; margin-left:8px;">\${h.eval_tag || 'تحديث ملاحظة'}</span>
                               \${h.score ? \`<span style="font-size:11px; font-weight:bold; color:var(--success);">التقييم: \${h.score}%</span>\` : ''}
                            </div>
                            <span style="color:var(--text-3); font-size:10px; background:var(--bg-1); padding:2px 6px; border-radius:4px;" dir="ltr">\${new Date(h.date).toLocaleString('ar-KW')}</span>
                          </div>
                          \${h.notes ? \`<div style="font-size:13px; color:var(--text-1); margin-bottom:10px; line-height:1.6; padding:10px; background:#fff; border-radius:8px; border-right:3px solid var(--primary);">\${h.notes.replace(/\\n/g, '<br>')}</div>\` : ''}
                          <div style="display:flex; align-items:center; gap:6px; font-size:11px; color:var(--text-3);">
                             <div style="width:20px; height:20px; border-radius:50%; background:var(--bg-2); display:flex; justify-content:center; align-items:center;">👤</div>
                             بواسطة: <strong style="color:var(--text-2);">\${h.by || 'النظام'}</strong>
                          </div>
                        </div>
                      </div>
                   \`).join('') : \`
                      <div style="text-align:center; padding:40px;">
                         <div style="font-size:32px; margin-bottom:12px; opacity:0.5;">🕒</div>
                         <div style="color:var(--text-3); font-size:13px;">لا يوجد سجل للنشاط الداخلي حتى الآن.<br>سيتم تسجيل كل تقييم وملاحظة جديدة هنا.</div>
                      </div>
                   \`}
                 </div>
               </div>
            </div>
         </div>
       \`;
    }
    else {
       const icon = tabs.find(x=>x.id===tab)?.icon || '🚧';
       const lbl = tabs.find(x=>x.id===tab)?.label || tab;
       contentHtml = \`
         <div style="display:flex; flex-direction:column; justify-content:center; align-items:center; padding:80px 20px; background:#fff; border-radius:16px; border:1px dashed var(--border); box-shadow:0 4px 20px rgba(0,0,0,0.02);">
            <div style="font-size:64px; margin-bottom:20px; opacity:0.8; filter:grayscale(0.5);">\${icon}</div>
            <h3 style="font-size:20px; font-weight:bold; color:var(--text-1); margin-bottom:10px;">قسم \${lbl} (قيد التطوير)</h3>
            <p style="color:var(--text-3); font-size:14px; text-align:center; max-width:400px; line-height:1.6;">
               سيتم دمج جميع العمليات المتعلقة بـ \${lbl} في هذا القسم قريباً لتوفير رؤية شاملة 360 درجة للعميل.
            </p>
         </div>
       \`;
    }

    return \`
      <div style="margin-bottom:24px; display:flex; justify-content:space-between; align-items:center;">
         <div>
            <button class="btn btn-outline" onclick="ClientsPage.closeClientProfile()" style="border-radius:8px; display:flex; align-items:center; gap:6px;">
               <span style="font-size:18px; line-height:1;">↶</span> العودة لسجل العملاء
            </button>
         </div>
         <div style="display:flex; gap:12px;">
            <button class="btn btn-outline" style="border-radius:8px;">🔗 نسخ رابط العميل</button>
            <button class="btn btn-primary" onclick="ClientsPage.openAddModal('\${c.id}')" style="border-radius:8px; box-shadow:0 4px 12px rgba(79,70,229,0.2);">✏️ تعديل البيانات الأساسية</button>
         </div>
      </div>
      
      <div class="card" style="margin-bottom:24px; display:flex; justify-content:space-between; align-items:center; padding:24px; border:none; box-shadow:0 4px 20px rgba(0,0,0,0.04); background:linear-gradient(to right, #fff, var(--bg-0));">
         <div style="display:flex; align-items:center; gap:20px;">
            <div style="width:72px; height:72px; border-radius:16px; background:linear-gradient(135deg, var(--primary), #818cf8); color:#fff; display:flex; justify-content:center; align-items:center; font-size:28px; font-weight:bold; box-shadow:0 8px 16px rgba(79,70,229,0.25);">
               \${(c.name||'C').substring(0,1)}
            </div>
            <div>
               <div style="display:flex; align-items:center; gap:12px; margin-bottom:6px;">
                 <h2 style="margin:0; font-weight:900; font-size:24px; color:#1e293b; letter-spacing:-0.5px;">\${c.name||'بدون اسم'}</h2>
                 <span class="badge \${c.status==='frozen'?'badge-red':'badge-green'}" style="font-size:11px; padding:4px 8px;">\${c.status==='frozen'?'حساب موقوف':'حساب نشط'}</span>
               </div>
               <div style="font-size:13px; color:#64748b; display:flex; align-items:center; gap:16px;">
                  <span style="display:flex; align-items:center; gap:4px;">
                     <span style="opacity:0.6;">🏷</span> 
                     \${c.type === 'company'?'شركة':c.type==='contractor'?'مقاول منفذ':c.type==='employee'?'موظف شركة':c.type==='investor'?'مستثمر':c.type==='collaborator'?'متعاون فني':'فرد / مالك'}
                  </span>
                  \${c.phone ? \`<span style="display:flex; align-items:center; gap:4px;"><span style="opacity:0.6;">📱</span> <span dir="ltr">\${c.phone}</span></span>\` : ''}
                  \${c.email ? \`<span style="display:flex; align-items:center; gap:4px;"><span style="opacity:0.6;">📧</span> \${c.email}</span>\` : ''}
                  <span style="display:flex; align-items:center; gap:4px; opacity:0.6;"><span style="opacity:0.6;">🆔</span> \${String(c.id).substring(0,8)}</span>
               </div>
            </div>
         </div>
         \${isAdmin && c.evaluation ? \`
            <div style="background:#fff; border:1px solid var(--border); border-radius:12px; padding:12px 20px; text-align:center; box-shadow:0 2px 10px rgba(0,0,0,0.02);">
               <div style="font-size:11px; color:var(--text-3); font-weight:bold; margin-bottom:4px;">التقييم الإداري الحالي</div>
               <div style="font-weight:900; color:var(--primary); font-size:15px;">\${c.evaluation}</div>
               \${c.eval_score ? \`<div style="font-size:12px; color:var(--success); font-weight:bold; margin-top:2px;">Score: \${c.eval_score}%</div>\` : ''}
            </div>
         \` : ''}
      </div>
      
      \${tabNavHtml}
      
      <div style="animation: fadeIn 0.3s ease;">
        \${contentHtml}
      </div>
    \`;
  },
`;

const content = fs.readFileSync('erp/erp_app.js', 'utf8');
const target = fs.readFileSync('scratch_target.txt', 'utf8');

const newContent = content.replace(target, replacement);

fs.writeFileSync('erp/erp_app.js', newContent);
console.log('Successfully replaced exact target.');
