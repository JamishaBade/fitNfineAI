import React, { useState, useEffect, useCallback, useMemo } from "react";
import { router } from "expo-router";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Animated,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import { useWorkout } from "../../../hooks/useWorkouts";
import { useProfile } from "../../../hooks/useProfile";
import { WorkoutCard } from "../../../components/WorkoutCard";
import { WorkoutPlan } from "../../../types/workout";
import { ProgressDashboard } from "@/components/ProgressDashboard";
const { width } = Dimensions.get("window");

interface ActiveWorkout {
  planName?: string;
  completedExercises?: number;
  exercises?: Array<any>;
  startTime?: number;
  totalDuration?: number;
}

interface Profile {
  name?: string;
  experienceLevel?: string;
  goals?: string[];
  weeklyWorkoutGoal?: number;
}

interface Stats {
  thisWeekWorkouts?: number;
  totalWorkouts?: number;
  totalHours?: number;
  totalCalories?: number;
  currentStreak?: number;
}

interface QuickAction {
  id: number;
  title: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  duration: string;
  type: string;
  onPress: () => void;
}
// Enhanced Progress Ring with smooth animation
const ProgressRing = ({
  size,
  progress,
  color,
  showPercentage = false,
  strokeWidth = 8,
}: {
  size: number;
  progress: number;
  color: string;
  showPercentage?: boolean;
  strokeWidth?: number;
}) => {
  const [animatedProgress] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.timing(animatedProgress, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  const circumference = 2 * Math.PI * (size / 2 - strokeWidth / 2);
  const strokeDashoffset = animatedProgress.interpolate({
    inputRange: [0, 100],
    outputRange: [circumference, 0],
  });

  return (
    <View style={{ width: size, height: size, position: "relative" }}>
      {/* Background circle */}
      <View
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: `${color}20`,
          justifyContent: "center",
          alignItems: "center",
        }}
      />

      {/* Progress circle using rotation */}
      <View
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: strokeWidth,
          borderColor: "transparent",
        }}
      >
        {progress > 0 && (
          <View
            style={{
              position: "absolute",
              width: size,
              height: size,
              borderRadius: size / 2,
              borderWidth: strokeWidth,
              borderColor: color,
              borderTopColor: progress >= 25 ? color : "transparent",
              borderRightColor: progress >= 50 ? color : "transparent",
              borderBottomColor: progress >= 75 ? color : "transparent",
              borderLeftColor: progress >= 100 ? color : "transparent",
              transform: [{ rotate: "-45deg" }],
            }}
          />
        )}
      </View>

      {/* Percentage text */}
      {showPercentage && (
        <View
          style={{
            position: "absolute",
            width: "100%",
            height: "100%",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: size * 0.25,
              fontWeight: "bold",
              color,
            }}
          >
            {Math.round(progress)}%
          </Text>
        </View>
      )}
    </View>
  );
};

// Improved Skeleton Loader
const SkeletonLoader = () => {
  const [fadeAnim] = useState(new Animated.Value(0.3));

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <Animated.View style={{ opacity: fadeAnim }}>
          <View className="px-6 pt-6 pb-4 bg-white">
            <View className="flex-row justify-between items-center mb-2">
              <View className="flex-1">
                <View className="h-6 w-40 bg-gray-200 rounded mb-2" />
                <View className="h-4 w-60 bg-gray-200 rounded" />
              </View>
              <View className="bg-gray-200 p-3 rounded-full ml-4 w-12 h-12" />
            </View>
          </View>
          <View className="px-6 mt-4">
            <View className="bg-gray-200 rounded-2xl p-5 h-40" />
          </View>
          <View className="px-6 mt-6">
            <View className="bg-white rounded-2xl p-5 shadow-sm h-32" />
          </View>
          <View className="px-6 mt-6">
            <View className="h-6 w-32 bg-gray-200 rounded mb-4" />
            <View className="flex-row space-x-4">
              {[1, 2, 3].map((i) => (
                <View key={i} className="bg-gray-200 rounded-2xl w-40 h-48" />
              ))}
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
};

// Workout Timer Display
const WorkoutTimer = ({ startTime }: { startTime: number }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <View className="flex-row items-center">
      <Ionicons name="time-outline" size={16} color="white" />
      <Text className="text-white ml-1 font-mono">{formatTime(elapsed)}</Text>
    </View>
  );
};

