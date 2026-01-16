"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { User } from "@supabase/supabase-js";
import { Search } from "lucide-react";

interface Conversation {
    id: string;
    last_message_at: string;
    participant_1: string;
    participant_2: string;
    profiles: {
        full_name: string;
        avatar_url?: string;
    } | null; // We'll manually attach the "other" profile here
}

export default function ConversationList({ currentUser, selectedId, onSelect }: { currentUser: User, selectedId: string | null, onSelect: (id: string) => void }) {
    const supabase = createClient();
    const [conversations, setConversations] = useState<Conversation[]>([]); // Existing conversations
    const [searchResults, setSearchResults] = useState<{ id: string, full_name: string, avatar_url?: string }[]>([]); // New user search results
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    // Fetch existing conversations
    const fetchConversations = async () => {
        const { data, error } = await supabase
            .from('conversations')
            .select('*')
            .or(`participant_1.eq.${currentUser.id},participant_2.eq.${currentUser.id}`)
            .order('last_message_at', { ascending: false });

        if (error) {
            console.error("Error fetching conversations:", error);
            return;
        }

        const enrichedConversations = await Promise.all(data.map(async (conv: any) => {
            const otherUserId = conv.participant_1 === currentUser.id ? conv.participant_2 : conv.participant_1;
            const { data: profile } = await supabase
                .from('profiles')
                .select('full_name, avatar_url')
                .eq('id', otherUserId)
                .single();

            return {
                ...conv,
                profiles: profile
            };
        }));

        setConversations(enrichedConversations);
        setLoading(false);
    };

    useEffect(() => {
        fetchConversations();
        const channel = supabase
            .channel('public:conversations_list')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `participant_1=eq.${currentUser.id}` }, () => fetchConversations())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'conversations', filter: `participant_2=eq.${currentUser.id}` }, () => fetchConversations())
            .subscribe();
        return () => { supabase.removeChannel(channel); };
    }, [currentUser]);

    // Search for new users when searchTerm changes
    useEffect(() => {
        const searchUsers = async () => {
            if (searchTerm.trim().length < 2) {
                setSearchResults([]);
                setIsSearching(false);
                return;
            }

            setIsSearching(true);
            // Search in profiles (exclude current user)
            const { data: users } = await supabase
                .from('profiles')
                .select('id, full_name, avatar_url')
                .neq('id', currentUser.id)
                .ilike('full_name', `%${searchTerm}%`)
                .limit(10);

            if (users) setSearchResults(users);
            setIsSearching(false);
        };

        const timeoutId = setTimeout(searchUsers, 500); // Debounce
        return () => clearTimeout(timeoutId);
    }, [searchTerm, currentUser.id]);

    const handleUserSelect = async (otherUserId: string) => {
        // 1. Check if conversation already exists
        const existingConv = conversations.find(c =>
            (c.participant_1 === currentUser.id && c.participant_2 === otherUserId) ||
            (c.participant_1 === otherUserId && c.participant_2 === currentUser.id)
        );

        if (existingConv) {
            onSelect(existingConv.id);
            setSearchTerm(""); // Clear search after selection
        } else {
            // 2. Create new conversation
            try {
                // Ensure unique constraint doesn't fail (order doesn't matter for specific check but DB constraint usually handles this)
                // Actually constraint is UNIQUE(participant_1, participant_2) but we usually query carefully.
                // Our schema might rely on triggers or just checking both directions. 
                // Let's try inserting. content will be empty initially or we just create the record.

                // Note: The database constraint 'unique_conversation' might expect a specific order or we need to check both ways.
                // Migration said: CONSTRAINT unique_conversation UNIQUE (participant_1, participant_2)
                // This implies order sensitive unless we duplicate.
                // BUT usually we sort IDs to ensure consistency. NOT done in schema.
                // Let's rely on finding it first via query if we didn't have it locally.

                const { data: newConv, error } = await supabase
                    .from('conversations')
                    .insert({ participant_1: currentUser.id, participant_2: otherUserId })
                    .select()
                    .single();

                if (error) {
                    // If it violates unique constraint (already exists but not in our list?), try fetching it.
                    if (error.code === '23505') { // Unique violation
                        const { data: existing } = await supabase.from('conversations')
                            .select('id')
                            .or(`and(participant_1.eq.${currentUser.id},participant_2.eq.${otherUserId}),and(participant_1.eq.${otherUserId},participant_2.eq.${currentUser.id})`)
                            .single();
                        if (existing) onSelect(existing.id);
                    } else {
                        console.error("Error creating conversation:", error);
                        alert("Sohbet başlatılamadı.");
                    }
                } else if (newConv) {
                    // Update list manually or let realtime handle it (realtime might take a sec)
                    await fetchConversations();
                    onSelect(newConv.id);
                }
                setSearchTerm("");
            } catch (err) {
                console.error("Error starting chat:", err);
            }
        }
    };

    // Filter conversations for local search if no global search results yet or mixed behavior
    // User wants to reach "other users". So if I type, I want to see Global results primarily if they don't exist locally.
    // Let's separate sections: "Sohbetler" (Conversations) and "Kişiler" (Global Search)

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
                        {/* Global Search Results Section */}
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
                                            {user.full_name?.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-sm">{user.full_name}</h3>
                                            <p className="text-xs text-blue-600">Yeni Sohbet Başlat</p>
                                        </div>
                                    </div>
                                ))}
                            </>
                        )}

                        {/* Separator if both exist */}
                        {searchResults.length > 0 && filteredConversations.length > 0 && <div className="h-px bg-gray-100 my-2 mx-4"></div>}
                    </div>
                )}

                {/* Existing Conversations List */}
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
                                {conv.profiles?.full_name?.charAt(0).toUpperCase() || '?'}
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
