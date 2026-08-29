'use client';

import { AlertTriangle } from 'lucide-react';
import { useConnection } from '@/lib/connection';

/**
 * Penanda bahwa isi halaman sedang bukan data sungguhan.
 *
 * Saat backend tak terjangkau, halaman publik sengaja TIDAK dikosongkan:
 * katalog, promo, dan kategori jatuh ke data contoh di src/lib/api.ts supaya
 * situs tetap dapat dibaca. Tanpa penanda, pengunjung menganggap produk contoh
 * itu stok toko yang sebenarnya lalu menanyakan barang yang tidak pernah
 * dijual — karena itu banner ini muncul bersama fallback tersebut.
 *
 * Sumbernya status yang sama dengan indikator di navbar (health check tiap 30
 * detik lewat proksi same-origin), jadi keduanya tidak mungkin berbeda cerita.
 */
export default function DataOfflineBanner() {
  const { isOnline } = useConnection();

  if (isOnline) {
    return null;
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="border-b border-amber-200 bg-amber-50 text-amber-900"
    >
      <div className="mx-auto flex max-w-7xl items-start gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />
        <p className="text-sm leading-relaxed">
          <span className="font-semibold">Data sedang tidak mutakhir.</span>{' '}
          Koneksi ke server toko sedang terputus, sehingga produk dan promo yang
          tampil di bawah ini hanya <span className="font-semibold">contoh</span> —
          bukan stok dan harga terkini. Silakan hubungi Redline Komputer lewat
          WhatsApp untuk memastikan ketersediaan barang.
        </p>
      </div>
    </div>
  );
}
