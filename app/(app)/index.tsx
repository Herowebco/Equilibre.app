import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper, Card, Button, ShoppingListModal } from '@/components';
import { Colors, Theme } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { MealPlan, Meal, ShoppingList } from '@/services/ai';
import { generateShoppingList } from '@/services/ai';
import { ShoppingCart } from 'lucide-react-native';

const DAYS_OF_WEEK = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

export default function DashboardScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<MealPlan | null>(null);
  const [planCreatedAt, setPlanCreatedAt] = useState<string | null>(null);
  const [showShoppingModal, setShowShoppingModal] = useState(false);
  const [shoppingList, setShoppingList] = useState<ShoppingList | null>(null);
  const [generatingList, setGeneratingList] = useState(false);

  useEffect(() => {
    loadMealPlan();
  }, [user]);

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

  const getCurrentDayIndex = (): number => {
    if (!planCreatedAt) return 0;

    const createdDate = new Date(planCreatedAt);
    const today = new Date();
    const diffTime = today.getTime() - createdDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    return Math.min(diffDays % 7, 6);
  };

  const getTodayMeals = (): Meal[] => {
    if (!currentPlan?.days || currentPlan.days.length === 0) return [];
    const dayIndex = getCurrentDayIndex();
    const day = currentPlan.days[dayIndex];
    if (!day || !day.meals) return [];
    return day.meals;
  };

  const getTodayNutrition = () => {
    const meals = getTodayMeals();
    return meals.reduce(
      (acc, meal) => ({
        calories: acc.calories + (meal.calories || 0),
        protein: acc.protein + 0,
        carbs: acc.carbs + 0,
        fats: acc.fats + 0,
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
  };

  const handleGenerateShoppingList = async () => {
    if (!currentPlan || !user) return;

    try {
      setGeneratingList(true);
      setShowShoppingModal(true);
      const list = await generateShoppingList(currentPlan, user.id);
      setShoppingList(list);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de générer la liste de courses');
      setShowShoppingModal(false);
    } finally {
      setGeneratingList(false);
    }
  };

  const handleCloseModal = () => {
    setShowShoppingModal(false);
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

  const todayMeals = getTodayMeals();
  const nutrition = getTodayNutrition();
  const dayIndex = getCurrentDayIndex();

  return (
    <ScreenWrapper scrollable>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Tableau de bord</Text>
            <Text style={styles.subtitle}>
              {DAYS_OF_WEEK[dayIndex]} - Jour {dayIndex + 1}
            </Text>
          </View>
        </View>

        <Button
          title="Ma Liste de Courses"
          onPress={handleGenerateShoppingList}
          style={styles.shoppingButton}
          icon={<ShoppingCart size={20} color="#fff" />}
        />

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Repas du jour</Text>
          {todayMeals.length > 0 ? (
            todayMeals.map((meal, index) => (
              <View key={index} style={styles.mealItem}>
                <Text style={styles.mealType}>{meal.type}</Text>
                <Text style={styles.mealName}>{meal.name}</Text>
                <Text style={styles.mealCalories}>{meal.calories} kcal</Text>
              </View>
            ))
          ) : (
            <Text style={styles.cardText}>Aucun repas prévu</Text>
          )}
        </Card>

        <Card style={styles.card}>
          <Text style={styles.cardTitle}>Suivi nutritionnel</Text>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{nutrition.calories}</Text>
              <Text style={styles.statLabel}>Calories</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{nutrition.protein}g</Text>
              <Text style={styles.statLabel}>Protéines</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{nutrition.carbs}g</Text>
              <Text style={styles.statLabel}>Glucides</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{nutrition.fats}g</Text>
              <Text style={styles.statLabel}>Lipides</Text>
            </View>
          </View>
        </Card>
      </View>

      <ShoppingListModal
        visible={showShoppingModal}
        onClose={handleCloseModal}
        shoppingList={shoppingList}
        loading={generatingList}
        userId={user?.id || null}
        onUpdate={() => setShoppingList(shoppingList)}
      />
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
  shoppingButton: {
    marginBottom: Theme.spacing.lg,
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
  mealItem: {
    paddingVertical: Theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  mealType: {
    fontSize: Theme.fontSize.sm,
    color: Colors.primary,
    fontWeight: Theme.fontWeight.medium,
    marginBottom: Theme.spacing.xs,
  },
  mealName: {
    fontSize: Theme.fontSize.md,
    color: Colors.text.primary,
    fontWeight: Theme.fontWeight.medium,
    marginBottom: Theme.spacing.xs,
  },
  mealCalories: {
    fontSize: Theme.fontSize.sm,
    color: Colors.text.secondary,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.primary,
    marginBottom: Theme.spacing.xs,
  },
  statLabel: {
    fontSize: Theme.fontSize.sm,
    color: Colors.text.secondary,
  },
});
