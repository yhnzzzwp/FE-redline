import type { Metadata, Viewport } from 'next';
import './globals.css';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';

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
        <a href="#konten" className="rl-skip-link">Lewati ke konten utama</a>
        <Navbar />
        <main id="konten" className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
