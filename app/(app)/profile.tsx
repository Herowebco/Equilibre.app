import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper, Card, Button, MealCard } from '@/components';
import { Colors, Theme } from '@/constants';
import { User } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/hooks/useFavorites';
import { supabase } from '@/lib/supabase';

type TabType = 'info' | 'favorites';

interface FavoriteMeal {
  meal_name: string;
  calories?: number;
  ingredients?: string[];
  type?: string;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { favorites, loading: favoritesLoading, toggleFavorite, isFavorite } = useFavorites();
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [favoriteMeals, setFavoriteMeals] = useState<FavoriteMeal[]>([]);
  const [loadingMeals, setLoadingMeals] = useState(false);

  useEffect(() => {
    if (activeTab === 'favorites' && favorites.length > 0) {
      loadFavoriteMeals();
    }
  }, [activeTab, favorites]);

  const loadFavoriteMeals = async () => {
    if (!user) return;

    setLoadingMeals(true);
    try {
      const { data: mealPlans, error } = await supabase
        .from('meal_plans')
        .select('plan_data')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      const allMeals: FavoriteMeal[] = [];
      const seenMeals = new Set<string>();

      mealPlans?.forEach((plan) => {
        const planData = plan.plan_data as any;
        if (planData?.days) {
          planData.days.forEach((day: any) => {
            day.meals?.forEach((meal: any) => {
              if (favorites.includes(meal.name) && !seenMeals.has(meal.name)) {
                seenMeals.add(meal.name);
                allMeals.push({
                  meal_name: meal.name,
                  calories: meal.calories,
                  ingredients: meal.ingredients || [],
                  type: meal.type,
                });
              }
            });
          });
        }
      });

      setFavoriteMeals(allMeals);
    } catch (error) {
      console.error('Error loading favorite meals:', error);
    } finally {
      setLoadingMeals(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderInfoTab = () => (
    <>
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Mes objectifs</Text>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Objectif :</Text>
          <Text style={styles.value}>À définir</Text>
        </View>
        <View style={styles.infoRow}>
          <Text style={styles.label}>Poids actuel :</Text>
          <Text style={styles.value}>À définir</Text>
        </View>
      </Card>

      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Préférences alimentaires</Text>
        <Text style={styles.placeholder}>À définir dans l'onboarding</Text>
      </Card>

      <Button
        title="Se déconnecter"
        onPress={handleLogout}
        variant="danger"
        style={styles.logoutButton}
        loading={loading}
        disabled={loading}
      />
    </>
  );

  const renderFavoritesTab = () => {
    if (favoritesLoading || loadingMeals) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      );
    }

    if (favorites.length === 0) {
      return (
        <Card style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Aucun favori</Text>
          <Text style={styles.emptyText}>
            Vous n'avez pas encore de recettes favorites. Explorez le planning pour en ajouter !
          </Text>
        </Card>
      );
    }

    return (
      <Card style={styles.favoritesCard}>
        <Text style={styles.sectionTitle}>Mes Recettes Favorites</Text>
        {favoriteMeals.map((meal, index) => (
          <MealCard
            key={`${meal.meal_name}-${index}`}
            mealType={meal.type || 'Repas'}
            mealName={meal.meal_name}
            calories={meal.calories || 0}
            ingredients={meal.ingredients || []}
            isFavorite={true}
            onToggleFavorite={() => toggleFavorite(meal.meal_name)}
          />
        ))}
      </Card>
    );
  };

  return (
    <ScreenWrapper scrollable>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <User size={48} color={Colors.primary} />
          </View>
          <Text style={styles.name}>{user?.name || 'Utilisateur'}</Text>
          <Text style={styles.email}>{user?.email || 'email@exemple.com'}</Text>
        </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'info' && styles.tabActive]}
            onPress={() => setActiveTab('info')}
          >
            <Text style={[styles.tabText, activeTab === 'info' && styles.tabTextActive]}>
              Mes Infos
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'favorites' && styles.tabActive]}
            onPress={() => setActiveTab('favorites')}
          >
            <Text style={[styles.tabText, activeTab === 'favorites' && styles.tabTextActive]}>
              Favoris ({favorites.length})
            </Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'info' ? renderInfoTab() : renderFavoritesTab()}
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Theme.spacing.xl,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  name: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Theme.spacing.xs,
  },
  email: {
    fontSize: Theme.fontSize.md,
    color: Colors.text.secondary,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginBottom: Theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: Theme.spacing.md,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: Theme.fontSize.md,
    color: Colors.text.secondary,
    fontWeight: Theme.fontWeight.medium,
  },
  tabTextActive: {
    color: Colors.primary,
    fontWeight: Theme.fontWeight.bold,
  },
  card: {
    marginBottom: Theme.spacing.md,
  },
  favoritesCard: {
    marginBottom: Theme.spacing.md,
  },
  sectionTitle: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.sm,
  },
  label: {
    fontSize: Theme.fontSize.md,
    color: Colors.text.secondary,
  },
  value: {
    fontSize: Theme.fontSize.md,
    color: Colors.text.primary,
    fontWeight: Theme.fontWeight.medium,
  },
  placeholder: {
    fontSize: Theme.fontSize.md,
    color: Colors.text.light,
    fontStyle: 'italic',
  },
  logoutButton: {
    marginTop: Theme.spacing.md,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Theme.spacing.xl,
  },
  loadingText: {
    marginTop: Theme.spacing.md,
    fontSize: Theme.fontSize.md,
    color: Colors.text.secondary,
  },
  emptyCard: {
    padding: Theme.spacing.xl,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Theme.spacing.sm,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: Theme.fontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
