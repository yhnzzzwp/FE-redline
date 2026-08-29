'use client';

import { useState } from 'react';
import { useConnection } from '@/lib/connection';
import { authFetch } from '@/lib/api';
import { useApiData, daftar } from '@/lib/useApiData';
import { Laptop, Smartphone, WifiOff, RefreshCw } from 'lucide-react';

/**
 * Sesi aktif = token API milik akun ini.
 *
 * Versi sebelumnya hanya memanipulasi state React yang diisi dari
 * src/data/sesi.json: tombol "Keluarkan" menghapus satu baris dari tabel di
 * layar dan tidak pernah menghubungi server sama sekali — padahal teksnya
 * menjanjikan "sesinya akan berakhir seketika". Sekarang semuanya benar-benar
 * memanggil backend.
 */
interface Sesi {
  id: number;
  nama_perangkat: string;
  terakhir_dipakai: string | null;
  dibuat: string | null;
  kedaluwarsa: string | null;
  perangkat_ini: boolean;
}

function waktu(iso: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export default function AdminSesiPage() {
  const { isOnline } = useConnection();
  const { data, loading, error, muatUlang } = useApiData<Sesi[]>(
    '/auth/sesi',
    (json) => daftar<Sesi>(json)
  );

  const sessions = data ?? [];
  const [busy, setBusy] = useState(false);

  const keluarkanSatu = async (s: Sesi) => {
    if (!confirm(`Keluarkan "${s.nama_perangkat}"? Token perangkat itu langsung dicabut.`)) return;

    setBusy(true);
    try {
      const res = await authFetch(`/auth/sesi/${s.id}`, { method: 'DELETE' });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        alert(json?.message ?? 'Gagal mengeluarkan perangkat.');
      }
      muatUlang();
    } finally {
      setBusy(false);
    }
  };

  const keluarkanLain = async () => {
    if (!confirm('Keluarkan semua perangkat lain? Semua token selain perangkat ini akan dicabut.')) return;

    setBusy(true);
    try {
      const res = await authFetch('/auth/sesi/keluarkan-lain', { method: 'POST' });
      const json = await res.json().catch(() => null);
      if (!res.ok) {
        alert(json?.message ?? 'Gagal mengeluarkan perangkat lain.');
      }
      muatUlang();
    } finally {
      setBusy(false);
    }
  };

  const jumlahLain = sessions.filter((s) => !s.perangkat_ini).length;

  return (
    <div className="space-y-6">
      <div className="rl-page-header flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="rl-page-title mb-1">Sesi Aktif</h1>
          <p className="rl-page-desc mb-0">
            Perangkat yang punya token aktif untuk akun Anda &mdash; {sessions.length} terdaftar.
          </p>
        </div>
        <button
          type="button"
          onClick={() => muatUlang()}
          disabled={loading || busy}
          className="btn-ghost py-1.5 px-3 text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Muat ulang
        </button>
      </div>

      {!isOnline && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-xs text-amber-900">
          <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Mode Offline:</strong> daftar sesi tidak dapat dimuat maupun diubah tanpa koneksi ke server.
          </span>
        </div>
      )}

      {error && (
        <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800">
          {error}
        </div>
      )}

      {jumlahLain > 0 && (
        <div className="rl-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-amber-50/50 border-amber-200">
          <div>
            <div className="font-bold text-xs text-neutral-900">
              Keluarkan Semua Perangkat Lain ({jumlahLain})
            </div>
            <div className="text-[11px] text-neutral-600">
              Token di perangkat lain dicabut; perangkat ini tetap masuk.
            </div>
          </div>

          <button
            type="button"
            onClick={() => void keluarkanLain()}
            disabled={busy}
            className="btn-redline py-1.5 px-3 text-xs font-bold shrink-0 cursor-pointer disabled:opacity-50"
          >
            Keluarkan Semua
          </button>
        </div>
      )}

      <div className="rl-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-neutral-100/70 border-b border-neutral-200 text-neutral-600 font-bold uppercase tracking-wider text-[10.5px]">
                <th className="py-3 px-4">Perangkat</th>
                <th className="py-3 px-4">Terakhir Dipakai</th>
                <th className="py-3 px-4">Kedaluwarsa</th>
                <th className="py-3 px-4 text-center">Status / Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-neutral-800">
              {loading ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-neutral-400 text-xs">
                    Memuat daftar sesi&hellip;
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-neutral-400 text-xs">
                    Tidak ada sesi aktif yang terdeteksi.
                  </td>
                </tr>
              ) : (
                sessions.map((s) => {
                  const nama = s.nama_perangkat.toLowerCase();
                  const ponsel = nama.includes('iphone') || nama.includes('android') || nama.includes('mobile');
                  return (
                    <tr key={s.id} className="hover:bg-neutral-50/80 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          {ponsel ? (
                            <Smartphone className="w-4 h-4 text-neutral-500" />
                          ) : (
                            <Laptop className="w-4 h-4 text-neutral-500" />
                          )}
                          <div className="text-[10px] text-neutral-500 font-mono truncate max-w-md">
                            {s.nama_perangkat}
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-neutral-600">{waktu(s.terakhir_dipakai)}</td>
                      <td className="py-3 px-4 text-neutral-600">{waktu(s.kedaluwarsa)}</td>
                      <td className="py-3 px-4 text-center">
                        {s.perangkat_ini ? (
                          <span className="rl-pill rl-pill-green text-[10px]">Perangkat Ini</span>
                        ) : (
                          <button
                            type="button"
                            onClick={() => void keluarkanSatu(s)}
                            disabled={busy}
                            className="btn-ghost py-1 px-2.5 text-[11px] text-red-600 hover:bg-red-50 font-semibold cursor-pointer disabled:opacity-50"
                          >
                            Keluarkan
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t border-neutral-100 bg-neutral-50 text-[11px] text-neutral-400 text-right">
          Total {sessions.length} sesi terdaftar
        </div>
      </div>
    </div>
  );
}
