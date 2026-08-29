'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useConnection } from '@/lib/connection';
import { ArrowLeft, WifiOff, CheckCircle2, MessageCircle } from 'lucide-react';

const WA = process.env.NEXT_PUBLIC_WA_PHONE || '6285640203069';

/**
 * Atur ulang password.
 *
 * Hanya berfungsi saat terhubung ke backend — permintaannya perlu dicatat di
 * server. Ini berbeda dengan POS, yang memang dirancang tetap jalan offline.
 */
export default function LupaPasswordPage() {
  const { isOnline } = useConnection();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);
  const [terkirim, setTerkirim] = useState(false);
  const [error, setError] = useState('');

  const kirim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || loading) return;

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/backend/auth/lupa-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim() }),
        cache: 'no-store',
      });

      const json = await res.json().catch(() => null);

      if (res.status === 429) {
        setError('Terlalu banyak permintaan. Tunggu satu menit lalu coba lagi.');
        return;
      }

      if (!res.ok) {
        setError(json?.message ?? 'Permintaan gagal dikirim.');
        return;
      }

      setTerkirim(true);
    } catch {
      setError('Tidak dapat terhubung ke server Redline.');
    } finally {
      setLoading(false);
    }
  };

  const waLink = `https://wa.me/${WA}?text=${encodeURIComponent(
    `Halo Owner Redline, saya lupa password akun kasir saya (username: ${username.trim() || '...'}). Mohon dibantu atur ulang. Terima kasih.`
  )}`;

  return (
    <div className="min-h-screen bg-neutral-100/70 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center space-y-1">
          <span className="rl-logo text-2xl text-[#de1f26]">REDL<i>INE</i></span>
          <h1 className="font-bold text-sm uppercase tracking-wider text-neutral-900 mb-0">
            Atur Ulang Password
          </h1>
        </div>

        {!isOnline && (
          <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3 text-xs text-amber-900">
            <WifiOff className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong>Tidak ada koneksi ke server.</strong> Atur ulang password
              memerlukan koneksi karena harus diverifikasi di server. Kasir (POS)
              tetap bisa dipakai offline dengan akun yang sudah pernah masuk di
              perangkat ini.
            </span>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-neutral-200 p-6 shadow-sm">
          {terkirim ? (
            <div className="space-y-4 text-center">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <div>
                <h2 className="font-bold text-sm text-neutral-900 mb-1">Permintaan tercatat</h2>
                <p className="text-xs text-neutral-600 mb-0">
                  Password diatur ulang oleh Owner toko. Hubungi Owner untuk
                  mendapatkan password baru Anda.
                </p>
              </div>

              <a
                href={waLink}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-redline w-full py-2 text-xs font-bold inline-flex items-center justify-center gap-2 no-underline"
              >
                <MessageCircle className="w-4 h-4" />
                Hubungi Owner via WhatsApp
              </a>
            </div>
          ) : (
            <form onSubmit={kirim} className="space-y-4">
              <p className="text-xs text-neutral-600 mb-0">
                Masukkan username atau email Anda. Permintaan akan dicatat dan
                Owner toko yang akan mengatur ulang password Anda.
              </p>

              <div>
                <label htmlFor="username" className="block text-[11px] font-bold text-neutral-700 mb-1.5">
                  Username atau Email
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  disabled={!isOnline || loading}
                  autoComplete="username"
                  className="w-full border border-neutral-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-neutral-900 disabled:bg-neutral-100"
                  placeholder="mis. rijal"
                />
              </div>

              {error && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-[11px] text-red-800">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={!isOnline || loading || !username.trim()}
                className="btn-redline w-full py-2 text-xs font-bold cursor-pointer disabled:opacity-50"
              >
                {loading ? 'Mengirim…' : 'Kirim Permintaan'}
              </button>
            </form>
          )}
        </div>

        <div className="text-center">
          <Link
            href="/admin/login"
            className="text-xs font-semibold text-neutral-500 hover:text-neutral-900 inline-flex items-center gap-1 no-underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke halaman masuk</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
