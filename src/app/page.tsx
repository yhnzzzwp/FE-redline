'use client';

import { useState, useEffect } from 'react';
import { fetchKatalog, fetchKategori, fetchPromos } from '@/lib/api';
import { Kategori, Produk, Promo } from '@/types';
import ProductCard from '@/components/ui/ProductCard';
import PromoCarousel from '@/components/ui/PromoCarousel';
import { Search, SlidersHorizontal, ShieldCheck, Wrench, Zap, Sparkles } from 'lucide-react';

export default function HomePage() {
  const [products, setProducts] = useState<Produk[]>([]);
  const [categories, setCategories] = useState<Kategori[]>([]);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function initData() {
      const [katData, promoData] = await Promise.all([
        fetchKategori(),
        fetchPromos(),
      ]);
      setCategories(katData);
      setPromos(promoData);
    }
    initData();
  }, []);

  useEffect(() => {
    async function loadProducts() {
      setLoading(true);
      const res = await fetchKatalog({
        kategori: selectedCategory,
        cari: searchTerm || undefined,
      });
      setProducts(res.data);
      setLoading(false);
    }

    const timer = setTimeout(() => {
      loadProducts();
    }, 300);

    return () => clearTimeout(timer);
  }, [selectedCategory, searchTerm]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
      {promos.length > 0 && <PromoCarousel promos={promos} />}

      <section className="relative overflow-hidden rounded-3xl glass-panel p-8 md:p-12 border border-white/5 bg-gradient-to-b from-zinc-900/60 to-zinc-950">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Katalog Resmi Redline Komputer</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Komponen Premium & Layanan Servis Terpercaya
          </h1>
          <p className="text-zinc-400 text-sm md:text-base leading-relaxed">
            Jelajahi berbagai pilihan hardware komputer original dan sparepart servis. Pemesanan dan ketersediaan langsung terhubung dengan tim teknisi kami via WhatsApp.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8 pt-8 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-zinc-100">100% Original</h4>
              <p className="text-xs text-zinc-400">Garansi distributor resmi</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-zinc-100">Teknisi Ahli</h4>
              <p className="text-xs text-zinc-400">Pengerjaan rapi & transparan</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-zinc-100">Fast Response</h4>
              <p className="text-xs text-zinc-400">Langsung konsultasi via WA</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-6">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari hardware, nama part, atau SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-zinc-900/80 border border-white/10 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500 transition-all"
            />
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 custom-scrollbar">
            <button
              onClick={() => setSelectedCategory(undefined)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                selectedCategory === undefined
                  ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/50'
                  : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-white/5'
              }`}
            >
              Semua Kategori
            </button>
            {categories.map((kat) => (
              <button
                key={kat.id}
                onClick={() => setSelectedCategory(kat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                  selectedCategory === kat.id
                    ? 'bg-rose-600 text-white shadow-lg shadow-rose-950/50'
                    : 'bg-zinc-900 text-zinc-400 hover:text-zinc-200 border border-white/5'
                }`}
              >
                {kat.nama_kategori}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-64 rounded-2xl bg-zinc-900/50 animate-pulse border border-white/5" />
            ))}
          </div>
        ) : products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((p) => (
              <ProductCard key={p.id} produk={p} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 rounded-3xl glass-panel border border-white/5 space-y-3">
            <SlidersHorizontal className="w-8 h-8 text-zinc-600 mx-auto" />
            <h3 className="text-base font-bold text-zinc-200">Tidak ada produk ditemukan</h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              Coba gunakan kata kunci pencarian lain atau pilih kategori yang berbeda.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
