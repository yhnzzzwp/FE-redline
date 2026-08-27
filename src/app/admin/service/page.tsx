'use client';

import { useState } from 'react';
import Link from 'next/link';
import serviceData from '@/data/service.json';
import { Search, ChevronRight, X } from 'lucide-react';

export default function AdminServicePage() {
  const [services] = useState(serviceData);
  const [cari, setCari] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  const getPillColor = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('selesai') || s.includes('diambil')) return 'rl-pill-green';
    if (s.includes('menunggu')) return 'rl-pill-red';
    if (s.includes('dikerjakan')) return 'rl-pill-amber';
    return 'rl-pill-blue';
  };

  const filtered = services.filter((s) => {
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

  const activeCount = services.filter(
    (s) => !s.status.toLowerCase().includes('selesai') && !s.status.toLowerCase().includes('diambil')
  ).length;

  return (
    <div className="space-y-6">
      <div className="rl-page-header flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="rl-page-title mb-1">Manajemen Servis</h1>
          <p className="rl-page-desc mb-0">
            Kelola dan pantau reparasi perangkat pelanggan &mdash; {activeCount} tiket aktif dalam proses pengerjaan.
          </p>
        </div>
      </div>

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
              className="w-full pl-9 pr-8 py-2 rounded-xl bg-neutral-50 hover:bg-white focus:bg-white border border-neutral-200 focus:border-[#de1f26] focus:ring-2 focus:ring-red-100 text-xs text-neutral-800 transition-all outline-none"
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
              className="rl-select text-xs w-full"
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

        {(cari || selectedStatus) && (
          <div className="pt-2 text-right">
            <button
              type="button"
              onClick={() => {
                setCari('');
                setSelectedStatus('');
              }}
              className="text-xs text-neutral-500 hover:text-[#b01218] font-semibold bg-transparent border-0 cursor-pointer"
            >
              Reset Filter
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
                <th className="py-3 px-4">Resi Servis</th>
                <th className="py-3 px-4">Pelanggan &amp; Perangkat</th>
                <th className="py-3 px-4">Keluhan Utama</th>
                <th className="py-3 px-4">Tgl Masuk</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-neutral-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-400 text-xs">
                    Belum ada tiket servis yang sesuai dengan filter.
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
                        ID: {s.perangkat.kode_perangkat}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-neutral-900">
                        {s.perangkat.nama_customer}
                      </div>
                      <div className="text-[11px] text-neutral-500">
                        {s.perangkat.merk_model}
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-neutral-600 line-clamp-2 max-w-xs mb-0">
                        {s.keluhan}
                      </p>
                    </td>
                    <td className="py-3 px-4 text-neutral-500 rl-mono">
                      {s.tanggal_masuk}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className={`rl-pill ${getPillColor(s.status)} text-[10px]`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <Link
                        href={`/admin/service/${s.id}`}
                        className="btn-redline py-1.5 px-3 text-[11px] font-bold inline-flex items-center gap-1 no-underline"
                      >
                        <span>Detail</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t border-neutral-100 bg-neutral-50 text-[11px] text-neutral-400 text-right">
          Menampilkan {filtered.length} dari total {services.length} tiket servis
        </div>
      </div>
    </div>
  );
}
