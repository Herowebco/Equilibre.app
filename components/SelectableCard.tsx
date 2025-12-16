import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Theme } from '@/constants';

interface SelectableCardProps {
  title: string;
  selected: boolean;
  onPress: () => void;
  style?: ViewStyle;
}

export function SelectableCard({
  title,
  selected,
  onPress,
  style,
}: SelectableCardProps) {
  return (
    <TouchableOpacity
      style={[
        styles.card,
        selected && styles.selectedCard,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.text, selected && styles.selectedText]}>
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 60,
  },
  selectedCard: {
    borderColor: Colors.primary,
    backgroundColor: `${Colors.primary}15`,
  },
  text: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.medium,
    color: Colors.text.primary,
  },
  selectedText: {
    color: Colors.primary,
    fontWeight: Theme.fontWeight.bold,
  },
});
