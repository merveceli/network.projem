import sql from './db';

export interface Conversation {
    id: string;
    participant_1: string;
    participant_2: string;
    last_message_at: string;
    created_at: string;
}

export interface Message {
    id: string;
    conversation_id: string;
    sender_id: string;
    content: string;
    read: boolean;
    created_at: string;
}

export interface ConversationWithProfile extends Conversation {
    other_user: {
        id: string;
        full_name: string | null;
        avatar_url: string | null;
    } | null;
    last_message: {
        content: string;
        sender_id: string;
    } | null;
    unread_count: number;
}

/**
 * Gets or creates a conversation between two users
 */
export async function getOrCreateConversation(
    userId1: string,
    userId2: string
): Promise<Conversation | null> {
    if (!userId1 || !userId2 || userId1 === userId2) return null;

    // Check if either user has blocked the other
    const blocks = await sql`
        SELECT * FROM user_blocks 
        WHERE (blocker_id = ${userId1} AND blocked_id = ${userId2})
           OR (blocker_id = ${userId2} AND blocked_id = ${userId1})
        LIMIT 1
    `;

    if (blocks.length > 0) return null;

    // First, try to find existing conversation
    const existing = await sql`
        SELECT * FROM conversations 
        WHERE (participant_1 = ${userId1} AND participant_2 = ${userId2})
           OR (participant_1 = ${userId2} AND participant_2 = ${userId1})
        LIMIT 1
    `;

    if (existing.length > 0) return existing[0] as unknown as Conversation;

    // Create new
    try {
        const data = await sql`
            INSERT INTO conversations (participant_1, participant_2)
            VALUES (${userId1}, ${userId2})
            RETURNING *
        `;
        return data[0] as unknown as Conversation;
    } catch (e) {
        // Handle race condition
        const retry = await sql`
            SELECT * FROM conversations 
            WHERE (participant_1 = ${userId1} AND participant_2 = ${userId2})
               OR (participant_1 = ${userId2} AND participant_2 = ${userId1})
            LIMIT 1
        `;
        return retry[0] as unknown as Conversation || null;
    }
}

/**
 * Gets all conversations for a user with profile info
 */
export async function getUserConversations(
    userId: string
): Promise<ConversationWithProfile[]> {
    const conversations = await sql`
        SELECT * FROM conversations 
        WHERE participant_1 = ${userId} OR participant_2 = ${userId}
        ORDER BY last_message_at DESC
    `;

    const enriched = await Promise.all(
        conversations.map(async (conv) => {
            const otherUserId = conv.participant_1 === userId ? conv.participant_2 : conv.participant_1;

            const profile = await sql`
                SELECT id, full_name, avatar_url FROM profiles WHERE id = ${otherUserId} LIMIT 1
            `;

            const lastMessage = await sql`
                SELECT content, sender_id FROM messages 
                WHERE conversation_id = ${conv.id} 
                ORDER BY created_at DESC LIMIT 1
            `;

            const unreadCount = await sql`
                SELECT count(*) FROM messages 
                WHERE conversation_id = ${conv.id} AND read = false AND sender_id != ${userId}
            `;

            return {
                ...conv,
                other_user: profile[0] || null,
                last_message: lastMessage[0] || null,
                unread_count: parseInt(unreadCount[0].count) || 0,
            } as unknown as ConversationWithProfile;
        })
    );

    return enriched;
}

/**
 * Gets messages for a conversation
 */
export async function getMessages(
    conversationId: string,
    limit: number = 50
): Promise<Message[]> {
    const data = await sql`
        SELECT * FROM messages 
        WHERE conversation_id = ${conversationId} 
        ORDER BY created_at ASC 
        LIMIT ${limit}
    `;
    return data as unknown as Message[];
}

/**
 * Sends a message in a conversation
 */
export async function sendMessage(
    conversationId: string,
    senderId: string,
    content: string
): Promise<Message | null> {
    const data = await sql`
        INSERT INTO messages (conversation_id, sender_id, content)
        VALUES (${conversationId}, ${senderId}, ${content})
        RETURNING *
    `;
    return data[0] as unknown as Message;
}

/**
 * Marks messages as read in a conversation
 */
export async function markMessagesAsRead(
    conversationId: string,
    userId: string
) {
    await sql`
        UPDATE messages SET read = true 
        WHERE conversation_id = ${conversationId} AND read = false AND sender_id != ${userId}
    `;
    return true;
}

/**
 * Gets total unread message count for a user
 */
export async function getTotalUnreadMessages(userId: string): Promise<number> {
    const count = await sql`
        SELECT count(*) FROM messages m
        JOIN conversations c ON m.conversation_id = c.id
        WHERE (c.participant_1 = ${userId} OR c.participant_2 = ${userId})
          AND m.read = false AND m.sender_id != ${userId}
    `;
    return parseInt(count[0].count) || 0;
}

/**
 * Blocks a user
 */
export async function blockUser(blockerId: string, blockedId: string) {
    try {
        await sql`
            INSERT INTO user_blocks (blocker_id, blocked_id) VALUES (${blockerId}, ${blockedId})
        `;
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Unblocks a user
 */
export async function unblockUser(blockerId: string, blockedId: string) {
    await sql`
        DELETE FROM user_blocks WHERE blocker_id = ${blockerId} AND blocked_id = ${blockedId}
    `;
    return true;
}

/**
 * Checks if a user is blocked
 */
export async function isBlocked(userId1: string, userId2: string): Promise<boolean> {
    const data = await sql`
        SELECT id FROM user_blocks 
        WHERE (blocker_id = ${userId1} AND blocked_id = ${userId2})
           OR (blocker_id = ${userId2} AND blocked_id = ${userId1})
        LIMIT 1
    `;
    return data.length > 0;
}
