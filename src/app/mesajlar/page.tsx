"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import ConversationList from "@/app/mesajlar/components/ConversationList";
import ChatWindow from "@/app/mesajlar/components/ChatWindow";
import { Suspense } from "react";
import Link from "next/link";
import { Home } from "lucide-react";

function MessagesContent() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const conversationIdParam = searchParams.get('conversationId');

    const currentUser = session?.user || null;
    const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    useEffect(() => {
        if (conversationIdParam) {
            setSelectedConversationId(conversationIdParam);
        }
    }, [conversationIdParam]);

    if (status === 'loading') return <div className="h-screen flex items-center justify-center">Yükleniyor...</div>;
    if (!currentUser) return null;

    return (
        <div className="h-screen bg-gray-50 flex overflow-hidden">
            {/* Sidebar List */}
            <div className={`w-full md:w-80 bg-white border-r border-gray-200 flex flex-col ${selectedConversationId ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                    <h1 className="text-xl font-bold text-gray-800">Mesajlar</h1>
                    <Link href="/" className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-full transition-colors" title="Ana Sayfaya Dön">
                        <Home className="w-5 h-5" />
                    </Link>
                </div>
                <ConversationList
                    currentUser={currentUser as any}
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
                        currentUser={currentUser as any}
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
