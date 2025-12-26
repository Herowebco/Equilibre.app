/*
  # Create Favorites Table

  1. New Tables
    - `user_favorites`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `recipe_cache_id` (uuid, foreign key to recipe_cache)
      - `created_at` (timestamptz)
      - Unique constraint on (user_id, recipe_cache_id) to prevent duplicates

  2. Security
    - Enable RLS on `user_favorites` table
    - Users can read their own favorites
    - Users can insert their own favorites
    - Users can delete their own favorites

  3. Indexes
    - Index on user_id for fast lookup
    - Index on recipe_cache_id for fast joins

  4. Purpose
    - Allow users to save their favorite recipes
    - Support quick access to favorites in profile
    - Enable heart icon toggle on recipe cards
*/

create table if not exists user_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  recipe_cache_id uuid references recipe_cache(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  constraint unique_user_recipe unique (user_id, recipe_cache_id)
);

create index if not exists idx_user_favorites_user_id on user_favorites(user_id);
create index if not exists idx_user_favorites_recipe_id on user_favorites(recipe_cache_id);

alter table user_favorites enable row level security;

create policy "Users can read own favorites"
  on user_favorites
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "Users can insert own favorites"
  on user_favorites
  for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "Users can delete own favorites"
  on user_favorites
  for delete
  to authenticated
  using (auth.uid() = user_id);