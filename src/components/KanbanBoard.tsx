'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from "next-auth/react";
import { Plus, X, CheckCircle2, Clock, Circle, Trash2, Loader2 } from 'lucide-react';
import { 
    fetchKanbanTasks, 
    addKanbanTask, 
    updateKanbanTaskStatus, 
    deleteKanbanTask 
} from '@/app/actions/kanban-actions';

interface Task {
    id: string;
    title: string;
    description: string;
    status: 'todo' | 'in_progress' | 'done';
    assigned_to: string;
}

export default function KanbanBoard({ projectId }: { projectId: string }) {
    const { data: session } = useSession();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [newTaskTitle, setNewTaskTitle] = useState('');
    const [isAdding, setIsAdding] = useState<string | null>(null);

    const loadTasks = useCallback(async (isInitial = false) => {
        if (isInitial) setLoading(true);
        const { data, error } = await fetchKanbanTasks(projectId);
        if (!error && data) {
            setTasks(data as unknown as Task[]);
        }
        if (isInitial) setLoading(false);
    }, [projectId]);

    useEffect(() => {
        loadTasks(true);

        const interval = setInterval(() => {
            loadTasks();
        }, 5000); // Poll every 5 seconds for updates

        return () => clearInterval(interval);
    }, [loadTasks]);

    const handleAddTask = async (status: 'todo' | 'in_progress' | 'done') => {
        if (!newTaskTitle.trim()) return;

        const { success } = await addKanbanTask(projectId, newTaskTitle, status);

        if (success) {
            setNewTaskTitle('');
            setIsAdding(null);
            loadTasks();
        }
    };

    const handleMoveTask = async (taskId: string, newStatus: 'todo' | 'in_progress' | 'done') => {
        // Optimistic update
        setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
        const { success } = await updateKanbanTaskStatus(taskId, newStatus);
        if (!success) loadTasks(); // Revert on failure
    };

    const handleDelete = async (taskId: string) => {
        if (!confirm('Görevi silmek istiyor musunuz?')) return;
        setTasks(prev => prev.filter(t => t.id !== taskId));
        const { success } = await deleteKanbanTask(taskId);
        if (!success) loadTasks(); // Revert on failure
    };

    const Column = ({ title, status, icon: Icon, color }: { title: string, status: 'todo' | 'in_progress' | 'done', icon: any, color: string }) => (
        <div className="flex-1 min-w-[300px] bg-slate-50 dark:bg-zinc-900 rounded-[32px] p-6 flex flex-col h-full border border-slate-200 dark:border-zinc-800">
            <div className={`flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-zinc-800 ${color}`}>
                <div className="flex items-center gap-3 font-black text-sm uppercase tracking-widest">
                    <Icon className="w-5 h-5" />
                    {title}
                    <span className="bg-slate-200 dark:bg-zinc-800 text-slate-600 dark:text-gray-400 px-3 py-1 rounded-full text-[10px] font-black">{tasks.filter(t => t.status === status).length}</span>
                </div>
                <button 
                    onClick={() => setIsAdding(status)} 
                    className="p-2 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-xl transition-all"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {isAdding === status && (
                    <div className="bg-white dark:bg-zinc-800 p-5 rounded-[24px] border-2 border-blue-500 shadow-xl animate-in fade-in zoom-in-95 duration-200">
                        <textarea
                            autoFocus
                            placeholder="Yeni görev nedir?"
                            className="w-full text-sm font-bold bg-transparent resize-none outline-none mb-4 text-gray-900 dark:text-white"
                            rows={3}
                            value={newTaskTitle}
                            onChange={e => setNewTaskTitle(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleAddTask(status); } }}
                        />
                        <div className="flex justify-end gap-3">
                            <button onClick={() => setIsAdding(null)} className="text-xs font-black text-slate-400 hover:text-slate-600 uppercase">Vazgeç</button>
                            <button 
                                onClick={() => handleAddTask(status)} 
                                className="bg-blue-600 text-white text-[10px] font-black px-4 py-2 rounded-xl hover:bg-blue-700 uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20"
                            >
                                EKLE
                            </button>
                        </div>
                    </div>
                )}

                {tasks.filter(t => t.status === status).map(task => (
                    <div key={task.id} className="bg-white dark:bg-zinc-800 p-5 rounded-[24px] border border-slate-200 dark:border-zinc-700 shadow-sm hover:shadow-xl transition-all group relative">
                        <div className="flex justify-between items-start mb-3">
                            <p className="text-sm font-bold text-slate-800 dark:text-gray-100 leading-snug">{task.title}</p>
                            <button 
                                onClick={() => handleDelete(task.id)} 
                                className="opacity-0 group-hover:opacity-100 p-2 text-red-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-all"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>

                        <div className="flex gap-1.5 mt-4 pt-4 border-t border-slate-50 dark:border-zinc-700">
                            {status !== 'todo' && (
                                <button 
                                    onClick={() => handleMoveTask(task.id, 'todo')} 
                                    className="flex-1 py-2 text-[10px] font-black bg-slate-50 dark:bg-zinc-900 hover:bg-slate-100 text-slate-500 rounded-xl transition-all uppercase"
                                >
                                    ← Yap
                                </button>
                            )}
                            {status !== 'in_progress' && (
                                <button 
                                    onClick={() => handleMoveTask(task.id, 'in_progress')} 
                                    className="flex-1 py-2 text-[10px] font-black bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-600 rounded-xl transition-all uppercase"
                                >
                                    Sürsün
                                </button>
                            )}
                            {status !== 'done' && (
                                <button 
                                    onClick={() => handleMoveTask(task.id, 'done')} 
                                    className="flex-1 py-2 text-[10px] font-black bg-green-50 dark:bg-green-900/30 hover:bg-green-100 dark:hover:bg-green-900/50 text-green-600 rounded-xl transition-all uppercase"
                                >
                                    Bitti →
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    if (loading) return (
        <div className="h-full flex flex-col items-center justify-center gap-4 text-slate-400">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
            <span className="font-black text-xs uppercase tracking-widest">Pano Yükleniyor...</span>
        </div>
    );

    return (
        <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-200px)] min-h-[600px]">
            <Column title="Yapılacaklar" status="todo" icon={Circle} color="text-slate-500" />
            <Column title="Devam Eden" status="in_progress" icon={Clock} color="text-blue-500" />
            <Column title="Bitenler" status="done" icon={CheckCircle2} color="text-green-500" />
        </div>
    );
}
