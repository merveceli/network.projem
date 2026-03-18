'use server';

import sql from '@/lib/db';
import { auth } from '@/auth';

export async function getJobById(id: string) {
    try {
        const jobs = await sql`
            SELECT j.*, p.full_name as creator_name
            FROM jobs j
            LEFT JOIN profiles p ON j.creator_id = p.id
            WHERE j.id = ${id}
            LIMIT 1
        `;
        return jobs.length > 0 ? jobs[0] : null;
    } catch (e) {
        return null;
    }
}

export async function checkApplicationStatus(jobId: string) {
    const session = await auth();
    if (!session?.user?.id) return false;

    try {
        const apps = await sql`
            SELECT id FROM applications 
            WHERE job_id = ${jobId} AND applicant_id = ${session.user.id}
            LIMIT 1
        `;
        return apps.length > 0;
    } catch (e) {
        return false;
    }
}

export async function applyToJob(jobId: string, message: string) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Oturum açılmadı' };

    try {
        await sql`
            INSERT INTO applications (job_id, applicant_id, message)
            VALUES (${jobId}, ${session.user.id}, ${message})
        `;
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function toggleJobFilledAction(jobId: string, isFilled: boolean) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Oturum açılmadı' };

    try {
        await sql`
            UPDATE jobs SET is_filled = ${isFilled} 
            WHERE id = ${jobId} AND creator_id = ${session.user.id}
        `;
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
