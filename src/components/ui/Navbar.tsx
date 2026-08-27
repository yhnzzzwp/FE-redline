'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useConnection } from '@/lib/connection';
import { Menu, X, Home, Wrench, Info } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { isOnline } = useConnection();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Beranda', href: '/', icon: Home },
    { label: 'Lacak Servis', href: '/cek-servis', icon: Wrench },
    { label: 'Tentang Kami', href: '/about', icon: Info },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-neutral-200">
      <nav className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4" role="navigation">
        <Link href="/" className="inline-flex items-center gap-2 no-underline shrink-0">
          <span className="rl-logo text-xl">REDL<i>INE</i></span>
          <span className="rl-stripe"></span>
        </Link>

        {/* Desktop Links */}
        <div className="hidden md:flex items-center gap-6 shrink-0">
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

        {/* Right side items */}
        <div className="flex items-center gap-3">
          {/* Status Real-time Koneksi API */}
          <div
            className={`flex items-center gap-2 px-2.5 py-1 rounded-full border text-[11px] font-semibold shadow-sm ${
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
            <span className="hidden xs:inline">{isOnline ? 'Terkoneksi' : 'Tidak Tersedia'}</span>
          </div>

          {/* Mobile hamburger button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 border border-neutral-200 cursor-pointer bg-white"
            aria-label="Toggle navigasi publik"
          >
            {mobileMenuOpen ? <X className="w-5 h-5 text-[#de1f26]" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-neutral-200 px-4 py-3 space-y-1 shadow-xl animate-in slide-in-from-top-2 duration-200">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-red-50 text-[#b01218] font-bold'
                    : 'text-neutral-700 hover:bg-neutral-50'
                }`}
              >
                <Icon className="w-4 h-4 text-[#de1f26]" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
