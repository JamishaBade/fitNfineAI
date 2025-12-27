import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
  Switch,
  TextInput,
  Modal,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useProfile } from "../../../../hooks/useProfile";
import { ProgressChart } from "../../../../components/ProgressRing";
import { AchievementBadge } from "../../../../components/AchievementCard";
import { GoalItem } from "../../../../components/GoalCard";
import { StatsCard } from "../../../../components/StatsCard";
import SignOutButton from "../../../../components/profile/SignOutButton";
export default function ProfileScreen() {
  const router = useRouter();
  const {
    profile,
    measurements,
    achievements,
    stats,
    settings,
    loading,
    updateProfile,
    addGoal,
    removeGoal,
    completeGoal,
    addMeasurement,
    updateSettings,
    logout,
    refreshData,
  } = useProfile();

  // Modal states
  const [editNameModal, setEditNameModal] = useState(false);
  const [editGoalModal, setEditGoalModal] = useState(false);
  const [addGoalModal, setAddGoalModal] = useState(false);
  const [addMeasurementModal, setAddMeasurementModal] = useState(false);
  const [viewAchievementsModal, setViewAchievementsModal] = useState(false);
  const [settingsModal, setSettingsModal] = useState(false);
  const [editEmailModal, setEditEmailModal] = useState(false);

  // Form states
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editWeeklyGoal, setEditWeeklyGoal] = useState("");
  const [newGoal, setNewGoal] = useState("");
  const [newMeasurement, setNewMeasurement] = useState({
    weight: "",
    chest: "",
    waist: "",
    hips: "",
    arms: "",
    legs: "",
    notes: "",
  });

  // Load data when component mounts
  useEffect(() => {
    if (profile) {
      setEditName(profile.name);
      setEditEmail(profile.email || "");
      setEditWeeklyGoal(profile.weeklyGoal.toString());
    }
  }, [profile]);

  // Profile actions
  const handleSaveName = async () => {
    if (editName.trim() && profile) {
      try {
        await updateProfile({ name: editName.trim() });
        setEditNameModal(false);
        Alert.alert("Success", "Name updated successfully!");
      } catch (error) {
        Alert.alert("Error", "Failed to update name");
      }
    }
  };

  // Add this with other profile action functions
  const handleSaveEmail = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!editEmail.trim()) {
      Alert.alert("Error", "Please enter an email address");
      return;
    }

    if (!emailRegex.test(editEmail.trim())) {
      Alert.alert("Error", "Please enter a valid email address");
      return;
    }

    if (profile) {
      try {
        await updateProfile({ email: editEmail.trim() });
        setEditEmailModal(false);
        Alert.alert("Success", "Email updated successfully!");
      } catch (error) {
        Alert.alert("Error", "Failed to update email");
      }
    }
  };

  const handleSaveWeeklyGoal = async () => {
    const goal = parseInt(editWeeklyGoal);
    if (goal > 0 && goal <= 14 && profile) {
      try {
        await updateProfile({ weeklyGoal: goal });
        setEditGoalModal(false);
        Alert.alert("Success", `Weekly goal set to ${goal} workouts!`);
      } catch (error) {
        Alert.alert("Error", "Failed to update goal");
      }
    } else {
      Alert.alert("Invalid Goal", "Please enter a number between 1 and 14");
    }
  };

  const handleAddGoal = async () => {
    if (newGoal.trim()) {
      try {
        await addGoal(newGoal.trim());
        setNewGoal("");
        setAddGoalModal(false);
      } catch (error) {
        Alert.alert("Error", "Failed to add goal");
      }
    }
  };

  const handleCompleteGoal = async (index: number) => {
    try {
      await completeGoal(index);
    } catch (error) {
      Alert.alert("Error", "Failed to complete goal");
    }
  };

  const handleRemoveGoal = async (index: number) => {
    Alert.alert("Remove Goal", "Are you sure you want to remove this goal?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: async () => {
          try {
            await removeGoal(index);
          } catch (error) {
            Alert.alert("Error", "Failed to remove goal");
          }
        },
      },
    ]);
  };

  const handleAddMeasurement = async () => {
    const weight = parseFloat(newMeasurement.weight);
    if (!weight || weight <= 0) {
      Alert.alert("Invalid Weight", "Please enter a valid weight");
      return;
    }

    try {
      await addMeasurement({
        weight,
        chest: newMeasurement.chest
          ? parseFloat(newMeasurement.chest)
          : undefined,
        waist: newMeasurement.waist
          ? parseFloat(newMeasurement.waist)
          : undefined,
        hips: newMeasurement.hips ? parseFloat(newMeasurement.hips) : undefined,
        arms: newMeasurement.arms ? parseFloat(newMeasurement.arms) : undefined,
        legs: newMeasurement.legs ? parseFloat(newMeasurement.legs) : undefined,
        notes: newMeasurement.notes || undefined,
      });

      setNewMeasurement({
        weight: "",
        chest: "",
        waist: "",
        hips: "",
        arms: "",
        legs: "",
        notes: "",
      });
      setAddMeasurementModal(false);
    } catch (error) {
      Alert.alert("Error", "Failed to save measurement");
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          try {
            await logout();
            router.replace("/sign-in");
          } catch (error) {
            Alert.alert("Error", "Failed to logout");
          }
        },
      },
    ]);
  };

  // Prepare data for charts
  const weightData = measurements
    .slice(0, 10)
    .reverse()
    .map((m) => m.weight);

  const weightLabels = measurements
    .slice(0, 10)
    .reverse()
    .map((m, index) => {
      const date = new Date(m.date);
      return index === 0 || index === 9
        ? `${date.getMonth() + 1}/${date.getDate()}`
        : "";
    });

  const profileOptions = [
    {
      title: "Edit Profile",
      icon: "person-outline",
      action: () => setEditNameModal(true),
      color: "bg-blue-500",
    },
    {
      title: "Edit Email",
      icon: "mail-outline",
      action: () => setEditEmailModal(true),
      color: "bg-green-500",
    },
    {
      title: "Body Measurements",
      icon: "body-outline",
      action: () => setAddMeasurementModal(true),
      color: "bg-purple-500",
    },
    {
      title: "Achievements",
      icon: "trophy-outline",
      action: () => setViewAchievementsModal(true),
      color: "bg-yellow-500",
    },
    {
      title: "Settings",
      icon: "settings-outline",
      action: () => setSettingsModal(true),
      color: "bg-gray-500",
    },
    {
      title: "Export Data",
      icon: "download-outline",
      action: () => Alert.alert("Export", "Data export feature coming soon!"),
      color: "bg-green-500",
    },
    {
      title: "Help & Support",
      icon: "help-circle-outline",
      action: () => Alert.alert("Help", "Contact: support@fitnessapp.com"),
      color: "bg-indigo-500",
    },
  ];

  if (loading || !profile || !stats) {
    return (
      <SafeAreaView className="flex-1 bg-gray-50 items-center justify-center">
        <ActivityIndicator size="large" color="#3B82F6" />
        <Text className="text-gray-600 mt-4">Loading profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        <View>
          <SignOutButton />
        </View>
        <View className="px-6 pt-6 pb-4 bg-white">
          <View className="flex-row items-center">
            <View className="relative">
              <Image
                source={{
                  uri:
                    profile.profileImage || "https://via.placeholder.com/100",
                }}
                className="w-24 h-24 rounded-full bg-gray-200"
              />
              <TouchableOpacity
                className="absolute bottom-0 right-0 bg-blue-500 w-8 h-8 rounded-full items-center justify-center border-2 border-white"
                onPress={() =>
                  Alert.alert(
                    "Change Photo",
                    "Profile photo feature coming soon!"
                  )
                }
              >
                <Ionicons name="camera" size={16} color="white" />
              </TouchableOpacity>
            </View>

            <View className="ml-6 flex-1">
              <Text className="text-2xl font-bold text-gray-900">
                {profile.name}
              </Text>
              <TouchableOpacity
                onPress={() => setEditEmailModal(true)}
                className="mt-1"
              >
                <View className="flex-row items-center">
                  <Text className="text-gray-500">{profile.email}</Text>
                  <Ionicons
                    name="pencil"
                    size={14}
                    color="#9CA3AF"
                    className="ml-2"
                  />
                </View>
              </TouchableOpacity>
              <View className="flex-row items-center mt-2">
                <View className="bg-blue-100 px-3 py-1 rounded-full">
                  <Text className="text-blue-700 text-sm font-medium">
                    {profile.fitnessLevel.charAt(0).toUpperCase() +
                      profile.fitnessLevel.slice(1)}
                  </Text>
                </View>
                <Text className="text-gray-600 ml-3">
                  {profile.height}cm • {profile.weight}kg
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Stats Overview */}
        <View className="px-6 mt-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-gray-900">Your Stats</Text>
            <TouchableOpacity onPress={refreshData} className="p-2">
              <Ionicons name="refresh" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <View className="flex-row flex-wrap justify-between">
            <View className="w-[48%] mb-4">
              <StatsCard
                title="Workouts"
                value={stats.totalWorkouts}
                icon="barbell"
                color="#3B82F6"
                change={
                  stats.thisWeekWorkouts > 0
                    ? `${stats.thisWeekWorkouts} this week`
                    : undefined
                }
                trend={stats.thisWeekWorkouts > 0 ? "up" : "neutral"}
              />
            </View>

            <View className="w-[48%] mb-4">
              <StatsCard
                title="Streak"
                value={stats.streak}
                icon="flame"
                color="#EF4444"
                trend="up"
              />
            </View>

            <View className="w-[48%]">
              <StatsCard
                title="Calories"
                value={`${Math.round(stats.totalCalories / 1000)}k`}
                icon="flame"
                color="#F59E0B"
                change="Total burned"
              />
            </View>
            <View className="w-[48%]">
              <StatsCard
                title="Weekly Goal"
                value={`${stats.weeklyGoalProgress}%`}
                icon="flag"
                color="#10B981"
                change={`${stats.thisWeekWorkouts}/${profile.weeklyGoal}`}
                trend={
                  stats.weeklyGoalProgress >= 100
                    ? "up"
                    : stats.weeklyGoalProgress > 50
                    ? "neutral"
                    : "down"
                }
              />
            </View>
          </View>
        </View>

        {/* Weight Progress Chart */}
        {measurements.length > 1 && (
          <View className="px-6 mt-6">
            <Text className="text-xl font-bold text-gray-900 mb-4">
              Weight Progress
            </Text>
            <ProgressChart
              data={weightData}
              labels={weightLabels}
              title="Weight"
              unit="kg"
              color="#EF4444"
            />
          </View>
        )}

        {/* Fitness Goals */}
        <View className="px-6 mt-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-gray-900">
              Fitness Goals
            </Text>
            <View className="flex-row space-x-2">
              <TouchableOpacity
                onPress={() => setEditGoalModal(true)}
                className="bg-gray-100 p-2 rounded-lg"
              >
                <Ionicons name="pencil" size={18} color="#4B5563" />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setAddGoalModal(true)}
                className="bg-blue-100 p-2 rounded-lg"
              >
                <Ionicons name="add" size={18} color="#3B82F6" />
              </TouchableOpacity>
            </View>
          </View>

          {profile.goals.length > 0 ? (
            profile.goals.map((goal, index) => (
              <GoalItem
                key={index}
                goal={goal}
                index={index}
                onComplete={handleCompleteGoal}
                onRemove={handleRemoveGoal}
              />
            ))
          ) : (
            <View className="bg-white rounded-2xl p-6 items-center">
              <Ionicons name="flag" size={48} color="#9CA3AF" />
              <Text className="text-lg font-semibold text-gray-900 mt-3">
                No goals set
              </Text>
              <Text className="text-gray-500 text-center mt-1">
                Add goals to track your fitness journey
              </Text>
              <TouchableOpacity
                className="bg-blue-600 px-6 py-3 rounded-xl mt-4"
                onPress={() => setAddGoalModal(true)}
              >
                <Text className="text-white font-semibold">
                  Add Your First Goal
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Recent Achievements */}
        <View className="px-6 mt-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-xl font-bold text-gray-900">
              Recent Achievements
            </Text>
            <TouchableOpacity
              onPress={() => setViewAchievementsModal(true)}
              className="flex-row items-center"
            >
              <Text className="text-blue-600 font-medium mr-1">View All</Text>
              <Ionicons name="chevron-forward" size={16} color="#3B82F6" />
            </TouchableOpacity>
          </View>

          <View>
            {achievements
              .filter((a) => a.unlocked)
              .slice(0, 3)
              .map((achievement) => (
                <AchievementBadge
                  key={achievement.id}
                  title={achievement.title}
                  description={achievement.description}
                  icon={achievement.icon}
                  unlocked={achievement.unlocked}
                  progress={achievement.progress}
                  totalRequired={achievement.totalRequired}
                  onPress={() =>
                    Alert.alert(
                      achievement.title,
                      achievement.description +
                        (achievement.unlockedAt
                          ? `\n\nUnlocked on: ${new Date(
                              achievement.unlockedAt
                            ).toLocaleDateString()}`
                          : "")
                    )
                  }
                />
              ))}

            {achievements.filter((a) => a.unlocked).length === 0 && (
              <View className="bg-white rounded-2xl p-6 items-center">
                <Ionicons name="trophy" size={48} color="#9CA3AF" />
                <Text className="text-lg font-semibold text-gray-900 mt-3">
                  No achievements yet
                </Text>
                <Text className="text-gray-500 text-center mt-1">
                  Complete workouts to unlock achievements
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Profile Options */}
        <View className="px-6 mt-6 mb-8">
          <Text className="text-xl font-bold text-gray-900 mb-4">Profile</Text>

          <View className="bg-white rounded-2xl overflow-hidden">
            {profileOptions.map((option, index) => (
              <React.Fragment key={index}>
                <TouchableOpacity
                  className="flex-row items-center justify-between p-4"
                  onPress={
                    option.title === "Logout" ? handleLogout : option.action
                  }
                >
                  <View className="flex-row items-center">
                    <View className={`${option.color} p-3 rounded-xl mr-4`}>
                      <Ionicons
                        name={option.icon as any}
                        size={20}
                        color="white"
                      />
                    </View>
                    <Text
                      className={`font-medium ${
                        option.title === "Logout"
                          ? "text-red-600"
                          : "text-gray-900"
                      }`}
                    >
                      {option.title}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={20}
                    color={option.title === "Logout" ? "#EF4444" : "#9CA3AF"}
                  />
                </TouchableOpacity>

                {index < profileOptions.length - 1 && (
                  <View className="h-px bg-gray-100 mx-4" />
                )}
              </React.Fragment>
            ))}
          </View>
        </View>

        {/* BMI Information */}
        {stats.bmi && (
          <View className="px-6 mb-8">
            <View className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-5">
              <View className="flex-row justify-between items-center mb-3">
                <Text className="text-lg font-bold text-gray-900">
                  Body Mass Index
                </Text>
                <View
                  className={`px-3 py-1 rounded-full ${
                    stats.bmiCategory === "Normal"
                      ? "bg-green-100"
                      : stats.bmiCategory === "Underweight"
                      ? "bg-yellow-100"
                      : stats.bmiCategory === "Overweight"
                      ? "bg-orange-100"
                      : "bg-red-100"
                  }`}
                >
                  <Text
                    className={`text-sm font-medium ${
                      stats.bmiCategory === "Normal"
                        ? "text-green-700"
                        : stats.bmiCategory === "Underweight"
                        ? "text-yellow-700"
                        : stats.bmiCategory === "Overweight"
                        ? "text-orange-700"
                        : "text-red-700"
                    }`}
                  >
                    {stats.bmiCategory}
                  </Text>
                </View>
              </View>
              <Text className="text-3xl font-bold text-gray-900">
                {stats.bmi}
              </Text>
              <Text className="text-gray-600 mt-2">
                BMI between 18.5 and 24.9 is considered healthy
              </Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Edit Name Modal */}
      <Modal
        visible={editNameModal}
        transparent
        animationType="slide"
        onRequestClose={() => setEditNameModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-6">
          <View className="bg-white rounded-2xl w-full max-w-md p-6">
            <Text className="text-xl font-bold text-gray-900 mb-4">
              Edit Name
            </Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 mb-4 text-gray-900"
              value={editName}
              onChangeText={setEditName}
              placeholder="Enter your name"
              placeholderTextColor="#9CA3AF"
              autoFocus
            />
            <View className="flex-row justify-end space-x-3">
              <TouchableOpacity
                className="px-5 py-2.5 rounded-lg"
                onPress={() => setEditNameModal(false)}
              >
                <Text className="text-gray-600 font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-blue-600 px-5 py-2.5 rounded-lg"
                onPress={handleSaveName}
              >
                <Text className="text-white font-medium">Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Email Modal */}
      <Modal
        visible={editEmailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setEditEmailModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-6">
          <View className="bg-white rounded-2xl w-full max-w-md p-6">
            <Text className="text-xl font-bold text-gray-900 mb-4">
              Edit Email
            </Text>
            <Text className="text-gray-600 mb-2">
              Enter your new email address. This will be used for login and
              notifications.
            </Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 mb-4 text-gray-900"
              value={editEmail}
              onChangeText={setEditEmail}
              placeholder="Enter your email"
              placeholderTextColor="#9CA3AF"
              autoFocus
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <View className="flex-row justify-end space-x-3">
              <TouchableOpacity
                className="px-5 py-2.5 rounded-lg"
                onPress={() => setEditEmailModal(false)}
              >
                <Text className="text-gray-600 font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-blue-600 px-5 py-2.5 rounded-lg"
                onPress={handleSaveEmail}
              >
                <Text className="text-white font-medium">Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Weekly Goal Modal */}
      <Modal
        visible={editGoalModal}
        transparent
        animationType="slide"
        onRequestClose={() => setEditGoalModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-6">
          <View className="bg-white rounded-2xl w-full max-w-md p-6">
            <Text className="text-xl font-bold text-gray-900 mb-4">
              Edit Weekly Goal
            </Text>
            <Text className="text-gray-600 mb-4">
              How many workouts do you want to complete per week?
            </Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 mb-4 text-gray-900"
              value={editWeeklyGoal}
              onChangeText={setEditWeeklyGoal}
              placeholder="Workouts per week"
              placeholderTextColor="#9CA3AF"
              keyboardType="numeric"
              autoFocus
            />
            <View className="flex-row justify-end space-x-3">
              <TouchableOpacity
                className="px-5 py-2.5 rounded-lg"
                onPress={() => setEditGoalModal(false)}
              >
                <Text className="text-gray-600 font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-blue-600 px-5 py-2.5 rounded-lg"
                onPress={handleSaveWeeklyGoal}
              >
                <Text className="text-white font-medium">Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Goal Modal */}
      <Modal
        visible={addGoalModal}
        transparent
        animationType="slide"
        onRequestClose={() => setAddGoalModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-center items-center p-6">
          <View className="bg-white rounded-2xl w-full max-w-md p-6">
            <Text className="text-xl font-bold text-gray-900 mb-4">
              Add New Goal
            </Text>
            <TextInput
              className="border border-gray-300 rounded-xl px-4 py-3 mb-4 text-gray-900"
              value={newGoal}
              onChangeText={setNewGoal}
              placeholder="Enter your fitness goal"
              placeholderTextColor="#9CA3AF"
              autoFocus
              multiline
              numberOfLines={3}
            />
            <View className="flex-row justify-end space-x-3">
              <TouchableOpacity
                className="px-5 py-2.5 rounded-lg"
                onPress={() => setAddGoalModal(false)}
              >
                <Text className="text-gray-600 font-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                className="bg-blue-600 px-5 py-2.5 rounded-lg"
                onPress={handleAddGoal}
              >
                <Text className="text-white font-medium">Add Goal</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add Measurement Modal */}
      <Modal
        visible={addMeasurementModal}
        transparent
        animationType="slide"
        onRequestClose={() => setAddMeasurementModal(false)}
      >
        <ScrollView className="flex-1 bg-black/50">
          <View className="min-h-full justify-center items-center p-6">
            <View className="bg-white rounded-2xl w-full max-w-md p-6">
              <Text className="text-xl font-bold text-gray-900 mb-4">
                Body Measurements
              </Text>

              <Text className="text-gray-600 mb-4">Weight (kg)*</Text>
              <TextInput
                className="border border-gray-300 rounded-xl px-4 py-3 mb-4 text-gray-900"
                value={newMeasurement.weight}
                onChangeText={(text) =>
                  setNewMeasurement({ ...newMeasurement, weight: text })
                }
                placeholder="e.g., 70.5"
                placeholderTextColor="#9CA3AF"
                keyboardType="decimal-pad"
              />

              <Text className="text-gray-600 mb-2">
                Optional Measurements (cm)
              </Text>
              <View className="space-y-3 mb-4">
                <View className="flex-row space-x-3">
                  <View className="flex-1">
                    <Text className="text-gray-600 text-sm mb-1">Chest</Text>
                    <TextInput
                      className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                      value={newMeasurement.chest}
                      onChangeText={(text) =>
                        setNewMeasurement({ ...newMeasurement, chest: text })
                      }
                      placeholder="Chest"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-600 text-sm mb-1">Waist</Text>
                    <TextInput
                      className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                      value={newMeasurement.waist}
                      onChangeText={(text) =>
                        setNewMeasurement({ ...newMeasurement, waist: text })
                      }
                      placeholder="Waist"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                <View className="flex-row space-x-3">
                  <View className="flex-1">
                    <Text className="text-gray-600 text-sm mb-1">Hips</Text>
                    <TextInput
                      className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                      value={newMeasurement.hips}
                      onChangeText={(text) =>
                        setNewMeasurement({ ...newMeasurement, hips: text })
                      }
                      placeholder="Hips"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="decimal-pad"
                    />
                  </View>
                  <View className="flex-1">
                    <Text className="text-gray-600 text-sm mb-1">Arms</Text>
                    <TextInput
                      className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                      value={newMeasurement.arms}
                      onChangeText={(text) =>
                        setNewMeasurement({ ...newMeasurement, arms: text })
                      }
                      placeholder="Arms"
                      placeholderTextColor="#9CA3AF"
                      keyboardType="decimal-pad"
                    />
                  </View>
                </View>

                <View>
                  <Text className="text-gray-600 text-sm mb-1">Legs</Text>
                  <TextInput
                    className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                    value={newMeasurement.legs}
                    onChangeText={(text) =>
                      setNewMeasurement({ ...newMeasurement, legs: text })
                    }
                    placeholder="Legs"
                    placeholderTextColor="#9CA3AF"
                    keyboardType="decimal-pad"
                  />
                </View>

                <View>
                  <Text className="text-gray-600 text-sm mb-1">Notes</Text>
                  <TextInput
                    className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                    value={newMeasurement.notes}
                    onChangeText={(text) =>
                      setNewMeasurement({ ...newMeasurement, notes: text })
                    }
                    placeholder="Any notes..."
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </View>

              <View className="flex-row justify-end space-x-3">
                <TouchableOpacity
                  className="px-5 py-2.5 rounded-lg"
                  onPress={() => setAddMeasurementModal(false)}
                >
                  <Text className="text-gray-600 font-medium">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  className="bg-blue-600 px-5 py-2.5 rounded-lg"
                  onPress={handleAddMeasurement}
                >
                  <Text className="text-white font-medium">Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </Modal>

      {/* Achievements Modal */}
      <Modal
        visible={viewAchievementsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setViewAchievementsModal(false)}
      >
        <View className="flex-1 bg-black/50">
          <View className="flex-1 mt-20 bg-white rounded-t-3xl">
            <View className="p-6 border-b border-gray-200">
              <View className="flex-row justify-between items-center">
                <Text className="text-2xl font-bold text-gray-900">
                  Achievements
                </Text>
                <TouchableOpacity
                  onPress={() => setViewAchievementsModal(false)}
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <Text className="text-gray-600 mt-2">
                {achievements.filter((a) => a.unlocked).length} of{" "}
                {achievements.length} unlocked
              </Text>
            </View>

            <ScrollView className="p-6">
              {achievements.map((achievement) => (
                <AchievementBadge
                  key={achievement.id}
                  title={achievement.title}
                  description={achievement.description}
                  icon={achievement.icon}
                  unlocked={achievement.unlocked}
                  progress={achievement.progress}
                  totalRequired={achievement.totalRequired}
                  onPress={() => {}}
                />
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Settings Modal */}
      <Modal
        visible={settingsModal}
        transparent
        animationType="slide"
        onRequestClose={() => setSettingsModal(false)}
      >
        <View className="flex-1 bg-black/50">
          <View className="flex-1 mt-20 bg-white rounded-t-3xl">
            <View className="p-6 border-b border-gray-200">
              <View className="flex-row justify-between items-center">
                <Text className="text-2xl font-bold text-gray-900">
                  Settings
                </Text>
                <TouchableOpacity onPress={() => setSettingsModal(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView className="p-6">
              <View className="bg-gray-50 rounded-2xl p-4 mb-4">
                <Text className="text-lg font-semibold text-gray-900 mb-3">
                  Notifications
                </Text>
                <View className="flex-row items-center justify-between">
                  <View>
                    <Text className="text-gray-900">Workout Reminders</Text>
                    <Text className="text-gray-500 text-sm">
                      Get notified about your workouts
                    </Text>
                  </View>
                  <Switch
                    value={settings.notifications}
                    onValueChange={(value) =>
                      updateSettings({ ...settings, notifications: value })
                    }
                    trackColor={{ false: "#D1D5DB", true: "#93C5FD" }}
                    thumbColor={settings.notifications ? "#3B82F6" : "#F3F4F6"}
                  />
                </View>
              </View>

              <TouchableOpacity
                className="bg-red-50 rounded-2xl p-4 items-center"
                onPress={handleLogout}
              >
                <Text className="text-red-600 font-semibold">Logout</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
