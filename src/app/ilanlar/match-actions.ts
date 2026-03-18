'use server';

import sql from '@/lib/db';
import { auth } from '@/auth';

export async function getSmartJobMatches() {
    const session = await auth();
    if (!session?.user?.id) return { data: [], error: 'Oturum açılmadı' };

    try {
        // 1. Get User Profile for Skills & Title
        const profile = await sql`
            SELECT skills, title, full_name FROM profiles WHERE id = ${session.user.id}
        `;

        if (profile.length === 0) return { data: [], error: 'Profil bulunamadı' };

        const userSkills = profile[0].skills || [];
        const userTitle = profile[0].title || '';
        const searchTerms = [userTitle, ...userSkills].filter(Boolean);

        let jobs = [];

        if (searchTerms.length > 0) {
            // Search jobs by matching title or category with any of the user's skills/title
            // Using a simple pattern match for each term
            const conditions = searchTerms.map(term => `%${term}%`);
            
            // Neon SQL (pg) specific query for matching across array
            // This is a bit simplified, but effective for high-level matching
            jobs = await sql`
                SELECT j.id, j.title, j.category, j.created_at, p.full_name as employer_name
                FROM jobs j
                LEFT JOIN profiles p ON j.creator_id = p.id
                WHERE j.status = 'approved' AND (
                    j.title ILIKE ANY(${conditions}) OR 
                    j.category ILIKE ANY(${conditions})
                )
                ORDER BY j.created_at DESC
                LIMIT 4
            `;
        }

        // Fallback: If no match, show latest approved jobs
        if (jobs.length === 0) {
            jobs = await sql`
                SELECT j.id, j.title, j.category, j.created_at, p.full_name as employer_name
                FROM jobs j
                LEFT JOIN profiles p ON j.creator_id = p.id
                WHERE j.status = 'approved'
                ORDER BY j.created_at DESC
                LIMIT 4
            `;
        }

        return { data: jobs, fullName: profile[0].full_name, error: null };
    } catch (e: any) {
        console.error("getSmartJobMatches error:", e);
        return { data: [], error: e.message };
    }
}
