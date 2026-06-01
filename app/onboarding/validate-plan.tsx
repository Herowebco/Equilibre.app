import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ScreenWrapper,
  Card,
  Button,
  MealCard,
  LoadingPlanGenerator,
} from '@/components';
import { Colors, Theme } from '@/constants';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { MealPlan, Meal } from '@/services/ai';
import { regenerateMeal, generateMealPlan } from '@/services/ai';

const DAYS = [
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
  'Dimanche',
];

export default function ValidatePlanScreen() {
  const router = useRouter();
  const { data, resetData } = useOnboarding();
  const { user, checkProfileComplete } = useAuth();

  const [currentPlan, setCurrentPlan] = useState<MealPlan | null>(
    data.generatedPlan || null,
  );
  const [loading, setLoading] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [regeneratingMeal, setRegeneratingMeal] = useState<string | null>(null);

  useEffect(() => {
    if (data.generatedPlan && !currentPlan) {
      setCurrentPlan(data.generatedPlan);
    }
  }, [data.generatedPlan]);

  const handleRegenerate = async () => {
    if (loading) {
      console.log('🟡 [REGEN] Déjà en cours...');
      return;
    }

    if (!user) {
      console.log('🔴 [REGEN] Erreur: utilisateur non connecté');
      Alert.alert('Erreur', 'Vous devez être connecté');
      return;
    }

    console.log('🟢 [REGEN] Début régénération');

    try {
      const storedStr = await AsyncStorage.getItem('temp_user_profile');

      if (!storedStr) {
        console.log('🔴 [REGEN] Profil introuvable dans AsyncStorage');
        Alert.alert('Erreur', 'Profil perdu. Recommencez le quiz.');
        return;
      }

      const profile = JSON.parse(storedStr);
      console.log('📋 [REGEN] Profil trouvé:', profile);

      if (
        !profile.gender ||
        !profile.age ||
        !profile.height ||
        !profile.weight ||
        !profile.activity_level ||
        !profile.goal
      ) {
        console.log('🔴 [REGEN] Profil incomplet');
        Alert.alert(
          'Erreur',
          'Données du profil invalides. Veuillez recommencer.',
        );
        return;
      }

      const dietLabel = profile.dietary_preferences?.diet_type || 'standard';
      const allergies = profile.dietary_preferences?.allergies || [];
      const mealsPerDay = profile.dietary_preferences?.meals_per_day || 3;
      const allergiesText =
        allergies.length > 0 ? allergies.join(', ') : 'Aucune';
      console.log(
        `📋 [REGEN] Régime: ${dietLabel}, Allergies: ${allergiesText}, Repas/jour: ${mealsPerDay}`,
      );

      setLoading(true);
      const varianceId = Date.now();
      console.log('🔢 [REGEN] Variance ID:', varianceId);

      console.log('🤖 [REGEN] Génération du plan...');
      const planData = await generateMealPlan(profile, user.id, varianceId);

      if (!planData) {
        console.error('🔴 [REGEN] Aucune donnée reçue');
        throw new Error('Aucune donnée reçue du générateur');
      }

      console.log(
        '✅ [REGEN] Nouveau plan reçu! Jours:',
        planData.days?.length,
      );
      setCurrentPlan(planData as MealPlan);
    } catch (error: any) {
      console.error('🔴 [REGEN] Erreur fatale:', error);
      Alert.alert(
        'Erreur',
        error.message || 'Une erreur est survenue lors de la régénération',
      );
    } finally {
      setLoading(false);
      console.log('🏁 [REGEN] Processus terminé');
    }
  };

  const handleAccept = async () => {
    if (!user || !currentPlan) return;

    try {
      setAccepting(true);

      const { error: planError } = await supabase.from('meal_plans').insert({
        user_id: user.id,
        plan_data: currentPlan,
        status: 'active',
      });

      if (planError) throw planError;

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          has_completed_onboarding: true,
        })
        .eq('id', user.id);

      if (profileError) throw profileError;

      await checkProfileComplete();

      resetData();
      router.replace('/(app)');
    } catch (error: any) {
      Alert.alert(
        'Erreur',
        error.message || "Une erreur est survenue lors de l'enregistrement",
      );
    } finally {
      setAccepting(false);
    }
  };

  const handleRegenerateMeal = async (dayIndex: number, mealIndex: number) => {
    if (!currentPlan || regeneratingMeal) return;

    const mealKey = `${dayIndex}-${mealIndex}`;
    setRegeneratingMeal(mealKey);

    try {
      const storedStr = await AsyncStorage.getItem('temp_user_profile');
      if (!storedStr) {
        Alert.alert('Erreur', 'Profil non trouvé');
        return;
      }

      const profile = JSON.parse(storedStr);
      const meal = currentPlan.days[dayIndex].meals[mealIndex];

      console.log(`🔄 [MEAL] Régénération: ${meal.name}`);

      const newMeal = await regenerateMeal(meal, profile);

      console.log(`✅ [MEAL] Nouveau repas: ${newMeal.name}`);

      const updatedPlan = { ...currentPlan };
      updatedPlan.days[dayIndex].meals[mealIndex] = newMeal;
      setCurrentPlan(updatedPlan);
    } catch (error: any) {
      console.error('🔴 [MEAL] Erreur:', error);
      Alert.alert(
        'Erreur',
        error.message || 'Impossible de régénérer le repas',
      );
    } finally {
      setRegeneratingMeal(null);
    }
  };

  if (!currentPlan || !currentPlan.days || currentPlan.days.length === 0) {
    return (
      <ScreenWrapper>
        <View style={styles.centerContainer}>
          <Text style={styles.emptyTitle}>Aucun plan disponible</Text>
          <Text style={styles.emptyText}>
            Veuillez retourner en arrière et générer un plan.
          </Text>
          <Button
            title="Retour"
            onPress={() => router.back()}
            style={styles.button}
          />
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <SafeAreaView style={styles.wrapper} edges={['top', 'bottom']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Votre plan hebdomadaire</Text>
          <Text style={styles.subtitle}>
            Validez ou régénérez votre plan de repas
          </Text>
        </View>

        <LoadingPlanGenerator visible={loading} />

        {currentPlan.days.map((dayData, dayIndex) => (
          <Card key={dayIndex} style={styles.card}>
            <Text style={styles.dayTitle}>{DAYS[dayIndex]}</Text>
            {dayData.meals && dayData.meals.length > 0 ? (
              dayData.meals.map((meal, mealIndex) => {
                const mealKey = `${dayIndex}-${mealIndex}`;
                const isRegenerating = regeneratingMeal === mealKey;
                return (
                  <View
                    key={mealIndex}
                    style={isRegenerating && styles.regeneratingMeal}
                  >
                    {isRegenerating && (
                      <View style={styles.regeneratingOverlay}>
                        <ActivityIndicator
                          size="small"
                          color={Colors.primary}
                        />
                      </View>
                    )}
                    <MealCard
                      mealType={meal.type}
                      mealName={meal.name}
                      calories={meal.calories}
                      ingredients={meal.ingredients}
                      onRegenerate={() =>
                        handleRegenerateMeal(dayIndex, mealIndex)
                      }
                    />
                  </View>
                );
              })
            ) : (
              <Text style={styles.placeholder}>Aucun repas prévu</Text>
            )}
          </Card>
        ))}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      <View style={styles.actionBar}>
        <Button
          title="Régénérer le plan"
          onPress={handleRegenerate}
          variant="outline"
          style={styles.regenerateButton}
          disabled={loading || accepting}
        />
        <Button
          title="Accepter le plan"
          onPress={handleAccept}
          style={styles.acceptButton}
          loading={accepting}
          disabled={loading || accepting}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Theme.spacing.lg,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.xl,
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
  button: {
    minWidth: 200,
  },
  header: {
    marginBottom: Theme.spacing.xl,
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
  regeneratingMeal: {
    position: 'relative',
    opacity: 0.6,
  },
  regeneratingOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    zIndex: 10,
    padding: Theme.spacing.sm,
  },
  actionBar: {
    flexDirection: 'row',
    gap: Theme.spacing.md,
    padding: Theme.spacing.lg,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  regenerateButton: {
    flex: 1,
  },
  acceptButton: {
    flex: 1.5,
  },
  bottomSpacer: {
    height: Theme.spacing.lg,
  },
});
