import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Linking, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenWrapper, Card } from '@/components';
import { FAQItem } from '@/components/FAQItem';
import { Colors, Theme } from '@/constants';
import { Mail, ArrowLeft, HelpCircle } from 'lucide-react-native';

const FAQ_DATA = [
  {
    question: "Comment modifier mes préférences alimentaires ?",
    answer: "Vous pouvez modifier vos allergies et régimes dans l'onglet 'Profil' > 'Préférences'."
  },
  {
    question: "L'IA a généré des ingrédients que je n'aime pas.",
    answer: "Vous pouvez régénérer un repas spécifique en cliquant sur l'icône de rafraîchissement à côté du plat."
  },
  {
    question: "Comment changer mon mot de passe ?",
    answer: "Allez dans 'Profil' > 'Sécurité' pour mettre à jour votre mot de passe."
  },
  {
    question: "Puis-je utiliser l'application sans connexion internet ?",
    answer: "Non, une connexion active est requise pour que l'IA puisse générer vos plans et recettes."
  },
  {
    question: "Comment supprimer mon compte ?",
    answer: "Veuillez envoyer une demande par email à notre support pour la suppression définitive de vos données."
  }
];

export default function SupportScreen() {
  const router = useRouter();

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@equilibre-app.com?subject=Demande d\'aide - Équilibre');
  };

  return (
    <ScreenWrapper>
      <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.primary} />
          <Text style={styles.backButtonText}>Retour</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <HelpCircle size={40} color={Colors.primary} />
          </View>
          <Text style={styles.title}>Aide & Support</Text>
          <Text style={styles.subtitle}>
            Trouvez rapidement des réponses à vos questions ou contactez-nous
          </Text>
        </View>

        <Card style={styles.contactCard}>
          <View style={styles.contactContent}>
            <Mail size={32} color={Colors.primary} />
            <View style={styles.contactText}>
              <Text style={styles.contactTitle}>Besoin d'aide supplémentaire ?</Text>
              <Text style={styles.contactDescription}>
                Notre équipe est là pour vous aider. Envoyez-nous un email et nous vous répondrons rapidement.
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.contactButton} onPress={handleEmailSupport}>
            <Text style={styles.contactButtonText}>Envoyer un email</Text>
          </TouchableOpacity>
        </Card>

        <View style={styles.faqSection}>
          <Text style={styles.faqTitle}>Foire Aux Questions</Text>
          <Text style={styles.faqSubtitle}>
            Les réponses aux questions les plus fréquentes
          </Text>

          {FAQ_DATA.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
            />
          ))}
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
  header: {
    alignItems: 'center',
    marginBottom: Theme.spacing.xl,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: `${Colors.primary}15`,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  title: {
    fontSize: Theme.fontSize.xxl,
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
  contactCard: {
    padding: Theme.spacing.lg,
    marginBottom: Theme.spacing.xl,
    backgroundColor: `${Colors.primary}10`,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  contactContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Theme.spacing.lg,
    gap: Theme.spacing.md,
  },
  contactText: {
    flex: 1,
  },
  contactTitle: {
    fontSize: Theme.fontSize.lg,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Theme.spacing.sm,
  },
  contactDescription: {
    fontSize: Theme.fontSize.md,
    color: Colors.text.secondary,
    lineHeight: 22,
  },
  contactButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Theme.spacing.md,
    paddingHorizontal: Theme.spacing.lg,
    borderRadius: Theme.borderRadius.md,
    alignItems: 'center',
  },
  contactButtonText: {
    fontSize: Theme.fontSize.md,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.white,
  },
  faqSection: {
    marginTop: Theme.spacing.lg,
  },
  faqTitle: {
    fontSize: Theme.fontSize.xl,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.text.primary,
    marginBottom: Theme.spacing.sm,
  },
  faqSubtitle: {
    fontSize: Theme.fontSize.md,
    color: Colors.text.secondary,
    marginBottom: Theme.spacing.lg,
  },
});
