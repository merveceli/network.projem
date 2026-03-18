"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Send, AlertCircle, Briefcase, Flag, Loader2, ChevronRight, LayoutGrid } from "lucide-react";
import { Filter } from 'bad-words';
import ReportModal from "@/components/ReportModal";
import { useToast } from "@/contexts/ToastContext";
import { getJobById, checkApplicationStatus, applyToJob, toggleJobFilledAction } from "../actions";

// --- TİPLER ---
interface Job {
    id: string;
    title: string;
    description: string;
    salary_range: string;
    creator_id: string;
    is_filled: boolean;
    urgency: 'normal' | 'urgent';
    images: string[];
    creator_name: string | null;
}

export default function JobDetailPage() {
    const { data: session, status } = useSession();
    const { id } = useParams();
    const router = useRouter();
    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);

    // Application State
    const [message, setMessage] = useState("");
    const [applying, setApplying] = useState(false);
    const [applied, setApplied] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [togglingFilled, setTogglingFilled] = useState(false);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const { success: toastSuccess, error: toastError } = useToast();

    useEffect(() => {
        async function loadJobData() {
            if (!id) return;
            const jobData = await getJobById(id as string);
            
            if (jobData) {
                setJob(jobData as unknown as Job);
                if (session?.user?.id === (jobData as any).creator_id) {
                    setIsOwner(true);
                }

                const hasApplied = await checkApplicationStatus(id as string);
                setApplied(hasApplied);
            }
            setLoading(false);
        }

        if (status !== 'loading') {
            loadJobData();
        }
    }, [id, session, status]);

    const handleToggleFilled = async () => {
        if (!job || !isOwner) return;

        setTogglingFilled(true);
        const { success, error } = await toggleJobFilledAction(job.id, !job.is_filled);

        if (success) {
            setJob({ ...job, is_filled: !job.is_filled });
            toastSuccess(job.is_filled ? "İlan aktifleştirildi." : "İş verildi olarak işaretlendi.");
        } else {
            toastError(error || "Durum güncellenirken hata oluştu.");
        }
        setTogglingFilled(false);
    };

    const handleApply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (status === 'unauthenticated') {
            toastError("Başvuru yapmak için giriş yapmalısınız.");
            router.push("/login");
            return;
        }
        if (!job || !id) return;

        // PROFANITY FILTER CHECK
        const filter = new Filter();
        if (filter.isProfane(message)) {
            toastError("Mesajınızda uygunsuz ifadeler bulundu.");
            return;
        }

        setApplying(true);
        const { success, error } = await applyToJob(id as string, message);

        if (success) {
            setApplied(true);
            setMessage("");
            toastSuccess("Başvurunuz başarıyla gönderildi! ✨");
        } else {
            toastError(error || "Başvuru sırasında bir hata oluştu.");
        }
        setApplying(false);
    };

    if (loading || status === 'loading') return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
            <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
        </div>
    );

    if (!job) return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#F8FAFC] text-center p-8">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-8">
                <AlertCircle className="w-10 h-10 text-red-500" />
            </div>
            <h2 className="text-4xl font-black uppercase italic tracking-tighter mb-4">İlan Bulunamadı</h2>
            <Link href="/ilanlar" className="px-8 py-3 bg-blue-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest no-underline">İLANLARA DÖN</Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-8 font-sans selection:bg-blue-500/30">
            <div className="max-w-4xl w-full bg-white rounded-[60px] shadow-2xl shadow-slate-200/50 border border-gray-100 p-12 md:p-20 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-20 opacity-[0.03] pointer-events-none">
                    <LayoutGrid className="w-96 h-96" />
                </div>

                <div className="flex justify-between items-center mb-16 relative z-10">
                    <Link href="/ilanlar" className="flex items-center gap-3 px-6 py-3 bg-slate-50 hover:bg-slate-100 rounded-full text-[10px] font-black uppercase tracking-widest transition-all text-slate-400 no-underline">
                        <ArrowLeft className="w-4 h-4" />
                        İLANA DÖN
                    </Link>

                    {!isOwner && (
                        <button
                            onClick={() => setIsReportModalOpen(true)}
                            className="flex items-center gap-3 text-[10px] font-black text-slate-400 hover:text-red-500 transition-all uppercase tracking-widest"
                        >
                            <Flag className="w-4 h-4" />
                            İLAN ŞİKAYET
                        </button>
                    )}
                </div>

                <div className="relative z-10">
                    <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-8 mb-12">
                        <div className="flex-1 text-center md:text-left">
                            <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter uppercase italic leading-[0.9] mb-6">{job.title}</h1>
                            
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                {job.is_filled && (
                                    <span className="bg-green-500 text-white text-[10px] font-black px-6 py-2 rounded-full uppercase tracking-widest shadow-lg shadow-green-500/20">
                                        TAMAMLANDI ✓
                                    </span>
                                )}
                                {job.urgency === 'urgent' && (
                                    <span className="bg-red-600 text-white text-[10px] font-black px-6 py-2 rounded-full animate-pulse shadow-lg shadow-red-600/20 tracking-widest uppercase">
                                        ACİL İLAN
                                    </span>
                                )}
                                <span className="bg-slate-100 text-slate-600 text-[10px] font-black px-6 py-2 rounded-full tracking-widest uppercase">
                                    <Briefcase className="w-3 h-3 inline mr-2" /> {job.salary_range}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Image Gallery */}
                    {job.images && job.images.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
                            {job.images.map((img, idx) => (
                                <div key={idx} className="relative aspect-[4/3] rounded-[40px] overflow-hidden border-8 border-slate-50 shadow-xl group">
                                    <img src={img} alt={`Job detail ${idx + 1}`} className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-700" />
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="bg-slate-50 p-12 rounded-[48px] mb-16 border border-gray-100">
                        <p className="text-slate-600 text-xl leading-relaxed font-medium whitespace-pre-wrap">{job.description}</p>
                    </div>

                    <Link
                        href={`/profil/employer/${job.creator_id}`}
                        className="bg-white p-8 rounded-[40px] mb-16 flex items-center justify-between border-2 border-slate-50 hover:border-blue-500/20 hover:bg-slate-50 transition-all no-underline text-inherit group shadow-sm"
                    >
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-blue-600 rounded-[24px] flex items-center justify-center text-white font-black text-2xl group-hover:scale-105 transition-transform uppercase italic">
                                {job.creator_name?.charAt(0) || "İ"}
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">PROJE SAHİBİ</p>
                                <p className="font-black text-slate-900 text-xl tracking-tighter uppercase italic">{job.creator_name || "GİZLİ KULLANICI"}</p>
                            </div>
                        </div>
                        <ChevronRight className="w-6 h-6 text-slate-300 group-hover:text-blue-600 transition-all group-hover:translate-x-2" />
                    </Link>
                </div>

                <div className="border-t-4 border-dashed border-slate-100 pt-16 relative z-10">
                    {isOwner ? (
                        <div className="bg-blue-600 p-12 rounded-[56px] text-center shadow-2xl shadow-blue-500/30 text-white">
                            <h3 className="text-3xl font-black mb-4 uppercase italic tracking-tighter">BU İLAN SİZE AİT</h3>
                            <p className="text-blue-100 font-bold uppercase tracking-widest text-xs mb-10 opacity-80">Gelen başvuruları yönetim panelinden takip edebilirsiniz.</p>

                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <Link
                                    href="/basvurular"
                                    className="bg-white text-blue-600 font-black py-5 px-10 rounded-[28px] text-[10px] uppercase tracking-widest no-underline hover:scale-105 transition-all shadow-xl"
                                >
                                    BAŞVURULARI İNCELE
                                </Link>

                                <button
                                    onClick={handleToggleFilled}
                                    disabled={togglingFilled}
                                    className={`py-5 px-10 rounded-[28px] font-black text-[10px] uppercase tracking-widest transition-all border-2 ${job.is_filled
                                        ? 'bg-blue-700 border-blue-800 text-blue-300'
                                        : 'bg-transparent border-white text-white hover:bg-white/10'
                                        } disabled:opacity-50`}
                                >
                                    {togglingFilled ? 'GÜNCELLENİYOR...' : (job.is_filled ? 'İLANİ AKTİFLEŞTİR' : 'İŞ VERİLDİ YAP')}
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="max-w-3xl mx-auto">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-10 border-l-4 border-blue-600 pl-6">BAŞVURU FORMU</h3>

                            {applied ? (
                                <div className="bg-green-50 p-12 rounded-[56px] text-center border-4 border-dashed border-green-200 animate-in zoom-in duration-500">
                                    <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-8 text-white shadow-xl shadow-green-500/20">
                                        <CheckCircle2 className="w-10 h-10" />
                                    </div>
                                    <h4 className="font-black text-green-900 text-3xl mb-4 italic tracking-tighter uppercase">BAŞVURU TAMAM</h4>
                                    <p className="text-green-600 font-bold text-xs uppercase tracking-widest mb-10">İlan sahibi başvurunuzu değerlendiriyor.</p>
                                    <Link href="/ilanlar" className="text-[10px] font-black text-green-700 hover:text-green-800 uppercase tracking-widest no-underline group flex items-center justify-center gap-2">
                                        DİĞER İLANLAR <ChevronRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            ) : (
                                <form onSubmit={handleApply} className="space-y-6">
                                    <div className="relative group">
                                        <textarea
                                            className="w-full h-56 p-10 rounded-[48px] bg-slate-50 border-2 border-transparent focus:border-blue-600 outline-none resize-none text-slate-800 font-medium text-lg leading-relaxed transition-all"
                                            placeholder="Bu çalışma için neden en iyi adaysınız? Deneyimlerinizden kısaca bahsedin..."
                                            value={message}
                                            onChange={(e) => setMessage(e.target.value)}
                                            required
                                        />
                                        <div className="absolute bottom-10 center-x text-[10px] font-black text-slate-300 uppercase tracking-widest pointer-events-none">
                                            MESAJINIZI BURAYA YAZIN
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={applying}
                                        className="w-full bg-slate-900 hover:bg-black text-white font-black py-6 rounded-[32px] transition-all shadow-2xl hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-4 disabled:opacity-50 text-[10px] uppercase tracking-[0.3em] group"
                                    >
                                        {applying ? (
                                            <span className="flex items-center gap-3">
                                                <Loader2 className="w-5 h-5 animate-spin" />
                                                GÖNDERİLİYOR...
                                            </span>
                                        ) : (
                                            <>
                                                BAŞVURUYU TAMAMLA
                                                <Send className="w-5 h-5 group-hover:translate-x-2 transition-transform" />
                                            </>
                                        )}
                                    </button>
                                </form>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Report Modal */}
            <ReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                targetType="job"
                targetId={job.id}
                targetTitle={job.title}
            />
        </div>
    );
}