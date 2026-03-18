'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    MapPin, Star, Clock, Zap, Github, Linkedin,
    Globe, Mail, Phone, ChevronRight, CheckCircle2, Play,
    Edit2, Plus, X, Save, Trash2, Home, LogOut,
    User as UserIcon, Briefcase, FolderKanban, Award, MessageSquare,
    Link as LinkIcon, Camera, LayoutGrid, List,
    ShieldCheck, ShieldAlert, AlertTriangle, Download, FileText, Users,
    GraduationCap, Languages,
    Layout, ExternalLink
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useToast } from "@/contexts/ToastContext";
import { getProfile, updateProfileGeneric, deleteProfileSelf, getProfileComments, postProfileComment } from '../actions';

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
    avatar_url?: string | null;
    cv_url?: string | null;
    is_secure?: boolean;
    is_suspicious?: boolean;
    fast_responder?: boolean;
    services: ServicePackage[];
    portfolio: ProjectData[];
    skills: string[]; 
    looking_for_team?: boolean;
    portfolio_pdf_url?: string | null;
}

interface Comment {
    id: string;
    author_id: string;
    content: string;
    created_at: string;
    status: 'pending' | 'approved' | 'rejected';
    author_name: string | null;
}

// Default Data
const DEFAULT_PACKAGES: ServicePackage[] = [
    {
        id: '1', name: "Başlangıç", price: "₺1.500", duration: "3 Gün",
        features: ["Tek Sayfa", "Mobil Uyumlu", "Temel SEO"], color: "bg-blue-50"
    },
    {
        id: '2', name: "Profesyonel", price: "₺5.000", duration: "10 Gün",
        features: ["5 Sayfa", "Yönetim Paneli", "Blog", "Gelişmiş SEO"], color: "bg-indigo-50", popular: true
    },
    {
        id: '3', name: "E-Ticaret", price: "₺15.000", duration: "25 Gün",
        features: ["Sınırsız Ürün", "Ödeme Altyapısı", "Stok Takibi", "Kargo Entegrasyonu"], color: "bg-purple-50"
    }
];

const DEFAULT_PROJECTS: ProjectData[] = [
    { id: '1', title: "Fintech Dashboard", category: "UI/UX", description: "Modern finansal analiz arayüzü.", technologies: ["React", "Chart.js"], imageUrl: "from-slate-800 to-slate-900" },
    { id: '2', title: "Sağlık Uygulaması", category: "Mobil", description: "Kişisel sağlık asistanı.", technologies: ["Flutter", "Firebase"], imageUrl: "from-rose-900 to-slate-900" },
];

