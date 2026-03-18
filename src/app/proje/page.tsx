'use client';

import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { useRouter } from 'next/navigation';
import KanbanBoard from '@/components/KanbanBoard';
import { Plus, Layout, Users, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { fetchProjects as getProjects, createProject as createNewProject, fetchTeamMates } from './actions';

interface Project {
    id: string;
    title: string;
    description: string;
    owner_id: string;
}

export default function ProjectsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [projects, setProjects] = useState<Project[]>([]);
    const [activeProject, setActiveProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [isCreating, setIsCreating] = useState(false);
    const [newProjectName, setNewProjectName] = useState('');

    useEffect(() => {
        if (status === 'unauthenticated') router.push('/login');
        if (status === 'authenticated') loadProjects();
    }, [status]);

    const loadProjects = async () => {
        const { data, error } = await getProjects();
        if (!error && data) {
            setProjects(data as unknown as Project[]);
            if (data.length > 0 && !activeProject) setActiveProject(data[0] as unknown as Project);
        }
        setLoading(false);
    };

    const handleCreateProject = async () => {
        if (!newProjectName.trim()) return;
        const { data, error } = await createNewProject(newProjectName);
        if (data) {
            setProjects([data as unknown as Project, ...projects]);
            setActiveProject(data as unknown as Project);
            setNewProjectName('');
            setIsCreating(false);
        } else {
            alert(error || 'Proje oluşturulamadı');
        }
    };

    if (loading || status === 'loading') return <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-400 font-bold">Projeler Yükleniyor...</div>;

    return (
        <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800">
            {/* HEADER */}
            <header className="bg-white border-b border-gray-100 sticky top-0 z-30 bg-opacity-80 backdrop-blur-md">
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="text-xl font-black tracking-tight flex items-center gap-1 no-underline text-slate-900">
                        Net-Work<span className="text-blue-600">.</span> <span className="text-slate-400 font-medium ml-2 text-sm">PROJE YÖNETİMİ</span>
                    </Link>
                    <div className="flex items-center gap-6">
                        <Link href="/profil" className="text-xs font-black text-slate-500 hover:text-slate-900 no-underline uppercase tracking-widest">Profilim</Link>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    {/* SIDEBAR LIST */}
                    <aside className="lg:col-span-3 space-y-8">
                        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xs font-black text-slate-900 flex items-center gap-2 uppercase tracking-widest">
                                    <Layout className="w-4 h-4 text-blue-600" />
                                    Projelerim
                                </h2>
                                <button 
                                    onClick={() => setIsCreating(true)} 
                                    className="p-2 hover:bg-slate-50 rounded-xl transition-all text-blue-600"
                                >
                                    <Plus className="w-5 h-5" />
                                </button>
                            </div>

                            {isCreating && (
                                <div className="mb-6 p-4 bg-gray-50 rounded-2xl animate-in fade-in zoom-in-95 duration-200">
                                    <input
                                        autoFocus
                                        value={newProjectName}
                                        onChange={e => setNewProjectName(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && handleCreateProject()}
                                        placeholder="Proje adı ne?"
                                        className="w-full text-sm font-bold border-none bg-transparent outline-none mb-4"
                                    />
                                    <div className="flex gap-2">
                                        <button onClick={handleCreateProject} className="flex-1 bg-blue-600 text-white text-[10px] font-black py-2 rounded-xl uppercase tracking-widest">OLUŞTUR</button>
                                        <button onClick={() => setIsCreating(false)} className="flex-1 bg-white text-slate-600 text-[10px] font-black py-2 rounded-xl uppercase tracking-widest">İPTAL</button>
                                    </div>
                                </div>
                            )}

                            <nav className="space-y-2">
                                {projects.map(p => (
                                    <button
                                        key={p.id}
                                        onClick={() => setActiveProject(p)}
                                        className={`w-full text-left px-4 py-3.5 rounded-2xl text-xs font-black transition-all flex items-center justify-between group uppercase tracking-widest ${activeProject?.id === p.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-500 hover:bg-gray-50'}`}
                                    >
                                        {p.title}
                                        <ChevronRight className={`w-4 h-4 transition-transform ${activeProject?.id === p.id ? 'translate-x-1' : 'opacity-0 group-hover:opacity-100'}`} />
                                    </button>
                                ))}
                                {projects.length === 0 && !isCreating && (
                                    <div className="text-center py-8 text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Henüz bir proje yok.</div>
                                )}
                            </nav>
                        </div>

                        {/* TEAM FINDER */}
                        <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm">
                            <h2 className="text-xs font-black text-slate-900 flex items-center gap-2 mb-6 uppercase tracking-widest">
                                <Users className="w-4 h-4 text-indigo-600" />
                                TAKIM ARKADAŞI BUL
                            </h2>
                            <div className="space-y-4">
                                <TeamMatesList />
                            </div>
                        </div>
                    </aside>

                    {/* KANBAN BOARD */}
                    <div className="lg:col-span-9">
                        {activeProject ? (
                            <div className="space-y-8">
                                <div className="flex items-center justify-between bg-white p-8 rounded-[40px] border border-gray-100 shadow-sm">
                                    <div>
                                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter uppercase italic">{activeProject.title}</h1>
                                        <p className="text-blue-600 text-xs font-black uppercase tracking-widest mt-2">{activeProject.description || 'Interaktif Proje Panosu'}</p>
                                    </div>
                                    <div className="flex -space-x-3">
                                        {[...Array(3)].map((_, i) => (
                                            <div key={i} className="w-10 h-10 rounded-full bg-slate-100 border-4 border-white flex items-center justify-center text-[10px] font-black text-slate-400">?</div>
                                        ))}
                                        <div className="w-10 h-10 rounded-full bg-blue-600 border-4 border-white flex items-center justify-center text-[10px] font-black text-white">+</div>
                                    </div>
                                </div>
                                <KanbanBoard projectId={activeProject.id} />
                            </div>
                        ) : (
                            <div className="h-[600px] flex flex-col items-center justify-center text-slate-400 p-12 border-4 border-dashed border-gray-200 rounded-[60px] bg-white bg-opacity-50">
                                <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                                    <Layout className="w-12 h-12 opacity-20" />
                                </div>
                                <p className="font-black text-xl uppercase tracking-tighter text-slate-300">Bir proje seçin veya oluşturun.</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}

function TeamMatesList() {
    const [teammates, setTeammates] = useState<any[]>([]);

    useEffect(() => {
        const loadTeammates = async () => {
            const { data } = await fetchTeamMates();
            if (data) setTeammates(data);
        };
        loadTeammates();
    }, []);

    if (teammates.length === 0) return <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest italic text-center py-4">Takım arayan kimse yok.</div>;

    return (
        <div className="space-y-2">
            {teammates.map(t => (
                <Link href={`/profil/${t.id}`} key={t.id} className="flex items-center gap-4 p-3 hover:bg-slate-50 rounded-2xl transition-all group no-underline">
                    <div className="w-12 h-12 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 font-black overflow-hidden shadow-sm group-hover:scale-105 transition-all text-xs">
                        {t.avatar_url ? <img src={t.avatar_url} className="w-full h-full object-cover" /> : t.full_name?.[0].toUpperCase()}
                    </div>
                    <div className="overflow-hidden">
                        <div className="text-xs font-black text-slate-900 group-hover:text-blue-600 transition-colors uppercase tracking-widest truncate">{t.full_name}</div>
                        <div className="text-[10px] text-slate-400 font-bold uppercase truncate">{t.title}</div>
                    </div>
                </Link>
            ))}
        </div>
    );
}
