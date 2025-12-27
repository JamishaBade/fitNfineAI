// src/contexts/WorkoutContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface ExerciseSession {
  exerciseId: string;
  name: string;
  sets: number;
  reps: number;
  completedSets: number;
  restTime: number;
  completed: boolean;
}

export interface WorkoutPlan {
  id: string;
  name: string;
  description: string;
  duration: number;
  difficulty: string;
  category: string;
  calories: number;
  exercises: ExerciseSession[];
  isFavorite: boolean;
  createdBy: string;
  tags: string[];
}

export interface CompletedWorkout {
  id: string;
  planId: string;
  planName: string;
  startTime: string;
  endTime: string;
  duration: number; // in minutes
  caloriesBurned: number;
  exercises: {
    name: string;
    sets: number;
    reps: number;
    completedSets: number;
  }[];
  rating?: number;
  notes?: string;
  feel?: string;
  difficulty?: string;
}

export interface ActiveWorkout {
  id: string;
  planId: string;
  planName: string;
  startTime: string;
  exercises: ExerciseSession[];
  currentExerciseIndex: number;
  currentSet: number;
  totalSetsCompleted: number;
  status: "active" | "paused" | "completed";
  timer: number;
  isResting: boolean;
  totalDuration: number; // in seconds
  caloriesBurned: number;
  completedExercises: number;
}

export interface WorkoutStats {
  totalWorkouts: number;
  thisWeekWorkouts: number;
  totalHours: number;
  averageRating: number;
  totalCalories: number;
  streak: number;
  lastWorkoutDate: string | null;
}

interface WorkoutContextType {
  // State
  workoutPlans: WorkoutPlan[];
  activeWorkout: ActiveWorkout | null;
  completedWorkouts: CompletedWorkout[];
  stats: WorkoutStats;
  loading: boolean;
  timer: number;
  isResting: boolean;

  // Actions
  startWorkout: (plan: WorkoutPlan) => Promise<void>;
  completeSet: () => Promise<boolean>;
  skipRest: () => Promise<void>;
  completeWorkout: (completionData?: any) => Promise<void>;
  pauseWorkout: () => Promise<void>;
  resumeWorkout: () => Promise<void>;
  cancelWorkout: () => Promise<void>;
  toggleFavorite: (id: string) => Promise<void>;
  createCustomWorkout: (
    plan: Omit<WorkoutPlan, "id" | "createdBy" | "exercises"> & {
      exercises?: ExerciseSession[];
    }
  ) => Promise<void>;
  deleteWorkout: (id: string) => Promise<void>;
  refreshWorkoutData: () => Promise<void>;

  // Stats calculations
  calculateWeeklyWorkouts: () => number;
  calculateStreak: () => number;
}

const defaultStats: WorkoutStats = {
  totalWorkouts: 0,
  thisWeekWorkouts: 0,
  totalHours: 0,
  averageRating: 0,
  totalCalories: 0,
  streak: 0,
  lastWorkoutDate: null,
};

const WorkoutContext = createContext<WorkoutContextType | undefined>(undefined);

export const useWorkout = () => {
  const context = useContext(WorkoutContext);
  if (!context) {
    throw new Error("useWorkout must be used within a WorkoutProvider");
  }
  return context;
};

interface WorkoutProviderProps {
  children: ReactNode;
}

