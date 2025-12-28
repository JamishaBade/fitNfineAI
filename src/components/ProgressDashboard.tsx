import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useWorkout } from "../../../fitnessApp/src/contexts/WorkoutContext";

// Types
type TimeFrame = "daily" | "weekly" | "monthly";

export type WorkoutSession = {
  id: string;
  date: string;
  duration: number; // in minutes
  difficulty: "beginner" | "intermediate" | "advanced";
  exercisesCompleted: number;
  goalsAchieved: number;
  planName: string;
  calories?: number;
  rating?: number;
};

// Mini Chart Component
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

// Main Component
export const ProgressDashboard: React.FC = () => {
  const [selectedTimeFrame, setSelectedTimeFrame] =
    useState<TimeFrame>("weekly");
  const [refreshing, setRefreshing] = useState(false);
  const { completedWorkouts, loading, refreshWorkoutData } = useWorkout();

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

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshWorkoutData();
    setRefreshing(false);
  };

  // Calculate date range
  const getDateRange = (timeFrame: TimeFrame) => {
    const now = new Date();
    const startDate = new Date();

    switch (timeFrame) {
      case "daily":
        startDate.setDate(now.getDate() - 6); // Last 7 days
        break;
      case "weekly":
        startDate.setDate(now.getDate() - 27); // Last 4 weeks
        break;
      case "monthly":
        startDate.setMonth(now.getMonth() - 5); // Last 6 months
        break;
    }

    return { startDate, endDate: now };
  };

  // Filter and aggregate data
  const chartData = useMemo(() => {
    const { startDate } = getDateRange(selectedTimeFrame);
    const filtered = workoutHistory.filter((session) => {
      try {
        return new Date(session.date) >= startDate;
      } catch (e) {
        console.error("Error filtering session:", e);
        return false;
      }
    });

    if (selectedTimeFrame === "daily") {
      const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      const data = Array(7).fill(0);
      const now = new Date();

      filtered.forEach((session) => {
        try {
          const sessionDate = new Date(session.date);
          const daysDiff = Math.floor(
            (now.getTime() - sessionDate.getTime()) / (24 * 60 * 60 * 1000)
          );
          if (daysDiff < 7 && daysDiff >= 0) {
            const dayIndex = (now.getDay() - daysDiff + 7) % 7;
            data[dayIndex] += session.duration;
          }
        } catch (e) {
          console.error("Error processing session date:", e);
        }
      });

      return Array(7)
        .fill(0)
        .map((_, index) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - index));
          const dayIndex = date.getDay();
          return {
            label: days[dayIndex].slice(0, 1),
            value: data[index] || 0,
            color: data[index] > 0 ? "#3B82F6" : "#E5E7EB",
          };
        });
    } else if (selectedTimeFrame === "weekly") {
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
    } else {
      const monthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const data = Array(6).fill(0);
      const now = new Date();

      filtered.forEach((session) => {
        try {
          const sessionDate = new Date(session.date);
          const monthDiff =
            (now.getFullYear() - sessionDate.getFullYear()) * 12 +
            (now.getMonth() - sessionDate.getMonth());
          if (monthDiff < 6 && monthDiff >= 0) {
            data[5 - monthDiff] += session.duration;
          }
        } catch (e) {
          console.error("Error processing session date:", e);
        }
      });

      const currentMonth = now.getMonth();
      return Array(6)
        .fill(0)
        .map((_, index) => {
          const monthIndex = (currentMonth - 5 + index + 12) % 12;
          return {
            label: monthNames[monthIndex],
            value: data[index],
            color: data[index] > 0 ? "#3B82F6" : "#E5E7EB",
          };
        });
    }
  }, [workoutHistory, selectedTimeFrame]);

  // Calculate stats
  const stats = useMemo(() => {
    const { startDate } = getDateRange(selectedTimeFrame);
    const filtered = workoutHistory.filter((session) => {
      try {
        return new Date(session.date) >= startDate;
      } catch (e) {
        console.error("Error filtering session:", e);
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
  }, [workoutHistory, selectedTimeFrame]);

  const maxChartValue = Math.max(...chartData.map((d) => d.value), 1);

  if (loading) {
    return (
      <View className="px-6 mt-6">
        <View
          className="bg-white rounded-3xl p-5 items-center justify-center"
          style={{ height: 300 }}
        >
          <Text className="text-gray-400">Loading progress...</Text>
        </View>
      </View>
    );
  }

  return (
    <View className="px-6 mt-6">
      <View className="bg-white rounded-3xl p-5 shadow-sm border border-gray-100">
        {/* Header */}
        <View className="flex-row justify-between items-center mb-4">
          <Text className="text-lg font-bold text-gray-900">Your Progress</Text>
          <View className="bg-blue-50 px-3 py-1 rounded-full">
            <Text className="text-blue-600 text-xs font-semibold">
              {selectedTimeFrame === "daily"
                ? "7 Days"
                : selectedTimeFrame === "weekly"
                ? "4 Weeks"
                : "6 Months"}
            </Text>
          </View>
        </View>

        {/* Time Frame Selector */}
        <View className="flex-row bg-gray-100 rounded-xl p-1 mb-4">
          {(["daily", "weekly", "monthly"] as TimeFrame[]).map((timeFrame) => (
            <TouchableOpacity
              key={timeFrame}
              onPress={() => setSelectedTimeFrame(timeFrame)}
              className={`flex-1 py-2 rounded-lg ${
                selectedTimeFrame === timeFrame ? "bg-white shadow-sm" : ""
              }`}
              activeOpacity={0.7}
            >
              <Text
                className={`text-center text-xs font-semibold ${
                  selectedTimeFrame === timeFrame
                    ? "text-blue-600"
                    : "text-gray-600"
                }`}
              >
                {timeFrame === "daily"
                  ? "Daily"
                  : timeFrame === "weekly"
                  ? "Weekly"
                  : "Monthly"}
              </Text>
            </TouchableOpacity>
          ))}
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
        {stats.totalWorkouts === 0 ? (
          <View className="items-center justify-center py-12 bg-gray-50 rounded-2xl">
            <Ionicons name="barbell-outline" size={48} color="#D1D5DB" />
            <Text className="text-gray-400 text-base font-medium mt-3">
              No workouts yet
            </Text>
            <Text className="text-gray-400 text-sm mt-1">
              Start your first workout to see your progress!
            </Text>
          </View>
        ) : (
          <>
            <View className="mb-4">
              <Text className="text-sm font-semibold text-gray-700 mb-2">
                Activity Overview (minutes)
              </Text>
              <MiniChart data={chartData} maxValue={maxChartValue} />
            </View>

            {/* Average Duration */}
            <View className="bg-blue-50 rounded-2xl p-3 mb-4">
              <View className="flex-row justify-between items-center">
                <View className="flex-row items-center">
                  <Ionicons name="timer-outline" size={20} color="#3B82F6" />
                  <Text className="text-sm text-gray-600 ml-2">
                    Average Duration
                  </Text>
                </View>
                <Text className="text-lg font-bold text-blue-600">
                  {stats.averageDuration.toFixed(0)} min
                </Text>
              </View>
            </View>

            {/* Difficulty Breakdown */}
            <View className="pt-4 border-t border-gray-100">
              <Text className="text-sm font-semibold text-gray-700 mb-3">
                Difficulty Distribution
              </Text>
              <View style={{ gap: 8 }}>
                {/* Beginner */}
                <View>
                  <View className="flex-row justify-between mb-1">
                    <View className="flex-row items-center">
                      <View className="w-3 h-3 rounded-full bg-green-500 mr-2" />
                      <Text className="text-xs text-gray-600">Beginner</Text>
                    </View>
                    <Text className="text-xs font-semibold text-gray-700">
                      {stats.difficultyBreakdown.beginner} workouts
                    </Text>
                  </View>
                  <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <View
                      className="h-2 bg-green-500 rounded-full"
                      style={{
                        width: `${
                          stats.totalWorkouts > 0
                            ? (stats.difficultyBreakdown.beginner /
                                stats.totalWorkouts) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </View>
                </View>

                {/* Intermediate */}
                <View>
                  <View className="flex-row justify-between mb-1">
                    <View className="flex-row items-center">
                      <View className="w-3 h-3 rounded-full bg-yellow-500 mr-2" />
                      <Text className="text-xs text-gray-600">
                        Intermediate
                      </Text>
                    </View>
                    <Text className="text-xs font-semibold text-gray-700">
                      {stats.difficultyBreakdown.intermediate} workouts
                    </Text>
                  </View>
                  <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <View
                      className="h-2 bg-yellow-500 rounded-full"
                      style={{
                        width: `${
                          stats.totalWorkouts > 0
                            ? (stats.difficultyBreakdown.intermediate /
                                stats.totalWorkouts) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </View>
                </View>

                {/* Advanced */}
                <View>
                  <View className="flex-row justify-between mb-1">
                    <View className="flex-row items-center">
                      <View className="w-3 h-3 rounded-full bg-red-500 mr-2" />
                      <Text className="text-xs text-gray-600">Advanced</Text>
                    </View>
                    <Text className="text-xs font-semibold text-gray-700">
                      {stats.difficultyBreakdown.advanced} workouts
                    </Text>
                  </View>
                  <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <View
                      className="h-2 bg-red-500 rounded-full"
                      style={{
                        width: `${
                          stats.totalWorkouts > 0
                            ? (stats.difficultyBreakdown.advanced /
                                stats.totalWorkouts) *
                              100
                            : 0
                        }%`,
                      }}
                    />
                  </View>
                </View>
              </View>
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
    </View>
  );
};
