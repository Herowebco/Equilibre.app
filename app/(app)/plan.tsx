import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper, Card, Button } from '@/components';
import { Colors, Theme } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { MealPlan } from '@/services/ai';

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
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<MealPlan | null>(null);

  useEffect(() => {
    loadMealPlan();
  }, [user]);

  const loadMealPlan = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('meal_plans')
        .select('plan_data')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setCurrentPlan(data.plan_data as MealPlan);
      }
    } catch (error) {
      console.error('Error loading meal plan:', error);
    } finally {
      setLoading(false);
    }
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
            onPress={() => router.push('/onboarding/step1')}
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
            <Text style={styles.dayTitle}>{DAYS[index]}</Text>
            {dayData.meals && dayData.meals.length > 0 ? (
              dayData.meals.map((meal, mealIndex) => (
                <View key={mealIndex} style={styles.mealItem}>
                  <View style={styles.mealHeader}>
                    <Text style={styles.mealType}>{meal.type}</Text>
                    <Text style={styles.mealCalories}>{meal.calories} kcal</Text>
                  </View>
                  <Text style={styles.mealName}>{meal.name}</Text>
                  {meal.ingredients && meal.ingredients.length > 0 && (
                    <Text style={styles.ingredients} numberOfLines={2}>
                      {meal.ingredients.join(', ')}
                    </Text>
                  )}
                </View>
              ))
            ) : (
              <Text style={styles.placeholder}>Aucun repas prévu</Text>
            )}
          </Card>
        ))}
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
  mealItem: {
    paddingVertical: Theme.spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
  },
  mealType: {
    fontSize: Theme.fontSize.sm,
    color: Colors.primary,
    fontWeight: Theme.fontWeight.medium,
  },
  mealCalories: {
    fontSize: Theme.fontSize.sm,
    color: Colors.text.secondary,
  },
  mealName: {
    fontSize: Theme.fontSize.md,
    color: Colors.text.primary,
    fontWeight: Theme.fontWeight.medium,
    marginBottom: Theme.spacing.xs,
  },
  ingredients: {
    fontSize: Theme.fontSize.sm,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  placeholder: {
    fontSize: Theme.fontSize.md,
    color: Colors.text.light,
    fontStyle: 'italic',
  },
});
