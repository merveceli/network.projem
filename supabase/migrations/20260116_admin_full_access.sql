-- Admin Full Access Policies
-- This migration grants "is_admin" users the power to:
-- 1. UPDATE any profile (to suspend/ban users or change roles)
-- 2. DELETE any job (to remove spam/illegal content)

-- Helper function to check if current user is admin (prevents recursion in some cases)
-- MOVED TO PUBLIC SCHEMA to avoid permission errors
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
    AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 1. Job Moderation (DELETE)
CREATE POLICY "Admins can delete any job"
ON jobs
FOR DELETE
TO authenticated
USING (public.is_admin());

-- 2. Profile Management (UPDATE - e.g. Suspend User)
-- Note: 'Users can update own profile' already exists. We add an OR condition effectively via a new policy.
CREATE POLICY "Admins can update any profile"
ON profiles
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 3. Report Management (UPDATE status)
CREATE POLICY "Admins can update reports"
ON reports
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- 4. Comment Management (UPDATE status)
CREATE POLICY "Admins can update comments"
ON profile_comments
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());
