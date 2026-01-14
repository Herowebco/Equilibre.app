import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '@/components';
import { Colors, Theme } from '@/constants';
import { ArrowLeft } from 'lucide-react-native';

export default function TermsOfServiceScreen() {
  const router = useRouter();

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.primary} />
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>

        <View style={styles.document}>
          <Text style={styles.title}>Conditions Générales d'Utilisation</Text>
          <Text style={styles.lastUpdated}>Dernière mise à jour : Janvier 2026</Text>

          <Text style={styles.sectionTitle}>1. Acceptation des conditions</Text>
          <Text style={styles.paragraph}>
            En accédant et en utilisant l'application Équilibre, vous acceptez d'être lié par les présentes
            Conditions Générales d'Utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser
            notre service.
          </Text>

          <Text style={styles.sectionTitle}>2. Description du service</Text>
          <Text style={styles.paragraph}>
            Équilibre est une application de nutrition personnalisée utilisant l'intelligence artificielle pour
            générer des plans de repas adaptés à vos besoins. Le service comprend la génération de menus,
            des recettes détaillées et des listes de courses.
          </Text>

          <Text style={styles.sectionTitle}>3. Utilisation du service</Text>
          <Text style={styles.paragraph}>
            Vous vous engagez à utiliser le service uniquement à des fins légales et conformément aux présentes
            conditions. Vous êtes responsable de maintenir la confidentialité de votre compte et de votre mot de passe.
          </Text>

          <Text style={styles.sectionTitle}>4. Propriété intellectuelle</Text>
          <Text style={styles.paragraph}>
            Tout le contenu présent sur l'application, y compris les textes, graphiques, logos et logiciels,
            est la propriété d'Équilibre ou de ses concédants de licence et est protégé par les lois sur la
            propriété intellectuelle.
          </Text>

          <Text style={styles.sectionTitle}>5. Limitation de responsabilité</Text>
          <Text style={styles.paragraph}>
            Les informations nutritionnelles fournies par l'application sont à titre informatif uniquement et ne
            constituent pas des conseils médicaux. Consultez toujours un professionnel de santé qualifié avant
            de modifier votre régime alimentaire.
          </Text>

          <Text style={styles.sectionTitle}>6. Modifications des conditions</Text>
          <Text style={styles.paragraph}>
            Nous nous réservons le droit de modifier ces Conditions Générales d'Utilisation à tout moment.
            Les modifications entreront en vigueur dès leur publication sur l'application.
          </Text>

          <Text style={styles.sectionTitle}>7. Résiliation</Text>
          <Text style={styles.paragraph}>
            Nous pouvons suspendre ou résilier votre accès au service à tout moment, sans préavis, en cas de
            violation de ces conditions ou pour toute autre raison jugée appropriée.
          </Text>

          <Text style={styles.sectionTitle}>8. Contact</Text>
          <Text style={styles.paragraph}>
            Pour toute question concernant ces Conditions Générales d'Utilisation, veuillez nous contacter à
            l'adresse : contact@equilibre-app.com
          </Text>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: Theme.spacing.lg,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Theme.spacing.lg,
  },
  backButtonText: {
    fontSize: Theme.fontSize.md,
    color: Colors.primary,
    fontWeight: Theme.fontWeight.medium,
  },
  document: {
    backgroundColor: Colors.white,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.xl,
    maxWidth: 800,
    alignSelf: 'center',
    width: '100%',
  },
  title: {
    fontSize: Theme.fontSize.xxl,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Theme.spacing.sm,
  },
  lastUpdated: {
    fontSize: Theme.fontSize.sm,
    color: Colors.text.secondary,
    marginBottom: Theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text.primary,
    marginTop: Theme.spacing.lg,
    marginBottom: Theme.spacing.md,
  },
  paragraph: {
    fontSize: Theme.fontSize.md,
    color: Colors.text.secondary,
    lineHeight: 24,
    marginBottom: Theme.spacing.md,
    textAlign: 'left',
  },
});
