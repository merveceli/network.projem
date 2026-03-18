'use server';

import sql from '@/lib/db';
import { auth } from '@/auth';

export async function getMyReceivedApplications() {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) return { error: 'Unauthorized', data: null };

    try {
        // Query applications for jobs created by the current user
        const applications = await sql`
            SELECT 
                a.id,
                a.message,
                a.created_at,
                a.job_id,
                a.applicant_id,
                j.title as job_title,
                j.creator_id as job_creator_id,
                p.full_name as applicant_name,
                p.bio as applicant_bio,
                p.avatar_url as applicant_avatar
            FROM applications a
            INNER JOIN jobs j ON a.job_id = j.id
            LEFT JOIN profiles p ON a.applicant_id = p.id
            WHERE j.creator_id = ${userId}
            ORDER BY a.created_at DESC
        `;

        // Format to match expected frontend structure
        const formatted = applications.map((app: any) => ({
            id: app.id,
            message: app.message,
            created_at: app.created_at,
            job_id: app.job_id,
            applicant_id: app.applicant_id,
            jobs: {
                title: app.job_title,
                creator_id: app.job_creator_id
            },
            applicant: {
                full_name: app.applicant_name,
                bio: app.applicant_bio,
                avatar_url: app.applicant_avatar
            }
        }));

        return { error: null, data: formatted };
    } catch (e: any) {
        console.error('Başvurular alınamadı:', e);
        return { error: e.message, data: null };
    }
}

export async function createConversationAction(targetId: string) {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) return { error: 'Unauthorized', conversationId: null };
    if (userId === targetId) return { error: 'Kendinizle mesajlaşamazsınız', conversationId: null };

    // Arrange participants so participant_1 is always the smaller UUID to prevent duplicates
    const p1 = userId < targetId ? userId : targetId;
    const p2 = userId < targetId ? targetId : userId;

    try {
        // Check block status
        const isBlocked = await sql`
            SELECT 1 FROM user_blocks 
            WHERE (blocker_id = ${p1} AND blocked_id = ${p2})
               OR (blocker_id = ${p2} AND blocked_id = ${p1})
        `;

        if (isBlocked.length > 0) {
            return { error: 'Bu kullanıcı engelli olduğu için mesaj gönderemezsiniz.', conversationId: null };
        }

        // Find existing
        const existing = await sql`
            SELECT id FROM conversations
            WHERE participant_1 = ${p1} AND participant_2 = ${p2}
        `;

        if (existing.length > 0) {
            return { error: null, conversationId: existing[0].id };
        }

        // Create new
        const newConv = await sql`
            INSERT INTO conversations (participant_1, participant_2)
            VALUES (${p1}, ${p2})
            RETURNING id
        `;

        return { error: null, conversationId: newConv[0].id };
    } catch (e: any) {
        console.error('Mesajlaşma hatası:', e);
        return { error: e.message, conversationId: null };
    }
}
