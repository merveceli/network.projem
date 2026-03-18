'use client';

import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, Flag, Building2, MapPin, ExternalLink, Mail, Phone, Calendar, Users, ChevronRight, LayoutGrid } from 'lucide-react';
import ReportModal from '@/components/ReportModal';
import { getProfileById, updateProfileGeneric } from '../../actions';

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
}

const getInitialCompany = (): CompanyData => ({
    company_name: 'Yükleniyor...',
    industry: '',
    location: '',
    founded_year: '',
    description: '',
    website: '',
    email: '',
    phone: '',
    employee_count: '',
    benefits: []
});

export default function EmployerPublicProfile() {
    const { data: session, status } = useSession();
    const params = useParams();
    const router = useRouter();
    const employerId = params.id as string;

    const [company, setCompany] = useState<CompanyData>(getInitialCompany);
    const [isEditing, setIsEditing] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    useEffect(() => {
        const loadProfile = async () => {
            if (!employerId) return;

            try {
                const data = await getProfileById(employerId);
                
                if (!data) {
                    console.error("Employer not found");
                    setLoading(false);
                    return;
                }

                if (session?.user?.id === employerId) {
                    setIsOwner(true);
                }

                setCompany({
                    company_name: data.full_name || 'Şirket Adı Belirtilmemiş',
                    industry: data.title || 'Sektör Belirtilmemiş',
                    location: data.location || 'Lokasyon Belirtilmemiş',
                    description: data.bio || 'Açıklama bulunmuyor.',
                    email: data.email || '',
                    phone: data.phone || '',
                    founded_year: data.metadata?.founded_year || '-',
                    website: data.metadata?.website || '-',
                    employee_count: data.metadata?.employee_count || '-',
                    benefits: data.metadata?.benefits || []
                });
            } catch (error) {
                console.error("Error loading profile:", error);
            } finally {
                setLoading(false);
            }
        };

        if (status !== 'loading') {
            loadProfile();
        }
    }, [employerId, session, status]);

    const handleSave = async () => {
        if (!isOwner) return;
        try {
            await updateProfileGeneric({
                full_name: company.company_name,
                title: company.industry,
                location: company.location,
                bio: company.description,
                phone: company.phone,
                metadata: {
                    founded_year: company.founded_year,
                    website: company.website,
                    employee_count: company.employee_count,
                    benefits: company.benefits
                }
            });

            setIsEditing(false);
            alert("Şirket bilgileri güncellendi! 🎉");
        } catch (e: any) {
            console.error(e);
            alert("Hata oluştu: " + e.message);
        }
    };

    if (loading || status === 'loading') return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800">
            {/* Top Toolbar */}
            <div className="fixed top-8 left-8 z-[60] flex items-center gap-4">
                <Link href="/" className="flex items-center gap-2 px-6 py-3 bg-white hover:bg-slate-50 rounded-full text-[10px] font-black tracking-widest transition-all text-slate-900 no-underline shadow-2xl uppercase border border-gray-100">
                    <Home className="w-4 h-4" />
                    GERİ DÖN
                </Link>

                {!isOwner && (
                    <button
                        onClick={() => setIsReportModalOpen(true)}
                        className="flex items-center gap-2 px-6 py-3 bg-red-50 hover:bg-red-100 rounded-full text-[10px] font-black tracking-widest transition-all text-red-600 uppercase border border-red-100"
                    >
                        <Flag className="w-4 h-4" />
                        ŞİRKETİ BİLDİR
                    </button>
                )}
            </div>

            <header className="bg-[#0A0A10] text-white pt-40 pb-20 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
                <div className="max-w-7xl mx-auto px-8 relative z-10">
                    <div className="flex flex-col md:flex-row gap-12 items-center md:items-start">
                        <div className="w-40 h-40 bg-white/5 backdrop-blur-xl border-4 border-white/20 rounded-[48px] flex items-center justify-center text-4xl font-black text-white shadow-2xl shrink-0 uppercase italic">
                            {company.company_name.substring(0, 2)}
                        </div>

                        <div className="flex-1 text-center md:text-left">
                            {isEditing ? (
                                <input 
                                    className="w-full text-4xl font-black bg-white/10 p-5 rounded-3xl border-2 border-white/20 outline-none focus:border-blue-600 transition-all text-white uppercase italic tracking-tighter" 
                                    value={company.company_name} 
                                    onChange={e => setCompany({ ...company, company_name: e.target.value })} 
                                />
                            ) : (
                                <h1 className="text-6xl md:text-7xl font-black mb-4 tracking-tighter uppercase italic leading-[0.9]">{company.company_name}</h1>
                            )}
                            
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-6">
                                <span className="px-4 py-2 bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-blue-400 border border-white/10 flex items-center gap-2">
                                    <Building2 className="w-3 h-3" /> {company.industry}
                                </span>
                                <span className="px-4 py-2 bg-white/5 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-400 border border-white/5 flex items-center gap-2">
                                    <MapPin className="w-3 h-3" /> {company.location}
                                </span>
                            </div>

                            {isOwner && (
                                <div className="mt-10 flex justify-center md:justify-start">
                                    <button 
                                        onClick={() => isEditing ? handleSave() : setIsEditing(true)} 
                                        className="py-4 px-10 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl shadow-blue-500/20 active:scale-95 flex items-center gap-3"
                                    >
                                        {isEditing ? "DEĞİŞİKLİKLERİ KAYDET" : "PROFİLİ DÜZENLE"}
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-8 py-20 grid grid-cols-1 lg:grid-cols-12 gap-16">
                <div className="lg:col-span-8 space-y-12">
                    <section className="bg-white p-12 rounded-[48px] border border-gray-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <LayoutGrid className="w-32 h-32" />
                        </div>
                        <h2 className="text-2xl font-black mb-8 uppercase italic tracking-tighter">VİZYON & MİSYON</h2>
                        {isEditing ? (
                            <textarea 
                                className="w-full h-64 p-6 bg-slate-50 border-2 border-transparent focus:border-blue-600 rounded-[32px] outline-none text-sm font-medium leading-relaxed resize-none transition-all" 
                                value={company.description} 
                                onChange={e => setCompany({ ...company, description: e.target.value })} 
                            />
                        ) : (
                            <p className="text-slate-600 text-lg leading-relaxed font-medium whitespace-pre-wrap">{company.description}</p>
                        )}
                    </section>
                </div>

                <aside className="lg:col-span-4 space-y-8">
                    <div className="bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                        <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-8 border-l-4 border-blue-600 pl-4">Şirket Detayları</h3>
                        <div className="space-y-6">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-slate-50 rounded-2xl">
                                    <Calendar className="w-5 h-5 text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">KURULUŞ</p>
                                    <p className="font-black text-sm">{company.founded_year}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-slate-50 rounded-2xl">
                                    <Users className="w-5 h-5 text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">EKİP BÜYÜKLÜĞÜ</p>
                                    <p className="font-black text-sm">{company.employee_count} Kişi</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-slate-50 rounded-2xl">
                                    <Mail className="w-5 h-5 text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">İLETİŞİM</p>
                                    <p className="font-black text-sm">{company.email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-slate-50 rounded-2xl">
                                    <ExternalLink className="w-5 h-5 text-slate-400" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">WEB SİTESİ</p>
                                    <a href={company.website.startsWith('http') ? company.website : `https://${company.website}`} target="_blank" className="font-black text-sm text-blue-600 hover:underline">{company.website}</a>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
            </main>

            {/* Report Modal */}
            <ReportModal
                isOpen={isReportModalOpen}
                onClose={() => setIsReportModalOpen(false)}
                targetType="profile"
                targetId={employerId}
                targetTitle={company.company_name}
            />
        </div>
    );
}
