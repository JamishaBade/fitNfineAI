import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Types
type Exercise = {
  id: string;
  name: string;
  category: string;
  muscleGroup: string;
  equipment: string;
  difficulty: string;
  description: string;
  isCustom?: boolean;
};

type ExerciseCardProps = {
  exercise: Exercise;
  isFavorite: boolean;
  onPress: () => void;
  onToggleFavorite: () => void;
  onDelete?: () => void;
};

type CategoryButtonProps = {
  category: string;
  isSelected: boolean;
  onPress: () => void;
};

type SearchBarProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder: string;
};

type AddExerciseModalProps = {
  visible: boolean;
  onClose: () => void;
  onAddExercise: (exercise: Omit<Exercise, "id">) => void;
};

// Custom Hooks
const useExercises = () => {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const initialExercises: Exercise[] = [
    {
      id: "1",
      name: "Push-ups",
      category: "Strength",
      muscleGroup: "Chest, Triceps",
      equipment: "Bodyweight",
      difficulty: "Beginner",
      description: "Classic upper body exercise targeting chest and triceps",
    },
    {
      id: "2",
      name: "Squats",
      category: "Strength",
      muscleGroup: "Legs, Glutes",
      equipment: "Bodyweight/Barbell",
      difficulty: "Beginner",
      description: "Fundamental lower body exercise for leg strength",
    },
    {
      id: "3",
      name: "Plank",
      category: "Core",
      muscleGroup: "Abs, Core",
      equipment: "Bodyweight",
      difficulty: "Beginner",
      description: "Isometric core exercise for stability",
    },
    {
      id: "4",
      name: "Burpees",
      category: "Cardio",
      muscleGroup: "Full Body",
      equipment: "Bodyweight",
      difficulty: "Intermediate",
      description: "Full body explosive movement for cardio and strength",
    },
    {
      id: "5",
      name: "Bicep Curls",
      category: "Strength",
      muscleGroup: "Biceps",
      equipment: "Dumbbells",
      difficulty: "Beginner",
      description: "Isolation exercise for bicep development",
    },
    {
      id: "6",
      name: "Deadlifts",
      category: "Strength",
      muscleGroup: "Back, Legs",
      equipment: "Barbell",
      difficulty: "Advanced",
      description: "Compound lift for overall strength development",
    },
    {
      id: "7",
      name: "Jumping Jacks",
      category: "Cardio",
      muscleGroup: "Full Body",
      equipment: "Bodyweight",
      difficulty: "Beginner",
      description: "Full body cardio exercise to increase heart rate",
    },
    {
      id: "8",
      name: "Russian Twists",
      category: "Core",
      muscleGroup: "Obliques, Abs",
      equipment: "Bodyweight/Medicine Ball",
      difficulty: "Intermediate",
      description: "Rotational core exercise for obliques",
    },
    {
      id: "9",
      name: "Lunges",
      category: "Strength",
      muscleGroup: "Legs, Glutes",
      equipment: "Bodyweight/Dumbbells",
      difficulty: "Beginner",
      description: "Unilateral leg exercise for balance and strength",
    },
    {
      id: "10",
      name: "Mountain Climbers",
      category: "Cardio",
      muscleGroup: "Core, Shoulders",
      equipment: "Bodyweight",
      difficulty: "Intermediate",
      description: "Dynamic core and cardio exercise",
    },
    {
      id: "11",
      name: "Pull-ups",
      category: "Strength",
      muscleGroup: "Back, Biceps",
      equipment: "Pull-up Bar",
      difficulty: "Intermediate",
      description: "Upper body pulling exercise for back development",
    },
    {
      id: "12",
      name: "Crunches",
      category: "Core",
      muscleGroup: "Abs",
      equipment: "Bodyweight",
      difficulty: "Beginner",
      description: "Basic abdominal exercise for core strength",
    },
  ];

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      const savedExercises = await AsyncStorage.getItem("customExercises");
      const customExercises = savedExercises ? JSON.parse(savedExercises) : [];

      // Merge predefined exercises with custom ones
      const allExercises = [...initialExercises, ...customExercises];
      setExercises(allExercises);
    } catch (error) {
      console.error("Error loading exercises:", error);
      Alert.alert("Error", "Failed to load exercises");
      setExercises(initialExercises);
    } finally {
      setIsLoading(false);
    }
  };

  const saveCustomExercises = async (customExercises: Exercise[]) => {
    try {
      await AsyncStorage.setItem(
        "customExercises",
        JSON.stringify(customExercises)
      );
    } catch (error) {
      console.error("Error saving custom exercises:", error);
      throw error;
    }
  };

  const addExercise = async (exerciseData: Omit<Exercise, "id">) => {
    try {
      const newExercise: Exercise = {
        ...exerciseData,
        id: `custom_${Date.now()}`,
        isCustom: true,
      };

      // Get current custom exercises
      const savedExercises = await AsyncStorage.getItem("customExercises");
      const existingCustomExercises = savedExercises
        ? JSON.parse(savedExercises)
        : [];

      // Add new exercise
      const updatedCustomExercises = [...existingCustomExercises, newExercise];

      // Save to storage
      await saveCustomExercises(updatedCustomExercises);

      // Update state
      setExercises((prev) => [...prev, newExercise]);

      return newExercise;
    } catch (error) {
      console.error("Error adding exercise:", error);
      throw error;
    }
  };

  const deleteExercise = async (exerciseId: string) => {
    try {
      // Get current custom exercises
      const savedExercises = await AsyncStorage.getItem("customExercises");
      const existingCustomExercises = savedExercises
        ? JSON.parse(savedExercises)
        : [];

      // Remove the exercise
      const updatedCustomExercises = existingCustomExercises.filter(
        (ex: Exercise) => ex.id !== exerciseId
      );

      // Save to storage
      await saveCustomExercises(updatedCustomExercises);

      // Update state
      setExercises((prev) => prev.filter((ex) => ex.id !== exerciseId));

      return true;
    } catch (error) {
      console.error("Error deleting exercise:", error);
      throw error;
    }
  };

  return {
    exercises,
    isLoading,
    addExercise,
    deleteExercise,
    loadExercises,
  };
};

