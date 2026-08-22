import Link from 'next/link';
import { createGeneralWhatsAppLink } from '@/lib/whatsapp';
import { MapPin, MessageCircle } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="pb-16">
      <div className="rl-public-header" data-reveal>
        <div className="rl-kicker mb-2">
          Di balik <b>garis merah</b>
        </div>
        <h1 className="rl-page-title">Tentang Redline Komputer</h1>
        <p className="text-neutral-500 text-sm max-w-md mx-auto leading-relaxed">
          Solusi terpercaya untuk kebutuhan IT Anda sejak 2016.
        </p>
        <div className="rl-ticks max-w-xs mx-auto mt-4"></div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="rl-card p-6 md:p-8 space-y-6" data-reveal>
          <div>
            <div className="rl-kicker mb-2">
              Visi <b>&amp;</b> Misi
            </div>
            <h2 className="rl-title-lg mb-3">Arah &amp; Komitmen Kami</h2>
            <p className="text-neutral-700 text-sm leading-relaxed mb-6">
              Redline Komputer hadir dengan komitmen memberikan layanan IT terbaik bagi masyarakat. Kami percaya teknologi harus dapat diakses dan diandalkan oleh siapa saja, baik untuk kebutuhan personal maupun profesional.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
              <div className="md:col-span-5 space-y-2">
                <h3 className="rl-section-title text-sm">Visi</h3>
                <p className="text-neutral-500 text-xs leading-relaxed">
                  Menjadi pusat layanan dan penyedia solusi komputer yang terpercaya, inovatif, dan terdepan di Indonesia.
                </p>
              </div>

              <div className="md:col-span-7 space-y-2">
                <h3 className="rl-section-title text-sm">Misi</h3>
                <ol className="rl-misi">
                  <li>
                    Menyediakan komponen komputer berkualitas tinggi dengan harga yang kompetitif.
                  </li>
                  <li>
                    Memberikan layanan servis yang transparan, cepat, dan bergaransi.
                  </li>
                  <li>
                    Mengutamakan kepuasan pelanggan melalui pelayanan yang ramah, jujur, dan profesional.
                  </li>
                  <li>
                    Berinovasi secara berkelanjutan mengikuti perkembangan teknologi terkini.
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rl-card p-6 text-center space-y-3 flex flex-col items-center justify-between" data-reveal>
            <span className="rl-feature-ico">
              <MapPin className="w-5 h-5 text-[#b01218]" />
            </span>
            <div>
              <h3 className="rl-section-title text-sm mb-1">Lokasi Kami</h3>
              <p className="text-neutral-500 text-xs leading-relaxed">
                Jl. Diponegoro No. 52, Salatiga
              </p>
            </div>
            <a
              href="https://maps.app.goo.gl/V5s33ckZDgTjSEz19"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost rl-btn-sm text-xs"
            >
              Buka di Google Maps
            </a>
          </div>

          <div
            className="rl-card p-6 text-center space-y-3 flex flex-col items-center justify-between"
            data-reveal
            style={{ '--reveal-d': '90ms' } as React.CSSProperties}
          >
            <span className="rl-feature-ico">
              <MessageCircle className="w-5 h-5 text-[#b01218]" />
            </span>
            <div>
              <h3 className="rl-section-title text-sm mb-1">Hubungi Kami</h3>
              <p className="text-neutral-500 text-xs leading-relaxed">
                WhatsApp: 0856-4020-3069<br />
                Email: redlinecomputer@gmail.com<br />
                Jam Buka: 09.00&ndash;18.00 WIB
              </p>
            </div>
            <a
              href={createGeneralWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-ghost rl-btn-sm text-xs"
            >
              Chat Sekarang
            </a>
          </div>
        </div>

        <div className="rl-card p-6 md:p-8 text-center space-y-3" data-reveal>
          <div className="rl-kicker mb-1">
            Segera <b>hadir</b>
          </div>
          <h2 className="rl-title-lg text-[#b01218] mb-2">Lini Baru: Toko Ikan</h2>
          <p className="text-neutral-500 text-xs max-w-sm mx-auto leading-relaxed">
            Redline Komputer sedang memperluas layanan ke penjualan ikan. Pantau terus, segera hadir!
          </p>
          <div className="pt-2">
            <Link href="/toko-ikan" className="btn-redline text-xs font-bold inline-flex">
              Kunjungi Toko Ikan
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
