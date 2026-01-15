import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper, Card, Button, MealCard, PasswordSettings, WeightChart } from '@/components';
import { Colors, Theme } from '@/constants';
import { User, HelpCircle, ChevronRight, Settings } from 'lucide-react-native';
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
  const [isEmailPasswordUser, setIsEmailPasswordUser] = useState(false);
  const [checkingAuthProvider, setCheckingAuthProvider] = useState(true);

  useEffect(() => {
    const checkAuthProvider = async () => {
      try {
        const { data: { user: authUser }, error } = await supabase.auth.getUser();

        if (error || !authUser) {
          setCheckingAuthProvider(false);
          return;
        }

        const identities = authUser.identities || [];
        const hasEmailProvider = identities.some(
          (identity) => identity.provider === 'email'
        );

        setIsEmailPasswordUser(hasEmailProvider);
      } catch (error) {
        console.error('Error checking auth provider:', error);
      } finally {
        setCheckingAuthProvider(false);
      }
    };

    checkAuthProvider();
  }, []);

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
      <WeightChart />

      <TouchableOpacity
        style={styles.settingsCard}
        onPress={() => router.push('/(app)/profile-settings')}
        activeOpacity={0.7}
      >
        <View style={styles.settingsContent}>
          <View style={styles.settingsIconContainer}>
            <Settings size={24} color={Colors.primary} />
          </View>
          <View style={styles.settingsText}>
            <Text style={styles.settingsTitle}>Modifier mon profil</Text>
            <Text style={styles.settingsDescription}>
              Informations physiques et préférences
            </Text>
          </View>
          <ChevronRight size={20} color={Colors.text.light} />
        </View>
      </TouchableOpacity>

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

      {!checkingAuthProvider && (
        <>
          {isEmailPasswordUser ? (
            <PasswordSettings userEmail={user?.email || ''} />
          ) : (
            <Card style={styles.card}>
              <Text style={styles.sectionTitle}>Mot de passe</Text>
              <Text style={styles.oauthMessage}>
                Vous êtes connecté via Google. La gestion du mot de passe se fait directement chez votre fournisseur d'authentification.
              </Text>
            </Card>
          )}
        </>
      )}

      <TouchableOpacity
        style={styles.supportCard}
        onPress={() => router.push('/(app)/support')}
        activeOpacity={0.7}
      >
        <View style={styles.supportContent}>
          <View style={styles.supportIconContainer}>
            <HelpCircle size={24} color={Colors.primary} />
          </View>
          <View style={styles.supportText}>
            <Text style={styles.supportTitle}>Aide & Support</Text>
            <Text style={styles.supportDescription}>
              FAQ et contact support
            </Text>
          </View>
          <ChevronRight size={20} color={Colors.text.light} />
        </View>
      </TouchableOpacity>

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
  oauthMessage: {
    fontSize: Theme.fontSize.md,
    color: Colors.text.secondary,
    lineHeight: 22,
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
  supportCard: {
    backgroundColor: Colors.white,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  supportContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
  },
  supportIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${Colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  supportText: {
    flex: 1,
  },
  supportTitle: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Theme.spacing.xs,
  },
  supportDescription: {
    fontSize: Theme.fontSize.sm,
    color: Colors.text.secondary,
  },
  settingsCard: {
    backgroundColor: Colors.white,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  settingsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Theme.spacing.md,
  },
  settingsIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${Colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsText: {
    flex: 1,
  },
  settingsTitle: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Theme.spacing.xs,
  },
  settingsDescription: {
    fontSize: Theme.fontSize.sm,
    color: Colors.text.secondary,
  },
});
