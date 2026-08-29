'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from '@/lib/session';
import { useApiData } from '@/lib/useApiData';
import { savePendingTransaction, countPending } from '@/lib/storage';
import { syncPendingTransactions } from '@/lib/sync';
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
  /**
   * Wajib untuk baris servis yang berasal dari tiket.
   *
   * Tanpa ini backend hanya mencatat uangnya: tiket servisnya tidak pernah
   * tertaut ke transaksi dan unitnya tidak pernah ditandai sudah diambil.
   * Harga baris servis juga ditetapkan ulang oleh server dari tiketnya —
   * perangkat kasir tidak dipercaya untuk itu.
   */
  service_id?: number;
  nama_item: string;
  harga: number;
  jumlah: number;
  tipe: 'Produk' | 'Servis';
}

/** Produk dari /pos/items. Katalog sengaja tanpa harga sejak migrasi
 *  2026_08_20_000003 — harga jual diisi kasir saat transaksi. */
interface ItemProduk {
  id: number;
  nama: string;
  sku: string | null;
  nama_kategori: string | null;
}

/** Servis yang belum diambil pelanggan, dengan harga dari server. */
interface ItemServis {
  id: number;
  nomor_resi: string;
  nama: string;
  nama_customer: string | null;
  status: string;
  siap_diambil: boolean;
  total_biaya: number;
}

interface DataKatalog {
  produk: ItemProduk[];
  services: ItemServis[];
}

function createReceiptNumber(): string {
  return String(Date.now()).slice(-6);
}

/**
 * Id unik lintas perangkat untuk antrean offline.
 *
 * Kolom transaksi.local_id di backend ber-index UNIQUE, jadi tabrakan berarti
 * satu penjualan diam-diam dianggap "sudah tersinkron" dan hilang. Nomor nota
 * enam digit berbasis waktu jelas tidak cukup untuk dua tablet kasir.
 */
