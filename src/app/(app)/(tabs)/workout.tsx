// src/app/(app)/(tabs)/workout.tsx
import React, { useState, useEffect, useRef } from "react";
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
  StyleSheet,
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
  const [modalKey, setModalKey] = useState(0);
  const [isStartingWorkout, setIsStartingWorkout] = useState(false);
  const lastStartPressRef = useRef(0);

  const [selectedWorkout, setSelectedWorkout] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState("all");

  const [newWorkout, setNewWorkout] = useState({
    name: "",
    description: "",
    duration: "",
    difficulty: "beginner" as "beginner" | "intermediate" | "advanced",
    category: "strength" as "strength" | "cardio" | "hiit" | "yoga" | "custom",
  });

  const [completionData, setCompletionData] = useState({
    rating: 0,
    notes: "",
    feel: "good" as "good" | "average" | "tired",
    difficulty: "medium" as "easy" | "medium" | "hard",
  });

  const categories = ["all", "strength", "cardio", "hiit", "yoga", "custom"];

  // Debug log for context
  useEffect(() => {
    console.log("🛠️ Workout Context Status:");
    console.log("- Workout Plans:", workoutPlans?.length || 0);
    console.log("- Active Workout:", activeWorkout ? "Yes" : "No");
    console.log("- Loading:", loading);
    console.log("- Stats:", stats);
  }, [workoutPlans, activeWorkout, loading]);

  // Handle modal state conflicts
  useEffect(() => {
    if (
      activeWorkout?.status === "completed" ||
      activeWorkout?.status === "cancelled"
    ) {
      setActiveWorkoutModal(false);
      setWorkoutCompleteModal(false);
    }
  }, [activeWorkout?.status]);

  // Auto-open active workout modal if there's an active workout
  useEffect(() => {
    if (
      activeWorkout &&
      activeWorkout.status !== "completed" &&
      activeWorkout.status !== "cancelled"
    ) {
      setActiveWorkoutModal(true);
    }
  }, [activeWorkout]);

  // Reset completion data when modal opens
  useEffect(() => {
    if (workoutCompleteModal) {
      setCompletionData({
        rating: 0,
        notes: "",
        feel: "good",
        difficulty: "medium",
      });
      setModalKey((prev) => prev + 1);
    }
  }, [workoutCompleteModal]);

  const filteredWorkouts =
    workoutPlans?.filter((workout) => {
      if (!workout) return false;
      if (selectedCategory === "all") return true;
      if (selectedCategory === "custom") return workout.createdBy === "user";
      return workout.category === selectedCategory;
    }) || [];

  const handleStartWorkout = async (workout: any) => {
    console.log("🚀 handleStartWorkout called for:", workout?.name);

    // Prevent double taps
    const now = Date.now();
    if (now - lastStartPressRef.current < 1500) {
      console.log("⚠️ Preventing double tap");
      return;
    }
    lastStartPressRef.current = now;

    if (isStartingWorkout) {
      console.log("⏳ Already starting a workout");
      return;
    }

    setIsStartingWorkout(true);

    try {
      console.log("📦 Starting workout with data:", {
        id: workout.id,
        name: workout.name,
        exercises: workout.exercises?.length,
      });

      const result = await startWorkout(workout);
      console.log("✅ startWorkout result:", result);

      if (result) {
        // Small delay to ensure state is updated
        setTimeout(() => {
          setActiveWorkoutModal(true);
          setWorkoutDetailsModal(false);
          setWorkoutCompleteModal(false);
          Alert.alert("Workout Started", `Started ${workout.name}!`);
        }, 300);
      } else {
        console.warn("⚠️ startWorkout returned falsy value");
        Alert.alert("Error", "Failed to start workout. Please try again.");
      }
    } catch (error: any) {
      console.error("Start workout error:", error);

      let errorMessage = "Failed to start workout";
      if (error?.message) {
        errorMessage = error.message;
      }

      Alert.alert("Error", errorMessage, [
        { text: "OK" },
        ...(activeWorkout
          ? [
              {
                text: "View Active",
                onPress: () => setActiveWorkoutModal(true),
              },
            ]
          : []),
      ]);
    } finally {
      setIsStartingWorkout(false);
    }
  };

  const handleOpenCompleteModal = async () => {
    console.log("📝 Opening completion modal");

    if (!activeWorkout) {
      Alert.alert("Error", "No active workout found");
      return;
    }

    if (workoutCompleteModal) return;

    console.log("Active workout status:", activeWorkout.status);

    if (activeWorkout.status === "in_progress") {
      await pauseWorkout();
    }

    setWorkoutCompleteModal(true);
  };

  const handleCompleteWorkout = async () => {
    console.log("🎯 handleCompleteWorkout called");

    if (!activeWorkout) {
      Alert.alert("Error", "No active workout to complete");
      return;
    }

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
      console.log("📊 Completion data:", completionData);

      const result = await completeWorkout(completionData);
      console.log("✅ completeWorkout result:", result);

      setWorkoutCompleteModal(false);
      setActiveWorkoutModal(false);

      setCompletionData({
        rating: 0,
        notes: "",
        feel: "good",
        difficulty: "medium",
      });

      Alert.alert("Awesome! 🎉", "Workout completed successfully!", [
        {
          text: "Great!",
          onPress: async () => {
            if (refreshWorkoutData) {
              await refreshWorkoutData();
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
          text: "Try Again",
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
            setWorkoutCompleteModal(false);
          } catch (error) {
            console.error("Cancel workout error:", error);
            Alert.alert("Error", "Failed to cancel workout");
          }
        },
      },
    ]);
  };

  const handleCreateWorkout = async () => {
    if (!newWorkout.name.trim()) {
      Alert.alert("Error", "Workout name required");
      return;
    }

    const duration = parseInt(newWorkout.duration);
    if (isNaN(duration) || duration < 5 || duration > 180) {
      Alert.alert("Error", "Duration must be 5–180 minutes");
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

      if (refreshWorkoutData) {
        await refreshWorkoutData();
      }

      Alert.alert("Success", "Custom workout created!");
    } catch (error) {
      console.error("Create workout error:", error);
      Alert.alert("Error", "Failed to create workout");
    }
  };

  // Simple test function for debugging
  const testStartWorkout = () => {
    if (filteredWorkouts.length > 0) {
      const testWorkout = filteredWorkouts[0];
      console.log("🧪 Testing with workout:", testWorkout);
      handleStartWorkout(testWorkout);
    } else {
      Alert.alert("No Workouts", "No workouts available to test");
    }
  };

  if (loading && (!workoutPlans || workoutPlans.length === 0)) {
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
                  ? `${stats.totalWorkouts || 0} workouts completed`
                  : "Choose a workout"}
              </Text>
            </View>
            <TouchableOpacity
              className="bg-gray-100 p-3 rounded-2xl"
              onPress={() => setCreateWorkoutModal(true)}
              activeOpacity={0.6}
              disabled={isStartingWorkout}
            >
              <Ionicons name="add" size={24} />
            </TouchableOpacity>
          </View>

          {stats && (
            <View className="flex-row justify-between mt-4">
              <Stat label="Total" value={stats.totalWorkouts || 0} />
              <Stat label="This Week" value={stats.thisWeekWorkouts || 0} />
              <Stat label="Hours" value={`${stats.totalHours || 0}h`} />
              <Stat
                label="Rating"
                value={(stats.averageRating || 0).toFixed(1)}
              />
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
                  disabled={isStartingWorkout}
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
              <View key={workout.id} className="mb-4">
                <WorkoutCard
                  workout={workout}
                  onStart={() => {
                    console.log(
                      "⚡ WorkoutCard Start pressed for:",
                      workout.name
                    );
                    handleStartWorkout(workout);
                  }}
                  onToggleFavorite={() => {
                    console.log("❤️ Toggling favorite for:", workout.id);
                    toggleFavorite(workout.id);
                  }}
                  onViewDetails={() => {
                    console.log("📖 Viewing details for:", workout.name);
                    setSelectedWorkout(workout);
                    setWorkoutDetailsModal(true);
                  }}
                />
              </View>
            ))
          ) : (
            <View className="items-center justify-center py-12">
              <Ionicons name="barbell-outline" size={64} color="#D1D5DB" />
              <Text className="text-gray-400 mt-4">No workouts found</Text>
              <TouchableOpacity
                onPress={() => setCreateWorkoutModal(true)}
                className="mt-4 bg-blue-600 px-6 py-3 rounded-xl"
              >
                <Text className="text-white font-semibold">
                  Create Your First Workout
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* DEBUG SECTION - Only visible in development */}
        {__DEV__ && (
          <View className="mx-6 mb-6 p-4 bg-yellow-50 rounded-xl border border-yellow-200">
            <Text className="text-yellow-800 font-bold mb-2">Debug Info:</Text>
            <Text className="text-yellow-700 text-sm">
              • Workouts: {workoutPlans?.length || 0}
            </Text>
            <Text className="text-yellow-700 text-sm">
              • Active: {activeWorkout ? "Yes" : "No"}
            </Text>
            <Text className="text-yellow-700 text-sm">
              • Loading: {loading ? "Yes" : "No"}
            </Text>
            <Text className="text-yellow-700 text-sm">
              • Starting: {isStartingWorkout ? "Yes" : "No"}
            </Text>

            <TouchableOpacity
              onPress={testStartWorkout}
              className="mt-3 bg-green-600 py-2 rounded-lg"
              disabled={isStartingWorkout || filteredWorkouts.length === 0}
            >
              <Text className="text-white text-center font-semibold">
                {isStartingWorkout ? "Starting..." : "Test Start First Workout"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={async () => {
                console.log("🔄 Manual refresh");
                if (refreshWorkoutData) {
                  await refreshWorkoutData();
                  Alert.alert("Refreshed", "Workout data refreshed");
                }
              }}
              className="mt-2 bg-blue-600 py-2 rounded-lg"
            >
              <Text className="text-white text-center font-semibold">
                Refresh Data
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* ACTIVE WORKOUT MODAL */}
      <Modal
        visible={activeWorkoutModal}
        transparent
        animationType="slide"
        key={`active-${modalKey}`}
        onRequestClose={() => {
          Alert.alert("Close Workout?", "Do you want to cancel this workout?", [
            { text: "Continue", style: "cancel" },
            { text: "Cancel Workout", onPress: handleCancelWorkout },
          ]);
        }}
      >
        <View style={styles.modalOverlay}>
          <View className="flex-1 mt-20 bg-white rounded-t-3xl">
            {activeWorkout ? (
              <>
                <View className="p-6 border-b border-gray-200">
                  <View className="flex-row justify-between items-center">
                    <Text className="text-2xl font-bold">
                      {activeWorkout.planName || "Active Workout"}
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
                      activeWorkout.exercises?.[
                        activeWorkout.currentExerciseIndex
                      ]?.name || "No Exercise"
                    }
                    currentSet={activeWorkout.currentSet || 1}
                    totalSets={
                      activeWorkout.exercises?.[
                        activeWorkout.currentExerciseIndex
                      ]?.sets || 0
                    }
                    isPaused={activeWorkout.status === "paused"}
                    onPause={pauseWorkout}
                    onResume={resumeWorkout}
                    onSkipRest={skipRest}
                    onCompleteSet={completeSet}
                    onCancel={handleCancelWorkout}
                  />

                  <TouchableOpacity
                    className="bg-green-600 rounded-xl py-4 mt-8"
                    onPress={handleOpenCompleteModal}
                    activeOpacity={0.6}
                    disabled={isCompleting}
                  >
                    <Text className="text-white text-center font-bold text-lg">
                      Complete Workout
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    className="mt-4"
                    onPress={() => {
                      Alert.alert(
                        "Complete Anyway?",
                        "Do you want to complete this workout even if you haven't finished all sets?",
                        [
                          { text: "Keep Going", style: "cancel" },
                          {
                            text: "Complete Now",
                            onPress: handleOpenCompleteModal,
                          },
                        ]
                      );
                    }}
                    disabled={isCompleting}
                  >
                    <Text className="text-gray-500 text-center text-sm">
                      Can't complete? Tap here
                    </Text>
                  </TouchableOpacity>
                </ScrollView>
              </>
            ) : (
              <View className="flex-1 justify-center items-center p-6">
                <Ionicons
                  name="alert-circle-outline"
                  size={64}
                  color="#EF4444"
                />
                <Text className="text-xl font-bold mt-4">
                  No Active Workout
                </Text>
                <Text className="text-gray-500 text-center mt-2">
                  It looks like there's no active workout to display.
                </Text>
                <TouchableOpacity
                  onPress={() => setActiveWorkoutModal(false)}
                  className="bg-blue-600 px-6 py-3 rounded-xl mt-6"
                >
                  <Text className="text-white font-semibold">Close</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* WORKOUT COMPLETE MODAL */}
      <Modal
        visible={workoutCompleteModal}
        transparent
        animationType="slide"
        key={`complete-${modalKey}`}
        onRequestClose={() => {
          if (!isCompleting) {
            setWorkoutCompleteModal(false);
            if (activeWorkout?.status === "paused") {
              resumeWorkout();
            }
          }
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
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
                      disabled={isCompleting}
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
                  editable={!isCompleting}
                />
              </View>

              <View className="flex-row gap-3">
                <TouchableOpacity
                  className="flex-1 bg-gray-100 py-4 rounded-xl"
                  onPress={() => {
                    setWorkoutCompleteModal(false);
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
                  className="flex-1 bg-green-600 py-4 rounded-xl flex-row items-center justify-center"
                  onPress={handleCompleteWorkout}
                  disabled={isCompleting}
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
      <Modal
        visible={createWorkoutModal}
        transparent
        animationType="slide"
        key={`create-${modalKey}`}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.modalOverlay}
        >
          <View className="flex-1 justify-center p-6">
            <View className="bg-white rounded-3xl p-6">
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
                    maxLength={50}
                  />
                </View>

                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Description
                  </Text>
                  <TextInput
                    placeholder="Brief description..."
                    className="border border-gray-200 rounded-xl p-3 min-h-[80px]"
                    value={newWorkout.description}
                    onChangeText={(t) =>
                      setNewWorkout({ ...newWorkout, description: t })
                    }
                    multiline
                    textAlignVertical="top"
                    maxLength={200}
                  />
                </View>

                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Duration (minutes) *
                  </Text>
                  <TextInput
                    placeholder="30"
                    className="border border-gray-200 rounded-xl p-3"
                    value={newWorkout.duration}
                    onChangeText={(t) =>
                      setNewWorkout({ ...newWorkout, duration: t })
                    }
                    keyboardType="number-pad"
                    maxLength={3}
                  />
                </View>

                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Difficulty
                  </Text>
                  <View className="flex-row gap-2">
                    {["beginner", "intermediate", "advanced"].map((diff) => (
                      <TouchableOpacity
                        key={diff}
                        onPress={() =>
                          setNewWorkout({
                            ...newWorkout,
                            difficulty: diff as any,
                          })
                        }
                        className={`flex-1 py-3 rounded-xl ${
                          newWorkout.difficulty === diff
                            ? "bg-blue-600"
                            : "bg-gray-100"
                        }`}
                        activeOpacity={0.6}
                      >
                        <Text
                          className={`text-center capitalize ${
                            newWorkout.difficulty === diff
                              ? "text-white font-semibold"
                              : "text-gray-700"
                          }`}
                        >
                          {diff}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View className="mb-6">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Category
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {["strength", "cardio", "hiit", "yoga"].map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        onPress={() =>
                          setNewWorkout({ ...newWorkout, category: cat as any })
                        }
                        className={`px-4 py-3 rounded-xl ${
                          newWorkout.category === cat
                            ? "bg-blue-600"
                            : "bg-gray-100"
                        }`}
                        activeOpacity={0.6}
                      >
                        <Text
                          className={`capitalize ${
                            newWorkout.category === cat
                              ? "text-white font-semibold"
                              : "text-gray-700"
                          }`}
                        >
                          {cat}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <TouchableOpacity
                  className="bg-blue-600 py-4 rounded-xl"
                  onPress={handleCreateWorkout}
                  activeOpacity={0.6}
                  disabled={!newWorkout.name.trim() || !newWorkout.duration}
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
      <Modal
        visible={workoutDetailsModal}
        transparent
        animationType="slide"
        key={`details-${modalKey}`}
      >
        <View style={styles.modalOverlay}>
          <View className="flex-1 justify-center p-6">
            <View className="bg-white rounded-3xl p-6">
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-2xl font-bold">Workout Details</Text>
                <TouchableOpacity
                  onPress={() => setWorkoutDetailsModal(false)}
                  activeOpacity={0.6}
                >
                  <Ionicons name="close" size={28} color="#374151" />
                </TouchableOpacity>
              </View>

              {selectedWorkout && (
                <ScrollView showsVerticalScrollIndicator={false}>
                  <View className="mb-4">
                    <Text className="text-lg font-bold mb-2">
                      {selectedWorkout.name}
                    </Text>
                    <Text className="text-gray-600 mb-4">
                      {selectedWorkout.description}
                    </Text>
                  </View>

                  <View className="flex-row justify-between mb-6">
                    <Info
                      label="Duration"
                      value={`${selectedWorkout.duration}m`}
                    />
                    <Info
                      label="Difficulty"
                      value={selectedWorkout.difficulty}
                    />
                    <Info label="Calories" value={selectedWorkout.calories} />
                  </View>

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
                              className="bg-gray-50 rounded-xl p-4 mb-3"
                            >
                              <Text className="font-semibold mb-1">
                                {exercise.name}
                              </Text>
                              <Text className="text-gray-600 text-sm">
                                {exercise.sets} sets ×{" "}
                                {exercise.reps || exercise.duration}
                              </Text>
                            </View>
                          )
                        )}
                      </View>
                    )}

                  <TouchableOpacity
                    className="bg-blue-600 py-4 rounded-xl"
                    onPress={() => {
                      setWorkoutDetailsModal(false);
                      // Small delay to ensure modal is closed
                      setTimeout(() => {
                        handleStartWorkout(selectedWorkout);
                      }, 300);
                    }}
                    activeOpacity={0.6}
                    disabled={isStartingWorkout}
                  >
                    {isStartingWorkout ? (
                      <View className="flex-row items-center justify-center">
                        <ActivityIndicator color="white" size="small" />
                        <Text className="text-white text-center font-bold ml-2">
                          Starting...
                        </Text>
                      </View>
                    ) : (
                      <Text className="text-white text-center font-bold text-lg">
                        Start Workout
                      </Text>
                    )}
                  </TouchableOpacity>
                </ScrollView>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

/* HELPERS */

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

/* STYLES */

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
  },
});
