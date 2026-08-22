'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { loginUser } from '@/lib/api';
import { User, Lock, Eye, EyeOff, Shield, Briefcase } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [portal, setPortal] = useState<'admin' | 'karyawan'>('admin');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [showTip, setShowTip] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const isAdmin = portal === 'admin';

  const handlePortalSwitch = (target: 'admin' | 'karyawan') => {
    setPortal(target);
    setError('');
    setShowTip(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await loginUser(portal, username, password);

      if (res.success && res.token) {
        const isProd = process.env.NODE_ENV === 'production';
        const maxAge = remember ? 86400 * 30 : 86400;
        let cookieString = `admin-token=${res.token}; path=/; max-age=${maxAge}; SameSite=Strict`;
        if (isProd) {
          cookieString += '; Secure';
        }
        document.cookie = cookieString;

        if (isAdmin) {
          router.push('/admin');
        } else {
          router.push('/pos');
        }
      } else {
        setError(res.message || 'Login gagal. Periksa username dan password Anda.');
      }
    } catch {
      setError('Terjadi kesalahan sistem saat mencoba login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rl-login">
      <aside className="rl-login__brand">
        <div className="flex items-center gap-2">
          <span className="rl-logo text-2xl text-neutral-100">REDL<i>INE</i></span>
          <span className="rl-stripe"></span>
        </div>

        <div className="space-y-3 my-auto py-8">
          <div className="rl-kicker text-neutral-400">
            {isAdmin ? 'Ruang kendali' : 'Area kerja'} <b>&middot;</b> Redline Komputer
          </div>
          <h1 className="rl-login__portal">
            {isAdmin ? (
              <>
                Admin<br />
                <i>Console.</i>
              </>
            ) : (
              <>
                Portal<br />
                <i>Karyawan.</i>
              </>
            )}
          </h1>
          <p className="rl-login__meta">
            {isAdmin
              ? 'Analitik penjualan, manajemen promo, akun pegawai, dan seluruh operasi toko — khusus Owner.'
              : 'Kasir (POS), manajemen produk, dan tiket servis pelanggan — area kerja harian tim Redline.'}
          </p>
        </div>

        <div className="rl-login__foot">
          <span className="rl-mono">
            {isAdmin ? 'admin.redlinekomputer.com' : 'karyawan.redlinekomputer.com'}
          </span>
          <span>&middot;</span>
          <span>Akses terbatas &amp; tercatat</span>
        </div>
      </aside>

      <main className="rl-login__panel">
        <div className="w-full max-w-[410px] space-y-4">
          <div className="flex p-1 bg-neutral-200/80 rounded-xl gap-1">
            <button
              type="button"
              onClick={() => handlePortalSwitch('admin')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 border-0 cursor-pointer ${
                isAdmin
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'bg-transparent text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Shield className="w-3.5 h-3.5 text-[#de1f26]" />
              <span>Admin Console</span>
            </button>
            <button
              type="button"
              onClick={() => handlePortalSwitch('karyawan')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 border-0 cursor-pointer ${
                !isAdmin
                  ? 'bg-white text-neutral-900 shadow-sm'
                  : 'bg-transparent text-neutral-600 hover:text-neutral-900'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5 text-[#2158d8]" />
              <span>Portal Karyawan</span>
            </button>
          </div>

          <div className="rl-login-card">
            <div className="rl-ticks"></div>
            <div className="mb-4">
              <h2 className="rl-title-md mb-1 text-neutral-900">
                {isAdmin ? 'Masuk sebagai Owner' : 'Masuk sebagai Karyawan'}
              </h2>
              <p className="text-neutral-500 text-xs mb-0">
                {isAdmin
                  ? 'Gunakan akun Owner Anda untuk melanjutkan.'
                  : 'Gunakan akun karyawan Anda untuk melanjutkan.'}
              </p>
            </div>

            {error && (
              <div className="rl-err">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="w-4 h-4 shrink-0 text-[#b01218]"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 8v4M12 16h.01" />
                </svg>
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin}>
              <div className="rl-field">
                <span className="ic">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Username atau Email"
                  required
                  autoFocus
                  className={error ? 'err' : ''}
                />
              </div>

              <div className="rl-field">
                <span className="ic">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  required
                  className={error ? 'err' : ''}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="rl-pwd-toggle"
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between mb-3 text-xs">
                <label className="flex items-center gap-2 text-neutral-500 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="rounded text-[#de1f26] focus:ring-[#de1f26]"
                  />
                  <span>Ingat perangkat</span>
                </label>

                <div className="relative text-right">
                  <button
                    type="button"
                    onClick={() => setShowTip(!showTip)}
                    className="text-[#de1f26] hover:text-[#b01218] font-semibold bg-transparent border-0 p-0 cursor-pointer text-xs"
                  >
                    Lupa Password?
                  </button>
                  {showTip && (
                    <div className="absolute right-0 top-6 z-20 w-56 p-2.5 bg-neutral-900 text-white rounded-lg text-[11px] leading-snug shadow-xl text-left border border-neutral-700">
                      {isAdmin
                        ? 'Hubungi pengelola sistem server untuk reset password Owner.'
                        : 'Silakan hubungi Owner untuk me-reset password akun kasir Anda.'}
                    </div>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-redline w-full py-3 text-sm font-bold flex items-center justify-center gap-2"
              >
                <span>{loading ? 'Memproses...' : `Masuk ke ${isAdmin ? 'Admin Console' : 'Portal Karyawan'}`}</span>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className="w-4 h-4 shrink-0"
                >
                  <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4M10 17l5-5-5-5M15 12H3" />
                </svg>
              </button>
            </form>

            <div className="text-center mt-4 pt-3 border-t border-neutral-100">
              <button
                type="button"
                onClick={() => handlePortalSwitch(isAdmin ? 'karyawan' : 'admin')}
                className="text-[11.5px] text-neutral-500 hover:text-[#b01218] bg-transparent border-0 cursor-pointer transition-colors"
              >
                {isAdmin
                  ? 'Karyawan toko? Klik di sini untuk beralih ke Portal Karyawan.'
                  : 'Owner? Klik di sini untuk beralih ke Admin Console.'}
              </button>
            </div>
          </div>

          <div className="text-center">
            <Link
              href="/"
              className="text-xs text-neutral-500 hover:text-[#b01218] transition-colors"
            >
              &larr; Kembali ke Katalog Publik
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
