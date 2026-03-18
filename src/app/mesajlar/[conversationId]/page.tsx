"use client";
import { useEffect, useState, useRef } from 'react';
import { useSession } from "next-auth/react";
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, Shield, ShieldOff, MoreVertical, Loader2, Info } from 'lucide-react';
import { getMessages, sendMessage, markMessagesAsRead, Message, isBlocked } from '@/lib/messaging';
import { sanitizeText } from '@/lib/sanitize';
import { checkRateLimit } from '@/lib/rateLimit';
import RateLimitWarning from '@/components/RateLimitWarning';
import { getConversationDetails, toggleBlockAction } from '../actions-chat';

export default function ChatPage() {
    const { data: session, status } = useSession();
    const params = useParams();
    const router = useRouter();
    const conversationId = params.conversationId as string;

    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [otherUser, setOtherUser] = useState<any>(null);
    const [rateLimitInfo, setRateLimitInfo] = useState<any>(null);
    const [isUserBlocked, setIsUserBlocked] = useState(false);
    const [showOptions, setShowOptions] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const lastMessageIdRef = useRef<string | null>(null);

    // Scroll to bottom
    const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
        messagesEndRef.current?.scrollIntoView({ behavior });
    };

    // Load conversation and messages (Polling replaced Realtime)
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
            return;
        }

        if (status !== 'authenticated') return;

        const loadContent = async () => {
            const details = await getConversationDetails(conversationId);
            if (!details) {
                router.push('/mesajlar');
                return;
            }

            setOtherUser(details.otherUser);

            const msgs = await getMessages(conversationId);
            setMessages(msgs);
            if (msgs.length > 0) {
                lastMessageIdRef.current = msgs[msgs.length - 1].id;
            }

            const blocked = await isBlocked(session.user.id, details.otherUser.id);
            setIsUserBlocked(blocked);

            await markMessagesAsRead(conversationId, session.user.id);
            setLoading(false);
            setTimeout(() => scrollToBottom('auto'), 100);
        };

        loadContent();

        // Polling loop for new messages
        const pollInterval = setInterval(async () => {
            const latestMsgs = await getMessages(conversationId);
            if (latestMsgs.length > 0) {
                const latestId = latestMsgs[latestMsgs.length - 1].id;
                if (latestId !== lastMessageIdRef.current) {
                    setMessages(latestMsgs);
                    lastMessageIdRef.current = latestId;
                    
                    // Mark as read if the last message is not from us
                    const lastMsg = latestMsgs[latestMsgs.length - 1];
                    if (lastMsg.sender_id !== session.user.id) {
                        await markMessagesAsRead(conversationId, session.user.id);
                    }
                    scrollToBottom();
                }
            }
        }, 3000); // Poll every 3 seconds

        return () => clearInterval(pollInterval);
    }, [conversationId, status, session, router]);

    const handleToggleBlock = async () => {
        if (!session?.user?.id || !otherUser) return;

        const confirmText = isUserBlocked 
            ? `${otherUser.full_name} engeli kaldırılsın mı?`
            : `${otherUser.full_name} kullanıcısını engellemek istediğinize emin misiniz?`;
        
        if (confirm(confirmText)) {
            const { success } = await toggleBlockAction(otherUser.id, isUserBlocked);
            if (success) setIsUserBlocked(!isUserBlocked);
        }
        setShowOptions(false);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || !session?.user?.id || sending || isUserBlocked) return;

        const { allowed, info } = await checkRateLimit(session.user.id, 'send_message');
        setRateLimitInfo(info);

        if (!allowed) {
            alert('Mesaj limiti doldu. Biraz daha bekleyin.');
            return;
        }

        setSending(true);
        try {
            const sanitized = sanitizeText(newMessage);
            await sendMessage(conversationId, session.user.id, sanitized);
            setNewMessage('');
            inputRef.current?.focus();
            
            // Immediately refresh messages
            const updated = await getMessages(conversationId);
            setMessages(updated);
            if (updated.length > 0) {
                lastMessageIdRef.current = updated[updated.length - 1].id;
            }
            scrollToBottom();
        } catch (error) {
            console.error('Error sending message:', error);
            alert('Mesaj gönderilemedi.');
        } finally {
            setSending(false);
        }
    };

    if (loading || status === 'loading') {
        return (
            <div className="h-screen flex items-center justify-center bg-[#F8FAFC]">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-[#F8FAFC] font-sans">
            {/* Header */}
            <div className="bg-white/80 backdrop-blur-xl border-b border-slate-100 p-6 z-20">
                <div className="max-w-5xl mx-auto flex items-center gap-6">
                    <Link href="/mesajlar" className="w-10 h-10 flex items-center justify-center bg-slate-50 hover:bg-slate-100 rounded-2xl transition-all text-slate-400">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>

                    <Link
                        href={otherUser?.role === 'employer' ? `/profil/employer/${otherUser.id}` : `/profil/freelancer/${otherUser.id}`}
                        className="flex items-center gap-4 hover:opacity-80 transition-opacity no-underline text-inherit flex-1 group"
                    >
                        <div className="w-12 h-12 rounded-[18px] bg-blue-600 flex items-center justify-center text-white font-black overflow-hidden shadow-lg shadow-blue-500/20 uppercase italic">
                            {otherUser?.avatar_url ? (
                                <img src={otherUser.avatar_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                                otherUser?.full_name?.charAt(0) || '?'
                            )}
                        </div>

                        <div>
                            <h2 className="font-black text-slate-900 uppercase italic tracking-tighter group-hover:text-blue-600 transition-colors">{otherUser?.full_name || 'Bilinmeyen Kullanıcı'}</h2>
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest opacity-60">
                                {otherUser?.role === 'employer' ? 'İşveren' : 'Freelancer'} • Çevrimiçi
                            </p>
                        </div>
                    </Link>

                    <div className="relative">
                        <button
                            onClick={() => setShowOptions(!showOptions)}
                            className="w-10 h-10 flex items-center justify-center hover:bg-slate-50 rounded-2xl transition-all text-slate-400"
                        >
                            <MoreVertical className="w-5 h-5" />
                        </button>

                        {showOptions && (
                            <div className="absolute right-0 mt-4 w-56 bg-white rounded-[24px] shadow-2xl border border-slate-100 py-3 z-50 animate-in fade-in slide-in-from-top-2">
                                <button
                                    onClick={handleToggleBlock}
                                    className={`w-full text-left px-6 py-3 text-[10px] font-black uppercase tracking-widest flex items-center gap-3 ${isUserBlocked ? 'text-blue-600 hover:bg-blue-50' : 'text-red-600 hover:bg-red-50'
                                        }`}
                                >
                                    {isUserBlocked ? (
                                        <>
                                            <ShieldOff className="w-4 h-4" />
                                            ENGELİ KALDIR
                                        </>
                                    ) : (
                                        <>
                                            <Shield className="w-4 h-4" />
                                            ENGELLE
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-8 scrollbar-hide">
                <div className="max-w-4xl mx-auto space-y-8">
                    {messages.length === 0 ? (
                        <div className="text-center py-20 flex flex-col items-center gap-6">
                            <div className="w-20 h-20 bg-slate-50 rounded-[32px] flex items-center justify-center text-slate-300">
                                <Info className="w-8 h-8" />
                            </div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Henüz mesaj yok. İlk mesajı gönderin!</p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const isOwn = msg.sender_id === session?.user?.id;
                            return (
                                <div
                                    key={msg.id}
                                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} items-end gap-3`}
                                >
                                    {!isOwn && (
                                        <div className="w-8 h-8 rounded-xl bg-slate-100 shrink-0 flex items-center justify-center text-[10px] font-black text-slate-400 uppercase">
                                            {otherUser?.full_name?.charAt(0)}
                                        </div>
                                    )}
                                    <div
                                        className={`max-w-[70%] px-6 py-4 rounded-[32px] shadow-sm ${isOwn
                                            ? 'bg-blue-600 text-white rounded-br-[4px]'
                                            : 'bg-white text-slate-700 rounded-bl-[4px] border border-slate-100'
                                            }`}
                                    >
                                        <p className="text-sm font-medium whitespace-pre-wrap break-words">{msg.content}</p>
                                        <p
                                            className={`text-[9px] font-black uppercase tracking-widest mt-2 opacity-50 text-right ${isOwn ? 'text-blue-100' : 'text-slate-400'
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

            {/* Input Area */}
            <div className="bg-white/80 backdrop-blur-xl border-t border-slate-100 p-8">
                <div className="max-w-4xl mx-auto">
                    {rateLimitInfo && (
                        <div className="mb-6">
                            <RateLimitWarning
                                action="send_message"
                                resetAt={rateLimitInfo.reset_at}
                                remaining={rateLimitInfo.remaining}
                                limit={rateLimitInfo.limit}
                            />
                        </div>
                    )}

                    {isUserBlocked ? (
                        <div className="bg-red-50 border-2 border-dashed border-red-200 p-8 rounded-[40px] text-center">
                            <p className="text-red-700 text-[10px] font-black uppercase tracking-widest">Bu kullanıcıyı engellediniz. Mesaj göndermek için engeli kaldırın.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSend} className="flex gap-4">
                            <input
                                ref={inputRef}
                                type="text"
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                placeholder="Mesajınızı buraya yazın..."
                                className="flex-1 bg-slate-50 border-2 border-transparent focus:border-blue-600 rounded-[32px] px-8 py-4 outline-none transition-all font-medium text-slate-800"
                                disabled={sending}
                            />
                            <button
                                type="submit"
                                disabled={!newMessage.trim() || sending}
                                className="w-16 h-16 bg-slate-900 hover:bg-blue-600 text-white rounded-[24px] flex items-center justify-center transition-all disabled:opacity-50 disabled:cursor-not-allowed group shadow-xl hover:scale-105 active:scale-95"
                            >
                                {sending ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <Send className="w-6 h-6 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                                )}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
}
