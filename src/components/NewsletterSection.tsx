'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import Link from 'next/link';

export default function NewsletterSection() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setStatus('loading');

        try {
            const { error } = await supabase
                .from('newsletter_subscriptions')
                .insert([{ email }]);

            if (error) {
                if (error.code === '23505') { // Unique constraint violation
                    throw new Error('Bu e-posta adresi zaten kayıtlı.');
                }
                throw error;
            }

            setStatus('success');
            setMessage('Aramıza hoş geldin! 🎉');
            setEmail('');

            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#3b82f6', '#2dd4bf', '#6366f1']
            });

        } catch (err: any) {
            setStatus('error');
            setMessage(err.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
        }
    };

    return (
        <section className="relative py-32 px-6 bg-white dark:bg-[#080810] border-t border-gray-100 dark:border-white/5">
            <div className="max-w-4xl mx-auto text-center">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <h2 className="text-[clamp(32px,5vw,52px)] font-black text-[#1a1a2e] dark:text-white mb-6 tracking-tight leading-tight">
                        Dijital Dünyadan <span className="text-[#4A90A4]">Habersiz Kalma</span>
                    </h2>

                    <p className="text-xl text-gray-500 dark:text-zinc-400 mb-12 max-w-2xl mx-auto leading-relaxed">
                        En yeni iş ilanları ve sektör analizleri her hafta e-posta kutuna gelsin.
                    </p>

                    <form onSubmit={handleSubscribe} className="max-w-xl mx-auto">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1 group">
                                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#4A90A4] transition-colors" />
                                <input
                                    type="email"
                                    placeholder="E-posta adresini buraya yaz..."
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent focus:border-[#4A90A4] rounded-2xl py-5 px-6 pl-14 outline-none text-lg transition-all dark:text-white placeholder:text-gray-400"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="bg-[#1a1a2e] dark:bg-[#4A90A4] text-white px-10 py-5 rounded-2xl font-bold text-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2 shadow-xl shadow-black/10 dark:shadow-[#4A90A4]/20"
                            >
                                {status === 'loading' ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <span>Ücretsiz Katıl</span>
                                        <Send className="w-4 h-4" />
                                    </>
                                )}
                            </button>
                        </div>

                        <AnimatePresence mode="wait">
                            {status === 'success' && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="mt-8 p-4 bg-green-50 dark:bg-green-500/10 border border-green-100 dark:border-green-500/20 rounded-2xl flex items-center justify-center gap-3 text-green-700 dark:text-green-400 font-bold"
                                >
                                    <CheckCircle2 className="w-5 h-5 shrink-0" />
                                    <span>{message}</span>
                                </motion.div>
                            )}

                            {status === 'error' && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mt-8 p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 rounded-2xl flex items-center justify-center gap-3 text-red-700 dark:text-red-400 font-bold"
                                >
                                    <AlertCircle className="w-5 h-5 shrink-0" />
                                    <span>{message}</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </form>

                    <div className="mt-10 text-[13px] text-gray-400">
                        Kaydolarak <Link href="/gizlilik" className="text-[#4A90A4] hover:underline">Gizlilik Politikamızı</Link> kabul etmiş olursun.
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
