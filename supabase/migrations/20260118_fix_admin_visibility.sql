-- FIX: Ensure Admins and Users can view profiles
-- This script fixes the issue where "Users" tab in Admin Panel is empty.

-- 1. Enable RLS on profiles (just in case)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 2. Drop potential conflicting restrictive policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can read all profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON profiles;

-- 3. Allow ALL authenticated users to view ALL profiles
-- (Required for: Admin Panel User List, Chat User Search, Job Listings)
CREATE POLICY "Authenticated users can read profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);

-- 4. Ensure Admins can DELETE users (Method 2: Using is_admin() function if exists, or direct check)
-- Re-defining admin deletion policy to be sure
DROP POLICY IF EXISTS "Admins can delete profiles" ON profiles;

CREATE POLICY "Admins can delete profiles"
ON profiles FOR DELETE
TO authenticated
USING (
  (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
);

-- 5. Ensure Admins can UPDATE users (Suspend, Ban, Make Admin)
DROP POLICY IF EXISTS "Admins can update profiles" ON profiles;

CREATE POLICY "Admins can update profiles"
ON profiles FOR UPDATE
TO authenticated
USING (
  (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
)
WITH CHECK (
  (SELECT is_admin FROM profiles WHERE id = auth.uid()) = true
);
