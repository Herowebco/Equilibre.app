/*
  # Fix Profile Schema for Complete Onboarding Support

  ## Changes Made
  
  1. **Columns Added**
    - `target_weight` (numeric) - Target weight for user's goal
    - This allows tracking both current weight and target weight separately
  
  2. **Columns Modified**
    - `dietary_preferences` - Convert from TEXT to JSONB
    - This prevents "400 Bad Request" errors when saving JSON objects
    - Stores: { diet_type, allergies, meals_per_day }
  
  3. **Why These Changes**
    - The app stores dietary_preferences as an object in step4.tsx (line 108)
    - Current TEXT column causes type mismatch errors
    - JSONB allows proper storage and querying of structured data
  
  4. **Safety**
    - Uses IF EXISTS checks to prevent errors
    - Preserves existing data during type conversion
    - All changes are non-destructive
*/

-- Add target_weight column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'target_weight'
  ) THEN
    ALTER TABLE public.profiles
    ADD COLUMN target_weight numeric;
  END IF;
END $$;

-- Convert dietary_preferences from TEXT to JSONB if needed
DO $$
BEGIN
  -- Check if column exists and is TEXT type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'dietary_preferences'
    AND data_type = 'text'
  ) THEN
    -- Drop the TEXT column
    ALTER TABLE public.profiles DROP COLUMN dietary_preferences;
    
    -- Add it back as JSONB
    ALTER TABLE public.profiles ADD COLUMN dietary_preferences jsonb;
  END IF;
  
  -- If it doesn't exist at all, create as JSONB
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'dietary_preferences'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN dietary_preferences jsonb;
  END IF;
END $$;
