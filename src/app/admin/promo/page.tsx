'use client';

import { useState } from 'react';
import promoData from '@/data/promo.json';
import { useConnection } from '@/lib/connection';
import { Search, X, WifiOff } from 'lucide-react';

export default function AdminPromoPage() {
  const { isOnline } = useConnection();
  const [promos] = useState(promoData);
  const [cari, setCari] = useState('');

  const activePromos = isOnline ? promos : [];

  const filtered = activePromos.filter(
    (p) =>
      p.nama_promo.toLowerCase().includes(cari.toLowerCase()) ||
      p.kode_promo.toLowerCase().includes(cari.toLowerCase()) ||
      p.tipe_promo.toLowerCase().includes(cari.toLowerCase())
  );

  const activeCount = isOnline ? promos.filter((p) => p.aktif).length : 0;

  return (
    <div className="space-y-6">
      <div className="rl-page-header flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="rl-page-title mb-1">Manajemen Promo</h1>
          <p className="rl-page-desc mb-0">
            Kelola kode diskon &amp; kupon promo toko &mdash; Total {activeCount} promo aktif berlaku.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari promo..."
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            disabled={!isOnline}
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-neutral-200 focus:border-[#de1f26] focus:ring-2 focus:ring-red-100 text-xs text-neutral-800 transition-all outline-none disabled:opacity-60 disabled:cursor-not-allowed"
          />
          {cari && (
            <button
              type="button"
              onClick={() => setCari('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 border-0 bg-transparent cursor-pointer p-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {!isOnline && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-xs text-amber-900">
          <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Mode Offline:</strong> Mohon maaf, tidak ada koneksi dengan database backend. Data kupon promo server tidak dapat dimuat saat offline.
          </span>
        </div>
      )}

      {!isOnline ? (
        <div className="rl-card p-12 text-center text-neutral-400 text-xs">
          Mohon maaf, data promo server tidak tersedia saat offline.
        </div>
      ) : filtered.length === 0 ? (
        <div className="rl-card p-12 text-center text-neutral-400 text-xs">
          Tidak ada kupon promo yang cocok dengan pencarian Anda.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <div key={p.id} className="rl-card h-full overflow-hidden flex flex-col justify-between">
              <div>
                {/* Promo Card Header */}
                <div className="p-4 bg-gradient-to-br from-neutral-900 to-neutral-800 text-white rounded-t-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-white/10 text-neutral-300">
                      Diskon {p.tipe_promo}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        p.aktif ? 'bg-emerald-500/20 text-emerald-300' : 'bg-neutral-600 text-neutral-400'
                      }`}
                    >
                      {p.aktif ? 'AKTIF' : 'NONAKTIF'}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="text-xl font-bold rl-mono tracking-wider text-[#de1f26]">
                      {p.kode_promo}
                    </div>
                    <div className="text-xs font-semibold text-neutral-200 line-clamp-1">
                      {p.nama_promo}
                    </div>
                  </div>

                  <div className="text-lg font-bold text-white pt-1">
                    {p.tipe_promo === 'Persen'
                      ? `Hemat ${p.besar_promo}%`
                      : `Potongan Rp ${p.besar_promo.toLocaleString('id-ID')}`}
                  </div>
                </div>

                {/* Promo Card Body */}
                <div className="p-4 space-y-2 text-xs text-neutral-600">
                  <div className="flex justify-between py-1 border-b border-neutral-100">
                    <span className="text-neutral-400">Min. Transaksi:</span>
                    <span className="font-semibold text-neutral-800 rl-mono">
                      Rp {p.minimal_transaksi.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-neutral-100">
                    <span className="text-neutral-400">Maks. Diskon:</span>
                    <span className="font-semibold text-neutral-800 rl-mono">
                      Rp {p.maksimal_diskon.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="flex justify-between py-1 border-b border-neutral-100">
                    <span className="text-neutral-400">Periode:</span>
                    <span className="font-semibold text-neutral-800 rl-mono">
                      {p.waktu_mulai.slice(5)} s/d {p.waktu_berakhir.slice(5)}
                    </span>
                  </div>

                  <div className="flex justify-between py-1">
                    <span className="text-neutral-400">Penggunaan:</span>
                    <span className="font-semibold text-neutral-800 rl-mono">
                      {p.terpakai} / {p.kuota} Kuota
                    </span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-neutral-50 border-t border-neutral-100 text-center">
                <span className="text-[11px] font-semibold text-neutral-500">
                  {p.aktif ? 'Kode dapat digunakan di kasir POS' : 'Promo telah berakhir'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
