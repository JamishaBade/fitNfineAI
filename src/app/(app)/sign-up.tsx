import * as React from "react";
import {
  Text,
  TextInput,
  TouchableOpacity,
  View,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSignUp } from "@clerk/clerk-expo";
import { Link, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

export default function SignUpScreen() {
  const { isLoaded, signUp, setActive } = useSignUp();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [pendingVerification, setPendingVerification] = React.useState(false);
  const [code, setCode] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);
  const [errors, setErrors] = React.useState([]);

  // Clear errors when user starts typing
  const clearErrors = () => {
    setErrors([]);
  };

  // Handle submission of sign-up form
  const onSignUpPress = async () => {
    if (!isLoaded) return;

    setIsLoading(true);
    setErrors([]);

    // Start sign-up process using email and password provided
    try {
      await signUp.create({
        emailAddress,
        password,
      });

      // Send user an email with verification code
      await signUp.prepareEmailAddressVerification({ strategy: "email_code" });

      // Set 'pendingVerification' to true to display second form
      // and capture OTP code
      setPendingVerification(true);
    } catch (err) {
      // Handle Clerk errors
      if (err.errors) {
        setErrors(err.errors);
      } else {
        setErrors([
          { message: "An unexpected error occurred. Please try again." },
        ]);
      }
      console.error(JSON.stringify(err?.errors, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  // Handle submission of verification form
  const onVerifyPress = async () => {
    if (!isLoaded) return;

    setIsLoading(true);
    setErrors([]);

    try {
      // Use the code the user provided to attempt verification
      const signUpAttempt = await signUp.attemptEmailAddressVerification({
        code,
      });

      // If verification was completed, set the session to active
      // and redirect the user
      if (signUpAttempt.status === "complete") {
        await setActive({ session: signUpAttempt.createdSessionId });
        router.replace("/");
      } else {
        // If the status is not complete, check why. User may need to
        // complete further steps.
        console.error(JSON.stringify(signUpAttempt, null, 2));
        setErrors([{ message: "Verification failed. Please try again." }]);
      }
    } catch (err) {
      // Handle Clerk errors
      if (err.errors) {
        setErrors(err.errors);
      } else {
        setErrors([
          { message: "An unexpected error occurred. Please try again." },
        ]);
      }
      console.error(JSON.stringify(err, null, 2));
    } finally {
      setIsLoading(false);
    }
  };

  // Get specific error message for a field
  const getFieldError = (fieldName) => {
    return errors.find((error) => error.meta?.paramName === fieldName);
  };

  if (pendingVerification) {
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
                <Ionicons name="mail" size={48} color="white" />
              </View>
              <Text className="text-3xl font-bold text-gray-900 mb-2">
                Verify Email
              </Text>
              <Text className="text-lg text-gray-600 text-center">
                We sent a verification code to{"\n"}
                <Text className="font-semibold">{emailAddress}</Text>
              </Text>
            </View>
          </View>

          {/* Verification Form */}
          <View className="px-6 pb-8">
            <View className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mb-6">
              <Text className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Enter Verification Code
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

              {/* Code Input */}
              <View className="mb-6">
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
                    editable={!isLoading}
                  />
                </View>
                <Text className="text-sm text-gray-500 mt-2 text-center">
                  Check your email for the verification code
                </Text>
              </View>

              {/* Verify Button */}
              <TouchableOpacity
                onPress={onVerifyPress}
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
                      name="checkmark-circle-outline"
                      size={20}
                      color="white"
                      className="mr-2"
                    />
                  )}
                  <Text className="text-white font-semibold text-lg">
                    {isLoading ? "Verifying..." : "Verify Email"}
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Back to sign up */}
              <TouchableOpacity
                onPress={() => {
                  setPendingVerification(false);
                  clearErrors();
                }}
                disabled={isLoading}
                className="py-3"
              >
                <Text className="text-blue-600 font-semibold text-center">
                  Back to Sign Up
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

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
              <Ionicons name="person-add" size={48} color="white" />
            </View>
            <Text className="text-3xl font-bold text-gray-900 mb-2">
              Join fitNfine
            </Text>
            <Text className="text-lg text-gray-600 text-center">
              Start your fitness journey{"\n"}and track your progress
            </Text>
          </View>
        </View>

        {/* Sign up form */}
        <View className="px-6 pb-8">
          <View className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 mb-6">
            <Text className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Create Account
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
                  getFieldError("email_address")
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
                />
              </View>
              {getFieldError("email_address") && (
                <Text className="text-red-500 text-xs mt-1">
                  {getFieldError("email_address").message}
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
                  placeholder="Create a strong password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  onChangeText={(text) => {
                    setPassword(text);
                    clearErrors();
                  }}
                  className="flex-1 ml-3 text-gray-900 text-base"
                  editable={!isLoading}
                />
              </View>
              {getFieldError("password") ? (
                <Text className="text-red-500 text-xs mt-1">
                  {getFieldError("password").message}
                </Text>
              ) : (
                <Text className="text-gray-500 text-xs mt-1">
                  Use at least 8 characters with a mix of letters, numbers, and
                  symbols
                </Text>
              )}
            </View>

            {/* Sign up button */}
            <TouchableOpacity
              onPress={onSignUpPress}
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
                    name="person-add-outline"
                    size={20}
                    color="white"
                    className="mr-2"
                  />
                )}
                <Text className="text-white font-semibold text-lg">
                  {isLoading ? "Creating Account..." : "Create Account"}
                </Text>
              </View>
            </TouchableOpacity>

            {/* Sign in link */}
            <View className="flex-row justify-center items-center mt-4">
              <Text className="text-gray-600">Already have an account? </Text>
              <Link href="/sign-in" asChild>
                <TouchableOpacity>
                  <Text className="text-blue-600 font-semibold">Sign in</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
