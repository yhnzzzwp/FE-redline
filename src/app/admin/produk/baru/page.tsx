'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import FormProduk from '@/components/ui/FormProduk';

export default function TambahProdukPage() {
  return (
    <div className="space-y-4">
      <div className="rl-page-header">
        <Link
          href="/admin/produk"
          className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-800 no-underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke daftar produk
        </Link>
        <h1 className="rl-page-title mb-1 mt-2">Tambah Produk</h1>
        <p className="rl-page-desc mb-0">
          Produk yang ditampilkan di katalog langsung terlihat pengunjung situs.
        </p>
      </div>

      <FormProduk />
    </div>
  );
}
