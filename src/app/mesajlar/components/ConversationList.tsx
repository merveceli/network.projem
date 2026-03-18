"use client";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { getConversations, searchUsers, createOrGetConversation } from "../actions";

interface Conversation {
    id: string;
    last_message_at: string;
    participant_1: string;
    participant_2: string;
    profiles: {
        full_name: string;
        avatar_url?: string;
    } | null;
}

export default function ConversationList({ currentUser, selectedId, onSelect }: { currentUser: any, selectedId: string | null, onSelect: (id: string) => void }) {
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [searchResults, setSearchResults] = useState<{ id: string, full_name: string, avatar_url?: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    const fetchConvs = async () => {
        const result = await getConversations();
        if (result.success && result.data) {
            setConversations(result.data as Conversation[]);
        }
        setLoading(false);
    };

    useEffect(() => {
        if (!currentUser) return;
        
        fetchConvs();
        
        // Polling loop instead of real-time
        const intervalId = setInterval(fetchConvs, 3000);
        return () => clearInterval(intervalId);
    }, [currentUser]);

    useEffect(() => {
        const search = async () => {
            if (searchTerm.trim().length < 2) {
                setSearchResults([]);
                setIsSearching(false);
                return;
            }

            setIsSearching(true);
            const result = await searchUsers(searchTerm);
            if (result.success && result.data) {
                setSearchResults(result.data as any[]);
            }
            setIsSearching(false);
        };

        const timeoutId = setTimeout(search, 500);
        return () => clearTimeout(timeoutId);
    }, [searchTerm, currentUser.id]);

    const handleUserSelect = async (otherUserId: string) => {
        const existingConv = conversations.find(c =>
            (c.participant_1 === currentUser.id && c.participant_2 === otherUserId) ||
            (c.participant_1 === otherUserId && c.participant_2 === currentUser.id)
        );

        if (existingConv) {
            onSelect(existingConv.id);
            setSearchTerm("");
        } else {
            const result = await createOrGetConversation(otherUserId);
            if (result.success && result.conversationId) {
                await fetchConvs();
                onSelect(result.conversationId);
                setSearchTerm("");
            } else {
                alert("Sohbet başlatılamadı.");
            }
        }
    };

    const filteredConversations = conversations.filter(c =>
        c.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex-1 flex flex-col overflow-hidden h-full">
            <div className="p-4 bg-white">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Sohbet veya kişi ara..."
                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/50 transition-all font-medium"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto">
                {searchTerm.length > 0 && (
                    <div className="mb-2">
                        {searchResults.length > 0 && (
                            <>
                                <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Kişiler</div>
                                {searchResults.map(user => (
                                    <div
                                        key={user.id}
                                        onClick={() => handleUserSelect(user.id)}
                                        className="px-4 py-3 cursor-pointer hover:bg-gray-50 flex items-center gap-3 transition-colors"
                                    >
                                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-bold text-sm">
                                            {user.avatar_url ? (
                                                <img src={user.avatar_url} className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                user.full_name?.charAt(0).toUpperCase()
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-sm">{user.full_name}</h3>
                                            <p className="text-xs text-blue-600">Yeni Sohbet Başlat</p>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}
                        {searchResults.length > 0 && filteredConversations.length > 0 && <div className="h-px bg-gray-100 my-2 mx-4"></div>}
                    </div>
                )}

                {searchTerm.length > 0 && filteredConversations.length > 0 && (
                    <div className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Sohbetler</div>
                )}

                {filteredConversations.length === 0 && searchResults.length === 0 ? (
                    <div className="p-8 text-center text-gray-400 flex flex-col items-center">
                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3 text-gray-300">
                            <Search className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-medium">{searchTerm ? 'Sonuç bulunamadı' : 'Sohbetleriniz burada listelenir'}</p>
                    </div>
                ) : (
                    filteredConversations.map(conv => (
                        <div
                            key={conv.id}
                            onClick={() => onSelect(conv.id)}
                            className={`px-4 py-3.5 border-b border-fuchsia-50/50 cursor-pointer hover:bg-gray-50 transition-all flex items-center gap-4 group ${selectedId === conv.id ? 'bg-blue-50/60' : ''}`}
                        >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-sm transition-transform group-hover:scale-105 ${selectedId === conv.id ? 'bg-blue-600' : 'bg-gradient-to-br from-blue-400 to-indigo-500'}`}>
                                {conv.profiles?.avatar_url ? (
                                    <img src={conv.profiles.avatar_url} className="w-full h-full rounded-full object-cover" />
                                ) : (
                                    conv.profiles?.full_name?.charAt(0).toUpperCase() || '?'
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-0.5">
                                    <h3 className={`font-bold text-sm truncate ${selectedId === conv.id ? 'text-blue-900' : 'text-gray-900'}`}>{conv.profiles?.full_name || 'Bilinmeyen Kullanıcı'}</h3>
                                    <span className="text-[10px] text-gray-400 font-medium">{new Date(conv.last_message_at).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                                </div>
                                <p className={`text-xs truncate ${selectedId === conv.id ? 'text-blue-700/70 font-medium' : 'text-gray-500'}`}>
                                    Sohbeti görüntüle
                                </p>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
