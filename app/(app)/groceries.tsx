import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { ScreenWrapper, Card, Button } from '@/components';
import { Colors, Theme } from '@/constants';
import { ShoppingCart, Check, Square } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { MealPlan } from '@/services/ai';

interface GroceryItem {
  name: string;
  checked: boolean;
}

export default function GroceriesScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [groceries, setGroceries] = useState<GroceryItem[]>([]);

  useEffect(() => {
    loadGroceries();
  }, [user]);

  const loadGroceries = async () => {
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
        const mealPlan = data.plan_data as MealPlan;
        const ingredients = extractIngredients(mealPlan);
        setGroceries(ingredients);
      }
    } catch (error) {
      console.error('Error loading groceries:', error);
    } finally {
      setLoading(false);
    }
  };

  const extractIngredients = (plan: MealPlan): GroceryItem[] => {
    if (!plan?.days || plan.days.length === 0) return [];

    const ingredientsSet = new Set<string>();

    plan.days.forEach((day) => {
      if (day?.meals && Array.isArray(day.meals)) {
        day.meals.forEach((meal) => {
          if (meal?.ingredients && Array.isArray(meal.ingredients)) {
            meal.ingredients.forEach((ingredient) => {
              if (ingredient && typeof ingredient === 'string') {
                ingredientsSet.add(ingredient.trim());
              }
            });
          }
        });
      }
    });

    return Array.from(ingredientsSet)
      .sort()
      .map((name) => ({ name, checked: false }));
  };

  const toggleItem = (index: number) => {
    setGroceries((prev) =>
      prev.map((item, i) => (i === index ? { ...item, checked: !item.checked } : item))
    );
  };

  const toggleAll = () => {
    const allChecked = groceries.every((item) => item.checked);
    setGroceries((prev) =>
      prev.map((item) => ({ ...item, checked: !allChecked }))
    );
  };

  const renderItem = ({ item, index }: { item: GroceryItem; index: number }) => (
    <TouchableOpacity
      style={styles.itemContainer}
      onPress={() => toggleItem(index)}
      activeOpacity={0.7}
    >
      <View style={styles.checkbox}>
        {item.checked ? (
          <Check size={20} color={Colors.primary} strokeWidth={3} />
        ) : (
          <Square size={20} color={Colors.text.light} strokeWidth={2} />
        )}
      </View>
      <Text
        style={[
          styles.itemText,
          item.checked && styles.itemTextChecked,
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

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

  if (groceries.length === 0) {
    return (
      <ScreenWrapper>
        <View style={styles.container}>
          <Text style={styles.title}>Liste de courses</Text>
          <Text style={styles.subtitle}>
            Vos ingrédients pour la semaine
          </Text>

          <View style={styles.emptyContainer}>
            <ShoppingCart size={64} color={Colors.text.light} />
            <Text style={styles.emptyText}>
              Votre liste de courses apparaîtra ici une fois votre plan généré.
            </Text>
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  const checkedCount = groceries.filter((item) => item.checked).length;
  const allChecked = groceries.every((item) => item.checked);

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Liste de courses</Text>
            <Text style={styles.subtitle}>
              {checkedCount} / {groceries.length} articles cochés
            </Text>
          </View>
          <Button
            title={allChecked ? 'Tout décocher' : 'Tout cocher'}
            onPress={toggleAll}
            variant="outline"
            style={styles.toggleButton}
          />
        </View>

        <Card style={styles.listCard}>
          <FlatList
            data={groceries}
            renderItem={renderItem}
            keyExtractor={(item, index) => `${item.name}-${index}`}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </Card>
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
  loadingText: {
    marginTop: Theme.spacing.md,
    fontSize: Theme.fontSize.md,
    color: Colors.text.secondary,
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
  toggleButton: {
    paddingHorizontal: Theme.spacing.md,
  },
  listCard: {
    flex: 1,
    padding: Theme.spacing.md,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
  },
  checkbox: {
    width: 24,
    height: 24,
    marginRight: Theme.spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    flex: 1,
    fontSize: Theme.fontSize.md,
    color: Colors.text.primary,
  },
  itemTextChecked: {
    color: Colors.text.light,
    textDecorationLine: 'line-through',
  },
  separator: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Theme.spacing.xs,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.xl,
  },
  emptyText: {
    fontSize: Theme.fontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Theme.spacing.lg,
    lineHeight: 22,
  },
});
