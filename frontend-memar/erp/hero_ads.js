window.HeroAds = {
  getAds() {
    try {
      const ads = JSON.parse(localStorage.getItem('memar_hero_ads') || '[]');
      // Sort by order
      return ads.sort((a,b) => (a.order || 0) - (b.order || 0));
    } catch(e) { return []; }
  },
  
  saveAds(ads) {
    localStorage.setItem('memar_hero_ads', JSON.stringify(ads));
    // Trigger sync if available
    if(typeof window.Sync !== 'undefined' && typeof window.Sync.pushAll === 'function') {
      window.Sync.pushAll();
    }
  },
  
  getSettings() {
    try {
      return JSON.parse(localStorage.getItem('memar_hero_settings') || '{"motion":"carousel","autoPlay":true,"speed":5000,"glassmorphism":true}');
    } catch(e) { 
      return {motion:'carousel', autoPlay:true, speed:5000, glassmorphism:true}; 
    }
  },
  
  saveSettings(settings) {
    localStorage.setItem('memar_hero_settings', JSON.stringify(settings));
  },

  render() {
    const p = document.getElementById('p-hero_ads');
    if (!p) return;
    
    const ads = this.getAds();
    const settings = this.getSettings();
    
    p.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom: 24px;">
        <div>
          <h2 style="font-size:24px; font-weight:800; color:var(--text); margin-bottom:4px;">مدير الواجهة والإعلانات (Hero Ads)</h2>
          <p style="font-size:13px; color:var(--text-3);">تحكم في المحتوى التفاعلي للقسم الرئيسي في موقع معمار</p>
        </div>
        <button class="btn btn-primary" onclick="HeroAds.openEditor()">➕ إضافة إعلان جديد</button>
      </div>

      <div class="grid-1-2">
        <!-- Settings Column -->
        <div class="card" style="align-self:start; padding:20px; background:#fff; border-radius:12px; border:1px solid var(--border); box-shadow:var(--sh-sm);">
          <h3 style="font-size:15px; font-weight:800; margin-bottom:16px; border-bottom:1px solid var(--divider); padding-bottom:10px;">⚙️ إعدادات العرض العالمية</h3>
          
          <div class="form-group" style="margin-bottom:14px;">
            <label style="font-size:12px; font-weight:700; color:var(--text-2); display:block; margin-bottom:6px;">نوع الحركة (Motion)</label>
            <select id="hero_set_motion" style="width:100%; padding:8px 12px; border:1px solid var(--border); border-radius:6px; background:var(--bg);" onchange="HeroAds.updateSettings()">
              <option value="carousel" ${settings.motion==='carousel'?'selected':''}>كاروسيل ثلاثي الأبعاد (3D Carousel)</option>
              <option value="orbit" ${settings.motion==='orbit'?'selected':''}>مداري (Orbit Motion)</option>
              <option value="fade" ${settings.motion==='fade'?'selected':''}>تلاشي ناعم (Fade Transition)</option>
              <option value="slide" ${settings.motion==='slide'?'selected':''}>انزلاق ناعم (Smooth Slider)</option>
            </select>
          </div>
          
          <div class="form-group" style="margin-bottom:14px;">
            <label style="font-size:12px; font-weight:700; color:var(--text-2); display:block; margin-bottom:6px;">سرعة التبديل التلقائي (Auto Play)</label>
            <select id="hero_set_speed" style="width:100%; padding:8px 12px; border:1px solid var(--border); border-radius:6px; background:var(--bg);" onchange="HeroAds.updateSettings()">
              <option value="0" ${settings.speed==0?'selected':''}>إيقاف التبديل التلقائي</option>
              <option value="3000" ${settings.speed==3000?'selected':''}>سريع (3 ثواني)</option>
              <option value="5000" ${settings.speed==5000?'selected':''}>متوسط (5 ثواني)</option>
              <option value="8000" ${settings.speed==8000?'selected':''}>بطيء (8 ثواني)</option>
            </select>
          </div>
          
          <label style="display:flex; align-items:center; gap:8px; font-size:13px; font-weight:600; cursor:pointer; color:var(--text-2);">
            <input type="checkbox" id="hero_set_glass" ${settings.glassmorphism?'checked':''} onchange="HeroAds.updateSettings()">
            تفعيل تأثير الزجاج (Glassmorphism) على النصوص
          </label>
        </div>

        <!-- Ads List Column -->
        <div class="card" style="padding:20px; background:#fff; border-radius:12px; border:1px solid var(--border); box-shadow:var(--sh-sm);">
          <h3 style="font-size:15px; font-weight:800; margin-bottom:16px; border-bottom:1px solid var(--divider); padding-bottom:10px;">إعلانات الـ Hero الحالية</h3>
          <p style="font-size:11px; color:var(--text-4); margin-bottom:12px;">اسحب ورتب الإعلانات حسب الأولوية.</p>
          
          <div id="hero_ads_list" style="display:flex; flex-direction:column; gap:12px;">
             ${ads.length === 0 ? '<div style="text-align:center; padding:30px; background:var(--bg); border-radius:10px; color:var(--text-4);">لا توجد إعلانات. أضف إعلاناً جديداً للبدء.</div>' : ''}
             ${ads.map((ad, idx) => `
                <div class="hero-ad-row" data-id="${ad.id}" style="display:flex; gap:16px; align-items:center; background:var(--bg); border:1px solid var(--border); border-radius:10px; padding:12px; transition:all 0.2s; ${ad.active?'':'opacity:0.6; filter:grayscale(0.8)'}">
                  <div class="drag-handle" style="cursor:grab; font-size:18px; color:var(--text-4);">⠿</div>
                  <div style="width:80px; height:60px; border-radius:6px; background:#000; overflow:hidden; flex-shrink:0;">
                     ${ad.type==='video' 
                        ? `<video src="${ad.mediaUrl}" style="width:100%; height:100%; object-fit:cover;" muted></video>`
                        : `<img src="${ad.mediaUrl || 'https://via.placeholder.com/80x60'}" style="width:100%; height:100%; object-fit:cover;">`
                     }
                  </div>
                  <div style="flex:1; min-width:0;">
                    <div style="font-size:14px; font-weight:800; color:var(--text); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${ad.title || '(بدون عنوان)'}</div>
                    <div style="font-size:12px; color:var(--text-3); white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${ad.subtitle || ''}</div>
                    <div style="font-size:10px; color:var(--primary); margin-top:4px; font-weight:700;">[ ${ad.ctaText || 'الزر'} ] &rarr; ${ad.ctaUrl}</div>
                  </div>
                  <div style="display:flex; gap:8px; flex-shrink:0;">
                    <button class="btn btn-sm ${ad.active?'btn-success':'btn-secondary'}" onclick="HeroAds.toggleActive('${ad.id}')">${ad.active?'مفعل':'معطل'}</button>
                    <button class="btn btn-sm btn-outline" onclick="HeroAds.openEditor('${ad.id}')">تعديل</button>
                    <button class="btn btn-sm btn-danger" onclick="HeroAds.deleteAd('${ad.id}')">حذف</button>
                  </div>
                </div>
             `).join('')}
          </div>
        </div>
      </div>
    `;

    // Make list sortable
    setTimeout(() => {
      const list = document.getElementById('hero_ads_list');
      if (list && window.Sortable) {
        Sortable.create(list, {
          handle: '.drag-handle',
          animation: 150,
          onEnd: function() {
            HeroAds.saveOrder();
          }
        });
      }
    }, 100);
  },

  updateSettings() {
    const motion = document.getElementById('hero_set_motion').value;
    const speed = parseInt(document.getElementById('hero_set_speed').value, 10);
    const glassmorphism = document.getElementById('hero_set_glass').checked;
    this.saveSettings({ motion, speed, glassmorphism });
    if(window.ERP && window.ERP.toast) window.ERP.toast('تم حفظ الإعدادات', 'success');
  },

  saveOrder() {
    const list = document.getElementById('hero_ads_list');
    const orderIds = Array.from(list.querySelectorAll('.hero-ad-row')).map(row => row.dataset.id);
    let ads = this.getAds();
    
    // Sort ads array according to the new DOM order
    ads.sort((a,b) => {
      return orderIds.indexOf(a.id) - orderIds.indexOf(b.id);
    });
    
    // Update order numbers
    ads.forEach((ad, i) => ad.order = i);
    this.saveAds(ads);
  },

  toggleActive(id) {
    let ads = this.getAds();
    const ad = ads.find(a => a.id === id);
    if(ad) {
      ad.active = !ad.active;
      this.saveAds(ads);
      this.render();
    }
  },

  deleteAd(id) {
    if(!confirm('هل أنت متأكد من حذف هذا الإعلان؟')) return;
    let ads = this.getAds();
    ads = ads.filter(a => a.id !== id);
    this.saveAds(ads);
    this.render();
  },

  openEditor(id = null) {
    const ads = this.getAds();
    let ad = id ? ads.find(a => a.id === id) : {
      id: 'ad_' + Date.now(),
      type: 'image',
      mediaUrl: '',
      title: '',
      subtitle: '',
      ctaText: 'التفاصيل',
      ctaUrl: '#',
      position: 'center',
      textColor: '#ffffff',
      overlayColor: 'rgba(0,0,0,0.5)',
      active: true,
      order: ads.length,
      mediaScale: 1,
      mediaOffsetX: 0,
      mediaOffsetY: 0
    };

    const modalBody = `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:20px; font-family:'Cairo',sans-serif; direction:rtl;">
        
        <!-- Left Col: Media & CTA -->
        <div style="display:flex; flex-direction:column; gap:16px;">
          <div class="form-group">
             <label style="font-size:12px; font-weight:700;">نوع الميديا</label>
             <select id="ad_type" class="crm-select" onchange="HeroAds.updatePreviewType()">
                <option value="image" ${ad.type==='image'?'selected':''}>صورة عالية الدقة (WebP/JPG)</option>
                <option value="video" ${ad.type==='video'?'selected':''}>فيديو صامت (MP4 / يوتيوب)</option>
             </select>
          </div>
          <div class="form-group">
             <label style="font-size:12px; font-weight:700;">رابط الميديا (URL)</label>
             <input type="text" id="ad_mediaUrl" class="crm-input" placeholder="أدخل رابط الصورة، الفيديو، أو رابط يوتيوب" value="${ad.mediaUrl || ''}">
             <div style="font-size:10px; color:var(--text-4); margin-top:4px;">يمكنك وضع رابط MP4 مباشر أو رابط من YouTube.</div>
          </div>
          
          <div class="form-group" style="margin-top:10px; border:1px solid var(--border); border-radius:8px; padding:12px; background:#f8fafc;">
             <label style="font-size:12px; font-weight:800; color:var(--primary); margin-bottom:8px; display:block;">تنسيق أبعاد الميديا ✂️</label>
             <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
               <div style="grid-column: 1 / span 2;">
                 <label style="font-size:10px; font-weight:700;">تكبير / تصغير (Zoom)</label>
                 <div style="display:flex; align-items:center; gap:8px;">
                   <input type="range" id="ad_mediaScale" min="0.5" max="3" step="0.1" value="${ad.mediaScale || 1}" style="flex:1;" oninput="document.getElementById('lbl_scale').innerText = this.value">
                   <span id="lbl_scale" style="font-size:11px; font-weight:700; width:20px; text-align:center;">${ad.mediaScale || 1}</span>
                 </div>
               </div>
               <div>
                  <label style="font-size:10px; font-weight:700;">إزاحة أفقية (X)</label>
                  <div style="display:flex; align-items:center; gap:8px;">
                    <input type="range" id="ad_mediaOffsetX" min="-100" max="100" step="1" value="${ad.mediaOffsetX || 0}" style="flex:1;" oninput="document.getElementById('lbl_x').innerText = this.value + '%'">
                    <span id="lbl_x" style="font-size:11px; font-weight:700; width:30px; text-align:center;">${ad.mediaOffsetX || 0}%</span>
                  </div>
               </div>
               <div>
                  <label style="font-size:10px; font-weight:700;">إزاحة عمودية (Y)</label>
                  <div style="display:flex; align-items:center; gap:8px;">
                    <input type="range" id="ad_mediaOffsetY" min="-100" max="100" step="1" value="${ad.mediaOffsetY || 0}" style="flex:1;" oninput="document.getElementById('lbl_y').innerText = this.value + '%'">
                    <span id="lbl_y" style="font-size:11px; font-weight:700; width:30px; text-align:center;">${ad.mediaOffsetY || 0}%</span>
                  </div>
               </div>
             </div>
          </div>

          <div class="form-group">
             <label style="font-size:12px; font-weight:700;">نص الزر (CTA)</label>
             <input type="text" id="ad_ctaText" class="crm-input" value="${ad.ctaText || ''}">
          </div>
          <div class="form-group">
             <label style="font-size:12px; font-weight:700;">رابط الزر</label>
             <input type="text" id="ad_ctaUrl" class="crm-input" value="${ad.ctaUrl || ''}" placeholder="مثال: #pricing أو /services.html">
          </div>
        </div>

        <!-- Right Col: Texts & Styling -->
        <div style="display:flex; flex-direction:column; gap:16px;">
          <div class="form-group">
             <label style="font-size:12px; font-weight:700;">العنوان الرئيسي</label>
             <input type="text" id="ad_title" class="crm-input" value="${ad.title || ''}" placeholder="مثال: صمم مشروعك معنا">
          </div>
          <div class="form-group">
             <label style="font-size:12px; font-weight:700;">الوصف الفرعي</label>
             <textarea id="ad_subtitle" class="crm-input" style="height:60px; resize:none;">${ad.subtitle || ''}</textarea>
          </div>
          
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
             <div class="form-group">
               <label style="font-size:12px; font-weight:700;">موقع النص</label>
               <select id="ad_position" class="crm-select">
                  <option value="center" ${ad.position==='center'?'selected':''}>في المنتصف</option>
                  <option value="bottom" ${ad.position==='bottom'?'selected':''}>الأسفل</option>
                  <option value="right" ${ad.position==='right'?'selected':''}>اليمين</option>
                  <option value="left" ${ad.position==='left'?'selected':''}>اليسار</option>
               </select>
             </div>
             <div class="form-group">
               <label style="font-size:12px; font-weight:700;">لون النص</label>
               <input type="color" id="ad_textColor" style="width:100%; height:38px; padding:0; border:1px solid var(--border); border-radius:8px;" value="${ad.textColor || '#ffffff'}">
             </div>
          </div>

          <div class="form-group">
             <label style="font-size:12px; font-weight:700;">تعتيم الخلفية (Overlay)</label>
             <input type="text" id="ad_overlayColor" class="crm-input" value="${ad.overlayColor || 'rgba(0,0,0,0.5)'}" placeholder="مثال: rgba(0,0,0,0.5)">
          </div>
        </div>
      </div>
    `;

    const footerHTML = `
      <button class="btn btn-outline" onclick="ERP.closeModal()">إلغاء</button>
      <button class="btn btn-primary" onclick="HeroAds.saveAdData('${id || ''}')">حفظ الإعلان</button>
    `;

    if(window.ERP && window.ERP.openModal) {
       ERP.openModal(id ? 'تعديل إعلان' : 'إضافة إعلان جديد', modalBody, footerHTML);
    }
  },

  updatePreviewType() {
    // optional: show video inputs vs image inputs
  },

  saveAdData(idStr) {
    let ads = this.getAds();
    const isNew = !idStr;
    const id = isNew ? 'ad_' + Date.now() : idStr;
    
    const adData = {
      id: id,
      type: document.getElementById('ad_type').value,
      mediaUrl: document.getElementById('ad_mediaUrl').value,
      title: document.getElementById('ad_title').value,
      subtitle: document.getElementById('ad_subtitle').value,
      ctaText: document.getElementById('ad_ctaText').value,
      ctaUrl: document.getElementById('ad_ctaUrl').value,
      position: document.getElementById('ad_position').value,
      textColor: document.getElementById('ad_textColor').value,
      overlayColor: document.getElementById('ad_overlayColor').value,
      mediaScale: document.getElementById('ad_mediaScale') ? parseFloat(document.getElementById('ad_mediaScale').value) : 1,
      mediaOffsetX: document.getElementById('ad_mediaOffsetX') ? parseInt(document.getElementById('ad_mediaOffsetX').value) : 0,
      mediaOffsetY: document.getElementById('ad_mediaOffsetY') ? parseInt(document.getElementById('ad_mediaOffsetY').value) : 0,
      active: true, // defaults to active when edited/added
    };

    if (isNew) {
      adData.order = ads.length;
      ads.push(adData);
    } else {
      const idx = ads.findIndex(a => a.id === idStr);
      if(idx >= 0) {
        adData.order = ads[idx].order;
        adData.active = ads[idx].active;
        ads[idx] = adData;
      }
    }

    this.saveAds(ads);
    if(window.ERP) ERP.closeModal();
    this.render();
    if(window.ERP && window.ERP.toast) window.ERP.toast('تم حفظ الإعلان بنجاح', 'success');
  }
};
