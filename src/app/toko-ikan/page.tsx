import Link from 'next/link';

export default function TokoIkanPage() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-16">
      <div className="max-w-md mx-auto space-y-4">
        <div className="rl-stripe-lg"></div>
        <h1 className="rl-page-title text-2xl md:text-3xl font-extrabold text-neutral-900">
          Toko Ikan Redline
        </h1>
        <p className="text-neutral-500 text-sm max-w-xs mx-auto leading-relaxed">
          Halaman ini sedang dalam pengembangan dan akan segera hadir.
        </p>
        <div className="pt-2">
          <Link href="/" className="btn-redline text-xs font-bold inline-flex">
            &larr; Kembali ke Beranda
          </Link>
        </div>
      </div>
    </div>
  );
}
