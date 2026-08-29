// ─── Redline POS Service Worker ────────────────────────────────────
// Versi dinaikkan ke v2: handler 'activate' menghapus cache dengan nama lain,
// sehingga HTML halaman internal yang terlanjur tersimpan di perangkat lama
// ikut terhapus saat service worker ini aktif.
const CACHE_NAME = 'redline-pos-v3';

// Hanya halaman publik yang di-precache.
// '/pos' SENGAJA tidak ada di sini: ia rute terproteksi, dan men-precache-nya
// berarti menyimpan layar kasir di perangkat siapa pun yang membuka situs.
// '/manifest.json' juga dihapus karena berkasnya memang tidak ada — cache.addAll
// bersifat atomik, satu URL 404 membuat SELURUH precache gagal diam-diam.
const APP_SHELL = ['/', '/cek-servis'];

// Rute yang HTML-nya tidak boleh pernah masuk cache.
const NEVER_CACHE_PREFIXES = ['/admin'];

// Rute terproteksi yang tetap boleh di-cache demi mode offline kasir,
// tetapi hanya bila server benar-benar mengizinkan (respons 200, bukan redirect).
const OFFLINE_CAPABLE_PREFIXES = ['/pos'];

function startsWithAny(pathname, prefixes) {
  return prefixes.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

// ─── Install: precache app shell ───────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      // add() per URL, bukan addAll(): satu kegagalan tidak membatalkan sisanya.
      Promise.all(
        APP_SHELL.map((url) =>
          cache.add(url).catch((err) => {
            console.warn('[SW] Gagal precache', url, err);
          })
        )
      )
    )
  );
  self.skipWaiting();
});

// ─── Activate: bersihkan cache lama ────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
  );
  self.clients.claim();
});

// ─── Logout: aplikasi meminta cache dibuang ────────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))));
  }
});

// ─── Fetch ─────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (
    url.origin !== self.location.origin ||
    url.pathname.startsWith('/api') ||
    request.method !== 'GET'
  ) {
    return;
  }

  const isNavigation = request.mode === 'navigate';

  // JANGAN sentuh permintaan data App Router.
  //
  // Next.js mengambil payload React Server Component lewat URL halaman biasa
  // dengan query ?_rsc=... (dan header RSC). Permintaan itu BUKAN navigasi,
  // sehingga pada versi sebelumnya jatuh ke cabang cache-first di bawah dan
  // disajikan dari cache. Payload RSC yang basi membuat App Router gagal
  // memasang halaman — persis gejala "this page couldn't load" yang hilang
  // sesaat setelah reload (reload adalah navigasi, jadi ambil dari jaringan)
  // lalu muncul lagi pada navigasi klien berikutnya.
  if (
    !isNavigation &&
    (url.search !== '' ||
      request.headers.get('RSC') !== null ||
      (request.headers.get('Accept') || '').includes('text/x-component'))
  ) {
    return;
  }

  // Navigasi: NETWORK-FIRST.
  //
  // Versi sebelumnya cache-first untuk semua navigasi, sehingga halaman
  // internal yang pernah dibuka saat login akan disajikan dari cache tanpa
  // menyentuh server — penjagaan rute di src/proxy.ts tidak pernah dijalankan.
  // Di tablet toko yang dipakai bergantian itu adalah bypass autentikasi.
  // Dengan network-first, server tetap yang memutuskan selama ada koneksi;
  // cache hanya dipakai saat benar-benar offline.
  if (isNavigation) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          const cacheable =
            networkResponse.ok &&
            !networkResponse.redirected &&
            !startsWithAny(url.pathname, NEVER_CACHE_PREFIXES);

          if (cacheable) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(async () => {
          const cached = await caches.match(request);
          if (cached) return cached;

          // Jangan sajikan shell offline untuk rute yang tidak dirancang offline.
          const offlineOk =
            url.pathname === '/' ||
            startsWithAny(url.pathname, OFFLINE_CAPABLE_PREFIXES) ||
            url.pathname === '/cek-servis';

          return new Response(
            offlineOk
              ? '<html><body style="background:#09090b;color:#f4f4f5;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif"><div style="text-align:center"><h1>Offline</h1><p>Halaman ini belum ter-cache. Buka saat online terlebih dahulu.</p></div></body></html>'
              : '<html><body style="background:#09090b;color:#f4f4f5;display:flex;align-items:center;justify-content:center;height:100vh;font-family:sans-serif"><div style="text-align:center"><h1>Offline</h1><p>Halaman ini butuh koneksi.</p></div></body></html>',
            { status: 503, headers: { 'Content-Type': 'text/html' } }
          );
        })
    );
    return;
  }

  // Cache-first HANYA untuk aset yang benar-benar tidak berubah: berkas di
  // /_next/static/ memakai nama ber-hash isi, begitu pula aset di /public.
  // Selain itu jangan di-cache sama sekali — biarkan lewat ke jaringan.
  const asetStatis =
    url.pathname.startsWith('/_next/static/') ||
    /\.(?:js|css|woff2?|ttf|otf|png|jpe?g|gif|svg|webp|ico|json)$/i.test(url.pathname);

  if (!asetStatis) {
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const networkFetch = fetch(request)
        .then((networkResponse) => {
          if (networkResponse.ok && !networkResponse.redirected) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => cached);

      return cached || networkFetch;
    })
  );
});
