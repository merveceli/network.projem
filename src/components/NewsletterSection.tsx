'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Send, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import Link from 'next/link';
import { submitNewsletterSubscription } from '@/app/actions/newsletter-actions';

export default function NewsletterSection() {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');

    const handleSubscribe = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;

        setStatus('loading');

        try {
            const { success, error } = await submitNewsletterSubscription(email);

            if (!success) {
                throw new Error(error || 'Bir hata oluştu.');
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
                    <h2 className="text-[clamp(32px,5vw,52px)] font-black text-[#1a1a2e] dark:text-white mb-6 tracking-tight leading-tight uppercase italic">
                        Dijital Dünyadan <span className="text-blue-600">Habersiz Kalma</span>
                    </h2>

                    <p className="text-xl text-gray-400 dark:text-zinc-500 mb-12 max-w-2xl mx-auto leading-relaxed font-medium">
                        En yeni iş ilanları ve sektör analizleri her hafta e-posta kutuna gelsin.
                    </p>

                    <form onSubmit={handleSubscribe} className="max-w-xl mx-auto">
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="relative flex-1 group">
                                <Mail className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-600 transition-colors" />
                                <input
                                    type="email"
                                    placeholder="E-posta adresini buraya yaz..."
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full bg-gray-50 dark:bg-white/5 border-2 border-transparent focus:border-blue-600 rounded-2xl py-5 px-6 pl-14 outline-none text-lg font-bold transition-all dark:text-white placeholder:text-gray-400"
                                    required
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={status === 'loading'}
                                className="bg-slate-900 dark:bg-blue-600 text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all hover:scale-105 hover:bg-black active:scale-95 disabled:opacity-70 flex items-center justify-center gap-2 shadow-2xl shadow-blue-500/20"
                            >
                                {status === 'loading' ? (
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <span>ÜCRETSİZ KATIL</span>
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

                    <div className="mt-10 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        Kaydolarak <Link href="/gizlilik" className="text-blue-600 hover:underline">Gizlilik Politikamızı</Link> kabul etmiş olursun.
                    </div>
                </motion.div>
            </div>
        </section>
    );
}
