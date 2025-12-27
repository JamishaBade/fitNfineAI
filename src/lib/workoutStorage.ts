import AsyncStorage from '@react-native-async-storage/async-storage';
import { WorkoutPlan, WorkoutHistory, ActiveWorkout, ExerciseSession } from '../types/workout';

const STORAGE_KEYS = {
  WORKOUT_PLANS: 'workout_plans',
  WORKOUT_HISTORY: 'workout_history',
  ACTIVE_WORKOUT: 'active_workout',
  USER_PREFERENCES: 'user_workout_preferences',
  USER_EXERCISES: 'user_exercises',
  CUSTOM_WORKOUTS: 'custom_workouts', // Add this
};

// User preferences type
export type UserWorkoutPreferences = {
  defaultRestTime: number;
  defaultSetDuration: number;
  autoStartRestTimer: boolean;
  autoSkipRest: boolean;
  soundNotifications: boolean;
  voiceGuidance: boolean;
  countdownDuration: number;
  warmupDuration: number;
  cooldownDuration: number;
  volumeLevel: number;
  showTimer: boolean;
  showRepCount: boolean;
  darkMode: boolean;
};

const DEFAULT_USER_PREFERENCES: UserWorkoutPreferences = {
  defaultRestTime: 60,
  defaultSetDuration: 45,
  autoStartRestTimer: true,
  autoSkipRest: false,
  soundNotifications: true,
  voiceGuidance: false,
  countdownDuration: 3,
  warmupDuration: 5,
  cooldownDuration: 5,
  volumeLevel: 75,
  showTimer: true,
  showRepCount: true,
  darkMode: false,
};

// Add default exercises for custom workouts
const DEFAULT_EXERCISES: ExerciseSession[] = [
  {
    exerciseId: 'custom_1',
    name: 'Push-ups',
    sets: 3,
    reps: 12,
    completedSets: 0,
    restTime: 60,
    completed: false,
  },
  {
    exerciseId: 'custom_2',
    name: 'Squats',
    sets: 3,
    reps: 15,
    completedSets: 0,
    restTime: 60,
    completed: false,
  },
  {
    exerciseId: 'custom_3',
    name: 'Plank',
    sets: 3,
    reps: 30,
    completedSets: 0,
    restTime: 60,
    completed: false,
  },
  {
    exerciseId: 'custom_4',
    name: 'Lunges',
    sets: 3,
    reps: 10,
    completedSets: 0,
    restTime: 60,
    completed: false,
  },
  {
    exerciseId: 'custom_5',
    name: 'Jumping Jacks',
    sets: 3,
    reps: 30,
    completedSets: 0,
    restTime: 60,
    completed: false,
  },
];

const DEFAULT_WORKOUT_PLANS: WorkoutPlan[] = [
  // ... keep your existing default workout plans
  {
    id: '1',
    name: 'Full Body Beginner',
    description: 'Perfect for starting your fitness journey',
    duration: 30,
    difficulty: 'beginner',
    category: 'strength',
    calories: 280,
    exercises: [
      {
        exerciseId: '1',
        name: 'Jumping Jacks',
        sets: 3,
        reps: 30,
        completedSets: 0,
        restTime: 60,
        completed: false,
      },
      {
        exerciseId: '2',
        name: 'Bodyweight Squats',
        sets: 3,
        reps: 15,
        completedSets: 0,
        restTime: 60,
        completed: false,
      },
      {
        exerciseId: '3',
        name: 'Push-ups',
        sets: 3,
        reps: 10,
        completedSets: 0,
        restTime: 60,
        completed: false,
      },
      {
        exerciseId: '4',
        name: 'Plank',
        sets: 3,
        reps: 30,
        completedSets: 0,
        restTime: 60,
        completed: false,
      },
    ],
    isFavorite: false,
    createdBy: 'system',
    tags: ['full body', 'beginner', 'no equipment'],
    restBetweenExercises: 60,
    warmupDuration: 5,
    cooldownDuration: 5,
  },
  // ... add other default plans here
];

