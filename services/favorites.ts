import { supabase } from '@/lib/supabase';

export interface FavoriteRecipe {
  id: string;
  meal_name: string;
  content: {
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

export async function getRecipeIdByName(mealName: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('recipe_cache')
      .select('id')
      .eq('meal_name', mealName)
      .maybeSingle();

    if (error) throw error;
    return data?.id || null;
  } catch (error) {
    console.error('Error getting recipe ID:', error);
    return null;
  }
}

export async function checkIsFavorite(
  userId: string,
  recipeId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('user_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('recipe_cache_id', recipeId)
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
  recipeId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_favorites')
      .insert({
        user_id: userId,
        recipe_cache_id: recipeId,
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
  recipeId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('user_favorites')
      .delete()
      .eq('user_id', userId)
      .eq('recipe_cache_id', recipeId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Error removing from favorites:', error);
    return false;
  }
}

export async function toggleFavorite(
  userId: string,
  recipeId: string
): Promise<boolean> {
  const isFavorite = await checkIsFavorite(userId, recipeId);

  if (isFavorite) {
    return await removeFromFavorites(userId, recipeId);
  } else {
    return await addToFavorites(userId, recipeId);
  }
}

export async function getUserFavorites(userId: string): Promise<FavoriteRecipe[]> {
  try {
    const { data, error } = await supabase
      .from('user_favorites')
      .select(`
        id,
        recipe_cache_id,
        created_at,
        recipe_cache (
          id,
          meal_name,
          content,
          created_at
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (!data) return [];

    return data.map((item: any) => ({
      id: item.recipe_cache.id,
      meal_name: item.recipe_cache.meal_name,
      content: item.recipe_cache.content,
      created_at: item.created_at,
    }));
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return [];
  }
}