export default function FreelancerProfile() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { success, error: toastError, info } = useToast();

    const [loading, setLoading] = useState(true);
    const [isEditingMode, setIsEditingMode] = useState(false);

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
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [skillInput, setSkillInput] = useState("");

    // --- FETCH DATA ---
    useEffect(() => {
        if (status === 'loading') return;
        if (status === 'unauthenticated' || !session?.user) {
            router.push('/login');
            return;
        }

        const fetchData = async () => {
            try {
                const data = await getProfile();
                if (data) {
                    setProfile({
                        full_name: data.full_name || session.user?.name || 'İsimsiz Kullanıcı',
                        title: data.title || 'Ünvan Belirtilmemiş',
                        location: data.location || 'Konum Belirtilmemiş',
                        hourly_rate: data.hourly_rate || 'Belirtilmemiş',
                        bio: data.bio || '',
                        email: session.user?.email || '',
                        phone: data.phone || '',
                        availability: data.availability || 'Müsait',
                        video_url: data.video_url,
                        video_status: data.video_status,
                        avatar_url: data.avatar_url || session.user?.image,
                        cv_url: data.cv_url,
                        is_secure: data.is_secure,
                        is_suspicious: data.is_suspicious,
                        fast_responder: data.fast_responder,
                        looking_for_team: data.looking_for_team,
                        services: Array.isArray(data.services) && data.services.length > 0 ? data.services : DEFAULT_PACKAGES,
                        portfolio: Array.isArray(data.portfolio) && data.portfolio.length > 0 ? data.portfolio : DEFAULT_PROJECTS,
                        skills: data.skills || ["React", "TypeScript"],
                        portfolio_pdf_url: data.portfolio_pdf_url
                    });

                    const commentData = await getProfileComments(session.user!.id!);
                    setComments(commentData as any);
                }
            } catch (error) {
                console.error('Veri çekme hatası:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [status, session, router]);

    // --- HANDLERS ---
    const saveProfileField = (field: keyof ProfileData, value: any) => {
        setProfile(prev => ({ ...prev, [field]: value }));
    };

    const handleBatchSave = async () => {
        try {
            await updateProfileGeneric({
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
                avatar_url: profile.avatar_url,
                cv_url: profile.cv_url,
                portfolio_pdf_url: profile.portfolio_pdf_url,
                looking_for_team: profile.looking_for_team
            });
            setIsEditingMode(false);
            success("Profil başarıyla güncellendi! 🎉");
        } catch (e: any) {
            console.error(e);
            toastError("Kaydederken hata oluştu: " + e.message);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setUploadingAvatar(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', 'avatars');

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setProfile(prev => ({ ...prev, avatar_url: data.url }));
            success("Fotoğraf yüklendi. Kaydetmeyi unutmayın!");
        } catch (e: any) {
            toastError("Hata: " + e.message);
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            toastError("Dosya boyutu 5MB'dan küçük olmalı.");
            return;
        }
        setUploadingCv(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('folder', 'cvs');

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formData
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setProfile(prev => ({ ...prev, cv_url: data.url }));
            success("CV yüklendi. Kaydetmeyi unutmayın!");
        } catch (e: any) {
            toastError("Hata: " + e.message);
        } finally {
            setUploadingCv(false);
        }
    };

    const addSkill = () => {
        if (skillInput.trim() && !profile.skills.includes(skillInput.trim())) {
            setProfile(prev => ({ ...prev, skills: [...prev.skills, skillInput.trim()] }));
            setSkillInput("");
        }
    };

    const removeSkill = (skill: string) => {
        setProfile(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }));
    };

    const handlePostComment = async () => {
        if (!session?.user?.id || !newComment.trim()) return;
        setSubmittingComment(true);
        try {
            await postProfileComment(session.user.id, newComment);
            success("Yorum admin onayına gönderildi.");
            setNewComment("");
        } catch (error: any) {
            toastError("Yorum hatası: " + error.message);
        } finally {
            setSubmittingComment(false);
        }
    };

    const handleLogout = async () => {
        if (confirm('Çıkış yapılsın mı?')) {
            await signOut({ callbackUrl: '/' });
            success('Çıkış yapıldı');
        }
    };

    if (loading || status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400">
                <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 pb-20">
            {/* Top Bar */}
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 bg-opacity-80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="font-black text-xl tracking-tight text-slate-900 no-underline">
                        Net<span className="text-blue-600">-Work</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <Link href="/" className="text-sm font-bold text-slate-500 hover:text-slate-900 px-3 py-2 rounded-md hover:bg-slate-50 no-underline">Ana Sayfa</Link>
                        <button onClick={handleLogout} className="text-sm font-bold text-red-500 hover:text-red-600 px-3 py-2 rounded-md hover:bg-red-50">Çıkış Yap</button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Sidebar */}
                <aside className="lg:col-span-4 xl:col-span-3 space-y-6">
                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm text-center relative">
                        <button
                            onClick={() => isEditingMode ? handleBatchSave() : setIsEditingMode(true)}
                            className={`absolute top-4 right-4 z-20 p-2 rounded-full transition-all ${isEditingMode ? 'bg-green-500 text-white' : 'bg-gray-100 text-gray-500 hover:text-blue-600'}`}
                        >
                            {isEditingMode ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                        </button>

                        <div className="relative mx-auto w-32 h-32 mb-4">
                            <div className="w-full h-full rounded-full overflow-hidden border-4 border-white shadow-lg bg-slate-100 flex items-center justify-center">
                                {profile.avatar_url ? (
                                    <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                ) : (
                                    <UserIcon className="w-12 h-12 text-slate-300" />
                                )}
                            </div>
                            {isEditingMode && (
                                <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 shadow-md">
                                    <Camera className="w-4 h-4" />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                                </label>
                            )}
                        </div>

                        {isEditingMode ? (
                            <div className="space-y-2 mb-4">
                                <input value={profile.full_name} onChange={e => saveProfileField('full_name', e.target.value)} className="w-full p-2 border rounded text-center font-bold bg-gray-50" placeholder="Ad Soyad" />
                                <input value={profile.title} onChange={e => saveProfileField('title', e.target.value)} className="w-full p-2 border rounded text-center text-sm text-gray-600 bg-gray-50" placeholder="Ünvan" />
                            </div>
                        ) : (
                            <>
                                <h1 className="text-2xl font-black text-gray-900 mb-1">{profile.full_name}</h1>
                                <p className="text-blue-600 font-bold mb-4">{profile.title}</p>
                            </>
                        )}

                        <div className="grid grid-cols-2 gap-2 border-t border-gray-50 pt-4 mb-4">
                            <div className="p-3 bg-gray-50 rounded-2xl">
                                <p className="text-[10px] font-black uppercase text-gray-400">SAATLİK</p>
                                <p className="font-bold text-gray-900">{profile.hourly_rate}</p>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-2xl">
                                <p className="text-[10px] font-black uppercase text-gray-400">DURUM</p>
                                <p className="font-bold text-green-600">{profile.availability}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <button className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black text-xs hover:bg-blue-700 shadow-lg shadow-blue-200">İLETİŞİME GEÇ</button>
                            {isEditingMode ? (
                                <label className="w-full py-4 border-2 border-dashed border-gray-200 rounded-2xl text-xs font-black text-gray-400 hover:bg-gray-50 cursor-pointer block">
                                    {uploadingCv ? 'YÜKLENİYOR...' : 'CV YÜKLE (PDF)'}
                                    <input type="file" className="hidden" accept=".pdf" onChange={handleCvUpload} />
                                </label>
                            ) : (
                                profile.cv_url && (
                                    <a href={profile.cv_url} target="_blank" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs block no-underline">CV GÖRÜNTÜLE</a>
                                )
                            )}
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">YETENEKLER</h3>
                        <div className="flex flex-wrap gap-2">
                            {profile.skills.map((skill, i) => (
                                <span key={i} className="px-3 py-1.5 bg-gray-50 text-gray-700 rounded-xl text-xs font-bold border border-gray-100 flex items-center gap-2">
                                    {skill}
                                    {isEditingMode && <button onClick={() => removeSkill(skill)} className="text-red-400 hover:text-red-600">×</button>}
                                </span>
                            ))}
                        </div>
                        {isEditingMode && (
                            <div className="mt-4 flex gap-2">
                                <input value={skillInput} onChange={e => setSkillInput(e.target.value)} onKeyPress={e => e.key === 'Enter' && addSkill()} placeholder="Ekle..." className="p-2 border rounded-xl text-xs flex-1" />
                                <button onClick={addSkill} className="p-2 bg-blue-600 text-white rounded-xl">+</button>
                            </div>
                        )}
                    </div>
                </aside>

                {/* Main Content */}
                <div className="lg:col-span-8 xl:col-span-9 space-y-8">
                    <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                        <h3 className="text-xl font-black text-gray-900 mb-6">Hakkımda</h3>
                        {isEditingMode ? (
                            <textarea value={profile.bio} onChange={e => saveProfileField('bio', e.target.value)} className="w-full h-40 p-4 border rounded-3xl bg-gray-50 text-sm font-medium leading-relaxed outline-none focus:ring-2 ring-blue-500/10" />
                        ) : (
                            <p className="text-gray-600 leading-relaxed text-sm font-medium whitespace-pre-wrap">{profile.bio || "Henüz biyografi eklenmemiş."}</p>
                        )}
                    </section>

                    <section className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-xl font-black text-gray-900">Portfolyo</h3>
                            {isEditingMode && <button className="text-xs font-black text-blue-600 hover:bg-blue-50 px-4 py-2 rounded-xl">YENİ PROJE EKLE</button>}
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {profile.portfolio.map((project) => (
                                <div key={project.id} className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm hover:shadow-xl transition-all group">
                                    <div className="h-48 bg-slate-100 relative">
                                        {project.imageUrl && !project.imageUrl.startsWith('from-') ? (
                                            <img src={project.imageUrl} alt={project.title} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full bg-slate-800 flex items-center justify-center text-white/10 font-black text-2xl uppercase tracking-tighter">PROJECT PREVIEW</div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                                        <div className="absolute bottom-4 left-4">
                                            <span className="px-2 py-1 bg-white text-[10px] font-black uppercase text-gray-900 rounded-lg">{project.category}</span>
                                        </div>
                                    </div>
                                    <div className="p-6">
                                        <h4 className="font-black text-gray-900 mb-2">{project.title}</h4>
                                        <p className="text-gray-500 text-xs font-medium line-clamp-2">{project.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                        <h3 className="text-xl font-black text-gray-900 mb-8">Değerlendirmeler</h3>
                        <div className="space-y-6">
                            {comments.map((comment: any) => (
                                <div key={comment.id} className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <p className="font-extrabold text-blue-600 text-sm">{comment.author_name || 'Misafir'}</p>
                                            <p className="text-[10px] font-black text-gray-400 uppercase">{new Date(comment.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex text-yellow-400 gap-0.5">
                                            {[...Array(5)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                                        </div>
                                    </div>
                                    <p className="text-sm text-gray-600 font-medium italic">"{comment.content}"</p>
                                </div>
                            ))}
                            <div className="mt-8 pt-8 border-t border-gray-100">
                                <h4 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4">Yeni Yorum Yap</h4>
                                <div className="flex gap-4">
                                    <input value={newComment} onChange={e => setNewComment(e.target.value)} placeholder="Yorumunuzu yazın..." className="flex-1 p-4 bg-gray-50 border-none rounded-2xl text-sm font-bold outline-none" />
                                    <button onClick={handlePostComment} disabled={submittingComment} className="px-8 bg-slate-900 text-white rounded-2xl font-black text-xs hover:bg-slate-800 disabled:opacity-50">GÖNDER</button>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>
            </main>
        </div>
    );
}