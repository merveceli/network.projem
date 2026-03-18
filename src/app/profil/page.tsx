'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getProfile, updateProfileSetup } from './actions';
import { useSession } from 'next-auth/react';

export default function ProfileSetup() {
    const router = useRouter();
    const { data: session, status } = useSession();
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
        cv_url: '',
        avatar_url: ''
    });
    const [uploadingCV, setUploadingCV] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);

    // 1. KULLANICI KONTROLÜ VE YÖNLENDİRME
    useEffect(() => {
        const checkUser = async () => {
            if (status === 'loading') return;
            
            if (status !== 'authenticated' || !session?.user) {
                setLoading(false);
                return;
            }

            try {
                // Profil kontrolü
                const profile = await getProfile();

                if (profile?.role) {
                    if (profile.role === 'freelancer') router.push('/profil/freelancer');
                    else if (profile.role === 'employer') router.push('/profil/employer');
                }

                // Email ve Metadata otomatik doldur
                setFormData(prev => ({
                    ...prev,
                    email: session.user?.email || '',
                    name: profile?.full_name || session.user?.name || '',
                    avatar_url: profile?.avatar_url || session.user?.image || ''
                }));
            } catch (error) {
                console.error("Profil alınırken hata", error);
            } finally {
                setLoading(false);
            }
        };

        checkUser();
    }, [status, session, router]);

    // Form değişiklikleri
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Adım 1: Temel bilgiler formu tamamlandı, sonraki adıma geç
    const handleStep1Submit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.email.trim()) {
            alert('Ad Soyad ve E-posta alanları zorunludur.');
            return;
        }
        setStep(2);
    };

    // Adım 2: Kullanıcı tipi seçimi
    const handleUserTypeSelect = (type: 'freelancer' | 'employer') => {
        setUserType(type);
        setStep(3);
    };

    // Form gönderimi (Son adım)
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (!session?.user?.id) {
                alert("Oturum süreniz dolmuş olabilir. Lütfen tekrar giriş yapın.");
                router.push('/');
                return;
            }

            // Profil güncelleme (Server Action üzerinden Neon SQL)
            await updateProfileSetup({ ...formData, userType });

            if (userType === 'freelancer') {
                router.push('/profil/freelancer');
            } else {
                router.push('/profil/employer');
            }

        } catch (error: any) {
            console.error('Kayıt hatası:', error);
            alert(`Bir hata oluştu: ${error.message || 'Bilinmeyen hata'}`);
            setLoading(false);
        }
    };

    const handleCVUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingCV(true);
        try {
            const formDataArg = new FormData();
            formDataArg.append('file', file);
            formDataArg.append('folder', 'cvs');

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formDataArg
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Yükleme başarısız');

            setFormData(prev => ({ ...prev, cv_url: data.url }));
            alert('CV başarıyla yüklendi.');
        } catch (error: any) {
            alert('CV yükleme hatası: ' + error.message);
        } finally {
            setUploadingCV(false);
        }
    }

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingAvatar(true);
        try {
            const formDataArg = new FormData();
            formDataArg.append('file', file);
            formDataArg.append('folder', 'avatars');

            const res = await fetch('/api/upload', {
                method: 'POST',
                body: formDataArg
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Yükleme başarısız');

            setFormData(prev => ({ ...prev, avatar_url: data.url }));
        } catch (error: any) {
            alert('Fotoğraf yükleme hatası: ' + error.message);
        } finally {
            setUploadingAvatar(false);
        }
    };

    if (loading || status === 'loading') {
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
                    <h1 className="text-4xl font-[900] tracking-tighter text-[#1a1a2e] mb-2">Net-Work<span className="text-[#E91E63]">.</span></h1>
                    <p className="text-[#7f8c8d]">Profesyonel profilinizi oluşturun</p>
                </header>

                {/* İlerleme Çubuğu */}
                <div className="flex justify-between items-center max-w-[600px] mx-auto mb-12 relative">
                    <div className="absolute top-1/2 left-0 w-full h-[2px] bg-[#e0e6ed] -z-10 -translate-y-1/2"></div>
                    <div className={`flex flex-col items-center gap-2 bg-[#f8fafc] px-4 z-10 ${step >= 1 ? 'text-[#3498db]' : 'text-[#bdc3c7]'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${step >= 1 ? 'bg-[#3498db] text-white shadow-lg shadow-blue-200' : 'bg-[#bdc3c7] text-white'}`}>1</div>
                        <span className="text-sm font-bold">Temel Bilgiler</span>
                    </div>
                    <div className={`flex flex-col items-center gap-2 bg-[#f8fafc] px-4 z-10 ${step >= 2 ? 'text-[#3498db]' : 'text-[#bdc3c7]'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${step >= 2 ? 'bg-[#3498db] text-white shadow-lg shadow-blue-200' : 'bg-[#bdc3c7] text-white'}`}>2</div>
                        <span className="text-sm font-bold">Hesap Tipi</span>
                    </div>
                    <div className={`flex flex-col items-center gap-2 bg-[#f8fafc] px-4 z-10 ${step === 3 ? 'text-[#3498db]' : 'text-[#bdc3c7]'}`}>
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${step === 3 ? 'bg-[#3498db] text-white shadow-lg shadow-blue-200' : 'bg-[#bdc3c7] text-white'}`}>3</div>
                        <span className="text-sm font-bold">Tamamla</span>
                    </div>
                </div>

                {/* Ana İçerik */}
                <main className="bg-white rounded-2xl shadow-sm border border-[#e0e6ed] p-8 md:p-12 animate-[fadeIn_0.5s_ease]">
                    {/* ADIM 1 */}
                    {!loading && step === 1 && (
                        <div>
                            <div className="text-center mb-10">
                                <h2 className="text-2xl font-bold text-[#2c3e50] mb-2">Temel Bilgilerinizi Girin</h2>
                                <p className="text-[#7f8c8d]">Profiliniz için gerekli bilgileri doldurun</p>
                            </div>

                            <form onSubmit={handleStep1Submit} className="max-w-[700px] mx-auto space-y-8">
                                <div className="flex justify-center mb-6">
                                    <div className="relative group cursor-pointer w-24 h-24">
                                        <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" id="avatar-upload" disabled={uploadingAvatar} />
                                        <label htmlFor="avatar-upload" className="block w-full h-full rounded-full overflow-hidden border-2 border-[#e0e6ed] group-hover:border-[#3498db] transition-colors relative">
                                            {formData.avatar_url ? (
                                                <img src={formData.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full bg-[#f8fafc] flex items-center justify-center text-3xl text-[#bdc3c7]">📷</div>
                                            )}
                                            {uploadingAvatar && (
                                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                </div>
                                            )}
                                        </label>
                                        <span className="text-xs text-[#7f8c8d] mt-2 block text-center w-32 -ml-4">Profil Fotoğrafı</span>
                                    </div>
                                </div>
                                <div className="grid gap-5">
                                    <div className="grid gap-2">
                                        <label htmlFor="name" className="text-sm font-bold text-[#34495e]">Ad Soyad *</label>
                                        <input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} required placeholder="Ahmet Yılmaz" className="w-full p-3 border-2 border-[#e0e6ed] rounded-lg outline-none focus:border-[#3498db] transition-colors" />
                                    </div>
                                    <div className="grid gap-2">
                                        <label htmlFor="email" className="text-sm font-bold text-[#34495e]">E-posta Adresi *</label>
                                        <input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} required placeholder="ahmet@example.com" className="w-full p-3 border-2 border-[#e0e6ed] rounded-lg outline-none focus:border-[#3498db] transition-colors" />
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-5">
                                        <div className="grid gap-2">
                                            <label htmlFor="phone" className="text-sm font-bold text-[#34495e]">Telefon</label>
                                            <input type="tel" id="phone" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+90 5XX XXX XX XX" className="w-full p-3 border-2 border-[#e0e6ed] rounded-lg outline-none focus:border-[#3498db] transition-colors" />
                                        </div>
                                        <div className="grid gap-2">
                                            <label htmlFor="location" className="text-sm font-bold text-[#34495e]">Konum</label>
                                            <input type="text" id="location" name="location" value={formData.location} onChange={handleInputChange} placeholder="İstanbul, Türkiye" className="w-full p-3 border-2 border-[#e0e6ed] rounded-lg outline-none focus:border-[#3498db] transition-colors" />
                                        </div>
                                    </div>
                                    <div className="grid gap-2">
                                        <label htmlFor="bio" className="text-sm font-bold text-[#34495e]">Kısa Biyografi</label>
                                        <textarea id="bio" name="bio" value={formData.bio} onChange={handleInputChange} placeholder="Kendinizi kısaca tanıtın..." rows={3} className="w-full p-3 border-2 border-[#e0e6ed] rounded-lg outline-none focus:border-[#3498db] transition-colors resize-none" />
                                    </div>
                                </div>
                                <div className="flex justify-end pt-5">
                                    <button type="submit" className="py-3 px-8 rounded-lg bg-[#3498db] text-white font-bold shadow-md hover:bg-[#2980b9] hover:-translate-y-0.5 transition-all">
                                        Devam Et →
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {/* ADIM 2 */}
                    {!loading && step === 2 && (
                        <div className="text-center">
                            <h2 className="text-2xl font-bold text-[#2c3e50] mb-2">Nasıl Katılmak İstersiniz?</h2>
                            <p className="text-[#7f8c8d] mb-10">Profesyonel ağımıza katılmak için lütfen bir seçenek belirleyin</p>
                            <div className="grid md:grid-cols-2 gap-6 max-w-[800px] mx-auto">
                                <div className={`group cursor-pointer p-8 rounded-xl border-2 transition-all hover:-translate-y-1 hover:shadow-lg text-left relative overflow-hidden ${userType === 'freelancer' ? 'border-[#3498db] bg-[#edf7fc]' : 'border-[#e0e6ed] hover:border-[#3498db]'}`} onClick={() => handleUserTypeSelect('freelancer')}>
                                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">👨‍💻</div>
                                    <h3 className="text-xl font-bold text-[#2c3e50] mb-4">Freelancer / İş Arayan</h3>
                                    <ul className="text-[#7f8c8d] space-y-2 mb-8 text-sm">
                                        <li>✓ İş ilanlarını görüntüle</li>
                                        <li>✓ Profesyonel portfolio oluştur</li>
                                        <li>✓ Doğrudan işverenlerle iletişime geç</li>
                                        <li>✓ Projeler için teklif ver</li>
                                    </ul>
                                </div>
                                <div className={`group cursor-pointer p-8 rounded-xl border-2 transition-all hover:-translate-y-1 hover:shadow-lg text-left relative overflow-hidden ${userType === 'employer' ? 'border-[#3498db] bg-[#edf7fc]' : 'border-[#e0e6ed] hover:border-[#3498db]'}`} onClick={() => handleUserTypeSelect('employer')}>
                                    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform duration-300">🏢</div>
                                    <h3 className="text-xl font-bold text-[#2c3e50] mb-4">İşveren / İş Veren</h3>
                                    <ul className="text-[#7f8c8d] space-y-2 mb-8 text-sm">
                                        <li>✓ İlan yayınla</li>
                                        <li>✓ Yetenekli freelancerları bul</li>
                                        <li>✓ Proje yönetimi araçları</li>
                                        <li>✓ Detaylı filtreleme</li>
                                    </ul>
                                </div>
                            </div>
                            <div className="mt-8">
                                <button type="button" onClick={() => setStep(1)} className="py-3 px-6 rounded-lg text-[#7f8c8d] font-bold hover:bg-[#f8fafc] transition-colors">← Geri</button>
                            </div>
                        </div>
                    )}

                    {/* ADIM 3 */}
                    {!loading && step === 3 && (
                        <div>
                            <div className="text-center mb-10">
                                <h2 className="text-2xl font-bold text-[#2c3e50] mb-2">
                                    {userType === 'freelancer' ? 'Freelancer Bilgileri' : 'Şirket Bilgileri'}
                                </h2>
                                <p className="text-[#7f8c8d]">Son birkaç bilgiyle profilinizi tamamlayın</p>
                            </div>
                            <form onSubmit={handleSubmit} className="max-w-[700px] mx-auto space-y-8">
                                {userType === 'freelancer' ? (
                                    <div className="space-y-5">
                                        <div className="grid gap-2">
                                            <label htmlFor="jobTitle" className="text-sm font-bold text-[#34495e]">Meslek / Uzmanlık Alanı *</label>
                                            <input type="text" id="jobTitle" name="jobTitle" value={formData.jobTitle} onChange={handleInputChange} required placeholder="Örn: Frontend Developer" className="w-full p-3 border-2 border-[#e0e6ed] rounded-lg outline-none focus:border-[#3498db] transition-colors" />
                                        </div>
                                        <div className="grid gap-2">
                                            <label htmlFor="skills" className="text-sm font-bold text-[#34495e]">Yetenekler (virgülle ayırın)</label>
                                            <input type="text" id="skills" name="skills" value={formData.skills} onChange={handleInputChange} placeholder="React, TypeScript, Node.js" className="w-full p-3 border-2 border-[#e0e6ed] rounded-lg outline-none focus:border-[#3498db] transition-colors" />
                                        </div>
                                        <div className="grid gap-2">
                                            <label htmlFor="hourlyRate" className="text-sm font-bold text-[#34495e]">Saatlik Ücret Beklentisi</label>
                                            <div className="relative">
                                                <input type="text" id="hourlyRate" name="hourlyRate" value={formData.hourlyRate} onChange={handleInputChange} placeholder="50" className="w-full p-3 border-2 border-[#e0e6ed] rounded-lg outline-none focus:border-[#3498db] transition-colors pr-16" />
                                                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#7f8c8d] font-medium">$ / saat</span>
                                            </div>
                                        </div>
                                        <div className="grid gap-2">
                                            <label htmlFor="cv" className="text-sm font-bold text-[#34495e]">CV / Özgeçmiş (PDF)</label>
                                            <div className="flex items-center gap-4">
                                                <input type="file" id="cv" accept=".pdf" onChange={handleCVUpload} className="hidden" disabled={uploadingCV} />
                                                <label htmlFor="cv" className={`cursor-pointer py-2 px-4 rounded-lg border-2 border-dashed border-[#e0e6ed] text-sm hover:border-[#3498db] transition-colors ${uploadingCV ? 'opacity-50 pointer-events-none' : ''}`}>
                                                    {uploadingCV ? 'Yükleniyor...' : formData.cv_url ? 'CV Değiştir' : 'CV Yükle (.pdf)'}
                                                </label>
                                                {formData.cv_url && <span className="text-xs text-green-600 font-bold">✓ CV Yüklendi</span>}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-5">
                                        <div className="grid gap-2">
                                            <label htmlFor="companyName" className="text-sm font-bold text-[#34495e]">Şirket Adı *</label>
                                            <input type="text" id="companyName" name="companyName" value={formData.companyName} onChange={handleInputChange} required placeholder="TechCorp A.Ş." className="w-full p-3 border-2 border-[#e0e6ed] rounded-lg outline-none focus:border-[#3498db] transition-colors" />
                                        </div>
                                        <div className="grid gap-2">
                                            <label htmlFor="jobTitle" className="text-sm font-bold text-[#34495e]">Sektör</label>
                                            <input type="text" id="jobTitle" name="jobTitle" value={formData.jobTitle} onChange={handleInputChange} placeholder="Örn: Teknoloji, Finans, E-ticaret" className="w-full p-3 border-2 border-[#e0e6ed] rounded-lg outline-none focus:border-[#3498db] transition-colors" />
                                        </div>
                                        <div className="grid gap-2">
                                            <label htmlFor="companySize" className="text-sm font-bold text-[#34495e]">Şirket Büyüklüğü</label>
                                            <select id="companySize" name="companySize" value={formData.companySize} onChange={handleInputChange} className="w-full p-3 border-2 border-[#e0e6ed] rounded-lg outline-none focus:border-[#3498db] transition-colors bg-white">
                                                <option value="">Seçiniz</option>
                                                <option value="1-10">1-10 Çalışan</option>
                                                <option value="11-50">11-50 Çalışan</option>
                                                <option value="51-200">51-200 Çalışan</option>
                                                <option value="200+">200+ Çalışan</option>
                                            </select>
                                        </div>
                                    </div>
                                )}
                                <div className="flex justify-between pt-5">
                                    <button type="button" onClick={() => setStep(2)} className="py-3 px-6 rounded-lg text-[#7f8c8d] font-bold hover:bg-[#f8fafc] transition-colors">← Geri</button>
                                    <button type="submit" disabled={loading} className="py-3 px-8 rounded-lg bg-[#3498db] text-white font-bold shadow-md hover:bg-[#2980b9] hover:-translate-y-0.5 transition-all">
                                        Profilimi Oluştur ve Başla 🚀
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