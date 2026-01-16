"use client";
import { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { ArrowLeft, Send, Shield, ShieldOff, MoreVertical } from 'lucide-react';
import { getMessages, sendMessage, markMessagesAsRead, Message, blockUser, unblockUser, isBlocked } from '@/lib/messaging';
import { sanitizeText } from '@/lib/sanitize';
import { checkRateLimit } from '@/lib/rateLimit';
import RateLimitWarning from '@/components/RateLimitWarning';

export default function ChatPage() {
    const params = useParams();
    const router = useRouter();
    const conversationId = params.conversationId as string;

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [otherUser, setOtherUser] = useState<any>(null);
    const [rateLimitInfo, setRateLimitInfo] = useState<any>(null);
    const [isUserBlocked, setIsUserBlocked] = useState(false);
    const [showOptions, setShowOptions] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Scroll to bottom
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    // Load conversation and messages
    useEffect(() => {
        async function loadData() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }

            setUserId(user.id);

            // Get conversation
            const { data: conv, error: convError } = await supabase
                .from('conversations')
                .select('*')
                .eq('id', conversationId)
                .single();

            if (convError || !conv) {
                router.push('/mesajlar');
                return;
            }

            // Get other user
            const otherUserId = conv.participant_1 === user.id ? conv.participant_2 : conv.participant_1;
            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', otherUserId)
                .single();

            setOtherUser(profile);

            // Load messages
            const msgs = await getMessages(conversationId);
            setMessages(msgs);

            // Check if blocked
            const blocked = await isBlocked(user.id, otherUserId);
            setIsUserBlocked(blocked);

            // Mark as read
            await markMessagesAsRead(conversationId, user.id);

            setLoading(false);
            setTimeout(scrollToBottom, 100);
        }

        loadData();
    }, [conversationId, router]);

    // Subscribe to new messages
    useEffect(() => {
        if (!userId) return;

        const channel = supabase
            .channel(`messages:${conversationId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `conversation_id=eq.${conversationId}`,
                },
                (payload) => {
                    const newMsg = payload.new as Message;
                    setMessages((prev) => [...prev, newMsg]);

                    // Mark as read if not from current user
                    if (newMsg.sender_id !== userId) {
                        markMessagesAsRead(conversationId, userId);
                    }

                    setTimeout(scrollToBottom, 100);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId, userId]);

    const toggleBlock = async () => {
        if (!userId || !otherUser) return;

        if (isUserBlocked) {
            const success = await unblockUser(userId, otherUser.id);
            if (success) setIsUserBlocked(false);
        } else {
            if (confirm(`${otherUser.full_name} kullanıcısını engellemek istediğinize emin misiniz?`)) {
                const success = await blockUser(userId, otherUser.id);
                if (success) setIsUserBlocked(true);
            }
        }
        setShowOptions(false);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !userId || sending || isUserBlocked) return;

        // Check rate limit
        const { allowed, info } = await checkRateLimit(userId, 'send_message');
        setRateLimitInfo(info);

        if (!allowed) {
            alert('Mesaj gönderme limitiniz doldu. Lütfen daha sonra tekrar deneyin.');
            return;
        }

        setSending(true);

        try {
            const sanitized = sanitizeText(newMessage);
            await sendMessage(conversationId, userId, sanitized);
            setNewMessage('');
            inputRef.current?.focus();
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Mesaj gönderilemedi. Lütfen tekrar deneyin.');
        } finally {
            setSending(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-gray-50 dark:bg-zinc-950">
            {/* Header */}
            <div className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 p-4">
                <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <Link href="/mesajlar" className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>

                    <Link
                        href={otherUser?.role === 'employer' ? `/profil/employer/${otherUser.id}` : `/profil/freelancer/${otherUser.id}`}
                        className="flex items-center gap-4 hover:opacity-80 transition-opacity no-underline text-inherit flex-1"
                    >
                        <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold overflow-hidden">
                            {otherUser?.avatar_url ? (
                                <img src={otherUser.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                otherUser?.full_name?.charAt(0) || '?'
                            )}
                        </div>

                        <div>
                            <h2 className="font-bold">{otherUser?.full_name || 'Bilinmeyen Kullanıcı'}</h2>
                            {otherUser?.bio && (
                                <p className="text-sm text-gray-500 truncate max-w-md">{otherUser.bio}</p>
                            )}
                        </div>
                    </Link>

                    <div className="relative">
                        <button
                            onClick={() => setShowOptions(!showOptions)}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                            <MoreVertical className="w-5 h-5" />
                        </button>

                        {showOptions && (
                            <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-zinc-800 rounded-xl shadow-xl border border-gray-100 dark:border-zinc-700 py-1 z-20">
                                <button
                                    onClick={toggleBlock}
                                    className={`w-full text-left px-4 py-2 text-sm flex items-center gap-2 ${isUserBlocked ? 'text-blue-600 hover:bg-blue-50' : 'text-red-600 hover:bg-red-50'
                                        }`}
                                >
                                    {isUserBlocked ? (
                                        <>
                                            <ShieldOff className="w-4 h-4" />
                                            Engeli Kaldır
                                        </>
                                    ) : (
                                        <>
                                            <Shield className="w-4 h-4" />
                                            Engelle
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4">
                <div className="max-w-4xl mx-auto space-y-4">
                    {messages.length === 0 ? (
                        <div className="text-center text-gray-500 py-12">
                            <p>Henüz mesaj yok. İlk mesajı gönderin!</p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isOwn = msg.sender_id === userId;
                            return (
                                <div
                                    key={msg.id}
                                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-md px-4 py-2 rounded-2xl ${isOwn
                                            ? 'bg-blue-600 text-white rounded-br-sm'
                                            : 'bg-white dark:bg-zinc-800 text-gray-900 dark:text-white rounded-bl-sm'
                                            }`}
                                    >
                                        <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                                        <p
                                            className={`text-xs mt-1 ${isOwn ? 'text-blue-100' : 'text-gray-400'
                                                }`}
                                        >
                                            {new Date(msg.created_at).toLocaleTimeString('tr-TR', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Input */}
            <div className="bg-white dark:bg-zinc-900 border-t border-gray-200 dark:border-zinc-800 p-4">
                <div className="max-w-4xl mx-auto">
                    {rateLimitInfo && (
                        <div className="mb-3">
                            <RateLimitWarning
                                action="send_message"
                                resetAt={rateLimitInfo.reset_at}
                                remaining={rateLimitInfo.remaining}
                                limit={rateLimitInfo.limit}
                            />
                        </div>
                    )}

                    {isUserBlocked ? (
                        <div className="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 p-4 rounded-xl text-center">
                            <p className="text-red-600 dark:text-red-400 text-sm font-medium">Bu kullanıcıyı engellediniz. Mesaj göndermek için engeli kaldırın.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSend} className="flex gap-2">
                            <input
                                ref={inputRef}
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Mesajınızı yazın..."
                                className="flex-1 bg-gray-100 dark:bg-zinc-800 border-none rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500"
                                disabled={sending}
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim() || sending}
                                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <Send className="w-5 h-5" />
                                Gönder
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
