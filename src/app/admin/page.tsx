'use client';

import Link from 'next/link';

export default function AdminDashboard() {
  const currentDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  const features = [
    { name: 'Manajemen Katalog', href: '#' },
    { name: 'Manajemen Servis', href: '#' },
    { name: 'Laporan Penjualan (POS)', href: '#' },
    { name: 'Manajemen Promo', href: '#' }
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-zinc-100 mb-2">Selamat Datang di Dashboard Admin</h1>
        <p className="text-zinc-400">{currentDate}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {features.map((feature, idx) => (
          <Link key={idx} href={feature.href} className="block">
            <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6 hover:border-rose-500/50 hover:bg-zinc-800/50 transition-all group">
              <h3 className="text-lg font-medium text-zinc-200 group-hover:text-rose-400">
                {feature.name}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
