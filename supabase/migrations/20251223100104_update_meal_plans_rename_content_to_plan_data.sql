/*
  # Update Meal Plans Table - Rename content to plan_data

  1. Drop and Recreate Meal Plans
    - Drops existing meal_plans table without affecting profiles
    - Recreates with corrected column name to match application code

  2. Meal Plans Table Structure
    - `id` (uuid, primary key) - Auto-generated UUID
    - `user_id` (uuid) - References auth.users
    - `created_at` (timestamptz) - Creation timestamp with UTC timezone
    - `plan_data` (jsonb) - **RENAMED from 'content'** - Stores meal plan data
    - `status` (text) - 'active', 'archived', etc. (default 'active')
    - `start_date` (date) - Plan start date
    - `end_date` (date) - Plan end date

  3. Security
    - Enable RLS on meal_plans table
    - Users can perform all CRUD operations on their own plans only

  4. Important Notes
    - Column name `plan_data` aligns with application code
    - Profiles table remains untouched
    - Schema cache is refreshed for immediate effect
*/

-- Drop meal_plans table only (profiles stays intact)
DROP TABLE IF EXISTS public.meal_plans CASCADE;

-- Recreate meal_plans with 'plan_data' instead of 'content'
CREATE TABLE public.meal_plans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  
  -- Renamed column to match application code
  plan_data jsonb,
  
  status text DEFAULT 'active',
  start_date date,
  end_date date
);

-- Enable Row Level Security
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;

-- Create policy: users manage their own plans
CREATE POLICY "Gérer ses propres plans" 
  ON public.meal_plans 
  FOR ALL 
  USING (auth.uid() = user_id);

-- Force schema cache refresh
NOTIFY pgrst, 'reload schema';