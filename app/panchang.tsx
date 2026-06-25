import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Platform,
  UIManager,
  Image,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "../context/LanguageContext";
import { requestAstro } from "../services/api";

const { width } = Dimensions.get("window");

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ── App Design System ─────────────────────────────────────────────────────────
const A = {
  bg: "#ffffff",
  bgSoft: "#f8fafc",
  bgLight: "#f1f5f9",
  card: "#ffffff",
  bdr: "#f1f5f9",
  bdr2: "#e2e8f0",
  orange: "#ea580c",
  orangeL: "#f97316",
  orangeBg: "#fff7ed",
  orangeB2: "#ffedd5",
  text: "#0f172a",
  textM: "#1e293b",
  textS: "#64748b",
  textXs: "#94a3b8",
  green: "#388e3c",
};

export default function PanchangScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  const convert24To12 = (timeStr: string): string => {
    if (!timeStr) return timeStr;
    return String(timeStr).replace(/\b(\d{1,2}):(\d{2})(?::(\d{2}))?(\s*[AP]M)?\b/gi, (match, hStr, mStr, sStr, ampmStr) => {
      let hour = parseInt(hStr, 10);
      const minute = mStr;
      
      let nextDayLabel = "";
      if (hour >= 24) {
        hour = hour % 24;
        nextDayLabel = " (Next Day)";
      }
      
      const ampm = ampmStr ? ampmStr.trim().toUpperCase() : (hour >= 12 ? 'PM' : 'AM');
      let hour12 = hour;
      if (!ampmStr) {
        hour12 = hour % 12;
        if (hour12 === 0) hour12 = 12;
      }
      
      const hourFormatted = String(hour12).padStart(2, '0');
      
      return `${hourFormatted}:${minute} ${ampm}${nextDayLabel}`;
    });
  };

  const [panchangData, setPanchangData] = useState<any>(null);
  const [panchangLoading, setPanchangLoading] = useState(false);

  const fetchPanchang = async () => {
    setPanchangLoading(true);
    try {
      const data = await requestAstro("panchang");
      setPanchangData(data);
    } catch (err) {
      console.error("[Panchang Screen] fetchPanchang failed", err);
    } finally {
      setPanchangLoading(false);
    }
  };

  useEffect(() => {
    fetchPanchang();
  }, []);

  if (panchangLoading) {
    return (
      <View style={s.root}>
        <StatusBar style="dark" />
        <View style={[s.headerBar, { paddingTop: insets.top || 12 }]}>
          <View style={s.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={24} color="#1e293b" />
            </TouchableOpacity>
            <Text style={s.headerTitleText}>{t("Daily Panchang")}</Text>
            <View style={{ width: 38 }} />
          </View>
        </View>
        <View style={s.loadBox}>
          <ActivityIndicator size="large" color={A.orange} />
          <Text style={s.loadText}>{t("Fetching daily panchang calculations...")}</Text>
        </View>
      </View>
    );
  }

  if (!panchangData) {
    return (
      <View style={s.root}>
        <StatusBar style="dark" />
        <View style={[s.headerBar, { paddingTop: insets.top || 12 }]}>
          <View style={s.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={24} color="#1e293b" />
            </TouchableOpacity>
            <Text style={s.headerTitleText}>{t("Daily Panchang")}</Text>
            <View style={{ width: 38 }} />
          </View>
        </View>
        <View style={s.loadBox}>
          <Text style={s.loadText}>{t("Unable to load Panchang. Please try again.")}</Text>
          <TouchableOpacity style={[s.orangeBtn, { paddingHorizontal: 20, marginTop: 12 }]} onPress={fetchPanchang}>
            <Text style={s.orangeBtnText}>{t("RETRY FETCH")}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const sectionConfig: Record<string, {
    title: string;
    accentColor: string;
    bgColor: string;
    borderColor: string;
    iconName: string;
    valColor: string;
    keyColor: string;
    isDarkTheme?: boolean;
  }> = {
    panchang_for_today: {
      title: "Vedic Pillars",
      accentColor: "#ea580c",
      bgColor: "#ffffff",
      borderColor: "#ffedd5",
      iconName: "flame-outline",
      valColor: A.textM,
      keyColor: A.textS
    },
    sun_moon_calculations: {
      title: "Celestial Events",
      accentColor: "#7c3aed",
      bgColor: "#ffffff",
      borderColor: "#f3e8ff",
      iconName: "moon-outline",
      valColor: A.textM,
      keyColor: A.textS
    },
    auspicious_timings: {
      title: "Shubha Muhurat",
      accentColor: "#10b981",
      bgColor: "#f0fdf4",
      borderColor: "#bbf7d0",
      iconName: "checkmark-circle-outline",
      valColor: "#064e3b",
      keyColor: "#047857"
    },
    inauspicious_timings: {
      title: "Ashubha Muhurat",
      accentColor: "#ef4444",
      bgColor: "#fef2f2",
      borderColor: "#fca5a5",
      iconName: "close-circle-outline",
      valColor: "#7f1d1d",
      keyColor: "#b91c1c"
    },
    hindu_month_year: {
      title: "Traditional Vedic Calendar Details",
      accentColor: "#f97316",
      bgColor: "#0f172a",
      borderColor: "#334155",
      iconName: "sparkles-outline",
      valColor: "#ffffff",
      keyColor: "#94a3b8",
      isDarkTheme: true
    }
  };

  const getDetailIcon = (name: string): string => {
    const n = name.toLowerCase();
    if (n.includes("sunrise") || n.includes("sun rise") || n.includes("sun")) return "sunny-outline";
    if (n.includes("sunset") || n.includes("sun set")) return "partly-sunny-outline";
    if (n.includes("moonrise") || n.includes("moon rise") || n.includes("moon")) return "moon-outline";
    if (n.includes("moonset") || n.includes("moon set")) return "moon-outline";
    if (n.includes("tithi")) return "moon-outline";
    if (n.includes("nakshatra")) return "sparkles-outline";
    if (n.includes("karana") || n.includes("karan")) return "shield-checkmark-outline";
    if (n.includes("yoga")) return "repeat-outline";
    if (n.includes("paksha")) return "options-outline";
    if (n.includes("day")) return "calendar-outline";
    if (n.includes("rahu")) return "alert-circle-outline";
    if (n.includes("yamaganda") || n.includes("gulika") || n.includes("mrityu") || n.includes("kantaka")) return "warning-outline";
    if (n.includes("abhijit") || n.includes("amrit") || n.includes("muhurta")) return "timer-outline";
    if (n.includes("samvat") || n.includes("month") || n.includes("ritu") || n.includes("ayana")) return "calendar-clear-outline";
    return "bookmark-outline";
  };

  const getPanchangDateParts = () => {
    try {
      if (panchangData?.reference_date) {
        const date = new Date(panchangData.reference_date + "T12:00:00");
        const month = date.toLocaleString("en-US", { month: "short" }).toUpperCase();
        const day = date.getDate().toString();
        return { month, day };
      }
    } catch (_) {}
    const fallbackDate = new Date();
    return {
      month: fallbackDate.toLocaleString("en-US", { month: "short" }).toUpperCase(),
      day: fallbackDate.getDate().toString()
    };
  };

  const { month: panchangMonth, day: panchangDay } = getPanchangDateParts();

  const orderedSectionKeys = [
    "panchang_for_today",
    "sun_moon_calculations",
    "auspicious_timings",
    "inauspicious_timings",
    "hindu_month_year"
  ];

  return (
    <View style={s.root}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[s.headerBar, { paddingTop: insets.top || 12 }]}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={s.headerTitleText}>{t("Daily Panchang")}</Text>
          <View style={{ width: 38 }} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <View style={s.sectionPad}>
          {/* Hero */}
          <LinearGradient colors={[A.orangeBg, "#ffffff"]} style={s.sectionHero}>
            <View style={{
              width: 48,
              height: 48,
              borderRadius: 10,
              borderWidth: 1.5,
              borderColor: A.orangeB2,
              backgroundColor: "#ffffff",
              overflow: "hidden",
              alignItems: "center"
            }}>
              <View style={{
                width: "100%",
                height: 16,
                backgroundColor: "#ef4444",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Text style={{
                  fontSize: 8.5,
                  fontFamily: "Outfit-Bold",
                  color: "#ffffff"
                }}>
                  {panchangMonth}
                </Text>
              </View>
              <View style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center"
              }}>
                <Text style={{
                  fontSize: 16,
                  fontFamily: "Outfit-ExtraBold",
                  color: "#0f172a"
                }}>
                  {panchangDay}
                </Text>
              </View>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.sectionHeroTitle}>{panchangData.title || t("Daily Panchang")}</Text>
              <Text style={s.sectionHeroSub}>
                {t("Calculation Location")}: {panchangData.location || "New Delhi, India"}
              </Text>
            </View>
            <TouchableOpacity
              style={[s.presetChip, { borderColor: A.orange, backgroundColor: "#ffffff", paddingHorizontal: 10, justifyContent: "center", alignItems: "center" }]}
              onPress={fetchPanchang}
            >
              <Ionicons name="refresh-outline" size={14} color={A.orange} />
            </TouchableOpacity>
          </LinearGradient>

          {orderedSectionKeys.map((sectionKey) => {
            const sectionVal = panchangData[sectionKey];
            if (!sectionVal || typeof sectionVal !== "object" || Object.keys(sectionVal).length === 0) {
              return null;
            }

            const theme = sectionConfig[sectionKey];
            if (!theme) return null;

            const preferredOrders: Record<string, string[]> = {
              panchang_for_today: ["Day", "Yoga", "Tithi", "Karana", "Paksha", "Nakshatra"],
              sun_moon_calculations: ["Ritu", "Sun Set", "Moon Set", "Sun Rise", "Moon Rise", "Moon Sign"],
              auspicious_timings: ["Abhijit"],
              inauspicious_timings: ["Kulika", "Rahu Kaal", "Yamaganda", "Yamashanta", "Gulika Kaal", "Dushta Muhurtas", "Kantaka / Mrityu", "Kalavela / Ardhayaam"],
              hindu_month_year: ["Kali Samvat", "Day Duration", "Month Amanta", "Shaka Samvat", "Vikram Samvat", "Month Purnimanta", "Pravishte / Gate", "Pravishhte / Gate"]
            };

            const order = preferredOrders[sectionKey] || [];
            const sortedEntries = [...Object.entries(sectionVal)].sort((a, b) => {
              const indexA = order.findIndex(key => key.toLowerCase() === a[0].toLowerCase());
              const indexB = order.findIndex(key => key.toLowerCase() === b[0].toLowerCase());
              if (indexA === -1 && indexB === -1) return a[0].localeCompare(b[0]);
              if (indexA === -1) return 1;
              if (indexB === -1) return -1;
              return indexA - indexB;
            });

            if (sectionKey === "hindu_month_year") {
              return (
                <LinearGradient
                  key={sectionKey}
                  colors={["#0f172a", "#1e293b"]}
                  style={[
                    s.card,
                    {
                      borderColor: "#334155",
                      padding: 18,
                      borderRadius: 24,
                      marginTop: 4
                    }
                  ]}
                >
                  <View style={[s.cardHead, { borderBottomWidth: 1, borderBottomColor: "#334155", paddingBottom: 10, marginBottom: 14 }]}>
                    <Ionicons name="sparkles-outline" size={18} color="#f97316" />
                    <Text style={[s.cardTitle, { color: "#f97316", fontFamily: "Outfit-ExtraBold", fontSize: 15, marginLeft: 2 }]}>
                      Traditional Vedic Calendar Details
                    </Text>
                  </View>

                  <View style={{ flexDirection: "row", flexWrap: "wrap", rowGap: 16, columnGap: 8 }}>
                    {sortedEntries.map(([key, val]: any) => (
                      <View key={key} style={{ width: (width - MX * 2 - 36 - 16) / 3, minWidth: 88 }}>
                        <Text style={{ fontSize: 8.5, fontFamily: "Outfit-Bold", color: "#64748b", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }} numberOfLines={1}>
                          {key}
                        </Text>
                        <Text style={{ fontSize: 12.5, fontFamily: "Outfit-ExtraBold", color: "#ffffff", lineHeight: 17 }}>
                          {convert24To12(val)}
                        </Text>
                      </View>
                    ))}
                  </View>
                </LinearGradient>
              );
            }

            return (
              <View 
                key={sectionKey} 
                style={[
                  s.card, 
                  { 
                    borderColor: theme.borderColor, 
                    backgroundColor: theme.bgColor,
                    padding: 16,
                    borderRadius: 24,
                    marginTop: 4
                  }
                ]}
              >
                <View style={[s.cardHead, { marginBottom: 12 }]}>
                  <View style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    backgroundColor: theme.accentColor + "1a",
                    alignItems: "center",
                    justifyContent: "center"
                  }}>
                    <Ionicons name={theme.iconName as any} size={16} color={theme.accentColor} />
                  </View>
                  <Text style={[s.cardTitle, { color: theme.accentColor, fontFamily: "Outfit-ExtraBold", fontSize: 15 }]}>
                    {theme.title}
                  </Text>
                </View>

                <View style={{ gap: 10 }}>
                  {sortedEntries.map(([key, val]: any) => (
                    <View 
                      key={key} 
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        backgroundColor: theme.bgColor === "#ffffff" ? "#f8fafc" : theme.bgColor,
                        borderLeftWidth: 3,
                        borderLeftColor: theme.accentColor,
                        borderRadius: 12,
                        paddingHorizontal: 12,
                        paddingVertical: 10,
                        gap: 10
                      }}
                    >
                      <View style={{
                        width: 24,
                        height: 24,
                        borderRadius: 6,
                        backgroundColor: theme.accentColor + "10",
                        alignItems: "center",
                        justifyContent: "center"
                      }}>
                        <Ionicons name={getDetailIcon(key) as any} size={12} color={theme.accentColor} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 8.5, fontFamily: "Outfit-Bold", color: theme.keyColor, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 }}>
                          {key}
                        </Text>
                        <Text style={{ fontSize: 13, fontFamily: "Outfit-Bold", color: theme.valColor }}>
                          {convert24To12(val)}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
            );
          })}

          {/* Acharya Guru Ji - Divine Destiny CTA Card */}
          <LinearGradient
            colors={["#f97316", "#ef4444"]}
            style={{
              marginHorizontal: MX,
              marginTop: 16,
              borderRadius: 28,
              padding: 20,
              shadowColor: "#f97316",
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.2,
              shadowRadius: 15,
              elevation: 8,
              borderWidth: 1.5,
              borderColor: "rgba(255, 255, 255, 0.15)"
            }}
          >
            <View style={{ flexDirection: "row", alignItems: "stretch", gap: 14 }}>
              {/* Left side: Guru Ji Avatar Column */}
              <View style={{
                width: "42%",
                backgroundColor: "rgba(0, 0, 0, 0.1)",
                borderRadius: 20,
                paddingVertical: 16,
                paddingHorizontal: 10,
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 1,
                borderColor: "rgba(255, 255, 255, 0.1)"
              }}>
                <View style={{ position: "relative", marginBottom: 10 }}>
                  <Image
                    source={require("../assets/astrology/pandit_ji_avatar.png")}
                    style={{
                      width: 76,
                      height: 76,
                      borderRadius: 38,
                      borderWidth: 2.5,
                      borderColor: "#ffffff"
                    }}
                    resizeMode="cover"
                  />
                  <View style={{
                    position: "absolute",
                    bottom: -2,
                    right: -2,
                    backgroundColor: "#ffffff",
                    borderRadius: 99,
                    padding: 4,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.15,
                    shadowRadius: 4,
                    elevation: 2
                  }}>
                    <Ionicons name="star" size={10} color="#f97316" />
                  </View>
                </View>

                <View style={{
                  backgroundColor: "rgba(255, 255, 255, 0.2)",
                  paddingHorizontal: 7,
                  paddingVertical: 2.5,
                  borderRadius: 99,
                  borderWidth: 0.5,
                  borderColor: "rgba(255, 255, 255, 0.25)",
                  marginBottom: 4
                }}>
                  <Text style={{
                    fontSize: 7.5,
                    fontFamily: "Outfit-Bold",
                    color: "#ffffff",
                    letterSpacing: 0.5,
                    textTransform: "uppercase"
                  }}>
                    Divine Guide
                  </Text>
                </View>
                <Text style={{
                  fontSize: 12,
                  fontFamily: "Outfit-ExtraBold",
                  color: "#ffffff",
                  textAlign: "center",
                  lineHeight: 15
                }}>
                  Acharya Guru Ji
                </Text>
              </View>

              {/* Right side: Interactive Call To Action Details */}
              <View style={{ flex: 1, justifyContent: "center" }}>
                <Text style={{
                  fontSize: 8.5,
                  fontFamily: "Outfit-Bold",
                  color: "rgba(255, 255, 255, 0.75)",
                  textTransform: "uppercase",
                  letterSpacing: 1.2,
                  marginBottom: 3
                }}>
                  Personalized Advice
                </Text>
                
                <Text style={{
                  fontSize: 21,
                  fontFamily: "Outfit-ExtraBold",
                  color: "#ffffff",
                  lineHeight: 22,
                  letterSpacing: -0.5,
                  textTransform: "uppercase",
                  marginBottom: 8
                }}>
                  Know Your{"\n"}
                  <Text style={{ textDecorationLine: "underline", textDecorationColor: "rgba(255, 255, 255, 0.3)" }}>
                    Divine Destiny
                  </Text>
                </Text>

                <View style={{
                  backgroundColor: "rgba(0, 0, 0, 0.15)",
                  borderRadius: 16,
                  padding: 10,
                  borderWidth: 0.5,
                  borderColor: "rgba(255, 255, 255, 0.1)",
                  marginBottom: 10
                }}>
                  <Text style={{
                    fontSize: 10.5,
                    fontFamily: "Outfit-Medium",
                    color: "rgba(255, 255, 255, 0.9)",
                    fontStyle: "italic",
                    lineHeight: 14
                  }}>
                    "Unlock sacred insights hidden within your unique birth chart."
                  </Text>
                </View>

                <TouchableOpacity
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: 99,
                    paddingVertical: 10,
                    alignItems: "center",
                    justifyContent: "center",
                    flexDirection: "row",
                    gap: 6,
                    shadowColor: "#000",
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.1,
                    shadowRadius: 8,
                    elevation: 2
                  }}
                  onPress={() => {
                    router.push("/kundli");
                  }}
                  activeOpacity={0.9}
                >
                  <Text style={{
                    fontSize: 11,
                    fontFamily: "Outfit-Bold",
                    color: "#ea580c",
                    letterSpacing: 0.5
                  }}>
                    ASK GURU JI
                  </Text>
                  <Ionicons name="arrow-forward" size={12} color="#ea580c" />
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </View>
      </ScrollView>
    </View>
  );
}

