'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchKatalog } from '@/lib/api';
import { useConnection } from '@/lib/connection';
import {
  savePendingTransaction,
  countPending,
  countConflicts,
  getCachedProduk,
  cacheProdukList,
  searchCachedProduk,
  getAllTransactions,
} from '@/lib/storage';
import { syncPendingTransactions, type SyncReport } from '@/lib/sync';
import type { TransaksiPending, TransaksiPendingItem, ProdukCache } from '@/lib/db';
import {
  ShoppingBag,
  Plus,
  Trash2,
  Printer,
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle,
  Search,
  AlertTriangle,
  X,
} from 'lucide-react';

// ─── Types lokal ───────────────────────────────────────────────────
interface CartLine {
  id: string;
  produk_id?: number;
  service_id?: number;
  tipe: 'produk' | 'service';
  nama_item: string;
  harga: number;
  jumlah: number;
}

export default function PosPage() {
  // ─── State ─────────────────────────────────────────────────────
  const { isOnline, checkNow } = useConnection();
  const [products, setProducts] = useState<ProdukCache[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [conflictCount, setConflictCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastSyncReport, setLastSyncReport] = useState<SyncReport | null>(null);
  const [showConflictPanel, setShowConflictPanel] = useState(false);
  const [conflictItems, setConflictItems] = useState<TransaksiPending[]>([]);

  const [namaPembeli, setNamaPembeli] = useState('Umum');
  const [nomorHp, setNomorHp] = useState('');
  const [metodeBayar, setMetodeBayar] = useState('Tunai');
  const [bayarNominal, setBayarNominal] = useState<number>(0);
  const [lastReceipt, setLastReceipt] = useState<TransaksiPending | null>(null);

  const [customNama, setCustomNama] = useState('');
  const [customHarga, setCustomHarga] = useState<number>(0);
  const [customQty, setCustomQty] = useState<number>(1);

  const prevOnline = useRef(isOnline);

  // ─── Refresh counts ────────────────────────────────────────────
  const refreshCounts = useCallback(async () => {
    const [pc, cc] = await Promise.all([countPending(), countConflicts()]);
    setPendingCount(pc);
    setConflictCount(cc);
  }, []);

  // ─── Load products: online → fetch & cache, offline → from cache ─
  const loadProducts = useCallback(async () => {
    if (isOnline) {
      try {
        const res = await fetchKatalog();
        const cached: ProdukCache[] = res.data.map((p) => ({
          id: p.id,
          nama: p.nama_produk,
          sku: p.sku,
          kategori: p.kategori?.nama_kategori || 'Hardware',
          hargaTerakhir: 0,
          stokTerakhir: 0,
          updatedAt: new Date().toISOString(),
        }));
        await cacheProdukList(cached);
        setProducts(cached);
      } catch {
        // Fallback ke cache kalau fetch gagal
        const cached = await getCachedProduk();
        setProducts(cached);
      }
    } else {
      const cached = await getCachedProduk();
      setProducts(cached);
    }
  }, [isOnline]);

  // ─── Init: load products & counts saat pertama kali mount ───────
  // Menggunakan IIFE di dalam effect untuk menghindari lint error
  // karena loadProducts dan refreshCounts memanggil setState.
  useEffect(() => {
    const init = async () => {
      await loadProducts();
      await refreshCounts();
    };
    void init();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Auto-sync saat status berubah dari offline → online (#6) ──
  useEffect(() => {
    if (isOnline && !prevOnline.current) {
      // Baru saja kembali online — trigger sync + refresh cache produk
      void (async () => {
        await handleSync();
        await loadProducts();
      })();
    }
    prevOnline.current = isOnline;
  }, [isOnline]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Sync handler ──────────────────────────────────────────────
  async function handleSync() {
    setSyncing(true);
    try {
      const report = await syncPendingTransactions();
      setLastSyncReport(report);
      await refreshCounts();

      // Jika ada conflict, load detail untuk panel
      if (report.conflicts > 0) {
        const all = await getAllTransactions();
        setConflictItems(all.filter((t) => t.status === 'conflict'));
        setShowConflictPanel(true);
      }
    } catch {
      // sync gagal total — biarkan pending
    } finally {
      setSyncing(false);
    }
  }

  // ─── Cart logic ────────────────────────────────────────────────
  function addToCart(item: { nama: string; produk_id?: number; service_id?: number; harga: number }) {
    const existingIndex = cart.findIndex(
      (c) => c.nama_item === item.nama && c.harga === item.harga
    );

    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].jumlah += 1;
      setCart(updated);
    } else {
      const newLine: CartLine = {
        id: crypto.randomUUID(),
        nama_item: item.nama,
        produk_id: item.produk_id,
        service_id: item.service_id,
        tipe: item.service_id ? 'service' : 'produk',
        harga: item.harga,
        jumlah: 1,
      };
      setCart([...cart, newLine]);
    }
  }

  function addCustomItem() {
    if (!customNama.trim() || customHarga < 0 || customQty < 1) return;
    const newLine: CartLine = {
      id: crypto.randomUUID(),
      nama_item: customNama.trim(),
      tipe: 'produk',
      harga: Number(customHarga),
      jumlah: Number(customQty),
    };
    setCart([...cart, newLine]);
    setCustomNama('');
    setCustomHarga(0);
    setCustomQty(1);
  }

  function updateQty(id: string, delta: number) {
    setCart(
      cart
        .map((line) => {
          if (line.id === id) {
            const next = line.jumlah + delta;
            return next > 0 ? { ...line, jumlah: next } : null;
          }
          return line;
        })
        .filter(Boolean) as CartLine[]
    );
  }

  function removeLine(id: string) {
    setCart(cart.filter((c) => c.id !== id));
  }

  const subtotal = cart.reduce((acc, item) => acc + item.harga * item.jumlah, 0);
  const total = subtotal;
  const kembalian = Math.max(0, bayarNominal - total);

  async function handleCheckout() {
    if (cart.length === 0) return;
    if (metodeBayar === 'Tunai' && bayarNominal < total) {
      alert('Jumlah pembayaran kurang dari total tagihan!');
      return;
    }

    const localId = `TX-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const txItems: TransaksiPendingItem[] = cart.map((c) => ({
      id: c.id,
      produk_id: c.produk_id,
      service_id: c.service_id,
      tipe: c.tipe,
      nama_item: c.nama_item,
      harga: c.harga,
      jumlah: c.jumlah,
    }));

    const newTx: TransaksiPending = {
      localId,
      status: 'pending',
      createdAt: new Date().toISOString(),
      items: txItems,
      subtotal,
      diskon: 0,
      total,
      bayar: metodeBayar === 'Tunai' ? bayarNominal : total,
      kembalian,
      metode_bayar: metodeBayar,
      nama_pembeli: namaPembeli || 'Umum',
      nomor_hp_pembeli: nomorHp || undefined,
    };

    const currentlyOnline = await checkNow();

    if (currentlyOnline) {
      try {
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8080/api/v1';
        const res = await fetch(`${API_BASE}/pos/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: txItems,
            subtotal,
            diskon: 0,
            total,
            bayar: newTx.bayar,
            kembalian,
            metode_bayar: metodeBayar,
            nama_pembeli: newTx.nama_pembeli,
            nomor_hp_pembeli: newTx.nomor_hp_pembeli,
          }),
        });

        if (res.ok) {
          const json = await res.json();
          newTx.status = 'synced';
          newTx.kode_nota = json.data?.kode_nota;
          newTx.server_id = json.data?.id;
        } else {
          // Server reject — simpan sebagai pending
          newTx.status = 'pending';
        }
      } catch {
        // Network error saat kirim — simpan offline
        newTx.status = 'pending';
      }
    }
    // Jalur offline: status tetap 'pending', disimpan di IndexedDB

    await savePendingTransaction(newTx);
    setLastReceipt(newTx);
    setCart([]);
    setBayarNominal(0);
    await refreshCounts();
  }

  // ─── Cetak nota (#5) ───────────────────────────────────────────
  function handlePrintReceipt() {
    window.print();
  }

  // ─── Filter produk (dari cache lokal) ──────────────────────────
  const [filteredProducts, setFilteredProducts] = useState<ProdukCache[]>([]);

  useEffect(() => {
    async function filterProducts() {
      if (searchTerm.trim()) {
        const results = await searchCachedProduk(searchTerm);
        setFilteredProducts(results);
      } else {
        setFilteredProducts(products);
      }
    }
    const timer = setTimeout(filterProducts, 200);
    return () => clearTimeout(timer);
  }, [searchTerm, products]);

  // ─── Render ────────────────────────────────────────────────────
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* ── #7: Header + Status Badge ─────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-2xl glass-panel border border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-400">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white">Kasir POS (Offline-Resilient)</h1>
            <p className="text-xs text-zinc-400">Input harga manual per-nota & sinkronisasi otomatis</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Badge status koneksi */}
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
              isOnline
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-red-500/10 text-red-400 border-red-500/20'
            }`}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span>
              {isOnline ? 'Online' : 'Offline'}
              {!isOnline && pendingCount > 0 && ` — ${pendingCount} transaksi menunggu`}
            </span>
          </div>

          {/* Badge conflict */}
          {conflictCount > 0 && (
            <button
              onClick={() => {
                getAllTransactions().then((all) => {
                  setConflictItems(all.filter((t) => t.status === 'conflict'));
                  setShowConflictPanel(true);
                });
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{conflictCount} Conflict</span>
            </button>
          )}

          {/* Tombol sync manual */}
          <button
            onClick={handleSync}
            disabled={syncing || pendingCount === 0}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-xs font-semibold text-zinc-200 border border-white/10 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>Sync ({pendingCount} Pending)</span>
          </button>
        </div>
      </div>

      {/* ── Sync report toast ─────────────────────────────────── */}
      {lastSyncReport && lastSyncReport.total > 0 && (
        <div className="p-4 rounded-2xl glass-panel border border-white/5 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <span className="text-zinc-300">
              Sync selesai: <strong className="text-emerald-400">{lastSyncReport.synced}</strong> berhasil
              {lastSyncReport.conflicts > 0 && (
                <>, <strong className="text-amber-400">{lastSyncReport.conflicts}</strong> conflict</>
              )}
              {lastSyncReport.errors.length > 0 && (
                <>, <strong className="text-red-400">{lastSyncReport.errors.length}</strong> error</>
              )}
            </span>
          </div>
          <button onClick={() => setLastSyncReport(null)} className="text-zinc-500 hover:text-zinc-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* ── Kolom kiri: Input item ──────────────────────────── */}
        <div className="lg:col-span-7 space-y-6">
          {/* Input manual */}
          <div className="p-5 rounded-2xl glass-panel border border-white/5 space-y-4">
            <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
              Input Item Manual
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              <div className="sm:col-span-6">
                <input
                  type="text"
                  placeholder="Nama barang / jasa..."
                  value={customNama}
                  onChange={(e) => setCustomNama(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                />
              </div>
              <div className="sm:col-span-3">
                <input
                  type="number"
                  placeholder="Harga (Rp)"
                  value={customHarga || ''}
                  onChange={(e) => setCustomHarga(Number(e.target.value))}
                  className="w-full px-3.5 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-rose-500"
                />
              </div>
              <div className="sm:col-span-3 flex gap-2">
                <input
                  type="number"
                  min="1"
                  value={customQty}
                  onChange={(e) => setCustomQty(Number(e.target.value))}
                  className="w-16 px-2 py-2 rounded-xl bg-zinc-900 border border-white/10 text-xs text-zinc-100 text-center focus:outline-none focus:border-rose-500"
                />
                <button
                  onClick={addCustomItem}
                  className="flex-1 px-3 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all"
                >
                  <Plus className="w-4 h-4 mx-auto" />
                </button>
              </div>
            </div>
          </div>

          {/* Katalog dari cache */}
          <div className="p-5 rounded-2xl glass-panel border border-white/5 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
                {isOnline ? 'Pilih dari Master Katalog' : 'Katalog (Cache Offline)'}
              </h2>
              <div className="relative w-48">
                <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-xs text-zinc-100 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="py-8 text-center text-xs text-zinc-500">
                {isOnline
                  ? 'Tidak ada produk ditemukan.'
                  : 'Cache produk kosong. Buka halaman ini saat online terlebih dahulu untuk menyimpan data produk.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto custom-scrollbar pr-1">
                {filteredProducts.map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-xl bg-zinc-900/60 border border-white/5 flex flex-col justify-between gap-3 hover:border-rose-500/30 transition-all"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-zinc-100 line-clamp-1">{p.nama}</h4>
                      <span className="text-[10px] font-mono text-zinc-500">{p.sku || 'No SKU'}</span>
                    </div>
                    <button
                      onClick={() => {
                        const inputPrice = prompt(`Masukkan harga jual untuk "${p.nama}":`, '0');
                        if (inputPrice !== null && !isNaN(Number(inputPrice))) {
                          addToCart({
                            nama: p.nama,
                            produk_id: p.id,
                            harga: Number(inputPrice),
                          });
                        }
                      }}
                      className="w-full py-1.5 px-3 rounded-lg bg-zinc-800 hover:bg-rose-600 hover:text-white text-zinc-300 text-xs font-semibold transition-all"
                    >
                      + Masukkan Keranjang
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Kolom kanan: Nota ────────────────────────────────── */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 rounded-2xl glass-panel border border-white/5 space-y-6">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider pb-3 border-b border-white/5">
              Rincian Nota Transaksi
            </h2>

            <div className="space-y-3 max-h-64 overflow-y-auto custom-scrollbar pr-1">
              {cart.length === 0 ? (
                <div className="py-8 text-center text-xs text-zinc-500">
                  Keranjang kosong. Tambahkan item di samping.
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-zinc-900/60 border border-white/5 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex-1 min-w-0">
                      <h5 className="font-bold text-zinc-200 truncate">{item.nama_item}</h5>
                      <span className="font-mono text-zinc-400">
                        {item.jumlah} × Rp {item.harga.toLocaleString('id-ID')}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQty(item.id, -1)}
                        className="w-6 h-6 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 font-bold"
                      >
                        -
                      </button>
                      <span className="font-mono w-4 text-center font-bold">{item.jumlah}</span>
                      <button
                        onClick={() => updateQty(item.id, 1)}
                        className="w-6 h-6 rounded bg-zinc-800 text-zinc-300 hover:bg-zinc-700 font-bold"
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeLine(item.id)}
                        className="p-1 text-zinc-500 hover:text-rose-400 ml-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="space-y-3 pt-4 border-t border-white/5">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="text-[10px] text-zinc-400 font-semibold block mb-1">
                    Nama Customer
                  </label>
                  <input
                    type="text"
                    value={namaPembeli}
                    onChange={(e) => setNamaPembeli(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-xs text-zinc-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-400 font-semibold block mb-1">
                    No. WhatsApp
                  </label>
                  <input
                    type="text"
                    placeholder="08xxxxxxxx"
                    value={nomorHp}
                    onChange={(e) => setNomorHp(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg bg-zinc-900 border border-white/10 text-xs text-zinc-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] text-zinc-400 font-semibold block mb-1">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Tunai', 'QRIS', 'Transfer'].map((m) => (
                    <button
                      key={m}
                      onClick={() => setMetodeBayar(m)}
                      className={`py-2 rounded-lg text-xs font-semibold border transition-all ${
                        metodeBayar === m
                          ? 'bg-rose-600 text-white border-rose-500'
                          : 'bg-zinc-900 text-zinc-400 border-white/5'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {metodeBayar === 'Tunai' && (
                <div>
                  <label className="text-[10px] text-zinc-400 font-semibold block mb-1">
                    Jumlah Bayar (Rp)
                  </label>
                  <input
                    type="number"
                    value={bayarNominal || ''}
                    onChange={(e) => setBayarNominal(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-900 border border-white/10 text-sm font-mono text-zinc-100"
                  />
                </div>
              )}
            </div>

            <div className="space-y-1.5 pt-4 border-t border-white/5 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Total Belanja</span>
                <span className="font-mono text-sm font-bold text-white">
                  Rp {total.toLocaleString('id-ID')}
                </span>
              </div>
              {metodeBayar === 'Tunai' && (
                <div className="flex justify-between text-zinc-400">
                  <span>Kembalian</span>
                  <span className="font-mono font-bold text-emerald-400">
                    Rp {kembalian.toLocaleString('id-ID')}
                  </span>
                </div>
              )}
            </div>

            <button
              onClick={handleCheckout}
              disabled={cart.length === 0}
              className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 disabled:opacity-50 text-white text-sm font-bold shadow-lg shadow-rose-950/50 transition-all active:scale-95"
            >
              {isOnline ? 'Proses Transaksi' : 'Simpan Transaksi (Offline)'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Modal: Receipt / Nota (#5) ────────────────────────── */}
      {lastReceipt && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-zinc-950 border border-white/10 p-6 space-y-6 shadow-2xl print:shadow-none print:border-0 print:bg-white print:text-black print:rounded-none">
            {/* Print-specific styles */}
            <style>{`
              @media print {
                body > *:not(.fixed) { display: none !important; }
                .fixed { position: static !important; background: white !important; }
                .print\\:hidden { display: none !important; }
                .print\\:text-black { color: black !important; }
                .print\\:bg-white { background: white !important; }
              }
            `}</style>

            <div className="text-center space-y-1">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto print:hidden" />
              <h3 className="text-lg font-bold text-white print:text-black">
                {lastReceipt.status === 'synced' ? 'Transaksi Berhasil' : 'Tersimpan Offline'}
              </h3>
              {/* #5: Nota offline pakai label PENDING-{localId}, nota online pakai kode_nota */}
              <p className="text-xs font-mono text-zinc-400 print:text-black">
                {lastReceipt.status === 'synced' && lastReceipt.kode_nota
                  ? lastReceipt.kode_nota
                  : `PENDING-${lastReceipt.localId.substring(0, 12)}`}
              </p>
              <p className="text-[10px] text-zinc-500 print:text-gray-600">
                {new Date(lastReceipt.createdAt).toLocaleString('id-ID')}
              </p>
            </div>

            {/* Detail items */}
            <div className="space-y-1 text-xs border-t border-b border-white/5 py-3 print:border-gray-300">
              {lastReceipt.items.map((item, idx) => (
                <div key={idx} className="flex justify-between text-zinc-300 print:text-black">
                  <span>{item.nama_item} ×{item.jumlah}</span>
                  <span className="font-mono">Rp {(item.harga * item.jumlah).toLocaleString('id-ID')}</span>
                </div>
              ))}
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/5 space-y-2 text-xs print:bg-gray-50 print:border-gray-300">
              <div className="flex justify-between text-zinc-400 print:text-gray-600">
                <span>Customer</span>
                <span className="text-zinc-200 font-semibold print:text-black">{lastReceipt.nama_pembeli}</span>
              </div>
              <div className="flex justify-between text-zinc-400 print:text-gray-600">
                <span>Metode Bayar</span>
                <span className="text-zinc-200 font-semibold print:text-black">{lastReceipt.metode_bayar}</span>
              </div>
              <div className="flex justify-between text-zinc-400 pt-2 border-t border-white/5 print:border-gray-300">
                <span>Total</span>
                <span className="font-mono font-bold text-white print:text-black">
                  Rp {lastReceipt.total.toLocaleString('id-ID')}
                </span>
              </div>
              {lastReceipt.metode_bayar === 'Tunai' && (
                <>
                  <div className="flex justify-between text-zinc-400 print:text-gray-600">
                    <span>Bayar</span>
                    <span className="font-mono text-zinc-200 print:text-black">
                      Rp {lastReceipt.bayar.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between text-zinc-400 print:text-gray-600">
                    <span>Kembalian</span>
                    <span className="font-mono font-bold text-emerald-400 print:text-black">
                      Rp {lastReceipt.kembalian.toLocaleString('id-ID')}
                    </span>
                  </div>
                </>
              )}
            </div>

            {lastReceipt.status !== 'synced' && (
              <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-400 text-center print:bg-yellow-50 print:text-yellow-800 print:border-yellow-300">
                ⚠ Nota ini belum tersinkronisasi. Kode nota resmi akan diterbitkan setelah sync ke server.
              </div>
            )}

            <div className="flex gap-2 print:hidden">
              <button
                onClick={handlePrintReceipt}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Nota</span>
              </button>
              <button
                onClick={() => setLastReceipt(null)}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── #7: Panel conflict ────────────────────────────────── */}
      {showConflictPanel && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-3xl bg-zinc-950 border border-amber-500/30 p-6 space-y-4 shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-amber-400" />
                <h3 className="text-lg font-bold text-white">Transaksi Conflict</h3>
              </div>
              <button onClick={() => setShowConflictPanel(false)} className="text-zinc-500 hover:text-zinc-300">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-zinc-400">
              Transaksi berikut gagal disinkronisasi karena conflict. Periksa dan selesaikan secara manual.
            </p>

            <div className="space-y-3">
              {conflictItems.map((tx) => (
                <div key={tx.localId} className="p-4 rounded-xl bg-zinc-900/80 border border-amber-500/20 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-amber-400">{tx.localId}</span>
                    <span className="text-zinc-500">{new Date(tx.createdAt).toLocaleString('id-ID')}</span>
                  </div>
                  <div className="text-xs text-zinc-300">
                    {tx.items.length} item · Rp {tx.total.toLocaleString('id-ID')} · {tx.nama_pembeli}
                  </div>
                  {tx.conflict_reason && (
                    <div className="text-xs text-red-400 bg-red-500/10 p-2 rounded-lg border border-red-500/20">
                      Alasan: {tx.conflict_reason}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {conflictItems.length === 0 && (
              <div className="text-center py-6 text-xs text-zinc-500">
                Tidak ada conflict yang perlu diselesaikan.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
