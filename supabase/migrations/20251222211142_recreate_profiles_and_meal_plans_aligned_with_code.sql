/*
  # Recreate Profiles and Meal Plans Tables Aligned with Application Code

  1. Complete Database Reset
    - Drop all existing triggers, functions, and tables
    - Ensures clean slate without conflicts

  2. Profiles Table Structure
    - `id` (uuid, primary key) - References auth.users
    - `updated_at` (timestamptz) - Auto-updated timestamp with UTC timezone
    
    **Identity:**
    - `full_name` (text) - User's full name (min 3 characters)
    - `avatar_url` (text) - Profile picture URL
    
    **Physical Data:**
    - `age` (integer) - User's age in years
    - `gender` (text) - Gender
    - `height` (numeric) - Height in centimeters
    - `weight` (numeric) - Weight in kilograms
    - `activity_level` (text) - Physical activity level
    
    **Nutritional Preferences:**
    - `dietary_preferences` (text) - Renamed from 'diet' to match application code
    - `allergies` (text) - Food allergies
    - `meals_per_day` (integer) - Number of meals per day (default 3)
    
    **Goals:**
    - `goal` (text) - Weight/fitness goal
    - `target_calories` (integer) - Daily caloric target
    - `macros` (jsonb) - Macronutrient breakdown

  3. Meal Plans Table Structure
    - `id` (uuid, primary key) - Auto-generated UUID
    - `user_id` (uuid) - References auth.users
    - `created_at` (timestamptz) - Creation timestamp
    - `content` (jsonb) - Meal plan data
    - `status` (text) - 'active', 'archived', etc. (default 'active')
    - `start_date` (date) - Plan start date
    - `end_date` (date) - Plan end date

  4. Security
    - Enable RLS on both tables
    - Profiles: Public read, users can update/insert their own
    - Meal Plans: Users can perform all operations on their own plans only

  5. Trigger
    - Automatically creates profile entry when new user signs up
    - Captures full_name and avatar_url from Google Sign-In metadata

  6. Important Notes
    - This migration provides a clean slate by dropping all existing objects
    - Field name `dietary_preferences` aligns with application code
    - Schema cache is refreshed for immediate effect
*/

-- Complete cleanup to avoid conflicts
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();
DROP TABLE IF EXISTS public.meal_plans CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Create profiles table aligned with application code
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  
  -- Identity
  full_name text,
  avatar_url text,
  
  -- Physical data
  age integer,
  gender text,
  height numeric,
  weight numeric,
  activity_level text,
  
  -- Nutritional preferences (renamed to match code)
  dietary_preferences text,
  allergies text,
  meals_per_day integer DEFAULT 3,
  
  -- Goals
  goal text,
  target_calories integer,
  macros jsonb,
  
  CONSTRAINT username_length CHECK (char_length(full_name) >= 3)
);

-- Create meal plans table
CREATE TABLE public.meal_plans (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  content jsonb,
  status text DEFAULT 'active',
  start_date date,
  end_date date
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Lecture publique profils" 
  ON public.profiles FOR SELECT 
  USING (true);

CREATE POLICY "Modif profil par soi-même" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Insert profil par soi-même" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Meal plans policies
CREATE POLICY "Plans par propriétaire" 
  ON public.meal_plans FOR ALL 
  USING (auth.uid() = user_id);

-- Trigger function: Automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Force schema cache refresh
NOTIFY pgrst, 'reload schema';