'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useApiData, daftar } from '@/lib/useApiData';
import { useConnection } from '@/lib/connection';
import { Search, ChevronRight, X, WifiOff, Plus } from 'lucide-react';

interface ServiceRingkas {
  id: number;
  nomor_resi: string;
  status: string;
  keluhan: string;
  tanggal_masuk: string | null;
  total_biaya: number;
  perangkat: {
    nama_customer: string;
    nomor_hp_customer: string | null;
    merk_model: string;
  };
}

export default function AdminServicePage() {
  const { isOnline } = useConnection();
  // Sama seperti transaksi: fixture service.json memuat data perangkat dan
  // pelanggan, jadi tidak boleh ikut ke bundle publik.
  const { data, loading, error } = useApiData<ServiceRingkas[]>(
    '/admin/services?per_page=100',
    (json) => daftar<ServiceRingkas>(json)
  );
  const services = data ?? [];
  const [cari, setCari] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const getPillColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('selesai') || s.includes('diambil')) return 'rl-pill-green';
    if (s.includes('menunggu')) return 'rl-pill-red';
    if (s.includes('dikerjakan')) return 'rl-pill-amber';
    return 'rl-pill-blue';
  };

  const activeServices = isOnline ? services : [];

  const filtered = activeServices.filter((s) => {
    const matchSearch =
      s.nomor_resi.toLowerCase().includes(cari.toLowerCase()) ||
      s.perangkat.nama_customer.toLowerCase().includes(cari.toLowerCase()) ||
      s.perangkat.merk_model.toLowerCase().includes(cari.toLowerCase()) ||
      s.keluhan.toLowerCase().includes(cari.toLowerCase());

    const matchStatus = selectedStatus
      ? s.status.toLowerCase() === selectedStatus.toLowerCase()
      : true;

    return matchSearch && matchStatus;
  });

  const activeCount = isOnline
    ? services.filter(
        (s) =>
          !s.status.toLowerCase().includes('selesai') &&
          !s.status.toLowerCase().includes('diambil')
      ).length
    : 0;

  return (
    <div className="space-y-6">
      {loading && (
        <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-xl text-xs text-neutral-500">
          Memuat data servis dari server&hellip;
        </div>
      )}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
          {error}
        </div>
      )}
      <div className="rl-page-header flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="rl-page-title mb-1">Manajemen Servis</h1>
          <p className="rl-page-desc mb-0">
            Kelola dan pantau reparasi perangkat pelanggan &mdash; {activeCount} tiket aktif dalam proses pengerjaan.
          </p>
        </div>

        <Link
          href="/admin/service/baru"
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#de1f26] text-white text-xs font-semibold no-underline"
        >
          <Plus className="w-3.5 h-3.5" /> Terima Servis Baru
        </Link>
      </div>

      {!isOnline && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-xs text-amber-900">
          <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Mode Offline:</strong> Mohon maaf, tidak ada koneksi dengan database backend. Tiket servis pelanggan dinonaktifkan sementara saat offline.
          </span>
        </div>
      )}

      {/* Filter Card */}
      <div className="rl-card p-4">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nomor resi, customer, perangkat..."
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              disabled={!isOnline}
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-neutral-50 hover:bg-white focus:bg-white border border-neutral-200 focus:border-[#de1f26] focus:ring-2 focus:ring-red-100 text-xs text-neutral-800 transition-all outline-none disabled:opacity-60 disabled:cursor-not-allowed"
            />
            {cari && (
              <button
                type="button"
                onClick={() => setCari('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600 border-0 bg-transparent cursor-pointer p-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="sm:col-span-4">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              disabled={!isOnline}
              className="rl-select text-xs w-full disabled:opacity-60 disabled:cursor-not-allowed"
            >
              <option value="">Semua Status Pengerjaan</option>
              <option value="Diterima">Diterima</option>
              <option value="Dikerjakan">Dikerjakan</option>
              <option value="Menunggu Sparepart">Menunggu Sparepart</option>
              <option value="Selesai">Selesai</option>
              <option value="Sudah Diambil">Sudah Diambil</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Card */}
      <div className="rl-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-100/70 border-b border-neutral-200 text-neutral-600 font-bold uppercase tracking-wider text-[10.5px]">
                <th className="py-3 px-4">Nomor Resi &amp; Waktu</th>
                <th className="py-3 px-4">Customer &amp; Kontak</th>
                <th className="py-3 px-4">Perangkat &amp; Keluhan</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-neutral-800">
              {!isOnline ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-neutral-400 text-xs px-4">
                    Mohon maaf, tidak ada koneksi dengan database backend. Data servis tidak dapat dimuat saat offline.
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-neutral-400 text-xs">
                    Tidak ada tiket servis yang sesuai dengan filter.
                  </td>
                </tr>
              ) : (
                filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold rl-mono text-[#b01218] text-xs">
                        {s.nomor_resi}
                      </div>
                      <div className="text-[10.5px] text-neutral-400 mt-0.5">
                        Masuk: {s.tanggal_masuk}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-bold text-neutral-900">{s.perangkat.nama_customer}</div>
                      <div className="text-[10.5px] rl-mono text-neutral-400">
                        {s.perangkat.nomor_hp_customer || '—'}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-medium text-neutral-800">{s.perangkat.merk_model}</div>
                      <div className="text-[11px] text-neutral-500 line-clamp-1 max-w-xs">
                        {s.keluhan}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`rl-pill ${getPillColor(s.status)} text-[10px]`}>
                        {s.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/admin/service/${s.id}`}
                        className="btn-ghost py-1 px-2.5 text-[11px] font-semibold inline-flex items-center gap-1 no-underline"
                      >
                        <span>Kelola</span>
                        <ChevronRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t border-neutral-100 bg-neutral-50 text-[11px] text-neutral-400 text-right">
          Menampilkan {filtered.length} dari total {activeServices.length} tiket servis
        </div>
      </div>
    </div>
  );
}
