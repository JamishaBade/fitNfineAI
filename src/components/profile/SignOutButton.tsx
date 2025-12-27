import React from "react";
import { useAuth } from "@clerk/clerk-expo";
import { TouchableOpacity, Text, Alert } from "react-native";
import { useRouter } from "expo-router";

const SignOutButton = () => {
  const { signOut, isSignedIn } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          try {
            // Method 1: Try signOut with redirect
            await signOut({
              redirectUrl: "/sign-in",
            });

            // Force navigation as fallback
            router.replace("/sign-in");
          } catch (error) {
            console.error("Sign out error:", error);

            // Method 2: Try without options
            try {
              await signOut();
              router.replace("/sign-in");
            } catch (error2) {
              console.error("Alternative sign out failed:", error2);

              // Method 3: Try clearing auth manually
              Alert.alert(
                "Sign Out Error",
                "Could not sign out automatically. Please restart the app."
              );
              router.replace("/sign-in");
            }
          }
        },
      },
    ]);
  };

  return (
    <TouchableOpacity
      onPress={handleSignOut}
      className="absolute top-4 right-6 z-50 bg-red-50 px-4 py-2 rounded-full border border-red-200 flex-2"
    >
      <Text className="text-red-600 font-semibold">Sign Out</Text>
    </TouchableOpacity>
  );
};

export default SignOutButton;
