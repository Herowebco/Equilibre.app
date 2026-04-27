/*
  # Add missing columns and tables

  1. profiles table
     - `daily_goals` (jsonb) — stores {calories, protein, carbs, fats} computed during onboarding
     - `has_completed_onboarding` (boolean) — tracks onboarding completion
     - `target_weight` (float) — optional target weight

  2. meal_plans table
     - `consumed_meals` (jsonb) — tracks which meals have been checked off per day

  3. New table: user_favorites
     - Stores favorite meal names per user

  4. Security
     - RLS enabled on user_favorites
     - Policies for authenticated users to manage their own favorites
*/

-- Add missing columns to profiles
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'daily_goals'
  ) THEN
    ALTER TABLE profiles ADD COLUMN daily_goals jsonb DEFAULT '{"calories":2000,"protein":150,"carbs":200,"fats":65}'::jsonb;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'has_completed_onboarding'
  ) THEN
    ALTER TABLE profiles ADD COLUMN has_completed_onboarding boolean DEFAULT false;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'target_weight'
  ) THEN
    ALTER TABLE profiles ADD COLUMN target_weight double precision;
  END IF;
END $$;

-- Add consumed_meals to meal_plans if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meal_plans' AND column_name = 'consumed_meals'
  ) THEN
    ALTER TABLE meal_plans ADD COLUMN consumed_meals jsonb DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Create user_favorites table
CREATE TABLE IF NOT EXISTS user_favorites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  meal_name text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, meal_name)
);

ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own favorites"
  ON user_favorites FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON user_favorites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON user_favorites FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);
