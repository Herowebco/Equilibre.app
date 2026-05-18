import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Alert } from 'react-native';
import { Button, Card } from '@/components';
import { Colors, Theme } from '@/constants';
import { supabase } from '@/lib/supabase';
import { z } from 'zod';

const passwordChangeSchema = z.object({
  oldPassword: z.string()
    .min(1, 'L\'ancien mot de passe est requis'),
  newPassword: z.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins 1 chiffre')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins 1 majuscule'),
  confirmPassword: z.string()
    .min(1, 'Veuillez confirmer votre mot de passe'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

type FieldErrors = {
  oldPassword?: string;
  newPassword?: string;
  confirmPassword?: string;
};

interface PasswordSettingsProps {
  userEmail: string;
}

export function PasswordSettings({ userEmail }: PasswordSettingsProps) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [successMessage, setSuccessMessage] = useState('');

  const handlePasswordChange = async () => {
    setFieldErrors({});
    setSuccessMessage('');

    const validation = passwordChangeSchema.safeParse({
      oldPassword,
      newPassword,
      confirmPassword,
    });

    if (!validation.success) {
      const validationErrors: FieldErrors = {};
      validation.error.issues.forEach((issue) => {
        const fieldName = issue.path[0] as keyof FieldErrors;
        if (fieldName && !validationErrors[fieldName]) {
          validationErrors[fieldName] = issue.message;
        }
      });
      setFieldErrors(validationErrors);
      return;
    }

    setLoading(true);

    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: userEmail,
        password: oldPassword,
      });

      if (signInError) {
        setFieldErrors({ oldPassword: 'L\'ancien mot de passe est incorrect' });
        setLoading(false);
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        throw updateError;
      }

      setSuccessMessage('Mot de passe mis à jour avec succès');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');

      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (error: any) {
      setFieldErrors({
        newPassword: error?.message || 'Une erreur est survenue lors de la mise à jour',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card style={styles.card}>
      <Text style={styles.sectionTitle}>Changer le mot de passe</Text>

      {successMessage && (
        <View style={styles.successContainer}>
          <Text style={styles.successText}>{successMessage}</Text>
        </View>
      )}

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Ancien mot de passe</Text>
        <TextInput
          style={[styles.input, fieldErrors.oldPassword && styles.inputError]}
          value={oldPassword}
          onChangeText={setOldPassword}
          placeholder="••••••••"
          placeholderTextColor={Colors.text.light}
          secureTextEntry
          autoCapitalize="none"
          textContentType="oneTimeCode"
          autoComplete="off"
          editable={!loading}
        />
        {fieldErrors.oldPassword && (
          <Text style={styles.fieldErrorText}>{fieldErrors.oldPassword}</Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Nouveau mot de passe</Text>
        <TextInput
          style={[styles.input, fieldErrors.newPassword && styles.inputError]}
          value={newPassword}
          onChangeText={setNewPassword}
          placeholder="••••••••"
          placeholderTextColor={Colors.text.light}
          secureTextEntry
          autoCapitalize="none"
          textContentType="oneTimeCode"
          autoComplete="off"
          editable={!loading}
        />
        {fieldErrors.newPassword && (
          <Text style={styles.fieldErrorText}>{fieldErrors.newPassword}</Text>
        )}
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Confirmer le nouveau mot de passe</Text>
        <TextInput
          style={[styles.input, fieldErrors.confirmPassword && styles.inputError]}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="••••••••"
          placeholderTextColor={Colors.text.light}
          secureTextEntry
          textContentType="oneTimeCode"
          autoComplete="off"
          autoCapitalize="none"
          editable={!loading}
        />
        {fieldErrors.confirmPassword && (
          <Text style={styles.fieldErrorText}>{fieldErrors.confirmPassword}</Text>
        )}
      </View>

      <Button
        title="Mettre à jour le mot de passe"
        onPress={handlePasswordChange}
        loading={loading}
        disabled={loading}
        style={styles.button}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: Theme.spacing.md,
  },
  sectionTitle: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Theme.spacing.md,
  },
  inputGroup: {
    marginBottom: Theme.spacing.md,
  },
  label: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.medium,
    color: Colors.text.primary,
    marginBottom: Theme.spacing.sm,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    fontSize: Theme.fontSize.md,
    color: Colors.text.primary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  inputError: {
    borderColor: Colors.error,
    borderWidth: 2,
  },
  fieldErrorText: {
    color: Colors.error,
    fontSize: Theme.fontSize.sm,
    marginTop: Theme.spacing.xs,
    marginLeft: Theme.spacing.xs,
  },
  successContainer: {
    backgroundColor: '#d4edda',
    borderColor: '#c3e6cb',
    borderWidth: 1,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
  },
  successText: {
    color: '#155724',
    fontSize: Theme.fontSize.md,
    textAlign: 'center',
  },
  button: {
    marginTop: Theme.spacing.sm,
  },
});
