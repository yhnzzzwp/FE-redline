'use client';

import { useState } from 'react';
import transaksiData from '@/data/transaksi.json';
import { Search, Download, Receipt, MessageCircle, X, Printer } from 'lucide-react';

interface TransaksiItem {
  id: number;
  tipe: string;
  nama_item: string;
  jumlah: number;
  harga: number;
  subtotal: number;
}

interface TransaksiRecord {
  id: number;
  kode_nota: string;
  nama_pembeli: string;
  nomor_hp_pembeli?: string;
  pegawai: { id: number; nama_pegawai: string; username: string };
  metode_bayar: string;
  subtotal: number;
  diskon: number;
  total: number;
  bayar: number;
  kembalian: number;
  status: string;
  created_at: string;
  items: TransaksiItem[];
}

export default function AdminTransaksiPage() {
  const [transactions] = useState<TransaksiRecord[]>(transaksiData);
  const [cari, setCari] = useState('');
  const [selectedJenis, setSelectedJenis] = useState('');
  const [selectedTanggal, setSelectedTanggal] = useState('');
  const [activeReceipt, setActiveReceipt] = useState<TransaksiRecord | null>(null);

  const filtered = transactions.filter((t) => {
    const matchSearch =
      t.kode_nota.toLowerCase().includes(cari.toLowerCase()) ||
      t.nama_pembeli.toLowerCase().includes(cari.toLowerCase()) ||
      t.pegawai.nama_pegawai.toLowerCase().includes(cari.toLowerCase());

    const matchTanggal = selectedTanggal
      ? t.created_at.startsWith(selectedTanggal)
      : true;

    const matchJenis = selectedJenis
      ? t.items.some((i) => i.tipe.toLowerCase() === selectedJenis.toLowerCase())
      : true;

    return matchSearch && matchTanggal && matchJenis;
  });

  const handleExportCSV = () => {
    const rows = [
      ['ID', 'Kode Nota', 'Tanggal', 'Customer', 'No HP', 'Kasir', 'Metode Bayar', 'Total (Rp)', 'Status', 'Rincian Item'],
    ];

    filtered.forEach((t) => {
      const itemsStr = t.items.map((i) => `${i.jumlah}x ${i.nama_item}`).join('; ');
      rows.push([
        t.id.toString(),
        `"#${t.kode_nota}"`,
        `"${t.created_at}"`,
        `"${t.nama_pembeli}"`,
        `"${t.nomor_hp_pembeli || ''}"`,
        `"${t.pegawai.nama_pegawai}"`,
        t.metode_bayar,
        t.total.toString(),
        t.status,
        `"${itemsStr}"`,
      ]);
    });

    const csvContent = rows.map((e) => e.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Laporan_Transaksi_Redline_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
  };

  const createWhatsAppLink = (t: TransaksiRecord) => {
    const phone = (t.nomor_hp_pembeli || '').replace(/^0/, '62').replace(/\D/g, '');
    let text = `*NOTA PEMBELIAN REDLINE KOMPUTER*\n`;
    text += `===============================\n`;
    text += `No. Nota : #${t.kode_nota}\n`;
    text += `Tanggal  : ${t.created_at}\n`;
    text += `Customer : ${t.nama_pembeli}\n`;
    text += `Kasir    : ${t.pegawai.nama_pegawai}\n`;
    text += `-------------------------------\n`;
    t.items.forEach((item, idx) => {
      text += `${idx + 1}. ${item.nama_item}\n`;
      text += `   ${item.jumlah}x @ Rp ${item.harga.toLocaleString('id-ID')} = Rp ${(item.jumlah * item.harga).toLocaleString('id-ID')}\n`;
    });
    text += `-------------------------------\n`;
    text += `*TOTAL TAGIHAN : Rp ${t.total.toLocaleString('id-ID')}*\n`;
    text += `Metode Bayar  : ${t.metode_bayar}\n`;
    text += `Status        : ${t.status}\n`;
    text += `===============================\n`;
    text += `Terima kasih atas kunjungan Anda di Redline Komputer!`;

    const encoded = encodeURIComponent(text);
    if (phone.length >= 8) {
      return `https://wa.me/${phone}?text=${encoded}`;
    }
    return `https://wa.me/?text=${encoded}`;
  };

  return (
    <div className="space-y-6">
      <div className="rl-page-header flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="rl-page-title mb-1">Daftar Transaksi</h1>
          <p className="rl-page-desc mb-0">
            Riwayat seluruh transaksi penjualan POS dan pembayaran servis di Redline Komputer.
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          className="btn-redline flex items-center gap-1.5 text-xs font-bold"
        >
          <Download className="w-4 h-4" />
          <span>Ekspor CSV Transaksi</span>
        </button>
      </div>

      {/* Filter Card */}
      <div className="rl-card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari kode nota, pembeli, kasir…"
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              className="rl-input pl-9 text-xs w-full"
            />
          </div>

          <div className="sm:col-span-4">
            <input
              type="date"
              value={selectedTanggal}
              onChange={(e) => setSelectedTanggal(e.target.value)}
              className="rl-input text-xs w-full"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedJenis}
              onChange={(e) => setSelectedJenis(e.target.value)}
              className="rl-select text-xs w-full"
            >
              <option value="">Semua Jenis Item</option>
              <option value="Produk">Produk Hardware</option>
              <option value="Servis">Jasa Servis</option>
            </select>
          </div>
        </div>

        {(cari || selectedTanggal || selectedJenis) && (
          <div className="pt-2.5 text-right">
            <button
              type="button"
              onClick={() => {
                setCari('');
                setSelectedTanggal('');
                setSelectedJenis('');
              }}
              className="text-xs text-neutral-500 hover:text-[#b01218] font-semibold bg-transparent border-0 cursor-pointer"
            >
              Reset Semua Filter
            </button>
          </div>
        )}
      </div>

      {/* Table Card */}
      <div className="rl-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-100/70 border-b border-neutral-200 text-neutral-600 font-bold uppercase tracking-wider text-[10.5px]">
                <th className="py-3 px-4">Nota &amp; Waktu</th>
                <th className="py-3 px-4">Pegawai (Kasir)</th>
                <th className="py-3 px-4">Item Transaksi</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-neutral-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-400 text-xs">
                    Tidak ada transaksi yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold rl-mono text-[#b01218] text-xs">
                        #{t.kode_nota}
                      </div>
                      <div className="text-[10.5px] text-neutral-400 mt-0.5">
                        {t.created_at} &middot; {t.nama_pembeli}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium text-neutral-800">{t.pegawai.nama_pegawai}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="space-y-0.5 max-w-xs">
                        {t.items.slice(0, 2).map((item, idx) => (
                          <div key={idx} className="text-neutral-700 truncate">
                            {item.jumlah}x {item.nama_item}
                          </div>
                        ))}
                        {t.items.length > 2 && (
                          <div className="text-[10px] text-neutral-400 font-semibold">
                            +{t.items.length - 2} item lainnya
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right rl-mono font-bold text-neutral-900">
                      Rp {t.total.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {t.status.toLowerCase() === 'batal' ? (
                        <span className="rl-pill rl-pill-red text-[10px]">BATAL</span>
                      ) : (
                        <span className="rl-pill rl-pill-green text-[10px]">LUNAS</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setActiveReceipt(t)}
                          className="btn-ghost py-1 px-2.5 text-[11px] font-semibold flex items-center gap-1"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span>Nota</span>
                        </button>

                        <a
                          href={createWhatsAppLink(t)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 transition-colors"
                          title="Kirim Nota ke WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </a>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t border-neutral-100 bg-neutral-50 text-[11px] text-neutral-400 text-right">
          Menampilkan {filtered.length} dari total {transactions.length} transaksi
        </div>
      </div>

      {/* Modal Detail Nota */}
      {activeReceipt && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-white border border-neutral-200 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
              <h3 className="text-sm font-bold text-neutral-900">Detail Nota Transaksi</h3>
              <button
                type="button"
                onClick={() => setActiveReceipt(null)}
                className="text-neutral-400 hover:text-neutral-600 bg-transparent border-0 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 rounded-xl bg-neutral-50 border border-neutral-200 text-neutral-800 space-y-3 text-xs font-mono">
              <div className="text-center pb-2 border-b border-neutral-200">
                <h4 className="font-bold text-sm uppercase tracking-wider text-neutral-900">
                  REDLINE KOMPUTER
                </h4>
                <p className="text-[10px] text-neutral-500 mb-0">
                  Salatiga &middot; 0856-4020-3069
                </p>
              </div>

              <div className="flex justify-between text-[11px] text-neutral-600">
                <span>Nota: #{activeReceipt.kode_nota}</span>
                <span>{activeReceipt.created_at}</span>
              </div>

              <div className="text-[11px] text-neutral-600">
                <span>Pelanggan: {activeReceipt.nama_pembeli}</span>
                {activeReceipt.nomor_hp_pembeli && <span> ({activeReceipt.nomor_hp_pembeli})</span>}
              </div>

              <div className="border-t border-b border-neutral-200 py-2 space-y-1.5">
                {activeReceipt.items.map((item, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="font-semibold text-neutral-900">{item.nama_item}</div>
                    <div className="flex justify-between text-[11px] text-neutral-600">
                      <span>
                        {item.jumlah}x @ Rp {item.harga.toLocaleString('id-ID')}
                      </span>
                      <span>Rp {item.subtotal.toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-1 text-[11px]">
                <div className="flex justify-between font-bold text-neutral-900 text-xs">
                  <span>TOTAL</span>
                  <span>Rp {activeReceipt.total.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Metode</span>
                  <span>{activeReceipt.metode_bayar}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Status</span>
                  <span>{activeReceipt.status}</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => window.print()}
                className="py-2.5 px-3 rounded-lg bg-neutral-800 hover:bg-neutral-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Cetak Nota</span>
              </button>

              <a
                href={createWhatsAppLink(activeReceipt)}
                target="_blank"
                rel="noopener noreferrer"
                className="py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 no-underline"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Kirim via WA</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
