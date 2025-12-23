import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRouter, Link } from 'expo-router';
import { ScreenWrapper, Button } from '@/components';
import { Colors, Theme } from '@/constants';
import { supabase } from '@/lib/supabase';

export default function ResetPasswordScreen() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [isValidSession, setIsValidSession] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsValidSession(!!session);
    });
  }, []);

  const handleResetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    if (newPassword.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      setSuccess(true);

      setTimeout(() => {
        router.replace('/(auth)/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de la réinitialisation');
    } finally {
      setLoading(false);
    }
  };

  if (isValidSession === null) {
    return (
      <ScreenWrapper>
        <View style={styles.container}>
          <View style={styles.content}>
            <Text style={styles.subtitle}>Chargement...</Text>
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  if (isValidSession === false) {
    return (
      <ScreenWrapper>
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Lien invalide ou expiré</Text>
              <Text style={styles.subtitle}>
                Le lien de réinitialisation n'est plus valide. Veuillez faire une nouvelle demande.
              </Text>
            </View>

            <Button
              title="Demander un nouveau lien"
              onPress={() => router.push('/(auth)/forgot-password')}
            />
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  if (success) {
    return (
      <ScreenWrapper>
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Mot de passe modifié !</Text>
              <Text style={styles.subtitle}>
                Votre mot de passe a été réinitialisé avec succès. Vous allez être redirigé vers la page de connexion.
              </Text>
            </View>

            <View style={styles.successContainer}>
              <Text style={styles.successText}>
                Vous pouvez maintenant vous connecter avec votre nouveau mot de passe.
              </Text>
            </View>
          </View>
        </View>
      </ScreenWrapper>
    );
  }

  return (
    <ScreenWrapper scrollable>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Nouveau mot de passe</Text>
            <Text style={styles.subtitle}>
              Choisissez un nouveau mot de passe pour votre compte.
            </Text>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nouveau mot de passe</Text>
              <TextInput
                style={styles.input}
                value={newPassword}
                onChangeText={setNewPassword}
                placeholder="••••••••"
                placeholderTextColor={Colors.text.light}
                secureTextEntry
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmer le mot de passe</Text>
              <TextInput
                style={styles.input}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                placeholderTextColor={Colors.text.light}
                secureTextEntry
                autoCapitalize="none"
                editable={!loading}
              />
            </View>

            <Button
              title="Réinitialiser le mot de passe"
              onPress={handleResetPassword}
              loading={loading}
              disabled={loading}
              style={styles.button}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Vous vous souvenez de votre mot de passe ? </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity disabled={loading}>
                  <Text style={styles.link}>Se connecter</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: Theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Theme.spacing.xxl,
  },
  title: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Theme.spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Theme.fontSize.md,
    color: Colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    width: '100%',
  },
  inputGroup: {
    marginBottom: Theme.spacing.lg,
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
  button: {
    marginTop: Theme.spacing.md,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.sm,
    marginBottom: Theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.error,
  },
  errorText: {
    color: Colors.error,
    fontSize: Theme.fontSize.md,
  },
  successContainer: {
    backgroundColor: '#E8F5E9',
    padding: Theme.spacing.md,
    borderRadius: Theme.borderRadius.sm,
    marginBottom: Theme.spacing.lg,
    borderLeftWidth: 4,
    borderLeftColor: Colors.success,
  },
  successText: {
    color: '#2E7D32',
    fontSize: Theme.fontSize.md,
    lineHeight: 22,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Theme.spacing.lg,
  },
  footerText: {
    fontSize: Theme.fontSize.md,
    color: Colors.text.secondary,
  },
  link: {
    fontSize: Theme.fontSize.md,
    color: Colors.primary,
    fontWeight: Theme.fontWeight.medium,
  },
});
