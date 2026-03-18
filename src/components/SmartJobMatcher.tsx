'use client';

import { useEffect, useState } from 'react';
import { useSession } from "next-auth/react";
import Link from 'next/link';
import { Sparkles, ArrowRight, Briefcase } from 'lucide-react';
import { getSmartJobMatches } from '@/app/ilanlar/match-actions';

interface Job {
    id: string;
    title: string;
    category: string;
    created_at: string;
    employer_name: string | null;
}

export default function SmartJobMatcher() {
    const { data: session, status } = useSession();
    const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [userName, setUserName] = useState('');

    useEffect(() => {
        if (status === 'loading') return;
        if (status === 'unauthenticated' || !session?.user) {
            setLoading(false);
            return;
        }

        const fetchRecommendations = async () => {
            const { data, fullName, error } = await getSmartJobMatches();
            if (!error && data) {
                setRecommendedJobs(data as unknown as Job[]);
                setUserName(fullName || 'Kullanıcı');
            }
            setLoading(false);
        };

        fetchRecommendations();
    }, [status, session]);

    if (loading || recommendedJobs.length === 0) return null;

    return (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 mb-10 text-white relative overflow-hidden shadow-xl shadow-blue-200/50 animate-[fadeIn_0.5s_ease]">
            {/* Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

            <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-white/20 backdrop-blur-md rounded-xl">
                        <Sparkles className="w-6 h-6 text-yellow-300" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black tracking-tight">Senin İçin Seçtiklerimiz, {userName ? userName.split(' ')[0] : ''}!</h2>
                        <p className="text-blue-100 font-medium opacity-90">Yeteneklerine ve profiline en uygun işler burada.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {recommendedJobs.map(job => (
                        <Link href={`/ilan/${job.id}`} key={job.id} className="group bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/10 p-4 rounded-2xl transition-all hover:-translate-y-1 no-underline">
                            <div className="flex justify-between items-start mb-3">
                                <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider">
                                    {job.category}
                                </span>
                                <ArrowRight className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" />
                            </div>
                            <h3 className="font-bold text-lg leading-tight mb-2 line-clamp-2 text-white">{job.title}</h3>
                            <div className="flex items-center gap-2 text-xs text-blue-100 font-medium opacity-80">
                                <Briefcase className="w-3 h-3" />
                                <span className="truncate">{job.employer_name || 'İşveren'}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
