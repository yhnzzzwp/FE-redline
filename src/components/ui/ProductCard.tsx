import Link from 'next/link';
import { Produk } from '@/types';
import { createWhatsAppLink } from '@/lib/whatsapp';
import { MessageCircle } from 'lucide-react';

export default function ProductCard({ produk }: { produk: Produk }) {
  const waLink = createWhatsAppLink(produk.nama_produk, produk.sku);

  return (
    <div className="rl-card h-full overflow-hidden flex flex-col hover:-translate-y-1.5 hover:shadow-lg transition-all duration-300">
      <div className="p-4 flex flex-col flex-1">
        <div className="text-[12px] text-neutral-500 mb-1">
          {produk.kategori?.nama_kategori || 'Umum'} &middot;{' '}
          <span className="rl-mono font-medium">{produk.sku || '—'}</span>
        </div>

        <h3 className="text-[15.5px] font-bold leading-snug mb-2">
          <Link
            href={`/katalog/${produk.id}`}
            className="text-neutral-900 hover:text-[#de1f26] transition-colors no-underline line-clamp-2"
          >
            {produk.nama_produk}
          </Link>
        </h3>

        <p className="text-[13px] text-neutral-500 mb-0 line-clamp-3 leading-relaxed">
          {produk.deskripsi_produk || 'Belum ada deskripsi untuk produk ini.'}
        </p>

        <div className="mt-auto pt-4">
          <a
            href={waLink}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-redline w-full text-xs font-bold py-2.5 px-3"
          >
            <MessageCircle className="w-4 h-4 shrink-0" />
            <span>Tanya via WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
}
