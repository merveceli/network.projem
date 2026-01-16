'use client';

import Link from 'next/link';
import { FileText, ArrowLeft, AlertTriangle, ShieldCheck, Scale } from 'lucide-react';

export default function TermsOfService() {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-zinc-950 font-sans selection:bg-orange-500/30">
            {/* Header */}
            <header className="bg-white dark:bg-zinc-900 border-b border-gray-200 dark:border-zinc-800 py-6 sticky top-0 z-10">
                <div className="max-w-4xl mx-auto px-6 flex items-center justify-between">
                    <Link href="/login" className="flex items-center gap-2 text-gray-500 hover:text-orange-600 transition-colors no-underline">
                        <ArrowLeft className="w-4 h-4" />
                        <span>Geri Dön</span>
                    </Link>
                    <div className="flex items-center gap-2 font-black text-xl tracking-tighter">
                        NET-WORK<span className="text-orange-600">.</span>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-16">
                <div className="bg-orange-600 rounded-3xl p-8 mb-12 text-white shadow-xl shadow-orange-500/20 relative overflow-hidden">
                    <Scale className="absolute right-[-20px] bottom-[-20px] w-48 h-48 opacity-10 rotate-12" />
                    <h1 className="text-4xl font-black mb-4 relative z-10">Kullanım Şartları</h1>
                    <p className="text-orange-100 relative z-10 text-lg">
                        Net-Work platformunu kullanarak, topluluğumuzun güvenini ve kalitesini korumak için belirlediğimiz aşağıdaki kuralları kabul etmiş olursunuz.
                    </p>
                </div>

                <div className="space-y-12 text-gray-700 dark:text-zinc-300 leading-relaxed">
                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                            <ShieldCheck className="w-6 h-6 text-orange-600" />
                            1. Üyelik ve Kimlik Doğrulama
                        </h2>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Net-Work profesyonel bir ağdır. Sadece LinkedIn, Google veya GitHub üzerinden doğrulanmış hesaplarla giriş yapılabilir.</li>
                            <li>Kullanıcılar, profillerindeki bilgilerin doğruluğundan bizzat sorumludur.</li>
                            <li>Başkasına ait kimlik veya şirket bilgilerini kullanmak kesinlikle yasaktır ve hesabın kalıcı olarak kapatılmasına neden olur.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                            <AlertTriangle className="w-6 h-6 text-orange-600" />
                            2. İlan Verme Kuralları
                        </h2>
                        <p className="mb-4">
                            Platformun kalitesini korumak adına aşağıdaki ilan türlerine izin verilmez:
                        </p>
                        <ul className="list-disc pl-6 space-y-2">
                            <li>Gerçek bir işe veya projeye dayanmayan sahte ilanlar.</li>
                            <li>Yanıltıcı fiyat teklifleri içeren veya reklam amaçlı paylaşımlar.</li>
                            <li>Yasadışı içerik, nefret söylemi veya ayrımcılık içeren ilanlar.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                            <FileText className="w-6 h-6 text-orange-600" />
                            3. Sorumluluk Sınırları
                        </h2>
                        <p>
                            Net-Work, freelancerlar ve işverenler arasında bir köprü görevi görür. Taraflar arasındaki iş süreçlerinden, ödemelerden veya hukuki anlaşmazlıklardan platform sorumlu tutulamaz. Her zaman yazılı bir sözleşme ile çalışmanızı öneririz.
                        </p>
                    </section>

                    <section className="bg-orange-50 dark:bg-orange-900/10 p-8 rounded-2xl border border-orange-100 dark:border-orange-800">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Hizmetin Durdurulması</h2>
                        <p className="text-sm">
                            Platform kurallarının ihlali durumunda, Net-Work yönetimi herhangi bir hesabı önceden haber vermeksizin askıya alma veya silme hakkını saklı tutar. Topluluğumuzda dürüstlüğü ve profesyonelliği ön planda tuttuğunuz için teşekkür ederiz.
                        </p>
                    </section>
                </div>
            </main>

            {/* Footer */}
            <footer className="py-12 border-t border-gray-200 dark:border-zinc-800 text-center">
                <p className="text-sm text-gray-500">© 2026 NET-WORK. Güvenli ve şeffaf çalışma alanı.</p>
            </footer>
        </div>
    );
}
