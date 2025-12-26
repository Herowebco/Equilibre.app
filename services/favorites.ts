import { supabase } from '@/lib/supabase';

export interface FavoriteRecipe {
  id: string;
  meal_name: string;
  content?: {
    ingredients: any[];
    instructions: string[];
    prep_time: string;
    cook_time: string;
    macros_detailed?: {
      protein: string;
      carbs: string;
      fat: string;
      fiber: string;
    };
  };
  created_at: string;
}

export async function checkIsFavorite(
  userId: string,
  mealName: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('meal_name', mealName)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  } catch (error) {
    console.error('Error checking favorite:', error);
    return false;
  }
}

export async function addToFavorites(
  userId: string,
  mealName: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_favorites')
      .insert({
        user_id: userId,
        meal_name: mealName,
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error adding to favorites:', error);
    return false;
  }
}

export async function removeFromFavorites(
  userId: string,
  mealName: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('meal_name', mealName);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error removing from favorites:', error);
    return false;
  }
}

export async function toggleFavorite(
  userId: string,
  mealName: string
): Promise<boolean> {
  const isFavorite = await checkIsFavorite(userId, mealName);

  if (isFavorite) {
    return await removeFromFavorites(userId, mealName);
  } else {
    return await addToFavorites(userId, mealName);
  }
}

export async function getUserFavorites(userId: string): Promise<FavoriteRecipe[]> {
  try {
    const { data: favorites, error } = await supabase
      .from('user_favorites')
      .select('id, meal_name, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!favorites) return [];

    const results: FavoriteRecipe[] = await Promise.all(
      favorites.map(async (fav) => {
        const { data: recipe } = await supabase
          .from('recipe_cache')
          .select('content')
          .eq('meal_name', fav.meal_name)
          .maybeSingle();

        return {
          id: fav.id,
          meal_name: fav.meal_name,
          content: recipe?.content || undefined,
          created_at: fav.created_at,
        };
      })
    );

    return results;
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return [];
  }
}
