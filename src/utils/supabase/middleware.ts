import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    const currentPath = request.nextUrl.pathname;
    const protectedRoutes = ['/yeni-ilan', '/basvurular'];
    const isProtected = protectedRoutes.some(route =>
        currentPath === route || currentPath.startsWith(`${route}/`)
    );

    // Fast path: If it's a public route and there's no Supabase auth cookie, 
    // we can skip the expensive getUser() call.
    const hasAuthCookie = request.cookies.getAll().some(cookie => 
        cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')
    );

    if (!isProtected && !hasAuthCookie) {
        return supabaseResponse;
    }

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (!user && isProtected) {
        const url = request.nextUrl.clone()
        url.pathname = '/' // Redirect to home or a specific login page
        return NextResponse.redirect(url)
    }

    return supabaseResponse
}