export default function HomeScreen() {
  const navigation = useNavigation<any>();
  const {
    workoutPlans,
    activeWorkout,
    stats,
    loading,
    startWorkout,
    refreshWorkoutData,
  } = useWorkout();
  const { profile, loading: profileLoading } = useProfile();
  const [refreshing, setRefreshing] = useState(false);
  const [recommendedWorkouts, setRecommendedWorkouts] = useState<WorkoutPlan[]>(
    []
  );
  const [error, setError] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  useEffect(() => {
    filterRecommendedWorkouts();
  }, [workoutPlans, (profile as Profile)?.experienceLevel, profile?.goals]);

  const loadData = async () => {
    try {
      setError(null);
      await refreshWorkoutData();
    } catch (error) {
      console.error("Error loading data:", error);
      setError("Failed to load data");
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await loadData();
    } catch (error) {
      console.error("Refresh error:", error);
    } finally {
      setRefreshing(false);
    }
  };

  const filterRecommendedWorkouts = useCallback(() => {
    if (!workoutPlans || workoutPlans.length === 0) {
      setRecommendedWorkouts([]);
      return;
    }

    const userExperience = (profile as Profile)?.experienceLevel || "beginner";
    const userGoals = (profile as Profile)?.goals || [];

    const goalKeywords: Record<string, string[]> = {
      weight_loss: [
        "cardio",
        "hiit",
        "fat burning",
        "weight loss",
        "burn",
        "fat",
      ],
      muscle_gain: [
        "strength",
        "muscle",
        "bodybuilding",
        "power",
        "lift",
        "gain",
        "hypertrophy",
      ],
      endurance: [
        "cardio",
        "endurance",
        "stamina",
        "circuit",
        "hiit",
        "running",
      ],
      flexibility: [
        "yoga",
        "flexibility",
        "stretching",
        "mobility",
        "pilates",
        "stretch",
      ],
      general_fitness: [
        "full body",
        "general",
        "total",
        "complete",
        "functional",
        "fitness",
      ],
    };

    const filtered = workoutPlans.filter((plan) => {
      if (!plan) return false;

      // Experience level filter

      // Goals filter
      if (userGoals.length > 0) {
        const planText = [
          plan.name?.toLowerCase() || "",
          plan.description?.toLowerCase() || "",
          ...(plan.tags || []).map((tag: string) => tag.toLowerCase()),
          plan.category?.toLowerCase() || "",
        ].join(" ");

        const hasGoalMatch = userGoals.some((goal: string) => {
          const keywords = goalKeywords[goal] || [];
          return keywords.some((keyword) => planText.includes(keyword));
        });

        if (!hasGoalMatch && userGoals.length > 0) return false;
      }

      return true;
    });

    // Sort by relevance and slice
    const sorted = filtered.sort((a, b) => {
      // Prioritize matching difficulty
      if (a.difficulty === userExperience && b.difficulty !== userExperience)
        return -1;
      if (b.difficulty === userExperience && a.difficulty !== userExperience)
        return 1;
      return 0;
    });

    setRecommendedWorkouts(sorted.slice(0, 5));
  }, [workoutPlans, profile]);

  const handleStartWorkout = async (workout: WorkoutPlan | undefined) => {
    if (!workout || !workout.id) {
      Alert.alert("Error", "Invalid workout selected");
      return;
    }

    try {
      await startWorkout(workout);
      navigation.navigate("ActiveWorkoutTimer");
    } catch (error) {
      console.error("Error starting workout:", error);
      Alert.alert(
        "Error Starting Workout",
        "Please check your connection and try again.",
        [{ text: "OK" }]
      );
    }
  };

  const handleQuickAction = useCallback(
    (type: string) => {
      if (!workoutPlans || workoutPlans.length === 0) {
        Alert.alert(
          "No Workouts Available",
          "Create a workout plan first or browse the library",
          [
            { text: "Cancel", style: "cancel" },
            { text: "Create", onPress: handleCreateWorkout },
          ]
        );
        return;
      }

      let foundWorkout: WorkoutPlan | undefined;

      switch (type) {
        case "quick":
          foundWorkout = workoutPlans.find(
            (w) => w && w.duration && w.duration <= 20
          );
          break;
        case "strength":
          foundWorkout = workoutPlans.find(
            (w) =>
              w &&
              (w.category === "strength" ||
                w.name?.toLowerCase().includes("strength") ||
                w.tags?.some((t) => t.toLowerCase().includes("strength")))
          );
          break;
        case "cardio":
          foundWorkout = workoutPlans.find(
            (w) =>
              w &&
              (w.category === "cardio" ||
                w.name?.toLowerCase().includes("cardio") ||
                w.tags?.some((t) => t.toLowerCase().includes("cardio")))
          );
          break;
        default:
          return;
      }

      if (foundWorkout) {
        handleStartWorkout(foundWorkout);
      } else {
        Alert.alert(
          "No Matching Workouts",
          `No ${type} workouts found. Would you like to create one?`,
          [
            { text: "Cancel", style: "cancel" },
            { text: "Create", onPress: handleCreateWorkout },
            {
              text: "Browse All",
              onPress: () => navigation.navigate("Workout"),
            },
          ]
        );
      }
    },
    [workoutPlans]
  );

  const handleResumeWorkout = () => {
    if (activeWorkout) {
      navigation.navigate("ActiveWorkout");
    }
  };

  const handleCreateWorkout = () => {
    navigation.navigate("CreateWorkout");
  };

  const getGreeting = useCallback(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  }, []);

  const getWeeklyProgress = useCallback(() => {
    const workouts = stats?.thisWeekWorkouts || 0;
    const goal = (profile as Profile)?.weeklyWorkoutGoal || 3;
    return Math.min(100, (workouts / goal) * 100);
  }, [stats, profile]);

  const getMotivationalMessage = useCallback(() => {
    const messages = [
      "Let's crush it today! ",
      "Your only limit is you! 🚀",
      "Make today count! ⭐",
      "Stronger every day! 🔥",
      "Progress over perfection! 🎯",
    ];
    return messages[Math.floor(Math.random() * messages.length)];
  }, []);

  const weeklyProgress = useMemo(
    () => getWeeklyProgress(),
    [getWeeklyProgress]
  );
  const greeting = useMemo(() => getGreeting(), [getGreeting]);
  const userName = useMemo(
    () => (profile as Profile)?.name || "Athlete",
    [profile]
  );
  const motivationalMsg = useMemo(() => getMotivationalMessage(), []);
  const weeklyGoal = useMemo(
    () => (profile as Profile)?.weeklyWorkoutGoal || 3,
    [profile]
  );

  const quickActions: QuickAction[] = useMemo(
    () => [
      {
        id: 1,
        title: "Quick Start",
        description: "15-min workout",
        icon: "play-circle",
        color: "bg-blue-500",
        duration: "15 min",
        type: "quick",
        onPress: () => handleQuickAction("quick"),
      },
      {
        id: 2,
        title: "Strength",
        description: "Build muscle",
        icon: "barbell",
        color: "bg-red-500",
        duration: "45 min",
        type: "strength",
        onPress: () => handleQuickAction("strength"),
      },
      {
        id: 3,
        title: "Cardio",
        description: "Burn calories",
        icon: "flash",
        color: "bg-green-500",
        duration: "30 min",
        type: "cardio",
        onPress: () => handleQuickAction("cardio"),
      },
      {
        id: 4,
        title: "Custom",
        description: "Your workout",
        icon: "add-circle",
        color: "bg-purple-500",
        duration: "Custom",
        type: "custom",
        onPress: handleCreateWorkout,
      },
    ],
    [handleQuickAction]
  );

  const statsData = useMemo(
    () => [
      {
        id: 1,
        icon: "barbell" as keyof typeof Ionicons.glyphMap,
        color: "#3B82F6",
        bgColor: "bg-blue-100",
        value: (stats as Stats)?.totalWorkouts || 0,
        label: "Total Workouts",
      },
      {
        id: 2,
        icon: "time" as keyof typeof Ionicons.glyphMap,
        color: "#10B981",
        bgColor: "bg-green-100",
        value: `${(stats as Stats)?.totalHours || 0}h`,
        label: "Training Time",
      },
      {
        id: 3,
        icon: "flame" as keyof typeof Ionicons.glyphMap,
        color: "#EF4444",
        bgColor: "bg-red-100",
        value: (stats as Stats)?.totalCalories || 0,
        label: "Calories",
      },
      {
        id: 4,
        icon: "trending-up" as keyof typeof Ionicons.glyphMap,
        color: "#F59E0B",
        bgColor: "bg-orange-100",
        value: `${(stats as Stats)?.currentStreak || 0}d`,
        label: "Streak",
      },
    ],
    [stats]
  );

  if (loading || profileLoading) {
    return <SkeletonLoader />;
  }

  return (
    <SafeAreaView
      className="flex-1 bg-gray-50"
      edges={["top", "left", "right"]}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        className="flex-1"
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#3B82F6"]}
            tintColor="#3B82F6"
          />
        }
      >
        {/* Header */}
        <View className="px-6 pt-6 pb-4 bg-white shadow-sm">
          <View className="flex-row justify-between items-center">
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-900">
                {greeting}, {userName}!
              </Text>
              <Text className="text-gray-600 mt-1 text-base">
                {activeWorkout ? "Continue your workout" : motivationalMsg}
              </Text>
            </View>
            <TouchableOpacity
              className="bg-blue-50 p-3 rounded-full ml-4"
              onPress={() => router.push("/(tabs)/profile")}
              activeOpacity={0.7}
            >
              <Ionicons name="person" size={24} color="#3B82F6" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Error Message */}
        {error && (
          <View className="px-6 mt-4">
            <View className="bg-red-50 border border-red-200 rounded-xl p-4 flex-row items-center">
              <Ionicons name="alert-circle" size={24} color="#EF4444" />
              <Text className="text-red-800 ml-3 flex-1">{error}</Text>
              <TouchableOpacity onPress={loadData}>
                <Text className="text-red-600 font-semibold">Retry</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Weekly Progress */}
        <View className="px-6 mt-6">
          <View className="bg-white rounded-3xl p-6 shadow-sm">
            <View className="flex-row justify-between items-center mb-5">
              <View className="flex-1">
                <Text className="text-xl font-bold text-gray-900 mb-1">
                  Weekly Progress
                </Text>
                <Text className="text-gray-600">
                  {stats?.thisWeekWorkouts || 0} of {weeklyGoal} workouts
                </Text>
              </View>
              <ProgressRing
                size={70}
                progress={weeklyProgress}
                color="#3B82F6"
                showPercentage
              />
            </View>

            {weeklyProgress >= 100 ? (
              <View className="bg-green-50 border border-green-200 rounded-2xl p-4 flex-row items-center">
                <View className="bg-green-500 rounded-full p-2">
                  <Ionicons name="trophy" size={20} color="white" />
                </View>
                <Text className="text-green-800 font-semibold ml-3 flex-1">
                  Goal crushed this week!
                </Text>
              </View>
            ) : (
              <TouchableOpacity
                className="bg-blue-600 rounded-2xl p-4 items-center active:bg-blue-700"
                activeOpacity={0.8}
                onPress={() => router.push("/(tabs)/workout")}
              >
                <Text className="text-white font-semibold text-base">
                  Start Workout
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Active Workout Banner */}
        {activeWorkout &&
          (() => {
            const workout: ActiveWorkout = {
              planName: (activeWorkout as any)?.planName,
              completedExercises:
                (activeWorkout as any)?.completedExercises || 0,
              exercises: (activeWorkout as any)?.exercises || [],
              startTime: (activeWorkout as any)?.startTime,
              totalDuration: (activeWorkout as any)?.totalDuration,
            };

            const progress =
              workout.exercises.length > 0
                ? ((workout.completedExercises || 0) /
                    workout.exercises.length) *
                  100
                : 0;

            return (
              <View className="px-6 mt-6">
                <ProgressDashboard />
              </View>
            );
          })()}

        {/* Quick Actions */}
        <View className="mt-8">
          <View className="px-6 mb-4">
            <Text className="text-xl font-bold text-gray-900">Quick Start</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 24 }}
          >
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={action.id}
                className={`${action.color} rounded-3xl p-6 shadow-md ${
                  index < quickActions.length - 1 ? "mr-4" : ""
                }`}
                style={{ width: width * 0.5 }}
                onPress={action.onPress}
                activeOpacity={0.8}
              >
                <View className="mb-3">
                  <View className="bg-white/20 rounded-full p-3 self-start">
                    <Ionicons name={action.icon} size={28} color="white" />
                  </View>
                </View>
                <Text className="text-white text-lg font-bold mb-1">
                  {action.title}
                </Text>
                <Text className="text-white/80 text-sm mb-4">
                  {action.description}
                </Text>
                <View className="flex-row items-center justify-between">
                  <Text className="text-white/90 text-sm font-medium">
                    {action.duration}
                  </Text>
                  <View className="bg-white/20 rounded-full p-1.5">
                    <Ionicons name="arrow-forward" size={16} color="white" />
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Recommended Workouts */}
        {recommendedWorkouts.length > 0 && (
          <View className="mt-8">
            <View className="px-6 flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-900">
                Recommended For You
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(tabs)/workout")}
                activeOpacity={0.7}
              >
                <View className="flex-row items-center">
                  <Text className="text-blue-600 font-semibold mr-1">
                    See All
                  </Text>
                  <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
                </View>
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24 }}
            >
              {recommendedWorkouts.map((workout, index) => (
                <View
                  key={workout?.id || index}
                  className={
                    index < recommendedWorkouts.length - 1 ? "mr-4" : ""
                  }
                >
                  {workout && (
                    <WorkoutCard
                      workout={workout}
                      onPress={() => handleStartWorkout(workout)}
                      compact
                    />
                  )}
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Stats Overview */}
        <View className="px-6 mt-8">
          <Text className="text-xl font-bold text-gray-900 mb-4">
            Your Stats
          </Text>
          <View className="flex-row flex-wrap justify-between">
            {statsData.map((stat) => (
              <View
                key={stat.id}
                className="bg-white rounded-3xl p-5 mb-4 shadow-sm"
                style={{ width: "48%" }}
              >
                <View
                  className={`${stat.bgColor} p-3 rounded-2xl self-start mb-3`}
                >
                  <Ionicons
                    name={stat.icon as any}
                    size={24}
                    color={stat.color}
                  />
                </View>
                <Text className="text-3xl font-bold text-gray-900 mb-1">
                  {stat.value}
                </Text>
                <Text className="text-gray-600 text-sm">{stat.label}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Activity Status */}
        <View className="px-6 mt-4 mb-8">
          <View className="bg-white rounded-3xl p-6 shadow-sm">
            {(stats?.thisWeekWorkouts || 0) > 0 ? (
              <View className="items-center">
                <View className="bg-green-100 rounded-full p-4 mb-4">
                  <Ionicons name="checkmark-circle" size={48} color="#10B981" />
                </View>
                <Text className="text-xl font-bold text-gray-900 mb-2">
                  {stats?.thisWeekWorkouts}{" "}
                  {stats?.thisWeekWorkouts === 1 ? "Workout" : "Workouts"} This
                  Week
                </Text>
                <Text className="text-gray-600 mb-4">
                  Keep the momentum going! 🔥
                </Text>
                <TouchableOpacity
                  className="bg-blue-600 px-8 py-3 rounded-2xl active:bg-blue-700"
                  onPress={() => navigation.navigate("History")}
                  activeOpacity={0.8}
                >
                  <Text className="text-white font-semibold">View History</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View className="items-center">
                <View className="bg-gray-100 rounded-full p-4 mb-4">
                  <Ionicons name="barbell-outline" size={48} color="#6B7280" />
                </View>
                <Text className="text-xl font-bold text-gray-900 mb-2">
                  Start Your Week Strong
                </Text>
                <Text className="text-gray-600 mb-4">
                  Begin your fitness journey today!
                </Text>
                <TouchableOpacity
                  className="bg-blue-600 px-8 py-3 rounded-2xl active:bg-blue-700"
                  onPress={handleCreateWorkout}
                  activeOpacity={0.8}
                >
                  <Text className="text-white font-semibold">
                    Create Workout
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      {!activeWorkout && (
        <View className="absolute bottom-8 right-6">
          <TouchableOpacity
            className="bg-blue-600 rounded-full p-4 shadow-2xl"
            onPress={handleCreateWorkout}
            activeOpacity={0.8}
            style={{
              elevation: 8,
              shadowColor: "#3B82F6",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 8,
            }}
          >
            <Ionicons name="add" size={32} color="white" />
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}
