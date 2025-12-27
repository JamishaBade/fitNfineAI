import React from "react";
import { View, Text, Dimensions } from "react-native";
import { LineChart } from "react-native-chart-kit";
import * as shape from "d3-shape";

interface ProgressChartProps {
  data: number[];
  labels?: string[];
  title: string;
  unit: string;
  color?: string;
}

export const ProgressChart: React.FC<ProgressChartProps> = ({
  data,
  labels,
  title,
  unit,
  color = "#3B82F6",
}) => {
  const width = Dimensions.get("window").width - 48;

  if (data.length < 2) {
    return (
      <View className="bg-white rounded-2xl p-6 items-center justify-center h-40">
        <Text className="text-gray-500">Not enough data to show progress</Text>
        <Text className="text-gray-400 text-sm mt-1">Add more data points</Text>
      </View>
    );
  }

  const latestValue = data[data.length - 1];
  const previousValue = data[0];
  const difference = latestValue - previousValue;
  const percentageChange =
    previousValue !== 0 ? (difference / previousValue) * 100 : 0;

  return (
    <View className="bg-white rounded-2xl p-4 mb-4">
      <View className="flex-row justify-between items-center mb-4">
        <Text className="text-lg font-semibold text-gray-900">{title}</Text>
        <View className="flex-row items-center">
          <Text className="text-2xl font-bold text-gray-900 mr-2">
            {latestValue}
            {unit}
          </Text>
          <View
            className={`px-2 py-1 rounded ${
              difference >= 0 ? "bg-green-100" : "bg-red-100"
            }`}
          >
            <Text
              className={`text-xs font-medium ${
                difference >= 0 ? "text-green-700" : "text-red-700"
              }`}
            >
              {difference >= 0 ? "+" : ""}
              {percentageChange.toFixed(1)}%
            </Text>
          </View>
        </View>
      </View>

      <View className="h-40">
        <LineChart
          style={{ flex: 1 }}
          data={{
            labels: labels ?? data.map(() => ""),
            datasets: [
              {
                data: data,
                color: () => color,
                strokeWidth: 2,
              },
            ],
          }}
          width={width}
          height={160}
          chartConfig={{
            backgroundColor: "white",
            backgroundGradientFrom: "white",
            backgroundGradientTo: "white",
            color: () => color,
            strokeWidth: 2,
            propsForDots: { r: "0" },
          }}
          bezier
        />
      </View>

      {labels && labels.length > 0 && (
        <View className="flex-row justify-between mt-2">
          {labels.map((label, index) => (
            <Text key={index} className="text-xs text-gray-500">
              {label}
            </Text>
          ))}
        </View>
      )}
    </View>
  );
};
