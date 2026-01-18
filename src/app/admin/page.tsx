'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { useRouter } from 'next/navigation';
import {
    Flag,
    ShieldAlert,
    Users,
    Briefcase,
    Play,
    Trash2,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Search,
    UserMinus,
    UserCheck,
    Lock,
    Unlock,
    ExternalLink
} from 'lucide-react';
import Link from 'next/link';

interface Job {
    id: string;
    title: string;
    description: string;
    category: string;
    created_at: string;
    status: string;
    creator_id: string;
    profiles: {
        full_name: string;
        email: string;
    };
}

interface VideoProfile {
    id: string;
    full_name: string;
    email: string;
    video_url: string;
    video_status: string;
    title: string;
}

interface Report {
    id: string;
    reporter_id: string;
    target_type: 'job' | 'profile';
    target_id: string;
    reason: string;
    details: string;
    status: 'pending' | 'resolved';
    created_at: string;
    reporter_profile?: { full_name: string };
}

interface UserProfile {
    id: string;
    full_name: string;
    email: string;
    is_admin: boolean;
    is_suspended: boolean;
    is_secure: boolean;
    is_suspicious: boolean;
    fast_responder: boolean;
    created_at: string;
    title: string;
}

interface ProfileComment {
    id: string;
    profile_id: string;
    author_id: string;
    content: string;
    status: 'pending' | 'approved' | 'rejected';
    created_at: string;
    author_profile: { full_name: string };
    target_profile: { full_name: string };
}

