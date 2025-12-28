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

// Animated Typing Indicator Component
const TypingDot = ({ delay = 0 }: { delay?: number }) => {
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -8,
          duration: 400,
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
        <TypingDot delay={150} />
        <TypingDot delay={300} />
      </View>
    </View>
  </View>
));

TypingIndicator.displayName = "TypingIndicator";

// Chat History Item Component
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

// Quick Prompt Card Component
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

// Message Bubble Component
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

// Empty State Component
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
          messages: chat.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        }));
        setChats(chatsWithDates);
        if (chatsWithDates.length > 0) {
          setActiveChat(chatsWithDates[0]);
        }
      }
    } catch (error) {
      console.error("Error loading chats:", error);
    }
  };

  const saveChats = async (updatedChats: Chat[]) => {
    try {
      await AsyncStorage.setItem("workoutChats", JSON.stringify(updatedChats));
      setChats(updatedChats);
    } catch (error) {
      console.error("Error saving chats:", error);
    }
  };

  const createNewChat = () => {
    const newChat: Chat = {
      id: `chat_${Date.now()}`,
      name: "New Chat",
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    const updatedChats = [newChat, ...chats];
    saveChats(updatedChats);
    setActiveChat(newChat);
  };

  const deleteChat = (chat: Chat) => {
    Alert.alert("Delete Chat", `Delete "${chat.name}"?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          const updatedChats = chats.filter((c) => c.id !== chat.id);
          saveChats(updatedChats);
          if (activeChat?.id === chat.id) {
            setActiveChat(updatedChats[0] || null);
          }
        },
      },
    ]);
  };

  const renameChat = (chat: Chat, newName: string) => {
    const updatedChats = chats.map((c) =>
      c.id === chat.id ? { ...c, name: newName, updatedAt: new Date() } : c
    );
    saveChats(updatedChats);
    if (activeChat?.id === chat.id) {
      setActiveChat({ ...activeChat, name: newName });
    }
  };

  const generateAIResponse = async (userMessage: string): Promise<string> => {
    await new Promise((resolve) =>
      setTimeout(resolve, 1000 + Math.random() * 1500)
    );

    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes("squat")) {
      return "Proper squat form is crucial! Here's what to focus on:\n\n1. Stand with feet shoulder-width apart\n2. Keep your chest up and core engaged\n3. Push your hips back as if sitting in a chair\n4. Lower until thighs are parallel to ground\n5. Drive through your heels to stand\n\nCommon mistakes: knees caving inward, heels lifting, leaning too far forward. Start with bodyweight before adding weight!";
    }

    if (lowerMessage.includes("abs") || lowerMessage.includes("core")) {
      return "For strong abs and core, try these exercises:\n\n1. Planks (30-60 seconds)\n2. Dead bugs\n3. Bicycle crunches\n4. Mountain climbers\n5. Russian twists\n\nRemember: abs are made in the kitchen! Core exercises strengthen muscles, but diet reveals them. Aim for 3-4 core sessions per week with at least one rest day between.";
    }

    if (lowerMessage.includes("beginner") || lowerMessage.includes("start")) {
      return "Welcome to your fitness journey! Here's a simple 3-day beginner plan:\n\nDay 1 (Full Body):\n- Squats: 3x10\n- Push-ups: 3x8-10\n- Dumbbell rows: 3x10\n- Planks: 3x30s\n\nDay 2: Rest or light cardio\n\nDay 3 (Full Body):\n- Lunges: 3x10 each leg\n- Shoulder press: 3x10\n- Lat pulldowns: 3x10\n- Bicycle crunches: 3x15\n\nDays 4-5: Rest\n\nRepeat! Focus on form over weight. Rest 60-90 seconds between sets.";
    }

    if (
      lowerMessage.includes("nutrition") ||
      lowerMessage.includes("eat") ||
      lowerMessage.includes("diet")
    ) {
      return "Pre-workout nutrition tips:\n\n2-3 hours before: Full meal with complex carbs, lean protein, and healthy fats (e.g., chicken, brown rice, vegetables)\n\n30-60 minutes before: Light snack like banana with peanut butter, or Greek yogurt with berries\n\nDuring workout: Water! For workouts over 60 minutes, consider electrolyte drink\n\nPost-workout: Protein + carbs within 30-60 minutes (protein shake, chicken with sweet potato)\n\nHydration is key - drink water throughout the day!";
    }

    if (lowerMessage.includes("push-up") || lowerMessage.includes("pushup")) {
      return "Perfect push-up form:\n\n1. Start in plank position, hands slightly wider than shoulders\n2. Keep body in straight line from head to heels\n3. Lower chest to ground, elbows at 45° angle\n4. Push back up, fully extending arms\n\nModifications:\n- Easier: Knees on ground or hands elevated\n- Harder: Feet elevated or add pause at bottom\n\nCommon mistakes: sagging hips, flaring elbows, not going low enough. Quality over quantity!";
    }

    if (lowerMessage.includes("deadlift")) {
      return "Deadlifts are a powerful compound exercise! Here's proper form:\n\n1. Feet hip-width apart, bar over mid-foot\n2. Grip bar just outside legs\n3. Bend at hips and knees, chest up\n4. Keep back neutral (slight arch in lower back)\n5. Drive through heels, extend hips and knees together\n6. Stand tall, shoulders back\n7. Lower with control\n\nStart light to master form! This exercise works your entire posterior chain. Consider learning with a trainer first.";
    }

    if (lowerMessage.includes("cardio") || lowerMessage.includes("running")) {
      return "Cardio tips for results:\n\nFor fat loss:\n- Mix steady-state (30-45 min) with HIIT\n- Aim for 3-5 sessions per week\n- Keep heart rate at 60-70% max for steady-state\n\nHIIT example:\n- 30 seconds sprint\n- 90 seconds rest\n- Repeat 8-10 times\n\nBest cardio options:\n- Running/jogging\n- Cycling\n- Rowing\n- Swimming\n- Jump rope\n\nRemember: strength training + cardio + nutrition = best results!";
    }

    if (lowerMessage.includes("rest") || lowerMessage.includes("recovery")) {
      return "Recovery is just as important as training!\n\nKey recovery strategies:\n1. Sleep 7-9 hours per night\n2. Rest days: 1-2 per week minimum\n3. Active recovery: light walking, yoga, stretching\n4. Proper nutrition and hydration\n5. Foam rolling and mobility work\n\nSigns you need more rest:\n- Persistent fatigue\n- Decreased performance\n- Trouble sleeping\n- Mood changes\n- Increased injuries\n\nListen to your body - rest is when muscles grow!";
    }

    return "Great question! I'm here to help with:\n\n• Exercise form and techniques\n• Workout plans and routines\n• Nutrition and meal timing\n• Recovery and rest strategies\n• Muscle building tips\n• Common workout mistakes\n\nCould you tell me more about what you'd like to know? The more specific you are, the better I can help!";
  };

  const handleSend = async (text?: string) => {
    const messageText = text || inputText.trim();
    if (!messageText || isTyping) return;

    let currentChat = activeChat;
    if (!currentChat) {
      currentChat = {
        id: `chat_${Date.now()}`,
        name: messageText.slice(0, 30) + (messageText.length > 30 ? "..." : ""),
        messages: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const updatedChats = [currentChat, ...chats];
      saveChats(updatedChats);
      setActiveChat(currentChat);
    }

    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      text: messageText,
      isUser: true,
      timestamp: new Date(),
    };

    const updatedMessages = [...currentChat.messages, userMessage];
    const updatedChat = {
      ...currentChat,
      messages: updatedMessages,
      updatedAt: new Date(),
      name:
        currentChat.messages.length === 0
          ? messageText.slice(0, 30) + (messageText.length > 30 ? "..." : "")
          : currentChat.name,
    };

    const updatedChats = chats.map((c) =>
      c.id === updatedChat.id ? updatedChat : c
    );
    if (!chats.find((c) => c.id === updatedChat.id)) {
      updatedChats.unshift(updatedChat);
    }

    saveChats(updatedChats);
    setActiveChat(updatedChat);
    setInputText("");
    setIsTyping(true);

    try {
      const aiResponse = await generateAIResponse(messageText);
      const aiMessage: Message = {
        id: `msg_${Date.now()}_ai`,
        text: aiResponse,
        isUser: false,
        timestamp: new Date(),
      };

      const finalMessages = [...updatedMessages, aiMessage];
      const finalChat = {
        ...updatedChat,
        messages: finalMessages,
        updatedAt: new Date(),
      };
      const finalChats = chats.map((c) =>
        c.id === finalChat.id ? finalChat : c
      );
      if (!chats.find((c) => c.id === finalChat.id)) {
        finalChats.unshift(finalChat);
      }

      saveChats(finalChats);
      setActiveChat(finalChat);
    } catch (error) {
      console.error("Error generating response:", error);
    } finally {
      setIsTyping(false);
    }
  };

  const hasMessages = activeChat && activeChat.messages.length > 0;

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View className="bg-white px-6 py-4 border-b border-gray-200">
          <View className="flex-row justify-between items-center">
            <TouchableOpacity
              className="flex-row items-center flex-1"
              onPress={() => setShowHistory(true)}
              activeOpacity={0.7}
            >
              <View className="w-12 h-12 bg-blue-600 rounded-xl items-center justify-center mr-3">
                <Ionicons name="barbell" size={24} color="white" />
              </View>
              <View className="flex-1">
                <Text
                  className="text-xl font-bold text-gray-900"
                  numberOfLines={1}
                >
                  {activeChat?.name || "AI Coach"}
                </Text>
                <View className="flex-row items-center mt-0.5">
                  <Ionicons name="time-outline" size={12} color="#6B7280" />
                  <Text className="text-gray-500 text-xs ml-1">
                    {chats.length} {chats.length === 1 ? "chat" : "chats"}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-blue-600 px-4 py-2 rounded-full active:opacity-90 flex-row items-center ml-2"
              onPress={createNewChat}
              activeOpacity={0.7}
            >
              <Ionicons name="add" size={18} color="white" />
              <Text className="text-white font-semibold ml-1">New</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Messages Area */}
        {!hasMessages ? (
          <EmptyState onQuickPrompt={handleSend} />
        ) : (
          <ScrollView
            ref={scrollViewRef}
            className="flex-1 px-6 pt-4"
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToBottom}
          >
            {activeChat.messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
            {isTyping && <TypingIndicator />}
            <View className="h-4" />
          </ScrollView>
        )}

        {/* Input Area */}
        <View className="bg-white px-6 py-4 border-t border-gray-200">
          <View className="flex-row items-end bg-gray-100 rounded-2xl px-4 py-2">
            <TextInput
              className="flex-1 text-gray-900 py-2 max-h-24"
              placeholder="Ask about workouts, form, nutrition..."
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              placeholderTextColor="#9CA3AF"
              editable={!isTyping}
            />
            <TouchableOpacity
              onPress={() => handleSend()}
              disabled={!inputText.trim() || isTyping}
              className={`ml-2 w-10 h-10 rounded-full items-center justify-center ${
                inputText.trim() && !isTyping ? "bg-blue-600" : "bg-gray-300"
              }`}
              activeOpacity={0.7}
            >
              <Ionicons name="send" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Chat History Modal */}
      <ChatHistoryModal
        visible={showHistory}
        chats={chats}
        activeChat={activeChat}
        onClose={() => setShowHistory(false)}
        onSelectChat={setActiveChat}
        onDeleteChat={deleteChat}
        onRenameChat={(chat) => {
          setChatToRename(chat);
          setShowRename(true);
        }}
      />

      {/* Rename Chat Modal */}
      <RenameChatModal
        visible={showRename}
        currentName={chatToRename?.name || ""}
        onClose={() => {
          setShowRename(false);
          setChatToRename(null);
        }}
        onSave={(name) => {
          if (chatToRename) {
            renameChat(chatToRename, name);
          }
        }}
      />
    </SafeAreaView>
  );
}
