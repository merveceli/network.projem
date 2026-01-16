import { supabase } from './supabase';

export type RateLimitAction = 'create_job' | 'send_application' | 'send_message';

export interface RateLimitConfig {
    limit: number;
    windowHours: number;
}

// Rate limit configurations
export const RATE_LIMITS: Record<RateLimitAction, RateLimitConfig> = {
    create_job: { limit: 5, windowHours: 24 },
    send_application: { limit: 20, windowHours: 24 },
    send_message: { limit: 100, windowHours: 24 },
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

    const { data, error } = await supabase.rpc('check_rate_limit', {
        p_user_id: userId,
        p_action: action,
        p_limit: config.limit,
        p_window_hours: config.windowHours,
    });

    if (error) {
        console.error('Error checking rate limit:', error);
        // On error, allow the action (fail open)
        return { allowed: true };
    }

    // Get current status
    const info = await getRateLimitInfo(userId, action);

    return {
        allowed: data === true,
        info,
    };
}

/**
 * Gets rate limit information without incrementing counter
 */
export async function getRateLimitInfo(
    userId: string,
    action: RateLimitAction
): Promise<RateLimitInfo> {
    const config = RATE_LIMITS[action];

    const { data, error } = await supabase.rpc('get_rate_limit_remaining', {
        p_user_id: userId,
        p_action: action,
        p_limit: config.limit,
        p_window_hours: config.windowHours,
    });

    if (error || !data) {
        console.error('Error getting rate limit info:', error);
        // Return default values on error
        return {
            remaining: config.limit,
            limit: config.limit,
            reset_at: new Date(Date.now() + config.windowHours * 60 * 60 * 1000).toISOString(),
        };
    }

    return data;
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
    };
    return names[action];
}
