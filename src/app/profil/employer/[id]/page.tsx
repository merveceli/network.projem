'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Home, Flag, Building2, MapPin, ExternalLink, Mail, Phone, Calendar, Users } from 'lucide-react';
import ReportModal from '@/components/ReportModal';

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
    const params = useParams();
    const router = useRouter();
    const employerId = params.id as string;

    const [viewerId, setViewerId] = useState<string | null>(null);
    const [company, setCompany] = useState<CompanyData>(getInitialCompany);
    const [isEditing, setIsEditing] = useState(false);
    const [isOwner, setIsOwner] = useState(false);
    const [loading, setLoading] = useState(true);
    const [isReportModalOpen, setIsReportModalOpen] = useState(false);

    useEffect(() => {
        const loadProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setViewerId(user?.id || null);

            if (user?.id === employerId) {
                setIsOwner(true);
            }

            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', employerId)
                .single();

            if (error || !data) {
                console.error("Employer not found:", error);
                setLoading(false);
                return;
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

            setLoading(false);
        };

        if (employerId) loadProfile();
    }, [employerId]);

    const handleSave = async () => {
        if (!isOwner) return;
        try {
            const { error } = await supabase.from('profiles').update({
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
            }).eq('id', employerId);

            if (error) throw error;
            setIsEditing(false);
            alert("Şirket bilgileri güncellendi!");
        } catch (e) {
            console.error(e);
            alert("Hata oluştu.");
        }
    };

    if (loading) return <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center font-bold text-[#3498db]">Yükleniyor...</div>;

    return (
        <div className="min-h-screen bg-[#f8fafc] font-sans text-[#2c3e50]">
            <div className="absolute top-6 left-6 z-50 flex items-center gap-3">
                <Link href="/" className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-md rounded-full text-sm font-bold transition-all text-white no-underline border border-white/20 shadow-xl group">
                    <Home className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    Ana Sayfa
                </Link>

                {!isOwner && (
                    <button
                        onClick={() => setIsReportModalOpen(true)}
                        className="flex items-center gap-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 backdrop-blur-md rounded-full text-xs font-bold transition-all text-red-100 no-underline border border-red-500/20 shadow-xl"
                    >
                        <Flag className="w-3.5 h-3.5" />
                        Şirketi Bildir
                    </button>
                )}
            </div>

            <header className="bg-gradient-to-br from-[#1e3c72] to-[#2a5298] text-white py-[60px] pb-10 border-b border-[#1a3a6e]">
                <div className="max-w-[1200px] mx-auto px-5">
                    <div className="flex flex-col md:flex-row gap-10 items-center">
                        <div className="w-[120px] h-[120px] bg-gradient-to-br from-[#3498db] to-[#2980b9] rounded-3xl flex items-center justify-center text-[2.5rem] font-bold text-white border-[5px] border-white/20 shadow-2xl">
                            {company.company_name.substring(0, 2).toUpperCase()}
                        </div>

                        <div className="flex-1 w-full text-center md:text-left">
                            {isEditing ? (
                                <input className="p-3 border-2 border-white/30 rounded-lg bg-white/10 text-white w-full max-w-xl mb-4" value={company.company_name} onChange={e => setCompany({ ...company, company_name: e.target.value })} />
                            ) : (
                                <h1 className="text-[2.5rem] font-bold mb-2">{company.company_name}</h1>
                            )}
                            <p className="text-xl opacity-90 mb-1">🏢 {company.industry}</p>
                            <p className="text-white/80">📍 {company.location}</p>

                            {isOwner && (
                                <div className="mt-6 flex justify-center md:justify-start gap-4">
                                    <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} className="py-3 px-8 bg-blue-500 hover:bg-blue-600 rounded-lg font-bold transition-all shadow-lg">
                                        {isEditing ? "Kaydet" : "Bilgileri Düzenle"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-[1200px] mx-auto px-5 py-12 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-12">
                <div className="space-y-8">
                    <section className="bg-white p-8 rounded-2xl border border-[#e0e6ed] shadow-sm">
                        <h2 className="text-2xl font-bold mb-4">Şirket Hakkında</h2>
                        {isEditing ? (
                            <textarea className="w-full p-4 border-2 border-[#e0e6ed] rounded-xl h-48" value={company.description} onChange={e => setCompany({ ...company, description: e.target.value })} />
                        ) : (
                            <p className="text-[#546e7a] leading-relaxed whitespace-pre-wrap">{company.description}</p>
                        )}
                    </section>
                </div>

                <aside className="space-y-6">
                    <div className="bg-white p-6 rounded-2xl border border-[#e0e6ed] shadow-sm">
                        <h3 className="font-bold mb-4">📍 Şirket Detayları</h3>
                        <div className="space-y-3 text-sm">
                            <p><span className="text-gray-400">Kuruluş:</span> {company.founded_year}</p>
                            <p><span className="text-gray-400">Çalışan:</span> {company.employee_count}</p>
                            <p><span className="text-gray-400">E-posta:</span> {company.email}</p>
                            <p><span className="text-gray-400">Web:</span> {company.website}</p>
                        </div>
                    </div>
                </aside>
            </main>
        </div>
    );
}
