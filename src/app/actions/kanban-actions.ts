'use server';

import sql from '@/lib/db';
import { auth } from '@/auth';

export async function fetchKanbanTasks(projectId: string) {
    try {
        const tasks = await sql`
            SELECT * FROM kanban_tasks 
            WHERE project_id = ${projectId} 
            ORDER BY created_at ASC
        `;
        return { data: tasks, error: null };
    } catch (error: any) {
        return { data: [], error: error.message };
    }
}

export async function addKanbanTask(projectId: string, title: string, status: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Oturum açılmadı' };

    try {
        await sql`
            INSERT INTO kanban_tasks (project_id, title, status, assigned_to)
            VALUES (${projectId}, ${title}, ${status}, ${session.user.id})
        `;
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateKanbanTaskStatus(taskId: string, status: string) {
    const session = await auth();
    if (!session) return { success: false };

    try {
        await sql`
            UPDATE kanban_tasks 
            SET status = ${status}, updated_at = NOW()
            WHERE id = ${taskId}
        `;
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function deleteKanbanTask(taskId: string) {
    const session = await auth();
    if (!session) return { success: false };

    try {
        await sql`
            DELETE FROM kanban_tasks WHERE id = ${taskId}
        `;
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
