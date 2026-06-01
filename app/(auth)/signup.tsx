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
import { z } from 'zod';

const signupSchema = z
  .object({
    fullName: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
    email: z
      .string()
      .min(1, "L'email est requis")
      .email("Format d'email invalide"),
    password: z
      .string()
      .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
      .regex(/[0-9]/, 'Le mot de passe doit contenir au moins 1 chiffre')
      .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins 1 majuscule'),
    confirmPassword: z.string().min(1, 'Veuillez confirmer votre mot de passe'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

type FieldErrors = {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
};

export default function SignupScreen() {
  const router = useRouter();
  const { signup, signInWithGoogle, signInWithApple } = useAuth();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  const handleSignup = async () => {
    setFieldErrors({});

    const validation = signupSchema.safeParse({
      fullName,
      email,
      password,
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
      await signup(email, password, fullName);
    } catch (supabaseError: any) {
      const errorMessage = supabaseError?.message || '';

      if (
        errorMessage.toLowerCase().includes('already registered') ||
        errorMessage.toLowerCase().includes('already exists') ||
        errorMessage.toLowerCase().includes('user already registered')
      ) {
        setFieldErrors({ email: 'Cet email possède déjà un compte.' });
      } else {
        setFieldErrors({
          email:
            errorMessage || "Une erreur est survenue lors de l'inscription",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setFieldErrors({});
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      setFieldErrors({
        email: err.message || 'Une erreur est survenue avec Google',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignup = async () => {
    setFieldErrors({});
    setLoading(true);
    try {
      await signInWithApple();
      router.replace('/onboarding');
    } catch (err: any) {
      if (err.code !== 'ERR_REQUEST_CANCELED') {
        setFieldErrors({
          email: err.message || 'Une erreur est survenue avec Apple',
        });
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
            <Text style={styles.title}>Inscription</Text>
            <Text style={styles.subtitle}>Équilibre</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nom complet</Text>
              <TextInput
                style={[
                  styles.input,
                  fieldErrors.fullName && styles.inputError,
                ]}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Jean Dupont"
                placeholderTextColor={Colors.text.light}
                autoCapitalize="words"
                textContentType="name"
                autoComplete="off"
                editable={!loading}
              />
              {fieldErrors.fullName && (
                <Text style={styles.fieldErrorText}>
                  {fieldErrors.fullName}
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={[styles.input, fieldErrors.email && styles.inputError]}
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
              {fieldErrors.email && (
                <Text style={styles.fieldErrorText}>{fieldErrors.email}</Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mot de passe</Text>
              <TextInput
                style={[
                  styles.input,
                  fieldErrors.password && styles.inputError,
                ]}
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
              {fieldErrors.password && (
                <Text style={styles.fieldErrorText}>
                  {fieldErrors.password}
                </Text>
              )}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmer le mot de passe</Text>
              <TextInput
                style={[
                  styles.input,
                  fieldErrors.confirmPassword && styles.inputError,
                ]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="••••••••"
                placeholderTextColor={Colors.text.light}
                secureTextEntry
                autoCapitalize="none"
                textContentType="oneTimeCode"
                autoComplete="off"
                editable={!loading}
              />
              {fieldErrors.confirmPassword && (
                <Text style={styles.fieldErrorText}>
                  {fieldErrors.confirmPassword}
                </Text>
              )}
            </View>

            <Button
              title={loading ? 'Création du compte...' : "S'inscrire"}
              onPress={handleSignup}
              loading={loading}
              disabled={loading}
              style={styles.button}
            />

            <SocialAuthButtons
              onGooglePress={handleGoogleSignup}
              onApplePress={handleAppleSignup}
              loading={loading}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>Déjà un compte ? </Text>
              <Link href="/(auth)/login" asChild>
                <TouchableOpacity disabled={loading}>
                  <Text style={styles.link}>Se connecter</Text>
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
                  <Text style={styles.legalLink}>
                    Politique de confidentialité
                  </Text>
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
    marginBottom: Theme.spacing.xl,
  },
  title: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Theme.spacing.sm,
  },
  subtitle: {
    fontSize: Theme.fontSize.xl,
    color: Colors.primary,
    fontWeight: Theme.fontWeight.medium,
  },
  form: {
    width: '100%',
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
  button: {
    marginTop: Theme.spacing.md,
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
