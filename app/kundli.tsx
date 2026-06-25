import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Line, Path, Text as SvgText, SvgXml } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLanguage } from "../context/LanguageContext";
import { safeStorage } from "../services/storage";
import { supabase } from "../services/supabase";
import { requestAstro } from "../services/api";

const { width } = Dimensions.get("window");

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ── App Design System ─────────────────────────────────────────────────────────
const A = {
  bg:       "#ffffff",
  bgSoft:   "#f8fafc",
  bgLight:  "#f1f5f9",
  card:     "#ffffff",
  bdr:      "#f1f5f9",
  bdr2:     "#e2e8f0",
  orange:   "#ea580c",
  orangeL:  "#f97316",
  orangeBg: "#fff7ed",
  orangeB2: "#ffedd5",
  text:     "#0f172a",
  textM:    "#1e293b",
  textS:    "#64748b",
  textXs:   "#94a3b8",
  green:    "#388e3c",
};

// ── Quick Location Presets for Janam Kundli ─────────────────────────────────
const PRESETS = [
  { name: "New Delhi", lat: "28.6139", lon: "77.2090", tzone: "5.5" },
  { name: "Mumbai", lat: "19.0760", lon: "72.8777", tzone: "5.5" },
  { name: "Bengaluru", lat: "12.9716", lon: "77.5946", tzone: "5.5" },
  { name: "London", lat: "51.5074", lon: "-0.1278", tzone: "0.0" },
  { name: "New York", lat: "40.7128", lon: "-74.0060", tzone: "-5.0" },
];

// ── Veda Local Chart Engine (North Indian Style) ─────────────────────────────
const NorthIndianChart = ({ planets }: { planets: any[] }) => {
  const housePlanets: { [key: number]: string[] } = {};
  const safePlanets = Array.isArray(planets) ? planets : [];
  safePlanets.forEach((p) => {
    const house = parseInt(p.house);
    if (isNaN(house) || house < 1 || house > 12) return;
    if (!housePlanets[house]) housePlanets[house] = [];
    const rawName = p.name || p.planet || "";
    const n = rawName.toLowerCase();
    const shortName =
      n.includes("sun") || n.includes("सूर्य") ? "सू" :
      n.includes("moon") || n.includes("चंद्र") ? "चं" :
      n.includes("mar") || n.includes("मंगल") ? "मं" :
      n.includes("merc") || n.includes("बुध") ? "बु" :
      n.includes("jup") || n.includes("गुरु") ? "गु" :
      n.includes("ven") || n.includes("शुक्र") ? "शु" :
      n.includes("sat") || n.includes("शनि") ? "श" :
      n.includes("rah") || n.includes("राहु") ? "रा" :
      n.includes("ket") || n.includes("केतु") ? "के" :
      n.includes("asc") || n.includes("lag") || n.includes("लग्न") ? "ल" :
      rawName.substring(0, 1).toUpperCase();
    housePlanets[house].push(shortName);
  });

  const housePositions: Record<number, { x: number; y: number; labelY: number }> = {
    1: { x: 200, y: 130, labelY: 105 },
    2: { x: 100, y: 55, labelY: 35 },
    3: { x: 55, y: 100, labelY: 80 },
    4: { x: 130, y: 200, labelY: 175 },
    5: { x: 55, y: 300, labelY: 280 },
    6: { x: 100, y: 345, labelY: 325 },
    7: { x: 200, y: 270, labelY: 295 },
    8: { x: 300, y: 345, labelY: 325 },
    9: { x: 345, y: 300, labelY: 280 },
    10: { x: 270, y: 200, labelY: 175 },
    11: { x: 345, y: 100, labelY: 80 },
    12: { x: 300, y: 55, labelY: 35 },
  };

  return (
    <View style={{ alignItems: "center", justifyContent: "center", width: "100%", paddingVertical: 12 }}>
      <View style={{ width: 280, height: 280, backgroundColor: "#ffffff", borderWidth: 2, borderColor: "#e2e8f0", borderRadius: 16, overflow: "hidden", position: "relative" }}>
        <Svg viewBox="0 0 400 400" width="100%" height="100%">
          <Line x1="0" y1="0" x2="400" y2="400" stroke="#e2e8f0" strokeWidth="2" />
          <Line x1="400" y1="0" x2="0" y2="400" stroke="#e2e8f0" strokeWidth="2" />
          <Path d="M200,0 L400,200 L200,400 L0,200 Z" stroke="#e2e8f0" strokeWidth="2" fill="none" />

          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((houseNum) => {
            const pos = housePositions[houseNum];
            const planetsInHouse = housePlanets[houseNum] || [];
            return (
              <React.Fragment key={houseNum}>
                <SvgText
                  x={pos.x}
                  y={pos.labelY}
                  fontSize="11"
                  fontWeight="bold"
                  fill="#94a3b8"
                  textAnchor="middle"
                >
                  {houseNum}
                </SvgText>
                {planetsInHouse.length > 0 && (
                  <SvgText
                    x={pos.x}
                    y={pos.y}
                    fontSize="13"
                    fontWeight="bold"
                    fill="#ea580c"
                    textAnchor="middle"
                  >
                    {planetsInHouse.join(" ")}
                  </SvgText>
                )}
              </React.Fragment>
            );
          })}
        </Svg>
      </View>
    </View>
  );
};

