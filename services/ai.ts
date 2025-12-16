import { supabase } from '@/lib/supabase';

export interface UserProfile {
  gender?: string;
  age?: number;
  height?: number;
  weight?: number;
  activity_level?: string;
  goal?: string;
  dietary_preferences?: {
    diet_type?: string;
    allergies?: string[];
    meals_per_day?: number;
  };
}

export interface Meal {
  type: string;
  name: string;
  calories: number;
  ingredients: string[];
}

export interface Day {
  day_number: number;
  meals: Meal[];
}

export interface MealPlan {
  days: Day[];
}

export interface ShoppingCategory {
  name: string;
  items: string[];
}

export interface ShoppingList {
  categories: ShoppingCategory[];
}

export async function generateMealPlan(
  userProfile: UserProfile,
  userId?: string
): Promise<MealPlan> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-plan', {
      body: {
        userProfile,
        user_id: userId,
      },
    });

    if (error) {
      throw new Error(error.message || 'Failed to generate meal plan');
    }

    if (!data) {
      throw new Error('No data received from meal plan generator');
    }

    if (data.error) {
      throw new Error(data.error);
    }

    return data as MealPlan;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while generating the meal plan');
  }
}

export async function regenerateMeal(
  currentMeal: Meal,
  userProfile: UserProfile,
  userId?: string
): Promise<Meal> {
  try {
    const diet = userProfile.dietary_preferences?.diet_type || 'standard';
    const allergies = userProfile.dietary_preferences?.allergies || [];

    const { data, error } = await supabase.functions.invoke('regenerate-meal', {
      body: {
        currentMeal,
        diet,
        allergies,
        mealType: currentMeal.type,
        user_id: userId,
      },
    });

    if (error) {
      throw new Error(error.message || 'Failed to regenerate meal');
    }

    if (!data) {
      throw new Error('No data received from meal regenerator');
    }

    if (data.error) {
      throw new Error(data.error);
    }

    return data as Meal;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while regenerating the meal');
  }
}

export async function generateShoppingList(planData: MealPlan, userId: string): Promise<ShoppingList> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-shopping-list', {
      body: {
        planData,
        user_id: userId,
      },
    });

    if (error) {
      throw new Error(error.message || 'Failed to generate shopping list');
    }

    if (!data) {
      throw new Error('No data received from shopping list generator');
    }

    if (data.error) {
      throw new Error(data.error);
    }

    return data as ShoppingList;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('An unexpected error occurred while generating the shopping list');
  }
}
