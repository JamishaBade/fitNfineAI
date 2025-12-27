import React, { useCallback, useState } from "react";
import { View, Text, SectionList, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";

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

/* ---------------- HELPERS ---------------- */

const STORAGE_KEY = "workoutHistory";

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
  const [stats, setStats] = useState({
    workouts: 0,
    hours: 0,
    calories: 0,
    streak: 0,
  });

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [])
  );

  const loadHistory = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (!raw) {
        setSections([]);
        return;
      }

      const workouts: StoredWorkout[] = JSON.parse(raw);

      calculateStats(workouts);
      setSections(groupWorkouts(workouts));
    } catch (e) {
      console.error("Failed to load history", e);
    }
  };

  const calculateStats = (workouts: StoredWorkout[]) => {
    const totalWorkouts = workouts.length;

    const totalMinutes = workouts.reduce((sum, w) => sum + w.duration, 0);

    const totalCalories = workouts.reduce((sum, w) => sum + w.calories, 0);

    const uniqueDays = new Set(
      workouts.map((w) => new Date(w.completedAt).toDateString())
    );

    setStats({
      workouts: totalWorkouts,
      hours: Math.round(totalMinutes / 60),
      calories: totalCalories,
      streak: uniqueDays.size,
    });
  };

  const clearAll = () => {
    Alert.alert("Clear History", "This will delete all workout history.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.removeItem(STORAGE_KEY);
          setSections([]);
          setStats({
            workouts: 0,
            hours: 0,
            calories: 0,
            streak: 0,
          });
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: StoredWorkout }) => (
    <View className="bg-white p-4 mx-6 mb-3 rounded-2xl border border-gray-100">
      <Text className="font-semibold text-lg">{item.name}</Text>

      <View className="flex-row mt-2 space-x-4">
        <Text className="text-gray-600">{item.duration} min</Text>
        <Text className="text-gray-600">{item.calories} cal</Text>
        <Text className="text-gray-600">{item.exercises} ex</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
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

      {/* LIST */}
      {sections.length > 0 ? (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          renderSectionHeader={({ section }) => (
            <View className="px-6 py-2 bg-gray-100">
              <Text className="font-semibold text-gray-700">
                {section.title}
              </Text>
            </View>
          )}
        />
      ) : (
        <View className="flex-1 items-center justify-center">
          <Text className="text-gray-500">No workouts yet</Text>
        </View>
      )}
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
