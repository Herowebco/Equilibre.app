import { Platform } from 'react-native';
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
  macros?: {
    protein: number;
    carbs: number;
    fat: number;
  };
  protein?: number;
  carbs?: number;
  fats?: number;
  ingredients: string[];
}

export interface Day {
  day_number: number;
  meals: Meal[];
}

export interface MealPlan {
  days: Day[];
}

export interface ShoppingItem {
  name: string;
  amount?: number;
  unit?: string;
  checked: boolean;
}

export interface ShoppingCategory {
  name: string;
  items: ShoppingItem[];
}

export interface ShoppingList {
  categories: ShoppingCategory[];
}

export interface IngredientGroup {
  group: string;
  list: string[];
}

export interface RecipeDetails {
  ingredients: (string | IngredientGroup)[];
  instructions: string[];
  prep_time: string;
  cook_time: string;
  macros_detailed: {
    protein: string;
    carbs: string;
    fat: string;
    fiber: string;
  };
}

async function generateMealPlanDirect(
  userProfile: UserProfile,
): Promise<MealPlan> {
  console.log('🔵 [iOS] Début génération directe Gemini');
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY!;
  console.log(
    '🔵 [iOS] Clé API:',
    apiKey ? `OK (${apiKey.length} chars)` : 'MANQUANTE',
  );
  const diet = userProfile.dietary_preferences?.diet_type || 'standard';
  const allergies = userProfile.dietary_preferences?.allergies || [];
  const mealsPerDay = userProfile.dietary_preferences?.meals_per_day || 3;
  const dailyGoals = (userProfile as any).daily_goals || {
    calories: 2000,
    protein: 150,
    carbs: 200,
    fats: 65,
  };

  const targetCalories = dailyGoals.calories;
  const targetProtein = dailyGoals.protein;
  const targetCarbs = dailyGoals.carbs;
  const targetFats = dailyGoals.fats;

  const breakfastCal = Math.round(targetCalories * 0.25);
  const snackCal = mealsPerDay === 4 ? Math.round(targetCalories * 0.1) : 0;
  const lunchCal = Math.round(
    targetCalories * (mealsPerDay === 4 ? 0.35 : 0.4),
  );
  const dinnerCal = targetCalories - breakfastCal - snackCal - lunchCal;

  const mealTypesInstruction =
    mealsPerDay === 4
      ? `4 repas: breakfast (${breakfastCal} kcal), snack (${snackCal} kcal), lunch (${lunchCal} kcal), dinner (${dinnerCal} kcal)`
      : `3 repas: breakfast (${breakfastCal} kcal), lunch (${lunchCal} kcal), dinner (${dinnerCal} kcal)`;

  const prompt = `Tu es nutritionniste expert francophone. Crée un plan alimentaire de 7 jours au format JSON STRICT.

LANGUE OBLIGATOIRE: Tous les noms de repas et ingrédients DOIVENT être en FRANÇAIS. Aucun mot en anglais.

PROFIL:
- Régime: ${diet}
- Allergies: ${allergies.length > 0 ? allergies.join(', ') : 'Aucune'}

OBJECTIFS QUOTIDIENS:
- Calories: ${targetCalories} kcal
- Protéines: ${targetProtein}g, Glucides: ${targetCarbs}g, Lipides: ${targetFats}g

RÈGLES:
1. ${mealsPerDay} repas/jour: ${mealTypesInstruction}
2. Si Végétarien/Vegan = ZÉRO VIANDE/POISSON
3. Noms de repas en français (ex: "Poulet grillé aux légumes" et NON "Grilled chicken")

JSON UNIQUEMENT (sans markdown):
{"days":[{"day_number":1,"meals":[{"type":"breakfast","name":"...","calories":${breakfastCal},"ingredients":["..."],"macros":{"protein":25,"carbs":55,"fat":12}}]}]}`;

  const modelAttempts = [
    { model: 'gemini-2.5-flash', version: 'v1beta' },
    { model: 'gemini-2.0-flash', version: 'v1beta' },
    { model: 'gemini-1.5-flash', version: 'v1' },
    { model: 'gemini-1.5-flash-001', version: 'v1' },
  ];
  let data: any = null;
  let lastError = '';

  for (const { model, version } of modelAttempts) {
    const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`;
    console.log(`🔵 [iOS] Tentative fetch vers ${model} (${version})...`);
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });

      if (response.ok) {
        data = await response.json();
        console.log(`✅ [iOS] Succès avec ${model}`);
        break;
      } else {
        const errorBody = await response.text().catch(() => '');
        lastError = `Erreur HTTP ${response.status} (${model}): ${errorBody}`;
        console.warn(`⚠️ [iOS] ${model} → ${response.status}: ${errorBody}`);
      }
    } catch (e: any) {
      lastError = e.message;
      console.warn(`⚠️ [iOS] ${model} → catch: ${e.message}`);
    }
  }

  if (!data) {
    throw new Error(lastError || 'Tous les modèles ont échoué.');
  }

  let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  text = text
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim();
  return JSON.parse(text) as MealPlan;
}

export async function generateMealPlan(
  userProfile: UserProfile,
  userId?: string,
  variance?: number,
): Promise<MealPlan> {
  if (Platform.OS === 'ios') {
    return generateMealPlanDirect(userProfile);
  }

  const { data, error } = await supabase.functions.invoke('generate-plan', {
    body: { userProfile, user_id: userId, variance },
  });

  if (error) {
    let detail = error.message || 'Failed to generate meal plan';
    try {
      const ctx: any = (error as any).context;
      if (ctx && typeof ctx.json === 'function') {
        const body = await ctx.json();
        if (body?.error) detail = body.error;
      } else if (ctx && typeof ctx.text === 'function') {
        const txt = await ctx.text();
        if (txt) detail = txt;
      }
    } catch {}
    throw new Error(detail);
  }

  if (!data) throw new Error('Aucune donnée reçue');
  if (data.error) throw new Error(data.error);
  return data as MealPlan;
}

async function regenerateMealDirect(
  currentMeal: Meal,
  userProfile: UserProfile,
): Promise<Meal> {
  console.log('🔵 [iOS] Début régénération directe de repas Gemini');
  const apiKey = process.env.EXPO_PUBLIC_GEMINI_API_KEY!;
  const diet = userProfile.dietary_preferences?.diet_type || 'standard';
  const allergies = userProfile.dietary_preferences?.allergies || [];

  const prompt = `Tu es nutritionniste expert. Remplace le repas suivant par une alternative au format JSON STRICT.

ANCIEN REPAS:
- Type: ${currentMeal.type}
- Nom: ${currentMeal.name}
- Calories: ~${currentMeal.calories} kcal

PROFIL:
- Régime: ${diet}
- Allergies: ${allergies.length > 0 ? allergies.join(', ') : 'Aucune'}

JSON UNIQUEMENT (sans markdown):
{"type":"${currentMeal.type}","name":"nouveau nom","calories":${currentMeal.calories},"ingredients":["ingrédient 1"],"macros":{"protein":20,"carbs":40,"fat":15}}`;

  const modelAttempts = [
    { model: 'gemini-2.5-flash', version: 'v1beta' },
    { model: 'gemini-2.0-flash', version: 'v1beta' },
    { model: 'gemini-1.5-flash', version: 'v1' },
    { model: 'gemini-1.5-flash-001', version: 'v1' },
  ];
  let data: any = null;
  let lastError = '';

  for (const { model, version } of modelAttempts) {
    const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`;
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
      });

      if (response.ok) {
        data = await response.json();
        break;
      } else {
        const errorBody = await response.text().catch(() => '');
        lastError = `Erreur HTTP ${response.status} (${model}): ${errorBody}`;
        console.warn(`⚠️ [iOS] regenerate ${model} → ${response.status}: ${errorBody}`);
      }
    } catch (e: any) {
      lastError = e.message;
    }
  }

  if (!data) {
    throw new Error(lastError || 'Tous les modèles ont échoué.');
  }

  let text = data.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
  text = text
    .replace(/```json/g, '')
    .replace(/```/g, '')
    .trim();
  return JSON.parse(text) as Meal;
}

