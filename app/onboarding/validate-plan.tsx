import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScreenWrapper, Card, Button } from '@/components';
import { Colors, Theme } from '@/constants';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { RefreshCw } from 'lucide-react-native';
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

export default function ValidatePlanScreen() {
  const router = useRouter();
  const { data, resetData } = useOnboarding();
  const { user } = useAuth();

  const [currentPlan, setCurrentPlan] = useState<MealPlan | null>(
    data.generatedPlan || null
  );
  const [loading, setLoading] = useState(false);
  const [accepting, setAccepting] = useState(false);

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
        Alert.alert('Erreur', 'Données du profil invalides. Veuillez recommencer.');
        return;
      }

      const dietLabel = profile.dietary_preferences?.diet_type || 'standard';
      const allergies = profile.dietary_preferences?.allergies || [];
      const mealsPerDay = profile.dietary_preferences?.meals_per_day || 3;
      const allergiesText = allergies.length > 0 ? allergies.join(', ') : 'Aucune';
      console.log(`📋 [REGEN] Régime: ${dietLabel}, Allergies: ${allergiesText}, Repas/jour: ${mealsPerDay}`);

      setLoading(true);
      const varianceId = Date.now();
      console.log('🔢 [REGEN] Variance ID:', varianceId);

      console.log('🤖 [REGEN] Appel Edge Function...');
      const { data: planData, error } = await supabase.functions.invoke(
        'generate-plan',
        {
          body: {
            userProfile: profile,
            user_id: user.id,
            variance: varianceId,
          },
        }
      );

      if (error) {
        console.error('🔴 [REGEN] Erreur Edge Function:', error);
        throw new Error(error.message || 'Erreur lors de la régénération');
      }

      if (!planData) {
        console.error('🔴 [REGEN] Aucune donnée reçue');
        throw new Error('Aucune donnée reçue du générateur');
      }

      if (planData.error) {
        console.error('🔴 [REGEN] Erreur dans planData:', planData.error);
        throw new Error(planData.error);
      }

      console.log('✅ [REGEN] Nouveau plan reçu! Jours:', planData.days?.length);
      setCurrentPlan(planData as MealPlan);
    } catch (error: any) {
      console.error('🔴 [REGEN] Erreur fatale:', error);
      Alert.alert(
        'Erreur',
        error.message || 'Une erreur est survenue lors de la régénération'
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

      resetData();
      router.replace('/(app)');
    } catch (error: any) {
      Alert.alert(
        'Erreur',
        error.message || "Une erreur est survenue lors de l'enregistrement"
      );
    } finally {
      setAccepting(false);
    }
  };

  const handleReplaceMeal = () => {
    Alert.alert(
      'Remplacer le repas',
      'Fonctionnalité à venir : vous pourrez bientôt remplacer un repas individuellement.'
    );
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
    <View style={styles.wrapper}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Votre plan hebdomadaire</Text>
          <Text style={styles.subtitle}>
            Validez ou régénérez votre plan de repas
          </Text>
        </View>

        {loading && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.loadingText}>Régénération en cours...</Text>
            </View>
          </View>
        )}

        {currentPlan.days.map((dayData, index) => (
          <Card key={index} style={styles.card}>
            <Text style={styles.dayTitle}>{DAYS[index]}</Text>
            {dayData.meals && dayData.meals.length > 0 ? (
              dayData.meals.map((meal, mealIndex) => (
                <View key={mealIndex} style={styles.mealItem}>
                  <View style={styles.mealHeader}>
                    <View style={styles.mealInfo}>
                      <Text style={styles.mealType}>{meal.type}</Text>
                      <Text style={styles.mealCalories}>{meal.calories} kcal</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.replaceButton}
                      onPress={handleReplaceMeal}
                    >
                      <RefreshCw size={18} color={Colors.primary} />
                    </TouchableOpacity>
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
    </View>
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
  mealInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  mealType: {
    fontSize: Theme.fontSize.sm,
    color: Colors.primary,
    fontWeight: Theme.fontWeight.medium,
    marginRight: Theme.spacing.md,
  },
  mealCalories: {
    fontSize: Theme.fontSize.sm,
    color: Colors.text.secondary,
  },
  replaceButton: {
    padding: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: `${Colors.primary}15`,
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
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  loadingContainer: {
    backgroundColor: Colors.white,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Theme.spacing.md,
    fontSize: Theme.fontSize.md,
    color: Colors.text.primary,
    fontWeight: Theme.fontWeight.medium,
  },
  bottomSpacer: {
    height: Theme.spacing.lg,
  },
});
