'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { OwnerOnly } from '@/lib/session';
import FormPromo from '@/components/ui/FormPromo';

function Isi() {
  return (
    <div className="space-y-4">
      <div className="rl-page-header">
        <Link
          href="/admin/promo"
          className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-800 no-underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke daftar promo
        </Link>
        <h1 className="rl-page-title mb-1 mt-2">Tambah Promo</h1>
        <p className="rl-page-desc mb-0">
          Kode promo yang aktif langsung bisa dipakai kasir di POS.
        </p>
      </div>

      <FormPromo />
    </div>
  );
}

export default function Page() {
  return (
    <OwnerOnly>
      <Isi />
    </OwnerOnly>
  );
}
