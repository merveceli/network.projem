"use client";
import { AlertTriangle, Clock } from 'lucide-react';
import { formatTimeUntilReset, getActionName } from '@/lib/rateLimit';
import type { RateLimitAction } from '@/lib/rateLimit';

interface RateLimitWarningProps {
    action: RateLimitAction;
    resetAt: string;
    remaining: number;
    limit: number;
}

export default function RateLimitWarning({
    action,
    resetAt,
    remaining,
    limit,
}: RateLimitWarningProps) {
    const isExceeded = remaining === 0;
    const timeUntilReset = formatTimeUntilReset(resetAt);

    if (!isExceeded && remaining > limit * 0.2) {
        // Don't show warning if more than 20% remaining
        return null;
    }

    return (
        <div
            className={`rounded-xl p-4 border ${isExceeded
                    ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                    : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
                }`}
        >
            <div className="flex items-start gap-3">
                <AlertTriangle
                    className={`w-5 h-5 flex-shrink-0 ${isExceeded
                            ? 'text-red-600 dark:text-red-500'
                            : 'text-yellow-600 dark:text-yellow-500'
                        }`}
                />
                <div className="flex-1">
                    <h4
                        className={`font-bold text-sm mb-1 ${isExceeded
                                ? 'text-red-900 dark:text-red-200'
                                : 'text-yellow-900 dark:text-yellow-200'
                            }`}
                    >
                        {isExceeded ? 'Limit Aşıldı' : 'Limite Yaklaşıyorsunuz'}
                    </h4>
                    <p
                        className={`text-sm ${isExceeded
                                ? 'text-red-700 dark:text-red-300'
                                : 'text-yellow-700 dark:text-yellow-300'
                            }`}
                    >
                        {isExceeded
                            ? `${getActionName(action)} limitiniz doldu. `
                            : `${getActionName(action)} için ${remaining} hakkınız kaldı. `}
                        Limit <strong>{timeUntilReset}</strong> sonra sıfırlanacak.
                    </p>
                    <div className="mt-2 flex items-center gap-2 text-xs">
                        <Clock className="w-4 h-4" />
                        <span
                            className={
                                isExceeded
                                    ? 'text-red-600 dark:text-red-400'
                                    : 'text-yellow-600 dark:text-yellow-400'
                            }
                        >
                            Kullanılan: {limit - remaining} / {limit}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
