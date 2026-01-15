import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ScreenWrapper, Card, Button, DailyTracker, MealCard } from '@/components';
import { Colors, Theme } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/hooks/useFavorites';
import { supabase } from '@/lib/supabase';
import type { MealPlan, Meal } from '@/services/ai';
import { generateShoppingList } from '@/services/ai';

const DAYS_OF_WEEK = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<MealPlan | null>(null);
  const [planCreatedAt, setPlanCreatedAt] = useState<string | null>(null);
  const [planId, setPlanId] = useState<string | null>(null);
  const [consumedMeals, setConsumedMeals] = useState<Record<string, number[]>>({});
  const [dailyGoals, setDailyGoals] = useState({
    calories: 2000,
    protein: 150,
    carbs: 200,
    fats: 65,
  });

  useFocusEffect(
    useCallback(() => {
      console.log('🔄 [DASHBOARD] Screen focused, reloading meal plan...');
      loadMealPlan();
    }, [user])
  );

  const loadMealPlan = async () => {
    if (!user) return;

    try {
      setLoading(true);

      const { data: planData, error: planError } = await supabase
        .from('meal_plans')
        .select('id, plan_data, created_at, consumed_meals, shopping_list')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      console.log('📊 [DASHBOARD] Plan récupéré:', planData ? `ID: ${planData.id}, Date: ${planData.created_at}` : 'Aucun plan');

      if (planError) throw planError;

      if (planData) {
        setCurrentPlan(planData.plan_data as MealPlan);
        setPlanCreatedAt(planData.created_at);
        setPlanId(planData.id);
        setConsumedMeals(planData.consumed_meals || {});

        if (!planData.shopping_list && planData.plan_data) {
          generateShoppingListInBackground(planData.id, planData.plan_data as MealPlan);
        }
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('daily_goals')
        .eq('id', user.id)
        .maybeSingle();

      if (!profileError && profileData?.daily_goals) {
        setDailyGoals(profileData.daily_goals);
      }
    } catch (error) {
      console.error('Error loading meal plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateShoppingListInBackground = async (planId: string, planData: MealPlan) => {
    if (!user) return;

    try {
      console.log('🛒 [BACKGROUND] Génération de la liste de courses en arrière-plan...');
      const shoppingList = await generateShoppingList(planData, user.id);

      await supabase
        .from('meal_plans')
        .update({ shopping_list: shoppingList })
        .eq('id', planId);

      console.log('✅ [BACKGROUND] Liste de courses générée et sauvegardée');
    } catch (error) {
      console.error('❌ [BACKGROUND] Erreur lors de la génération:', error);
    }
  };

  const getCurrentDayIndex = (): number => {
    if (!planCreatedAt) return 0;

    const createdDate = new Date(planCreatedAt);
    const today = new Date();

    createdDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    const diffTime = today.getTime() - createdDate.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    return Math.max(0, diffDays) % 7;
  };

  const getCurrentDayName = (): string => {
    const today = new Date();
    const jsDay = today.getDay();
    const dayIndex = (jsDay + 6) % 7;
    return DAYS_OF_WEEK[dayIndex];
  };

  const getTodayMeals = (): Meal[] => {
    if (!currentPlan?.days || currentPlan.days.length === 0) return [];
    const dayIndex = getCurrentDayIndex();
    const day = currentPlan.days[dayIndex];
    if (!day || !day.meals) return [];
    return day.meals;
  };

  const isMealConsumed = (mealIndex: number): boolean => {
    const dayIndex = getCurrentDayIndex();
    const dayKey = dayIndex.toString();
    return consumedMeals[dayKey]?.includes(mealIndex) || false;
  };

  const toggleMealConsumption = async (mealIndex: number) => {
    if (!planId) return;

    const dayIndex = getCurrentDayIndex();
    const dayKey = dayIndex.toString();
    const currentDayMeals = consumedMeals[dayKey] || [];

    let updatedDayMeals: number[];
    if (currentDayMeals.includes(mealIndex)) {
      updatedDayMeals = currentDayMeals.filter(i => i !== mealIndex);
    } else {
      updatedDayMeals = [...currentDayMeals, mealIndex];
    }

    const updatedConsumedMeals = {
      ...consumedMeals,
      [dayKey]: updatedDayMeals,
    };

    setConsumedMeals(updatedConsumedMeals);

    try {
      const { error } = await supabase
        .from('meal_plans')
        .update({ consumed_meals: updatedConsumedMeals })
        .eq('id', planId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating meal consumption:', error);
      setConsumedMeals(consumedMeals);
    }
  };

  const getTodayNutrition = () => {
    const meals = getTodayMeals();
    const dayIndex = getCurrentDayIndex();
    const dayKey = dayIndex.toString();
    const consumedIndices = consumedMeals[dayKey] || [];

    return meals.reduce(
      (acc, meal, index) => {
        if (consumedIndices.includes(index)) {
          const protein = meal.macros?.protein || meal.protein || 0;
          const carbs = meal.macros?.carbs || meal.carbs || 0;
          const fats = meal.macros?.fat || meal.fats || 0;

          return {
            calories: acc.calories + (meal.calories || 0),
            protein: acc.protein + protein,
            carbs: acc.carbs + carbs,
            fats: acc.fats + fats,
          };
        }
        return acc;
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
  };

  if (loading) {
    return (
      <ScreenWrapper>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (!currentPlan || !currentPlan.days || currentPlan.days.length === 0) {
    return (
      <ScreenWrapper>
        <View style={styles.centerContainer}>
          <Text style={styles.emptyTitle}>Aucun plan trouvé</Text>
          <Text style={styles.emptyText}>
            Vous n'avez pas encore de plan de repas.
          </Text>
          <Button
            title="Créer mon plan"
            onPress={() => router.push('/onboarding')}
            style={styles.createButton}
          />
        </View>
      </ScreenWrapper>
    );
  }

  const todayMeals = getTodayMeals();
  const nutrition = getTodayNutrition();
  const dayIndex = getCurrentDayIndex();
  const dayName = getCurrentDayName();

  return (
    <ScreenWrapper scrollable>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Tableau de bord</Text>
            <Text style={styles.subtitle}>
              {dayName} - Jour {dayIndex + 1}
            </Text>
          </View>
        </View>

        <DailyTracker consumed={nutrition} goals={dailyGoals} />

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Prochains repas</Text>
          {todayMeals.length > 0 ? (
            todayMeals.map((meal, index) => (
              <MealCard
                key={index}
                mealType={meal.type}
                mealName={meal.name}
                calories={meal.calories}
                ingredients={meal.ingredients || []}
                isConsumed={isMealConsumed(index)}
                isFavorite={isFavorite(meal.name)}
                onToggleConsume={() => toggleMealConsumption(index)}
                onToggleFavorite={() => toggleFavorite(meal.name)}
              />
            ))
          ) : (
            <Text style={styles.cardText}>Aucun repas prévu</Text>
          )}
        </Card>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Theme.spacing.lg,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.xl,
  },
  loadingText: {
    marginTop: Theme.spacing.md,
    fontSize: Theme.fontSize.md,
    color: Colors.text.secondary,
  },
  emptyTitle: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Theme.spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: Theme.fontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginBottom: Theme.spacing.xl,
  },
  createButton: {
    minWidth: 200,
  },
  header: {
    marginBottom: Theme.spacing.lg,
  },
  title: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Theme.spacing.xs,
  },
  subtitle: {
    fontSize: Theme.fontSize.md,
    color: Colors.text.secondary,
  },
  card: {
    marginBottom: Theme.spacing.md,
  },
  cardTitle: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Theme.spacing.sm,
  },
  cardText: {
    fontSize: Theme.fontSize.md,
    color: Colors.text.secondary,
    lineHeight: 22,
  },
});
