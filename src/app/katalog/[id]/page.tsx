import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchProdukDetail } from '@/lib/api';
import { createWhatsAppLink } from '@/lib/whatsapp';
import ProductCard from '@/components/ui/ProductCard';
import { MessageCircle, ShieldCheck, Award, MessageSquare } from 'lucide-react';

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

      <div className="rl-card p-6 md:p-8 space-y-6">
        <div>
          <div className="text-xs text-neutral-500 mb-2">
            {produk.kategori?.nama_kategori || 'Umum'} &middot; SKU:{' '}
            <span className="rl-mono font-medium tnum">{produk.sku || '—'}</span>
          </div>

          <h1 className="rl-page-title mb-4">{produk.nama_produk}</h1>

          <div className="rl-spec-grid mb-6">
            <div className="rl-spec">
              <div className="rl-spec-label">Kategori</div>
              <div className="rl-spec-value">
                {produk.kategori?.nama_kategori || 'Umum'}
              </div>
            </div>
            <div className="rl-spec">
              <div className="rl-spec-label">SKU</div>
              <div className="rl-spec-value rl-mono tnum">
                {produk.sku || '—'}
              </div>
            </div>
            <div className="rl-spec">
              <div className="rl-spec-label">Garansi</div>
              <div className="rl-spec-value">Resmi</div>
            </div>
            <div className="rl-spec">
              <div className="rl-spec-label">Kondisi</div>
              <div className="rl-spec-value">Baru &amp; Original</div>
            </div>
          </div>

          <div className="space-y-2 mb-6">
            <h3 className="rl-section-title text-sm">Deskripsi Produk</h3>
            <p className="text-neutral-600 text-sm leading-relaxed whitespace-pre-wrap">
              {produk.deskripsi_produk || 'Belum ada deskripsi untuk produk ini.'}
            </p>
          </div>

          <div className="pt-4 border-t border-neutral-100 space-y-3">
            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-redline w-full py-3.5 text-sm font-bold"
            >
              <MessageCircle className="w-5 h-5 shrink-0" />
              <span>Tanya via WhatsApp</span>
            </a>
            <p className="text-xs text-neutral-400 text-center mb-0">
              Transaksi dilakukan di luar sistem. Hubungi admin via WhatsApp untuk informasi lebih lanjut.
            </p>
          </div>
        </div>
      </div>

      <div className="rl-card p-5">
        <div className="rl-trust justify-around">
          {trustItems.map((t) => {
            const Icon = t.icon;
            return (
              <div key={t.label} className="rl-trust-item">
                <span className="rl-trust-ico">
                  <Icon className="w-5 h-5 text-[#b01218]" />
                </span>
                <span className="font-semibold text-neutral-800 text-sm">
                  {t.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {terkait.length > 0 && (
        <section className="space-y-4 pt-6">
          <h2 className="rl-title-lg">Produk Lainnya</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {terkait.slice(0, 6).map((p) => (
              <ProductCard key={p.id} produk={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
