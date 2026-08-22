'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { label: 'Beranda', href: '/' },
    { label: 'Lacak Servis', href: '/cek-servis' },
    { label: 'Tentang Kami', href: '/about' },
  ];

  return (
    <nav className="rl-pubnav justify-between md:justify-start" role="navigation">
      <Link href="/" className="inline-flex items-center gap-2 no-underline">
        <span className="rl-logo text-xl">REDL<i>INE</i></span>
        <span className="rl-stripe"></span>
      </Link>

      <button
        type="button"
        onClick={() => setMobileMenuOpen(true)}
        className="md:hidden btn-ghost border-0 bg-transparent p-2"
        aria-label="Buka menu navigasi"
        aria-expanded={mobileMenuOpen}
      >
        <Menu className="w-6 h-6 text-neutral-800" />
      </button>

      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-neutral-950/55 md:hidden transition-opacity"
          aria-hidden="true"
        />
      )}

      <div
        className={`fixed top-0 right-0 bottom-0 z-50 w-[min(300px,84vw)] bg-white border-l border-neutral-200 p-5 shadow-2xl flex flex-col gap-2 transition-transform duration-300 md:static md:w-auto md:bg-transparent md:border-none md:p-0 md:shadow-none md:flex-row md:items-center md:gap-6 md:ml-6 ${
          mobileMenuOpen ? 'translate-x-0' : 'translate-x-full md:translate-x-0'
        }`}
      >
        <div className="flex items-center justify-between pb-3 mb-2 border-b border-neutral-200 md:hidden">
          <div className="inline-flex items-center gap-2">
            <span className="rl-logo text-base">REDL<i>INE</i></span>
            <span className="rl-stripe"></span>
          </div>
          <button
            type="button"
            onClick={() => setMobileMenuOpen(false)}
            className="btn-ghost border-0 bg-transparent p-2"
            aria-label="Tutup menu"
          >
            <X className="w-5 h-5 text-neutral-800" />
          </button>
        </div>

        {navLinks.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setMobileMenuOpen(false)}
              className={`text-[13.5px] font-semibold tracking-wide py-3 md:py-0 border-b border-neutral-100 md:border-none transition-colors ${
                isActive
                  ? 'text-neutral-900 font-bold relative md:after:content-[""] md:after:absolute md:after:left-0 md:after:right-0 md:after:-bottom-1.5 md:after:h-0.5 md:after:bg-[#de1f26] md:after:-skew-x-[18deg]'
                  : 'text-neutral-500 hover:text-neutral-900'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
