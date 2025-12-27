import { useSignIn } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  ActivityIndicator,
} from "react-native";
import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";

export default function Page() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();
  const [isLoading, setIsLoading] = React.useState(false);
  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [errors, setErrors] = React.useState([]);

  // Clear errors when user starts typing
  const clearErrors = () => {
    setErrors([]);
  };

  // Handle the submission of the sign-in form
  const onSignInPress = async () => {
    if (!isLoaded) return;

    setIsLoading(true);
    setErrors([]);

    // Basic validation
    if (!emailAddress || !password) {
      setErrors([{ message: "Please enter both email and password" }]);
      setIsLoading(false);
      return;
    }

    try {
      const signInAttempt = await signIn.create({
        identifier: emailAddress.trim(),
        password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
        router.replace("/");
      } else {
        setErrors([{ message: "Sign in incomplete. Please try again." }]);
      }
    } catch (err) {
      console.error("Sign in error:", JSON.stringify(err, null, 2));

      if (err.errors) {
        setErrors(err.errors);
      } else {
        setErrors([
          { message: "An unexpected error occurred. Please try again." },
        ]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Get specific error message for a field
  const getFieldError = (fieldName) => {
    return errors.find((error) => error.meta?.paramName === fieldName);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        {/* Header Section */}
        <View className="flex-1 justify-center px-6">
          <View className="items-center mb-10">
            <View className="w-24 h-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl items-center justify-center mb-4 shadow-lg">
              <Ionicons name="fitness" size={48} color="black" />
            </View>
            <Text className="text-3xl font-bold text-gray-900 mb-2">
              fitNfine
            </Text>
            <Text className="text-lg text-gray-600 text-center">
              Track your fitness journey{"\n"}and reach your goals
            </Text>
          </View>
        </View>

        {/* Sign in form */}
        <View className="px-6 pb-8">
          <View className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mb-6">
            <Text className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Welcome
            </Text>

            {/* Error Display */}
            {errors.length > 0 && (
              <View className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                {errors.map((error, index) => (
                  <Text key={index} className="text-red-600 text-sm">
                    {error.message}
                  </Text>
                ))}
              </View>
            )}

            {/* Email Input */}
            <View className="mb-4">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Email
              </Text>
              <View
                className={`flex-row items-center bg-gray-50 rounded-xl px-4 py-3 border ${
                  getFieldError("identifier") || getFieldError("email_address")
                    ? "border-red-300"
                    : "border-gray-300"
                }`}
              >
                <Ionicons name="mail-outline" size={20} color="#6B7280" />
                <TextInput
                  autoCapitalize="none"
                  value={emailAddress}
                  placeholder="Enter your email"
                  placeholderTextColor="#9CA3AF"
                  onChangeText={(text) => {
                    setEmailAddress(text);
                    clearErrors();
                  }}
                  className="flex-1 ml-3 text-gray-900 text-base"
                  editable={!isLoading}
                  keyboardType="email-address"
                  autoComplete="email"
                />
              </View>
              {(getFieldError("identifier") ||
                getFieldError("email_address")) && (
                <Text className="text-red-500 text-xs mt-1">
                  {
                    (
                      getFieldError("identifier") ||
                      getFieldError("email_address")
                    ).message
                  }
                </Text>
              )}
            </View>

            {/* Password Input */}
            <View className="mb-6">
              <Text className="text-sm font-medium text-gray-700 mb-2">
                Password
              </Text>
              <View
                className={`flex-row items-center bg-gray-50 rounded-xl px-4 py-3 border ${
                  getFieldError("password")
                    ? "border-red-300"
                    : "border-gray-300"
                }`}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color="#6B7280"
                />
                <TextInput
                  value={password}
                  placeholder="Enter your password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  onChangeText={(text) => {
                    setPassword(text);
                    clearErrors();
                  }}
                  className="flex-1 ml-3 text-gray-900 text-base"
                  editable={!isLoading}
                  autoComplete="current-password"
                />
              </View>
              {getFieldError("password") && (
                <Text className="text-red-500 text-xs mt-1">
                  {getFieldError("password").message}
                </Text>
              )}
            </View>

            {/* Forgot Password Link */}
            <Link href="/reset-password" asChild>
              <TouchableOpacity className="mb-6">
                <Text className="text-blue-600 font-semibold text-right">
                  Forgot Password?
                </Text>
              </TouchableOpacity>
            </Link>

            {/* Sign in button */}
            <TouchableOpacity
              onPress={onSignInPress}
              disabled={isLoading}
              className={`rounded-xl py-4 shadow-sm mb-4 ${
                isLoading ? "bg-gray-400" : "bg-blue-600"
              }`}
              activeOpacity={0.8}
            >
              <View className="flex-row items-center justify-center">
                {isLoading ? (
                  <ActivityIndicator
                    size="small"
                    color="white"
                    className="mr-2"
                  />
                ) : (
                  <Ionicons
                    name="log-in-outline"
                    size={20}
                    color="white"
                    className="mr-2"
                  />
                )}
                <Text className="text-white font-semibold text-lg">
                  {isLoading ? "Signing In..." : "Continue"}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Sign up link */}
            <View className="flex-row justify-center items-center mt-4">
              <Text className="text-gray-600">Don't have an account? </Text>
              <Link href="/sign-up" asChild>
                <TouchableOpacity>
                  <Text className="text-blue-600 font-semibold">Sign up</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
