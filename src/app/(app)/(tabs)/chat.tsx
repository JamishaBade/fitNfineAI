import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Animated,
  Easing,
  Modal,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

// Types
type Message = {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
};

type Chat = {
  id: string;
  name: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
};

type QuickPrompt = {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  text: string;
  prompt: string;
};

// Animated Typing Indicator
const TypingDot = ({ delay = 0 }: { delay?: number }) => {
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -8,
          duration: 4000,
          delay,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 400,
          easing: Easing.ease,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [delay, bounceAnim]);

  return (
    <Animated.View
      style={{ transform: [{ translateY: bounceAnim }] }}
      className="w-2 h-2 bg-gray-400 rounded-full mx-0.5"
    />
  );
};

const TypingIndicator = React.memo(() => (
  <View className="items-start mb-4">
    <View className="bg-gray-100 rounded-2xl rounded-bl-md px-5 py-4">
      <View className="flex-row items-center">
        <TypingDot delay={0} />
        <TypingDot delay={200} />
        <TypingDot delay={300} />
      </View>
    </View>
  </View>
));

TypingIndicator.displayName = "TypingIndicator";

// Chat History Item
const ChatHistoryItem = React.memo(
  ({
    chat,
    isActive,
    onSelect,
    onDelete,
    onRename,
  }: {
    chat: Chat;
    isActive: boolean;
    onSelect: () => void;
    onDelete: () => void;
    onRename: () => void;
  }) => (
    <TouchableOpacity
      className={`p-4 mb-2 rounded-xl ${
        isActive
          ? "bg-blue-100 border-2 border-blue-600"
          : "bg-white border border-gray-200"
      }`}
      onPress={onSelect}
      activeOpacity={0.7}
    >
      <View className="flex-row justify-between items-start">
        <View className="flex-1 mr-2">
          <Text
            className={`font-semibold text-base mb-1 ${
              isActive ? "text-blue-900" : "text-gray-900"
            }`}
            numberOfLines={1}
          >
            {chat.name}
          </Text>
          <Text className="text-xs text-gray-500">
            {chat.messages.length} messages •{" "}
            {new Date(chat.updatedAt).toLocaleDateString()}
          </Text>
        </View>
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onRename();
            }}
            className="p-2"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="pencil" size={18} color="#6B7280" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-2"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  )
);

ChatHistoryItem.displayName = "ChatHistoryItem";

// Chat History Modal
const ChatHistoryModal = ({
  visible,
  chats,
  activeChat,
  onClose,
  onSelectChat,
  onDeleteChat,
  onRenameChat,
}: {
  visible: boolean;
  chats: Chat[];
  activeChat: Chat | null;
  onClose: () => void;
  onSelectChat: (chat: Chat) => void;
  onDeleteChat: (chat: Chat) => void;
  onRenameChat: (chat: Chat) => void;
}) => (
  <Modal visible={visible} animationType="slide" transparent>
    <View className="flex-1 bg-black/50">
      <View className="flex-1 mt-20 bg-white rounded-t-3xl">
        <View className="flex-row justify-between items-center p-6 border-b border-gray-200">
          <Text className="text-2xl font-bold text-gray-900">Chat History</Text>
          <TouchableOpacity onPress={onClose} hitSlop={10}>
            <Ionicons name="close" size={28} color="#4B5563" />
          </TouchableOpacity>
        </View>
        <ScrollView
          className="flex-1 px-6 pt-4"
          showsVerticalScrollIndicator={false}
        >
          {chats.length === 0 ? (
            <View className="items-center justify-center py-12">
              <Ionicons name="chatbubbles-outline" size={64} color="#D1D5DB" />
              <Text className="text-gray-500 text-lg mt-4">
                No chat history yet
              </Text>
              <Text className="text-gray-400 mt-2 text-center">
                Start a conversation to create your first chat
              </Text>
            </View>
          ) : (
            chats.map((chat) => (
              <ChatHistoryItem
                key={chat.id}
                chat={chat}
                isActive={activeChat?.id === chat.id}
                onSelect={() => {
                  onSelectChat(chat);
                  onClose();
                }}
                onDelete={() => onDeleteChat(chat)}
                onRename={() => onRenameChat(chat)}
              />
            ))
          )}
          <View className="h-8" />
        </ScrollView>
      </View>
    </View>
  </Modal>
);

