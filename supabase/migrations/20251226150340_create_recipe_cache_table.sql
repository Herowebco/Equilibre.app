/*
  # Create Recipe Cache Table

  1. New Tables
    - `recipe_cache`
      - `id` (uuid, primary key)
      - `meal_name` (text, not null) - Name of the meal/recipe
      - `diet_profile` (text) - Diet type like "Végétarien", "Sans Gluten", etc.
      - `content` (jsonb, not null) - Complete recipe JSON with ingredients, instructions, macros
      - `created_at` (timestamptz) - Cache creation timestamp

  2. Security
    - Enable RLS on `recipe_cache` table
    - Add public read access policy (recipes are not user-specific)
    - Add server write access policy for Edge Functions

  3. Performance
    - Create composite index on (meal_name, diet_profile) for fast lookups
*/

create table if not exists recipe_cache (
  id uuid primary key default gen_random_uuid(),
  meal_name text not null,
  diet_profile text,
  content jsonb not null,
  created_at timestamptz default now() not null
);

create index if not exists idx_recipe_cache_lookup on recipe_cache(meal_name, diet_profile);

alter table recipe_cache enable row level security;

create policy "Public read access"
  on recipe_cache
  for select
  using (true);

create policy "Server write access"
  on recipe_cache
  for insert
  with check (true);