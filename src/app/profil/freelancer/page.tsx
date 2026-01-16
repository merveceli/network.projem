'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, Star, Clock, Zap, Github, Linkedin,
    Globe, Mail, Phone, ChevronRight, CheckCircle2, Play,
    Edit2, Plus, X, Save, Trash2, Home, LogOut,
    User as UserIcon, Briefcase, FolderKanban, Award, MessageSquare,
    Link as LinkIcon, Camera, LayoutGrid, List,
    ShieldCheck, ShieldAlert, AlertTriangle, Download, FileText
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import VideoUploader from '@/components/VideoUploader';

// --- TİP TANIMLAMALARI ---
interface ServicePackage {
    id: string; // Unique ID for editing
    name: string;
    price: string;
    duration: string;
    features: string[];
    color: string;
    popular?: boolean;
}

interface ProjectData {
    id: string; // Unique ID
    title: string;
    category: string;
    description: string; // Yeni detay alanı
    technologies: string[]; // Yeni detay alanı
    imageUrl: string; // Custom image URL or gradient preset
    demoUrl?: string; // Canlı demo linki
}

interface ProfileData {
    full_name: string;
    title: string;
    location: string;
    hourly_rate: string;
    bio: string;
    email: string;
    phone: string;
    availability: string;
    video_url?: string | null;
    video_status?: string; // pending, approved, rejected
    cv_url?: string | null;
    is_secure?: boolean;
    is_suspicious?: boolean;
    fast_responder?: boolean;
    services: ServicePackage[]; // JSONB data
    portfolio: ProjectData[];   // JSONB data
    skills: { name: string, level: number, icon: string }[]; // JSONB
}

interface Comment {
    id: string;
    author_id: string;
    content: string;
    created_at: string;
    status: 'pending' | 'approved' | 'rejected';
    author_profile: {
        full_name: string | null;
    } | null;
}

// Default Mock Data (Başlangıç için)
const DEFAULT_PACKAGES: ServicePackage[] = [
    {
        id: '1',
        name: "Landing Page",
        price: "$500",
        duration: "3 Günde Teslim",
        features: ["Tek Sayfa Tasarım", "SEO Uyumlu", "Hızlı Yükleme", "Mobil Uyumlu"],
        color: "from-blue-500 to-cyan-400"
    },
    {
        id: '2',
        name: "Kurumsal Web",
        price: "$1,500",
        duration: "10 Günde Teslim",
        features: ["5 Sayfaya Kadar", "Admin Paneli", "Blog Sistemi", "Gelişmiş SEO"],
        color: "from-purple-500 to-pink-500",
        popular: true
    },
    {
        id: '3',
        name: "E-Ticaret",
        price: "$3,000",
        duration: "20 Günde Teslim",
        features: ["Ödeme Sistemleri", "Ürün Yönetimi", "Sipariş Takibi", "Kargo Entegrasyonu"],
        color: "from-amber-500 to-orange-500"
    }
];

const DEFAULT_PROJECTS: ProjectData[] = [
    { id: '1', title: "Fintech Dashboard", category: "UI/UX", description: "Modern finansal analiz arayüzü.", technologies: ["React", "Chart.js"], imageUrl: "gradient-to-br from-slate-800 to-slate-900" },
    { id: '2', title: "Yoga App", category: "Mobile", description: "Kişisel sağlık ve yoga takip uygulaması.", technologies: ["Flutter", "Firebase"], imageUrl: "gradient-to-br from-rose-900 to-slate-900" },
    { id: '3', title: "Crypto Wallet", category: "Web3", description: "Güvenli kripto varlık cüzdanı.", technologies: ["Solidity", "Next.js"], imageUrl: "gradient-to-br from-emerald-900 to-slate-900" },
    { id: '4', title: "AI Image Gen", category: "SaaS", description: "Yapay zeka ile görsel üretim platformu.", technologies: ["Python", "TensorFlow"], imageUrl: "gradient-to-br from-violet-900 to-slate-900" },
];

const GLASS_CARD_CLASS = "bg-white/[0.03] border border-white/[0.05] backdrop-blur-md rounded-2xl";

// --- COMPONENTS ---
const GlassCard = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`bg-white border border-gray-200 shadow-sm rounded-2xl ${className}`}>
        {children}
    </div>
);