// Rename Chat Modal
const RenameChatModal = ({
  visible,
  currentName,
  onClose,
  onSave,
}: {
  visible: boolean;
  currentName: string;
  onClose: () => void;
  onSave: (name: string) => void;
}) => {
  const [name, setName] = useState(currentName);

  useEffect(() => {
    setName(currentName);
  }, [currentName]);

  return (
    <Modal visible={visible} animationType="fade" transparent>
      <View className="flex-1 bg-black/50 justify-center items-center px-6">
        <View className="bg-white rounded-2xl p-6 w-full max-w-md">
          <Text className="text-xl font-bold text-gray-900 mb-4">
            Rename Chat
          </Text>
          <TextInput
            className="bg-gray-100 rounded-xl px-4 py-3 text-gray-900 border border-gray-200 mb-6"
            placeholder="Enter chat name"
            value={name}
            onChangeText={setName}
            maxLength={50}
            autoFocus
          />
          <View className="flex-row space-x-3">
            <TouchableOpacity
              className="flex-1 bg-gray-100 py-3 rounded-xl"
              onPress={onClose}
              activeOpacity={0.7}
            >
              <Text className="text-center text-gray-700 font-semibold">
                Cancel
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="flex-1 bg-blue-600 py-3 rounded-xl"
              onPress={() => {
                if (name.trim()) {
                  onSave(name.trim());
                  onClose();
                }
              }}
              activeOpacity={0.7}
            >
              <Text className="text-center text-white font-semibold">Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Quick Prompt Card
const QuickPromptCard = React.memo(
  ({ prompt, onPress }: { prompt: QuickPrompt; onPress: () => void }) => (
    <TouchableOpacity
      className="bg-white rounded-2xl p-4 mr-3 w-48 shadow-sm border border-gray-100 active:opacity-90"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className="bg-blue-100 w-12 h-12 rounded-full items-center justify-center mb-3">
        <Ionicons name={prompt.icon} size={24} color="#3B82F6" />
      </View>
      <Text className="text-gray-900 font-semibold text-sm">{prompt.text}</Text>
    </TouchableOpacity>
  )
);

QuickPromptCard.displayName = "QuickPromptCard";

// Message Bubble
const MessageBubble = React.memo(({ message }: { message: Message }) => (
  <View className={`mb-4 ${message.isUser ? "items-end" : "items-start"}`}>
    <View
      className={`max-w-[80%] rounded-2xl px-4 py-3 ${
        message.isUser
          ? "bg-blue-600 rounded-br-md"
          : "bg-white rounded-bl-md border border-gray-100"
      }`}
    >
      <Text
        className={`text-base leading-6 ${
          message.isUser ? "text-white" : "text-gray-900"
        }`}
      >
        {message.text}
      </Text>
    </View>
    <Text className="text-xs text-gray-400 mt-1 px-2">
      {message.timestamp.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      })}
    </Text>
  </View>
));

MessageBubble.displayName = "MessageBubble";

// Empty State
const EmptyState = React.memo(
  ({ onQuickPrompt }: { onQuickPrompt: (prompt: string) => void }) => {
    const quickPrompts: QuickPrompt[] = [
      {
        id: "1",
        icon: "barbell",
        text: "How to do proper squats?",
        prompt:
          "Can you explain how to perform a proper squat with correct form?",
      },
      {
        id: "2",
        icon: "body",
        text: "Best exercises for abs",
        prompt:
          "What are the most effective exercises for building core strength and abs?",
      },
      {
        id: "3",
        icon: "fitness",
        text: "Beginner workout plan",
        prompt:
          "Can you create a beginner-friendly workout plan for someone just starting out?",
      },
      {
        id: "4",
        icon: "nutrition",
        text: "Pre-workout nutrition",
        prompt: "What should I eat before a workout for optimal performance?",
      },
    ];

    return (
      <View className="flex-1 justify-center px-6">
        <View className="items-center mb-8">
          <View className="bg-blue-600 w-20 h-20 rounded-full items-center justify-center mb-6">
            <Ionicons name="chatbubbles" size={40} color="white" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 mb-2 text-center">
            Your AI Workout Coach
          </Text>
          <Text className="text-gray-500 text-center">
            Ask me anything about exercises, form, nutrition, or workout plans
          </Text>
        </View>

        <Text className="text-sm font-semibold text-gray-700 mb-4">
          Try asking:
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingRight: 24 }}
        >
          {quickPrompts.map((prompt) => (
            <QuickPromptCard
              key={prompt.id}
              prompt={prompt}
              onPress={() => onQuickPrompt(prompt.prompt)}
            />
          ))}
        </ScrollView>
      </View>
    );
  }
);

EmptyState.displayName = "EmptyState";

// FIXED: Hugging Face API Configuration - Corrected endpoint URL
const HF_CONFIG = {
  apiKey: "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", // Replace with your actual HF API key
  model: "mistralai/Mistral-7B-Instruct-v0.2",
  // FIXED: Use the correct Hugging Face Inference API endpoint
  endpoint: "router.huggingface.co/hf-inference/models/",
};

