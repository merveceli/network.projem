import { MetadataRoute } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    // Base URL (In production, this should be an env var)
    const baseUrl = 'https://net-work.com.tr'

    // 1. Static Routes
    const routes = [
        '',
        '/ilanlar',
        '/giris',
        '/sartlar',
        '/gizlilik',
    ].map((route) => ({
        url: `${baseUrl}${route}`,
        lastModified: new Date().toISOString(),
        changeFrequency: 'daily' as const,
        priority: route === '' ? 1 : 0.8,
    }))

    // 2. Dynamic Routes (Jobs)
    const { data: jobs } = await supabase
        .from('jobs')
        .select('id, created_at')
        .eq('is_filled', false) // Only active jobs

    const jobRoutes = jobs?.map((job) => ({
        url: `${baseUrl}/ilan/${job.id}`,
        lastModified: job.created_at,
        changeFrequency: 'weekly' as const,
        priority: 0.7,
    })) ?? []

    return [...routes, ...jobRoutes]
}
