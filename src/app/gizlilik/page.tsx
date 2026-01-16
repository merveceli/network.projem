'use client';

import Link from 'next/link';
import { Shield, ArrowLeft, Lock, Eye, UserCheck } from 'lucide-react';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 font-sans selection:bg-blue-500/30">
            {/* Header */}
            <header className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 py-6 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
                    <Link href="/login" className="flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors no-underline">
                        <ArrowLeft className="w-4 h-4" />
                        <span>Geri Dön</span>
                    </Link>
                    <div className="flex items-center gap-2 font-black text-xl tracking-tighter">
                        NET-WORK<span className="text-blue-600">.</span>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-16">
                <div className="bg-blue-600 rounded-3xl p-8 mb-12 text-white shadow-xl shadow-blue-500/20 relative overflow-hidden">
                    <Shield className="absolute right-[-20px] bottom-[-20px] w-48 h-48 opacity-10 rotate-12" />
                    <h1 className="text-4xl font-black mb-4 relative z-10">Gizlilik Politikası</h1>
                    <p className="text-blue-100 relative z-10 text-lg">
                        Verileriniz bizimle güvende. Kişisel verilerinizin korunması ve gizliliğiniz, Net-Work platformunun en önemli önceliğidir.
                    </p>
                </div>

                <div className="space-y-12 text-gray-700 dark:text-zinc-300 leading-relaxed">
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                            <UserCheck className="w-6 h-6 text-blue-600" />
                            1. Toplanan Veriler
                        </h2>
                        <p className="mb-4">
                            Net-Work'e LinkedIn, Google veya GitHub üzerinden giriş yaptığınızda, platformumuzun işleyişi için zorunlu olan aşağıdaki veriler toplanır:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Adınız ve Soyadınız</li>
                            <li>E-posta Adresiniz</li>
                            <li>Profil Fotoğrafınız</li>
                            <li>Seçtiğiniz takdirde profesyonel unvanınız ve bio bilgileriniz</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                            <Eye className="w-6 h-6 text-blue-600" />
                            2. Verilerin Kullanım Amacı
                        </h2>
                        <p>
                            Toplanan veriler yalnızca şu amaçlarla kullanılır:
                        </p>
                        <ul className="list-disc pl-6 space-y-2 mt-4">
                            <li>Platform üzerinde profesyonel profilinizin oluşturulması.</li>
                            <li>İş ilanlarına başvuru yapabilmeniz ve işverenlerle iletişim kurabilmeniz.</li>
                            <li>Platform güvenliğinin sağlanması ve sahte hesapların engellenmesi.</li>
                            <li>Önemli güncellemeler ve bildirimler hakkında size bilgi verilmesi.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                            <Lock className="w-6 h-6 text-blue-600" />
                            3. Veri Güvenliği
                        </h2>
                        <p>
                            Verileriniz endüstri standartlarında şifreleme yöntemleri (SSL/TLS) ile korunmaktadır. Altyapımız Supabase (PostgreSQL) tarafından sağlanmakta olup, verileriniz Avrupa sunucularında güvenle saklanmaktadır. Verileriniz asla üçüncü taraflara reklam veya pazarlama amacıyla satılmaz.
                        </p>
                    </section>

                    <section className="bg-gray-100 dark:bg-zinc-800/50 p-8 rounded-2xl border border-gray-200 dark:border-zinc-800">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">KVKK ve Haklarınız</h2>
                        <p className="text-sm">
                            6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) uyarınca, dilediğiniz zaman platformumuzdaki verilerinizin silinmesini talep etme veya verilerinize erişim sağlama hakkına sahipsiniz. Sorularınız için <b>destek@net-work.com.tr</b> adresinden bize ulaşabilirsiniz.
                        </p>
                    </section>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-12 border-t border-gray-200 dark:border-zinc-800 text-center">
                <p className="text-sm text-gray-500">© 2026 NET-WORK. Tüm hakları saklıdır.</p>
            </footer>
        </div>
    );
}
