import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../services/supabase";
import { safeStorage } from "../services/storage";
import { useLanguage } from "../context/LanguageContext";

const { width } = Dimensions.get("window");

const A = {
  bg:       "#ffffff",
  bgSoft:   "#f5f3ff", // light purple background for astrology theme
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
};

const AVAILABLE_SPECIALTIES = [
  "Kundli Milan",
  "Gemstone Advice",
  "Horoscope",
  "Lagna Chart",
  "Vastu Dosha",
  "Prashna Kundli",
  "KP Astrology",
  "Remedial Astrology"
];

const AVAILABLE_LANGUAGES = [
  "Hindi",
  "English",
  "Sanskrit",
  "Gujarati",
  "Marathi",
  "Tamil",
  "Telugu",
  "Bengali"
];

export default function RegisterAstrologerScreen() {
  const { t } = useLanguage();

  const [userId, setUserId] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [title, setTitle] = useState("");
  const [bio, setBio] = useState("");
  const [chargePerMin, setChargePerMin] = useState("30");
  const [experience, setExperience] = useState("5");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [profilePhoto, setProfilePhoto] = useState("");

  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    async function loadUserSession() {
      try {
        const sessionStr = await safeStorage.getItem("user_session");
        if (sessionStr) {
          const session = JSON.parse(sessionStr);
          const userData = session.user || session;
          setUserId(userData.id);
          setFullName(userData.name || "");
        }
      } catch (err) {
        console.error("Error reading session:", err);
      } finally {
        setIsCheckingSession(false);
      }
    }
    loadUserSession();
  }, []);

  const toggleSpecialty = (item: string) => {
    setSelectedSpecialties(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const toggleLanguage = (item: string) => {
    setSelectedLanguages(prev =>
      prev.includes(item) ? prev.filter(i => i !== item) : [...prev, item]
    );
  };

  const handleSubmit = async () => {
    if (!userId) {
      Alert.alert(t("Login Required"), t("Please login as a user before registering as an astrologer."));
      return;
    }
    if (!fullName.trim()) {
      Alert.alert(t("Required Field"), t("Full Name is required."));
      return;
    }
    if (!title.trim()) {
      Alert.alert(t("Required Field"), t("Spiritual Title is required."));
      return;
    }
    if (selectedSpecialties.length === 0) {
      Alert.alert(t("Required Selection"), t("Please select at least one specialty."));
      return;
    }
    if (selectedLanguages.length === 0) {
      Alert.alert(t("Required Selection"), t("Please select at least one supported language."));
      return;
    }

    setIsLoading(true);
    try {
      const charge = parseInt(chargePerMin, 10) || 30;
      const exp = parseInt(experience, 10) || 5;

      const { error } = await supabase
        .from("website_store_astrologers")
        .insert({
          user_id: userId,
          full_name: fullName.trim(),
          spiritual_title: title.trim(),
          bio: bio.trim(),
          charge_per_min: charge,
          experience_years: exp,
          specialties: selectedSpecialties,
          languages: selectedLanguages,
          city: city.trim() || null,
          state: state.trim() || null,
          profile_photo: profilePhoto.trim() || "https://avatar.iran.liara.run/public/boy?username=astrologer",
          is_online: true
        });

      if (error) throw error;

      Alert.alert(
        t("Registration Successful!"),
        t("Jai Mata Di! Your cosmic registry request has been recorded. You can now consult users via chat/call."),
        [{ text: t("OK") }]
      );

      // Reset Form
      setBio("");
      setTitle("");
      setSelectedSpecialties([]);
      setSelectedLanguages([]);
    } catch (err: any) {
      console.error("Astrologer registration failure:", err);
      Alert.alert(t("Registration Failed"), err.message || t("An error occurred during submission."));
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingSession) {
    return (
      <View style={s.center}>
        <ActivityIndicator size="large" color={A.purple} />
      </View>
    );
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.scrollContent} showsVerticalScrollIndicator={false}>
      {/* Header card */}
      <View style={s.card}>
        <View style={s.headerRow}>
          <Ionicons name="sparkles" size={24} color={A.purple} />
          <Text style={s.title}>{t("Register as Astrologer")}</Text>
        </View>
        <Text style={s.subtitle}>
          {t("Join our sacred cosmic circle and offer professional planetary chart consultations.")}
        </Text>
      </View>

      {/* Main Form Fields */}
      <View style={s.card}>
        <Text style={s.sectionTitle}>{t("Cosmic Profile Details")}</Text>

        <View style={s.inputGroup}>
          <Text style={s.label}>{t("Full Name")} *</Text>
          <TextInput
            style={s.textInput}
            value={fullName}
            onChangeText={setFullName}
            placeholder={t("Enter full name")}
            placeholderTextColor={A.textXs}
          />
        </View>

        <View style={s.inputGroup}>
          <Text style={s.label}>{t("Spiritual Title")} *</Text>
          <TextInput
            style={s.textInput}
            value={title}
            onChangeText={setTitle}
            placeholder={t("e.g. Expert Astrologer & Kundli Matcher")}
            placeholderTextColor={A.textXs}
          />
        </View>

        <View style={s.inputGroup}>
          <Text style={s.label}>{t("Biography")}</Text>
          <TextInput
            style={[s.textInput, s.textArea]}
            value={bio}
            onChangeText={setBio}
            placeholder={t("Describe your methodology, lineage, and experience...")}
            placeholderTextColor={A.textXs}
            multiline
            numberOfLines={4}
          />
        </View>

        <View style={s.inputGroup}>
          <Text style={s.label}>{t("Profile Image URL")}</Text>
          <TextInput
            style={s.textInput}
            value={profilePhoto}
            onChangeText={setProfilePhoto}
            placeholder={t("Enter image HTTPS link")}
            placeholderTextColor={A.textXs}
          />
        </View>

        <View style={s.row}>
          <View style={[s.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={s.label}>{t("Consultation Fee")} ({t("Coins/min")})</Text>
            <TextInput
              style={s.textInput}
              value={chargePerMin}
              onChangeText={setChargePerMin}
              placeholder="30"
              keyboardType="numeric"
              placeholderTextColor={A.textXs}
            />
          </View>
          <View style={[s.inputGroup, { flex: 1 }]}>
            <Text style={s.label}>{t("Experience")} ({t("Years")})</Text>
            <TextInput
              style={s.textInput}
              value={experience}
              onChangeText={setExperience}
              placeholder="5"
              keyboardType="numeric"
              placeholderTextColor={A.textXs}
            />
          </View>
        </View>

        <View style={s.row}>
          <View style={[s.inputGroup, { flex: 1, marginRight: 8 }]}>
            <Text style={s.label}>{t("City")}</Text>
            <TextInput
              style={s.textInput}
              value={city}
              onChangeText={setCity}
              placeholder={t("City")}
              placeholderTextColor={A.textXs}
            />
          </View>
          <View style={[s.inputGroup, { flex: 1 }]}>
            <Text style={s.label}>{t("State")}</Text>
            <TextInput
              style={s.textInput}
              value={state}
              onChangeText={setState}
              placeholder={t("State")}
              placeholderTextColor={A.textXs}
            />
          </View>
        </View>
      </View>

      {/* Specialties Checklist */}
      <View style={s.card}>
        <Text style={s.sectionTitle}>{t("Astro Specialties")} *</Text>
        <View style={s.grid}>
          {AVAILABLE_SPECIALTIES.map((spec) => {
            const isSelected = selectedSpecialties.includes(spec);
            return (
              <TouchableOpacity
                key={spec}
                style={[s.chip, isSelected && s.chipSelected]}
                onPress={() => toggleSpecialty(spec)}
                activeOpacity={0.7}
              >
                <Text style={[s.chipText, isSelected && s.chipTextSelected]}>
                  {t(spec)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Languages Checklist */}
      <View style={s.card}>
        <Text style={s.sectionTitle}>{t("Languages Supported")} *</Text>
        <View style={s.grid}>
          {AVAILABLE_LANGUAGES.map((lang) => {
            const isSelected = selectedLanguages.includes(lang);
            return (
              <TouchableOpacity
                key={lang}
                style={[s.chip, isSelected && s.chipSelected]}
                onPress={() => toggleLanguage(lang)}
                activeOpacity={0.7}
              >
                <Text style={[s.chipText, isSelected && s.chipTextSelected]}>
                  {t(lang)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Submit Button */}
      <TouchableOpacity
        style={[s.submitBtn, isLoading && s.disabledBtn]}
        onPress={handleSubmit}
        disabled={isLoading}
        activeOpacity={0.8}
      >
        {isLoading ? (
          <ActivityIndicator size="small" color="#ffffff" />
        ) : (
          <>
            <Ionicons name="checkmark-circle" size={20} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={s.submitBtnText}>{t("SUBMIT REGISTRATION")}</Text>
          </>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#faf5ff",
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#faf5ff",
  },
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    borderWidth: 1,
    borderColor: A.purpleB2,
    padding: 18,
    ...Platform.select({
      ios: {
        shadowColor: "#7c3aed",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontFamily: "Outfit-Bold",
    color: A.text,
  },
  subtitle: {
    fontSize: 12,
    fontFamily: "Outfit-Medium",
    color: A.textS,
    lineHeight: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Outfit-Bold",
    color: A.purple,
    marginBottom: 14,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 11,
    fontFamily: "Outfit-Bold",
    color: A.textS,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  textInput: {
    backgroundColor: "#f9f8ff",
    borderWidth: 1,
    borderColor: A.purpleB2,
    borderRadius: 12,
    height: 44,
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: "Outfit-Medium",
    color: A.text,
  },
  textArea: {
    height: 80,
    paddingTop: 10,
  },
  row: {
    flexDirection: "row",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: "#f9f8ff",
    borderWidth: 1,
    borderColor: A.purpleB2,
  },
  chipSelected: {
    backgroundColor: A.purple,
    borderColor: A.purple,
  },
  chipText: {
    fontSize: 12,
    fontFamily: "Outfit-Medium",
    color: A.textS,
  },
  chipTextSelected: {
    color: "#ffffff",
    fontFamily: "Outfit-Bold",
  },
  submitBtn: {
    backgroundColor: A.purple,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 48,
    borderRadius: 16,
    shadowColor: A.purple,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    marginTop: 8,
    marginBottom: 24,
  },
  submitBtnText: {
    fontSize: 14,
    fontFamily: "Outfit-Bold",
    color: "#ffffff",
  },
  disabledBtn: {
    backgroundColor: A.textXs,
    shadowOpacity: 0,
    elevation: 0,
  },
});
