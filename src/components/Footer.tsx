"use client";
import { Mail } from "lucide-react";
import Link from "next/link";

export default function Footer() {
    return (
        <footer className="pt-[100px] px-[8%] pb-[40px] bg-[#080810] text-white">
            <div className="grid grid-cols-[repeat(auto-fit,minmax(250px,1fr))] gap-[60px] border-b border-white/10 pb-[60px] mb-[40px]">
                <div>
                    <h3 className="text-[26px] font-[950] mb-[20px]">Net-Work<span className="text-[#FF6B35]">.</span></h3>
                    <p className="opacity-50 leading-[1.8] text-[14px]">Türkiye'nin kar amacı gütmeyen en büyük freelancer ve işveren topluluğu. Güvenilir, şeffaf ve ücretsiz.</p>
                </div>
                <div>
                    <h4 className="mb-[25px] font-[900]">Hızlı Menü</h4>
                    <div className="flex flex-col gap-[15px] opacity-60 text-[14px]">
                        <Link href="/ilanlar" className="cursor-pointer hover:text-[#FF6B35] transition-colors">İş İlanları</Link>
                        <Link href="/yetenekler" className="cursor-pointer hover:text-[#FF6B35] transition-colors">Yetenekler</Link>
                    </div>
                </div>
                <div>
                    <h4 className="mb-[25px] font-[900]">Neden Ücretsiz?</h4>
                    <p className="opacity-60 text-[14px] leading-relaxed mb-4">
                        Komisyon yok, kesinti yok. Amacımız sadece yetenekleri ve işverenleri şeffaf bir ortamda buluşturmak.
                        Emeğinize saygı duyuyoruz.
                    </p>
                    <h4 className="mb-[15px] font-[900] text-[15px]">İletişim</h4>
                    <p className="text-[14px] font-bold text-[#4A90A4]">destek@net-work.com.tr</p>
                </div>

                {/* GELİŞTİRİCİ HAKKINDA (Mini Alan) */}
                <div>
                    <h4 className="mb-[25px] font-[900]">Geliştirici</h4>
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#FF6B35] rounded-full flex items-center justify-center font-bold">M</div>
                        <div>
                            <p className="text-[14px] font-bold">Merve Çelik</p>
                            <p className="text-[12px] opacity-50">Full Stack Developer</p>
                        </div>
                    </div>
                    <p className="mt-3 text-[12px] opacity-40 leading-relaxed mb-3">
                        İstanbul Üniversitesi Bilgisayar Programcılığı son sınıf öğrencisi. <br />
                        20 yaşında, İstanbul'da yaşayan Freelance Yazılımcı & Grafik Tasarımcı.
                    </p>
                    <a href="https://www.linkedin.com/in/merve-celik/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 bg-[#0077b5] text-white px-3 py-1.5 rounded-md text-[12px] font-bold hover:opacity-90 transition-opacity no-underline">
                        <span>LinkedIn</span>
                    </a>
                </div>

            </div>
            <div className="text-center opacity-30 text-[12px] font-[700] tracking-[1px] flex items-center justify-center gap-2">
                © 2026 NET-WORK. KAR AMACI GÜTMEZ
            </div>
        </footer>
    );
}
