'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useConnection } from '@/lib/connection';

export default function Navbar() {
  const pathname = usePathname();
  const { isOnline } = useConnection();

  const navLinks = [
    { label: 'Beranda', href: '/' },
    { label: 'Lacak Servis', href: '/cek-servis' },
    { label: 'Tentang Kami', href: '/about' },
  ];

  return (
    <nav className="rl-pubnav flex items-center justify-start gap-6 md:gap-8" role="navigation">
      <Link href="/" className="inline-flex items-center gap-2 no-underline shrink-0">
        <span className="rl-logo text-xl">REDL<i>INE</i></span>
        <span className="rl-stripe"></span>
      </Link>

      <div className="flex items-center gap-5 sm:gap-6 shrink-0">
        {navLinks.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`text-[13.5px] font-semibold tracking-wide transition-colors whitespace-nowrap ${
                isActive
                  ? 'text-neutral-900 font-bold relative after:content-[""] after:absolute after:left-0 after:right-0 after:-bottom-1.5 after:h-0.5 after:bg-[#de1f26] after:-skew-x-[18deg]'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>

      {/* Status Real-time Koneksi API */}
      <div
        className={`ml-auto hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full border text-[11px] font-semibold shadow-sm ${
          isOnline
            ? 'bg-emerald-50/90 border-emerald-200/80 text-emerald-800'
            : 'bg-red-50/90 border-red-200/80 text-red-700'
        }`}
      >
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
        <span>{isOnline ? 'Terkoneksi' : 'Tidak Tersedia'}</span>
      </div>
    </nav>
  );
}
