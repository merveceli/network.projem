'use server';

import sql from '@/lib/db';
import { auth } from '@/auth';

export async function getConversations() {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { success: false, data: [] };

    try {
        const conversations = await sql`
            SELECT 
                c.id, 
                c.last_message_at, 
                c.participant_1, 
                c.participant_2,
                p.full_name as other_name,
                p.avatar_url as other_avatar
            FROM conversations c
            JOIN profiles p ON p.id = CASE 
                WHEN c.participant_1 = ${userId} THEN c.participant_2 
                ELSE c.participant_1 
            END
            WHERE c.participant_1 = ${userId} OR c.participant_2 = ${userId}
            ORDER BY c.last_message_at DESC
        `;
        
        const formatted = conversations.map((c: any) => ({
            id: c.id,
            last_message_at: c.last_message_at,
            participant_1: c.participant_1,
            participant_2: c.participant_2,
            profiles: {
                full_name: c.other_name,
                avatar_url: c.other_avatar
            }
        }));

        return { success: true, data: formatted };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function searchUsers(searchTerm: string) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { success: false, data: [] };

    try {
        const users = await sql`
            SELECT id, full_name, avatar_url 
            FROM profiles
            WHERE id != ${userId} AND full_name ILIKE ${'%' + searchTerm + '%'}
            LIMIT 10
        `;
        return { success: true, data: users };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function getChatDetails(conversationId: string) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { success: false };

    try {
        const conv = await sql`SELECT * FROM conversations WHERE id = ${conversationId}`;
        if (conv.length === 0) return { success: false, error: 'Conversation not found' };

        const currentConv = conv[0];
        const otherUserId = currentConv.participant_1 === userId ? currentConv.participant_2 : currentConv.participant_1;

        const profile = await sql`SELECT id, full_name, title, avatar_url, bio, location, role FROM profiles WHERE id = ${otherUserId}`;
        
        const blocks = await sql`
            SELECT blocker_id, blocked_id FROM user_blocks 
            WHERE (blocker_id = ${userId} AND blocked_id = ${otherUserId})
               OR (blocker_id = ${otherUserId} AND blocked_id = ${userId})
        `;

        let isBlocked = false;
        let hasBlocked = false;
        blocks.forEach((b: any) => {
            if (b.blocker_id === userId) hasBlocked = true;
            if (b.blocker_id === otherUserId) isBlocked = true;
        });

        const messages = await sql`
            SELECT * FROM messages 
            WHERE conversation_id = ${conversationId}
            ORDER BY created_at ASC
        `;

        return {
            success: true,
            data: {
                messages,
                profile: profile[0] || { id: otherUserId, full_name: 'Bilinmeyen Kullanıcı' },
                isBlocked,
                hasBlocked
            }
        };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function sendMessage(conversationId: string, content: string) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { success: false };

    try {
        const msg = await sql`
            INSERT INTO messages (conversation_id, sender_id, content) 
            VALUES (${conversationId}, ${userId}, ${content})
            RETURNING *
        `;
        
        // Update last message time
        await sql`
            UPDATE conversations 
            SET last_message_at = NOW() 
            WHERE id = ${conversationId}
        `;
        
        return { success: true, data: msg[0] };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function createOrGetConversation(otherUserId: string) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { success: false };

    const p1 = userId < otherUserId ? userId : otherUserId;
    const p2 = userId < otherUserId ? otherUserId : userId;

    try {
        const existing = await sql`SELECT id FROM conversations WHERE participant_1 = ${p1} AND participant_2 = ${p2}`;
        if (existing.length > 0) return { success: true, conversationId: existing[0].id };

        const newConv = await sql`
            INSERT INTO conversations (participant_1, participant_2)
            VALUES (${p1}, ${p2})
            RETURNING id
        `;
        return { success: true, conversationId: newConv[0].id };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}

export async function toggleBlockStatus(otherUserId: string, currentlyBlocked: boolean) {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { success: false };

    try {
        if (currentlyBlocked) {
            await sql`DELETE FROM user_blocks WHERE blocker_id = ${userId} AND blocked_id = ${otherUserId}`;
        } else {
            await sql`INSERT INTO user_blocks (blocker_id, blocked_id) VALUES (${userId}, ${otherUserId})`;
        }
        return { success: true };
    } catch (e: any) {
        return { success: false, error: e.message };
    }
}
