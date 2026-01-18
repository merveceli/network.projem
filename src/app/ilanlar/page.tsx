"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { Search, Briefcase, Filter as FilterIcon, ChevronDown, Clock, Banknote, ArrowLeft } from "lucide-react";
import SmartJobMatcher from "@/components/SmartJobMatcher";

import { Suspense } from "react";

// --- TİPLER ---
// --- TİPLER ---
interface Job {
    id: string;
    title: string;
    description: string;
    category: string;
    job_type: string;
    salary_range: string | null;
    created_at: string;
    creator_id: string;
    is_filled: boolean;
    urgency: 'normal' | 'urgent';
    images: string[];
    profiles: {
        full_name: string | null;
        avatar_url: string | null;
    } | null;
    application_count?: number;
    has_applied?: boolean;
}

import LoadingFacts from "@/components/LoadingFacts";
import { User } from "@supabase/supabase-js"; // Add import

function JobListingContent() {
    const searchParams = useSearchParams();
    const queryTerm = searchParams.get('q') || "";

    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    // Filtre State'leri
    const [searchTerm, setSearchTerm] = useState(queryTerm);
    const [selectedCategory, setSelectedCategory] = useState("Tümü");
    const [selectedJobType, setSelectedJobType] = useState("Tümü");

    useEffect(() => {
        // Get user for application check
        supabase.auth.getUser().then(({ data: { user } }) => setCurrentUser(user));
    }, []);

    useEffect(() => {
        fetchJobs();
    }, [searchTerm, selectedCategory, selectedJobType, currentUser]);

    const fetchJobs = async () => {
        setLoading(true);
        try {
            let query = supabase
                .from("jobs")
                .select(`
                  *,
                  profiles:creator_id(full_name, avatar_url),
                  applications:applications(count),
                  my_application:applications!inner(id)
                `, { count: 'exact', head: false })
            // Note: The specific filtering for "my_application" needs a separate approach or clever join
            // Supabase generic query for "all jobs" + "did I apply?" is tricky in one go without filtering OUT jobs I didn't apply to.
            // So we will use a simpler approach: Fetch jobs, then fetch my applications IDs.

            // REVISED QUERY: Just fetch jobs and total application count
            let jobQuery = supabase
                .from("jobs")
                .select(`
                    *,
                    profiles:creator_id(full_name, avatar_url),
                    applications(count)
                `)
                .eq("status", "approved")
                .order("created_at", { ascending: false });

            if (searchTerm) jobQuery = jobQuery.ilike("title", `%${searchTerm}%`);
            if (selectedCategory !== "Tümü") jobQuery = jobQuery.eq("category", selectedCategory);
            if (selectedJobType !== "Tümü") jobQuery = jobQuery.eq("job_type", selectedJobType);

            const { data: jobsData, error } = await jobQuery;
            if (error) throw error;

            // Process Jobs
            let processedJobs: Job[] = (jobsData as any[]).map(j => ({
                ...j,
                application_count: j.applications?.[0]?.count || 0,
                has_applied: false // default
            }));

            // Check if user applied
            if (currentUser) {
                const { data: myApps } = await supabase
                    .from("applications")
                    .select("job_id")
                    .eq("applicant_id", currentUser.id);

                const myAppliedJobIds = new Set(myApps?.map(a => a.job_id));
                processedJobs = processedJobs.map(j => ({
                    ...j,
                    has_applied: myAppliedJobIds.has(j.id)
                }));
            }

            setJobs(processedJobs);
        } catch (error) {
            console.error("İlanlar çekilirken hata:", error);
        } finally {
            setLoading(false);
        }
    };

    const categories = ["Tümü", "Yazılım", "Tasarım", "Pazarlama", "Video", "Veri", "Siber Güvenlik", "Oyun", "Yönetim", "Diğer"];
    const jobTypes = ["Tümü", "Tam Zamanlı", "Yarı Zamanlı", "Proje Bazlı", "Stajyer"];

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 font-sans text-gray-900 dark:text-gray-100">
            {/* Keeping Header logic... just replacing loading indicators inside main content */}

            {/* HEADER */}
            <header className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <Link href="/" className="text-2xl font-black tracking-tight flex items-center gap-1">
                        Net-Work<span className="text-blue-600">.</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/yeni-ilan" className="hidden md:flex bg-blue-600 text-white px-5 py-2.5 rounded-lg text-sm font-bold hover:bg-blue-700 transition-colors">
                            İlan Ver
                        </Link>
                    </div>
                </div>
            </header>

            <div className="max-w-7xl mx-auto px-6 py-10">
                <div className="flex flex-col lg:flex-row gap-10">

                    {/* FİLTRE PANELİ (SOL) */}
                    <aside className="w-full lg:w-72 flex-shrink-0 space-y-8">
                        {/* Back to Home Link */}
                        <div className="lg:hidden mb-4">
                            <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors">
                                <ArrowLeft className="w-4 h-4" />
                                Ana Sayfaya Dön
                            </Link>
                        </div>

                        {/* Arama */}
                        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <Search className="w-5 h-5 text-blue-600" />
                                Ara
                            </h3>
                            <input
                                type="text"
                                placeholder="Pozisyon adı, kelime..."
                                className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500 transition-all text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>

                        {/* Kategoriler */}
                        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <FilterIcon className="w-5 h-5 text-purple-600" />
                                Kategoriler
                            </h3>
                            <div className="space-y-2">
                                {categories.map(cat => (
                                    <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${selectedCategory === cat ? 'border-blue-600' : 'border-gray-300 dark:border-zinc-700 group-hover:border-blue-400'}`}>
                                            {selectedCategory === cat && <div className="w-2.5 h-2.5 bg-blue-600 rounded-full" />}
                                        </div>
                                        <input
                                            type="radio"
                                            name="category"
                                            className="hidden"
                                            checked={selectedCategory === cat}
                                            onChange={() => setSelectedCategory(cat)}
                                        />
                                        <span className={`text-sm ${selectedCategory === cat ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400 group-hover:text-gray-900 dark:group-hover:text-gray-200'}`}>
                                            {cat}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Çalışma Şekli */}
                        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl border border-gray-200 dark:border-zinc-800 shadow-sm">
                            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-emerald-600" />
                                Çalışma Şekli
                            </h3>
                            <div className="space-y-2">
                                {jobTypes.map(type => (
                                    <label key={type} className="flex items-center gap-3 cursor-pointer group">
                                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-all ${selectedJobType === type ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-gray-300 dark:border-zinc-700'}`}>
                                            {selectedJobType === type && <CheckIcon className="w-3 h-3" />}
                                        </div>
                                        <input
                                            type="radio"
                                            name="jobType"
                                            className="hidden"
                                            checked={selectedJobType === type}
                                            onChange={() => setSelectedJobType(type)}
                                        />
                                        <span className={`text-sm ${selectedJobType === type ? 'font-bold text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                                            {type}
                                        </span>
                                    </label>
                                ))}
                            </div>
                        </div>

                    </aside>

                    {/* İLAN LİSTESİ (SAĞ) */}
                    <main className="flex-1">
                        <SmartJobMatcher />
                        <div className="hidden lg:block mb-4">
                            <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors">
                                <ArrowLeft className="w-4 h-4" />
                                Ana Sayfaya Dön
                            </Link>
                        </div>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold">
                                {loading ? 'Yükleniyor...' : `${jobs.length} İlan Bulundu`}
                            </h2>
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <span>Sıralama:</span>
                                <span className="font-bold text-gray-900 dark:text-white cursor-pointer flex items-center">
                                    En Yeniler <ChevronDown className="w-4 h-4" />
                                </span>
                            </div>
                        </div>

                        {loading ? (
                            <div className="min-h-[400px] flex items-center justify-center">
                                <LoadingFacts />
                            </div>
                        ) : jobs.length === 0 ? (
                            <div className="bg-white dark:bg-zinc-900 rounded-2xl p-12 text-center border border-gray-200 dark:border-zinc-800">
                                <div className="w-16 h-16 bg-gray-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🔍</div>
                                <h3 className="text-lg font-bold mb-2">Sonuç Bulunamadı</h3>
                                <p className="text-gray-500">Arama kriterlerinizi değiştirerek tekrar deneyiniz.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {jobs.map(job => (
                                    <Link href={`/ilan/${job.id}`} key={job.id} className="block group">
                                        <div className={`bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-6 hover:shadow-lg hover:border-blue-500/30 transition-all cursor-pointer relative overflow-hidden ${job.is_filled ? 'opacity-60' : ''}`}>
                                            <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">

                                                {/* Avatar / Logo */}
                                                <div className="w-16 h-16 rounded-xl bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-xl font-bold text-gray-400 flex-shrink-0 overflow-hidden">
                                                    {job.images && job.images.length > 0 ? (
                                                        <img src={job.images[0]} alt={job.title} className="w-full h-full object-cover" />
                                                    ) : (
                                                        job.profiles?.full_name?.charAt(0) || 'N'
                                                    )}
                                                </div>

                                                {/* İçerik */}
                                                <div className="flex-1 space-y-2">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-md">
                                                            {job.category?.toUpperCase()}
                                                        </span>
                                                        {/* SMART BADGES */}
                                                        {job.has_applied ? (
                                                            <span className="text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-2 py-0.5 rounded-md flex items-center gap-1">
                                                                BAŞVURULDU ✓
                                                            </span>
                                                        ) : job.application_count === 0 ? (
                                                            <span className="text-xs font-bold bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-md animate-pulse">
                                                                İLK BAŞVURAN SEN OL! 🚀
                                                            </span>
                                                        ) : (
                                                            <span className="text-xs font-medium text-gray-500 bg-gray-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                                                                {job.application_count} Başvuru
                                                            </span>
                                                        )}

                                                        {job.urgency === 'urgent' && (
                                                            <span className="text-xs font-black bg-red-600 text-white px-2 py-0.5 rounded-md animate-pulse">
                                                                ACİL
                                                            </span>
                                                        )}
                                                    </div>

                                                    <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-blue-600 transition-colors">
                                                        {job.title}
                                                    </h3>

                                                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                                                        <span className="flex items-center gap-1">
                                                            <Briefcase className="w-4 h-4" />
                                                            {job.profiles?.full_name || 'Gizli İşveren'}
                                                        </span>
                                                        {job.salary_range && (
                                                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                                                                <Banknote className="w-4 h-4" />
                                                                {job.salary_range}
                                                            </span>
                                                        )}
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-4 h-4" />
                                                            {new Date(job.created_at).toLocaleDateString('tr-TR')}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Action Arrow (Desktop) */}
                                                <div className="hidden md:flex items-center justify-center w-10 h-10 rounded-full bg-gray-50 dark:bg-zinc-800 group-hover:bg-blue-600 group-hover:text-white transition-all transform group-hover:translate-x-1">
                                                    <ChevronDown className="w-5 h-5 -rotate-90" />
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}

                    </main>

                </div>
            </div>
        </div>
    );
}

export default function JobListingPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><LoadingFacts /></div>}>
            <JobListingContent />
        </Suspense>
    );
}


function CheckIcon({ className }: { className?: string }) {
    return (
        <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
        </svg>
    );
}
