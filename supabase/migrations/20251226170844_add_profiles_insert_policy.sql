/*
  # Add INSERT Policy for Profiles Table
  
  1. Problem
    - RLS is enabled on profiles table
    - Missing or lost INSERT policy prevents new users from creating their profile
    - Results in "Database error saving new user" during signup
  
  2. Solution
    - Add INSERT policy that allows users to create their own profile row
    - Policy checks that auth.uid() matches the id being inserted
  
  3. Policy Details
    - Policy Name: "Users can insert own profile"
    - Operation: INSERT
    - Target: authenticated users
    - Restriction: auth.uid() = id (users can only insert their own row)
  
  4. Note
    - The trigger handle_new_user() uses SECURITY DEFINER and should bypass RLS
    - However, this policy ensures users can also manually insert if needed
    - Provides defense in depth for profile creation
*/

-- Drop existing INSERT policy if it exists (to avoid conflicts)
DROP POLICY IF EXISTS "Insert profil par soi-même" ON public.profiles;
DROP POLICY IF EXISTS "Création perso" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Create INSERT policy for authenticated users
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);
