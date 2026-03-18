'use server';

import sql from '@/lib/db';
import { auth } from '@/auth';

export async function fetchProfileComments(profileId: string) {
    try {
        const comments = await sql`
            SELECT pc.id, pc.author_id, pc.content, pc.created_at, p.full_name as author_name
            FROM profile_comments pc
            JOIN profiles p ON pc.author_id = p.id
            WHERE pc.profile_id = ${profileId} AND pc.status = 'approved'
            ORDER BY pc.created_at DESC
        `;
        return { data: comments, error: null };
    } catch (error: any) {
        return { data: [], error: error.message };
    }
}

export async function submitProfileComment(profileId: string, content: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Oturum açılmadı' };

    try {
        await sql`
            INSERT INTO profile_comments (profile_id, author_id, content, status)
            VALUES (${profileId}, ${session.user.id}, ${content}, 'pending')
        `;
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
