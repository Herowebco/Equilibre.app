/*
  # Create Profiles Table with Google Sign-In Support

  1. New Tables
    - `profiles`
      - `id` (uuid, primary key) - References auth.users
      - `updated_at` (timestamptz) - Last update timestamp
      - `diet` (text) - Dietary preferences
      - `allergies` (text) - Food allergies
      - `meals_per_day` (integer) - Number of meals per day
      - `full_name` (text) - User's full name
      - `avatar_url` (text) - Profile picture URL (captured from Google Sign-In)

  2. Security
    - Enable RLS on profiles table
    - Policy: Public read access for all profiles
    - Policy: Users can only update their own profile
    - Policy: Users can only insert their own profile

  3. Trigger
    - Automatically creates profile entry when new user signs up
    - Captures full_name and avatar_url from Google Sign-In metadata
    - This is essential for Google authentication to work properly
*/

-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  updated_at timestamp with time zone,
  diet text,
  allergies text,
  meals_per_day integer,
  full_name text,
  avatar_url text
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Policy: Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Trigger function: Automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'avatar_url'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();