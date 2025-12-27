// src/components/ActiveWorkoutTimer.tsx
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface ActiveWorkoutTimerProps {
  time: number;
  isResting: boolean;
  currentExercise?: string;
  currentSet: number;
  totalSets: number;
  onPause: () => void;
  onSkipRest: () => void;
  onCompleteSet: () => void;
  isPaused?: boolean;
  onResume?: () => void;
  onCancel?: () => void;
}

export const ActiveWorkoutTimer: React.FC<ActiveWorkoutTimerProps> = ({
  time,
  isResting,
  currentExercise = "Exercise",
  currentSet,
  totalSets,
  onPause,
  onSkipRest,
  onCompleteSet,
  isPaused = false,
  onResume,
  onCancel,
}) => {
  const formatTime = (seconds: number) => {
    const safeSeconds = Math.max(0, Math.floor(seconds));
    const mins = Math.floor(safeSeconds / 60);
    const secs = safeSeconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const getBackgroundColor = () => {
    if (isPaused) return "#374151"; // gray-800
    if (isResting) return "#F97316"; // orange-500
    return "#2563EB"; // blue-600
  };

  const getStatusText = () => {
    if (isPaused) return "Paused";
    if (isResting) return "Rest Time";
    return "Exercise Time";
  };

  return (
    <View
      className="rounded-3xl p-6 shadow-lg"
      style={{ backgroundColor: getBackgroundColor() }}
    >
      {/* Timer Display */}
      <View className="items-center mb-6">
        <Text className="text-6xl font-bold text-white">
          {formatTime(time)}
        </Text>
        <Text className="text-lg mt-2 text-white" style={{ opacity: 0.9 }}>
          {getStatusText()}
        </Text>
      </View>

      {/* Exercise Info */}
      <View className="mb-6">
        <Text className="text-xl font-bold text-white">
          {currentExercise || "Exercise"}
        </Text>
        <Text className="text-white" style={{ opacity: 0.9 }}>
          Set {currentSet} of {totalSets}
        </Text>
      </View>

      {/* Control Buttons */}
      {isPaused ? (
        // Paused State Buttons
        <View style={styles.buttonRow}>
          {onResume && (
            <TouchableOpacity
              className="flex-1 bg-green-600 p-4 rounded-xl items-center"
              onPress={onResume}
              activeOpacity={0.7}
              style={{ marginRight: 6 }}
            >
              <Ionicons name="play" size={24} color="white" />
              <Text className="text-white font-semibold mt-1">Resume</Text>
            </TouchableOpacity>
          )}
          {onCancel && (
            <TouchableOpacity
              className="flex-1 bg-red-600 p-4 rounded-xl items-center"
              onPress={onCancel}
              activeOpacity={0.7}
              style={{ marginLeft: 6 }}
            >
              <Ionicons name="close" size={24} color="white" />
              <Text className="text-white font-semibold mt-1">Cancel</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        // Active State Buttons
        <View style={styles.buttonRow}>
          <TouchableOpacity
            className="flex-1 p-4 rounded-xl items-center"
            style={[styles.buttonTransparent, { marginRight: 6 }]}
            onPress={onPause}
            activeOpacity={0.7}
          >
            <Ionicons name="pause" size={24} color="white" />
            <Text className="text-white font-semibold mt-1">Pause</Text>
          </TouchableOpacity>

          {isResting ? (
            <TouchableOpacity
              className="flex-1 p-4 rounded-xl items-center"
              style={[styles.buttonTransparent, { marginLeft: 6 }]}
              onPress={onSkipRest}
              activeOpacity={0.7}
            >
              <Ionicons name="play-skip-forward" size={24} color="white" />
              <Text className="text-white font-semibold mt-1">Skip Rest</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              className="flex-1 bg-green-600 p-4 rounded-xl items-center"
              onPress={onCompleteSet}
              activeOpacity={0.7}
              style={{ marginLeft: 6 }}
            >
              <Ionicons name="checkmark" size={24} color="white" />
              <Text className="text-white font-semibold mt-1">
                Complete Set
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  buttonRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonTransparent: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
});
