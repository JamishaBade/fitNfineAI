import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface AchievementBadgeProps {
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  progress?: number;
  totalRequired?: number;
  onPress?: () => void;
}

export const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  title,
  description,
  icon,
  unlocked,
  progress = 0,
  totalRequired = 1,
  onPress,
}) => {
  const progressPercentage = (progress / totalRequired) * 100;

  return (
    <TouchableOpacity
      className={`rounded-2xl p-4 mb-3 ${
        unlocked
          ? "bg-gradient-to-r from-yellow-50 to-amber-50 border border-yellow-200"
          : "bg-gray-50 border border-gray-200"
      }`}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View className="flex-row items-center">
        <View
          className={`w-12 h-12 rounded-xl items-center justify-center mr-4 ${
            unlocked ? "bg-yellow-100" : "bg-gray-200"
          }`}
        >
          <Ionicons
            name={icon as any}
            size={24}
            color={unlocked ? "#F59E0B" : "#9CA3AF"}
          />
        </View>

        <View className="flex-1">
          <Text
            className={`font-semibold text-base ${
              unlocked ? "text-gray-900" : "text-gray-500"
            }`}
          >
            {title}
          </Text>
          <Text
            className={`text-sm mt-1 ${
              unlocked ? "text-gray-600" : "text-gray-400"
            }`}
          >
            {description}
          </Text>

          {!unlocked && totalRequired > 1 && (
            <View className="mt-3">
              <View className="w-full bg-gray-200 rounded-full h-2">
                <View
                  className={`rounded-full h-2 ${
                    progressPercentage >= 100 ? "bg-green-500" : "bg-blue-500"
                  }`}
                  style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                />
              </View>
              <Text className="text-xs text-gray-500 mt-1">
                {progress}/{totalRequired} ({Math.round(progressPercentage)}%)
              </Text>
            </View>
          )}

          {unlocked && (
            <View className="flex-row items-center mt-2">
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text className="text-green-600 text-xs font-medium ml-1">
                Unlocked
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};