export default function AdminPage() {
    const supabase = createClient();
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    const [activeTab, setActiveTab] = useState<'moderation' | 'reports' | 'users' | 'jobs'>('moderation');

    // Data States
    const [pendingJobs, setPendingJobs] = useState<Job[]>([]);
    const [pendingVideos, setPendingVideos] = useState<VideoProfile[]>([]);
    const [reports, setReports] = useState<Report[]>([]);
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [allJobs, setAllJobs] = useState<Job[]>([]);
    const [pendingComments, setPendingComments] = useState<ProfileComment[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        const checkAdmin = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.push('/'); return; }

            const { data: profile } = await supabase
                .from('profiles')
                .select('is_admin')
                .eq('id', user.id)
                .single();

            if (profile && profile.is_admin) {
                setIsAdmin(true);
                fetchAllData();
            } else {
                router.push('/');
            }
            setIsLoading(false);
        };
        checkAdmin();
    }, [router, supabase]);

    const fetchAllData = async () => {
        // Fetch Pending Moderation
        const { data: jobs } = await supabase.from('jobs').select('*, profiles:creator_id(full_name, email)').eq('status', 'pending').order('created_at', { ascending: false });
        if (jobs) setPendingJobs(jobs as any);

        const { data: videos } = await supabase.from('profiles').select('id, full_name, email, video_url, video_status, title').eq('video_status', 'pending');
        if (videos) setPendingVideos(videos as any);

        // Fetch Reports
        const { data: reportData } = await supabase.from('reports').select('*, reporter_profile:reporter_id(full_name)').order('created_at', { ascending: false });
        if (reportData) setReports(reportData as any);

        // Fetch Users
        const { data: userData, error: userError } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
        if (userError) {
            console.error("User Fetch Error:", userError);
            alert("Kullanıcıları çekerken hata: " + userError.message);
        }
        if (userData) setUsers(userData as any);

        // Fetch All Jobs
        const { data: jobData } = await supabase.from('jobs').select('*, profiles:creator_id(full_name, email)').order('created_at', { ascending: false });
        if (jobData) setAllJobs(jobData as any);

        // Fetch Pending Comments
        const { data: commentData } = await supabase
            .from('profile_comments')
            .select('*, author_profile:author_id(full_name), target_profile:profile_id(full_name)')
            .eq('status', 'pending')
            .order('created_at', { ascending: false });
        if (commentData) setPendingComments(commentData as any);
    };

    const handleJobModeration = async (id: string, action: 'approve' | 'reject' | 'delete') => {
        if (action === 'delete') {
            if (!confirm('Bu ilanı silmek istediğinize emin misiniz?')) return;
            const { error } = await supabase.from('jobs').delete().eq('id', id);
            if (!error) {
                setPendingJobs(prev => prev.filter(j => j.id !== id));
                setAllJobs(prev => prev.filter(j => j.id !== id));
            }
            return;
        }

        const newStatus = action === 'approve' ? 'approved' : 'rejected';
        const { error } = await supabase.from('jobs').update({ status: newStatus }).eq('id', id);
        if (!error) {
            setPendingJobs(prev => prev.filter(j => j.id !== id));
            fetchAllData();
        }
    };

    const handleCommentModeration = async (id: string, action: 'approve' | 'reject') => {
        const newStatus = action === 'approve' ? 'approved' : 'rejected';
        const { error } = await supabase.from('profile_comments').update({ status: newStatus }).eq('id', id);
        if (!error) {
            setPendingComments(prev => prev.filter(c => c.id !== id));
        } else {
            alert("Hata: " + error.message);
        }
    };

    const handleUserAction = async (userId: string, action: 'suspend' | 'activate' | 'make_admin' | 'remove_admin' | 'delete') => {
        if (action === 'delete') {
            if (!confirm('DİKKAT: Kullanıcıyı silmek üzeresiniz. Bu işlem geri alınamaz ve profili kalıcı olarak siler. (Sadece profil verisi silinir, giriş yetkisi kalabilir). Onaylıyor musunuz?')) return;

            const { error } = await supabase.from('profiles').delete().eq('id', userId);

            if (!error) {
                setUsers(prev => prev.filter(u => u.id !== userId));
            } else {
                alert('Silme işlemi başarısız: ' + error.message);
            }
            return;
        }

        const updates: any = {};
        if (action === 'suspend') updates.is_suspended = true;
        if (action === 'activate') updates.is_suspended = false;
        if (action === 'make_admin') updates.is_admin = true;
        if (action === 'remove_admin') updates.is_admin = false;

        const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
        if (!error) {
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, ...updates } : u));
        }
    };

    const toggleBadge = async (userId: string, badgeField: string, currentValue: boolean) => {
        const { error } = await supabase
            .from('profiles')
            .update({ [badgeField]: !currentValue })
            .eq('id', userId);

        if (error) alert(error.message);
        else {
            setUsers(prev => prev.map(p => p.id === userId ? { ...p, [badgeField]: !currentValue } : p));
        }
    };

    const handleResolveReport = async (reportId: string) => {
        const { error } = await supabase.from('reports').update({ status: 'resolved' }).eq('id', reportId);
        if (!error) {
            setReports(prev => prev.map(r => r.id === reportId ? { ...r, status: 'resolved' } : r));
        }
    };

    if (isLoading) return <div className="h-screen flex items-center justify-center bg-[#0f172a] text-white font-black text-2xl animate-pulse">ADMIN GÜVENLİK KONTROLÜ...</div>;
    if (!isAdmin) return null;

    return (
        <div className="min-h-screen bg-[#f8fafc] flex">
            {/* Sidebar */}
            <aside className="w-72 bg-[#1e293b] text-white p-8 flex flex-col gap-6 sticky top-0 h-screen">
                <div className="flex items-center gap-3 mb-8">
                    <ShieldAlert className="w-10 h-10 text-orange-500" />
                    <div>
                        <h1 className="text-xl font-black tracking-tighter">ADMIN PANEL</h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Güvenlik Merkezi</p>
                    </div>
                </div>

                <nav className="flex flex-col gap-2">
                    {[
                        { id: 'moderation', label: 'Moderasyon', icon: <Play className="w-5 h-5" />, count: pendingJobs.length + pendingVideos.length + pendingComments.length },
                        { id: 'reports', label: 'Şikayetler', icon: <Flag className="w-5 h-5" />, count: reports.filter(r => r.status === 'pending').length },
                        { id: 'users', label: 'Kullanıcılar', icon: <Users className="w-5 h-5" /> },
                        { id: 'jobs', label: 'İş İlanları', icon: <Briefcase className="w-5 h-5" /> },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`flex items-center justify-between p-4 rounded-2xl font-bold transition-all ${activeTab === tab.id ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800'}`}
                        >
                            <div className="flex items-center gap-3">
                                {tab.icon}
                                <span>{tab.label}</span>
                            </div>
                            {tab.count !== undefined && tab.count > 0 && (
                                <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full">{tab.count}</span>
                            )}
                        </button>
                    ))}
                </nav>

                <div className="mt-auto p-4 bg-slate-800/50 rounded-2xl border border-slate-700">
                    <p className="text-xs text-slate-400 mb-2 font-bold uppercase">Sistem Durumu</p>
                    <div className="flex items-center gap-2 text-green-400 font-bold text-sm">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-ping" />
                        Aktif
                    </div>
                </div>
            </aside>

            {/* Content Area */}
            <main className="flex-1 p-12 overflow-auto">
                {/* MODERATION TAB */}
                {activeTab === 'moderation' && (
                    <div className="space-y-12">
                        <SectionHeader title="Onay Bekleyen İlanlar" count={pendingJobs.length} />
                        <div className="grid gap-6">
                            {pendingJobs.map(job => (
                                <AdminCard key={job.id} title={job.title} subTitle={job.profiles.full_name} meta={`${job.category} • ${new Date(job.created_at).toLocaleDateString()}`}>
                                    <p className="text-slate-600 mb-4 bg-slate-50 p-4 rounded-xl text-sm">{job.description}</p>
                                    <div className="flex gap-3">
                                        <button onClick={() => handleJobModeration(job.id, 'approve')} className="btn-green">Onayla</button>
                                        <button onClick={() => handleJobModeration(job.id, 'reject')} className="btn-red">Reddet</button>
                                    </div>
                                </AdminCard>
                            ))}
                        </div>

                        {/* PENDING COMMENTS MODERATION */}
                        <SectionHeader title="Onay Bekleyen Yorumlar" count={pendingComments.length} />
                        <div className="grid gap-6">
                            {pendingComments.map(comment => (
                                <AdminCard
                                    key={comment.id}
                                    title={`${comment.author_profile?.full_name} -> ${comment.target_profile?.full_name}`}
                                    subTitle="Profil Yorumu"
                                    meta={new Date(comment.created_at).toLocaleDateString()}
                                >
                                    <p className="text-slate-600 mb-4 bg-purple-50 p-4 rounded-xl text-sm border border-purple-100 italic">
                                        "{comment.content}"
                                    </p>
                                    <div className="flex gap-3">
                                        <button onClick={() => handleCommentModeration(comment.id, 'approve')} className="btn-green">Onayla</button>
                                        <button onClick={() => handleCommentModeration(comment.id, 'reject')} className="btn-red">Reddet</button>
                                    </div>
                                </AdminCard>
                            ))}
                        </div>
                    </div>
                )}

                {/* REPORTS TAB */}
                {activeTab === 'reports' && (
                    <div className="space-y-8">
                        <SectionHeader title="Gelen Şikayetler" count={reports.length} />
                        <div className="grid gap-6">
                            {reports.map(report => (
                                <AdminCard
                                    key={report.id}
                                    title={report.reason}
                                    subTitle={`Bildiren: ${report.reporter_profile?.full_name || 'Gizli'}`}
                                    meta={`${report.target_type === 'job' ? 'İş İlanı' : 'Profil'} • ${new Date(report.created_at).toLocaleDateString()}`}
                                    status={report.status}
                                >
                                    <div className="bg-red-50 p-4 rounded-xl mb-4 border border-red-100 italic text-sm">
                                        "{report.details}"
                                    </div>
                                    <div className="flex gap-4">
                                        <Link href={report.target_type === 'job' ? `/ilan/${report.target_id}` : `/profil/freelancer/${report.target_id}`} target="_blank" className="flex items-center gap-2 text-blue-600 font-bold text-sm hover:underline">
                                            Hedefi Görüntüle <ExternalLink className="w-4 h-4" />
                                        </Link>
                                        {report.status === 'pending' && (
                                            <button onClick={() => handleResolveReport(report.id)} className="text-green-600 font-bold text-sm hover:underline">Çözüldü Olarak İşaretle</button>
                                        )}
                                    </div>
                                </AdminCard>
                            ))}
                        </div>
                    </div>
                )}

                {/* USERS TAB */}
                {activeTab === 'users' && (
                    <div className="space-y-8">
                        <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                            <SectionHeader title="Kullanıcı Yönetimi" count={users.length} light />
                            <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-200 w-96">
                                <Search className="w-5 h-5 text-slate-400" />
                                <input placeholder="İsim veya e-posta ile ara..." className="bg-transparent outline-none w-full text-sm font-bold" onChange={e => setSearchTerm(e.target.value.toLowerCase())} />
                            </div>
                        </div>

                        <div className="bg-white rounded-[32px] overflow-hidden shadow-xl border border-slate-100">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 text-slate-400 text-xs font-black uppercase tracking-widest border-b border-slate-100">
                                    <tr>
                                        <th className="p-6">Kullanıcı</th>
                                        <th>Durum</th>
                                        <th>Rozetler</th>
                                        <th>Admin</th>
                                        <th>Katılım</th>
                                        <th className="text-right p-6">İşlemler</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {users.filter(u => u.full_name?.toLowerCase().includes(searchTerm) || u.email?.toLowerCase().includes(searchTerm)).map(user => (
                                        <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${user.is_suspended ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                                        {user.full_name?.[0] || '?'}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-slate-900">{user.full_name}</p>
                                                        <p className="text-xs text-slate-400">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td>
                                                <div className="flex gap-2">
                                                    {user.is_suspended ?
                                                        <span className="bg-red-100 text-red-600 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight flex items-center gap-1"><Lock className="w-3 h-3" /> Engelli</span> :
                                                        <span className="bg-green-100 text-green-600 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-tight flex items-center gap-1"><UserCheck className="w-3 h-3" /> Aktif</span>
                                                    }
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => toggleBadge(user.id, 'is_secure', user.is_secure)}
                                                        className={`px-2 py-1 rounded text-[10px] font-bold ${user.is_secure ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-400'}`}
                                                    >
                                                        GÜVENLİ
                                                    </button>
                                                    <button
                                                        onClick={() => toggleBadge(user.id, 'is_suspicious', user.is_suspicious)}
                                                        className={`px-2 py-1 rounded text-[10px] font-bold ${user.is_suspicious ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-400'}`}
                                                    >
                                                        ŞÜPHELİ
                                                    </button>
                                                    <button
                                                        onClick={() => toggleBadge(user.id, 'fast_responder', user.fast_responder)}
                                                        className={`px-2 py-1 rounded text-[10px] font-bold ${user.fast_responder ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}
                                                    >
                                                        HIZLI
                                                    </button>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <button
                                                    onClick={() => handleUserAction(user.id, user.is_admin ? 'remove_admin' : 'make_admin')}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${user.is_admin ? 'bg-purple-100 text-purple-700 hover:bg-purple-200' : 'bg-zinc-100 text-zinc-600 hover:bg-zinc-200'}`}
                                                >
                                                    {user.is_admin ? 'Admin Geri Al' : 'Admin Yap'}
                                                </button>
                                            </td>
                                            <td className="text-sm text-slate-500 font-medium">{new Date(user.created_at).toLocaleDateString()}</td>
                                            <td className="p-6 text-right">
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => handleUserAction(user.id, user.is_suspended ? 'activate' : 'suspend')} className={`p-2 rounded-xl transition-all ${user.is_suspended ? 'bg-green-50 text-green-600 hover:bg-green-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`} title={user.is_suspended ? 'Engeli Kaldır' : 'Engelle'}>
                                                        {user.is_suspended ? <Unlock className="w-5 h-5" /> : <Lock className="w-5 h-5" />}
                                                    </button>
                                                    <button onClick={() => handleUserAction(user.id, user.is_admin ? 'remove_admin' : 'make_admin')} className="p-2 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200" title="Admin Yap / Al">
                                                        <ShieldAlert className="w-5 h-5" />
                                                    </button>
                                                    <button onClick={() => handleUserAction(user.id, 'delete')} className="p-2 bg-red-100 text-red-600 rounded-xl hover:bg-red-200" title="Kullanıcıyı Sil">
                                                        <Trash2 className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}

                {/* JOBS TAB */}
                {activeTab === 'jobs' && (
                    <div className="space-y-8">
                        <SectionHeader title="Tüm İş İlanlarını Yönet" count={allJobs.length} />
                        <div className="grid gap-4">
                            {allJobs.map(job => (
                                <div key={job.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between group hover:border-slate-300 transition-all">
                                    <div className="flex items-center gap-6">
                                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors">
                                            <Briefcase className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900">{job.title}</h3>
                                            <p className="text-xs text-slate-400 font-bold">{job.profiles.full_name} • {job.category} • {job.status}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => handleJobModeration(job.id, 'delete')} className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-2xl transition-all">
                                        <Trash2 className="w-5 h-5" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
}

// Custom UI Components
function SectionHeader({ title, count, light = false }: { title: string, count: number, light?: boolean }) {
    return (
        <div className={`flex items-center gap-4 ${light ? '' : 'mb-8'}`}>
            <h2 className="text-3xl font-black tracking-tight text-slate-900">{title}</h2>
            <span className="bg-slate-900 text-white text-sm font-black px-4 py-1.5 rounded-full">{count}</span>
        </div>
    );
}

function AdminCard({ title, subTitle, meta, children, status }: { title: string, subTitle: string, meta: string, children: React.ReactNode, status?: string }) {
    return (
        <div className="bg-white p-8 rounded-[32px] shadow-xl shadow-slate-200/50 border border-slate-100 relative overflow-hidden group">
            {status === 'resolved' && <div className="absolute top-0 right-0 p-4"><CheckCircle2 className="w-6 h-6 text-green-500" /></div>}
            <div className="mb-6">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-slate-900 group-hover:text-orange-600 transition-colors">{title}</h3>
                </div>
                <div className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-widest">
                    <span>{subTitle}</span>
                    <span className="w-1 h-1 bg-slate-200 rounded-full" />
                    <span>{meta}</span>
                </div>
            </div>
            {children}
        </div>
    );
}
