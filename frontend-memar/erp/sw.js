/* ═══════════════════════════════════════════════════════
   MEMAR ERP — Service Worker (Offline-First PWA)
   Version: 1.0.0
═══════════════════════════════════════════════════════ */

const CACHE_NAME = 'memar-erp-v1';
const OFFLINE_URL = './index.html';

// Core assets to pre-cache
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './erp_app.js',
  './pricing3.js',
  '../shared/supabase-client.js',
  '../shared/UnifiedChat.js',
  'https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;600;700;900&display=swap',
  'https://cdn.jsdelivr.net/npm/chart.js'
];

// ── Install: Pre-cache core assets ──
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Pre-caching core assets');
      return cache.addAll(PRECACHE_ASSETS).catch(e => {
        console.warn('[SW] Some assets failed to cache:', e);
      });
    })
  );
  self.skipWaiting();
});

// ── Activate: Clean old caches ──
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

// ── Fetch: Network-first with cache fallback ──
self.addEventListener('fetch', (event) => {
  // Skip non-GET and Supabase API requests
  if (event.request.method !== 'GET') return;
  if (event.request.url.includes('supabase.co')) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Cache successful responses
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // If it's a navigation request, return offline page
          if (event.request.mode === 'navigate') {
            return caches.match(OFFLINE_URL);
          }
          return new Response('', { status: 503, statusText: 'Offline' });
        });
      })
  );
});
