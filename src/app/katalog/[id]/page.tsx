import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchProdukDetail } from '@/lib/api';
import { createWhatsAppLink } from '@/lib/whatsapp';
import ProductCard from '@/components/ui/ProductCard';
import { ArrowLeft, MessageCircle, ShieldCheck, CheckCircle2, Cpu, Tag } from 'lucide-react';

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-xs font-semibold text-zinc-400 hover:text-zinc-100 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Kembali ke Katalog</span>
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 md:p-8 rounded-3xl glass-panel border border-white/5 space-y-6">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                <Cpu className="w-3.5 h-3.5" />
                {produk.kategori?.nama_kategori || 'Hardware'}
              </span>
              {produk.sku && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono bg-zinc-900 text-zinc-400 border border-white/10">
                  <Tag className="w-3 h-3" />
                  {produk.sku}
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-snug">
              {produk.nama_produk}
            </h1>

            <div className="space-y-3 pt-4 border-t border-white/5">
              <h3 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
                Deskripsi & Spesifikasi Produk
              </h3>
              <p className="text-sm text-zinc-400 leading-relaxed whitespace-pre-line">
                {produk.deskripsi_produk || 'Deskripsi detail produk dapat dikonfirmasikan langsung dengan tim teknisi Redline Komputer.'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-5 rounded-2xl glass-panel border border-white/5 flex items-start gap-3.5">
              <ShieldCheck className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-zinc-100">Kualitas Terjamin</h4>
                <p className="text-xs text-zinc-400 mt-0.5">Produk resmi dengan standar pengujian kualitas teknisi.</p>
              </div>
            </div>
            <div className="p-5 rounded-2xl glass-panel border border-white/5 flex items-start gap-3.5">
              <CheckCircle2 className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-zinc-100">Dukungan Pemasangan</h4>
                <p className="text-xs text-zinc-400 mt-0.5">Bisa langsung dipasang dan dicek di workshop Redline.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-3xl glass-panel border border-rose-500/20 bg-gradient-to-b from-rose-950/20 to-zinc-950 space-y-5 sticky top-24">
            <h3 className="text-lg font-bold text-white">Tertarik dengan Produk Ini?</h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Hubungi staf kami via WhatsApp untuk menanyakan ketersediaan, konsultasi kompatibilitas, atau pemesanan langsung.
            </p>

            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white text-sm font-bold shadow-xl shadow-emerald-950/50 transition-all active:scale-95"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Chat WhatsApp Sekarang</span>
            </a>

            <div className="text-[11px] text-zinc-500 text-center">
              Pesan otomatis akan menyertakan nama produk & SKU.
            </div>
          </div>
        </div>
      </div>

      {terkait.length > 0 && (
        <section className="space-y-6 pt-12 border-t border-white/5">
          <h2 className="text-xl font-bold text-white">Produk Lainnya dalam Kategori Ini</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {terkait.map((p) => (
              <ProductCard key={p.id} produk={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
