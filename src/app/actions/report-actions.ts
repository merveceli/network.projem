'use server';

import sql from '@/lib/db';
import { auth } from '@/auth';

export async function submitReport(data: {
    targetType: 'job' | 'profile';
    targetId: string;
    reason: string;
    details: string;
}) {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: 'Oturum açmanız gerekiyor.' };

    try {
        await sql`
            INSERT INTO reports (reporter_id, target_type, target_id, reason, details)
            VALUES (${session.user.id}, ${data.targetType}, ${data.targetId}, ${data.reason}, ${data.details})
        `;
        return { success: true };
    } catch (error: any) {
        console.error('Report submission error:', error);
        return { success: false, error: error.message };
    }
}
