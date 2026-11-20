// ─── Service Worker Registration ───────────────────────────────────
// Dipanggil sekali dari root layout saat app pertama kali dimuat.

export function registerServiceWorker(): void {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return;
  }

  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
      });

      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (
              newWorker.state === 'activated' &&
              navigator.serviceWorker.controller
            ) {
              // Ada versi baru service worker — bisa tampilkan notif update
              console.info('[SW] Service worker baru aktif. Refresh untuk update.');
            }
          });
        }
      });

      console.info('[SW] Service worker terdaftar:', registration.scope);
    } catch (err) {
      console.warn('[SW] Registrasi service worker gagal:', err);
    }
  });
}
