import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Rate limiting comment: 
// In a production environment, rate limiting should ideally be handled at the reverse proxy level 
// (e.g., Nginx, Cloudflare, AWS WAF) or using an API gateway to prevent excessive requests, 
// rather than handling it completely within Next.js middleware which runs on the Edge/Serverless functions.

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const { pathname } = request.nextUrl

  // 1. Security Headers
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  if (process.env.NODE_ENV === 'production') {
    response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  }

  // 2. Admin Route Protection
  if (pathname.startsWith('/admin') && !pathname.startsWith('/admin/login')) {
    const token = request.cookies.get('admin-token')?.value
    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }

  return response
}

export const config = { 
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api).*)'] 
}
