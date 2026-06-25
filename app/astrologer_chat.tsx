import React, { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Dimensions,
  Image,
} from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useLanguage } from "../context/LanguageContext";
import { supabase } from "../services/supabase";
import { safeStorage } from "../services/storage";

const { width } = Dimensions.get("window");

const A = {
  bg:       "#ffffff",
  bgSoft:   "#f5f3ff",
  card:     "#ffffff",
  purple:   "#7c3aed",
  purpleD:  "#6d28d9",
  purpleBg: "#f5f3ff",
  purpleB2: "#ddd6fe",
  text:     "#0f172a",
  textS:    "#64748b",
  textXs:   "#94a3b8",
  bdr:      "#f1f5f9",
  bdr2:     "#e2e8f0",
  green:    "#22c55e",
};

interface Message {
  id: string;
  booking_id: string;
  sender_id: string;
  sender_type: "user" | "astrologer";
  message_text: string;
  created_at: string;
}

export default function AstrologerChatScreen() {
  const { t } = useLanguage();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const bookingId = params.bookingId as string;
  const astrologerId = params.astrologerId as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [astrologer, setAstrologer] = useState<any>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);

  // 1. Load User Session and Astrologer details
  useEffect(() => {
    async function init() {
      try {
        // Load User
        const sessionStr = await safeStorage.getItem("user_session");
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          const userData = session.user || session;
          setUserId(userData.id);
        }

        // Load Astrologer
        if (astrologerId) {
          const { data, error } = await supabase
            .from("website_store_astrologers")
            .select("*")
            .eq("id", astrologerId)
            .single();

          if (error) throw error;
          setAstrologer(data);
        }
      } catch (err) {
        console.error("[AstrologerChat] Init error:", err);
      }
    }
    init();
  }, [astrologerId]);

  // 2. Fetch past messages and subscribe to Supabase Realtime changes
  useEffect(() => {
    if (!bookingId) return;

    // Fetch message history
    async function fetchHistory() {
      try {
        const { data, error } = await supabase
          .from("astrologer_chat_messages")
          .select("*")
          .eq("booking_id", bookingId)
          .order("created_at", { ascending: true });

        if (error) throw error;
        if (data) {
          setMessages(data);
        }
      } catch (err) {
        console.error("[AstrologerChat] Fetch history error:", err);
      } finally {
        setIsLoading(false);
        // Scroll to end shortly after loading history
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
      }
    }

    fetchHistory();

    // Subscribe to Postgres changes on astrologer_chat_messages table for this bookingId
    const chatChannel = supabase
      .channel(`chat_session_${bookingId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "astrologer_chat_messages",
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => {
            // Avoid duplicate additions
            if (prev.some((m) => m.id === newMsg.id)) return prev;
            return [...prev, newMsg];
          });
          // Scroll to end on new message
          setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("[AstrologerChat] Real-time subscription established for booking:", bookingId);
        }
      });

    return () => {
      chatChannel.unsubscribe();
    };
  }, [bookingId]);

  // 3. Send message handler
  const handleSend = async () => {
    if (!inputText.trim() || !bookingId || !userId) return;

    const messageToSend = inputText.trim();
    setInputText("");
    setIsSending(true);

    try {
      const { error } = await supabase
        .from("astrologer_chat_messages")
        .insert({
          booking_id: bookingId,
          sender_id: userId,
          sender_type: "user",
          message_text: messageToSend,
        });

      if (error) throw error;
    } catch (err: any) {
      console.error("[AstrologerChat] Send message failure:", err);
      Alert.alert(t("Message Error"), t("Failed to send message. Please try again."));
    } finally {
      setIsSending(false);
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }
  };

  // 4. End consultation handler
  const handleEndConsultation = () => {
    Alert.alert(
      t("End Consultation"),
      t("Are you sure you want to end this cosmic consultation session?"),
      [
        { text: t("No"), style: "cancel" },
        {
          text: t("Yes, End Session"),
          style: "destructive",
          onPress: async () => {
            try {
              setIsLoading(true);
              const { error } = await supabase
                .from("astrologer_bookings")
                .update({ status: "Completed" })
                .eq("id", bookingId);

              if (error) throw error;

              Alert.alert(
                t("Consultation Completed"),
                t("May the planetary blessings align in your favor! Feedback and remedies logged successfully."),
                [{ text: t("Jai Mata Di"), onPress: () => router.replace("/(tabs)/astro") }]
              );
            } catch (err: any) {
              console.error("[AstrologerChat] End consultation error:", err);
              Alert.alert(t("Error"), t("Failed to close session cleanly. Redirecting anyway."));
              router.replace("/(tabs)/astro");
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={A.purple} />
        <Text style={s.loadingText}>{t("Connecting cosmic channel...")}</Text>
      </View>
    );
  }

  const astroName = astrologer?.full_name || t("Vedic Astrologer");
  const astroTitle = astrologer?.spiritual_title || t("Hora Specialist");
  const hasAvatar = astrologer?.profile_photo && astrologer.profile_photo.startsWith("http");

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <StatusBar style="dark" />

      {/* Header Panel */}
      <View style={[s.header, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={s.headerLeft}>
          <TouchableOpacity onPress={() => router.replace("/(tabs)/astro")} style={s.backBtn}>
            <Ionicons name="chevron-back" size={24} color={A.text} />
          </TouchableOpacity>

          {hasAvatar ? (
            <Image source={{ uri: astrologer.profile_photo }} style={s.avatar} />
          ) : (
            <LinearGradient colors={["#8b5cf6", "#6d28d9"]} style={s.avatarPlaceholder}>
              <Text style={s.avatarText}>🔮</Text>
            </LinearGradient>
          )}

          <View style={s.headerInfo}>
            <View style={s.nameRow}>
              <Text style={s.nameText} numberOfLines={1}>
                {astroName}
              </Text>
              <View style={s.statusDot} />
            </View>
            <Text style={s.titleText} numberOfLines={1}>
              {astroTitle}
            </Text>
          </View>
        </View>

        <TouchableOpacity onPress={handleEndConsultation} style={s.endBtn} activeOpacity={0.8}>
          <Text style={s.endBtnText}>{t("End")}</Text>
        </TouchableOpacity>
      </View>

      {/* Chat Messages List */}
      <ScrollView
        ref={scrollViewRef}
        style={s.messagesScroll}
        contentContainerStyle={s.messagesContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
        showsVerticalScrollIndicator={false}
      >
        {/* Welcome Notice */}
        <View style={s.systemNoticeCard}>
          <Ionicons name="lock-closed" size={12} color={A.textS} style={{ marginBottom: 4 }} />
          <Text style={s.systemNoticeText}>
            {t("Cosmic conversation initialized. This connection is secure, private, and encrypted under Vedic code.")}
          </Text>
          <Text style={s.chargeNoticeText}>
            {t("Consuming")} {astrologer?.charge_per_min || 30} {t("coins per minute.")}
          </Text>
        </View>

        {messages.map((item) => {
          const isMe = item.sender_type === "user";
          return (
            <View key={item.id} style={[s.messageRow, isMe ? s.messageRowMe : s.messageRowOther]}>
              {!isMe && (
                <View style={s.msgAvatarContainer}>
                  {hasAvatar ? (
                    <Image source={{ uri: astrologer.profile_photo }} style={s.msgAvatar} />
                  ) : (
                    <View style={s.msgAvatarPlaceholder}>
                      <Text style={{ fontSize: 10 }}>🔮</Text>
                    </View>
                  )}
                </View>
              )}
              <View style={[s.bubble, isMe ? s.bubbleMe : s.bubbleOther]}>
                <Text style={[s.bubbleText, isMe ? s.bubbleTextMe : s.bubbleTextOther]}>
                  {item.message_text}
                </Text>
                <Text style={[s.timeText, isMe ? s.timeTextMe : s.timeTextOther]}>
                  {new Date(item.created_at).toLocaleTimeString("en-US", {
                    hour: "numeric",
                    minute: "2-digit",
                    hour12: true,
                  })}
                </Text>
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Message Input Panel */}
      <View style={[s.inputPanel, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TextInput
          style={s.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder={t("Type your cosmic question here...")}
          placeholderTextColor={A.textXs}
          multiline
          maxLength={1000}
        />
        <TouchableOpacity
          style={[s.sendBtn, !inputText.trim() && s.sendBtnDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || isSending}
          activeOpacity={0.8}
        >
          {isSending ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <Ionicons name="send" size={16} color="#ffffff" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#faf5ff",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#faf5ff",
    gap: 12,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: "Outfit-Medium",
    color: A.textS,
  },
  header: {
    backgroundColor: "#ffffff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: A.bdr2,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 3,
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  backBtn: {
    marginRight: 8,
    padding: 4,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: A.bgSoft,
  },
  avatarPlaceholder: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 16,
  },
  headerInfo: {
    marginLeft: 10,
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  nameText: {
    fontSize: 15,
    fontFamily: "Outfit-Bold",
    color: A.text,
    maxWidth: "85%",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: A.green,
  },
  titleText: {
    fontSize: 11,
    fontFamily: "Outfit-Medium",
    color: A.textS,
    marginTop: 1,
  },
  endBtn: {
    backgroundColor: "#fee2e2",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  endBtnText: {
    fontSize: 12,
    fontFamily: "Outfit-Bold",
    color: "#ef4444",
  },
  messagesScroll: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 32,
  },
  systemNoticeCard: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: A.purpleB2,
    padding: 12,
    alignItems: "center",
    marginBottom: 24,
    shadowColor: A.purple,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
  },
  systemNoticeText: {
    fontSize: 10,
    fontFamily: "Outfit-Medium",
    color: A.textS,
    textAlign: "center",
    lineHeight: 14,
  },
  chargeNoticeText: {
    fontSize: 9.5,
    fontFamily: "Outfit-Bold",
    color: A.purple,
    marginTop: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: 16,
    maxWidth: "80%",
  },
  messageRowMe: {
    alignSelf: "flex-end",
    justifyContent: "flex-end",
  },
  messageRowOther: {
    alignSelf: "flex-start",
    justifyContent: "flex-start",
  },
  msgAvatarContainer: {
    marginRight: 8,
    alignSelf: "flex-end",
  },
  msgAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: A.bgSoft,
  },
  msgAvatarPlaceholder: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: A.purpleB2,
    alignItems: "center",
    justifyContent: "center",
  },
  bubble: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  bubbleMe: {
    backgroundColor: A.purple,
    borderBottomRightRadius: 4,
  },
  bubbleOther: {
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: A.bdr2,
    borderBottomLeftRadius: 4,
  },
  bubbleText: {
    fontSize: 13,
    fontFamily: "Outfit-Medium",
    lineHeight: 18,
  },
  bubbleTextMe: {
    color: "#ffffff",
  },
  bubbleTextOther: {
    color: A.text,
  },
  timeText: {
    fontSize: 8.5,
    fontFamily: "Outfit-Regular",
    marginTop: 4,
    alignSelf: "flex-end",
  },
  timeTextMe: {
    color: "#c084fc",
  },
  timeTextOther: {
    color: A.textXs,
  },
  inputPanel: {
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: A.bdr2,
    paddingHorizontal: 16,
    paddingTop: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: A.bdr2,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    fontSize: 13,
    fontFamily: "Outfit-Medium",
    color: A.text,
    maxHeight: 100,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: A.purple,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: {
    backgroundColor: A.textXs,
  },
});
