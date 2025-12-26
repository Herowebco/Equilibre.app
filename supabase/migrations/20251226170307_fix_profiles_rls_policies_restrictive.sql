/*
  # Fix Profiles RLS Policies - Restrictive Access
  
  1. Problem
    - Current SELECT policy "Lecture publique profils" uses USING (true)
    - This allows ANYONE (even unauthenticated users) to read ALL profiles
    - This is a security concern and may cause issues with auth state
  
  2. Solution
    - Drop the overly-permissive public SELECT policy
    - Create a new restrictive SELECT policy
    - Only authenticated users can read their OWN profile data
  
  3. New Policy
    - Policy Name: "Users can read own profile"
    - Operation: SELECT
    - Target: authenticated users only
    - Restriction: auth.uid() = id (users can only read their own row)
  
  4. Benefits
    - Prevents unauthorized access to user data
    - Ensures profileComplete state updates work correctly
    - Follows principle of least privilege
*/

-- Drop the existing overly-permissive SELECT policy
DROP POLICY IF EXISTS "Lecture publique profils" ON public.profiles;
DROP POLICY IF EXISTS "Lecture publique" ON public.profiles;

-- Create restrictive SELECT policy
CREATE POLICY "Users can read own profile"
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);
