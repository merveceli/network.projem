'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Navbar from '@/components/Navbar';
import Image from 'next/image';
import Link from 'next/link';
import { Search, Filter, Star, MapPin, Zap, User, Video, ChevronRight, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Freelancer {
    id: string;
    full_name: string;
    title: string;
    location: string;
    skills: string[];
    avatar_url: string;
    video_url: string;
    video_status: string;
}

const CATEGORIES = [
    "Hepsi",
    "Yazılım",
    "Tasarım",
    "Pazarlama",
    "Editörlük",
    "Çeviri",
    "Danışmanlık"
];

export default function TalentPoolPage() {
    const [talents, setTalents] = useState<Freelancer[]>([]);
    const [filteredTalents, setFilteredTalents] = useState<Freelancer[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('Hepsi');

    useEffect(() => {
        const fetchTalents = async () => {
            const { data, error } = await supabase
                .from('profiles')
                .select('id, full_name, title, location, skills, avatar_url, video_url, video_status')
                .eq('role', 'freelancer')
                .not('full_name', 'is', null);

            if (data) {
                setTalents(data as Freelancer[]);
                setFilteredTalents(data as Freelancer[]);
            }
            setLoading(false);
        };
        fetchTalents();
    }, []);

    useEffect(() => {
        let result = talents;

        if (searchTerm) {
            result = result.filter(t =>
                t.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.skills?.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
            );
        }

        if (selectedCategory !== 'Hepsi') {
            result = result.filter(t =>
                t.title?.toLowerCase().includes(selectedCategory.toLowerCase()) ||
                t.skills?.some(s => s.toLowerCase().includes(selectedCategory.toLowerCase()))
            );
        }

        setFilteredTalents(result);
    }, [searchTerm, selectedCategory, talents]);

    return (
        <div className="min-h-screen bg-[#f8fafc] font-sans">
            <Navbar />

            <header className="pt-32 pb-16 px-[8%] bg-gradient-to-br from-[#1a1a2e] to-[#2a2a4e] text-white">
                <div className="max-w-7xl mx-auto">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-5xl md:text-6xl font-black mb-6 tracking-tight"
                    >
                        Yetenek <span className="text-[#E91E63]">Havuzu</span>
                    </motion.h1>
                    <p className="text-xl text-slate-300 max-w-2xl font-medium leading-relaxed">
                        Türkiye'nin en yetenekli bağımsız profesyonellerini keşfedin.
                        Doğrulanmış profiller, şeffaf portfolyolar.
                    </p>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-[8%] -mt-8 relative z-10 pb-20">
                {/* Search & Filter Bar */}
                <div className="bg-white p-4 rounded-[32px] shadow-2xl shadow-slate-200/50 border border-slate-100 flex flex-col md:flex-row gap-4 mb-12">
                    <div className="flex-1 flex items-center gap-3 bg-slate-50 px-6 py-4 rounded-2xl border border-slate-100 group focus-within:border-orange-500/50 transition-all">
                        <Search className="w-5 h-5 text-slate-400 group-focus-within:text-orange-500" />
                        <input
                            type="text"
                            placeholder="İsim, ünvan veya yetenek ara..."
                            className="bg-transparent outline-none w-full text-slate-700 font-bold placeholder:text-slate-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-6 py-4 rounded-2xl font-bold text-sm whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-[#E91E63] text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
                        <p className="font-black text-slate-400 animate-pulse uppercase tracking-widest">Yetenekler Yükleniyor...</p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-black text-slate-800 uppercase tracking-tight">
                                {filteredTalents.length} Uzman Bulundu
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            <AnimatePresence>
                                {filteredTalents.map((talent, idx) => (
                                    <motion.div
                                        key={talent.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="bg-white rounded-[40px] p-8 border border-slate-100 shadow-xl shadow-slate-200/30 hover:shadow-2xl hover:border-orange-500/20 transition-all group relative overflow-hidden"
                                    >
                                        {talent.video_status === 'approved' && (
                                            <div className="absolute top-6 right-6 bg-purple-100 text-purple-600 p-2 rounded-xl" title="Video Profili Mevcut">
                                                <Video className="w-5 h-5" />
                                            </div>
                                        )}

                                        <div className="flex flex-col items-center text-center">
                                            <div className="relative w-24 h-24 mb-6 ring-4 ring-slate-50 rounded-full overflow-hidden group-hover:ring-orange-500/20 transition-all">
                                                <Image
                                                    src={talent.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${talent.id}`}
                                                    alt={talent.full_name}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>

                                            <h3 className="text-2xl font-black text-slate-900 mb-2 group-hover:text-[#E91E63] transition-colors">
                                                {talent.full_name}
                                            </h3>
                                            <p className="text-slate-500 font-bold text-sm mb-6 flex items-center gap-2">
                                                <Briefcase className="w-4 h-4 text-orange-400" /> {talent.title || 'Bağımsız Profesyonel'}
                                            </p>

                                            <div className="flex flex-wrap justify-center gap-2 mb-8">
                                                {talent.skills?.slice(0, 3).map(skill => (
                                                    <span key={skill} className="px-4 py-1.5 bg-slate-50 text-slate-600 rounded-full text-xs font-black uppercase tracking-tight">
                                                        {skill}
                                                    </span>
                                                ))}
                                                {talent.skills?.length > 3 && (
                                                    <span className="px-4 py-1.5 bg-orange-50 text-orange-600 rounded-full text-xs font-black">
                                                        +{talent.skills.length - 3}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="w-full pt-6 border-t border-slate-50 flex items-center justify-between">
                                                <div className="flex items-center gap-1.5 text-slate-400 font-bold text-xs uppercase tracking-widest">
                                                    <MapPin className="w-3.5 h-3.5" />
                                                    {talent.location || 'Türkiye'}
                                                </div>
                                                <Link
                                                    href={`/profil/freelancer/${talent.id}`}
                                                    className="flex items-center gap-2 px-6 py-3 bg-[#1a1a2e] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#E91E63] shadow-lg shadow-slate-200 transition-all active:scale-95"
                                                >
                                                    İncele <ChevronRight className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {filteredTalents.length === 0 && (
                            <div className="text-center py-32 bg-white rounded-[40px] border border-dashed border-slate-200">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
                                    <User className="w-10 h-10" />
                                </div>
                                <h3 className="text-2xl font-black text-slate-800 mb-2">Yetenek Bulunamadı</h3>
                                <p className="text-slate-500 font-medium">Farklı bir arama terimi veya kategori denemeye ne dersin?</p>
                            </div>
                        )}
                    </>
                )}
            </main>

            <footer className="bg-white border-t border-slate-100 py-12 px-[8%] text-center">
                <p className="text-slate-400 font-bold text-sm tracking-widest uppercase">
                    Net-Work Talent Pool © 2026
                </p>
            </footer>
        </div>
    );
}
