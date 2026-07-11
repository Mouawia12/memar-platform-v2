/**
 * Memar Visual Page Builder
 * Injected only when ?mode=builder
 */

(function() {
    console.log("Memar Visual Page Builder initialized.");
    
    // Inject builder CSS
    const style = document.createElement('style');
    style.innerHTML = `
        /* Disable normal transitions and behaviors that interfere with editing */
        a { pointer-events: none !important; }
        .builder-interactable {
            cursor: pointer !important;
            transition: outline 0.2s;
            pointer-events: auto !important;
        }
        .builder-editable {
            outline: 1px dashed rgba(27,108,168,0.4);
            transition: all 0.2s;
            cursor: text;
            position: relative;
            z-index: 10;
        }
        .builder-editable:hover {
            outline: 2px dashed #1B6CA8;
            background: rgba(27,108,168,0.05);
        }
        .builder-editable:focus {
            outline: 2px solid #1B6CA8;
            background: rgba(255,255,255,0.95);
            color: #000;
            box-shadow: 0 4px 12px rgba(0,0,0,0.1);
            border-radius: 4px;
        }
        
        /* Section wrapper for controls */
        .builder-section-wrapper {
            position: relative;
            outline: 2px solid transparent;
            transition: outline 0.2s;
        }
        .builder-section-wrapper:hover {
            outline: 2px solid #27AE60;
        }
        
        /* Floating Toolbar */
        .builder-toolbar {
            position: absolute;
            top: 0;
            right: 0;
            background: #27AE60;
            color: white;
            display: flex;
            gap: 2px;
            padding: 4px;
            border-bottom-left-radius: 8px;
            z-index: 99990;
            opacity: 0;
            transition: opacity 0.2s;
            pointer-events: none;
        }
        .builder-section-wrapper:hover .builder-toolbar {
            opacity: 1;
            pointer-events: auto;
        }
        .builder-btn {
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            cursor: pointer;
            width: 28px;
            height: 28px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 14px;
            transition: background 0.2s;
        }
        .builder-btn:hover { background: rgba(255,255,255,0.4); }
        .builder-btn.delete { background: rgba(231,76,60,0.8); }
        .builder-btn.delete:hover { background: rgba(231,76,60,1); }
        
        /* Interactables Bounding Box */
        .builder-interactable:hover {
            outline: 2px dashed #F39C12;
            outline-offset: 2px;
        }
        
        #builder-active-box {
            position: fixed; /* Using fixed so we map getBoundingClientRect directly without scroll offsets */
            border: 2px dashed #F39C12;
            pointer-events: none;
            z-index: 100000;
            display: none;
        }
        .bb-ctrl, .bb-resize {
            pointer-events: auto;
            position: absolute;
            background: #fff;
            border: 1px solid #ccc;
            border-radius: 50%;
            width: 26px;
            height: 26px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 13px;
            cursor: pointer;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            user-select: none;
        }
        .bb-ctrl:hover, .bb-resize:hover { background: #f0f0f0; transform: scale(1.1); }
        .bb-move { top: -13px; left: -13px; cursor: move; }
        .bb-del { top: -13px; right: -13px; color: #e74c3c; }
        .bb-img { top: -13px; left: 20px; }
        .bb-resize { bottom: -13px; right: -13px; cursor: se-resize; }
    `;
    document.head.appendChild(style);
    
    // Core Setup
    const mainContent = document.getElementById('main-content');
    
    // Texts
    const textTags = [
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'span', 
        '.svc-name', '.svc-desc', '.portfolio-title', '.pkg-name', '.pkg-price', '.pkg-subtitle', '.pkg-list li',
        '.section-title', '.section-sub', '.section-tag', '.hero-badge',
        '.trust-num', '.trust-label', '.b2b-feat-text .t', '.b2b-feat-text .s',
        '.b2b-stat .n', '.b2b-stat .l', '.meet-info .t', '.meet-info .s',
        '.cta-title', '.cta-sub', '.footer-about', '.footer-col h4'
    ];
    
    // Interactables (Icons, Images, Floating Widgets)
    const interactables = [
        'img', 'svg', '.svc-icon', '.b2b-feat-icon', '.meet-icon', '.trust-icon', 
        '.nav-icon', '#m-fab', '#m-win', '#memar-chatbot-container', '#float-extras', 
        '.social-btn', '.footer-logo div', '.hero', '.portfolio-img', '.b2b-section', 'a[href*="wa.me"]'
    ];

    if(mainContent) {
        // Apply Section Tools
        mainContent.querySelectorAll('section, .trust-bar').forEach(sec => setupSection(sec));
        
        // Apply Editables
        textTags.forEach(selector => {
            mainContent.querySelectorAll(selector).forEach(el => {
                if(!el.classList.contains('svc-icon') && !el.closest('.builder-toolbar')) {
                    el.classList.add('builder-editable');
                    el.setAttribute('contenteditable', 'true');
                    el.setAttribute('spellcheck', 'false');
                }
            });
        });
    }

    // Apply Interactables (Everywhere, not just mainContent, to catch #m-fab, etc)
    interactables.forEach(selector => {
        document.querySelectorAll(selector).forEach(el => {
            if(!el.closest('.builder-toolbar')) {
                el.classList.add('builder-interactable');
            }
        });
    });

    // ----------------------------------------------------
    // Bounding Box Logic
    // ----------------------------------------------------
    let activeElement = null;
    let rafId = null;
    let isDragging = false;
    let isResizing = false;
    let startX = 0, startY = 0;
    let initialTransform = { x: 0, y: 0, s: 1 };
    
    function createBoundingBox() {
        let box = document.getElementById('builder-active-box');
        if(!box) {
            box = document.createElement('div');
            box.id = 'builder-active-box';
            box.innerHTML = `
                <div class="bb-ctrl bb-move" title="سحب للتحريك">✥</div>
                <div class="bb-ctrl bb-del" title="حذف العنصر" onclick="window._bbDelete()">❌</div>
                <div class="bb-ctrl bb-img" title="تغيير الصورة" onclick="window._bbChangeImg()">🖼️</div>
                <div class="bb-resize" title="تغيير الحجم">↘️</div>
            `;
            document.body.appendChild(box);
        }
        return box;
    }

    function updateBoundingBox() {
        if(!activeElement) return;
        const rect = activeElement.getBoundingClientRect();
        const box = document.getElementById('builder-active-box');
        if(box) {
            // Using position: fixed on the box maps directly to getBoundingClientRect
            box.style.top = rect.top + 'px';
            box.style.left = rect.left + 'px';
            box.style.width = rect.width + 'px';
            box.style.height = rect.height + 'px';
        }
        rafId = requestAnimationFrame(updateBoundingBox);
    }

    function showBoundingBox(el) {
        if(activeElement === el) return;
        activeElement = el;
        const box = createBoundingBox();
        box.style.display = 'block';
        
        const isImg = el.tagName === 'IMG' || el.classList.contains('hero') || el.classList.contains('portfolio-img') || el.classList.contains('b2b-section');
        box.querySelector('.bb-img').style.display = isImg ? 'flex' : 'none';
        
        if(!el.getAttribute('data-builder-transform')) {
            el.setAttribute('data-builder-transform', JSON.stringify({x: 0, y: 0, s: 1}));
        }
        
        cancelAnimationFrame(rafId);
        updateBoundingBox();
    }

    function hideBoundingBox() {
        activeElement = null;
        const box = document.getElementById('builder-active-box');
        if(box) box.style.display = 'none';
        cancelAnimationFrame(rafId);
    }

    window._bbDelete = function() {
        if(activeElement) {
            if(activeElement.id === 'memar-chatbot-container' || activeElement.id === 'm-fab' || activeElement.id === 'm-win') {
                localStorage.setItem('memar_disable_chatbot', 'true');
            }
            activeElement.remove();
            hideBoundingBox();
        }
    };

    window._bbChangeImg = function() {
        if(!activeElement) return;
        const currentBg = window.getComputedStyle(activeElement).backgroundImage;
        const currentSrc = activeElement.src;
        let currentUrl = currentSrc || (currentBg !== 'none' ? currentBg.match(/url\\("?(.+?)"?\\)/)?.[1] : '');
        
        const url = prompt('أدخل رابط الصورة الجديد (URL):', currentUrl || '');
        if(url && url.trim()) {
            if(activeElement.tagName === 'IMG') {
                activeElement.src = url.trim();
            } else {
                if(currentBg.includes('linear-gradient')) {
                    const grad = currentBg.split('), url')[0] + ')';
                    activeElement.style.backgroundImage = \`\${grad}, url('\${url.trim()}')\`;
                } else {
                    activeElement.style.backgroundImage = \`url('\${url.trim()}')\`;
                }
            }
        }
    };

    function getTransform(el) {
        const raw = el.getAttribute('data-builder-transform');
        if(raw) return JSON.parse(raw);
        return { x: 0, y: 0, s: 1 };
    }

    function applyTransform(el, t) {
        // Important: preserve other transforms or just use this one. Since we manage it fully, we overwrite.
        el.style.transform = \`translate(\${t.x}px, \${t.y}px) scale(\${t.s})\`;
        el.setAttribute('data-builder-transform', JSON.stringify(t));
    }

    // Capture-phase global click/mousedown to BLOCK interactions and handle bounding box
    document.addEventListener('mousedown', function(e) {
        if(e.target.closest('.bb-move')) {
            isDragging = true;
            startX = e.clientX;
            startY = e.clientY;
            initialTransform = getTransform(activeElement);
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        if(e.target.closest('.bb-resize')) {
            isResizing = true;
            startX = e.clientX;
            initialTransform = getTransform(activeElement);
            e.preventDefault();
            e.stopPropagation();
            return;
        }
        if(e.target.closest('.bb-ctrl')) {
            return; // let click pass to onclick
        }
    }, true);

    document.addEventListener('mousemove', function(e) {
        if(!activeElement) return;
        if(isDragging) {
            const dx = e.clientX - startX;
            const dy = e.clientY - startY;
            const t = { ...initialTransform };
            t.x += dx;
            t.y += dy;
            applyTransform(activeElement, t);
        } else if(isResizing) {
            const dx = e.clientX - startX;
            const t = { ...initialTransform };
            t.s = Math.max(0.1, t.s + (dx / 100)); // 100px drag = +1.0 scale
            applyTransform(activeElement, t);
        }
    }, true);

    document.addEventListener('mouseup', function(e) {
        if(isDragging || isResizing) {
            isDragging = false;
            isResizing = false;
            e.stopPropagation();
            e.preventDefault();
        }
    }, true);

    document.addEventListener('click', function(e) {
        // Always allow our tools
        if (e.target.closest('.builder-toolbar') || e.target.closest('#builder-active-box')) {
            return; 
        }
        
        const interactable = e.target.closest('.builder-interactable');
        if (interactable) {
            e.stopPropagation();
            e.preventDefault();
            showBoundingBox(interactable);
            return;
        }

        const editable = e.target.closest('.builder-editable');
        if (editable) {
            e.stopPropagation();
            hideBoundingBox();
            return;
        }

        // Block everything else
        e.preventDefault();
        e.stopPropagation();
        hideBoundingBox();
    }, true);
    
    // ----------------------------------------------------
    // Section Toolbar Setup
    // ----------------------------------------------------
    function setupSection(sec) {
        if(sec.classList.contains('builder-section-wrapper')) return;
        sec.classList.add('builder-section-wrapper');
        const toolbar = document.createElement('div');
        toolbar.className = 'builder-toolbar';
        toolbar.contentEditable = 'false';
        
        const btnUp = document.createElement('button');
        btnUp.className = 'builder-btn';
        btnUp.innerHTML = '▲';
        btnUp.onclick = (e) => {
            e.stopPropagation();
            if(sec.previousElementSibling) sec.parentNode.insertBefore(sec, sec.previousElementSibling);
        };
        
        const btnDown = document.createElement('button');
        btnDown.className = 'builder-btn';
        btnDown.innerHTML = '▼';
        btnDown.onclick = (e) => {
            e.stopPropagation();
            if(sec.nextElementSibling) sec.parentNode.insertBefore(sec.nextElementSibling, sec);
        };
        
        const btnClone = document.createElement('button');
        btnClone.className = 'builder-btn';
        btnClone.innerHTML = '⧉';
        btnClone.onclick = (e) => {
            e.stopPropagation();
            const clone = sec.cloneNode(true);
            sec.parentNode.insertBefore(clone, sec.nextSibling);
            clone.querySelectorAll('.builder-toolbar').forEach(t => t.remove());
            clone.classList.remove('builder-section-wrapper');
            setupSection(clone);
            // We'd need to re-apply interactable and editable to clones.
            clone.querySelectorAll('.builder-interactable').forEach(el => el.classList.remove('builder-interactable'));
            clone.querySelectorAll('.builder-editable').forEach(el => el.classList.remove('builder-editable'));
        };
        
        const btnDel = document.createElement('button');
        btnDel.className = 'builder-btn delete';
        btnDel.innerHTML = '🗑️';
        btnDel.onclick = (e) => {
            e.stopPropagation();
            if(confirm('هل أنت متأكد من حذف هذا القسم؟')) sec.remove();
        };
        
        toolbar.append(btnUp, btnDown, btnClone, btnDel);
        sec.appendChild(toolbar);
    }
    
    // Save functionality
    window.addEventListener('message', function(e) {
        if(e.data && e.data.type === 'REQUEST_SAVE') {
            hideBoundingBox(); // Make sure active box is hidden/unbound
            
            // Re-clone to clean up
            const wrapper = document.getElementById('editable-site-wrapper') || document.getElementById('main-content');
            const clone = wrapper.cloneNode(true);
            
            // Clean up builder artifacts
            clone.querySelectorAll('.builder-toolbar').forEach(el => el.remove());
            clone.querySelectorAll('.builder-editable').forEach(el => {
                el.classList.remove('builder-editable');
                el.removeAttribute('contenteditable');
                el.removeAttribute('spellcheck');
            });
            clone.querySelectorAll('.builder-interactable').forEach(el => {
                el.classList.remove('builder-interactable');
            });
            clone.querySelectorAll('.builder-section-wrapper').forEach(el => {
                el.classList.remove('builder-section-wrapper');
            });
            
            const payload = clone.innerHTML;
            
            window.parent.postMessage({
                type: 'SAVE_WEBSITE',
                payload: payload
            }, '*');
        }
    });
})();
