'use client';

import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, Star, Clock, Zap, Github, Linkedin,
    Globe, Mail, Phone, ChevronRight, CheckCircle2, Play,
    Edit2, Plus, X, Save, Trash2, Home, Flag, FileText, Shield, ShieldAlert, Zap as ZapIcon, MessageSquare, Loader2
} from 'lucide-react';
import Link from 'next/link';
import ReportModal from '@/components/ReportModal';
import { getProfileById, updateProfileGeneric } from '../../actions';
import { fetchProfileComments, submitProfileComment } from '../../actions-comments';

// --- TİP TANIMLAMALARI ---
interface ServicePackage {
    id: string;
    name: string;
    price: string;
    duration: string;
    features: string[];
    color: string;
    popular?: boolean;
}

interface ProjectData {
    id: string;
    title: string;
    category: string;
    description: string;
    technologies: string[];
    imageUrl: string;
    demoUrl?: string;
}

interface ProfileData {
    id: string;
    full_name: string;
    title: string;
    location: string;
    hourly_rate: string;
    bio: string;
    email: string;
    phone: string;
    availability: string;
    video_url?: string | null;
    video_status?: string;
    cv_url?: string | null;
    is_secure?: boolean;
    is_suspicious?: boolean;
    fast_responder?: boolean;
    services: ServicePackage[];
    portfolio: ProjectData[];
    skills: { name: string, level: number, icon: string }[];
}

interface Comment {
    id: string;
    author_id: string;
    content: string;
    created_at: string;
    author_name: string;
}

const DEFAULT_PACKAGES: ServicePackage[] = [
    { id: '1', name: "Landing Page", price: "$500", duration: "3 Günde Teslim", features: ["Tek Sayfa Tasarım", "SEO Uyumlu", "Hızlı Yükleme", "Mobil Uyumlu"], color: "from-blue-500 to-cyan-400" },
    { id: '2', name: "Kurumsal Web", price: "$1,200", duration: "10 Günde Teslim", features: ["5 Sayfaya Kadar", "Admin Paneli", "Blog Sistemi", "Gelişmiş SEO"], color: "from-purple-500 to-pink-500", popular: true },
    { id: '3', name: "E-Ticaret", price: "$2,500", duration: "20 Günde Teslim", features: ["Ödeme Sistemleri", "Ürün Yönetimi", "Sipariş Takibi", "Kargo Entegrasyonu"], color: "from-amber-500 to-orange-500" }
];

const DEFAULT_PROJECTS: ProjectData[] = [
    { id: '1', title: "Fintech Dashboard", category: "UI/UX", description: "Modern finansal analiz arayüzü.", technologies: ["React", "Chart.js"], imageUrl: "gradient-to-br from-slate-800 to-slate-900" },
    { id: '2', title: "Yoga App", category: "Mobile", description: "Kişisel sağlık ve yoga takip uygulaması.", technologies: ["Flutter", "Firebase"], imageUrl: "gradient-to-br from-rose-900 to-slate-900" },
];

const GLASS_CARD_CLASS = "bg-white/[0.03] border border-white/[0.05] backdrop-blur-md rounded-[40px]";

const GlassCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`${GLASS_CARD_CLASS} ${className}`}>
        {children}
    </div>
);

