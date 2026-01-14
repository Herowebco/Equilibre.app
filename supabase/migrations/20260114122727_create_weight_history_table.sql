/*
  # Create Weight History Table
  
  1. New Tables
    - `weight_history`
      - `id` (uuid, primary key) - Unique identifier for each weight entry
      - `user_id` (uuid, foreign key to profiles) - Reference to the user
      - `weight` (numeric, not null) - Weight value in kg
      - `date` (timestamptz, not null, default now()) - Date of weight measurement
      - `created_at` (timestamptz) - Record creation timestamp
  
  2. Security
    - Enable RLS on `weight_history` table
    - Add policy for users to SELECT their own weight history
    - Add policy for users to INSERT their own weight history
    - Add policy for users to UPDATE their own weight history (for corrections)
  
  3. Automatic Trigger
    - Create function to automatically insert weight history when profile weight changes
    - Create trigger that fires on profiles UPDATE when weight column changes
  
  4. Indexes
    - Index on user_id for fast queries
    - Index on date for chronological queries
*/

-- Create weight_history table
CREATE TABLE IF NOT EXISTS public.weight_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  weight numeric NOT NULL CHECK (weight > 0 AND weight < 500),
  date timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS weight_history_user_id_idx ON public.weight_history(user_id);
CREATE INDEX IF NOT EXISTS weight_history_date_idx ON public.weight_history(date DESC);
CREATE INDEX IF NOT EXISTS weight_history_user_date_idx ON public.weight_history(user_id, date DESC);

-- Enable RLS
ALTER TABLE public.weight_history ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own weight history
CREATE POLICY "Users can select own weight history"
  ON public.weight_history
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own weight history
CREATE POLICY "Users can insert own weight history"
  ON public.weight_history
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own weight history (for corrections)
CREATE POLICY "Users can update own weight history"
  ON public.weight_history
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can delete their own weight history entries
CREATE POLICY "Users can delete own weight history"
  ON public.weight_history
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Function: Automatically insert weight history when profile weight changes
CREATE OR REPLACE FUNCTION public.insert_weight_history()
RETURNS TRIGGER AS $$
BEGIN
  -- Only insert if weight actually changed and is not null
  IF NEW.weight IS NOT NULL AND (OLD.weight IS NULL OR NEW.weight != OLD.weight) THEN
    INSERT INTO public.weight_history (user_id, weight, date)
    VALUES (NEW.id, NEW.weight, now());
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Fire after profiles UPDATE
DROP TRIGGER IF EXISTS trigger_insert_weight_history ON public.profiles;
CREATE TRIGGER trigger_insert_weight_history
  AFTER UPDATE OF weight ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.insert_weight_history();

-- Insert initial weight history for existing users with weight data
INSERT INTO public.weight_history (user_id, weight, date)
SELECT id, weight, updated_at
FROM public.profiles
WHERE weight IS NOT NULL
ON CONFLICT DO NOTHING;