"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Filter } from 'bad-words';
import { ArrowLeft, CheckCircle2, ChevronRight, Briefcase, LayoutGrid, FileText, AlertCircle, ImagePlus, X } from 'lucide-react';
import Link from "next/link";
import { sanitizeUserInput } from '@/lib/sanitize';
import { checkRateLimit, getRateLimitInfo } from '@/lib/rateLimit';
import RateLimitWarning from '@/components/RateLimitWarning';

export default function YeniIlan() {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("Frontend");
    const [jobType, setJobType] = useState("Tam Zamanlı");
    const [salary, setSalary] = useState("");
    const [urgency, setUrgency] = useState("normal");
    const [images, setImages] = useState<string[]>([]);
    const [uploadingImages, setUploadingImages] = useState(false);
    const [loading, setLoading] = useState(false);
    const [userId, setUserId] = useState<string | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [rateLimitInfo, setRateLimitInfo] = useState<any>(null);
    const [submitted, setSubmitted] = useState(false); // Success state
    const router = useRouter();

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    useEffect(() => {
        async function getUser() {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) setUserId(user.id);
            else router.push("/login");
        }
        getUser();
    }, [router]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || !userId) return;

        setUploadingImages(true);
        const uploadedUrls = [...images];

        for (let i = 0; i < files.length; i++) {
            if (uploadedUrls.length >= 3) break;

            const file = files[i];
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}/${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('job-images')
                .upload(filePath, file);

            if (uploadError) {
                console.error('Error uploading image:', uploadError);
                continue;
            }

            const { data: { publicUrl } } = supabase.storage
                .from('job-images')
                .getPublicUrl(filePath);

            uploadedUrls.push(publicUrl);
        }

        setImages(uploadedUrls);
        setUploadingImages(false);
    };

    // Load rate limit info
    useEffect(() => {
        async function loadRateLimit() {
            if (!userId) return;
            const info = await getRateLimitInfo(userId, 'create_job');
            setRateLimitInfo(info);
        }
        loadRateLimit();
    }, [userId]);

    const ilanGonder = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId) return;

        // --- GÜVENLİK: EMAIL DOĞRULAMA KONTROLÜ ---
        const { data: { user } } = await supabase.auth.getUser();
        if (!user?.email_confirmed_at) {
            alert('Lütfen ilan vermeden önce e-posta adresinizi doğrulayın. (Spam/Bot koruması)');
            return;
        }

        // Check rate limit
        const { allowed, info } = await checkRateLimit(userId, 'create_job');
        setRateLimitInfo(info);

        if (!allowed) {
            alert('İlan oluşturma limitiniz doldu. Lütfen daha sonra tekrar deneyin.');
            return;
        }

        const filter = new Filter();
        if (filter.isProfane(title) || filter.isProfane(description)) {
            alert("Lütfen iş ilanında uygunsuz ifadeler kullanmayınız.");
            return;
        }

        setLoading(true);

        // Sanitize inputs
        const sanitizedTitle = sanitizeUserInput(title);
        const sanitizedDescription = sanitizeUserInput(description);

        const { error } = await supabase.from("jobs").insert({
            title: sanitizedTitle,
            description: sanitizedDescription,
            category,
            job_type: jobType,
            salary_range: salary,
            creator_id: userId,
            urgency,
            images,
            status: 'pending'
        });

        if (error) {
            alert("Hata: " + error.message);
            setLoading(false);
        } else {
            console.log("İlan başarıyla gönderildi.");
            setSubmitted(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 flex items-center justify-center p-6 font-sans">
                <div className="max-w-xl w-full bg-white dark:bg-zinc-900 rounded-3xl shadow-xl border border-gray-100 dark:border-zinc-800 p-10 text-center animate-in fade-in zoom-in duration-500">
                    <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 dark:text-green-400">
                        <CheckCircle2 className="w-12 h-12" />
                    </div>

                    <h2 className="text-3xl font-black text-gray-900 dark:text-white mb-4">
                        İlanınız Alındı! 🎉
                    </h2>

                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 rounded-xl p-5 mb-8">
                        <p className="text-blue-800 dark:text-blue-300 font-medium text-lg leading-relaxed">
                            İlanınız editörlerimiz tarafından incelenmek üzere sisteme kaydedilmiştir.
                            Onay sürecinden sonra yayına alınacaktır.
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <Link
                            href="/"
                            className="bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-200 text-white dark:text-gray-900 font-bold py-4 px-8 rounded-xl transition-all shadow-lg hover:scale-105 active:scale-95 no-underline"
                        >
                            Ana Sayfaya Dön
                        </Link>
                        <button
                            onClick={() => window.location.reload()}
                            className="text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white font-bold py-2 transition-colors"
                        >
                            Yeni Bir İlan Daha Ver
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 transition-colors duration-300 font-sans relative overflow-hidden">

            {/* Mouse Follow Background Effect */}
            <div
                className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
                style={{
                    background: `
                        radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(59, 130, 246, 0.08), transparent 40%)
                    `
                }}
            />
            <div
                className="pointer-events-none fixed inset-0 z-0 opacity-50 dark:opacity-20"
                style={{
                    backgroundImage: `radial-gradient(#cbd5e1 1px, transparent 1px)`,
                    backgroundSize: '30px 30px'
                }}
            />

            {/* Header / Navigation */}
            <header className="border-b border-gray-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md relative z-10">
                <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
                    <Link href="/" className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors">
                        <ArrowLeft className="w-4 h-4" />
                        Ana Sayfaya Dön
                    </Link>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-12 relative z-10">

                <div className="mb-10 text-center">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-2">
                        Ekibini Büyütmeye Başla
                    </h1>
                    <p className="text-gray-500 dark:text-zinc-400 max-w-lg mx-auto">
                        Profesyonel bir ilan oluşturarak binlerce yetenekli geliştiriciye ve tasarımcıya ulaşın.
                    </p>
                </div>

                <div className="bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl shadow-sm overflow-hidden">
                    <div className="p-8">
                        {/* Rate Limit Warning */}
                        {rateLimitInfo && (
                            <div className="mb-6">
                                <RateLimitWarning
                                    action="create_job"
                                    resetAt={rateLimitInfo.reset_at}
                                    remaining={rateLimitInfo.remaining}
                                    limit={rateLimitInfo.limit}
                                />
                            </div>
                        )}

                        <form onSubmit={ilanGonder} className="space-y-8">

                            {/* Grid Layout for Inputs */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">

                                {/* Job Title */}
                                <div className="space-y-2 col-span-1 md:col-span-2">
                                    <label className="text-sm font-semibold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                                        <Briefcase className="w-4 h-4 text-gray-400" />
                                        İlan Başlığı
                                    </label>
                                    <input
                                        type="text"
                                        placeholder="Örn: Senior React Developer"
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        required
                                    />
                                    <p className="text-xs text-gray-400">Kısa ve açıklayıcı bir başlık girin.</p>
                                </div>

                                {/* Category */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                                        <LayoutGrid className="w-4 h-4 text-gray-400" />
                                        Kategori
                                    </label>
                                    <div className="relative">
                                        <select
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none appearance-none cursor-pointer"
                                            value={category}
                                            onChange={(e) => setCategory(e.target.value)}
                                        >
                                            <option value="Frontend">Frontend Geliştirme</option>
                                            <option value="Backend">Backend Geliştirme</option>
                                            <option value="Full Stack">Full Stack Geliştirme</option>
                                            <option value="Mobil Uygulama">Mobil Uygulama Geliştirme</option>
                                            <option value="UI/UX Tasarım">UI/UX Tasarım</option>
                                            <option value="Grafik Tasarım">Grafik Tasarım</option>
                                            <option value="Veri Bilimi">Veri Bilimi & AI</option>
                                            <option value="DevOps">DevOps & Bulut</option>
                                            <option value="Siber Güvenlik">Siber Güvenlik</option>
                                            <option value="Oyun Geliştirme">Oyun Geliştirme</option>
                                            <option value="Proje Yönetimi">Proje Yönetimi</option>
                                            <option value="E-Ticaret">E-Ticaret</option>
                                            <option value="Pazarlama">Dijital Pazarlama & SEO</option>
                                            <option value="Video">Video Edit & Animasyon</option>
                                            <option value="Metin Yazarlığı">İçerik & Metin Yazarlığı</option>
                                            <option value="Diğer">Diğer</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                            <ChevronRight className="w-4 h-4 rotate-90" />
                                        </div>
                                    </div>
                                </div>

                                {/* Job Type */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                                        <Briefcase className="w-4 h-4 text-gray-400" />
                                        Çalışma Şekli
                                    </label>
                                    <div className="relative">
                                        <select
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none appearance-none cursor-pointer"
                                            value={jobType}
                                            onChange={(e) => setJobType(e.target.value)}
                                        >
                                            <option value="Tam Zamanlı">Tam Zamanlı</option>
                                            <option value="Yarı Zamanlı">Yarı Zamanlı</option>
                                            <option value="Proje Bazlı">Proje Bazlı / Freelance</option>
                                            <option value="Stajyer">Stajyer</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                            <ChevronRight className="w-4 h-4 rotate-90" />
                                        </div>
                                    </div>
                                </div>

                                {/* Salary Range */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-900 dark:text-zinc-100 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-400 font-bold">₺</span>
                                            Tahmini Ücret / Maaş
                                        </div>

                                        {/* Volunteer Checkbox */}
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-all"
                                                checked={salary === "Gönüllü"}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSalary("Gönüllü");
                                                    } else {
                                                        setSalary("");
                                                    }
                                                }}
                                            />
                                            <span className="text-xs font-bold text-gray-500 dark:text-zinc-400 group-hover:text-blue-600 transition-colors">
                                                Gönüllü / Ücretsiz (Maaşsız)
                                            </span>
                                        </label>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder={salary === "Gönüllü" ? "Bu ilan gönüllü çalışma içerir." : "Örn: 25.000 - 35.000 TL"}
                                        className={`w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none ${salary === "Gönüllü" ? "opacity-50 cursor-not-allowed bg-gray-100 dark:bg-zinc-900" : ""}`}
                                        value={salary}
                                        onChange={(e) => setSalary(e.target.value)}
                                        disabled={salary === "Gönüllü"}
                                    />
                                </div>

                                {/* Urgency selection */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-gray-400" />
                                        İş Aciliyeti
                                    </label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="urgency"
                                                value="normal"
                                                checked={urgency === 'normal'}
                                                onChange={() => setUrgency('normal')}
                                                className="w-4 h-4 text-blue-600"
                                            />
                                            <span className="text-sm text-gray-700 dark:text-zinc-300">Normal</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="radio"
                                                name="urgency"
                                                value="urgent"
                                                checked={urgency === 'urgent'}
                                                onChange={() => setUrgency('urgent')}
                                                className="w-4 h-4 text-red-600"
                                            />
                                            <span className="text-sm font-bold text-red-600">ACİL</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Image Upload Area */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                                    <ImagePlus className="w-4 h-4 text-gray-400" />
                                    İş İle İlgili Görseller (Opsiyonel)
                                </label>
                                <div className="border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-xl p-6 text-center hover:border-blue-500 transition-colors cursor-pointer relative">
                                    <input
                                        type="file"
                                        multiple
                                        accept="image/*"
                                        onChange={(e) => handleImageUpload(e)}
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    />
                                    <div className="flex flex-col items-center gap-2 text-gray-500">
                                        <ImagePlus className="w-8 h-8" />
                                        <p className="text-sm">Görselleri buraya sürükleyin veya tıklayın</p>
                                        <p className="text-xs">Maksimum 3 görsel (JPG, PNG)</p>
                                    </div>
                                </div>
                                {uploadingImages && <p className="text-xs text-blue-500 animate-pulse">Görseller yükleniyor...</p>}
                                <div className="flex gap-2 flex-wrap mt-3">
                                    {images.map((img, i) => (
                                        <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                                            <img src={img} alt="Preview" className="w-full h-full object-cover" />
                                            <button
                                                type="button"
                                                onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))}
                                                className="absolute top-1 right-1 bg-red-500 text-white p-0.5 rounded-full"
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Description */}
                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-gray-400" />
                                    İş Tanımı ve Detaylar
                                </label>
                                <textarea
                                    className="w-full px-4 py-3 min-h-[200px] rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-y"
                                    placeholder="Adaydan beklediğiniz özellikler, sorumluluklar ve sunduğunuz imkanlar..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                />
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-4 flex items-center justify-end gap-4 border-t border-gray-100 dark:border-zinc-800">
                                <Link
                                    href="/"
                                    className="px-6 py-2.5 text-sm font-medium text-gray-600 dark:text-zinc-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
                                >
                                    Vazgeç
                                </Link>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="px-8 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-500 rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    {loading ? (
                                        <>Gönderiliyor...</>
                                    ) : (
                                        <>
                                            İlanı Yayınla
                                            <CheckCircle2 className="w-4 h-4" />
                                        </>
                                    )}
                                </button>
                            </div>

                        </form>
                    </div>

                    {/* Info Footer */}
                    <div className="bg-gray-50 dark:bg-zinc-950/50 px-8 py-4 border-t border-gray-200 dark:border-zinc-800">
                        <p className="text-xs text-gray-500 dark:text-zinc-500 text-center">
                            Gönderilen ilanlar editör onayına tabidir. Küfür veya hakaret içeren ilanlar otomatik olarak reddedilir.
                        </p>
                    </div>
                </div>

            </main>
        </div>
    );
}