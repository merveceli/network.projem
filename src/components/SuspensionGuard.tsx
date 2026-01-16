'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { ShieldAlert, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function SuspensionGuard({ children }: { children: React.ReactNode }) {
    const [isSuspended, setIsSuspended] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function checkStatus() {
            const client = createClient();
            const { data: { user } } = await client.auth.getUser();

            if (user) {
                const { data: profile } = await client
                    .from('profiles')
                    .select('is_suspended')
                    .eq('id', user.id)
                    .single();

                if (profile?.is_suspended) {
                    setIsSuspended(true);
                }
            }
            setLoading(false);
        }
        checkStatus();
    }, []);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/';
    };

    if (loading) return <>{children}</>; // Pürüzsüz geçiş için yüklemede içeriği göster (veya skeleton)

    if (isSuspended) {
        return (
            <div className="fixed inset-0 z-[9999] bg-[#0f172a] flex items-center justify-center p-6 text-white text-center">
                <div className="max-w-xl">
                    <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse text-red-500">
                        <ShieldAlert className="w-12 h-12" />
                    </div>
                    <h1 className="text-5xl font-black mb-6 tracking-tighter uppercase italic">Erişim Engellendi</h1>
                    <p className="text-slate-400 text-lg leading-relaxed mb-10 font-medium">
                        Sistem kurallarını ihlal ettiğiniz veya platform kalitesini olumsuz etkilediğiniz gerekçesiyle hesabınız süresiz olarak askıya alınmıştır.
                        Bir yanlışlık olduğunu düşünüyorsanız destek ekibiyle iletişime geçin.
                    </p>
                    <div className="flex flex-col gap-4 items-center">
                        <div className="p-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-full w-fit">
                            <div className="bg-[#0f172a] px-8 py-4 rounded-full font-bold text-slate-400">
                                Hata Kodu: SUSPENSION_ACTIVE_01
                            </div>
                        </div>
                        <button
                            onClick={handleLogout}
                            className="mt-6 flex items-center gap-2 text-slate-500 hover:text-white transition-colors font-bold uppercase text-xs tracking-widest"
                        >
                            <LogOut className="w-4 h-4" /> Çıkış Yap
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return <>{children}</>;
}
