import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const isAdminPath = request.nextUrl.pathname.startsWith('/admin');
    const isInternalLogin = request.nextUrl.pathname === '/internal-admin-login';

    // Check for admin session cookie
    const isAdminLoggedIn = request.cookies.has('founderflow_admin_session');

    // Protect Admin Routes
    if (isAdminPath) {
        if (!isAdminLoggedIn) {
            const url = request.nextUrl.clone();
            url.pathname = '/internal-admin-login';
            return NextResponse.redirect(url);
        }
    }

    // Redirect Logged-in Admins away from Login Page
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
