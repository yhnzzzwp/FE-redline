'use client';

import { useState } from 'react';
import Link from 'next/link';
import { OwnerOnly } from '@/lib/session';
import { useConnection } from '@/lib/connection';
import { useApiData, daftar } from '@/lib/useApiData';
import { authFetch } from '@/lib/api';
import { Search, X, WifiOff, Plus, Pencil, Power, Trash2 } from 'lucide-react';
import type { Promo } from '@/components/ui/FormPromo';

function rupiah(n: number): string {
  return `Rp ${n.toLocaleString('id-ID')}`;
}

function AdminPromoPage() {
  const { isOnline } = useConnection();

  // Sebelumnya halaman ini membaca src/data/promo.json — berkas statis yang
  // ikut ter-bundle. Isinya tidak pernah sama dengan basis data: promo yang
  // sudah dihapus tetap tampil, promo baru tidak pernah muncul, dan tidak ada
  // satu pun tindakan yang benar-benar tersimpan.
  const { data, loading, error, muatUlang } = useApiData<Promo[]>(
    '/admin/promos?per_page=100',
    (json) => daftar<Promo>(json)
  );
  const promos = data ?? [];

  const [cari, setCari] = useState('');
  const [sibuk, setSibuk] = useState<number | null>(null);
  const [galatAksi, setGalatAksi] = useState<string | null>(null);

  const filtered = promos.filter(
    (p) =>
      p.nama_promo.toLowerCase().includes(cari.toLowerCase()) ||
      p.kode_promo.toLowerCase().includes(cari.toLowerCase()) ||
      p.tipe_promo.toLowerCase().includes(cari.toLowerCase())
  );

  const activeCount = promos.filter((p) => p.aktif).length;

  const jalankan = async (id: number, aksi: () => Promise<Response>) => {
    setSibuk(id);
    setGalatAksi(null);
    try {
      const res = await aksi();
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setGalatAksi(json?.message ?? 'Tindakan gagal dijalankan.');
        return;
      }
      muatUlang();
    } catch {
      setGalatAksi('Server tidak dapat dihubungi.');
    } finally {
      setSibuk(null);
    }
  };

  const gantiStatus = (p: Promo) =>
    jalankan(p.id, () => authFetch(`/admin/promos/${p.id}/toggle`, { method: 'POST' }));

  const hapus = (p: Promo) => {
    const yakin = window.confirm(
      `Hapus promo ${p.kode_promo}?\n\nPromo yang sudah dipakai di transaksi sebaiknya dinonaktifkan saja, bukan dihapus, agar riwayatnya tetap utuh.`
    );
    if (!yakin) return;
    void jalankan(p.id, () => authFetch(`/admin/promos/${p.id}`, { method: 'DELETE' }));
  };

  return (
    <div className="space-y-6">
      <div className="rl-page-header flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="rl-page-title mb-1">Manajemen Promo</h1>
          <p className="rl-page-desc mb-0">
            Kelola kode diskon &amp; kupon promo toko &mdash; {activeCount} promo aktif berlaku.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-56">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari promo..."
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-neutral-200 focus:border-[#de1f26] focus:ring-2 focus:ring-red-100 text-xs text-neutral-800 transition-all outline-none"
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

          <Link
            href="/admin/promo/baru"
            className="btn-redline rl-btn-sm inline-flex items-center gap-1.5 shrink-0 no-underline"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah Promo
          </Link>
        </div>
      </div>

      {!isOnline && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-xs text-amber-900">
          <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Mode Offline:</strong> tidak ada koneksi ke database. Daftar promo tidak dapat dimuat atau diubah.
          </span>
        </div>
      )}

      {galatAksi && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">{galatAksi}</div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">{error}</div>
      )}

      {loading ? (
        <div className="rl-card p-12 text-center text-neutral-400 text-xs">Memuat promo dari server&hellip;</div>
      ) : filtered.length === 0 ? (
        <div className="rl-card p-12 text-center text-neutral-400 text-xs">
          {promos.length === 0
            ? 'Belum ada promo. Tambahkan lewat tombol Tambah Promo.'
            : 'Tidak ada kupon promo yang cocok dengan pencarian Anda.'}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <div key={p.id} className="rl-card h-full overflow-hidden flex flex-col justify-between">
              <div>
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
                    <div className="text-xl font-bold rl-mono tracking-wider text-[#de1f26]">{p.kode_promo}</div>
                    <div className="text-xs font-semibold text-neutral-200 line-clamp-1">{p.nama_promo}</div>
                  </div>

                  <div className="text-lg font-bold text-white pt-1">
                    {p.tipe_promo === 'Persen'
                      ? `Hemat ${p.besar_promo}%`
                      : `Potongan ${rupiah(p.besar_promo)}`}
                  </div>
                </div>

                <div className="p-4 space-y-2 text-xs text-neutral-600">
                  <Baris label="Min. Transaksi" nilai={rupiah(p.minimal_transaksi)} />
                  <Baris
                    label="Maks. Diskon"
                    nilai={p.maksimal_diskon != null ? rupiah(p.maksimal_diskon) : 'Tanpa batas'}
                  />
                  <Baris
                    label="Periode"
                    nilai={`${p.waktu_mulai.slice(5, 10)} s/d ${p.waktu_berakhir.slice(5, 10)}`}
                  />
                  <Baris
                    label="Penggunaan"
                    nilai={p.kuota != null ? `${p.terpakai} / ${p.kuota} kuota` : `${p.terpakai} kali`}
                    akhir
                  />
                </div>
              </div>

              <div className="p-3 bg-neutral-50 border-t border-neutral-100 flex items-center gap-1.5">
                <Link
                  href={`/admin/promo/${p.id}`}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-neutral-200 bg-white text-[11px] font-semibold text-neutral-700 no-underline"
                >
                  <Pencil className="w-3 h-3" /> Ubah
                </Link>
                <button
                  type="button"
                  onClick={() => void gantiStatus(p)}
                  disabled={sibuk === p.id}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 rounded-lg border border-neutral-200 bg-white text-[11px] font-semibold text-neutral-700 cursor-pointer disabled:opacity-50"
                >
                  <Power className="w-3 h-3" /> {p.aktif ? 'Nonaktifkan' : 'Aktifkan'}
                </button>
                <button
                  type="button"
                  onClick={() => hapus(p)}
                  disabled={sibuk === p.id}
                  aria-label={`Hapus promo ${p.kode_promo}`}
                  className="inline-flex items-center justify-center p-1.5 rounded-lg border border-neutral-200 bg-white text-neutral-400 hover:text-red-600 hover:border-red-200 cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Baris({ label, nilai, akhir = false }: { label: string; nilai: string; akhir?: boolean }) {
  return (
    <div className={`flex justify-between py-1 ${akhir ? '' : 'border-b border-neutral-100'}`}>
      <span className="text-neutral-400">{label}:</span>
      <span className="font-semibold text-neutral-800 rl-mono">{nilai}</span>
    </div>
  );
}

/**
 * Halaman khusus Owner. Penegak sebenarnya tetap backend (grup 'owner.api'
 * di routes/api.php) — pembungkus ini mencegah antarmuka Owner dirender
 * untuk Karyawan.
 */
export default function Page() {
  return (
    <OwnerOnly>
      <AdminPromoPage />
    </OwnerOnly>
  );
}