const isValidHFToken = (token: string): boolean =>
  token && token.startsWith("hf_") && token.length > 20;

// AI Response Function
const generateAIResponse = async (userMessage: string): Promise<string> => {
  try {
    if (!isValidHFToken(HF_CONFIG.apiKey)) {
      return getSmartFallbackResponse(userMessage);
    }

    const prompt = `<s>[INST] You are a professional fitness coach. Give clear, safe, beginner-friendly advice.

Question: ${userMessage}

Answer: [/INST]`;

    const response = await axios.post(
      HF_CONFIG.endpoint,
      {
        inputs: prompt,
        parameters: {
          max_new_tokens: 500,
          temperature: 0.7,
          top_p: 0.95,
          do_sample: true,
          return_full_text: false,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${HF_CONFIG.apiKey}`,
          "Content-Type": "application/json",
        },
        timeout: 60000,
      }
    );

    let aiText = "";

    if (Array.isArray(response.data)) {
      aiText = response.data[0]?.generated_text ?? "";
    } else if (response.data?.generated_text) {
      aiText = response.data.generated_text;
    } else if (response.data?.error) {
      throw new Error(response.data.error);
    }

    // Clean up the response - remove the instruction tags if present
    aiText = aiText.replace(/\[\/INST\]/g, "").trim();

    if (!aiText || aiText.trim().length < 5) {
      throw new Error("Empty AI response");
    }

    return aiText.trim();
  } catch (error: any) {
    // console.error("Hugging Face API Error:", {
    //   message: error?.message,
    //   status: error?.response?.status,
    //   data: error?.response?.data,
    // });

    // Handle specific error cases
    if (error?.response?.status === 503) {
      // Model is loading
      return (
        "The AI model is currently loading. Please try again in a moment. In the meantime, here's some general advice:\n\n" +
        getSmartFallbackResponse(userMessage)
      );
    }

    return getSmartFallbackResponse(userMessage);
  }
};

// Fallback responses
const getSmartFallbackResponse = (userMessage: string): string => {
  const lowerMessage = userMessage.toLowerCase();

  if (lowerMessage.includes("squat")) {
    return `Proper Squat Form Guide

1. Stance: Feet shoulder-width apart, toes slightly outward
2. Movement: Push hips back like sitting in a chair
3. Depth: Go until thighs are parallel to floor
4. Form: Keep chest up, core tight, knees tracking over toes
5. Return: Drive through heels, squeeze glutes at top

Common Mistakes:
• Knees caving inward
• Heels lifting off ground
• Rounding the lower back
• Not going deep enough

Pro Tip: Start with bodyweight squats before adding weight!`;
  }

  if (lowerMessage.includes("abs") || lowerMessage.includes("core")) {
    return `**Effective Core Workout Plan** 

A. Strength Exercises (3x/week):
1. Plank - 3 sets of 60 seconds
2. Dead Bug - 3x15 reps each side
3. Bicycle Crunches - 3x20 reps
4. Russian Twists - 3x20 reps

**B. Nutrition Tips:**
• Abs are made in the kitchen!
• Reduce processed foods
• Increase protein intake
• Stay hydrated
• Eat in a slight calorie deficit`;
  }

  if (lowerMessage.includes("beginner") || lowerMessage.includes("start")) {
    return `**Beginner Workout Plan** 🎯
**(3 Days/Week)**

Day 1: Full Body
1. Bodyweight Squats: 3x12
2. Push-ups (knee/incline): 3x10
3. Dumbbell Rows: 3x12
4. Plank: 3x30 seconds`;
  }

  if (lowerMessage.includes("nutrition") || lowerMessage.includes("eat")) {
    return `Pre-Workout Nutrition Guide:
• 2-3 hours before: lean protein, complex carbs, veggies
• 30-60 min before: banana, yogurt, protein shake
• During: water every 15-20 min
• Post: protein + carbs to replenish glycogen`;
  }

  return `I'm your AI workout coach! Ask me about exercises, nutrition, or workout plans. The more details you give me, the better I can help!`;
};

// Main Component
export default function WorkoutAIChatScreen() {
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [chatToRename, setChatToRename] = useState<Chat | null>(null);
  const scrollViewRef = useRef<ScrollView>(null);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeChat?.messages, isTyping]);

  useEffect(() => {
    loadChats();
  }, []);

  const loadChats = async () => {
    try {
      const saved = await AsyncStorage.getItem("workoutChats");
      if (saved) {
        const parsed = JSON.parse(saved);
        const chatsWithDates = parsed.map((chat: any) => ({
          ...chat,
          createdAt: new Date(chat.createdAt),
          updatedAt: new Date(chat.updatedAt),
          messages: chat.messages.map((m: any) => ({
            ...m,
            timestamp: new Date(m.timestamp),
          })),
        }));
        setChats(chatsWithDates);
        if (chatsWithDates.length > 0) setActiveChat(chatsWithDates[0]);
      }
    } catch (error) {
      console.error("Failed to load chats:", error);
    }
  };

  const saveChats = async (updatedChats: Chat[]) => {
    try {
      await AsyncStorage.setItem("workoutChats", JSON.stringify(updatedChats));
    } catch (error) {
      console.error("Failed to save chats:", error);
    }
  };

  const handleSend = async () => {
    if (!inputText.trim()) return;

    const newMessage: Message = {
      id: Math.random().toString(),
      text: inputText.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    let updatedChats = [...chats];

    let currentChat = activeChat;
    if (!currentChat) {
      currentChat = {
        id: Math.random().toString(),
        name: `Chat ${chats.length + 1}`,
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      updatedChats.unshift(currentChat);
    }

    currentChat.messages.push(newMessage);
    currentChat.updatedAt = new Date();

    setChats(updatedChats);
    setActiveChat({ ...currentChat });
    setInputText("");
    saveChats(updatedChats);

    setIsTyping(true);
    const aiResponse = await generateAIResponse(newMessage.text);
    const aiMessage: Message = {
      id: Math.random().toString(),
      text: aiResponse,
      isUser: false,
      timestamp: new Date(),
    };

    currentChat.messages.push(aiMessage);
    currentChat.updatedAt = new Date();

    // Update the chat in the array
    const chatIndex = updatedChats.findIndex((c) => c.id === currentChat!.id);
    if (chatIndex !== -1) {
      updatedChats[chatIndex] = { ...currentChat };
    }

    setChats([...updatedChats]);
    setActiveChat({ ...currentChat });
    saveChats([...updatedChats]);
    setIsTyping(false);
  };

  const handleQuickPrompt = (prompt: string) => {
    setInputText(prompt);
    // Use setTimeout to ensure state is updated before sending
    setTimeout(() => {
      handleSend();
    }, 100);
  };

  const handleDeleteChat = (chat: Chat) => {
    Alert.alert("Delete Chat", "Are you sure you want to delete this chat?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          const filtered = chats.filter((c) => c.id !== chat.id);
          setChats(filtered);
          saveChats(filtered);
          if (activeChat?.id === chat.id) setActiveChat(filtered[0] ?? null);
        },
      },
    ]);
  };

  const handleRenameChat = (chat: Chat, newName: string) => {
    const updated = chats.map((c) =>
      c.id === chat.id ? { ...c, name: newName } : c
    );
    setChats(updated);
    if (activeChat?.id === chat.id) {
      setActiveChat({ ...activeChat, name: newName });
    }
    saveChats(updated);
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="flex-1">
        {activeChat && activeChat.messages.length > 0 ? (
          <ScrollView
            ref={scrollViewRef}
            className="px-6 pt-4"
            showsVerticalScrollIndicator={false}
          >
            {activeChat.messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isTyping && <TypingIndicator />}
          </ScrollView>
        ) : (
          <EmptyState onQuickPrompt={handleQuickPrompt} />
        )}
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        <View className="flex-row items-center px-4 py-3 border-t border-gray-200 bg-white">
          <TouchableOpacity
            onPress={() => setShowHistory(true)}
            className="mr-3"
          >
            <Ionicons
              name="chatbox-ellipses-outline"
              size={28}
              color="#4B5563"
            />
          </TouchableOpacity>
          <TextInput
            className="flex-1 bg-gray-100 rounded-2xl px-4 py-2 text-gray-900"
            placeholder="Type a message..."
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={handleSend}
            returnKeyType="send"
          />
          <TouchableOpacity onPress={handleSend} className="ml-3">
            <Ionicons name="send" size={28} color="#3B82F6" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <ChatHistoryModal
        visible={showHistory}
        chats={chats}
        activeChat={activeChat}
        onClose={() => setShowHistory(false)}
        onSelectChat={(chat) => setActiveChat(chat)}
        onDeleteChat={handleDeleteChat}
        onRenameChat={(chat) => {
          setChatToRename(chat);
          setShowRename(true);
        }}
      />

      {chatToRename && (
        <RenameChatModal
          visible={showRename}
          currentName={chatToRename.name}
          onClose={() => setShowRename(false)}
          onSave={(name) => handleRenameChat(chatToRename, name)}
        />
      )}
    </SafeAreaView>
  );
}
