'use client';

import { useState } from 'react';
import pegawaiData from '@/data/pegawai.json';

export default function AdminPegawaiPage() {
  const [pegawaiList] = useState(pegawaiData);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  };

  const activeCount = pegawaiList.filter((p) => p.masih_bekerja).length;

  return (
    <div className="space-y-6">
      <div className="rl-page-header flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="rl-page-title mb-1">Akun Pegawai</h1>
          <p className="rl-page-desc mb-0">
            Kelola akun &amp; data karyawan toko &mdash; Total {activeCount} pegawai aktif terdaftar.
          </p>
        </div>
      </div>

      <div className="rl-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-100/70 border-b border-neutral-200 text-neutral-600 font-bold uppercase tracking-wider text-[10.5px]">
                <th className="py-3 px-4">Pegawai</th>
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4 text-center">Role</th>
                <th className="py-3 px-4">No. HP</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Sesi Aktif</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-neutral-800">
              {pegawaiList.map((p) => (
                <tr key={p.id} className="hover:bg-neutral-50/80 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-200 text-[#b01218] flex items-center justify-center font-bold text-xs">
                        {getInitials(p.nama_pegawai)}
                      </div>
                      <div>
                        <div className="font-bold text-neutral-900 text-xs">
                          {p.nama_pegawai}
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
                        OWNER
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
                    {p.sesi_count > 0 ? (
                      <span className="rl-pill rl-pill-blue text-[10px]">
                        {p.sesi_count} Perangkat
                      </span>
                    ) : (
                      <span className="text-neutral-400 text-xs">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t border-neutral-100 bg-neutral-50 text-[11px] text-neutral-400 text-right">
          Menampilkan {pegawaiList.length} pegawai terdaftar
        </div>
      </div>
    </div>
  );
}
