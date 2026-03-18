'use client';

import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { 
    Users, Briefcase, Flag, ShieldAlert, 
    ArrowLeft, LayoutDashboard, Database, 
    Bell, Settings, LogOut, CheckCircle2, XCircle, Search, AlertTriangle
} from 'lucide-react';
import Link from 'next/link';
import { getAdminStats, getRecentReports, updateReportStatus, banUserAction } from './actions';

export default function AdminPage() {
    const { data: session, status } = useSession();
    const [stats, setStats] = useState<any>(null);
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('dashboard');

    useEffect(() => {
        const loadAdminData = async () => {
            const [statsRes, reportsRes] = await Promise.all([
                getAdminStats(),
                getRecentReports()
            ]);

            setStats(statsRes);
            setReports(reportsRes);
            setLoading(false);
        };

        if (status === 'authenticated') {
            loadAdminData();
        }
    }, [status]);

    const handleReport = async (reportId: string, action: string, targetId?: string) => {
        if (action === 'ban' && targetId) {
            if (confirm("Kullanıcıyı süresiz uzaklaştırmak istediğinize emin misiniz?")) {
                await banUserAction(targetId);
                await updateReportStatus(reportId, 'resolved');
            }
        } else {
            await updateReportStatus(reportId, action === 'resolve' ? 'resolved' : 'dismissed');
        }
        
        // Refresh
        const updated = await getRecentReports();
        setReports(updated);
    };

    if (status === 'loading' || loading) return (
        <div className="min-h-screen bg-[#0A0A10] flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (status === 'unauthenticated' || (stats === null && !loading)) {
        return (
            <div className="min-h-screen bg-[#0A0A10] flex flex-col items-center justify-center p-8 text-center">
                <ShieldAlert className="w-24 h-24 text-red-500 mb-8" />
                <h1 className="text-4xl font-black text-white italic uppercase tracking-tighter mb-4">ERİŞİM ENGELLENDİ</h1>
                <p className="text-slate-400 max-w-md mb-8">Bu alana sadece yetkili yöneticiler giriş yapabilir. Lütfen hesabınızın yetkili olduğunu kontrol edin.</p>
                <Link href="/" className="px-10 py-4 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] no-underline">ANA SAYFAYA DÖN</Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050510] text-slate-200 font-sans flex overflow-hidden">
            {/* Sidebar */}
            <aside className="w-80 bg-[#0A0A15] border-r border-white/5 p-10 flex flex-col flex-shrink-0">
                <div className="flex items-center gap-4 mb-20 px-2">
                    <div className="w-10 h-10 bg-blue-600 rounded-[14px] flex items-center justify-center text-white font-black italic shadow-lg shadow-blue-500/20">A</div>
                    <span className="font-black uppercase italic tracking-tighter text-2xl">CORE <span className="text-blue-600">ADMIN</span></span>
                </div>

                <nav className="flex-1 space-y-4">
                    <button 
                        onClick={() => setActiveTab('dashboard')}
                        className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'dashboard' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-slate-500 hover:bg-white/5'}`}
                    >
                        <LayoutDashboard className="w-4 h-4" /> PANEL
                    </button>
                    <button 
                        onClick={() => setActiveTab('reports')}
                        className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'reports' ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'text-slate-500 hover:bg-white/5'}`}
                    >
                        <Flag className="w-4 h-4" /> RAPORLAR {reports.length > 0 && <span className="ml-auto bg-red-500 text-white px-2 py-0.5 rounded-full text-[8px]">{reports.length}</span>}
                    </button>
                    <button className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-white/5 transition-all">
                        <Users className="w-4 h-4" /> KULLANICILAR
                    </button>
                    <button className="w-full flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:bg-white/5 transition-all">
                        <Settings className="w-4 h-4" /> AYARLAR
                    </button>
                </nav>

                <div className="pt-10 border-t border-white/5">
                    <Link href="/" className="flex items-center gap-4 px-6 py-4 text-slate-500 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest no-underline">
                        <ArrowLeft className="w-4 h-4" /> SİTEYE DÖN
                    </Link>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-y-auto p-16 relative">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-blue-600/5 rounded-full blur-[200px] -translate-y-1/2 translate-x-1/2" />
                
                <header className="flex justify-between items-end mb-20 relative z-10">
                    <div>
                        <h2 className="text-6xl font-black uppercase italic tracking-tighter leading-none mb-4">{activeTab === 'dashboard' ? 'DURUM' : 'RAPORLAR'}</h2>
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.3em] opacity-60">NET-WORK SISTEM YÖNETİMİ • 2026</p>
                    </div>

                    <div className="flex gap-4">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-slate-400 hover:bg-white/10 transition-all cursor-pointer">
                            <Bell className="w-5 h-5" />
                        </div>
                        <div className="flex items-center gap-4 bg-white/5 px-6 rounded-2xl border border-white/5">
                            <span className="text-[10px] font-black uppercase tracking-widest opacity-60">{session?.user?.name}</span>
                            <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-[10px] font-black uppercase italic">AD</div>
                        </div>
                    </div>
                </header>

                {activeTab === 'dashboard' ? (
                    <div className="space-y-12 relative z-10">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {[
                                { label: 'TOPLAM KULLANICI', value: stats.users, icon: Users, color: 'blue' },
                                { label: 'AKTİF İLANLAR', value: stats.jobs, icon: Briefcase, color: 'purple' },
                                { label: 'TOPLAM BAŞVURU', value: stats.applications, icon: CheckCircle2, color: 'green' },
                                { label: 'BEKLEYEN İHBAR', value: stats.pendingReports, icon: AlertTriangle, color: 'red' }
                            ].map((s, idx) => (
                                <div key={idx} className="bg-white/5 p-10 rounded-[40px] border border-white/5 group hover:bg-white/[0.08] transition-all">
                                    <div className={`p-4 bg-${s.color}-600/20 text-${s.color}-500 w-fit rounded-2xl mb-8 group-hover:scale-110 transition-transform`}>
                                        <s.icon className="w-6 h-6" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{s.label}</p>
                                    <p className="text-4xl font-black uppercase italic tracking-tighter">{s.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Recent Activity Section */}
                        <div className="bg-white/5 p-12 rounded-[56px] border border-white/5">
                            <h3 className="text-xs font-black uppercase tracking-[0.2em] mb-12 flex items-center gap-4">
                                <div className="w-12 h-1 bg-blue-600 rounded-full" />
                                SİSTEM LOGLARI
                            </h3>
                            <div className="space-y-6">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="flex items-center gap-6 p-6 bg-white/[0.02] rounded-3xl border border-white/5 hover:bg-white/5 transition-all group">
                                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center">
                                            <Database className="w-5 h-5 text-slate-600" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-slate-300">Yeni kullanıcı kaydı: <span className="text-blue-500 font-bold">@user_{i}23</span></p>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-600 mt-1">BUGÜN • 14:2{i}</p>
                                        </div>
                                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest">DETAY</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8 relative z-10 animate-in fade-in slide-in-from-right-10 duration-500">
                        {reports.length === 0 ? (
                            <div className="py-40 text-center bg-white/5 rounded-[60px] border-4 border-dashed border-white/5">
                                <CheckCircle2 className="w-20 h-20 text-blue-600/20 mx-auto mb-8" />
                                <h3 className="text-3xl font-black uppercase italic tracking-tighter opacity-20">HER ŞEY TEMİZ</h3>
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Bekleyen herhangi bir şikayet raporu bulunamadı.</p>
                            </div>
                        ) : (
                            reports.map(report => (
                                <div key={report.id} className="bg-white/5 p-12 rounded-[56px] border border-white/5 hover:bg-white/[0.08] transition-all flex flex-col md:flex-row gap-12 items-start group">
                                    <div className="w-20 h-20 bg-red-600/20 rounded-[28px] flex items-center justify-center text-red-500 shrink-0">
                                        <AlertTriangle className="w-10 h-10 group-hover:scale-110 transition-transform" />
                                    </div>

                                    <div className="flex-1 space-y-6">
                                        <div className="flex items-center gap-4">
                                            <span className="bg-red-600/10 text-red-500 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest border border-red-500/10">{report.target_type} RAPORU</span>
                                            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{new Date(report.created_at).toLocaleString('tr-TR')}</span>
                                        </div>
                                        
                                        <div>
                                            <h4 className="text-3xl font-black uppercase italic tracking-tighter text-white mb-2">{report.reporter_name} tarafından şikayet edildi</h4>
                                            <p className="text-slate-400 text-lg leading-relaxed italic opacity-80">"{report.reason}"</p>
                                        </div>

                                        <div className="bg-black/20 p-6 rounded-3xl border border-white/5">
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">HEDEF ID</p>
                                            <code className="text-blue-400 font-mono text-xs">{report.target_id}</code>
                                        </div>
                                    </div>

                                    <div className="flex flex-col gap-4 w-full md:w-auto">
                                        <button 
                                            onClick={() => handleReport(report.id, 'ban', report.target_id)}
                                            className="px-8 py-5 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-red-500/20 transition-all flex items-center justify-center gap-3"
                                        >
                                            <XCircle className="w-4 h-4" /> KULLANICIYI BANLA
                                        </button>
                                        <button 
                                            onClick={() => handleReport(report.id, 'resolve')}
                                            className="px-8 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-blue-500/20 transition-all flex items-center justify-center gap-3"
                                        >
                                            <CheckCircle2 className="w-4 h-4" /> ÇÖZÜLDÜ
                                        </button>
                                        <button 
                                            onClick={() => handleReport(report.id, 'dismiss')}
                                            className="px-8 py-5 bg-white/5 hover:bg-white/10 text-slate-400 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all"
                                        >
                                            GEÇERSİZ SAY
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </main>
        </div>
    );
}
