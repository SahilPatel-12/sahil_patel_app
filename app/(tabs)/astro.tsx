import React, { useState, useEffect } from "react";
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  Platform,
  TextInput,
  Modal,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useLanguage } from "../../context/LanguageContext";
import DraggableCalendarButton from "../../components/DraggableCalendarButton";
import { supabase } from "../../services/supabase";
import { safeStorage } from "../../services/storage";
import DatePickerModal from "../../components/DatePickerModal";
import TimePickerModal from "../../components/TimePickerModal";

const { width } = Dimensions.get("window");

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
  purple:   "#7c3aed",
  purpleD:  "#6d28d9",
  purpleBg: "#f5f3ff",
  purpleB2: "#ede9fe",
  text:     "#0f172a",
  textM:    "#1e293b",
  textS:    "#64748b",
  textXs:   "#94a3b8",
  green:    "#388e3c",
};

interface Pandit {
  id: string;
  name: string;
  avatar: any;
  rating: number;
  experience: number;
  pujasCount: number;
  specialities: string[];
  languages: string[];
  title: string;
  bio: string;
  location: string;
}

interface Astrologer {
  id: string;
  name: string;
  rating: number;
  experience: number;
  readingsCount: number;
  specialities: string[];
  languages: string[];
  chargePerMin: number;
  isOnline: boolean;
  title: string;
  bio: string;
  avatar?: any;
  hasProfilePhoto?: boolean;
  dbId?: string;
}

const PANDITS: Pandit[] = [
  {
    id: "1",
    name: "Acharya Guru Ji",
    avatar: require("../../assets/astrology/pandit_ji_avatar.png"),
    rating: 4.9,
    experience: 15,
    pujasCount: 1500,
    specialities: ["Griha Pravesh", "Navgrah Homa", "Rudrabhishek", "Shanti Path"],
    languages: ["Hindi", "Sanskrit", "English"],
    title: "Senior Ritualist & Yajmana Specialist",
    bio: "Blessed with extensive training under traditional Vedic gurukuls. Specialized in detailed Yajmana rituals, Vaastu alignment shantis, and personalized Graha homas.",
    location: "Kashi Vishwanath Temple, Varanasi"
  },
  {
    id: "2",
    name: "Acharya Vinayak Shastri",
    avatar: require("../../assets/astrology/pandit_ji_avatar.png"),
    rating: 4.8,
    experience: 18,
    pujasCount: 2000,
    specialities: ["Mahalakshmi Puja", "Ganesha Sankalp", "Vastu Shanti", "Homa/Havan"],
    languages: ["Hindi", "Marathi", "Sanskrit"],
    title: "Siddhi Vinayak Temple Senior Priest",
    bio: "Over 18 years of service invoking divine blessings. Revered for clear pronunciation of Rigvedic stotras and high spiritual energy during auspicious home initiations.",
    location: "Siddhi Vinayak Temple, Mumbai"
  },
  {
    id: "3",
    name: "Pandit Ramesh Chaturvedi",
    avatar: require("../../assets/astrology/pandit_ji_avatar.png"),
    rating: 4.7,
    experience: 12,
    pujasCount: 1200,
    specialities: ["Navgrah Shanti", "Satyanarayan Katha", "Shanti Path"],
    languages: ["Hindi", "Sanskrit", "Gujarati"],
    title: "Mahalakshmi Head Priest Lineage",
    bio: "Carrying forward a lineage of temple priests. Expert in Satyanarayan Vrat Kathas, planetary dosha shantis, and house warming ceremonies.",
    location: "Mahalakshmi Temple, Mumbai"
  },
  {
    id: "4",
    name: "Swami Venkatesh Acharya",
    avatar: require("../../assets/astrology/pandit_ji_avatar.png"),
    rating: 4.9,
    experience: 20,
    pujasCount: 3000,
    specialities: ["Tirumala Rituals", "Kalyanotsavam", "Sudarshana Havan", "Homa/Havan"],
    languages: ["Telugu", "Tamil", "Kannada", "Hindi"],
    title: "Vedic Scholar & Temple Archaka",
    bio: "Specialist in ancient South Indian temple procedures. Conducts high-potency Sudarshana Havans and detailed celestial wedding rituals (Kalyanotsavams).",
    location: "Tirumala Hills Temple, Andhra Pradesh"
  }
];

const ASTROLOGERS: Astrologer[] = [
  {
    id: "1",
    name: "Pandit Ravi Shastri",
    rating: 4.8,
    experience: 12,
    readingsCount: 2800,
    specialities: ["Kundli Milan", "Gemstone Advice", "Horoscope", "Lagna Chart"],
    languages: ["Hindi", "English"],
    chargePerMin: 50,
    isOnline: true,
    title: "Expert Astrologer & Kundli Matcher",
    bio: "Specializing in Vedic astrology matching and personalized remedies. Over 12 years of solving complex planetary charts to guide you on career and relationships."
  },
  {
    id: "2",
    name: "Acharya Ramanand Shastri",
    rating: 4.9,
    experience: 16,
    readingsCount: 3500,
    specialities: ["Lagna Chart", "Vastu Dosha", "Kundli Match"],
    languages: ["Hindi", "Sanskrit", "Marathi"],
    chargePerMin: 60,
    isOnline: true,
    title: "Vedic Hora & Vastu Authority",
    bio: "Respected scholar in Muhurat Shastra and residential/business Vaastu correction. Helping families regain peace and prosperity through Vedic chart calculations."
  },
  {
    id: "3",
    name: "Acharya Ramachandra Shastri",
    rating: 4.7,
    experience: 15,
    readingsCount: 2200,
    specialities: ["Career", "KP Astrology", "Gemstone Advice"],
    languages: ["Hindi", "Bengali"],
    chargePerMin: 45,
    isOnline: false,
    title: "KP System & Career Specialist",
    bio: "Accurate predictive timelines utilizing Krishnamurti Paddhati (KP) System. Specialized in education, jobs, business expansion, and gemstone suggestions."
  },
  {
    id: "4",
    name: "Pandit Somnath Dwivedi",
    rating: 4.8,
    experience: 10,
    readingsCount: 1800,
    specialities: ["Prashna Kundli", "Remedial", "Horoscope"],
    languages: ["Hindi", "Sanskrit"],
    chargePerMin: 40,
    isOnline: true,
    title: "Prashna Shastra & Gemologist",
    bio: "Expert at addressing immediate concerns through Prashna Kundli (query-based charts) and recommending easy, effective Vedic remedies for daily life obstacles."
  }
];

const PANDIT_CATEGORIES = ["All", "Homa/Havan", "Griha Pravesh", "Shanti Path"];
const ASTRO_CATEGORIES = ["All", "Kundli Match", "Vastu", "Horoscope", "Career"];
const PANDIT_LOCATIONS = ["All", "Varanasi", "Mumbai", "Tirupati"];

