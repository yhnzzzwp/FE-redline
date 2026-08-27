'use client';

import Link from 'next/link';
import transaksiData from '@/data/transaksi.json';
import serviceData from '@/data/service.json';
import produkData from '@/data/produk.json';
import { useConnection } from '@/lib/connection';
import { WifiOff, Download } from 'lucide-react';

const DUMMY_TREND = [
  { label: 'Sen', total: 12 },
  { label: 'Sel', total: 8 },
  { label: 'Rab', total: 15 },
  { label: 'Kam', total: 6 },
  { label: 'Jum', total: 22 },
  { label: 'Sab', total: 18 },
  { label: 'Min', total: 4 },
];

export default function AdminDashboard() {
  const { isOnline } = useConnection();

  const activeTransaksi = isOnline ? transaksiData : [];
  const totalPenjualanCount = isOnline ? transaksiData.length : 0;
  const penjualanHariIniCount = isOnline ? 2 : 0;
  const servisAktifCount = isOnline ? serviceData.length : 0;
  const totalProdukCount = produkData.length;

  const currentTrend = isOnline
    ? DUMMY_TREND
    : DUMMY_TREND.map((t) => ({ label: t.label, total: 0 }));

  const trendMax = Math.max(1, ...currentTrend.map((t) => t.total));

  const handleExportLaporan = () => {
    const csvRows: string[] = [];
    csvRows.push('LAPORAN RINGKASAN KINERJA TOKO - REDLINE KOMPUTER');
    csvRows.push(`Tanggal Cetak: ${new Date().toLocaleString('id-ID')}`);
    csvRows.push(`Status Koneksi: ${isOnline ? 'Online (Terhubung API)' : 'Offline (Mode Mandiri)'}`);
    csvRows.push('');
    csvRows.push(['METRIK UTAMA', 'NILAI', 'SATUAN'].join(','));
    csvRows.push(['Total Penjualan', totalPenjualanCount.toString(), 'Transaksi'].join(','));
    csvRows.push(['Servis Aktif', servisAktifCount.toString(), 'Tiket'].join(','));
    csvRows.push(['Total Produk Katalog', totalProdukCount.toString(), 'Item'].join(','));
    csvRows.push('');
    csvRows.push(['RIWAYAT TRANSAKSI TERAKHIR', '', '', '', '', ''].join(','));
    csvRows.push(['Kode Nota', 'Tanggal', 'Customer', 'Kasir', 'Total (Rp)', 'Status'].join(','));

    activeTransaksi.forEach((t) => {
      csvRows.push([
        `#${t.kode_nota}`,
        `"${t.created_at}"`,
        `"${t.nama_pembeli}"`,
        `"${t.pegawai.nama_pegawai}"`,
        t.total.toString(),
        t.status,
      ].join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Laporan_Redline_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <div className="rl-page-header flex items-start justify-between flex-wrap gap-2">
        <div>
          <h1 className="rl-page-title mb-1">Ringkasan Dashboard</h1>
          <p className="rl-page-desc mb-0">Metrik kinerja real-time Redline Komputer.</p>
        </div>
        <button
          type="button"
          onClick={handleExportLaporan}
          className="btn-redline flex items-center gap-2 text-sm cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Ekspor Laporan (CSV)
        </button>
      </div>

      {!isOnline && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-xs text-amber-900">
          <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Mode Offline:</strong> Server database belum terhubung. Metrik transaksi online diset ke 0, sedangkan master produk statis tetap beroperasi penuh.
          </span>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rl-card rl-kpi h-full">
          <div className="rl-kpi__ico mb-3 bg-red-50 text-[#de1f26]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </div>
          <div className="rl-kpi__label">Total Penjualan</div>
          <div className="rl-kpi__val tnum">
            {totalPenjualanCount}{' '}
            <span className="text-base font-normal text-neutral-400">Transaksi</span>
          </div>
        </div>

        <div className="rl-card rl-kpi h-full">
          <div className="rl-kpi__ico mb-3 bg-emerald-50 text-emerald-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className="rl-kpi__label">Penjualan Hari Ini</div>
          <div className="rl-kpi__val tnum text-emerald-600">
            {penjualanHariIniCount}{' '}
            <span className="text-base font-normal text-neutral-400">Transaksi</span>
          </div>
        </div>

        <div className="rl-card rl-kpi h-full">
          <div className="rl-kpi__ico mb-3 bg-blue-50 text-blue-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
              <path d="M14 6a4 4 0 005 5l-8 8-3-3 6-6a4 4 0 010-4z" />
            </svg>
          </div>
          <div className="rl-kpi__label">Servis Aktif</div>
          <div className="rl-kpi__val tnum">
            {servisAktifCount}{' '}
            <span className="text-base font-normal text-neutral-400">Tiket</span>
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">
            {isOnline ? 'Dalam proses perbaikan' : 'Database offline'}
          </div>
        </div>

        <div className="rl-card rl-kpi h-full">
          <div className="rl-kpi__ico mb-3 bg-amber-50 text-amber-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
              <path d="M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7" />
            </svg>
          </div>
          <div className="rl-kpi__label">Total Produk</div>
          <div className="rl-kpi__val tnum">
            {totalProdukCount}{' '}
            <span className="text-base font-normal text-neutral-400">Item</span>
          </div>
          <div className="text-[11px] text-neutral-400 mt-1">Tercatat di katalog</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 rl-card p-4 h-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="rl-section-title mb-0">Tren Penjualan (7 Hari Terakhir)</h3>
            {!isOnline && (
              <span className="text-[11px] font-semibold text-neutral-400">Mode Offline</span>
            )}
          </div>
          <div className="rl-chart-bar-wrap">
            {currentTrend.map((t) => (
              <div key={t.label} className="rl-chart-bar">
                <div
                  className="rl-chart-bar__fill rounded-t"
                  title={`${t.label}: ${t.total} Transaksi`}
                  style={{
                    height: isOnline
                      ? `${Math.max(6, Math.round((t.total / trendMax) * 100))}%`
                      : '4%',
                  }}
                />
                <small className="rl-chart-bar__label">{t.label}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="rl-card h-full flex flex-col">
          <div className="flex justify-between items-center p-3 pb-2">
            <h3 className="rl-section-title mb-0">Transaksi Terakhir</h3>
            {isOnline && (
              <Link
                href="/admin/transaksi"
                className="font-semibold text-[11px] text-[#de1f26] no-underline hover:underline"
              >
                Lihat Semua &rarr;
              </Link>
            )}
          </div>
          <div className="px-2 pb-2 flex-1">
            {!isOnline || activeTransaksi.length === 0 ? (
              <div className="py-12 text-center text-xs text-neutral-400 px-4">
                Mohon maaf, tidak ada koneksi dengan database. Data transaksi online tidak tersedia saat offline.
              </div>
            ) : (
              activeTransaksi.slice(0, 5).map((t) => (
                <div
                  key={t.kode_nota}
                  className="flex items-center justify-between px-2 py-2 border-b border-neutral-100"
                >
                  <div>
                    <div
                      className="font-semibold text-xs rl-mono"
                      style={{ color: 'var(--ink)' }}
                    >
                      #{t.kode_nota}
                    </div>
                    <div className="text-[11px] text-neutral-400">
                      {t.nama_pembeli} &middot; {t.pegawai.nama_pegawai} &middot;{' '}
                      {t.created_at.slice(5, 16)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className="font-bold tnum text-xs"
                      style={{ color: 'var(--ink)' }}
                    >
                      {t.items.length} Item
                    </div>
                    {t.status.toLowerCase() === 'batal' ? (
                      <span className="rl-pill rl-pill-red text-[10px]">BATAL</span>
                    ) : (
                      <span className="rl-pill rl-pill-green text-[10px]">LUNAS</span>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
}