function createLocalId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `rl-${crypto.randomUUID()}`;
  }
  return `rl-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
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
  const [antre, setAntre] = useState(0);

  // Tampilkan berapa penjualan yang masih menunggu terkirim ke server.
  useEffect(() => {
    let batal = false;
    void (async () => {
      const n = await countPending().catch(() => 0);
      if (!batal) setAntre(n);
    })();
    return () => {
      batal = true;
    };
  }, [lastNota, isOnline]);

  // Dialog harga jual saat produk katalog dimasukkan ke keranjang.
  const [produkDipilih, setProdukDipilih] = useState<ItemProduk | null>(null);
  const [hargaInput, setHargaInput] = useState<string>('');

  // Manual Custom Item inputs
  const [customNama, setCustomNama] = useState('');
  const [customHarga, setCustomHarga] = useState<number | ''>('');
  const [customQty, setCustomQty] = useState<number>(1);
  const [customTipe, setCustomTipe] = useState<'Produk' | 'Servis'>('Produk');

  // Katalog dimuat dari basis data, bukan dari src/data/produk.json. Berkas
  // statis itu memuat produk yang tidak ada di basis data beserta harga acuan
  // yang tidak pernah dipakai backend — kasir bisa menjual barang yang tidak
  // pernah ada, dan tidak pernah melihat barang yang sungguh terdaftar.
  const { data: katalog, loading: memuatKatalog, error: galatKatalog } =
    useApiData<DataKatalog>('/pos/items', (json) => json.data as DataKatalog);

  const filteredProducts = useMemo(() => {
    const kata = searchTerm.toLowerCase();
    return (katalog?.produk ?? []).filter(
      (p) =>
        p.nama.toLowerCase().includes(kata) ||
        (p.sku ?? '').toLowerCase().includes(kata) ||
        (p.nama_kategori ?? '').toLowerCase().includes(kata)
    );
  }, [katalog, searchTerm]);

  const daftarServis = useMemo(() => {
    const kata = searchTerm.toLowerCase();
    return (katalog?.services ?? []).filter(
      (s) =>
        s.nama.toLowerCase().includes(kata) ||
        s.nomor_resi.toLowerCase().includes(kata) ||
        (s.nama_customer ?? '').toLowerCase().includes(kata)
    );
  }, [katalog, searchTerm]);

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

  /**
   * Masukkan produk ke keranjang dengan harga yang diketik kasir.
   *
   * Harga memang bukan dari basis data: kolomnya dihapus pada migrasi
   * 2026_08_20_000003 dan backend sengaja menerima harga produk dari kasir.
   * Yang diganti di sini hanya cara menanyakannya — prompt() bawaan browser
   * tidak bisa membatalkan salah ketik dengan jelas, tidak memformat angka,
   * dan pada sebagian browser bisa diblokir diam-diam.
   */
  const terapkanHargaProduk = () => {
    if (!produkDipilih) return;
    const harga = Number(hargaInput);
    if (hargaInput === '' || Number.isNaN(harga) || harga < 0) return;

    const existing = cart.find((c) => c.produk_id === produkDipilih.id && c.harga === harga);
    if (existing) {
      setCart(cart.map((c) => (c.id === existing.id ? { ...c, jumlah: c.jumlah + 1 } : c)));
    } else {
      setCart([
        ...cart,
        {
          id: `cat-${produkDipilih.id}-${Date.now()}`,
          produk_id: produkDipilih.id,
          nama_item: produkDipilih.nama,
          harga,
          jumlah: 1,
          tipe: 'Produk',
        },
      ]);
    }

    setProdukDipilih(null);
    setHargaInput('');
  };

  /**
   * Masukkan tiket servis ke keranjang.
   *
   * Harga yang dikirim hanya nilai tampilan; backend menetapkannya ulang dari
   * tiket, dan service_id itulah yang membuat tiket tertaut ke transaksi lalu
   * ditandai sudah diambil. Tanpa itu uangnya tercatat tetapi tiketnya
   * menggantung selamanya.
   */
  const tambahServis = (s: ItemServis) => {
    // Backend menolak menagih servis yang belum "Selesai" — menandai unit
    // sudah diambil padahal masih dikerjakan itu salah. Penjagaan di sini
    // penting karena penjualan ditulis ke antrean offline lebih dulu: tanpa
    // ini, penolakan baru muncul saat sinkron dan transaksinya mengendap
    // sebagai galat yang membingungkan kasir.
    if (!s.siap_diambil) return;
    if (cart.some((c) => c.service_id === s.id)) return;
    setCart([
      ...cart,
      {
        id: `svc-${s.id}`,
        service_id: s.id,
        nama_item: `${s.nama} (${s.nomor_resi})`,
        harga: s.total_biaya,
        jumlah: 1,
        tipe: 'Servis',
      },
    ]);
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
    const localId = createLocalId();
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

    // SELALU tulis ke antrean lokal lebih dulu, online maupun offline.
    //
    // Sebelumnya transaksi ditulis ke localStorage, sementara sync.ts membaca
    // IndexedDB — dua tempat berbeda. Ditambah tidak ada yang pernah memanggil
    // sync, akibatnya setiap penjualan yang dibuat saat offline TIDAK PERNAH
    // sampai ke server. Menulis dulu lalu menyinkronkan membuat jalur online
    // dan offline identik, dan tidak ada penjualan yang bisa hilang.
    void (async () => {
      try {
        await savePendingTransaction({
          localId,
          status: 'pending',
          createdAt: new Date().toISOString(),
          items: cart.map((c) => ({
            id: c.id,
            produk_id: c.produk_id,
            // Tanpa service_id, backend mencatat uangnya tetapi tiket servisnya
            // tidak pernah tertaut dan unitnya tidak pernah ditandai diambil.
            service_id: c.service_id,
            tipe: c.tipe === 'Servis' ? 'service' : 'produk',
            nama_item: c.nama_item,
            harga: c.harga,
            jumlah: c.jumlah,
          })),
          subtotal,
          diskon: 0,
          total,
          bayar: metodeBayar === 'Tunai' ? (bayarNominal || total) : total,
          kembalian,
          metode_bayar: metodeBayar,
          nama_pembeli: namaPembeli || 'Umum',
          nomor_hp_pembeli: nomorHp || undefined,
        });

        if (isOnline) {
          await syncPendingTransactions();
        }
      } catch {
        // Kegagalan menulis antrean tidak boleh membatalkan nota di layar;
        // jumlah antrean di bawah akan memperlihatkan kondisi sebenarnya.
      } finally {
        setAntre(await countPending().catch(() => 0));
      }
    })();

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

        {/* Kondisi antrean: kasir harus tahu penjualan tersimpan aman meski
            server tidak terjangkau, dan tahu kapan semuanya sudah terkirim. */}
        {antre > 0 && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-[11px] font-semibold text-amber-900">
            <CloudOff className="w-3.5 h-3.5 shrink-0" />
            <span>
              {antre} transaksi menunggu terkirim
              {isOnline ? ' — sedang disinkronkan…' : ' (tersimpan di perangkat ini)'}
            </span>
          </div>
        )}
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

            {memuatKatalog && (
              <p className="text-xs text-neutral-400 m-0">Memuat katalog dari server&hellip;</p>
            )}

            {galatKatalog && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
                {galatKatalog} — item tidak dapat dipilih dari katalog. Pakai Item Manual di atas.
              </div>
            )}

            {/* Servis yang menunggu diambil. Sebelumnya tidak ada di layar ini
                sama sekali: reparasi hanya bisa ditagih sebagai item manual,
                yang membuat tiketnya tidak pernah tertaut ke transaksi. */}
            {daftarServis.length > 0 && (
              <div>
                <h3 className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
                  Servis menunggu diambil ({daftarServis.length})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-56 overflow-y-auto pr-1">
                  {daftarServis.map((s) => {
                    const sudahDiKeranjang = cart.some((c) => c.service_id === s.id);
                    return (
                      <div
                        key={s.id}
                        className="p-3 rounded-xl bg-white border border-neutral-200 flex flex-col justify-between gap-2 shadow-sm"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="rl-mono text-[10px] font-bold text-[#b01218]">
                              {s.nomor_resi}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                                s.siap_diambil
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-amber-50 text-amber-700'
                              }`}
                            >
                              {s.status}
                            </span>
                          </div>
                          <h4 className="font-bold text-xs text-neutral-900 line-clamp-2 mt-1">
                            {s.nama}
                          </h4>
                          {s.nama_customer && (
                            <span className="text-[10px] text-neutral-400 block">
                              {s.nama_customer}
                            </span>
                          )}
                          <span className="text-xs font-bold text-neutral-900 rl-mono mt-1 block">
                            Rp {s.total_biaya.toLocaleString('id-ID')}
                          </span>
                        </div>

                        <button
                          type="button"
                          onClick={() => tambahServis(s)}
                          disabled={sudahDiKeranjang || !s.siap_diambil}
                          title={
                            s.siap_diambil
                              ? undefined
                              : 'Hanya servis berstatus Selesai yang boleh ditagih dan ditandai sudah diambil.'
                          }
                          className="w-full py-1.5 px-3 rounded-lg bg-neutral-100 hover:bg-[#de1f26] hover:text-white text-neutral-800 text-xs font-bold transition-all text-center border-0 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-neutral-100 disabled:hover:text-neutral-800"
                        >
                          {sudahDiKeranjang
                            ? 'Sudah di keranjang'
                            : s.siap_diambil
                              ? 'Tagihkan servis'
                              : 'Belum selesai'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {filteredProducts.length > 0 && (
              <h3 className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider mb-2">
                Produk ({filteredProducts.length})
              </h3>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-96 overflow-y-auto pr-1">
              {filteredProducts.map((p) => (
                <div
                  key={p.id}
                  className="p-3 rounded-xl bg-white border border-neutral-200 hover:border-[#de1f26]/50 transition-all flex flex-col justify-between gap-2 shadow-sm"
                >
                  <div>
                    <h4 className="font-bold text-xs text-neutral-900 line-clamp-2">{p.nama}</h4>
                    <span className="text-[10px] rl-mono text-neutral-400 block mt-1">
                      {p.sku ? `SKU: ${p.sku}` : 'Tanpa SKU'}
                      {p.nama_kategori ? ` · ${p.nama_kategori}` : ''}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setProdukDipilih(p);
                      setHargaInput('');
                    }}
                    className="w-full py-1.5 px-3 rounded-lg bg-neutral-100 hover:bg-[#de1f26] hover:text-white text-neutral-800 text-xs font-bold transition-all text-center border-0 cursor-pointer"
                  >
                    Tambahkan
                  </button>
                </div>
              ))}
            </div>

            {!memuatKatalog && !galatKatalog && filteredProducts.length === 0 && daftarServis.length === 0 && (
              <p className="text-xs text-neutral-400 m-0">
                {searchTerm ? 'Tidak ada yang cocok dengan pencarian.' : 'Katalog masih kosong.'}
              </p>
            )}
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
      {/* Harga jual produk diketik kasir — katalog memang tanpa harga sejak
          migrasi 2026_08_20_000003. Dialog ini menggantikan prompt() bawaan
          browser: angkanya terformat, salah ketik terlihat sebelum masuk
          keranjang, dan tidak bisa diblokir diam-diam oleh browser. */}
      {produkDipilih && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="rl-card w-full max-w-sm p-5">
            <h2 className="text-sm font-bold text-neutral-900 m-0">Harga jual</h2>
            <p className="text-[11px] text-neutral-500 mt-1 mb-4">{produkDipilih.nama}</p>

            <label className="block">
              <span className="rl-label">Harga satuan (Rp)</span>
              <input
                autoFocus
                type="number"
                min={0}
                step={1000}
                value={hargaInput}
                onChange={(e) => setHargaInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    terapkanHargaProduk();
                  }
                }}
                placeholder="0"
                className="rl-input"
              />
              <span className="block text-[11px] text-neutral-400 mt-1">
                {hargaInput !== '' && Number(hargaInput) > 0
                  ? `Rp ${Number(hargaInput).toLocaleString('id-ID')}`
                  : 'Katalog tidak menyimpan harga — isi sesuai kesepakatan.'}
              </span>
            </label>

            <div className="flex items-center gap-2 mt-4">
              <button
                type="button"
                onClick={terapkanHargaProduk}
                disabled={hargaInput === '' || Number(hargaInput) < 0}
                className="btn-redline rl-btn-sm flex-1 cursor-pointer disabled:opacity-60"
              >
                Masukkan ke keranjang
              </button>
              <button
                type="button"
                onClick={() => {
                  setProdukDipilih(null);
                  setHargaInput('');
                }}
                className="btn-ghost rl-btn-sm cursor-pointer"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
