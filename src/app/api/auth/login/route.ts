import { NextResponse } from 'next/server';
import { backendBaseUrl, SESSION_COOKIE, opsiCookieSesi } from '@/lib/server/backend';

export const dynamic = 'force-dynamic';

/**
 * Login lewat BFF.
 *
 * Browser mengirim kredensial ke rute same-origin ini; Next.js meneruskannya
 * ke Laravel, lalu menyimpan token SEBAGAI COOKIE HttpOnly. Token tidak
 * pernah dikembalikan ke JavaScript, sehingga XSS sekalipun tidak bisa
 * membacanya — inti dari pola ini.
 */
export async function POST(request: Request) {
  let body: { username?: string; password?: string; portal?: string; remember?: boolean };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { status: 'error', message: 'Permintaan tidak valid.' },
      { status: 400 }
    );
  }

  const { username, password, portal, remember } = body;

  if (!username || !password) {
    return NextResponse.json(
      { status: 'error', message: 'Username dan password wajib diisi.' },
      { status: 422 }
    );
  }

  let upstream: Response;
  try {
    upstream = await fetch(`${backendBaseUrl()}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, portal }),
      cache: 'no-store',
      redirect: 'manual',
    });
  } catch {
    return NextResponse.json(
      { status: 'error', message: 'Tidak dapat terhubung ke server Redline.' },
      { status: 502 }
    );
  }

  const json = await upstream.json().catch(() => null);

  if (upstream.status === 429) {
    return NextResponse.json(
      { status: 'error', message: 'Terlalu banyak percobaan masuk. Tunggu satu menit lalu coba lagi.' },
      { status: 429 }
    );
  }

  if (!upstream.ok || json?.status !== 'success' || !json?.data?.token) {
    return NextResponse.json(
      { status: 'error', message: json?.message || 'Username atau password salah.' },
      { status: upstream.status === 403 ? 403 : 401 }
    );
  }

  // Hanya data pengguna yang keluar. Token berhenti di sini.
  const res = NextResponse.json({
    status: 'success',
    data: { user: json.data.user ?? null },
  });

  res.cookies.set(
    SESSION_COOKIE,
    json.data.token as string,
    opsiCookieSesi(remember ? 60 * 60 * 24 * 30 : 60 * 60 * 24)
  );

  return res;
}
