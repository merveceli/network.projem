"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import Image from "next/image";
import { User } from "@supabase/supabase-js";
import Navbar from "@/components/Navbar";
import Chatbot from "@/components/Chatbot";
import {
  ShieldCheck,
  Users,
  Briefcase,
  CheckCircle2,
  Search,
  ArrowRight,
  TrendingUp,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";

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

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        const { data } = await supabase.from("jobs").select(`id, title, description, category, creator_id, is_filled, urgency, images, profiles:creator_id(full_name, role)`).eq('status', 'approved').order("created_at", { ascending: false }).limit(6);
        if (data) setJobs(data as unknown as Job[]);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  if (loading) return null;

  return (
    <div className="min-h-screen bg-white text-[#334155] font-sans selection:bg-[#89A8B2] selection:text-white">
      {/* Import Serif Font */}
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />

      <Navbar transparent={false} />

      {/* HERO SECTION - Elegant but Humble with Background Image */}
      <header className="relative pt-40 pb-32 px-6 md:px-12 flex items-center min-h-[85vh] overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.pexels.com/photos/3184311/pexels-photo-3184311.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2"
            alt="Professional Background"
            fill
            className="object-cover"
            priority
          />
          {/* Gradient Overlay for Readability */}
          <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 to-white/40 md:to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10 w-full">
          <div className="max-w-2xl animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <span className="w-12 h-[1px] bg-[#89A8B2]"></span>
              <span className="text-xs font-bold uppercase tracking-[0.2em] text-[#89A8B2]">
                Ücretsiz ve Doğrulanmış Freelancer Ağı
              </span>
            </div>

            <h1 className="text-5xl md:text-7xl font-playfair font-black text-[#1E293B] leading-[1.1] mb-8">
              Adil Ortam.<br />
              Kaliteli İş.<br />
              <span className="italic text-[#89A8B2] font-serif">Gerçek Fırsatlar.</span>
            </h1>

            <p className="text-xl text-slate-600 max-w-xl leading-relaxed font-light mb-10">
              Emeğinin karşılığını almak isteyen yetenekler ile dürüst işverenleri buluşturuyoruz.
              <br />
              <span className="font-semibold text-slate-800">Komisyon yok. Ücret yok. Aracı yok.</span>
            </p>

            {/* Refined Search */}
            <div className="flex flex-col sm:flex-row gap-4 max-w-md">
              <div className="flex-1 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg p-1.5 flex transition-all shadow-sm focus-within:ring-2 focus-within:ring-[#89A8B2]/20 focus-within:border-[#89A8B2]">
                <input
                  type="text"
                  placeholder="Yazılımcı, Tasarımcı, Çevirmen..."
                  className="flex-1 px-4 py-3 outline-none text-slate-700 bg-transparent placeholder:text-slate-400"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button
                  onClick={handleSearch}
                  className="bg-[#1E293B] text-white px-6 py-3 rounded-md font-semibold hover:bg-[#334155] transition-all flex items-center gap-2"
                >
                  <Search className="w-4 h-4" />
                  Ara
                </button>
              </div>
            </div>

            {/* Trust Badge Simple */}
            <div className="flex items-center gap-3 mt-10 text-slate-500">
              <ShieldCheck className="w-5 h-5 text-[#89A8B2]" />
              <span className="text-sm font-medium tracking-tight">Tüm ilanlar manuel olarak onaylanır</span>
            </div>
          </div>
        </div>
      </header>

      {/* CORE ADVANTAGES Section */}
      <section className="py-24 px-6 md:px-12 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-xs font-black uppercase tracking-[0.4em] text-[#89A8B2] mb-4">Öne Çıkanlar</h2>
            <h3 className="text-4xl md:text-5xl font-playfair font-black text-[#1E293B]">Neden Net-Work?</h3>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              { icon: Zap, title: "Hızlı ve Doğrudan", desc: "Aracılarla vakit kaybetmeyin, işverenle doğrudan iletişime geçin.", color: "#89A8B2" },
              { icon: ShieldCheck, title: "Güvenli Topluluk", desc: "Her üye ve her ilan ekibimiz tarafından incelenerek onaylanır.", color: "#F4C2A5" },
              { icon: TrendingUp, title: "Gerçek Değer", desc: "Komisyonsuz modelimiz sayesinde emeğinizin tam karşılığını alırsınız.", color: "#B8D4C8" }
            ].map((adv, idx) => (
              <div key={idx} className="group p-8 rounded-2xl border border-slate-100 hover:border-[#89A8B2]/30 hover:bg-slate-50/10 transition-all duration-500">
                <div className="w-16 h-16 mb-6 rounded-xl flex items-center justify-center bg-white shadow-sm group-hover:shadow-[#89A8B2]/20 transition-all border border-slate-50">
                  <adv.icon className="w-7 h-7" style={{ color: adv.color }} />
                </div>
                <h4 className="text-xl font-bold text-slate-800 mb-4 tracking-tight">{adv.title}</h4>
                <p className="text-slate-500 leading-relaxed text-sm">{adv.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURED PROJECTS Section */}
      <section className="py-24 px-6 md:px-12 bg-[#F8FAFC]">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-8">
            <div className="max-w-xl">
              <h2 className="text-xs font-black uppercase tracking-[0.4em] text-[#89A8B2] mb-4">FIRSATLAR</h2>
              <h3 className="text-4xl md:text-5xl font-playfair font-black text-[#1E293B] mb-6">Yeni İş İlanları</h3>
              <p className="text-slate-500 italic">Net-Work topluluğunda paylaşılan en son projeler.</p>
            </div>
            <Link href="/ilanlar" className="inline-flex items-center gap-2 font-bold text-[#89A8B2] group border-b border-[#89A8B2]/30 pb-1 hover:border-[#89A8B2] transition-all">
              Tümünü Gör <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {jobs.length > 0 ? (
              jobs.map((job) => (
                <div key={job.id} className="bg-white p-8 rounded-xl border border-slate-100 hover:shadow-2xl hover:-translate-y-2 transition-all duration-500 group relative">
                  <div className="flex justify-between items-start mb-6">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#89A8B2] bg-[#89A8B2]/5 px-3 py-1 rounded">
                      {job.category || 'Genel'}
                    </span>
                    {job.urgency === 'urgent' && (
                      <span className="text-[10px] font-black uppercase tracking-widest text-red-500 flex items-center gap-1">
                        <Zap className="w-3 h-3" /> Acil
                      </span>
                    )}
                  </div>
                  <h4 className="text-xl font-bold text-slate-800 mb-4 group-hover:text-[#89A8B2] transition-colors line-clamp-1">
                    {job.title}
                  </h4>
                  <p className="text-slate-500 text-sm leading-relaxed mb-6 line-clamp-3">
                    {job.description}
                  </p>
                  <div className="pt-6 border-t border-slate-50 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center font-bold text-[10px] text-slate-500">
                        {job.profiles?.full_name?.[0] || 'N'}
                      </div>
                      <span className="text-xs font-medium text-slate-600">{job.profiles?.full_name || 'Network Üyesi'}</span>
                    </div>
                    <Link href={`/ilan/${job.id}`} className="text-[#89A8B2] hover:text-[#1E293B] transition-colors">
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                <p className="text-slate-400 font-medium italic">Şu an gösterilecek açık ilan bulunamadı.</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* SIMPLE CTA SECTION */}
      <section className="py-24 px-6 md:px-12 bg-[#1E293B]">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-playfair font-black text-white mb-8">Topluluğumuza Katılın.</h2>
          <p className="text-xl text-slate-400 mb-12 font-light">Ücretsiz, şeffaf ve güvenilir bir ağda çalışmanın keyfini çıkarın.</p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center">
            <Link href="/login" className="bg-[#89A8B2] text-white px-10 py-5 rounded-lg font-bold hover:bg-[#7a97a1] transition-all shadow-xl">
              Hemen Kayıt Ol
            </Link>
            <Link href="/yeni-ilan" className="bg-transparent text-white px-10 py-5 rounded-lg font-bold hover:bg-white/10 transition-all border border-white/20">
              İlan Yayınla
            </Link>
          </div>
        </div>
      </section>

      <Chatbot />

      <style jsx global>{`
        .font-playfair { font-family: 'Playfair Display', serif; }
        .font-sans { font-family: 'Inter', sans-serif; }
        
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 1.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}