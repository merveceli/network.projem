'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, Star, Clock, Zap, Github, Linkedin,
    Globe, Mail, Phone, ChevronRight, CheckCircle2, Play,
    Edit2, Plus, X, Save, Trash2, Home, Flag, FileText, Shield, ShieldAlert, Zap as ZapIcon, MessageSquare
} from 'lucide-react';
import Link from 'next/link';
import ReportModal from '@/components/ReportModal';
import VideoUploader from '@/components/VideoUploader';

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
    profiles: { full_name: string };
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

const GLASS_CARD_CLASS = "bg-white/[0.03] border border-white/[0.05] backdrop-blur-md rounded-2xl";

const GlassCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`${GLASS_CARD_CLASS} ${className}`}>
        {children}
    </div>
);

export default function FreelancerPublicProfile() {
    const params = useParams();
    const router = useRouter();
    const profileId = params.id as string;

    const [viewerId, setViewerId] = useState<string | null>(null);
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
    const [editingProject, setEditingProject] = useState<ProjectData | null>(null);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);

    useEffect(() => {
        const loadProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setViewerId(user?.id || null);

            if (user?.id === profileId) {
                setIsOwner(true);
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', profileId)
                .single();

            if (error || !data) {
                console.error("Profile not found:", error);
                setLoading(false);
                return;
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
            const { data: commentsData } = await supabase
                .from('profile_comments')
                .select('id, author_id, content, created_at, profiles:author_id(full_name)')
                .eq('profile_id', profileId)
                .eq('status', 'approved')
                .order('created_at', { ascending: false });

            if (commentsData) setComments(commentsData as any);

            setLoading(false);
        };

        if (profileId) loadProfile();
    }, [profileId]);

    const handleBatchSave = async () => {
        if (!isOwner) return;
        try {
            const { error } = await supabase.from('profiles').update({
                full_name: profile.full_name,
                title: profile.title,
                location: profile.location,
                hourly_rate: profile.hourly_rate,
                bio: profile.bio,
                services: profile.services,
                portfolio: profile.portfolio,
                skills: profile.skills,
            }).eq('id', profileId);

            if (error) throw error;
            setIsEditingMode(false);
            alert("Profil güncellendi!");
        } catch (e) {
            console.error(e);
            alert("Hata oluştu.");
        }
    };

    const handleCommentSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!viewerId || !newComment.trim()) return;

        setIsSubmittingComment(true);
        try {
            const { error } = await supabase.from('profile_comments').insert({
                profile_id: profileId,
                author_id: viewerId,
                content: newComment.trim(),
                status: 'pending' // Admin must approve
            });

            if (error) throw error;
            alert("Yorumunuz gönderildi! Admin onayından sonra yayınlanacaktır.");
            setNewComment("");
        } catch (e: any) {
            alert("Hata: " + e.message);
        } finally {
            setIsSubmittingComment(false);
        }
    };

    if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">Yükleniyor...</div>;
    if (!profile.id) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white flex-col gap-4">
        <h2 className="text-2xl font-bold">Profil Bulunamadı</h2>
        <Link href="/" className="text-cyan-400">Ana Sayfaya Dön</Link>
    </div>;

    return (
        <div className="min-h-screen bg-[#0a0a0a] text-slate-200 font-sans selection:bg-purple-500/30">
            <div className="absolute top-6 left-6 z-50 flex items-center gap-3">
                <Link href="/" className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-sm font-medium transition-all group no-underline text-slate-300">
                    <Home className="w-4 h-4 group-hover:text-cyan-400 transition-colors" />
                    <span>Ana Sayfa</span>
                </Link>

                {!isOwner && (
                    <button
                        onClick={() => setIsReportModalOpen(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-red-500/10 border border-white/10 hover:border-red-500/20 rounded-full text-xs font-bold transition-all text-slate-400 hover:text-red-400"
                    >
                        <Flag className="w-3.5 h-3.5" />
                        Profili Bildir
                    </button>
                )}
            </div>

            {isOwner && (
                <div className="fixed bottom-8 right-8 z-40">
                    <button
                        onClick={() => isEditingMode ? handleBatchSave() : setIsEditingMode(true)}
                        className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold shadow-lg transition-all ${isEditingMode ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-cyan-500 hover:bg-cyan-600 text-black'}`}
                    >
                        {isEditingMode ? <><Save className="w-5 h-5" /> Kaydet</> : <><Edit2 className="w-5 h-5" /> Düzenle</>}
                    </button>
                </div>
            )}

            <main className="relative max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-8">
                <aside className="lg:col-span-4 lg:sticky lg:top-8 h-fit space-y-6">
                    <GlassCard className="p-8 text-center relative overflow-hidden group">
                        <div className="relative inline-block mb-6" onClick={() => profile.video_url && setIsVideoOpen(true)}>
                            <div className="relative w-32 h-32 rounded-full bg-slate-900 border-4 border-[#0a0a0a] overflow-hidden flex items-center justify-center cursor-pointer">
                                {profile.video_url ? (
                                    <video src={profile.video_url} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-4xl">👤</span>
                                )}
                                {profile.video_url && <Play className="absolute w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />}
                            </div>
                        </div>

                        {isEditingMode ? (
                            <input className="bg-white/10 p-2 rounded w-full text-center font-bold mb-2" value={profile.full_name} onChange={e => setProfile({ ...profile, full_name: e.target.value })} />
                        ) : (
                            <div className="flex flex-col items-center gap-2 mb-2">
                                <h1 className="text-3xl font-bold">{profile.full_name}</h1>
                                <div className="flex gap-2 flex-wrap justify-center">
                                    {profile.is_secure && (
                                        <span className="flex items-center gap-1 bg-green-500/10 text-green-500 text-[10px] font-bold px-2 py-1 rounded-full border border-green-500/20">
                                            <Shield className="w-3 h-3" /> GÜVENLİ
                                        </span>
                                    )}
                                    {profile.is_suspicious && (
                                        <span className="flex items-center gap-1 bg-red-500/10 text-red-500 text-[10px] font-bold px-2 py-1 rounded-full border border-red-500/20">
                                            <ShieldAlert className="w-3 h-3" /> ŞÜPHELİ
                                        </span>
                                    )}
                                    {profile.fast_responder && (
                                        <span className="flex items-center gap-1 bg-blue-500/10 text-blue-500 text-[10px] font-bold px-2 py-1 rounded-full border border-blue-500/20">
                                            <Zap className="w-3 h-3" /> HIZLI CEVAP
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}

                        <p className="text-cyan-400 font-medium mb-6 flex items-center justify-center gap-2"><ZapIcon className="w-4 h-4" /> {profile.title}</p>

                        <div className="flex flex-col gap-3">
                            {!isOwner && (
                                <button className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 font-bold hover:shadow-cyan-500/20 transition-all">
                                    İletişime Geç
                                </button>
                            )}

                            {profile.cv_url && (
                                <a
                                    href={profile.cv_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-4 rounded-xl bg-white/5 border border-white/10 font-bold text-slate-300 hover:bg-white/10 transition-all flex items-center justify-center gap-2 no-underline"
                                >
                                    <FileText className="w-5 h-5" /> CV İndir (PDF)
                                </a>
                            )}
                        </div>
                    </GlassCard>
                </aside>

                <div className="lg:col-span-8 space-y-12">
                    <section>
                        <h2 className="text-2xl font-bold mb-6">Hakkımda</h2>
                        <GlassCard className="p-8">
                            <p className="text-slate-400 leading-relaxed whitespace-pre-wrap">{profile.bio || "Henüz bir açıklama eklenmemiş."}</p>
                        </GlassCard>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-6">Portfolyo</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {profile.portfolio.map(project => (
                                <motion.div key={project.id} whileHover={{ y: -5 }} className="group relative h-64 rounded-2xl overflow-hidden border border-white/10 bg-slate-800 cursor-pointer" onClick={() => setSelectedProject(project)}>
                                    <div className={`absolute inset-0 bg-${project.imageUrl} bg-cover bg-center`} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent p-6 flex flex-col justify-end">
                                        <h3 className="text-xl font-bold text-white">{project.title}</h3>
                                        <p className="text-sm text-slate-400">{project.category}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold mb-6">Hizmet Paketleri</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {profile.services.map(pkg => (
                                <GlassCard key={pkg.id} className="p-6">
                                    <h3 className="font-bold text-lg mb-2">{pkg.name}</h3>
                                    <div className="text-2xl font-black text-white mb-4">{pkg.price}</div>
                                    <ul className="space-y-2">
                                        {pkg.features.map((f, i) => <li key={i} className="text-sm text-slate-400 flex gap-2"><CheckCircle2 className="w-4 h-4 text-cyan-500" /> {f}</li>)}
                                    </ul>
                                </GlassCard>
                            ))}
                        </div>
                    </section>

                    {/* Comments Section */}
                    <section>
                        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                            <MessageSquare className="w-6 h-6 text-purple-400" />
                            Değerlendirmeler ({comments.length})
                        </h2>

                        <div className="space-y-6">
                            {/* Comment Form */}
                            {viewerId && !isOwner && (
                                <GlassCard className="p-6">
                                    <form onSubmit={handleCommentSubmit} className="space-y-4">
                                        <textarea
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            placeholder="Bu çalışma hakkında ne düşünüyorsun?.."
                                            className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm focus:border-purple-500 outline-none min-h-[100px]"
                                            required
                                        />
                                        <div className="flex justify-end">
                                            <button
                                                disabled={isSubmittingComment}
                                                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-bold transition-all disabled:opacity-50"
                                            >
                                                {isSubmittingComment ? 'Gönderiliyor...' : 'Yorum Yap'}
                                            </button>
                                        </div>
                                    </form>
                                </GlassCard>
                            )}

                            {/* Comment List */}
                            {comments.length > 0 ? (
                                comments.map(comment => (
                                    <GlassCard key={comment.id} className="p-6">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="font-bold text-slate-100">{comment.profiles?.full_name}</div>
                                            <div className="text-[10px] text-slate-500 bg-white/5 px-2 py-1 rounded">
                                                {new Date(comment.created_at).toLocaleDateString('tr-TR')}
                                            </div>
                                        </div>
                                        <p className="text-sm text-slate-400 leading-relaxed italic">
                                            "{comment.content}"
                                        </p>
                                    </GlassCard>
                                ))
                            ) : (
                                <p className="text-center py-10 text-slate-500 text-sm italic">
                                    Henüz onaylanmış değerlendirme bulunmuyor.
                                </p>
                            )}
                        </div>
                    </section>
                </div>
            </main>

            {/* Video & Project Modals */}
            <AnimatePresence>
                {selectedProject && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setSelectedProject(null)}>
                        <div className="bg-[#1a1a1a] border border-white/10 rounded-2xl max-w-2xl w-full p-8" onClick={e => e.stopPropagation()}>
                            <h2 className="text-3xl font-bold mb-4">{selectedProject.title}</h2>
                            <p className="text-slate-400 mb-6">{selectedProject.description}</p>
                            <button className="w-full py-3 bg-white text-black font-bold rounded-lg" onClick={() => setSelectedProject(null)}>Kapat</button>
                        </div>
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
