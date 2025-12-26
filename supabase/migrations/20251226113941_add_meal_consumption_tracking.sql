/*
  # Add Meal Consumption Tracking

  1. Changes
    - Add `consumed_meals` column to `meal_plans` table
      - Stores JSON object with day-by-day meal consumption tracking
      - Structure: { "0": [0, 1], "1": [0], ... } where keys are day indices and values are arrays of meal indices
      - Default value: empty object {}
    - Add `daily_goals` column to `profiles` table
      - Stores calculated daily nutritional goals (calories, protein, carbs, fats)
      - Structure: { "calories": 2000, "protein": 150, "carbs": 200, "fats": 65 }

  2. Purpose
    - Enable users to mark meals as consumed
    - Track daily nutritional intake vs goals
    - Support interactive dashboard with progress tracking

  3. Notes
    - consumed_meals uses JSONB for efficient querying
    - daily_goals calculated based on user profile (age, weight, activity level, goal)
*/

-- Add consumed_meals column to meal_plans table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meal_plans' AND column_name = 'consumed_meals'
  ) THEN
    ALTER TABLE meal_plans ADD COLUMN consumed_meals JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add daily_goals column to profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'daily_goals'
  ) THEN
    ALTER TABLE profiles ADD COLUMN daily_goals JSONB DEFAULT NULL;
  END IF;
END $$;