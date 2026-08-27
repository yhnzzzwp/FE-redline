'use client';

import { useState } from 'react';
import sesiData from '@/data/sesi.json';
import { useConnection } from '@/lib/connection';
import { Laptop, Smartphone, WifiOff } from 'lucide-react';

export default function AdminSesiPage() {
  const { isOnline } = useConnection();
  const [sessions, setSessions] = useState(sesiData);

  const activeSessions = isOnline ? sessions : [];

  const handleTerminateSession = (id: string) => {
    if (!isOnline) {
      alert('Tidak dapat memutus sesi perangkat saat offline.');
      return;
    }
    if (confirm('Keluarkan perangkat ini? Sesinya akan berakhir seketika.')) {
      setSessions(sessions.filter((s) => s.id !== id));
    }
  };

  const handleTerminateAllOthers = () => {
    if (!isOnline) {
      alert('Tidak dapat memutus sesi perangkat saat offline.');
      return;
    }
    if (confirm('Keluarkan semua perangkat lain? Semua sesi kecuali yang sedang Anda pakai akan diakhiri.')) {
      setSessions(sessions.filter((s) => s.is_current));
    }
  };

  const otherSessionsCount = isOnline ? sessions.filter((s) => !s.is_current).length : 0;

  return (
    <div className="space-y-6">
      <div className="rl-page-header flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="rl-page-title mb-1">Sesi Aktif</h1>
          <p className="rl-page-desc mb-0">
            Daftar perangkat yang saat ini sedang login dengan akun Anda &mdash; Total {activeSessions.length} sesi terdeteksi.
          </p>
        </div>
      </div>

      {!isOnline && (
        <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3 text-xs text-amber-900">
          <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
          <span>
            <strong>Mode Offline:</strong> Mohon maaf, tidak ada koneksi dengan database backend. Data sesi aktif perangkat tidak dapat dimuat saat offline.
          </span>
        </div>
      )}

      {isOnline && otherSessionsCount > 0 && (
        <div className="rl-card p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-amber-50/50 border-amber-200">
          <div>
            <div className="font-bold text-xs text-neutral-900">
              Keluarkan Semua Perangkat Lain ({otherSessionsCount} sesi)
            </div>
            <div className="text-[11px] text-neutral-600">
              Semua sesi login di perangkat lain akan diputus seketika.
            </div>
          </div>

          <button
            type="button"
            onClick={handleTerminateAllOthers}
            className="btn-redline py-1.5 px-3 text-xs font-bold shrink-0 cursor-pointer"
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
                <th className="py-3 px-4">Perangkat &amp; Browser</th>
                <th className="py-3 px-4">Alamat IP</th>
                <th className="py-3 px-4">Terakhir Aktif</th>
                <th className="py-3 px-4 text-center">Status / Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100 text-neutral-800">
              {!isOnline ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-neutral-400 text-xs px-4">
                    Mohon maaf, tidak ada koneksi dengan database. Riwayat sesi aktif tidak tersedia saat offline.
                  </td>
                </tr>
              ) : activeSessions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-neutral-400 text-xs">
                    Tidak ada sesi aktif lain yang terdeteksi.
                  </td>
                </tr>
              ) : (
                activeSessions.map((s) => (
                  <tr key={s.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        {s.device_name.toLowerCase().includes('iphone') || s.device_name.toLowerCase().includes('android') ? (
                          <Smartphone className="w-4 h-4 text-neutral-500" />
                        ) : (
                          <Laptop className="w-4 h-4 text-neutral-500" />
                        )}
                        <div>
                          <div className="font-bold text-neutral-900 text-xs">
                            {s.device_name}
                          </div>
                          <div className="text-[10px] text-neutral-400 font-mono truncate max-w-sm">
                            {s.user_agent}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 rl-mono text-neutral-700">
                      {s.ip_address}
                    </td>
                    <td className="py-3 px-4 text-neutral-600">
                      {s.last_activity}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {s.is_current ? (
                        <span className="rl-pill rl-pill-green text-[10px]">
                          Sesi Ini
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleTerminateSession(s.id)}
                          className="btn-ghost py-1 px-2.5 text-[11px] text-red-600 hover:bg-red-50 font-semibold cursor-pointer"
                        >
                          Keluarkan
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t border-neutral-100 bg-neutral-50 text-[11px] text-neutral-400 text-right">
          Total {activeSessions.length} sesi terdaftar
        </div>
      </div>
    </div>
  );
}
