'use server';

import { auth } from "@/auth";
import * as notifLib from "@/lib/notifications";
import sql from "@/lib/db";

export async function fetchNotifications(filter: 'all' | 'unread' = 'all') {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { data: [], error: "Oturum açılmadı" };

    try {
        let result;
        if (filter === 'unread') {
            result = await sql`
                SELECT * FROM notifications 
                WHERE user_id = ${userId} AND read = false 
                ORDER BY created_at DESC
            `;
        } else {
            result = await sql`
                SELECT * FROM notifications 
                WHERE user_id = ${userId} 
                ORDER BY created_at DESC
            `;
        }
        return { data: result, error: null };
    } catch (error: any) {
        return { data: [], error: error.message };
    }
}

export async function markAsReadAction(id: string) {
    const session = await auth();
    if (!session) return { success: false };
    const success = await notifLib.markNotificationAsRead(id);
    return { success };
}

export async function markAllAsReadAction() {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) return { success: false };
    const success = await notifLib.markAllNotificationsAsRead(userId);
    return { success };
}

export async function deleteNotificationAction(id: string) {
    const session = await auth();
    if (!session) return { success: false };
    const success = await notifLib.deleteNotification(id);
    return { success };
}
