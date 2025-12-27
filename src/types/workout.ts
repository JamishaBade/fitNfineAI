// src/types/workout.ts

export type WorkoutFeel = 'great' | 'good' | 'ok' | 'tired';
export type WorkoutDifficulty = 'easy' | 'medium' | 'hard';
export type WorkoutStatus = 'active' | 'paused' | 'completed';

export interface Exercise {
  exerciseId: string;
  name: string;
  sets: number;
  reps: number;
  restTime: number;
  duration?: number; // in seconds, for timed exercises
  calories?: number;
  muscleGroups?: string[];
  equipment?: string[];
  instructions?: string[];
}

export interface ExerciseSession extends Exercise {
  completedSets: number;
  completed: boolean;
}

export interface WorkoutPlan {
  id: string;
  name: string;
  description: string;
  duration: number; // in minutes
  difficulty: WorkoutDifficulty;
  category: string;
  calories: number;
  exercises: ExerciseSession[];
  isFavorite: boolean;
  createdBy: 'system' | 'user';
  tags: string[];
  imageUrl?: string;
}

export interface ActiveWorkout {
  id: string;
  planId: string;
  planName: string;
  startTime: string;
  exercises: ExerciseSession[];
  currentExerciseIndex: number;
  currentSet: number;
  status: WorkoutStatus;
  timer: number; // in seconds
  isResting: boolean;
  totalDuration: number; // in seconds
  caloriesBurned: number;
  completedExercises: number;
  userPreferences?: UserWorkoutPreferences;
}

export interface WorkoutHistory {
  id: string;
  planId: string;
  planName: string;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  calories: number;
  exercises: {
    name: string;
    sets: number;
    reps: number;
    completedSets: number;
  }[];
  completed: boolean;
  rating?: number; // 1-5
  notes?: string;
  feel?: WorkoutFeel;
  difficulty?: WorkoutDifficulty;
}

export interface WorkoutStats {
  totalWorkouts: number;
  thisWeekWorkouts: number;
  totalHours: number;
  averageRating: number;
  totalCalories: number;
  streak: number;
  lastWorkoutDate: string | null;
  favoriteCategory?: string;
  avgWorkoutDuration?: number;
}

export interface UserWorkoutPreferences {
  defaultRestTime: number; // in seconds
  defaultSetDuration: number; // in seconds
  autoStartRestTimer: boolean;
  autoSkipRest: boolean;
  soundNotifications: boolean;
  voiceGuidance: boolean;
  countdownDuration: number; // in seconds
  warmupDuration: number; // in minutes
  cooldownDuration: number; // in minutes
  volumeLevel: number; // 0-100
}

export interface WorkoutCustomization {
  customSets?: number[];
  customReps?: number[];
  customRestTimes?: number[];
  skipWarmup?: boolean;
  skipCooldown?: boolean;
}