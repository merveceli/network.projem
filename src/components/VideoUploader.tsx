'use client';

import { useState, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';

interface VideoUploaderProps {
    userId: string;
    existingVideoUrl?: string | null;
    onUploadComplete: (url: string) => void;
}

export default function VideoUploader({ userId, existingVideoUrl, onUploadComplete }: VideoUploaderProps) {
    const supabase = createClient();
    const [uploading, setUploading] = useState(false);
    const [videoUrl, setVideoUrl] = useState<string | null>(existingVideoUrl || null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [consentGiven, setConsentGiven] = useState(false);
    const [aiUsed, setAiUsed] = useState(false);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            if (!consentGiven) {
                alert('Lütfen yasal uyarıyı onaylayın!');
                if (fileInputRef.current) fileInputRef.current.value = '';
                return;
            }

            setUploading(true);
            const file = event.target.files?.[0];
            if (!file) return;

            // Dosya boyutu kontrolü (max 50MB)
            if (file.size > 50 * 1024 * 1024) {
                alert('Video boyutu 50MB\'dan küçük olmalıdır!');
                return;
            }

            // Dosya tipi kontrolü
            if (!file.type.startsWith('video/')) {
                alert('Lütfen geçerli bir video dosyası seçin!');
                return;
            }

            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}/${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            // Yükleme işlemi
            const { error: uploadError } = await supabase.storage
                .from('videos')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false,
                    contentType: file.type,
                    // Metadata saklamak istersek buraya ekleyebiliriz
                });

            if (uploadError) {
                throw uploadError;
            }

            // Public URL al
            const { data: { publicUrl } } = supabase.storage
                .from('videos')
                .getPublicUrl(filePath);

            setVideoUrl(publicUrl);
            onUploadComplete(publicUrl);
            alert(`Video başarıyla yüklendi! ${aiUsed ? '(Yapay Zeka destekli içerik olarak işaretlendi)' : ''} Onay sürecinden sonra profilinizde yayınlanacak.`);

        } catch (error: any) {
            console.error('Yükleme hatası:', error);
            alert('Video yüklenirken bir hata oluştu: ' + error.message);
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    return (
        <div className="space-y-4">
            {!videoUrl && (
                <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg text-left">
                    <h4 className="font-bold text-amber-500 mb-2 text-sm">⚠️ Yasal Sorumluluk Beyanı</h4>
                    <div className="space-y-2">
                        <label className="flex items-start gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500/50"
                                checked={consentGiven}
                                onChange={(e) => setConsentGiven(e.target.checked)}
                            />
                            <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">
                                Yüklediğim videodaki ses, görüntü ve içeriklerin <strong>fikri mülkiyet haklarının bana ait olduğunu</strong> veya <strong>yasal kullanım iznimin bulunduğunu</strong> beyan ederim. Olası telif ihlallerinde tüm hukuki sorumluluğu kabul ediyorum.
                            </span>
                        </label>

                        <label className="flex items-start gap-3 cursor-pointer group">
                            <input
                                type="checkbox"
                                className="mt-1 w-4 h-4 rounded border-slate-600 bg-slate-800 text-cyan-500 focus:ring-cyan-500/50"
                                checked={aiUsed}
                                onChange={(e) => setAiUsed(e.target.checked)}
                            />
                            <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">
                                Bu video oluşturulurken <strong>Yapay Zeka (AI) teknolojilerinden</strong> faydalanılmıştır. (Ses klonlama, deepfake vb. içeriyorsa işaretleyiniz)
                            </span>
                        </label>
                    </div>
                </div>
            )}

            <div className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors bg-[#f8fafc] ${consentGiven ? 'border-[#e0e6ed] hover:border-[#3498db] cursor-pointer' : 'border-slate-700 bg-slate-900/50 opacity-50 cursor-not-allowed'}`}>
                {videoUrl ? (
                    <div className="relative">
                        <video
                            src={videoUrl}
                            controls
                            className="w-full rounded-lg max-h-[300px] bg-black"
                        />
                        <button
                            onClick={() => { setVideoUrl(null); setConsentGiven(false); }}
                            className="mt-4 text-sm text-[#3498db] font-bold hover:underline bg-white px-4 py-2 rounded-full shadow-sm"
                        >
                            Videoyu Değiştir
                        </button>
                    </div>
                ) : (
                    <div
                        className="py-8 flex flex-col items-center gap-3"
                        onClick={() => consentGiven && fileInputRef.current?.click()}
                    >
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-colors ${consentGiven ? 'bg-[#e3f2fd] text-[#3498db]' : 'bg-slate-800 text-slate-600'}`}>
                            {consentGiven ? '🎬' : '🔒'}
                        </div>
                        <div>
                            <h4 className={`font-bold m-0 ${consentGiven ? 'text-[#2c3e50]' : 'text-slate-500'}`}>
                                {consentGiven ? 'Kendini Tanıt' : 'Önce Onay Gerekli'}
                            </h4>
                            <p className="text-[#7f8c8d] text-sm m-0 mt-1">
                                {consentGiven ? 'Video yüklemek için tıklayın (Max 50MB)' : 'Yukarıdaki yasal uyarıyı onaylayınız'}
                            </p>
                        </div>
                    </div>
                )}

                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="video/*"
                    className="hidden"
                    disabled={uploading || !consentGiven}
                />

                {uploading && (
                    <div className="mt-4 text-[#3498db] font-bold animate-pulse">
                        Yükleniyor... %{(Math.random() * 100).toFixed(0)}
                    </div>
                )}
            </div>
        </div>
    );
}
