'use client';

import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { 
    LogOut, Building2, Briefcase, Star, Settings, LayoutGrid, 
    Users, MapPin, Globe, Mail, ShieldCheck, ShieldAlert, 
    AlertTriangle, Clock, Save, Edit2, Trash2 
} from 'lucide-react';
import Image from 'next/image';
import { useToast } from "@/contexts/ToastContext";
import { getProfile, updateProfileGeneric, deleteProfileSelf } from '../actions';

// --- TİP TANIMLAMALARI ---
interface CompanyData {
    company_name: string;
    industry: string;
    location: string;
    founded_year: string;
    description: string;
    website: string;
    email: string;
    phone: string;
    employee_count: string;
    benefits: string[];
    is_secure?: boolean;
    is_suspicious?: boolean;
    fast_responder?: boolean;
    avatar_url?: string | null;  // Logo için
}

interface Job {
    id: number;
    title: string;
    type: string;
    salary: string;
    applicants: number;
    status: 'active' | 'draft';
}

interface Review {
    name: string;
    role: string;
    rating: number;
    comment: string;
    date: string;
}

// --- YARDIMCI FONKSİYONLAR ---
const getInitialCompany = (): CompanyData => {
    return {
        company_name: 'TechCorp İstanbul',
        industry: 'Teknoloji',
        location: 'İstanbul, Maslak',
        founded_year: '2010',
        description: 'Türkiye\'nin lider teknoloji şirketlerinden biriyiz. Yazılım geliştirme, bulut çözümleri ve dijital dönüşüm alanlarında hizmet veriyoruz.',
        website: 'www.techcorp.com.tr',
        email: 'info@techcorp.com',
        phone: '+90 212 345 6789',
        employee_count: '200+',
        benefits: [
            'Özel Sağlık Sigortası',
            'Esnek Çalışma Saatleri',
            'Eğitim Bütçesi',
            'Ücretsiz Yemek',
            'Spor Salonu',
            'Servis',
            'Yıllık İzin',
            'Primler'
        ]
    };
};

