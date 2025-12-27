import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSignIn } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function ResetPasswordScreen() {
  const { signIn, setActive, isLoaded } = useSignIn();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [successfulCreation, setSuccessfulCreation] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);
  const [currentSignIn, setCurrentSignIn] = useState(null);

  if (!isLoaded) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" color="blue" />
      </View>
    );
  }

  // Clear errors when user starts typing
  const clearErrors = () => {
    setErrors([]);
  };

  // Step 1: Send reset email
  const sendResetCode = async () => {
    if (!emailAddress.trim()) {
      setErrors([{ message: "Please enter your email address" }]);
      return;
    }

    try {
      setLoading(true);
      setErrors([]);

      // Create sign-in attempt first
      const signInAttempt = await signIn.create({
        identifier: emailAddress.trim(),
      });

      // Find the reset factor
      const resetFactor = signInAttempt.supportedFirstFactors?.find(
        (factor) => factor.strategy === "reset_password_email_code"
      );

      if (!resetFactor) {
        throw new Error("Password reset not available for this email");
      }

      // Prepare the reset with emailAddressId
      await signInAttempt.prepareFirstFactor({
        strategy: "reset_password_email_code",
        emailAddressId: resetFactor.emailAddressId,
      });

      // Store the signInAttempt for the reset phase
      setCurrentSignIn(signInAttempt);
      setSuccessfulCreation(true);
      Alert.alert("Success", "Check your email for the verification code!");
    } catch (err) {
      console.error("Reset email error:", JSON.stringify(err, null, 2));

      // For security, show success even if there's an error
      setSuccessfulCreation(true);
      Alert.alert(
        "Check Your Email",
        "If an account exists with this email, you'll receive a verification code."
      );
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify Code + Set new password
  const resetPassword = async () => {
    if (!code || !password) {
      setErrors([{ message: "Please enter both code and new password" }]);
      return;
    }

    if (password.length < 8) {
      setErrors([{ message: "Password must be at least 8 characters long" }]);
      return;
    }

    try {
      setLoading(true);
      setErrors([]);

      if (!currentSignIn) {
        throw new Error("Reset session expired. Please start over.");
      }

      const result = await currentSignIn.attemptFirstFactor({
        strategy: "reset_password_email_code",
        code: code.trim(),
        password: password.trim(),
      });

      if (result.status === "complete") {
        await setActive({ session: result.createdSessionId });
        Alert.alert("Success", "Your password has been reset successfully!");
        router.replace("/(tabs)");
      } else {
        setErrors([{ message: "Password reset failed. Please try again." }]);
      }
    } catch (err) {
      console.error("Reset password error:", JSON.stringify(err, null, 2));

      if (err.errors) {
        setErrors(err.errors);
      } else {
        setErrors([
          { message: "Invalid verification code. Please try again." },
        ]);
      }
    } finally {
      setLoading(false);
    }
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
              <Ionicons name="key" size={48} color="white" />
            </View>
            <Text className="text-3xl font-bold text-gray-900 mb-2">
              Reset Password
            </Text>
            <Text className="text-lg text-gray-600 text-center">
              {successfulCreation
                ? `Enter the code sent to\n${emailAddress}`
                : "Enter your email to receive\na verification code"}
            </Text>
          </View>
        </View>

        {/* Form Section */}
        <View className="px-6 pb-8">
          <View className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mb-6">
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

            {/* STEP 1: Enter Email */}
            {!successfulCreation && (
              <>
                <Text className="text-2xl font-bold text-gray-900 mb-6 text-center">
                  Forgot Password?
                </Text>

                <View className="mb-6">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </Text>
                  <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-300">
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
                      editable={!loading}
                      keyboardType="email-address"
                      autoComplete="email"
                    />
                  </View>
                </View>

                <TouchableOpacity
                  onPress={sendResetCode}
                  disabled={loading || !emailAddress}
                  className={`rounded-xl py-4 shadow-sm mb-4 ${
                    loading || !emailAddress ? "bg-gray-400" : "bg-blue-600"
                  }`}
                  activeOpacity={0.8}
                >
                  <View className="flex-row items-center justify-center">
                    {loading ? (
                      <ActivityIndicator
                        size="small"
                        color="white"
                        className="mr-2"
                      />
                    ) : (
                      <Ionicons
                        name="send-outline"
                        size={20}
                        color="white"
                        className="mr-2"
                      />
                    )}
                    <Text className="text-white font-semibold text-lg">
                      {loading ? "Sending..." : "Send Verification Code"}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => router.back()}
                  disabled={loading}
                  className="py-3"
                >
                  <Text className="text-blue-600 font-semibold text-center">
                    Back to Sign In
                  </Text>
                </TouchableOpacity>
              </>
            )}

            {/* STEP 2: Enter Code + New Password */}
            {successfulCreation && (
              <>
                <Text className="text-2xl font-bold text-gray-900 mb-6 text-center">
                  Enter Code & New Password
                </Text>

                {/* Code Input */}
                <View className="mb-4">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    Verification Code
                  </Text>
                  <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-300">
                    <Ionicons name="key-outline" size={20} color="#6B7280" />
                    <TextInput
                      value={code}
                      placeholder="Enter 6-digit code"
                      placeholderTextColor="#9CA3AF"
                      onChangeText={(text) => {
                        setCode(text);
                        clearErrors();
                      }}
                      className="flex-1 ml-3 text-gray-900 text-base"
                      keyboardType="number-pad"
                      maxLength={6}
                      editable={!loading}
                    />
                  </View>
                </View>

                {/* New Password Input */}
                <View className="mb-6">
                  <Text className="text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </Text>
                  <View className="flex-row items-center bg-gray-50 rounded-xl px-4 py-3 border border-gray-300">
                    <Ionicons
                      name="lock-closed-outline"
                      size={20}
                      color="#6B7280"
                    />
                    <TextInput
                      value={password}
                      placeholder="Enter new password"
                      placeholderTextColor="#9CA3AF"
                      secureTextEntry
                      onChangeText={(text) => {
                        setPassword(text);
                        clearErrors();
                      }}
                      className="flex-1 ml-3 text-gray-900 text-base"
                      editable={!loading}
                    />
                  </View>
                  <Text className="text-sm text-gray-500 mt-2">
                    Use at least 8 characters with a mix of letters and numbers
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={resetPassword}
                  disabled={loading || !code || !password}
                  className={`rounded-xl py-4 shadow-sm mb-4 ${
                    loading || !code || !password
                      ? "bg-gray-400"
                      : "bg-blue-600"
                  }`}
                  activeOpacity={0.8}
                >
                  <View className="flex-row items-center justify-center">
                    {loading ? (
                      <ActivityIndicator
                        size="small"
                        color="white"
                        className="mr-2"
                      />
                    ) : (
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={20}
                        color="white"
                        className="mr-2"
                      />
                    )}
                    <Text className="text-white font-semibold text-lg">
                      {loading ? "Resetting..." : "Reset Password"}
                    </Text>
                  </View>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => {
                    setSuccessfulCreation(false);
                    setErrors([]);
                    setCode("");
                    setPassword("");
                    setCurrentSignIn(null);
                  }}
                  disabled={loading}
                  className="py-3"
                >
                  <Text className="text-blue-600 font-semibold text-center">
                    Back to Email Entry
                  </Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
