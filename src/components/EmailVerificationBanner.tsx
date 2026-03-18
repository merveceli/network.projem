"use client";
import { useState, useEffect } from 'react';
import { useSession } from "next-auth/react";
import { AlertCircle, Mail, X, Loader2 } from 'lucide-react';

export default function EmailVerificationBanner() {
    const { data: session, status } = useSession();
    const [dismissed, setDismissed] = useState(false);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        // Check if user dismissed the banner in this session
        const dismissed = sessionStorage.getItem('email_verification_dismissed');
        if (dismissed) setDismissed(true);
    }, []);

    const handleResendEmail = async () => {
        if (!session?.user?.email) return;

        setSending(true);
        try {
            // Note: This would typically call a custom API route that sends the verification email via Auth.js/Nodemailer
            const res = await fetch('/api/auth/verify', { method: 'POST' });
            if (!res.ok) throw new Error('Yükleme hatası');
            
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

    // Don't show if user is verified, not logged in (still loading), or dismissed
    // In Auth.js session, emailVerified might be null or a date
    const user = session?.user as any;
    if (status !== 'authenticated' || !user || user.emailVerified || dismissed) {
        return null;
    }

    return (
        <div className="bg-[#FFF9EB] dark:bg-yellow-900/10 border-b border-yellow-100 dark:border-yellow-900/30 animate-in slide-in-from-top duration-300">
            <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="flex items-center justify-between gap-6">
                    <div className="flex items-center gap-4 flex-1">
                        <div className="bg-yellow-100 dark:bg-yellow-500/20 p-2.5 rounded-2xl">
                            <AlertCircle className="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0" />
                        </div>
                        <div className="flex-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-yellow-800 dark:text-yellow-200">
                                <strong>Email adresinizi doğrulayın!</strong> İlan vermek ve başvuru yapmak için email doğrulaması gereklidir.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <button
                            onClick={handleResendEmail}
                            disabled={sending}
                            className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-700 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 shadow-lg shadow-yellow-500/20"
                        >
                            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                            {sending ? 'GÖNDERİLİYOR...' : 'EMAİL GÖNDER'}
                        </button>

                        <button
                            onClick={handleDismiss}
                            className="p-2.5 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 rounded-full transition-colors group"
                            aria-label="Kapat"
                        >
                            <X className="w-4 h-4 text-yellow-700 dark:text-yellow-400 group-hover:rotate-90 transition-transform" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
