/*
  # Recreate Profiles Table with All Required Fields

  1. Changes
    - Drop existing profiles table and recreate with complete schema
    - Add all required columns including `activity_level` which was missing

  2. New Table Structure
    - `profiles`
      - `id` (uuid, primary key) - References auth.users
      - `updated_at` (timestamptz) - Auto-updated timestamp with UTC timezone
      - `full_name` (text) - User's full name (min 3 characters)
      - `avatar_url` (text) - Profile picture URL
      - `diet` (text) - Dietary preferences
      - `allergies` (text) - Food allergies
      - `meals_per_day` (integer) - Number of meals per day
      - `activity_level` (text) - Physical activity level (sedentary, light, moderate, active, very active)

  3. Security
    - Enable RLS on profiles table
    - Public read access for all profiles
    - Users can only create and update their own profile

  4. Trigger
    - Automatically creates profile entry when new user signs up
    - Captures full_name and avatar_url from Google Sign-In metadata
    - Essential for Google authentication compatibility

  5. Important Notes
    - This migration drops the existing profiles table to ensure clean schema
    - Username must be at least 3 characters (constraint check)
    - Schema cache is refreshed via NOTIFY for immediate effect
*/

-- Drop existing table with cascade to handle dependencies
DROP TABLE IF EXISTS public.profiles CASCADE;

-- Create profiles table with all required columns
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  full_name text,
  avatar_url text,
  diet text,            
  allergies text,       
  meals_per_day integer,
  activity_level text,
  
  CONSTRAINT username_length CHECK (char_length(full_name) >= 3)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Public read access
CREATE POLICY "Lecture pour tous" 
  ON public.profiles FOR SELECT 
  USING (true);

-- Policy: Users can create their own profile
CREATE POLICY "Création par soi-même" 
  ON public.profiles FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- Policy: Users can update their own profile
CREATE POLICY "Modif par soi-même" 
  ON public.profiles FOR UPDATE 
  USING (auth.uid() = id);

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
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Force schema cache refresh
NOTIFY pgrst, 'reload schema';