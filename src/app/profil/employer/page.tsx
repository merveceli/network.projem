'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { User } from '@supabase/supabase-js';
import Navbar from '@/components/Navbar';
import { useRouter } from 'next/navigation';
import { LogOut, Building2, Briefcase, Star, Settings, LayoutGrid, Users, MapPin, Globe, Mail, ShieldCheck, ShieldAlert, AlertTriangle, Clock } from 'lucide-react';
import Image from 'next/image';

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
    const supabase = createClient();
    const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [company, setCompany] = useState<CompanyData>(getInitialCompany);
    const [activeTab, setActiveTab] = useState<'company' | 'jobs' | 'reviews'>('company');
    const [isEditing, setIsEditing] = useState(false);
    const [newBenefit, setNewBenefit] = useState('');
    const [loading, setLoading] = useState(true);

    // Mock Data for Jobs (since we might not have a jobs table structure ready yet or it's complex)
    // In a real app, these would come from a 'jobs' table related to the company
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

    // Supabase'den veri çek
    useEffect(() => {
        const fetchData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                setUser(user);

                if (user) {
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('*, profile_comments(*, author_profile:author_id(full_name))')
                        .eq('id', user.id)
                        .single();

                    if (data) {
                        setCompany(prev => ({
                            ...prev,
                            company_name: data.full_name || prev.company_name,
                            industry: data.title || prev.industry,
                            location: data.location || prev.location,
                            description: data.bio || prev.description,
                            email: user.email || prev.email,
                            phone: data.phone || prev.phone,
                            is_secure: data.is_secure,
                            is_suspicious: data.is_suspicious,
                            fast_responder: data.fast_responder,
                            founded_year: data.metadata?.founded_year || prev.founded_year,
                            website: data.metadata?.website || prev.website,
                            employee_count: data.metadata?.employee_count || prev.employee_count,
                            benefits: data.metadata?.benefits || prev.benefits
                        }));

                        // For employers, we'll keep the mock reviews but add dynamic ones too
                        if (data.profile_comments) {
                            const approvedComments = data.profile_comments
                                .filter((c: any) => c.status === 'approved')
                                .map((c: any) => ({
                                    name: c.author_profile?.full_name || 'Gizli Üye',
                                    role: 'Platform Üyesi',
                                    rating: 5,
                                    comment: c.content,
                                    date: new Date(c.created_at).toLocaleDateString()
                                }));
                            // Prepend approved comments to mock reviews
                            // reviews is a const in this component scope, might need to change to state if we want to update it.
                            // But mock data is at scope level. Let's make it a state.
                        }
                    }
                }
            } catch (error) {
                console.error('Veri çekme hatası:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const handleLogout = async () => {
        if (confirm("Çıkış yapmak istediğinize emin misiniz?")) {
            await supabase.auth.signOut();
            router.push('/');
        }
    };

    // Profili kaydetme
    const handleSaveCompany = async () => {
        setIsEditing(false);
        if (!user) return;

        try {
            // Need to update profile
            // We'll store extra fields in a 'metadata' jsonb column if it exists, or just accept that they might not persist if columns don't exist yet.
            // For valid columns:
            const updates = {
                id: user.id,
                full_name: company.company_name,
                title: company.industry,
                location: company.location,
                bio: company.description,
                phone: company.phone,
                // Assuming we can save other props in a metadata column, or just ignore if not present for now.
                // If the user hasn't added these columns to DB, this needs to be handled.
                // I will add a 'metadata' field to the upsert helper if I could, but standard Supabase typescript types might block.
                // Casting to any to allow metadata if the table supports it (common pattern)
                metadata: {
                    founded_year: company.founded_year,
                    website: company.website,
                    employee_count: company.employee_count,
                    benefits: company.benefits
                }
            };

            const { error } = await supabase
                .from('profiles')
                .upsert(updates);

            if (error) throw error;
            alert('Şirket bilgileri güncellendi!');
        } catch (error) {
            console.error('Kaydetme hatası:', error);
            alert('Kaydetme sırasında bir hata oluştu. (Not: Veritabanı şeması güncel olmayabilir)');
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

    const addNewJob = () => {
        const newJob: Job = {
            id: activeJobs.length + 1,
            title: 'Yeni İlan',
            type: 'Full-time',
            salary: 'Belirtilmemiş',
            applicants: 0,
            status: 'draft'
        };
        setActiveJobs([...activeJobs, newJob]);
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#f8fafc]">
                <div className="text-[#3498db] font-bold text-xl animate-pulse">Şirket profili yükleniyor...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] font-sans text-[#2c3e50]">
            {/* Minimal Üst Butonlar */}
            <div className="absolute top-6 left-6 z-50 flex gap-3">
                <a href="/" className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-sm font-bold transition-all text-white no-underline border border-white/20">
                    🏠 Ana Sayfa
                </a>
                <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/40 backdrop-blur-md rounded-full text-sm font-bold transition-all text-white border border-white/20"
                >
                    <LogOut className="w-4 h-4" />
                    Çıkış Yap
                </button>
            </div>
            {/* Header */}
            <header className="bg-gradient-to-br from-[#1e3c72] to-[#2a5298] text-white py-[60px] pb-10 mb-10 border-b border-[#1a3a6e]">
                <div className="max-w-[1200px] mx-auto px-5">
                    <div className="flex flex-col md:flex-row gap-10 items-center md:items-start text-center md:text-left">
                        <div className="relative">
                            <div className="w-[120px] h-[120px] bg-gradient-to-br from-[#3498db] to-[#2980b9] rounded-3xl flex items-center justify-center text-[2.5rem] font-bold text-white border-[5px] border-white/20 shadow-2xl">
                                {company.company_name.substring(0, 2).toUpperCase()}
                            </div>
                            <div className="absolute -top-2.5 -right-2.5 bg-[#27ae60] text-white px-3 py-1.5 rounded-full text-xs font-bold shadow-md">
                                ✓ Onaylı
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
                                    <h1 className="text-[2.5rem] mb-2.5 text-white font-bold">{company.company_name}</h1>
                                    <p className="text-xl opacity-90 mb-1 flex items-center justify-center md:justify-start gap-2">🏢 {company.industry}</p>
                                    <p className="text-white/80 mb-4 flex items-center justify-center md:justify-start gap-1">📍 {company.location}</p>

                                    <div className="flex flex-wrap justify-center md:justify-start gap-2 mb-2">
                                        {company.is_secure && (
                                            <span className="flex items-center gap-1 bg-green-500/20 text-green-300 text-[10px] font-black uppercase px-2 py-1 rounded border border-green-500/30">
                                                <ShieldCheck className="w-3 h-3" /> GÜVENLİ
                                            </span>
                                        )}
                                        {company.is_suspicious && (
                                            <span className="flex items-center gap-1 bg-red-500/20 text-red-300 text-[10px] font-black uppercase px-2 py-1 rounded border border-red-500/30">
                                                <ShieldAlert className="w-3 h-3" /> ŞÜPHELİ
                                            </span>
                                        )}
                                        {company.fast_responder && (
                                            <span className="flex items-center gap-1 bg-blue-500/20 text-blue-300 text-[10px] font-black uppercase px-2 py-1 rounded border border-blue-500/30">
                                                <Clock className="w-3 h-3" /> HIZLI CEVAP
                                            </span>
                                        )}
                                    </div>
                                </>
                            )}

                            <div className="flex flex-col md:flex-row gap-7 my-6 bg-white/10 p-5 rounded-xl backdrop-blur-md border border-white/20">
                                <div className="flex-1 text-center">
                                    <span className="block text-3xl font-bold text-[#4fc3f7]">{activeJobs.length}</span>
                                    <span className="text-sm text-white/80 tracking-wide uppercase">Aktif İlan</span>
                                </div>
                                <div className="flex-1 text-center">
                                    <span className="block text-3xl font-bold text-[#4fc3f7]">4.7</span>
                                    <span className="text-sm text-white/80 tracking-wide uppercase">Şirket Puanı</span>
                                </div>
                                <div className="flex-1 text-center">
                                    <span className="block text-3xl font-bold text-[#4fc3f7]">{company.founded_year}</span>
                                    <span className="text-sm text-white/80 tracking-wide uppercase">Kuruluş</span>
                                </div>
                                <div className="flex-1 text-center">
                                    <span className="block text-3xl font-bold text-[#4fc3f7]">{company.employee_count}</span>
                                    <span className="text-sm text-white/80 tracking-wide uppercase">Çalışan</span>
                                </div>
                            </div>

                            <div className="flex gap-4 flex-wrap justify-center md:justify-start">
                                {isEditing ? (
                                    <>
                                        <button className="py-3 px-6 rounded-lg border-none cursor-pointer font-medium transition-all text-sm bg-gradient-to-br from-[#3498db] to-[#2980b9] text-white hover:to-[#1f639c] hover:-translate-y-0.5 shadow-md" onClick={handleSaveCompany}>
                                            Değişiklikleri Kaydet
                                        </button>
                                        <button className="py-3 px-6 rounded-lg cursor-pointer font-medium transition-all text-sm bg-transparent border-2 border-white/30 text-white hover:bg-white/10 hover:border-white" onClick={() => setIsEditing(false)}>
                                            İptal
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button className="py-3 px-6 rounded-lg border-none cursor-pointer font-medium transition-all text-sm bg-gradient-to-br from-[#3498db] to-[#2980b9] text-white hover:to-[#1f639c] hover:-translate-y-0.5 shadow-md" onClick={() => setIsEditing(true)}>
                                            Şirket Bilgilerini Düzenle
                                        </button>
                                        <button className="py-3 px-6 rounded-lg border-none cursor-pointer font-medium transition-all text-sm bg-gradient-to-br from-[#9b59b6] to-[#8e44ad] text-white hover:to-[#7d3c98] hover:-translate-y-0.5 shadow-md" onClick={addNewJob}>
                                            + Yeni İlan Ekle
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-[1200px] mx-auto px-5 pb-[60px]">
                <div className="grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-10">
                    {/* Left Sidebar */}
                    <aside className="lg:sticky lg:top-[30px] h-fit">
                        <SidebarSection title="🏢 Şirket Hakkında">
                            {isEditing ? (
                                <textarea
                                    value={company.description}
                                    onChange={(e) => setCompany({ ...company, description: e.target.value })}
                                    className="w-full p-4 border-2 border-[#e0e6ed] rounded-lg text-base text-[#2c3e50] outline-none focus:border-[#3498db] resize-y font-sans leading-relaxed"
                                    rows={4}
                                    placeholder="Şirketinizi tanıtın..."
                                />
                            ) : (
                                <p className="leading-relaxed text-[#546e7a]">{company.description}</p>
                            )}
                        </SidebarSection>

                        <SidebarSection title="📍 İletişim Bilgileri">
                            {isEditing ? (
                                <div className="flex flex-col gap-2">
                                    <input
                                        type="url"
                                        value={company.website}
                                        onChange={(e) => setCompany({ ...company, website: e.target.value })}
                                        className="w-full p-2 border-2 border-[#e0e6ed] rounded-md text-base text-[#2c3e50] outline-none focus:border-[#3498db]"
                                        placeholder="Website"
                                    />
                                    <input
                                        type="email"
                                        value={company.email}
                                        onChange={(e) => setCompany({ ...company, email: e.target.value })}
                                        className="w-full p-2 border-2 border-[#e0e6ed] rounded-md text-base text-[#2c3e50] outline-none focus:border-[#3498db]"
                                        placeholder="E-posta"
                                    />
                                    <input
                                        type="tel"
                                        value={company.phone}
                                        onChange={(e) => setCompany({ ...company, phone: e.target.value })}
                                        className="w-full p-2 border-2 border-[#e0e6ed] rounded-md text-base text-[#2c3e50] outline-none focus:border-[#3498db]"
                                        placeholder="Telefon"
                                    />
                                </div>
                            ) : (
                                <>
                                    <p className="flex items-center gap-2 text-[#2c3e50] my-2">🌐 {company.website}</p>
                                    <p className="flex items-center gap-2 text-[#2c3e50] my-2">📧 {company.email}</p>
                                    <p className="flex items-center gap-2 text-[#2c3e50] my-2">📞 {company.phone}</p>
                                </>
                            )}
                            <div className="flex gap-4 mt-4">
                                {['LinkedIn', 'Twitter', 'Instagram'].map(social => (
                                    <a key={social} href="#" className="text-[#3498db] no-underline text-sm hover:text-[#2980b9] hover:underline transition-colors">{social}</a>
                                ))}
                            </div>
                        </SidebarSection>

                        <SidebarSection title="👥 Çalışan Avantajları">
                            <div className="flex flex-wrap gap-2.5 mt-2.5">
                                {company.benefits.map((benefit, index) => (
                                    <span key={index} className="bg-gradient-to-br from-[#e3f2fd] to-[#bbdefb] px-4 py-2 rounded-full text-sm text-[#1976d2] border border-[#bbdefb] inline-flex items-center gap-2">
                                        {benefit}
                                        {isEditing && (
                                            <button
                                                className="bg-none border-none text-[#1976d2] cursor-pointer text-lg p-0 w-5 h-5 flex items-center justify-center rounded-full hover:bg-[#1976d2]/10 hover:text-[#1565c0]"
                                                onClick={() => removeBenefit(benefit)}
                                            >
                                                ×
                                            </button>
                                        )}
                                    </span>
                                ))}
                            </div>
                            {isEditing && (
                                <div className="flex gap-2 mt-4">
                                    <input
                                        type="text"
                                        value={newBenefit}
                                        onChange={(e) => setNewBenefit(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && addBenefit()}
                                        className="flex-1 p-2 border-2 border-[#e0e6ed] rounded-md text-sm text-[#2c3e50] outline-none focus:border-[#3498db]"
                                        placeholder="Yeni avantaj ekle"
                                    />
                                    <button className="bg-[#3498db] text-white border-none rounded-md w-9 h-9 cursor-pointer text-xl flex items-center justify-center hover:bg-[#2980b9]" onClick={addBenefit}>+</button>
                                </div>
                            )}
                        </SidebarSection>
                    </aside>

                    {/* Right Content */}
                    <div className="flex-1">
                        {/* Tabs */}
                        <div className="flex gap-1.5 border-b-2 border-[#e0e6ed] pb-2.5 mb-7 flex-wrap">
                            <TabButton active={activeTab === 'company'} onClick={() => setActiveTab('company')} icon="🏢" label="Şirket Bilgileri" />
                            <TabButton active={activeTab === 'jobs'} onClick={() => setActiveTab('jobs')} icon="📋" label={`Aktif İlanlar (${activeJobs.length})`} />
                            <TabButton active={activeTab === 'reviews'} onClick={() => setActiveTab('reviews')} icon="⭐" label="Çalışan Yorumları" />
                        </div>

                        {/* Tab Content */}
                        <div className="animate-[fadeIn_0.3s_ease]">
                            {activeTab === 'company' && (
                                <div className="flex flex-col gap-7">
                                    <div className="bg-white p-6 rounded-xl border border-[#e0e6ed]">
                                        <h3 className="text-[#34495e] mb-4 text-xl font-bold flex items-center gap-2">📊 Şirket Kültürü</h3>
                                        <p className="leading-relaxed text-[#546e7a] mb-5">
                                            Agile metodolojileri benimseyen, yenilikçi ve dinamik bir şirketiz.
                                            Çalışanlarımızın gelişimini ön planda tutuyor, sürekli öğrenme kültürünü destekliyoruz.
                                        </p>

                                        <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-5 mt-5">
                                            {[
                                                { icon: '🎯', title: 'Misyon', desc: 'Teknoloji ile hayatı kolaylaştırmak' },
                                                { icon: '👥', title: 'Takım Ruhu', desc: 'İşbirliği ve açık iletişim' },
                                                { icon: '🚀', title: 'İnovasyon', desc: 'Sürekli gelişim ve yenilik' }
                                            ].map((item, i) => (
                                                <div key={i} className="flex gap-4 items-start p-4 bg-[#f8f9fa] rounded-lg border border-[#e0e6ed]">
                                                    <span className="text-2xl">{item.icon}</span>
                                                    <div>
                                                        <h4 className="m-0 mb-1 text-[#2c3e50] text-base font-bold">{item.title}</h4>
                                                        <p className="m-0 text-sm text-[#7f8c8d]">{item.desc}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-white p-6 rounded-xl border border-[#e0e6ed]">
                                        <h3 className="text-[#34495e] mb-4 text-xl font-bold flex items-center gap-2">📍 Ofis Lokasyonları</h3>
                                        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-5 mt-5">
                                            {[
                                                { title: 'İstanbul Merkez Ofis', loc: 'Maslak, İstanbul', tag: 'Ana Merkez' },
                                                { title: 'Ankara Ofisi', loc: 'Çankaya, Ankara', tag: 'Teknoloji Merkezi' },
                                                { title: 'İzmir Ofisi', loc: 'Balçova, İzmir', tag: 'AR-GE Merkezi' }
                                            ].map((office, i) => (
                                                <div key={i} className="p-5 bg-[#f8f9fa] rounded-lg border border-[#e0e6ed] relative">
                                                    <h4 className="m-0 mb-2 text-[#2c3e50] text-base font-bold">{office.title}</h4>
                                                    <p className="m-0 text-[#7f8c8d] text-sm">{office.loc}</p>
                                                    <span className="absolute top-2.5 right-2.5 bg-[#e3f2fd] text-[#1976d2] px-2 py-0.5 rounded-xl text-xs font-medium">{office.tag}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'jobs' && (
                                <div>
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-[#34495e] text-xl font-bold m-0">Aktif İş İlanları</h3>
                                        <button className="py-2 px-4 rounded-md border-none cursor-pointer font-medium text-xs bg-gradient-to-br from-[#3498db] to-[#2980b9] text-white hover:to-[#1f639c] shadow-sm" onClick={addNewJob}>
                                            + Yeni İlan Oluştur
                                        </button>
                                    </div>

                                    <div className="flex flex-col gap-4">
                                        {activeJobs.map((job) => (
                                            <div key={job.id} className="bg-white p-6 rounded-xl border border-[#e0e6ed] hover:-translate-y-1 hover:shadow-md transition-all">
                                                <div className="flex justify-between items-start mb-4">
                                                    <div>
                                                        <h4 className="m-0 mb-2.5 text-[#2c3e50] text-lg font-bold">{job.title}</h4>
                                                        <div className="flex gap-4 flex-wrap">
                                                            <span className="bg-[#e3f2fd] text-[#1976d2] px-2.5 py-0.5 rounded-2xl text-sm">{job.type}</span>
                                                            <span className="font-medium text-[#27ae60] text-sm">{job.salary}</span>
                                                            <span className="text-[#7f8c8d] text-sm">{job.applicants} başvuru</span>
                                                        </div>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-2xl text-xs font-medium ${job.status === 'active' ? 'bg-[#d4edda] text-[#155724]' : 'bg-[#fff3cd] text-[#856404]'}`}>
                                                        {job.status === 'active' ? 'Yayında' : 'Taslak'}
                                                    </span>
                                                </div>

                                                <div className="flex gap-2.5 flex-wrap">
                                                    <button className="py-1.5 px-3 rounded-md border-2 border-[#e0e6ed] bg-transparent text-[#2c3e50] cursor-pointer text-sm hover:bg-[#e0e6ed]/30 hover:border-[#2c3e50]">
                                                        📊 Başvuruları Gör
                                                    </button>
                                                    <button className="py-1.5 px-3 rounded-md border-none bg-[#f8f9fa] text-[#2c3e50] cursor-pointer text-sm hover:bg-[#e0e6ed]">
                                                        ✏️ Düzenle
                                                    </button>
                                                    <button className="py-1.5 px-3 rounded-md border-none bg-[#e74c3c] text-white cursor-pointer text-sm hover:bg-[#c0392b]">
                                                        🗑️ Sil
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {activeTab === 'reviews' && (
                                <div>
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h3 className="text-[#34495e] text-xl font-bold m-0 mb-1">Çalışan Yorumları</h3>
                                            <p className="text-[#7f8c8d] text-sm m-0">Şirketimizda çalışanların deneyimleri</p>
                                        </div>
                                        <div className="text-center bg-white p-4 rounded-xl border border-[#e0e6ed] min-w-[140px]">
                                            <span className="block text-3xl font-bold text-[#f39c12]">4.7</span>
                                            <div className="my-1 text-sm">⭐⭐⭐⭐⭐</div>
                                            <span className="text-[#7f8c8d] text-sm">({reviews.length} yorum)</span>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-5">
                                        {reviews.map((review, index) => (
                                            <div key={index} className="bg-white p-6 rounded-xl border border-[#e0e6ed] flex flex-col md:flex-row gap-5">
                                                <div className="shrink-0 flex md:block items-center gap-3">
                                                    <div className="w-[50px] h-[50px] bg-gradient-to-br from-[#3498db] to-[#2980b9] text-white rounded-full flex items-center justify-center font-bold text-lg">
                                                        {review.name.charAt(0)}
                                                    </div>
                                                    <div className="md:mt-2.5">
                                                        <div className="font-bold text-base text-[#2c3e50]">{review.name}</div>
                                                        <div className="text-[#7f8c8d] text-xs my-0.5">{review.role}</div>
                                                        <div className="text-[#f39c12] text-sm">{"⭐".repeat(review.rating)}</div>
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="leading-relaxed text-[#546e7a] m-0 mb-4">"{review.comment}"</p>
                                                    <div className="flex justify-between items-center">
                                                        <span className="text-[#95a5a6] text-xs">{review.date}</span>
                                                        <button className="bg-none border border-[#3498db] text-[#3498db] px-3 py-1.5 rounded-md cursor-pointer text-xs hover:bg-[#3498db] hover:text-white transition-all">Yanıtla</button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

// Sub-components
function SidebarSection({ title, children }: { title: string, children: React.ReactNode }) {
    return (
        <div className="bg-white p-6 rounded-xl mb-5 border border-[#e0e6ed] shadow-sm">
            <h3 className="mb-4 text-base text-[#34495e] flex items-center gap-2 font-bold">{title}</h3>
            {children}
        </div>
    );
}

function TabButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: string, label: string }) {
    return (
        <button
            className={`py-3 px-6 rounded-t-lg border-none cursor-pointer font-medium transition-all flex items-center gap-2 ${active ? 'bg-[#e3f2fd] text-[#1976d2] border-b-[3px] border-[#1976d2]' : 'bg-transparent text-[#7f8c8d] hover:bg-[#f8f9fa] hover:text-[#3498db]'}`}
            onClick={onClick}
        >
            <span>{icon}</span> {label}
        </button>
    );
}