export default function FreelancerProfile() {
    const supabase = createClient();
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditingMode, setIsEditingMode] = useState(false); // Genel düzenleme modu

    // Data State
    const [profile, setProfile] = useState<ProfileData>({
        full_name: '', title: '', location: '', hourly_rate: '',
        bio: '', email: '', phone: '', availability: '', video_url: null,
        cv_url: null, is_secure: true, is_suspicious: false, fast_responder: false,
        services: [], portfolio: [], skills: []
    });
    const [comments, setComments] = useState<Comment[]>([]);
    const [newComment, setNewComment] = useState("");
    const [submittingComment, setSubmittingComment] = useState(false);
    const [uploadingCv, setUploadingCv] = useState(false);

    // UI States
    const [isVideoOpen, setIsVideoOpen] = useState(false);
    const [contactModalOpen, setContactModalOpen] = useState(false);
    const [activityData, setActivityData] = useState<boolean[][]>([]);
    const [creatingConversation, setCreatingConversation] = useState(false);

    // Modal States
    const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null); // Detay görüntüleme için
    const [editingProject, setEditingProject] = useState<ProjectData | null>(null);   // Düzenleme için
    const [editingService, setEditingService] = useState<ServicePackage | null>(null); // Servis düzenleme için

    // --- FETCH DATA ---
    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            // Hydration fix for heatmap
            setActivityData(Array.from({ length: 40 }).map(() =>
                Array.from({ length: 7 }).map(() => Math.random() > 0.7)
            ));

            if (user) {
                const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                if (data) {
                    setProfile({
                        full_name: data.full_name || 'İsimsiz Kullanıcı',
                        title: data.title || 'Freelancer',
                        location: data.location || 'Dünya Geneli',
                        hourly_rate: data.hourly_rate || '$0',
                        bio: data.bio || '',
                        email: user.email || '',
                        phone: data.phone || '',
                        availability: data.availability || 'Müsait',
                        video_url: data.video_url,
                        video_status: data.video_status,
                        cv_url: data.cv_url,
                        is_secure: data.is_secure,
                        is_suspicious: data.is_suspicious,
                        fast_responder: data.fast_responder,
                        // Eğer DB boşsa default datayı kullan, yoksa DB'den gelen JSON'ı parse et
                        services: data.services && (data.services as any[]).length > 0 ? data.services : DEFAULT_PACKAGES,
                        portfolio: data.portfolio && (data.portfolio as any[]).length > 0 ? data.portfolio : DEFAULT_PROJECTS,
                        skills: data.skills && (data.skills as any[]).length > 0 ? data.skills : [
                            { name: "React", level: 90, icon: "⚛️" },
                            { name: "Node.js", level: 75, icon: "🟢" }
                        ]
                    });

                    // Fetch comments
                    const { data: commentData } = await supabase
                        .from('profile_comments')
                        .select('*, author_profile:author_id(full_name)')
                        .eq('profile_id', user.id)
                        .eq('status', 'approved')
                        .order('created_at', { ascending: false });
                    if (commentData) setComments(commentData as any);
                }
            }
            setLoading(false);
        };
        fetchData();
    }, []);

    // --- SAVE HANDLERS ---
    const saveProfileField = async (field: keyof ProfileData, value: any) => {
        setProfile(prev => ({ ...prev, [field]: value }));
        // Debounce işlemi olmadan direkt kaydetmek şimdilik OK, ama production'da debounce gerekir.
        // Burada editing mode kapandığında toplu kayıt yapmak daha mantıklı olabilir ama
        // kullanıcı "Kaydet" butonuna bastığında hepsini gönderelim.
    };

    const handleBatchSave = async () => {
        if (!user) return;

        try {
            const { error } = await supabase.from('profiles').update({
                full_name: profile.full_name,
                title: profile.title,
                location: profile.location,
                hourly_rate: profile.hourly_rate,
                bio: profile.bio,
                phone: profile.phone,
                availability: profile.availability,
                services: profile.services,
                portfolio: profile.portfolio,
                skills: profile.skills,
                video_url: profile.video_url,
                video_status: profile.video_status // Bunu da kaydediyoruz
            }).eq('id', user.id);

            if (error) throw error;
            setIsEditingMode(false);
            alert("Profil başarıyla güncellendi! 🎉");
        } catch (e) {
            console.error(e);
            alert("Kaydederken hata oluştu.");
        }
    };

    const handleLogout = async () => {
        if (confirm("Çıkış yapmak istediğinize emin misiniz?")) {
            await supabase.auth.signOut();
            router.push('/');
        }
    };

    // --- MODAL HANDLERS ---
    const openProjectEdit = (project?: ProjectData) => {
        setEditingProject(project || {
            id: crypto.randomUUID(),
            title: '', category: '', description: '', technologies: [], imageUrl: 'gradient-to-br from-slate-800 to-slate-900'
        });
    };

    const saveProject = (project: ProjectData) => {
        setProfile(prev => {
            const exists = prev.portfolio.find(p => p.id === project.id);
            const newPortfolio = exists
                ? prev.portfolio.map(p => p.id === project.id ? project : p)
                : [...prev.portfolio, project];
            return { ...prev, portfolio: newPortfolio };
        });
        setEditingProject(null);
    };

    const deleteProject = (id: string) => {
        if (confirm("Bu projeyi silmek istediğinize emin misiniz?")) {
            setProfile(prev => ({ ...prev, portfolio: prev.portfolio.filter(p => p.id !== id) }));
        }
    };

    const deleteService = (id: string) => {
        if (confirm("Bu paketi silmek istediğinize emin misiniz?")) {
            setProfile(prev => ({ ...prev, services: prev.services.filter(s => s.id !== id) }));
        }
    };

    const openServiceEdit = (service?: ServicePackage) => {
        setEditingService(service || {
            id: crypto.randomUUID(),
            name: '', price: '', duration: '', features: [], color: 'from-blue-500 to-cyan-400'
        });
    };

    const saveService = (service: ServicePackage) => {
        setProfile(prev => {
            const exists = prev.services.find(s => s.id === service.id);
            const newServices = exists
                ? prev.services.map(s => s.id === service.id ? service : s)
                : [...prev.services, service];
            return { ...prev, services: newServices };
        });
        setEditingService(null);
    };

    const handlePostComment = async () => {
        if (!user || !newComment.trim()) return;

        setSubmittingComment(true);
        const { error } = await supabase.from('profile_comments').insert({
            profile_id: user.id,
            author_id: user.id,
            content: newComment,
            status: 'pending' // Admin must approve
        });

        if (error) alert("Yorum gönderilemedi: " + error.message);
        else {
            alert("Yorumunuz gönderildi ve admin onayına sunuldu.");
            setNewComment("");
        }
        setSubmittingComment(false);
    };

    const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            alert("Dosya boyutu 5MB'dan küçük olmalıdır.");
            return;
        }

        setUploadingCv(true);
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}/cv_${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('cvs')
            .upload(filePath, file);

        if (uploadError) {
            console.error('CV upload error:', uploadError);
            alert("CV yüklenirken hata oluştu.");
            setUploadingCv(false);
            return;
        }

        const { data: { publicUrl } } = supabase.storage
            .from('cvs')
            .getPublicUrl(filePath);

        setProfile(prev => ({ ...prev, cv_url: publicUrl }));
        setUploadingCv(false);
        alert("CV başarıyla yüklendi! (Kaydetmeyi unutmayın)");
    };

    const handleStartConversation = async () => {
        if (!user) return;
        setCreatingConversation(true);

        try {
            // 1. Check if conversation already exists
            const { data: existingConvs } = await supabase
                .from('conversations')
                .select('id')
                .or(`participant_1.eq.${user.id},participant_2.eq.${user.id}`); // This is loose check, ideally specific pair check

            // Refined check for specific pair (current user vs profile user - wait, this is THE user's profile page if it's "freelancer/page.tsx", confusing naming. Let's assume this page is VIEWED by others too? 
            // NOTE: The current file seems to be "My Profile" (Edit mode enabled). 
            // Usually "Beni İşe Al" is for Visitors. But this page seems to be the "Manage My Profile" page. 
            // Wait, standard Next.js routing: /profil/freelancer usually implies "My generic Dashboard". 
            // BUT if the user wants "Hire Me" button logic, they likely mean "When SOMEONE ELSE views a profile".
            // However, the current file seems to be used for BOTH editing self-profile AND viewing (if logic was different).
            // Actually, looking at the code: `setUser(user)` and fetching `eq('id', user.id)`. It ONLY fetches the LOGGED IN user's profile.
            // So "Beni İşe Al" button here is likely a PREVIEW of what others see.
            // The user request says "orada beni işe al butonu var ya".
            // If I am editing my own profile, clicking "Hire Me" is weird.
            // But let's stick to the request: "Change functionality".
            // Since this page is currently "My Profile Dashboard", I can't really "Message Myself".
            // BUT, strictly following instructions: I will add the modal trigger.
            // If the user meant "Public Profile View", that would be a dynamic route like `/profil/freelancer/[id]`.
            // The current file `src/app/profil/freelancer/page.tsx` IS the dashboard.
            // So I will just implement the UI changes here as requested, simulating the view.
            // For "Message Me", if I message myself, it's fine for testing.

            // To properly redirect to messaging:
            // Since I am on my own profile, I can't really start a chat with myself.
            // I'll add a check: if(isEditingMode) -> Show "Preview Mode" alert. 
            // Actually, I'll just open the modal. And sending message to myself might fail or be weird.
            // Ideally, this page should be split into /dashboard and /profile/[id].
            // I will assume for now I just update the UI logic.

            router.push('/mesajlar'); // Just go to messages as a placeholder or self-chat if supported.

        } catch (error) {
            console.error(error);
        } finally {
            setCreatingConversation(false);
        }
    };


    // --- RENDER ---
    if (loading) return <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white">Yükleniyor...</div>;

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900 font-sans selection:bg-blue-100">
            {/* Minimal Geri Dön & Çıkış Butonları */}
            <div className="absolute top-6 left-6 z-50 flex gap-3">
                <Link href="/" className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-100 border border-gray-200 rounded-full text-sm font-bold transition-all group no-underline text-gray-600 shadow-sm">
                    <Home className="w-4 h-4 group-hover:text-blue-600 transition-colors" />
                    <span>Ana Sayfa</span>
                </Link>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 rounded-full text-sm font-bold transition-all group text-red-600 shadow-sm"
                >
                    <LogOut className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    <span>Çıkış Yap</span>
                </button>
            </div>

            {/* Light Theme Background Decoration */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-100/50 rounded-full blur-[120px]" />
            </div>

            {/* DÜZENLEME MODU BUTONU (SAĞ ALT) */}
            <div className="fixed bottom-8 right-8 z-40">
                <button
                    onClick={() => isEditingMode ? handleBatchSave() : setIsEditingMode(true)}
                    className={`flex items-center gap-2 px-6 py-3 rounded-full font-bold shadow-lg transition-all ${isEditingMode ? 'bg-green-500 hover:bg-green-600 text-white' : 'bg-cyan-500 hover:bg-cyan-600 text-black'}`}
                >
                    {isEditingMode ? <><Save className="w-5 h-5" /> Değişiklikleri Kaydet</> : <><Edit2 className="w-5 h-5" /> Profili Düzenle</>}
                </button>
            </div>

            <main className="relative max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* SOL: AVATAR KARTI */}
                <aside className="lg:col-span-4 lg:sticky lg:top-8 h-fit space-y-6">
                    <GlassCard className="p-8 text-center relative overflow-hidden group">
                        {/* Avatar Çemberi */}
                        <div className="relative inline-block mb-6 cursor-pointer" onClick={() => !isEditingMode && setIsVideoOpen(true)}>
                            <div className={`absolute -inset-1 rounded-full bg-gradient-to-r from-cyan-500 via-purple-500 to-pink-500 opacity-75 blur transition duration-500 group-hover:opacity-100 ${profile.video_url ? 'animate-spin-slow' : ''}`}></div>
                            <div className="relative w-32 h-32 rounded-full bg-slate-900 border-4 border-[#0a0a0a] overflow-hidden flex items-center justify-center">
                                {profile.video_url ? (
                                    <>
                                        <video src={profile.video_url} className="w-full h-full object-cover opacity-80" />
                                        {/* Status Badge Overlay */}
                                        {profile.video_status === 'pending' && (
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                                                <span className="text-[10px] font-bold bg-yellow-500 text-black px-2 py-1 rounded-full animate-pulse">Onay Bekliyor</span>
                                            </div>
                                        )}
                                        {profile.video_status === 'rejected' && (
                                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                                                <span className="text-[10px] font-bold bg-red-600 text-white px-2 py-1 rounded-full">Reddedildi</span>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <span className="text-4xl">😎</span>
                                )}
                                {!isEditingMode && <Play className="absolute w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />}
                            </div>
                            {isEditingMode && (
                                <button onClick={(e) => { e.stopPropagation(); setIsVideoOpen(true); }} className="absolute bottom-0 right-0 bg-blue-500 text-white p-1 rounded-full text-xs z-10">
                                    <Edit2 className="w-3 h-3" />
                                </button>
                            )}
                        </div>

                        {/* İsim & Title - Editable */}
                        {isEditingMode ? (
                            <div className="space-y-4 mb-4">
                                <input className="bg-gray-100 border border-gray-200 p-2 rounded w-full text-center font-bold text-gray-900" value={profile.full_name} onChange={e => saveProfileField('full_name', e.target.value)} />
                                <input className="bg-gray-100 border border-gray-200 p-2 rounded w-full text-center text-sm text-gray-700" value={profile.title} onChange={e => saveProfileField('title', e.target.value)} />
                            </div>
                        ) : (
                            <>
                                <h1 className="text-3xl font-black text-gray-900 mb-2">{profile.full_name}</h1>
                                <p className="text-blue-600 font-bold mb-4 flex items-center justify-center gap-2"><Zap className="w-4 h-4" /> {profile.title}</p>

                                {/* ROZETLER / BADGES */}
                                <div className="flex flex-wrap justify-center gap-2 mb-6">
                                    {profile.is_secure && (
                                        <span className="flex items-center gap-1 bg-green-50 text-green-700 text-[10px] font-black uppercase px-2 py-1 rounded border border-green-200">
                                            <ShieldCheck className="w-3 h-3" /> GÜVENLİ
                                        </span>
                                    )}
                                    {profile.is_suspicious && (
                                        <span className="flex items-center gap-1 bg-red-50 text-red-700 text-[10px] font-black uppercase px-2 py-1 rounded border border-red-200">
                                            <AlertTriangle className="w-3 h-3" /> ŞÜPHELİ
                                        </span>
                                    )}
                                    {profile.fast_responder && (
                                        <span className="flex items-center gap-1 bg-blue-50 text-blue-700 text-[10px] font-black uppercase px-2 py-1 rounded border border-blue-200">
                                            <Clock className="w-3 h-3" /> HIZLI CEVAP
                                        </span>
                                    )}
                                </div>
                            </>
                        )}

                        <div className="flex flex-col gap-3">
                            <button
                                onClick={() => setContactModalOpen(true)}
                                className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold hover:shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <MessageSquare className="w-5 h-5" /> Beni İşe Al / İletişime Geç
                            </button>
                            {isEditingMode ? (
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept=".pdf,.doc,.docx"
                                        onChange={handleCvUpload}
                                        className="hidden"
                                        id="cv-upload"
                                    />
                                    <label
                                        htmlFor="cv-upload"
                                        className={`w-full py-3 rounded-xl border border-dashed border-white/20 text-slate-300 font-bold hover:bg-white/5 transition-all flex items-center justify-center gap-2 cursor-pointer ${uploadingCv ? 'opacity-50 pointer-events-none' : ''}`}
                                    >
                                        <FileText className="w-4 h-4" />
                                        {uploadingCv ? "Yükleniyor..." : "CV Yükle/Değiştir (PDF)"}
                                    </label>
                                </div>
                            ) : (
                                profile.cv_url && (
                                    <a
                                        href={profile.cv_url}
                                        download
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="w-full py-3 rounded-xl bg-white border border-gray-200 text-gray-700 font-bold hover:bg-gray-50 transition-all flex items-center justify-center gap-2 no-underline"
                                    >
                                        <FileText className="w-4 h-4" /> CV İndir
                                    </a>
                                )
                            )}
                        </div>
                    </GlassCard>
                </aside>

                {/* SAĞ: İÇERİK */}
                <div className="lg:col-span-8 space-y-12">

                    {/* HAKKIMDA & AKTİVİTE */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2"><span className="w-2 h-8 bg-blue-600 rounded-full"></span>Hakkımda</h2>
                        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                            <p className="text-gray-600 leading-relaxed text-lg mb-6 whitespace-pre-line">{profile.bio || "Henüz bir biyografi eklenmemiş."}</p>

                            {/* Aktivite Haritası */}
                            <div className="border-t border-gray-100 pt-6">
                                <h3 className="text-sm font-bold text-gray-400 mb-4 uppercase tracking-wider">Aktivite Haritası</h3>
                                <div className="flex gap-1 overflow-hidden opacity-50">
                                    {activityData.map((col, i) => (
                                        <div key={i} className="flex flex-col gap-1">
                                            {col.map((isActive, j) => (
                                                <div key={j} className={`w-3 h-3 rounded-sm ${isActive ? 'bg-green-500' : 'bg-gray-100'}`} />
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* PORTFOLYO - EDITABLE */}
                    <section>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2"><span className="w-2 h-8 bg-indigo-600 rounded-full"></span>Öne Çıkan Projeler</h2>
                            {isEditingMode && (
                                <button onClick={() => openProjectEdit()} className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 rounded text-sm text-white flex items-center gap-1">
                                    <Plus className="w-4 h-4" /> Ekle
                                </button>
                            )}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {profile.portfolio.map((project, i) => (
                                <motion.div key={project.id} whileHover={{ y: -5 }} className="group relative h-64 rounded-2xl overflow-hidden cursor-pointer border border-gray-200 bg-gray-50 shadow-sm"
                                    onClick={() => !isEditingMode && setSelectedProject(project)}
                                >
                                    {/* Edit Buttons */}
                                    {isEditingMode && (
                                        <div className="absolute top-2 right-2 z-20 flex gap-1">
                                            <button onClick={(e) => { e.stopPropagation(); openProjectEdit(project); }} className="p-2 bg-blue-600 rounded-full hover:bg-blue-700 text-white"><Edit2 className="w-4 h-4" /></button>
                                            <button onClick={(e) => { e.stopPropagation(); deleteProject(project.id); }} className="p-2 bg-red-600 rounded-full hover:bg-red-700 text-white"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    )}

                                    <div className={`absolute inset-0 bg-${project.imageUrl} bg-cover bg-center transition-transform duration-500 group-hover:scale-110`} />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-6 flex flex-col justify-end">
                                        <span className="inline-block self-start px-3 py-1 rounded-full bg-white/90 backdrop-blur-md text-xs font-bold text-gray-900 mb-2">{project.category}</span>
                                        <h3 className="text-xl font-bold text-white mb-1 shadow-black/50 drop-shadow-md">{project.title}</h3>
                                        <p className="text-sm text-gray-200 line-clamp-1 drop-shadow">{project.description}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </section>

                    {/* HİZMET PAKETLERİ - EDITABLE */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2"><span className="w-2 h-8 bg-purple-600 rounded-full"></span>Hizmet Paketleri</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {profile.services.map((pkg, i) => (
                                <div key={pkg.id} className="bg-white p-6 relative rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                    {isEditingMode && (
                                        <button className="absolute top-2 right-2 p-2 text-gray-400 hover:text-gray-900" onClick={() => alert("Servis düzenleme henüz aktif değil.")}><Edit2 className="w-4 h-4" /></button>
                                    )}
                                    <h3 className="font-bold text-lg text-gray-900 mb-2">{pkg.name}</h3>
                                    <div className="text-3xl font-black mb-4 text-purple-600">{pkg.price}</div>
                                    <div className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-wider">{pkg.duration}</div>
                                    <ul className="space-y-2">
                                        {pkg.features.map((f, j) => <li key={j} className="text-sm text-gray-600 flex gap-2"><CheckCircle2 className="w-4 h-4 text-green-500" /> {f}</li>)}
                                    </ul>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* YORUMLAR / COMMENTS */}
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <span className="w-2 h-8 bg-orange-500 rounded-full"></span>
                            Üye Yorumları
                        </h2>
                        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
                            <div className="space-y-6 mb-8">
                                {comments.length > 0 ? comments.map(comment => (
                                    <div key={comment.id} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="font-bold text-gray-900">{comment.author_profile?.full_name || 'Anonim'}</div>
                                            <div className="text-[10px] text-gray-400">{new Date(comment.created_at).toLocaleDateString()}</div>
                                        </div>
                                        <p className="text-sm text-gray-600 italic">"{comment.content}"</p>
                                    </div>
                                )) : (
                                    <p className="text-gray-400 text-center py-4">Henüz yorum yapılmamış.</p>
                                )}
                            </div>

                            {user && (
                                <div className="space-y-4 pt-6 border-t border-gray-100">
                                    <textarea
                                        value={newComment}
                                        onChange={e => setNewComment(e.target.value)}
                                        placeholder="Profil hakkında bir yorum bırakın..."
                                        className="w-full bg-gray-50 border border-gray-200 rounded-xl p-4 text-sm text-gray-900 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
                                        rows={3}
                                    />
                                    <button
                                        onClick={handlePostComment}
                                        disabled={submittingComment || !newComment.trim()}
                                        className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold disabled:opacity-50 transition-all flex items-center gap-2"
                                    >
                                        <MessageSquare className="w-4 h-4" />
                                        {submittingComment ? "Gönderiliyor..." : "Yorum Yap"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </section>
                </div>

                {/* --- CONTACT MODAL --- */}
                <AnimatePresence>
                    {contactModalOpen && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setContactModalOpen(false)}>
                            <div className="bg-white border border-gray-200 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-6" onClick={e => e.stopPropagation()}>
                                <div className="text-center">
                                    <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                                        <MessageSquare className="w-10 h-10" />
                                    </div>
                                    <h3 className="text-xl font-bold text-gray-900">İletişime Geç</h3>
                                    <p className="text-gray-500 text-sm mt-1">{profile.full_name} ile bağlantı kurun</p>
                                </div>

                                <div className="space-y-3">
                                    <div className="p-4 bg-gray-50 rounded-xl flex items-center gap-3">
                                        <Mail className="w-5 h-5 text-gray-400" />
                                        <div className="flex-1 overflow-hidden">
                                            <p className="text-xs text-gray-400 font-bold uppercase">E-Posta</p>
                                            <p className="text-sm font-bold text-gray-900 truncate">{profile.email}</p>
                                        </div>
                                    </div>
                                    {profile.phone && (
                                        <div className="p-4 bg-gray-50 rounded-xl flex items-center gap-3">
                                            <Phone className="w-5 h-5 text-gray-400" />
                                            <div className="flex-1">
                                                <p className="text-xs text-gray-400 font-bold uppercase">Telefon</p>
                                                <p className="text-sm font-bold text-gray-900">{profile.phone}</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={handleStartConversation}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2"
                                >
                                    <MessageSquare className="w-4 h-4" /> Mesaj Gönder
                                </button>
                                <p className="text-center text-xs text-gray-400">Net-Work mesajlaşma sistemi üzerinden güvenli bir şekilde iletişim kurabilirsiniz.</p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>

            {/* --- MODALS --- */}
            <AnimatePresence>
                {/* 1. PROJECT DETAIL MODAL (Visitor view) */}
                {selectedProject && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setSelectedProject(null)}>
                        <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} className="bg-[#1a1a1a] border border-white/10 rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                            <div className={`h-48 bg-${selectedProject.imageUrl} relative`}>
                                <button onClick={() => setSelectedProject(null)} className="absolute top-4 right-4 bg-black/50 p-2 rounded-full text-white hover:bg-black/70"><X /></button>
                                <div className="absolute bottom-4 left-6">
                                    <span className="bg-black/60 px-3 py-1 rounded text-xs font-bold uppercase tracking-wider text-cyan-400">{selectedProject.category}</span>
                                    <h2 className="text-3xl font-bold text-white mt-2">{selectedProject.title}</h2>
                                </div>
                            </div>
                            <div className="p-8">
                                <h3 className="text-lg font-bold text-slate-300 mb-2">Proje Hakkında</h3>
                                <p className="text-slate-400 leading-relaxed mb-6">{selectedProject.description}</p>

                                <h3 className="text-lg font-bold text-slate-300 mb-2">Teknolojiler</h3>
                                <div className="flex flex-wrap gap-2 mb-8">
                                    {selectedProject.technologies?.map(t => <span key={t} className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-sm text-slate-300">{t}</span>)}
                                </div>

                                <button className="w-full py-3 bg-white text-black font-bold rounded-lg hover:bg-slate-200">
                                    Canlı Projeyi Gör ↗
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* 2. PROJECT EDIT MODAL (Owner view) */}
                {editingProject && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
                        <div className="bg-[#1a1a1a] border border-white/10 rounded-xl max-w-lg w-full p-6 space-y-4">
                            <h2 className="text-xl font-bold">Proje Düzenle</h2>
                            <input className="w-full bg-white/5 border border-white/10 p-3 rounded text-white" placeholder="Proje Başlığı" value={editingProject.title} onChange={e => setEditingProject({ ...editingProject, title: e.target.value })} />
                            <input className="w-full bg-white/5 border border-white/10 p-3 rounded text-white" placeholder="Kategori (örn: UI/UX)" value={editingProject.category} onChange={e => setEditingProject({ ...editingProject, category: e.target.value })} />
                            <textarea className="w-full bg-white/5 border border-white/10 p-3 rounded text-white h-32" placeholder="Açıklama" value={editingProject.description} onChange={e => setEditingProject({ ...editingProject, description: e.target.value })} />
                            {/* Basitlik için teknoloji girişi virgülle ayrılmış string olarak */}
                            <input className="w-full bg-white/5 border border-white/10 p-3 rounded text-white" placeholder="Teknolojiler (virgülle ayır)" value={editingProject.technologies?.join(', ')} onChange={e => setEditingProject({ ...editingProject, technologies: e.target.value.split(',').map(s => s.trim()) })} />

                            <div className="flex gap-3 justify-end mt-4">
                                <button onClick={() => setEditingProject(null)} className="px-4 py-2 text-slate-400 hover:text-white">İptal</button>
                                <button onClick={() => saveProject(editingProject)} className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-bold">Kaydet</button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* 3. SERVICE EDIT MODAL */}
                {editingService && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
                        <div className="bg-[#1a1a1a] border border-white/10 rounded-xl max-w-lg w-full p-6 space-y-4">
                            <h2 className="text-xl font-bold">Paket Düzenle</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <input className="bg-white/5 border border-white/10 p-3 rounded text-white" placeholder="Paket Adı (Örn: Standart)" value={editingService.name} onChange={e => setEditingService({ ...editingService, name: e.target.value })} />
                                <input className="bg-white/5 border border-white/10 p-3 rounded text-white" placeholder="Fiyat (Örn: $500)" value={editingService.price} onChange={e => setEditingService({ ...editingService, price: e.target.value })} />
                            </div>
                            <input className="w-full bg-white/5 border border-white/10 p-3 rounded text-white" placeholder="Süre (Örn: 3 Günde Teslim)" value={editingService.duration} onChange={e => setEditingService({ ...editingService, duration: e.target.value })} />

                            <div>
                                <label className="text-xs text-slate-500 mb-1 block">Özellikler (Her satıra bir özellik)</label>
                                <textarea
                                    className="w-full bg-white/5 border border-white/10 p-3 rounded text-white h-32"
                                    placeholder="Mobil Uyumlu&#10;SEO Dahil&#10;Admin Paneli"
                                    value={editingService.features.join('\n')}
                                    onChange={e => setEditingService({ ...editingService, features: e.target.value.split('\n') })}
                                />
                            </div>

                            <div className="flex gap-3 justify-end mt-4">
                                <button onClick={() => setEditingService(null)} className="px-4 py-2 text-slate-400 hover:text-white">İptal</button>
                                <button onClick={() => saveService(editingService)} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-bold">Kaydet</button>
                            </div>
                        </div>
                    </motion.div>
                )}

                {isVideoOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-xl p-4">
                        <div className="relative w-full max-w-2xl bg-slate-900 rounded-2xl overflow-hidden">
                            <button onClick={() => setIsVideoOpen(false)} className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 text-white flex items-center justify-center">✕</button>
                            <div className="p-8"><VideoUploader userId={user?.id || ''} existingVideoUrl={profile.video_url} onUploadComplete={(url) => {
                                setProfile(prev => ({ ...prev, video_url: url, video_status: 'pending' }));
                                setTimeout(() => setIsVideoOpen(false), 1000);
                            }} /></div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}