const useFavorites = () => {
  const [favorites, setFavorites] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const savedFavorites = await AsyncStorage.getItem("favoriteExercises");
      if (savedFavorites) {
        setFavorites(JSON.parse(savedFavorites));
      }
    } catch (error) {
      console.error("Error loading favorites:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveFavorites = async (favoriteIds: string[]) => {
    try {
      await AsyncStorage.setItem(
        "favoriteExercises",
        JSON.stringify(favoriteIds)
      );
    } catch (error) {
      console.error("Error saving favorites:", error);
    }
  };

  const toggleFavorite = async (exerciseId: string) => {
    let newFavorites;
    const isCurrentlyFavorite = favorites.includes(exerciseId);

    if (isCurrentlyFavorite) {
      newFavorites = favorites.filter((id) => id !== exerciseId);
    } else {
      newFavorites = [...favorites, exerciseId];
    }

    setFavorites(newFavorites);
    await saveFavorites(newFavorites);

    return !isCurrentlyFavorite;
  };

  const removeFavorite = async (exerciseId: string) => {
    const newFavorites = favorites.filter((id) => id !== exerciseId);
    setFavorites(newFavorites);
    await saveFavorites(newFavorites);
  };

  const isFavorite = (exerciseId: string) => favorites.includes(exerciseId);

  return {
    favorites,
    isLoading,
    toggleFavorite,
    removeFavorite,
    isFavorite,
  };
};

