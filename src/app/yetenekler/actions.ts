'use server';

import sql from '@/lib/db';

export async function fetchTalents() {
    try {
        const talents = await sql`
            SELECT id, full_name, title, location, skills, avatar_url, video_url, video_status 
            FROM profiles 
            WHERE role = 'freelancer' AND full_name IS NOT NULL
        `;
        return { data: talents, error: null };
    } catch (error: any) {
        return { data: [], error: error.message };
    }
}
