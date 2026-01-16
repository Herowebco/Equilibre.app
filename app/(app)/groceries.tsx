import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ScreenWrapper, Card, Button } from '@/components';
import { Colors, Theme } from '@/constants';
import { ShoppingCart, Check, Square, RefreshCw, ShoppingBasket } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { MealPlan, ShoppingList } from '@/services/ai';
import { generateShoppingList, updateShoppingListItems } from '@/services/ai';

const LOADING_MESSAGES = [
  'Exploration de vos placards virtuels...',
  'Organisation des ingrédients par rayon...',
  'Vérification des quantités nécessaires...',
  'Préparation de votre chariot de courses...',
  'Chasse aux ingrédients manquants...',
  'Finalisation de votre liste optimisée !',
];

export default function GroceriesScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [shoppingList, setShoppingList] = useState<ShoppingList | null>(null);
  const [currentPlan, setCurrentPlan] = useState<MealPlan | null>(null);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const bounceAnim = useState(new Animated.Value(0))[0];

  useFocusEffect(
    useCallback(() => {
      loadShoppingList();
    }, [user])
  );

  useEffect(() => {
    if (loading || generating) {
      const messageInterval = setInterval(() => {
        setLoadingMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
      }, 2500);

      Animated.loop(
        Animated.sequence([
          Animated.timing(bounceAnim, {
            toValue: -10,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(bounceAnim, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();

      return () => {
        clearInterval(messageInterval);
        bounceAnim.setValue(0);
      };
    }
  }, [loading, generating]);

  const loadShoppingList = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('meal_plans')
        .select('plan_data, shopping_list')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setCurrentPlan(data.plan_data as MealPlan);
        if (data.shopping_list) {
          setShoppingList(data.shopping_list as ShoppingList);
        }
      }
    } catch (error) {
      console.error('Error loading shopping list:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateList = async (plan?: MealPlan) => {
    const planToUse = plan || currentPlan;
    if (!planToUse || !user) return;

    try {
      setGenerating(true);
      const list = await generateShoppingList(planToUse, user.id);
      setShoppingList(list);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de générer la liste de courses');
    } finally {
      setGenerating(false);
    }
  };

  const toggleItem = async (categoryIndex: number, itemIndex: number) => {
    if (!shoppingList || !user) return;

    const newShoppingList = { ...shoppingList };
    newShoppingList.categories = [...shoppingList.categories];
    newShoppingList.categories[categoryIndex] = {
      ...shoppingList.categories[categoryIndex],
      items: [...shoppingList.categories[categoryIndex].items],
    };
    newShoppingList.categories[categoryIndex].items[itemIndex] = {
      ...shoppingList.categories[categoryIndex].items[itemIndex],
      checked: !shoppingList.categories[categoryIndex].items[itemIndex].checked,
    };

    setShoppingList(newShoppingList);

    try {
      await updateShoppingListItems(user.id, newShoppingList);
    } catch (error) {
      console.error('Error updating shopping list:', error);
    }
  };

  const getTotalItems = (): number => {
    if (!shoppingList?.categories) return 0;
    return shoppingList.categories.reduce((total, cat) => total + cat.items.length, 0);
  };

  const getCheckedCount = (): number => {
    if (!shoppingList?.categories) return 0;
    return shoppingList.categories.reduce(
      (total, cat) => total + cat.items.filter(item => item.checked).length,
      0
    );
  };

  const formatItemQuantity = (item: any): string => {
    const amount = item.amount && item.amount > 0 ? item.amount : '';
    const unit = item.unit ? item.unit : '';
    const name = item.name || '';

    if (amount && unit) {
      return `${amount} ${unit} ${name}`.trim();
    } else if (amount) {
      return `${amount} ${name}`.trim();
    } else {
      return name;
    }
  };

  if (loading || generating) {
    return (
      <ScreenWrapper>
        <View style={styles.centerContainer}>
          <Animated.View
            style={[
              styles.iconContainer,
              { transform: [{ translateY: bounceAnim }] },
            ]}
          >
            <ShoppingBasket size={64} color={Colors.primary} strokeWidth={2} />
          </Animated.View>
          <Text style={styles.loadingText}>
            {LOADING_MESSAGES[loadingMessageIndex]}
          </Text>
        </View>
      </ScreenWrapper>
    );
  }

  if (!currentPlan) {
    return (
      <ScreenWrapper>
        <View style={styles.container}>
          <Text style={styles.title}>Liste de courses</Text>
          <View style={styles.emptyContainer}>
            <ShoppingCart size={64} color={Colors.text.light} />
            <Text style={styles.emptyText}>
              Créez d'abord un plan de repas pour générer votre liste de courses.
            </Text>
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  if (!shoppingList || getTotalItems() === 0) {
    return (
      <ScreenWrapper>
        <View style={styles.container}>
          <Text style={styles.title}>Liste de courses</Text>
          <View style={styles.emptyContainer}>
            <ShoppingBasket size={80} color={Colors.primary} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>
              Votre liste est prête à être créée
            </Text>
            <Text style={styles.emptyText}>
              Générez automatiquement tous les ingrédients nécessaires pour vos repas de la semaine.
            </Text>
            <Button
              title="Générer ma liste de courses"
              onPress={() => handleGenerateList()}
              style={styles.generateButton}
              disabled={generating}
            />
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  const totalItems = getTotalItems();
  const checkedCount = getCheckedCount();

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Liste de courses</Text>
            <Text style={styles.subtitle}>
              {checkedCount} / {totalItems} articles cochés
            </Text>
          </View>
          <TouchableOpacity
            onPress={() => handleGenerateList()}
            style={styles.refreshButton}
            disabled={generating}
          >
            <RefreshCw size={24} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {shoppingList?.categories?.map((category, categoryIndex) => (
            <Card key={categoryIndex} style={styles.categoryCard}>
              <Text style={styles.categoryName}>{category.name}</Text>
              {category.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={itemIndex}
                  style={styles.itemRow}
                  onPress={() => toggleItem(categoryIndex, itemIndex)}
                >
                  <View style={styles.checkbox}>
                    {item.checked ? (
                      <Check size={20} color={Colors.primary} strokeWidth={3} />
                    ) : (
                      <Square size={20} color={Colors.text.secondary} />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.itemText,
                      item.checked && styles.itemTextChecked,
                    ]}
                  >
                    {formatItemQuantity(item)}
                  </Text>
                </TouchableOpacity>
              ))}
            </Card>
          ))}
        </ScrollView>
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Theme.spacing.lg,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.xl,
  },
  iconContainer: {
    marginBottom: Theme.spacing.xl,
  },
  loadingText: {
    marginTop: Theme.spacing.md,
    fontSize: Theme.fontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    paddingHorizontal: Theme.spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
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
  refreshButton: {
    padding: Theme.spacing.sm,
  },
  scrollView: {
    flex: 1,
  },
  categoryCard: {
    marginBottom: Theme.spacing.md,
  },
  categoryName: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.primary,
    marginBottom: Theme.spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.xs,
  },
  checkbox: {
    width: 24,
    height: 24,
    marginRight: Theme.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    fontSize: Theme.fontSize.md,
    color: Colors.text.primary,
    flex: 1,
  },
  itemTextChecked: {
    color: Colors.text.secondary,
    textDecorationLine: 'line-through',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text.primary,
    textAlign: 'center',
    marginTop: Theme.spacing.xl,
    marginBottom: Theme.spacing.sm,
  },
  emptyText: {
    fontSize: Theme.fontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Theme.spacing.sm,
    marginBottom: Theme.spacing.xl,
    lineHeight: 22,
    paddingHorizontal: Theme.spacing.md,
  },
  generateButton: {
    minWidth: 250,
    marginTop: Theme.spacing.md,
  },
});
