import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { BlurView } from 'expo-blur';
import * as AppleAuthentication from 'expo-apple-authentication';
import Svg, { Path } from 'react-native-svg';
import { Colors, Theme } from '@/constants';

interface SocialAuthButtonsProps {
  onGooglePress: () => void;
  onApplePress: () => void;
  loading?: boolean;
}

export function SocialAuthButtons({
  onGooglePress,
  onApplePress,
  loading = false,
}: SocialAuthButtonsProps) {
  const [appleAvailable, setAppleAvailable] = useState(false);

  useEffect(() => {
    setAppleAvailable(true);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.separator}>
        <View style={styles.separatorLine} />
        <Text style={styles.separatorText}>Ou continuer avec</Text>
        <View style={styles.separatorLine} />
      </View>

      <View style={styles.buttonsGrid}>
        <SocialButton
          onPress={onGooglePress}
          disabled={loading}
          label="Google"
          icon={
            <Svg width={20} height={20} viewBox="0 0 24 24">
              <Path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <Path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <Path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <Path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </Svg>
          }
          flex={appleAvailable ? 1 : undefined}
          fullWidth={!appleAvailable}
        />

        {appleAvailable && (
          <SocialButton
            onPress={onApplePress}
            disabled={loading}
            label="Apple"
            icon={<AppleIcon />}
            flex={1}
          />
        )}
      </View>
    </View>
  );
}

interface SocialButtonProps {
  onPress: () => void;
  disabled: boolean;
  label: string;
  icon: React.ReactNode;
  flex?: number;
  fullWidth?: boolean;
}

function SocialButton({ onPress, disabled, label, icon, flex, fullWidth }: SocialButtonProps) {
  if (Platform.OS === 'web') {
    return (
      <TouchableOpacity
        style={[
          styles.socialButton,
          styles.socialButtonFallback,
          flex !== undefined && { flex },
          fullWidth && styles.fullWidth,
        ]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.75}
      >
        {icon}
        <Text style={styles.socialButtonText}>{label}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.socialButtonWrapper, flex !== undefined && { flex }, fullWidth && styles.fullWidth]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.75}
    >
      <BlurView intensity={60} tint="light" style={styles.blurContainer}>
        <View style={styles.socialButtonInner}>
          {icon}
          <Text style={styles.socialButtonText}>{label}</Text>
        </View>
      </BlurView>
    </TouchableOpacity>
  );
}

function AppleIcon() {
  return (
    <Svg width={18} height={22} viewBox="0 0 814 1000">
      <Path
        d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76 0-103.7 40.8-165.9 40.8s-105-42.8-155.5-112.7C115.9 794 68.7 693.5 68.7 598.6c0-154.6 100.9-236.6 200.9-236.6 51.8 0 95.1 33.8 127.8 33.8 31.3 0 79.7-35.8 140.6-35.8 22.8 0 108.2 2.6 168.5 93.3zm-81.2-155.5c36.5-43.5 61.6-104.4 61.6-165.3 0-8.3-.6-16.6-1.9-24.2-57.4 2.6-124.8 38.5-164.7 87.5-31.9 37.8-62.2 98.7-62.2 160.2 0 9 1.3 18 1.9 20.7 3.2.6 8.3 1.3 13.5 1.3 51.1 0 114.8-34.5 151.8-80.2z"
        fill="#1C1C1E"
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Theme.spacing.lg,
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  separatorText: {
    marginHorizontal: Theme.spacing.md,
    fontSize: Theme.fontSize.sm,
    color: Colors.text.light,
    fontWeight: Theme.fontWeight.medium,
    letterSpacing: 0.3,
  },
  buttonsGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  socialButtonWrapper: {
    borderRadius: Theme.borderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  blurContainer: {
    overflow: 'hidden',
  },
  socialButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  socialButtonFallback: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    backgroundColor: Colors.white,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  socialButton: {},
  socialButtonText: {
    fontSize: Theme.fontSize.md,
    color: Colors.text.primary,
    fontWeight: Theme.fontWeight.medium,
  },
  fullWidth: {
    flex: 1,
  },
});
