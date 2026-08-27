'use client';

import { useState } from 'react';
import pegawaiData from '@/data/pegawai.json';
import { useConnection } from '@/lib/connection';
import { Search, X, ShieldAlert } from 'lucide-react';

export default function AdminPegawaiPage() {
  const { isOnline } = useConnection();
  const [pegawaiList] = useState(pegawaiData);
  const [cari, setCari] = useState('');

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const filtered = pegawaiList.filter(
    (p) =>
      p.nama_pegawai.toLowerCase().includes(cari.toLowerCase()) ||
      p.username.toLowerCase().includes(cari.toLowerCase()) ||
      p.email.toLowerCase().includes(cari.toLowerCase()) ||
      p.role.toLowerCase().includes(cari.toLowerCase())
  );

  const activeCount = pegawaiList.filter((p) => p.masih_bekerja).length;

  return (
    <div className="space-y-6">
      <div className="rl-page-header flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="rl-page-title mb-1">Akun Pegawai</h1>
          <p className="rl-page-desc mb-0">
            Kelola akun data Owner &amp; Karyawan toko &mdash; Total {activeCount} akun aktif terdaftar.
          </p>
        </div>

        {/* Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari pegawai..."
            value={cari}
            onChange={(e) => setCari(e.target.value)}
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-white border border-neutral-200 focus:border-[#de1f26] focus:ring-2 focus:ring-red-100 text-xs text-neutral-800 transition-all outline-none"
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
      </div>

      <div className="p-3 bg-neutral-100 border border-neutral-200 rounded-xl flex items-center gap-2.5 text-xs text-neutral-600">
        <ShieldAlert className="w-4 h-4 text-neutral-500 shrink-0" />
        <span>
          <strong>Hak Akses Pegawai:</strong> Daftar seluruh staf dan owner toko Redline Komputer Salatiga.
        </span>
      </div>

      <div className="rl-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-100/70 border-b border-neutral-200 text-neutral-600 font-bold uppercase tracking-wider text-[10.5px]">
                <th className="py-3 px-4">Pegawai</th>
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4 text-center">Role / Jabatan</th>
                <th className="py-3 px-4">No. HP</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Sesi Aktif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-neutral-800">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-400 text-xs">
                    Tidak ada data pegawai yang sesuai dengan pencarian Anda.
                  </td>
                </tr>
              ) : (
                filtered.map((p) => (
                  <tr key={p.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 text-[#b01218] flex items-center justify-center font-bold text-xs">
                          {getInitials(p.nama_pegawai)}
                        </div>
                        <div>
                          <div className="font-bold text-neutral-900 text-xs flex items-center gap-1.5">
                            <span>{p.nama_pegawai}</span>
                            {p.id === 1 && (
                              <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-red-100 text-[#b01218] font-semibold">
                                Akun Anda
                              </span>
                            )}
                          </div>
                          <div className="text-[10.5px] text-neutral-400">
                            Masuk: {p.tanggal_masuk}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <code className="text-[11px] bg-neutral-100 px-1.5 py-0.5 rounded border border-neutral-200 text-neutral-800">
                        {p.username}
                      </code>
                    </td>
                    <td className="py-3 px-4 text-neutral-600">
                      {p.email}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {p.role.toLowerCase() === 'owner' ? (
                        <span className="rl-pill rl-pill-red text-[10px]">
                          OWNER &amp; PEGAWAI
                        </span>
                      ) : (
                        <span className="rl-pill rl-pill-blue text-[10px]">
                          KARYAWAN
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 rl-mono text-neutral-700">
                      {p.nomor_hp || '—'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {p.masih_bekerja ? (
                        <span className="rl-pill rl-pill-green text-[10px]">
                          AKTIF
                        </span>
                      ) : (
                        <span className="rl-pill rl-pill-gray text-[10px]">
                          NONAKTIF
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {isOnline && p.sesi_count > 0 ? (
                        <span className="rl-pill rl-pill-blue text-[10px]">
                          {p.sesi_count} Perangkat
                        </span>
                      ) : (
                        <span className="text-neutral-400 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t border-neutral-100 bg-neutral-50 text-[11px] text-neutral-400 text-right">
          Menampilkan {filtered.length} dari total {pegawaiList.length} akun terdaftar
        </div>
      </div>
    </div>
  );
}
