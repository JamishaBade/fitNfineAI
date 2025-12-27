import React, { useCallback, useMemo } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutPlan } from "../../../fitnessApp/src/types/workout";

interface WorkoutCardProps {
  workout: WorkoutPlan;
  onStart: () => void;
  onToggleFavorite: () => void;
  onViewDetails: () => void;
}

export const WorkoutCard: React.FC<WorkoutCardProps> = React.memo(
  ({ workout, onStart, onToggleFavorite, onViewDetails }) => {
    const getDifficultyColor = useCallback((difficulty: string) => {
      switch (difficulty.toLowerCase()) {
        case "beginner":
          return { bg: "bg-green-100", text: "text-green-700" };
        case "intermediate":
          return { bg: "bg-yellow-100", text: "text-yellow-700" };
        case "advanced":
          return { bg: "bg-red-100", text: "text-red-700" };
        default:
          return { bg: "bg-gray-100", text: "text-gray-700" };
      }
    }, []);

    const getCategoryIcon = useCallback(
      (category: string): keyof typeof Ionicons.glyphMap => {
        switch (category.toLowerCase()) {
          case "strength":
            return "barbell";
          case "cardio":
            return "heart";
          case "hiit":
            return "flash";
          case "yoga":
            return "body";
          case "flexibility":
            return "body-outline";
          case "recovery":
            return "medkit-outline";
          default:
            return "fitness";
        }
      },
      []
    );

    const { totalSets, totalExercises } = useMemo(
      () => ({
        totalSets: workout.exercises.reduce((sum, ex) => sum + ex.sets, 0),
        totalExercises: workout.exercises.length,
      }),
      [workout.exercises]
    );

    const difficultyColors = getDifficultyColor(workout.difficulty);
    const categoryIcon = getCategoryIcon(workout.category);

    const handleStartPress = useCallback(
      (e: any) => {
        e.stopPropagation();
        onStart();
      },
      [onStart]
    );

    const handleToggleFavorite = useCallback(
      (e: any) => {
        e.stopPropagation();
        onToggleFavorite();
      },
      [onToggleFavorite]
    );

    const handleViewDetails = useCallback(
      (e: any) => {
        e.stopPropagation();
        onViewDetails();
      },
      [onViewDetails]
    );

    return (
      <View className="bg-white rounded-2xl p-5 mb-4 shadow-sm border border-gray-100">
        {/* Header with favorite button */}
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1">
            <View className="flex-row items-center justify-between">
              <Text
                className="text-xl font-bold text-gray-900 flex-1 mr-3"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {workout.name}
              </Text>
              <TouchableOpacity
                onPress={handleToggleFavorite}
                className="p-1"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons
                  name={workout.isFavorite ? "heart" : "heart-outline"}
                  size={24}
                  color={workout.isFavorite ? "#EF4444" : "#9CA3AF"}
                />
              </TouchableOpacity>
            </View>
            {workout.description ? (
              <Text
                className="text-gray-500 mt-1"
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {workout.description}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Difficulty, duration, and calories */}
        <View className="flex-row items-center mb-3 flex-wrap">
          <View
            className={`px-3 py-1 rounded-full ${difficultyColors.bg} mr-2 mb-1`}
          >
            <Text
              className={`text-sm font-medium ${difficultyColors.text} capitalize`}
            >
              {workout.difficulty}
            </Text>
          </View>

          <View className="flex-row items-center mr-3 mb-1">
            <Ionicons name="time-outline" size={16} color="#6B7280" />
            <Text className="text-gray-600 ml-1">{workout.duration} min</Text>
          </View>

          {workout.calories ? (
            <View className="flex-row items-center mr-3 mb-1">
              <Ionicons name="flame-outline" size={16} color="#6B7280" />
              <Text className="text-gray-600 ml-1">{workout.calories} cal</Text>
            </View>
          ) : null}
        </View>

        {/* Category and custom badge */}
        <View className="flex-row items-center justify-between mb-3 flex-wrap">
          <View className="flex-row items-center flex-1 mr-2">
            <Ionicons name={categoryIcon} size={16} color="#3B82F6" />
            <Text
              className="text-gray-600 ml-2 capitalize flex-shrink"
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {workout.category} • {totalExercises}{" "}
              {totalExercises === 1 ? "exercise" : "exercises"} • {totalSets}{" "}
              sets
            </Text>
          </View>

          {workout.createdBy === "user" && (
            <View className="bg-blue-50 px-2 py-1 rounded-full flex-shrink-0 mt-1">
              <Text className="text-blue-600 text-xs font-medium">Custom</Text>
            </View>
          )}
        </View>

        {/* Tags */}
        {workout.tags && workout.tags.length > 0 ? (
          <View className="flex-row flex-wrap gap-2 mb-4">
            {workout.tags.slice(0, 3).map((tag, index) => (
              <View
                key={`${tag}-${index}`}
                className="bg-gray-100 px-3 py-1.5 rounded-full"
              >
                <Text className="text-gray-700 text-xs">{tag}</Text>
              </View>
            ))}
            {workout.tags.length > 3 && (
              <View className="bg-gray-100 px-3 py-1.5 rounded-full">
                <Text className="text-gray-700 text-xs">
                  +{workout.tags.length - 3}
                </Text>
              </View>
            )}
          </View>
        ) : null}

        {/* Action buttons */}
        <View className="flex-row space-x-3">
          <TouchableOpacity
            className="flex-1 bg-blue-600 rounded-xl py-3 items-center active:opacity-90"
            onPress={handleStartPress}
            activeOpacity={0.7}
          >
            <Text className="text-white font-semibold">Start Workout</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="w-12 bg-gray-100 rounded-xl items-center justify-center active:opacity-90"
            onPress={handleViewDetails}
            activeOpacity={0.7}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="ellipsis-horizontal" size={20} color="#4B5563" />
          </TouchableOpacity>
        </View>
      </View>
    );
  }
);

WorkoutCard.displayName = "WorkoutCard";
