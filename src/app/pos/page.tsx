'use client';

import { useState, useEffect } from 'react';
import { fetchKatalog, syncPosTransactions } from '@/lib/api';
import { saveOfflineTransaction, getOfflineTransactions, markTransactionsSynced } from '@/lib/storage';
import { OfflineTransaction, PosCartLine, Produk } from '@/types';
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
} from 'lucide-react';

export default function PosPage() {
  const [products, setProducts] = useState<Produk[]>([]);
  const [cart, setCart] = useState<PosCartLine[]>([]);
  const [isOnline, setIsOnline] = useState(() => typeof window !== 'undefined' ? navigator.onLine : true);
  const [offlineCount, setOfflineCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [namaPembeli, setNamaPembeli] = useState('Umum');
  const [nomorHp, setNomorHp] = useState('');
  const [metodeBayar, setMetodeBayar] = useState('Tunai');
  const [bayarNominal, setBayarNominal] = useState<number>(0);
  const [lastReceipt, setLastReceipt] = useState<OfflineTransaction | null>(null);

  const [customNama, setCustomNama] = useState('');
  const [customHarga, setCustomHarga] = useState<number>(0);
  const [customQty, setCustomQty] = useState<number>(1);

  useEffect(() => {
    async function loadInitial() {
      const res = await fetchKatalog();
      setProducts(res.data);
      updateOfflineQueueCount();
    }

    loadInitial();

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  async function updateOfflineQueueCount() {
    try {
      const stored = await getOfflineTransactions();
      const unsynced = stored.filter((t) => !t.is_synced);
      setOfflineCount(unsynced.length);
    } catch {
      setOfflineCount(0);
    }
  }

  function addToCart(item: { nama: string; produk_id?: number; service_id?: number; harga: number }) {
    const existingIndex = cart.findIndex(
      (c) => c.nama_item === item.nama && c.harga === item.harga
    );

    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].jumlah += 1;
      setCart(updated);
    } else {
      const newLine: PosCartLine = {
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
    const newLine: PosCartLine = {
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
        .filter(Boolean) as PosCartLine[]
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

    const localId = `TX-OFFLINE-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const newTx: OfflineTransaction = {
      local_id: localId,
      created_at: new Date().toISOString(),
      items: [...cart],
      subtotal,
      diskon: 0,
      total,
      bayar: metodeBayar === 'Tunai' ? bayarNominal : total,
      kembalian,
      metode_bayar: metodeBayar,
      nama_pembeli: namaPembeli || 'Umum',
      nomor_hp_pembeli: nomorHp || undefined,
      is_synced: false,
    };

    await saveOfflineTransaction(newTx);
    setLastReceipt(newTx);
    setCart([]);
    setBayarNominal(0);
    updateOfflineQueueCount();

    if (isOnline) {
      handleSync();
    }
  }

  async function handleSync() {
    setSyncing(true);
    try {
      const stored = await getOfflineTransactions();
      const unsynced = stored.filter((t) => !t.is_synced);

      if (unsynced.length > 0) {
        const res = await syncPosTransactions(unsynced);
        if (res.status === 'success' || res.status === 'partial') {
          const syncedIds = unsynced.map((u) => u.local_id);
          await markTransactionsSynced(syncedIds);
          await updateOfflineQueueCount();
        }
      }
    } catch {
    } finally {
      setSyncing(false);
    }
  }

  const filteredProducts = products.filter(
    (p) =>
      p.nama_produk.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
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
          <div
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border ${
              isOnline
                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
            }`}
          >
            {isOnline ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
            <span>{isOnline ? 'Online' : 'Offline (Tersimpan Lokal)'}</span>
          </div>

          <button
            onClick={handleSync}
            disabled={syncing || offlineCount === 0}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-xs font-semibold text-zinc-200 border border-white/10 transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
            <span>Sync ({offlineCount} Pending)</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-6">
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

          <div className="p-5 rounded-2xl glass-panel border border-white/5 space-y-4">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-sm font-bold text-zinc-200 uppercase tracking-wider">
                Pilih dari Master Katalog
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto custom-scrollbar pr-1">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-xl bg-zinc-900/60 border border-white/5 flex flex-col justify-between gap-3 hover:border-rose-500/30 transition-all"
                >
                  <div>
                    <h4 className="text-xs font-bold text-zinc-100 line-clamp-1">{p.nama_produk}</h4>
                    <span className="text-[10px] font-mono text-zinc-500">{p.sku || 'No SKU'}</span>
                  </div>
                  <button
                    onClick={() => {
                      const inputPrice = prompt(`Masukkan harga jual untuk "${p.nama_produk}":`, '0');
                      if (inputPrice !== null && !isNaN(Number(inputPrice))) {
                        addToCart({
                          nama: p.nama_produk,
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
          </div>
        </div>

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
              Proses Transaksi & Cetak Nota
            </button>
          </div>
        </div>
      </div>

      {lastReceipt && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-sm rounded-3xl bg-zinc-950 border border-white/10 p-6 space-y-6 shadow-2xl">
            <div className="text-center space-y-1">
              <CheckCircle className="w-10 h-10 text-emerald-400 mx-auto" />
              <h3 className="text-lg font-bold text-white">Transaksi Berhasil</h3>
              <p className="text-xs font-mono text-zinc-400">{lastReceipt.local_id}</p>
            </div>

            <div className="p-4 rounded-xl bg-zinc-900/60 border border-white/5 space-y-2 text-xs">
              <div className="flex justify-between text-zinc-400">
                <span>Customer</span>
                <span className="text-zinc-200 font-semibold">{lastReceipt.nama_pembeli}</span>
              </div>
              <div className="flex justify-between text-zinc-400">
                <span>Metode Bayar</span>
                <span className="text-zinc-200 font-semibold">{lastReceipt.metode_bayar}</span>
              </div>
              <div className="flex justify-between text-zinc-400 pt-2 border-t border-white/5">
                <span>Total</span>
                <span className="font-mono font-bold text-white">
                  Rp {lastReceipt.total.toLocaleString('id-ID')}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
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
    </div>
  );
}
