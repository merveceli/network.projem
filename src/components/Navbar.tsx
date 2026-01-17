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
            <nav className={`fixed top-0 w-full flex justify-between items-center px-6 md:px-[8%] transition-all duration-300 z-50 ${isSolid ? 'h-[75px] bg-white/95 backdrop-blur-md border-b border-[#E9ECEF] shadow-sm' : 'h-[95px] bg-white/10 backdrop-blur-md border-transparent'}`}>
                <Link href="/" className="text-[24px] md:text-[26px] font-[950] tracking-[-1.5px] text-[#1a1a2e] no-underline relative z-50">
                    Net-Work<span className="text-[#FF6B35]">.</span>
                </Link>

                {/* Desktop Menu */}
                <div className="hidden md:flex gap-[35px] items-center">
                    <Link href="/yeni-ilan" className="bg-[#FF6B35] text-white border-none py-2.5 px-6 rounded-2xl font-[800] hover:scale-105 transition-transform no-underline text-sm shadow-[0_10px_20px_rgba(255,107,53,0.3)]">İlan Ver</Link>
                    <Link href="/ilanlar" className={`no-underline font-bold text-sm ${pathname === '/ilanlar' ? 'text-[#FF6B35]' : 'text-[#1a1a2e]'}`}>İş İlanları</Link>
                    <Link href="/yetenekler" className={`no-underline font-bold text-sm ${pathname === '/yetenekler' ? 'text-[#FF6B35]' : 'text-[#1a1a2e]'}`}>Yetenekler</Link>
                    {user ? (
                        <>
                            <Link href="/basvurular" className={`font-bold text-sm no-underline hover:text-[#FF6B35] transition-colors ${pathname === '/basvurular' ? 'text-[#FF6B35]' : 'text-[#1a1a2e]'}`}>Başvurular</Link>
                            <Link href="/mesajlar" className={`font-bold text-sm no-underline hover:text-[#FF6B35] transition-colors ${pathname === '/mesajlar' ? 'text-[#FF6B35]' : 'text-[#1a1a2e]'}`}>Mesajlar</Link>
                            <NotificationBell />
                            <Link href="/profil" className={`font-[800] no-underline ${pathname?.startsWith('/profil') ? 'text-[#FF6B35]' : 'text-[#4A90A4]'}`}>Profilim</Link>
                        </>
                    ) : (
                        <Link href="/login" className="bg-[#1a1a2e] text-white border-none py-3 px-6 rounded-2xl font-[800] cursor-pointer hover:bg-black transition-colors no-underline">Giriş Yap</Link>
                    )}
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
                            <Link href="/yeni-ilan" className="bg-[#FF6B35] text-white py-3 px-6 rounded-xl font-[800] text-lg hover:scale-105 transition-transform mx-4 shadow-lg">İlan Ver</Link>
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
