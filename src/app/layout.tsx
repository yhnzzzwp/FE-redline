import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/ui/Navbar';
import Footer from '@/components/ui/Footer';
import ClientProviders from '@/components/ClientProviders';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Redline Komputer | Hardware & Professional Service',
  description: 'Katalog hardware komputer premium, rakit PC custom, dan servis laptop profesional bergaransi.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <body className={`${inter.className} min-h-screen flex flex-col justify-between antialiased selection:bg-rose-600 selection:text-white`}>
        <ClientProviders>
          <Navbar />
          <main className="flex-grow">{children}</main>
          <Footer />
        </ClientProviders>
      </body>
    </html>
  );
}
