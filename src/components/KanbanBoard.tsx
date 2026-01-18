'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { Plus, MoreHorizontal, X, CheckCircle2, Clock, Circle, Trash2 } from 'lucide-react';

interface Task {
    id: string;
    title: string;
    description: string;
    status: 'todo' | 'in_progress' | 'done';
    assigned_to: string;
}

interface Project {
    id: string;
    title: string;
}

export default function KanbanBoard({ projectId }: { projectId: string }) {
    const supabase = createClient();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [isAdding, setIsAdding] = useState<string | null>(null); // 'todo', 'in_progress', 'done', or null

    useEffect(() => {
        fetchTasks();

        // Realtime subscription
        const channel = supabase
            .channel('kanban_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'kanban_tasks', filter: `project_id=eq.${projectId}` },
                () => fetchTasks()
            )
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [projectId]);

    const fetchTasks = async () => {
        const { data } = await supabase
            .from('kanban_tasks')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: true });

        if (data) setTasks(data as any);
        setLoading(false);
    };

    const addTask = async (status: 'todo' | 'in_progress' | 'done') => {
        if (!newTaskTitle.trim()) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase.from('kanban_tasks').insert({
            project_id: projectId,
            title: newTaskTitle,
            status: status,
            assigned_to: user.id
        });

        if (!error) {
            setNewTaskTitle('');
            setIsAdding(null);
            fetchTasks();
        }
    };

    const moveTask = async (taskId: string, newStatus: 'todo' | 'in_progress' | 'done') => {
        // Optimistic update
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));

        await supabase.from('kanban_tasks').update({ status: newStatus }).eq('id', taskId);
    };

    const deleteTask = async (taskId: string) => {
        if (!confirm('Görevi silmek istiyor musunuz?')) return;
        setTasks(prev => prev.filter(t => t.id !== taskId));
        await supabase.from('kanban_tasks').delete().eq('id', taskId);
    };

    const Column = ({ title, status, icon: Icon, color }: { title: string, status: 'todo' | 'in_progress' | 'done', icon: any, color: string }) => (
        <div className="flex-1 min-w-[300px] bg-slate-50 rounded-2xl p-4 flex flex-col h-full border border-slate-200">
            <div className={`flex items-center justify-between mb-4 pb-2 border-b border-slate-200 ${color}`}>
                <div className="flex items-center gap-2 font-bold">
                    <Icon className="w-5 h-5" />
                    {title}
                    <span className="bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full text-xs">{tasks.filter(t => t.status === status).length}</span>
                </div>
                <button onClick={() => setIsAdding(status)} className="p-1 hover:bg-slate-200 rounded-lg transition-colors"><Plus className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                {/* Adding Input */}
                {isAdding === status && (
                    <div className="bg-white p-3 rounded-xl border border-blue-500 shadow-sm animate-in fade-in zoom-in-95 duration-200">
                        <textarea
                            autoFocus
                            placeholder="Görev başlığı..."
                            className="w-full text-sm resize-none outline-none mb-2"
                            rows={2}
                            value={newTaskTitle}
                            onChange={e => setNewTaskTitle(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addTask(status); } }}
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setIsAdding(null)} className="text-xs font-bold text-slate-400 hover:text-slate-600">İptal</button>
                            <button onClick={() => addTask(status)} className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-blue-700">Ekle</button>
                        </div>
                    </div>
                )}

                {/* Tasks */}
                {tasks.filter(t => t.status === status).map(task => (
                    <div key={task.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group relative">
                        <div className="flex justify-between items-start mb-2">
                            <p className="text-sm font-medium text-slate-800 leading-snug">{task.title}</p>
                            <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 p-1 text-red-300 hover:text-red-500 transition-all"><Trash2 className="w-3 h-3" /></button>
                        </div>

                        {/* Task Actions (Move) */}
                        <div className="flex gap-1 mt-3 pt-3 border-t border-slate-50">
                            {status !== 'todo' && (
                                <button onClick={() => moveTask(task.id, 'todo')} className="flex-1 py-1 text-[10px] font-bold bg-slate-50 hover:bg-slate-100 text-slate-500 rounded text-center">
                                    ← Yapılacak
                                </button>
                            )}
                            {status !== 'in_progress' && (
                                <button onClick={() => moveTask(task.id, 'in_progress')} className="flex-1 py-1 text-[10px] font-bold bg-blue-50 hover:bg-blue-100 text-blue-600 rounded text-center">
                                    Sürüyor
                                </button>
                            )}
                            {status !== 'done' && (
                                <button onClick={() => moveTask(task.id, 'done')} className="flex-1 py-1 text-[10px] font-bold bg-green-50 hover:bg-green-100 text-green-600 rounded text-center">
                                    Bitti →
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    if (loading) return <div className="h-full flex items-center justify-center animate-pulse text-slate-400 font-bold">Pano Yükleniyor...</div>;

    return (
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-200px)] min-h-[500px]">
            <Column title="Yapılacaklar" status="todo" icon={Circle} color="text-slate-600" />
            <Column title="Devam Ediyor" status="in_progress" icon={Clock} color="text-blue-600" />
            <Column title="Tamamlandı" status="done" icon={CheckCircle2} color="text-green-600" />
        </div>
    );
}
