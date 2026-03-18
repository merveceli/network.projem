'use server';

import sql from '@/lib/db';
import { auth } from '@/auth';

export async function submitFeedback(data: {
    message: string;
    rating: number | null;
    pageUrl: string;
}) {
    const session = await auth();
    const userId = session?.user?.id;

    try {
        await sql`
            INSERT INTO user_feedback (user_id, message, rating, page_url)
            VALUES (${userId || null}, ${data.message}, ${data.rating}, ${data.pageUrl})
        `;
        return { success: true };
    } catch (error: any) {
        console.error('Feedback submission error:', error);
        return { success: false, error: error.message };
    }
}
