'use server';

import sql from '@/lib/db';
import { auth } from '@/auth';

export async function getProfile() {
    const session = await auth();
    if (!session?.user?.id) return null;

    try {
        const profile = await sql`
            SELECT * FROM profiles WHERE id = ${session.user.id}
        `;
        return profile[0] || null;
    } catch (e) {
        console.error("getProfile error:", e);
        return null;
    }
}

export async function getProfileById(id: string) {
    try {
        const profile = await sql`
            SELECT * FROM profiles WHERE id = ${id}
        `;
        return profile[0] || null;
    } catch (e) {
        console.error("getProfileById error:", e);
        return null;
    }
}

export async function updateProfileSetup(data: any) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const userId = session.user.id;
    const skillsArray = data.skills ? (Array.isArray(data.skills) ? data.skills : data.skills.split(',').map((s: string) => s.trim())) : [];

    try {
        await sql`
            UPDATE profiles
            SET 
                full_name = ${data.userType === 'employer' ? data.companyName : data.name},
                role = ${data.userType},
                title = ${data.jobTitle || null},
                hourly_rate = ${data.hourlyRate || null},
                location = ${data.location || null},
                bio = ${data.bio || null},
                phone = ${data.phone || null},
                skills = ${skillsArray},
                cv_url = ${data.cv_url || null},
                avatar_url = ${data.avatar_url || null},
                updated_at = NOW()
            WHERE id = ${userId}
        `;
        return { success: true };
    } catch (e: any) {
        console.error("updateProfileSetup error:", e);
        throw e;
    }
}

export async function updateProfileGeneric(updates: any) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const userId = session.user.id;
    
    // Dynamically build the update query to avoid over-complication while maintaining safety
    // For specific fields we know we need:
    try {
        await sql`
            UPDATE profiles
            SET 
                full_name = ${updates.full_name},
                title = ${updates.title},
                location = ${updates.location},
                bio = ${updates.bio},
                phone = ${updates.phone},
                availability = ${updates.availability},
                hourly_rate = ${updates.hourly_rate},
                skills = ${updates.skills || []},
                services = ${JSON.stringify(updates.services || [])},
                portfolio = ${JSON.stringify(updates.portfolio || [])},
                metadata = ${JSON.stringify(updates.metadata || {})},
                avatar_url = ${updates.avatar_url},
                cv_url = ${updates.cv_url},
                portfolio_pdf_url = ${updates.portfolio_pdf_url},
                looking_for_team = ${updates.looking_for_team ?? false},
                updated_at = NOW()
            WHERE id = ${userId}
        `;
        return { success: true };
    } catch (e: any) {
        console.error("updateProfileGeneric error:", e);
        throw e;
    }
}

export async function deleteProfileSelf() {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    try {
        // Technically this might leave the 'user' in the auth table but remove the profile
        // Since we have ON DELETE CASCADE on the profile reference to user, it's better to delete the profile.
        // If we want to fully delete the user, we'd delete from users table.
        await sql`DELETE FROM profiles WHERE id = ${session.user.id}`;
        return { success: true };
    } catch (e: any) {
        console.error("deleteProfileSelf error:", e);
        throw e;
    }
}

export async function getProfileComments(profileId: string) {
    try {
        const comments = await sql`
            SELECT c.*, p.full_name as author_name
            FROM profile_comments c
            LEFT JOIN profiles p ON c.author_id = p.id
            WHERE c.profile_id = ${profileId} AND c.status = 'approved'
            ORDER BY c.created_at DESC
        `;
        return comments;
    } catch (e) {
        console.error("getProfileComments error:", e);
        return [];
    }
}

export async function postProfileComment(profileId: string, content: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    try {
        await sql`
            INSERT INTO profile_comments (profile_id, author_id, content, status)
            VALUES (${profileId}, ${session.user.id}, ${content}, 'pending')
        `;
        return { success: true };
    } catch (e: any) {
        console.error("postProfileComment error:", e);
        throw e;
    }
}
