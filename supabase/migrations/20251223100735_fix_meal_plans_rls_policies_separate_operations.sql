/*
  # Fix Meal Plans RLS Policies - Separate Operations

  1. Remove Old Policies
    - Drops any existing catch-all policies that may cause conflicts
    - Clears "Gérer ses propres plans" and "Plans par propriétaire"

  2. Create Explicit Policies (Best Practice)
    - **SELECT Policy**: Users can read only their own meal plans
    - **INSERT Policy**: Users can create plans only for themselves
      - Uses WITH CHECK to validate ownership on creation
      - This fixes the 401 error during plan creation
    - **UPDATE Policy**: Users can modify only their own plans
    - **DELETE Policy**: Users can delete only their own plans

  3. Security Notes
    - Each operation has its own policy for clarity and security
    - INSERT uses WITH CHECK (not USING) to validate new rows
    - SELECT/UPDATE/DELETE use USING to check existing rows
    - All policies verify auth.uid() = user_id for ownership

  4. Important Notes
    - Separate policies are more maintainable than FOR ALL
    - The INSERT policy WITH CHECK was critical for fixing 401 errors
    - Schema cache is refreshed for immediate effect
*/

-- Drop old catch-all policies to avoid conflicts
DROP POLICY IF EXISTS "Gérer ses propres plans" ON public.meal_plans;
DROP POLICY IF EXISTS "Plans par propriétaire" ON public.meal_plans;

-- Create explicit policy for SELECT (read)
CREATE POLICY "Lecture des plans"
  ON public.meal_plans
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create explicit policy for INSERT (create)
-- This WITH CHECK fixes the 401 error during plan creation
CREATE POLICY "Création des plans"
  ON public.meal_plans
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create explicit policy for UPDATE (modify)
CREATE POLICY "Modification des plans"
  ON public.meal_plans
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create explicit policy for DELETE (remove)
CREATE POLICY "Suppression des plans"
  ON public.meal_plans
  FOR DELETE
  USING (auth.uid() = user_id);

-- Force schema cache refresh
NOTIFY pgrst, 'reload schema';