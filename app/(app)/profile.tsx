import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper, Card, Button } from '@/components';
import { Colors, Theme } from '@/constants';
import { User } from 'lucide-react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScreenWrapper scrollable>
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <User size={48} color={Colors.primary} />
          </View>
          <Text style={styles.name}>{user?.name || 'Utilisateur'}</Text>
          <Text style={styles.email}>{user?.email || 'email@exemple.com'}</Text>
        </View>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Mes objectifs</Text>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Objectif :</Text>
            <Text style={styles.value}>À définir</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Poids actuel :</Text>
            <Text style={styles.value}>À définir</Text>
          </View>
        </Card>

        <Card style={styles.card}>
          <Text style={styles.sectionTitle}>Préférences alimentaires</Text>
          <Text style={styles.placeholder}>À définir dans l'onboarding</Text>
        </Card>

        <Button
          title="Se déconnecter"
          onPress={handleLogout}
          variant="outline"
          style={styles.logoutButton}
          loading={loading}
          disabled={loading}
        />
      </View>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Theme.spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: Theme.spacing.xl,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  name: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Theme.spacing.xs,
  },
  email: {
    fontSize: Theme.fontSize.md,
    color: Colors.text.secondary,
  },
  card: {
    marginBottom: Theme.spacing.md,
  },
  sectionTitle: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Theme.spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Theme.spacing.sm,
  },
  label: {
    fontSize: Theme.fontSize.md,
    color: Colors.text.secondary,
  },
  value: {
    fontSize: Theme.fontSize.md,
    color: Colors.text.primary,
    fontWeight: Theme.fontWeight.medium,
  },
  placeholder: {
    fontSize: Theme.fontSize.md,
    color: Colors.text.light,
    fontStyle: 'italic',
  },
  logoutButton: {
    marginTop: Theme.spacing.md,
  },
});
