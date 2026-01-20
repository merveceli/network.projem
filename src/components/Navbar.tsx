"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { User } from "@supabase/supabase-js";
import NotificationBell from "./NotificationBell";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

interface NavbarProps {
    transparent?: boolean;
}

export default function Navbar({ transparent = false }: NavbarProps) {
    const [user, setUser] = useState<User | null>(null);
    const [scrolled, setScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setUser(session?.user ?? null);
        };
        init();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user ?? null);
        });

        const handleScroll = () => {
            if (transparent) {
                setScrolled(window.scrollY > 20);
            }
        };

        if (transparent) {
            window.addEventListener("scroll", handleScroll);
        } else {
            setScrolled(true);
        }

        return () => {
            window.removeEventListener("scroll", handleScroll);
            subscription.unsubscribe();
        };
    }, [transparent]);

    // Close menu on route change
    useEffect(() => {
        setIsMenuOpen(false);
    }, [pathname]);

    const isSolid = !transparent || scrolled || isMenuOpen; // Ensure solid background when menu is open

    return (
        <>
            <nav className={`fixed top-0 w-full flex justify-between items-center px-6 md:px-[8%] transition-all duration-300 z-50 ${isSolid ? 'h-[75px] bg-white border-b border-slate-100 shadow-sm' : 'h-[95px] bg-white/50 backdrop-blur-md border-transparent'}`}>
                <Link href="/" className="text-[24px] font-[900] tracking-tighter text-[#1e293b] no-underline relative z-50">
                    Net-Work<span className="text-[#89A8B2]">.</span>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex items-center gap-10">
                    <Link href="/ilanlar" className={`no-underline font-semibold text-sm tracking-tight ${pathname === '/ilanlar' ? 'text-[#89A8B2]' : 'text-[#334155] hover:text-[#89A8B2]'}`}>İş İlanları</Link>
                    <Link href="/yetenekler" className={`no-underline font-semibold text-sm tracking-tight ${pathname === '/yetenekler' ? 'text-[#89A8B2]' : 'text-[#334155] hover:text-[#89A8B2]'}`}>Yetenekler</Link>
                    {user ? (
                        <>
                            <Link href="/basvurular" className={`font-semibold text-sm no-underline hover:text-[#89A8B2] transition-colors ${pathname === '/basvurular' ? 'text-[#89A8B2]' : 'text-[#334155]'}`}>Başvurular</Link>
                            <Link href="/mesajlar" className={`font-semibold text-sm no-underline hover:text-[#89A8B2] transition-colors ${pathname === '/mesajlar' ? 'text-[#89A8B2]' : 'text-[#334155]'}`}>Mesajlar</Link>
                            <NotificationBell />
                            <Link href="/profil" className={`font-bold text-sm no-underline ${pathname?.startsWith('/profil') ? 'text-[#89A8B2]' : 'text-[#1e293b] hover:text-[#89A8B2]'}`}>Profilim</Link>
                        </>
                    ) : (
                        <Link href="/login" className="bg-[#1e293b] text-white border-none py-2.5 px-6 rounded-lg font-bold cursor-pointer hover:bg-black transition-colors no-underline text-sm shadow-lg shadow-slate-200">Giriş Yap</Link>
                    )}
                    <Link href="/yeni-ilan" className="bg-[#89A8B2] text-white border-none py-2.5 px-6 rounded-lg font-bold hover:scale-105 transition-transform no-underline text-sm shadow-lg shadow-[#89A8B2]/20">İlan Ver</Link>
                </div>

                {/* Mobile Menu Button */}
                <button
                    onClick={() => setIsMenuOpen(!isMenuOpen)}
                    className="md:hidden p-2 text-[#1a1a2e] z-50 rounded-lg hover:bg-gray-100/50 transition-colors"
                >
                    {isMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
                </button>
            </nav>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMenuOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ duration: 0.2 }}
                        className="fixed inset-0 z-40 bg-white pt-24 px-6 md:hidden flex flex-col gap-6 overflow-y-auto"
                    >
                        <div className="flex flex-col gap-4 text-center">
                            <Link href="/yeni-ilan" className="bg-[#89A8B2] text-white py-3 px-6 rounded-xl font-[800] text-lg hover:scale-105 transition-transform mx-4 shadow-lg">İlan Ver</Link>
                            <Link href="/ilanlar" className="text-xl font-bold py-3 border-b border-gray-100">İş İlanları</Link>
                            <Link href="/yetenekler" className="text-xl font-bold py-3 border-b border-gray-100">Yetenekler</Link>

                            {user ? (
                                <>
                                    <Link href="/basvurular" className="text-xl font-bold py-3 border-b border-gray-100">Başvurular</Link>
                                    <Link href="/mesajlar" className="text-xl font-bold py-3 border-b border-gray-100">Mesajlar</Link>
                                    <Link href="/profil" className="text-xl font-bold py-3 text-[#4A90A4]">Profilim</Link>
                                </>
                            ) : (
                                <Link href="/login" className="mt-4 bg-[#1a1a2e] text-white py-4 px-6 rounded-2xl font-[800] text-lg">Giriş Yap</Link>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
