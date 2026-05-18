import React, { useState } from 'react';
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

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      setError('Veuillez entrer votre adresse email');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const redirectTo = typeof window !== 'undefined'
        ? `${window.location.origin}/reset-password`
        : undefined;

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (error) throw error;

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de l\'envoi du lien');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <ScreenWrapper>
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Email envoyé !</Text>
              <Text style={styles.subtitle}>
                Consultez votre boîte de réception et cliquez sur le lien pour réinitialiser votre mot de passe.
              </Text>
            </View>

            <View style={styles.successContainer}>
              <Text style={styles.successText}>
                Si vous ne recevez pas d'email dans quelques minutes, vérifiez vos spams ou réessayez.
              </Text>
            </View>

            <Button
              title="Retour à la connexion"
              onPress={() => router.push('/(auth)/login')}
            />
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
            <Text style={styles.title}>Mot de passe oublié ?</Text>
            <Text style={styles.subtitle}>
              Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </Text>
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="votre@email.com"
                placeholderTextColor={Colors.text.light}
                keyboardType="email-address"
                autoCapitalize="none"
                textContentType="emailAddress"
                autoComplete="off"
                editable={!loading}
              />
            </View>

            <Button
              title="Envoyer le lien de réinitialisation"
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
    marginTop: Theme.spacing.xxl,
    flexWrap: 'wrap',
    gap: 4,
  },
  footerText: {
    fontSize: Theme.fontSize.md,
    color: Colors.text.secondary,
  },
  link: {
    fontSize: Theme.fontSize.md,
    color: Colors.primary,
    fontWeight: Theme.fontWeight.bold,
    textDecorationLine: 'underline',
  },
});
