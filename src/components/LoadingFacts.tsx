"use client";
import { useState, useEffect } from "react";
import { Sparkles, Lightbulb } from "lucide-react";

const FACTS = [
    "İlk e-posta 1971 yılında Ray Tomlinson tarafından gönderildi.",
    "Google'ın ilk adı 'BackRub' idi.",
    "Dünyadaki web sitelerinin %43'ü WordPress kullanıyor.",
    "Freelance kelimesi ilk kez Ivanhoe romanında 'paralı asker' anlamında kullanıldı.",
    "Amazon'un ilk adı 'Cadabra' olacaktı.",
    "Apple'ın logosundaki ısırık, elma ile kirazın karışmaması için eklendi.",
    "İlk alan adı 'symbolics.com' 1985 yılında tescil edildi.",
    "Dünyanın en zengin %1'i, küresel servetin %45'ine sahip.",
    "Her gün ortalama 300 milyar e-posta gönderiliyor.",
    "YouTube'a her dakika 500 saatlik video yükleniyor."
];

export default function LoadingFacts() {
    const [fact, setFact] = useState("");

    useEffect(() => {
        setFact(FACTS[Math.floor(Math.random() * FACTS.length)]);

        const interval = setInterval(() => {
            setFact(FACTS[Math.floor(Math.random() * FACTS.length)]);
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-6 relative">
                <div className="absolute inset-0 border-4 border-blue-100 dark:border-blue-900 rounded-full border-t-blue-600 animate-spin" />
                <Lightbulb className="w-8 h-8 text-blue-600 dark:text-blue-400 animate-pulse" />
            </div>

            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2 tracking-tight">
                Net-Work Yükleniyor...
            </h3>

            <div className="max-w-md bg-gray-50 dark:bg-zinc-800/50 rounded-xl p-4 border border-gray-100 dark:border-zinc-800">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center justify-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0" />
                    "{fact}"
                </p>
            </div>
        </div>
    );
}
