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
  ActivityIndicator,
  KeyboardAvoidingView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useLanguage } from "../context/LanguageContext";
import { supabase } from "../services/supabase";
import { safeStorage } from "../services/storage";
import DatePickerModal from "../components/DatePickerModal";
import TimePickerModal from "../components/TimePickerModal";

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
  text:     "#0f172a",
  textM:    "#1e293b",
  textS:    "#64748b",
  textXs:   "#94a3b8",
  green:    "#388e3c",
};

interface PujaPackage {
  id: string;
  title: string;
  price: number;
  originalPrice: number;
  image: any;
  provider: string;
  category: string;
}

const STATIC_PUJAS: PujaPackage[] = [
  {
    id: '1',
    title: 'Ganesh Puja',
    image: require('../assets/God/god.png'),
    price: 501,
    originalPrice: 1501,
    provider: 'Siddhi Vinayak Mandir',
    category: 'Auspicious'
  },
  {
    id: '2',
    title: 'Laxmi Puja',
    image: require('../assets/God/Jai Mahalakshmi🩷🌷🙏.jpeg'),
    price: 1100,
    originalPrice: 3100,
    provider: 'Mahalakshmi Priests',
    category: 'Wealth'
  },
  {
    id: '3',
    title: 'Shiv Puja',
    image: require('../assets/God/Omkarashwar.png'),
    price: 351,
    originalPrice: 999,
    provider: 'Omkareshwar Dham',
    category: 'Mahadev'
  },
  {
    id: '4',
    title: 'Hanuman Puja',
    image: require('../assets/God/Mahakal Ujjain.png'),
    price: 251,
    originalPrice: 799,
    provider: 'Bajrang Dham',
    category: 'Protection'
  },
  {
    id: '5',
    title: 'Kedarnath Puja',
    image: require('../assets/God/Kedarnath.png'),
    price: 351,
    originalPrice: 999,
    provider: 'Kedarnath Dham Priests',
    category: 'Mahadev'
  },
  {
    id: '6',
    title: 'Tirupati Puja',
    image: require('../assets/God/Lord Venkateswara Images Full Hd Wallpaper 1.png'),
    price: 2100,
    originalPrice: 5100,
    provider: 'Tirumala Devasthanam',
    category: 'Wealth'
  },
  {
    id: '7',
    title: 'Shanti Path',
    image: require('../assets/God/god1.png'),
    price: 151,
    originalPrice: 499,
    provider: 'Haridwar Acharyas',
    category: 'Peace'
  },
  {
    id: '8',
    title: 'Navgrah Homa',
    image: require('../assets/God/_ (5).jpeg'),
    price: 1500,
    originalPrice: 4500,
    provider: 'Kashi Vedic Pandits',
    category: 'Protection'
  }
];

function parsePrice(val: any): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const cleaned = val.toString().replace(/[^\d]/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
}

