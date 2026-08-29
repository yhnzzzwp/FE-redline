'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useApiData } from '@/lib/useApiData';
import FormProduk, { type Produk } from '@/components/ui/FormProduk';

export default function UbahProdukPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data: produk, loading, error } = useApiData<Produk>(
    `/admin/produk/${encodeURIComponent(id)}`,
    (json) => json.data as Produk
  );

  return (
    <div className="space-y-4">
      <div className="rl-page-header">
        <Link
          href="/admin/produk"
          className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-800 no-underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke daftar produk
        </Link>
        <h1 className="rl-page-title mb-1 mt-2">Ubah Produk</h1>
        {produk?.sku && <p className="rl-page-desc mb-0 rl-mono">{produk.sku}</p>}
      </div>

      {loading && (
        <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-500">
          Memuat produk&hellip;
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">{error}</div>
      )}

      {/* Dipasang setelah datanya ada: state awal formulir dibaca sekali dari
          prop, jadi merender lebih dulu menghasilkan kolom kosong. */}
      {produk && <FormProduk produk={produk} />}
    </div>
  );
}
