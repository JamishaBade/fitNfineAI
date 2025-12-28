import { Tabs } from "expo-router";
import { WorkoutProvider } from "../../../contexts/WorkoutContext";
import { AntDesign } from "@expo/vector-icons";
import { Image } from "react-native";

function Layout() {
  const user = {
    imageUrl: "https://your-image-url-here.jpg",
  };

  return (
    <WorkoutProvider>
      <Tabs>
        <Tabs.Screen
          name="index"
          options={{
            headerShown: false,
            title: "Home",
            tabBarIcon: ({ color, size }) => (
              <AntDesign name="home" color={color} size={size} />
            ),
          }}
        />

        <Tabs.Screen
          name="chat"
          options={{
            headerShown: false,
            title: "myAI",
            tabBarIcon: ({ color, size }) => (
              <AntDesign name="message" color={color} size={size} />
            ),
          }}
        />

        <Tabs.Screen
          name="workout"
          options={{
            headerShown: false,
            title: "Workout",
            tabBarIcon: ({ color, size }) => (
              <AntDesign name="plus" color={color} size={size} />
            ),
          }}
        />

        <Tabs.Screen
          name="history"
          options={{
            headerShown: false,
            title: "History",
            tabBarIcon: ({ color, size }) => (
              <AntDesign name="history" color={color} size={size} />
            ),
          }}
        />

        <Tabs.Screen
          name="profile/index"
          options={{
            headerShown: false,
            title: "profile",
            tabBarIcon: ({ color, size }) => (
              <AntDesign name="user" color={color} size={size} />
            ),
          }}
        />
      </Tabs>
    </WorkoutProvider>
  );
}

export default Layout;
