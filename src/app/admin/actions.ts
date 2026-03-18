'use server';

import sql from '@/lib/db';
import { auth } from '@/auth';

// Middleware or this action should check if user is admin
// For now, let's assume we check profile.role = 'admin'

async function checkAdmin() {
    const session = await auth();
    if (!session?.user?.id) return false;

    const profiles = await sql`
        SELECT role FROM profiles WHERE id = ${session.user.id}
        LIMIT 1
    `;
    return profiles.length > 0 && profiles[0].role === 'admin';
}

export async function getAdminStats() {
    if (!(await checkAdmin())) return null;

    try {
        const userCount = await sql`SELECT COUNT(*) FROM profiles`;
        const jobCount = await sql`SELECT COUNT(*) FROM jobs`;
        const applicationCount = await sql`SELECT COUNT(*) FROM applications`;
        const reportCount = await sql`SELECT COUNT(*) FROM reports WHERE status = 'pending'`;

        return {
            users: userCount[0].count,
            jobs: jobCount[0].count,
            applications: applicationCount[0].count,
            pendingReports: reportCount[0].count
        };
    } catch (e) {
        return null;
    }
}

export async function getRecentReports() {
    if (!(await checkAdmin())) return [];

    try {
        return await sql`
            SELECT r.*, p.full_name as reporter_name
            FROM reports r
            JOIN profiles p ON r.reporter_id = p.id
            WHERE r.status = 'pending'
            ORDER BY r.created_at DESC
            LIMIT 20
        `;
    } catch (e) {
        return [];
    }
}

export async function updateReportStatus(reportId: string, status: string) {
    if (!(await checkAdmin())) return { success: false };

    try {
        await sql`
            UPDATE reports SET status = ${status} WHERE id = ${reportId}
        `;
        return { success: true };
    } catch (e) {
        return { success: false };
    }
}

export async function banUserAction(userId: string) {
    if (!(await checkAdmin())) return { success: false };

    try {
        await sql`
            UPDATE profiles SET role = 'banned' WHERE id = ${userId}
        `;
        return { success: true };
    } catch (e) {
        return { success: false };
    }
}
