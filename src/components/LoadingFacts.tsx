"use client";
import { useState, useEffect } from "react";

export default function LoadingFacts() {
    const [progress, setProgress] = useState(0);
    const [factIndex, setFactIndex] = useState(0);

    const FACTS = [
        "İlk e-posta 1971 yılında Ray Tomlinson tarafından gönderildi.",
        "Google'ın ilk adı 'BackRub' idi.",
        "Dünyadaki web sitelerinin %43'ü WordPress kullanıyor.",
        "Freelance kelimesi ilk kez Ivanhoe romanında 'paralı asker' anlamında kullanıldı.",
        "Amazon'un ilk adı 'Cadabra' olacaktı.",
    ];

    useEffect(() => {
        setFactIndex(Math.floor(Math.random() * FACTS.length));

        // Progress animation
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                if (prev >= 100) return 100;
                return prev + Math.random() * 15;
            });
        }, 200);

        // Fact rotation
        const factInterval = setInterval(() => {
            setFactIndex(prev => (prev + 1) % FACTS.length);
        }, 3500);

        return () => {
            clearInterval(progressInterval);
            clearInterval(factInterval);
        };
    }, []);

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-gradient-to-br from-[#1a1a2e] via-[#16213e] to-[#0f3460] overflow-hidden">
            {/* Animated background orbs */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#E91E63]/20 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#00BFA5]/20 rounded-full blur-3xl animate-pulse delay-1000" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/5 rounded-full blur-3xl" />
            </div>

            {/* Main content */}
            <div className="relative z-10 flex flex-col items-center justify-center px-6 max-w-lg mx-auto">
                {/* Logo with animation */}
                <div className="relative mb-8">
                    {/* Glow effect */}
                    <div className="absolute inset-0 bg-[#E91E63] blur-2xl opacity-30 animate-pulse scale-150" />

                    {/* Logo text */}
                    <h1 className="relative text-5xl md:text-6xl font-[900] tracking-tighter text-white">
                        Net-Work
                        <span className="text-[#E91E63] animate-bounce inline-block">.</span>
                    </h1>
                </div>

                {/* Spinner */}
                <div className="relative w-20 h-20 mb-8">
                    {/* Outer ring */}
                    <div className="absolute inset-0 border-4 border-white/10 rounded-full" />
                    {/* Spinning ring */}
                    <div className="absolute inset-0 border-4 border-transparent border-t-[#E91E63] border-r-[#00BFA5] rounded-full animate-spin" />
                    {/* Inner glow */}
                    <div className="absolute inset-3 bg-gradient-to-br from-[#E91E63]/20 to-[#00BFA5]/20 rounded-full backdrop-blur-sm" />
                    {/* Center icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <svg className="w-8 h-8 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                </div>

                {/* Progress bar */}
                <div className="w-full max-w-xs mb-8">
                    <div className="h-1.5 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm">
                        <div
                            className="h-full bg-gradient-to-r from-[#E91E63] to-[#00BFA5] rounded-full transition-all duration-300 ease-out"
                            style={{ width: `${Math.min(progress, 100)}%` }}
                        />
                    </div>
                    <p className="text-center text-white/40 text-xs mt-2 font-medium">
                        Yükleniyor...
                    </p>
                </div>

                {/* Fact card with glassmorphism */}
                <div className="relative group">
                    {/* Card glow */}
                    <div className="absolute -inset-1 bg-gradient-to-r from-[#E91E63]/30 to-[#00BFA5]/30 rounded-2xl blur opacity-50 group-hover:opacity-75 transition duration-500" />

                    {/* Card */}
                    <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl p-6 max-w-sm">
                        <div className="flex items-start gap-3">
                            <span className="text-2xl flex-shrink-0">💡</span>
                            <p className="text-white/80 text-sm leading-relaxed font-medium animate-fadeIn">
                                {FACTS[factIndex]}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Subtitle */}
                <p className="mt-8 text-white/30 text-xs font-medium tracking-widest uppercase">
                    Türkiye'nin Freelancer Ağı
                </p>
            </div>

            {/* CSS for fadeIn animation */}
            <style jsx>{`
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .animate-fadeIn {
                    animation: fadeIn 0.5s ease-out;
                }
            `}</style>
        </div>
    );
}
