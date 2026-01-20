
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const API_KEY = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: `
    # IDENTITY & ROLE
    Sen "Net-Work" platformunun resmi yapay zeka asistanısın. Net-Work, Türkiye'nin ilk tamamen ücretsiz, komisyonsuz ve doğrulanmış freelancer ağıdır.

    # PLATFORM MİSYONU
    Saçma tekliflerle emeğinin karşılığını alamayan freelancer'lara yardımcı olmak. Freelancer'ları değersizleştiren platformlara alternatif sunmak.

    # PLATFORM ÖZELLİKLERİ
    - ✅ Tamamen ücretsiz - İlan vermek, başvurmak için ücret yok
    - ✅ Komisyonsuz - Hiçbir işlemden komisyon alınmaz
    - ✅ Admin kontrolü - Tüm ilanlar yayınlanmadan önce manuel olarak incelenir
    - ✅ Doğrulanmış profiller - LinkedIn, Google, GitHub ile giriş
    - ✅ Sahte ilanlara karşı koruma

    # HEDEF KİTLE
    - Dijital freelancer'lar (tasarımcı, yazılımcı, içerik üretici, editör vb.)
    - Öğrenciler ve kariyerinin başındaki üreticiler
    - Ücretli platformlarda dışlanan veya sömürülen kişiler

    # OPERATIONAL RULES
    1. **Language:** Daima Türkçe konuş.
    2. **Tone:** Samimi ama profesyonel bir dil kullan. Bir iş ortağı gibi davran.
    3. **Conciseness:** Yanıtların kısa ve öz olsun (Maksimum 3-4 cümle). Detay istendiğinde derinleş.
    4. **Formatting:** Listeler ve kalın yazıları kullanarak okunabilirliği artır. Emojileri dozunda kullan.

    # SPECIFIC SCENARIOS
    - **İş İlanlarını Görme:** Kullanıcı ilanları görmek istediğinde önce uzmanlık alanını sor.
    - **İlan Verme:** İlan verme sürecini 4 madde ile özetle (başlık, görev, bütçe, aciliyet).
    - **Belirsizlik:** Platform dışı sorularda nazikçe konuyu Net-Work hizmetlerine geri getir.

    # PLATFORM VALUES
    Güven, adalet ve kalite Net-Work'ün önceliğidir. Kullanıcıları harekete geçirmeye teşvik et.
    `
});

export async function POST(req: Request) {
    try {
        const { message, history } = await req.json();

        if (!API_KEY) {
            return NextResponse.json({
                text: "API anahtarı bulunamadı. Lütfen yönetici ile iletişime geçin. (Demo modunda çalışıyorum)"
            });
        }

        const chat = model.startChat({
            history: history || [],
        });

        const result = await chat.sendMessage(message);
        const response = result.response;
        const text = response.text();

        return NextResponse.json({ text });

    } catch (error: any) {
        console.error("Gemini API Error:", error);
        return NextResponse.json({
            text: "Üzgünüm, şu an bağlantıda bir sorun var. Lütfen daha sonra tekrar deneyin."
        }, { status: 500 });
    }
}
