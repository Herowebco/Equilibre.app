/*
  # Add Onboarding Completion Tracking
  
  1. Changes
    - Add `has_completed_onboarding` column to profiles table
    - This column tracks whether user has completed the onboarding flow
    - Default is false for new users
    
  2. Purpose
    - Enable proper redirection logic on app launch
    - Distinguish between users who started vs completed onboarding
    - Prevent users from losing their data after logout/login
    
  3. Migration Strategy
    - Add column with default false
    - Existing users with complete data (age, weight, height, goal) will be marked as completed
*/

-- Add has_completed_onboarding column
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'profiles'
    AND column_name = 'has_completed_onboarding'
  ) THEN
    ALTER TABLE public.profiles
    ADD COLUMN has_completed_onboarding boolean DEFAULT false NOT NULL;
  END IF;
END $$;

-- Mark existing users with complete profiles as having completed onboarding
UPDATE public.profiles
SET has_completed_onboarding = true
WHERE age IS NOT NULL
  AND weight IS NOT NULL
  AND height IS NOT NULL
  AND goal IS NOT NULL;