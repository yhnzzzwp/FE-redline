import Link from 'next/link';
import { Produk } from '@/types';
import { createWhatsAppLink } from '@/lib/whatsapp';
import { MessageCircle, ArrowUpRight, Cpu } from 'lucide-react';

export default function ProductCard({ produk }: { produk: Produk }) {
  const waLink = createWhatsAppLink(produk.nama_produk, produk.sku);

  return (
    <div className="group relative flex flex-col justify-between rounded-2xl glass-panel p-5 glow-hover transition-all duration-300 border border-white/5 hover:border-rose-500/30">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Cpu className="w-3 h-3" />
            {produk.kategori?.nama_kategori || 'Hardware'}
          </span>
          {produk.sku && (
            <span className="text-[11px] font-mono text-zinc-500 bg-zinc-900 px-2 py-0.5 rounded border border-white/5">
              {produk.sku}
            </span>
          )}
        </div>

        <Link href={`/katalog/${produk.id}`} className="block group-hover:text-rose-400 transition-colors">
          <h3 className="text-base font-bold text-zinc-100 line-clamp-2 leading-snug">
            {produk.nama_produk}
          </h3>
        </Link>

        {produk.deskripsi_produk && (
          <p className="mt-2 text-xs text-zinc-400 line-clamp-3 leading-relaxed">
            {produk.deskripsi_produk}
          </p>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-white/5 flex items-center gap-2">
        <a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600/90 hover:bg-emerald-600 text-white text-xs font-semibold shadow-md shadow-emerald-950/30 transition-all active:scale-95"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Tanya via WhatsApp</span>
        </a>
        <Link
          href={`/katalog/${produk.id}`}
          className="p-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-100 border border-white/5 transition-colors"
          aria-label="Lihat detail"
        >
          <ArrowUpRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
