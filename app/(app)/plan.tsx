import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { ScreenWrapper, Card, Button, MealCard, RecipeModal } from '@/components';
import { Colors, Theme } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/hooks/useFavorites';
import { supabase } from '@/lib/supabase';
import type { MealPlan, Meal, UserProfile, RecipeDetails } from '@/services/ai';
import { getRecipeDetails } from '@/services/ai';

const DAYS = [
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
  'Dimanche',
];

export default function PlanScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<MealPlan | null>(null);
  const [planCreatedAt, setPlanCreatedAt] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showRecipeModal, setShowRecipeModal] = useState(false);
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null);
  const [recipeDetails, setRecipeDetails] = useState<RecipeDetails | null>(null);
  const [loadingRecipe, setLoadingRecipe] = useState(false);

  useFocusEffect(
    useCallback(() => {
      console.log('🔄 [PLAN] Screen focused, reloading data...');
      loadMealPlan();
      loadUserProfile();
    }, [user])
  );

  const loadMealPlan = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('meal_plans')
        .select('plan_data, created_at')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setCurrentPlan(data.plan_data as MealPlan);
        setPlanCreatedAt(data.created_at);
      }
    } catch (error) {
      console.error('Error loading meal plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setUserProfile({
          gender: data.gender,
          age: data.age,
          height: data.height,
          weight: data.weight,
          activity_level: data.activity_level,
          goal: data.goal,
          dietary_preferences: data.dietary_preferences,
        });
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const handleMealClick = async (meal: Meal) => {
    if (!userProfile) return;

    setSelectedMeal(meal);
    setShowRecipeModal(true);
    setLoadingRecipe(true);
    setRecipeDetails(null);

    try {
      const details = await getRecipeDetails(meal.name, userProfile);
      setRecipeDetails(details);
    } catch (error) {
      console.error('Error loading recipe details:', error);
    } finally {
      setLoadingRecipe(false);
    }
  };

  const handleCloseModal = () => {
    setShowRecipeModal(false);
    setSelectedMeal(null);
    setRecipeDetails(null);
  };

  const getDayName = (dayIndex: number): string => {
    if (!planCreatedAt) return DAYS[dayIndex];

    const startDate = new Date(planCreatedAt);
    const dayDate = new Date(startDate);
    dayDate.setDate(startDate.getDate() + dayIndex);

    const dayName = dayDate.toLocaleDateString('fr-FR', { weekday: 'long' });
    return dayName.charAt(0).toUpperCase() + dayName.slice(1);
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

  return (
    <ScreenWrapper scrollable>
      <View style={styles.container}>
        <Text style={styles.title}>Mon Plan</Text>
        <Text style={styles.subtitle}>Plan hebdomadaire</Text>

        {currentPlan.days.map((dayData, index) => (
          <Card key={index} style={styles.card}>
            <Text style={styles.dayTitle}>{getDayName(index)}</Text>
            {dayData.meals && dayData.meals.length > 0 ? (
              dayData.meals.map((meal, mealIndex) => (
                <MealCard
                  key={mealIndex}
                  mealType={meal.type}
                  mealName={meal.name}
                  calories={meal.calories}
                  ingredients={meal.ingredients || []}
                  isFavorite={isFavorite(meal.name)}
                  onPress={() => handleMealClick(meal)}
                  onToggleFavorite={() => toggleFavorite(meal.name)}
                />
              ))
            ) : (
              <Text style={styles.placeholder}>Aucun repas prévu</Text>
            )}
          </Card>
        ))}

        <RecipeModal
          visible={showRecipeModal}
          onClose={handleCloseModal}
          mealName={selectedMeal?.name || ''}
          recipeDetails={recipeDetails}
          loading={loadingRecipe}
        />
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
  title: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Theme.spacing.xs,
  },
  subtitle: {
    fontSize: Theme.fontSize.md,
    color: Colors.text.secondary,
    marginBottom: Theme.spacing.xl,
  },
  card: {
    marginBottom: Theme.spacing.md,
  },
  dayTitle: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.primary,
    marginBottom: Theme.spacing.md,
  },
  placeholder: {
    fontSize: Theme.fontSize.md,
    color: Colors.text.light,
    fontStyle: 'italic',
  },
});