export default function AstroScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();

  const [activeTab, setActiveTab] = useState<"pandits" | "astrologers">("pandits");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedLocation, setSelectedLocation] = useState("All");

  // Selection states
  const [selectedPandit, setSelectedPandit] = useState<Pandit | null>(null);
  const [selectedAstro, setSelectedAstro] = useState<Astrologer | null>(null);
  const [consultType, setConsultType] = useState<"chat" | "call" | null>(null);

  // Success/Connecting alerts
  const [bookingSuccessModal, setBookingSuccessModal] = useState(false);
  const [connectingModal, setConnectingModal] = useState(false);

  // Custom Request Form states
  const [customRequestModal, setCustomRequestModal] = useState(false);
  const [devoteeName, setDevoteeName] = useState("");
  const [gotra, setGotra] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [preferredTime, setPreferredTime] = useState("");
  const [specialNotes, setSpecialNotes] = useState("");
  const [customBookingError, setCustomBookingError] = useState("");
  const [isSubmittingCustomRequest, setIsSubmittingCustomRequest] = useState(false);
  const [customRequestRefId, setCustomRequestRefId] = useState("");
  const [user, setUser] = useState<any>(null);
  const [panditsList, setPanditsList] = useState<Pandit[]>(PANDITS);
  const [astrologersList, setAstrologersList] = useState<Astrologer[]>(ASTROLOGERS);

  // Load Pundits dynamically from website_store_pundits
  useEffect(() => {
    const fetchPandits = async () => {
      try {
        const { data, error } = await supabase
          .from('website_store_pundits')
          .select('*')
          .order('experience_years', { ascending: false });

        if (error) {
          console.warn("[AstroScreen] Error fetching from website_store_pundits:", error.message || error);
          return;
        }

        if (data && data.length > 0) {
          const formatted = data.map((p: any, idx: number) => {
            // Generate rating dynamically if not in database
            const rating = p.rating || parseFloat((4.7 + ((idx * 3) % 4) / 10).toFixed(1));
            const experience = p.experience_years || 10;
            const pujasCount = experience * 120 + (idx * 13) % 50;

            let location = "";
            if (p.temple_name) {
              location = `${p.temple_name}, ${p.city}`;
            } else {
              location = `${p.city}, ${p.state}`;
            }

            let avatar = require("../../assets/astrology/pandit_ji_avatar.png");
            if (p.profile_photo && (p.profile_photo.startsWith('http://') || p.profile_photo.startsWith('https://'))) {
              avatar = { uri: p.profile_photo };
            }

            return {
              id: p.user_id || p.id,
              name: p.full_name || "Vedic Pandit",
              avatar: avatar,
              rating: rating,
              experience: experience,
              pujasCount: pujasCount,
              specialities: p.specialties || [],
              languages: p.languages || ["Hindi", "Sanskrit"],
              title: p.spiritual_title ? `${p.spiritual_title} Seva Acharya` : "Vedic Seva Priest",
              bio: p.bio || "Blessed Vedic Priest trained under traditional gurukuls.",
              location: location,
            };
          });

          setPanditsList(formatted);
        }
      } catch (err) {
        console.error("[AstroScreen] fetchPandits exception:", err);
      }
    };

    fetchPandits();
  }, []);

  // Load Astrologers dynamically from website_store_astrologers
  useEffect(() => {
    const fetchAstrologers = async () => {
      try {
        const { data, error } = await supabase
          .from('website_store_astrologers')
          .select('*')
          .order('experience_years', { ascending: false });

        if (error) {
          console.warn("[AstroScreen] Error fetching from website_store_astrologers:", error.message || error);
          return;
        }

        if (data && data.length > 0) {
          const formatted = data.map((a: any, idx: number) => {
            const rating = a.rating ? parseFloat(a.rating.toString()) : parseFloat((4.6 + ((idx * 2) % 4) / 10).toFixed(1));
            const experience = a.experience_years || 8;
            const readingsCount = a.readings_count || (experience * 240 + (idx * 37) % 100);

            let avatar = require("../../assets/astrology/pandit_ji_avatar.png");
            const hasProfilePhoto = !!(a.profile_photo && (a.profile_photo.startsWith('http://') || a.profile_photo.startsWith('https://') || a.profile_photo.startsWith('http') || a.profile_photo.startsWith('https')));
            if (hasProfilePhoto) {
              avatar = { uri: a.profile_photo };
            }

            return {
              id: a.user_id || a.id,
              dbId: a.id,
              name: a.full_name || "Vedic Astrologer",
              avatar: avatar,
              hasProfilePhoto: hasProfilePhoto,
              rating: rating,
              experience: experience,
              readingsCount: readingsCount,
              specialities: a.specialties || [],
              languages: a.languages || ["Hindi", "English"],
              chargePerMin: a.charge_per_min || 30,
              isOnline: a.is_online ?? true,
              title: a.spiritual_title || "Vedic Hora Specialist",
              bio: a.bio || "Traditional astrologer helping resolve complex planetary charts.",
            };
          });

          setAstrologersList(formatted);
        }
      } catch (err) {
        console.error("[AstroScreen] fetchAstrologers exception:", err);
      }
    };

    fetchAstrologers();
  }, []);

  // Load user session
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const sessionStr = await safeStorage.getItem('user_session');
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          const userData = session.user || session;
          setUser(userData);
          setDevoteeName(userData.name || "");
          setPhone(userData.phone || "");
        }
      } catch (err) {
        console.error("Error loading user in astro screen:", err);
      }
    };
    fetchUser();
  }, []);

  // Reset category on tab switch
  useEffect(() => {
    setSelectedCategory("All");
    setSelectedLocation("All");
    setSearchQuery("");
  }, [activeTab]);

  // Filter Logic
  const filteredPandits = panditsList.filter((pandit) => {
    const matchesSearch =
      pandit.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pandit.specialities.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      pandit.title.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" ||
      pandit.specialities.some((s) => {
        const cleanS = s.replace(/[\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD00-\uDFFF]/g, '').trim().toLowerCase();
        const cleanCat = selectedCategory.toLowerCase();
        
        if (cleanCat === 'homa/havan') {
          return cleanS.includes('havan') || cleanS.includes('homa');
        }
        if (cleanCat === 'griha pravesh') {
          return cleanS.includes('griha pravesh') || cleanS.includes('house warming');
        }
        if (cleanCat === 'shanti path') {
          return cleanS.includes('shanti');
        }
        return cleanS.includes(cleanCat);
      });

    const matchesLocation =
      selectedLocation === "All" ||
      pandit.location.toLowerCase().includes(selectedLocation.toLowerCase());

    return matchesSearch && matchesCategory && matchesLocation;
  });

  const filteredAstrologers = astrologersList.filter((astro) => {
    const matchesSearch =
      astro.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      astro.specialities.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase())) ||
      astro.title.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      selectedCategory === "All" ||
      astro.specialities.includes(selectedCategory);

    return matchesSearch && matchesCategory;
  });

  // Action handlers
  const handleCustomRequest = () => {
    setCustomBookingError("");
    setCustomRequestModal(true);
  };

  const handleVerifyPujas = () => {
    if (selectedPandit) {
      const pName = selectedPandit.name;
      const pId = selectedPandit.id;
      setSelectedPandit(null);
      router.push({
        pathname: "/book_pandit_puja",
        params: { panditName: pName, panditId: pId }
      });
    } else {
      setSelectedPandit(null);
      router.push("/book_pandit_puja");
    }
  };

  const handleSubmitCustomRequest = async () => {
    if (!devoteeName.trim()) {
      setCustomBookingError(t("Devotee Name is required"));
      return;
    }
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      setCustomBookingError(t("Please enter a valid 10-digit contact number"));
      return;
    }
    if (!preferredDate.trim()) {
      setCustomBookingError(t("Preferred Date is required"));
      return;
    }
    if (!preferredTime.trim()) {
      setCustomBookingError(t("Preferred Time is required"));
      return;
    }

    setCustomBookingError("");
    setIsSubmittingCustomRequest(true);

    try {
      let userId = user?.id || null;
      if (!userId) {
        const sessionStr = await safeStorage.getItem('user_session');
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          userId = (session.user || session).id;
        }
      }

      if (!userId) {
        setCustomBookingError(t("Please login to submit custom requests"));
        setIsSubmittingCustomRequest(false);
        return;
      }

      // 1. Insert order
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: userId,
          order_type: 'puja',
          total_amount: 0,
          payment_status: 'pending',
          order_status: 'Pending',
          subtotal: 0,
          discount: 0,
          pandit_dakshina: 0,
          tax: 0,
          shipping_cost: 0
        })
        .select('id')
        .single();

      if (orderError) throw orderError;
      const orderId = newOrder.id;

      // 2. Insert order items
      const { error: itemError } = await supabase
        .from('order_items')
        .insert({
          order_id: orderId,
          item_type: 'puja',
          item_id: 'custom_puja',
          quantity: 1,
          price: 0
        });

      if (itemError) throw itemError;

      // 3. Insert booking details
      const priestName = selectedPandit ? selectedPandit.name : "Vedic Priest";
      const notes = `[Custom Request for Pandit: ${priestName}] ${specialNotes.trim()}`;

      const { error: pujaError } = await supabase
        .from('puja_booking_details')
        .insert({
          order_id: orderId,
          devotee_name: devoteeName.trim(),
          gotra: gotra.trim() || null,
          special_notes: notes,
          preferred_date: preferredDate.trim(),
          preferred_time: preferredTime.trim()
        });

      if (pujaError) throw pujaError;

      // Success!
      setCustomRequestRefId(orderId.substring(0, 8).toUpperCase());
      setCustomRequestModal(false);
      setBookingSuccessModal(true);

      // Reset
      setGotra("");
      setPreferredDate("");
      setPreferredTime("");
      setSpecialNotes("");
    } catch (err: any) {
      console.error("Failed to create custom puja request:", err);
      setCustomBookingError(err.message || t("Failed to save booking. Please try again."));
    } finally {
      setIsSubmittingCustomRequest(false);
    }
  };

  const handleStartConsultation = (astro: Astrologer, type: "chat" | "call") => {
    setSelectedAstro(astro);
    setConsultType("chat"); // Force to chat-only
  };

  const handleInitializeCall = async () => {
    if (!user) {
      Alert.alert(t("Login Required"), t("Please login before initiating a consultation."));
      return;
    }
    if (!selectedAstro) return;

    const currentAstro = selectedAstro;

    setSelectedAstro(null);
    setConsultType(null);

    try {
      setConnectingModal(true);

      // 1. Fetch user's wallet balance
      const { data: wallet, error: walletErr } = await supabase
        .from("user_wallets")
        .select("balance")
        .eq("user_id", user.id || user.user_id)
        .single();

      if (walletErr && walletErr.code !== 'PGRST116') {
        throw new Error(t("Could not verify wallet balance."));
      }

      const currentBalance = wallet ? wallet.balance : 0;
      const chargeAmount = currentAstro.chargePerMin;

      // 2. Insufficient balance validation
      if (currentBalance < chargeAmount) {
        setConnectingModal(false);
        Alert.alert(
          t("Insufficient Balance"),
          `${t("You need at least")} ${chargeAmount} ${t("coins to start a 5-minute chat session. Your current balance is")} ${currentBalance} ${t("coins.")}`,
          [
            { text: t("Cancel"), style: "cancel" },
            { text: t("Add Coins"), onPress: () => router.push("/wallet") }
          ]
        );
        return;
      }

      // 3. Deduct first block's fee from user_wallets
      const { error: deductErr } = await supabase
        .from("user_wallets")
        .update({ balance: currentBalance - chargeAmount })
        .eq("user_id", user.id || user.user_id);

      if (deductErr) {
        throw new Error(t("Failed to process coin deduction. Please try again."));
      }

      // 4. Log deduction transaction in coin_transactions
      const { error: txErr } = await supabase
        .from("coin_transactions")
        .insert({
          user_id: user.id || user.user_id,
          amount: -chargeAmount,
          type: "astrologer_chat"
        });

      if (txErr) {
        console.warn("[AstroScreen] Failed to log transaction in ledger:", txErr.message);
      }

      // 5. Insert active booking details
      const dateStr = new Date().toISOString().split("T")[0];
      const timeStr = new Date().toLocaleTimeString("en-US", { hour12: false, hour: "2-digit", minute: "2-digit" });

      const { data, error } = await supabase
        .from("astrologer_bookings")
        .insert({
          astrologer_id: currentAstro.dbId,
          user_id: user.id || user.user_id,
          devotee_name: user.name || devoteeName || "Devotee",
          devotee_phone: user.phone || phone || "0000000000",
          booking_date: dateStr,
          booking_time: timeStr,
          consult_type: "chat",
          status: "Active"
        })
        .select()
        .single();

      setConnectingModal(false);

      if (error) {
        throw error;
      }

      if (data) {
        router.push({
          pathname: "/astrologer_chat",
          params: {
            bookingId: data.id,
            astrologerId: currentAstro.dbId
          }
        });
      }
    } catch (err: any) {
      setConnectingModal(false);
      console.error("Error creating astrologer booking:", err);
      Alert.alert(t("Booking Failed"), err.message || t("Could not start consultation. Please try again."));
    }
  };

  return (
    <View style={s.root}>
      <StatusBar style="dark" />

      {/* Header Bar */}
      <View style={[s.headerBar, { paddingTop: insets.top || 12 }]}>
        <View style={s.headerRow}>
          <Text style={s.headerTitleText}>{t("Divine Consultations")}</Text>
        </View>
      </View>

      {/* Segment Switcher Selector */}
      <View style={s.tabBarWrapper}>
        <View style={s.tabBarBackground}>
          <TouchableOpacity
            style={[
              s.tabBarBtn,
              activeTab === "pandits" && s.tabBarBtnActiveOrange,
            ]}
            onPress={() => setActiveTab("pandits")}
            activeOpacity={0.8}
          >
            <Ionicons
              name="people"
              size={16}
              color={activeTab === "pandits" ? "#ffffff" : A.textS}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                s.tabBarBtnText,
                activeTab === "pandits" ? s.textWhite : { color: A.textS },
              ]}
            >
              {t("Vedic Pandits")}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              s.tabBarBtn,
              activeTab === "astrologers" && s.tabBarBtnActivePurple,
            ]}
            onPress={() => setActiveTab("astrologers")}
            activeOpacity={0.8}
          >
            <Ionicons
              name="planet"
              size={16}
              color={activeTab === "astrologers" ? "#ffffff" : A.textS}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                s.tabBarBtnText,
                activeTab === "astrologers" ? s.textWhite : { color: A.textS },
              ]}
            >
              {t("Astrologers")}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Filters & Search Header */}
      <View style={s.filterWrapper}>
        {/* Search Input */}
        <View style={[s.searchContainer, activeTab === "astrologers" && s.searchContainerPurple]}>
          <Ionicons
            name="search"
            size={20}
            color={activeTab === "pandits" ? A.orange : A.purple}
            style={{ marginRight: 8 }}
          />
          <TextInput
            style={s.searchInput}
            placeholder={
              activeTab === "pandits"
                ? t("Search by name, rituals, or puja...")
                : t("Search by name, birth chart query...")
            }
            placeholderTextColor={A.textXs}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color={A.textXs} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Chips Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={s.catScroll}
        >
          {(activeTab === "pandits" ? PANDIT_CATEGORIES : ASTRO_CATEGORIES).map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  s.catChip,
                  isSelected && (activeTab === "pandits" ? s.catChipSelectedOrange : s.catChipSelectedPurple),
                ]}
                onPress={() => setSelectedCategory(cat)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    s.catChipText,
                    isSelected ? s.textWhite : (activeTab === "pandits" ? { color: A.orange } : { color: A.purple }),
                  ]}
                >
                  {t(cat)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Location Filter Scroll (Pandits Only) */}
        {activeTab === "pandits" && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[s.catScroll, { marginTop: 8 }]}
          >
            {PANDIT_LOCATIONS.map((loc) => {
              const isSelected = selectedLocation === loc;
              return (
                <TouchableOpacity
                  key={loc}
                  style={[
                    s.locChip,
                    isSelected && s.locChipActive,
                  ]}
                  onPress={() => setSelectedLocation(loc)}
                  activeOpacity={0.8}
                >
                  <Ionicons
                    name="location-outline"
                    size={11}
                    color={isSelected ? "#ffffff" : A.orange}
                    style={{ marginRight: 4 }}
                  />
                  <Text style={[s.locChipText, isSelected && s.textWhite]}>
                    {t(loc === "All" ? "All Locations" : loc)}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Main Directory Lists */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 110 }]}
      >
        {activeTab === "pandits" ? (
          <>
            {/* Pandit Header Banner */}
            <View style={s.bannerCard}>
              <Image
                source={require('../../assets/banner/ChatGPT Image May 26, 2026, 12_19_59 PM.png')}
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['rgba(234, 88, 12, 0.95)', 'rgba(234, 88, 12, 0.45)']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
              <View style={s.bannerContent}>
                <Text style={s.bannerTag}>✦ {t("VEDIC SEVA")} ✦</Text>
                <Text style={s.bannerTitle}>{t("Connect with Verified Acharyas")}</Text>
                <Text style={s.bannerSub}>{t("Book customized Pujas, Havans, and Shanti Paths performed with absolute devotion.")}</Text>
              </View>
            </View>

            {/* ────────── PANDITS LIST ────────── */}
            {filteredPandits.length === 0 ? (
              <View style={s.emptyState}>
                <Text style={s.emptyEmoji}>🕉️</Text>
                <Text style={s.emptyText}>{t("No pandits found matching search.")}</Text>
              </View>
            ) : (
              filteredPandits.map((pandit) => (
                <View key={pandit.id} style={s.panditCard}>
                  <View style={s.premiumBadgeOrange}>
                    <Ionicons name="ribbon" size={10} color="#ffffff" style={{ marginRight: 3 }} />
                    <Text style={s.premiumBadgeText}>{t("VERIFIED ACHARYA")}</Text>
                  </View>

                  <View style={s.profileRow}>
                    <View style={s.avatarContainer}>
                      <Image source={pandit.avatar} style={s.avatarImage} resizeMode="cover" />
                      <View style={s.ratingBadge}>
                        <Ionicons name="star" size={10} color="#f97316" />
                        <Text style={s.ratingText}>{pandit.rating}</Text>
                      </View>
                    </View>

                    <View style={s.infoColumn}>
                      <Text style={s.panditName}>{pandit.name}</Text>
                      <Text style={s.panditTitle}>{t(pandit.title)}</Text>

                      <View style={s.locationRow}>
                        <Ionicons name="location" size={11} color={A.orange} style={{ marginRight: 4 }} />
                        <Text style={s.locationText} numberOfLines={1}>{t(pandit.location)}</Text>
                      </View>

                      <View style={s.statsRow}>
                        <View style={s.statBox}>
                          <Text style={s.statVal}>{pandit.experience}+</Text>
                          <Text style={s.statLabel}>{t("YRS EXP")}</Text>
                        </View>
                        <View style={s.statDivider} />
                        <View style={s.statBox}>
                          <Text style={s.statVal}>{pandit.pujasCount}+</Text>
                          <Text style={s.statLabel}>{t("RITUALS")}</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={s.metaContainer}>
                    <View style={s.languagesRow}>
                      <Ionicons name="language" size={12} color={A.textS} style={{ marginRight: 4 }} />
                      <Text style={s.metaText}>{pandit.languages.join(", ")}</Text>
                    </View>
                    <View style={s.specialitiesContainer}>
                      {pandit.specialities.slice(0, 3).map((tag, idx) => (
                        <View key={idx} style={s.tagPillOrange}>
                          <Text style={s.tagPillTextOrange}>{t(tag)}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={s.actionsRow}>
                    <TouchableOpacity
                      style={s.detailsBtn}
                      onPress={() => setSelectedPandit(pandit)}
                      activeOpacity={0.8}
                    >
                      <Text style={s.detailsBtnText}>{t("VIEW PROFILE")}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={s.bookBtnOrange}
                      onPress={() => setSelectedPandit(pandit)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="calendar" size={14} color="#ffffff" style={{ marginRight: 6 }} />
                      <Text style={s.bookBtnText}>{t("BOOK NOW")}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </>
        ) : (
          <>
            {/* Astrologers Header Banner */}
            <View style={[s.bannerCard, { borderColor: A.purpleB2 }]}>
              <Image
                source={require('../../assets/astrology/galaxy.png')}
                style={[StyleSheet.absoluteFillObject, { opacity: 0.85 }]}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['rgba(124, 58, 237, 0.95)', 'rgba(109, 40, 217, 0.5)']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
              <View style={s.bannerContent}>
                <Text style={[s.bannerTag, { color: '#ffd60a' }]}>✦ {t("COSMIC GUIDANCE")} ✦</Text>
                <Text style={s.bannerTitle}>{t("Talk to Expert Astrologers")}</Text>
                <Text style={s.bannerSub}>{t("Get instant answers about career, love life, finance, and Kundli doshas via chat/call.")}</Text>
              </View>
            </View>

            {/* ────────── ASTROLOGERS LIST ────────── */}
            {filteredAstrologers.length === 0 ? (
              <View style={s.emptyState}>
                <Text style={s.emptyEmoji}>🔮</Text>
                <Text style={s.emptyText}>{t("No astrologers found matching search.")}</Text>
              </View>
            ) : (
              filteredAstrologers.map((astro) => (
                <View key={astro.id} style={s.astroCard}>
                  <View style={[s.statusBadge, astro.isOnline ? s.bgOnline : s.bgOffline]}>
                    {astro.isOnline && <View style={s.greenPulse} />}
                    <Text style={s.statusBadgeText}>
                      {t(astro.isOnline ? "ONLINE NOW" : "OFFLINE")}
                    </Text>
                  </View>

                  <View style={s.profileRow}>
                    <View style={s.avatarContainer}>
                      {astro.hasProfilePhoto ? (
                        <Image source={astro.avatar} style={s.avatarImage} resizeMode="cover" />
                      ) : (
                        <LinearGradient colors={["#8b5cf6", "#6d28d9"]} style={s.placeholderAvatar}>
                          <Text style={{ fontSize: 30 }}>🔮</Text>
                        </LinearGradient>
                      )}
                      <View style={s.ratingBadge}>
                        <Ionicons name="star" size={10} color="#f97316" />
                        <Text style={s.ratingText}>{astro.rating}</Text>
                      </View>
                    </View>

                    <View style={s.infoColumn}>
                      <Text style={s.astroName}>{astro.name}</Text>
                      <Text style={s.astroTitle}>{t(astro.title)}</Text>

                      <View style={s.statsRow}>
                        <View style={s.statBox}>
                          <Text style={s.statVal}>{astro.experience}+</Text>
                          <Text style={s.statLabel}>{t("YRS EXP")}</Text>
                        </View>
                        <View style={s.statDivider} />
                        <View style={s.statBox}>
                          <Text style={s.statVal}>{(astro.readingsCount / 1000).toFixed(1)}K+</Text>
                          <Text style={s.statLabel}>{t("READINGS")}</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={s.metaContainer}>
                    <View style={s.languagesRow}>
                      <Ionicons name="chatbox-ellipses" size={12} color={A.purple} style={{ marginRight: 4 }} />
                      <Text style={s.metaText}>{astro.languages.join(", ")}</Text>
                    </View>
                    <View style={s.specialitiesContainer}>
                      {astro.specialities.slice(0, 3).map((tag, idx) => (
                        <View key={idx} style={s.tagPillPurple}>
                          <Text style={s.tagPillTextPurple}>{t(tag)}</Text>
                        </View>
                      ))}
                    </View>
                  </View>

                  <View style={s.pricingRow}>
                    <Ionicons name="wallet-outline" size={14} color={A.purple} style={{ marginRight: 6 }} />
                    <Text style={s.pricingText}>
                      {t("Fee")}: <Text style={s.pricingHighlight}>{astro.chargePerMin} {t("Coins")} / 5 {t("min")}</Text>
                    </Text>
                  </View>

                  <View style={s.actionsRow}>
                    <TouchableOpacity
                      style={[s.consultBtn, s.callBtn, !astro.isOnline && s.disabledBtn]}
                      onPress={() => handleStartConsultation(astro, "chat")}
                      disabled={!astro.isOnline}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="chatbubble-ellipses-sharp" size={14} color="#ffffff" style={{ marginRight: 4 }} />
                      <Text style={[s.consultBtnText, { color: "#ffffff" }]}>{t("START CHAT")}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* ── MODAL: PANDIT DETAILS ─────────────────────────────────────────────── */}
      {selectedPandit && !customRequestModal && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={!!selectedPandit}
          onRequestClose={() => setSelectedPandit(null)}
        >
          <View style={s.modalOverlay}>
            <View style={s.drawerContent}>
              <View style={s.drawerIndicator} />
              
              <TouchableOpacity
                style={s.drawerClose}
                onPress={() => setSelectedPandit(null)}
              >
                <Ionicons name="close" size={24} color={A.text} />
              </TouchableOpacity>

              <ScrollView showsVerticalScrollIndicator={false} style={s.drawerScroll}>
                <View style={{ alignItems: "center", marginTop: 10 }}>
                  <Image source={selectedPandit.avatar} style={s.largeAvatar} />
                  <Text style={s.drawerName}>{selectedPandit.name}</Text>
                  <Text style={s.drawerTitle}>{t(selectedPandit.title)}</Text>

                  <View style={s.drawerLocationRow}>
                    <Ionicons name="location" size={12} color={A.orange} style={{ marginRight: 4 }} />
                    <Text style={s.drawerLocationText}>{t(selectedPandit.location)}</Text>
                  </View>
                  
                  <View style={[s.ratingBadge, { position: "relative", marginTop: 8, alignSelf: "center" }]}>
                    <Ionicons name="star" size={12} color="#f97316" />
                    <Text style={[s.ratingText, { fontSize: 12 }]}>{selectedPandit.rating} {t("Rating")}</Text>
                  </View>
                </View>

                <View style={s.drawerSection}>
                  <Text style={s.drawerSectionHeader}>{t("ABOUT ACHARYA")}</Text>
                  <Text style={s.drawerBioText}>{t(selectedPandit.bio)}</Text>
                </View>

                <View style={s.drawerSection}>
                  <Text style={s.drawerSectionHeader}>{t("SPECIAL RITUALS OFFERED")}</Text>
                  <View style={s.tagRow}>
                    {selectedPandit.specialities.map((spec, idx) => (
                      <View key={idx} style={[s.tagPillOrange, { backgroundColor: A.orangeBg }]}>
                        <Text style={s.tagPillTextOrange}>{t(spec)}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                <View style={s.drawerSection}>
                  <Text style={s.drawerSectionHeader}>{t("LANGUAGES SUPPORTED")}</Text>
                  <View style={s.tagRow}>
                    {selectedPandit.languages.map((l, idx) => (
                      <View key={idx} style={s.langPill}>
                        <Text style={s.langPillText}>{t(l)}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              </ScrollView>

              <View style={s.drawerFooter}>
                <TouchableOpacity
                  style={s.footerSecondaryBtnOrange}
                  onPress={handleCustomRequest}
                  activeOpacity={0.8}
                >
                  <Text style={s.footerSecondaryTextOrange}>{t("CUSTOM REQUEST")}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.footerPrimaryBtnOrange}
                  onPress={handleVerifyPujas}
                  activeOpacity={0.8}
                >
                  <Text style={s.footerPrimaryText}>{t("SELECT PUJA PACKAGE")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ── MODAL: CUSTOM REQUEST FORM ───────────────────────────────────────── */}
      {customRequestModal && selectedPandit && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={customRequestModal}
          onRequestClose={() => setCustomRequestModal(false)}
        >
          <View style={s.modalOverlay}>
            <View style={[s.drawerContent, { height: "85%" }]}>
              <View style={s.drawerIndicator} />

              <TouchableOpacity
                style={s.drawerClose}
                onPress={() => setCustomRequestModal(false)}
              >
                <Ionicons name="close" size={24} color={A.text} />
              </TouchableOpacity>

              <Text style={s.formTitle}>{t("Custom Ritual Request")}</Text>
              <Text style={s.formSub}>
                {t("Requesting Priest")}: <Text style={{ fontFamily: "Outfit-Bold", color: A.orange }}>{selectedPandit.name}</Text>
              </Text>

              <ScrollView showsVerticalScrollIndicator={false} style={s.formScroll}>
                {customBookingError ? (
                  <View style={s.errorAlert}>
                    <Ionicons name="alert-circle" size={16} color="#ef4444" style={{ marginRight: 6 }} />
                    <Text style={s.errorAlertText}>{customBookingError}</Text>
                  </View>
                ) : null}

                <View style={s.inputGroup}>
                  <Text style={s.inputLabel}>{t("Devotee Full Name")} *</Text>
                  <TextInput
                    style={s.textInput}
                    placeholder={t("Enter full name")}
                    placeholderTextColor={A.textXs}
                    value={devoteeName}
                    onChangeText={setDevoteeName}
                  />
                </View>

                <View style={s.inputRow}>
                  <View style={[s.inputGroup, { flex: 1, marginRight: 10 }]}>
                    <Text style={s.inputLabel}>{t("Gotra (Optional)")}</Text>
                    <TextInput
                      style={s.textInput}
                      placeholder={t("e.g. Kashyap")}
                      placeholderTextColor={A.textXs}
                      value={gotra}
                      onChangeText={setGotra}
                    />
                  </View>
                  <View style={[s.inputGroup, { flex: 1 }]}>
                    <Text style={s.inputLabel}>{t("Contact Phone")} *</Text>
                    <TextInput
                      style={s.textInput}
                      placeholder={t("10-digit phone")}
                      placeholderTextColor={A.textXs}
                      keyboardType="phone-pad"
                      maxLength={15}
                      value={phone}
                      onChangeText={setPhone}
                    />
                  </View>
                </View>

                <View style={s.inputRow}>
                  <View style={[s.inputGroup, { flex: 1, marginRight: 10 }]}>
                    <Text style={s.inputLabel}>{t("Preferred Date")} *</Text>
                    <TouchableOpacity
                      style={[s.textInput, { justifyContent: "center" }]}
                      onPress={() => setShowDatePicker(true)}
                      activeOpacity={0.7}
                    >
                      <Text style={{
                        fontSize: 13,
                        fontFamily: "Outfit-Medium",
                        color: preferredDate ? A.text : A.textXs
                      }}>
                        {preferredDate || t("Select Date")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View style={[s.inputGroup, { flex: 1 }]}>
                    <Text style={s.inputLabel}>{t("Preferred Time")} *</Text>
                    <TouchableOpacity
                      style={[s.textInput, { justifyContent: "center" }]}
                      onPress={() => setShowTimePicker(true)}
                      activeOpacity={0.7}
                    >
                      <Text style={{
                        fontSize: 13,
                        fontFamily: "Outfit-Medium",
                        color: preferredTime ? A.text : A.textXs
                      }}>
                        {preferredTime || t("Select Time")}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={s.inputGroup}>
                  <Text style={s.inputLabel}>{t("Devotional Wish / Notes (Optional)")}</Text>
                  <TextInput
                    style={[s.textInput, { height: 70, paddingTop: 10 }]}
                    placeholder={t("Enter family prayers, health wishes, or custom instructions...")}
                    placeholderTextColor={A.textXs}
                    multiline
                    numberOfLines={3}
                    value={specialNotes}
                    onChangeText={setSpecialNotes}
                  />
                </View>
              </ScrollView>

              <View style={[s.drawerFooter, { marginTop: 10 }]}>
                <TouchableOpacity
                  style={[s.footerPrimaryBtnOrange, { flex: 1, height: 46 }]}
                  onPress={handleSubmitCustomRequest}
                  disabled={isSubmittingCustomRequest}
                  activeOpacity={0.8}
                >
                  <Text style={s.footerPrimaryText}>
                    {isSubmittingCustomRequest ? t("SUBMITTING...") : t("SUBMIT CUSTOM REQUEST")}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ── MODAL: ASTROLOGER DETAILS ─────────────────────────────────────────── */}
      {selectedAstro && consultType && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={!!selectedAstro}
          onRequestClose={() => {
            setSelectedAstro(null);
            setConsultType(null);
          }}
        >
          <View style={s.modalOverlay}>
            <View style={s.drawerContent}>
              <View style={s.drawerIndicator} />

              <TouchableOpacity
                style={s.drawerClose}
                onPress={() => {
                  setSelectedAstro(null);
                  setConsultType(null);
                }}
              >
                <Ionicons name="close" size={24} color={A.text} />
              </TouchableOpacity>

              <ScrollView style={s.drawerScroll} showsVerticalScrollIndicator={false}>
                <View style={{ alignItems: "center", marginTop: 10 }}>
                  {selectedAstro.hasProfilePhoto ? (
                    <Image source={selectedAstro.avatar} style={s.drawerAvatar} resizeMode="cover" />
                  ) : (
                    <LinearGradient colors={["#8b5cf6", "#6d28d9"]} style={s.drawerAvatar}>
                      <Text style={{ fontSize: 34 }}>🔮</Text>
                    </LinearGradient>
                  )}
                  <Text style={s.drawerName}>{selectedAstro.name}</Text>
                  <Text style={s.drawerTitle}>{t(selectedAstro.title)}</Text>
                </View>

                <View style={s.drawerSection}>
                  <Text style={s.drawerSectionHeader}>{t("ABOUT ASTROLOGER")}</Text>
                  <Text style={s.drawerBioText}>{t(selectedAstro.bio)}</Text>
                </View>

                <View style={s.drawerSection}>
                  <Text style={s.drawerSectionHeader}>{t("CONSULTATION SUMMARY")}</Text>
                  <View style={s.summaryCard}>
                    <View style={s.summaryRow}>
                      <Text style={s.summaryLabel}>{t("Rate")}</Text>
                      <Text style={s.summaryValue}>{selectedAstro.chargePerMin} {t("Coins")} / 5 {t("min")}</Text>
                    </View>
                    <View style={s.summaryRow}>
                      <Text style={s.summaryLabel}>{t("Session Block")}</Text>
                      <Text style={s.summaryValue}>5 {t("min")}</Text>
                    </View>
                    <View style={[s.summaryRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                      <Text style={s.summaryLabel}>{t("Method")}</Text>
                      <Text style={[s.summaryValue, { textTransform: "uppercase", color: A.purple }]}>
                        {t("CHAT ONLY")}
                      </Text>
                    </View>
                  </View>
                </View>
              </ScrollView>

              <View style={s.drawerFooter}>
                <TouchableOpacity
                  style={s.footerSecondaryBtnPurple}
                  onPress={() => {
                    setSelectedAstro(null);
                    setConsultType(null);
                    router.push("/wallet");
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={s.footerSecondaryTextPurple}>{t("ADD COINS")}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={s.footerPrimaryBtnPurple}
                  onPress={handleInitializeCall}
                  activeOpacity={0.8}
                >
                  <Text style={s.footerPrimaryText}>{t("START CONSULTATION")}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* ── MODAL: PANDIT BOOKING SUCCESS ──────────────────────────────────────── */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={bookingSuccessModal}
        onRequestClose={() => {
          setBookingSuccessModal(false);
          setSelectedPandit(null);
        }}
      >
        <View style={s.modalOverlay}>
          <View style={s.alertContainer}>
            <View style={s.alertIconWrapper}>
              <Ionicons name="checkmark-circle" size={48} color={A.green} />
            </View>
            <Text style={s.alertTitle}>{t("Request Submitted!")}</Text>
            {customRequestRefId ? (
              <Text style={s.refIdText}>{t("Reference ID")}: <Text style={{ fontFamily: "Outfit-Bold", color: A.orange }}>{customRequestRefId}</Text></Text>
            ) : null}
            <Text style={s.alertBody}>
              {t("Our support and Vedic Acharya will call you back within 1 hour to customize and schedule your sacred puja rituals.")}
            </Text>
            <TouchableOpacity
              style={s.alertBtnOrange}
              onPress={() => {
                setBookingSuccessModal(false);
                setSelectedPandit(null);
                setCustomRequestRefId("");
              }}
            >
              <Text style={s.alertBtnText}>{t("OKAY")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ── MODAL: ASTROLOGER CONNECTING ───────────────────────────────────────── */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={connectingModal}
        onRequestClose={() => setConnectingModal(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.alertContainer}>
            <View style={s.alertIconWrapper}>
              <Ionicons name="sync" size={48} color={A.purple} />
            </View>
            <Text style={s.alertTitle}>{t("Connecting...")}</Text>
            <Text style={s.alertBody}>
              {t("Placing call/chat request. Please ensure you remain active on this screen while we route to Pandit Ji.")}
            </Text>
            <TouchableOpacity
              style={s.alertBtnPurple}
              onPress={() => setConnectingModal(false)}
            >
              <Text style={s.alertBtnText}>{t("CANCEL")}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <DatePickerModal
        visible={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        onSelectDate={setPreferredDate}
        selectedValue={preferredDate}
      />
      <TimePickerModal
        visible={showTimePicker}
        onClose={() => setShowTimePicker(false)}
        onSelectTime={setPreferredTime}
        selectedValue={preferredTime}
      />
      <DraggableCalendarButton />
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: A.bgSoft },
  headerBar: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderColor: A.bdr,
    ...Platform.select({
      ios: {
        shadowColor: "#000000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 6,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  headerRow: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  headerTitleText: {
    fontSize: 18,
    fontFamily: "Outfit-Bold",
    color: A.text,
  },

  // Segment Tab Bar Switcher
  tabBarWrapper: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  tabBarBackground: {
    flexDirection: "row",
    backgroundColor: A.bgSoft,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: A.bdr2,
  },
  tabBarBtn: {
    flex: 1,
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  tabBarBtnActiveOrange: {
    backgroundColor: A.orange,
  },
  tabBarBtnActivePurple: {
    backgroundColor: A.purple,
  },
  tabBarBtnText: {
    fontSize: 13,
    fontFamily: "Outfit-Bold",
  },
  textWhite: {
    color: "#ffffff",
  },

  // Filters Wrapper
  filterWrapper: {
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderColor: A.bdr,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: A.bgSoft,
    borderRadius: 16,
    marginHorizontal: 16,
    paddingHorizontal: 12,
    height: 44,
    borderWidth: 1,
    borderColor: A.orangeB2,
    marginBottom: 10,
  },
  searchContainerPurple: {
    borderColor: A.purpleB2,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Outfit-Medium",
    color: A.text,
  },
  catScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  catChip: {
    backgroundColor: A.bgSoft,
    borderWidth: 1,
    borderColor: A.bdr2,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 12,
  },
  catChipSelectedOrange: {
    backgroundColor: A.orange,
    borderColor: A.orange,
  },
  catChipSelectedPurple: {
    backgroundColor: A.purple,
    borderColor: A.purple,
  },
  catChipText: {
    fontSize: 12,
    fontFamily: "Outfit-Bold",
  },

  // Lists Container
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },

  // Pandit Card
  panditCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: A.orangeB2,
    padding: 16,
    position: "relative",
    shadowColor: A.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
    overflow: "hidden",
  },
  premiumBadgeOrange: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: A.orange,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderBottomLeftRadius: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  premiumBadgeText: {
    color: "#ffffff",
    fontSize: 8,
    fontFamily: "Outfit-Bold",
    letterSpacing: 0.5,
  },

  // Astrologer Card
  astroCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: A.purpleB2,
    padding: 16,
    position: "relative",
    shadowColor: A.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 2,
    overflow: "hidden",
  },
  statusBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderBottomLeftRadius: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  bgOnline: {
    backgroundColor: A.purple,
  },
  bgOffline: {
    backgroundColor: A.textXs,
  },
  statusBadgeText: {
    color: "#ffffff",
    fontSize: 8,
    fontFamily: "Outfit-Bold",
    letterSpacing: 0.5,
  },
  greenPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: A.green,
    marginRight: 4,
  },

  // Profile Components
  profileRow: {
    flexDirection: "row",
    gap: 14,
  },
  avatarContainer: {
    position: "relative",
  },
  avatarImage: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 2.5,
    borderColor: "#ffffff",
    backgroundColor: A.bgLight,
  },
  placeholderAvatar: {
    width: 74,
    height: 74,
    borderRadius: 37,
    borderWidth: 2.5,
    borderColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
  },
  ratingBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    backgroundColor: "#ffffff",
    borderRadius: 10,
    paddingVertical: 1.5,
    paddingHorizontal: 5,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ratingText: {
    fontSize: 9.5,
    fontFamily: "Outfit-Bold",
    color: A.text,
  },
  infoColumn: {
    flex: 1,
    justifyContent: "center",
  },
  panditName: {
    fontSize: 16.5,
    fontFamily: "Outfit-Bold",
    color: A.text,
  },
  panditTitle: {
    fontSize: 11,
    fontFamily: "Outfit-Medium",
    color: A.textS,
    marginTop: 2,
  },
  astroName: {
    fontSize: 16.5,
    fontFamily: "Outfit-Bold",
    color: A.text,
  },
  astroTitle: {
    fontSize: 11,
    fontFamily: "Outfit-Medium",
    color: A.textS,
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 10,
  },
  statBox: {
    alignItems: "flex-start",
  },
  statVal: {
    fontSize: 13,
    fontFamily: "Outfit-ExtraBold",
    color: A.textM,
  },
  statLabel: {
    fontSize: 7.5,
    fontFamily: "Outfit-Bold",
    color: A.textXs,
    letterSpacing: 0.5,
  },
  statDivider: {
    width: 1,
    height: 14,
    backgroundColor: A.bdr2,
  },

  // Metas
  metaContainer: {
    marginTop: 12,
    gap: 8,
  },
  languagesRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    fontSize: 11,
    fontFamily: "Outfit-Medium",
    color: A.textS,
  },
  specialitiesContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  tagPillOrange: {
    backgroundColor: A.orangeBg,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagPillTextOrange: {
    fontSize: 10.5,
    fontFamily: "Outfit-Bold",
    color: A.orange,
  },
  tagPillPurple: {
    backgroundColor: A.purpleBg,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 8,
  },
  tagPillTextPurple: {
    fontSize: 10.5,
    fontFamily: "Outfit-Bold",
    color: A.purple,
  },

  // Pricing (Astrologers)
  pricingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    backgroundColor: A.purpleBg,
    padding: 8,
    borderRadius: 10,
  },
  pricingText: {
    fontSize: 11.5,
    fontFamily: "Outfit-Medium",
    color: A.textS,
  },
  pricingHighlight: {
    fontFamily: "Outfit-Bold",
    color: A.purple,
  },

  // Actions
  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
  },
  detailsBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: A.bdr2,
    borderRadius: 14,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  detailsBtnText: {
    fontSize: 11.5,
    fontFamily: "Outfit-Bold",
    color: A.textS,
  },
  bookBtnOrange: {
    flex: 1.2,
    backgroundColor: A.orange,
    borderRadius: 14,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  bookBtnText: {
    fontSize: 11.5,
    fontFamily: "Outfit-Bold",
    color: "#ffffff",
  },
  consultBtn: {
    flex: 1,
    borderRadius: 14,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
  },
  chatBtn: {
    borderWidth: 1.5,
    borderColor: A.purple,
    backgroundColor: "#ffffff",
  },
  callBtn: {
    backgroundColor: A.purple,
  },
  disabledBtn: {
    borderColor: A.bdr2,
    backgroundColor: A.bgSoft,
  },
  consultBtnText: {
    fontSize: 11.5,
    fontFamily: "Outfit-Bold",
  },

  // Modals Styling
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  drawerContent: {
    backgroundColor: "#ffffff",
    width: "100%",
    height: "75%",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 20,
    paddingBottom: 24,
    position: "relative",
  },
  drawerIndicator: {
    width: 40,
    height: 5,
    backgroundColor: A.bdr2,
    borderRadius: 3,
    alignSelf: "center",
    marginTop: 10,
  },
  drawerClose: {
    position: "absolute",
    top: 15,
    right: 15,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: A.bgLight,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  drawerScroll: {
    flex: 1,
    marginTop: 10,
  },
  largeAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: A.orangeBg,
    backgroundColor: A.bgLight,
  },
  drawerAvatar: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: A.purpleB2,
    alignItems: "center",
    justifyContent: "center",
  },
  drawerName: {
    fontSize: 20,
    fontFamily: "Outfit-Bold",
    color: A.text,
    marginTop: 8,
  },
  drawerTitle: {
    fontSize: 12,
    fontFamily: "Outfit-Medium",
    color: A.textS,
    marginTop: 2,
    textAlign: "center",
  },
  drawerSection: {
    marginTop: 20,
    gap: 6,
  },
  drawerSectionHeader: {
    fontSize: 10,
    fontFamily: "Outfit-Bold",
    color: A.textXs,
    letterSpacing: 1,
  },
  drawerBioText: {
    fontSize: 13,
    fontFamily: "Outfit-Medium",
    color: A.textM,
    lineHeight: 20,
  },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  langPill: {
    backgroundColor: A.bgLight,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  langPillText: {
    fontSize: 11,
    fontFamily: "Outfit-Bold",
    color: A.textS,
  },
  summaryCard: {
    backgroundColor: A.bgSoft,
    borderWidth: 1,
    borderColor: A.bdr2,
    borderRadius: 16,
    padding: 14,
    gap: 10,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: A.bdr2,
    paddingBottom: 8,
  },
  summaryLabel: {
    fontSize: 12.5,
    fontFamily: "Outfit-Medium",
    color: A.textS,
  },
  summaryValue: {
    fontSize: 12.5,
    fontFamily: "Outfit-Bold",
    color: A.text,
  },

  // Drawer Footer Buttons (Orange & Purple variants)
  drawerFooter: {
    flexDirection: "row",
    gap: 12,
    marginTop: 15,
  },
  footerSecondaryBtnOrange: {
    flex: 1,
    height: 48,
    borderWidth: 1.5,
    borderColor: A.orange,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  footerSecondaryTextOrange: {
    fontSize: 13,
    fontFamily: "Outfit-Bold",
    color: A.orange,
  },
  footerPrimaryBtnOrange: {
    flex: 1.5,
    height: 48,
    backgroundColor: A.orange,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  footerSecondaryBtnPurple: {
    flex: 1,
    height: 48,
    borderWidth: 1.5,
    borderColor: A.purple,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  footerSecondaryTextPurple: {
    fontSize: 13,
    fontFamily: "Outfit-Bold",
    color: A.purple,
  },
  footerPrimaryBtnPurple: {
    flex: 1.5,
    height: 48,
    backgroundColor: A.purple,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  footerPrimaryText: {
    fontSize: 13,
    fontFamily: "Outfit-Bold",
    color: "#ffffff",
  },

  // Alerts
  alertContainer: {
    backgroundColor: "#ffffff",
    width: "80%",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  alertIconWrapper: {
    marginBottom: 16,
  },
  alertTitle: {
    fontSize: 18,
    fontFamily: "Outfit-Bold",
    color: A.text,
    marginBottom: 8,
  },
  alertBody: {
    fontSize: 12.5,
    fontFamily: "Outfit-Medium",
    color: A.textS,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
  alertBtnOrange: {
    backgroundColor: A.orange,
    height: 40,
    borderRadius: 14,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  alertBtnPurple: {
    backgroundColor: A.purple,
    height: 40,
    borderRadius: 14,
    paddingHorizontal: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  alertBtnText: {
    fontSize: 12,
    fontFamily: "Outfit-Bold",
    color: "#ffffff",
  },

  // Form Styling
  formTitle: {
    fontSize: 20,
    fontFamily: "Outfit-Bold",
    color: A.text,
    marginTop: 10,
  },
  formSub: {
    fontSize: 12,
    fontFamily: "Outfit-Medium",
    color: A.textS,
    marginTop: 4,
    marginBottom: 10,
  },
  formScroll: {
    flex: 1,
    marginTop: 10,
  },
  errorAlert: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fca5a5",
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
  },
  errorAlertText: {
    fontSize: 12,
    fontFamily: "Outfit-Medium",
    color: "#b91c1c",
    flex: 1,
  },
  inputGroup: {
    marginBottom: 12,
    gap: 6,
  },
  inputLabel: {
    fontSize: 10,
    fontFamily: "Outfit-Bold",
    color: A.textXs,
    letterSpacing: 1,
  },
  textInput: {
    backgroundColor: A.bgSoft,
    borderWidth: 1,
    borderColor: A.bdr2,
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: "Outfit-Medium",
    color: A.text,
  },
  inputRow: {
    flexDirection: "row",
  },
  refIdText: {
    fontSize: 13,
    fontFamily: "Outfit-Medium",
    color: A.textM,
    marginBottom: 10,
  },

  // Empty State
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    gap: 10,
  },
  emptyEmoji: {
    fontSize: 48,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: "Outfit-Medium",
    color: A.textS,
    textAlign: "center",
  },

  // Banner Styles
  bannerCard: {
    height: 120,
    borderRadius: 20,
    overflow: "hidden",
    position: "relative",
    borderWidth: 1,
    borderColor: A.orangeB2,
    marginBottom: 8,
  },
  bannerContent: {
    padding: 16,
    height: "100%",
    justifyContent: "center",
  },
  bannerTag: {
    fontSize: 9,
    fontFamily: "Outfit-Bold",
    color: "#ffedd5",
    letterSpacing: 1,
    marginBottom: 4,
  },
  bannerTitle: {
    fontSize: 16,
    fontFamily: "Outfit-Bold",
    color: "#ffffff",
    marginBottom: 4,
  },
  bannerSub: {
    fontSize: 11,
    fontFamily: "Outfit-Medium",
    color: "rgba(255, 255, 255, 0.85)",
    lineHeight: 15,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  locationText: {
    fontSize: 10.5,
    fontFamily: "Outfit-Medium",
    color: A.orange,
  },
  drawerLocationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    justifyContent: "center",
  },
  drawerLocationText: {
    fontSize: 12,
    fontFamily: "Outfit-Bold",
    color: A.orange,
  },
  locChip: {
    backgroundColor: A.bgSoft,
    borderWidth: 1.2,
    borderColor: A.bdr2,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  locChipActive: {
    backgroundColor: A.orange,
    borderColor: A.orange,
  },
  locChipText: {
    fontSize: 11,
    fontFamily: "Outfit-Bold",
    color: A.orange,
  },
});
