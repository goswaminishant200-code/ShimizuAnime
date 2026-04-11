import { NextResponse } from 'next/server'

export async function middleware(req) {
  const path = req.nextUrl.pathname

  // Protected routes check
  const needsLogin = ['/profile', '/admin', '/watch'].some(r => path.startsWith(r))

  // Supabase session cookie check
  const token = req.cookies.get('sb-access-token')?.value ||
    req.cookies.get(`sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('//')[1]?.split('.')[0]}-auth-token`)?.value

  if (needsLogin && !token) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/profile/:path*', '/admin/:path*', '/watch/:path*'],
}
