import sql from './db';

export type RateLimitAction = 'create_job' | 'send_application' | 'send_message' | 'newsletter_signup';

export interface RateLimitConfig {
    limit: number;
    windowHours: number;
}

// Rate limit configurations
export const RATE_LIMITS: Record<RateLimitAction, RateLimitConfig> = {
    create_job: { limit: 5, windowHours: 24 },
    send_application: { limit: 20, windowHours: 24 },
    send_message: { limit: 100, windowHours: 24 },
    newsletter_signup: { limit: 3, windowHours: 24 }
};

export interface RateLimitInfo {
    remaining: number;
    limit: number;
    reset_at: string;
    used?: number;
}

/**
 * Checks if user can perform an action (and increments counter if allowed)
 */
export async function checkRateLimit(
    userId: string,
    action: RateLimitAction
): Promise<{ allowed: boolean; info?: RateLimitInfo }> {
    const config = RATE_LIMITS[action];

    try {
        // Find existing record within the window
        const windowStart = new Date(Date.now() - config.windowHours * 60 * 60 * 1000);
        
        // UPSERT logic for rate limits
        // If an entry exists for user+action, check if it's within the window
        // If outside the window, reset count and window_start
        // If within the window, increment count if below limit
        
        await sql.begin(async (tx) => {
            const records = await tx`
                SELECT * FROM rate_limits 
                WHERE user_id = ${userId} AND action = ${action}
                FOR UPDATE
            `;

            if (records.length === 0) {
                // First time
                await tx`
                    INSERT INTO rate_limits (user_id, action, count, window_start)
                    VALUES (${userId}, ${action}, 1, NOW())
                `;
                return { allowed: true };
            }

            const record = records[0];
            const isOutsideWindow = new Date(record.window_start) < windowStart;

            if (isOutsideWindow) {
                // Reset window
                await tx`
                    UPDATE rate_limits 
                    SET count = 1, window_start = NOW()
                    WHERE id = ${record.id}
                `;
                return { allowed: true };
            }

            if (record.count < config.limit) {
                // Increment within window
                await tx`
                    UPDATE rate_limits 
                    SET count = count + 1
                    WHERE id = ${record.id}
                `;
                return { allowed: true };
            }

            return { allowed: false };
        });

        const info = await getRateLimitInfo(userId, action);
        return { 
            allowed: info.remaining >= 0, // already incremented if it was allowed
            info 
        };

    } catch (error) {
        console.error('Error checking rate limit:', error);
        return { allowed: true }; // fail open
    }
}

/**
 * Gets rate limit information without incrementing counter
 */
export async function getRateLimitInfo(
    userId: string,
    action: RateLimitAction
): Promise<RateLimitInfo> {
    const config = RATE_LIMITS[action];
    const windowStart = new Date(Date.now() - config.windowHours * 60 * 60 * 1000);

    try {
        const records = await sql`
            SELECT * FROM rate_limits 
            WHERE user_id = ${userId} AND action = ${action}
        `;

        if (records.length === 0) {
            return {
                remaining: config.limit,
                limit: config.limit,
                reset_at: new Date(Date.now() + config.windowHours * 60 * 60 * 1000).toISOString(),
            };
        }

        const record = records[0];
        const isOutsideWindow = new Date(record.window_start) < windowStart;

        if (isOutsideWindow) {
            return {
                remaining: config.limit,
                limit: config.limit,
                reset_at: new Date(Date.now() + config.windowHours * 60 * 60 * 1000).toISOString(),
            };
        }

        const remaining = Math.max(0, config.limit - record.count);
        const resetAt = new Date(new Date(record.window_start).getTime() + config.windowHours * 60 * 60 * 1000);

        return {
            remaining,
            limit: config.limit,
            reset_at: resetAt.toISOString(),
            used: record.count
        };
    } catch (error) {
        return {
            remaining: config.limit,
            limit: config.limit,
            reset_at: new Date(Date.now() + config.windowHours * 60 * 60 * 1000).toISOString(),
        };
    }
}

/**
 * Formats time remaining until rate limit reset
 */
export function formatTimeUntilReset(resetAt: string): string {
    const now = new Date();
    const reset = new Date(resetAt);
    const diff = reset.getTime() - now.getTime();

    if (diff <= 0) return 'Şimdi';

    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
        return `${hours} saat ${minutes} dakika`;
    }
    return `${minutes} dakika`;
}

/**
 * Gets user-friendly action name
 */
export function getActionName(action: RateLimitAction): string {
    const names: Record<RateLimitAction, string> = {
        create_job: 'İlan oluşturma',
        send_application: 'Başvuru gönderme',
        send_message: 'Mesaj gönderme',
        newsletter_signup: 'Bülten kaydı'
    };
    return names[action];
}
