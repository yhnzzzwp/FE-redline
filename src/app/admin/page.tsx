'use client';

import Link from 'next/link';
import transaksiData from '@/data/transaksi.json';
import serviceData from '@/data/service.json';
import produkData from '@/data/produk.json';

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
  const trendMax = Math.max(1, ...DUMMY_TREND.map((t) => t.total));

  const handleExportLaporan = () => {
    const csvRows: string[] = [];
    csvRows.push('LAPORAN RINGKASAN KINERJA TOKO - REDLINE KOMPUTER');
    csvRows.push(`Tanggal Cetak: ${new Date().toLocaleString('id-ID')}`);
    csvRows.push('');
    csvRows.push(['METRIK UTAMA', 'NILAI', 'SATUAN'].join(','));
    csvRows.push(['Total Penjualan', transaksiData.length.toString(), 'Transaksi'].join(','));
    csvRows.push(['Servis Aktif', serviceData.length.toString(), 'Tiket'].join(','));
    csvRows.push(['Total Produk Katalog', produkData.length.toString(), 'Item'].join(','));
    csvRows.push('');
    csvRows.push(['RIWAYAT TRANSAKSI TERAKHIR', '', '', '', '', ''].join(','));
    csvRows.push(['Kode Nota', 'Tanggal', 'Customer', 'Kasir', 'Total (Rp)', 'Status'].join(','));
    
    transaksiData.forEach((t) => {
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
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <path d="M7 10l5 5 5-5" />
            <path d="M12 15V3" />
          </svg>
          Ekspor Laporan (CSV)
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rl-card rl-kpi h-full">
          <div className="rl-kpi__ico mb-3 bg-red-50 text-[#de1f26]">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
              <path d="M3 6h18M3 12h18M3 18h18" />
            </svg>
          </div>
          <div className="rl-kpi__label">Total Penjualan</div>
          <div className="rl-kpi__val tnum">{transaksiData.length} <span className="text-base font-normal text-neutral-400">Transaksi</span></div>
        </div>

        <div className="rl-card rl-kpi h-full">
          <div className="rl-kpi__ico mb-3 bg-emerald-50 text-emerald-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </div>
          <div className="rl-kpi__label">Penjualan Hari Ini</div>
          <div className="rl-kpi__val tnum text-emerald-600">2 <span className="text-base font-normal text-neutral-400">Transaksi</span></div>
        </div>

        <div className="rl-card rl-kpi h-full">
          <div className="rl-kpi__ico mb-3 bg-blue-50 text-blue-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
              <path d="M14 6a4 4 0 005 5l-8 8-3-3 6-6a4 4 0 010-4z" />
            </svg>
          </div>
          <div className="rl-kpi__label">Servis Aktif</div>
          <div className="rl-kpi__val tnum">{serviceData.length} <span className="text-base font-normal text-neutral-400">Tiket</span></div>
          <div className="text-[11px] text-neutral-400 mt-1">Dalam proses perbaikan</div>
        </div>

        <div className="rl-card rl-kpi h-full">
          <div className="rl-kpi__ico mb-3 bg-amber-50 text-amber-600">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
              <path d="M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7" />
            </svg>
          </div>
          <div className="rl-kpi__label">Total Produk</div>
          <div className="rl-kpi__val tnum">{produkData.length} <span className="text-base font-normal text-neutral-400">Item</span></div>
          <div className="text-[11px] text-neutral-400 mt-1">Tercatat di katalog</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div className="lg:col-span-2 rl-card p-4 h-full">
          <div className="flex justify-between items-center mb-4">
            <h3 className="rl-section-title mb-0">Tren Penjualan (7 Hari Terakhir)</h3>
          </div>
          <div className="rl-chart-bar-wrap">
            {DUMMY_TREND.map((t) => (
              <div key={t.label} className="rl-chart-bar">
                <div
                  className="rl-chart-bar__fill rounded-t"
                  title={`${t.label}: ${t.total} Transaksi`}
                  style={{ height: `${Math.max(6, Math.round((t.total / trendMax) * 100))}%` }}
                />
                <small className="rl-chart-bar__label">{t.label}</small>
              </div>
            ))}
          </div>
        </div>

        <div className="rl-card h-full flex flex-col">
          <div className="flex justify-between items-center p-3 pb-2">
            <h3 className="rl-section-title mb-0">Transaksi Terakhir</h3>
            <Link href="/admin/transaksi" className="font-semibold text-[11px] text-[#de1f26] no-underline hover:underline">
              Lihat Semua &rarr;
            </Link>
          </div>
          <div className="px-2 pb-2 flex-1">
            {transaksiData.slice(0, 5).map((t) => (
              <div key={t.kode_nota} className="flex items-center justify-between px-2 py-2 border-b border-neutral-100">
                <div>
                  <div className="font-semibold text-xs rl-mono" style={{ color: 'var(--ink)' }}>#{t.kode_nota}</div>
                  <div className="text-[11px] text-neutral-400">{t.nama_pembeli} &middot; {t.pegawai.nama_pegawai} &middot; {t.created_at.slice(5, 16)}</div>
                </div>
                <div className="text-right">
                  <div className="font-bold tnum text-xs" style={{ color: 'var(--ink)' }}>{t.items.length} Item</div>
                  {t.status.toLowerCase() === 'batal' ? (
                    <span className="rl-pill rl-pill-red text-[10px]">BATAL</span>
                  ) : (
                    <span className="rl-pill rl-pill-green text-[10px]">LUNAS</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
