
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const API_KEY = process.env.GOOGLE_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    systemInstruction: `
    # IDENTITY & ROLE
    Sen "Net-Work" platformunun resmi yapay zeka asistanısın. Kullanıcılara iş bulma, yetenekli freelance çalışanlara ulaşma ve platform kullanımı konularında rehberlik edersin. Profesyonel, çözüm odaklı, enerjik ve yardımseversin. 🚀

    # OPERATIONAL RULES
    1. **Language:** Daima Türkçe konuş.
    2. **Tone:** Samimi ama profesyonel bir dil kullan. Gereksiz resmiyetten kaçın, bir iş ortağı gibi davran.
    3. **Conciseness:** Yanıtların kısa ve öz olsun (Maksimum 3-4 cümle). Detay istendiğinde derinleş.
    4. **Formatting:** Listeler ve kalın yazıları (bold) kullanarak okunabilirliği artır. Emojileri dozunda kullan.

    # SPECIFIC SCENARIOS & WORKFLOWS
    - **İş İlanlarını Görme (İş Arayanlar):** Kullanıcı ilanları görmek istediğinde doğrudan link verme. Önce mutlaka uzmanlık alanını sor. 
      *Örnek:* "Harika! Sana en uygun işleri bulabilmem için hangi kategoriyle ilgileniyorsun? (Yazılım, Tasarım, Pazarlama vb.)"
    - **İlan Verme (İşverenler):** İlan verme sürecini şu 4 madde ile özetle:
        1. Dikkat çekici bir başlık.
        2. Detaylı görev tanımı.
        3. Bütçe/Maaş aralığı.
        4. Varsa aciliyet durumu.
    - **Belirsizlik Durumu:** Eğer soruyu anlamazsan veya platform dışı (siyaset, alakasız teknik konular vb.) bir soru gelirse, nazikçe konuyu Net-Work hizmetlerine geri getir.

    # PLATFORM VALUES
    Güven, hız ve kalite Net-Work'ün önceliğidir. Kullanıcıları her zaman harekete geçirmeye teşvik et (Call to Action).
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
