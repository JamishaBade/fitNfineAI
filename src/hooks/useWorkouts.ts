import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { 
  WorkoutPlan, 
  ActiveWorkout, 
  WorkoutHistory,
  ExerciseSession,
  Exercise 
} from '../types/workout';
import { workoutStorage } from '../lib/workoutStorage';

// Define types based on your workout.ts file
type WorkoutFeel = 'great' | 'good' | 'ok' | 'tired';
type WorkoutDifficulty = 'easy' | 'medium' | 'hard';

// User preferences type
type UserWorkoutPreferences = {
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
};

export const useWorkout = () => {
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkout | null>(null);
  const [workoutHistory, setWorkoutHistory] = useState<WorkoutHistory[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [timer, setTimer] = useState<number>(0);
  const [isResting, setIsResting] = useState<boolean>(false);
  const [showCompletionModal, setShowCompletionModal] = useState<boolean>(false);
  
  // Customization state
  const [userPreferences, setUserPreferences] = useState<UserWorkoutPreferences>({
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
  });

  // Load all workout data
  const loadWorkoutData = useCallback(async () => {
    try {
      setLoading(true);
      const [plans, active, history, prefs] = await Promise.all([
        workoutStorage.getWorkoutPlans(),
        workoutStorage.getActiveWorkout(),
        workoutStorage.getWorkoutHistory(),
        workoutStorage.getUserPreferences(),
      ]);

      setWorkoutPlans(plans);
      setActiveWorkout(active);
      setWorkoutHistory(history);
      if (prefs) setUserPreferences(prefs);

      const workoutStats = await workoutStorage.getWorkoutStats();
      setStats(workoutStats);
    } catch (error) {
      console.error('Error loading workout data:', error);
      Alert.alert('Error', 'Failed to load workout data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Update user preferences
  const updatePreferences = useCallback(
    async (newPreferences: Partial<UserWorkoutPreferences>) => {
      try {
        const updatedPrefs: UserWorkoutPreferences = {
          ...userPreferences,
          ...newPreferences,
        };

        setUserPreferences(updatedPrefs);
        await workoutStorage.saveUserPreferences(updatedPrefs);
      } catch (error) {
        console.error("Error updating preferences:", error);
        Alert.alert("Error", "Failed to update preferences");
      }
    },
    [userPreferences]
  );

  // Start a workout with custom options
  const startWorkout = useCallback(async (plan: WorkoutPlan, options?: {
    customSets?: number[];
    customReps?: number[];
    customRestTimes?: number[];
    skipWarmup?: boolean;
    skipCooldown?: boolean;
  }) => {
    try {
      // Apply user customizations to exercises
      const customizedExercises = plan.exercises.map((exercise, index) => ({
        ...exercise,
        sets: options?.customSets?.[index] || exercise.sets,
        reps: options?.customReps?.[index] || exercise.reps,
        restTime: options?.customRestTimes?.[index] || exercise.restTime || userPreferences.defaultRestTime,
        completedSets: 0,
        completed: false,
      }));

      const newActiveWorkout: ActiveWorkout = {
        id: Date.now().toString(),
        planId: plan.id,
        planName: plan.name,
        startTime: new Date().toISOString(),
        exercises: customizedExercises,
        currentExerciseIndex: 0,
        currentSet: 1,
        status: 'active',
        timer: userPreferences.defaultSetDuration,
        isResting: false,
        totalDuration: 0,
        caloriesBurned: 0,
        completedExercises: 0,
        userPreferences: { ...userPreferences },
      };

      setActiveWorkout(newActiveWorkout);
      setTimer(newActiveWorkout.timer);
      setIsResting(false);
      await workoutStorage.saveActiveWorkout(newActiveWorkout);
      return newActiveWorkout;
    } catch (error) {
      console.error('Error starting workout:', error);
      Alert.alert('Error', 'Failed to start workout');
      throw error;
    }
  }, [userPreferences]);

  // Complete a set with customization support
  const completeSet = useCallback(async (): Promise<boolean> => {
    if (!activeWorkout) return false;

    try {
      const updatedWorkout: ActiveWorkout = {
        ...activeWorkout,
        exercises: activeWorkout.exercises.map(ex => ({ ...ex }))
      };
      
      const currentExerciseIndex = updatedWorkout.currentExerciseIndex;
      const currentExercise = updatedWorkout.exercises[currentExerciseIndex];
      
      currentExercise.completedSets += 1;

      if (currentExercise.completedSets >= currentExercise.sets) {
        currentExercise.completed = true;
        updatedWorkout.completedExercises += 1;

        if (updatedWorkout.completedExercises >= updatedWorkout.exercises.length) {
          setShowCompletionModal(true);
          return true;
        }

        // Move to next exercise
        updatedWorkout.currentExerciseIndex += 1;
        updatedWorkout.currentSet = 1;
        
        // Set timer for next exercise
        updatedWorkout.timer = userPreferences.defaultSetDuration;
        updatedWorkout.isResting = false;
      } else {
        // Move to next set of same exercise
        updatedWorkout.currentSet += 1;
        
        // Check if user wants auto rest timer
        if (userPreferences.autoStartRestTimer) {
          updatedWorkout.isResting = true;
          updatedWorkout.timer = currentExercise.restTime;
        } else {
          updatedWorkout.isResting = false;
          updatedWorkout.timer = userPreferences.defaultSetDuration;
        }
      }
      
      setActiveWorkout(updatedWorkout);
      setIsResting(updatedWorkout.isResting);
      setTimer(updatedWorkout.timer);
      await workoutStorage.saveActiveWorkout(updatedWorkout);
      return false;
    } catch (error) {
      console.error('Error completing set:', error);
      Alert.alert('Error', 'Failed to complete set');
      return false;
    }
  }, [activeWorkout, userPreferences]);

  // Skip rest with customization
  const skipRest = useCallback(async (): Promise<void> => {
    if (!activeWorkout) return;

    try {
      const updatedWorkout: ActiveWorkout = {
        ...activeWorkout,
        isResting: false,
        timer: userPreferences.defaultSetDuration
      };
      
      setActiveWorkout(updatedWorkout);
      setIsResting(false);
      setTimer(updatedWorkout.timer);
      await workoutStorage.saveActiveWorkout(updatedWorkout);
    } catch (error) {
      console.error('Error skipping rest:', error);
      Alert.alert('Error', 'Failed to skip rest');
    }
  }, [activeWorkout, userPreferences]);

  // Complete workout with rating and notes
  const completeWorkoutWithDetails = useCallback(async (
    rating?: number, 
    notes?: string, 
    feel?: WorkoutFeel, 
    difficulty?: WorkoutDifficulty
  ): Promise<WorkoutHistory | undefined> => {
    if (!activeWorkout) return;

    try {
      const endTime = new Date().toISOString();
      const startTime = new Date(activeWorkout.startTime);
      const duration = Math.round((new Date(endTime).getTime() - startTime.getTime()) / 1000 / 60);

      const calories = Math.round(duration * 8);

      const workoutHistory: WorkoutHistory = {
        id: activeWorkout.id,
        planId: activeWorkout.planId,
        planName: activeWorkout.planName,
        startTime: activeWorkout.startTime,
        endTime,
        duration,
        calories,
        exercises: activeWorkout.exercises.map(ex => ({ ...ex })),
        completed: true,
        rating,
        notes,
        feel,
        difficulty: difficulty || 'medium',
      };

      await workoutStorage.saveWorkoutToHistory(workoutHistory);
      
      setActiveWorkout(null);
      setShowCompletionModal(false);
      setTimer(0);
      setIsResting(false);
      await workoutStorage.clearActiveWorkout();

      await loadWorkoutData();

      return workoutHistory;
    } catch (error) {
      console.error('Error completing workout:', error);
      Alert.alert('Error', 'Failed to complete workout');
      throw error;
    }
  }, [activeWorkout, loadWorkoutData]);

  // Simple complete workout without parameters (fix for the error)
  const completeWorkout = useCallback(async (): Promise<WorkoutHistory | undefined> => {
    return completeWorkoutWithDetails(5, '', 'good', 'medium');
  }, [completeWorkoutWithDetails]);

  // Pause workout
  const pauseWorkout = useCallback(async (): Promise<void> => {
    if (!activeWorkout) return;

    try {
      const updatedWorkout: ActiveWorkout = {
        ...activeWorkout,
        status: 'paused'
      };
      
      setActiveWorkout(updatedWorkout);
      await workoutStorage.saveActiveWorkout(updatedWorkout);
    } catch (error) {
      console.error('Error pausing workout:', error);
      Alert.alert('Error', 'Failed to pause workout');
    }
  }, [activeWorkout]);

  // Resume workout
  const resumeWorkout = useCallback(async (): Promise<void> => {
    if (!activeWorkout) return;

    try {
      const updatedWorkout: ActiveWorkout = {
        ...activeWorkout,
        status: 'active'
      };
      
      setActiveWorkout(updatedWorkout);
      await workoutStorage.saveActiveWorkout(updatedWorkout);
    } catch (error) {
      console.error('Error resuming workout:', error);
      Alert.alert('Error', 'Failed to resume workout');
    }
  }, [activeWorkout]);

  // Cancel workout
  const cancelWorkout = useCallback(async (): Promise<void> => {
    try {
      setActiveWorkout(null);
      setShowCompletionModal(false);
      setTimer(0);
      setIsResting(false);
      await workoutStorage.clearActiveWorkout();
    } catch (error) {
      console.error('Error cancelling workout:', error);
      Alert.alert('Error', 'Failed to cancel workout');
    }
  }, []);

  // Toggle favorite
  const toggleFavorite = useCallback(async (planId: string): Promise<void> => {
    try {
      await workoutStorage.toggleFavorite(planId);
      await loadWorkoutData();
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Error', 'Failed to update favorite');
    }
  }, [loadWorkoutData]);

  // Create custom workout
  const createCustomWorkout = useCallback(async (
    plan: Omit<WorkoutPlan, 'id'>
  ): Promise<WorkoutPlan> => {
    try {
      const newPlan = await workoutStorage.createCustomWorkout(plan);
      await loadWorkoutData();
      return newPlan;
    } catch (error) {
      console.error('Error creating custom workout:', error);
      Alert.alert('Error', 'Failed to create workout');
      throw error;
    }
  }, [loadWorkoutData]);

  // Timer management
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (activeWorkout && activeWorkout.status === 'active' && timer > 0) {
      interval = setInterval(() => {
        setTimer(prev => {
          if (prev <= 1) {
            if (isResting) {
              if (userPreferences.autoSkipRest) {
                skipRest();
              } else {
                skipRest();
              }
            } else {
              completeSet().then(isWorkoutComplete => {
                if (isWorkoutComplete) {
                  setShowCompletionModal(true);
                }
              });
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [activeWorkout, timer, isResting, userPreferences, skipRest, completeSet]);

  // Initialize timer from active workout
  useEffect(() => {
    if (activeWorkout) {
      setTimer(activeWorkout.timer);
      setIsResting(activeWorkout.isResting);
    } else {
      setTimer(0);
      setIsResting(false);
    }
  }, [activeWorkout]);

  // Load data on mount
  useEffect(() => {
    loadWorkoutData();
  }, [loadWorkoutData]);

  return {
    // State
    workoutPlans,
    activeWorkout,
    workoutHistory,
    stats,
    loading,
    timer,
    isResting,
    showCompletionModal,
    userPreferences,
    
    // Setters
    setShowCompletionModal,
    
    // Workout actions
    startWorkout,
    completeSet,
    skipRest,
    completeWorkout, // Fixed: now a simple function without parameters
    completeWorkoutWithDetails,
    pauseWorkout,
    resumeWorkout,
    cancelWorkout,
    
    // Customization actions
    updatePreferences,
    
    // Favorites & creation
    toggleFavorite,
    createCustomWorkout,
    
    // Getters
    refreshWorkoutData: loadWorkoutData,
  };
};