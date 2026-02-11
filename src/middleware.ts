import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { ADMIN_COOKIE_NAME, verifyAdminSessionCookie } from '@/lib/server/admin-session';

export async function middleware(request: NextRequest) {
    const isAdminPath = request.nextUrl.pathname.startsWith('/admin');
    const isInternalLogin = request.nextUrl.pathname === '/internal-admin-login';

    const sessionCookie = request.cookies.get(ADMIN_COOKIE_NAME)?.value;
    const session = await verifyAdminSessionCookie(sessionCookie);
    const isAdminLoggedIn = session.valid;

    if (isAdminPath && !isAdminLoggedIn) {
        const url = request.nextUrl.clone();
        url.pathname = '/internal-admin-login';
        return NextResponse.redirect(url);
    }

    if (isInternalLogin && isAdminLoggedIn) {
        const url = request.nextUrl.clone();
        url.pathname = '/admin/dashboard';
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/admin/:path*', '/internal-admin-login'],
};
