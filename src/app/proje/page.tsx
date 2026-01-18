'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import KanbanBoard from '@/components/KanbanBoard';
import { Plus, Layout, ArrowLeft, Users } from 'lucide-react';
import Link from 'next/link';

interface Project {
    id: string;
    title: string;
    description: string;
    owner_id: string;
}

export default function ProjectsPage() {
    const supabase = createClient();
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [activeProject, setActiveProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/'); return; }

        const { data } = await supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });

        if (data) {
            setProjects(data);
            if (data.length > 0 && !activeProject) setActiveProject(data[0]);
        }
        setLoading(false);
    };

    const createProject = async () => {
        if (!newProjectName.trim()) return;
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase.from('projects').insert({
            title: newProjectName,
            owner_id: user.id
        }).select().single();

        if (data) {
            setProjects([data, ...projects]);
            setActiveProject(data);
            setNewProjectName('');
            setIsCreating(false);
        }
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-bold">Projeler Yükleniyor...</div>;

    return (
        <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
            {/* HEADER */}
            <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="text-xl font-black tracking-tight flex items-center gap-1">
                        Net-Work<span className="text-blue-600">.</span> <span className="text-slate-400 font-medium ml-2 text-sm">Proje Yönetimi</span>
                    </Link>
                    <div className="flex items-center gap-4">
                        <Link href="/profil" className="text-sm font-bold text-slate-500 hover:text-slate-900">Profilim</Link>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* SIDEBAR LIST */}
                    <aside className="lg:col-span-3 space-y-6">
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-bold text-slate-900 flex items-center gap-2">
                                    <Layout className="w-5 h-5 text-blue-600" />
                                    Projelerim
                                </h2>
                                <button onClick={() => setIsCreating(true)} className="p-1 hover:bg-slate-100 rounded-lg transition-colors"><Plus className="w-5 h-5" /></button>
                            </div>

                            {isCreating && (
                                <div className="mb-4">
                                    <input
                                        autoFocus
                                        value={newProjectName}
                                        onChange={e => setNewProjectName(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && createProject()}
                                        placeholder="Proje adı..."
                                        className="w-full text-sm border rounded p-2 mb-2"
                                    />
                                    <div className="flex gap-2 text-xs">
                                        <button onClick={createProject} className="flex-1 bg-blue-600 text-white py-1 rounded">Oluştur</button>
                                        <button onClick={() => setIsCreating(false)} className="flex-1 bg-slate-100 text-slate-600 py-1 rounded">İptal</button>
                                    </div>
                                </div>
                            )}

                            <nav className="space-y-1">
                                {projects.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => setActiveProject(p)}
                                        className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${activeProject?.id === p.id ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        {p.title}
                                    </button>
                                ))}
                                {projects.length === 0 && !isCreating && (
                                    <div className="text-center py-4 text-xs text-slate-400">Henüz proje yok.</div>
                                )}
                            </nav>
                        </div>

                        {/* TEAM FINDER */}
                        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mt-6">
                            <h2 className="font-bold text-slate-900 flex items-center gap-2 mb-4">
                                <Users className="w-5 h-5 text-indigo-600" />
                                Takım Arkadaşı Bul
                            </h2>
                            <div className="space-y-3">
                                <TeamMatesList />
                            </div>
                        </div>
                    </aside>

                    {/* KANBAN BOARD */}
                    <div className="lg:col-span-9">
                        {activeProject ? (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h1 className="text-2xl font-black text-slate-900">{activeProject.title}</h1>
                                        <p className="text-slate-400 text-sm font-medium">Proje Panosu</p>
                                    </div>
                                    <div className="flex -space-x-2">
                                        {/* Future: Team members avatars */}
                                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-xs font-bold text-blue-600 border-2 border-white">+</div>
                                    </div>
                                </div>
                                <KanbanBoard projectId={activeProject.id} />
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 p-12 border-2 border-dashed border-slate-200 rounded-3xl">
                                <Layout className="w-16 h-16 mb-4 opacity-20" />
                                <p className="font-bold">Bir proje seçin veya oluşturun.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

function TeamMatesList() {
    const supabase = createClient();
    const [teammates, setTeammates] = useState<any[]>([]);

    useEffect(() => {
        const fetchTeammates = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('id, full_name, title, avatar_url')
                .eq('looking_for_team', true)
                .limit(5);
            if (data) setTeammates(data);
        };
        fetchTeammates();
    }, []);

    if (teammates.length === 0) return <div className="text-xs text-slate-400">Takım arayan kimse yok.</div>;

    return (
        <>
            {teammates.map(t => (
                <Link href={`/profil/${t.id}`} key={t.id} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-xl transition-colors group">
                    <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-600 font-bold overflow-hidden">
                        {t.avatar_url ? <img src={t.avatar_url} className="w-full h-full object-cover" /> : t.full_name?.[0]}
                    </div>
                    <div>
                        <div className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{t.full_name}</div>
                        <div className="text-[10px] text-slate-500 font-bold">{t.title}</div>
                    </div>
                </Link>
            ))}
        </>
    );
}
