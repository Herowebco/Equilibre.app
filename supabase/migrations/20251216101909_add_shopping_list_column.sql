/*
  # Add Shopping List Column to Meal Plans

  1. Changes
    - Add `shopping_list` column to `meal_plans` table to cache generated shopping lists
    - The column stores the shopping list JSON data with categories and items
    - This prevents regenerating the list on every request (performance optimization)
    
  2. Notes
    - The shopping_list will be cleared when a new meal plan is generated
    - The shopping_list will be cleared when a meal is regenerated
    - Format: { "categories": [{ "name": "...", "items": [...] }] }
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'meal_plans' AND column_name = 'shopping_list'
  ) THEN
    ALTER TABLE meal_plans ADD COLUMN shopping_list JSONB DEFAULT NULL;
  END IF;
END $$;