import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * Proxy (dulu bernama Middleware — diganti nama di Next.js 16).
 *
 * Dua tugas:
 *  1. Memasang security header, termasuk Content-Security-Policy.
 *  2. Penjagaan OPTIMISTIS untuk rute terproteksi.
 *
 * Catatan penting soal (2): dokumentasi Next.js menegaskan proxy TIDAK boleh
 * dijadikan solusi otorisasi yang sesungguhnya — ia hanya menyaring lebih awal
 * supaya pengunjung tanpa sesi tidak melihat layar internal. Otorisasi yang
 * sebenarnya HARUS dilakukan server: backend Laravel memvalidasi Bearer token
 * pada setiap permintaan /api/v1 yang terproteksi. Cookie di sini sengaja
 * hanya dicek keberadaannya, karena memanggil database/API dari proxy dijalankan
 * pada setiap navigasi (termasuk prefetch) dan itu yang dilarang dokumentasi.
 */

// Rute yang butuh sesi. '/pos' sebelumnya sama sekali tidak dijaga.
const PROTECTED_PREFIXES = ['/admin', '/pos']

// Halaman masuk harus tetap bisa diakses tanpa sesi.
const AUTH_PAGES = ['/admin/login', '/login']

function buildCsp(isDev: boolean): string {
  // Sejak seluruh panggilan browser melewati proksi BFF di /api/backend,
  // tidak ada lagi permintaan lintas origin dari halaman ini. connect-src
  // cukup 'self': alamat backend tidak perlu — dan tidak boleh — disebut di
  // dalam kebijakan yang terbaca publik.
  const connectSrc = "'self'"

  // script-src memakai 'unsafe-inline' karena seluruh halaman aplikasi ini
  // di-prerender statis (lihat output `next build`: hampir semua rute bertanda
  // ○ Static). CSP berbasis nonce menuntut dynamic rendering; memasang nonce
  // pada HTML statis justru mematikan script bootstrap Next dan membuat situs
  // blank. Untuk menaikkan ke nonce, halaman harus dipindah ke dynamic dulu.
  //
  // Yang tetap kita dapat dan bernilai nyata:
  //  - connect-src dikunci: token yang dicuri lewat XSS tidak bisa dikirim
  //    ke server penyerang.
  //  - form-action & base-uri dikunci: mencegah pembajakan form dan <base>.
  //  - frame-ancestors 'none': anti clickjacking.
  return [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' blob: data: https:",
    "font-src 'self' data:",
    `connect-src ${connectSrc}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    'upgrade-insecure-requests',
  ].join('; ')
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const isDev = process.env.NODE_ENV === 'development'

  const isAuthPage = AUTH_PAGES.includes(pathname)
  const isProtected =
    !isAuthPage &&
    PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))

  // Cookie HttpOnly tetap terbaca di sisi server seperti ini; yang tidak bisa
  // membacanya hanyalah JavaScript di browser. Pemeriksaan ini tetap bersifat
  // OPTIMISTIS — otorisasi sesungguhnya dilakukan Laravel atas Bearer token.
  if (isProtected && !request.cookies.get('redline_session')?.value) {
    // Tujuan redirect ditentukan di server, tidak diambil dari query pengguna,
    // supaya tidak membuka celah open redirect.
    const target = pathname.startsWith('/admin') ? '/admin/login' : '/login'
    return NextResponse.redirect(new URL(target, request.url))
  }

  const response = NextResponse.next()

  response.headers.set('Content-Security-Policy', buildCsp(isDev))
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  response.headers.set('Cross-Origin-Resource-Policy', 'same-origin')

  // X-XSS-Protection: filter XSS bawaan browser lama sudah usang dan pernah
  // menjadi sumber kerentanan sendiri. Nilai yang benar sekarang adalah '0'.
  response.headers.set('X-XSS-Protection', '0')

  if (!isDev) {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=63072000; includeSubDomains; preload'
    )
  }

  // Halaman internal tidak boleh diindeks mesin pencari.
  if (PROTECTED_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    response.headers.set('X-Robots-Tag', 'noindex, nofollow, noarchive')
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
