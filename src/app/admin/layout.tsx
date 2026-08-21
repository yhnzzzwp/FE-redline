'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const handleLogout = () => {
    document.cookie = 'admin-token=; path=/; max-age=0';
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans">
      <header className="bg-zinc-900 border-b border-zinc-800 p-4 flex justify-between items-center">
        <div className="text-rose-500 font-bold text-xl tracking-tight">
          <Link href="/admin">REDLINE Admin</Link>
        </div>
        <button 
          onClick={handleLogout}
          className="text-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2 rounded-md transition-colors"
        >
          Logout
        </button>
      </header>
      <main className="flex-grow">
        {children}
      </main>
    </div>
  );
}
