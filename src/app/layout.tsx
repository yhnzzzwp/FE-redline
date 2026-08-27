import type { Metadata, Viewport } from 'next';
import './globals.css';
import ScrollReveal from '@/components/ui/ScrollReveal';
import PublicShell from '@/components/ui/PublicShell';
import { ConnectionProvider } from '@/lib/connection';

export const metadata: Metadata = {
  title: 'Hardware & Servis Komputer · Redline Komputer',
  description: 'Hardware PC, laptop, dan servis komputer terpercaya di Salatiga.',
};

export const viewport: Viewport = {
  themeColor: '#0b0d11',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className="flex flex-col min-h-screen">
        <ConnectionProvider>
          <ScrollReveal />
          <PublicShell>{children}</PublicShell>
        </ConnectionProvider>
      </body>
    </html>
  );
}