export default function FreelancerPublicProfile() {
    const { data: session, status } = useSession();
    const params = useParams();
    const router = useRouter();
    const profileId = params.id as string;

    const [loading, setLoading] = useState(true);
    const [isEditingMode, setIsEditingMode] = useState(false);
    const [isOwner, setIsOwner] = useState(false);

    const [profile, setProfile] = useState<ProfileData>({
        id: '', full_name: '', title: '', location: '', hourly_rate: '',
        bio: '', email: '', phone: '', availability: '', video_url: null,
        services: [], portfolio: [], skills: []
    });

    const [isVideoOpen, setIsVideoOpen] = useState(false);
    const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    useEffect(() => {
        const loadProfile = async () => {
            if (!profileId) return;

            try {
                const data = await getProfileById(profileId);
                
                if (!data) {
                    console.error("Profile not found");
                    setLoading(false);
                    return;
                }

                if (session?.user?.id === profileId) {
                    setIsOwner(true);
                }

                setProfile({
                    id: data.id,
                    full_name: data.full_name || 'İsimsiz Kullanıcı',
                    title: data.title || 'Freelancer',
                    location: data.location || 'Dünya Geneli',
                    hourly_rate: data.hourly_rate || '$0',
                    bio: data.bio || '',
                    email: data.email || '',
                    phone: data.phone || '',
                    availability: data.availability || 'Müsait',
                    video_url: data.video_url,
                    video_status: data.video_status,
                    cv_url: data.cv_url,
                    is_secure: data.is_secure,
                    is_suspicious: data.is_suspicious,
                    fast_responder: data.fast_responder,
                    services: data.services?.length ? data.services : DEFAULT_PACKAGES,
                    portfolio: data.portfolio?.length ? data.portfolio : DEFAULT_PROJECTS,
                    skills: data.skills?.length ? data.skills : []
                });

                // Load comments
                const { data: commentsData } = await fetchProfileComments(profileId);
                if (commentsData) setComments(commentsData as unknown as Comment[]);
            } catch (error) {
                console.error("Error loading profile:", error);
            } finally {
                setLoading(false);
            }
        };

        if (status !== 'loading') {
            loadProfile();
        }
    }, [profileId, session, status]);

    const handleBatchSave = async () => {
        if (!isOwner) return;
        try {
            await updateProfileGeneric({
                full_name: profile.full_name,
                title: profile.title,
                location: profile.location,
                hourly_rate: profile.hourly_rate,
                bio: profile.bio,
                services: profile.services as any,
                portfolio: profile.portfolio as any,
                skills: profile.skills as any,
            });

            setIsEditingMode(false);
            alert("Profil güncellendi! 🎉");
        } catch (e: any) {
            console.error(e);
            alert("Hata oluştu: " + e.message);
        }
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!session?.user?.id || !newComment.trim()) return;

        setIsSubmittingComment(true);
        try {
            const { success, error } = await submitProfileComment(profileId, newComment.trim());

            if (!success) throw new Error(error);
            alert("Yorumunuz gönderildi! Admin onayından sonra yayınlanacaktır. ✨");
            setNewComment("");
        } catch (e: any) {
            alert("Hata: " + e.message);
        } finally {
            setIsSubmittingComment(false);
        }
    };

    if (loading || status === 'loading') return (
        <div className="min-h-screen bg-[#050510] flex items-center justify-center text-white">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!profile.id) return (
        <div className="min-h-screen bg-[#050510] flex items-center justify-center text-white flex-col gap-6">
            <h2 className="text-4xl font-black uppercase italic tracking-tighter">Profil Bulunamadı</h2>
            <Link href="/" className="px-8 py-3 bg-blue-600 rounded-full text-[10px] font-black tracking-widest uppercase no-underline text-white">Ana Sayfaya Dön</Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#050510] text-slate-200 font-sans selection:bg-blue-500/30">
            {/* Top Toolbar */}
            <div className="fixed top-8 left-8 z-[60] flex items-center gap-4">
                <Link href="/" className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 backdrop-blur-xl rounded-full text-[10px] font-black tracking-widest transition-all group no-underline text-slate-300 uppercase">
                    <Home className="w-4 h-4 group-hover:text-blue-500 transition-colors" />
                    <span>ANA SAYFA</span>
                </Link>

                {!isOwner && (
                    <button
                        onClick={() => setIsReportModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 backdrop-blur-xl rounded-full text-[10px] font-black tracking-widest transition-all text-slate-400 hover:text-red-400 uppercase"
                    >
                        <Flag className="w-4 h-4" />
                        BİLDİR
                    </button>
                )}
            </div>

            {isOwner && (
                <div className="fixed bottom-12 right-12 z-50">
                    <button
                        onClick={() => isEditingMode ? handleBatchSave() : setIsEditingMode(true)}
                        className={`flex items-center gap-3 px-10 py-5 rounded-[24px] font-black text-[10px] uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 ${isEditingMode ? 'bg-green-500 text-white shadow-green-500/20' : 'bg-blue-600 text-white shadow-blue-500/20 hover:bg-blue-700'}`}
                    >
                        {isEditingMode ? <><Save className="w-5 h-5" /> KAYDET</> : <><Edit2 className="w-5 h-5" /> DÜZENLE</>}
                    </button>
                </div>
            )}

            <main className="relative max-w-7xl mx-auto px-8 py-32 grid grid-cols-1 lg:grid-cols-12 gap-16">
                <aside className="lg:col-span-4 lg:sticky lg:top-32 h-fit space-y-8">
                    <GlassCard className="p-10 text-center relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 via-purple-600 to-blue-600 opacity-50" />
                        
                        <div className="relative inline-block mb-8" onClick={() => profile.video_url && setIsVideoOpen(true)}>
                            <div className="relative w-48 h-48 rounded-[60px] bg-slate-900 border-8 border-[#050510] overflow-hidden flex items-center justify-center cursor-pointer shadow-2xl group-hover:scale-105 transition-transform duration-500">
                                {profile.video_url ? (
                                    <video src={profile.video_url} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-6xl grayscale group-hover:grayscale-0 transition-all">👤</span>
                                )}
                                {profile.video_url && <Play className="absolute w-12 h-12 text-white opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600/50 p-3 rounded-full backdrop-blur-md" />}
                            </div>
                        </div>

                        {isEditingMode ? (
                            <input className="bg-white/5 border border-white/10 p-4 rounded-2xl w-full text-center font-black text-xl uppercase italic tracking-tighter mb-4 outline-none focus:border-blue-600" value={profile.full_name} onChange={e => setProfile({ ...profile, full_name: e.target.value })} />
                        ) : (
                            <div className="flex flex-col items-center gap-4 mb-4">
                                <h1 className="text-4xl font-black uppercase italic tracking-tighter leading-none">{profile.full_name}</h1>
                                <div className="flex gap-2 flex-wrap justify-center">
                                    {profile.is_secure && (
                                        <span className="flex items-center gap-2 bg-green-500/10 text-green-500 text-[10px] font-black px-4 py-1.5 rounded-full border border-green-500/20 tracking-widest uppercase">
                                            <Shield className="w-3 h-3" /> GÜVENLİ
                                        </span>
                                    )}
                                    {profile.is_suspicious && (
                                        <span className="flex items-center gap-2 bg-red-500/10 text-red-500 text-[10px] font-black px-4 py-1.5 rounded-full border border-red-500/20 tracking-widest uppercase">
                                            <ShieldAlert className="w-3 h-3" /> ŞÜPHELİ
                                        </span>
                                    )}
                                    {profile.fast_responder && (
                                        <span className="flex items-center gap-2 bg-blue-500/10 text-blue-500 text-[10px] font-black px-4 py-1.5 rounded-full border border-blue-500/20 tracking-widest uppercase">
                                            <Zap className="w-3 h-3" /> HIZLI CEVAP
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        <p className="text-blue-400 font-black text-xs uppercase tracking-[0.2em] mb-10 flex items-center justify-center gap-3">
                            <ZapIcon className="w-4 h-4" /> {profile.title}
                        </p>

                        <div className="flex flex-col gap-4">
                            {!isOwner && (
                                <button className="w-full py-5 rounded-2xl bg-blue-600 text-white font-black text-[10px] uppercase tracking-[0.3em] hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95">
                                    MESAJ GÖNDER
                                </button>
                            )}

                            {profile.cv_url && (
                                <a
                                    href={profile.cv_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-5 rounded-2xl bg-white/5 border border-white/10 font-black text-slate-300 text-[10px] uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-3 no-underline"
                                >
                                    <FileText className="w-5 h-5" /> CV İNCELE (PDF)
                                </a>
                            )}
                        </div>
                    </GlassCard>

                    <GlassCard className="p-8">
                        <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-6">Detaylar</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">LOKASYON</span>
                                <span className="text-xs font-black uppercase tracking-widest flex items-center gap-2"><MapPin className="w-3 h-3 text-blue-500" /> {profile.location}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">SAATLİK ÜCRET</span>
                                <span className="text-xs font-black uppercase tracking-widest text-blue-400">{profile.hourly_rate}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">DURUM</span>
                                <span className="text-[10px] font-black px-2 py-0.5 bg-green-500/20 text-green-500 rounded-full">{profile.availability}</span>
                            </div>
                        </div>
                    </GlassCard>
                </aside>

                <div className="lg:col-span-8 space-y-20">
                    <section>
                        <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-10 flex items-center gap-4">
                            <div className="h-1 w-12 bg-blue-600 rounded-full" />
                            HAKKIMDA
                        </h2>
                        <GlassCard className="p-12">
                            <p className="text-slate-300 text-lg leading-relaxed font-medium whitespace-pre-wrap opacity-80">{profile.bio || "Henüz bir açıklama eklenmemiş."}</p>
                        </GlassCard>
                    </section>

                    <section>
                        <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-10 flex items-center gap-4">
                            <div className="h-1 w-12 bg-blue-600 rounded-full" />
                            PORTFOLYO
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            {profile.portfolio.map(project => (
                                <motion.div 
                                    key={project.id} 
                                    whileHover={{ y: -10 }} 
                                    className="group relative h-80 rounded-[48px] overflow-hidden border border-white/5 bg-[#101018] cursor-pointer shadow-2xl" 
                                    onClick={() => setSelectedProject(project)}
                                >
                                    <div className={`absolute inset-0 bg-${project.imageUrl} bg-cover bg-center transition-transform duration-700 group-hover:scale-110`} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-[#050510] via-transparent to-transparent p-10 flex flex-col justify-end">
                                        <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2">{project.category}</p>
                                            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">{project.title}</h3>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-10 flex items-center gap-4">
                            <div className="h-1 w-12 bg-blue-600 rounded-full" />
                            HİZMET PAKETLERİ
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {profile.services.map(pkg => (
                                <GlassCard key={pkg.id} className="p-10 flex flex-col group relative overflow-hidden">
                                    <div className="absolute -top-12 -right-12 w-24 h-24 bg-blue-600/10 blur-3xl group-hover:bg-blue-600/20 transition-all rounded-full" />
                                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">{pkg.name}</h3>
                                    <div className="text-4xl font-black text-white mb-8 tracking-tighter uppercase italic">{pkg.price}</div>
                                    <ul className="space-y-4 mb-10 flex-1">
                                        {pkg.features.map((f, i) => (
                                            <li key={i} className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex gap-3">
                                                <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" /> {f}
                                            </li>
                                        ))}
                                    </ul>
                                    <button className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-300 hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all">
                                        PAKETİ SEÇ
                                    </button>
                                </GlassCard>
                            ))}
                        </div>
                    </section>

                    <section>
                        <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em] mb-10 flex items-center gap-4">
                            <div className="h-1 w-12 bg-blue-600 rounded-full" />
                            DEĞERLENDİRMELER ({comments.length})
                        </h2>

                        <div className="space-y-8">
                            {session?.user && !isOwner && (
                                <GlassCard className="p-10">
                                    <form onSubmit={handleCommentSubmit} className="space-y-6">
                                        <textarea
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            placeholder="Deneyimlerini paylaş..."
                                            className="w-full bg-white/5 border-2 border-transparent focus:border-blue-600 rounded-[32px] p-8 text-sm font-medium focus:bg-white/10 outline-none min-h-[160px] transition-all"
                                            required
                                        />
                                        <div className="flex justify-end">
                                            <button
                                                disabled={isSubmittingComment}
                                                className="px-10 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[24px] text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 shadow-2xl shadow-blue-500/20 active:scale-95 flex items-center gap-3"
                                            >
                                                {isSubmittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                                                YORUM YAP
                                            </button>
                                        </div>
                                    </form>
                                </GlassCard>
                            )}

                            <div className="grid grid-cols-1 gap-6">
                                {comments.length > 0 ? (
                                    comments.map(comment => (
                                        <GlassCard key={comment.id} className="p-10 relative group">
                                            <div className="absolute top-10 left-0 w-1 h-12 bg-blue-600 rounded-full opacity-50" />
                                            <div className="flex justify-between items-center mb-6">
                                                <div className="font-black text-xs uppercase tracking-[0.2em] text-white">{comment.author_name}</div>
                                                <div className="text-[10px] font-black text-slate-500 bg-white/5 px-4 py-1.5 rounded-full uppercase tracking-widest">
                                                    {new Date(comment.created_at).toLocaleDateString('tr-TR')}
                                                </div>
                                            </div>
                                            <p className="text-sm font-medium text-slate-400 leading-relaxed italic opacity-80">
                                                "{comment.content}"
                                            </p>
                                        </GlassCard>
                                    ))
                                ) : (
                                    <div className="text-center py-24 bg-white/5 rounded-[40px] border border-dashed border-white/10 opacity-30">
                                        <p className="text-xs font-black uppercase tracking-[0.4em] italic">Henüz değerlendirme yok</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                </div>
            </main>

            {/* Video & Project Modals */}
            <AnimatePresence>
                {selectedProject && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-[#050510]/95 backdrop-blur-xl p-8" onClick={() => setSelectedProject(null)}>
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} 
                            animate={{ scale: 1, opacity: 1 }} 
                            className="bg-[#101018] border border-white/10 rounded-[60px] max-w-4xl w-full p-16 shadow-2xl relative" 
                            onClick={e => e.stopPropagation()}
                        >
                            <button onClick={() => setSelectedProject(null)} className="absolute top-12 right-12 p-4 hover:bg-white/5 rounded-full transition-all">
                                <X className="w-6 h-6 text-slate-500" />
                            </button>
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] mb-4">{selectedProject.category}</p>
                            <h2 className="text-5xl font-black mb-10 uppercase italic tracking-tighter text-white">{selectedProject.title}</h2>
                            <p className="text-xl text-slate-400 font-medium mb-12 leading-relaxed">{selectedProject.description}</p>
                            
                            <div className="flex flex-wrap gap-3 mb-12">
                                {selectedProject.technologies.map(tech => (
                                    <span key={tech} className="px-6 py-2.5 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-300">
                                        {tech}
                                    </span>
                                ))}
                            </div>

                            <button className="w-full py-5 bg-blue-600 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-[24px] shadow-2xl shadow-blue-500/20" onClick={() => setSelectedProject(null)}>PENCEREYİ KAPAT</button>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Report Modal */}
            <ReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                targetType="profile"
                targetId={profileId}
                targetTitle={profile.full_name}
            />
        </div>
    );
}
