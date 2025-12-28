// src/app/(app)/(tabs)/workout.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutCard } from "../../../components/WorkoutCard";
import { ActiveWorkoutTimer } from "../../../components/ActiveWorkoutTimer";
import { useWorkout } from "../../../contexts/WorkoutContext";

// Simplified exercise database
const EXERCISE_DATABASE = [
  {
    name: "Push-ups",
    category: "strength",
    type: "reps",
    sets: 3,
    reps: 12,
    rest: 60,
  },
  {
    name: "Squats",
    category: "strength",
    type: "reps",
    sets: 3,
    reps: 15,
    rest: 60,
  },
  {
    name: "Plank",
    category: "strength",
    type: "duration",
    sets: 3,
    duration: 30,
    rest: 30,
  },
  {
    name: "Running",
    category: "cardio",
    type: "duration",
    sets: 1,
    duration: 600,
    rest: 0,
  },
  {
    name: "Jumping Jacks",
    category: "cardio",
    type: "reps",
    sets: 3,
    reps: 30,
    rest: 30,
  },
  {
    name: "Burpees",
    category: "cardio",
    type: "reps",
    sets: 3,
    reps: 10,
    rest: 45,
  },
  {
    name: "Downward Dog",
    category: "yoga",
    type: "duration",
    sets: 3,
    duration: 30,
    rest: 15,
  },
];

