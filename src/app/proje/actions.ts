'use server';

import sql from '@/lib/db';
import { auth } from '@/auth';

export async function fetchProjects() {
    const session = await auth();
    if (!session?.user?.id) return { data: [], error: 'Oturum açılmadı' };

    try {
        const projects = await sql`
            SELECT p.* 
            FROM projects p
            JOIN project_members pm ON p.id = pm.project_id
            WHERE pm.user_id = ${session.user.id}
            ORDER BY p.created_at DESC
        `;
        return { data: projects, error: null };
    } catch (error: any) {
        return { data: [], error: error.message };
    }
}

export async function createProject(title: string) {
    const session = await auth();
    if (!session?.user?.id) return { data: null, error: 'Oturum açılmadı' };

    try {
        // Start a transaction-like approach or just two sequential queries
        // Neon doesn't support 'BEGIN;COMMIT' in a single template literal easily without a pool client
        // But we can just use the provided sql client for now
        
        const newProject = await sql`
            INSERT INTO projects (title, owner_id)
            VALUES (${title}, ${session.user.id})
            RETURNING *
        `;

        if (newProject.length > 0) {
            await sql`
                INSERT INTO project_members (project_id, user_id, role)
                VALUES (${newProject[0].id}, ${session.user.id}, 'owner')
            `;
            return { data: newProject[0], error: null };
        }

        return { data: null, error: 'Proje oluşturulamadı' };
    } catch (error: any) {
        return { data: null, error: error.message };
    }
}

export async function fetchTeamMates() {
    try {
        const teammates = await sql`
            SELECT id, full_name, title, avatar_url 
            FROM profiles 
            WHERE looking_for_team = true 
            LIMIT 5
        `;
        return { data: teammates, error: null };
    } catch (error: any) {
        return { data: [], error: error.message };
    }
}
