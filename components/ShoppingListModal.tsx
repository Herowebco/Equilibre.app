import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { X, Check, Square } from 'lucide-react-native';
import { Colors, Theme } from '@/constants';
import type { ShoppingList } from '@/services/ai';
import { updateShoppingListItems } from '@/services/ai';

interface ShoppingListModalProps {
  visible: boolean;
  onClose: () => void;
  shoppingList: ShoppingList | null;
  loading: boolean;
  userId: string | null;
  onUpdate?: () => void;
}

export function ShoppingListModal({
  visible,
  onClose,
  shoppingList: initialShoppingList,
  loading,
  userId,
  onUpdate,
}: ShoppingListModalProps) {
  const [shoppingList, setShoppingList] = useState<ShoppingList | null>(initialShoppingList);

  useEffect(() => {
    setShoppingList(initialShoppingList);
  }, [initialShoppingList]);

  const toggleItem = async (categoryIndex: number, itemIndex: number) => {
    if (!shoppingList || !userId) return;

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
      await updateShoppingListItems(userId, newShoppingList);
      onUpdate?.();
    } catch (error) {
      console.error('Error updating shopping list:', error);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Ma Liste de Courses</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={24} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Création de votre liste...</Text>
          </View>
        ) : shoppingList && shoppingList.categories ? (
          <ScrollView style={styles.modalContent}>
            {shoppingList.categories.map((category, categoryIndex) => (
              <View key={categoryIndex} style={styles.category}>
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
                      {item.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            ))}
            <View style={styles.bottomSpacer} />
          </ScrollView>
        ) : (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>
              Impossible de générer la liste de courses
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.white,
  },
  modalTitle: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text.primary,
  },
  closeButton: {
    padding: Theme.spacing.xs,
  },
  modalContent: {
    flex: 1,
    padding: Theme.spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Theme.spacing.md,
    fontSize: Theme.fontSize.md,
    color: Colors.text.secondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Theme.spacing.xl,
  },
  errorText: {
    fontSize: Theme.fontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  category: {
    marginBottom: Theme.spacing.xl,
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
  bottomSpacer: {
    height: 40,
  },
});
