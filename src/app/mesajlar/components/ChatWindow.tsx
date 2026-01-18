"use client";
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { ArrowLeft, Send, MoreVertical, Ban, ShieldAlert, X, MapPin, User as UserIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
    id: string;
    content: string;
    sender_id: string;
    created_at: string;
    read: boolean;
}

interface Profile {
    id: string;
    full_name: string;
    title?: string;
    avatar_url?: string;
    bio?: string;
    location?: string;
    role?: string;
}

export default function ChatWindow({ currentUser, conversationId, onBack }: { currentUser: User, conversationId: string, onBack: () => void }) {
    const supabase = createClient();
    const [messages, setMessages] = useState<Message[]>([]);
    const [otherUser, setOtherUser] = useState<Profile | null>(null);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const [sending, setSending] = useState(false);

    // Blocking State
    const [isBlocked, setIsBlocked] = useState(false); // Am I blocked?
    const [hasBlocked, setHasBlocked] = useState(false); // Have I blocked them?
    const [showMenu, setShowMenu] = useState(false);
    const [showProfileModal, setShowProfileModal] = useState(false); // For Mini Bio
    const menuRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        if (messagesEndRef.current) {
            const scrollContainer = messagesEndRef.current.parentElement;
            if (scrollContainer) {
                scrollContainer.scrollTop = scrollContainer.scrollHeight;
            }
        }
    };

    // Close menu when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setShowMenu(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom();
        }
    }, [messages]);

    useEffect(() => {
        setLoading(true);
        setOtherUser(null); // Reset on conversation change
        setHasBlocked(false);
        setIsBlocked(false);

        const fetchChatDetails = async () => {
            try {
                // 1. Get Conversation Details
                const { data: conv, error: convError } = await supabase
                    .from('conversations')
                    .select('*')
                    .eq('id', conversationId)
                    .single();

                if (convError || !conv) {
                    console.error('Failed to fetch conversation:', convError);
                    setLoading(false);
                    return;
                }

                const otherUserId = conv.participant_1 === currentUser.id ? conv.participant_2 : conv.participant_1;

                // 2. Get Other User Profile with MORE details
                // Replacing 'city' with 'location' as verified in schema
                const { data: profile, error: profileError } = await supabase
                    .from('profiles')
                    .select('id, full_name, title, avatar_url, bio, location, role')
                    .eq('id', otherUserId)
                    .maybeSingle();

                if (profileError) {
                    console.error('Profile fetch error:', JSON.stringify(profileError, null, 2));
                }

                if (profile && !profileError) {
                    setOtherUser(profile);
                } else {
                    console.warn('⚠️ Profile not found, using fallback for user:', otherUserId);
                    setOtherUser({
                        id: otherUserId,
                        full_name: "Bilinmeyen Kullanıcı",
                        title: "Profil Bulunamadı"
                    });
                }

                // 3. Check Block Status
                const { data: blocks } = await supabase.from('user_blocks')
                    .select('*')
                    .or(`and(blocker_id.eq.${currentUser.id},blocked_id.eq.${otherUserId}),and(blocker_id.eq.${otherUserId},blocked_id.eq.${currentUser.id})`);

                if (blocks) {
                    blocks.forEach(block => {
                        if (block.blocker_id === currentUser.id) setHasBlocked(true);
                        if (block.blocker_id === otherUserId) setIsBlocked(true);
                    });
                }

                // 4. Get Messages
                const { data: msgs } = await supabase
                    .from('messages')
                    .select('*')
                    .eq('conversation_id', conversationId)
                    .order('created_at', { ascending: true });

                if (msgs) setMessages(msgs);

            } catch (error) {
                console.error('❌ Critical error in fetchChatDetails:', error);
            } finally {
                setLoading(false);
                setTimeout(scrollToBottom, 500);
            }
        };

        fetchChatDetails();

        // 5. Realtime Subscription
        const channel = supabase
            .channel(`chat:${conversationId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `conversation_id=eq.${conversationId}`
            }, (payload) => {
                const newMsg = payload.new as Message;
                setMessages(prev => [...prev, newMsg]);
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId, currentUser.id]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim() || sending || isBlocked || hasBlocked) return;

        setSending(true);
        try {
            const { error } = await supabase.from('messages').insert({
                conversation_id: conversationId,
                sender_id: currentUser.id,
                content: newMessage.trim()
            });

            if (error) throw error;
            setNewMessage("");
            scrollToBottom();
        } catch (error) {
            console.error("Error sending message:", error);
            alert("Mesaj gönderilemedi.");
        } finally {
            setSending(false);
        }
    };

    const toggleBlock = async () => {
        if (!otherUser) return;

        try {
            if (hasBlocked) {
                // Unblock
                const { error } = await supabase.from('user_blocks')
                    .delete()
                    .match({ blocker_id: currentUser.id, blocked_id: otherUser.id });
                if (error) throw error;
                setHasBlocked(false);
                alert("Kullanıcı engeli kaldırıldı.");
            } else {
                // Block
                const { error } = await supabase.from('user_blocks')
                    .insert({ blocker_id: currentUser.id, blocked_id: otherUser.id });
                if (error) throw error;
                setHasBlocked(true);
                alert("Kullanıcı engellendi. Artık size mesaj atamaz.");
            }
            setShowMenu(false);
        } catch (error) {
            console.error("Block error:", error);
            alert("İşlem başarısız oldu.");
        }
    };

    if (loading) return <div className="flex-1 flex items-center justify-center bg-gray-50 text-gray-400">Yükleniyor...</div>;

    return (
        <div className="flex-1 flex flex-col h-full bg-[#f8f9fa] relative overflow-hidden">

            {/* Net-Work. Background Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-0 opacity-[0.03] overflow-hidden select-none">
                <div className="transform -rotate-12 text-[120px] md:text-[200px] font-black text-gray-900 whitespace-nowrap tracking-tighter">
                    Net-Work.
                </div>
            </div>

            {/* Profile Modal */}
            <AnimatePresence>
                {showProfileModal && otherUser && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/20 backdrop-blur-[2px]">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 10 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 10 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="h-28 bg-gradient-to-tr from-blue-600 to-indigo-700 relative">
                                <button
                                    onClick={() => setShowProfileModal(false)}
                                    className="absolute top-3 right-3 p-2 bg-black/20 text-white rounded-full hover:bg-black/30 transition-colors backdrop-blur-md"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <div className="px-6 pb-6 -mt-12 text-center relative">
                                <div className="w-24 h-24 mx-auto bg-white p-1.5 rounded-full shadow-lg mb-4">
                                    <div className="w-full h-full bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center text-3xl font-bold text-indigo-600">
                                        {otherUser.full_name?.charAt(0) || '?'}
                                    </div>
                                </div>
                                <h2 className="text-2xl font-bold text-gray-900 mb-1">{otherUser.full_name}</h2>
                                <p className="text-sm text-gray-500 mb-5 font-medium">{otherUser.title || otherUser.role || 'Kullanıcı'}</p>

                                <div className="flex items-center justify-center gap-2 mb-6">
                                    <span className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide ${isBlocked ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-green-50 text-green-600 border border-green-100'}`}>
                                        {isBlocked ? 'Engelli' : 'Aktif'}
                                    </span>
                                    {otherUser.location && (
                                        <span className="px-4 py-1.5 rounded-full bg-gray-50 text-gray-600 border border-gray-100 text-xs font-bold flex items-center gap-1.5">
                                            <MapPin className="w-3.5 h-3.5" /> {otherUser.location}
                                        </span>
                                    )}
                                </div>

                                <div className="space-y-4 text-left">
                                    {otherUser.bio ? (
                                        <div className="bg-gray-50 p-5 rounded-xl text-sm text-gray-700 leading-relaxed border border-gray-100 relative">
                                            <span className="absolute top-2 left-2 text-2xl text-gray-300 font-serif leading-none">"</span>
                                            <p className="px-2 italic">{otherUser.bio}</p>
                                            <span className="absolute bottom-1 right-2 text-2xl text-gray-300 font-serif leading-none">"</span>
                                        </div>
                                    ) : (
                                        <p className="text-center text-gray-400 italic text-sm">Henüz bir biyografi eklenmemiş.</p>
                                    )}
                                </div>

                                <button
                                    onClick={() => setShowProfileModal(false)}
                                    className="w-full mt-6 py-3.5 bg-gray-900 text-white rounded-xl font-bold hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200"
                                >
                                    Pencereyi Kapat
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Header */}
            <div className="h-20 bg-white border-b border-gray-200/60 flex items-center px-6 justify-between shadow-sm z-10 backdrop-blur-xl bg-white/90 sticky top-0">
                <div className="flex items-center gap-4 cursor-pointer group" onClick={() => setShowProfileModal(true)}>
                    <button onClick={(e) => { e.stopPropagation(); onBack(); }} className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                    </button>
                    <div className="relative">
                        <div className="w-11 h-11 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md ring-2 ring-white group-hover:scale-105 transition-transform duration-300">
                            {otherUser?.full_name?.charAt(0) || '?'}
                        </div>
                        <div className="absolute bottom-0.5 right-0.5 w-3 h-3 bg-emerald-500 ring-2 ring-white rounded-full"></div>
                    </div>
                    <div>
                        <h2 className="font-bold text-gray-900 text-base leading-tight group-hover:text-blue-600 transition-colors">{otherUser?.full_name || 'İsimsiz Kullanıcı'}</h2>
                        <p className="text-xs text-gray-500 font-medium group-hover:text-gray-700 transition-colors mt-0.5">
                            {hasBlocked ? <span className="text-red-500 font-bold">Engellendi</span> : isBlocked ? <span className="text-red-500 font-bold">Sizi Engelledi</span> : "Profili Görüntüle"}
                        </p>
                    </div>
                </div>

                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="p-2.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-all active:scale-95"
                    >
                        <MoreVertical className="w-5 h-5" />
                    </button>

                    <AnimatePresence>
                        {showMenu && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden py-1.5 z-50 origin-top-right ring-1 ring-black/5"
                            >
                                <button
                                    onClick={() => { setShowProfileModal(true); setShowMenu(false); }}
                                    className="w-full text-left px-4 py-3 flex items-center gap-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                                >
                                    <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                                        <UserIcon className="w-4 h-4" />
                                    </div>
                                    Profili Gör
                                </button>
                                <div className="h-px bg-gray-100 my-1"></div>
                                <button
                                    onClick={toggleBlock}
                                    className={`w-full text-left px-4 py-3 flex items-center gap-3 text-sm font-bold transition-colors ${hasBlocked ? 'text-gray-700 hover:bg-gray-50' : 'text-red-600 hover:bg-red-50'}`}
                                >
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${hasBlocked ? 'bg-gray-100 text-gray-600' : 'bg-red-50 text-red-600'}`}>
                                        <Ban className="w-4 h-4" />
                                    </div>
                                    {hasBlocked ? "Engeli Kaldır" : "Kullanıcıyı Engelle"}
                                </button>
                                <button className="w-full text-left px-4 py-3 flex items-center gap-3 text-sm font-medium text-gray-500 hover:bg-gray-50 hover:text-gray-900 transition-colors">
                                    <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 group-hover:text-gray-600">
                                        <ShieldAlert className="w-4 h-4" />
                                    </div>
                                    Şikayet Et
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* SECURITY WARNING */}
            <div className="bg-orange-50 px-6 py-2 border-b border-orange-100 flex items-start gap-3 z-10 shrink-0">
                <ShieldAlert className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
                <p className="text-xs text-orange-800 font-medium leading-relaxed">
                    <strong className="font-bold">GÜVENLİ ÖDEME HATIRLATMASI:</strong> Tüm ödemeler platform üzerinden yapılmalıdır.
                    İş teslimi almadan ödemeyi asla site dışından (IBAN vb.) yapmayın. Dolandırıcılık riskine karşı dikkatli olun.
                </p>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 z-0 scroll-smooth">
                {/* Date Divider */}
                <div className="flex justify-center my-6 opacity-80">
                    <span className="bg-gray-100/80 backdrop-blur-sm text-gray-500 text-[10px] py-1 px-3 rounded-full font-bold uppercase tracking-wider shadow-sm border border-gray-200/50">
                        {new Date().toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                    </span>
                </div>

                {messages.map((msg) => {
                    const isMe = msg.sender_id === currentUser.id;
                    return (
                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group max-w-full mb-1`}>
                            <div className={`max-w-[80%] md:max-w-[65%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                                <div className={`px-5 py-3 shadow-sm relative text-[15px] leading-relaxed break-words
                                    ${isMe
                                        ? 'bg-blue-600 text-white rounded-2xl rounded-tr-sm'
                                        : 'bg-white text-gray-800 rounded-2xl rounded-tl-sm border border-gray-200'
                                    }`}
                                >
                                    {msg.content}
                                </div>
                                <span className={`text-[10px] mt-1 font-bold px-1 ${isMe ? 'text-blue-500/80' : 'text-gray-400'}`}>
                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} className="pt-2" />
            </div>

            {/* Input Area */}
            <div className="bg-white p-4 border-t border-gray-200 z-10">
                {(isBlocked || hasBlocked) ? (
                    <div className="flex flex-col items-center justify-center p-6 bg-gray-50 rounded-2xl border border-gray-200 text-center mx-auto max-w-lg">
                        <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center mb-3">
                            <Ban className="w-6 h-6 text-red-500" />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-1">Sohbet Kısıtlandı</h3>
                        <p className="text-gray-500 text-sm mb-3">Bu sohbet engelleme nedeniyle şu anda kullanılamıyor.</p>
                        {hasBlocked && <button onClick={toggleBlock} className="text-blue-600 text-sm font-bold hover:underline bg-blue-50 px-4 py-2 rounded-lg">Engeli Kaldır</button>}
                    </div>
                ) : (
                    <form onSubmit={handleSend} className="flex items-center gap-3 relative max-w-5xl mx-auto w-full">
                        <input
                            type="text"
                            placeholder="Bir mesaj yazın..."
                            className="flex-1 bg-gray-50 border-transparent focus:bg-white border border-gray-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-2xl px-6 py-4 outline-none transition-all placeholder:text-gray-400 font-medium"
                            value={newMessage}
                            onChange={(e) => setNewMessage(e.target.value)}
                        />
                        <button
                            type="submit"
                            disabled={!newMessage.trim() || sending}
                            className="p-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50 disabled:shadow-none hover:scale-105 active:scale-95 flex-shrink-0"
                        >
                            <Send className="w-5 h-5 ml-0.5" />
                        </button>
                    </form>
                )}
            </div>
        </div>
    );
}
