import { supabase } from './supabase';

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
    console.log('--- MESSAGING_LIB_V4_CHECK ---');
    console.log('IDs:', { userId1, userId2 });

    if (!userId1 || !userId2 || userId1 === userId2) {
        console.error('BİLGİ: Aynı kullanıcılar arasında konuşma başlatılamaz.', { userId1, userId2 });
        return null;
    }

    // Check if either user has blocked the other
    const { data: block } = await supabase
        .from('user_blocks')
        .select('*')
        .or(`and(blocker_id.eq.${userId1},blocked_id.eq.${userId2}),and(blocker_id.eq.${userId2},blocked_id.eq.${userId1})`)
        .maybeSingle();

    if (block) {
        alert('Bu kullanıcı ile iletişim kuramazsınız (Engelleme mevcut).');
        return null;
    }

    // First, try to find existing conversation (check both orders)
    const { data: existing } = await supabase
        .from('conversations')
        .select('*')
        .or(`and(participant_1.eq.${userId1},participant_2.eq.${userId2}),and(participant_1.eq.${userId2},participant_2.eq.${userId1})`)
        .maybeSingle();

    if (existing) return existing;

    // If not found, create new conversation
    const { data, error } = await supabase
        .from('conversations')
        .insert({
            participant_1: userId1,
            participant_2: userId2,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating conversation:', error);
        console.error('Error details:', JSON.stringify(error, null, 2));
        console.error('User IDs:', { userId1, userId2 });

        // Check if table doesn't exist
        if (error.code === '42P01' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
            alert('⚠️ Mesajlaşma sistemi henüz kurulmamış!\n\nLütfen Supabase Dashboard\'dan migration dosyalarını çalıştırın:\n\n1. 20240113_create_messaging.sql\n2. 20240113_create_notifications.sql\n3. 20240113_create_rate_limits.sql\n4. 20240113_fix_conversation_creation.sql\n\nDetaylar için walkthrough.md dosyasına bakın.');
        } else if (error.code === '23505') {
            // Unique constraint violation - conversation exists
            // Try to fetch it again
            const { data: retry } = await supabase
                .from('conversations')
                .select('*')
                .or(`and(participant_1.eq.${userId1},participant_2.eq.${userId2}),and(participant_1.eq.${userId2},participant_2.eq.${userId1})`)
                .maybeSingle();
            return retry;
        } else {
            alert(`Konuşma oluşturulamadı.\n\nHata: ${error.message || 'Bilinmeyen hata'}\n\nLütfen migration dosyalarının çalıştırıldığından emin olun.`);
        }

        return null;
    }

    return data;
}

/**
 * Gets all conversations for a user with profile info
 */
export async function getUserConversations(
    userId: string
): Promise<ConversationWithProfile[]> {
    const { data: conversations, error } = await supabase
        .from('conversations')
        .select('*')
        .or(`participant_1.eq.${userId},participant_2.eq.${userId}`)
        .order('last_message_at', { ascending: false });

    if (error || !conversations) {
        console.error('Error getting conversations:', error);
        return [];
    }

    // Enrich with profile data and last message
    const enriched = await Promise.all(
        conversations.map(async (conv) => {
            const otherUserId = conv.participant_1 === userId ? conv.participant_2 : conv.participant_1;

            // Get other user's profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url')
                .eq('id', otherUserId)
                .single();

            // Get last message
            const { data: lastMessage } = await supabase
                .from('messages')
                .select('content, sender_id')
                .eq('conversation_id', conv.id)
                .order('created_at', { ascending: false })
                .limit(1)
                .single();

            // Get unread count
            const { count: unreadCount } = await supabase
                .from('messages')
                .select('*', { count: 'exact', head: true })
                .eq('conversation_id', conv.id)
                .eq('read', false)
                .neq('sender_id', userId);

            return {
                ...conv,
                other_user: profile,
                last_message: lastMessage,
                unread_count: unreadCount || 0,
            };
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
    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true })
        .limit(limit);

    if (error) {
        console.error('Error getting messages:', error);
        return [];
    }

    return data || [];
}

/**
 * Sends a message in a conversation
 */
export async function sendMessage(
    conversationId: string,
    senderId: string,
    content: string
): Promise<Message | null> {
    const { data, error } = await supabase
        .from('messages')
        .insert({
            conversation_id: conversationId,
            sender_id: senderId,
            content,
        })
        .select()
        .single();

    if (error) {
        console.error('Error sending message:', error);
        return null;
    }

    return data;
}

/**
 * Marks messages as read in a conversation
 */
export async function markMessagesAsRead(
    conversationId: string,
    userId: string
) {
    const { error } = await supabase
        .from('messages')
        .update({ read: true })
        .eq('conversation_id', conversationId)
        .eq('read', false)
        .neq('sender_id', userId);

    if (error) {
        console.error('Error marking messages as read:', error);
        return false;
    }

    return true;
}

/**
 * Gets total unread message count for a user
 */
export async function getTotalUnreadMessages(userId: string): Promise<number> {
    // Get all user's conversations
    const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .or(`participant_1.eq.${userId},participant_2.eq.${userId}`);

    if (!conversations) return 0;

    const conversationIds = conversations.map(c => c.id);

    // Count unread messages in all conversations
    const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .in('conversation_id', conversationIds)
        .eq('read', false)
        .neq('sender_id', userId);

    return count || 0;
}

/**
 * Blocks a user
 */
export async function blockUser(blockerId: string, blockedId: string) {
    const { error } = await supabase
        .from('user_blocks')
        .insert({ blocker_id: blockerId, blocked_id: blockedId });

    if (error) {
        console.error('Error blocking user:', error);
        return false;
    }
    return true;
}

/**
 * Unblocks a user
 */
export async function unblockUser(blockerId: string, blockedId: string) {
    const { error } = await supabase
        .from('user_blocks')
        .delete()
        .eq('blocker_id', blockerId)
        .eq('blocked_id', blockedId);

    if (error) {
        console.error('Error unblocking user:', error);
        return false;
    }
    return true;
}

/**
 * Checks if a user is blocked
 */
export async function isBlocked(userId1: string, userId2: string): Promise<boolean> {
    const { data } = await supabase
        .from('user_blocks')
        .select('*')
        .or(`and(blocker_id.eq.${userId1},blocked_id.eq.${userId2}),and(blocker_id.eq.${userId2},blocked_id.eq.${userId1})`)
        .maybeSingle();

    return !!data;
}
