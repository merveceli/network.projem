'use server';

import sql from '@/lib/db';
import { auth } from '@/auth';

export async function getConversationDetails(conversationId: string) {
    const session = await auth();
    if (!session?.user?.id) return null;

    try {
        const convs = await sql`
            SELECT * FROM conversations WHERE id = ${conversationId}
            LIMIT 1
        `;
        if (convs.length === 0) return null;

        const conv = convs[0];
        const otherUserId = conv.participant_1 === session.user.id ? conv.participant_2 : conv.participant_1;

        const profiles = await sql`
            SELECT id, full_name, avatar_url, role, bio FROM profiles WHERE id = ${otherUserId}
            LIMIT 1
        `;

        return {
            conversation: conv,
            otherUser: profiles.length > 0 ? profiles[0] : null
        };
    } catch (e) {
        return null;
    }
}

export async function toggleBlockAction(otherUserId: string, currentlyBlocked: boolean) {
    const session = await auth();
    if (!session?.user?.id) return { success: false };

    try {
        if (currentlyBlocked) {
            await sql`
                DELETE FROM blocked_users 
                WHERE blocker_id = ${session.user.id} AND blocked_id = ${otherUserId}
            `;
        } else {
            await sql`
                INSERT INTO blocked_users (blocker_id, blocked_id)
                VALUES (${session.user.id}, ${otherUserId})
                ON CONFLICT DO NOTHING
            `;
        }
        return { success: true };
    } catch (e) {
        return { success: false };
    }
}
