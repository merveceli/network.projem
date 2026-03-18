import sql from './db';

export type NotificationType = 'new_application' | 'message' | 'system';

export interface Notification {
    id: string;
    user_id: string;
    type: NotificationType;
    title: string;
    message: string;
    link?: string;
    read: boolean;
    created_at: string;
}

/**
 * Creates a new notification for a user
 */
export async function createNotification(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    link?: string
) {
    try {
        const result = await sql`
            INSERT INTO notifications (user_id, type, title, message, link)
            VALUES (${userId}, ${type}, ${title}, ${message}, ${link})
            RETURNING *
        `;
        return result[0];
    } catch (error) {
        console.error('Error creating notification:', error);
        return null;
    }
}

/**
 * Marks a notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
    try {
        await sql`
            UPDATE notifications 
            SET read = true 
            WHERE id = ${notificationId}
        `;
        return true;
    } catch (error) {
        console.error('Error marking notification as read:', error);
        return false;
    }
}

/**
 * Marks all notifications as read for current user
 */
export async function markAllNotificationsAsRead(userId: string) {
    try {
        await sql`
            UPDATE notifications 
            SET read = true 
            WHERE user_id = ${userId} AND read = false
        `;
        return true;
    } catch (error) {
        console.error('Error marking all notifications as read:', error);
        return false;
    }
}

/**
 * Gets unread notification count for a user
 */
export async function getUnreadCount(userId: string): Promise<number> {
    try {
        const result = await sql`
            SELECT COUNT(*) 
            FROM notifications 
            WHERE user_id = ${userId} AND read = false
        `;
        return parseInt(result[0].count, 10) || 0;
    } catch (error) {
        console.error('Error getting unread count:', error);
        return 0;
    }
}

/**
 * Gets recent notifications for a user
 */
export async function getRecentNotifications(
    userId: string,
    limit: number = 10
): Promise<Notification[]> {
    try {
        const result = await sql`
            SELECT * 
            FROM notifications 
            WHERE user_id = ${userId}
            ORDER BY created_at DESC
            LIMIT ${limit}
        `;
        return result as unknown as Notification[];
    } catch (error) {
        console.error('Error getting notifications:', error);
        return [];
    }
}

/**
 * Deletes a notification
 */
export async function deleteNotification(notificationId: string) {
    try {
        await sql`
            DELETE FROM notifications 
            WHERE id = ${notificationId}
        `;
        return true;
    } catch (error) {
        console.error('Error deleting notification:', error);
        return false;
    }
}
