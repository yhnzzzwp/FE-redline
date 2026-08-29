'use client';

import { useState } from 'react';
import produkData from '@/data/produk.json';
import { authFetch } from '@/lib/api';
import { useSession } from '@/lib/session';
import {
  ShoppingBag,
  Plus,
  Trash2,
  Download,
  Share2,
  CheckCircle,
  Search,
  Receipt,
  X,
  CloudOff,
} from 'lucide-react';
import { useConnection } from '@/lib/connection';
import { downloadReceiptPDF, shareReceiptPDFToWhatsApp, type ReceiptData } from '@/lib/pdfReceipt';

interface CartLine {
  id: string;
  produk_id?: number;
  nama_item: string;
  harga: number;
  jumlah: number;
  tipe: 'Produk' | 'Servis';
}

function createReceiptNumber(): string {
  return String(Date.now()).slice(-6);
}

function getFormattedDate(): string {
  return new Date().toLocaleString('id-ID');
}

export default function AdminPosPage() {
  const { user } = useSession();
  const { isOnline } = useConnection();
  const [cart, setCart] = useState<CartLine[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [namaPembeli, setNamaPembeli] = useState('Umum');
  const [nomorHp, setNomorHp] = useState('');
  const [metodeBayar, setMetodeBayar] = useState('Tunai');
  const [bayarNominal, setBayarNominal] = useState<number>(0);
  const [lastNota, setLastNota] = useState<ReceiptData | null>(null);

  // Manual Custom Item inputs
  const [customNama, setCustomNama] = useState('');
  const [customHarga, setCustomHarga] = useState<number | ''>('');
  const [customQty, setCustomQty] = useState<number>(1);
  const [customTipe, setCustomTipe] = useState<'Produk' | 'Servis'>('Produk');

  const filteredProducts = produkData.filter(
    (p) =>
      p.nama_produk.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.kategori.nama_kategori.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customNama.trim() || !customHarga || Number(customHarga) <= 0 || customQty < 1) return;

    const existingIndex = cart.findIndex((c) => c.nama_item.toLowerCase() === customNama.trim().toLowerCase());
    if (existingIndex > -1) {
      const updated = [...cart];
      updated[existingIndex].jumlah += Number(customQty);
      setCart(updated);
    } else {
      const newCustomId = `custom-${cart.length + 1}-${customNama.trim().slice(0, 5)}`;
      setCart([
        ...cart,
        {
          id: newCustomId,
          nama_item: customNama.trim(),
          harga: Number(customHarga),
          jumlah: Number(customQty),
          tipe: customTipe,
        },
      ]);
    }

    setCustomNama('');
    setCustomHarga('');
    setCustomQty(1);
  };

  const addFromCatalog = (p: (typeof produkData)[0]) => {
    const inputPrice = prompt(
      `Masukkan harga jual untuk "${p.nama_produk}":`,
      p.harga_dasar ? p.harga_dasar.toString() : '0'
    );
    if (inputPrice !== null && !isNaN(Number(inputPrice)) && Number(inputPrice) >= 0) {
      const existing = cart.find((c) => c.produk_id === p.id && c.harga === Number(inputPrice));
      if (existing) {
        setCart(
          cart.map((c) => (c.id === existing.id ? { ...c, jumlah: c.jumlah + 1 } : c))
        );
      } else {
        const newCatId = `cat-${p.id}-${cart.length + 1}`;
        setCart([
          ...cart,
          {
            id: newCatId,
            produk_id: p.id,
            nama_item: p.nama_produk,
            harga: Number(inputPrice),
            jumlah: 1,
            tipe: 'Produk',
          },
        ]);
      }
    }
  };

  const updateQtyDirect = (id: string, newQty: number) => {
    if (isNaN(newQty) || newQty < 1) return;
    setCart(cart.map((item) => (item.id === id ? { ...item, jumlah: newQty } : item)));
  };

  const updatePrice = (id: string, newPrice: number) => {
    if (isNaN(newPrice) || newPrice < 0) return;
    setCart(cart.map((c) => (c.id === id ? { ...c, harga: newPrice } : c)));
  };

  const removeItem = (id: string) => {
    setCart(cart.filter((c) => c.id !== id));
  };

  const subtotal = cart.reduce((acc, c) => acc + c.harga * c.jumlah, 0);
  const total = subtotal;
  const kembalian = Math.max(0, (bayarNominal || 0) - total);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    if (metodeBayar === 'Tunai' && (bayarNominal || 0) < total) {
      alert('Jumlah pembayaran kurang dari total tagihan!');
      return;
    }

    const kode_nota = createReceiptNumber();
    const completed: ReceiptData = {
      kode_nota,
      tanggal: getFormattedDate(),
      nama_pembeli: namaPembeli || 'Umum',
      nomor_hp: nomorHp,
      items: [...cart],
      subtotal,
      total,
      bayar: metodeBayar === 'Tunai' ? (bayarNominal || total) : total,
      kembalian,
      metode_bayar: metodeBayar,
      // Kasir diambil dari sesi yang sedang login. Sebelumnya ter-hardcode,
      // sehingga setiap struk mencantumkan nama yang sama siapa pun yang
      // menjaga kasir — sekaligus membocorkan nama itu ke bundle publik.
      kasir: user?.nama_pegawai ?? 'Kasir Redline',
    };

    // Simpan ke offline cache lokal agar transaksi toko aman 100%
    try {
      const existingStr = localStorage.getItem('redline_pos_local_transactions');
      const existingList = existingStr ? JSON.parse(existingStr) : [];
      existingList.unshift({ ...completed, synced: isOnline });
      localStorage.setItem('redline_pos_local_transactions', JSON.stringify(existingList.slice(0, 100)));
    } catch {
      // localStorage fallback
    }

    // Jika online, kirim ke endpoint backend
    if (isOnline) {
      // /pos/checkout terproteksi — panggil lewat authFetch supaya header
      // Authorization ikut terkirim. Sebelumnya dikirim tanpa token sehingga
      // selalu ditolak 401 dan penjualan tidak pernah tercatat di server.
      authFetch('/pos/checkout', {
        method: 'POST',
        body: JSON.stringify(completed),
      }).catch(() => null);
    }

    setLastNota(completed);
    setCart([]);
    setBayarNominal(0);
  };

  const handleDownloadPDF = () => {
    if (!lastNota) return;
    downloadReceiptPDF(lastNota);
  };

  const handleShareWhatsAppPDF = async () => {
    if (!lastNota) return;
    await shareReceiptPDFToWhatsApp(lastNota);
  };

  return (
    <div className="space-y-6">
      <div className="rl-page-header flex items-start justify-between flex-wrap gap-2">
        <div>
          <h1 className="rl-page-title mb-1">Kasir (POS)</h1>
          <p className="rl-page-desc mb-0">
            Pencatatan transaksi kasir dengan fleksibilitas input harga mandiri, cetak nota PDF, &amp; kirim WhatsApp.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Kolom Kiri: Input Item Manual & Master Katalog */}
        <div className="lg:col-span-7 space-y-6">
          {/* Input Item Manual dengan Harga Tersendiri */}
          <div className="rl-card p-5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-neutral-100">
              <Plus className="w-4 h-4 text-[#de1f26]" />
              <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                Input Harga
              </h2>
            </div>

            <form onSubmit={addCustomItem} className="space-y-3">
              <div>
                <label className="text-[11px] text-neutral-500 font-semibold block mb-1">
                  Nama Item / Keterangan Jasa
                </label>
                <input
                  type="text"
                  placeholder="barang / jasa"
                  value={customNama}
                  onChange={(e) => setCustomNama(e.target.value)}
                  required
                  className="rl-input text-xs w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-neutral-500 font-semibold block mb-1">
                    Jenis Item
                  </label>
                  <select
                    value={customTipe}
                    onChange={(e) => setCustomTipe(e.target.value as 'Produk' | 'Servis')}
                    className="rl-select text-xs w-full"
                  >
                    <option value="Produk">Produk / Barang</option>
                    <option value="Servis">Jasa / Servis</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-neutral-500 font-semibold block mb-1">
                    Harga Satuan (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={customHarga}
                    onChange={(e) => setCustomHarga(e.target.value ? Number(e.target.value) : '')}
                    required
                    className="rl-input text-xs w-full rl-mono"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 pt-1">
                <div className="flex items-center gap-2 text-xs">
                  <label className="font-semibold text-neutral-500">Jumlah:</label>
                  <input
                    type="number"
                    min="1"
                    value={customQty}
                    onChange={(e) => setCustomQty(Math.max(1, Number(e.target.value)))}
                    className="rl-input text-xs w-20 text-center rl-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="btn-redline py-2 px-4 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <span>Tambahkan</span>
                </button>
              </div>
            </form>
          </div>

          {/* Master Katalog */}
          <div className="rl-card p-5 space-y-4">
            <div className="flex items-center justify-between gap-4 pb-2 border-b border-neutral-100 flex-wrap">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-[#de1f26]" />
                <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider">
                  Pilih dari Master Katalog
                </h2>
              </div>
              <div className="relative w-full sm:w-64">
                <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Cari produk..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 rounded-xl bg-neutral-50 hover:bg-white focus:bg-white border border-neutral-200 focus:border-[#de1f26] focus:ring-2 focus:ring-red-100 text-xs text-neutral-800 transition-all outline-none"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 border-0 bg-transparent cursor-pointer p-0"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl bg-white border border-neutral-200 hover:border-[#de1f26]/50 transition-all flex flex-col justify-between gap-2 shadow-sm"
                >
                  <div>
                    <h4 className="font-bold text-xs text-neutral-900 line-clamp-2">
                      {p.nama_produk}
                    </h4>
                    <span className="text-[10px] rl-mono text-neutral-400 block mt-1">
                      SKU: {p.sku} &middot; {p.kategori.nama_kategori}
                    </span>
                    <span className="text-xs font-bold text-[#b01218] rl-mono mt-1 block">
                      Ref: Rp {(p.harga_dasar || 0).toLocaleString('id-ID')}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => addFromCatalog(p)}
                    className="w-full py-1.5 px-3 rounded-lg bg-neutral-100 hover:bg-[#de1f26] hover:text-white text-neutral-800 text-xs font-bold transition-all text-center border-0 cursor-pointer"
                  >
                    Tambahkan
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Rincian Keranjang & Checkout */}
        <div className="lg:col-span-5 space-y-6">
          <div className="rl-card p-6 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <h2 className="text-sm font-bold text-neutral-900 uppercase tracking-wider flex items-center gap-2">
                <Receipt className="w-4 h-4 text-[#de1f26]" />
                Rincian Nota Transaksi
              </h2>
              <span className="text-xs text-neutral-400 rl-mono font-semibold">
                {cart.length} Item
              </span>
            </div>

            {/* List Cart Items */}
            <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="py-12 text-center text-xs text-neutral-400">
                  Keranjang masih kosong. Tambahkan item di samping.
                </div>
              ) : (
                cart.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-xl bg-neutral-50 border border-neutral-200 flex flex-col gap-2 text-xs"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <span className="font-bold text-neutral-900 block leading-tight">
                          {item.nama_item}
                        </span>
                        <span className="text-[10px] font-semibold text-neutral-400 uppercase tracking-wider">
                          {item.tipe}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeItem(item.id)}
                        className="p-1 text-neutral-400 hover:text-red-600 bg-transparent border-0 cursor-pointer"
                        title="Hapus Item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-200/60">
                      <div className="flex items-center gap-1.5">
                        <label className="text-[10px] text-neutral-500">Harga:</label>
                        <input
                          type="number"
                          min="0"
                          value={item.harga}
                          onChange={(e) => updatePrice(item.id, Number(e.target.value))}
                          className="rl-input text-xs py-0.5 px-1.5 w-24 rl-mono font-semibold text-right"
                        />
                      </div>

                      <div className="flex items-center gap-1.5">
                        <label className="text-[10px] text-neutral-500">Qty:</label>
                        <input
                          type="number"
                          min="1"
                          value={item.jumlah}
                          onChange={(e) => updateQtyDirect(item.id, Number(e.target.value))}
                          className="rl-input text-xs py-0.5 px-1.5 w-14 rl-mono font-semibold text-center"
                        />
                      </div>

                      <span className="font-bold text-neutral-900 rl-mono">
                        Rp {(item.harga * item.jumlah).toLocaleString('id-ID')}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Informasi Pelanggan & Pembayaran */}
            <div className="space-y-3 pt-3 border-t border-neutral-100 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-neutral-500 font-semibold block mb-1">
                    Nama Pelanggan
                  </label>
                  <input
                    type="text"
                    value={namaPembeli}
                    onChange={(e) => setNamaPembeli(e.target.value)}
                    className="rl-input text-xs w-full"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-neutral-500 font-semibold block mb-1">
                    No. WhatsApp Pelanggan
                  </label>
                  <input
                    type="text"
                    placeholder="085640203069"
                    value={nomorHp}
                    onChange={(e) => setNomorHp(e.target.value)}
                    className="rl-input text-xs w-full"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] text-neutral-500 font-semibold block mb-1">
                  Metode Pembayaran
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {['Tunai', 'QRIS / Transfer', 'Debit'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMetodeBayar(m)}
                      className={`py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                        metodeBayar === m
                          ? 'border-[#de1f26] bg-red-50 text-[#b01218]'
                          : 'border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {metodeBayar === 'Tunai' && (
                <div>
                  <label className="text-[11px] text-neutral-500 font-semibold block mb-1">
                    Uang Diterima dari Pembeli (Rp)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={bayarNominal || ''}
                    onChange={(e) => setBayarNominal(Number(e.target.value))}
                    className="rl-input text-xs w-full rl-mono font-bold text-neutral-900"
                  />
                </div>
              )}

              {/* Rincian Total */}
              <div className="p-4 rounded-xl bg-neutral-100/70 border border-neutral-200 space-y-1.5 font-mono text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal</span>
                  <span>Rp {subtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between font-bold text-sm text-neutral-900 pt-1 border-t border-neutral-200">
                  <span>TOTAL TAGIHAN</span>
                  <span className="text-[#b01218]">Rp {total.toLocaleString('id-ID')}</span>
                </div>
                {metodeBayar === 'Tunai' && (
                  <div className="flex justify-between text-neutral-700 font-semibold pt-1 border-t border-neutral-200/60">
                    <span>Kembalian</span>
                    <span className={kembalian > 0 ? 'text-emerald-700 font-bold' : ''}>
                      Rp {kembalian.toLocaleString('id-ID')}
                    </span>
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                disabled={cart.length === 0}
                className="btn-redline w-full py-3 text-sm font-bold flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                <span>Selesaikan Transaksi &amp; Terbitkan Nota</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Popup Nota / PDF & Kirim WA PDF */}
      {lastNota && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-neutral-200 p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                <CheckCircle className="w-5 h-5" />
                <span>Transaksi Berhasil</span>
              </div>
              <button
                type="button"
                onClick={() => setLastNota(null)}
                className="text-neutral-400 hover:text-neutral-600 bg-transparent border-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {!isOnline && (
              <div className="p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-[11px] flex items-center gap-2">
                <CloudOff className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Mode Offline: Transaksi tersimpan di penyimpanan kasir lokal &amp; nota siap cetak.</span>
              </div>
            )}

            {/* Thermal Receipt Body */}
            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-800 space-y-3 text-xs font-mono">
              <div className="text-center pb-2 border-b border-neutral-200">
                <h3 className="font-bold text-sm uppercase tracking-wider text-neutral-900">
                  REDLINE KOMPUTER
                </h3>
                <p className="text-[10px] text-neutral-500 mb-0">
                  Jl. Pemuda No. 45, Salatiga &middot; 0856-4020-3069
                </p>
              </div>

              <div className="flex justify-between text-[11px] text-neutral-600">
                <span>Nota: #{lastNota.kode_nota}</span>
                <span>{lastNota.tanggal}</span>
              </div>

              <div className="text-[11px] text-neutral-600">
                <span>Pelanggan: {lastNota.nama_pembeli}</span>
                {lastNota.nomor_hp && <span> ({lastNota.nomor_hp})</span>}
              </div>

              <div className="border-t border-b border-neutral-200 py-2 space-y-1.5">
                {lastNota.items.map((item, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="font-semibold text-neutral-900">{item.nama_item}</div>
                    <div className="flex justify-between text-[11px] text-neutral-600">
                      <span>
                        {item.jumlah}x @ Rp {item.harga.toLocaleString('id-ID')}
                      </span>
                      <span>Rp {(item.jumlah * item.harga).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between font-bold text-neutral-900 text-xs">
                  <span>TOTAL</span>
                  <span>Rp {lastNota.total.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Metode</span>
                  <span>{lastNota.metode_bayar}</span>
                </div>
                {lastNota.metode_bayar === 'Tunai' && (
                  <>
                    <div className="flex justify-between text-neutral-600">
                      <span>Bayar</span>
                      <span>Rp {lastNota.bayar.toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-neutral-600">
                      <span>Kembalian</span>
                      <span>Rp {lastNota.kembalian.toLocaleString('id-ID')}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="text-center pt-2 border-t border-neutral-200 text-[10px] text-neutral-500">
                Terima kasih atas kunjungan Anda!
              </div>
            </div>

            {/* Action Buttons: Download PDF & Kirim PDF via WhatsApp */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDownloadPDF}
                className="py-2.5 px-3 rounded-lg bg-neutral-800 hover:bg-neutral-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Unduh PDF</span>
              </button>

              <button
                type="button"
                onClick={handleShareWhatsAppPDF}
                className="py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm transition-all border-0"
              >
                <Share2 className="w-4 h-4" />
                <span>Kirim PDF ke WA</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setLastNota(null)}
              className="w-full btn-ghost text-xs font-semibold py-2"
            >
              Tutup &amp; Transaksi Baru
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