export default function KundliScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Janam Kundli Inputs
  const [kName, setKName] = useState("");
  const [kGender, setKGender] = useState<"male" | "female">("male");
  const [kDay, setKDay] = useState("14");
  const [kMonth, setKMonth] = useState("10");
  const [kYear, setKYear] = useState("2003");
  const [kHour, setKHour] = useState("14");
  const [kMin, setKMin] = useState("15");
  const [kLat, setKLat] = useState("19.0760");
  const [kLon, setKLon] = useState("72.8777");
  const [kTzone, setKTzone] = useState("5.5");
  const [kLocationName, setKLocationName] = useState("Mumbai, India");

  // Janam Kundli API and Navigation states
  const [kundliLoading, setKundliLoading] = useState(false);
  const [kundliData, setKundliData] = useState<any>(null);
  const [kundliActiveTab, setKundliActiveTab] = useState<
    "dashboard" | "charts" | "predictions" | "dasha" | "numerology"
  >("dashboard");
  const [kundliActiveChart, setKundliActiveChart] = useState<string>("chart_d1");

  const getReportText = (d: any, category?: string): string => {
    const errMsg = d?.message || d?.msg || d?.detail || '';
    const isError = d && (d.error || errMsg.toLowerCase().includes('plan') || errMsg.toLowerCase().includes('authorized'));

    if (!d || isError) {
      if (category) {
        const fallbacks: Record<string, string> = {
          character: "He will have full of vigour and vitality as also intelligence of the highest order. He is firm believer of god and leads a life of truthful existence. He does not believe in the orthodox principles nor the age old tradition. He is fond of adopting modern ideas. Mostly he lives away from his family. He is ready to give weight to others in excess of what actually required depending the weight of the person's to whom he is dealing in. Slavery is suicidal for him. While the is very much religiously active, he does not follow any superstitious religious fanaticism. He treats all religions, castes and creed as one. He is a follower of Gandhian philosophy of 'Ahimsa Paramodharma' (Religion is Non-violence) and 'Truth is God'. In certain cases I have seen that such type of persons accept Sanyasa (saintism) when they touch 35 years of age. When we say sanyasa it does not mean that complete detraction from the 'Grihastashram' (duty towards the family). He will simultaneously look after the family and follow sanyasa.",
          career: "Your career trajectory is strongly influenced by your innate ability to synthesize complex ideas and execute them with precision. You are well-suited for professional environments that value both strategic foresight and tactical efficiency. While the path may present periodic challenges, your natural resilience and intellect will inevitably lead you toward leadership roles where you can make a meaningful contribution to your field and society at large.",
          relation: "You seek deep spiritual connection and intellectual harmony in all high-stakes relationships. Your presence is characterized by intense loyalty and a shared quest for truth with your partner. Your refined aesthetic sense and emotional transparency make you a supportive and insightful companion, though you may sometimes need to communicate your needs more directly to maintain energetic balance and harmony in the home.",
          health: "Maintaining your physical and energetic vitality requires a consistent routine that keeps your internal 'Prana' in alignment with natural cycles. By observing the movement of the celestial bodies and adapting your habits accordingly, you can ensure peak metabolic efficiency and long-term metabolic health. Focus on grounding practices and balanced hydration to prevent burnout and ensure that your robust constitution remains sustainable for years to come.",
          physical: "You carry an energetic presence that is both commanding and approachable, leaving a lasting impression on those you encounter. Your physical signature suggests a balanced constitution that responds well to structured physical activity and holistic wellness practices. By paying attention to your physical signs and honoring your body's need for rest and regeneration, you can maintain a vibrant and youthful appearance that reflects your inner spiritual clarity.",
          yoga_report: "Powerful cosmic alignments within your chart indicate profound hidden potentials that activate during specific life phases. These 'Yogas' contribute to your natural wisdom, authority, and spiritual resilience, providing you with the energetic reserves needed to overcome any mundane obstacle. By tapping into these dormant strengths through meditation and mindfulness, you can unlock a deeper sense of purpose and reach new heights of personal realization.",
          numero_report: "Your numerical vibration suggests a personality that balances intellectual depth with a strong sense of purpose. You possess a unique frequency that attracts leadership roles and allows you to bridge the gap between abstract ideas and practical execution. Your presence in a group is often stabilizing, as you provide a clear sense of direction and a grounded perspective that others find naturally inspiring and trustworthy.",
          numero_time: "Your most auspicious windows for new beginnings occur during the waxing moon cycles. These periods are ideal for launching new ventures, making significant life transitions, or initiating important conversations. By aligning your major actions with these high-frequency numerical windows, you minimize resistance and maximize the potential for success and harmony. Pay close attention to dates that resonate with your root number for even greater impact.",
          numero_place_vastu: "You thrive in environments with open eastern exposures and balanced elemental flows. Aligning your living and workspace with your conductor number will significantly enhance your focus, peace, and creative output. Specific spatial corrections, such as placing water elements in the Northeast or ensuring the Southwest is stable and grounded, will act as powerful neutralizers for any energetic imbalances, inviting divine blessings and clarity into your daily surroundings."
        };
        return fallbacks[category] || "";
      }
      return "";
    }
    if (typeof d === "string") return d;

    const keys = ["report", "personality", "career_report", "health_report", "love_report", "physique_report", "description", "interpretation", "observation", "prediction"];
    
    const extractText = (val: any): string => {
      if (!val) return "";
      if (typeof val === "string") return val;
      if (Array.isArray(val)) {
        return val.map((v: any) => extractText(v)).filter(Boolean).join("\n\n");
      }
      if (typeof val === "object") {
        if (val.desc) return `${val.title ? val.title + ": " : ""}${val.desc}`;
        if (val.observation) return extractText(val.observation);
        return extractText(val.report || val.description || val.personality || val.prediction || "");
      }
      return String(val);
    };

    if (Array.isArray(d)) {
      return d.map(item => {
        const mainKey = keys.find(k => item[k]);
        return mainKey ? extractText(item[mainKey]) : extractText(item);
      }).filter(Boolean).join("\n\n");
    }
    
    const mainReportKey = Object.keys(d).find(k => keys.includes(k.toLowerCase()) || k.toLowerCase().includes("report"));
    const raw = mainReportKey ? d[mainReportKey] : d;
    return extractText(raw);
  };

  const fetchKundli = async (forcedDetails?: any) => {
    const hasForced = forcedDetails && typeof forcedDetails === 'object' && ('day' in forcedDetails || 'name' in forcedDetails || 'gender' in forcedDetails);

    const nameToUse = hasForced ? forcedDetails.name : kName;
    const genderToUse = hasForced ? forcedDetails.gender : kGender;
    const dayToUse = hasForced ? parseInt(forcedDetails.day) : parseInt(kDay);
    const monthToUse = hasForced ? parseInt(forcedDetails.month) : parseInt(kMonth);
    const yearToUse = hasForced ? parseInt(forcedDetails.year) : parseInt(kYear);
    const hourToUse = hasForced ? parseInt(forcedDetails.hour) : parseInt(kHour);
    const minToUse = hasForced ? parseInt(forcedDetails.min) : parseInt(kMin);
    const latToUse = hasForced ? parseFloat(forcedDetails.lat) : parseFloat(kLat);
    const lonToUse = hasForced ? parseFloat(forcedDetails.lon) : parseFloat(kLon);
    const tzoneToUse = hasForced ? parseFloat(forcedDetails.tzone) : parseFloat(kTzone);
    const locationToUse = hasForced ? forcedDetails.location_name : kLocationName;

    if (!nameToUse) {
      alert("Please enter a name");
      return;
    }

    if (isNaN(dayToUse) || dayToUse < 1 || dayToUse > 31) {
      alert("Invalid Date of Birth: Day must be a number between 1 and 31.");
      return;
    }
    if (isNaN(monthToUse) || monthToUse < 1 || monthToUse > 12) {
      alert("Invalid Date of Birth: Month must be a number between 1 and 12.");
      return;
    }
    if (isNaN(yearToUse) || yearToUse < 1800 || yearToUse > 2100) {
      alert("Invalid Date of Birth: Year must be a number between 1800 and 2100.");
      return;
    }
    if (isNaN(hourToUse) || hourToUse < 0 || hourToUse > 23) {
      alert("Invalid Time of Birth: Hour must be a number between 0 and 23.");
      return;
    }
    if (isNaN(minToUse) || minToUse < 0 || minToUse > 59) {
      alert("Invalid Time of Birth: Minute must be a number between 0 and 59.");
      return;
    }
    if (isNaN(latToUse) || latToUse < -90 || latToUse > 90) {
      alert("Invalid Latitude: Latitude must be a number between -90 and 90.");
      return;
    }
    if (isNaN(lonToUse) || lonToUse < -180 || lonToUse > 180) {
      alert("Invalid Longitude: Longitude must be a number between -180 and 180.");
      return;
    }
    if (isNaN(tzoneToUse) || tzoneToUse < -12 || tzoneToUse > 14) {
      alert("Invalid Timezone: Timezone must be a number between -12 and 14.");
      return;
    }

    setKundliLoading(true);
    try {
      const payload = {
        birthData: {
          day: dayToUse,
          month: monthToUse,
          year: yearToUse,
          hour: hourToUse,
          min: minToUse,
          lat: latToUse,
          lon: lonToUse,
          tzone: tzoneToUse,
          gender: genderToUse,
          name: nameToUse,
        },
        language: "en",
      };

      const found = await requestAstro("kundli", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (found) {
        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
        setKundliData(found);

        const birthDetails = {
          name: nameToUse,
          gender: genderToUse,
          day: dayToUse,
          month: monthToUse,
          year: yearToUse,
          hour: hourToUse,
          min: minToUse,
          lat: latToUse,
          lon: lonToUse,
          tzone: tzoneToUse,
          location_name: locationToUse,
        };

        // Local cache
        await safeStorage.setItem("guest_kundli_details", JSON.stringify(birthDetails));

        // Supabase DB save
        try {
          const sessionStr = await safeStorage.getItem("user_session");
          if (sessionStr) {
            const parsedUser = JSON.parse(sessionStr);
            const birthDetailsStr = JSON.stringify(birthDetails);
            
            const { error: updateErr } = await supabase
              .from("app_users")
              .update({ dob: birthDetailsStr })
              .eq("id", parsedUser.id);
            
            if (!updateErr) {
              console.log("[Kundli Screen] Birth details successfully persisted to Supabase app_users!");
              const updatedSession = { ...parsedUser, dob: birthDetailsStr };
              await safeStorage.setItem("user_session", JSON.stringify(updatedSession));
            }
          }
        } catch (dbErr) {
          console.error("[Kundli Screen] Error updating dob in DB:", dbErr);
        }
      } else {
        alert("Failed to connect to Vedic Astrology Server. Please check connection.");
      }
    } catch (e: any) {
      alert("Error generating chart: " + e.message);
    } finally {
      setKundliLoading(false);
    }
  };

  useEffect(() => {
    const loadBirthDetails = async () => {
      try {
        let details = null;
        const localDetailsStr = await safeStorage.getItem("guest_kundli_details");
        if (localDetailsStr) {
          try {
            details = JSON.parse(localDetailsStr);
          } catch (_) {}
        }

        const sessionStr = await safeStorage.getItem("user_session");
        if (sessionStr) {
          const parsedUser = JSON.parse(sessionStr);
          
          const { data: userProfile } = await supabase
            .from("app_users")
            .select("*")
            .eq("id", parsedUser.id)
            .maybeSingle();

          if (userProfile) {
            if (userProfile.dob && userProfile.dob.startsWith("{")) {
              try {
                details = JSON.parse(userProfile.dob);
              } catch (_) {}
            } else {
              if (userProfile.name) setKName(userProfile.name);
              if (userProfile.dob && userProfile.dob.includes("/")) {
                const parts = userProfile.dob.split("/");
                if (parts.length === 3) {
                  if (parts[0].length === 4) {
                    setKDay(parts[2]);
                    setKMonth(parts[1]);
                    setKYear(parts[0]);
                  } else {
                    setKDay(parts[0]);
                    setKMonth(parts[1]);
                    setKYear(parts[2]);
                  }
                }
              }
            }
          }
        }

        if (details) {
          if (details.name) setKName(details.name);
          if (details.gender) setKGender(details.gender);
          if (details.day) setKDay(String(details.day));
          if (details.month) setKMonth(String(details.month));
          if (details.year) setKYear(String(details.year));
          if (details.hour) setKHour(String(details.hour));
          if (details.min) setKMin(String(details.min));
          if (details.lat) setKLat(String(details.lat));
          if (details.lon) setKLon(String(details.lon));
          if (details.tzone) setKTzone(String(details.tzone));
          if (details.location_name) setKLocationName(details.location_name);

          const parsedDay = parseInt(details.day);
          const parsedYear = parseInt(details.year);
          const isDetailsValid = 
            !isNaN(parsedDay) && parsedDay >= 1 && parsedDay <= 31 && 
            !isNaN(parsedYear) && parsedYear >= 1800 && parsedYear <= 2100;

          if (isDetailsValid) {
            setTimeout(() => {
              fetchKundli(details);
            }, 300);
          }
        }
      } catch (err) {
        console.error("Error loading persistent birth details:", err);
      }
    };

    loadBirthDetails();
  }, []);

  const renderDashboard = () => (
    <>
      {/* Core Astrological Elements */}
      <View style={s.card}>
        <View style={s.cardHead}>
          <Ionicons name="sunny-outline" size={16} color={A.orange} />
          <Text style={s.cardTitle}>Astrological Core</Text>
        </View>
        <View style={s.profileGrid}>
          {[
            { label: "Rashi (Moon Sign)", value: kundliData.core?.sign || "-" },
            { label: "Ascendant (Lagna)", value: kundliData.core?.ascendant || "-" },
            { label: "Nakshatra", value: kundliData.core?.Naksahtra || kundliData.panchang?.nakshatra || "-" },
            { label: "Nakshatra Lord", value: kundliData.core?.NaksahtraLord || "-" },
          ].map((item, idx) => (
            <View key={idx} style={s.profileGridItem}>
              <Text style={s.profileKey}>{item.label}</Text>
              <Text style={s.profileVal}>{item.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Astro Profile */}
      <View style={s.card}>
        <View style={s.cardHead}>
          <Ionicons name="person-outline" size={16} color={A.orange} />
          <Text style={s.cardTitle}>Astro Profile</Text>
        </View>
        <View style={s.profileGrid}>
          {[
            { label: "Varna", value: kundliData.core?.Varna || "-" },
            { label: "Yoni", value: kundliData.core?.Yoni || "-" },
            { label: "Gan", value: kundliData.core?.Gan || "-" },
            { label: "Nadi", value: kundliData.core?.Nadi || "-" },
            { label: "Paya", value: kundliData.core?.Paya || kundliData.core?.paya || "-" },
            { label: "Sign Lord", value: kundliData.core?.SignLord || "-" },
            { label: "Manglik Status", value: kundliData.manglik?.manglik_status || (kundliData.manglik?.manglik_present ? "MANGLIK" : "NOT_MANGLIK") },
            { label: "Sadhesati Status", value: kundliData.sadhesati?.sadhesati_status || (kundliData.sadhesati?.is_sadhesati ? "ACTIVE" : "CLEAR") },
          ].map((item, idx) => (
            <View key={idx} style={s.profileGridItem}>
              <Text style={s.profileKey}>{item.label}</Text>
              <Text style={s.profileVal}>{item.value}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Birth Panchang */}
      <View style={s.card}>
        <View style={s.cardHead}>
          <Ionicons name="calendar-outline" size={16} color={A.orange} />
          <Text style={s.cardTitle}>Birth Panchang</Text>
        </View>
        {Object.entries(kundliData.panchang || {}).map(([key, val]: any, idx, arr) => (
          <View key={key}>
            <View style={s.profileRow}>
              <Text style={s.profileKey}>{key.toUpperCase()}</Text>
              <Text style={s.profileVal}>{String(val)}</Text>
            </View>
            {idx < arr.length - 1 && <View style={s.divider} />}
          </View>
        ))}
      </View>
    </>
  );

  const renderCharts = () => (
    <>
      {/* Interactive Chart Viewer */}
      <View style={s.card}>
        <View style={s.cardHead}>
          <Ionicons name="grid-outline" size={16} color={A.orange} />
          <Text style={s.cardTitle}>Birth Charts (Kundali)</Text>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.presetRow}>
          {[
            { key: "chart_d1", label: "Lagna (D1)" },
            { key: "chart_d9", label: "Navamsha (D9)" },
            { key: "chart_sun", label: "Sun Chart" },
            { key: "chart_moon", label: "Moon Chart" },
            { key: "chart_d2", label: "Hora (D2)" },
            { key: "chart_d3", label: "Drekkana (D3)" },
            { key: "chart_d10", label: "Dasamsa (D10)" },
          ].map((chart) => {
            const active = kundliActiveChart === chart.key;
            return (
              <TouchableOpacity
                key={chart.key}
                style={[s.presetChip, active && { borderColor: A.orange, backgroundColor: A.orangeBg }]}
                onPress={() => setKundliActiveChart(chart.key)}
              >
                <Text style={[s.presetChipText, active && { color: A.orange, fontFamily: "Outfit-Bold" }]}>{chart.label}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={{ alignItems: "center", justifyContent: "center", minHeight: 280, marginVertical: 12 }}>
          {kundliData[kundliActiveChart] && typeof kundliData[kundliActiveChart] === "string" && kundliData[kundliActiveChart].includes("<svg") ? (
            <SvgXml xml={kundliData[kundliActiveChart]} width="100%" height={280} />
          ) : (
            <NorthIndianChart planets={kundliData.planets || []} />
          )}
        </View>
      </View>

      {/* Planets positions */}
      <View style={s.card}>
        <View style={s.cardHead}>
          <Ionicons name="planet-outline" size={16} color={A.orange} />
          <Text style={s.cardTitle}>Planetary Positions</Text>
        </View>
        <View style={s.planetTableHeader}>
          <Text style={[s.planetTableHeaderCell, { flex: 1.5, textAlign: "left", paddingLeft: 6 }]}>PLANET</Text>
          <Text style={s.planetTableHeaderCell}>DEGREE</Text>
          <Text style={s.planetTableHeaderCell}>SIGN</Text>
          <Text style={[s.planetTableHeaderCell, { flex: 1.5 }]}>NAKSHATRA</Text>
        </View>
        {Array.isArray(kundliData.planets) && kundliData.planets.length > 0 ? (
          kundliData.planets.map((p: any, idx: number) => {
            const degree = typeof p.fullDegree === "number" ? p.fullDegree : parseFloat(p.fullDegree || "0");
            return (
              <View key={idx} style={s.planetTableRow}>
                <View style={[s.planetTableCell, { flex: 1.5, flexDirection: "row", alignItems: "center", gap: 6, justifyContent: "flex-start" }]}>
                  <View style={[s.retroDot, { backgroundColor: p.isRetro === "true" || p.isRetro === true ? "#f59e0b" : "#10b981" }]} />
                  <Text style={s.planetName}>{p.name || p.planet || ""}</Text>
                </View>
                <Text style={s.planetTableCell}>{degree.toFixed(2)}°</Text>
                <Text style={s.planetTableCell}>{p.sign || "-"}</Text>
                <Text style={[s.planetTableCell, { flex: 1.5 }]}>{p.nakshatra || "-"}</Text>
              </View>
            );
          })
        ) : (
          <Text style={s.noDataText}>No planetary details available</Text>
        )}
      </View>
    </>
  );

  const renderPredictions = () => (
    <>
      {/* Gemstone Suggestion */}
      {kundliData.gemstone && (
        <View style={s.card}>
          <View style={s.cardHead}>
            <Ionicons name="sparkles-outline" size={16} color={A.orange} />
            <Text style={s.cardTitle}>Auspicious Gemstone Recommendations</Text>
          </View>
          <View style={s.gemsRow}>
            {[
              { label: "LIFE GEM", data: kundliData.gemstone.LIFE, bg: "#f0f9ff", bdr: "#bae6fd", color: "#0369a1", emoji: "💎" },
              { label: "BENEFIC GEM", data: kundliData.gemstone.BENEFIC, bg: "#f0fdf4", bdr: "#bbf7d0", color: "#15803d", emoji: "✨" },
              { label: "LUCKY GEM", data: kundliData.gemstone.LUCKY, bg: "#fffbeb", bdr: "#fef08a", color: "#a16207", emoji: "👑" },
            ].map((gem, idx) => {
              if (!gem.data) return null;
              return (
                <View key={idx} style={[s.gemCard, { backgroundColor: gem.bg, borderColor: gem.bdr, flex: 1, borderRadius: 16, borderWidth: 1, padding: 10, alignItems: "center" }]}>
                  <Text style={[s.gemLabel, { color: gem.color, fontSize: 8, fontFamily: "Outfit-Bold", letterSpacing: 0.5, marginBottom: 2 }]}>{gem.label}</Text>
                  <Text style={[s.gemName, { color: gem.color, fontSize: 11, fontFamily: "Outfit-ExtraBold", textAlign: "center" }]}>{gem.emoji} {gem.data.name}</Text>
                  <View style={[s.divider, { backgroundColor: gem.bdr, marginVertical: 6 }]} />
                  <Text style={[s.gemDetail, { color: gem.color, fontSize: 8, fontFamily: "Outfit-Medium", marginTop: 1 }]}>Finger: {gem.data.wear_finger || "-"}</Text>
                  <Text style={[s.gemDetail, { color: gem.color, fontSize: 8, fontFamily: "Outfit-Medium", marginTop: 1 }]}>Metal: {gem.data.wear_metal || "-"}</Text>
                  <Text style={[s.gemDetail, { color: gem.color, fontSize: 8, fontFamily: "Outfit-Medium", marginTop: 1 }]}>Day: {gem.data.wear_day || "-"}</Text>
                </View>
              );
            })}
          </View>
        </View>
      )}

      {/* Rudraksha Suggestions */}
      {kundliData.rudraksha && (
        <View style={[s.card, { backgroundColor: "#fff7ed", borderColor: "#ffedd5" }]}>
          <View style={s.cardHead}>
            <Ionicons name="shield-checkmark-outline" size={16} color={A.orange} />
            <Text style={[s.cardTitle, { color: A.orange }]}>Rudraksha Recommendation</Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 }}>
            <Text style={{ fontSize: 24 }}>📿</Text>
            <View style={{ flex: 1 }}>
              <Text style={[s.rudrakshaName, { color: A.text }]}>{kundliData.rudraksha.name}</Text>
              <Text style={[s.rudrakshaRecommend, { color: A.orange, fontSize: 12, fontFamily: "Outfit-Medium", fontStyle: "italic" }]}>
                {kundliData.rudraksha.recommend || kundliData.rudraksha.recommendation}
              </Text>
            </View>
          </View>
          {!!kundliData.rudraksha.detail && (
            <Text style={[s.bodyText, { color: A.textM, marginTop: 4, fontSize: 13 }]}>{kundliData.rudraksha.detail}</Text>
          )}
        </View>
      )}

      {/* Predictions text lists */}
      {[
        { title: "Personal Character", data: kundliData.character, icon: "person", category: "character" },
        { title: "Career & Education", data: kundliData.career, icon: "briefcase", category: "career" },
        { title: "Love & Marriage", data: kundliData.love, icon: "heart", category: "relation" },
        { title: "Health & Vitality", data: kundliData.health, icon: "fitness", category: "health" },
        { title: "Physical Appearance", data: kundliData.physical, icon: "body", category: "physical" },
      ].map((sec, idx) => {
        const txt = getReportText(sec.data, sec.category);
        if (!txt) return null;
        return (
          <View key={idx} style={s.card}>
            <View style={s.cardHead}>
              <Ionicons name={sec.icon + "-outline" as any} size={16} color={A.orange} />
              <Text style={s.cardTitle}>{sec.title}</Text>
            </View>
            <Text style={s.bodyText}>{txt}</Text>
          </View>
        );
      })}
    </>
  );

  const renderDasha = () => (
    <>
      {/* Current Dasha */}
      <View style={s.card}>
        <View style={s.cardHead}>
          <Ionicons name="time-outline" size={16} color={A.orange} />
          <Text style={s.cardTitle}>Current Vimshottari Dasha</Text>
        </View>
        {[
          { label: "MAHADASHA (MAJOR)", data: kundliData.current_dasha?.mahadasha },
          { label: "ANTARDASHA (MINOR)", data: kundliData.current_dasha?.antardasha },
          { label: "PRATYANTAR (SUB-MINOR)", data: kundliData.current_dasha?.pratyantar || kundliData.current_dasha?.pratyantardasha },
        ].map((d, i) => {
          if (!d.data) return null;
          return (
            <View key={i} style={s.dashaCard}>
              <Text style={s.dashaLabel}>{d.label}</Text>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <Text style={s.dashaPlanet}>{d.data.planet}</Text>
                <Text style={s.dashaDates}>
                  {d.data.start} to {d.data.end}
                </Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* Timeline */}
      <View style={s.card}>
        <View style={s.cardHead}>
          <Ionicons name="list-outline" size={16} color={A.orange} />
          <Text style={s.cardTitle}>120-Year Mahadasha Timeline</Text>
        </View>
        {Array.isArray(kundliData.dasha) ? (
          <View style={{ paddingLeft: 6, paddingVertical: 10 }}>
            {kundliData.dasha.map((d: any, i: number, arr: any[]) => {
              const isCurrent = kundliData.current_dasha?.mahadasha?.planet?.toLowerCase() === d.planet?.toLowerCase();
              return (
                <View key={i} style={{ flexDirection: "row", minHeight: 56 }}>
                  <View style={{ alignItems: "center", marginRight: 16 }}>
                    <View style={{
                      width: 12,
                      height: 12,
                      borderRadius: 6,
                      backgroundColor: isCurrent ? A.orange : A.bdr2,
                      borderWidth: isCurrent ? 2.5 : 0,
                      borderColor: "#ffffff",
                      shadowColor: isCurrent ? A.orange : "transparent",
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 3,
                      elevation: 2,
                      zIndex: 1
                    }} />
                    {i < arr.length - 1 && (
                      <View style={{
                        flex: 1,
                        width: 2,
                        backgroundColor: A.bdr,
                        marginVertical: 4
                      }} />
                    )}
                  </View>
                  
                  <View style={{ flex: 1, paddingBottom: i < arr.length - 1 ? 16 : 0 }}>
                    <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                      <Text style={{ fontSize: 13, fontFamily: "Outfit-Bold", color: isCurrent ? A.orange : A.textM }}>
                        {d.planet} {isCurrent && "★ ACTIVE"}
                      </Text>
                      <Text style={{ fontSize: 12, fontFamily: "Outfit-Bold", color: isCurrent ? A.orange : A.textS }}>
                        {d.start} to {d.end}
                      </Text>
                    </View>
                    <Text style={{ fontSize: 11, fontFamily: "Outfit-Medium", color: A.textXs, marginTop: 2 }}>
                      Vimshottari Major Lord - {d.duration || "12"} Years
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        ) : (
          <Text style={s.noDataText}>Timeline details not available</Text>
        )}
      </View>
    </>
  );

  const renderNumerology = () => (
    <>
      <View style={s.numRow}>
        {[
          { label: "Radical No.", value: kundliData.numero_table?.radical_number || "-" },
          { label: "Destiny No.", value: kundliData.numero_table?.destiny_number || "-" },
          { label: "Name No.", value: kundliData.numero_table?.name_number || "-" },
        ].map((num, idx) => (
          <View key={idx} style={s.numCard}>
            <Text style={s.numLabel}>{num.label}</Text>
            <Text style={s.numVal}>{num.value}</Text>
          </View>
        ))}
      </View>

      {[
        { title: "Personality Report", data: kundliData.numero_report, icon: "star", category: "numero_report" },
        { title: "Favorable Timing", data: kundliData.numero_time, icon: "hourglass", category: "numero_time" },
        { title: "Places & Vastu", data: kundliData.numero_place_vastu, icon: "home", category: "numero_place_vastu" },
      ].map((sec, idx) => {
        const txt = getReportText(sec.data, sec.category);
        if (!txt) return null;
        return (
          <View key={idx} style={s.card}>
            <View style={s.cardHead}>
              <Ionicons name={sec.icon + "-outline" as any} size={16} color={A.orange} />
              <Text style={s.cardTitle}>{sec.title}</Text>
            </View>
            <Text style={s.bodyText}>{txt}</Text>
          </View>
        );
      })}
    </>
  );

  return (
    <View style={s.root}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[s.headerBar, { paddingTop: insets.top || 12 }]}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={s.headerTitleText}>{t("Vedic Kundli")}</Text>
          <View style={{ width: 38 }} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        <View style={s.sectionPad}>
          {/* Hero Banner */}
          <LinearGradient colors={[A.orangeBg, "#ffffff"]} style={s.sectionHero}>
            <Text style={s.sectionHeroEmoji}>📿</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.sectionHeroTitle}>Janam Kundli Report</Text>
              <Text style={s.sectionHeroSub}>Personalized Vedic Birth Chart & Predictions</Text>
            </View>
          </LinearGradient>

          {kundliData ? (
            <>
              {/* Header info */}
              <View style={[s.card, { backgroundColor: A.orangeBg, borderColor: A.orangeB2 }]}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <Text style={[s.cardTitle, { color: A.orange }]}>{kundliData.core?.name || kName}</Text>
                    <Text style={[s.bodyText, { fontSize: 12, marginTop: 2 }]}>
                      DOB: {kDay}/{kMonth}/{kYear} | {kHour}:{kMin}
                    </Text>
                    <Text style={[s.bodyText, { fontSize: 11, color: A.textS }]}>
                      Location: {kLocationName} ({kLat}°, {kLon}°)
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[s.presetChip, { borderColor: A.orange, backgroundColor: "#ffffff" }]}
                    onPress={() => {
                      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                      setKundliData(null);
                    }}
                  >
                    <Text style={[s.presetChipText, { color: A.orange, fontFamily: "Outfit-Bold" }]}>RESET</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Sub Nav Bar */}
              <View style={{ marginVertical: 10 }}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16, gap: 8 }}>
                  {(["dashboard", "charts", "predictions", "dasha", "numerology"] as const).map((tab) => {
                    const active = kundliActiveTab === tab;
                    const icons: Record<string, string> = {
                      dashboard: "grid-outline",
                      charts: "analytics-outline",
                      predictions: "sparkles-outline",
                      dasha: "time-outline",
                      numerology: "calculator-outline",
                    };
                    const labels: Record<string, string> = {
                      dashboard: "Core Info",
                      charts: "Charts",
                      predictions: "Predictions",
                      dasha: "Dasha & Dosh",
                      numerology: "Numerology",
                    };
                    return (
                      <TouchableOpacity
                        key={tab}
                        style={[
                          s.presetChip,
                          { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 10, paddingHorizontal: 14, borderRadius: 20 },
                          active ? { borderColor: A.orange, backgroundColor: A.orangeBg } : { borderColor: A.bdr2, backgroundColor: A.bgSoft }
                        ]}
                        onPress={() => {
                          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                          setKundliActiveTab(tab);
                        }}
                        activeOpacity={0.8}
                      >
                        <Ionicons name={icons[tab] as any} size={14} color={active ? A.orange : A.textS} />
                        <Text style={[s.presetChipText, { fontSize: 12 }, active && { color: A.orange, fontFamily: "Outfit-Bold" }]}>
                          {labels[tab]}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>

              {/* Sub Tab content rendering */}
              {kundliActiveTab === "dashboard" && renderDashboard()}
              {kundliActiveTab === "charts" && renderCharts()}
              {kundliActiveTab === "predictions" && renderPredictions()}
              {kundliActiveTab === "dasha" && renderDasha()}
              {kundliActiveTab === "numerology" && renderNumerology()}
            </>
          ) : (
            <View style={s.card}>
              {/* Input Form */}
              <View style={s.cardHead}>
                <Ionicons name="create-outline" size={16} color={A.orange} />
                <Text style={s.cardTitle}>Enter Birth Details</Text>
              </View>

              <Text style={s.inputLabel}>FULL NAME</Text>
              <View style={[s.inputWrapper, focusedField === "name" && { borderColor: A.orange, backgroundColor: A.orangeBg }]}>
                <Ionicons name="person-outline" size={16} color={focusedField === "name" ? A.orange : A.textS} style={s.inputIcon} />
                <TextInput
                  style={s.inputField}
                  placeholder="e.g. Ramesh Kumar"
                  placeholderTextColor={A.textXs}
                  value={kName}
                  onChangeText={setKName}
                  onFocus={() => setFocusedField("name")}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              <Text style={s.inputLabel}>GENDER</Text>
              <View style={s.genderRow}>
                <TouchableOpacity
                  style={[
                    s.genderBtn,
                    kGender === "male" && { borderColor: "#3b82f6", backgroundColor: "#eff6ff" }
                  ]}
                  onPress={() => setKGender("male")}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Ionicons name="male-outline" size={14} color={kGender === "male" ? "#1d4ed8" : A.textS} />
                    <Text style={[s.genderBtnText, kGender === "male" && { color: "#1d4ed8" }]}>MALE</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    s.genderBtn,
                    kGender === "female" && { borderColor: "#db2777", backgroundColor: "#fdf2f8" }
                  ]}
                  onPress={() => setKGender("female")}
                >
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <Ionicons name="female-outline" size={14} color={kGender === "female" ? "#be185d" : A.textS} />
                    <Text style={[s.genderBtnText, kGender === "female" && { color: "#be185d" }]}>FEMALE</Text>
                  </View>
                </TouchableOpacity>
              </View>

              <Text style={s.inputLabel}>DATE OF BIRTH (DD/MM/YYYY)</Text>
              <View style={s.birthRow}>
                <View style={[s.inputWrapper, { flex: 1, marginBottom: 0 }, focusedField === "day" && { borderColor: A.orange, backgroundColor: A.orangeBg }]}>
                  <Ionicons name="calendar-outline" size={15} color={focusedField === "day" ? A.orange : A.textS} style={s.inputIcon} />
                  <TextInput
                    style={[s.inputField, { textAlign: "center" }]}
                    placeholder="DD"
                    placeholderTextColor={A.textXs}
                    value={kDay}
                    onChangeText={setKDay}
                    keyboardType="numeric"
                    maxLength={2}
                    onFocus={() => setFocusedField("day")}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
                <View style={[s.inputWrapper, { flex: 1, marginBottom: 0 }, focusedField === "month" && { borderColor: A.orange, backgroundColor: A.orangeBg }]}>
                  <TextInput
                    style={[s.inputField, { textAlign: "center" }]}
                    placeholder="MM"
                    placeholderTextColor={A.textXs}
                    value={kMonth}
                    onChangeText={setKMonth}
                    keyboardType="numeric"
                    maxLength={2}
                    onFocus={() => setFocusedField("month")}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
                <View style={[s.inputWrapper, { flex: 1.5, marginBottom: 0 }, focusedField === "year" && { borderColor: A.orange, backgroundColor: A.orangeBg }]}>
                  <TextInput
                    style={[s.inputField, { textAlign: "center" }]}
                    placeholder="YYYY"
                    placeholderTextColor={A.textXs}
                    value={kYear}
                    onChangeText={setKYear}
                    keyboardType="numeric"
                    maxLength={4}
                    onFocus={() => setFocusedField("year")}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>

              <Text style={s.inputLabel}>TIME OF BIRTH (24 HR FORMAT - HH:MM)</Text>
              <View style={s.birthRow}>
                <View style={[s.inputWrapper, { flex: 1, marginBottom: 0 }, focusedField === "hour" && { borderColor: A.orange, backgroundColor: A.orangeBg }]}>
                  <Ionicons name="time-outline" size={15} color={focusedField === "hour" ? A.orange : A.textS} style={s.inputIcon} />
                  <TextInput
                    style={[s.inputField, { textAlign: "center" }]}
                    placeholder="HH"
                    placeholderTextColor={A.textXs}
                    value={kHour}
                    onChangeText={setKHour}
                    keyboardType="numeric"
                    maxLength={2}
                    onFocus={() => setFocusedField("hour")}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
                <View style={[s.inputWrapper, { flex: 1, marginBottom: 0 }, focusedField === "min" && { borderColor: A.orange, backgroundColor: A.orangeBg }]}>
                  <TextInput
                    style={[s.inputField, { textAlign: "center" }]}
                    placeholder="MM"
                    placeholderTextColor={A.textXs}
                    value={kMin}
                    onChangeText={setKMin}
                    keyboardType="numeric"
                    maxLength={2}
                    onFocus={() => setFocusedField("min")}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>

              <Text style={s.inputLabel}>BIRTH CITY</Text>
              <View style={[s.inputWrapper, focusedField === "city" && { borderColor: A.orange, backgroundColor: A.orangeBg }]}>
                <Ionicons name="map-outline" size={16} color={focusedField === "city" ? A.orange : A.textS} style={s.inputIcon} />
                <TextInput
                  style={s.inputField}
                  placeholder="e.g. Mumbai, India"
                  placeholderTextColor={A.textXs}
                  value={kLocationName}
                  onChangeText={setKLocationName}
                  onFocus={() => setFocusedField("city")}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              <View style={s.birthRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.inputLabel}>LATITUDE</Text>
                  <View style={[s.inputWrapper, { marginBottom: 0 }, focusedField === "lat" && { borderColor: A.orange, backgroundColor: A.orangeBg }]}>
                    <TextInput
                      style={[s.inputField, { textAlign: "center" }]}
                      placeholder="e.g. 19.076"
                      placeholderTextColor={A.textXs}
                      value={kLat}
                      onChangeText={setKLat}
                      keyboardType="numeric"
                      onFocus={() => setFocusedField("lat")}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.inputLabel}>LONGITUDE</Text>
                  <View style={[s.inputWrapper, { marginBottom: 0 }, focusedField === "lon" && { borderColor: A.orange, backgroundColor: A.orangeBg }]}>
                    <TextInput
                      style={[s.inputField, { textAlign: "center" }]}
                      placeholder="e.g. 72.877"
                      placeholderTextColor={A.textXs}
                      value={kLon}
                      onChangeText={setKLon}
                      keyboardType="numeric"
                      onFocus={() => setFocusedField("lon")}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.inputLabel}>TIMEZONE</Text>
                  <View style={[s.inputWrapper, { marginBottom: 0 }, focusedField === "tzone" && { borderColor: A.orange, backgroundColor: A.orangeBg }]}>
                    <TextInput
                      style={[s.inputField, { textAlign: "center" }]}
                      placeholder="e.g. 5.5"
                      placeholderTextColor={A.textXs}
                      value={kTzone}
                      onChangeText={setKTzone}
                      keyboardType="numeric"
                      onFocus={() => setFocusedField("tzone")}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                </View>
              </View>

              <Text style={[s.inputLabel, { color: A.textS, fontSize: 11, marginTop: 12 }]}>QUICK COORDINATE PRESETS</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.presetRow}>
                {PRESETS.map((preset) => {
                  const isSelected = kLocationName === preset.name && kLat === preset.lat && kLon === preset.lon;
                  return (
                    <TouchableOpacity
                      key={preset.name}
                      style={[s.presetChip, isSelected && { borderColor: A.orange, backgroundColor: A.orangeBg }]}
                      onPress={() => {
                        setKLat(preset.lat);
                        setKLon(preset.lon);
                        setKTzone(preset.tzone);
                        setKLocationName(preset.name);
                      }}
                    >
                      <Text style={[s.presetChipText, isSelected && { color: A.orange, fontFamily: "Outfit-Bold" }]}>{preset.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              <TouchableOpacity style={s.orangeBtn} onPress={fetchKundli} disabled={kundliLoading}>
                {kundliLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={s.orangeBtnText}>GENERATE KUNDLI REPORT</Text>
                )}
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const MX = 16;
const s = StyleSheet.create({
  root:  { flex:1, backgroundColor:A.bg },
  scroll:{ paddingBottom:40 },

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
  sectionHero: { flexDirection:"row", alignItems:"center", paddingHorizontal:MX, paddingTop:20, paddingBottom:22, gap:14 },
  sectionHeroEmoji: { fontSize:36 },
  sectionHeroTitle: { fontSize:24, fontFamily:"Outfit-ExtraBold", color:A.text },
  sectionHeroSub: { fontSize:12, fontFamily:"Outfit-Medium", color:A.textS, marginTop:2 },

  // Card
  card: { marginHorizontal:MX, marginBottom:12, backgroundColor:A.card, borderRadius:24, borderWidth:1, borderColor:A.bdr, padding:18, shadowColor:"#000", shadowOffset:{width:0,height:2}, shadowOpacity:0.03, shadowRadius:8, elevation:2 },
  cardHead: { flexDirection:"row", alignItems:"center", gap:10, marginBottom:14 },
  cardTitle: { fontSize:15, fontFamily:"Outfit-Bold", color:A.textM },

  // Grid / Row Info lists
  profileGrid: { flexDirection: "row", flexWrap: "wrap", rowGap: 14, columnGap: 10 },
  profileGridItem: { width: (width - MX*2 - 36 - 10)/2, backgroundColor: A.bgSoft, padding: 10, borderRadius: 14, borderWidth: 0.5, borderColor: A.bdr2 },
  profileKey: { fontSize: 9.5, fontFamily: "Outfit-Bold", color: A.textS, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 2 },
  profileVal: { fontSize: 13, fontFamily: "Outfit-ExtraBold", color: A.textM },
  profileRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10 },
  divider: { height: 1, backgroundColor: A.bdr },

  // Preset chips
  presetRow: { paddingVertical: 6, gap: 8 },
  presetChip: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 14, backgroundColor: A.bgSoft, borderWidth: 1, borderColor: A.bdr2 },
  presetChipText: { fontSize: 11, fontFamily: "Outfit-Medium", color: A.textS },

  // Planets Table
  planetTableHeader: { flexDirection: "row", backgroundColor: A.bgSoft, paddingVertical: 8, borderRadius: 8, marginBottom: 6 },
  planetTableHeaderCell: { flex: 1, fontSize: 9, fontFamily: "Outfit-Bold", color: A.textS, textAlign: "center" },
  planetTableRow: { flexDirection: "row", paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: A.bdr, alignItems: "center" },
  planetTableCell: { flex: 1, fontSize: 11.5, fontFamily: "Outfit-Bold", color: A.textM, textAlign: "center" },
  planetName: { fontSize: 12, fontFamily: "Outfit-ExtraBold", color: A.textM },
  retroDot: { width: 6, height: 6, borderRadius: 3 },
  noDataText: { textAlign: "center", paddingVertical: 20, color: A.textXs, fontFamily: "Outfit-Medium" },

  // Gemstone suggestion
  gemsRow: { flexDirection: "row", gap: 6, marginTop: 4 },
  gemCard: { alignItems: "center" },
  gemLabel: { textTransform: "uppercase" },
  gemName: { marginTop: 4 },
  gemDetail: { opacity: 0.8 },

  // Rudraksha suggestion
  rudrakshaName: { fontSize: 15, fontFamily: "Outfit-ExtraBold" },
  rudrakshaRecommend: { marginTop: 2 },

  // Vimshottari dasha
  dashaCard: { backgroundColor: A.bgSoft, padding: 12, borderRadius: 14, borderLeftWidth: 3, borderLeftColor: A.orange, marginBottom: 8 },
  dashaLabel: { fontSize: 9, fontFamily: "Outfit-Bold", color: A.textS, letterSpacing: 0.5, marginBottom: 4 },
  dashaPlanet: { fontSize: 15, fontFamily: "Outfit-ExtraBold", color: A.textM },
  dashaDates: { fontSize: 12, fontFamily: "Outfit-Bold", color: A.orange },

  // Numerology
  numRow: { flexDirection: "row", gap: 8, marginHorizontal: MX, marginBottom: 12 },
  numCard: { flex: 1, backgroundColor: A.bgSoft, borderRadius: 16, borderLeftWidth: 3, borderLeftColor: A.orange, padding: 12, alignItems: "center", borderWidth: 0.5, borderColor: A.bdr2 },
  numLabel: { fontSize: 9, fontFamily: "Outfit-Bold", color: A.textS, letterSpacing: 0.5, marginBottom: 4 },
  numVal: { fontSize: 20, fontFamily: "Outfit-ExtraBold", color: A.orange },

  // Input Field styles
  inputLabel: { fontSize: 9, fontFamily: "Outfit-Bold", color: A.textS, letterSpacing: 1, marginTop: 14, marginBottom: 6, marginLeft: 2 },
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: A.bgSoft, borderWidth: 1, borderColor: A.bdr2, borderRadius: 16, height: 48, paddingHorizontal: 12, marginBottom: 2 },
  inputIcon: { marginRight: 8 },
  inputField: { flex: 1, fontSize: 13.5, fontFamily: "Outfit-Bold", color: A.textM, padding: 0 },
  genderRow: { flexDirection: "row", gap: 10, marginTop: 2 },
  genderBtn: { flex: 1, height: 44, borderRadius: 14, borderWidth: 1, borderColor: A.bdr2, backgroundColor: A.bgSoft, justifyContent: "center", alignItems: "center" },
  genderBtnText: { fontSize: 12, fontFamily: "Outfit-Bold", color: A.textS },
  birthRow: { flexDirection: "row", gap: 8 },

  // Orange Action Button
  orangeBtn: { backgroundColor: A.orange, borderRadius: 16, height: 50, alignItems: "center", justifyContent: "center", marginTop: 20 },
  orangeBtnText: { fontSize: 13.5, fontFamily: "Outfit-ExtraBold", color: "#fff", letterSpacing: 0.5 },
  bodyText: { fontSize: 14, fontFamily: "Outfit-Medium", color: A.textS, lineHeight: 22 },
});
