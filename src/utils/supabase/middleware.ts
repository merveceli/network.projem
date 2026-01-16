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
                    cookiesToSet.forEach(({ name, value, options }) =>
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

    // IMPORTANT: Avoid writing any logic between createServerClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    const {
        data: { user },
    } = await supabase.auth.getUser()

    if (
        !user &&
        !request.nextUrl.pathname.startsWith('/login') &&
        !request.nextUrl.pathname.startsWith('/auth') &&
        // Allow public access to home page and general listings
        request.nextUrl.pathname !== '/' &&
        !request.nextUrl.pathname.startsWith('/ilan') && // Assuming /ilan can be viewed publicly
        !request.nextUrl.pathname.startsWith('/profil/') // Assuming viewing public profiles is allowed
    ) {
        // Protect private routes
        // If the user tries to access a protected route (like editing their profile or posting a job), redirect them

        const protectedRoutes = ['/yeni-ilan', '/basvurular'];
        const currentPath = request.nextUrl.pathname;

        // Check if current path starts with any of the protected routes
        // We do exact match or startsWith for sub-routes
        const isProtected = protectedRoutes.some(route =>
            currentPath === route || currentPath.startsWith(`${route}/`)
        );

        if (isProtected) {
            const url = request.nextUrl.clone()
            url.pathname = '/' // Redirect to home or a specific login page
            return NextResponse.redirect(url)
        }
    }

    return supabaseResponse
}
