export type UserProfile = {
  id: string;
  name: string;
  email: string;
  profileImage?: string;
  age?: number;
  height: number; // in cm
  weight: number; // in kg
  gender?: 'male' | 'female' | 'other';
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced';
  goals: string[];
  notifications: boolean;
  darkMode: boolean;
  weeklyGoal: number;
  measurementSystem: 'metric' | 'imperial';
  measurements: {
    chest?: number;
    waist?: number;
    hips?: number;
    arms?: number;
    legs?: number;
  };
  createdAt: string;
  updatedAt: string;
};

export type MeasurementRecord = {
  id: string;
  date: string;
  weight: number;
  chest?: number;
  waist?: number;
  hips?: number;
  arms?: number;
  legs?: number;
  notes?: string;
};

export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
  progress: number;
  totalRequired: number;
  category: 'workout' | 'streak' | 'goal' | 'milestone';
};

export type WorkoutStat = {
  date: string;
  duration: number;
  calories: number;
  type: string;
  exercises: number;
};