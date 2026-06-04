import React, { useState, useEffect } from "react";
import { useLocalSearchParams } from "expo-router";
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
  Image,
} from "react-native";
import { useLanguage } from "../../context/LanguageContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Line, Path, Text as SvgText, SvgXml } from "react-native-svg";
import Constants from "expo-constants";
import { safeStorage } from "../../services/storage";
import { supabase } from "../../services/supabase";
import { requestAstro } from "../../services/api";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
const { width } = Dimensions.get("window");

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


// ── App Design System (matches home.tsx / puja.tsx) ─────────────────────────
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

// ── Zodiac Sign Data ─────────────────────────────────────────────────────────
const SIGNS = [
  { id:"aries",       name:"Aries",       emoji:"♈", vedic:"मेष",     color:"#ef4444", bg:"#fef2f2", element:"Fire",  eEmoji:"🔥", planet:"Mars",    range:"Mar 21 – Apr 19", name_Hindi:"मेष",     name_Gujarati:"મેષ",   name_Marathi:"मेष",   name_Tamil:"மேஷம்",       name_Telugu:"మేషం" },
  { id:"taurus",      name:"Taurus",      emoji:"♉", vedic:"वृषभ",    color:"#16a34a", bg:"#f0fdf4", element:"Earth", eEmoji:"🌍", planet:"Venus",   range:"Apr 20 – May 20", name_Hindi:"वृषभ",    name_Gujarati:"વૃષભ",  name_Marathi:"वृषभ",  name_Tamil:"ரிஷபம்",      name_Telugu:"వృషభం" },
  { id:"gemini",      name:"Gemini",      emoji:"♊", vedic:"मिथुन",   color:"#d97706", bg:"#fffbeb", element:"Air",   eEmoji:"💨", planet:"Mercury", range:"May 21 – Jun 20", name_Hindi:"मिथुन",   name_Gujarati:"મિથુન", name_Marathi:"मिथुन", name_Tamil:"மிதுனம்",     name_Telugu:"మిథునం" },
  { id:"cancer",      name:"Cancer",      emoji:"♋", vedic:"कर्क",    color:"#0891b2", bg:"#ecfeff", element:"Water", eEmoji:"💧", planet:"Moon",    range:"Jun 21 – Jul 22", name_Hindi:"कर्क",    name_Gujarati:"કર્ક",  name_Marathi:"कर्क",  name_Tamil:"கடகம்",       name_Telugu:"కర్కాటకం" },
  { id:"leo",         name:"Leo",         emoji:"♌", vedic:"सिंह",    color:"#ea580c", bg:"#fff7ed", element:"Fire",  eEmoji:"🔥", planet:"Sun",     range:"Jul 23 – Aug 22", name_Hindi:"सिंह",    name_Gujarati:"સિંહ",  name_Marathi:"सिंह",  name_Tamil:"சிம்மம்",     name_Telugu:"సింహం" },
  { id:"virgo",       name:"Virgo",       emoji:"♍", vedic:"कन्या",   color:"#15803d", bg:"#f0fdf4", element:"Earth", eEmoji:"🌍", planet:"Mercury", range:"Aug 23 – Sep 22", name_Hindi:"कन्या",   name_Gujarati:"કન્યા", name_Marathi:"कन्या", name_Tamil:"கன்னி",       name_Telugu:"కన్య" },
  { id:"libra",       name:"Libra",       emoji:"♎", vedic:"तुला",    color:"#be185d", bg:"#fdf2f8", element:"Air",   eEmoji:"💨", planet:"Venus",   range:"Sep 23 – Oct 22", name_Hindi:"तुला",    name_Gujarati:"તુલા",  name_Marathi:"तुला",  name_Tamil:"துலாம்",      name_Telugu:"తుల" },
  { id:"scorpio",     name:"Scorpio",     emoji:"♏", vedic:"वृश्चिक", color:"#dc2626", bg:"#fef2f2", element:"Water", eEmoji:"💧", planet:"Mars",    range:"Oct 23 – Nov 21", name_Hindi:"वृश्चिक", name_Gujarati:"વૃશ્ચ", name_Marathi:"वृश्चिक",name_Tamil:"விருச்சிகம்",name_Telugu:"వృశ్చికం" },
  { id:"sagittarius", name:"Sagittarius", emoji:"♐", vedic:"धनु",     color:"#7c3aed", bg:"#f5f3ff", element:"Fire",  eEmoji:"🔥", planet:"Jupiter", range:"Nov 22 – Dec 21", name_Hindi:"धनु",     name_Gujarati:"ધન",    name_Marathi:"धनु",   name_Tamil:"தனுசு",       name_Telugu:"ధనస్సు" },
  { id:"capricorn",   name:"Capricorn",   emoji:"♑", vedic:"मकर",     color:"#475569", bg:"#f8fafc", element:"Earth", eEmoji:"🌍", planet:"Saturn",  range:"Dec 22 – Jan 19", name_Hindi:"मकर",     name_Gujarati:"મકર",   name_Marathi:"मकर",   name_Tamil:"மகரம்",       name_Telugu:"మకరం" },
  { id:"aquarius",    name:"Aquarius",    emoji:"♒", vedic:"कुंभ",    color:"#1d4ed8", bg:"#eff6ff", element:"Air",   eEmoji:"💨", planet:"Saturn",  range:"Jan 20 – Feb 18", name_Hindi:"कुंभ",    name_Gujarati:"કુંભ",  name_Marathi:"कुंभ",  name_Tamil:"கும்பம்",     name_Telugu:"కుంభం" },
  { id:"pisces",      name:"Pisces",      emoji:"♓", vedic:"मीन",     color:"#0369a1", bg:"#f0f9ff", element:"Water", eEmoji:"💧", planet:"Jupiter", range:"Feb 19 – Mar 20", name_Hindi:"मीन",     name_Gujarati:"મીન",   name_Marathi:"मीन",   name_Tamil:"மீனம்",       name_Telugu:"మీనం" },
];

