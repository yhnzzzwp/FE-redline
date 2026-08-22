'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Promo } from '@/types';
import { Tag, ChevronLeft, ChevronRight } from 'lucide-react';

export default function PromoCarousel({ promos }: { promos: Promo[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!promos || promos.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % promos.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [promos]);

  if (!promos || promos.length === 0) return null;

  const current = promos[currentIndex];

  return (
    <div className="rl-promo-card p-6 md:p-8 shadow-xl mb-8">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-bold bg-white/15 text-white border border-white/20 uppercase tracking-wider font-['Barlow_Condensed']">
            <span>Promo Spesial</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight font-['Barlow_Condensed'] uppercase">
            {current.nama_promo}
          </h2>

          <div className="flex items-baseline gap-3 pt-1">
            <span className="text-3xl md:text-4xl font-extrabold font-['Barlow_Condensed'] text-white">
              {current.tipe_promo === 'Persen'
                ? `Diskon ${current.besar_promo}%`
                : `Hemat Rp ${current.besar_promo.toLocaleString('id-ID')}`}
            </span>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-black/40 border border-white/15 text-white rl-mono text-xs font-bold">
              <Tag className="w-3.5 h-3.5 text-[#ff4b51]" />
              <span>{current.kode_promo}</span>
            </div>
            <span className="text-xs text-white/80">
              Gunakan saat bertransaksi di toko
            </span>
          </div>
        </div>

        {current.foto_promo && (
          <div className="relative w-full md:w-64 h-36 rounded-xl overflow-hidden border border-white/20 bg-black/30 shrink-0">
            <Image
              src={current.foto_promo}
              alt={current.nama_promo}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 256px"
            />
          </div>
        )}
      </div>

      {promos.length > 1 && (
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/15 relative z-10">
          <div className="flex items-center gap-1.5">
            {promos.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  currentIndex === i ? 'w-6 bg-white' : 'w-2 bg-white/40'
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentIndex((prev) => (prev - 1 + promos.length) % promos.length)}
              className="p-1.5 rounded-lg bg-black/30 hover:bg-black/50 text-white border border-white/10 transition-colors"
              aria-label="Previous promo"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentIndex((prev) => (prev + 1) % promos.length)}
              className="p-1.5 rounded-lg bg-black/30 hover:bg-black/50 text-white border border-white/10 transition-colors"
              aria-label="Next promo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