const MX = 16;
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: A.bg },
  scroll: { paddingBottom: 40 },

  // Header styles
  headerBar: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      }
    })
  },
  headerRow: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
    color: '#0f172a',
  },

  // Hero Section
  sectionPad: { paddingBottom: 20 },
  sectionHero: { flexDirection: "row", alignItems: "center", paddingHorizontal: MX, paddingTop: 20, paddingBottom: 22, gap: 14 },
  sectionHeroTitle: { fontSize: 24, fontFamily: "Outfit-ExtraBold", color: A.text },
  sectionHeroSub: { fontSize: 12, fontFamily: "Outfit-Medium", color: A.textS, marginTop: 2 },

  // Loading
  loadBox: { paddingVertical: 60, alignItems: "center", justifyContent: "center", flex: 1 },
  loadText: { marginTop: 14, fontFamily: "Outfit-Medium", color: A.textS, fontSize: 13 },

  // Card
  card: { marginHorizontal: MX, marginBottom: 12, backgroundColor: A.card, borderRadius: 24, borderWidth: 1, borderColor: A.bdr, padding: 18, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8, elevation: 2 },
  cardHead: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  cardTitle: { fontSize: 15, fontFamily: "Outfit-Bold", color: A.textM },

  // Preset chips
  presetChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14, backgroundColor: A.bgSoft, borderWidth: 1, borderColor: A.bdr2 },
  presetChipText: { fontSize: 11, fontFamily: "Outfit-Medium", color: A.textS },

  // Orange Action Button
  orangeBtn: { backgroundColor: A.orange, borderRadius: 16, height: 50, alignItems: "center", justifyContent: "center" },
  orangeBtnText: { fontSize: 13.5, fontFamily: "Outfit-ExtraBold", color: "#fff", letterSpacing: 0.5 },
});
