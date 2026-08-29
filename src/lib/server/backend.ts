import { cookies } from 'next/headers';

/**
 * Lapisan server BFF (Backend-for-Frontend).
 *
 * Berkas ini HANYA boleh diimpor kode sisi server (Route Handler / Server
 * Component). Ia tidak pernah ikut ke bundle browser.
 */

/** Nama cookie sesi. HttpOnly — tidak akan pernah terbaca JavaScript. */
export const SESSION_COOKIE = 'redline_session';

/**
 * Alamat backend Laravel.
 *
 * SENGAJA tanpa awalan NEXT_PUBLIC_. Variabel tanpa awalan itu tidak
 * di-inline Next.js ke bundle klien, sehingga alamat backend beserta skema
 * rutenya tidak pernah terlihat oleh pengunjung — memangkas permukaan
 * pemetaan endpoint bagi penyerang.
 */
export function backendBaseUrl(): string {
  return process.env.API_BASE_URL || 'http://localhost:8080/api/v1';
}

/** Ambil token dari cookie HttpOnly. Hanya bisa dipanggil di server. */
export async function sessionToken(): Promise<string | null> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value ?? null;
}

/**
 * Daftar putih header yang boleh diteruskan ke backend.
 *
 * Header dari klien TIDAK diteruskan begitu saja: Authorization, Cookie, dan
 * Host yang dikirim browser sengaja dibuang supaya klien tidak bisa
 * menyuntikkan kredensial atau memalsukan Host ke backend lewat proksi ini.
 */
const HEADER_DITERUSKAN = ['content-type', 'accept'];

export function headerAman(masuk: Headers): Headers {
  const keluar = new Headers();
  for (const nama of HEADER_DITERUSKAN) {
    const nilai = masuk.get(nama);
    if (nilai) keluar.set(nama, nilai);
  }
  return keluar;
}

export function opsiCookieSesi(maxAgeDetik: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path: '/',
    maxAge: maxAgeDetik,
  };
}
