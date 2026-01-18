'use client';

import { useState } from 'react';
import { MessageSquarePlus, X, Send, Star } from 'lucide-react';
import { createClient } from '@/utils/supabase/client';
import { usePathname } from 'next/navigation';
import { useToast } from '@/contexts/ToastContext';

export default function FeedbackWidget() {
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState('');
    const [rating, setRating] = useState(0);
    const [sending, setSending] = useState(false);
    const supabase = createClient();
    const pathname = usePathname();
    const { success, error: toastError } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!message.trim()) return;

        setSending(true);
        const { data: { user } } = await supabase.auth.getUser();

        const { error } = await supabase.from('user_feedback').insert({
            user_id: user?.id,
            message: message.trim(),
            rating: rating > 0 ? rating : null,
            page_url: pathname
        });

        setSending(false);

        if (error) {
            toastError('Geri bildirim gönderilemedi.');
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
                <div className="bg-white rounded-2xl shadow-2xl border border-gray-100 w-80 overflow-hidden animate-in slide-in-from-bottom-5 duration-200">
                    <div className="bg-slate-900 p-4 flex items-center justify-between">
                        <h3 className="text-white font-bold text-sm flex items-center gap-2">
                            <MessageSquarePlus className="w-4 h-4 text-yellow-400" />
                            Geri Bildirim
                        </h3>
                        <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white transition-colors">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-4">
                        <p className="text-xs text-gray-500 mb-3">
                            Platformu geliştirmemize yardımcı olun. Fikirleriniz bizim için değerli.
                        </p>

                        <div className="flex gap-2 justify-center mb-4">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className={`transition-all hover:scale-110 ${rating >= star ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
                                >
                                    <Star className="w-6 h-6" />
                                </button>
                            ))}
                        </div>

                        <textarea
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            placeholder="Görüşleriniz..."
                            className="w-full text-sm bg-gray-50 border border-gray-200 rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none mb-3"
                            rows={3}
                            required
                        />

                        <button
                            type="submit"
                            disabled={sending || !message.trim()}
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {sending ? 'Gönderiliyor...' : (
                                <>
                                    <Send className="w-4 h-4" /> Gönder
                                </>
                            )}
                        </button>
                    </form>
                </div>
            ) : (
                <button
                    onClick={() => setIsOpen(true)}
                    className="group flex items-center gap-2 bg-white hover:bg-gray-50 text-gray-700 px-4 py-3 rounded-full shadow-lg border border-gray-100 transition-all hover:-translate-y-1 hover:shadow-xl"
                >
                    <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-600 group-hover:scale-110 transition-transform">
                        <MessageSquarePlus className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-sm hidden md:block">Geri Bildirim</span>
                </button>
            )}
        </div>
    );
}
