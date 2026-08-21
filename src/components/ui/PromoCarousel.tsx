'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Promo } from '@/types';
import { Tag, Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';

export default function PromoCarousel({ promos }: { promos: Promo[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!promos || promos.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % promos.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [promos]);

  if (!promos || promos.length === 0) return null;

  const current = promos[currentIndex];

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-rose-950/60 via-zinc-900/80 to-zinc-950 border border-rose-500/20 p-6 md:p-8 backdrop-blur-xl shadow-2xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
        <div className="space-y-3 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
            <Sparkles className="w-3.5 h-3.5 text-rose-400" />
            <span>PROMO SPESIAL</span>
          </div>

          <h2 className="text-2xl md:text-3xl font-black text-white tracking-tight">
            {current.nama_promo}
          </h2>

          <p className="text-sm text-zinc-300">
            Gunakan kode promo saat bertransaksi di toko untuk mendapatkan potongan harga spesial servis atau part.
          </p>

          <div className="flex items-center gap-3 pt-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-zinc-900 border border-white/10 text-white font-mono text-sm font-bold tracking-wider">
              <Tag className="w-4 h-4 text-rose-500" />
              <span>{current.kode_promo}</span>
            </div>
            {current.tipe_promo === 'Persen' ? (
              <span className="text-xs font-semibold text-rose-400">
                Diskon {current.besar_promo}%
              </span>
            ) : (
              <span className="text-xs font-semibold text-rose-400">
                Potongan Langsung Rp {current.besar_promo.toLocaleString('id-ID')}
              </span>
            )}
          </div>
        </div>

        {current.foto_promo && (
          <div className="relative w-full md:w-64 h-40 rounded-2xl overflow-hidden border border-white/10 bg-zinc-900 shrink-0">
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
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/10">
          <div className="flex items-center gap-1.5">
            {promos.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`h-1.5 rounded-full transition-all ${
                  currentIndex === i ? 'w-6 bg-rose-500' : 'w-2 bg-zinc-700'
                }`}
                aria-label={`Slide ${i + 1}`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentIndex((prev) => (prev - 1 + promos.length) % promos.length)}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/5"
              aria-label="Previous promo"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentIndex((prev) => (prev + 1) % promos.length)}
              className="p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-white/5"
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
