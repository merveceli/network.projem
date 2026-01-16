'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';

export default function ProfileSetup() {
    const router = useRouter();
    const supabase = createClient();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(true);
    const [userType, setUserType] = useState<'freelancer' | 'employer' | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        location: '',
        companyName: '',
        companySize: '',
        jobTitle: '',
        hourlyRate: '',
        skills: '',
        bio: '',
        cv_url: ''
    });
    const [uploadingCV, setUploadingCV] = useState(false);

    // 1. KULLANICI KONTROLÜ VE YÖNLENDİRME
    useEffect(() => {
        const checkUser = async () => {
            // getUser yerine getSession kullanıyoruz (HomePage ile tutarlı olması için)
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;

            if (!user) {
                setLoading(false);
                return;
            }

            // Profil kontrolü
            const { data: profile } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', user.id)
                .single();

            if (profile?.role) {
                if (profile.role === 'freelancer') router.push('/profil/freelancer');
                else if (profile.role === 'employer') router.push('/profil/employer');
            }

            setLoading(false);
        };

        checkUser();
    }, [router, supabase]);


    // Adım 1: Kullanıcı tipi seçimi
    const handleUserTypeSelect = (type: 'freelancer' | 'employer') => {
        setUserType(type);
        setStep(2);
    };

    // Form değişiklikleri
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Form gönderimi
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            const user = session?.user;

            if (!user) {
                alert("Oturum süreniz dolmuş olabilir. Lütfen tekrar giriş yapın.");
                router.push('/');
                return;
            }

            // Profil güncelleme
            const updates = {
                id: user.id,
                full_name: userType === 'employer' ? formData.companyName : formData.name,
                role: userType, // Rolü kaydet
                updated_at: new Date().toISOString(),
                // İsteğe bağlı alanları da ekleyelim ki boş gitmesin
                title: formData.jobTitle,
                hourly_rate: formData.hourlyRate,
                location: formData.location,
                bio: formData.bio,
                skills: formData.skills ? formData.skills.split(',').map(s => s.trim()) : [],
                cv_url: formData.cv_url
            };

            const { error } = await supabase.from('profiles').upsert(updates);

            if (error) {
                console.error('Supabase Hatası:', error);
                throw error;
            }

            // Başarılı işlem sonrası yönlendirme
            if (userType === 'freelancer') {
                router.push('/profil/freelancer');
            } else {
                router.push('/profil/employer');
            }

        } catch (error: any) {
            console.error('Kayıt hatası:', error);
            alert(`Bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`);
            setLoading(false); // Hata durumunda loading'i kapat
        }
        // Başarılı durumda yönlendirme olduğu için loading kapatmaya gerek yok (sayfa değişecek)
        // Ancak router.push asenkron değil, hemen çalışır ama sayfa değişimi vakit alabilir.
        // Yine de hata bloğunda loading kapatmak önemli.
    };

    const handleCVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingCV(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            const fileExt = file.name.split('.').pop();
            const fileName = `${session.user.id}/${Math.random()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('cvs')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('cvs')
                .getPublicUrl(fileName);

            setFormData(prev => ({ ...prev, cv_url: publicUrl }));
            alert('CV başarıyla yüklendi.');
        } catch (error: any) {
            alert('CV yükleme hatası: ' + error.message);
        } finally {
            setUploadingCV(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#f8fafc]">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-[#3498db] border-t-transparent rounded-full animate-spin"></div>
                    <div className="text-[#34495e] font-bold text-lg">Yönlendiriliyorsunuz...</div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#f8fafc] font-sans text-[#2c3e50] py-10">
            <div className="max-w-[1000px] mx-auto px-5">
                {/* Logo/Header */}
                <header className="text-center mb-10">
                    <h1 className="text-4xl font-[900] tracking-tighter text-[#1a1a2e] mb-2">Net-Work<span className="text-[#FF6B35]">.</span></h1>
                    <p className="text-[#7f8c8d]">Profesyonel profilinizi oluşturun</p>
                </header>

                {/* İlerleme Çubuğu */}
                <div className="flex justify-between items-center max-w-[600px] mx-auto mb-12 relative">
                    <div className="absolute top-1/2 left-0 w-full h-[2px] bg-[#e0e6ed] -z-10 -translate-y-1/2"></div>

                    <div className={`flex flex-col items-center gap-2 bg-[#f8fafc] px-4 z-10 ${step >= 1 ? 'text-[#3498db]' : 'text-[#bdc3c7]'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${step >= 1 ? 'bg-[#3498db] text-white shadow-lg shadow-blue-200' : 'bg-[#bdc3c7] text-white'}`}>1</div>
                        <span className="text-sm font-bold">Tip Seçimi</span>
                    </div>

                    <div className={`flex flex-col items-center gap-2 bg-[#f8fafc] px-4 z-10 ${step >= 2 ? 'text-[#3498db]' : 'text-[#bdc3c7]'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${step >= 2 ? 'bg-[#3498db] text-white shadow-lg shadow-blue-200' : 'bg-[#bdc3c7] text-white'}`}>2</div>
                        <span className="text-sm font-bold">Bilgileri Doldur</span>
                    </div>

                    <div className={`flex flex-col items-center gap-2 bg-[#f8fafc] px-4 z-10 ${step === 3 ? 'text-[#3498db]' : 'text-[#bdc3c7]'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${step === 3 ? 'bg-[#3498db] text-white shadow-lg shadow-blue-200' : 'bg-[#bdc3c7] text-white'}`}>3</div>
                        <span className="text-sm font-bold">Tamamla</span>
                    </div>
                </div>

                {/* Ana İçerik */}
                <main className="bg-white rounded-2xl shadow-sm border border-[#e0e6ed] p-8 md:p-12 animate-[fadeIn_0.5s_ease]">
                    {/* Adım 1: Kullanıcı Tipi Seçimi */}
                    {!loading && step === 1 && (
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-[#2c3e50] mb-2">Nasıl Katılmak İstersiniz?</h2>
                            <p className="text-[#7f8c8d] mb-10">Profesyonel ağımıza katılmak için lütfen bir seçenek belirleyin</p>

                            <div className="grid md:grid-cols-2 gap-6 max-w-[800px] mx-auto">
                                {/* Freelancer Kartı */}
                                <div
                                    className={`group cursor-pointer p-8 rounded-xl border-2 transition-all hover:-translate-y-1 hover:shadow-lg text-left relative overflow-hidden ${userType === 'freelancer' ? 'border-[#3498db] bg-[#edf7fc]' : 'border-[#e0e6ed] hover:border-[#3498db]'}`}
                                    onClick={() => handleUserTypeSelect('freelancer')}
                                >
                                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">👨‍💻</div>
                                    <h3 className="text-xl font-bold text-[#2c3e50] mb-4">Freelancer / İş Arayan</h3>
                                    <ul className="text-[#7f8c8d] space-y-2 mb-8 text-sm">
                                        <li>✓ İş ilanlarını görüntüle</li>
                                        <li>✓ Profesyonel portfolio oluştur</li>
                                        <li>✓ Doğrudan işverenlerle iletişime geç</li>
                                        <li>✓ Projeler için teklif ver</li>
                                    </ul>
                                    <span className="absolute top-4 right-4 bg-[#fff3cd] text-[#856404] text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Popüler</span>
                                </div>

                                {/* İşveren Kartı */}
                                <div
                                    className={`group cursor-pointer p-8 rounded-xl border-2 transition-all hover:-translate-y-1 hover:shadow-lg text-left relative overflow-hidden ${userType === 'employer' ? 'border-[#3498db] bg-[#edf7fc]' : 'border-[#e0e6ed] hover:border-[#3498db]'}`}
                                    onClick={() => handleUserTypeSelect('employer')}
                                >
                                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🏢</div>
                                    <h3 className="text-xl font-bold text-[#2c3e50] mb-4">İşveren / İş Veren</h3>
                                    <ul className="text-[#7f8c8d] space-y-2 mb-8 text-sm">
                                        <li>✓ İlan yayınla</li>
                                        <li>✓ Yetenekli freelancerları bul</li>
                                        <li>✓ Proje yönetimi araçları</li>
                                        <li>✓ Detaylı filtreleme</li>
                                    </ul>
                                    <span className="absolute top-4 right-4 bg-[#e3f2fd] text-[#1976d2] text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-wider">Kurumsal</span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Adım 2: Form Doldurma */}
                    {step === 2 && (
                        <div>
                            <div className="text-center mb-10">
                                <h2 className="text-2xl font-bold text-[#2c3e50] mb-2">{userType === 'freelancer' ? 'Freelancer Profili' : 'İşveren Profili'} Oluştur</h2>
                                <p className="text-[#7f8c8d]">Lütfen profiliniz için gerekli bilgileri doldurun</p>
                            </div>

                            <form onSubmit={handleSubmit} className="max-w-[700px] mx-auto space-y-10">
                                {/* Ortak Alanlar */}
                                <div>
                                    <h3 className="text-lg font-bold text-[#2c3e50] mb-5 pb-2 border-b border-[#e0e6ed] flex items-center gap-2">👤 Temel Bilgiler</h3>
                                    <div className="grid gap-5">
                                        <div className="grid gap-2">
                                            <label htmlFor="name" className="text-sm font-bold text-[#34495e]">Ad Soyad *</label>
                                            <input
                                                type="text"
                                                id="name"
                                                name="name"
                                                value={formData.name}
                                                onChange={handleInputChange}
                                                required
                                                placeholder={userType === 'employer' ? "Şirket Temsilcisi Adı" : "Ahmet Yılmaz"}
                                                className="w-full p-3 border-2 border-[#e0e6ed] rounded-lg outline-none focus:border-[#3498db] transition-colors"
                                            />
                                        </div>

                                        <div className="grid gap-2">
                                            <label htmlFor="email" className="text-sm font-bold text-[#34495e]">E-posta Adresi *</label>
                                            <input
                                                type="email"
                                                id="email"
                                                name="email"
                                                value={formData.email}
                                                onChange={handleInputChange}
                                                required
                                                placeholder="ahmet@example.com"
                                                className="w-full p-3 border-2 border-[#e0e6ed] rounded-lg outline-none focus:border-[#3498db] transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Kullanıcı Tipine Özel Alanlar */}
                                {userType === 'freelancer' ? (
                                    <div>
                                        <h3 className="text-lg font-bold text-[#2c3e50] mb-5 pb-2 border-b border-[#e0e6ed] flex items-center gap-2">💼 Freelancer Bilgileri</h3>
                                        <div className="grid gap-5">
                                            <div className="grid gap-2">
                                                <label htmlFor="jobTitle" className="text-sm font-bold text-[#34495e]">Meslek / Uzmanlık Alanı *</label>
                                                <input
                                                    type="text"
                                                    id="jobTitle"
                                                    name="jobTitle"
                                                    value={formData.jobTitle}
                                                    onChange={handleInputChange}
                                                    required
                                                    placeholder="Örn: Frontend Developer"
                                                    className="w-full p-3 border-2 border-[#e0e6ed] rounded-lg outline-none focus:border-[#3498db] transition-colors"
                                                />
                                            </div>

                                            <div className="grid gap-2">
                                                <label htmlFor="hourlyRate" className="text-sm font-bold text-[#34495e]">Saatlik Ücret Beklentisi</label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        id="hourlyRate"
                                                        name="hourlyRate"
                                                        value={formData.hourlyRate}
                                                        onChange={handleInputChange}
                                                        placeholder="50"
                                                        className="w-full p-3 border-2 border-[#e0e6ed] rounded-lg outline-none focus:border-[#3498db] transition-colors pr-16"
                                                    />
                                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7f8c8d] font-medium">$ / saat</span>
                                                </div>
                                            </div>

                                            <div className="grid gap-2">
                                                <label htmlFor="cv" className="text-sm font-bold text-[#34495e]">CV / Özgeçmiş (PDF)</label>
                                                <div className="flex items-center gap-4">
                                                    <input
                                                        type="file"
                                                        id="cv"
                                                        accept=".pdf"
                                                        onChange={handleCVUpload}
                                                        className="hidden"
                                                    />
                                                    <label
                                                        htmlFor="cv"
                                                        className={`cursor-pointer py-2 px-4 rounded-lg border-2 border-dashed border-[#e0e6ed] text-sm hover:border-[#3498db] transition-colors ${uploadingCV ? 'opacity-50 pointer-events-none' : ''}`}
                                                    >
                                                        {uploadingCV ? 'Yükleniyor...' : formData.cv_url ? 'CV Değiştir' : 'CV Yükle (.pdf)'}
                                                    </label>
                                                    {formData.cv_url && (
                                                        <span className="text-xs text-green-600 font-bold">✓ CV Yüklendi</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div>
                                        <h3 className="text-lg font-bold text-[#2c3e50] mb-5 pb-2 border-b border-[#e0e6ed] flex items-center gap-2">🏢 Şirket Bilgileri</h3>
                                        <div className="grid gap-5">
                                            <div className="grid gap-2">
                                                <label htmlFor="companyName" className="text-sm font-bold text-[#34495e]">Şirket Adı *</label>
                                                <input
                                                    type="text"
                                                    id="companyName"
                                                    name="companyName"
                                                    value={formData.companyName}
                                                    onChange={handleInputChange}
                                                    required
                                                    placeholder="TechCorp A.Ş."
                                                    className="w-full p-3 border-2 border-[#e0e6ed] rounded-lg outline-none focus:border-[#3498db] transition-colors"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Form Butonları */}
                                <div className="flex justify-between pt-5">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="py-3 px-6 rounded-lg text-[#7f8c8d] font-bold hover:bg-[#f8fafc] transition-colors"
                                    >
                                        ← Geri
                                    </button>
                                    <button
                                        type="submit"
                                        className="py-3 px-8 rounded-lg bg-[#3498db] text-white font-bold shadow-md hover:bg-[#2980b9] hover:-translate-y-0.5 transition-all"
                                    >
                                        Profilimi Oluştur ve Devam Et →
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}