class WorkoutStorage {
  // User Preferences
  async getUserPreferences(): Promise<UserWorkoutPreferences> {
    try {
      const preferences = await AsyncStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
      if (preferences) {
        return JSON.parse(preferences);
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(DEFAULT_USER_PREFERENCES));
      return DEFAULT_USER_PREFERENCES;
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return DEFAULT_USER_PREFERENCES;
    }
  }

  async saveUserPreferences(preferences: UserWorkoutPreferences): Promise<void> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(preferences));
    } catch (error) {
      console.error('Error saving user preferences:', error);
      throw error;
    }
  }

  // User Custom Exercises
  async getUserExercises(): Promise<ExerciseSession[]> {
    try {
      const exercises = await AsyncStorage.getItem(STORAGE_KEYS.USER_EXERCISES);
      if (!exercises) {
        // Initialize with default exercises
        await AsyncStorage.setItem(STORAGE_KEYS.USER_EXERCISES, JSON.stringify(DEFAULT_EXERCISES));
        return DEFAULT_EXERCISES;
      }
      return JSON.parse(exercises);
    } catch (error) {
      console.error('Error getting user exercises:', error);
      return DEFAULT_EXERCISES;
    }
  }

  async saveUserExercise(exercise: ExerciseSession): Promise<void> {
    try {
      const exercises = await this.getUserExercises();
      exercises.push({
        ...exercise,
        exerciseId: `custom_${Date.now()}`,
      });
      await AsyncStorage.setItem(STORAGE_KEYS.USER_EXERCISES, JSON.stringify(exercises));
    } catch (error) {
      console.error('Error saving user exercise:', error);
      throw error;
    }
  }

  async updateUserExercise(exerciseId: string, updates: Partial<ExerciseSession>): Promise<void> {
    try {
      const exercises = await this.getUserExercises();
      const index = exercises.findIndex(ex => ex.exerciseId === exerciseId);
      
      if (index >= 0) {
        exercises[index] = { ...exercises[index], ...updates };
        await AsyncStorage.setItem(STORAGE_KEYS.USER_EXERCISES, JSON.stringify(exercises));
      }
    } catch (error) {
      console.error('Error updating user exercise:', error);
      throw error;
    }
  }

  async deleteUserExercise(exerciseId: string): Promise<void> {
    try {
      const exercises = await this.getUserExercises();
      const filteredExercises = exercises.filter(ex => ex.exerciseId !== exerciseId);
      await AsyncStorage.setItem(STORAGE_KEYS.USER_EXERCISES, JSON.stringify(filteredExercises));
    } catch (error) {
      console.error('Error deleting user exercise:', error);
      throw error;
    }
  }

  // Workout Plans - MAIN FIX FOR CUSTOM WORKOUT CREATION
  async getWorkoutPlans(): Promise<WorkoutPlan[]> {
    try {
      const plans = await AsyncStorage.getItem(STORAGE_KEYS.WORKOUT_PLANS);
      if (plans) {
        return JSON.parse(plans);
      }
      
      // Save default plans
      await AsyncStorage.setItem(STORAGE_KEYS.WORKOUT_PLANS, JSON.stringify(DEFAULT_WORKOUT_PLANS));
      return DEFAULT_WORKOUT_PLANS;
    } catch (error) {
      console.error('Error getting workout plans:', error);
      return DEFAULT_WORKOUT_PLANS;
    }
  }

  async getCustomWorkouts(): Promise<WorkoutPlan[]> {
    try {
      const allPlans = await this.getWorkoutPlans();
      return allPlans.filter(plan => plan.createdBy === 'user');
    } catch (error) {
      console.error('Error getting custom workouts:', error);
      return [];
    }
  }

  async getSystemWorkouts(): Promise<WorkoutPlan[]> {
    try {
      const allPlans = await this.getWorkoutPlans();
      return allPlans.filter(plan => plan.createdBy === 'system');
    } catch (error) {
      console.error('Error getting system workouts:', error);
      return DEFAULT_WORKOUT_PLANS;
    }
  }

  async createCustomWorkout(planData: Omit<WorkoutPlan, 'id' | 'createdBy'>): Promise<WorkoutPlan> {
    try {
      const newPlan: WorkoutPlan = {
        ...planData,
        id: `custom_${Date.now()}`,
        createdBy: 'user',
      };
      
      await this.saveWorkoutPlan(newPlan);
      return newPlan;
    } catch (error) {
      console.error('Error creating custom workout:', error);
      throw error;
    }
  }

  async createCustomWorkoutFromTemplate(template: WorkoutPlan, name: string, description?: string): Promise<WorkoutPlan> {
    try {
      const newPlan: WorkoutPlan = {
        ...template,
        id: `custom_${Date.now()}`,
        name,
        description: description || template.description,
        createdBy: 'user',
        isFavorite: false,
      };
      
      await this.saveWorkoutPlan(newPlan);
      return newPlan;
    } catch (error) {
      console.error('Error creating custom workout from template:', error);
      throw error;
    }
  }

  async saveWorkoutPlan(plan: WorkoutPlan): Promise<void> {
    try {
      const plans = await this.getWorkoutPlans();
      const index = plans.findIndex(p => p.id === plan.id);
      
      if (index >= 0) {
        plans[index] = plan;
      } else {
        plans.push(plan);
      }
      
      await AsyncStorage.setItem(STORAGE_KEYS.WORKOUT_PLANS, JSON.stringify(plans));
    } catch (error) {
      console.error('Error saving workout plan:', error);
      throw error;
    }
  }

  async updateWorkoutPlan(planId: string, updates: Partial<WorkoutPlan>): Promise<WorkoutPlan | null> {
    try {
      const plans = await this.getWorkoutPlans();
      const index = plans.findIndex(p => p.id === planId);
      
      if (index >= 0) {
        const updatedPlan = { ...plans[index], ...updates };
        plans[index] = updatedPlan;
        await AsyncStorage.setItem(STORAGE_KEYS.WORKOUT_PLANS, JSON.stringify(plans));
        return updatedPlan;
      }
      
      return null;
    } catch (error) {
      console.error('Error updating workout plan:', error);
      throw error;
    }
  }

  async deleteWorkoutPlan(planId: string): Promise<void> {
    try {
      const plans = await this.getWorkoutPlans();
      const filteredPlans = plans.filter(plan => plan.id !== planId);
      await AsyncStorage.setItem(STORAGE_KEYS.WORKOUT_PLANS, JSON.stringify(filteredPlans));
    } catch (error) {
      console.error('Error deleting workout plan:', error);
      throw error;
    }
  }

  async duplicateWorkoutPlan(planId: string, newName: string): Promise<WorkoutPlan | null> {
    try {
      const plans = await this.getWorkoutPlans();
      const originalPlan = plans.find(p => p.id === planId);
      
      if (!originalPlan) return null;
      
      const duplicatedPlan: WorkoutPlan = {
        ...originalPlan,
        id: `dup_${Date.now()}_${planId}`,
        name: newName,
        createdBy: 'user',
        isFavorite: false,
      };
      
      await this.saveWorkoutPlan(duplicatedPlan);
      return duplicatedPlan;
    } catch (error) {
      console.error('Error duplicating workout plan:', error);
      throw error;
    }
  }

  async toggleFavorite(planId: string): Promise<void> {
    try {
      const plans = await this.getWorkoutPlans();
      const updatedPlans = plans.map(plan => 
        plan.id === planId ? { ...plan, isFavorite: !plan.isFavorite } : plan
      );
      
      await AsyncStorage.setItem(STORAGE_KEYS.WORKOUT_PLANS, JSON.stringify(updatedPlans));
    } catch (error) {
      console.error('Error toggling favorite:', error);
      throw error;
    }
  }

  async getFavoriteWorkouts(): Promise<WorkoutPlan[]> {
    try {
      const plans = await this.getWorkoutPlans();
      return plans.filter(plan => plan.isFavorite);
    } catch (error) {
      console.error('Error getting favorite workouts:', error);
      return [];
    }
  }

  // Helper function to create a blank workout template
  async getBlankWorkoutTemplate(): Promise<Omit<WorkoutPlan, 'id' | 'createdBy'>> {
    const prefs = await this.getUserPreferences();
    
    return {
      name: 'My Custom Workout',
      description: 'Custom workout created by you',
      duration: 30,
      difficulty: 'intermediate',
      category: 'custom',
      calories: 250,
      exercises: [
        {
          exerciseId: 'template_1',
          name: 'Choose Exercise',
          sets: 3,
          reps: 10,
          completedSets: 0,
          restTime: prefs.defaultRestTime,
          completed: false,
        }
      ],
      isFavorite: false,
      tags: ['custom'],
      restBetweenExercises: prefs.defaultRestTime,
      warmupDuration: prefs.warmupDuration,
      cooldownDuration: prefs.cooldownDuration,
    };
  }

  // Active Workout
  async getActiveWorkout(): Promise<ActiveWorkout | null> {
    try {
      const activeWorkout = await AsyncStorage.getItem(STORAGE_KEYS.ACTIVE_WORKOUT);
      return activeWorkout ? JSON.parse(activeWorkout) : null;
    } catch (error) {
      console.error('Error getting active workout:', error);
      return null;
    }
  }

  async saveActiveWorkout(workout: ActiveWorkout | null): Promise<void> {
    try {
      if (workout) {
        await AsyncStorage.setItem(STORAGE_KEYS.ACTIVE_WORKOUT, JSON.stringify(workout));
      } else {
        await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_WORKOUT);
      }
    } catch (error) {
      console.error('Error saving active workout:', error);
      throw error;
    }
  }

  async clearActiveWorkout(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.ACTIVE_WORKOUT);
    } catch (error) {
      console.error('Error clearing active workout:', error);
      throw error;
    }
  }

  // Workout History
  async getWorkoutHistory(): Promise<WorkoutHistory[]> {
    try {
      const history = await AsyncStorage.getItem(STORAGE_KEYS.WORKOUT_HISTORY);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error getting workout history:', error);
      return [];
    }
  }

  async saveWorkoutToHistory(workout: WorkoutHistory): Promise<void> {
    try {
      const history = await this.getWorkoutHistory();
      history.unshift(workout);
      
      // Keep only last 100 workouts
      const trimmedHistory = history.slice(0, 100);
      await AsyncStorage.setItem(STORAGE_KEYS.WORKOUT_HISTORY, JSON.stringify(trimmedHistory));
    } catch (error) {
      console.error('Error saving workout to history:', error);
      throw error;
    }
  }

  // Statistics - keep your existing stats method
  async getWorkoutStats() {
    try {
      const history = await this.getWorkoutHistory();
      const totalWorkouts = history.length;
      const totalDuration = history.reduce((sum, workout) => sum + workout.duration, 0);
      const totalCalories = history.reduce((sum, workout) => sum + workout.calories, 0);
      
      // This week's workouts
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      const thisWeekWorkouts = history.filter(workout => 
        new Date(workout.endTime) >= oneWeekAgo
      );

      // Most frequent workout
      const workoutCounts = history.reduce((acc, workout) => {
        acc[workout.planName] = (acc[workout.planName] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const mostFrequentWorkout = Object.entries(workoutCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';

      return {
        totalWorkouts,
        totalHours: Math.round(totalDuration / 60),
        totalCalories,
        thisWeekWorkouts: thisWeekWorkouts.length,
        mostFrequentWorkout,
        averageRating: history.length > 0 
          ? (history.reduce((sum, w) => sum + (w.rating || 0), 0) / history.length).toFixed(1)
          : '0.0',
      };
    } catch (error) {
      console.error('Error getting workout stats:', error);
      return null;
    }
  }
}

export const workoutStorage = new WorkoutStorage();