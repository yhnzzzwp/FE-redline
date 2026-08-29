'use client';

import { use } from 'react';
import Link from 'next/link';
import { useApiData } from '@/lib/useApiData';
import { Download, Printer, CheckCircle, ArrowLeft } from 'lucide-react';
import { downloadReceiptPDF, type ReceiptData } from '@/lib/pdfReceipt';

export const dynamic = 'force-dynamic';

export default function NotaPublikPage({
  params,
}: {
  params: Promise<{ kode: string }>;
}) {
  const { kode } = use(params);

  // Diambil dari endpoint publik /nota/{kode} yang datanya sudah disamarkan
  // di server. Sebelumnya halaman ini meng-import src/data/transaksi.json,
  // sehingga nama dan nomor telepon SELURUH pembeli ikut terkirim ke bundle
  // JavaScript setiap pengunjung situs.
  const { data, loading, error } = useApiData<{
    kode_nota: string;
    nama_pembeli: string | null;
    metode_bayar: string;
    subtotal: number;
    diskon: number;
    total: number;
    bayar: number;
    kembalian: number;
    created_at: string | null;
    items: { nama_item: string; jumlah: number; harga: number; subtotal: number; tipe: string }[];
  }>(`/nota/${encodeURIComponent(kode)}`, (json) => json.data as never);

  const receipt: ReceiptData | null = data
    ? {
        kode_nota: data.kode_nota,
        tanggal: data.created_at ?? '—',
        nama_pembeli: data.nama_pembeli ?? 'Pelanggan',
        items: data.items.map((i) => ({
          nama_item: i.nama_item,
          harga: i.harga,
          jumlah: i.jumlah,
          tipe: i.tipe,
        })),
        subtotal: data.subtotal,
        total: data.total,
        bayar: data.bayar,
        kembalian: data.kembalian,
        metode_bayar: data.metode_bayar,
        kasir: 'Redline Komputer',
      }
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-100/70 py-8 px-4 flex items-center justify-center">
        <p className="text-xs text-neutral-500">Memuat nota&hellip;</p>
      </div>
    );
  }

  if (error || !receipt) {
    return (
      <div className="min-h-screen bg-neutral-100/70 py-8 px-4 flex flex-col items-center justify-center">
        <div className="w-full max-w-md text-center space-y-3">
          <span className="rl-logo text-xl text-[#de1f26]">REDL<i>INE</i></span>
          <h1 className="font-bold text-sm uppercase tracking-wider text-neutral-900">
            Nota tidak ditemukan
          </h1>
          <p className="text-xs text-neutral-500">
            Kode nota <span className="font-mono font-semibold">{kode}</span> tidak terdaftar.
            Periksa kembali kode pada struk Anda.
          </p>
          <Link
            href="/"
            className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 inline-flex items-center gap-1 no-underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Beranda</span>
          </Link>
        </div>
      </div>
    );
  }

  const handleDownload = () => {
    downloadReceiptPDF(receipt);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-neutral-100/70 py-8 px-4 flex flex-col items-center justify-center">
      <div className="w-full max-w-md space-y-4">
        <div className="flex items-center justify-between print:hidden">
          <Link
            href="/"
            className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 inline-flex items-center gap-1 no-underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Beranda</span>
          </Link>
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold">
            <CheckCircle className="w-4 h-4" />
            <span>Nota Resmi Terverifikasi</span>
          </div>
        </div>

        {/* Invoice Card */}
        <div className="bg-white rounded-2xl border border-neutral-200 p-6 space-y-5 shadow-lg print:shadow-none print:border-0 print:p-0">
          <div className="text-center pb-3 border-b border-neutral-100">
            <span className="rl-logo text-xl text-[#de1f26]">REDL<i>INE</i></span>
            <h1 className="font-bold text-sm uppercase tracking-wider text-neutral-900 mt-1 mb-0">
              REDLINE KOMPUTER
            </h1>
            <p className="text-[11px] text-neutral-500 mb-0">
              Hardware, Service &amp; Custom PC Salatiga &middot; WA: 0856-4020-3069
            </p>
          </div>

          <div className="space-y-1 text-xs text-neutral-600 font-mono">
            <div className="flex justify-between">
              <span>No. Nota:</span>
              <span className="font-bold text-[#b01218]">#{receipt.kode_nota}</span>
            </div>
            <div className="flex justify-between">
              <span>Tanggal:</span>
              <span>{receipt.tanggal}</span>
            </div>
            <div className="flex justify-between">
              <span>Pelanggan:</span>
              <span className="font-semibold text-neutral-800">{receipt.nama_pembeli}</span>
            </div>
            <div className="flex justify-between">
              <span>Kasir:</span>
              <span>{receipt.kasir}</span>
            </div>
          </div>

          <div className="border-t border-b border-neutral-100 py-3 space-y-2 text-xs">
            <div className="text-[10px] font-bold uppercase text-neutral-400 tracking-wider">
              Rincian Item Pembelian
            </div>
            {receipt.items.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start gap-2">
                <div className="flex-1">
                  <div className="font-bold text-neutral-900">{item.nama_item}</div>
                  <div className="text-[11px] text-neutral-500 font-mono">
                    {item.jumlah}x @ Rp {item.harga.toLocaleString('id-ID')}
                  </div>
                </div>
                <div className="font-bold text-neutral-900 font-mono">
                  Rp {(item.jumlah * item.harga).toLocaleString('id-ID')}
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-1.5 text-xs font-mono">
            <div className="flex justify-between text-sm font-bold text-neutral-900">
              <span>TOTAL TAGIHAN</span>
              <span className="text-[#b01218]">Rp {receipt.total.toLocaleString('id-ID')}</span>
            </div>
            <div className="flex justify-between text-neutral-500">
              <span>Metode Pembayaran</span>
              <span>{receipt.metode_bayar}</span>
            </div>
            {receipt.metode_bayar === 'Tunai' && (
              <>
                <div className="flex justify-between text-neutral-500">
                  <span>Tunai Diterima</span>
                  <span>Rp {receipt.bayar.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-600">
                  <span>Kembalian</span>
                  <span>Rp {receipt.kembalian.toLocaleString('id-ID')}</span>
                </div>
              </>
            )}
          </div>

          <div className="text-center pt-3 border-t border-neutral-100 text-[11px] text-neutral-400">
            Terima kasih telah berbelanja di Redline Komputer Salatiga. Simpan nota digital ini untuk bukti garansi resmi.
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-2 gap-2 pt-2 print:hidden">
            <button
              type="button"
              onClick={handleDownload}
              className="py-2.5 px-3 rounded-xl bg-[#de1f26] hover:bg-[#b01218] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all border-0 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Unduh File PDF</span>
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="py-2.5 px-3 rounded-xl bg-neutral-800 hover:bg-neutral-900 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm transition-all border-0 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Nota</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
