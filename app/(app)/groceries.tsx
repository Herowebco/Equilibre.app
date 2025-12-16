import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { ScreenWrapper, Card, Button } from '@/components';
import { Colors, Theme } from '@/constants';
import { ShoppingCart, Check, Square, RefreshCw } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import type { MealPlan, ShoppingList } from '@/services/ai';
import { generateShoppingList } from '@/services/ai';

export default function GroceriesScreen() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [shoppingList, setShoppingList] = useState<ShoppingList | null>(null);
  const [currentPlan, setCurrentPlan] = useState<MealPlan | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadShoppingList();
  }, [user]);

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

  const handleGenerateList = async () => {
    if (!currentPlan || !user) return;

    try {
      setGenerating(true);
      const list = await generateShoppingList(currentPlan, user.id);
      setShoppingList(list);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de générer la liste de courses');
    } finally {
      setGenerating(false);
    }
  };

  const toggleItem = (categoryIndex: number, itemIndex: number) => {
    const key = `${categoryIndex}-${itemIndex}`;
    const newChecked = new Set(checkedItems);
    if (newChecked.has(key)) {
      newChecked.delete(key);
    } else {
      newChecked.add(key);
    }
    setCheckedItems(newChecked);
  };

  const isItemChecked = (categoryIndex: number, itemIndex: number): boolean => {
    return checkedItems.has(`${categoryIndex}-${itemIndex}`);
  };

  const getTotalItems = (): number => {
    if (!shoppingList?.categories) return 0;
    return shoppingList.categories.reduce((total, cat) => total + cat.items.length, 0);
  };

  const getCheckedCount = (): number => {
    return checkedItems.size;
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

  if (!shoppingList && !generating) {
    return (
      <ScreenWrapper>
        <View style={styles.container}>
          <Text style={styles.title}>Liste de courses</Text>
          <View style={styles.emptyContainer}>
            <ShoppingCart size={64} color={Colors.primary} />
            <Text style={styles.emptyText}>
              Générez votre liste de courses consolidée et organisée par rayon.
            </Text>
            <Button
              title="Générer la liste"
              onPress={handleGenerateList}
              style={styles.generateButton}
              icon={<ShoppingCart size={20} color="#fff" />}
            />
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  if (generating) {
    return (
      <ScreenWrapper>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Création de votre liste...</Text>
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
            onPress={handleGenerateList}
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
              {category.items.map((item, itemIndex) => {
                const checked = isItemChecked(categoryIndex, itemIndex);
                return (
                  <TouchableOpacity
                    key={itemIndex}
                    style={styles.itemRow}
                    onPress={() => toggleItem(categoryIndex, itemIndex)}
                  >
                    <View style={styles.checkbox}>
                      {checked ? (
                        <Check size={20} color={Colors.primary} strokeWidth={3} />
                      ) : (
                        <Square size={20} color={Colors.text.secondary} />
                      )}
                    </View>
                    <Text
                      style={[
                        styles.itemText,
                        checked && styles.itemTextChecked,
                      ]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              })}
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
  emptyText: {
    fontSize: Theme.fontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    marginTop: Theme.spacing.lg,
    marginBottom: Theme.spacing.xl,
    lineHeight: 22,
  },
  generateButton: {
    minWidth: 200,
  },
});
