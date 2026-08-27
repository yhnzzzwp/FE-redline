'use client';

import { useState } from 'react';
import produkData from '@/data/produk.json';
import { Search, Download, ShieldAlert, X } from 'lucide-react';

export default function AdminProdukPage() {
  const [cari, setCari] = useState('');

  const filtered = produkData.filter(
    (p) =>
      p.nama_produk.toLowerCase().includes(cari.toLowerCase()) ||
      p.sku.toLowerCase().includes(cari.toLowerCase()) ||
      p.kategori.nama_kategori.toLowerCase().includes(cari.toLowerCase())
  );

  const handleExportCSV = () => {
    const rows = [
      ['ID', 'SKU', 'Nama Produk', 'Kategori', 'Harga Referensi (Rp)', 'Tampil Katalog', 'Deskripsi'],
    ];
    produkData.forEach((p) => {
      rows.push([
        p.id.toString(),
        `"${p.sku}"`,
        `"${p.nama_produk}"`,
        `"${p.kategori.nama_kategori}"`,
        (p.harga_dasar || 0).toString(),
        p.show_katalog ? 'Ya' : 'Tidak',
        `"${(p.deskripsi_produk || '').replace(/"/g, '""')}"`,
      ]);
    });

    const csvContent = rows.map((e) => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Master_Produk_Redline_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  return (
    <div className="space-y-6">
      <div className="rl-page-header flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="rl-page-title mb-1">Manajemen Produk</h1>
          <p className="rl-page-desc mb-0">
            Kelola master katalog hardware toko &mdash; Total {produkData.length} produk terdaftar.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="btn-ghost flex items-center gap-1.5 text-xs font-semibold"
        >
          <Download className="w-4 h-4" />
          <span>Ekspor CSV / Excel</span>
        </button>
      </div>

      <div className="p-3 bg-neutral-100 border border-neutral-200 rounded-xl flex items-center gap-2.5 text-xs text-neutral-600">
        <ShieldAlert className="w-4 h-4 text-neutral-500 shrink-0" />
        <span>
          <strong>Katalog Statis:</strong> Data master produk dikelola secara statis melalui repositori kode untuk keamanan tinggi dan efisiensi performa.
        </span>
      </div>

      <div className="rl-card overflow-hidden">
        {/* Search Bar */}
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

          {cari && (
            <button
              type="button"
              onClick={() => setCari('')}
              className="text-xs text-neutral-500 hover:text-[#b01218] font-semibold bg-transparent border-0 cursor-pointer"
            >
              Reset Pencarian
            </button>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-100/70 border-b border-neutral-200 text-neutral-600 font-bold uppercase tracking-wider text-[10.5px]">
                <th className="py-3 px-4">Detail Produk &amp; SKU</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4 text-right">Harga Referensi</th>
                <th className="py-3 px-4 text-center">Status Katalog</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-neutral-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-neutral-400 text-xs">
                    Tidak ada produk yang cocok dengan pencarian Anda.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-neutral-900 text-xs leading-snug">
                        {p.nama_produk}
                      </div>
                      <div className="text-[10.5px] rl-mono text-neutral-400 mt-0.5">
                        SKU: <span className="font-semibold text-neutral-600">{p.sku}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-block px-2 py-0.5 rounded bg-neutral-100 border border-neutral-200 text-[11px] font-semibold text-neutral-700">
                        {p.kategori.nama_kategori}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right rl-mono font-bold text-neutral-900">
                      Rp {(p.harga_dasar || 0).toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="rl-pill rl-pill-green text-[10px]">
                        PUBLIK
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t border-neutral-100 bg-neutral-50 text-[11px] text-neutral-400 text-right">
          Menampilkan {filtered.length} dari total {produkData.length} item
        </div>
      </div>
    </div>
  );
}
