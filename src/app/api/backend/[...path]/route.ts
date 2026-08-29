import { NextResponse } from 'next/server';
import { backendBaseUrl, sessionToken, SESSION_COOKIE, headerAman, opsiCookieSesi } from '@/lib/server/backend';

export const dynamic = 'force-dynamic';

const METODE_DIIZINKAN = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
const TANPA_BODY = new Set(['GET', 'DELETE']);

/** Segmen path yang aman: tanpa traversal, tanpa karakter kendali atau garis miring. */
function segmenValid(segmen: string): boolean {
  if (segmen === '' || segmen === '.' || segmen === '..') return false;
  return /^[A-Za-z0-9._~-]+$/.test(segmen);
}

/**
 * Proksi terautentikasi menuju Laravel.
 *
 * Browser memanggil /api/backend/<rute>; handler ini melampirkan Bearer token
 * dari cookie HttpOnly lalu meneruskannya. Konsekuensinya:
 *  - JavaScript tidak pernah memegang token (kebal pencurian lewat XSS);
 *  - alamat dan skema rute backend tidak terpapar ke browser;
 *  - seluruh panggilan menjadi same-origin, sehingga CORS tidak lagi
 *    dibutuhkan dan connect-src pada CSP cukup 'self'.
 */
async function teruskan(
  request: Request,
  ctx: { params: Promise<{ path: string[] }> }
): Promise<NextResponse> {
  if (!METODE_DIIZINKAN.has(request.method)) {
    return NextResponse.json(
      { status: 'error', message: 'Metode tidak didukung.' },
      { status: 405 }
    );
  }

  const { path } = await ctx.params;

  // Tanpa penyaringan ini, segmen seperti '..' bisa dipakai keluar dari
  // prefix API dan menjadikan proksi ini alat SSRF ke jaringan internal.
  if (!Array.isArray(path) || path.length === 0 || !path.every(segmenValid)) {
    return NextResponse.json(
      { status: 'error', message: 'Rute tidak valid.' },
      { status: 400 }
    );
  }

  const url = new URL(request.url);
  const target = `${backendBaseUrl()}/${path.join('/')}${url.search}`;

  const headers = headerAman(request.headers);
  const token = await sessionToken();
  if (token) headers.set('Authorization', `Bearer ${token}`);

  let upstream: Response;
  try {
    upstream = await fetch(target, {
      method: request.method,
      headers,
      body: TANPA_BODY.has(request.method) ? undefined : await request.text(),
      cache: 'no-store',
      // Jangan ikuti pengalihan: pengalihan dari backend tidak boleh
      // dipakai untuk menyeret proksi ini ke host lain.
      redirect: 'manual',
    });
  } catch {
    return NextResponse.json(
      { status: 'error', message: 'Backend tidak dapat dihubungi.' },
      { status: 502 }
    );
  }

  const teks = await upstream.text();

  const res = new NextResponse(teks, {
    status: upstream.status,
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? 'application/json',
    },
  });

  // Backend menolak token -> buang sesi lokal, supaya antarmuka tidak terus
  // menampilkan layar terproteksi dengan kredensial yang sudah mati.
  if (upstream.status === 401) {
    res.cookies.set(SESSION_COOKIE, '', opsiCookieSesi(0));
  }

  return res;
}

export const GET = teruskan;
export const POST = teruskan;
export const PUT = teruskan;
export const PATCH = teruskan;
export const DELETE = teruskan;