export async function regenerateMeal(
  currentMeal: Meal,
  userProfile: UserProfile,
  userId?: string,
): Promise<Meal> {
  if (Platform.OS === 'ios') {
    return regenerateMealDirect(currentMeal, userProfile);
  }

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

export async function generateShoppingList(
  planData: MealPlan,
  userId: string,
): Promise<ShoppingList> {
  try {
    const { data, error } = await supabase.functions.invoke(
      'generate-shopping-list',
      {
        body: {
          planData,
          user_id: userId,
        },
      },
    );

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
    throw new Error(
      'An unexpected error occurred while generating the shopping list',
    );
  }
}

export async function updateShoppingListItems(
  userId: string,
  shoppingList: ShoppingList,
): Promise<void> {
  try {
    const { data: activePlan, error: fetchError } = await supabase
      .from('meal_plans')
      .select('id')
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (fetchError) {
      throw new Error(fetchError.message || 'Failed to fetch active plan');
    }

    if (!activePlan) {
      throw new Error('No active plan found');
    }

    const { error } = await supabase
      .from('meal_plans')
      .update({ shopping_list: shoppingList })
      .eq('id', activePlan.id);

    if (error) {
      throw new Error(error.message || 'Failed to update shopping list');
    }
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(
      'An unexpected error occurred while updating the shopping list',
    );
  }
}

export async function getRecipeDetails(
  mealName: string,
  userProfile: UserProfile,
): Promise<RecipeDetails> {
  try {
    const diet = userProfile.dietary_preferences?.diet_type || 'standard';
    const allergies = userProfile.dietary_preferences?.allergies || [];

    const { data, error } = await supabase.functions.invoke(
      'generate-recipe-details',
      {
        body: {
          mealName,
          diet,
          allergies,
        },
      },
    );

    if (error) {
      throw new Error(error.message || 'Failed to get recipe details');
    }

    if (!data) {
      throw new Error('No data received from recipe details generator');
    }

    if (data.error) {
      throw new Error(data.error);
    }

    return data as RecipeDetails;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(
      'An unexpected error occurred while getting recipe details',
    );
  }
}
