import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchProdukDetail } from '@/lib/api';
import { createWhatsAppLink } from '@/lib/whatsapp';
import { Produk } from '@/types';
import ProductCard from '@/components/ui/ProductCard';
import { MessageCircle, ShieldCheck, Award, MessageSquare } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { produk, terkait } = await fetchProdukDetail(id);

  if (!produk) {
    notFound();
  }

  const waLink = createWhatsAppLink(produk.nama_produk, produk.sku);

  const trustItems = [
    { label: 'Garansi Resmi', icon: ShieldCheck },
    { label: '100% Original', icon: Award },
    { label: 'Konsultasi Gratis', icon: MessageSquare },
  ];

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 space-y-8">
      <Link
        href="/#katalog"
        className="text-neutral-500 hover:text-[#b01218] text-xs font-semibold inline-flex items-center gap-1.5 no-underline transition-colors"
      >
        <span>&larr;</span>
        <span>Kembali ke Katalog</span>
      </Link>

      <div className="rl-card p-6 md:p-8 space-y-6" data-reveal>
        <div>
          <div className="text-xs text-neutral-500 mb-2">
            <span className="font-semibold text-neutral-800">
              {produk.kategori?.nama_kategori || 'Hardware'}
            </span>
            {produk.sku && (
              <>
                <span className="mx-2">&middot;</span>
                <span className="rl-mono text-neutral-400">SKU: {produk.sku}</span>
              </>
            )}
          </div>
          <h1 className="rl-title-lg text-2xl md:text-3xl text-neutral-900 font-bold">
            {produk.nama_produk}
          </h1>
        </div>

        <div className="grid grid-cols-3 gap-3 py-4 border-y border-neutral-100">
          {trustItems.map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="text-center space-y-1">
                <Icon className="w-5 h-5 mx-auto text-[#de1f26]" />
                <span className="text-xs font-semibold text-neutral-600 block">
                  {item.label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="space-y-3">
          <h2 className="rl-section-title">Spesifikasi &amp; Deskripsi</h2>
          <div className="text-neutral-600 text-sm leading-relaxed whitespace-pre-line bg-neutral-50 p-4 rounded-xl border border-neutral-100">
            {produk.deskripsi_produk || 'Hubungi kami untuk informasi detail spesifikasi produk ini.'}
          </div>
        </div>

        <div className="pt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-neutral-100">
          <div>
            <div className="text-xs text-neutral-500">Harga &amp; Ketersediaan</div>
            <div className="text-sm font-semibold text-neutral-800">
              Hubungi CS untuk penawaran terbaik &amp; stok real-time
            </div>
          </div>

          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-redline text-sm font-bold inline-flex items-center justify-center gap-2 py-3 px-6 no-underline text-center"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Tanya Stok &amp; Beli via WA</span>
          </a>
        </div>
      </div>

      {terkait.length > 0 && (
        <section className="space-y-4 pt-6" data-reveal>
          <h2 className="rl-title-lg">Produk Lainnya</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {terkait.slice(0, 6).map((p: Produk, index: number) => (
              <div
                key={p.id}
                data-reveal
                style={{ '--reveal-d': `${(index % 3) * 80}ms` } as React.CSSProperties}
              >
                <ProductCard produk={p} />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
