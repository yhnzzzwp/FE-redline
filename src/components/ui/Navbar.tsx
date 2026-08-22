'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { label: 'Beranda', href: '/' },
    { label: 'Lacak Servis', href: '/cek-servis' },
    { label: 'Tentang Kami', href: '/about' },
  ];

  return (
    <nav className="rl-pubnav flex items-center justify-between gap-4" role="navigation">
      <Link href="/" className="inline-flex items-center gap-2 no-underline shrink-0">
        <span className="rl-logo text-xl">REDL<i>INE</i></span>
        <span className="rl-stripe"></span>
      </Link>

      <div className="flex items-center gap-4 sm:gap-6 shrink-0">
        {navLinks.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`text-[13px] sm:text-[13.5px] font-semibold tracking-wide transition-colors whitespace-nowrap ${
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
    </nav>
  );
}
