import React, { useCallback, useState, useMemo } from "react";
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useWorkout } from "../../../contexts/WorkoutContext"; // Import the context

/* ---------------- TYPES ---------------- */

type StoredWorkout = {
  id: string;
  name: string;
  type: string;
  duration: number; // minutes
  calories: number;
  exercises: number;
  completedAt: string; // ISO string
};

type Section = {
  title: string;
  data: StoredWorkout[];
};

// Mini Chart Component for ProgressDashboard
const MiniChart: React.FC<{
  data: { label: string; value: number; color: string }[];
  maxValue: number;
}> = ({ data, maxValue }) => {
  return (
    <View className="mt-3">
      <View className="flex-row items-end justify-between h-24">
        {data.map((item, index) => {
          const height = maxValue > 0 ? (item.value / maxValue) * 80 : 0;
          return (
            <View
              key={index}
              className="items-center flex-1"
              style={{ marginHorizontal: 2 }}
            >
              <View
                className="rounded-t-lg w-full"
                style={{
                  height: Math.max(4, height),
                  backgroundColor: item.color,
                }}
              />
              <Text className="text-[9px] text-gray-500 mt-1" numberOfLines={1}>
                {item.label}
              </Text>
              <Text
                className="text-[9px] font-semibold text-gray-700"
                numberOfLines={1}
              >
                {item.value > 0 ? item.value.toFixed(1) : "0"}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
};

// Progress Dashboard Component
const ProgressDashboard = () => {
  const { completedWorkouts } = useWorkout();
  const [selectedTimeFrame, setSelectedTimeFrame] =
    useState<"weekly">("weekly");

  // Convert CompletedWorkout from context to WorkoutSession format
  const workoutHistory = useMemo(() => {
    if (!completedWorkouts || completedWorkouts.length === 0) {
      return [];
    }

    return completedWorkouts.map((workout) => {
      // Calculate exercises completed
      const exercisesCompleted = workout.exercises?.length || 0;

      // Calculate goals achieved (completed sets)
      const goalsAchieved =
        workout.exercises?.reduce((sum, ex) => {
          return sum + (ex.completedSets || 0);
        }, 0) || 0;

      // Get difficulty with fallback
      let difficulty: "beginner" | "intermediate" | "advanced" = "intermediate";
      if (workout.difficulty) {
        const lower = workout.difficulty.toLowerCase();
        if (lower === "beginner" || lower === "easy") {
          difficulty = "beginner";
        } else if (
          lower === "intermediate" ||
          lower === "medium" ||
          lower === "med"
        ) {
          difficulty = "intermediate";
        } else if (lower === "advanced" || lower === "hard") {
          difficulty = "advanced";
        }
      }

      return {
        id: workout.id,
        date: workout.endTime,
        duration: workout.duration || 0,
        difficulty: difficulty,
        exercisesCompleted: exercisesCompleted,
        goalsAchieved: goalsAchieved,
        planName: workout.planName || "Workout",
        calories: workout.caloriesBurned || 0,
        rating: workout.rating || 0,
      };
    });
  }, [completedWorkouts]);

  // Calculate date range for weekly view
  const getDateRange = () => {
    const now = new Date();
    const startDate = new Date();
    startDate.setDate(now.getDate() - 27); // Last 4 weeks
    return { startDate, endDate: now };
  };

  // Filter and aggregate data for weekly chart
  const chartData = useMemo(() => {
    const { startDate } = getDateRange();
    const filtered = workoutHistory.filter((session) => {
      try {
        return new Date(session.date) >= startDate;
      } catch (e) {
        return false;
      }
    });

    const weeks = Array(4).fill(0);
    const now = new Date();

    filtered.forEach((session) => {
      try {
        const sessionDate = new Date(session.date);
        const weekDiff = Math.floor(
          (now.getTime() - sessionDate.getTime()) / (7 * 24 * 60 * 60 * 1000)
        );
        if (weekDiff < 4 && weekDiff >= 0) {
          weeks[3 - weekDiff] += session.duration;
        }
      } catch (e) {
        console.error("Error processing session date:", e);
      }
    });

    return weeks.map((minutes, index) => ({
      label: `W${index + 1}`,
      value: minutes,
      color: minutes > 0 ? "#3B82F6" : "#E5E7EB",
    }));
  }, [workoutHistory]);

  // Calculate stats
  const stats = useMemo(() => {
    const { startDate } = getDateRange();
    const filtered = workoutHistory.filter((session) => {
      try {
        return new Date(session.date) >= startDate;
      } catch (e) {
        return false;
      }
    });

    const totalMinutes = filtered.reduce(
      (sum, s) => sum + (s.duration || 0),
      0
    );

    // Count difficulty breakdown
    const difficultyBreakdown = {
      beginner: filtered.filter((s) => s.difficulty === "beginner").length,
      intermediate: filtered.filter((s) => s.difficulty === "intermediate")
        .length,
      advanced: filtered.filter((s) => s.difficulty === "advanced").length,
    };

    const totalCalories = filtered.reduce(
      (sum, s) => sum + (s.calories || 0),
      0
    );

    // Calculate average rating only from workouts that have ratings
    const ratedWorkouts = filtered.filter((s) => s.rating && s.rating > 0);
    const averageRating =
      ratedWorkouts.length > 0
        ? ratedWorkouts.reduce((sum, s) => sum + (s.rating || 0), 0) /
          ratedWorkouts.length
        : 0;

    return {
      totalWorkouts: filtered.length,
      totalMinutes,
      totalHours: totalMinutes / 60,
      totalGoalsAchieved: filtered.reduce(
        (sum, s) => sum + (s.goalsAchieved || 0),
        0
      ),
      difficultyBreakdown,
      totalCalories,
      averageRating,
      averageDuration: filtered.length > 0 ? totalMinutes / filtered.length : 0,
    };
  }, [workoutHistory]);

  const maxChartValue = Math.max(...chartData.map((d) => d.value), 1);

  if (workoutHistory.length === 0) {
    return null; // Don't show dashboard if no workouts
  }

  return (
    <View className="bg-white rounded-3xl p-5 mb-6 mx-6 shadow-sm border border-gray-100">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-lg font-bold text-gray-900">4-Week Progress</Text>
        <View className="bg-blue-50 px-3 py-1 rounded-full">
          <Text className="text-blue-600 text-xs font-semibold">4 Weeks</Text>
        </View>
      </View>

      {/* Stats Grid */}
      <View className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-2xl p-4 mb-4">
        <View className="flex-row flex-wrap" style={{ gap: 12 }}>
          <View className="flex-1 min-w-[45%] bg-white rounded-xl p-3">
            <View className="flex-row items-center mb-1">
              <Ionicons name="barbell" size={16} color="#3B82F6" />
              <Text className="text-xs text-gray-500 ml-1">Workouts</Text>
            </View>
            <Text className="text-2xl font-bold text-gray-900">
              {stats.totalWorkouts}
            </Text>
          </View>

          <View className="flex-1 min-w-[45%] bg-white rounded-xl p-3">
            <View className="flex-row items-center mb-1">
              <Ionicons name="time" size={16} color="#8B5CF6" />
              <Text className="text-xs text-gray-500 ml-1">Hours</Text>
            </View>
            <Text className="text-2xl font-bold text-gray-900">
              {stats.totalHours.toFixed(1)}
            </Text>
          </View>

          <View className="flex-1 min-w-[45%] bg-white rounded-xl p-3">
            <View className="flex-row items-center mb-1">
              <Ionicons name="flame" size={16} color="#F59E0B" />
              <Text className="text-xs text-gray-500 ml-1">Calories</Text>
            </View>
            <Text className="text-2xl font-bold text-gray-900">
              {stats.totalCalories.toLocaleString()}
            </Text>
          </View>

          <View className="flex-1 min-w-[45%] bg-white rounded-xl p-3">
            <View className="flex-row items-center mb-1">
              <Ionicons name="trophy" size={16} color="#10B981" />
              <Text className="text-xs text-gray-500 ml-1">Goals</Text>
            </View>
            <Text className="text-2xl font-bold text-gray-900">
              {stats.totalGoalsAchieved}
            </Text>
          </View>
        </View>
      </View>

      {/* Chart Section */}
      {stats.totalWorkouts > 0 && (
        <>
          <View className="mb-4">
            <Text className="text-sm font-semibold text-gray-700 mb-2">
              Activity Overview (minutes)
            </Text>
            <MiniChart data={chartData} maxValue={maxChartValue} />
          </View>

          {/* Rating */}
          {stats.averageRating > 0 && (
            <View className="mt-4 bg-amber-50 rounded-2xl p-3">
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center">
                  <Ionicons name="star" size={20} color="#F59E0B" />
                  <Text className="text-sm text-gray-600 ml-2">
                    Average Rating
                  </Text>
                </View>
                <View className="flex-row items-center">
                  <Text className="text-lg font-bold text-amber-600">
                    {stats.averageRating.toFixed(1)}
                  </Text>
                  <Text className="text-sm text-gray-500 ml-1">/5</Text>
                </View>
              </View>
            </View>
          )}
        </>
      )}
    </View>
  );
};

/* ---------------- HELPERS ---------------- */

const isSameDay = (a: Date, b: Date) => a.toDateString() === b.toDateString();

const isThisWeek = (date: Date) => {
  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  return date >= startOfWeek;
};

const groupWorkouts = (workouts: StoredWorkout[]): Section[] => {
  const today: StoredWorkout[] = [];
  const yesterday: StoredWorkout[] = [];
  const thisWeek: StoredWorkout[] = [];
  const older: StoredWorkout[] = [];

  const now = new Date();
  const yest = new Date();
  yest.setDate(now.getDate() - 1);

  workouts.forEach((w) => {
    const d = new Date(w.completedAt);

    if (isSameDay(d, now)) today.push(w);
    else if (isSameDay(d, yest)) yesterday.push(w);
    else if (isThisWeek(d)) thisWeek.push(w);
    else older.push(w);
  });

  const sections: Section[] = [];
  if (today.length) sections.push({ title: "Today", data: today });
  if (yesterday.length) sections.push({ title: "Yesterday", data: yesterday });
  if (thisWeek.length) sections.push({ title: "This Week", data: thisWeek });
  if (older.length) sections.push({ title: "Earlier", data: older });

  return sections;
};

/* ---------------- SCREEN ---------------- */

export default function HistoryScreen() {
  const [sections, setSections] = useState<Section[]>([]);
  const { completedWorkouts, loading } = useWorkout(); // Use WorkoutContext

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [completedWorkouts]) // Reload when completedWorkouts changes
  );

  // Convert completed workouts from WorkoutContext to StoredWorkout format
  const convertToStoredWorkouts = useCallback(() => {
    return completedWorkouts.map((workout) => ({
      id: workout.id,
      name: workout.planName || "Workout",
      type: "workout",
      duration: workout.duration || 0,
      calories: workout.caloriesBurned || 0,
      exercises: workout.exercises?.length || 0,
      completedAt: workout.endTime || new Date().toISOString(),
    }));
  }, [completedWorkouts]);

  const loadHistory = async () => {
    try {
      if (completedWorkouts.length === 0) {
        setSections([]);
        return;
      }

      const workouts = convertToStoredWorkouts();
      setSections(groupWorkouts(workouts));
    } catch (e) {
      console.error("Failed to load history", e);
      setSections([]);
    }
  };

  const calculateStats = (workouts: StoredWorkout[]) => {
    const totalWorkouts = workouts.length;
    const totalMinutes = workouts.reduce((sum, w) => sum + w.duration, 0);
    const totalCalories = workouts.reduce((sum, w) => sum + w.calories, 0);
    const uniqueDays = new Set(
      workouts.map((w) => new Date(w.completedAt).toDateString())
    );

    return {
      workouts: totalWorkouts,
      hours: Math.round(totalMinutes / 60),
      calories: totalCalories,
      streak: uniqueDays.size,
    };
  };

  const stats = useMemo(() => {
    const workouts = convertToStoredWorkouts();
    return calculateStats(workouts);
  }, [convertToStoredWorkouts]);

  const clearAll = () => {
    Alert.alert(
      "Clear History",
      "This will delete all workout history from AsyncStorage.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            // Note: Since we're using WorkoutContext, clearing AsyncStorage won't clear the context state
            // You might want to add a clear function to your WorkoutContext if needed
            setSections([]);
            Alert.alert(
              "Info",
              "Workout history is now managed by the Workout Context. To clear all data, go to Settings."
            );
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: StoredWorkout }) => (
    <View className="bg-white p-4 mx-6 mb-3 rounded-2xl border border-gray-100">
      <View className="flex-row justify-between items-start mb-2">
        <Text className="font-semibold text-lg flex-1 mr-2">{item.name}</Text>
        <Text className="text-gray-500 text-sm">
          {new Date(item.completedAt).toLocaleDateString([], {
            month: "short",
            day: "numeric",
          })}
        </Text>
      </View>

      <View className="flex-row mt-2 space-x-4">
        <View className="flex-row items-center">
          <Ionicons name="time-outline" size={16} color="#6B7280" />
          <Text className="text-gray-600 ml-1">{item.duration} min</Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="flame-outline" size={16} color="#6B7280" />
          <Text className="text-gray-600 ml-1">{item.calories} cal</Text>
        </View>
        <View className="flex-row items-center">
          <Ionicons name="barbell-outline" size={16} color="#6B7280" />
          <Text className="text-gray-600 ml-1">{item.exercises} ex</Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View className="px-6 pt-6 pb-4 bg-white border-b border-gray-200">
          <View className="flex-row justify-between items-center">
            <Text className="text-3xl font-bold">History</Text>

            {sections.length > 0 && (
              <TouchableOpacity onPress={clearAll}>
                <Ionicons name="trash-outline" size={24} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>

          {/* STATS */}
          <View className="flex-row justify-between mt-4">
            <Stat label="Workouts" value={stats.workouts} />
            <Stat label="Hours" value={`${stats.hours}h`} />
            <Stat label="Calories" value={stats.calories} />
            <Stat label="Streak" value={stats.streak} />
          </View>
        </View>

        {/* PROGRESS DASHBOARD */}
        {completedWorkouts.length > 0 && <ProgressDashboard />}

        {/* WORKOUT HISTORY LIST */}
        {sections.length > 0 ? (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            renderSectionHeader={({ section }) => (
              <View className="px-6 py-2 bg-gray-100 mt-2">
                <Text className="font-semibold text-gray-700">
                  {section.title}
                </Text>
              </View>
            )}
            scrollEnabled={false} // Since we're in a ScrollView
          />
        ) : (
          <View className="flex-1 items-center justify-center py-12">
            <Ionicons name="barbell-outline" size={48} color="#D1D5DB" />
            <Text className="text-gray-500 mt-4">No workout history yet</Text>
            <Text className="text-gray-400 text-sm mt-2">
              Complete your first workout to see history here
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* ---------------- UI ---------------- */

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <View className="items-center">
      <Text className="text-xl font-bold">{value}</Text>
      <Text className="text-gray-500 text-sm">{label}</Text>
    </View>
  );
}
