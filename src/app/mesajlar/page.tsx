"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/utils/supabase/client";
import { useRouter, useSearchParams } from "next/navigation";
import ConversationList from "@/app/mesajlar/components/ConversationList";
import ChatWindow from "@/app/mesajlar/components/ChatWindow";
import { User } from "@supabase/supabase-js";

import { Suspense } from "react";

function MessagesContent() {
    const supabase = createClient();
    const router = useRouter();
    const searchParams = useSearchParams();
    const conversationIdParam = searchParams.get('conversationId');

    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }
            setCurrentUser(user);
            setLoading(false);
        };
        checkAuth();
    }, []);

    useEffect(() => {
        if (conversationIdParam) {
            setSelectedConversationId(conversationIdParam);
        }
    }, [conversationIdParam]);

    if (loading) return <div className="h-screen flex items-center justify-center">Yükleniyor...</div>;
    if (!currentUser) return null;

    return (
        <div className="h-screen bg-gray-50 flex overflow-hidden">
            {/* Sidebar List */}
            <div className={`w-full md:w-80 bg-white border-r border-gray-200 flex flex-col ${selectedConversationId ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-gray-800">Mesajlar</h1>
                    <a href="/" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors" title="Ana Sayfaya Dön">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" /></svg>
                    </a>
                </div>
                <ConversationList
                    currentUser={currentUser}
                    selectedId={selectedConversationId}
                    onSelect={(id) => {
                        setSelectedConversationId(id);
                        router.push(`/mesajlar?conversationId=${id}`, { scroll: false });
                    }}
                />
            </div>

            {/* Main Chat Area */}
            <div className={`flex-1 flex flex-col ${!selectedConversationId ? 'hidden md:flex' : 'flex'}`}>
                {selectedConversationId ? (
                    <ChatWindow
                        currentUser={currentUser}
                        conversationId={selectedConversationId}
                        onBack={() => {
                            setSelectedConversationId(null);
                            router.push('/mesajlar', { scroll: false });
                        }}
                    />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 p-8 text-center bg-gray-50/50">
                        <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <svg className="w-10 h-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-600 mb-2">Sohbet Başlatın</h2>
                        <p className="max-w-sm">Sol taraftaki listeden bir konuşma seçin veya yeni bir sohbet başlatmak için profilleri ziyaret edin.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function MessagesPage() {
    return (
        <Suspense fallback={<div className="h-screen flex items-center justify-center">Yükleniyor...</div>}>
            <MessagesContent />
        </Suspense>
    );
}