export default function EmployerProfile() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [company, setCompany] = useState<CompanyData>(getInitialCompany);
    const [activeTab, setActiveTab] = useState<'company' | 'jobs' | 'reviews'>('company');
    const [isEditing, setIsEditing] = useState(false);
    const [newBenefit, setNewBenefit] = useState('');
    const [loading, setLoading] = useState(true);
    const { success, error: toastError } = useToast();

    // Mock Data for Jobs
    const [activeJobs, setActiveJobs] = useState<Job[]>([
        { id: 1, title: 'Senior React Developer', type: 'Full-time', salary: '$5k-$7k', applicants: 24, status: 'active' },
        { id: 2, title: 'UI/UX Designer', type: 'Part-time', salary: '$3k-$4k', applicants: 18, status: 'active' },
        { id: 3, title: 'DevOps Engineer', type: 'Contract', salary: '$6k-$8k', applicants: 12, status: 'active' },
    ]);

    // Mock Data for Reviews
    const reviews: Review[] = [
        { name: 'Emre Şahin', role: 'Frontend Developer • 2 yıl', rating: 5, comment: 'Harika bir çalışma ortamı! Yöneticiler çok destekleyici, kariyer gelişimi için çok fırsat var.', date: '3 ay önce' },
        { name: 'Ayşe Yılmaz', role: 'Backend Developer • 1 yıl', rating: 4, comment: 'Teknik olarak çok güçlü bir ekip. Sürekli yeni teknolojiler öğreniyoruz.', date: '1 ay önce' },
    ];

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
                    setCompany(prev => ({
                        ...prev,
                        company_name: data.full_name || prev.company_name,
                        industry: data.title || prev.industry,
                        location: data.location || prev.location,
                        description: data.bio || prev.description,
                        email: session.user?.email || prev.email,
                        phone: data.phone || prev.phone,
                        is_secure: data.is_secure,
                        is_suspicious: data.is_suspicious,
                        fast_responder: data.fast_responder,
                        founded_year: data.metadata?.founded_year || prev.founded_year,
                        website: data.metadata?.website || prev.website,
                        employee_count: data.metadata?.employee_count || prev.employee_count,
                        benefits: data.metadata?.benefits || prev.benefits,
                        avatar_url: data.avatar_url
                    }));
                }
            } catch (error) {
                console.error('Veri çekme hatası:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [status, session, router]);

    const handleLogout = async () => {
        if (confirm("Çıkış yapmak istediğinize emin misiniz?")) {
            await signOut({ callbackUrl: '/' });
        }
    };

    const handleSaveCompany = async () => {
        try {
            await updateProfileGeneric({
                full_name: company.company_name,
                title: company.industry,
                location: company.location,
                bio: company.description,
                phone: company.phone,
                avatar_url: company.avatar_url,
                metadata: {
                    founded_year: company.founded_year,
                    website: company.website,
                    employee_count: company.employee_count,
                    benefits: company.benefits
                }
            });
            setIsEditing(false);
            success('Şirket bilgileri güncellendi!');
        } catch (error: any) {
            console.error('Kaydetme hatası:', error);
            toastError('Kaydetme sırasında bir hata oluştu');
        }
    };

    const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            const formDataArg = new FormData();
            formDataArg.append('file', file);
            formDataArg.append('folder', 'avatars');

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formDataArg
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            setCompany(prev => ({ ...prev, avatar_url: data.url }));
            success("Şirket logosu yüklendi. Kaydetmeyi unutmayın!");
        } catch (error: any) {
            toastError("Logo yükleme hatası: " + error.message);
        }
    };

    const handleDeleteProfile = async () => {
        const confirmDelete = window.confirm("Şirket Profilini SİLMEK istediğinize emin misiniz? Bu işlem geri alınamaz.");
        if (!confirmDelete) return;

        try {
            await deleteProfileSelf();
            router.push('/profil');
        } catch (error: any) {
            alert("Silme hatası: " + error.message);
        }
    };

    const addBenefit = () => {
        if (newBenefit.trim() && !company.benefits.includes(newBenefit.trim())) {
            setCompany(prev => ({
                ...prev,
                benefits: [...prev.benefits, newBenefit.trim()]
            }));
            setNewBenefit('');
        }
    };

    const removeBenefit = (benefitToRemove: string) => {
        setCompany(prev => ({
            ...prev,
            benefits: prev.benefits.filter(b => b !== benefitToRemove)
        }));
    };

    if (loading || status === 'loading') {
        return (
            <div className="flex h-screen items-center justify-center bg-[#f8fafc]">
                <div className="text-[#3498db] font-bold text-xl animate-pulse">Şirket profili yükleniyor...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] font-sans text-[#2c3e50]">
            <nav className="bg-white border-b border-gray-200 sticky top-0 z-40 bg-opacity-80 backdrop-blur-md h-16 flex items-center">
                <div className="max-w-[1200px] mx-auto w-full px-5 flex items-center justify-between">
                    <Link href="/" className="font-black text-xl tracking-tight text-slate-900 no-underline">
                        Net<span className="text-blue-600">-Work</span>
                    </Link>
                    <div className="flex items-center gap-3">
                        <Link href="/" className="text-sm font-bold text-slate-500 hover:text-slate-900 no-underline">Ana Sayfa</Link>
                        <button onClick={handleLogout} className="text-sm font-bold text-red-500 hover:text-red-600">Çıkış</button>
                    </div>
                </div>
            </nav>

            {/* Header */}
            <header className="bg-gradient-to-br from-[#1e3c72] to-[#2a5298] text-white py-[60px] pb-10">
                <div className="max-w-[1200px] mx-auto px-5">
                    <div className="flex flex-col md:flex-row gap-10 items-center md:items-start text-center md:text-left">
                        <div className="w-[120px] h-[120px] bg-gradient-to-br from-[#3498db] to-[#2980b9] rounded-3xl flex items-center justify-center text-[2.5rem] font-bold text-white border-[5px] border-white/20 shadow-2xl relative overflow-hidden group">
                            {company.avatar_url ? (
                                <img src={company.avatar_url} alt="Logo" className="w-full h-full object-cover" />
                            ) : (
                                company.company_name.substring(0, 2).toUpperCase()
                            )}

                            {isEditing && (
                                <label className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                    <span className="text-[10px] text-white font-black uppercase">Logo Değiştir</span>
                                </label>
                            )}
                            <div className="absolute -top-2.5 -right-2.5 bg-green-500 text-white px-3 py-1.5 rounded-full text-[10px] font-black shadow-md border border-white/20">
                                ✓ ONAYLI
                            </div>
                        </div>

                        <div className="flex-1 w-full">
                            {isEditing ? (
                                <div className="flex flex-col gap-2.5 mb-5 max-w-xl mx-auto md:mx-0">
                                    <input
                                        type="text"
                                        value={company.company_name}
                                        onChange={(e) => setCompany({ ...company, company_name: e.target.value })}
                                        className="p-3 border-2 border-white/30 rounded-lg text-base bg-white/10 text-white outline-none focus:border-[#3498db] focus:bg-white/15 placeholder-white/60"
                                        placeholder="Şirket Adı"
                                    />
                                    <input
                                        type="text"
                                        value={company.industry}
                                        onChange={(e) => setCompany({ ...company, industry: e.target.value })}
                                        className="p-3 border-2 border-white/30 rounded-lg text-base bg-white/10 text-white outline-none focus:border-[#3498db] focus:bg-white/15 placeholder-white/60"
                                        placeholder="Sektör"
                                    />
                                    <input
                                        type="text"
                                        value={company.location}
                                        onChange={(e) => setCompany({ ...company, location: e.target.value })}
                                        className="p-3 border-2 border-white/30 rounded-lg text-base bg-white/10 text-white outline-none focus:border-[#3498db] focus:bg-white/15 placeholder-white/60"
                                        placeholder="Lokasyon"
                                    />
                                </div>
                            ) : (
                                <>
                                    <h1 className="text-[2.5rem] mb-2.5 text-white font-black tracking-tight leading-none">{company.company_name}</h1>
                                    <p className="text-xl opacity-90 mb-1 flex items-center justify-center md:justify-start gap-2">🏢 {company.industry}</p>
                                    <p className="text-white/80 mb-4 flex items-center justify-center md:justify-start gap-1">📍 {company.location}</p>

                                    <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-2">
                                        {company.is_secure && (
                                            <span className="flex items-center gap-1 bg-green-500 px-3 py-1 rounded-full text-[10px] font-black uppercase text-white shadow-lg">
                                                <ShieldCheck className="w-3 h-3" /> GÜVENLİ
                                            </span>
                                        )}
                                        {company.fast_responder && (
                                            <span className="flex items-center gap-1 bg-blue-500 px-3 py-1 rounded-full text-[10px] font-black uppercase text-white shadow-lg">
                                                <Clock className="w-3 h-3" /> HIZLI CEVAP
                                            </span>
                                        )}
                                    </div>
                                </>
                            )}

                            <div className="flex flex-col md:flex-row gap-7 my-6 bg-white/10 p-5 rounded-3xl backdrop-blur-md border border-white/20">
                                <div className="flex-1 text-center">
                                    <span className="block text-3xl font-black text-white">{activeJobs.length}</span>
                                    <span className="text-[10px] text-white/60 font-black tracking-[0.2em] uppercase">Aktif İlan</span>
                                </div>
                                <div className="flex-1 text-center border-x border-white/10">
                                    <span className="block text-3xl font-black text-white">4.7</span>
                                    <span className="text-[10px] text-white/60 font-black tracking-[0.2em] uppercase">Puan</span>
                                </div>
                                <div className="flex-1 text-center">
                                    <span className="block text-3xl font-black text-white">{company.employee_count}</span>
                                    <span className="text-[10px] text-white/60 font-black tracking-[0.2em] uppercase">Çalışan</span>
                                </div>
                            </div>

                            <div className="flex gap-4 flex-wrap justify-center md:justify-start mt-8">
                                {isEditing ? (
                                    <>
                                        <button className="py-3 px-8 rounded-2xl border-none cursor-pointer font-black text-sm bg-white text-blue-900 hover:bg-[#3498db] hover:text-white transition-all shadow-lg active:scale-95" onClick={handleSaveCompany}>
                                            KAYDET
                                        </button>
                                        <button className="py-3 px-8 rounded-2xl cursor-pointer font-black text-sm bg-transparent border-2 border-white/40 text-white hover:bg-white/10 transition-all font-black" onClick={() => setIsEditing(false)}>
                                            İPTAL
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button className="py-3 px-8 rounded-2xl border-none cursor-pointer font-black text-sm bg-white text-blue-900 hover:bg-[#3498db] hover:text-white transition-all shadow-lg active:scale-95" onClick={() => setIsEditing(true)}>
                                            DÜZENLE
                                        </button>
                                        <Link href="/yeni-ilan" className="py-3 px-8 rounded-2xl no-underline border-none cursor-pointer font-black text-sm bg-[#3498db] text-white hover:bg-[#2980b9] shadow-lg active:scale-95">
                                            + YENİ İLAN
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-[1200px] mx-auto px-5 pb-[60px] pt-10">
                <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-10">
                    {/* Left Sidebar */}
                    <aside className="space-y-6">
                        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                            <h3 className="text-xs font-black text-slate-400 tracking-[0.2em] uppercase mb-6 flex items-center gap-2">
                                <Building2 className="w-4 h-4" /> Şirket Bilgileri
                            </h3>
                            {isEditing ? (
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase">Kuruluş Yılı</label>
                                        <input type="text" value={company.founded_year} onChange={e => setCompany({...company, founded_year: e.target.value})} className="w-full p-3 bg-slate-50 border-none rounded-xl text-sm font-bold mt-1" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase">Websitesi</label>
                                        <input type="text" value={company.website} onChange={e => setCompany({...company, website: e.target.value})} className="w-full p-3 bg-slate-50 border-none rounded-xl text-sm font-bold mt-1" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-slate-400 uppercase">Çalışan Sayısı</label>
                                        <select value={company.employee_count} onChange={e => setCompany({...company, employee_count: e.target.value})} className="w-full p-3 bg-slate-50 border-none rounded-xl text-sm font-bold mt-1">
                                            <option value="1-10">1-10</option>
                                            <option value="11-50">11-50</option>
                                            <option value="51-200">51-200</option>
                                            <option value="200+">200+</option>
                                        </select>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-500">Kuruluş</span>
                                        <span className="text-xs font-black text-slate-900">{company.founded_year}</span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-xs font-bold text-slate-500">Çalışan</span>
                                        <span className="text-xs font-black text-slate-900">{company.employee_count}</span>
                                    </div>
                                    <div className="pt-4 border-t border-slate-50">
                                        <a href={company.website} target="_blank" className="flex items-center gap-2 text-xs font-black text-blue-600 no-underline hover:text-blue-700">
                                            <Globe className="w-4 h-4" /> {company.website}
                                        </a>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-gray-100">
                            <h3 className="text-xs font-black text-slate-400 tracking-[0.2em] uppercase mb-6 flex items-center gap-2">
                                <Star className="w-4 h-4" /> Avantajlar
                            </h3>
                            <div className="flex flex-wrap gap-2">
                                {company.benefits.map((benefit, index) => (
                                    <div key={index} className="px-3 py-1 bg-slate-50 text-slate-700 rounded-lg text-[10px] font-black uppercase flex items-center gap-1 transition-all hover:bg-slate-100">
                                        {benefit}
                                        {isEditing && (
                                            <button onClick={() => removeBenefit(benefit)} className="text-red-400 hover:text-red-600">×</button>
                                        )}
                                    </div>
                                ))}
                            </div>
                            {isEditing && (
                                <div className="mt-4 flex gap-2">
                                    <input type="text" value={newBenefit} onChange={e => setNewBenefit(e.target.value)} onKeyPress={e => e.key === 'Enter' && addBenefit()} className="flex-1 p-2 bg-slate-50 border-none rounded-xl text-xs font-bold" placeholder="Ekle..." />
                                    <button onClick={addBenefit} className="p-2 bg-blue-600 text-white rounded-xl">+</button>
                                </div>
                            )}
                        </div>

                        <button onClick={handleDeleteProfile} className="w-full p-4 text-[10px] font-black tracking-widest uppercase text-red-500 hover:bg-red-50 rounded-2xl transition-all">
                            Profili Sıfırla
                        </button>
                    </aside>

                    {/* Right Content */}
                    <div className="space-y-8">
                        {/* Tabs */}
                        <div className="flex gap-1.5 border-b border-slate-200">
                            {[
                                { id: 'company', label: 'Hakkımızda', icon: '🏢' },
                                { id: 'jobs', label: 'İş İlanları', icon: '📋' },
                                { id: 'reviews', label: 'Yorumlar', icon: '⭐' }
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={`px-8 py-4 text-xs font-black uppercase tracking-[0.2em] relative transition-all ${activeTab === tab.id ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {tab.icon} {tab.label}
                                    {activeTab === tab.id && <div className="absolute bottom-0 left-0 w-full h-1 bg-blue-600 rounded-t-full shadow-lg shadow-blue-200" />}
                                </button>
                            ))}
                        </div>

                        <section className="bg-white p-10 rounded-[40px] shadow-sm border border-gray-100 min-h-[400px]">
                            {activeTab === 'company' && (
                                <div className="space-y-8">
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 mb-6 tracking-tight">Şirket Profili</h3>
                                        {isEditing ? (
                                            <textarea 
                                                value={company.description} 
                                                onChange={e => setCompany({...company, description: e.target.value})} 
                                                className="w-full h-48 p-6 bg-slate-50 border-none rounded-3xl text-sm font-bold leading-relaxed outline-none focus:ring-2 ring-blue-500/10" 
                                            />
                                        ) : (
                                            <p className="text-slate-600 leading-relaxed text-sm font-medium whitespace-pre-wrap">{company.description}</p>
                                        )}
                                    </div>
                                    <div className="grid md:grid-cols-3 gap-4">
                                        {[
                                            { title: 'Vizyon', text: 'Geleceği şekillendiriyoruz', icon: '🎯' },
                                            { title: 'Değerler', text: 'Güven ve şeffaflık', icon: '💎' },
                                            { title: 'Kültür', text: 'Önce çalışan mutluluğu', icon: '🌈' }
                                        ].map((item, i) => (
                                            <div key={i} className="p-6 bg-slate-50 rounded-[32px] border border-slate-100 transition-all hover:scale-[1.02]">
                                                <div className="text-2xl mb-3">{item.icon}</div>
                                                <h4 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-1">{item.title}</h4>
                                                <p className="text-xs text-slate-500 font-bold">{item.text}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'jobs' && (
                                <div className="space-y-4">
                                    {activeJobs.map(job => (
                                        <div key={job.id} className="p-8 bg-slate-50 rounded-[32px] flex items-center justify-between transition-all hover:bg-white hover:shadow-xl hover:shadow-slate-200/50 group border border-transparent hover:border-slate-100">
                                            <div>
                                                <h4 className="text-lg font-black text-slate-900 mb-2">{job.title}</h4>
                                                <div className="flex gap-4">
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-blue-600 bg-blue-50 px-3 py-1 rounded-lg">{job.type}</span>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-green-600 bg-green-50 px-3 py-1 rounded-lg">{job.salary}</span>
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-3 py-1">{job.applicants} BAŞVURU</span>
                                                </div>
                                            </div>
                                            <button className="p-4 bg-white text-slate-900 rounded-2xl font-black text-xs shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                                                İLAN DETAYI
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === 'reviews' && (
                                <div className="space-y-6">
                                    {reviews.map((review, i) => (
                                        <div key={i} className="p-8 bg-slate-50 rounded-[32px] border border-slate-100">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-white text-xl">
                                                        {review.name[0]}
                                                    </div>
                                                    <div>
                                                        <h4 className="text-sm font-black text-slate-900">{review.name}</h4>
                                                        <p className="text-[10px] font-black uppercase text-slate-400">{review.role}</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-0.5">
                                                    {[...Array(5)].map((_, j) => (
                                                        <Star key={j} className={`w-3 h-3 ${j < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200'}`} />
                                                    ))}
                                                </div>
                                            </div>
                                            <p className="text-sm text-slate-600 font-medium italic leading-relaxed">"{review.comment}"</p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
}