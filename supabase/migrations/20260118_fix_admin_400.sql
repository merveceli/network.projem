-- FIX: Missing 'created_at' column causing 400 Error in Admin Panel

-- 1. Add created_at column if it does not exist
-- We default to now() so existing users have a value (though not their true historical sign-up date, it fixes the crash)
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();

-- 2. Add updated_at if missing too, just in case
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 3. Re-apply the visibility fix just to be absolutely sure
DROP POLICY IF EXISTS "Authenticated users can read profiles" ON profiles;
CREATE POLICY "Authenticated users can read profiles"
ON profiles FOR SELECT
TO authenticated
USING (true);
