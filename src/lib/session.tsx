'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { useRouter } from 'next/navigation';

/**
 * Sesi pengguna yang berlaku, diambil dari backend.
 *
 * Sebelumnya peran (Owner / Karyawan) yang dikembalikan saat login langsung
 * dibuang: tidak pernah disimpan, tidak pernah diperiksa. Akibatnya perbedaan
 * Owner dan Karyawan murni kosmetik di antarmuka, dan nama pengguna di topbar
 * bahkan ter-hardcode.
 *
 * Sumber kebenarannya tetap server: peran dibaca dari /auth/me lewat proksi
 * BFF pada setiap pemuatan, bukan dari nilai apa pun yang bisa disunting
 * pengguna di cookie atau localStorage. Pemeriksaan di sini hanya mengatur
 * TAMPILAN — Laravel tetap yang menolak permintaan yang tidak berhak.
 */
export interface SessionUser {
  id: number;
  nama_pegawai: string;
  username: string;
  email: string;
  role: string;
  is_owner: boolean;
}

interface SessionState {
  user: SessionUser | null;
  loading: boolean;
  isOwner: boolean;
}

const SessionContext = createContext<SessionState>({
  user: null,
  loading: true,
  isOwner: false,
});

export function useSession(): SessionState {
  return useContext(SessionContext);
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    let dibatalkan = false;

    (async () => {
      try {
        const res = await fetch('/api/backend/auth/me', {
          credentials: 'same-origin',
          cache: 'no-store',
        });

        if (res.status === 401) {
          if (!dibatalkan) {
            setUser(null);
            setLoading(false);
          }
          router.replace('/admin/login');
          return;
        }

        const json = await res.json().catch(() => null);

        if (!dibatalkan) {
          setUser(json?.status === 'success' ? (json.data as SessionUser) : null);
          setLoading(false);
        }
      } catch {
        if (!dibatalkan) setLoading(false);
      }
    })();

    return () => {
      dibatalkan = true;
    };
  }, [router]);

  return (
    <SessionContext.Provider value={{ user, loading, isOwner: user?.is_owner === true }}>
      {children}
    </SessionContext.Provider>
  );
}

/** Inisial untuk avatar, mis. "Budi Santoso" -> "BS". */
export function inisial(nama?: string | null): string {
  if (!nama) return '--';
  const bagian = nama.trim().split(/\s+/);
  const a = bagian[0]?.[0] ?? '';
  const b = bagian.length > 1 ? bagian[bagian.length - 1][0] : '';
  return (a + b).toUpperCase() || '--';
}

/** Pembungkus halaman yang hanya boleh dibuka Owner. */
export function OwnerOnly({ children }: { children: ReactNode }) {
  const { loading, isOwner } = useSession();

  if (loading) {
    return (
      <div className="p-8 text-sm text-neutral-500">Memeriksa hak akses…</div>
    );
  }

  if (!isOwner) {
    return (
      <div className="p-8">
        <div className="max-w-md rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="font-bold text-sm text-amber-900 mb-1">Akses terbatas</h2>
          <p className="text-xs text-amber-800 mb-0">
            Halaman ini hanya untuk Owner. Hubungi pemilik toko bila Anda merasa
            seharusnya punya akses.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
