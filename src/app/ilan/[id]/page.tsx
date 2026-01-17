"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Send, AlertCircle, Briefcase, Flag } from "lucide-react";
import { Filter } from 'bad-words';
import ReportModal from "@/components/ReportModal";
import { useToast } from "@/contexts/ToastContext";

// --- TİPLER ---
interface Job {
    id: string;
    title: string;
    description: string;
    salary_range: string; // Add this field
    creator_id: string;
    is_filled: boolean;

    urgency: 'normal' | 'urgent';
    images: string[];
    profiles: {
        full_name: string | null;
    } | null;
}

export default function JobDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);

    // Application State
    const [message, setMessage] = useState("");
    const [applying, setApplying] = useState(false);
    const [applied, setApplied] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [currentUser, setCurrentUser] = useState<string | null>(null);
    const [alreadyAppliedOnLoad, setAlreadyAppliedOnLoad] = useState(false); // New state to distinguish
    const [togglingFilled, setTogglingFilled] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const { success, error: toastError, info } = useToast();

    useEffect(() => {
        async function getJobAndUserStatus() {
            // 1. Get current user
            const { data: { user } } = await supabase.auth.getUser();
            const userId = user ? user.id : null;
            setCurrentUser(userId);

            if (id) {
                // 2. Fetch Job Details
                const { data: jobData, error } = await supabase
                    .from("jobs")
                    .select(`id, title, description, salary_range, creator_id, is_filled, urgency, images, profiles:creator_id(full_name)`)
                    .eq("id", id)
                    .single();

                if (jobData) {
                    setJob(jobData as any);

                    // 3. Check if user is owner
                    if (userId && jobData.creator_id === userId) {
                        setIsOwner(true);
                    }

                    // 4. Check if user already applied
                    if (userId) {
                        const { data: applicationData } = await supabase
                            .from("applications")
                            .select("id")
                            .eq("job_id", id)
                            .eq("applicant_id", userId)
                            .single();

                        if (applicationData) {
                            setApplied(true);
                            setAlreadyAppliedOnLoad(true); // Set this flag if applied on load
                        }
                    }
                }
            }
            setLoading(false);
        }
        getJobAndUserStatus();
    }, [id]);

    const toggleFilledStatus = async () => {
        if (!job || !isOwner) return;

        setTogglingFilled(true);
        try {
            const { error } = await supabase
                .from("jobs")
                .update({ is_filled: !job.is_filled })
                .eq("id", job.id);

            if (error) throw error;

            // Update local state
            setJob({ ...job, is_filled: !job.is_filled });
        } catch (error: any) {
            alert("Durum güncellenirken hata oluştu: " + error.message);
        } finally {
            setTogglingFilled(false);
        }
    };

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) {
            alert("Başvuru yapmak için giriş yapmalısınız.");
            router.push("/login");
            return;
        }
        if (!job) return;

        // PROFANITY FILTER CHECK
        const filter = new Filter();
        if (filter.isProfane(message)) {
            alert("Mesajınızda uygunsuz ifadeler bulundu. Lütfen düzenleyip tekrar deneyiniz.");
            return;
        }

        setApplying(true);

        try {
            const { error } = await supabase
                .from("applications")
                .insert({
                    job_id: job.id,
                    applicant_id: currentUser,
                    message: message
                });

            if (error) throw error;

            setApplied(true);
            setAlreadyAppliedOnLoad(false); // Reset this if a new application is successfully sent
            setMessage("");
        } catch (error: any) {
            alert("Başvuru sırasında bir hata oluştu: " + error.message);
        } finally {
            setApplying(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
    );

    if (!job) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-zinc-950 text-center p-6">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">İlan Bulunamadı</h2>
            <Link href="/ilanlar" className="mt-4 text-blue-600 hover:underline">İlanlara Geri Dön</Link>
        </div>
    );

    // --- STRUCTURED DATA (JSON-LD) ---
    const jsonLd = job ? {
        '@context': 'https://schema.org',
        '@type': 'JobPosting',
        title: job.title,
        description: job.description,
        datePosted: new Date().toISOString(), // Aslında job.created_at olmalı ama dbden çekmedik, şimdilik böyle
        validThrough: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        employmentType: 'CONTRACTOR',
        hiringOrganization: {
            '@type': 'Organization',
            name: job.profiles?.full_name || 'Gizli İşveren',
            sameAs: 'https://net-work.com.tr'
        },
        jobLocation: {
            '@type': 'Place',
            address: {
                '@type': 'PostalAddress',
                addressCountry: 'TR'
            }
        },
        baseSalary: {
            '@type': 'MonetaryAmount',
            currency: 'TRY',
            value: {
                '@type': 'QuantitativeValue',
                value: 0, // Belirtilmemiş
                unitText: 'PROJECT'
            }
        }
    } : null;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center p-6 font-sans">
            {/* Structured Data injection */}
            {jsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
                />
            )}
            <div className="max-w-2xl w-full bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-gray-100 dark:border-zinc-800 p-8 md:p-12">

                <div className="flex justify-between items-center mb-8">
                    <Link href="/ilanlar" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        İlanlara Geri Dön
                    </Link>

                    {!isOwner && (
                        <button
                            onClick={() => setIsReportModalOpen(true)}
                            className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-red-500 transition-colors"
                        >
                            <Flag className="w-3.5 h-3.5" />
                            İlanı Şikayet Et
                        </button>
                    )}
                </div>

                <div>
                    <div className="flex items-center gap-3 mb-4">
                        <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white tracking-tight">{job.title}</h1>
                        {job.is_filled && (
                            <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs font-bold px-3 py-1.5 rounded-full border border-green-200 dark:border-green-800">
                                İş Verildi ✓
                            </span>
                        )}
                        {job.urgency === 'urgent' && (
                            <span className="bg-red-600 text-white text-xs font-black px-3 py-1.5 rounded-full animate-pulse shadow-red-500/50 shadow-lg">
                                ACİL
                            </span>
                        )}
                    </div>

                    {/* Image Gallery */}
                    {job.images && job.images.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                            {job.images.map((img, idx) => (
                                <div key={idx} className="relative aspect-video rounded-xl overflow-hidden border border-gray-100 dark:border-zinc-800 bg-gray-50 dark:bg-zinc-800">
                                    <img src={img} alt={`Job detail ${idx + 1}`} className="object-cover w-full h-full hover:scale-105 transition-transform duration-500" />
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex items-center gap-4 mb-6">
                        {job.salary_range && (
                            <div className={`px-4 py-2 rounded-xl border flex items-center gap-2 font-bold ${job.salary_range === 'Gönüllü'
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 dark:bg-indigo-900/30 dark:border-indigo-800 dark:text-indigo-300'
                                : 'bg-gray-100 border-gray-200 text-gray-700 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300'
                                }`}>
                                <Briefcase className="w-4 h-4" />
                                {job.salary_range === 'Gönüllü' ? 'Gönüllü / Ücretsiz Proje' : job.salary_range}
                            </div>
                        )}
                        <div className="px-4 py-2 rounded-xl bg-gray-100 border border-gray-200 text-gray-700 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 font-bold flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4" />
                            {job.urgency === 'urgent' ? 'Acil Başlangıç' : 'Normal Süreç'}
                        </div>
                    </div>

                    <p className="text-gray-600 dark:text-gray-400 mb-8 leading-relaxed text-lg">{job.description}</p>

                    <Link
                        href={`/profil/employer/${job.creator_id}`}
                        className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-2xl mb-10 flex items-center gap-4 border border-blue-100 dark:border-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/20 transition-all no-underline text-inherit group"
                    >
                        <div className="w-12 h-12 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center text-blue-600 dark:text-blue-200 font-bold text-xl group-hover:scale-110 transition-transform">
                            {job.profiles?.full_name?.charAt(0).toUpperCase() || "İ"}
                        </div>
                        <div>
                            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-0.5">İLAN VEREN</p>
                            <p className="font-bold text-gray-900 dark:text-white text-lg group-hover:text-blue-600 transition-colors">{job.profiles?.full_name || "Gizli Kullanıcı"}</p>
                        </div>
                    </Link>
                </div>

                <div className="border-t border-gray-100 dark:border-zinc-800 pt-10">

                    {isOwner ? (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-2xl p-8 text-center">
                            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-800 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600 dark:text-blue-300">
                                <Briefcase className="w-8 h-8" />
                            </div>
                            <h3 className="text-xl font-bold text-blue-900 dark:text-blue-100 mb-2">Bu İlan Size Ait</h3>
                            <p className="text-blue-700 dark:text-blue-300 mb-6">İlanınıza gelen başvuruları yönetim panelinden takip edebilirsiniz.</p>

                            <div className="flex flex-col gap-3">
                                <Link
                                    href="/basvurular"
                                    className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-lg shadow-blue-600/20"
                                >
                                    Gelen Başvuruları Gör
                                </Link>

                                <button
                                    onClick={toggleFilledStatus}
                                    disabled={togglingFilled}
                                    className={`inline-block font-bold py-3 px-8 rounded-xl transition-all ${job.is_filled
                                        ? 'bg-gray-200 dark:bg-zinc-800 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-zinc-700'
                                        : 'bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-600/20'
                                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                                >
                                    {togglingFilled ? 'Güncelleniyor...' : (job.is_filled ? 'İlanı Tekrar Aktifleştir' : 'İş Verildi Olarak İşaretle')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <>
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Başvuru Mesajınız</h3>

                            {applied ? (
                                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-8 text-center animate-in fade-in zoom-in duration-300">
                                    <div className="w-16 h-16 bg-green-100 dark:bg-green-800 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600 dark:text-green-300">
                                        <CheckCircle2 className="w-8 h-8" />
                                    </div>
                                    <h4 className="font-bold text-green-800 dark:text-green-200 text-xl mb-2">Başvurunuz Alındı</h4>
                                    <p className="text-green-600 dark:text-green-400">Daha önce bu ilana başvuru yaptınız. İlan sahibi başvurunuzu değerlendiriyor.</p>
                                    <Link href="/ilanlar" className="mt-6 inline-block text-sm font-bold text-green-700 dark:text-green-300 hover:underline">
                                        Diğer İlanlara Göz At
                                    </Link>
                                </div>
                            ) : (
                                <form onSubmit={handleApply} className="bg-gray-50 dark:bg-zinc-950/50 p-1 rounded-2xl border border-gray-200 dark:border-zinc-800">
                                    <textarea
                                        className="w-full h-40 p-5 rounded-xl bg-transparent border-none outline-none resize-none text-gray-900 dark:text-white placeholder:text-gray-400 text-lg leading-relaxed"
                                        placeholder="Merhaba, ben [Adınız]. Bu pozisyonla ilgileniyorum çünkü..."
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        required
                                    />

                                    <div className="px-4 pb-4">
                                        <button
                                            type="submit"
                                            disabled={applying}
                                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
                                        >
                                            {applying ? (
                                                <span className="flex items-center gap-2">
                                                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                                                    Gönderiliyor...
                                                </span>
                                            ) : (
                                                <>
                                                    Başvuruyu Gönder
                                                    <Send className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                                </>
                                            )}
                                        </button>
                                        <p className="text-center text-xs text-gray-400 mt-3">
                                            Küfür veya hakaret içeren mesajlar otomatik olarak engellenir.
                                        </p>
                                    </div>
                                </form>
                            )}
                        </>
                    )}
                </div>

            </div>
            {/* Report Modal */}
            {job && (
                <ReportModal
                    isOpen={isReportModalOpen}
                    onClose={() => setIsReportModalOpen(false)}
                    targetType="job"
                    targetId={job.id}
                    targetTitle={job.title}
                />
            )}
        </div>
    );
}