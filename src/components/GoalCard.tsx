import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface GoalItemProps {
  goal: string;
  index: number;
  onComplete: (index: number) => void;
  onRemove: (index: number) => void;
}

export const GoalItem: React.FC<GoalItemProps> = ({
  goal,
  index,
  onComplete,
  onRemove,
}) => {
  return (
    <View className="bg-white rounded-2xl p-4 mb-3 shadow-sm border border-gray-100">
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center flex-1 mr-3">
          <View className="w-10 h-10 bg-blue-100 rounded-xl items-center justify-center mr-3">
            <Ionicons name="flag" size={20} color="#3B82F6" />
          </View>

          <Text className="font-medium text-gray-900 flex-1">{goal}</Text>
        </View>

        <View className="flex-row space-x-2">
          <TouchableOpacity
            className="w-10 h-10 bg-green-100 rounded-xl items-center justify-center"
            onPress={() => onComplete(index)}
          >
            <Ionicons name="checkmark" size={20} color="#10B981" />
          </TouchableOpacity>

          <TouchableOpacity
            className="w-10 h-10 bg-red-100 rounded-xl items-center justify-center"
            onPress={() => onRemove(index)}
          >
            <Ionicons name="trash" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};
