"use client";
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { AlertCircle, Mail, X } from 'lucide-react';

export default function EmailVerificationBanner() {
    const [user, setUser] = useState<any>(null);
    const [dismissed, setDismissed] = useState(false);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        async function checkUser() {
            const { data: { user } } = await supabase.auth.getUser();
            setUser(user);

            // Check if user dismissed the banner in this session
            const dismissed = sessionStorage.getItem('email_verification_dismissed');
            if (dismissed) setDismissed(true);
        }
        checkUser();
    }, []);

    const handleResendEmail = async () => {
        if (!user?.email) return;

        setSending(true);
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email: user.email,
            });

            if (error) throw error;
            alert('Doğrulama emaili gönderildi! Lütfen email kutunuzu kontrol edin.');
        } catch (error: any) {
            alert('Email gönderilemedi: ' + error.message);
        } finally {
            setSending(false);
        }
    };

    const handleDismiss = () => {
        setDismissed(true);
        sessionStorage.setItem('email_verification_dismissed', 'true');
    };

    // Don't show if user is verified, not logged in, or dismissed
    if (!user || user.email_confirmed_at || dismissed) {
        return null;
    }

    return (
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-200 dark:border-yellow-800">
            <div className="max-w-7xl mx-auto px-6 py-3">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                        <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0" />
                        <div className="flex-1">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                                <strong>Email adresinizi doğrulayın!</strong> İlan vermek ve başvuru yapmak için email doğrulaması gereklidir.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleResendEmail}
                            disabled={sending}
                            className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                        >
                            <Mail className="w-4 h-4" />
                            {sending ? 'Gönderiliyor...' : 'Email Gönder'}
                        </button>

                        <button
                            onClick={handleDismiss}
                            className="p-2 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded-lg transition-colors"
                            aria-label="Kapat"
                        >
                            <X className="w-4 h-4 text-yellow-700 dark:text-yellow-400" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
