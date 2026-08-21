import Link from 'next/link';
import { createGeneralWhatsAppLink } from '@/lib/whatsapp';
import { ShieldCheck, Wrench, Clock, MapPin, Phone, MessageCircle } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-zinc-950/80 text-zinc-400 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-rose-600 flex items-center justify-center text-white font-bold">
                RL
              </div>
              <span className="text-lg font-bold text-zinc-100">
                REDLINE<span className="text-rose-500">.</span>
              </span>
            </div>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Spesialis hardware komputer premium, rakit PC custom, dan servis profesional bergaransi.
            </p>
            <div className="flex items-center gap-3 pt-2">
              <a
                href={createGeneralWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-zinc-900 hover:bg-rose-950/40 hover:text-rose-400 border border-white/5 transition-colors"
                aria-label="WhatsApp Contact"
              >
                <MessageCircle className="w-5 h-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider mb-4">
              Layanan Kami
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Servis Laptop & PC</span>
              </li>
              <li className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Upgrade & Cleaning Thermal</span>
              </li>
              <li className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Perakitan Komputer Custom</span>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider mb-4">
              Navigasi Cepat
            </h3>
            <ul className="space-y-2.5 text-sm">
              <li>
                <Link href="/" className="hover:text-rose-400 transition-colors">
                  Katalog Komponen
                </Link>
              </li>
              <li>
                <Link href="/cek-servis" className="hover:text-rose-400 transition-colors">
                  Lacak Resi Servis
                </Link>
              </li>
              <li>
                <Link href="/pos" className="hover:text-rose-400 transition-colors">
                  Aplikasi Kasir (POS)
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-zinc-100 uppercase tracking-wider mb-4">
              Alamat Toko
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-rose-500 shrink-0 mt-1" />
                <span>Jl. Redline Computer No. 88, Pusat IT & Komputer</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-rose-500 shrink-0" />
                <span>WhatsApp: +62 812-3456-7890</span>
              </li>
              <li className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-rose-500 shrink-0" />
                <span>Senin - Sabtu: 09:00 - 20:00 WIB</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-zinc-500 gap-4">
          <p>© {new Date().getFullYear()} Redline Komputer. Hak cipta dilindungi.</p>
          <p>Sistem Katalog & POS Terintegrasi</p>
        </div>
      </div>
    </footer>
  );
}