export const WorkoutProvider: React.FC<WorkoutProviderProps> = ({
  children,
}) => {
  const [workoutPlans, setWorkoutPlans] = useState<WorkoutPlan[]>([]);
  const [activeWorkout, setActiveWorkout] = useState<ActiveWorkout | null>(
    null
  );
  const [completedWorkouts, setCompletedWorkouts] = useState<
    CompletedWorkout[]
  >([]);
  const [stats, setStats] = useState<WorkoutStats>(defaultStats);
  const [loading, setLoading] = useState(true);
  const [timer, setTimer] = useState(0);
  const [isResting, setIsResting] = useState(false);

  // Load data on mount
  useEffect(() => {
    loadWorkoutData();
  }, []);

  // Save data when it changes
  useEffect(() => {
    if (!loading) {
      saveWorkoutData();
      calculateStats();
    }
  }, [workoutPlans, completedWorkouts, activeWorkout, loading]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (
      activeWorkout?.status === "active" &&
      activeWorkout.isResting &&
      timer > 0
    ) {
      interval = setInterval(() => {
        setTimer((prev) => {
          if (prev <= 1) {
            clearInterval(interval!);
            setIsResting(false);

            setActiveWorkout((prevWorkout) => {
              if (!prevWorkout) return prevWorkout;
              return {
                ...prevWorkout,
                isResting: false,
                timer: 0,
              };
            });

            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeWorkout?.status, activeWorkout?.isResting, timer]);

  const loadWorkoutData = async () => {
    try {
      setLoading(true);

      // Load all data from AsyncStorage
      const [plansData, completedData, activeData] = await Promise.all([
        AsyncStorage.getItem("workoutPlans"),
        AsyncStorage.getItem("completedWorkouts"),
        AsyncStorage.getItem("activeWorkout"),
      ]);

      // Parse data or use defaults
      const parsedPlans = plansData
        ? JSON.parse(plansData)
        : getDefaultWorkoutPlans();
      const parsedCompleted = completedData ? JSON.parse(completedData) : [];
      const parsedActive = activeData ? JSON.parse(activeData) : null;

      setWorkoutPlans(parsedPlans);
      setCompletedWorkouts(parsedCompleted);
      setActiveWorkout(parsedActive);

      if (parsedActive) {
        setTimer(parsedActive.timer || 0);
        setIsResting(parsedActive.isResting || false);
      }
    } catch (error) {
      console.error("Error loading workout data:", error);
      // Set defaults on error
      setWorkoutPlans(getDefaultWorkoutPlans());
    } finally {
      setLoading(false);
    }
  };

  const saveWorkoutData = async () => {
    try {
      await Promise.all([
        AsyncStorage.setItem("workoutPlans", JSON.stringify(workoutPlans)),
        AsyncStorage.setItem(
          "completedWorkouts",
          JSON.stringify(completedWorkouts)
        ),
        AsyncStorage.setItem("activeWorkout", JSON.stringify(activeWorkout)),
      ]);
    } catch (error) {
      console.error("Error saving workout data:", error);
    }
  };

  const calculateStats = () => {
    if (completedWorkouts.length === 0) {
      setStats(defaultStats);
      return;
    }

    // Calculate weekly workouts
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const thisWeekWorkouts = completedWorkouts.filter((workout) => {
      const workoutDate = new Date(workout.endTime);
      return workoutDate >= oneWeekAgo;
    }).length;

    // Calculate total hours
    const totalMinutes = completedWorkouts.reduce(
      (sum, workout) => sum + workout.duration,
      0
    );
    const totalHours = totalMinutes / 60;

    // Calculate average rating
    const ratedWorkouts = completedWorkouts.filter((workout) => workout.rating);
    const averageRating =
      ratedWorkouts.length > 0
        ? ratedWorkouts.reduce(
            (sum, workout) => sum + (workout.rating || 0),
            0
          ) / ratedWorkouts.length
        : 0;

    // Calculate total calories
    const totalCalories = completedWorkouts.reduce(
      (sum, workout) => sum + workout.caloriesBurned,
      0
    );

    // Calculate streak
    const streak = calculateStreak();

    // Get last workout date
    const sortedWorkouts = [...completedWorkouts].sort(
      (a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime()
    );
    const lastWorkoutDate =
      sortedWorkouts.length > 0 ? sortedWorkouts[0].endTime : null;

    setStats({
      totalWorkouts: completedWorkouts.length,
      thisWeekWorkouts,
      totalHours: parseFloat(totalHours.toFixed(1)),
      averageRating: parseFloat(averageRating.toFixed(1)),
      totalCalories,
      streak,
      lastWorkoutDate,
    });
  };

  const calculateStreak = () => {
    if (completedWorkouts.length === 0) return 0;

    const sortedWorkouts = [...completedWorkouts].sort(
      (a, b) => new Date(b.endTime).getTime() - new Date(a.endTime).getTime()
    );

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    // Check if we have a workout today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayWorkout = sortedWorkouts.find((workout) => {
      const workoutDate = new Date(workout.endTime);
      workoutDate.setHours(0, 0, 0, 0);
      return workoutDate.getTime() === today.getTime();
    });

    if (!todayWorkout) {
      // No workout today, check yesterday
      currentDate.setDate(currentDate.getDate() - 1);
    }

    for (let i = 0; i < sortedWorkouts.length; i++) {
      const workoutDate = new Date(sortedWorkouts[i].endTime);
      workoutDate.setHours(0, 0, 0, 0);

      if (workoutDate.getTime() === currentDate.getTime()) {
        streak++;
        currentDate.setDate(currentDate.getDate() - 1);
      } else if (workoutDate.getTime() < currentDate.getTime()) {
        break;
      }
    }

    return streak;
  };

  const startWorkout = async (plan: WorkoutPlan) => {
    const newActiveWorkout: ActiveWorkout = {
      id: Date.now().toString(),
      planId: plan.id,
      planName: plan.name,
      startTime: new Date().toISOString(),
      exercises: plan.exercises.map((exercise) => ({
        ...exercise,
        completedSets: 0,
        completed: false,
      })),
      currentExerciseIndex: 0,
      currentSet: 1,
      totalSetsCompleted: 0,
      status: "active",
      timer: 0,
      isResting: false,
      totalDuration: 0,
      caloriesBurned: 0,
      completedExercises: 0,
    };

    setActiveWorkout(newActiveWorkout);
    setTimer(0);
    setIsResting(false);
  };

  const completeSet = async () => {
    if (!activeWorkout) return false;

    const updatedWorkout = { ...activeWorkout };
    const currentExercise =
      updatedWorkout.exercises[updatedWorkout.currentExerciseIndex];

    if (currentExercise) {
      currentExercise.completedSets += 1;
      updatedWorkout.totalSetsCompleted += 1;

      if (currentExercise.completedSets >= currentExercise.sets) {
        currentExercise.completed = true;
        updatedWorkout.completedExercises += 1;

        if (
          updatedWorkout.currentExerciseIndex <
          updatedWorkout.exercises.length - 1
        ) {
          updatedWorkout.currentExerciseIndex += 1;
          updatedWorkout.currentSet = 1;
          updatedWorkout.isResting = true;

          const nextExercise =
            updatedWorkout.exercises[updatedWorkout.currentExerciseIndex];
          updatedWorkout.timer = nextExercise.restTime;
          setTimer(nextExercise.restTime);
          setIsResting(true);
        }
      } else {
        updatedWorkout.currentSet += 1;
        updatedWorkout.isResting = true;
        updatedWorkout.timer = currentExercise.restTime;
        setTimer(currentExercise.restTime);
        setIsResting(true);
      }
    }

    setActiveWorkout(updatedWorkout);
    return true;
  };

  const skipRest = async () => {
    if (!activeWorkout) return;

    const updatedWorkout = { ...activeWorkout };
    updatedWorkout.isResting = false;
    updatedWorkout.timer = 0;
    setActiveWorkout(updatedWorkout);
    setTimer(0);
    setIsResting(false);
  };

  const completeWorkout = async (completionData?: any) => {
    if (!activeWorkout) return;

    try {
      setLoading(true);

      const endTime = new Date().toISOString();
      const startTime = new Date(activeWorkout.startTime);
      const endTimeDate = new Date(endTime);
      const duration = Math.round(
        (endTimeDate.getTime() - startTime.getTime()) / 1000 / 60
      ); // minutes

      // Calculate calories burned (simplified: 8 calories per minute * intensity factor)
      const intensityFactor =
        completionData?.difficulty === "hard"
          ? 1.2
          : completionData?.difficulty === "easy"
          ? 0.8
          : 1;
      const caloriesBurned = Math.round(duration * 8 * intensityFactor);

      const completedWorkout: CompletedWorkout = {
        id: activeWorkout.id,
        planId: activeWorkout.planId,
        planName: activeWorkout.planName,
        startTime: activeWorkout.startTime,
        endTime,
        duration,
        caloriesBurned,
        exercises: activeWorkout.exercises.map((exercise) => ({
          name: exercise.name,
          sets: exercise.sets,
          reps: exercise.reps,
          completedSets: exercise.completedSets,
        })),
        rating: completionData?.rating,
        notes: completionData?.notes,
        feel: completionData?.feel,
        difficulty: completionData?.difficulty,
      };

      // Add to completed workouts
      setCompletedWorkouts((prev) => [...prev, completedWorkout]);

      // Clear active workout
      setActiveWorkout(null);
      setTimer(0);
      setIsResting(false);
    } catch (error) {
      console.error("Error completing workout:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const pauseWorkout = async () => {
    if (!activeWorkout) return;

    const updatedWorkout = { ...activeWorkout };
    updatedWorkout.status = "paused";
    setActiveWorkout(updatedWorkout);
  };

  const resumeWorkout = async () => {
    if (!activeWorkout) return;

    const updatedWorkout = { ...activeWorkout };
    updatedWorkout.status = "active";
    setActiveWorkout(updatedWorkout);

    // If we were resting, update the timer display
    if (updatedWorkout.isResting) {
      setTimer(updatedWorkout.timer);
    }
  };

  const cancelWorkout = async () => {
    setActiveWorkout(null);
    setTimer(0);
    setIsResting(false);
  };

  const toggleFavorite = async (id: string) => {
    setWorkoutPlans((prev) =>
      prev.map((plan) =>
        plan.id === id ? { ...plan, isFavorite: !plan.isFavorite } : plan
      )
    );
  };

  const createCustomWorkout = async (
    planData: Omit<WorkoutPlan, "id" | "createdBy" | "exercises"> & {
      exercises?: ExerciseSession[];
    }
  ) => {
    const newWorkout: WorkoutPlan = {
      ...planData,
      id: Date.now().toString(),
      createdBy: "user",
      exercises: planData.exercises || [
        {
          exerciseId: `custom_${Date.now()}_1`,
          name: "Custom Exercise 1",
          sets: 3,
          reps: 10,
          completedSets: 0,
          restTime: 60,
          completed: false,
        },
        {
          exerciseId: `custom_${Date.now()}_2`,
          name: "Custom Exercise 2",
          sets: 3,
          reps: 10,
          completedSets: 0,
          restTime: 60,
          completed: false,
        },
      ],
      tags: [
        "custom",
        planData.difficulty,
        planData.category,
        ...(planData.tags || []),
      ],
      isFavorite: false,
    };

    setWorkoutPlans((prev) => [...prev, newWorkout]);
  };

  const deleteWorkout = async (id: string) => {
    setWorkoutPlans((prev) => prev.filter((plan) => plan.id !== id));
  };

  const refreshWorkoutData = async () => {
    setLoading(true);
    try {
      await loadWorkoutData();
    } finally {
      setLoading(false);
    }
  };

  const value: WorkoutContextType = {
    workoutPlans,
    activeWorkout,
    completedWorkouts,
    stats,
    loading,
    timer,
    isResting,
    startWorkout,
    completeSet,
    skipRest,
    completeWorkout,
    pauseWorkout,
    resumeWorkout,
    cancelWorkout,
    toggleFavorite,
    createCustomWorkout,
    deleteWorkout,
    refreshWorkoutData,
    calculateWeeklyWorkouts: () => {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      return completedWorkouts.filter(
        (workout) => new Date(workout.endTime) >= oneWeekAgo
      ).length;
    },
    calculateStreak,
  };

  return (
    <WorkoutContext.Provider value={value}>{children}</WorkoutContext.Provider>
  );
};

// Default workout plans
const getDefaultWorkoutPlans = (): WorkoutPlan[] => [
  {
    id: "1",
    name: "Full Body Strength",
    description: "Complete full body workout for all muscle groups",
    duration: 45,
    difficulty: "intermediate",
    category: "strength",
    calories: 320,
    exercises: [
      {
        exerciseId: "1",
        name: "Push Ups",
        sets: 3,
        reps: 15,
        completedSets: 0,
        restTime: 60,
        completed: false,
      },
      {
        exerciseId: "2",
        name: "Squats",
        sets: 3,
        reps: 12,
        completedSets: 0,
        restTime: 60,
        completed: false,
      },
      {
        exerciseId: "3",
        name: "Pull Ups",
        sets: 3,
        reps: 10,
        completedSets: 0,
        restTime: 60,
        completed: false,
      },
    ],
    isFavorite: false,
    createdBy: "system",
    tags: ["full body", "strength"],
  },
  {
    id: "2",
    name: "Cardio Blast",
    description: "High intensity cardio workout",
    duration: 30,
    difficulty: "beginner",
    category: "cardio",
    calories: 280,
    exercises: [
      {
        exerciseId: "4",
        name: "Jumping Jacks",
        sets: 3,
        reps: 30,
        completedSets: 0,
        restTime: 45,
        completed: false,
      },
      {
        exerciseId: "5",
        name: "High Knees",
        sets: 3,
        reps: 20,
        completedSets: 0,
        restTime: 45,
        completed: false,
      },
    ],
    isFavorite: true,
    createdBy: "system",
    tags: ["cardio", "fat burning"],
  },
  {
    id: "3",
    name: "Morning Yoga",
    description: "Gentle morning yoga routine",
    duration: 20,
    difficulty: "beginner",
    category: "yoga",
    calories: 120,
    exercises: [
      {
        exerciseId: "6",
        name: "Sun Salutations",
        sets: 3,
        reps: 5,
        completedSets: 0,
        restTime: 30,
        completed: false,
      },
    ],
    isFavorite: false,
    createdBy: "system",
    tags: ["yoga", "morning"],
  },
];
