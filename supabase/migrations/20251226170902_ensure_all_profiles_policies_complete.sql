/*
  # Ensure Complete RLS Policies for Profiles Table
  
  1. Purpose
    - Verify all necessary policies exist for profiles table
    - Ensure users can perform all required operations on their own profile
  
  2. Policies Needed
    - SELECT: Read own profile (already exists from previous migration)
    - INSERT: Create own profile (already exists from previous migration)
    - UPDATE: Modify own profile (ensuring it exists with proper WITH CHECK)
    - DELETE: Not needed (profiles should not be deleted directly)
  
  3. UPDATE Policy
    - Must have both USING (who can attempt the update) and WITH CHECK (validation after update)
    - This ensures users can only update their own profile AND the updated data still belongs to them
*/

-- Drop existing UPDATE policies to avoid conflicts
DROP POLICY IF EXISTS "Modif profil par soi-même" ON public.profiles;
DROP POLICY IF EXISTS "Modif perso" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create UPDATE policy with both USING and WITH CHECK
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
