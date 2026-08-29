'use client';

import { usePathname } from 'next/navigation';
import DataOfflineBanner from '@/components/ui/DataOfflineBanner';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';

const HIDDEN_SHELL_ROUTES = ['/admin', '/login', '/pos'];

export default function PublicShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const hideShell = HIDDEN_SHELL_ROUTES.some((route) => pathname.startsWith(route));

  if (hideShell) {
    return <>{children}</>;
  }

  return (
    <>
      <a href="#konten" className="rl-skip-link">Lewati ke konten utama</a>
      <Navbar />
      <DataOfflineBanner />
      <main id="konten" className="flex-1">
        {children}
      </main>
      <Footer />
    </>
  );
}
