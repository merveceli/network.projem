"use client";
import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { useSession } from "next-auth/react";
import {
    Notification,
} from '@/lib/notifications';
import { 
    getMyNotificationsAction, 
    markReadAction, 
    markAllReadAction 
} from '@/app/bildirimler/actions';

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    loading: boolean;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    refreshNotifications: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(true);

    const loadNotifications = useCallback(async (isInitial = false) => {
        if (!session?.user?.id) return;
        if (isInitial) setLoading(true);

        try {
            const data = await getMyNotificationsAction();
            if (data) {
                setNotifications(data as unknown as Notification[]);
                setUnreadCount((data as unknown as Notification[]).filter(n => !n.read).length);
            }
        } catch (error) {
            console.error("Notifications fetch error:", error);
        } finally {
            if (isInitial) setLoading(false);
        }
    }, [session]);

    // Initial load and polling
    useEffect(() => {
        if (status === 'authenticated') {
            loadNotifications(true);

            const interval = setInterval(() => {
                loadNotifications();
            }, 10000); // Poll every 10 seconds

            return () => clearInterval(interval);
        } else if (status === 'unauthenticated') {
            setNotifications([]);
            setUnreadCount(0);
            setLoading(false);
        }
    }, [status, loadNotifications]);

    const markAsRead = async (id: string) => {
        await markReadAction(id);
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
    };

    const markAllAsRead = async () => {
        if (!session?.user?.id) return;
        await markAllReadAction();
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
    };

    const refreshNotifications = async () => {
        await loadNotifications();
    };

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                loading,
                markAsRead,
                markAllAsRead,
                refreshNotifications,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within NotificationProvider');
    }
    return context;
}
