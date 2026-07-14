(function() {
  document.addEventListener('DOMContentLoaded', () => {
    initHeroAds();
  });

  function initHeroAds() {
    try {
      const adsData = JSON.parse(localStorage.getItem('memar_hero_ads') || '[]');
      const activeAds = adsData.filter(a => a.active).sort((a, b) => (a.order || 0) - (b.order || 0));
      
      if (activeAds.length === 0) return; // Keep default hero

      const settings = JSON.parse(localStorage.getItem('memar_hero_settings') || '{"motion":"slide","autoPlay":true,"speed":5000,"glassmorphism":true}');
      
      const heroSection = document.getElementById('home');
      if (!heroSection) return;

      // Inject Styles
      const style = document.createElement('style');
      style.innerHTML = `
        .dyn-hero-container {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: #000;
        }
        .dyn-slide {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          opacity: 0;
          transition: opacity 1s cubic-bezier(0.4, 0, 0.2, 1), transform 1s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 1;
          display: flex;
        }
        .dyn-slide.active {
          opacity: 1;
          z-index: 2;
          transform: scale(1);
        }
        /* Motions */
        .motion-slide .dyn-slide { transform: translateX(100%); }
        .motion-slide .dyn-slide.active { transform: translateX(0); }
        .motion-slide .dyn-slide.prev-slide { transform: translateX(-100%); opacity:0; }
        
        .motion-fade .dyn-slide { transform: scale(1.05); }
        .motion-fade .dyn-slide.active { transform: scale(1); }
        
        .motion-orbit .dyn-slide { transform: rotateY(90deg) translateZ(300px); opacity:0; transition: transform 1.2s ease, opacity 1.2s ease; }
        .motion-orbit .dyn-slide.active { transform: rotateY(0deg) translateZ(0); opacity:1; }
        .motion-orbit .dyn-slide.prev-slide { transform: rotateY(-90deg) translateZ(300px); opacity:0; }
        
        .motion-carousel .dyn-slide { transform: scale(0.8) translateX(50%); opacity: 0; }
        .motion-carousel .dyn-slide.active { transform: scale(1) translateX(0); opacity: 1; z-index: 3; }
        .motion-carousel .dyn-slide.prev-slide { transform: scale(0.8) translateX(-50%); opacity: 0; z-index: 1; }

        .dyn-media {
          position: absolute;
          inset: 0;
          width: 100%;
          height: 100%;
          object-fit: cover;
          z-index: 1;
        }
        .yt-bg {
          width: 100vw;
          height: 56.25vw; /* 16:9 aspect ratio */
          min-height: 100vh;
          min-width: 177.77vh;
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          pointer-events: none;
        }
        .dyn-overlay {
          position: absolute;
          inset: 0;
          z-index: 2;
        }
        .dyn-content {
          position: relative;
          z-index: 3;
          display: flex;
          flex-direction: column;
          padding: 5%;
          max-width: 1200px;
          margin: 0 auto;
          width: 100%;
        }
        
        /* Positions */
        .pos-center { justify-content: center; align-items: center; text-align: center; }
        .pos-bottom { justify-content: flex-end; align-items: center; text-align: center; padding-bottom: 80px; }
        .pos-left   { justify-content: center; align-items: flex-start; text-align: right; }
        .pos-right  { justify-content: center; align-items: flex-end; text-align: left; }
        
        .glassmorphism .dyn-text-box {
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(12px) saturate(180%);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 16px 40px rgba(0,0,0,0.2);
        }

        .dyn-title {
          font-size: clamp(32px, 5vw, 64px);
          font-weight: 900;
          line-height: 1.2;
          margin-bottom: 16px;
          text-shadow: 0 4px 12px rgba(0,0,0,0.3);
          transform: translateY(30px);
          opacity: 0;
          transition: all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) 0.3s;
        }
        .dyn-slide.active .dyn-title { transform: translateY(0); opacity: 1; }
        
        .dyn-sub {
          font-size: clamp(16px, 2vw, 22px);
          font-weight: 500;
          line-height: 1.6;
          margin-bottom: 32px;
          max-width: 600px;
          text-shadow: 0 2px 8px rgba(0,0,0,0.3);
          transform: translateY(20px);
          opacity: 0;
          transition: all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) 0.5s;
        }
        .dyn-slide.active .dyn-sub { transform: translateY(0); opacity: 1; }
        
        .dyn-btn {
          display: inline-block;
          padding: 14px 36px;
          background: linear-gradient(135deg, var(--accent), #D68910);
          color: #fff;
          font-size: 16px;
          font-weight: 800;
          border-radius: 12px;
          text-decoration: none;
          box-shadow: 0 8px 24px rgba(243,156,18,0.4);
          transition: all 0.3s;
          transform: translateY(20px);
          opacity: 0;
          transition: all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) 0.7s;
        }
        .dyn-slide.active .dyn-btn { transform: translateY(0); opacity: 1; }
        .dyn-btn:hover {
          transform: translateY(-4px) scale(1.05) !important;
          box-shadow: 0 12px 32px rgba(243,156,18,0.6);
        }

        /* Controls */
        .dyn-controls {
          position: absolute;
          bottom: 40px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
          display: flex;
          gap: 12px;
        }
        .dyn-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: rgba(255,255,255,0.3);
          cursor: pointer;
          transition: all 0.3s;
          border: 2px solid transparent;
        }
        .dyn-dot.active {
          background: #fff;
          transform: scale(1.3);
          border-color: var(--primary);
        }
        
        .dyn-arrows {
          position: absolute;
          top: 50%;
          width: 100%;
          display: flex;
          justify-content: space-between;
          padding: 0 30px;
          z-index: 10;
          transform: translateY(-50%);
          pointer-events: none;
        }
        .dyn-arrow {
          width: 50px;
          height: 50px;
          background: rgba(255,255,255,0.1);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.2);
          border-radius: 50%;
          color: #fff;
          font-size: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          pointer-events: auto;
          transition: all 0.3s;
        }
        .dyn-arrow:hover {
          background: rgba(255,255,255,0.3);
          transform: scale(1.1);
        }
        
        @media(max-width: 768px) {
          .dyn-arrow { display: none; }
          .glassmorphism .dyn-text-box { padding: 20px; border-radius: 12px; }
        }
      `;
      document.head.appendChild(style);

      // Render HTML
      heroSection.innerHTML = '';
      heroSection.style.padding = '0'; // reset default padding
      heroSection.style.perspective = '1000px';

      const container = document.createElement('div');
      container.className = `dyn-hero-container motion-${settings.motion} ${settings.glassmorphism ? 'glassmorphism' : ''}`;
      
      function getYoutubeId(url) {
        if (!url) return null;
        const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([\w-]{11})/i);
        return match ? match[1] : null;
      }

      let html = '';
      activeAds.forEach((ad, idx) => {
        const ytId = getYoutubeId(ad.mediaUrl);
        const isVid = ad.type === 'video' || ytId !== null;
        let mediaTag = '';
        
        if (isVid) {
           if (ytId) {
              mediaTag = `<iframe class="dyn-media yt-bg" src="https://www.youtube.com/embed/${ytId}?autoplay=1&mute=1&loop=1&controls=0&showinfo=0&rel=0&playlist=${ytId}&modestbranding=1&playsinline=1" frameborder="0" allow="autoplay; encrypted-media" allowfullscreen></iframe>`;
           } else {
              mediaTag = `<video class="dyn-media" src="${ad.mediaUrl}" autoplay muted loop playsinline ${idx!==0?'preload="none"':''}></video>`;
           }
        } else {
           mediaTag = `<img class="dyn-media" src="${ad.mediaUrl}" loading="${idx===0?'eager':'lazy'}">`;
        }
           
        html += `
          <div class="dyn-slide ${idx===0?'active':''}" data-index="${idx}">
            <div style="position:absolute; inset:0; overflow:hidden;">
               <div style="position:absolute; width:100%; height:100%; transform: scale(${ad.mediaScale || 1}) translate(${ad.mediaOffsetX || 0}%, ${ad.mediaOffsetY || 0}%);">
                  ${mediaTag}
               </div>
            </div>
            <div class="dyn-overlay" style="background:${ad.overlayColor || 'rgba(0,0,0,0.4)'}"></div>
            <div class="dyn-content pos-${ad.position}">
              <div class="dyn-text-box" style="color:${ad.textColor || '#fff'}">
                <h2 class="dyn-title">${ad.title || ''}</h2>
                ${ad.subtitle ? `<p class="dyn-sub">${ad.subtitle}</p>` : ''}
                ${ad.ctaText ? `<a href="${ad.ctaUrl || '#'}" class="dyn-btn">${ad.ctaText}</a>` : ''}
              </div>
            </div>
          </div>
        `;
      });
      
      // Controls
      if (activeAds.length > 1) {
        html += `<div class="dyn-controls">
          ${activeAds.map((_, i) => `<div class="dyn-dot ${i===0?'active':''}" data-dot="${i}"></div>`).join('')}
        </div>
        <div class="dyn-arrows">
          <div class="dyn-arrow" id="dyn-prev">❮</div>
          <div class="dyn-arrow" id="dyn-next">❯</div>
        </div>`;
      }
      
      container.innerHTML = html;
      heroSection.appendChild(container);

      // Logic
      let currentIdx = 0;
      const slides = container.querySelectorAll('.dyn-slide');
      const dots = container.querySelectorAll('.dyn-dot');
      let autoPlayInterval;

      function goToSlide(index) {
        slides[currentIdx].classList.remove('active');
        slides[currentIdx].classList.add('prev-slide');
        setTimeout(() => {
           container.querySelectorAll('.prev-slide').forEach(el => {
              if(!el.classList.contains('active')) el.classList.remove('prev-slide');
           });
        }, 1000);
        
        if (dots[currentIdx]) dots[currentIdx].classList.remove('active');
        
        currentIdx = index;
        if (currentIdx < 0) currentIdx = slides.length - 1;
        if (currentIdx >= slides.length) currentIdx = 0;
        
        slides[currentIdx].classList.add('active');
        slides[currentIdx].classList.remove('prev-slide');
        if (dots[currentIdx]) dots[currentIdx].classList.add('active');
        
        // Handle Video Playback (MP4 only, iframes handle themselves)
        slides.forEach((sl, i) => {
           const v = sl.querySelector('video');
           if(v) {
              if (i === currentIdx) { v.play().catch(e=>{}); }
              else { v.pause(); }
           }
        });
      }

      function nextSlide() { goToSlide(currentIdx + 1); }
      function prevSlide() { goToSlide(currentIdx - 1); }

      // Events
      const nextBtn = container.querySelector('#dyn-next');
      const prevBtn = container.querySelector('#dyn-prev');
      if (nextBtn) nextBtn.addEventListener('click', () => { nextSlide(); resetTimer(); });
      if (prevBtn) prevBtn.addEventListener('click', () => { prevSlide(); resetTimer(); });
      
      dots.forEach((dot, i) => {
         dot.addEventListener('click', () => { goToSlide(i); resetTimer(); });
      });

      // Swipe support
      let touchStartX = 0;
      let touchEndX = 0;
      container.addEventListener('touchstart', e => { touchStartX = e.changedTouches[0].screenX; }, {passive:true});
      container.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        if (touchStartX - touchEndX > 50) { nextSlide(); resetTimer(); }
        if (touchEndX - touchStartX > 50) { prevSlide(); resetTimer(); }
      }, {passive:true});

      // Auto play
      function startTimer() {
        if (settings.speed > 0 && activeAds.length > 1) {
          autoPlayInterval = setInterval(nextSlide, settings.speed);
        }
      }
      function resetTimer() {
        clearInterval(autoPlayInterval);
        startTimer();
      }
      
      // Pause on hover
      container.addEventListener('mouseenter', () => clearInterval(autoPlayInterval));
      container.addEventListener('mouseleave', () => startTimer());

      startTimer();
      
    } catch(e) {
      console.error("HeroAds Render Error:", e);
    }
  }

})();
