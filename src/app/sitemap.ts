import { MetadataRoute } from 'next'
import sql from '@/lib/db'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // Base URL (In production, this should be an env var)
    const baseUrl = 'https://net-work.com.tr'

    // 1. Static Routes
    const ObjectRoutes = [
        '',
        '/ilanlar',
        '/login',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1 : 0.8,
    }))

    // 2. Dynamic Routes (Jobs)
    let jobRoutes: any[] = []
    
    try {
        const jobs = await sql`
            SELECT id, created_at 
            FROM jobs 
            WHERE is_filled = false AND status = 'approved'
        `

        jobRoutes = jobs.map((job: any) => ({
            url: `${baseUrl}/ilan/${job.id}`,
            lastModified: job.created_at,
            changeFrequency: 'weekly' as const,
            priority: 0.7,
        }))
    } catch (e) {
        console.error("Sitemap job fetch error:", e)
    }

    return [...ObjectRoutes, ...jobRoutes]
}
