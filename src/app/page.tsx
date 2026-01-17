"use client";
import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";
import { User } from "@supabase/supabase-js";
import NotificationBell from "@/components/NotificationBell";
import LoadingFacts from "@/components/LoadingFacts";
import Navbar from "@/components/Navbar";
import {
  ShieldCheck,
  FileEdit,
  Handshake,
  Rocket,
  Star,
  Lock,
  ChevronRight,
  TrendingUp,
  Target,
  Zap
} from "lucide-react";

import { useRouter } from "next/navigation";
import NewsletterSection from "@/components/NewsletterSection";

// --- VERİ TİPLERİ ---
interface Profile { full_name: string | null; role: string | null; }
interface Job { id: string; title: string | null; description: string | null; category: string | null; creator_id: string; is_filled: boolean; urgency?: string; images?: string[]; profiles: Profile | null; }

export default function HomePage() {
  const router = useRouter();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = () => {
    if (searchTerm.trim()) {
      router.push(`/ilanlar?q=${encodeURIComponent(searchTerm.trim())}`);
    } else {
      router.push('/ilanlar');
    }
  };

  const [counts, setCounts] = useState({ freelancers: 0, jobs: 0, projects: 0 });
  const hasCounted = useRef(false);

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);

        if (session?.user) {
          const { data } = await supabase.from("jobs").select(`id, title, description, category, creator_id, is_filled, urgency, images, profiles:creator_id(full_name, role)`).eq('status', 'approved').order("created_at", { ascending: false });
          if (data) setJobs(data as unknown as Job[]);
        } else {
          setJobs([]); // Clear jobs if not logged in
        }
      } finally {
        setLoading(false);
      }
    };
    init();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        init(); // Re-fetch data when session is confirmed
      } else {
        setJobs([]);
      }
    });

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("opacity-100", "translate-y-0");
          entry.target.classList.remove("opacity-0", "translate-y-12");
          if (entry.target.id === "stats-section" && !hasCounted.current) {
            hasCounted.current = true;
            startCounting();
          }
        }
      });
    }, { threshold: 0.1 });

    const timer = setTimeout(() => {
      document.querySelectorAll(".reveal").forEach(el => observer.observe(el));
    }, 600);

    return () => {
      clearTimeout(timer);
      subscription.unsubscribe();
    };
  }, [loading]);

  const startCounting = () => {
    const targets = { freelancers: 1250, jobs: 450, projects: 890 };
    let step = 0;
    const interval = setInterval(() => {
      step++;
      setCounts({
        freelancers: Math.floor((targets.freelancers / 60) * step),
        jobs: Math.floor((targets.jobs / 60) * step),
        projects: Math.floor((targets.projects / 60) * step),
      });
      if (step >= 60) clearInterval(interval);
    }, 30);
  };

  if (loading) return <LoadingFacts />;

  return (
    <div className="bg-white text-[#1a1a2e] overflow-x-hidden font-sans">
      <Navbar transparent={true} />


      {/* HERO SECTION */}
      <section className="h-[90vh] relative flex items-center justify-center text-center overflow-hidden">
        {/* Optimized Background Image */}
        <Image
          src="https://images.pexels.com/photos/3183150/pexels-photo-3183150.jpeg?auto=compress&cs=tinysrgb&w=1920"
          alt="Network Hero Background"
          fill
          priority
          className="object-cover brightness-[0.8]"
          quality={90}
        />

        <div className="relative z-10 w-[92%] max-w-[950px] bg-white/45 backdrop-blur-[12px] border border-white/30 rounded-[50px] py-16 px-10 shadow-2xl">
          <h1 className="text-[clamp(32px,7vw,72px)] font-[900] tracking-[-3px] mb-5 text-[#1a1a2e] leading-[1.1]">
            Kariyerine <span className="text-[#FF6B35]">Yön Ver</span>
          </h1>
          <p className="text-xl text-gray-800 max-w-[680px] mx-auto mb-11 leading-relaxed font-bold">
            Türkiyenin ilk ücretsiz,komisyonsuz ve doğrulanmış freelancer ağı. <br />
            <span className="opacity-80">Komisyon yok. Ücret yok. Oyun yok.</span>
          </p>
          <div className="bg-white border border-black/5 p-2.5 rounded-[30px] flex flex-col md:flex-row w-full max-w-[650px] mx-auto shadow-xl gap-3 md:gap-0">
            <input
              type="text"
              placeholder="Hangi yeteneği arıyorsun? (Yazılımcı, Editör...)"
              className="flex-1 border-none bg-transparent py-3 px-4 md:py-4 md:px-6 outline-none text-[15px] md:text-[17px] text-gray-800 placeholder:text-gray-400 w-full text-center md:text-left"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <button
              onClick={handleSearch}
              className="bg-[#1a1a2e] text-white border-none py-3 md:py-0 px-10 rounded-[25px] font-[800] cursor-pointer hover:scale-105 transition-transform w-full md:w-auto"
            >
              Ara
            </button>
          </div>
        </div>
      </section>

      {/* İSTATİSTİKLER */}
      <section id="stats-section" className="reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out py-24 px-[8%] flex flex-wrap gap-10 justify-around bg-[#F8F9FA] text-center">
        <div><h2 className="text-[52px] text-[#FF6B35] font-[900]">{counts.freelancers}+</h2><p className="font-bold opacity-60">Yetenekli Freelancer</p></div>
        <div><h2 className="text-[52px] text-[#4A90A4] font-[900]">{counts.jobs}+</h2><p className="font-bold opacity-60">Aktif İlan</p></div>
        <div><h2 className="text-[52px] text-[#1a1a2e] font-[900]">{counts.projects}+</h2><p className="font-bold opacity-60">Başarılı Proje</p></div>
      </section>

      {/* NASIL ÇALIŞIR */}
      <section className="reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out py-[120px] px-[8%] text-center bg-white">
        <h2 className="text-[40px] font-[950] mb-[60px]">4 Adımda Başla</h2>
        <div className="flex gap-[30px] flex-wrap justify-center">
          {[
            { i: <ShieldCheck className="w-12 h-12 text-[#4A90A4]" />, t: "LinkedIn ile Giriş", d: "Güvenli ve hızlı profil doğrulama." },
            { i: <FileEdit className="w-12 h-12 text-[#FF6B35]" />, t: "Profilini Oluştur", d: "Yeteneklerini ve portfolyoni sergile." },
            { i: <Handshake className="w-12 h-12 text-[#4A90A4]" />, t: "İlan Paylaş", d: "İhtiyacın olan projeyi hemen başlat." },
            { i: <Rocket className="w-12 h-12 text-[#FF6B35]" />, t: "Güvenle Çalış", d: "Doğrudan iletişimle projeni tamamla." }
          ].map((step, idx) => (
            <div key={idx} className="flex-1 min-w-[260px] p-[45px_30px] bg-[#FDFDFD] rounded-[35px] border border-[#EEEEEE] hover:-translate-y-2 transition-transform duration-300 shadow-sm hover:shadow-xl group">
              <div className="mb-[25px] flex justify-center group-hover:scale-110 transition-transform">
                {step.i}
              </div>
              <h4 className="text-[20px] font-[900] text-[#4A90A4] mb-[15px]">{idx + 1}. {step.t}</h4>
              <p className="text-slate-500 text-[15px] leading-relaxed">{step.d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* İLANLAR CAROUSEL */}
      <section className="reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out py-[100px] bg-[#F8F9FA] overflow-hidden">
        <h2 className="text-center text-[34px] font-[900] mb-[50px] flex items-center justify-center gap-3">
          Bu Hafta Öne Çıkanlar <Star className="w-8 h-8 text-yellow-500 fill-yellow-500" />
        </h2>

        {user ? (
          /* LOGGED IN VIEW */
          <div className="flex gap-[30px] w-max animate-[scroll_45s_linear_infinite] hover:pause">
            <style jsx>{`
                @keyframes scroll {
                  from { transform: translateX(0); }
                  to { transform: translateX(-50%); }
                }
              `}</style>
            {(jobs.length > 0 ? [...jobs, ...jobs, ...jobs] : []).map((job, idx) => (
              <div key={idx} className={`min-w-[380px] bg-white border border-[#E9ECEF] rounded-[35px] p-[40px] shadow-sm hover:shadow-md transition-shadow ${job.is_filled ? 'opacity-60' : ''}`}>
                <div className="flex justify-between mb-[20px]">
                  <span className="bg-[#E6F0F2] py-[6px] px-[15px] rounded-[12px] text-[11px] font-[800] text-[#4A90A4]">{job.category?.toUpperCase() || 'GENEL'}</span>
                  <div className="flex gap-2">
                    {job.is_filled ? (
                      <span className="bg-green-100 text-green-700 py-[6px] px-[12px] rounded-[12px] text-[11px] font-[900]">İŞ VERİLDİ ✓</span>
                    ) : (
                      <>
                        {job.urgency === 'urgent' && (
                          <span className="bg-red-600 text-white py-[6px] px-[12px] rounded-[12px] text-[11px] font-[900] animate-pulse">ACİL</span>
                        )}
                        <span className="text-[#FF6B35] font-[900] text-[11px]">YENİ</span>
                      </>
                    )}
                  </div>
                </div>
                <h3 className="text-[22px] font-[900] mb-[15px]">{job.title}</h3>
                <p className="text-slate-500 text-[14px] h-[65px] overflow-hidden leading-relaxed">{job.description}</p>
                <div className="mt-[25px] pt-[25px] border-t border-[#E9ECEF] flex justify-between items-center">
                  <span className="font-[800] text-[14px]">{job.profiles?.full_name || 'Network Üyesi'}</span>
                  <Link href={`/ilan/${job.id}`} className="text-[#4A90A4] no-underline font-[900] hover:underline">İncele →</Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* LOCKED VIEW */
          <div className="max-w-3xl mx-auto text-center bg-white border border-gray-200 rounded-[35px] p-12 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-400 to-red-500" />
            <div className="mb-6 flex justify-center">
              <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center">
                <Lock className="w-10 h-10 text-gray-400" />
              </div>
            </div>
            <h3 className="text-3xl font-[900] text-gray-900 mb-4">Bu Alan Sadece Üyelere Özel!</h3>
            <p className="text-lg text-gray-500 mb-8 max-w-lg mx-auto">
              En yeni iş fırsatlarını ve yetenek havuzunu görüntülemek için topluluğumuza katılın veya giriş yapın.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 bg-[#1a1a2e] text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-black transition-transform hover:scale-105"
            >
              Giriş Yap ve İlanları Gör
            </Link>
          </div>
        )}
      </section>

      {/* CTA */}
      <section className="reveal opacity-0 translate-y-12 transition-all duration-1000 ease-out py-[140px] px-[8%] text-center bg-[#1a1a2e] text-white">
        <h2 className="text-[52px] font-[950] mb-[30px] tracking-[-2px]">Ağını Bugün Büyütmeye Başla</h2>
        <Link href="/login" className="inline-block bg-[#FF6B35] text-white border-none py-[22px] px-[55px] rounded-[50px] font-[900] text-[18px] cursor-pointer shadow-[0_15px_35px_rgba(255,107,53,0.3)] transition-transform hover:scale-105 active:scale-95 no-underline">Hemen Katıl</Link>
      </section>

      {/* Newsletter Section */}
      <NewsletterSection />

      {/* FOOTER */}

    </div>
  );
}