import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';

interface FavoritesContextType {
  favorites: string[];
  loading: boolean;
  isFavorite: (mealName: string) => boolean;
  toggleFavorite: (mealName: string) => Promise<boolean>;
  refreshFavorites: () => Promise<void>;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export function FavoritesProvider({ children }: { children: ReactNode }) {
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

  const value = {
    favorites,
    loading,
    isFavorite,
    toggleFavorite,
    refreshFavorites: loadFavorites,
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavoritesContext() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavoritesContext must be used within a FavoritesProvider');
  }
  return context;
}
