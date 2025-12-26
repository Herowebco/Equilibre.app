import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface Favorite {
  id: string;
  user_id: string;
  meal_name: string;
  created_at: string;
}

export function useFavorites() {
  const { user } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadFavorites();
    } else {
      setFavorites([]);
      setLoading(false);
    }
  }, [user]);

  const loadFavorites = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('user_favorites')
        .select('meal_name')
        .eq('user_id', user.id);

      if (error) throw error;

      const mealNames = data?.map((fav) => fav.meal_name) || [];
      setFavorites(mealNames);
    } catch (error) {
      console.error('Error loading favorites:', error);
    } finally {
      setLoading(false);
    }
  };

  const isFavorite = (mealName: string): boolean => {
    return favorites.includes(mealName);
  };

  const toggleFavorite = async (mealName: string): Promise<boolean> => {
    if (!user) return false;

    const isCurrentlyFavorite = isFavorite(mealName);

    setFavorites((prev) =>
      isCurrentlyFavorite
        ? prev.filter((name) => name !== mealName)
        : [...prev, mealName]
    );

    try {
      if (isCurrentlyFavorite) {
        const { error } = await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('meal_name', mealName);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_favorites')
          .insert({
            user_id: user.id,
            meal_name: mealName,
          });

        if (error) throw error;
      }

      return !isCurrentlyFavorite;
    } catch (error) {
      console.error('Error toggling favorite:', error);
      setFavorites((prev) =>
        isCurrentlyFavorite
          ? [...prev, mealName]
          : prev.filter((name) => name !== mealName)
      );
      return isCurrentlyFavorite;
    }
  };

  return {
    favorites,
    loading,
    isFavorite,
    toggleFavorite,
    refreshFavorites: loadFavorites,
  };
}
