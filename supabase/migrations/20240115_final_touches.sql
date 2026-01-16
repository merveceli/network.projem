-- Final Touches Migration

-- 1. Profiles Table Updates
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS cv_url text,
ADD COLUMN IF NOT EXISTS is_secure boolean DEFAULT true, -- default to true, can be flagged as suspicious
ADD COLUMN IF NOT EXISTS is_suspicious boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS fast_responder boolean DEFAULT false;

-- 2. Jobs Table Updates (for diversity and urgency)
-- Note: 'category' already exists, we will update types in the UI. 
-- Adding urgency and images columns.
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS urgency text DEFAULT 'normal' CHECK (urgency IN ('normal', 'urgent')),
ADD COLUMN IF NOT EXISTS images text[] DEFAULT '{}';

-- 3. Profile Comments Table
CREATE TABLE IF NOT EXISTS profile_comments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    author_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
    content text NOT NULL,
    status content_status DEFAULT 'pending',
    created_at timestamptz DEFAULT now()
);

-- Enable RLS for profile_comments
ALTER TABLE profile_comments ENABLE ROW LEVEL SECURITY;

-- Policies for profile_comments
CREATE POLICY "Public can view approved comments"
ON profile_comments FOR SELECT
USING (status = 'approved');

CREATE POLICY "Users can insert own comments"
ON profile_comments FOR INSERT
WITH CHECK (auth.uid() = author_id);

CREATE POLICY "Admins can manage all comments"
ON profile_comments FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.is_admin = true
    )
);

-- 4. Storage Buckets
-- Create 'cvs' bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('cvs', 'cvs', true)
ON CONFLICT (id) DO NOTHING;

-- Create 'job-images' bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('job-images', 'job-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies for 'cvs'
CREATE POLICY "Public CVs are viewable by everyone"
ON storage.objects FOR SELECT
USING ( bucket_id = 'cvs' );

CREATE POLICY "Users can upload own CV"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'cvs' AND
    auth.uid() = (storage.foldername(name))[1]::uuid
);

CREATE POLICY "Users can delete own CV"
ON storage.objects FOR DELETE
USING (
    bucket_id = 'cvs' AND
    auth.uid() = (storage.foldername(name))[1]::uuid
);

-- Storage Policies for 'job-images'
CREATE POLICY "Public job images are viewable by everyone"
ON storage.objects FOR SELECT
USING ( bucket_id = 'job-images' );

CREATE POLICY "Users can upload job images"
ON storage.objects FOR INSERT
WITH CHECK (
    bucket_id = 'job-images' AND
    auth.uid() = (storage.foldername(name))[1]::uuid
);