const useExerciseFilter = (exercises: Exercise[], favorites: string[]) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = useMemo(() => ["All", "Strength", "Cardio", "Core"], []);

  const filteredExercises = useMemo(() => {
    return exercises.filter((exercise) => {
      const matchesSearch =
        searchQuery === "" ||
        exercise.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        exercise.muscleGroup
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        exercise.description.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === "All" || exercise.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [exercises, searchQuery, selectedCategory]);

  const favoriteExercises = useMemo(() => {
    return exercises.filter((exercise) => favorites.includes(exercise.id));
  }, [exercises, favorites]);

  return {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    categories,
    filteredExercises,
    favoriteExercises,
  };
};

// Reusable Components
const SearchBar: React.FC<SearchBarProps> = React.memo(
  ({ value, onChangeText, placeholder }) => (
    <View className="bg-gray-100 rounded-2xl px-4 py-3 flex-row items-center">
      <Ionicons name="search" size={20} color="#9CA3AF" />
      <TextInput
        className="flex-1 ml-3 text-gray-900"
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        placeholderTextColor="#9CA3AF"
        clearButtonMode="while-editing"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText("")}>
          <Ionicons name="close-circle" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      )}
    </View>
  )
);

SearchBar.displayName = "SearchBar";

const CategoryButton: React.FC<CategoryButtonProps> = React.memo(
  ({ category, isSelected, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      className={`px-4 py-2 rounded-full ${
        isSelected ? "bg-blue-600" : "bg-gray-100"
      }`}
      activeOpacity={0.7}
    >
      <Text
        className={`font-medium ${isSelected ? "text-white" : "text-gray-700"}`}
      >
        {category}
      </Text>
    </TouchableOpacity>
  )
);

CategoryButton.displayName = "CategoryButton";

const ExerciseCard: React.FC<ExerciseCardProps> = React.memo(
  ({ exercise, isFavorite, onPress, onToggleFavorite, onDelete }) => {
    const getCategoryColor = useCallback((category: string) => {
      switch (category) {
        case "Strength":
          return { bg: "bg-blue-100", text: "text-blue-700" };
        case "Cardio":
          return { bg: "bg-green-100", text: "text-green-700" };
        case "Core":
          return { bg: "bg-purple-100", text: "text-purple-700" };
        default:
          return { bg: "bg-gray-100", text: "text-gray-700" };
      }
    }, []);

    const colors = getCategoryColor(exercise.category);

    return (
      <TouchableOpacity
        className="bg-white rounded-2xl p-4 mb-4 w-[48%] shadow-sm border border-gray-100 active:opacity-90"
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View className="flex-row justify-between items-start mb-3">
          <View className="flex-1 mr-2">
            <View className="flex-row items-center">
              <Text
                className="text-lg font-bold text-gray-900 flex-shrink"
                numberOfLines={1}
              >
                {exercise.name}
              </Text>
              {exercise.isCustom && (
                <Text className="text-xs text-blue-500 ml-1 flex-shrink-0">
                  (Custom)
                </Text>
              )}
            </View>
            <Text className="text-gray-500 text-sm mt-1" numberOfLines={1}>
              {exercise.muscleGroup}
            </Text>
          </View>
          <View className="flex-row items-center">
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name={isFavorite ? "heart" : "heart-outline"}
                size={24}
                color={isFavorite ? "#EF4444" : "#9CA3AF"}
              />
            </TouchableOpacity>
            {exercise.isCustom && onDelete && (
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                className="ml-2"
              >
                <Ionicons name="trash-outline" size={22} color="#EF4444" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View className="flex-row items-center mb-2 flex-wrap">
          <View className={`px-2 py-1 rounded ${colors.bg} mr-2 mb-1`}>
            <Text className={`text-xs font-medium ${colors.text}`}>
              {exercise.category}
            </Text>
          </View>
          <View className="bg-gray-100 px-2 py-1 rounded mb-1">
            <Text className="text-xs font-medium text-gray-700">
              {exercise.difficulty}
            </Text>
          </View>
        </View>

        <View className="flex-row items-center">
          <Ionicons name="barbell-outline" size={14} color="#6B7280" />
          <Text className="text-gray-600 text-sm ml-1 flex-1" numberOfLines={1}>
            {exercise.equipment}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }
);

ExerciseCard.displayName = "ExerciseCard";

const ProTipCard = React.memo(() => (
  <View className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-5 mt-4 mb-8">
    <View className="flex-row items-center mb-3">
      <Ionicons name="bulb" size={24} color="white" />
      <Text className="text-white font-bold text-lg ml-2">Pro Tip</Text>
    </View>
    <Text className="text-white text-sm">
      Focus on proper form over heavy weights. Quality repetitions prevent
      injuries and yield better results in the long run.
    </Text>
  </View>
));

ProTipCard.displayName = "ProTipCard";

const AddExerciseModal: React.FC<AddExerciseModalProps> = ({
  visible,
  onClose,
  onAddExercise,
}) => {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Strength");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [equipment, setEquipment] = useState("");
  const [difficulty, setDifficulty] = useState("Beginner");
  const [description, setDescription] = useState("");

  const handleAdd = () => {
    if (!name.trim()) {
      Alert.alert("Error", "Please enter an exercise name");
      return;
    }

    onAddExercise({
      name: name.trim(),
      category,
      muscleGroup: muscleGroup.trim() || "Full Body",
      equipment: equipment.trim() || "Bodyweight",
      difficulty,
      description: description.trim() || `Custom exercise: ${name.trim()}`,
    });

    // Reset form
    setName("");
    setCategory("Strength");
    setMuscleGroup("");
    setEquipment("");
    setDifficulty("Beginner");
    setDescription("");
    onClose();
  };

  if (!visible) return null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="absolute inset-0 bg-black bg-opacity-50 justify-center items-center px-4"
    >
      <View className="bg-white rounded-2xl p-6 w-full max-w-md max-h-[90%]">
        <View className="flex-row justify-between items-center mb-6">
          <Text className="text-2xl font-bold text-gray-900">
            Add Custom Exercise
          </Text>
          <TouchableOpacity onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={24} color="#4B5563" />
          </TouchableOpacity>
        </View>

        <ScrollView
          className="max-h-[400px]"
          showsVerticalScrollIndicator={false}
        >
          <View className="space-y-4">
            <View>
              <Text className="text-gray-700 font-medium mb-2">
                Exercise Name *
              </Text>
              <TextInput
                className="bg-gray-100 rounded-xl px-4 py-3 text-gray-900 border border-gray-200"
                placeholder="e.g., Custom Squat Variation"
                value={name}
                onChangeText={setName}
                maxLength={50}
              />
            </View>

            <View>
              <Text className="text-gray-700 font-medium mb-2">Category</Text>
              <View className="flex-row flex-wrap gap-2">
                {["Strength", "Cardio", "Core"].map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => setCategory(cat)}
                    className={`px-4 py-2 rounded-full ${
                      category === cat ? "bg-blue-600" : "bg-gray-100"
                    }`}
                    activeOpacity={0.7}
                  >
                    <Text
                      className={
                        category === cat ? "text-white" : "text-gray-700"
                      }
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View>
              <Text className="text-gray-700 font-medium mb-2">
                Muscle Group
              </Text>
              <TextInput
                className="bg-gray-100 rounded-xl px-4 py-3 text-gray-900 border border-gray-200"
                placeholder="e.g., Legs, Chest, Full Body"
                value={muscleGroup}
                onChangeText={setMuscleGroup}
                maxLength={50}
              />
            </View>

            <View>
              <Text className="text-gray-700 font-medium mb-2">Equipment</Text>
              <TextInput
                className="bg-gray-100 rounded-xl px-4 py-3 text-gray-900 border border-gray-200"
                placeholder="e.g., Dumbbells, Bodyweight, Resistance Bands"
                value={equipment}
                onChangeText={setEquipment}
                maxLength={50}
              />
            </View>

            <View>
              <Text className="text-gray-700 font-medium mb-2">Difficulty</Text>
              <View className="flex-row flex-wrap gap-2">
                {["Beginner", "Intermediate", "Advanced"].map((diff) => (
                  <TouchableOpacity
                    key={diff}
                    onPress={() => setDifficulty(diff)}
                    className={`px-4 py-2 rounded-full ${
                      difficulty === diff ? "bg-blue-600" : "bg-gray-100"
                    }`}
                    activeOpacity={0.7}
                  >
                    <Text
                      className={
                        difficulty === diff ? "text-white" : "text-gray-700"
                      }
                    >
                      {diff}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View>
              <Text className="text-gray-700 font-medium mb-2">
                Description
              </Text>
              <TextInput
                className="bg-gray-100 rounded-xl px-4 py-3 text-gray-900 border border-gray-200 min-h-[100px]"
                placeholder="Describe the exercise..."
                value={description}
                onChangeText={setDescription}
                multiline
                textAlignVertical="top"
                maxLength={200}
              />
            </View>
          </View>
        </ScrollView>

        <View className="flex-row space-x-3 mt-6 pt-4 border-t border-gray-200">
          <TouchableOpacity
            className="flex-1 bg-gray-100 py-3 rounded-xl active:opacity-90"
            onPress={onClose}
            activeOpacity={0.7}
          >
            <Text className="text-center text-gray-700 font-semibold">
              Cancel
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 bg-blue-600 py-3 rounded-xl active:opacity-90"
            onPress={handleAdd}
            activeOpacity={0.7}
          >
            <Text className="text-center text-white font-semibold">
              Add Exercise
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

// Header Component
const Header = React.memo(
  ({
    onAddCustom,
    totalExercises,
  }: {
    onAddCustom: () => void;
    totalExercises: number;
  }) => (
    <View className="flex-row justify-between items-center mb-4">
      <View>
        <Text className="text-3xl font-bold text-gray-900">Exercises</Text>
        <Text className="text-gray-500 mt-1">
          {totalExercises} exercises available
        </Text>
      </View>
      <TouchableOpacity
        className="bg-gray-100 p-3 rounded-2xl active:opacity-90"
        onPress={onAddCustom}
        activeOpacity={0.7}
      >
        <Ionicons name="add" size={24} color="#4B5563" />
      </TouchableOpacity>
    </View>
  )
);

Header.displayName = "Header";

// Main Component
export default function ExercisesScreen() {
  const [showAddModal, setShowAddModal] = useState(false);
  const {
    exercises,
    isLoading: exercisesLoading,
    addExercise,
    deleteExercise,
  } = useExercises();
  const { toggleFavorite, removeFavorite, isFavorite } = useFavorites();
  const {
    searchQuery,
    setSearchQuery,
    selectedCategory,
    setSelectedCategory,
    categories,
    filteredExercises,
  } = useExerciseFilter(exercises, []);

  const handleDeleteExercise = useCallback(
    (exercise: Exercise) => {
      Alert.alert(
        "Delete Exercise",
        `Are you sure you want to delete "${exercise.name}"? This action cannot be undone.`,
        [
          {
            text: "Cancel",
            style: "cancel",
          },
          {
            text: "Delete",
            style: "destructive",
            onPress: async () => {
              try {
                await deleteExercise(exercise.id);
                // Also remove from favorites if it was favorited
                await removeFavorite(exercise.id);
                Alert.alert("Deleted", `"${exercise.name}" has been deleted.`);
              } catch (error) {
                Alert.alert(
                  "Error",
                  "Failed to delete exercise. Please try again."
                );
              }
            },
          },
        ]
      );
    },
    [deleteExercise, removeFavorite]
  );

  const showExerciseDetails = useCallback(
    (exercise: Exercise) => {
      const favoriteText = isFavorite(exercise.id)
        ? "Remove Favorite"
        : "Add to Favorites";

      const buttons: any[] = [{ text: "OK", style: "default" }];

      // Add favorite button
      buttons.push({
        text: favoriteText,
        onPress: async () => {
          const added = await toggleFavorite(exercise.id);
          Alert.alert(
            added ? "Added to Favorites" : "Removed from Favorites",
            added
              ? `${exercise.name} added to favorites!`
              : `${exercise.name} removed from favorites.`
          );
        },
      });

      // Add delete button for custom exercises
      if (exercise.isCustom) {
        buttons.push({
          text: "Delete",
          style: "destructive",
          onPress: () => handleDeleteExercise(exercise),
        });
      }

      Alert.alert(
        exercise.name,
        `${exercise.description}\n\n` +
          `Muscle Group: ${exercise.muscleGroup}\n` +
          `Equipment: ${exercise.equipment}\n` +
          `Difficulty: ${exercise.difficulty}`,
        buttons
      );
    },
    [toggleFavorite, isFavorite, handleDeleteExercise]
  );

  const handleAddCustomExercise = () => {
    setShowAddModal(true);
  };

  const handleAddExercise = async (exerciseData: Omit<Exercise, "id">) => {
    try {
      const newExercise = await addExercise(exerciseData);
      Alert.alert(
        "Success",
        `"${newExercise.name}" has been added to your exercises!`,
        [{ text: "OK", onPress: () => setShowAddModal(false) }]
      );
    } catch (error) {
      Alert.alert("Error", "Failed to add exercise. Please try again.");
    }
  };

  if (exercisesLoading) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 justify-center items-center">
        <View className="items-center">
          <Ionicons name="fitness" size={48} color="#3B82F6" />
          <Text className="text-gray-500 mt-4 text-lg">
            Loading exercises...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1">
        <View className="px-6 pt-6 pb-4 bg-white">
          <Header
            onAddCustom={handleAddCustomExercise}
            totalExercises={exercises.length}
          />

          <SearchBar
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search exercises, muscle groups..."
          />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            className="mt-4"
            contentContainerStyle={{ paddingRight: 24 }}
          >
            {categories.map((category) => (
              <CategoryButton
                key={category}
                category={category}
                isSelected={selectedCategory === category}
                onPress={() => setSelectedCategory(category)}
              />
            ))}
          </ScrollView>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 24 }}
        >
          <View className="px-6 mt-4">
            <View className="flex-row justify-between items-center mb-4">
              <Text className="text-xl font-bold text-gray-900">
                {selectedCategory === "All"
                  ? "All Exercises"
                  : selectedCategory}
              </Text>
              <Text className="text-gray-500">
                {filteredExercises.length}{" "}
                {filteredExercises.length === 1 ? "exercise" : "exercises"}
              </Text>
            </View>

            {filteredExercises.length === 0 ? (
              <View className="items-center justify-center py-12">
                <Ionicons name="search-outline" size={64} color="#D1D5DB" />
                <Text className="text-gray-500 text-lg mt-4">
                  No exercises found
                </Text>
                <Text className="text-gray-400 mt-2 text-center">
                  Try a different search or add a custom exercise
                </Text>
              </View>
            ) : (
              <View className="flex-row flex-wrap justify-between">
                {filteredExercises.map((exercise) => (
                  <ExerciseCard
                    key={exercise.id}
                    exercise={exercise}
                    isFavorite={isFavorite(exercise.id)}
                    onPress={() => showExerciseDetails(exercise)}
                    onToggleFavorite={() => toggleFavorite(exercise.id)}
                    onDelete={
                      exercise.isCustom
                        ? () => handleDeleteExercise(exercise)
                        : undefined
                    }
                  />
                ))}
              </View>
            )}

            <ProTipCard />
          </View>
        </ScrollView>
      </View>

      <AddExerciseModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAddExercise={handleAddExercise}
      />
    </SafeAreaView>
  );
}
