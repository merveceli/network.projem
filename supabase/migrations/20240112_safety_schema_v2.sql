-- 1. Güvenli Enum Tipi Oluşturma (Varsa hata vermez)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'content_status') THEN
        CREATE TYPE content_status AS ENUM ('draft', 'pending', 'approved', 'rejected');
    END IF;
END $$;

-- 2. Jobs Tablosunu Güncelle (Hata vermeden)
DO $$ 
BEGIN
    ALTER TABLE jobs ADD COLUMN status content_status DEFAULT 'pending';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ 
BEGIN
    ALTER TABLE jobs ADD COLUMN admin_feedback text;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- 3. Profiles Tablosunu Güncelle (Hata vermeden)
DO $$ 
BEGIN
    ALTER TABLE profiles ADD COLUMN video_url text;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ 
BEGIN
    ALTER TABLE profiles ADD COLUMN video_status content_status DEFAULT 'draft';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ 
BEGIN
    ALTER TABLE profiles ADD COLUMN is_admin boolean DEFAULT false;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- 4. Admin Kullanıcısı Ayarlama (Kendi ID'nizi buraya yazın veya panelden manuel yapın)
-- UPDATE profiles SET is_admin = true WHERE email = 'sizin@emailiniz.com';

-- 5. RLS Politikaları (Önce eskileri temizler, sonra yenisini ekler)
DROP POLICY IF EXISTS "Public can view approved jobs" ON jobs;
CREATE POLICY "Public can view approved jobs" ON jobs FOR SELECT USING (status = 'approved');

DROP POLICY IF EXISTS "Users can view own jobs" ON jobs;
CREATE POLICY "Users can view own jobs" ON jobs FOR SELECT USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Admins can view all jobs" ON jobs;
CREATE POLICY "Admins can view all jobs" ON jobs FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
);

DROP POLICY IF EXISTS "Admins can update jobs" ON jobs;
CREATE POLICY "Admins can update jobs" ON jobs FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true)
);
