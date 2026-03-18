import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { auth } from '@/auth';

export async function middleware(request: NextRequest) {
    const session = await auth();

    const currentPath = request.nextUrl.pathname;
    const protectedRoutes = ['/yeni-ilan', '/basvurular', '/mesajlar', '/bildirimler', '/profil'];
    const isProtected = protectedRoutes.some(route =>
        currentPath === route || currentPath.startsWith(`${route}/`)
    );

    if (isProtected && !session?.user) {
        const url = request.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|_vercel|api/auth|.*\\.(?:svg|png|jpg|jpeg|gif|webp|css|js|woff|woff2|json|txt|xml|ico)$).*)',
    ],
};
