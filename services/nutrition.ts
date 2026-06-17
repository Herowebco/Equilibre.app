interface UserProfile {
  gender: 'male' | 'female';
  age: number;
  height: number;
  weight: number;
  activity_level: 'sedentary' | 'active' | 'very_active';
  goal: 'lose_weight' | 'maintain' | 'gain_muscle';
}

interface DailyGoals {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export function calculateDailyGoals(profile: UserProfile): DailyGoals {
  let bmr: number;
  if (profile.gender === 'male') {
    bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age + 5;
  } else {
    bmr = 10 * profile.weight + 6.25 * profile.height - 5 * profile.age - 161;
  }

  let activityMultiplier: number;
  switch (profile.activity_level) {
    case 'sedentary':
      activityMultiplier = 1.2;
      break;
    case 'active':
      activityMultiplier = 1.55;
      break;
    case 'very_active':
      activityMultiplier = 1.725;
      break;
    default:
      activityMultiplier = 1.55;
  }

  let tdee = bmr * activityMultiplier;

  let calories: number;
  let proteinRatio: number;
  let carbsRatio: number;
  let fatsRatio: number;

  switch (profile.goal) {
    case 'lose_weight':
      calories = tdee - 500;
      proteinRatio = 0.25;
      carbsRatio = 0.45;
      fatsRatio = 0.30;
      break;
    case 'gain_muscle':
      calories = tdee + 300;
      proteinRatio = 0.25;
      carbsRatio = 0.50;
      fatsRatio = 0.25;
      break;
    case 'maintain':
    default:
      calories = tdee;
      proteinRatio = 0.20;
      carbsRatio = 0.50;
      fatsRatio = 0.30;
      break;
  }

  const protein = (calories * proteinRatio) / 4;
  const carbs = (calories * carbsRatio) / 4;
  const fats = (calories * fatsRatio) / 9;

  return {
    calories: Math.round(calories),
    protein: Math.round(protein),
    carbs: Math.round(carbs),
    fats: Math.round(fats),
  };
}