const RASHI_MAP: Record<string,string> = {
  aries:"Mesh", taurus:"Vrishabh", gemini:"Mithun", cancer:"Kark",
  leo:"Singh", virgo:"Kanya", libra:"Tula", scorpio:"Vrishchik",
  sagittarius:"Dhanu", capricorn:"Makar", aquarius:"Kumbh", pisces:"Meen",
};

// ── Offline Fallback ─────────────────────────────────────────────────────────
const getOffline = (signId: string, period: string) => {
  const r = RASHI_MAP[signId] || "Rashi";
  const remedies: Record<string,string> = {
    aries:"Offer red vermilion and flowers to Lord Hanuman. Chant Hanuman Chalisa daily.", taurus:"Pour fresh water on white sandalwood. Chant Laxmi Beej mantra.", gemini:"Feed green grass to cows. Chant Budh Grah peace mantra.", cancer:"Pour milk and gangajal over Lord Shiva Lingam on Mondays.", leo:"Offer Arghya to the rising Sun. Chant Aditya Hrudaya Stotra.", virgo:"Distribute green grains or clothes to the needy.", libra:"Light a ghee lamp in temple in evening.", scorpio:"Chant Hanuman Chalisa. Keep a small copper piece in your pocket.", sagittarius:"Chant Vishnu Sahasranama. Put saffron tilak on forehead.", capricorn:"Light a mustard oil lamp under Peepal tree on Saturdays.", aquarius:"Chant Shani Dev mantra. Keep a raw iron ring on your middle finger.", pisces:"Feed yellow gram flour sweets to priests or under Peepal tree.",
  };
  const colors: Record<string,string> = { aries:"Crimson Red", taurus:"Creamy White", gemini:"Emerald Green", cancer:"Silver Pearl", leo:"Golden Saffron", virgo:"Deep Olive", libra:"Vibrant Pink", scorpio:"Scarlet Orange", sagittarius:"Bright Yellow", capricorn:"Slate Gray", aquarius:"Indigo Blue", pisces:"Golden Yellow" };
  const nums: Record<string,string> = { aries:"9", taurus:"6", gemini:"5", cancer:"2", leo:"1", virgo:"5", libra:"6", scorpio:"9", sagittarius:"3", capricorn:"8", aquarius:"8", pisces:"3" };
  const content: Record<string,string> = {
    daily:`A highly favorable day awaits ${r} natives. Planetary alignments indicate positive opportunities in career and personal ventures. Stay focused and maintain balance in all interactions today.`,
    weekly:`This week indicates dynamic changes for ${r}. Avoid arguments and focus on spiritual chanting for ultimate mental peace and clarity throughout the week.`,
    monthly:`This month will be stable with gains. Saturn aligns to reward discipline. Family relations improve significantly this month.`,
    yearly:`Major auspicious transits arrive for ${r} this year. Jupiter guarantees spiritual and career growth beyond expectations.`,
  };
  return {
    sign:signId, period_type:period,
    reference_date:new Date().toISOString().split("T")[0],
    date_label:`${r} ${period.charAt(0).toUpperCase()+period.slice(1)} Horoscope`,
    content:content[period]||content.daily,
    lucky_number:nums[signId]||"5",
    lucky_color:colors[signId]||"Saffron",
    remedy:remedies[signId]||"Chant holy mantras daily.",
    ratings:[{label:"Health",score:4},{label:"Wealth",score:2},{label:"Family",score:5},{label:"Love Matters",score:3},{label:"Occupation",score:1},{label:"Married Life",score:3}],
    sections:period!=="daily"?[
      {heading:"Love & Family",body:"Cosmic energy ensures coordination with family members. A perfect time for domestic happiness and trust."},
      {heading:"Career & Work",body:"Teamwork with colleagues leads to professional success and recognition."},
      {heading:"Health & Vitality",body:"Practice yoga and pranayama in the morning to maintain sound health and balance."},
    ]:undefined,
  };
};

// ── Color helpers ────────────────────────────────────────────────────────────
const colorHex = (n: string) => {
  const c = n.toLowerCase();
  if (c.includes("red")||c.includes("crimson")||c.includes("scarlet")) return "#ef4444";
  if (c.includes("blue")||c.includes("indigo")) return "#3b82f6";
  if (c.includes("green")||c.includes("emerald")||c.includes("olive")) return "#16a34a";
  if (c.includes("yellow")||c.includes("bright")) return "#ca8a04";
  if (c.includes("pink")) return "#db2777";
  if (c.includes("white")||c.includes("cream")||c.includes("pearl")) return "#94a3b8";
  if (c.includes("saffron")||c.includes("orange")) return "#ea580c";
  if (c.includes("gray")||c.includes("slate")) return "#475569";
  if (c.includes("gold")||c.includes("golden")) return "#ca8a04";
  if (c.includes("purple")||c.includes("violet")) return "#7c3aed";
  if (c.includes("silver")) return "#64748b";
  return "#ea580c";
};


