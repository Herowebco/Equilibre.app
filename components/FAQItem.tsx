import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { ChevronDown } from 'lucide-react-native';
import { Colors, Theme } from '@/constants';

interface FAQItemProps {
  question: string;
  answer: string;
}

export function FAQItem({ question, answer }: FAQItemProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.questionContainer}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.7}
      >
        <Text style={styles.question}>{question}</Text>
        <View style={[styles.iconContainer, isOpen && styles.iconRotated]}>
          <ChevronDown size={20} color={Colors.primary} />
        </View>
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.answerContainer}>
          <Text style={styles.answer}>{answer}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  questionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.md,
  },
  question: {
    flex: 1,
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.medium,
    color: Colors.text.primary,
    marginRight: Theme.spacing.sm,
  },
  iconContainer: {
    transform: [{ rotate: '0deg' }],
  },
  iconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  answerContainer: {
    padding: Theme.spacing.md,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  answer: {
    fontSize: Theme.fontSize.md,
    color: Colors.text.secondary,
    lineHeight: 22,
  },
});
