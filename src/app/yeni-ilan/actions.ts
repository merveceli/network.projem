'use server';

import sql from '@/lib/db';
import { auth } from '@/auth';
import { checkRateLimit } from '@/lib/rateLimit';

export async function createJobAction(formData: {
    title: string;
    description: string;
    category: string;
    job_type: string;
    salary: string;
    urgency: string;
    images: string[];
}) {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
        return { success: false, error: 'Oturum süreniz doldu, lütfen giriş yapın.' };
    }

    // Rate Limit check
    const { allowed } = await checkRateLimit(userId, 'create_job');
    if (!allowed) {
        return { success: false, error: 'İlan oluşturma limitiniz doldu. Lütfen daha sonra tekrar deneyin.' };
    }

    try {
        await sql`
            INSERT INTO jobs (
                title, description, category, job_type, salary_range, creator_id, urgency, images, status
            ) VALUES (
                ${formData.title},
                ${formData.description},
                ${formData.category},
                ${formData.job_type},
                ${formData.salary},
                ${userId},
                ${formData.urgency},
                ${formData.images},
                'pending'
            )
        `;
        return { success: true };
    } catch (e: any) {
        console.error('Job insert error', e);
        return { success: false, error: e.message || 'Veritabanı hatası' };
    }
}
