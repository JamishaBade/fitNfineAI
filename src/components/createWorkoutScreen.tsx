import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Switch,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { workoutStorage } from "../lib/workoutStorage";
import { WorkoutPlan, ExerciseSession } from "../types/workout";
import { Picker } from "@react-native-picker/picker";

type ExerciseForm = {
  name: string;
  sets: string;
  reps: string;
  restTime: string;
};

export const CreateWorkoutScreen = ({ navigation }) => {
  const [workoutName, setWorkoutName] = useState("");
  const [description, setDescription] = useState("");
  const [duration, setDuration] = useState("30");
  const [difficulty, setDifficulty] = useState<
    "beginner" | "intermediate" | "advanced"
  >("intermediate");
  const [category, setCategory] = useState<
    "strength" | "cardio" | "hiit" | "yoga" | "custom"
  >("strength");
  const [exercises, setExercises] = useState<ExerciseForm[]>([
    { name: "", sets: "3", reps: "10", restTime: "60" },
  ]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  // Add a new exercise field
  const addExercise = () => {
    setExercises([
      ...exercises,
      { name: "", sets: "3", reps: "10", restTime: "60" },
    ]);
  };

  // Remove an exercise
  const removeExercise = (index: number) => {
    if (exercises.length > 1) {
      const newExercises = [...exercises];
      newExercises.splice(index, 1);
      setExercises(newExercises);
    }
  };

  // Update exercise field
  const updateExercise = (
    index: number,
    field: keyof ExerciseForm,
    value: string
  ) => {
    const newExercises = [...exercises];
    newExercises[index][field] = value;
    setExercises(newExercises);
  };

  // Add a tag
  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  // Remove a tag
  const removeTag = (index: number) => {
    const newTags = [...tags];
    newTags.splice(index, 1);
    setTags(newTags);
  };

  // Validate form
  const validateForm = (): boolean => {
    if (!workoutName.trim()) {
      Alert.alert("Error", "Please enter a workout name");
      return false;
    }

    if (exercises.some((ex) => !ex.name.trim())) {
      Alert.alert("Error", "Please fill in all exercise names");
      return false;
    }

    if (
      exercises.some(
        (ex) =>
          !ex.sets ||
          parseInt(ex.sets) <= 0 ||
          !ex.reps ||
          parseInt(ex.reps) <= 0 ||
          !ex.restTime ||
          parseInt(ex.restTime) < 0
      )
    ) {
      Alert.alert(
        "Error",
        "Please enter valid numbers for sets, reps, and rest time"
      );
      return false;
    }

    return true;
  };

  // Calculate calories based on duration and exercises
  const calculateCalories = (): number => {
    const dur = parseInt(duration) || 30;
    // Simple calculation: ~8 calories per minute average
    return Math.round(dur * 8);
  };

  // Save the workout
  const handleSaveWorkout = async () => {
    if (!validateForm()) return;

    setIsSaving(true);
    try {
      // Convert exercise forms to ExerciseSession objects
      const exerciseSessions: ExerciseSession[] = exercises.map(
        (ex, index) => ({
          exerciseId: `custom_ex_${Date.now()}_${index}`,
          name: ex.name.trim(),
          sets: parseInt(ex.sets),
          reps: parseInt(ex.reps),
          restTime: parseInt(ex.restTime),
          completedSets: 0,
          completed: false,
        })
      );

      // Create workout plan data
      const workoutData: Omit<WorkoutPlan, "id" | "createdBy"> = {
        name: workoutName.trim(),
        description: description.trim(),
        duration: parseInt(duration) || 30,
        difficulty,
        category,
        calories: calculateCalories(),
        exercises: exerciseSessions,
        isFavorite: false,
        tags: tags.length > 0 ? tags : ["custom"],
        restBetweenExercises: 60, // Default 60 seconds between exercises
        warmupDuration: 5, // Default 5 minutes warmup
        cooldownDuration: 5, // Default 5 minutes cooldown
      };

      // Save to storage
      const savedWorkout = await workoutStorage.createCustomWorkout(
        workoutData
      );

      Alert.alert("Success", "Workout created successfully!", [
        {
          text: "OK",
          onPress: () => navigation.goBack(),
        },
        {
          text: "Start Workout",
          onPress: async () => {
            // Navigate to workout screen with this workout
            navigation.navigate("WorkoutDetail", {
              workoutId: savedWorkout.id,
            });
          },
        },
      ]);
    } catch (error) {
      console.error("Error saving workout:", error);
      Alert.alert("Error", "Failed to save workout. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-gray-50 p-4">
      <View className="mb-6">
        <Text className="text-2xl font-bold text-gray-900 mb-2">
          Create Custom Workout
        </Text>
        <Text className="text-gray-600">Design your own workout routine</Text>
      </View>

      {/* Basic Information */}
      <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
        <Text className="text-lg font-semibold text-gray-900 mb-3">
          Basic Information
        </Text>

        <View className="mb-3">
          <Text className="text-gray-700 mb-1">Workout Name *</Text>
          <TextInput
            className="bg-gray-50 border border-gray-300 rounded-lg p-3"
            placeholder="e.g., My Leg Day Routine"
            value={workoutName}
            onChangeText={setWorkoutName}
          />
        </View>

        <View className="mb-3">
          <Text className="text-gray-700 mb-1">Description</Text>
          <TextInput
            className="bg-gray-50 border border-gray-300 rounded-lg p-3"
            placeholder="Describe your workout..."
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={3}
          />
        </View>

        <View className="flex-row mb-3">
          <View className="flex-1 mr-2">
            <Text className="text-gray-700 mb-1">Duration (minutes)</Text>
            <TextInput
              className="bg-gray-50 border border-gray-300 rounded-lg p-3"
              placeholder="30"
              value={duration}
              onChangeText={setDuration}
              keyboardType="number-pad"
            />
          </View>

          <View className="flex-1 ml-2">
            <Text className="text-gray-700 mb-1">Calories (estimated)</Text>
            <View className="bg-gray-50 border border-gray-300 rounded-lg p-3">
              <Text className="text-gray-900">{calculateCalories()}</Text>
            </View>
          </View>
        </View>

        <View className="flex-row mb-3">
          <View className="flex-1 mr-2">
            <Text className="text-gray-700 mb-1">Difficulty</Text>
            <View className="bg-gray-50 border border-gray-300 rounded-lg">
              <Picker
                selectedValue={difficulty}
                onValueChange={(value) => setDifficulty(value)}
              >
                <Picker.Item label="Beginner" value="beginner" />
                <Picker.Item label="Intermediate" value="intermediate" />
                <Picker.Item label="Advanced" value="advanced" />
              </Picker>
            </View>
          </View>

          <View className="flex-1 ml-2">
            <Text className="text-gray-700 mb-1">Category</Text>
            <View className="bg-gray-50 border border-gray-300 rounded-lg">
              <Picker
                selectedValue={category}
                onValueChange={(value) => setCategory(value)}
              >
                <Picker.Item label="Strength" value="strength" />
                <Picker.Item label="Cardio" value="cardio" />
                <Picker.Item label="HIIT" value="hiit" />
                <Picker.Item label="Yoga" value="yoga" />
                <Picker.Item label="Custom" value="custom" />
              </Picker>
            </View>
          </View>
        </View>

        <View className="mb-3">
          <Text className="text-gray-700 mb-1">Tags</Text>
          <View className="flex-row flex-wrap mb-2">
            {tags.map((tag, index) => (
              <View
                key={index}
                className="bg-blue-100 rounded-full px-3 py-1 mr-2 mb-2 flex-row items-center"
              >
                <Text className="text-blue-800 mr-1">{tag}</Text>
                <TouchableOpacity onPress={() => removeTag(index)}>
                  <Ionicons name="close-circle" size={16} color="#1e40af" />
                </TouchableOpacity>
              </View>
            ))}
          </View>
          <View className="flex-row">
            <TextInput
              className="flex-1 bg-gray-50 border border-gray-300 rounded-lg p-3 mr-2"
              placeholder="Add a tag (e.g., legs, home, quick)"
              value={tagInput}
              onChangeText={setTagInput}
              onSubmitEditing={addTag}
            />
            <TouchableOpacity
              className="bg-blue-600 rounded-lg p-3 justify-center"
              onPress={addTag}
            >
              <Ionicons name="add" size={24} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Exercises */}
      <View className="bg-white rounded-xl p-4 mb-4 shadow-sm">
        <View className="flex-row justify-between items-center mb-3">
          <Text className="text-lg font-semibold text-gray-900">Exercises</Text>
          <TouchableOpacity
            className="bg-green-600 rounded-lg px-4 py-2 flex-row items-center"
            onPress={addExercise}
          >
            <Ionicons name="add" size={20} color="white" />
            <Text className="text-white ml-1">Add Exercise</Text>
          </TouchableOpacity>
        </View>

        {exercises.map((exercise, index) => (
          <View
            key={index}
            className="mb-4 p-3 border border-gray-200 rounded-lg"
          >
            <View className="flex-row justify-between items-center mb-2">
              <Text className="text-gray-700 font-medium">
                Exercise {index + 1}
              </Text>
              {exercises.length > 1 && (
                <TouchableOpacity onPress={() => removeExercise(index)}>
                  <Ionicons name="trash-outline" size={20} color="#ef4444" />
                </TouchableOpacity>
              )}
            </View>

            <View className="mb-2">
              <Text className="text-gray-700 mb-1">Exercise Name *</Text>
              <TextInput
                className="bg-gray-50 border border-gray-300 rounded-lg p-3"
                placeholder="e.g., Squats, Push-ups"
                value={exercise.name}
                onChangeText={(value) => updateExercise(index, "name", value)}
              />
            </View>

            <View className="flex-row mb-2">
              <View className="flex-1 mr-2">
                <Text className="text-gray-700 mb-1">Sets</Text>
                <TextInput
                  className="bg-gray-50 border border-gray-300 rounded-lg p-3"
                  placeholder="3"
                  value={exercise.sets}
                  onChangeText={(value) => updateExercise(index, "sets", value)}
                  keyboardType="number-pad"
                />
              </View>

              <View className="flex-1 mx-2">
                <Text className="text-gray-700 mb-1">Reps</Text>
                <TextInput
                  className="bg-gray-50 border border-gray-300 rounded-lg p-3"
                  placeholder="10"
                  value={exercise.reps}
                  onChangeText={(value) => updateExercise(index, "reps", value)}
                  keyboardType="number-pad"
                />
              </View>

              <View className="flex-1 ml-2">
                <Text className="text-gray-700 mb-1">Rest (sec)</Text>
                <TextInput
                  className="bg-gray-50 border border-gray-300 rounded-lg p-3"
                  placeholder="60"
                  value={exercise.restTime}
                  onChangeText={(value) =>
                    updateExercise(index, "restTime", value)
                  }
                  keyboardType="number-pad"
                />
              </View>
            </View>
          </View>
        ))}
      </View>

      {/* Action Buttons */}
      <View className="flex-row space-x-3 mb-8">
        <TouchableOpacity
          className="flex-1 bg-gray-200 rounded-xl py-4 items-center"
          onPress={() => navigation.goBack()}
          disabled={isSaving}
        >
          <Text className="text-gray-700 font-semibold">Cancel</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 bg-blue-600 rounded-xl py-4 items-center"
          onPress={handleSaveWorkout}
          disabled={isSaving}
        >
          {isSaving ? (
            <Text className="text-white font-semibold">Saving...</Text>
          ) : (
            <>
              <Ionicons name="save-outline" size={20} color="white" />
              <Text className="text-white font-semibold ml-1">
                Save Workout
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      {/* Preview */}
      {workoutName && (
        <View className="bg-blue-50 rounded-xl p-4 mb-8">
          <Text className="text-lg font-semibold text-blue-900 mb-2">
            Preview
          </Text>
          <Text className="text-blue-800 font-medium mb-1">{workoutName}</Text>
          {description && (
            <Text className="text-blue-700 mb-2">{description}</Text>
          )}
          <View className="flex-row">
            <Text className="text-blue-700 mr-3">{duration} min</Text>
            <Text className="text-blue-700 mr-3">{difficulty}</Text>
            <Text className="text-blue-700">{calculateCalories()} cal</Text>
          </View>
          <Text className="text-blue-700 mt-2">
            {exercises.length} exercises
          </Text>
        </View>
      )}
    </ScrollView>
  );
};
