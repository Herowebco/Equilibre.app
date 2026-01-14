import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper } from '@/components';
import { Colors, Theme } from '@/constants';
import { ArrowLeft } from 'lucide-react-native';

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.primary} />
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>

        <View style={styles.document}>
          <Text style={styles.title}>Politique de Confidentialité</Text>
          <Text style={styles.lastUpdated}>Dernière mise à jour : Janvier 2026</Text>

          <Text style={styles.sectionTitle}>1. Introduction</Text>
          <Text style={styles.paragraph}>
            Chez Équilibre, nous prenons la protection de vos données personnelles très au sérieux. Cette
            Politique de Confidentialité explique comment nous collectons, utilisons et protégeons vos
            informations lorsque vous utilisez notre application.
          </Text>

          <Text style={styles.sectionTitle}>2. Données collectées</Text>
          <Text style={styles.paragraph}>
            Nous collectons les informations suivantes :
          </Text>
          <Text style={styles.bulletPoint}>• Informations de compte (nom, email, mot de passe)</Text>
          <Text style={styles.bulletPoint}>• Données physiologiques (poids, taille, âge, sexe)</Text>
          <Text style={styles.bulletPoint}>• Objectifs de santé et préférences alimentaires</Text>
          <Text style={styles.bulletPoint}>• Historique d'utilisation de l'application</Text>
          <Text style={styles.bulletPoint}>• Données de consommation des repas</Text>

          <Text style={styles.sectionTitle}>3. Utilisation des données</Text>
          <Text style={styles.paragraph}>
            Nous utilisons vos données pour :
          </Text>
          <Text style={styles.bulletPoint}>• Générer des plans de repas personnalisés</Text>
          <Text style={styles.bulletPoint}>• Améliorer nos services et recommandations</Text>
          <Text style={styles.bulletPoint}>• Vous envoyer des notifications pertinentes</Text>
          <Text style={styles.bulletPoint}>• Analyser l'utilisation de l'application</Text>
          <Text style={styles.bulletPoint}>• Assurer la sécurité de votre compte</Text>

          <Text style={styles.sectionTitle}>4. Protection des données</Text>
          <Text style={styles.paragraph}>
            Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles appropriées pour
            protéger vos données contre tout accès non autorisé, modification, divulgation ou destruction.
            Vos données sont stockées de manière sécurisée et chiffrées.
          </Text>

          <Text style={styles.sectionTitle}>5. Partage des données</Text>
          <Text style={styles.paragraph}>
            Nous ne vendons jamais vos données personnelles. Nous ne partageons vos informations qu'avec :
          </Text>
          <Text style={styles.bulletPoint}>• Les fournisseurs de services nécessaires au fonctionnement de l'application</Text>
          <Text style={styles.bulletPoint}>• Les autorités légales si requis par la loi</Text>

          <Text style={styles.sectionTitle}>6. Vos droits</Text>
          <Text style={styles.paragraph}>
            Conformément au RGPD, vous disposez des droits suivants :
          </Text>
          <Text style={styles.bulletPoint}>• Droit d'accès à vos données personnelles</Text>
          <Text style={styles.bulletPoint}>• Droit de rectification de vos données</Text>
          <Text style={styles.bulletPoint}>• Droit à l'effacement (droit à l'oubli)</Text>
          <Text style={styles.bulletPoint}>• Droit à la portabilité des données</Text>
          <Text style={styles.bulletPoint}>• Droit d'opposition au traitement</Text>

          <Text style={styles.sectionTitle}>7. Cookies et technologies similaires</Text>
          <Text style={styles.paragraph}>
            Nous utilisons des cookies et des technologies similaires pour améliorer votre expérience,
            analyser l'utilisation de l'application et personnaliser le contenu.
          </Text>

          <Text style={styles.sectionTitle}>8. Conservation des données</Text>
          <Text style={styles.paragraph}>
            Nous conservons vos données personnelles aussi longtemps que nécessaire pour vous fournir nos
            services ou conformément aux obligations légales applicables.
          </Text>

          <Text style={styles.sectionTitle}>9. Modifications de la politique</Text>
          <Text style={styles.paragraph}>
            Nous pouvons mettre à jour cette Politique de Confidentialité périodiquement. Nous vous
            informerons de tout changement important via l'application ou par email.
          </Text>

          <Text style={styles.sectionTitle}>10. Contact</Text>
          <Text style={styles.paragraph}>
            Pour toute question concernant cette Politique de Confidentialité ou pour exercer vos droits,
            contactez-nous à : privacy@equilibre-app.com
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
  bulletPoint: {
    fontSize: Theme.fontSize.md,
    color: Colors.text.secondary,
    lineHeight: 24,
    marginBottom: Theme.spacing.sm,
    marginLeft: Theme.spacing.md,
  },
});
