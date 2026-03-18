'use server';

import sql from '@/lib/db';

export async function submitNewsletterSubscription(email: string) {
    if (!email || !email.includes('@')) return { success: false, error: 'Geçersiz email' };

    try {
        await sql`
            INSERT INTO newsletter_subscriptions (email)
            VALUES (${email})
        `;
        return { success: true };
    } catch (error: any) {
        if (error.code === '23505') {
            return { success: false, error: 'Bu e-posta adresi zaten kayıtlı.' };
        }
        return { success: false, error: error.message };
    }
}
