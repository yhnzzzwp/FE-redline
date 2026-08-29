'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { OwnerOnly } from '@/lib/session';
import { useApiData } from '@/lib/useApiData';
import FormPromo, { type Promo } from '@/components/ui/FormPromo';

function Isi({ id }: { id: string }) {
  const { data: promo, loading, error } = useApiData<Promo>(
    `/admin/promos/${encodeURIComponent(id)}`,
    (json) => json.data as Promo
  );

  return (
    <div className="space-y-4">
      <div className="rl-page-header">
        <Link
          href="/admin/promo"
          className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-800 no-underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Kembali ke daftar promo
        </Link>
        <h1 className="rl-page-title mb-1 mt-2">Ubah Promo</h1>
        {promo && <p className="rl-page-desc mb-0 rl-mono">{promo.kode_promo}</p>}
      </div>

      {loading && (
        <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-500">
          Memuat promo&hellip;
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">{error}</div>
      )}

      {/* Formulir dipasang setelah datanya ada: state awalnya diambil sekali
          dari prop, jadi merender lebih dulu akan menghasilkan kolom kosong. */}
      {promo && <FormPromo promo={promo} />}
    </div>
  );
}

export default function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <OwnerOnly>
      <Isi id={id} />
    </OwnerOnly>
  );
}
