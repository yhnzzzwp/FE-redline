'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  dummyKategori,
  dummyProduk,
  dummyPromos,
  fetchKatalog,
  fetchKategori,
  fetchPromos,
} from '@/lib/api';
import { Kategori, Produk, Promo } from '@/types';
import ProductCard from '@/components/ui/ProductCard';
import PromoCarousel from '@/components/ui/PromoCarousel';
import { Filter, ChevronDown } from 'lucide-react';

export default function HomePage() {
  const [products, setProducts] = useState<Produk[]>(dummyProduk);
  const [categories, setCategories] = useState<Kategori[]>(dummyKategori);
  const [promos, setPromos] = useState<Promo[]>(dummyPromos);
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterOpen, setFilterOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function initData() {
      const [categoriesData, promosData] = await Promise.all([
        fetchKategori(),
        fetchPromos(),
      ]);
      if (categoriesData.length > 0) setCategories(categoriesData);
      if (promosData.length > 0) setPromos(promosData);
    }
    initData();
  }, []);

  useEffect(() => {
    let active = true;

    async function loadProducts() {
      const res = await fetchKatalog({
        kategori: selectedCategory,
        cari: searchTerm || undefined,
      });
      if (active) {
        setProducts(res.data);
        setLoading(false);
      }
    }

    const timer = setTimeout(() => {
      loadProducts();
    }, searchTerm ? 200 : 0);

    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [selectedCategory, searchTerm]);

  const handleResetFilter = () => {
    setSelectedCategory(undefined);
    setSearchTerm('');
  };

  return (
    <div>
      <section className="rl-hero text-center">
        <div className="rl-kicker mb-3">
          Redline Komputer <b>&middot;</b> Salatiga
        </div>
        <h1 className="rl-hero-title">
          Tembus Batas<br />
          <i>Performa.</i>
        </h1>
        <p className="rl-hero-desc">
          Hardware pilihan yang diuji satu per satu, rakitan presisi, dan servis dengan estimasi biaya di muka. Dari workstation harian sampai mesin gaming yang digeber sampai garis merah.
        </p>

        <div className="flex gap-3 justify-center mt-6 flex-wrap px-3 rl-hero-actions">
          <a href="#katalog" className="btn-redline rl-btn-lg">
            Jelajahi Katalog
          </a>
          <Link href="/cek-servis" className="btn-ghost rl-btn-lg">
            Lacak Servis
          </Link>
        </div>

        <div className="rl-hero-stats">
          <div className="rl-hero-stat">
            <div className="rl-hero-stat-val">
              SEJAK <i>2016</i>
            </div>
            <div className="rl-hero-stat-label">Melayani Salatiga</div>
          </div>
          <div className="rl-hero-stat">
            <div className="rl-hero-stat-val">
              &plusmn;<i>24 JAM</i>
            </div>
            <div className="rl-hero-stat-label">Diagnosa Servis</div>
          </div>
          <div className="rl-hero-stat">
            <div className="rl-hero-stat-val">
              GARANSI <i>RESMI</i>
            </div>
            <div className="rl-hero-stat-label">Semua Produk</div>
          </div>
        </div>
      </section>

      <section id="katalog" className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-16 space-y-8">
        {promos.length > 0 && (
          <div data-reveal>
            <PromoCarousel promos={promos} />
          </div>
        )}

        <div className="text-center mb-6" data-reveal>
          <div className="rl-kicker mb-1">
            Spec-sheet <b>lengkap</b>
          </div>
          <h2 className="rl-title-lg mb-1">Katalog Produk</h2>
          <p className="text-neutral-500 text-sm mb-0">
            Temukan komponen dan periferal terbaik untuk kebutuhan PC Anda.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-3" data-reveal>
            <div className="rl-card p-4 lg:sticky lg:top-24">
              <button
                type="button"
                onClick={() => setFilterOpen(!filterOpen)}
                className="w-full flex items-center justify-between font-semibold text-sm lg:hidden pb-1"
                aria-expanded={filterOpen}
              >
                <span className="inline-flex items-center gap-2">
                  <Filter className="w-4 h-4 text-neutral-600" />
                  Filter Produk
                </span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    filterOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              <h3 className="rl-section-title hidden lg:block mb-3">Filter Produk</h3>

              <div className={`space-y-4 ${filterOpen ? 'block mt-4' : 'hidden lg:block'}`}>
                <div>
                  <label htmlFor="filter-cari" className="rl-label">
                    Cari Nama
                  </label>
                  <input
                    id="filter-cari"
                    type="text"
                    placeholder="Misal: RTX 4090"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="rl-input text-sm"
                  />
                </div>

                <div>
                  <label htmlFor="filter-kategori" className="rl-label">
                    Kategori
                  </label>
                  <select
                    id="filter-kategori"
                    value={selectedCategory || ''}
                    onChange={(e) =>
                      setSelectedCategory(
                        e.target.value ? Number(e.target.value) : undefined
                      )
                    }
                    className="rl-select text-sm"
                  >
                    <option value="">Semua Kategori</option>
                    {categories.map((kat) => (
                      <option key={kat.id} value={kat.id}>
                        {kat.nama_kategori}
                      </option>
                    ))}
                  </select>
                </div>

                {(searchTerm || selectedCategory !== undefined) && (
                  <div className="pt-2 text-center">
                    <button
                      type="button"
                      onClick={handleResetFilter}
                      className="text-xs text-neutral-500 hover:text-[#b01218] font-semibold underline bg-transparent border-0 cursor-pointer"
                    >
                      Reset Filter
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-9">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="h-60 rounded-xl bg-white border border-neutral-200 animate-pulse"
                  />
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {products.map((p, index) => (
                  <div
                    key={p.id}
                    data-reveal
                    style={{ '--reveal-d': `${(index % 3) * 80}ms` } as React.CSSProperties}
                  >
                    <ProductCard produk={p} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="rl-card p-12 text-center text-neutral-500 space-y-3" data-reveal>
                <h4 className="rl-title-md text-neutral-900 mb-1">
                  Produk Tidak Ditemukan
                </h4>
                <p className="text-sm text-neutral-500 max-w-md mx-auto">
                  Maaf, tidak ada produk yang cocok dengan kriteria filter Anda.
                </p>
                <button
                  type="button"
                  onClick={handleResetFilter}
                  className="btn-ghost text-xs mt-2"
                >
                  Reset Filter
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
