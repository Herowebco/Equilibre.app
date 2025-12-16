import React, { createContext, useContext, useState } from 'react';
import type { MealPlan } from '@/services/ai';

export interface OnboardingData {
  gender?: 'male' | 'female';
  age?: number;
  height?: number;
  weight?: number;
  activity_level?: 'sedentary' | 'active' | 'very_active';
  goal?: 'lose_weight' | 'maintain' | 'gain_muscle';
  diet_type?: 'standard' | 'vegetarian' | 'vegan' | 'no_pork';
  allergies?: string[];
  meals_per_day?: 3 | 4;
  generatedPlan?: MealPlan;
}

interface OnboardingContextType {
  data: OnboardingData;
  updateData: (newData: Partial<OnboardingData>) => void;
  resetData: () => void;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined
);

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const [data, setData] = useState<OnboardingData>({});

  const updateData = (newData: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...newData }));
  };

  const resetData = () => {
    setData({});
  };

  return (
    <OnboardingContext.Provider value={{ data, updateData, resetData }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (context === undefined) {
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
}
