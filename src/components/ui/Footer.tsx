import Link from 'next/link';
import { createGeneralWhatsAppLink } from '@/lib/whatsapp';

export default function Footer() {
  return (
    <footer className="rl-footer mt-auto">
      <div className="max-w-5xl mx-auto">
        <div className="rl-ticks mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-6 space-y-3">
            <div className="inline-flex items-center gap-2">
              <span className="rl-logo text-xl">REDL<i>INE</i></span>
              <span className="rl-stripe"></span>
            </div>
            <p className="text-[12.5px] text-neutral-500 max-w-sm leading-relaxed">
              Pusat hardware komputer dan servis presisi. Dirakit, diuji, dan dikalibrasi langsung oleh teknisi kami di Salatiga.
            </p>
          </div>

          <div className="md:col-span-3 space-y-2">
            <h4>Navigasi</h4>
            <Link href="/" className="hover:text-[#b01218]">
              Beranda &amp; Katalog
            </Link>
            <Link href="/cek-servis" className="hover:text-[#b01218]">
              Lacak Servis
            </Link>
            <Link href="/about" className="hover:text-[#b01218]">
              Tentang Kami
            </Link>
          </div>

          <div className="md:col-span-3 space-y-2">
            <h4>Kontak</h4>
            <a
              href={createGeneralWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#b01218]"
            >
              WhatsApp Kami
            </a>
            <a
              href="https://maps.app.goo.gl/V5s33ckZDgTjSEz19"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-[#b01218]"
            >
              Jl. Diponegoro No. 52, Salatiga
            </a>
          </div>
        </div>

        <div className="text-center mt-8 text-[11.5px] text-neutral-400">
          &copy; {new Date().getFullYear()} Redline Komputer &middot; Salatiga
        </div>
      </div>
    </footer>
  );
}
