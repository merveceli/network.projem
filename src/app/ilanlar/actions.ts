'use server';

import sql from '@/lib/db';
import { auth } from '@/auth';

export async function fetchJobsList({
    searchTerm = '',
    selectedCategory = 'Tümü',
    selectedJobType = 'Tümü'
}) {
    const session = await auth();
    const userId = session?.user?.id;

    // Build the query dynamically
    let queryArgs: any[] = [];
    let sqlQuery = `
        SELECT 
            j.*,
            p.full_name,
            p.avatar_url,
            (SELECT count(*) FROM applications a WHERE a.job_id = j.id) as application_count
        FROM jobs j
        LEFT JOIN profiles p ON j.creator_id = p.id
        WHERE j.status = 'approved'
    `;

    if (searchTerm) {
        queryArgs.push(`%${searchTerm}%`);
        sqlQuery += ` AND j.title ILIKE $${queryArgs.length}`;
    }

    if (selectedCategory && selectedCategory !== 'Tümü') {
        queryArgs.push(selectedCategory);
        sqlQuery += ` AND j.category = $${queryArgs.length}`;
    }

    if (selectedJobType && selectedJobType !== 'Tümü') {
        queryArgs.push(selectedJobType);
        sqlQuery += ` AND j.job_type = $${queryArgs.length}`;
    }

    sqlQuery += ` ORDER BY j.created_at DESC`;

    // Fetch jobs using the neon pool proxy (which automatically handles parameter arrays if available)
    // Wait, the neon standard sql tagged template handles it via tagged template string.
    // Since sql tagged template handles parameters cleanly, we can use conditional fragments or direct pg Pool.
    // But since `sql` is `@neondatabase/serverless` tagged template, let's use standard pg pool for dynamic query.

    // Easier way using tagged template:
    // With `neon`, dynamic filters can be tricky without a builder.
    // Fortunately, since I created `query` helper in `lib/db.ts`, I can use it.
    
    // Fallback if needed:
    const { query } = await import('@/lib/db');
    const jobs = await query(sqlQuery, queryArgs);

    // If user is logged in, check which jobs they applied to
    let myAppliedJobIds = new Set();
    if (userId) {
        const apps = await query(`SELECT job_id FROM applications WHERE applicant_id = $1`, [userId]);
        myAppliedJobIds = new Set(apps.map((a: any) => a.job_id));
    }

    const processedJobs = jobs.map((j: any) => ({
        ...j,
        profiles: {
            full_name: j.full_name,
            avatar_url: j.avatar_url
        },
        has_applied: myAppliedJobIds.has(j.id)
    }));

    return processedJobs;
}
