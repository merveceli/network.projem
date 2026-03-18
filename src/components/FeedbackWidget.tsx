'use client';

import { useState } from 'react';
import { MessageSquarePlus, X, Send, Star } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';
import { submitFeedback } from '@/app/actions/feedback-actions';

export default function FeedbackWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [rating, setRating] = useState(0);
    const [sending, setSending] = useState(false);
    const pathname = usePathname();
    const { success, error: toastError } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        setSending(true);
        const { success: ok, error } = await submitFeedback({
            message: message.trim(),
            rating: rating > 0 ? rating : null,
            pageUrl: pathname
        });

        setSending(false);

        if (!ok) {
            toastError(error || 'Geri bildirim gönderilemedi.');
        } else {
            success('Geri bildiriminiz için teşekkürler!');
            setIsOpen(false);
            setMessage('');
            setRating(0);
        }
    };

    return (
        <div className="fixed bottom-6 left-6 z-40 print:hidden">
            {isOpen ? (
                <div className="bg-white dark:bg-zinc-900 rounded-[32px] shadow-2xl border border-gray-100 dark:border-zinc-800 w-80 overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
                    <div className="bg-slate-900 dark:bg-zinc-800 p-5 flex items-center justify-between">
                        <h3 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2">
                            <MessageSquarePlus className="w-4 h-4 text-yellow-400" />
                            Geri Bildirim
                        </h3>
                        <button onClick={() => setIsOpen(false)} className="p-1 hover:bg-white/10 rounded-full transition-colors text-slate-400">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6">
                        <p className="text-[10px] font-bold text-gray-500 mb-4 uppercase tracking-wider">
                            Fikirleriniz bizim için çok değerli. Platformu birlikte geliştirelim.
                        </p>

                        <div className="flex gap-2 justify-center mb-6">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className={`transition-all hover:scale-125 ${rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200 dark:text-zinc-700'}`}
                                >
                                    <Star className="w-8 h-8" />
                                </button>
                            ))}
                        </div>

                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Görüşleriniz, önerileriniz..."
                            className="w-full text-sm font-medium bg-gray-50 dark:bg-zinc-800 border-2 border-transparent focus:border-blue-500 rounded-2xl p-4 outline-none transition-all resize-none mb-4 text-gray-800 dark:text-gray-100"
                            rows={4}
                            required
                        />

                        <button
                            type="submit"
                            disabled={sending || !message.trim()}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3.5 rounded-2xl text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20 active:scale-95"
                        >
                            {sending ? 'GÖNDERİLİYOR...' : (
                                <>
                                    <Send className="w-4 h-4" /> GÖNDER
                                </>
                            )}
                        </button>
                    </form>
                </div>
            ) : (
                <button
                    onClick={() => setIsOpen(true)}
                    className="group flex items-center gap-3 bg-white dark:bg-zinc-900 hover:bg-blue-600 hover:text-white dark:text-gray-100 px-6 py-4 rounded-full shadow-2xl border border-gray-100 dark:border-zinc-800 transition-all hover:-translate-y-2"
                >
                    <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-500/20 flex items-center justify-center text-yellow-600 dark:text-yellow-400 group-hover:bg-white/20 group-hover:text-white transition-all">
                        <MessageSquarePlus className="w-6 h-6" />
                    </div>
                    <span className="font-black text-[10px] uppercase tracking-widest hidden md:block">Geri Bildirim</span>
                </button>
            )}
        </div>
    );
}
