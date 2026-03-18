"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Filter } from 'bad-words';
import { ArrowLeft, CheckCircle2, ChevronRight, Briefcase, LayoutGrid, FileText, AlertCircle, ImagePlus, X } from 'lucide-react';
import Link from "next/link";
import { sanitizeUserInput } from '@/lib/sanitize';
import { useSession } from "next-auth/react";
import { createJobAction } from "./actions";

export default function YeniIlan() {
    const { data: session, status } = useSession();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("Frontend");
    const [jobType, setJobType] = useState("Tam Zamanlı");
    const [salary, setSalary] = useState("");
    const [urgency, setUrgency] = useState("normal");
    const [images, setImages] = useState<string[]>([]);
    const [uploadingImages, setUploadingImages] = useState(false);
    const [loading, setLoading] = useState(false);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
    const [submitted, setSubmitted] = useState(false);
    const router = useRouter();

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            setMousePos({ x: e.clientX, y: e.clientY });
        };
        window.addEventListener("mousemove", handleMouseMove);
        return () => window.removeEventListener("mousemove", handleMouseMove);
    }, []);

    // Session yüklenirse oturum kontrolü
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/login');
        }
    }, [status, router]);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || status !== 'authenticated') return;

        setUploadingImages(true);
        const uploadedUrls = [...images];

        for (let i = 0; i < files.length; i++) {
            if (uploadedUrls.length >= 3) break;

            const file = files[i];
            const formDataArg = new FormData();
            formDataArg.append('file', file);
            formDataArg.append('folder', 'job-images');

            try {
                const res = await fetch('/api/upload', {
                    method: 'POST',
                    body: formDataArg
                });
                const data = await res.json();
                if (res.ok) {
                    uploadedUrls.push(data.url);
                }
            } catch (err) {
                console.error("Görsel yükleme hatası", err);
            }
        }

        setImages(uploadedUrls);
        setUploadingImages(false);
    };

    const ilanGonder = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (status !== 'authenticated') {
            alert("Lütfen giriş yapın.");
            return;
        }

        const filter = new Filter();
        if (filter.isProfane(title) || filter.isProfane(description)) {
            alert("Lütfen iş ilanında uygunsuz ifadeler kullanmayınız.");
            return;
        }

        setLoading(true);

        const sanitizedTitle = sanitizeUserInput(title);
        const sanitizedDescription = sanitizeUserInput(description);

        const result = await createJobAction({
            title: sanitizedTitle,
            description: sanitizedDescription,
            category,
            job_type: jobType,
            salary,
            urgency,
            images
        });

        if (!result.success) {
            alert("Hata: " + result.error);
            setLoading(false);
        } else {
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

    if (status === 'loading') {
        return <div>Yükleniyor...</div>;
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 transition-colors duration-300 font-sans relative overflow-hidden">

            <div
                className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
                style={{
                    background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(59, 130, 246, 0.08), transparent 40%)`
                }}
            />
            <div
                className="pointer-events-none fixed inset-0 z-0 opacity-50 dark:opacity-20"
                style={{ backgroundImage: `radial-gradient(#cbd5e1 1px, transparent 1px)`, backgroundSize: '30px 30px' }}
            />

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
                        <form onSubmit={ilanGonder} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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
                                            <option value="Diğer">Diğer</option>
                                        </select>
                                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                                            <ChevronRight className="w-4 h-4 rotate-90" />
                                        </div>
                                    </div>
                                </div>

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
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-900 dark:text-zinc-100 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span className="text-gray-400 font-bold">₺</span>
                                            Tahmini Ücret / Maaş
                                        </div>
                                        <label className="flex items-center gap-2 cursor-pointer group">
                                            <input
                                                type="checkbox"
                                                className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 transition-all"
                                                checked={salary === "Gönüllü"}
                                                onChange={(e) => setSalary(e.target.checked ? "Gönüllü" : "")}
                                            />
                                            <span className="text-xs font-bold text-gray-500 dark:text-zinc-400 group-hover:text-blue-600 transition-colors">
                                                Gönüllü (Maaşsız)
                                            </span>
                                        </label>
                                    </label>
                                    <input
                                        type="text"
                                        placeholder={salary === "Gönüllü" ? "Bu ilan gönüllü çalışma içerir." : "Örn: 25.000 - 35.000 TL"}
                                        className={`w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none ${salary === "Gönüllü" ? "opacity-50 cursor-not-allowed bg-gray-100" : ""}`}
                                        value={salary}
                                        onChange={(e) => setSalary(e.target.value)}
                                        disabled={salary === "Gönüllü"}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                                        <AlertCircle className="w-4 h-4 text-gray-400" />
                                        İş Aciliyeti
                                    </label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" value="normal" checked={urgency === 'normal'} onChange={() => setUrgency('normal')} className="w-4 h-4 text-blue-600" />
                                            <span className="text-sm">Normal</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" value="urgent" checked={urgency === 'urgent'} onChange={() => setUrgency('urgent')} className="w-4 h-4 text-red-600" />
                                            <span className="text-sm font-bold text-red-600">ACİL</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                                    <ImagePlus className="w-4 h-4 text-gray-400" />
                                    İş İle İlgili Görseller (Opsiyonel)
                                </label>
                                <div className="border-2 border-dashed border-gray-300 dark:border-zinc-700 rounded-xl p-6 text-center hover:border-blue-500 transition-colors cursor-pointer relative">
                                    <input type="file" multiple accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                    <div className="flex flex-col items-center gap-2 text-gray-500">
                                        <ImagePlus className="w-8 h-8" />
                                        <p className="text-sm">Görselleri sürükleyin veya tıklayın</p>
                                    </div>
                                </div>
                                {uploadingImages && <p className="text-xs text-blue-500 animate-pulse">Görseller yükleniyor...</p>}
                                <div className="flex gap-2 flex-wrap mt-3">
                                    {images.map((img, i) => (
                                        <div key={i} className="relative w-20 h-20 rounded-lg overflow-hidden border border-gray-200">
                                            <img src={img} alt="Preview" className="w-full h-full object-cover" />
                                            <button type="button" onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))} className="absolute top-1 right-1 bg-red-500 text-white p-0.5 rounded-full">
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-semibold text-gray-900 dark:text-zinc-100 flex items-center gap-2">
                                    <FileText className="w-4 h-4 text-gray-400" />
                                    İş Tanımı ve Detaylar
                                </label>
                                <textarea
                                    className="w-full px-4 py-3 min-h-[200px] rounded-lg border border-gray-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all outline-none resize-y"
                                    placeholder="Sorumluluklar ve sunduğunuz imkanlar..."
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-4 border-t border-gray-100 dark:border-zinc-800">
                                <Link href="/" className="px-6 py-2.5 text-sm font-medium hover:bg-gray-100 rounded-lg transition-colors">Vazgeç</Link>
                                <button type="submit" disabled={loading} className="px-8 py-2.5 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2">
                                    {loading ? 'Gönderiliyor...' : <>İlanı Yayınla <CheckCircle2 className="w-4 h-4" /></>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </main>
        </div>
    );
}