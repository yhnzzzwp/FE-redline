'use client';

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { QrCode, Search } from 'lucide-react';
import PemindaiQr from '@/components/ui/PemindaiQr';
import { kodeDariPindaian } from '@/lib/qr';

/**
 * Pemindai stiker unit — pintu masuk utama alur servis di HP.
 *
 * Memindai stiker menggantikan pengetikan ulang identitas pelanggan: kode yang
 * terbaca langsung membuka riwayat unitnya, dan dari sana tiket servis baru
 * dibuat hanya dengan mengisi keluhan.
 */
export default function PindaiPage() {
  const router = useRouter();
  const [galat, setGalat] = useState<string | null>(null);
  const [manual, setManual] = useState('');

  const tangani = useCallback(
    (teks: string) => {
      const kode = kodeDariPindaian(teks);
      if (!kode) {
        setGalat('QR itu bukan stiker unit Redline. Coba stiker yang lain.');
        return;
      }
      router.push(`/admin/perangkat/${encodeURIComponent(kode)}`);
    },
    [router]
  );

  const kirimManual = (e: React.FormEvent) => {
    e.preventDefault();
    const kode = kodeDariPindaian(manual);
    if (!kode) {
      setGalat('Kode unit tidak dikenali.');
      return;
    }
    router.push(`/admin/perangkat/${encodeURIComponent(kode)}`);
  };

  return (
    <div className="space-y-4">
      <div className="rl-page-header">
        <h1 className="rl-page-title mb-1">Pindai Stiker Unit</h1>
        <p className="rl-page-desc mb-0">
          Arahkan kamera ke stiker QR pada laptop pelanggan untuk membuka riwayat servisnya.
        </p>
      </div>

      {galat && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
          {galat}
        </div>
      )}

      <PemindaiQr onHasil={tangani} />

      {/* Jalan keluar bila QR tergores atau kamera bermasalah — kode unit selalu
          bisa dibaca manusia dan diketik. */}
      <form onSubmit={kirimManual} className="rl-card p-4 max-w-sm mx-auto">
        <label className="rl-label flex items-center gap-1.5">
          <QrCode className="w-3.5 h-3.5 text-neutral-400" /> Atau ketik kode unitnya
        </label>
        <div className="flex gap-2">
          <input
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="DEV-XXXXXXXX"
            className="rl-input"
          />
          <button
            type="submit"
            disabled={!manual.trim()}
            className="btn-redline rl-btn-sm inline-flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-60"
          >
            <Search className="w-3.5 h-3.5" /> Buka
          </button>
        </div>
      </form>
    </div>
  );
}
