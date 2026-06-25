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
  LayoutAnimation,
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
  { id:"scorpio",     name:"Scorpio",     emoji:"♏", vedic:"वृश्चिक", color:"#dc2626", bg:"#fef2f2", element:"Water", eEmoji:"💧", planet:"Mars",    range:"Oct 23 – Nov 21", name_Hindi:"वृश्चिक", name_Gujarati:"વૃશ્ચ", name_Marathi:"वृश्चिक",name_Tamil:"விருச்சிகம்",name_Telugu:"వశ్చికం" },
  { id:"sagittarius", name:"Sagittarius", emoji:"♐", vedic:"धनु",     color:"#7c3aed", bg:"#f5f3ff", element:"Fire",  eEmoji:"🔥", planet:"Jupiter", range:"Nov 22 – Dec 21", name_Hindi:"धनु",     name_Gujarati:"ધન",    name_Marathi:"धनु",   name_Tamil:"தனுசு",       name_Telugu:"ధనస్సు" },
  { id:"capricorn",   name:"Capricorn",   emoji:"♑", vedic:"मकर",     color:"#475569", bg:"#f8fafc", element:"Earth", eEmoji:"🌍", planet:"Saturn",  range:"Dec 22 – Jan 19", name_Hindi:"मकर",     name_Gujarati:"મકર",   name_Marathi:"मकर",   name_Tamil:"மகரம்",       name_Telugu:"మకరం" },
  { id:"aquarius",    name:"Aquarius",    emoji:"♒", vedic:"कुंभ",    color:"#1d4ed8", bg:"#eff6ff", element:"Air",   eEmoji:"💨", planet:"Saturn",  range:"Jan 20 – Feb 18", name_Hindi:"कुंभ",    name_Gujarati:"કુંભ",  name_Marathi:"कुंभ",  name_Tamil:"கும்பம்",     name_Telugu:"కుంభం" },
  { id:"pisces",      name:"Pisces",      emoji:"♓", vedic:"मीन",     color:"#0369a1", bg:"#f0f9ff", element:"Water", eEmoji:"💧", planet:"Jupiter", range:"Feb 19 – Mar 20", name_Hindi:"मीन",     name_Gujarati:"મીન",   name_Marathi:"મીन",   name_Tamil:"மீனம்",       name_Telugu:"మీనం" },
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

export default function RashiScreen() {
  const insets = useSafeAreaInsets();
  const { t, locale } = useLanguage();
  const loc = locale as "en"|"Hindi"|"Gujarati"|"Marathi"|"Tamil"|"Telugu";

  const [sign, setSign] = useState(SIGNS[0]);
  const [period, setPeriod] = useState<"daily" | "weekly" | "monthly" | "yearly">("daily");
  const [hData, setHData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  const getName = (s: typeof SIGNS[0]) => {
    if (loc==="en") return s.name;
    const k = `name_${loc}` as keyof typeof s;
    return (s[k] as string)||s.name;
  };

  const periodLabel = (p: string) => {
    const m: Record<string,Record<string,string>> = {
      daily:  {en:"Today",  Hindi:"आज",       Gujarati:"આજ",   Marathi:"आज",   Tamil:"இன்று",   Telugu:"నేడు"},
      weekly: {en:"Weekly", Hindi:"साप्ताहिक",Gujarati:"સાપ્ત",Marathi:"साप्त",Tamil:"வாரाந்தர",Telugu:"వారాంత"},
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
      console.error("[Rashi Screen] fetchHoroscope failed, fallback to offline", err);
      setHData(getOffline(signId,per));
    } finally {
      setLoading(false);
    }
  };

  useEffect(()=>{ fetchHoroscope(sign.id, period); }, [sign, period]);

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

  return (
    <View style={s.root}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={[s.headerBar, { paddingTop: insets.top || 12 }]}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color="#1e293b" />
          </TouchableOpacity>
          <Text style={s.headerTitleText}>{t("Rashifal Forecasts")}</Text>
          <View style={{ width: 38 }} />
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>
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
                {hData?.lucky_color&&(()=> {
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

            {/* Dynamic Sections */}
            {hData?.sections&&hData.sections.length>0&&hData.sections.map((sect:any,idx:number)=>(
              <View key={idx} style={s.card}>
                <View style={s.cardHead}>
                  <Ionicons name="sparkles-outline" size={16} color={A.orange}/>
                  <Text style={s.cardTitle}>{sect.heading}</Text>
                </View>
                <Text style={s.bodyText}>{sect.body}</Text>
              </View>
            ))}
          </>
        )}
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
  ratingItem: { width:(width - MX*2 - 32 - 12)/2, flexDirection:"column", gap:6 },
  ratingLabel: { fontSize:9.5, fontFamily:"Outfit-Bold", color:A.textS, letterSpacing:0.5 },
  dotsRow: { flexDirection:"row", gap:4, alignItems:"center" },
  dot: { width:7, height:7, borderRadius:3.5 },
  dotOn: { backgroundColor:A.orange },
  dotOff: { backgroundColor:A.bdr2 },
  ratingScore: { fontSize:10, fontFamily:"Outfit-Bold", color:A.textXs },

  // Lucky row
  luckyRow: { flexDirection:"row", alignItems:"center", justifyContent:"space-between", backgroundColor:A.bgSoft, padding:12, borderRadius:14, borderWidth:0.5, borderColor:A.bdr2 },
  luckyLeft: { flexDirection:"row", alignItems:"center", gap:8 },
  luckyKey: { fontSize:13, fontFamily:"Outfit-Bold", color:A.textS },
  luckyNumBadge: { width:32, height:32, borderRadius:16, backgroundColor:A.orangeBg, alignItems:"center", justifyContent:"center", borderWidth:1, borderColor:A.orangeB2 },
  luckyNumText: { fontSize:16, fontFamily:"Outfit-ExtraBold", color:A.orange },
  luckyColorBadge: { flexDirection:"row", alignItems:"center", gap:6, paddingHorizontal:10, paddingVertical:5, borderRadius:20 },
  colorDot: { width:8, height:8, borderRadius:4 },
  luckyColorText: { fontSize:12, fontFamily:"Outfit-Bold" },

  // Remedy
  remedyCard: { marginHorizontal:MX, marginBottom:16, borderRadius:20, padding:18, shadowColor:"#ea580c", shadowOffset:{width:0,height:4}, shadowOpacity:0.12, shadowRadius:8, elevation:3 },
  remedyText: { fontSize:14, fontFamily:"Outfit-Bold", color:"#fff", lineHeight:22, opacity:0.95 },
});
