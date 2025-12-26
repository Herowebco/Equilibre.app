/*
  # Refactor Favorites to Use Meal Names
  
  1. Changes
    - Drop existing user_favorites table
    - Create new user_favorites table with meal_name instead of recipe_cache_id
    - This allows favoriting meals before they are cached in recipe_cache
    
  2. New Schema
    - `user_favorites`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to auth.users)
      - `meal_name` (text, not null) - Name of the favorited meal
      - `created_at` (timestamptz)
      - Unique constraint on (user_id, meal_name)
      
  3. Security
    - Enable RLS on `user_favorites` table
    - Users can read their own favorites
    - Users can insert their own favorites
    - Users can delete their own favorites
    
  4. Benefits
    - No dependency on recipe_cache
    - Users can favorite meals immediately from the meal plan
    - Simpler logic and better performance
*/

drop table if exists user_favorites cascade;

create table user_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  meal_name text not null,
  created_at timestamptz default now() not null,
  constraint unique_user_meal unique (user_id, meal_name)
);

create index if not exists idx_user_favorites_user_id on user_favorites(user_id);
create index if not exists idx_user_favorites_meal_name on user_favorites(meal_name);

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