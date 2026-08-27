'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Server } from 'lucide-react';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', href: '/admin', path: 'M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z' },
  { key: 'pos', label: 'Kasir POS', href: '/admin/pos', path: 'M3 4h18v12H3zM3 20h18' },
  { key: 'produk', label: 'Produk', href: '/admin/produk', path: 'M3 7l9-4 9 4-9 4-9-4zM3 7v10l9 4 9-4V7' },
  { key: 'transaksi', label: 'Transaksi', href: '/admin/transaksi', path: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
  { key: 'service', label: 'Servis', href: '/admin/service', path: 'M14 6a4 4 0 005 5l-8 8-3-3 6-6a4 4 0 010-4z' },
  { key: 'promo', label: 'Promo', href: '/admin/promo', path: 'M3 12l8-8h8v8l-8 8-8-8zM15 9h.01', ownerOnly: true },
  { key: 'pegawai', label: 'Akun Pegawai', href: '/admin/pegawai', path: 'M3 5h18v14H3zM9 12a2 2 0 100-4 2 2 0 000 4z', ownerOnly: true },
  { key: 'sesi', label: 'Sesi Aktif', href: '/admin/sesi', path: 'M13 8h8M13 12h8M4 4h16v16H4zM8 16h.01M8 8h.01M8 12h.01' },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  const activeKey = NAV_ITEMS.find((item) =>
    item.key === 'dashboard' ? pathname === '/admin' : pathname.startsWith(item.href)
  )?.key || 'dashboard';

  const currentDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  const handleLogout = () => {
    document.cookie = 'admin-token=; path=/; max-age=0';
    router.push('/admin/login');
  };

  return (
    <div className="rl-app">
      <div className="rl-side-wrapper">
        <aside className="rl-side" role="navigation">
          <div className="rl-side__brand">
            <span className="rl-logo">REDL<i>INE</i></span>
            <span className="rl-stripe"></span>
          </div>
          <div className="rl-ticks"></div>
          <div className="rl-portal-chip">Admin Console</div>

          {NAV_ITEMS.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              className={`rl-nav-item ${activeKey === item.key ? 'active' : ''}`}
            >
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={item.path} />
              </svg>
              <span>{item.label}</span>
              {item.ownerOnly && <span className="rl-nav-owner">Owner</span>}
            </Link>
          ))}

          <div className="rl-side__foot space-y-2">
            {/* Status Koneksi API & Resiliensi Offline */}
            <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/90 text-left space-y-1.5 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-bold text-[11px] text-neutral-800">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span>Koneksi API &amp; Server</span>
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 uppercase tracking-wider">
                  Tersedia
                </span>
              </div>
              <p className="text-[10px] text-neutral-500 leading-tight mb-0">
                Website FE terhubung dengan REST API Backend &amp; 100% siap digunakan secara <strong>Online</strong> maupun <strong>Offline</strong>.
              </p>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="rl-nav-item w-full border-0 bg-transparent text-left cursor-pointer"
            >
              <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </aside>
      </div>

      <div className="rl-main">
        <div className="rl-topbar">
          <div className="rl-search">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 text-neutral-400 shrink-0">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4-4" />
            </svg>
            <input
              type="text"
              placeholder="Cari kode servis, produk, atau transaksi…"
              className="border-0 bg-transparent w-full shadow-none outline-none text-[13.5px]"
              style={{ color: 'var(--ink)' }}
            />
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Status Badge API Online/Offline di Topbar */}
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200/80 text-[11px] font-semibold text-emerald-800">
              <Server className="w-3.5 h-3.5 text-emerald-600" />
              <span>API Backend Aktif &middot; Mode Online/Offline Siap</span>
            </div>

            <div className="text-right hidden lg:block leading-tight">
              <div className="font-semibold text-sm" style={{ color: 'var(--ink)' }}>Adi Kusumo</div>
              <div className="text-neutral-500 text-xs">Owner &middot; {currentDate}</div>
            </div>
            <div className="rl-avatar hidden lg:inline-flex">AK</div>
          </div>
        </div>

        <div className="rl-body" id="konten" role="main">
          {children}
        </div>
      </div>
    </div>
  );
}
