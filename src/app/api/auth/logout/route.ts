import { NextResponse } from 'next/server';
import { backendBaseUrl, SESSION_COOKIE, sessionToken, opsiCookieSesi } from '@/lib/server/backend';

export const dynamic = 'force-dynamic';

/** Cabut token di Laravel, lalu hapus cookie sesi. */
export async function POST() {
  const token = await sessionToken();

  if (token) {
    try {
      await fetch(`${backendBaseUrl()}/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
        redirect: 'manual',
      });
    } catch {
      // Backend tak terjangkau — pembersihan lokal tetap dilanjutkan.
    }
  }

  const res = NextResponse.json({ status: 'success' });
  res.cookies.set(SESSION_COOKIE, '', opsiCookieSesi(0));
  return res;
}
