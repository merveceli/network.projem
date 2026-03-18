import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import sql from '@/lib/db';

// This route is called after OAuth login to ensure profile exists
export async function GET(request: NextRequest) {
    const { origin } = new URL(request.url);
    const session = await auth();

    if (!session?.user?.id) {
        return NextResponse.redirect(`${origin}/login`);
    }

    // Check if profile exists and has a role
    const profile = await sql`
        SELECT role FROM profiles WHERE id = ${session.user.id}
    `;

    if (!profile || profile.length === 0 || !profile[0].role) {
        // No profile yet — upsert basic profile and redirect to setup
        await sql`
            INSERT INTO profiles (id, full_name, email, avatar_url, updated_at)
            VALUES (
                ${session.user.id},
                ${session.user.name || null},
                ${session.user.email || null},
                ${session.user.image || null},
                NOW()
            )
            ON CONFLICT (id) DO UPDATE SET
                full_name = COALESCE(profiles.full_name, EXCLUDED.full_name),
                email = COALESCE(profiles.email, EXCLUDED.email),
                avatar_url = COALESCE(profiles.avatar_url, EXCLUDED.avatar_url),
                updated_at = NOW()
        `;
        return NextResponse.redirect(`${origin}/profil`);
    }

    const role = profile[0].role as string;
    if (role === 'freelancer') return NextResponse.redirect(`${origin}/profil/freelancer`);
    if (role === 'employer') return NextResponse.redirect(`${origin}/profil/employer`);

    return NextResponse.redirect(origin);
}
