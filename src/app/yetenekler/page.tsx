'use client';

import { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Image from 'next/image';
import Link from 'next/link';
import { Search, MapPin, User, Video, ChevronRight, Briefcase } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchTalents as getTalentsAction } from './actions';

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
        const loadTalents = async () => {
            const { data, error } = await getTalentsAction();
            if (data) {
                setTalents(data as unknown as Freelancer[]);
                setFilteredTalents(data as unknown as Freelancer[]);
            }
            setLoading(false);
        };
        loadTalents();
    }, []);

    useEffect(() => {
        let result = talents;

        if (searchTerm) {
            result = result.filter(t =>
                t.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
        <div className="min-h-screen bg-[#F8FAFC] font-sans">
            <Navbar />

            <header className="pt-40 pb-20 px-[8%] bg-[#0A0A10] text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2" />
                <div className="max-w-7xl mx-auto relative z-10">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-6xl md:text-8xl font-black mb-8 tracking-tighter uppercase italic leading-[0.9]"
                    >
                        Yetenek <span className="text-blue-600">Havuzu</span>
                    </motion.h1>
                    <p className="text-xl text-slate-400 max-w-2xl font-black uppercase tracking-widest leading-relaxed opacity-60">
                        Türkiye'nin en yetenekli bağımsız profesyonellerini keşfedin.
                        Doğrulanmış profiller, şeffaf portfolyolar.
                    </p>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-[8%] -mt-12 relative z-10 pb-32">
                {/* Search & Filter Bar */}
                <div className="bg-white dark:bg-zinc-900 p-5 rounded-[40px] shadow-2xl shadow-slate-200/50 border border-slate-100 dark:border-zinc-800 flex flex-col md:flex-row gap-5 mb-16">
                    <div className="flex-1 flex items-center gap-4 bg-slate-50 dark:bg-zinc-800 px-8 py-5 rounded-[28px] border border-slate-100 dark:border-zinc-700 group focus-within:border-blue-500/50 transition-all">
                        <Search className="w-5 h-5 text-slate-400 group-focus-within:text-blue-600" />
                        <input
                            type="text"
                            placeholder="İsim, ünvan veya yetenek ara..."
                            className="bg-transparent outline-none w-full text-slate-800 dark:text-white font-black uppercase tracking-widest text-xs placeholder:text-slate-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-8 py-5 rounded-[28px] font-black text-[10px] uppercase tracking-widest whitespace-nowrap transition-all ${selectedCategory === cat ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'bg-slate-50 dark:bg-zinc-800 text-slate-500 hover:bg-slate-100'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-40 gap-6">
                        <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        <p className="font-black text-slate-400 animate-pulse uppercase tracking-[0.3em] text-[10px]">Yükleniyor...</p>
                    </div>
                ) : (
                    <>
                        <div className="flex items-center justify-between mb-12">
                            <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] border-l-4 border-blue-600 pl-4">
                                {filteredTalents.length} Uzman Listeleniyor
                            </h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                            <AnimatePresence>
                                {filteredTalents.map((talent, idx) => (
                                    <motion.div
                                        key={talent.id}
                                        layout
                                        initial={{ opacity: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.9 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="bg-white dark:bg-zinc-900 rounded-[48px] p-10 border border-slate-100 dark:border-zinc-800 shadow-xl shadow-slate-200/30 hover:shadow-2xl hover:border-blue-500/20 transition-all group relative overflow-hidden"
                                    >
                                        {talent.video_status === 'approved' && (
                                            <div className="absolute top-8 right-8 bg-blue-50 dark:bg-blue-500/10 text-blue-600 p-3 rounded-2xl animate-pulse" title="Video Profili Mevcut">
                                                <Video className="w-5 h-5" />
                                            </div>
                                        )}

                                        <div className="flex flex-col items-center text-center">
                                            <div className="relative w-32 h-32 mb-8 ring-8 ring-slate-50 dark:ring-zinc-800 rounded-[40px] overflow-hidden group-hover:ring-blue-500/10 transition-all shadow-xl">
                                                <Image
                                                    src={talent.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${talent.id}`}
                                                    alt={talent.full_name || 'Talent'}
                                                    fill
                                                    className="object-cover"
                                                />
                                            </div>

                                            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-2 uppercase italic tracking-tighter group-hover:text-blue-600 transition-colors">
                                                {talent.full_name}
                                            </h3>
                                            <div className="bg-slate-50 dark:bg-zinc-800 px-4 py-1 rounded-full mb-8">
                                                <p className="text-slate-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2">
                                                    <Briefcase className="w-3 h-3 text-blue-600" /> {talent.title || 'Bağımsız Profesyonel'}
                                                </p>
                                            </div>

                                            <div className="flex flex-wrap justify-center gap-2 mb-10">
                                                {talent.skills?.slice(0, 3).map(skill => (
                                                    <span key={skill} className="px-4 py-2 bg-slate-50 dark:bg-zinc-800 text-slate-500 dark:text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-100 dark:border-zinc-700">
                                                        {skill}
                                                    </span>
                                                ))}
                                                {talent.skills?.length > 3 && (
                                                    <span className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl text-[10px] font-black uppercase tracking-widest">
                                                        +{talent.skills.length - 3}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="w-full pt-8 border-t border-slate-50 dark:border-zinc-800 flex items-center justify-between">
                                                <div className="flex items-center gap-2 text-slate-400 font-bold text-[10px] uppercase tracking-widest">
                                                    <MapPin className="w-4 h-4 text-slate-300" />
                                                    {talent.location || 'Türkiye'}
                                                </div>
                                                <Link
                                                    href={`/profil/freelancer/${talent.id}`}
                                                    className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-[20px] font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 shadow-xl shadow-slate-200 dark:shadow-none transition-all active:scale-95 no-underline"
                                                >
                                                    PROFİLE GİT <ChevronRight className="w-4 h-4" />
                                                </Link>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>

                        {filteredTalents.length === 0 && (
                            <div className="text-center py-40 bg-white dark:bg-zinc-900 rounded-[60px] border-4 border-dashed border-slate-100 dark:border-zinc-800">
                                <div className="w-24 h-24 bg-slate-50 dark:bg-zinc-800 rounded-[40px] flex items-center justify-center mx-auto mb-8 text-slate-300">
                                    <User className="w-12 h-12" />
                                </div>
                                <h3 className="text-3xl font-black text-slate-900 dark:text-white mb-4 uppercase italic">Yetenek Bulunamadı</h3>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Farklı bir arama terimi veya kategori denemeye ne dersin?</p>
                            </div>
                        )}
                    </>
                )}
            </main>

            <footer className="bg-white dark:bg-zinc-950 border-t border-slate-100 dark:border-zinc-900 py-16 px-[8%] text-center">
                <p className="text-slate-400 font-black text-[10px] tracking-[0.3em] uppercase opacity-50">
                    Net-Work Talent Pool © 2026 • Tüm Hakları Saklıdır
                </p>
            </footer>
        </div>
    );
}
