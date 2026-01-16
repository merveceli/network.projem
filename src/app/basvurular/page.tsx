"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ArrowLeft, MessageSquare, Briefcase, Calendar, User, Send } from "lucide-react";
import { sanitizeHTML } from "@/lib/sanitize";
import { getOrCreateConversation } from "@/lib/messaging";

interface Application {
    id: string;
    message: string;
    created_at: string;
    job_id: string;
    applicant_id: string;
    jobs: {
        title: string;
        creator_id: string;
    };
    applicant: {
        full_name: string;
        bio: string;
        avatar_url: string | null;
    };
}

export default function BasvurularPage() {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState(true);
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        async function getMyReceivedApplications() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            setUserId(user.id);

            // SECURITY FIX: Only fetch applications for jobs created by current user
            const { data, error } = await supabase
                .from("applications")
                .select(`
                  id,
                  message,
                  created_at,
                  job_id,
                  applicant_id,
                  jobs!inner ( title, creator_id ),
                  applicant:applicant_id ( full_name, bio, avatar_url )
                `)
                .eq('jobs.creator_id', user.id)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Başvurular çekilemedi:", error.message);
            } else {
                console.log('--- DEBUG: BAŞVURULAR VERİSİ ---');
                console.log('Current User ID:', user.id);
                console.log('Fetched Applications:', data);
                console.log('--------------------------------');
                setApplications(data as any || []);
            }
            setLoading(false);
        }

        getMyReceivedApplications();
    }, []);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-zinc-950 p-6 md:p-12 font-sans text-gray-900 dark:text-gray-100">
            <div className="max-w-4xl mx-auto">

                <div className="flex items-center justify-between mb-8">
                    <div>
                        <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 mb-2 transition-colors">
                            <ArrowLeft className="w-4 h-4" />
                            Ana Sayfaya Dön
                        </Link>
                        <h1 className="text-3xl font-black tracking-tight">Gelen Başvurular</h1>
                        <p className="text-gray-500 dark:text-gray-400 mt-1">İlanlarınıza gelen tüm başvuruları buradan yönetebilirsiniz.</p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 px-4 py-2 rounded-xl text-sm font-bold shadow-sm">
                        Toplam {applications.length} Başvuru
                    </div>
                </div>

                {applications.length > 0 ? (
                    <div className="grid gap-6">
                        {applications.map((app) => (
                            <div key={app.id} className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                <div className="flex flex-col md:flex-row gap-6">

                                    {/* Applicant Info (Left) - This block is removed as per the instruction's implied structural change */}
                                    {/* The new structure integrates applicant info more directly into the main content area */}

                                    {/* Application Content (Right) - Modified to include applicant info */}
                                    <div className="flex-1 space-y-4">
                                        <div className="flex items-center justify-between">
                                            <Link href={`/ilan/${app.job_id}`} className="group flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-gray-200 hover:text-blue-600 transition-colors">
                                                <Briefcase className="w-4 h-4 text-gray-400 group-hover:text-blue-500" />
                                                {app.jobs?.title || "Bilinmeyen İlan"}
                                            </Link>
                                            <div className="flex items-center gap-2 text-xs text-gray-400 font-medium">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(app.created_at).toLocaleDateString("tr-TR", { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>

                                        {/* Applicant Info integrated here */}
                                        <div className="flex items-start gap-4 bg-gray-50 dark:bg-zinc-950 rounded-xl p-4">
                                            {/* Avatar */}
                                            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-lg flex-shrink-0">
                                                {app.applicant?.full_name?.charAt(0) || "?"}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white text-sm">{app.applicant?.full_name || "İsimsiz Kullanıcı"}</p>
                                                {app.applicant?.bio && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{app.applicant.bio}</p>}
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 dark:bg-zinc-950 rounded-xl p-5 relative group">
                                            <MessageSquare className="w-4 h-4 text-gray-300 absolute top-4 left-4" />
                                            <div
                                                className="text-gray-700 dark:text-gray-300 pl-6 text-sm leading-relaxed whitespace-pre-wrap"
                                                dangerouslySetInnerHTML={{ __html: sanitizeHTML(app.message) }}
                                            />
                                        </div>

                                        <div className="flex items-center justify-end gap-2 pt-2">
                                            {/* KENDİ BAŞVURUSU MU KONTROLÜ */}
                                            {userId && app.applicant_id && userId.toLowerCase() === app.applicant_id.toLowerCase() ? (
                                                <div className="flex flex-col items-end">
                                                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 mb-1">Kendi İlanınız</span>
                                                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 px-4 py-2 rounded-xl text-xs font-medium flex items-center gap-2">
                                                        <User className="w-3.5 h-3.5" />
                                                        Bu sizin başvurunuz (Test)
                                                    </div>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={async () => {
                                                        if (!userId) {
                                                            alert('Mesaj göndermek için giriş yapmalısınız.');
                                                            return;
                                                        }

                                                        const targetId = app.applicant_id;
                                                        if (!targetId) {
                                                            alert('Aday bilgisi (applicant_id) eksik. Lütfen sayfayı yenileyin.');
                                                            return;
                                                        }

                                                        if (userId.toLowerCase() === targetId.toLowerCase()) {
                                                            alert('Kendi başvurunuza mesaj gönderemezsiniz.');
                                                            return;
                                                        }

                                                        try {
                                                            const conv = await getOrCreateConversation(userId, targetId);
                                                            if (conv && conv.id) {
                                                                window.location.href = `/mesajlar/${conv.id}`;
                                                            } else {
                                                                alert('Konuşma başlatılamadı. Lütfen teknik ekibe başvurun.');
                                                            }
                                                        } catch (error: any) {
                                                            console.error('Mesaj Hatası Detay:', error);
                                                            alert(`Hata: ${error.message || 'Bilinmeyen bir hata oluştu'}`);
                                                        }
                                                    }}
                                                    className="bg-red-600 hover:bg-red-700 text-white font-black px-10 py-4 rounded-full transition-all shadow-2xl hover:scale-110 flex items-center gap-3 text-lg border-4 border-white dark:border-zinc-800"
                                                >
                                                    <Send className="w-6 h-6" />
                                                    TEST V3 - MESAJ GÖNDER
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white dark:bg-zinc-900 border-2 border-dashed border-gray-200 dark:border-zinc-800 rounded-3xl p-20 text-center">
                        <div className="w-20 h-20 bg-gray-50 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-300 dark:text-gray-600">
                            <MessageSquare className="w-10 h-10" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Henüz Başvuru Yok</h3>
                        <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                            İlanlarınız görüntülendiğinde ve adaylar başvuru yaptığında mesajları burada göreceksiniz.
                        </p>
                    </div>
                )}
            </div>
        </main>
    );
}