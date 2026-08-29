'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Search, Download, X, Plus, Pencil, Trash2, Tags } from 'lucide-react';
import { useApiData, daftar } from '@/lib/useApiData';
import { authFetch } from '@/lib/api';
import { useConnection } from '@/lib/connection';
import type { Produk } from '@/components/ui/FormProduk';

export default function AdminProdukPage() {
  const { isOnline } = useConnection();
  const [cari, setCari] = useState('');
  const [sibuk, setSibuk] = useState<number | null>(null);
  const [galatAksi, setGalatAksi] = useState<string | null>(null);

  // Dimuat dari basis data. Sebelumnya halaman ini membaca
  // src/data/produk.json — berkas statis yang tidak pernah cocok dengan isi
  // basis data, lengkap dengan "harga referensi" yang tidak ada di skema dan
  // tidak pernah dipakai backend.
  const { data, loading, error, muatUlang } = useApiData<Produk[]>(
    '/admin/produk?per_page=100',
    (json) => daftar<Produk>(json)
  );
  const produk = data ?? [];

  const filtered = produk.filter((p) => {
    const kata = cari.toLowerCase();
    return (
      p.nama_produk.toLowerCase().includes(kata) ||
      (p.sku ?? '').toLowerCase().includes(kata) ||
      (p.kategori?.nama_kategori ?? '').toLowerCase().includes(kata)
    );
  });

  const hapus = async (p: Produk) => {
    if (!window.confirm(`Hapus produk "${p.nama_produk}"?`)) return;

    setSibuk(p.id);
    setGalatAksi(null);
    try {
      const res = await authFetch(`/admin/produk/${p.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        setGalatAksi(json?.message ?? 'Produk gagal dihapus.');
        return;
      }
      muatUlang();
    } catch {
      setGalatAksi('Server tidak dapat dihubungi.');
    } finally {
      setSibuk(null);
    }
  };

  const handleExportCSV = () => {
    const rows = [['ID', 'SKU', 'Nama Produk', 'Kategori', 'Tampil Katalog', 'Deskripsi']];
    produk.forEach((p) => {
      rows.push([
        String(p.id),
        `"${p.sku ?? ''}"`,
        `"${p.nama_produk}"`,
        `"${p.kategori?.nama_kategori ?? ''}"`,
        p.show_katalog ? 'Ya' : 'Tidak',
        `"${(p.deskripsi_produk ?? '').replace(/"/g, '""')}"`,
      ]);
    });

    const blob = new Blob([rows.map((e) => e.join(',')).join('\n')], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Master_Produk_Redline_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="rl-page-header flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="rl-page-title mb-1">Manajemen Produk</h1>
          <p className="rl-page-desc mb-0">
            Kelola master katalog hardware toko &mdash; {produk.length} produk terdaftar.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCSV}
            disabled={produk.length === 0}
            className="btn-ghost rl-btn-sm inline-flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" /> Ekspor CSV
          </button>
          <Link
            href="/admin/kategori"
            className="btn-ghost rl-btn-sm inline-flex items-center gap-1.5 no-underline"
          >
            <Tags className="w-3.5 h-3.5" /> Kategori
          </Link>
          <Link
            href="/admin/produk/baru"
            className="btn-redline rl-btn-sm inline-flex items-center gap-1.5 no-underline"
          >
            <Plus className="w-3.5 h-3.5" /> Tambah Produk
          </Link>
        </div>
      </div>

      {!isOnline && (
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900">
          <strong>Mode Offline:</strong> daftar produk tidak dapat dimuat atau diubah.
        </div>
      )}

      {galatAksi && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">{galatAksi}</div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">{error}</div>
      )}

      <div className="rl-card overflow-hidden">
        <div className="p-4 border-b border-neutral-100 flex items-center justify-between gap-3 flex-wrap bg-neutral-50/50">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari produk..."
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
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-100/70 border-b border-neutral-200 text-neutral-600 font-bold uppercase tracking-wider text-[10.5px]">
                <th className="py-3 px-4">Detail Produk &amp; SKU</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4 text-center">Katalog Publik</th>
                <th className="py-3 px-4 text-right">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-neutral-800">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-neutral-400 text-xs">
                    Memuat produk dari server&hellip;
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-neutral-400 text-xs">
                    {produk.length === 0
                      ? 'Belum ada produk. Tambahkan lewat tombol Tambah Produk.'
                      : 'Tidak ada produk yang cocok dengan pencarian Anda.'}
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-neutral-900 text-xs leading-snug">{p.nama_produk}</div>
                      <div className="text-[10.5px] rl-mono text-neutral-400 mt-0.5">
                        SKU: <span className="font-semibold text-neutral-600">{p.sku ?? '—'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded bg-neutral-100 border border-neutral-200 text-[11px] font-semibold text-neutral-700">
                        {p.kategori?.nama_kategori ?? 'Tanpa kategori'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {/* Sebelumnya lencana ini SELALU "PUBLIK", tak peduli
                          nilai show_katalog — produk yang sengaja disembunyikan
                          tetap tampak publik bagi pengelola. */}
                      <span
                        className={`rl-pill text-[10px] ${p.show_katalog ? 'rl-pill-green' : 'rl-pill-gray'}`}
                      >
                        {p.show_katalog ? 'PUBLIK' : 'TERSEMBUNYI'}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1.5">
                        <Link
                          href={`/admin/produk/${p.id}`}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-neutral-200 bg-white text-[11px] font-semibold text-neutral-700 no-underline"
                        >
                          <Pencil className="w-3 h-3" /> Ubah
                        </Link>
                        <button
                          type="button"
                          onClick={() => void hapus(p)}
                          disabled={sibuk === p.id}
                          aria-label={`Hapus ${p.nama_produk}`}
                          className="inline-flex items-center justify-center p-1.5 rounded-lg border border-neutral-200 bg-white text-neutral-400 hover:text-red-600 hover:border-red-200 cursor-pointer disabled:opacity-50"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t border-neutral-100 bg-neutral-50 text-[11px] text-neutral-400 text-right">
          Menampilkan {filtered.length} dari total {produk.length} item
        </div>
      </div>
    </div>
  );
}
