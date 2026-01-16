# Migration Kurulum Talimatları

## ⚠️ ÖNEMLİ: Migration'lar Çalıştırılmalı!

Projenin yeni özellikleri çalışması için Supabase'de 3 migration dosyası çalıştırılmalı.

## Adım 1: Supabase Dashboard'a Git

1. [Supabase Dashboard](https://supabase.com/dashboard) aç
2. Projenizi seçin
3. Sol menüden **SQL Editor** seç

## Adım 2: Migration Dosyalarını Çalıştır

Aşağıdaki dosyaları **SIRAYLA** çalıştırın:

### 1️⃣ Notifications Migration

Dosya: `supabase/migrations/20240113_create_notifications.sql`

```bash
# Dosyayı aç ve tüm içeriği kopyala
```

SQL Editor'de:
1. "New Query" tıkla
2. Dosya içeriğini yapıştır
3. "Run" (F5) tıkla
4. ✅ "Success" mesajını gör

### 2️⃣ Messaging Migration

Dosya: `supabase/migrations/20240113_create_messaging.sql`

Aynı adımları tekrarla.

### 3️⃣ Rate Limits Migration

Dosya: `supabase/migrations/20240113_create_rate_limits.sql`

Aynı adımları tekrarla.

## Adım 3: Realtime'ı Aktifleştir

1. Dashboard > **Database** > **Replication**
2. Şu tabloları bul ve **Realtime**'ı AÇIK yap:
   - ✅ `notifications`
   - ✅ `messages`
   - ✅ `conversations`

## Adım 4: Test Et

1. Sayfayı yenile (F5)
2. "Mesaj Gönder" butonuna tıkla
3. Artık hata vermemeli!

## Sorun Giderme

### "relation does not exist" hatası
- Migration'lar çalıştırılmamış
- Yukarıdaki adımları takip et

### "permission denied" hatası
- RLS policies doğru kurulmuş mu kontrol et
- Migration dosyalarında RLS policies var

### Bildirimler gelmiyor
- Realtime aktif mi kontrol et
- Browser console'da hata var mı bak

## Hızlı Kontrol

Tablolar oluştu mu kontrol et:

```sql
-- SQL Editor'de çalıştır
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('notifications', 'messages', 'conversations', 'rate_limits');
```

4 satır dönmeli:
- notifications
- messages
- conversations
- rate_limits

## Yardım

Sorun devam ederse:
1. Browser console'u aç (F12)
2. Hata mesajını kopyala
3. Migration dosyalarının tamamının çalıştığını doğrula
