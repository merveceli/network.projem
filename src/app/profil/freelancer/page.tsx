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
    ShieldCheck, ShieldAlert, AlertTriangle, Download, FileText, Users,
    GraduationCap, Languages
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useToast } from "@/contexts/ToastContext";

// --- TİP TANIMLAMALARI ---
interface ServicePackage {
    id: string;
    name: string;
    price: string;
    duration: string;
    features: string[];
    color: string; // Legacy support or new color theme
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
    skills: { name: string, level: number, icon: string }[];
    looking_for_team?: boolean;
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
    const supabase = createClient();
    const router = useRouter();
    const { success, error: toastError, info } = useToast();

    const [user, setUser] = useState<User | null>(null);
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

    // UI States
    const [isVideoOpen, setIsVideoOpen] = useState(false);
    const [contactModalOpen, setContactModalOpen] = useState(false);
    const [creatingConversation, setCreatingConversation] = useState(false);

    // Modal States
    const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
    const [editingProject, setEditingProject] = useState<ProjectData | null>(null);
    const [editingService, setEditingService] = useState<ServicePackage | null>(null);

    // --- FETCH DATA ---
    useEffect(() => {
        const fetchData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            if (user) {
                const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
                if (data) {
                    setProfile({
                        full_name: data.full_name || 'İsimsiz Kullanıcı',
                        title: data.title || 'Ünvan Belirtilmemiş',
                        location: data.location || 'Konum Belirtilmemiş',
                        hourly_rate: data.hourly_rate || 'Belirtilmemiş',
                        bio: data.bio || '',
                        email: user.email || '',
                        phone: data.phone || '',
                        availability: data.availability || 'Müsait',
                        video_url: data.video_url,
                        video_status: data.video_status,
                        avatar_url: data.avatar_url,
                        cv_url: data.cv_url,
                        is_secure: data.is_secure,
                        is_suspicious: data.is_suspicious,
                        fast_responder: data.fast_responder,
                        looking_for_team: data.looking_for_team,
                        services: data.services && (data.services as any[]).length > 0 ? data.services : DEFAULT_PACKAGES,
                        portfolio: data.portfolio && (data.portfolio as any[]).length > 0 ? data.portfolio : DEFAULT_PROJECTS,
                        skills: data.skills && (data.skills as any[]).length > 0 ? data.skills : [
                            { name: "JavaScript", level: 90, icon: "" },
                            { name: "React", level: 85, icon: "" },
                            { name: "Node.js", level: 70, icon: "" }
                        ]
                    });

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

    // --- HANDLERS ---
    const saveProfileField = (field: keyof ProfileData, value: any) => {
        setProfile(prev => ({ ...prev, [field]: value }));
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
                skills: profile.skills, // Add skills saving if needed
                video_url: profile.video_url,
                // video_status intentionally not updated here usually
                avatar_url: profile.avatar_url,
                cv_url: profile.cv_url,
                looking_for_team: profile.looking_for_team
            }).eq('id', user.id);

            if (error) throw error;
            setIsEditingMode(false);
            success("Profil başarıyla güncellendi! 🎉");
        } catch (e: any) {
            console.error(e);
            toastError("Kaydederken hata oluştu: " + e.message);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;
        setUploadingAvatar(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/avatar_${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
            setProfile(prev => ({ ...prev, avatar_url: publicUrl }));
            success("Fotoğraf yüklendi. Kaydetmeyi unutmayın!");
        } catch (e: any) {
            toastError("Hata: " + e.message);
        } finally {
            setUploadingAvatar(false);
        }
    };

    const handleCvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;
        if (file.size > 5 * 1024 * 1024) {
            toastError("Dosya boyutu 5MB'dan küçük olmalı.");
            return;
        }
        setUploadingCv(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/cv_${Date.now()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('cvs').upload(fileName, file);
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('cvs').getPublicUrl(fileName);
            setProfile(prev => ({ ...prev, cv_url: publicUrl }));
            success("CV yüklendi. Kaydetmeyi unutmayın!");
        } catch (e: any) {
            toastError("Hata: " + e.message);
        } finally {
            setUploadingCv(false);
        }
    };

    const handlePostComment = async () => {
        if (!user || !newComment.trim()) return;
        setSubmittingComment(true);
        const { error } = await supabase.from('profile_comments').insert({
            profile_id: user.id,
            author_id: user.id,
            content: newComment,
            status: 'pending'
        });
        if (error) toastError("Yorum hatası: " + error.message);
        else {
            success("Yorum admin onayına gönderildi.");
            setNewComment("");
        }
        setSubmittingComment(false);
    };

    const downloadPDF = async () => {
        try {
            // Dinamik import to avoid SSR issues
            const { jsPDF } = await import("jspdf");

            const doc = new jsPDF();

            // Fonts & Colors
            const mainColor = [37, 99, 235]; // Blue-600
            const darkColor = [30, 41, 59];  // Slate-800

            // --- HEADER ---
            // Name
            doc.setFontSize(24);
            doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
            doc.setFont("helvetica", "bold");
            doc.text(profile.full_name, 20, 30);

            // Title
            doc.setFontSize(14);
            doc.setTextColor(mainColor[0], mainColor[1], mainColor[2]);
            doc.text(profile.title.toUpperCase(), 20, 38);

            // Contact Info (Right Side)
            doc.setFontSize(10);
            doc.setTextColor(100, 116, 139); // Slate-500
            doc.text(profile.email, 190, 30, { align: 'right' });
            doc.text(profile.phone || '', 190, 35, { align: 'right' });
            doc.text(profile.location, 190, 40, { align: 'right' });

            // Line
            doc.setDrawColor(226, 232, 240);
            doc.line(20, 45, 190, 45);

            // --- BIO ---
            if (profile.bio) {
                doc.setFontSize(12);
                doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
                doc.setFont("helvetica", "bold");
                doc.text("HAKKIMDA", 20, 60);

                doc.setFont("helvetica", "normal");
                doc.setFontSize(10);
                doc.setTextColor(71, 85, 105);
                const bioLines = doc.splitTextToSize(profile.bio, 170);
                doc.text(bioLines, 20, 68);
            }

            // --- SKILLS ---
            const skillsY = profile.bio ? 100 : 60;
            doc.setFontSize(12);
            doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
            doc.setFont("helvetica", "bold");
            doc.text("YETENEKLER", 20, skillsY);

            let xPos = 20;
            let yPos = skillsY + 10;

            doc.setFont("helvetica", "normal");
            doc.setFontSize(10);
            doc.setFillColor(241, 245, 249); // bg-slate-100
            doc.setTextColor(51, 65, 85);

            profile.skills.forEach(skill => {
                doc.rect(xPos, yPos - 6, 40, 10, 'F');
                doc.text(skill.name, xPos + 5, yPos);
                xPos += 45;
                if (xPos > 150) {
                    xPos = 20;
                    yPos += 12;
                }
            });

            // --- SERVICES ---
            const servicesY = yPos + 20;
            doc.setFontSize(12);
            doc.setTextColor(darkColor[0], darkColor[1], darkColor[2]);
            doc.setFont("helvetica", "bold");
            doc.text("HİZMETLER", 20, servicesY);

            let sY = servicesY + 10;
            profile.services.forEach(pkg => {
                doc.setFont("helvetica", "bold");
                doc.setTextColor(mainColor[0], mainColor[1], mainColor[2]);
                doc.text(`${pkg.name} (${pkg.price})`, 20, sY);

                doc.setFont("helvetica", "normal");
                doc.setTextColor(71, 85, 105);
                doc.text(pkg.features.join(", "), 80, sY, { maxWidth: 110 });
                sY += 10;
            });

            // Footer
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text("Net-Work. Tarafindan Olusturulmustur", 105, 280, { align: 'center' });

            doc.save(`${profile.full_name.replace(/\s+/g, '_')}_CV.pdf`);
            success("CV başarıyla indirildi.");
        } catch (e: any) {
            console.error(e);
            toastError("PDF oluşturulurken hata: " + e.message);
        }
    };

    // --- RENDER HELPERS ---
    const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
        <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-6 ${className}`}>
            {children}
        </div>
    );

    const SectionTitle = ({ icon: Icon, title }: { icon: any, title: string }) => (
        <h2 className="text-xl font-bold text-gray-900 mb-5 flex items-center gap-2">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                <Icon className="w-5 h-5" />
            </div>
            {title}
        </h2>
    );

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-400">Yükleniyor...</div>;

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 pb-20">

            {/* --- TOP BAR --- */}
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 bg-opacity-80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="font-black text-xl tracking-tight text-slate-900 flex items-center gap-2">
                        Net<span className="text-blue-600">-Work</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <Link href="/" className="text-sm font-medium text-slate-500 hover:text-slate-900 px-3 py-2 rounded-md hover:bg-slate-50 transition-colors">
                            Ana Sayfa
                        </Link>
                        <button onClick={async () => { if (confirm('Çıkış yapılsın mı?')) { await supabase.auth.signOut(); success('Çıkış yapıldı'); router.push('/'); } }} className="text-sm font-medium text-red-500 hover:text-red-600 px-3 py-2 rounded-md hover:bg-red-50 transition-colors">
                            Çıkış Yap
                        </button>
                    </div>
                </div>
            </nav>

            <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">

                {/* --- LEFT SIDEBAR (Sticky) --- */}
                <aside className="lg:col-span-4 xl:col-span-3 space-y-6">
                    <div className="lg:sticky lg:top-24 space-y-6">

                        {/* PROFILE CARD */}
                        <Card className="text-center relative group overflow-hidden">
                            {/* EDIT TOGGLE (Floating) */}
                            <button
                                onClick={() => isEditingMode ? handleBatchSave() : setIsEditingMode(true)}
                                className={`absolute top-4 right-4 z-20 p-2 rounded-full shadow-sm transition-all ${isEditingMode ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600'}`}
                                title={isEditingMode ? "Kaydet" : "Düzenle"}
                            >
                                {isEditingMode ? <Save className="w-4 h-4" /> : <Edit2 className="w-4 h-4" />}
                            </button>

                            {/* Avatar */}
                            <div className="relative mx-auto w-32 h-32 mb-4">
                                <div className="w-full h-full rounded-full overflow-hidden border-4 border-white shadow-lg relative bg-slate-100 flex items-center justify-center group-hover:shadow-xl transition-shadow cursor-pointer"
                                    onClick={() => !isEditingMode && setIsVideoOpen(true)}
                                >
                                    {profile.avatar_url ? (
                                        <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <UserIcon className="w-12 h-12 text-slate-300" />
                                    )}
                                    {/* Video Indicator */}
                                    {profile.video_url && !isEditingMode && (
                                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="bg-white/90 p-2 rounded-full shadow-lg">
                                                <Play className="w-5 h-5 text-blue-600 fill-blue-600" />
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {isEditingMode && (
                                    <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 shadow-md transition-transform hover:scale-105">
                                        <Camera className="w-4 h-4" />
                                        <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} />
                                    </label>
                                )}
                            </div>

                            {/* Verification Badges */}
                            <div className="flex justify-center gap-2 mb-4">
                                {profile.is_secure && <div title="Onaylı Hesap" className="text-green-500 bg-green-50 p-1 rounded-full"><ShieldCheck className="w-4 h-4" /></div>}
                                {profile.fast_responder && <div title="Hızlı Cevap Veren" className="text-blue-500 bg-blue-50 p-1 rounded-full"><Zap className="w-4 h-4" /></div>}
                            </div>

                            {/* Name & Title */}
                            {isEditingMode ? (
                                <div className="space-y-2 mb-4">
                                    <input value={profile.full_name} onChange={e => saveProfileField('full_name', e.target.value)} className="w-full p-2 border rounded text-center font-bold text-gray-900 bg-gray-50" placeholder="Ad Soyad" />
                                    <input value={profile.title} onChange={e => saveProfileField('title', e.target.value)} className="w-full p-2 border rounded text-center text-sm text-gray-600 bg-gray-50" placeholder="Ünvan" />
                                </div>
                            ) : (
                                <>
                                    <h1 className="text-2xl font-bold text-gray-900 mb-1">{profile.full_name}</h1>
                                    <p className="text-blue-600 font-medium mb-4">{profile.title}</p>
                                </>
                            )}

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-2 border-t border-gray-100 pt-4 mb-6">
                                <div className="text-center p-2 rounded-lg bg-gray-50">
                                    <div className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">Saatlik</div>
                                    {isEditingMode ? (
                                        <input value={profile.hourly_rate} onChange={e => saveProfileField('hourly_rate', e.target.value)} className="w-full text-center bg-white border rounded text-sm font-bold text-gray-900" />
                                    ) : (
                                        <div className="font-bold text-gray-900">{profile.hourly_rate}</div>
                                    )}
                                </div>
                                <div className="text-center p-2 rounded-lg bg-gray-50">
                                    <div className="text-xs text-gray-500 uppercase font-semibold tracking-wider mb-1">Durum</div>
                                    {isEditingMode ? (
                                        <input value={profile.availability} onChange={e => saveProfileField('availability', e.target.value)} className="w-full text-center bg-white border rounded text-sm font-bold text-gray-900" />
                                    ) : (
                                        <div className="font-bold text-green-600">{profile.availability}</div>
                                    )}
                                </div>
                                <div className="col-span-2 text-center p-2 rounded-lg bg-indigo-50 border border-indigo-100 mt-2">
                                    {isEditingMode ? (
                                        <label className="flex items-center justify-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={profile.looking_for_team}
                                                onChange={e => saveProfileField('looking_for_team', e.target.checked)}
                                                className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                                            />
                                            <span className="text-xs font-bold text-indigo-900">Takım Arkadaşı Arıyorum</span>
                                        </label>
                                    ) : (
                                        profile.looking_for_team && (
                                            <div className="text-xs font-black text-indigo-600 flex items-center justify-center gap-1 animate-pulse">
                                                <Users className="w-3 h-3" /> TAKIM ARKADAŞI ARIYOR
                                            </div>
                                        )
                                    )}
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="space-y-3">
                                <button onClick={() => setContactModalOpen(true)} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-semibold shadow-sm shadow-blue-200 transition-all active:scale-95 flex items-center justify-center gap-2">
                                    <MessageSquare className="w-4 h-4" /> İletişime Geç
                                </button>

                                {isEditingMode ? (
                                    <label className={`w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 font-medium hover:bg-gray-50 cursor-pointer flex items-center justify-center gap-2 transition-colors ${uploadingCv ? 'opacity-50' : ''}`}>
                                        <FileText className="w-4 h-4" />
                                        {uploadingCv ? 'Yükleniyor...' : 'CV Yükle (PDF)'}
                                        <input type="file" className="hidden" accept=".pdf" onChange={handleCvUpload} />
                                    </label>
                                ) : (
                                    profile.cv_url && (
                                        <div className="flex gap-2">
                                            <a href={profile.cv_url} target="_blank" className="flex-1 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 block no-underline text-xs">
                                                Orijinal CV
                                            </a>
                                            <button onClick={downloadPDF} className="flex-[2] py-3 bg-slate-800 text-white rounded-xl font-semibold hover:bg-slate-900 transition-colors flex items-center justify-center gap-2 text-xs">
                                                <Download className="w-4 h-4" /> PDF Oluştur
                                            </button>
                                        </div>
                                    )
                                )}
                            </div>
                        </Card>

                        {/* SKILLS CARD */}
                        <Card>
                            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                                <CodeIcon className="w-4 h-4 text-gray-400" /> Yetenekler
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {profile.skills.map((skill, i) => (
                                    <span key={i} className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium border border-gray-200">
                                        {skill.name}
                                    </span>
                                ))}
                                {isEditingMode && <button onClick={() => info('Yetenek ekleme yakında')} className="px-3 py-1 border border-dashed border-gray-300 text-gray-400 rounded-lg text-sm hover:text-blue-500 hover:border-blue-500">+ Ekle</button>}
                            </div>
                        </Card>

                        {/* CONTACT INFO */}
                        <Card>
                            <h3 className="font-bold text-gray-900 mb-4">İletişim</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex items-center gap-3 text-gray-600">
                                    <Mail className="w-4 h-4" />
                                    {isEditingMode ? <input value={profile.email} onChange={e => saveProfileField('email', e.target.value)} className="border rounded p-1 flex-1 min-w-0" /> : <span className="truncate">{profile.email}</span>}
                                </div>
                                <div className="flex items-center gap-3 text-gray-600">
                                    <Phone className="w-4 h-4" />
                                    {isEditingMode ? <input value={profile.phone} onChange={e => saveProfileField('phone', e.target.value)} className="border rounded p-1 flex-1 min-w-0" /> : <span>{profile.phone || 'Belirtilmemiş'}</span>}
                                </div>
                                <div className="flex items-center gap-3 text-gray-600">
                                    <MapPin className="w-4 h-4" />
                                    {isEditingMode ? <input value={profile.location} onChange={e => saveProfileField('location', e.target.value)} className="border rounded p-1 flex-1 min-w-0" /> : <span>{profile.location}</span>}
                                </div>
                            </div>
                        </Card>
                    </div>
                </aside>

                {/* --- MAIN CONTENT --- */}
                <div className="lg:col-span-8 xl:col-span-9 space-y-8">

                    {/* ABOUT SECTION */}
                    <Card>
                        <SectionTitle icon={UserIcon} title="Hakkımda" />
                        {isEditingMode ? (
                            <textarea
                                value={profile.bio}
                                onChange={e => saveProfileField('bio', e.target.value)}
                                className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none bg-gray-50"
                                placeholder="Kendinizden bahsedin..."
                            />
                        ) : (
                            <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                                {profile.bio || "Henüz biyografi eklenmemiş."}
                            </p>
                        )}
                    </Card>

                    {/* PORTFOLIO SECTION */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <FolderKanban className="w-5 h-5 text-blue-600" />
                                Portfolyo
                            </h2>
                            {isEditingMode && (
                                <button onClick={() => {
                                    setEditingProject({ id: crypto.randomUUID(), title: '', category: '', description: '', technologies: [], imageUrl: 'from-blue-600 to-indigo-600' });
                                }} className="text-sm font-medium text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-colors">
                                    + Proje Ekle
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {profile.portfolio.map((project) => (
                                <div
                                    key={project.id}
                                    className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer flex flex-col h-full"
                                    onClick={() => !isEditingMode && setSelectedProject(project)}
                                >
                                    <div className={`h-40 bg-gradient-to-br ${project.imageUrl} relative p-4 flex flex-col justify-end`}>
                                        {isEditingMode && (
                                            <div className="absolute top-2 right-2 flex gap-1 z-10">
                                                <button onClick={(e) => { e.stopPropagation(); setEditingProject(project); }} className="p-1.5 bg-white/20 backdrop-blur-md rounded-md text-white hover:bg-white/30"><Edit2 className="w-3 h-3" /></button>
                                                <button onClick={(e) => { e.stopPropagation(); if (confirm('Silinsin mi?')) { setProfile(p => ({ ...p, portfolio: p.portfolio.filter(x => x.id !== project.id) })); success('Silindi') } }} className="p-1.5 bg-red-500/80 backdrop-blur-md rounded-md text-white hover:bg-red-600"><Trash2 className="w-3 h-3" /></button>
                                            </div>
                                        )}
                                        <span className="inline-block px-2 py-1 rounded-md bg-white/90 text-xs font-bold text-gray-900 self-start mb-2 backdrop-blur-sm shadow-sm">{project.category}</span>
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col">
                                        <h3 className="font-bold text-gray-900 text-lg mb-2">{project.title}</h3>
                                        <p className="text-gray-500 text-sm line-clamp-2 mb-4 flex-1">{project.description}</p>
                                        <div className="flex gap-2 flex-wrap mt-auto">
                                            {project.technologies?.map(t => (
                                                <span key={t} className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">{t}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* SERVICES SECTION */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-blue-600" />
                                Hizmet Paketleri
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {profile.services.map((pkg) => (
                                <div key={pkg.id} className={`p-6 rounded-2xl border ${pkg.popular ? 'border-blue-200 bg-blue-50/50 relative' : 'border-gray-200 bg-white'}`}>
                                    {pkg.popular && <span className="absolute top-0 right-0 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-bl-xl rounded-tr-xl">POPÜLER</span>}
                                    <div className="mb-4">
                                        <h3 className="font-bold text-gray-900 mb-1">{pkg.name}</h3>
                                        <div className="text-2xl font-black text-gray-900">{pkg.price}</div>
                                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-1">{pkg.duration}</div>
                                    </div>
                                    <ul className="space-y-2 mb-4">
                                        {pkg.features.map((f, i) => (
                                            <li key={i} className="text-sm text-gray-600 flex items-start gap-2">
                                                <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                                                <span className="leading-tight">{f}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    {isEditingMode ? (
                                        <button onClick={() => info('Düzenleme yakında')} className="w-full py-2 text-sm text-gray-400 border border-dashed rounded-lg">Düzenle</button>
                                    ) : (
                                        <button onClick={() => setContactModalOpen(true)} className="w-full py-2 bg-white border border-gray-200 text-gray-700 font-semibold rounded-lg text-sm hover:bg-gray-50 transition-colors">Seç</button>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* REVIEWS SECTION */}
                    <Card>
                        <SectionTitle icon={Star} title="Değerlendirmeler" />
                        <div className="space-y-6">
                            {comments.length > 0 ? comments.map(comment => (
                                <div key={comment.id} className="pb-4 border-b border-gray-100 last:border-0 last:pb-0">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <div className="font-bold text-gray-900">{comment.author_profile?.full_name || 'Gizli Kullanıcı'}</div>
                                            <div className="text-xs text-gray-400">{new Date(comment.created_at).toLocaleDateString()}</div>
                                        </div>
                                        <div className="flex text-yellow-400">
                                            {[1, 2, 3, 4, 5].map(i => <Star key={i} className="w-3 h-3 fill-current" />)}
                                        </div>
                                    </div>
                                    <p className="text-gray-600 text-sm leading-relaxed">"{comment.content}"</p>
                                </div>
                            )) : (
                                <div className="text-center py-8 text-gray-400">
                                    <Star className="w-8 h-8 mx-auto mb-2 opacity-20" />
                                    <p>Henüz değerlendirme yapılmamış.</p>
                                </div>
                            )}

                            {/* Add Comment */}
                            <div className="mt-6 pt-6 border-t border-gray-100">
                                <h4 className="text-sm font-bold text-gray-700 mb-2">Yorum Yap</h4>
                                <div className="flex gap-2">
                                    <input
                                        value={newComment}
                                        onChange={e => setNewComment(e.target.value)}
                                        placeholder="Deneyimini paylaş..."
                                        className="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                                    />
                                    <button
                                        onClick={handlePostComment}
                                        disabled={submittingComment || !newComment.trim()}
                                        className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
                                    >
                                        Gönder
                                    </button>
                                </div>
                            </div>
                        </div>
                    </Card>

                    {/* DANGER ZONE */}
                    <div className="text-right">
                        <button onClick={async () => {
                            if (confirm('Profil kalıcı olarak silinsin mi?')) {
                                try {
                                    if (user) {
                                        await supabase.from('profiles').delete().eq('id', user.id);
                                        success('Profil silindi');
                                        router.push('/profil');
                                    }
                                } catch (e: any) { toastError(e.message); }
                            }
                        }} className="text-xs text-red-400 hover:text-red-600 underline">
                            Profili Sil ve Sıfırla
                        </button>
                    </div>

                </div>
            </main>

            {/* --- MODALS --- */}
            <AnimatePresence>
                {/* Contact Modal */}
                {contactModalOpen && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setContactModalOpen(false)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-sm p-6 shadow-xl">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <MessageSquare className="w-8 h-8 text-blue-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900">İletişim Başlat</h3>
                            </div>
                            <div className="space-y-4">
                                <div className="p-3 bg-gray-50 rounded-lg flex items-center gap-3">
                                    <Mail className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <div className="text-xs font-bold text-gray-400">EMAIL</div>
                                        <div className="text-sm font-medium text-gray-900">{profile.email}</div>
                                    </div>
                                </div>
                                <button onClick={() => router.push('/mesajlar')} className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold">Mesaj Gönder</button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* Project Detail Modal */}
                {selectedProject && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedProject(null)} className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <motion.div initial={{ y: 50 }} animate={{ y: 0 }} exit={{ y: 50 }} onClick={e => e.stopPropagation()} className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
                            <div className={`h-48 bg-gradient-to-br ${selectedProject.imageUrl} relative shrink-0`}>
                                <button onClick={() => setSelectedProject(null)} className="absolute top-4 right-4 bg-black/30 text-white p-2 rounded-full hover:bg-black/50"><X className="w-5 h-5" /></button>
                                <div className="absolute bottom-6 left-6">
                                    <h2 className="text-3xl font-bold text-white mb-2">{selectedProject.title}</h2>
                                    <span className="px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-white text-xs font-bold">{selectedProject.category}</span>
                                </div>
                            </div>
                            <div className="p-8 overflow-y-auto">
                                <h3 className="font-bold text-gray-900 mb-2">Proje Detayları</h3>
                                <p className="text-gray-600 leading-relaxed mb-6">{selectedProject.description}</p>
                                <h3 className="font-bold text-gray-900 mb-2">Kullanılan Teknolojiler</h3>
                                <div className="flex gap-2 flex-wrap">
                                    {selectedProject.technologies?.map(t => <span key={t} className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">{t}</span>)}
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}

                {/* Simple Edit Project Modal (Minimal implementation for editing) */}
                {editingProject && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl p-6 w-full max-w-md space-y-4">
                            <h3 className="font-bold text-lg">Proje Düzenle</h3>
                            <input placeholder="Başlık" className="w-full border p-2 rounded" value={editingProject.title} onChange={e => setEditingProject({ ...editingProject, title: e.target.value })} />
                            <input placeholder="Kategori" className="w-full border p-2 rounded" value={editingProject.category} onChange={e => setEditingProject({ ...editingProject, category: e.target.value })} />
                            <textarea placeholder="Açıklama" className="w-full border p-2 rounded h-24" value={editingProject.description} onChange={e => setEditingProject({ ...editingProject, description: e.target.value })} />
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setEditingProject(null)} className="px-4 py-2 text-gray-500">İptal</button>
                                <button onClick={() => {
                                    setProfile(prev => {
                                        const exists = prev.portfolio.find(p => p.id === editingProject.id);
                                        const newP = exists ? prev.portfolio.map(p => p.id === editingProject.id ? editingProject : p) : [...prev.portfolio, editingProject];
                                        return { ...prev, portfolio: newP };
                                    });
                                    setEditingProject(null);
                                    success('Proje güncellendi (Kaydetmeyi unutmayın)');
                                }} className="px-4 py-2 bg-blue-600 text-white rounded">Listeye Ekle</button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}

// Icon Helper
const CodeIcon = (props: any) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg>
);