export default function WorkoutScreen() {
  console.log("🎯 WorkoutScreen rendering...");

  const {
    workoutPlans,
    activeWorkout,
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
    deleteCustomWorkout,
    refreshWorkoutData,
  } = useWorkout();

  console.log("📊 Workout data:", {
    workoutPlansCount: workoutPlans?.length,
    loading,
    stats: !!stats,
  });

  const [activeWorkoutModal, setActiveWorkoutModal] = useState(false);
  const [workoutCompleteModal, setWorkoutCompleteModal] = useState(false);
  const [createWorkoutModal, setCreateWorkoutModal] = useState(false);
  const [workoutDetailsModal, setWorkoutDetailsModal] = useState(false);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const [selectedWorkout, setSelectedWorkout] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [workoutToDelete, setWorkoutToDelete] = useState<any>(null);

  const [newWorkout, setNewWorkout] = useState({
    name: "",
    description: "",
    duration: "30",
    difficulty: "beginner",
    category: "strength",
  });

  const [selectedExercises, setSelectedExercises] = useState<any[]>([]);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [exerciseFilter, setExerciseFilter] = useState("all");

  const [completionData, setCompletionData] = useState({
    rating: 0,
    notes: "",
    feel: "good",
    difficulty: "medium",
  });

  const categories = ["all", "strength", "cardio", "yoga", "custom"];
  const difficultyLevels = ["beginner", "intermediate", "advanced"];
  const feelOptions = [
    { value: "great", label: "Great", icon: "happy" },
    { value: "good", label: "Good", icon: "happy-outline" },
    { value: "okay", label: "Okay", icon: "remove-circle-outline" },
    { value: "tired", label: "Tired", icon: "sad-outline" },
  ];
  const openExerciseSelector = () => {
    setCreateWorkoutModal(false);
    setShowExerciseSelector(true);
  };

  const closeExerciseSelector = () => {
    setShowExerciseSelector(false);
    setCreateWorkoutModal(true);
  };

  useEffect(() => {
    if (workoutCompleteModal) {
      setCompletionData({
        rating: 0,
        notes: "",
        feel: "good",
        difficulty: "medium",
      });
    }
  }, [workoutCompleteModal]);

  const filteredWorkouts = useMemo(() => {
    if (!workoutPlans) return [];

    return workoutPlans.filter((workout) => {
      if (selectedCategory === "all") return true;
      if (selectedCategory === "custom") return workout.createdBy === "user";
      return workout.category === selectedCategory;
    });
  }, [workoutPlans, selectedCategory]);

  // Filter exercises based on selected category
  const filteredExercises = useMemo(() => {
    if (exerciseFilter === "all") {
      return EXERCISE_DATABASE;
    }
    return EXERCISE_DATABASE.filter((ex) => ex.category === exerciseFilter);
  }, [exerciseFilter]);

  const handleStartWorkout = async (workout: any) => {
    console.log("🏃 Starting workout:", workout.name);
    try {
      await startWorkout(workout);
      setActiveWorkoutModal(true);
    } catch (error) {
      console.error("Start workout error:", error);
      Alert.alert("Error", "Failed to start workout. Please try again.");
    }
  };

  const handleOpenCompleteModal = () => {
    if (!activeWorkout) {
      Alert.alert("Error", "No active workout found");
      return;
    }

    // Pause workout if active
    if (activeWorkout.status === "active") {
      pauseWorkout();
    }

    // Close the active workout modal first
    setActiveWorkoutModal(false);

    // Use a small delay to ensure the first modal closes completely
    setTimeout(() => {
      setWorkoutCompleteModal(true);
    }, 300);
  };

  const handleCompleteWorkout = async () => {
    console.log("✅ Completing workout...");

    if (!activeWorkout) {
      Alert.alert("Error", "No active workout to complete");
      return;
    }

    // Require at least 1 star rating
    if (completionData.rating === 0) {
      Alert.alert(
        "Rating Required",
        "Please give your workout a star rating!",
        [{ text: "OK" }]
      );
      return;
    }

    setIsCompleting(true);

    try {
      // Call the completeWorkout function
      await completeWorkout(completionData);

      // Close modals
      setWorkoutCompleteModal(false);
      setActiveWorkoutModal(false);

      // Show success message
      Alert.alert("Awesome! 🎉", "Workout completed successfully!");

      // Refresh data if needed
      if (refreshWorkoutData) {
        refreshWorkoutData();
      }
    } catch (error: any) {
      console.error("❌ Error completing workout:", error);
      Alert.alert(
        "Oops!",
        error.message || "Failed to save workout completion"
      );
    } finally {
      setIsCompleting(false);
    }
  };

  const handleCancelWorkout = () => {
    Alert.alert("Cancel Workout", "Are you sure? Your progress will be lost.", [
      { text: "Keep Going", style: "cancel" },
      {
        text: "Cancel Workout",
        style: "destructive",
        onPress: async () => {
          try {
            await cancelWorkout();
            setActiveWorkoutModal(false);
            setWorkoutCompleteModal(false);
          } catch (error) {
            console.error("Cancel workout error:", error);
          }
        },
      },
    ]);
  };

  const handleCreateWorkout = async () => {
    console.log("🛠️ Creating custom workout...");

    if (!newWorkout.name.trim()) {
      Alert.alert("Error", "Workout name is required");
      return;
    }

    const duration = parseInt(newWorkout.duration);
    if (isNaN(duration) || duration < 5 || duration > 180) {
      Alert.alert("Error", "Duration must be between 5 and 180 minutes");
      return;
    }

    if (selectedExercises.length === 0) {
      Alert.alert("Error", "Please add at least one exercise to your workout");
      return;
    }

    try {
      // Create the workout object with all required fields
      const workoutData = {
        id: `custom_${Date.now()}`,
        name: newWorkout.name,
        description: newWorkout.description,
        duration: duration,
        difficulty: newWorkout.difficulty,
        category: newWorkout.category,
        calories: Math.round(duration * 7),
        exercises: selectedExercises.map((exercise) => ({
          id: `ex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name: exercise.name,
          sets: exercise.sets || 3,
          reps: exercise.type === "reps" ? exercise.reps || 10 : undefined,
          duration:
            exercise.type === "duration" ? exercise.duration || 30 : undefined,
          rest: exercise.rest || 30,
        })),
        createdBy: "user",
        isFavorite: false,
        image:
          "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400", // Default image
        targetMuscles: ["Full Body"], // Default
        equipment: ["Bodyweight"], // Default
      };

      console.log("📦 Sending workout data:", workoutData);

      await createCustomWorkout(workoutData);

      // Reset form
      setNewWorkout({
        name: "",
        description: "",
        duration: "30",
        difficulty: "beginner",
        category: "strength",
      });
      setSelectedExercises([]);
      setCreateWorkoutModal(false);

      // Refresh the workout list
      if (refreshWorkoutData) {
        await refreshWorkoutData();
      }

      Alert.alert("Success! 🎉", "Your custom workout has been created!");
    } catch (error: any) {
      console.error("❌ Create workout error:", error);
      Alert.alert(
        "Error",
        error.message || "Failed to create workout. Please try again."
      );
    }
  };

  const handleDeleteWorkout = async () => {
    if (!workoutToDelete) return;

    try {
      await deleteCustomWorkout(workoutToDelete.id);

      setDeleteConfirmModal(false);
      setWorkoutDetailsModal(false);

      if (refreshWorkoutData) await refreshWorkoutData();

      Alert.alert("Success", "Workout deleted successfully!");
    } catch (error) {
      console.error("Delete workout error:", error);
      Alert.alert("Error", "Failed to delete workout. Please try again.");
    }
  };

  const addExercise = (exercise: any) => {
    // Create a copy of the exercise with a unique ID
    const newExercise = {
      ...exercise,
      id: `ex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    };
    setSelectedExercises([...selectedExercises, newExercise]);
  };

  const removeExercise = (index: number) => {
    const updatedExercises = [...selectedExercises];
    updatedExercises.splice(index, 1);
    setSelectedExercises(updatedExercises);
  };

  const updateExercise = (index: number, field: string, value: any) => {
    const updatedExercises = [...selectedExercises];
    updatedExercises[index] = {
      ...updatedExercises[index],
      [field]: value,
    };
    setSelectedExercises(updatedExercises);
  };

  if (loading && workoutPlans?.length === 0) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Loading workouts...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* HEADER */}
        <View className="px-6 pt-6 pb-4 bg-white">
          <View className="flex-row justify-between items-center">
            <View>
              <Text className="text-3xl font-bold">Workouts</Text>
              <Text className="text-gray-500">
                {stats
                  ? `${stats.totalWorkouts} workouts completed`
                  : "Choose a workout"}
              </Text>
            </View>
            <TouchableOpacity
              className="bg-gray-100 p-3 rounded-2xl"
              onPress={() => setCreateWorkoutModal(true)}
              activeOpacity={0.6}
            >
              <Ionicons name="add" size={24} color="#374151" />
            </TouchableOpacity>
          </View>

          {stats && (
            <View className="flex-row justify-between mt-4">
              <Stat label="Total" value={stats.totalWorkouts} />
              <Stat label="This Week" value={stats.thisWeekWorkouts} />
              <Stat label="Hours" value={`${stats.totalHours}h`} />
              <Stat label="Rating" value={stats.averageRating.toFixed(1)} />
            </View>
          )}

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-4"
          >
            <View className="flex-row gap-2">
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-full ${
                    selectedCategory === cat ? "bg-blue-600" : "bg-gray-100"
                  }`}
                  activeOpacity={0.6}
                >
                  <Text
                    className={`capitalize ${
                      selectedCategory === cat ? "text-white" : "text-gray-700"
                    }`}
                  >
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* WORKOUT LIST */}
        <View className="px-6 mt-6 pb-6">
          {filteredWorkouts && filteredWorkouts.length > 0 ? (
            filteredWorkouts.map((workout) => (
              <WorkoutCard
                key={workout.id}
                workout={workout}
                onStart={() => handleStartWorkout(workout)}
                onToggleFavorite={() => toggleFavorite(workout.id)}
                onViewDetails={() => {
                  setSelectedWorkout(workout);
                  setWorkoutDetailsModal(true);
                }}
                onDelete={
                  workout.createdBy === "user"
                    ? () => {
                        setWorkoutToDelete(workout);
                        setDeleteConfirmModal(true);
                      }
                    : undefined
                }
              />
            ))
          ) : (
            <View className="items-center justify-center py-12">
              <Ionicons name="barbell-outline" size={64} color="#D1D5DB" />
              <Text className="text-gray-400 mt-4">No workouts found</Text>
              <Text className="text-gray-400 text-sm mt-2">
                Tap the + button to create your first workout
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ACTIVE WORKOUT MODAL */}
      <Modal
        visible={activeWorkoutModal}
        transparent
        animationType="slide"
        onRequestClose={handleCancelWorkout}
      >
        <View className="flex-1 bg-black/50">
          <View className="flex-1 mt-20 bg-white rounded-t-3xl">
            {activeWorkout && (
              <>
                <View className="p-6 border-b border-gray-200">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-2xl font-bold">
                      {activeWorkout.planName}
                    </Text>
                    <TouchableOpacity
                      onPress={handleCancelWorkout}
                      activeOpacity={0.6}
                    >
                      <Ionicons name="close" size={28} color="#374151" />
                    </TouchableOpacity>
                  </View>
                </View>

                <ScrollView
                  className="p-6"
                  showsVerticalScrollIndicator={false}
                >
                  <ActiveWorkoutTimer
                    time={timer}
                    isResting={isResting}
                    currentExercise={
                      activeWorkout.exercises[
                        activeWorkout.currentExerciseIndex
                      ]?.name
                    }
                    currentSet={activeWorkout.currentSet}
                    totalSets={
                      activeWorkout.exercises[
                        activeWorkout.currentExerciseIndex
                      ]?.sets
                    }
                    isPaused={activeWorkout.status === "paused"}
                    onPause={pauseWorkout}
                    onResume={resumeWorkout}
                    onSkipRest={skipRest}
                    onCompleteSet={completeSet}
                    onCancel={handleCancelWorkout}
                  />

                  {/* Complete Workout Button */}
                  <TouchableOpacity
                    className="bg-green-600 rounded-xl py-4 mt-8 mb-4"
                    onPress={handleOpenCompleteModal}
                    activeOpacity={0.6}
                  >
                    <Text className="text-white text-center font-bold text-lg">
                      Complete Workout
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* WORKOUT COMPLETE MODAL - FIXED & ADDED BACK */}
      <Modal
        visible={workoutCompleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setWorkoutCompleteModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-6">
          <View className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[80%]">
            <ScrollView showsVerticalScrollIndicator={false}>
              <View className="items-center mb-6">
                <View className="bg-green-100 w-20 h-20 rounded-full items-center justify-center mb-4">
                  <Ionicons name="trophy" size={40} color="#10B981" />
                </View>
                <Text className="text-2xl font-bold text-gray-800 mb-2">
                  Workout Complete!
                </Text>
                <Text className="text-gray-600 text-center">
                  Great job! How was your workout?
                </Text>
              </View>

              {/* Star Rating */}
              <View className="mb-6">
                <Text className="text-lg font-semibold text-gray-700 mb-3 text-center">
                  Rate your workout
                </Text>
                <View className="flex-row justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity
                      key={star}
                      onPress={() =>
                        setCompletionData({ ...completionData, rating: star })
                      }
                      activeOpacity={0.6}
                    >
                      <Ionicons
                        name={
                          star <= completionData.rating
                            ? "star"
                            : "star-outline"
                        }
                        size={36}
                        color={
                          star <= completionData.rating ? "#FBBF24" : "#D1D5DB"
                        }
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* How did you feel? */}
              <View className="mb-6">
                <Text className="text-lg font-semibold text-gray-700 mb-3">
                  How did you feel?
                </Text>
                <View className="flex-row justify-between">
                  {feelOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() =>
                        setCompletionData({
                          ...completionData,
                          feel: option.value,
                        })
                      }
                      className={`items-center p-3 rounded-xl ${
                        completionData.feel === option.value
                          ? "bg-blue-50 border-2 border-blue-200"
                          : "bg-gray-50"
                      }`}
                      activeOpacity={0.6}
                    >
                      <Ionicons
                        name={option.icon as any}
                        size={28}
                        color={
                          completionData.feel === option.value
                            ? "#3B82F6"
                            : "#6B7280"
                        }
                      />
                      <Text
                        className={`mt-2 ${
                          completionData.feel === option.value
                            ? "text-blue-600 font-medium"
                            : "text-gray-600"
                        }`}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Difficulty Level */}
              <View className="mb-6">
                <Text className="text-lg font-semibold text-gray-700 mb-3">
                  Difficulty Level
                </Text>
                <View className="flex-row gap-3">
                  {["easy", "medium", "hard"].map((level) => (
                    <TouchableOpacity
                      key={level}
                      onPress={() =>
                        setCompletionData({
                          ...completionData,
                          difficulty: level,
                        })
                      }
                      className={`flex-1 py-3 rounded-xl border-2 ${
                        completionData.difficulty === level
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 bg-white"
                      }`}
                      activeOpacity={0.6}
                    >
                      <Text
                        className={`text-center capitalize ${
                          completionData.difficulty === level
                            ? "text-blue-600 font-semibold"
                            : "text-gray-500"
                        }`}
                      >
                        {level}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Notes */}
              <View className="mb-6">
                <Text className="text-lg font-semibold text-gray-700 mb-3">
                  Notes (optional)
                </Text>
                <TextInput
                  placeholder="Any notes about your workout..."
                  className="border border-gray-200 rounded-xl p-3 min-h-[100px]"
                  value={completionData.notes}
                  onChangeText={(text) =>
                    setCompletionData({ ...completionData, notes: text })
                  }
                  multiline
                  textAlignVertical="top"
                />
              </View>

              {/* Action Buttons */}
              <View className="flex-row gap-3 mt-4">
                <TouchableOpacity
                  className="flex-1 bg-gray-100 py-3 rounded-xl"
                  onPress={() => {
                    setWorkoutCompleteModal(false);
                    if (activeWorkout?.status === "paused") {
                      resumeWorkout();
                    }
                  }}
                  activeOpacity={0.6}
                >
                  <Text className="text-gray-700 text-center font-semibold">
                    Back
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="flex-1 bg-green-600 py-3 rounded-xl"
                  onPress={handleCompleteWorkout}
                  disabled={isCompleting}
                  activeOpacity={0.6}
                >
                  {isCompleting ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text className="text-white text-center font-semibold">
                      Save & Complete
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* CREATE WORKOUT MODAL - FIXED (Single instance) */}
      <Modal
        visible={createWorkoutModal}
        transparent
        animationType="slide"
        presentationStyle="overFullScreen"
        statusBarTranslucent
        onRequestClose={() => setCreateWorkoutModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View
              className="bg-white rounded-t-3xl p-6"
              style={{ maxHeight: "90%", minHeight: "50%" }}
            >
              {/* Header */}
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-2xl font-bold">Create Workout</Text>
                <TouchableOpacity
                  onPress={() => {
                    setCreateWorkoutModal(false);
                    setSelectedExercises([]);
                  }}
                >
                  <Ionicons name="close" size={28} color="#374151" />
                </TouchableOpacity>
              </View>

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ paddingBottom: 40 }}
              >
                {/* Workout Name */}
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Workout Name *
                  </Text>
                  <View className="border border-gray-200 rounded-xl p-3">
                    <TextInput
                      placeholder="e.g. Morning Cardio"
                      value={newWorkout.name}
                      onChangeText={(t) =>
                        setNewWorkout({ ...newWorkout, name: t })
                      }
                      style={{ fontSize: 16 }}
                    />
                  </View>
                </View>

                {/* Description */}
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Description
                  </Text>
                  <View className="border border-gray-200 rounded-xl p-3">
                    <TextInput
                      placeholder="Optional"
                      value={newWorkout.description}
                      onChangeText={(t) =>
                        setNewWorkout({ ...newWorkout, description: t })
                      }
                      multiline
                      textAlignVertical="top"
                      style={{ minHeight: 80, fontSize: 16 }}
                    />
                  </View>
                </View>

                {/* Exercises */}
                <View className="mb-6">
                  <View className="flex-row justify-between items-center mb-2">
                    <Text className="text-sm font-medium text-gray-700">
                      Exercises ({selectedExercises.length})
                    </Text>

                    <TouchableOpacity
                      onPress={openExerciseSelector}
                      className="flex-row items-center bg-blue-100 px-3 py-2 rounded-full"
                    >
                      <Ionicons name="add" size={16} color="#2563EB" />
                      <Text className="text-blue-600 ml-1 font-medium">
                        Add Exercise
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {selectedExercises.length === 0 ? (
                    <View className="border border-gray-200 rounded-xl p-8 items-center">
                      <Ionicons
                        name="barbell-outline"
                        size={40}
                        color="#9CA3AF"
                      />
                      <Text className="text-gray-400 mt-2">
                        No exercises added
                      </Text>
                    </View>
                  ) : (
                    selectedExercises.map((exercise, index) => (
                      <View
                        key={`${exercise.name}-${index}`}
                        className="border border-gray-200 rounded-xl p-3 mb-3 bg-gray-50"
                      >
                        <View className="flex-row justify-between items-center">
                          <Text className="font-semibold text-gray-800">
                            {exercise.name}
                          </Text>
                          <TouchableOpacity
                            onPress={() => removeExercise(index)}
                          >
                            <Ionicons
                              name="close-circle"
                              size={20}
                              color="#EF4444"
                            />
                          </TouchableOpacity>
                        </View>
                      </View>
                    ))
                  )}
                </View>

                {/* Create Button */}
                <TouchableOpacity
                  disabled={selectedExercises.length === 0}
                  onPress={handleCreateWorkout}
                  className={`py-4 rounded-xl ${
                    selectedExercises.length === 0
                      ? "bg-gray-300"
                      : "bg-blue-600"
                  }`}
                >
                  <Text className="text-white text-center font-bold text-lg">
                    Create Workout
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* EXERCISE SELECTOR MODAL - FIXED */}
      <Modal
        visible={showExerciseSelector}
        transparent
        animationType="slide"
        onRequestClose={() => setShowExerciseSelector(false)}
      >
        <View className="flex-1 bg-black/50">
          <View className="flex-1 mt-20">
            <View className="flex-1 bg-white rounded-t-3xl">
              <View className="p-6 border-b border-gray-200">
                <View className="flex-row justify-between items-center mb-4">
                  <Text className="text-2xl font-bold">Add Exercises</Text>
                  <TouchableOpacity
                    onPress={() => setShowExerciseSelector(false)}
                    activeOpacity={0.6}
                  >
                    <Ionicons name="close" size={28} color="#374151" />
                  </TouchableOpacity>
                </View>

                {/* Exercise Category Filter */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  className="mb-4"
                >
                  <View className="flex-row gap-2">
                    {["all", "strength", "cardio", "yoga"].map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        onPress={() => setExerciseFilter(cat)}
                        className={`px-4 py-2 rounded-full ${
                          exerciseFilter === cat ? "bg-blue-600" : "bg-gray-100"
                        }`}
                        activeOpacity={0.6}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        <Text
                          className={`capitalize ${
                            exerciseFilter === cat
                              ? "text-white"
                              : "text-gray-700"
                          }`}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ padding: 24 }}
              >
                {filteredExercises.map((exercise, index) => {
                  const isAlreadyAdded = selectedExercises.some(
                    (ex) => ex.name === exercise.name
                  );

                  return (
                    <TouchableOpacity
                      key={`${exercise.name}-${index}`}
                      onPress={() => {
                        if (!isAlreadyAdded) {
                          addExercise(exercise);
                        }
                      }}
                      className={`border rounded-xl p-4 mb-3 ${
                        isAlreadyAdded
                          ? "bg-green-50 border-green-200"
                          : "bg-white border-gray-200"
                      }`}
                      activeOpacity={0.6}
                      disabled={isAlreadyAdded}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    >
                      <View className="flex-row justify-between items-start">
                        <View className="flex-1">
                          <Text
                            className={`font-semibold text-base mb-1 ${
                              isAlreadyAdded
                                ? "text-green-700"
                                : "text-gray-800"
                            }`}
                          >
                            {exercise.name}
                            {isAlreadyAdded && (
                              <Text className="text-green-600 text-sm ml-2">
                                ✓ Added
                              </Text>
                            )}
                          </Text>
                          <View className="flex-row items-center gap-4">
                            <Text
                              className={`text-sm ${
                                isAlreadyAdded
                                  ? "text-green-600"
                                  : "text-gray-600"
                              }`}
                            >
                              {exercise.sets} sets
                            </Text>
                            {exercise.type === "reps" ? (
                              <Text
                                className={`text-sm ${
                                  isAlreadyAdded
                                    ? "text-green-600"
                                    : "text-gray-600"
                                }`}
                              >
                                {exercise.reps} reps
                              </Text>
                            ) : (
                              <Text
                                className={`text-sm ${
                                  isAlreadyAdded
                                    ? "text-green-600"
                                    : "text-gray-600"
                                }`}
                              >
                                {exercise.duration}s
                              </Text>
                            )}
                            <Text
                              className={`text-sm ${
                                isAlreadyAdded
                                  ? "text-green-600"
                                  : "text-gray-600"
                              }`}
                            >
                              {exercise.rest}s rest
                            </Text>
                          </View>
                        </View>
                        {!isAlreadyAdded && (
                          <TouchableOpacity
                            onPress={() => addExercise(exercise)}
                            className="ml-2"
                            activeOpacity={0.6}
                            hitSlop={{
                              top: 10,
                              bottom: 10,
                              left: 10,
                              right: 10,
                            }}
                          >
                            <Ionicons
                              name="add-circle"
                              size={24}
                              color="#10B981"
                            />
                          </TouchableOpacity>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          </View>
        </View>
      </Modal>

      {/* WORKOUT DETAILS MODAL */}
      <Modal
        visible={workoutDetailsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setWorkoutDetailsModal(false)}
      >
        <View className="flex-1 bg-black/50">
          <View className="flex-1 mt-20 bg-white rounded-t-3xl">
            {selectedWorkout && (
              <>
                <View className="p-6 border-b border-gray-200">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-2xl font-bold">
                      {selectedWorkout.name}
                    </Text>
                    <TouchableOpacity
                      onPress={() => setWorkoutDetailsModal(false)}
                      activeOpacity={0.6}
                    >
                      <Ionicons name="close" size={28} color="#374151" />
                    </TouchableOpacity>
                  </View>
                </View>

                <ScrollView
                  className="p-6"
                  showsVerticalScrollIndicator={false}
                >
                  {/* Workout Info */}
                  <View className="bg-gray-50 rounded-2xl p-4 mb-6">
                    <View className="flex-row justify-between mb-4">
                      <Info
                        label="Duration"
                        value={`${selectedWorkout.duration} min`}
                      />
                      <Info label="Calories" value={selectedWorkout.calories} />
                      <Info
                        label="Difficulty"
                        value={
                          selectedWorkout.difficulty?.charAt(0).toUpperCase() +
                          selectedWorkout.difficulty?.slice(1)
                        }
                      />
                    </View>
                    <View className="border-t border-gray-200 pt-4">
                      <Text className="text-gray-600">
                        {selectedWorkout.description ||
                          "No description available"}
                      </Text>
                    </View>
                  </View>

                  {/* Exercises */}
                  {selectedWorkout.exercises &&
                    selectedWorkout.exercises.length > 0 && (
                      <View className="mb-6">
                        <Text className="text-lg font-bold mb-3">
                          Exercises
                        </Text>
                        {selectedWorkout.exercises.map(
                          (exercise: any, index: number) => (
                            <View
                              key={index}
                              className="bg-white border border-gray-200 rounded-xl p-4 mb-3"
                            >
                              <Text className="font-semibold text-base mb-2">
                                {exercise.name}
                              </Text>
                              <View className="flex-row gap-4">
                                <Text className="text-gray-600">
                                  {exercise.sets} sets
                                </Text>
                                {exercise.reps && (
                                  <Text className="text-gray-600">
                                    {exercise.reps} reps
                                  </Text>
                                )}
                                {exercise.duration && (
                                  <Text className="text-gray-600">
                                    {exercise.duration}s
                                  </Text>
                                )}
                                {exercise.rest && (
                                  <Text className="text-gray-600">
                                    {exercise.rest}s rest
                                  </Text>
                                )}
                              </View>
                            </View>
                          )
                        )}
                      </View>
                    )}

                  {/* Action Buttons */}
                  <View className="space-y-3">
                    {/* Start Workout Button */}
                    <TouchableOpacity
                      className="bg-blue-600 py-4 rounded-xl"
                      onPress={() => {
                        setWorkoutDetailsModal(false);
                        setTimeout(() => {
                          handleStartWorkout(selectedWorkout);
                        }, 300);
                      }}
                      activeOpacity={0.6}
                    >
                      <Text className="text-white text-center font-bold text-lg">
                        Start Workout
                      </Text>
                    </TouchableOpacity>

                    {/* Toggle Favorite */}
                    <TouchableOpacity
                      className="border-2 border-gray-200 py-4 rounded-xl flex-row items-center justify-center"
                      onPress={() => {
                        toggleFavorite(selectedWorkout.id);
                        setWorkoutDetailsModal(false);
                      }}
                      activeOpacity={0.6}
                    >
                      <Ionicons
                        name={
                          selectedWorkout.isFavorite ? "heart" : "heart-outline"
                        }
                        size={20}
                        color={
                          selectedWorkout.isFavorite ? "#EF4444" : "#6B7280"
                        }
                      />
                      <Text className="text-gray-700 font-semibold ml-2">
                        {selectedWorkout.isFavorite
                          ? "Remove from Favorites"
                          : "Add to Favorites"}
                      </Text>
                    </TouchableOpacity>

                    {/* Delete Button (only for custom workouts) */}
                    {selectedWorkout.createdBy === "user" && (
                      <TouchableOpacity
                        className="border-2 border-red-200 bg-red-50 py-4 rounded-xl flex-row items-center justify-center"
                        onPress={() => {
                          setWorkoutToDelete(selectedWorkout);
                          setDeleteConfirmModal(true);
                        }}
                        activeOpacity={0.6}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={20}
                          color="#EF4444"
                        />
                        <Text className="text-red-600 font-semibold ml-2">
                          Delete Workout
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal
        visible={deleteConfirmModal}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteConfirmModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-6">
          <View className="bg-white rounded-2xl p-6 w-full max-w-md">
            <View className="items-center mb-6">
              <View className="bg-red-100 w-16 h-16 rounded-full items-center justify-center mb-4">
                <Ionicons name="warning" size={32} color="#EF4444" />
              </View>
              <Text className="text-xl font-bold text-gray-800 mb-2">
                Delete Workout
              </Text>
              <Text className="text-gray-600 text-center">
                Are you sure you want to delete "{workoutToDelete?.name}"? This
                action cannot be undone.
              </Text>
            </View>

            <View className="flex-row gap-3">
              <TouchableOpacity
                className="flex-1 bg-gray-100 py-3 rounded-xl"
                onPress={() => setDeleteConfirmModal(false)}
                activeOpacity={0.6}
              >
                <Text className="text-gray-700 text-center font-semibold">
                  Cancel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="flex-1 bg-red-600 py-3 rounded-xl"
                onPress={handleDeleteWorkout}
                activeOpacity={0.6}
              >
                <Text className="text-white text-center font-semibold">
                  Delete
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* HELPER COMPONENTS */

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <View className="items-center">
      <Text className="text-2xl font-bold">{value}</Text>
      <Text className="text-gray-500 text-sm">{label}</Text>
    </View>
  );
}

function Info({ label, value }: { label: string; value: any }) {
  return (
    <View className="items-center">
      <Text className="text-lg font-bold">{value}</Text>
      <Text className="text-gray-500 text-sm">{label}</Text>
    </View>
  );
}
