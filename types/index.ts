export interface User {
  id: string;
  email: string;
  name?: string;
}

export interface MealPlan {
  id: string;
  userId: string;
  weekStart: string;
  meals: Meal[];
}

export interface Meal {
  id: string;
  day: string;
  type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fats?: number;
  ingredients?: string[];
  recipe?: string;
}

export interface GroceryItem {
  id: string;
  name: string;
  quantity: string;
  checked: boolean;
}
