"use client";
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { ArrowLeft, Bell, Check, CheckCheck, Trash2, Filter } from 'lucide-react';
import { Notification, markNotificationAsRead, markAllNotificationsAsRead, deleteNotification } from '@/lib/notifications';

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const [userId, setUserId] = useState<string | null>(null);

    useEffect(() => {
        async function loadData() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            setUserId(user.id);

            let query = supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (filter === 'unread') {
                query = query.eq('read', false);
            }

            const { data, error } = await query;

            if (!error && data) {
                setNotifications(data);
            }
            setLoading(false);
        }

        loadData();
    }, [filter]);

    const handleMarkAsRead = async (id: string) => {
        await markNotificationAsRead(id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    };

    const handleMarkAllAsRead = async () => {
        if (!userId) return;
        await markAllNotificationsAsRead(userId);
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    };

    const handleDelete = async (id: string) => {
        await deleteNotification(id);
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-950">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-zinc-950 p-6 md:p-12 font-sans text-gray-900 dark:text-gray-100">
            <div className="max-w-4xl mx-auto">
                {/* Header */}
                <div className="mb-8">
                    <Link href="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600 mb-4 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Ana Sayfaya Dön
                    </Link>

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
                                <Bell className="w-8 h-8 text-blue-600" />
                                Bildirimler
                            </h1>
                            <p className="text-gray-500 dark:text-gray-400 mt-1">
                                {unreadCount > 0 ? `${unreadCount} okunmamış bildirim` : 'Tüm bildirimler okundu'}
                            </p>
                        </div>

                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllAsRead}
                                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold text-sm transition-colors"
                            >
                                <CheckCheck className="w-4 h-4" />
                                Tümünü Okundu İşaretle
                            </button>
                        )}
                    </div>
                </div>

                {/* Filter */}
                <div className="flex gap-2 mb-6">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${filter === 'all'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white dark:bg-zinc-900 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'
                            }`}
                    >
                        Tümü ({notifications.length})
                    </button>
                    <button
                        onClick={() => setFilter('unread')}
                        className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${filter === 'unread'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white dark:bg-zinc-900 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-zinc-800'
                            }`}
                    >
                        Okunmamış ({unreadCount})
                    </button>
                </div>

                {/* Notifications List */}
                {notifications.length === 0 ? (
                    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-12 text-center border border-gray-200 dark:border-zinc-800">
                        <Bell className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-700" />
                        <h3 className="text-lg font-bold mb-2">Bildirim Yok</h3>
                        <p className="text-gray-500">
                            {filter === 'unread' ? 'Okunmamış bildiriminiz bulunmuyor.' : 'Henüz hiç bildiriminiz yok.'}
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {notifications.map((notif) => (
                            <div
                                key={notif.id}
                                className={`bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl p-5 transition-all ${!notif.read ? 'ring-2 ring-blue-500/20' : ''
                                    }`}
                            >
                                <div className="flex items-start gap-4">
                                    {/* Icon */}
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${!notif.read ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-zinc-800'
                                        }`}>
                                        <Bell className={`w-5 h-5 ${!notif.read ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'
                                            }`} />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-2 mb-1">
                                            <h3 className="font-bold text-gray-900 dark:text-white">{notif.title}</h3>
                                            {!notif.read && (
                                                <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0 mt-1.5" />
                                            )}
                                        </div>
                                        <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">{notif.message}</p>
                                        <p className="text-xs text-gray-400">
                                            {new Date(notif.created_at).toLocaleDateString('tr-TR', {
                                                day: 'numeric',
                                                month: 'long',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit',
                                            })}
                                        </p>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        {notif.link && (
                                            <Link
                                                href={notif.link}
                                                onClick={() => !notif.read && handleMarkAsRead(notif.id)}
                                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                                            >
                                                Görüntüle
                                            </Link>
                                        )}
                                        {!notif.read && (
                                            <button
                                                onClick={() => handleMarkAsRead(notif.id)}
                                                className="p-2 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                                title="Okundu işaretle"
                                            >
                                                <Check className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                                            </button>
                                        )}
                                        <button
                                            onClick={() => handleDelete(notif.id)}
                                            className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            title="Sil"
                                        >
                                            <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-600" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