// ═══════════════════════════════════════════════════════════════════════════
export default function AstroScreen() {
  const { t, locale } = useLanguage();
  const loc = locale as "en"|"Hindi"|"Gujarati"|"Marathi"|"Tamil"|"Telugu";
  const { tab } = useLocalSearchParams<{ tab?: string }>();

  const [topTab, setTopTab] = useState<"rashi" | "kundli" | "panchang">("rashi");

  useEffect(() => {
    if (tab === "rashi" || tab === "kundli" || tab === "panchang") {
      setTopTab(tab);
    }
  }, [tab]);

  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Rashi
  const [sign, setSign] = useState(SIGNS[0]);
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly" | "yearly">("daily");
  const [hData, setHData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

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

  // Panchang State
  const [panchangData, setPanchangData] = useState<any>(null);
  const [panchangLoading, setPanchangLoading] = useState(false);


  const getName = (s: typeof SIGNS[0]) => {
    if (loc==="en") return s.name;
    const k = `name_${loc}` as keyof typeof s;
    return (s[k] as string)||s.name;
  };

  const periodLabel = (p: string) => {
    const m: Record<string,Record<string,string>> = {
      daily:  {en:"Today",  Hindi:"आज",       Gujarati:"આજ",   Marathi:"आज",   Tamil:"இன்று",   Telugu:"నేడు"},
      weekly: {en:"Weekly", Hindi:"साप्ताहिक",Gujarati:"સાપ્ત",Marathi:"साप्त",Tamil:"வாராந்தர",Telugu:"వారాంత"},
      monthly:{en:"Monthly",Hindi:"मासिक",    Gujarati:"માસ",  Marathi:"मासिक",Tamil:"மாதாந்தர",Telugu:"నెలవారీ"},
      yearly: {en:"Yearly", Hindi:"वार्षिक",  Gujarati:"વાર્ષ",Marathi:"वार्षिक",Tamil:"வருடாந்தர",Telugu:"వార్షిక"},
    };
    return m[p]?.[loc]||m[p]?.en||p;
  };

  const fetchHoroscope = async (signId: string, per: string) => {
    setLoading(true); setExpanded(false);
    try {
      const data = await requestAstro(`horoscope?sign=${signId}&period=${per}`);
      setHData(data);
    } catch(err){
      console.error("[Astro Screen] fetchHoroscope failed, fallback to offline", err);
      setHData(getOffline(signId,per));
    } finally {
      setLoading(false);
    }
  };
  useEffect(()=>{ fetchHoroscope(sign.id, period); }, [sign, period]);

  const fetchPanchang = async () => {
    setPanchangLoading(true);
    try {
      const data = await requestAstro("panchang");
      setPanchangData(data);
    } catch (err) {
      console.error("[Astro Screen] fetchPanchang failed", err);
    } finally {
      setPanchangLoading(false);
    }
  };

  useEffect(() => {
    if (topTab === "panchang" && !panchangData) {
      fetchPanchang();
    }
  }, [topTab]);


  const fetchKundli = async (forcedDetails?: any) => {
    // Only treat forcedDetails as custom birth details if it has expected fields.
    // React Native's onPress passes a gesture event object which we must ignore.
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
    console.log('[Kundli Validation Inputs]', {
      nameToUse,
      genderToUse,
      day: { raw: kDay, parsed: dayToUse },
      month: { raw: kMonth, parsed: monthToUse },
      year: { raw: kYear, parsed: yearToUse },
      hour: { raw: kHour, parsed: hourToUse },
      min: { raw: kMin, parsed: minToUse },
      lat: { raw: kLat, parsed: latToUse },
      lon: { raw: kLon, parsed: lonToUse },
      tzone: { raw: kTzone, parsed: tzoneToUse },
      locationToUse
    });

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

        // Save birth details both locally and in Supabase app_users table!
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
              console.log("[Astro Kundli] Birth details successfully persisted to Supabase app_users!");
              // Also update local user session structure
              const updatedSession = { ...parsedUser, dob: birthDetailsStr };
              await safeStorage.setItem("user_session", JSON.stringify(updatedSession));
            } else {
              console.error("[Astro Kundli] Failed to update dob in DB:", updateErr);
            }
          }
        } catch (dbErr) {
          console.error("[Astro Kundli] Error updating dob in DB:", dbErr);
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

        // 1. Try local guest cache first for immediate load
        const localDetailsStr = await safeStorage.getItem("guest_kundli_details");
        if (localDetailsStr) {
          try {
            details = JSON.parse(localDetailsStr);
          } catch (_) {}
        }

        // 2. Read the user session and load from Supabase DB to keep it fully updated
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
              // Pre-populate name and split dob if in text format
              if (userProfile.name) {
                setKName(userProfile.name);
              }
              if (userProfile.dob && userProfile.dob.includes("/")) {
                const parts = userProfile.dob.split("/");
                if (parts.length === 3) {
                  // Handle both YYYY/MM/DD and DD/MM/YYYY formats
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
          // Populate states
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

          // Auto-trigger fetch Kundli only if the loaded cache details are valid!
          const parsedDay = parseInt(details.day);
          const parsedYear = parseInt(details.year);
          const isDetailsValid = 
            !isNaN(parsedDay) && parsedDay >= 1 && parsedDay <= 31 && 
            !isNaN(parsedYear) && parsedYear >= 1800 && parsedYear <= 2100;

          if (isDetailsValid) {
            setTimeout(() => {
              fetchKundli(details);
            }, 300);
          } else {
            console.warn('[Astro Screen] Bad cached guest_kundli_details found, ignoring and clearing...');
            safeStorage.removeItem("guest_kundli_details").catch(() => {});
          }
        }
      } catch (err) {
        console.error("Error loading persistent birth details:", err);
      }
    };

    loadBirthDetails();
  }, []);

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


  const dateStr = (() => {
    try {
      const d = hData?.reference_date ? new Date(hData.reference_date+"T12:00:00") : new Date();
      return d.toLocaleDateString("en-US",{weekday:"long",year:"numeric",month:"long",day:"numeric"}).toUpperCase();
    } catch { return new Date().toDateString().toUpperCase(); }
  })();

  const content: string = hData?.content||"";
  const LIMIT = 220;
  const isLong = content.length>LIMIT;
  const displayText = isLong&&!expanded ? content.slice(0,LIMIT).trimEnd()+"..." : content;

  // ── Top Section Tabs ──────────────────────────────────────────────────────
  const TopNavTabs = () => (
    <View style={s.topNav}>
      {(["rashi","kundli","panchang"] as const).map(tab=>{
        const active = topTab===tab;
        const icons: Record<string,string> = {rashi:"🔮",kundli:"📿",panchang:"📅"};
        const labels: Record<string,string> = {rashi:"Rashi",kundli:"Kundli",panchang:"Panchang"};
        return (
          <TouchableOpacity
            key={tab}
            style={[s.topNavItem, active&&s.topNavItemActive]}
            onPress={()=>{ LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut); setTopTab(tab); }}
            activeOpacity={0.8}
          >
            <Text style={s.topNavIcon}>{icons[tab]}</Text>
            <Text style={[s.topNavLabel, active&&s.topNavLabelActive]}>{labels[tab]}</Text>
            {active && <View style={s.topNavUnderline}/>}
          </TouchableOpacity>
        );
      })}
    </View>
  );

  // ── RASHI SECTION ─────────────────────────────────────────────────────────
  const RashiSection = () => (
    <>
      {/* Hero Banner */}
      <LinearGradient colors={[A.orangeBg, "#ffffff"]} style={s.heroBanner}>
        <View style={[s.heroBadge, {borderColor:sign.color, backgroundColor:sign.bg}]}>
          <Text style={s.heroBadgeEmoji}>{sign.emoji}</Text>
        </View>
        <View style={s.heroInfo}>
          <Text style={s.heroPredLabel}>{periodLabel(period).toUpperCase()} ASTRO PREDICTIONS</Text>
          <View style={s.heroNameRow}>
            <Text style={s.heroSignName}>{getName(sign)}</Text>
            <View style={s.vedicPill}>
              <Text style={s.vedicPillText}>{sign.vedic}</Text>
            </View>
          </View>
          {/* Period tabs */}
          <View style={s.periodRow}>
            {(["daily","weekly","monthly","yearly"] as const).map(p=>{
              const active = period===p;
              return (
                <TouchableOpacity
                  key={p}
                  style={[s.periodBtn, active&&s.periodBtnActive]}
                  onPress={()=>setPeriod(p)}
                  activeOpacity={0.8}
                >
                  {active&&<View style={s.periodDot}/>}
                  <Text style={[s.periodLabel, active&&s.periodLabelActive]}>{periodLabel(p)}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </LinearGradient>

      {/* Sign Selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.signRow}>
        {SIGNS.map(sg=>{
          const sel = sign.id===sg.id;
          return (
            <TouchableOpacity
              key={sg.id}
              style={[s.signChip, sel&&{borderColor:sg.color, backgroundColor:sg.bg}]}
              onPress={()=>{ LayoutAnimation.configureNext(LayoutAnimation.Presets.spring); setSign(sg); }}
              activeOpacity={0.8}
            >
              <View style={[s.signCircle, {backgroundColor:sel?sg.bg:A.bgSoft, borderColor:sel?sg.color:A.bdr2}]}>
                <Text style={s.signEmoji}>{sg.emoji}</Text>
              </View>
              <Text style={[s.signLabel, sel&&{color:sg.color, fontFamily:"Outfit-Bold"}]}>{sg.name}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Date badge */}
      <View style={s.dateBadgeRow}>
        <View style={s.dateBadge}>
          <Ionicons name="calendar-outline" size={11} color={A.textS}/>
          <Text style={s.dateBadgeText}>{dateStr}</Text>
        </View>
      </View>

      {loading ? (
        <View style={s.loadBox}>
          <ActivityIndicator size="large" color={A.orange}/>
          <Text style={s.loadText}>{t("Querying celestial movements...")}</Text>
        </View>
      ) : (
        <>
          {/* Forecast Card */}
          <View style={s.card}>
            <View style={s.cardHead}>
              <LinearGradient colors={[A.orange, A.orangeL]} style={s.cardIcon}>
                <Ionicons name="sunny" size={15} color="#fff"/>
              </LinearGradient>
              <View>
                <Text style={s.cardTitle}>{periodLabel(period)} Forecast</Text>
                <Text style={s.cardSub}>{sign.name.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={s.bodyText}>{displayText}</Text>
            {isLong&&(
              <TouchableOpacity onPress={()=>setExpanded(!expanded)} activeOpacity={0.7}>
                <Text style={s.showMore}>{expanded?t("Show Less"):t("Show More")}</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Cosmic Ratings */}
          {hData?.ratings&&hData.ratings.length>0&&(
            <View style={s.card}>
              <View style={s.cardHead}>
                <Ionicons name="star" size={16} color={A.orange}/>
                <Text style={s.cardTitle}>{t("Today's Cosmic Ratings")}</Text>
              </View>
              <View style={s.ratingsGrid}>
                {hData.ratings.map((r:any,i:number)=>(
                  <View key={i} style={s.ratingItem}>
                    <Text style={s.ratingLabel}>{r.label.toUpperCase()}</Text>
                    <View style={s.dotsRow}>
                      {[1,2,3,4,5].map(d=>(
                        <View key={d} style={[s.dot, d<=r.score?s.dotOn:s.dotOff]}/>
                      ))}
                    </View>
                    <Text style={s.ratingScore}>{r.score}/5</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Lucky for Today */}
          {(hData?.lucky_number||hData?.lucky_color)&&(
            <View style={s.card}>
              <View style={s.cardHead}>
                <Ionicons name="sunny-outline" size={16} color={A.orange}/>
                <Text style={s.cardTitle}>{t("Lucky for Today")}</Text>
              </View>
              {hData?.lucky_number&&(
                <View style={s.luckyRow}>
                  <View style={s.luckyLeft}>
                    <Ionicons name="apps-outline" size={14} color={A.textS}/>
                    <Text style={s.luckyKey}>{t("Number")}</Text>
                  </View>
                  <View style={s.luckyNumBadge}>
                    <Text style={s.luckyNumText}>{hData.lucky_number}</Text>
                  </View>
                </View>
              )}
              {hData?.lucky_color&&(()=>{
                const hex=colorHex(hData.lucky_color);
                return (
                  <View style={[s.luckyRow,{marginTop:12}]}>
                    <View style={s.luckyLeft}>
                      <Ionicons name="color-palette-outline" size={14} color={A.textS}/>
                      <Text style={s.luckyKey}>{t("Color")}</Text>
                    </View>
                    <View style={[s.luckyColorBadge,{backgroundColor:hex+"1a",borderColor:hex+"44",borderWidth:1}]}>
                      <View style={[s.colorDot,{backgroundColor:hex}]}/>
                      <Text style={[s.luckyColorText,{color:hex}]}>{hData.lucky_color}</Text>
                    </View>
                  </View>
                );
              })()}
            </View>
          )}

          {/* Remedy */}
          {hData?.remedy&&(
            <LinearGradient colors={[A.orange,"#f97316"]} style={s.remedyCard}>
              <View style={s.cardHead}>
                <Ionicons name="flask-outline" size={16} color="#fff"/>
                <Text style={[s.cardTitle,{color:"#fff"}]}>{t("TODAY'S REMEDY")}</Text>
              </View>
              <Text style={s.remedyText}>{hData.remedy}</Text>
            </LinearGradient>
          )}

          {/* Dynamic Sections (Weekly/Monthly/Yearly) */}
          {hData?.sections&&hData.sections.length>0&&hData.sections.map((sec:any,i:number)=>(
            <View key={i} style={s.card}>
              <View style={s.cardHead}>
                <Ionicons name="sparkles" size={14} color={A.orange}/>
                <Text style={s.cardTitle}>{sec.heading}</Text>
              </View>
              <Text style={s.bodyText}>{sec.body}</Text>
            </View>
          ))}

          {/* Sign Profile */}
          <View style={s.card}>
            <View style={s.cardHead}>
              <Ionicons name="moon-outline" size={16} color={A.orange}/>
              <Text style={s.cardTitle}>{t("Sign Profile")}</Text>
            </View>
            {[
              {k:"SYMBOL",       v:`${sign.emoji}  ${sign.name}`},
              {k:"ELEMENT",      v:`${sign.element}  ${sign.eEmoji}`},
              {k:"RULING PLANET",v:sign.planet},
              {k:"BIRTH RANGE",  v:sign.range},
            ].map((row,i,arr)=>(
              <View key={row.k}>
                <View style={s.profileRow}>
                  <Text style={s.profileKey}>{row.k}</Text>
                  <Text style={s.profileVal}>{row.v}</Text>
                </View>
                {i<arr.length-1&&<View style={s.divider}/>}
              </View>
            ))}
          </View>

          {/* Kundli CTA */}
          <LinearGradient colors={[A.orange,"#f97316"]} style={s.kundliCTA}>
            <View>
              <Text style={s.kundliCTATitle}>{t("Get Your Kundli")}</Text>
              <Text style={s.kundliCTASub}>{t("Free 25+ page personalized birth chart report.")}</Text>
            </View>
            <TouchableOpacity
              style={s.kundliCTABtn}
              onPress={()=>{ setTopTab("kundli"); }}
              activeOpacity={0.85}
            >
              <Text style={s.kundliCTABtnText}>{t("Check Now")} →</Text>
            </TouchableOpacity>
          </LinearGradient>

          {/* Note */}
          <View style={[s.card,{backgroundColor:A.bgSoft}]}>
            <View style={s.cardHead}>
              <Ionicons name="information-circle-outline" size={16} color={A.textS}/>
              <Text style={[s.cardTitle,{color:A.textS,fontSize:13}]}>{t("Astrological Note")}</Text>
            </View>
            <Text style={[s.bodyText,{color:A.textXs,fontSize:12}]}>
              {t("These predictions are based on your Moon sign for general guidance. For personalized insights, consult a Vedic astrologer.")}
            </Text>
          </View>
        </>
      )}
    </>
  );

  // ── KUNDLI SECTION ────────────────────────────────────────────────────────
  const KundliSection = () => {
    // Subcomponents for the results page
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

          {/* Chart Display Area */}
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
                <Text style={[s.rudrakshaRecommend, { color: A.orange, fontSize: 12, fontFamily: "Outfit-Medium", fontStyle: "italic", marginBottom: 0 }]}>
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
                    {/* Left Timeline Indicator */}
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
                    
                    {/* Timeline Content Info */}
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
        {/* Core numbers */}
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

        {/* Specific reports */}
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
      <View style={s.sectionPad}>
        {/* Hero */}
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
    );
  };

  // ── PANCHANG SECTION ──────────────────────────────────────────────────────
  const PanchangSection = () => {
    if (panchangLoading) {
      return (
        <View style={s.loadBox}>
          <ActivityIndicator size="large" color={A.orange} />
          <Text style={s.loadText}>{t("Fetching daily panchang calculations...")}</Text>
        </View>
      );
    }

    if (!panchangData) {
      return (
        <View style={s.loadBox}>
          <Text style={s.loadText}>{t("Unable to load Panchang. Please try again.")}</Text>
          <TouchableOpacity style={[s.orangeBtn, { paddingHorizontal: 20 }]} onPress={fetchPanchang}>
            <Text style={s.orangeBtnText}>{t("RETRY FETCH")}</Text>
          </TouchableOpacity>
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
        accentColor: "#ea580c", // Orange
        bgColor: "#ffffff",
        borderColor: "#ffedd5",
        iconName: "flame-outline",
        valColor: A.textM,
        keyColor: A.textS
      },
      sun_moon_calculations: {
        title: "Celestial Events",
        accentColor: "#7c3aed", // Purple
        bgColor: "#ffffff",
        borderColor: "#f3e8ff",
        iconName: "moon-outline",
        valColor: A.textM,
        keyColor: A.textS
      },
      auspicious_timings: {
        title: "Shubha Muhurat",
        accentColor: "#10b981", // Emerald green
        bgColor: "#f0fdf4",
        borderColor: "#bbf7d0",
        iconName: "checkmark-circle-outline",
        valColor: "#064e3b",
        keyColor: "#047857"
      },
      inauspicious_timings: {
        title: "Ashubha Muhurat",
        accentColor: "#ef4444", // Ruby red
        bgColor: "#fef2f2",
        borderColor: "#fca5a5",
        iconName: "close-circle-outline",
        valColor: "#7f1d1d",
        keyColor: "#b91c1c"
      },
      hindu_month_year: {
        title: "Traditional Vedic Calendar Details",
        accentColor: "#f97316", // Saffron orange text
        bgColor: "#0f172a", // Dark slate background
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

          // Define exact key order as shown on the website screenshot to ensure identical layout
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
                        {val}
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
                        {val}
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
          {/* Main row layout split into avatar profile & destiny detail */}
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
                {/* Real Pandit Ji Avatar Image */}
                <Image
                  source={require("../../assets/astrology/pandit_ji_avatar.png")}
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

              {/* Quote details block */}
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

              {/* Text Link interactive Action Button */}
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
                  setTopTab("kundli");
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

          {/* Active Today Zodiac icons list */}
          <View style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            borderTopWidth: 1,
            borderTopColor: "rgba(255, 255, 255, 0.1)",
            marginTop: 14,
            paddingTop: 12
          }}>
            <View style={{ flexDirection: "row", gap: -10 }}>
              {[
                require("../../assets/zodiac/aries.png"),
                require("../../assets/zodiac/leo.png"),
                require("../../assets/zodiac/sagittarius.png")
              ].map((img, idx) => (
                <View
                  key={idx}
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    borderWidth: 1.5,
                    borderColor: "rgba(255, 255, 255, 0.2)",
                    backgroundColor: "rgba(255, 255, 255, 0.15)",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 4
                  }}
                >
                  <Image
                    source={img}
                    style={{
                      width: "100%",
                      height: "100%",
                      tintColor: "#ffffff"
                    }}
                    resizeMode="contain"
                  />
                </View>
              ))}
            </View>
            <Text style={{
              fontSize: 8.5,
              fontFamily: "Outfit-Bold",
              color: "rgba(255, 255, 255, 0.65)",
              letterSpacing: 0.5,
              textTransform: "uppercase"
            }}>
              Active Today
            </Text>
          </View>
        </LinearGradient>
      </View>
    );
  };

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <View style={s.root}>
      {TopNavTabs()}
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
        {topTab==="rashi"      && RashiSection()}
        {topTab==="kundli"     && KundliSection()}
        {topTab==="panchang"   && PanchangSection()}
        <View style={{height:110}}/>
      </ScrollView>
    </View>
  );
}

// ── StyleSheet ────────────────────────────────────────────────────────────────
const MX = 16;
const DOT = 20;

const s = StyleSheet.create({
  root:  { flex:1, backgroundColor:A.bg },
  scroll:{ paddingBottom:20 },

  // Top Nav
  topNav: { flexDirection:"row", backgroundColor:A.bg, borderBottomWidth:1.5, borderBottomColor:A.bdr, paddingHorizontal:MX },
  topNavItem: { flex:1, alignItems:"center", paddingVertical:12, paddingHorizontal:4, position:"relative" },
  topNavItemActive: {},
  topNavIcon: { fontSize:16, marginBottom:2 },
  topNavLabel: { fontSize:12, fontFamily:"Outfit-Bold", color:A.textS },
  topNavLabelActive: { color:A.orange },
  topNavUnderline: { position:"absolute", bottom:-1.5, left:0, right:0, height:2, backgroundColor:A.orange, borderRadius:1 },

  // Hero banner
  heroBanner: { flexDirection:"row", alignItems:"center", paddingHorizontal:MX, paddingTop:16, paddingBottom:18, gap:14 },
  heroBadge: { width:72, height:72, borderRadius:36, borderWidth:2.5, alignItems:"center", justifyContent:"center" },
  heroBadgeEmoji: { fontSize:34 },
  heroInfo: { flex:1 },
  heroPredLabel: { fontSize:9, fontFamily:"Outfit-Bold", color:A.orange, letterSpacing:1.2, marginBottom:3 },
  heroNameRow: { flexDirection:"row", alignItems:"center", flexWrap:"wrap", gap:8, marginBottom:10 },
  heroSignName: { fontSize:26, fontFamily:"Outfit-ExtraBold", color:A.text },
  vedicPill: { backgroundColor:"#ede9fe", borderRadius:7, paddingHorizontal:8, paddingVertical:3 },
  vedicPillText: { fontSize:13, color:"#7c3aed", fontFamily:"Outfit-Bold" },

  // Period tabs
  periodRow: { flexDirection:"row", flexWrap:"wrap", gap:6 },
  periodBtn: { flexDirection:"row", alignItems:"center", gap:4, paddingHorizontal:10, paddingVertical:6, borderRadius:20, backgroundColor:A.bgLight, borderWidth:1, borderColor:A.bdr2 },
  periodBtnActive: { backgroundColor:A.orange, borderColor:A.orange },
  periodDot: { width:6, height:6, borderRadius:3, backgroundColor:"#fff" },
  periodLabel: { fontSize:11.5, fontFamily:"Outfit-Bold", color:A.textS },
  periodLabelActive: { color:"#fff" },

  // Sign selector
  signRow: { paddingHorizontal:MX, paddingVertical:14, gap:8 },
  signChip: { alignItems:"center", paddingHorizontal:10, paddingVertical:8, borderRadius:16, backgroundColor:A.bg, borderWidth:1.5, borderColor:A.bdr2, minWidth:64 },
  signCircle: { width:38, height:38, borderRadius:19, alignItems:"center", justifyContent:"center", marginBottom:5, borderWidth:1 },
  signEmoji: { fontSize:20 },
  signLabel: { fontSize:10, fontFamily:"Outfit-Medium", color:A.textS },

  // Date badge
  dateBadgeRow: { alignItems:"center", marginBottom:14 },
  dateBadge: { flexDirection:"row", alignItems:"center", gap:6, backgroundColor:A.bgLight, borderRadius:20, paddingHorizontal:14, paddingVertical:7, borderWidth:1, borderColor:A.bdr },
  dateBadgeText: { fontSize:11, fontFamily:"Outfit-Bold", color:A.textS, letterSpacing:0.3 },

  // Loading
  loadBox: { paddingVertical:60, alignItems:"center" },
  loadText: { marginTop:14, fontFamily:"Outfit-Medium", color:A.textS, fontSize:13 },

  // Cards
  card: { marginHorizontal:MX, marginBottom:12, backgroundColor:A.card, borderRadius:18, borderWidth:1, borderColor:A.bdr, padding:16, shadowColor:"#000", shadowOffset:{width:0,height:2}, shadowOpacity:0.04, shadowRadius:6, elevation:2 },
  cardHead: { flexDirection:"row", alignItems:"center", gap:10, marginBottom:12 },
  cardIcon: { width:30, height:30, borderRadius:9, alignItems:"center", justifyContent:"center" },
  cardTitle: { fontSize:15, fontFamily:"Outfit-Bold", color:A.textM },
  cardSub: { fontSize:10, fontFamily:"Outfit-Bold", color:A.textXs, letterSpacing:1 },

  // Text
  bodyText: { fontSize:14, fontFamily:"Outfit-Medium", color:A.textS, lineHeight:22 },
  showMore: { marginTop:10, fontSize:13, fontFamily:"Outfit-Bold", color:A.orange },

  // Ratings
  ratingsGrid: { flexDirection:"row", flexWrap:"wrap", rowGap:16, columnGap:12 },
  ratingItem: { width:(width-MX*2-32-12)/2, rowGap:5 },
  ratingLabel: { fontSize:10, fontFamily:"Outfit-Bold", color:A.textS, letterSpacing:0.8 },
  dotsRow: { flexDirection:"row", gap:4 },
  dot: { width:DOT, height:DOT, borderRadius:DOT/2 },
  dotOn: { backgroundColor:A.orange },
  dotOff: { backgroundColor:A.bgLight },
  ratingScore: { fontSize:11, fontFamily:"Outfit-Bold", color:A.textXs },

  // Lucky
  luckyRow: { flexDirection:"row", alignItems:"center", justifyContent:"space-between" },
  luckyLeft: { flexDirection:"row", alignItems:"center", gap:8 },
  luckyKey: { fontSize:13, fontFamily:"Outfit-Medium", color:A.textS },
  luckyNumBadge: { width:38, height:38, borderRadius:10, backgroundColor:A.orange, alignItems:"center", justifyContent:"center" },
  luckyNumText: { fontSize:18, fontFamily:"Outfit-ExtraBold", color:"#fff" },
  luckyColorBadge: { flexDirection:"row", alignItems:"center", gap:6, borderRadius:20, paddingHorizontal:12, paddingVertical:6 },
  colorDot: { width:10, height:10, borderRadius:5 },
  luckyColorText: { fontSize:12, fontFamily:"Outfit-Bold" },

  // Remedy
  remedyCard: { marginHorizontal:MX, marginBottom:12, borderRadius:18, padding:16 },
  remedyText: { fontSize:13, fontFamily:"Outfit-Medium", color:"rgba(255,255,255,0.95)", lineHeight:20 },

  // Profile
  profileRow: { flexDirection:"row", justifyContent:"space-between", alignItems:"center", paddingVertical:9 },
  profileKey: { fontSize:11, fontFamily:"Outfit-Bold", color:A.textXs, letterSpacing:0.8 },
  profileVal: { fontSize:13, fontFamily:"Outfit-Bold", color:A.textM },
  divider: { height:1, backgroundColor:A.bdr },

  // Kundli CTA
  kundliCTA: { marginHorizontal:MX, marginBottom:12, borderRadius:18, padding:16, flexDirection:"row", alignItems:"center", justifyContent:"space-between" },
  kundliCTATitle: { fontSize:17, fontFamily:"Outfit-ExtraBold", color:"#fff", marginBottom:2 },
  kundliCTASub: { fontSize:11.5, fontFamily:"Outfit-Medium", color:"rgba(255,255,255,0.88)" },
  kundliCTABtn: { borderWidth:1.5, borderColor:"#fff", borderRadius:20, paddingHorizontal:14, paddingVertical:7 },
  kundliCTABtnText: { fontSize:12, fontFamily:"Outfit-Bold", color:"#fff" },

  // Section pads (Kundli & Numerology)
  sectionPad: { paddingHorizontal:0, paddingTop:4 },
  sectionHero: { marginHorizontal:MX, marginBottom:12, borderRadius:18, padding:16, flexDirection:"row", alignItems:"center", gap:14, borderWidth:1, borderColor:A.orangeB2 },
  sectionHeroEmoji: { fontSize:36 },
  sectionHeroTitle: { fontSize:18, fontFamily:"Outfit-ExtraBold", color:A.text, marginBottom:2 },
  sectionHeroSub: { fontSize:12, fontFamily:"Outfit-Medium", color:A.textS },
  sectionIconBg: { width:30, height:30, borderRadius:9, alignItems:"center", justifyContent:"center" },

  // Inputs
  inputLabel: { fontSize:12, fontFamily:"Outfit-Bold", color:A.orange, marginBottom:6, marginTop:8 },
  input: { backgroundColor:A.bgSoft, borderWidth:1.5, borderColor:A.bdr2, borderRadius:12, paddingHorizontal:14, paddingVertical:11, color:A.textM, fontSize:14, fontFamily:"Outfit-Medium", marginBottom:4 },
  errorText: { color:"#dc2626", fontSize:12, fontFamily:"Outfit-Medium", marginBottom:8 },
  orangeBtn: { backgroundColor:A.orange, borderRadius:14, paddingVertical:13, alignItems:"center", marginTop:16, shadowColor:A.orange, shadowOffset:{width:0,height:3}, shadowOpacity:0.25, shadowRadius:6, elevation:3 },
  orangeBtnText: { color:"#fff", fontSize:12.5, fontFamily:"Outfit-Bold", letterSpacing:0.8 },

  // Result
  resultTitle: { fontSize:15, fontFamily:"Outfit-Bold", color:A.textM, textAlign:"center", lineHeight:22, marginBottom:10 },

  // Numerology
  numBig: { width:76, height:76, borderRadius:38, alignItems:"center", justifyContent:"center", marginBottom:10, shadowColor:"#000", shadowOffset:{width:0,height:3}, shadowOpacity:0.12, shadowRadius:6, elevation:4 },
  numBigText: { fontSize:34, fontFamily:"Outfit-ExtraBold", color:"#fff" },
  numTitle: { fontSize:19, fontFamily:"Outfit-ExtraBold", marginBottom:3 },
  numPlanet: { fontSize:12, fontFamily:"Outfit-Bold", color:A.textS },
  numMini: { width:28, height:28, borderRadius:14, alignItems:"center", justifyContent:"center" },
  numMiniText: { fontSize:13, fontFamily:"Outfit-ExtraBold", color:"#fff" },

  // Janam Kundli Sub Navigation
  subNavBar: { flexDirection: "row", backgroundColor: A.bgSoft, borderRadius: 12, marginHorizontal: 0, marginVertical: 8, padding: 4, gap: 4 },
  subNavBtn: { flex: 1, alignItems: "center", paddingVertical: 8, borderRadius: 8 },
  subNavBtnActive: { backgroundColor: A.orange },
  subNavLabel: { fontSize: 10, fontFamily: "Outfit-Bold", color: A.textS },
  subNavLabelActive: { color: "#ffffff" },

  // Form Gender and Quick Presets
  genderRow: { flexDirection: "row", gap: 12, marginBottom: 8, marginTop: 4 },
  genderBtn: { flex: 1, backgroundColor: A.bgSoft, borderWidth: 1.5, borderColor: A.bdr2, borderRadius: 12, paddingVertical: 10, alignItems: "center" },
  genderBtnActive: { borderColor: A.orange, backgroundColor: A.orangeBg },
  genderBtnText: { fontSize: 12, fontFamily: "Outfit-Bold", color: A.textS },
  genderBtnTextActive: { color: A.orange },
  birthRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  presetRow: { gap: 8, paddingBottom: 6 },
  presetChip: { backgroundColor: A.bgSoft, borderWidth: 1, borderColor: A.bdr2, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  presetChipText: { fontSize: 11, fontFamily: "Outfit-Medium", color: A.textS },

  // Grid Profile Layouts
  profileGrid: { flexDirection: "row", flexWrap: "wrap", rowGap: 12, columnGap: 8 },
  profileGridItem: { width: (width - MX * 2 - 32 - 8) / 2, backgroundColor: A.bgSoft, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: A.bdr, borderLeftWidth: 3, borderLeftColor: A.orange },

  // Custom Premium Inputs
  inputWrapper: { flexDirection: "row", alignItems: "center", backgroundColor: A.bgSoft, borderWidth: 1.5, borderColor: A.bdr2, borderRadius: 12, paddingHorizontal: 12, marginBottom: 8 },
  inputIcon: { marginRight: 8 },
  inputField: { flex: 1, paddingVertical: 10, color: A.textM, fontSize: 14, fontFamily: "Outfit-Medium" },

  // Planet Table
  planetTableHeader: { flexDirection: "row", paddingVertical: 8, backgroundColor: A.bgSoft, borderRadius: 8, paddingHorizontal: 6, marginBottom: 6 },
  planetTableHeaderCell: { flex: 1, fontSize: 10, fontFamily: "Outfit-Bold", color: A.textS, textAlign: "center" },
  planetTableRow: { flexDirection: "row", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: A.bdr, paddingHorizontal: 6, alignItems: "center" },
  planetTableCell: { flex: 1, fontSize: 11, fontFamily: "Outfit-Medium", color: A.textM, textAlign: "center" },
  retroDot: { width: 6, height: 6, borderRadius: 3, marginRight: 2 },
  planetName: { fontSize: 11, fontFamily: "Outfit-Bold", color: A.textM },

  // Gemstones suggestions
  gemsRow: { flexDirection: "row", gap: 8 },
  gemCard: { flex: 1, backgroundColor: A.bgSoft, borderRadius: 16, borderWidth: 1, borderColor: A.bdr, padding: 10, alignItems: "center" },
  gemLabel: { fontSize: 8, fontFamily: "Outfit-Bold", color: A.orange, letterSpacing: 0.5, marginBottom: 2 },
  gemName: { fontSize: 11, fontFamily: "Outfit-ExtraBold", color: A.text, textAlign: "center" },
  gemDetail: { fontSize: 8, fontFamily: "Outfit-Medium", color: A.textS, marginTop: 1 },

  // Rudraksha recomendation
  rudrakshaName: { fontSize: 15, fontFamily: "Outfit-ExtraBold", color: A.text, marginBottom: 2 },
  rudrakshaRecommend: { fontSize: 11.5, fontFamily: "Outfit-Medium", color: A.orange, fontStyle: "italic", marginBottom: 6 },

  // Dasha layout
  dashaCard: { backgroundColor: A.bgSoft, borderRadius: 12, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: A.bdr },
  dashaLabel: { fontSize: 8, fontFamily: "Outfit-Bold", color: A.textS, letterSpacing: 0.8, marginBottom: 4 },
  dashaPlanet: { fontSize: 14, fontFamily: "Outfit-ExtraBold", color: A.orange },
  dashaDates: { fontSize: 10, fontFamily: "Outfit-Medium", color: A.textS },

  // Numerology numbers
  numRow: { flexDirection: "row", gap: 8 },
  numCard: { flex: 1, backgroundColor: A.bgSoft, borderRadius: 16, borderWidth: 1, borderColor: A.bdr, padding: 14, alignItems: "center" },
  numLabel: { fontSize: 9, fontFamily: "Outfit-Bold", color: A.textS, marginBottom: 2 },
  numVal: { fontSize: 24, fontFamily: "Outfit-ExtraBold", color: A.orange },

  // Generic Empty text
  noDataText: { fontSize: 11, fontFamily: "Outfit-Medium", color: A.textS, textAlign: "center", paddingVertical: 14 },
});
