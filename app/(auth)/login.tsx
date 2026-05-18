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
import { ScreenWrapper, Button, SocialAuthButtons } from '@/components';
import { Colors, Theme } from '@/constants';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginScreen() {
  const router = useRouter();
  const { login, signInWithGoogle, signInWithApple, profileComplete } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setError('');
    setLoading(true);

    try {
      await login(email, password);
      router.replace('/(app)');
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      await signInWithGoogle();
    } catch (err: any) {
      setError(err.message || 'Une erreur est survenue lors de la connexion avec Google');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    setError('');
    setLoading(true);

    try {
      await signInWithApple();
      if (profileComplete) {
        router.replace('/(app)');
      } else {
        router.replace('/onboarding');
      }
    } catch (err: any) {
      if (err.code === 'ERR_REQUEST_CANCELED') {
        setError('');
      } else {
        setError(err.message || 'Une erreur est survenue lors de la connexion avec Apple');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper scrollable>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>Bienvenue sur Équilibre</Text>
            <Text style={styles.subtitle}>Votre nutrition, simplifiée par l'IA.</Text>
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

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mot de passe</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor={Colors.text.light}
                secureTextEntry
                autoCapitalize="none"
                textContentType="oneTimeCode"
                autoComplete="off"
                editable={!loading}
              />
              <Link href="/(auth)/forgot-password" asChild>
                <TouchableOpacity style={styles.forgotPassword} disabled={loading}>
                  <Text style={styles.forgotPasswordText}>Mot de passe oublié ?</Text>
                </TouchableOpacity>
              </Link>
            </View>

            <Button
              title="Se connecter"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={styles.button}
            />

            <SocialAuthButtons
              onGooglePress={handleGoogleLogin}
              onApplePress={handleAppleLogin}
              loading={loading}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Pas encore de compte ? </Text>
              <Link href="/(auth)/signup" asChild>
                <TouchableOpacity disabled={loading}>
                  <Text style={styles.link}>S'inscrire</Text>
                </TouchableOpacity>
              </Link>
            </View>

            <View style={styles.legalFooter}>
              <Link href="/cgu" asChild>
                <TouchableOpacity>
                  <Text style={styles.legalLink}>CGU</Text>
                </TouchableOpacity>
              </Link>
              <Text style={styles.legalSeparator}>•</Text>
              <Link href="/confidentialite" asChild>
                <TouchableOpacity>
                  <Text style={styles.legalLink}>Politique de confidentialité</Text>
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
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: Theme.spacing.sm,
  },
  forgotPasswordText: {
    fontSize: Theme.fontSize.sm,
    color: Colors.primary,
    fontWeight: Theme.fontWeight.medium,
  },
  legalFooter: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Theme.spacing.xl,
    gap: 8,
  },
  legalLink: {
    fontSize: 12,
    color: Colors.text.light,
  },
  legalSeparator: {
    fontSize: 12,
    color: Colors.text.light,
  },
});
