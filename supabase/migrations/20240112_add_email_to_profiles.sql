-- 1. Profiles tablosuna email kolonu ekle
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;

-- 2. Mevcut kullanıcıların email bilgilerini auth.users tablosundan kopyala
UPDATE profiles
SET email = auth.users.email
FROM auth.users
WHERE profiles.id = auth.users.id
AND profiles.email IS NULL;

-- 3. Trigger Fonksiyonunu Güncelle (Yeni kullanıcı kayıtlarında email'i de eklesin)
-- Not: Bu fonksiyonun adı projenizde farklı olabilir, standart Supabase trigger'ı varsayıyoruz.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, email, avatar_url)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    COALESCE(new.raw_user_meta_data->>'role', 'freelancer'),
    new.email, -- Email artık buraya da ekleniyor
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger'ı yeniden oluşturmaya gerek yok, fonksiyon güncellendiği için bir dahaki kayıtta çalışacaktır.

-- 4. Admin Yetkisi Verme İşi (Email kolonu artık var olduğu için bu çalışır)
UPDATE profiles
SET is_admin = true
WHERE email = 'ismervecelik@gmail.com'; 
-- Buraya kendi emailinizi yazın. Eğer yukarıdaki kod çalıştıysa emailiniz profile gelmiştir.
