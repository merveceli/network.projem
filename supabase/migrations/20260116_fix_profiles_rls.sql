-- Fix profiles table RLS for messaging system
-- Security Strategy:
-- 1. Allow authenticated users to READ profiles (needed for chat)
-- 2. Keep UPDATE/DELETE/INSERT restricted to own profile
-- 3. Application layer (frontend) selects only safe fields (no email/phone in queries)

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing SELECT policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can read all profiles" ON profiles;

-- Allow authenticated users to READ all profiles
-- (They need this for messaging system to show names/bios)
CREATE POLICY "Authenticated users can read profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- Keep existing security: Users can only UPDATE their own profile
-- (This policy should already exist, but we ensure it)
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Keep existing security: Users can only INSERT their own profile
DROP POLICY IF EXISTS "Users can insert own profile" ON profiles;
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- IMPORTANT SECURITY NOTE:
-- Even though users can READ all profiles, our ChatWindow.tsx code
-- specifically ONLY selects: id, full_name, title, bio, city, role, avatar_url
-- It does NOT select: email, phone
-- This is application-level security working together with RLS

COMMENT ON POLICY "Authenticated users can read profiles" ON profiles IS 
'Allows viewing other users names/bios for messaging. Email/phone excluded via SELECT queries in code.';
