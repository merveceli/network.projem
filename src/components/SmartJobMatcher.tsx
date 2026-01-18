'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { Sparkles, ArrowRight, Briefcase } from 'lucide-react';

interface Job {
    id: string;
    title: string;
    category: string;
    created_at: string;
    profiles: { full_name: string | null } | null;
}

export default function SmartJobMatcher() {
    const supabase = createClient();
    const [recommendedJobs, setRecommendedJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [userSkills, setUserSkills] = useState<string[]>([]);
    const [userName, setUserName] = useState('');

    useEffect(() => {
        const fetchRecommendations = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                setLoading(false);
                return;
            }

            // 1. Get User Profile for Skills & Title
            const { data: profile } = await supabase
                .from('profiles')
                .select('skills, title, full_name')
                .eq('id', user.id)
                .single();

            if (profile) {
                setUserName(profile.full_name || 'Kullanıcı');

                // Parse Skills (assuming they are stored as JSON array or text array)
                let skills: string[] = [];
                if (Array.isArray(profile.skills)) {
                    skills = profile.skills.map((s: any) => typeof s === 'string' ? s : s.name);
                }
                setUserSkills(skills);

                // 2. Simple Matching Algorithm
                // Match jobs where category matches user title OR title contains user skills
                let query = supabase
                    .from('jobs')
                    .select('id, title, category, created_at, profiles(full_name)')
                    .eq('status', 'approved')
                    .limit(4);

                // Prepare search terms from title and skills
                const searchTerms = [profile.title, ...skills].filter(Boolean);

                if (searchTerms.length > 0) {
                    // OR logic for title matching one of the skills/title
                    // Note: Supabase 'or' syntax for ilike is tricky with arrays, using a simpler category match for now + text search if possible
                    // A simple reliable matcher: match Category OR Title allows partial match

                    // Helper: match jobs with same category as Title (fuzzy) or just generic "Software" if tech
                    const orConditions = searchTerms.map(term => `title.ilike.%${term}%,category.ilike.%${term}%`).join(',');
                    query = query.or(orConditions);
                }

                const { data: jobs } = await query;
                if (jobs && jobs.length > 0) {
                    setRecommendedJobs(jobs as any);
                } else {
                    // Fallback: If no match, show latest jobs
                    const { data: latest } = await supabase
                        .from('jobs')
                        .select('id, title, category, created_at, profiles(full_name)')
                        .eq('status', 'approved')
                        .order('created_at', { ascending: false })
                        .limit(4);
                    if (latest) setRecommendedJobs(latest as any);
                }
            }
            setLoading(false);
        };

        fetchRecommendations();
    }, []);

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
                        <Link href={`/ilan/${job.id}`} key={job.id} className="group bg-white/10 backdrop-blur-md hover:bg-white/20 border border-white/10 p-4 rounded-2xl transition-all hover:-translate-y-1">
                            <div className="flex justify-between items-start mb-3">
                                <span className="bg-white/20 text-white text-[10px] font-bold px-2 py-1 rounded-lg uppercase tracking-wider">
                                    {job.category}
                                </span>
                                <ArrowRight className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" />
                            </div>
                            <h3 className="font-bold text-lg leading-tight mb-2 line-clamp-2">{job.title}</h3>
                            <div className="flex items-center gap-2 text-xs text-blue-100 font-medium opacity-80">
                                <Briefcase className="w-3 h-3" />
                                <span className="truncate">{job.profiles?.full_name || 'İşveren'}</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
