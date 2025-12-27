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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { WorkoutCard } from "../../../components/WorkoutCard";
import { ActiveWorkoutTimer } from "../../../components/ActiveWorkoutTimer";
import { useWorkout } from "../../../contexts/WorkoutContext";

export default function WorkoutScreen() {
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
    refreshWorkoutData,
  } = useWorkout();

  const [activeWorkoutModal, setActiveWorkoutModal] = useState(false);
  const [workoutCompleteModal, setWorkoutCompleteModal] = useState(false);
  const [createWorkoutModal, setCreateWorkoutModal] = useState(false);
  const [workoutDetailsModal, setWorkoutDetailsModal] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);

  const [selectedWorkout, setSelectedWorkout] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [newWorkout, setNewWorkout] = useState({
    name: "",
    description: "",
    duration: "",
    difficulty: "beginner",
    category: "strength",
  });

  const [completionData, setCompletionData] = useState({
    rating: 0,
    notes: "",
    feel: "good",
    difficulty: "medium",
  });

  const categories = ["all", "strength", "cardio", "hiit", "yoga", "custom"];
  const difficultyLevels = ["beginner", "intermediate", "advanced"];
  const feelOptions = [
    { value: "great", label: "Great", icon: "happy" },
    { value: "good", label: "Good", icon: "happy-outline" },
    { value: "okay", label: "Okay", icon: "remove-circle-outline" },
    { value: "tired", label: "Tired", icon: "sad-outline" },
  ];

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
    return workoutPlans.filter((workout) => {
      if (selectedCategory === "all") return true;
      if (selectedCategory === "custom") return workout.createdBy === "user";
      return workout.category === selectedCategory;
    });
  }, [workoutPlans, selectedCategory]);

  const handleStartWorkout = async (workout: any) => {
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

    console.log("Opening completion modal...");
    console.log("Active workout status:", activeWorkout.status);
    console.log("Current exercise index:", activeWorkout.currentExerciseIndex);
    console.log("Current set:", activeWorkout.currentSet);

    // Pause the workout if it's running
    if (activeWorkout.status === "active") {
      completeWorkout();
    }

    setWorkoutCompleteModal(true);
  };

  const handleCompleteWorkout = async () => {
    console.log("🎯 Completing workout...");

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
      console.log("📊 Sending completion data:", completionData);
      console.log("📊 Active workout:", activeWorkout);

      // Call the completeWorkout function
      const result = await completeWorkout(completionData);
      console.log("✅ Workout completion result:", result);

      // Close modals
      setWorkoutCompleteModal(false);
      setActiveWorkoutModal(false);

      // Show success message
      Alert.alert("Awesome! 🎉", "Workout completed successfully!", [
        {
          text: "Great!",
          onPress: () => {
            // Refresh data if needed
            if (refreshWorkoutData) {
              refreshWorkoutData();
            }
          },
        },
      ]);
    } catch (error: any) {
      console.error("❌ Error completing workout:", error);

      let errorMessage = "Failed to save workout completion";
      if (error?.message) {
        errorMessage = error.message;
      }

      Alert.alert("Oops!", errorMessage, [
        {
          text: "OK",
          onPress: () => {
            setIsCompleting(false);
          },
        },
      ]);
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
          } catch (error) {
            console.error("Cancel workout error:", error);
          }
        },
      },
    ]);
  };

  const handleCreateWorkout = async () => {
    if (!newWorkout.name.trim()) {
      Alert.alert("Error", "Workout name is required");
      return;
    }

    const duration = parseInt(newWorkout.duration);
    if (isNaN(duration) || duration < 5 || duration > 180) {
      Alert.alert("Error", "Duration must be between 5 and 180 minutes");
      return;
    }

    try {
      await createCustomWorkout({
        name: newWorkout.name,
        description: newWorkout.description,
        duration,
        difficulty: newWorkout.difficulty,
        category: newWorkout.category,
        calories: Math.round(duration * 8),
      });

      setNewWorkout({
        name: "",
        description: "",
        duration: "",
        difficulty: "beginner",
        category: "strength",
      });

      setCreateWorkoutModal(false);
      if (refreshWorkoutData) await refreshWorkoutData();

      Alert.alert("Success", "Custom workout created!");
    } catch (error) {
      console.error("Create workout error:", error);
      Alert.alert("Error", "Failed to create workout. Please try again.");
    }
  };

  if (loading && workoutPlans.length === 0) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center bg-gray-50">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="mt-4 text-gray-600">Loading workouts...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView>
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
              <Ionicons name="add" size={24} />
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
          {filteredWorkouts.length > 0 ? (
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
              />
            ))
          ) : (
            <View className="items-center justify-center py-12">
              <Ionicons name="barbell-outline" size={64} color="#D1D5DB" />
              <Text className="text-gray-400 mt-4">No workouts found</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* ACTIVE WORKOUT MODAL */}
      <Modal visible={activeWorkoutModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}>
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

                <ScrollView className="p-6">
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
                    className="bg-green-600 rounded-xl py-4 mt-8"
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

      {/* WORKOUT COMPLETE MODAL */}
      <Modal visible={workoutCompleteModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.8)" }}
        >
          <View className="flex-1 justify-center p-6">
            <View className="bg-white rounded-3xl p-6">
              <View className="items-center mb-6">
                <View className="bg-green-100 w-20 h-20 rounded-full items-center justify-center mb-4">
                  <Ionicons name="checkmark" size={48} color="#10B981" />
                </View>
                <Text className="text-2xl font-bold mb-2">
                  Workout Complete! 🎉
                </Text>
                <Text className="text-gray-500 text-center">
                  Great job on finishing your workout
                </Text>
              </View>

              {/* Star Rating */}
              <View className="mb-6">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Rate your workout *
                </Text>
                <View className="flex-row justify-around mb-4">
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
                        size={32}
                        color={
                          star <= completionData.rating ? "#F59E0B" : "#D1D5DB"
                        }
                      />
                    </TouchableOpacity>
                  ))}
                </View>
                {completionData.rating === 0 && (
                  <Text className="text-red-500 text-xs text-center">
                    Please select a rating
                  </Text>
                )}
              </View>

              {/* How did you feel? */}
              <View className="mb-6">
                <Text className="text-sm font-medium text-gray-700 mb-2">
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
                      className={`flex-1 mx-1 py-3 rounded-xl border-2 ${
                        completionData.feel === option.value
                          ? "border-blue-600 bg-blue-50"
                          : "border-gray-200 bg-white"
                      }`}
                      activeOpacity={0.6}
                    >
                      <View className="items-center">
                        <Ionicons
                          name={option.icon as any}
                          size={24}
                          color={
                            completionData.feel === option.value
                              ? "#3B82F6"
                              : "#9CA3AF"
                          }
                        />
                        <Text
                          className={`text-xs mt-1 ${
                            completionData.feel === option.value
                              ? "text-blue-600 font-semibold"
                              : "text-gray-500"
                          }`}
                        >
                          {option.label}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Difficulty */}
              <View className="mb-6">
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Difficulty level
                </Text>
                <View className="flex-row justify-between">
                  {["easy", "medium", "hard"].map((level) => (
                    <TouchableOpacity
                      key={level}
                      onPress={() =>
                        setCompletionData({
                          ...completionData,
                          difficulty: level,
                        })
                      }
                      className={`flex-1 mx-1 py-3 rounded-xl border-2 ${
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
                <Text className="text-sm font-medium text-gray-700 mb-2">
                  Add notes (optional)
                </Text>
                <TextInput
                  placeholder="How did you feel? Any notes..."
                  className="border border-gray-200 rounded-xl p-3 min-h-[80px]"
                  value={completionData.notes}
                  onChangeText={(t) =>
                    setCompletionData({ ...completionData, notes: t })
                  }
                  multiline
                  textAlignVertical="top"
                />
              </View>

              {/* Action Buttons */}
              <View className="flex-row gap-3">
                <TouchableOpacity
                  className="flex-1 bg-gray-100 py-4 rounded-xl"
                  onPress={() => {
                    setWorkoutCompleteModal(false);
                    // Resume workout if it was paused
                    if (activeWorkout?.status === "paused") {
                      resumeWorkout();
                    }
                  }}
                  disabled={isCompleting}
                  activeOpacity={0.6}
                >
                  <Text className="text-gray-700 text-center font-semibold">
                    Go Back
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className={`flex-1 py-4 rounded-xl flex-row items-center justify-center ${
                    completionData.rating === 0 || isCompleting
                      ? "bg-gray-300"
                      : "bg-green-600"
                  }`}
                  onPress={handleCompleteWorkout}
                  disabled={isCompleting || completionData.rating === 0}
                  activeOpacity={0.6}
                >
                  {isCompleting ? (
                    <>
                      <ActivityIndicator color="white" size="small" />
                      <Text className="text-white text-center font-bold ml-2">
                        Saving...
                      </Text>
                    </>
                  ) : (
                    <Text className="text-white text-center font-bold">
                      Complete
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* CREATE WORKOUT MODAL */}
      <Modal visible={createWorkoutModal} transparent animationType="slide">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}
        >
          <View className="flex-1 justify-end">
            <View className="bg-white rounded-t-3xl p-6 max-h-[90%]">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-2xl font-bold">Create Workout</Text>
                <TouchableOpacity
                  onPress={() => setCreateWorkoutModal(false)}
                  activeOpacity={0.6}
                >
                  <Ionicons name="close" size={28} color="#374151" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Workout Name */}
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Workout Name *
                  </Text>
                  <TextInput
                    placeholder="e.g., Morning Cardio"
                    className="border border-gray-200 rounded-xl p-3"
                    value={newWorkout.name}
                    onChangeText={(t) =>
                      setNewWorkout({ ...newWorkout, name: t })
                    }
                  />
                </View>

                {/* Description */}
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Description
                  </Text>
                  <TextInput
                    placeholder="What does this workout include?"
                    className="border border-gray-200 rounded-xl p-3 min-h-[80px]"
                    value={newWorkout.description}
                    onChangeText={(t) =>
                      setNewWorkout({ ...newWorkout, description: t })
                    }
                    multiline
                    textAlignVertical="top"
                  />
                </View>

                {/* Duration */}
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes) *
                  </Text>
                  <TextInput
                    placeholder="e.g., 30"
                    className="border border-gray-200 rounded-xl p-3"
                    value={newWorkout.duration}
                    onChangeText={(t) =>
                      setNewWorkout({ ...newWorkout, duration: t })
                    }
                    keyboardType="number-pad"
                  />
                  <Text className="text-xs text-gray-500 mt-1">
                    Between 5 and 180 minutes
                  </Text>
                </View>

                {/* Category */}
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Category
                  </Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View className="flex-row gap-2">
                      {categories
                        .filter((c) => c !== "all" && c !== "custom")
                        .map((cat) => (
                          <TouchableOpacity
                            key={cat}
                            onPress={() =>
                              setNewWorkout({ ...newWorkout, category: cat })
                            }
                            className={`px-4 py-2 rounded-full border-2 ${
                              newWorkout.category === cat
                                ? "border-blue-600 bg-blue-50"
                                : "border-gray-200 bg-white"
                            }`}
                            activeOpacity={0.6}
                          >
                            <Text
                              className={`capitalize ${
                                newWorkout.category === cat
                                  ? "text-blue-600 font-semibold"
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

                {/* Difficulty */}
                <View className="mb-6">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Difficulty
                  </Text>
                  <View className="flex-row justify-between">
                    {difficultyLevels.map((level) => (
                      <TouchableOpacity
                        key={level}
                        onPress={() =>
                          setNewWorkout({ ...newWorkout, difficulty: level })
                        }
                        className={`flex-1 mx-1 py-3 rounded-xl border-2 ${
                          newWorkout.difficulty === level
                            ? "border-blue-600 bg-blue-50"
                            : "border-gray-200 bg-white"
                        }`}
                        activeOpacity={0.6}
                      >
                        <Text
                          className={`text-center capitalize ${
                            newWorkout.difficulty === level
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

                {/* Create Button */}
                <TouchableOpacity
                  className="bg-blue-600 py-4 rounded-xl"
                  onPress={handleCreateWorkout}
                  activeOpacity={0.6}
                >
                  <Text className="text-white text-center font-bold text-lg">
                    Create Workout
                  </Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* WORKOUT DETAILS MODAL */}
      <Modal visible={workoutDetailsModal} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.5)" }}>
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

                <ScrollView className="p-6">
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
                              </View>
                            </View>
                          )
                        )}
                      </View>
                    )}

                  {/* Start Workout Button */}
                  <TouchableOpacity
                    className="bg-blue-600 py-4 rounded-xl mb-4"
                    onPress={() => {
                      setWorkoutDetailsModal(false);
                      handleStartWorkout(selectedWorkout);
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
                      color={selectedWorkout.isFavorite ? "#EF4444" : "#6B7280"}
                    />
                    <Text className="text-gray-700 font-semibold ml-2">
                      {selectedWorkout.isFavorite
                        ? "Remove from Favorites"
                        : "Add to Favorites"}
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </>
            )}
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