export default function BookPanditPujaScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const params = useLocalSearchParams();

  // Selected Pandit Info from navigation params
  const panditName = (params.panditName as string) || "Vedic Acharya";
  const panditId = (params.panditId as string) || "";

  // Selected Pandit Info
  const [selectedPanditDetails, setSelectedPanditDetails] = useState<any>(null);
  const [pujasOptions, setPujasOptions] = useState<string[]>([]);
  const [isLoadingPujas, setIsLoadingPujas] = useState(true);

  // Selection states
  const [selectedPujaName, setSelectedPujaName] = useState<string>("");
  const [panditTip, setPanditTip] = useState<number | null>(51);
  const [customTip, setCustomTip] = useState("");

  // Devotee details form
  const [devoteeName, setDevoteeName] = useState("");
  const [gotra, setGotra] = useState("");
  const [phone, setPhone] = useState("");
  const [preferredDate, setPreferredDate] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [preferredTime, setPreferredTime] = useState("");
  const [specialWish, setSpecialWish] = useState("");
  const [venueType, setVenueType] = useState<"home" | "temple" | "online">("home");
  const [venueLocation, setVenueLocation] = useState("");

  // UI flow states
  const [user, setUser] = useState<any>(null);
  const [formError, setFormError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [orderRefId, setOrderRefId] = useState("");

  const DEFAULT_PUJAS = ["🕉 Rudrabhishek", "🔥 Havan", "🕉 Shanti Path", "🏡 Griha Pravesh", "🪔 Satyanarayan Katha", "💰 Lakshmi Puja"];

  // Load Pandit details and specialties from database
  useEffect(() => {
    async function loadData() {
      setIsLoadingPujas(true);
      try {
        if (panditId) {
          const { data, error } = await supabase
            .from('website_store_pundits')
            .select('*')
            .eq('user_id', panditId)
            .maybeSingle();

          if (!error && data) {
            setSelectedPanditDetails(data);
            const specs = data.specialties || [];
            const finalPujas = specs.length > 0 ? specs : DEFAULT_PUJAS;
            setPujasOptions(finalPujas);
            setSelectedPujaName(finalPujas[0]);
          } else {
            // try by id
            const { data: dataById } = await supabase
              .from('website_store_pundits')
              .select('*')
              .eq('id', panditId)
              .maybeSingle();
            
            if (dataById) {
              setSelectedPanditDetails(dataById);
              const specs = dataById.specialties || [];
              const finalPujas = specs.length > 0 ? specs : DEFAULT_PUJAS;
              setPujasOptions(finalPujas);
              setSelectedPujaName(finalPujas[0]);
            } else {
              setPujasOptions(DEFAULT_PUJAS);
              setSelectedPujaName(DEFAULT_PUJAS[0]);
            }
          }
        } else {
          setPujasOptions(DEFAULT_PUJAS);
          setSelectedPujaName(DEFAULT_PUJAS[0]);
        }
      } catch (err) {
        console.error('[Book Pandit Puja] Error loading pandit details:', err);
        setPujasOptions(DEFAULT_PUJAS);
        setSelectedPujaName(DEFAULT_PUJAS[0]);
      } finally {
        setIsLoadingPujas(false);
      }
    }

    async function checkUserSession() {
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
        console.error("[Book Pandit Puja] Error reading user session:", err);
      }
    }

    loadData();
    checkUserSession();
  }, [panditId]);

  // Calculate prices
  const selectedTip = panditTip === null ? (parseInt(customTip) || 0) : panditTip;
  const totalPayable = selectedTip;

  // Submit Booking
  const handleBooking = async () => {
    if (!selectedPujaName) {
      setFormError(t("Please select a Puja to perform"));
      return;
    }
    if (!devoteeName.trim()) {
      setFormError(t("Devotee Full Name is required"));
      return;
    }
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      setFormError(t("Please enter a valid 10-digit contact phone"));
      return;
    }
    if (!preferredDate.trim()) {
      setFormError(t("Preferred Date is required"));
      return;
    }
    if (!preferredTime.trim()) {
      setFormError(t("Preferred Time slot is required"));
      return;
    }
    if ((venueType === 'home' || venueType === 'temple') && !venueLocation.trim()) {
      setFormError(t("Venue location/address is required"));
      return;
    }

    setFormError("");
    setIsSubmitting(true);

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
        setFormError(t("Please login to complete your booking"));
        setIsSubmitting(false);
        return;
      }

      // Insert directly into website_store_pundit_bookings table
      const { data: newBooking, error: bookingError } = await supabase
        .from('website_store_pundit_bookings')
        .insert({
          pundit_id: panditId,
          user_id: userId,
          puja_name: selectedPujaName,
          devotee_name: devoteeName.trim(),
          gotra: gotra.trim() || null,
          devotee_phone: phone.trim(),
          booking_date: preferredDate.trim(),
          booking_time: preferredTime.trim(),
          venue_type: venueType,
          venue_address: venueLocation.trim() || null,
          special_request: specialWish.trim() || null,
          dakshina: selectedTip,
          status: 'Pending Confirmation'
        })
        .select('id')
        .single();

      if (bookingError) throw bookingError;
      const bookingId = newBooking.id;

      // Complete
      setOrderRefId(bookingId.substring(0, 8).toUpperCase());
      setSuccessModal(true);

      // Reset
      setGotra("");
      setPreferredDate("");
      setPreferredTime("");
      setSpecialWish("");
      setVenueLocation("");
    } catch (err: any) {
      console.error("[Book Pandit Puja] Booking submission failed:", err);
      setFormError(err.message || t("Error completing booking. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={s.root}>
      <StatusBar style="dark" />

      {/* Header Bar */}
      <View style={[s.headerBar, { paddingTop: insets.top || 12 }]}>
        <View style={s.headerRow}>
          <TouchableOpacity
            style={s.backBtn}
            onPress={() => router.back()}
            activeOpacity={0.7}
          >
            <Ionicons name="arrow-back" size={24} color={A.text} />
          </TouchableOpacity>
          <Text style={s.headerTitleText}>{t("Book Puja Package")}</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        >
          {/* Selected Pandit Banner */}
          <LinearGradient colors={[A.orangeBg, "#ffffff"]} style={s.panditBanner}>
            <Image
              source={require("../assets/astrology/pandit_ji_avatar.png")}
              style={s.panditAvatar}
            />
            <View style={{ flex: 1 }}>
              <Text style={s.panditBannerLabel}>{t("SELECTED VEDIC ACHARYA")}</Text>
              <Text style={s.panditBannerName}>{panditName}</Text>
            </View>
          </LinearGradient>

          {/* Form Error Banner */}
          {formError ? (
            <View style={s.errorAlert}>
              <Ionicons name="alert-circle" size={18} color="#ef4444" style={{ marginRight: 6 }} />
              <Text style={s.errorAlertText}>{formError}</Text>
            </View>
          ) : null}

          {/* Section 1: Select Puja to Perform */}
          <View style={s.sectionCard}>
            <Text style={s.sectionHeader}>{t("1. Select Puja to Perform")}</Text>
            <Text style={s.sectionSub}>{t("Choose from this Pandit's certified ritual specialties:")}</Text>
            
            {isLoadingPujas ? (
              <View style={s.loadingContainer}>
                <ActivityIndicator size="small" color={A.orange} />
                <Text style={s.loadingText}>{t("Loading specialties...")}</Text>
              </View>
            ) : (
              <View style={s.specialtyGrid}>
                {pujasOptions.map((pujaName) => {
                  const isSelected = selectedPujaName === pujaName;
                  return (
                    <TouchableOpacity
                      key={pujaName}
                      style={[
                        s.specialtyChip,
                        isSelected && s.specialtyChipSelected
                      ]}
                      onPress={() => setSelectedPujaName(pujaName)}
                      activeOpacity={0.8}
                    >
                      <Text style={[
                        s.specialtyChipText,
                        isSelected && s.specialtyChipTextSelected
                      ]}>
                        {t(pujaName)}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>

          {/* Section 2: Devotee Sankalp Details */}
          <View style={s.sectionCard}>
            <View style={s.sankalpHeaderRow}>
              <View style={s.tilakBox}>
                <View style={s.tilakDotInner} />
              </View>
              <Text style={s.sectionHeader}>{t("2. Devotee Sankalp Details")}</Text>
            </View>
            <Text style={s.sectionSub}>{t("Details will be chanted by Pandit Ji during the ritual invocation.")}</Text>

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
                  placeholder={t("10-digit number")}
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
                <Text style={s.inputLabel}>{t("Preferred Time Slot")} *</Text>
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

            {/* Puja Performance Venue Selection */}
            <View style={[s.inputGroup, { marginTop: 8 }]}>
              <Text style={s.inputLabel}>{t("Puja Performance Venue")} *</Text>
              <View style={s.venuePillRow}>
                <TouchableOpacity
                  style={[s.venuePill, venueType === 'home' && s.venuePillActive]}
                  onPress={() => {
                    setVenueType('home');
                    setVenueLocation('');
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="home" size={12} color={venueType === 'home' ? '#ffffff' : A.textS} style={{ marginRight: 4 }} />
                  <Text style={[s.venuePillText, venueType === 'home' && s.venuePillTextActive]}>{t("Home/Office")}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.venuePill, venueType === 'temple' && s.venuePillActive]}
                  onPress={() => {
                    setVenueType('temple');
                    setVenueLocation('');
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="location" size={12} color={venueType === 'temple' ? '#ffffff' : A.textS} style={{ marginRight: 4 }} />
                  <Text style={[s.venuePillText, venueType === 'temple' && s.venuePillTextActive]}>{t("Temple")}</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[s.venuePill, venueType === 'online' && s.venuePillActive]}
                  onPress={() => {
                    setVenueType('online');
                    setVenueLocation(t('Online Virtual Sankalp via WhatsApp Video'));
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="videocam" size={12} color={venueType === 'online' ? '#ffffff' : A.textS} style={{ marginRight: 4 }} />
                  <Text style={[s.venuePillText, venueType === 'online' && s.venuePillTextActive]}>{t("Online")}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {venueType === 'home' && (
              <View style={s.inputGroup}>
                <Text style={s.inputLabel}>{t("Home / Office Address")} *</Text>
                <TextInput
                  style={s.textInput}
                  placeholder={t("Enter complete address for Pandit Ji's travel...")}
                  placeholderTextColor={A.textXs}
                  value={venueLocation}
                  onChangeText={setVenueLocation}
                />
              </View>
            )}

            {venueType === 'temple' && (
              <View style={s.inputGroup}>
                <Text style={s.inputLabel}>{t("Temple & City Details")} *</Text>
                <TextInput
                  style={s.textInput}
                  placeholder={t("e.g. Siddhi Vinayak Temple, Mumbai...")}
                  placeholderTextColor={A.textXs}
                  value={venueLocation}
                  onChangeText={setVenueLocation}
                />
              </View>
            )}

            {venueType === 'online' && (
              <View style={s.onlineNotice}>
                <Ionicons name="information-circle" size={15} color={A.orange} style={{ marginRight: 6 }} />
                <Text style={s.onlineNoticeText}>
                  {t("Pandit Ji will perform the Sankalp and ritual live on WhatsApp video call.")}
                </Text>
              </View>
            )}

            <View style={[s.inputGroup, { marginTop: 6 }]}>
              <Text style={s.inputLabel}>{t("Sankalp Wish / Special Request (Optional)")}</Text>
              <TextInput
                style={[s.textInput, { height: 60, paddingTop: 10 }]}
                placeholder={t("e.g., Family health, peace, success in studies")}
                placeholderTextColor={A.textXs}
                multiline
                numberOfLines={3}
                value={specialWish}
                onChangeText={setSpecialWish}
              />
            </View>
          </View>

          {/* Section 3: Pandit Dakshina selector */}
          <View style={s.sectionCard}>
            <Text style={s.sectionHeader}>{t("3. Pandit Dakshina (Blessed Offering)")}</Text>
            <Text style={s.sectionSub}>{t("Offer respect to the performing Acharya with a token dakshina.")}</Text>

            <View style={s.dakshinaGrid}>
              {[21, 51, 101, 251].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    s.dakshinaBtn,
                    panditTip === option && s.dakshinaBtnActive
                  ]}
                  onPress={() => {
                    setPanditTip(option);
                    setCustomTip("");
                  }}
                >
                  <Text style={[s.dakshinaText, panditTip === option && s.dakshinaTextActive]}>
                    ₹{option}
                  </Text>
                  {option === 51 && (
                    <View style={s.popularBadge}>
                      <Text style={s.popularBadgeText}>{t("Popular")}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity
              style={[
                s.customDakshinaBtn,
                panditTip === null && s.customDakshinaBtnActive
              ]}
              onPress={() => setPanditTip(null)}
              activeOpacity={0.9}
            >
              <Ionicons
                name={panditTip === null ? "radio-button-on" : "radio-button-off"}
                size={18}
                color={panditTip === null ? A.orange : A.textS}
                style={{ marginRight: 8 }}
              />
              <Text style={s.customDakshinaLabel}>{t("Custom Dakshina")}</Text>
              {panditTip === null && (
                <TextInput
                  style={s.customTipInput}
                  placeholder="₹ Amount"
                  placeholderTextColor={A.textXs}
                  keyboardType="number-pad"
                  value={customTip}
                  onChangeText={setCustomTip}
                />
              )}
            </TouchableOpacity>
          </View>

          {/* Section 4: Billing Details Summary */}
          {!!selectedPujaName && (
            <View style={s.sectionCard}>
              <Text style={s.sectionHeader}>{t("4. Billing Summary")}</Text>
              
              <View style={s.summaryCard}>
                <View style={s.summaryRow}>
                  <Text style={s.summaryLabel}>{t("Selected Seva")}</Text>
                  <Text style={s.summaryValue}>{t(selectedPujaName)}</Text>
                </View>
                <View style={s.summaryRow}>
                  <Text style={s.summaryLabel}>{t("Priest Dakshina")}</Text>
                  <Text style={s.summaryValue}>₹{selectedTip}</Text>
                </View>
                <View style={[s.summaryRow, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                  <Text style={[s.summaryLabel, { fontFamily: "Outfit-Bold", color: A.text }]}>{t("Total Payable Amount")}</Text>
                  <Text style={[s.summaryValue, { fontFamily: "Outfit-ExtraBold", color: A.orange, fontSize: 16 }]}>₹{totalPayable}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Checkout Booking Button */}
          <TouchableOpacity
            style={[s.checkoutBtn, isSubmitting && s.disabledBtn]}
            onPress={handleBooking}
            disabled={isSubmitting}
            activeOpacity={0.8}
          >
            <Ionicons name="checkmark-circle" size={18} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={s.checkoutBtnText}>
              {isSubmitting ? t("CONFIRMING BOOKING...") : t("CONFIRM & BOOK PUJA")}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── MODAL: BOOKING SUCCESS ────────────────────────────────────────── */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={successModal}
        onRequestClose={() => setSuccessModal(false)}
      >
        <View style={s.modalOverlay}>
          <View style={s.alertContainer}>
            <View style={s.alertIconWrapper}>
              <Ionicons name="checkmark-circle" size={54} color={A.green} />
            </View>
            <Text style={s.alertTitle}>{t("Puja Booked Successfully!")}</Text>
            {orderRefId ? (
              <Text style={s.refIdText}>
                {t("Booking Reference ID")}: <Text style={{ fontFamily: "Outfit-Bold", color: A.orange }}>{orderRefId}</Text>
              </Text>
            ) : null}
            <Text style={s.alertBody}>
              {t("Jai Mata Di! Your ritual booking has been successfully recorded. You can track performance status in your profile.")}
            </Text>
            <TouchableOpacity
              style={s.alertBtn}
              onPress={() => {
                setSuccessModal(false);
                router.replace({ pathname: "/settings_detail", params: { type: "my_orders" } });
              }}
            >
              <Text style={s.alertBtnText}>{t("VIEW ORDERS")}</Text>
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
    justifyContent: "space-between",
    paddingHorizontal: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitleText: {
    fontSize: 18,
    fontFamily: "Outfit-Bold",
    color: A.text,
  },

  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 16,
  },
  specialtyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  specialtyChip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  specialtyChipSelected: {
    backgroundColor: '#ea580c',
    borderColor: '#ea580c',
  },
  specialtyChipText: {
    fontFamily: 'Outfit-Medium',
    fontSize: 13,
    color: '#475569',
  },
  specialtyChipTextSelected: {
    color: '#ffffff',
  },

  // Pandit Banner
  panditBanner: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: A.orangeB2,
    gap: 14,
  },
  panditAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: "#ffffff",
    backgroundColor: A.bgLight,
  },
  panditBannerLabel: {
    fontSize: 8.5,
    fontFamily: "Outfit-Bold",
    color: A.orange,
    letterSpacing: 0.8,
  },
  panditBannerName: {
    fontSize: 16,
    fontFamily: "Outfit-Bold",
    color: A.text,
    marginTop: 2,
  },

  // Cards layout
  sectionCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: A.bdr2,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 8,
    elevation: 1,
  },
  sectionHeader: {
    fontSize: 14.5,
    fontFamily: "Outfit-Bold",
    color: A.text,
    marginBottom: 6,
  },
  sectionSub: {
    fontSize: 11.5,
    fontFamily: "Outfit-Medium",
    color: A.textS,
    marginBottom: 14,
    lineHeight: 16,
  },

  loadingContainer: {
    alignItems: "center",
    paddingVertical: 20,
    gap: 6,
  },
  loadingText: {
    fontSize: 12,
    fontFamily: "Outfit-Medium",
    color: A.textS,
  },

  // Packages Horizontal Scroll
  packagesScroll: {
    gap: 12,
    paddingRight: 10,
  },
  packageCard: {
    width: 140,
    backgroundColor: A.bgSoft,
    borderWidth: 1,
    borderColor: A.bdr2,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
  },
  packageCardSelected: {
    borderColor: A.orange,
    backgroundColor: A.orangeBg,
  },
  packageImg: {
    width: "100%",
    height: 90,
    backgroundColor: A.bgLight,
  },
  packageInfo: {
    padding: 10,
    gap: 3,
  },
  packageTitle: {
    fontSize: 12,
    fontFamily: "Outfit-Bold",
    color: A.text,
  },
  packageProvider: {
    fontSize: 9,
    fontFamily: "Outfit-Medium",
    color: A.textS,
  },
  packagePriceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },
  packagePrice: {
    fontSize: 12,
    fontFamily: "Outfit-Bold",
    color: A.orange,
  },
  packageOriginalPrice: {
    fontSize: 9.5,
    fontFamily: "Outfit-Medium",
    color: A.textXs,
    textDecorationLine: "line-through",
  },
  selectedTick: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: A.orange,
    justifyContent: "center",
    alignItems: "center",
  },

  // Tilak Indicator
  sankalpHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  tilakBox: {
    width: 10,
    height: 12,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    borderTopWidth: 0,
    borderColor: "#f97316",
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 2,
  },
  tilakDotInner: {
    width: 3.5,
    height: 5,
    borderRadius: 1.75,
    backgroundColor: "#dc2626",
    marginTop: -1,
  },

  // Inputs
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

  // Dakshina Grid
  dakshinaGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 8,
    marginBottom: 12,
  },
  dakshinaBtn: {
    flex: 1,
    height: 44,
    backgroundColor: A.bgSoft,
    borderWidth: 1.2,
    borderColor: A.bdr2,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  dakshinaBtnActive: {
    borderColor: A.orange,
    backgroundColor: A.orangeBg,
  },
  dakshinaText: {
    fontSize: 13,
    fontFamily: "Outfit-Bold",
    color: A.textM,
  },
  dakshinaTextActive: {
    color: A.orange,
  },
  popularBadge: {
    position: "absolute",
    top: -8,
    backgroundColor: A.orange,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  popularBadgeText: {
    color: "#ffffff",
    fontSize: 7,
    fontFamily: "Outfit-Bold",
  },
  customDakshinaBtn: {
    flexDirection: "row",
    alignItems: "center",
    height: 44,
    borderWidth: 1.2,
    borderColor: A.bdr2,
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: A.bgSoft,
  },
  customDakshinaBtnActive: {
    borderColor: A.orange,
    backgroundColor: A.orangeBg,
  },
  customDakshinaLabel: {
    fontSize: 12,
    fontFamily: "Outfit-Bold",
    color: A.textS,
    marginRight: 10,
  },
  customTipInput: {
    flex: 1,
    height: 38,
    fontSize: 13,
    fontFamily: "Outfit-Bold",
    color: A.orange,
    textAlign: "right",
    paddingRight: 4,
  },

  // Billing summary
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
    borderColor: A.bdr,
    paddingBottom: 8,
  },
  summaryLabel: {
    fontSize: 12,
    fontFamily: "Outfit-Medium",
    color: A.textS,
  },
  summaryValue: {
    fontSize: 12,
    fontFamily: "Outfit-Bold",
    color: A.text,
  },

  // Booking Checkout Buttons
  checkoutBtn: {
    backgroundColor: A.orange,
    borderRadius: 16,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    marginTop: 10,
    shadowColor: A.orange,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  checkoutBtnText: {
    fontSize: 13,
    fontFamily: "Outfit-Bold",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  disabledBtn: {
    backgroundColor: A.textXs,
    shadowOpacity: 0,
    elevation: 0,
  },

  // Error alert
  errorAlert: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#fca5a5",
    borderRadius: 16,
    padding: 12,
    marginHorizontal: 16,
    marginTop: 10,
  },
  errorAlertText: {
    fontSize: 12.5,
    fontFamily: "Outfit-Medium",
    color: "#b91c1c",
    flex: 1,
  },

  // Success Modal Overlay
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.4)",
    justifyContent: "center",
    alignItems: "center",
  },
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
  refIdText: {
    fontSize: 12.5,
    fontFamily: "Outfit-Medium",
    color: A.textM,
    marginBottom: 12,
  },
  alertBody: {
    fontSize: 12.5,
    fontFamily: "Outfit-Medium",
    color: A.textS,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 20,
  },
  alertBtn: {
    backgroundColor: A.orange,
    height: 42,
    borderRadius: 14,
    paddingHorizontal: 28,
    justifyContent: "center",
    alignItems: "center",
  },
  alertBtnText: {
    fontSize: 12.5,
    fontFamily: "Outfit-Bold",
    color: "#ffffff",
  },
  venuePillRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 2,
    marginBottom: 4,
  },
  venuePill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 38,
    borderWidth: 1.2,
    borderColor: A.bdr2,
    borderRadius: 12,
    backgroundColor: A.bgSoft,
  },
  venuePillActive: {
    backgroundColor: A.orange,
    borderColor: A.orange,
  },
  venuePillText: {
    fontSize: 11,
    fontFamily: "Outfit-Bold",
    color: A.textS,
  },
  venuePillTextActive: {
    color: "#ffffff",
  },
  onlineNotice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: A.orangeBg,
    borderWidth: 1,
    borderColor: A.orangeB2,
    borderRadius: 12,
    padding: 10,
    marginTop: 2,
    marginBottom: 4,
  },
  onlineNoticeText: {
    fontSize: 11,
    fontFamily: "Outfit-Medium",
    color: A.orange,
    flex: 1,
    lineHeight: 15,
  },
});
