import React from "react";
import { View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  change?: string;
  trend?: "up" | "down" | "neutral";
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  icon,
  color,
  change,
  trend = "neutral",
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case "up":
        return "trending-up";
      case "down":
        return "trending-down";
      default:
        return "remove";
    }
  };

  const getTrendColor = () => {
    switch (trend) {
      case "up":
        return "text-green-600";
      case "down":
        return "text-red-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <View className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
      <View className="flex-row justify-between items-center mb-3">
        <View
          style={{ backgroundColor: `${color}20` }}
          className="p-3 rounded-xl"
        >
          <Ionicons name={icon as any} size={24} color={color} />
        </View>

        {change && (
          <View className="flex-row items-center">
            <Ionicons
              name={getTrendIcon()}
              size={10}
              color={
                trend === "up"
                  ? "#10B981"
                  : trend === "down"
                  ? "#EF4444"
                  : "#6B7280"
              }
            />
            <Text className={`text-xs font-medium ml-1 ${getTrendColor()}`}>
              {change}
            </Text>
          </View>
        )}
      </View>

      <Text className="text-2xl font-bold text-gray-900">{value}</Text>
      <Text className="text-gray-500 mt-1">{title}</Text>
    </View>
  );
};
