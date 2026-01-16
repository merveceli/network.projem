'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Info, CheckCircle2, Loader2, Flag } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';

interface ReportModalProps {
    isOpen: boolean;
    onClose: () => void;
    targetType: 'job' | 'profile';
    targetId: string;
    targetTitle: string;
}

const REASONS = [
    { id: 'scam', label: 'Sahte / Dolandırıcı İçerik', icon: '💸' },
    { id: 'inappropriate', label: 'Uygunsuz / Saldırgan Dil', icon: '😶' },
    { id: 'misleading', label: 'Yanıltıcı Bilgi', icon: '❓' },
    { id: 'spam', label: 'Spam / Gereksiz Tekrar', icon: '📧' },
    { id: 'other', label: 'Diğer...', icon: '📁' },
];

export default function ReportModal({ isOpen, onClose, targetType, targetId, targetTitle }: ReportModalProps) {
    const supabase = createClient();
    const [step, setStep] = useState<'selecting' | 'details' | 'success'>('selecting');
    const [reason, setReason] = useState('');
    const [details, setDetails] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Oturum açmanız gerekiyor.');

            const { error } = await supabase.from('reports').insert({
                reporter_id: user.id,
                target_type: targetType,
                target_id: targetId,
                reason: reason,
                details: details,
            });

            if (error) throw error;
            setStep('success');
        } catch (error: any) {
            alert(error.message || 'Bir hata oluştu.');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-lg bg-white dark:bg-zinc-900 rounded-[32px] shadow-2xl overflow-hidden border border-gray-100 dark:border-zinc-800"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-gray-50 dark:border-zinc-800 flex justify-between items-center bg-gray-50/50 dark:bg-zinc-800/50">
                        <div className="flex items-center gap-3">
                            <div className="bg-red-100 dark:bg-red-500/20 p-2 rounded-xl">
                                <Flag className="w-5 h-5 text-red-600 dark:text-red-400" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white">Şikayet Bildir</h3>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-gray-200 dark:hover:bg-zinc-700 rounded-full transition-colors text-gray-400">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="p-8">
                        {step === 'selecting' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                                <p className="text-sm text-gray-500 mb-6">
                                    <span className="font-bold text-gray-700 dark:text-gray-300">"{targetTitle}"</span> için şikayet nedeninizi seçin:
                                </p>
                                <div className="grid gap-3">
                                    {REASONS.map((r) => (
                                        <button
                                            key={r.id}
                                            onClick={() => { setReason(r.label); setStep('details'); }}
                                            className="w-full text-left p-4 rounded-2xl border-2 border-gray-100 dark:border-zinc-800 hover:border-red-500/50 hover:bg-red-50 dark:hover:bg-red-500/5 transition-all flex items-center gap-4 group"
                                        >
                                            <span className="text-2xl group-hover:scale-125 transition-transform">{r.icon}</span>
                                            <span className="font-bold text-gray-700 dark:text-gray-300">{r.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {step === 'details' && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                                <div className="mb-6 flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-500/10 rounded-2xl border border-blue-100 dark:border-blue-500/20 text-blue-700 dark:text-blue-400">
                                    <Info className="w-5 h-5 shrink-0" />
                                    <p className="text-sm font-medium">Bize biraz daha detay verirseniz süreci hızlandırabiliriz.</p>
                                </div>

                                <textarea
                                    value={details}
                                    onChange={(e) => setDetails(e.target.value)}
                                    placeholder="Neler olduğunu buraya yazabilirsiniz..."
                                    className="w-full h-40 bg-gray-50 dark:bg-zinc-800 border-2 border-transparent focus:border-red-500 dark:focus:border-red-500 rounded-2xl p-5 outline-none text-gray-700 dark:text-white transition-all resize-none"
                                />

                                <div className="mt-8 flex gap-3">
                                    <button
                                        onClick={() => setStep('selecting')}
                                        className="flex-1 py-4 px-6 border border-gray-200 dark:border-zinc-800 rounded-2xl font-bold text-gray-500 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all"
                                    >
                                        Geri
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={loading}
                                        className="flex-[2] py-4 px-6 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-bold transition-all shadow-lg shadow-red-500/20 flex items-center justify-center gap-2"
                                    >
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Bildirimi Gönder'}
                                    </button>
                                </div>
                            </motion.div>
                        )}

                        {step === 'success' && (
                            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="text-center py-12">
                                <div className="w-24 h-24 bg-green-100 dark:bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle2 className="w-12 h-12 text-green-600 dark:text-green-400" />
                                </div>
                                <h4 className="text-2xl font-black text-gray-900 dark:text-white mb-3">Bildiriminiz Alındı!</h4>
                                <p className="text-gray-500 max-w-xs mx-auto mb-8 font-medium">
                                    Hassasiyetiniz için teşekkürler. Ekibimiz bu içeriği en kısa sürede inceleyecektir.
                                </p>
                                <button
                                    onClick={onClose}
                                    className="w-full py-4 bg-gray-900 dark:bg-white dark:text-gray-900 text-white rounded-2xl font-black hover:scale-105 transition-transform"
                                >
                                    Kapat
                                </button>
                            </motion.div>
                        )}
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
