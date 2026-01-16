"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot } from "lucide-react";
import { useRouter } from "next/navigation";

interface Message {
    id: string;
    text: string;
    isUser: boolean;
    type?: 'text' | 'options';
    options?: { label: string; action: string }[];
}

export default function AiAssistant() {
    const [isOpen, setIsOpen] = useState(false);
    const [userName, setUserName] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([
        {
            id: '1',
            text: "Merhaba! Ben Net-Work Asistan. 👋 Size daha iyi yardımcı olabilmem için isminizi öğrenebilir miyim?",
            isUser: false
        }
    ]);
    const [isTyping, setIsTyping] = useState(false);
    const [input, setInput] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    const handleSend = async (text: string) => {
        if (!text.trim()) return;

        const userMsg: Message = { id: Date.now().toString(), text, isUser: true };
        setMessages(prev => [...prev, userMsg]);
        setInput("");
        setIsTyping(true);

        // --- 1. PERSONALIZATION FLOW (Name Asking) ---
        if (!userName) {
            setTimeout(() => {
                const name = text.trim();
                // Simple heuristic logic for gender-neutral address or just using the name
                // "Hanım/Bey" logic is hard to guess automatically without asking gender, 
                // so we will be polite but neutral or just use the name warmly.
                // User asked: "Merve dedi o zmn Merve hanım diye hitap etsin" -> We can try a simple check or just use "Merve Hanım/Bey" 
                // However, determining Hanım/Bey programmatically is error-prone. 
                // Let's stick to a very warm welcome.

                setUserName(name);

                const welcomeMsg: Message = {
                    id: Date.now() + 1 + "",
                    text: `Memnun oldum ${name} Hanım/Bey! 🌸 Size nasıl yardımcı olabilirim?`,
                    isUser: false,
                    type: 'options',
                    options: [
                        { label: "🔍 İş Arıyorum", action: "job_seeker" },
                        { label: "📢 İlan Nasıl Verilir?", action: "job_posting_tips" },
                        { label: "🤔 Bana Özgü Tavsiyeler", action: "ask_ai" }
                    ]
                };
                setMessages(prev => [...prev, welcomeMsg]);
                setIsTyping(false);
            }, 800);
            return;
        }

        // --- 2. NORMAL FLOW (Gemini & Navigation) ---
        try {
            // Check for specific keywords to trigger local logic
            const lowerText = text.toLowerCase();
            if (lowerText.includes("iş") && (lowerText.includes("arıyorum") || lowerText.includes("bul"))) {
                handleOptionClick("job_seeker", text);
                return;
            }

            // Call API
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    message: text,
                    // Send history but exclude the name-asking part to keep context clean or include it
                    history: messages
                        .filter(m => m.type !== 'options')
                        .map(m => ({
                            role: m.isUser ? "user" : "model",
                            parts: [{ text: m.text }]
                        }))
                })
            });

            const data = await response.json();

            setMessages(prev => [...prev, {
                id: Date.now() + 1 + "",
                text: data.text || "Anlaşılamadı.",
                isUser: false
            }]);

        } catch (err) {
            setMessages(prev => [...prev, {
                id: Date.now() + 1 + "",
                text: "Bağlantı hatası. Lütfen tekrar deneyin.",
                isUser: false
            }]);
        } finally {
            setIsTyping(false);
        }
    };

    const handleOptionClick = async (action: string, label: string) => {
        const userMsg: Message = { id: Date.now().toString(), text: label, isUser: true };
        setMessages(prev => [...prev, userMsg]);
        setIsTyping(true);

        setTimeout(() => {
            let aiResponse: Message;

            switch (action) {
                case "job_seeker":
                    aiResponse = {
                        id: Date.now() + 1 + "",
                        text: `Hangi alanda iş arıyorsunuz ${userName || ''}? Sizi doğru ilanlara yönlendirebilirim. 👇`,
                        isUser: false,
                        type: 'options',
                        options: [
                            { label: "💻 Yazılım", action: "filter_software" },
                            { label: "🎨 Tasarım", action: "filter_design" },
                            { label: "📊 Pazarlama", action: "filter_marketing" },
                            { label: "🔎 Tümünü Göster", action: "goto_jobs" }
                        ]
                    };
                    break;
                case "job_posting_tips":
                    aiResponse = {
                        id: Date.now() + 1 + "",
                        text: "Etkileyici bir ilan vermek için şu ipuçlarına dikkat etmelisin:\n\n1. **Net Başlık:** 'Yazılımcı Arıyoruz' yerine 'Senior React Developer' yaz.\n2. **Detaylı Tanım:** Beklentilerini madde madde yaz.\n3. **Maaş Aralığı:** Şeffaflık her zaman kazandırır.\n\nİlan vermeye hazır mısın?",
                        isUser: false,
                        type: 'options',
                        options: [
                            { label: "📝 İlan Oluştur", action: "goto_post_job" },
                            { label: "🔙 Ana Menü", action: "reset" }
                        ]
                    };
                    break;
                case "ask_ai":
                    aiResponse = {
                        id: Date.now() + 1 + "",
                        text: `Elbette ${userName || ''}, ben buradayım! Ne sormak istersin? (Örn: 'Profilimi nasıl geliştiririm?')`,
                        isUser: false
                    };
                    break;
                case "filter_software":
                    router.push("/ilanlar?category=Yazılım");
                    aiResponse = { id: Date.now() + 1 + "", text: "Yazılım ilanlarını listeliyorum... 🚀", isUser: false };
                    break;
                case "filter_design":
                    router.push("/ilanlar?category=Tasarım");
                    aiResponse = { id: Date.now() + 1 + "", text: "Tasarım dünyasına giriliyor... 🎨", isUser: false };
                    break;
                case "filter_marketing":
                    router.push("/ilanlar?category=Pazarlama");
                    aiResponse = { id: Date.now() + 1 + "", text: "Pazarlama ilanları açılıyor... 📊", isUser: false };
                    break;
                case "goto_jobs":
                    router.push("/ilanlar");
                    aiResponse = { id: Date.now() + 1 + "", text: "Tüm ilanlara yönlendiriyorum. Başarılar! 🍀", isUser: false };
                    break;
                case "goto_post_job":
                    router.push("/yeni-ilan");
                    aiResponse = { id: Date.now() + 1 + "", text: "Harika! İlan oluşturma sayfası açılıyor. ✨", isUser: false };
                    break;
                case "reset":
                    aiResponse = {
                        id: Date.now() + 1 + "",
                        text: `Ana menüye döndük ${userName || ''}. Size nasıl yardımcı olabilirim?`,
                        isUser: false,
                        type: 'options',
                        options: [
                            { label: "🔍 İş Arıyorum", action: "job_seeker" },
                            { label: "📢 İlan Nasıl Verilir?", action: "job_posting_tips" },
                            { label: "🤔 Bana Özgü Tavsiyeler", action: "ask_ai" }
                        ]
                    };
                    break;
                default:
                    // If action is not predefined, treat as AI prompt
                    handleSend(label);
                    return;
            }

            setIsTyping(false);
            setMessages(prev => [...prev, aiResponse]);
        }, 800);
    };

    return (
        <>
            {/* Toggle Button */}
            <motion.button
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(!isOpen)}
                className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-gradient-to-r from-[#1a1a2e] to-[#4A90A4] text-white rounded-full shadow-2xl flex items-center justify-center cursor-pointer border-4 border-white dark:border-zinc-800"
            >
                <AnimatePresence mode="wait">
                    {isOpen ? (
                        <motion.div
                            key="close"
                            initial={{ rotate: -90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: 90, opacity: 0 }}
                        >
                            <X className="w-8 h-8" />
                        </motion.div>
                    ) : (
                        <motion.div
                            key="chat"
                            initial={{ rotate: 90, opacity: 0 }}
                            animate={{ rotate: 0, opacity: 1 }}
                            exit={{ rotate: -90, opacity: 0 }}
                        >
                            <MessageCircle className="w-8 h-8" />
                            <span className="absolute top-0 right-0 -mt-1 -mr-1 flex h-4 w-4">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-green-500"></span>
                            </span>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.button>

            {/* Chat Window */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        className="fixed bottom-28 right-6 z-50 w-[90vw] md:w-[380px] bg-white dark:bg-zinc-900 rounded-[30px] shadow-2xl border border-gray-100 dark:border-zinc-700 overflow-hidden flex flex-col max-h-[600px]"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-[#1a1a2e] to-[#2a2a4e] p-6 flex flex-col gap-1 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none" />

                            <div className="flex items-center gap-3 relative z-10">
                                <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
                                    <Bot className="w-6 h-6 text-[#4A90A4]" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg">Net-Work Asistan ⚡</h3>
                                    <div className="flex items-center gap-1.5 text-xs text-white/70">
                                        <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                                        Yapay Zeka Destekli
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 p-6 overflow-y-auto bg-gray-50 dark:bg-black/20 space-y-4 min-h-[350px] max-h-[400px]">
                            {messages.map((msg) => (
                                <div key={msg.id} className={`flex flex-col ${msg.isUser ? 'items-end' : 'items-start'}`}>
                                    <div
                                        className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${msg.isUser
                                                ? 'bg-[#1a1a2e] text-white rounded-tr-none'
                                                : 'bg-white dark:bg-zinc-800 border border-gray-100 dark:border-zinc-700 text-gray-700 dark:text-gray-200 rounded-tl-none shadow-sm'
                                            }`}
                                    >
                                        {msg.text}
                                    </div>
                                    {/* Options */}
                                    {!msg.isUser && msg.type === 'options' && msg.options && (
                                        <div className="flex flex-wrap gap-2 mt-3 w-full">
                                            {msg.options.map((opt, i) => (
                                                <button
                                                    key={i}
                                                    onClick={() => handleOptionClick(opt.action, opt.label)}
                                                    className="bg-white dark:bg-zinc-800 border border-[#4A90A4]/30 hover:border-[#4A90A4] text-[#1a1a2e] dark:text-white px-4 py-2 rounded-xl text-xs font-bold transition-all hover:bg-[#4A90A4]/10 hover:scale-105"
                                                >
                                                    {opt.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {isTyping && (
                                <div className="flex items-center gap-1 bg-white dark:bg-zinc-800 p-3 rounded-2xl w-fit shadow-sm">
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>

                        {/* Input Area */}
                        <div className="p-4 bg-white dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800">
                            <form
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    handleSend(input);
                                }}
                                className="relative flex items-center gap-2"
                            >
                                <input
                                    type="text"
                                    placeholder={userName ? "Bir şeyler sorun..." : "Adınızı yazınız..."}
                                    className="w-full bg-gray-50 dark:bg-zinc-950 border border-gray-200 dark:border-zinc-800 rounded-2xl px-5 py-4 pr-12 outline-none focus:border-[#4A90A4] transition-colors dark:text-white"
                                    value={input}
                                    onChange={(e) => setInput(e.target.value)}
                                />
                                <button
                                    type="submit"
                                    disabled={!input.trim() || isTyping}
                                    className="absolute right-2 p-2 bg-[#1a1a2e] text-white rounded-xl hover:bg-black transition-colors disabled:opacity-50"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
