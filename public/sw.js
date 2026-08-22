// ─── Redline POS Service Worker ────────────────────────────────────
const CACHE_NAME = 'redline-pos-v1';

// App shell assets to cache on install
const APP_SHELL = [
  '/',
  '/pos',
  '/cek-servis',
  '/manifest.json',
];

// ─── Install: precache app shell ───────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(APP_SHELL).catch((err) => {
        // Jangan gagalkan install jika ada asset yang belum tersedia
        console.warn('[SW] Beberapa asset gagal di-cache saat install:', err);
      });
    })
  );
  // Aktifkan langsung tanpa menunggu tab lama ditutup
  self.skipWaiting();
});

// ─── Activate: bersihkan cache lama ────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      );
    })
  );
  // Ambil kontrol semua tab yang terbuka
  self.clients.claim();
});

// ─── Fetch: cache-first untuk navigasi & asset statis ──────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Jangan intercept: request ke API backend, chrome-extension, dll
  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api') ||
    request.method !== 'GET'
  ) {
    return;
  }

  // Strategi: Cache-first, fallback ke network, lalu update cache
  event.respondWith(
    caches.match(request).then((cached) => {
      // Fetch dari network di background untuk update cache (stale-while-revalidate)
      const networkFetch = fetch(request)
        .then((networkResponse) => {
          // Update cache dengan response terbaru
          if (networkResponse.ok) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseClone);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          // Network gagal — kalau tidak ada cache, return offline fallback
          if (!cached) {
            return new Response(
              '<html><body style="background:#09090b;color:#f4f4f5;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif"><div style="text-align:center"><h1>Offline</h1><p>Halaman ini belum ter-cache. Buka saat online terlebih dahulu.</p></div></body></html>',
              { headers: { 'Content-Type': 'text/html' } }
            );
          }
          return cached;
        });

      // Return cached response segera jika ada, atau tunggu network
      return cached || networkFetch;
    })
  );
});
