'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logoutUser } from '@/lib/api';
import { SessionProvider, useSession, inisial } from '@/lib/session';
import {
  Server,
  ScanLine,
  Menu,
  X,
  LayoutDashboard,
  ShoppingCart,
  Package,
  Receipt,
  Wrench,
  Tag,
  Users,
  Laptop,
  LogOut,
  MoreHorizontal,
} from 'lucide-react';
import { useConnection } from '@/lib/connection';

const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { key: 'pos', label: 'Kasir POS', href: '/admin/pos', icon: ShoppingCart },
  { key: 'produk', label: 'Produk', href: '/admin/produk', icon: Package },
  { key: 'transaksi', label: 'Transaksi', href: '/admin/transaksi', icon: Receipt },
  { key: 'service', label: 'Servis', href: '/admin/service', icon: Wrench },
  { key: 'pindai', label: 'Pindai Unit', href: '/admin/pindai', icon: ScanLine },
  // Dua menu ini hanya untuk Owner — cocok dengan grup 'owner.api' di
  // routes/api.php pada backend, yang tetap menjadi penegak sebenarnya.
  { key: 'promo', label: 'Promo', href: '/admin/promo', icon: Tag, ownerOnly: true },
  { key: 'pegawai', label: 'Akun Pegawai', href: '/admin/pegawai', icon: Users, ownerOnly: true },
  { key: 'sesi', label: 'Sesi Aktif', href: '/admin/sesi', icon: Laptop },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Halaman login tidak boleh memicu pengambilan sesi (belum ada sesinya).
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  return (
    <SessionProvider>
      <AdminShell>{children}</AdminShell>
    </SessionProvider>
  );
}

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isOnline } = useConnection();
  const { user, isOwner } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = NAV_ITEMS.filter((item) => !item.ownerOnly || isOwner);

  const activeKey = NAV_ITEMS.find((item) =>
    item.key === 'dashboard' ? pathname === '/admin' : pathname.startsWith(item.href)
  )?.key || 'dashboard';

  const currentDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date());

  const handleLogout = async () => {
    // Server yang mencabut token di Laravel sekaligus menghapus cookie
    // HttpOnly-nya; halaman ini tidak punya akses ke keduanya.
    await logoutUser();

    // Buang HTML halaman internal yang tersimpan service worker supaya
    // pengguna berikutnya di perangkat yang sama tidak bisa membukanya offline.
    try {
      navigator.serviceWorker?.controller?.postMessage({ type: 'CLEAR_CACHE' });
    } catch {
      // Service worker tidak aktif — abaikan.
    }

    router.push('/admin/login');
  };

  return (
    <div className="rl-app min-h-screen">
      {/* Backdrop overlay for mobile drawer */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[95] lg:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar Wrapper */}
      <div className={`rl-side-wrapper ${mobileMenuOpen ? 'open' : ''}`}>
        <aside className="rl-side" role="navigation">
          <div className="rl-side__brand flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="rl-logo">REDL<i>INE</i></span>
              <span className="rl-stripe"></span>
            </div>
            {/* Mobile close button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-neutral-400 hover:text-neutral-900 hover:bg-neutral-100 cursor-pointer border-0 bg-transparent"
              aria-label="Tutup Menu"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="rl-ticks"></div>
          <div className="rl-portal-chip">Admin Console</div>

          <nav className="space-y-1 flex-1 py-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeKey === item.key;
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`rl-nav-item ${isActive ? 'active' : ''}`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="rl-side__foot space-y-2 pt-2 border-t border-neutral-100">
            {/* Status Koneksi Real-time */}
            <div className="p-2.5 rounded-xl bg-neutral-50 border border-neutral-200/90 flex items-center justify-between text-xs shadow-sm">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2 w-2">
                  {isOnline && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  )}
                  <span
                    className={`relative inline-flex rounded-full h-2 w-2 ${
                      isOnline ? 'bg-emerald-500' : 'bg-red-500'
                    }`}
                  ></span>
                </span>
                <span className="text-[11.5px] font-semibold text-neutral-700">Koneksi API</span>
              </div>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                  isOnline
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-red-100 text-red-700'
                }`}
              >
                {isOnline ? 'Terkoneksi' : 'Tidak Tersedia'}
              </span>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="rl-nav-item w-full border-0 bg-transparent text-left cursor-pointer text-red-600 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </aside>
      </div>

      {/* Main Content Area */}
      <div className="rl-main flex flex-col min-h-screen">
        {/* Topbar */}
        <header className="rl-topbar sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-neutral-200/80">
          {/* Mobile Hamburger Toggle Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 -ml-1 mr-2 rounded-xl bg-neutral-100 hover:bg-neutral-200 text-neutral-800 lg:hidden flex items-center justify-center cursor-pointer border border-neutral-200 shrink-0 transition-colors"
            aria-label="Toggle menu navigasi"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-red-600" /> : <Menu className="w-5 h-5" />}
          </button>

          <div className="rl-search flex-1 max-w-md">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 text-neutral-400 shrink-0">
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4-4" />
            </svg>
            <input
              type="text"
              placeholder="Cari transaksi, produk, servis..."
              className="border-0 bg-transparent w-full shadow-none outline-none text-[13px]"
              style={{ color: 'var(--ink)' }}
            />
          </div>

          <div className="flex items-center gap-3 ml-auto">
            {/* Status Realtime di Topbar */}
            <div
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-semibold ${
                isOnline
                  ? 'bg-emerald-50 border-emerald-200/80 text-emerald-800'
                  : 'bg-red-50 border-red-200/80 text-red-700'
              }`}
            >
              <Server className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isOnline ? 'Terkoneksi' : 'Tidak Tersedia'}</span>
            </div>

            <div className="text-right hidden md:block leading-tight">
              <div className="font-semibold text-sm" style={{ color: 'var(--ink)' }}>
                {user?.nama_pegawai ?? '…'}
              </div>
              <div className="text-neutral-500 text-xs">
                {user?.role ?? 'Memuat'} &middot; {currentDate}
              </div>
            </div>
            <div className="rl-avatar hidden sm:inline-flex">{inisial(user?.nama_pegawai)}</div>
          </div>
        </header>

        {/* Body Content */}
        {/* Jarak bawah untuk navigasi mobile ada di .rl-body (globals.css);
            utilitas padding di sini tidak akan berpengaruh — lihat catatan
            tentang cascade layer di aturan .rl-body. */}
        <main className="rl-body flex-1" id="konten">
          {children}
        </main>

        {/* Bottom Mobile Quick Navigation Bar (Visible on mobile/tablet screens) */}
        <nav
          className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-neutral-200 px-2 py-1.5 flex items-center justify-around shadow-lg"
          role="navigation"
          aria-label="Navigasi Bawah Mobile"
        >
          <Link
            href="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-semibold transition-colors ${
              activeKey === 'dashboard'
                ? 'text-[#de1f26]'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </Link>

          <Link
            href="/admin/pos"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-semibold transition-colors ${
              activeKey === 'pos'
                ? 'text-[#de1f26]'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Kasir</span>
          </Link>

          <Link
            href="/admin/produk"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-semibold transition-colors ${
              activeKey === 'produk'
                ? 'text-[#de1f26]'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>Produk</span>
          </Link>

          <Link
            href="/admin/transaksi"
            onClick={() => setMobileMenuOpen(false)}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-semibold transition-colors ${
              activeKey === 'transaksi'
                ? 'text-[#de1f26]'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <Receipt className="w-4 h-4" />
            <span>Transaksi</span>
          </Link>

          <button
            type="button"
            onClick={() => setMobileMenuOpen(true)}
            className={`flex flex-col items-center gap-1 py-1 px-2.5 rounded-lg text-[10px] font-semibold transition-colors cursor-pointer border-0 bg-transparent ${
              ['service', 'promo', 'pegawai', 'sesi'].includes(activeKey)
                ? 'text-[#de1f26]'
                : 'text-neutral-500 hover:text-neutral-900'
            }`}
          >
            <MoreHorizontal className="w-4 h-4" />
            <span>Menu</span>
          </button>
        </nav>
      </div>
    </div>
  );
}
