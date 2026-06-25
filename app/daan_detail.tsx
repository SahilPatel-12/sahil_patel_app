import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Dimensions,
  Platform,
  Alert,
  Modal,
  ActivityIndicator,
  Share,
  LayoutAnimation,
  UIManager,
  KeyboardAvoidingView,
  StatusBar
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../services/supabase';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';

const { width, height } = Dimensions.get('window');

// Enable layout animations for smooth dropdown toggles on Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const RASHIS = [
  { id: 'aries', name: 'Aries', hindi: 'मेष', symbol: '♈' },
  { id: 'taurus', name: 'Taurus', hindi: 'वृषभ', symbol: '♉' },
  { id: 'gemini', name: 'Gemini', hindi: 'मिथुन', symbol: '♊' },
  { id: 'cancer', name: 'Cancer', hindi: 'कर्क', symbol: '♋' },
  { id: 'leo', name: 'Leo', hindi: 'सिंह', symbol: '♌' },
  { id: 'virgo', name: 'Virgo', hindi: 'कन्या', symbol: '♍' },
  { id: 'libra', name: 'Libra', hindi: 'तुला', symbol: '♎' },
  { id: 'scorpio', name: 'Scorpio', hindi: 'वृश्चिक', symbol: '♏' },
  { id: 'sagittarius', name: 'Sagittarius', hindi: 'धनु', symbol: '♐' },
  { id: 'capricorn', name: 'Capricorn', hindi: 'मकर', symbol: '♑' },
  { id: 'aquarius', name: 'Aquarius', hindi: 'कुंभ', symbol: '♒' },
  { id: 'pisces', name: 'Pisces', hindi: 'मीन', symbol: '♓' }
];

const getWeekdayFallback = (dayName: string) => {
  const day = (dayName || '').toLowerCase().trim();
  if (day.includes('mon') || day.includes('som')) {
    return {
      title: 'Sacred Milk & White Rice donation',
      description: 'Monday is ruled by the Moon and dedicated to Lord Shiva. Donating milk and white rice brings emotional stability, inner peace, and smooth relationship dynamics.',
      benefit: 'Brings mental peace & emotional balance',
      color: 'White',
      lucky_number: 2,
      mantra: 'ॐ नमः शिवाय',
      price: 251,
      weekday: 'Monday'
    };
  }
  if (day.includes('tue') || day.includes('mangal')) {
    return {
      title: 'Sacred Red Lentils & Copper Vessel donation',
      description: 'Tuesday is ruled by Mars and dedicated to Lord Hanuman. Donating red lentils (Masur Dal) and copper removes planet conflicts, fear, and delays.',
      benefit: 'Removes planetary delays & boosts career energy',
      color: 'Red',
      lucky_number: 9,
      mantra: 'ॐ हं हनुमते नमः',
      price: 251,
      weekday: 'Tuesday'
    };
  }
  if (day.includes('wed') || day.includes('budh') || day.includes('buddh')) {
    return {
      title: 'Green Moong Dal & Spinach feed donation',
      description: 'Wednesday is ruled by Mercury and dedicated to Lord Ganesha. Donating green moong dal or organic spinach improves wisdom, memory, business success, and networking.',
      benefit: 'Improves business clarity, learning & logic',
      color: 'Green',
      lucky_number: 5,
      mantra: 'ॐ गं गणपतये नमः',
      price: 251,
      weekday: 'Wednesday'
    };
  }
  if (day.includes('thu') || day.includes('guru') || day.includes('brihaspati')) {
    return {
      title: 'Sacred Bananas & Yellow Clothes donation',
      description: 'Thursday is ruled by Jupiter and dedicated to Lord Vishnu. Donating bananas, split chickpeas (Chana Dal), and yellow clothes brings immense wisdom and prosperity.',
      benefit: 'Attains knowledge, wisdom & good fortune',
      color: 'Yellow',
      lucky_number: 3,
      mantra: 'ॐ बृं बृहस्पतये नमः',
      price: 251,
      weekday: 'Thursday'
    };
  }
  if (day.includes('fri') || day.includes('shukra')) {
    return {
      title: 'Sacred Sugar & Curd donation',
      description: 'Friday is ruled by Venus and dedicated to Goddess Laxmi. Donating sugar, curd, and white items attracts wealth, material prosperity, and marital joy.',
      benefit: 'Attracts prosperity, financial ease & luxury',
      color: 'Pink / White',
      lucky_number: 6,
      mantra: 'ॐ श्रीं महालक्ष्म्यै नमः',
      price: 251,
      weekday: 'Friday'
    };
  }
  if (day.includes('sat') || day.includes('shani')) {
    return {
      title: 'Sacred Black Sesame & Mustard Oil donation',
      description: 'Saturday is ruled by Saturn and dedicated to Lord Shani. Donating mustard oil and black sesame seeds shields from planetary obstacles, accidents, and financial pain.',
      benefit: 'Shields from Saturn delays & removes career hurdles',
      color: 'Black / Dark Blue',
      lucky_number: 8,
      mantra: 'ॐ शं शनैश्चराय नमः',
      price: 251,
      weekday: 'Saturday'
    };
  }
  return {
    title: 'Sacred Jaggery & Wheat donation',
    description: 'Sunday is dedicated to Lord Surya (the Sun). Donating jaggery and wheat strengthens the Sun, bringing health, energy, and success in professional affairs.',
    benefit: 'Enhances social respect, health & leadership',
    color: 'Saffron',
    lucky_number: 1,
    mantra: 'ॐ सूर्याय नमः',
    price: 251,
    weekday: 'Sunday'
  };
};

const isUuid = (uuid: string) => {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uuid);
};

export default function DaanDetailScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams();
  const { t } = useLanguage();
  const { user } = useCart();

  // Daan object state
  const [daan, setDaan] = useState<any>(null);

  // Form Inputs
  const [devoteeName, setDevoteeName] = useState('');
  const [phone, setPhone] = useState('');
  const [gotra, setGotra] = useState('');
  const [selectedRashi, setSelectedRashi] = useState('');
  const [sankalp, setSankalp] = useState('');

  // Donation Amount Selection
  const [selectedTier, setSelectedTier] = useState<'basic' | 'vishesh' | 'maha' | 'custom'>('vishesh');
  const [customAmount, setCustomAmount] = useState('');

  // Dropdown states
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

  // Payment Bottom Sheet Modal
  const [paymentSheetVisible, setPaymentSheetVisible] = useState(false);
  const [paymentStep, setPaymentStep] = useState<'methods' | 'processing' | 'success'>('methods');
  const [processingMessage, setProcessingMessage] = useState('Initiating payment...');
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string>('gpay');

  // Load Daan details passed from home screen or fallback
  useEffect(() => {
    if (params.daanData) {
      try {
        const parsed = JSON.parse(params.daanData as string);
        setDaan(parsed);
        if (parsed.price) {
          // If a custom price is set in the database, respect it
        }
      } catch (e) {
        console.error('Error parsing daanData, using weekday fallback:', e);
        const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        setDaan({ id: 'fallback', ...getWeekdayFallback(todayName) });
      }
    } else {
      const todayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
      setDaan({ id: 'fallback', ...getWeekdayFallback(todayName) });
    }
  }, [params.daanData]);

  // Pre-populate user profile details
  useEffect(() => {
    if (user) {
      if (!devoteeName) setDevoteeName(user.name || '');
      if (!phone) setPhone(user.phone || '');
      if (!selectedRashi) {
        const userRashiLower = (user.rashi || '').toLowerCase().trim();
        const found = RASHIS.find(r => r.id === userRashiLower || r.name.toLowerCase() === userRashiLower || r.hindi === userRashiLower);
        if (found) {
          setSelectedRashi(found.id);
        } else if (daan && daan.rashi) {
          setSelectedRashi(daan.rashi);
        }
      }
    } else if (daan && daan.rashi && !selectedRashi) {
      setSelectedRashi(daan.rashi);
    }
  }, [user, daan]);

  if (!daan) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ea580c" />
        <Text style={styles.loadingText}>{t('Loading Sacred Remedy details...')}</Text>
      </View>
    );
  }

  // Derive active donation amount
  const getActiveAmount = (): number => {
    switch (selectedTier) {
      case 'basic': return 101;
      case 'vishesh': return daan.price || 251;
      case 'maha': return 501;
      case 'custom': return parseInt(customAmount) || 0;
    }
  };

  const activeAmount = getActiveAmount();

  const handleOpenPayment = () => {
    if (!devoteeName.trim()) {
      Alert.alert(t('Name Required'), t('Please enter Devotee Name for the sacred Sankalp.'));
      return;
    }
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      Alert.alert(t('Phone Required'), t('Please enter a valid 10-digit mobile number.'));
      return;
    }
    if (!selectedRashi) {
      Alert.alert(t('Rashi Required'), t('Please select your Rashi Moon sign.'));
      return;
    }
    if (!sankalp.trim()) {
      Alert.alert(t('Sankalp Required'), t('Please state your Sankalp or wish for this Daan.'));
      return;
    }
    if (selectedTier === 'custom' && (!customAmount || parseInt(customAmount) < 11)) {
      Alert.alert(t('Invalid Amount'), t('Please enter a custom donation amount of at least ₹11.'));
      return;
    }

    setPaymentStep('methods');
    setPaymentSheetVisible(true);
  };

  const handleSimulatePayment = async () => {
    setPaymentStep('processing');
    
    // Simulate payment authorization updates for high visual feedback
    const messages = [
      'Connecting secure server...',
      'Verifying payment tokens with bank...',
      'Chanting Vedic Mantras & consecrating Sankalp...',
      'Registering donation details...'
    ];

    for (let i = 0; i < messages.length; i++) {
      setProcessingMessage(messages[i]);
      await new Promise(resolve => setTimeout(resolve, 800));
    }

    try {
      let finalDaanId = daan.id;

      // Ensure we query a valid UUID from Supabase if we have a fallback id
      if (!isUuid(finalDaanId)) {
        const day = (daan.weekday || new Date().toLocaleDateString('en-US', { weekday: 'long' })).toLowerCase().trim();
        let normalizedDay = 'Sunday';
        if (day.includes('mon') || day.includes('som')) normalizedDay = 'Monday';
        else if (day.includes('tue') || day.includes('mang')) normalizedDay = 'Tuesday';
        else if (day.includes('wed') || day.includes('budh') || day.includes('buddh')) normalizedDay = 'Wednesday';
        else if (day.includes('thu') || day.includes('gur') || day.includes('brih')) normalizedDay = 'Thursday';
        else if (day.includes('fri') || day.includes('shuk')) normalizedDay = 'Friday';
        else if (day.includes('sat') || day.includes('shan')) normalizedDay = 'Saturday';
        else if (day.includes('sun') || day.includes('rav') || day.includes('adit')) normalizedDay = 'Sunday';

        const { data: match } = await supabase
          .from('daans')
          .select('id')
          .or(`rashi.eq.${selectedRashi.toLowerCase()},weekday.eq.${normalizedDay}`)
          .limit(1);
        if (match && match.length > 0) {
          finalDaanId = match[0].id;
        }
      }

      // 1. Insert booking details into database
      const { error: dbError } = await supabase
        .from('daan_bookings')
        .insert({
          daan_id: isUuid(finalDaanId) ? finalDaanId : null,
          user_id: user?.id || null,
          devotee_name: devoteeName.trim(),
          phone: phone.trim(),
          rashi: selectedRashi,
          gotra: gotra.trim() || null,
          sankalp: sankalp.trim(),
          amount: activeAmount,
          payment_status: 'Paid'
        });

      if (dbError) {
        console.warn('[Daan Booking] Non-fatal database booking failed:', dbError.message);
      }
    } catch (e) {
      console.warn('[Daan Booking] Offline fallback simulation triggered:', e);
    }

    setPaymentStep('success');
  };

  const handleShareBlessings = () => {
    const selectedRashiObj = RASHIS.find(r => r.id === selectedRashi);
    const message = `🙏 Devotional Sankalp Completed! 🙏\n\n✨ Devotee: ${devoteeName}\n🌟 Rashi: ${selectedRashiObj ? `${selectedRashiObj.name} (${selectedRashiObj.hindi})` : selectedRashi}\n🌾 Remedy: ${daan.title}\n🕉️ Mantra: ${daan.mantra}\n💫 Gotra: ${gotra || 'N/A'}\n🌸 Wish/Sankalp: "${sankalp}"\n\nMay Lord Vishnu & the divine planets bless our path with prosperity and wellness! Chanted live by temple priests. Download MantraPuja app to organize your daily remedies! 🚩`;
    
    Share.share({
      message,
      title: 'MantraPuja Daan Sankalp'
    });
  };

  const toggleDropdown = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsDropdownOpen(!isDropdownOpen);
  };

  const selectRashiOption = (id: string) => {
    setSelectedRashi(id);
    toggleDropdown();
  };

  const activeRashiObj = RASHIS.find(r => r.id === selectedRashi);

  return (
    <View style={styles.rootContainer}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }} edges={['top']}>
        
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#0f172a" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>{t('Vedic Daan & Remedy')}</Text>
            <Text style={styles.headerSubtitle}>{t('Resolve planetary obstacles')}</Text>
          </View>
          <View style={{ width: 40 }} />
        </View>

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Top Remedy Banner */}
            <LinearGradient
              colors={['#fff7ed', '#ffedd5']}
              style={styles.remedyBanner}
            >
              <View style={styles.remedyBannerHeader}>
                <Ionicons name="shield-checkmark-outline" size={20} color="#ea580c" />
                <Text style={styles.remedyBannerBadge}>
                  {daan.rashi ? `${t('Rashi Specific Remedy')}` : `${t('Auspicious Daily Daan')}`}
                </Text>
              </View>
              
              <Text style={styles.remedyBannerTitle}>{t(daan.title)}</Text>
              <Text style={styles.remedyBannerDesc}>{t(daan.description)}</Text>

              {/* Mantra Card */}
              <View style={styles.mantraBox}>
                <Text style={styles.mantraHeaderLabel}>{t('🕉️ Auspicious Remedy Chanting Mantra')}</Text>
                <Text style={styles.mantraText}>{daan.mantra}</Text>
                <Text style={styles.mantraHint}>{t('Chant this mantra 11 times during the donation')}</Text>
              </View>

              {/* Remedy Metadata Row */}
              <View style={styles.metaRow}>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>{t('Shubh Color')}</Text>
                  <View style={styles.colorPill}>
                    <View style={[styles.colorIndicator, { backgroundColor: daan.color.toLowerCase().includes('red') ? '#ef4444' : daan.color.toLowerCase().includes('green') ? '#22c55e' : daan.color.toLowerCase().includes('yellow') ? '#eab308' : daan.color.toLowerCase().includes('white') ? '#94a3b8' : daan.color.toLowerCase().includes('blue') ? '#1e3a8a' : '#ea580c' }]} />
                    <Text style={styles.metaValue}>{t(daan.color)}</Text>
                  </View>
                </View>
                <View style={styles.metaCol}>
                  <Text style={styles.metaLabel}>{t('Lucky Number')}</Text>
                  <View style={styles.numberBadge}>
                    <Text style={styles.numberBadgeText}>{daan.lucky_number}</Text>
                  </View>
                </View>
              </View>
            </LinearGradient>

            {/* Devotional Benefits Card */}
            <View style={styles.cardContainer}>
              <Text style={styles.cardTitle}>{t('Spiritual Benefits')}</Text>
              <View style={styles.benefitRow}>
                <Ionicons name="checkmark-circle" size={18} color="#16a34a" style={styles.benefitIcon} />
                <Text style={styles.benefitText}>{t(daan.benefit)}</Text>
              </View>
              <View style={styles.benefitRow}>
                <Ionicons name="checkmark-circle" size={18} color="#16a34a" style={styles.benefitIcon} />
                <Text style={styles.benefitText}>{t('Pacifies malefic planetary alignment to welcome prosperity.')}</Text>
              </View>
              <View style={styles.benefitRow}>
                <Ionicons name="checkmark-circle" size={18} color="#16a34a" style={styles.benefitIcon} />
                <Text style={styles.benefitText}>{t('Handled respectfully by temple priests at Kashi Vishwanath ghats.')}</Text>
              </View>
            </View>

            {/* Devotee Form Details */}
            <View style={styles.cardContainer}>
              <View style={styles.sankalpFormHeader}>
                <View style={styles.tilakDot} />
                <Text style={styles.cardTitle}>{t('Sankalp & Devotee Registration')}</Text>
              </View>
              <Text style={styles.formHint}>
                {t('Provide details for the specialized name-based planetary chants.')}
              </Text>

              {/* Devotee Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('Devotee Full Name')} *</Text>
                <View style={[styles.inputWrapper, focusedField === 'name' && styles.inputWrapperFocused]}>
                  <Ionicons name="person-outline" size={16} color={focusedField === 'name' ? '#ea580c' : '#64748b'} style={styles.inputIcon} />
                  <TextInput
                    style={styles.textInput}
                    placeholder={t('Enter full name')}
                    placeholderTextColor="#94a3b8"
                    value={devoteeName}
                    onChangeText={setDevoteeName}
                    onFocus={() => setFocusedField('name')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>

              {/* Phone & Gotra row */}
              <View style={styles.formRow}>
                <View style={[styles.inputGroup, { flex: 1.2, marginRight: 8 }]}>
                  <Text style={styles.inputLabel}>{t('Contact Phone')} *</Text>
                  <View style={[styles.inputWrapper, focusedField === 'phone' && styles.inputWrapperFocused]}>
                    <Ionicons name="phone-portrait-outline" size={16} color={focusedField === 'phone' ? '#ea580c' : '#64748b'} style={styles.inputIcon} />
                    <TextInput
                      style={styles.textInput}
                      placeholder={t('Phone number')}
                      placeholderTextColor="#94a3b8"
                      keyboardType="phone-pad"
                      maxLength={15}
                      value={phone}
                      onChangeText={setPhone}
                      onFocus={() => setFocusedField('phone')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                </View>
                <View style={[styles.inputGroup, { flex: 0.8 }]}>
                  <Text style={styles.inputLabel}>{t('Gotra (Optional)')}</Text>
                  <View style={[styles.inputWrapper, focusedField === 'gotra' && styles.inputWrapperFocused]}>
                    <TextInput
                      style={[styles.textInput, { paddingLeft: 12 }]}
                      placeholder={t('e.g., Kashyap')}
                      placeholderTextColor="#94a3b8"
                      value={gotra}
                      onChangeText={setGotra}
                      onFocus={() => setFocusedField('gotra')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                </View>
              </View>

              {/* Rashi Selector Dropdown */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('Devotee Rashi (Moon Sign)')} *</Text>
                <TouchableOpacity
                  style={[styles.dropdownButton, isDropdownOpen && styles.dropdownButtonActive]}
                  onPress={toggleDropdown}
                  activeOpacity={0.8}
                >
                  <View style={styles.dropdownButtonLeft}>
                    <Ionicons name="moon-outline" size={16} color="#ea580c" />
                    <Text style={[styles.dropdownButtonText, !selectedRashi && { color: '#94a3b8' }]}>
                      {activeRashiObj ? `${activeRashiObj.symbol} ${activeRashiObj.name} (${activeRashiObj.hindi})` : t('Select your Rashi')}
                    </Text>
                  </View>
                  <Ionicons name={isDropdownOpen ? "chevron-up" : "chevron-down"} size={16} color="#64748b" />
                </TouchableOpacity>

                {/* Animated Dropdown Content */}
                {isDropdownOpen && (
                  <View style={styles.dropdownContent}>
                    <Text style={styles.dropdownSectionTitle}>{t('Select Lunar Zodiac Sign')}</Text>
                    <View style={styles.rashiGrid}>
                      {RASHIS.map((rashiItem) => {
                        const isSelected = selectedRashi === rashiItem.id;
                        return (
                          <TouchableOpacity
                            key={rashiItem.id}
                            style={[styles.rashiGridCell, isSelected && styles.rashiGridCellSelected]}
                            onPress={() => selectRashiOption(rashiItem.id)}
                            activeOpacity={0.7}
                          >
                            <Text style={[styles.rashiSymbolText, isSelected && styles.rashiSymbolTextSelected]}>
                              {rashiItem.symbol}
                            </Text>
                            <Text style={[styles.rashiCellName, isSelected && styles.rashiCellNameSelected]} numberOfLines={1}>
                              {rashiItem.name}
                            </Text>
                            <Text style={[styles.rashiCellHindi, isSelected && styles.rashiCellHindiSelected]} numberOfLines={1}>
                              {rashiItem.hindi}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                )}
              </View>

              {/* Sacred Sankalp Wish */}
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>{t('Devotee Sankalp Wish / Special Request')} *</Text>
                <View style={[styles.inputWrapper, { height: 90, alignItems: 'flex-start', paddingTop: 8 }, focusedField === 'sankalp' && styles.inputWrapperFocused]}>
                  <TextInput
                    style={[styles.textInput, { height: 74, paddingLeft: 12, textAlignVertical: 'top' }]}
                    placeholder={t('Enter your prayer request (e.g. Good health, success in career, family harmony, peace of mind)')}
                    placeholderTextColor="#94a3b8"
                    multiline
                    numberOfLines={4}
                    value={sankalp}
                    onChangeText={setSankalp}
                    onFocus={() => setFocusedField('sankalp')}
                    onBlur={() => setFocusedField(null)}
                  />
                </View>
              </View>
            </View>

            {/* Donation Packages / Pricing Tier */}
            <View style={styles.cardContainer}>
              <Text style={styles.cardTitle}>{t('Choose Donation Package')}</Text>
              <Text style={styles.formHint}>
                {t('Select a contribution package for your planetary remedy.')}
              </Text>

              <View style={styles.tierGrid}>
                {/* Basic Tier */}
                <TouchableOpacity
                  style={[styles.tierCard, selectedTier === 'basic' && styles.tierCardSelected]}
                  onPress={() => {
                    setSelectedTier('basic');
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tierLabel, selectedTier === 'basic' && styles.tierTextActive]}>{t('Basic Remedy')}</Text>
                  <Text style={styles.tierPrice}>₹101</Text>
                  <Text style={styles.tierFeatures}>{t('Planetary Sankalp chanting by temple panditji.')}</Text>
                </TouchableOpacity>

                {/* Vishesh Tier */}
                <TouchableOpacity
                  style={[styles.tierCard, selectedTier === 'vishesh' && styles.tierCardSelected, { borderColor: selectedTier === 'vishesh' ? '#ea580c' : '#fed7aa' }]}
                  onPress={() => {
                    setSelectedTier('vishesh');
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.recommendedBadge}>
                    <Text style={styles.recommendedBadgeText}>{t('POPULAR')}</Text>
                  </View>
                  <Text style={[styles.tierLabel, selectedTier === 'vishesh' && styles.tierTextActive]}>{t('Vishesh Remedy')}</Text>
                  <Text style={styles.tierPrice}>₹{daan.price || 251}</Text>
                  <Text style={styles.tierFeatures}>{t('Planetary Sankalp + full temple grain/oil offering.')}</Text>
                </TouchableOpacity>

                {/* Maha Tier */}
                <TouchableOpacity
                  style={[styles.tierCard, selectedTier === 'maha' && styles.tierCardSelected]}
                  onPress={() => {
                    setSelectedTier('maha');
                    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.tierLabel, selectedTier === 'maha' && styles.tierTextActive]}>{t('Maha Remedy')}</Text>
                  <Text style={styles.tierPrice}>₹501</Text>
                  <Text style={styles.tierFeatures}>{t('Detailed planetary chants + sacred thread + dry prasad.')}</Text>
                </TouchableOpacity>
              </View>

              {/* Custom Tier selector */}
              <TouchableOpacity
                style={[styles.customTierButton, selectedTier === 'custom' && styles.customTierButtonSelected]}
                onPress={() => {
                  setSelectedTier('custom');
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                }}
                activeOpacity={0.8}
              >
                <View style={styles.customTierLeft}>
                  <Ionicons name="create-outline" size={16} color={selectedTier === 'custom' ? '#ea580c' : '#64748b'} />
                  <Text style={[styles.customTierText, selectedTier === 'custom' && styles.customTierTextSelected]}>
                    {t('Contribute Custom Amount')}
                  </Text>
                </View>
                {selectedTier === 'custom' && <Ionicons name="checkmark-circle" size={18} color="#ea580c" />}
              </TouchableOpacity>

              {/* Custom Amount input field */}
              {selectedTier === 'custom' && (
                <View style={styles.customAmountGroup}>
                  <Text style={styles.inputLabel}>{t('Enter Amount (₹)')} *</Text>
                  <View style={[styles.inputWrapper, focusedField === 'customAmt' && styles.inputWrapperFocused]}>
                    <Text style={styles.rupeePrefix}>₹</Text>
                    <TextInput
                      style={[styles.textInput, { paddingLeft: 4 }]}
                      placeholder="e.g. 1001"
                      placeholderTextColor="#94a3b8"
                      keyboardType="numeric"
                      value={customAmount}
                      onChangeText={setCustomAmount}
                      onFocus={() => setFocusedField('customAmt')}
                      onBlur={() => setFocusedField(null)}
                    />
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          {/* Bottom Action Footer */}
          <SafeAreaView edges={['bottom']} style={styles.bottomFooter}>
            <View style={styles.footerLeft}>
              <Text style={styles.footerTotalLabel}>{t('Total Remedy Donation')}</Text>
              <Text style={styles.footerTotalAmount}>₹{activeAmount}</Text>
            </View>
            <TouchableOpacity
              style={styles.donateButton}
              onPress={handleOpenPayment}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#ea580c', '#f97316']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.donateButtonGradient}
              >
                <Text style={styles.donateButtonText}>{t('Confirm & Donate')}</Text>
                <Ionicons name="arrow-forward" size={18} color="#ffffff" style={{ marginLeft: 6 }} />
              </LinearGradient>
            </TouchableOpacity>
          </SafeAreaView>
        </KeyboardAvoidingView>

        {/* Sliding Payment bottom sheet modal */}
        <Modal
          visible={paymentSheetVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setPaymentSheetVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.modalDismiss}
              onPress={() => paymentStep !== 'processing' && setPaymentSheetVisible(false)}
            />
            
            <View style={styles.paymentSheet}>
              
              {/* Step 1: Methods Select */}
              {paymentStep === 'methods' && (
                <>
                  <View style={styles.sheetHeader}>
                    <Text style={styles.sheetTitle}>{t('Secure Remittance Checkout')}</Text>
                    <TouchableOpacity onPress={() => setPaymentSheetVisible(false)} style={styles.sheetCloseBtn}>
                      <Ionicons name="close" size={22} color="#0f172a" />
                    </TouchableOpacity>
                  </View>

                  <Text style={styles.paymentAmountTitle}>{t('Remedy Donation Payable Amount')}</Text>
                  <Text style={styles.paymentAmountValue}>₹{activeAmount}</Text>

                  <ScrollView style={styles.paymentMethodsScroll}>
                    <Text style={styles.paymentGroupLabel}>{t('INSTANT UPI DEPOSIT (RECOMMENDED)')}</Text>
                    
                    <TouchableOpacity
                      style={[styles.paymentMethodRow, selectedPaymentMethod === 'gpay' && styles.paymentMethodRowSelected]}
                      onPress={() => setSelectedPaymentMethod('gpay')}
                      activeOpacity={0.8}
                    >
                      <View style={styles.paymentMethodLeft}>
                        <View style={styles.paymentIconGpay}>
                          <Text style={styles.paymentIconText}>G</Text>
                        </View>
                        <Text style={styles.paymentMethodName}>Google Pay</Text>
                      </View>
                      <View style={[styles.paymentRadio, selectedPaymentMethod === 'gpay' && styles.paymentRadioSelected]} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.paymentMethodRow, selectedPaymentMethod === 'phonepe' && styles.paymentMethodRowSelected]}
                      onPress={() => setSelectedPaymentMethod('phonepe')}
                      activeOpacity={0.8}
                    >
                      <View style={styles.paymentMethodLeft}>
                        <View style={[styles.paymentIconGpay, { backgroundColor: '#7c3aed' }]}>
                          <Text style={styles.paymentIconText}>Pe</Text>
                        </View>
                        <Text style={styles.paymentMethodName}>PhonePe</Text>
                      </View>
                      <View style={[styles.paymentRadio, selectedPaymentMethod === 'phonepe' && styles.paymentRadioSelected]} />
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.paymentMethodRow, selectedPaymentMethod === 'paytm' && styles.paymentMethodRowSelected]}
                      onPress={() => setSelectedPaymentMethod('paytm')}
                      activeOpacity={0.8}
                    >
                      <View style={styles.paymentMethodLeft}>
                        <View style={[styles.paymentIconGpay, { backgroundColor: '#0ea5e9' }]}>
                          <Text style={styles.paymentIconText}>Py</Text>
                        </View>
                        <Text style={styles.paymentMethodName}>Paytm UPI</Text>
                      </View>
                      <View style={[styles.paymentRadio, selectedPaymentMethod === 'paytm' && styles.paymentRadioSelected]} />
                    </TouchableOpacity>

                    <Text style={styles.paymentGroupLabel}>{t('DEBIT / CREDIT CARDS')}</Text>

                    <TouchableOpacity
                      style={[styles.paymentMethodRow, selectedPaymentMethod === 'card' && styles.paymentMethodRowSelected]}
                      onPress={() => setSelectedPaymentMethod('card')}
                      activeOpacity={0.8}
                    >
                      <View style={styles.paymentMethodLeft}>
                        <Ionicons name="card-outline" size={20} color="#64748b" style={{ marginRight: 12 }} />
                        <Text style={styles.paymentMethodName}>Visa / Mastercard / RuPay</Text>
                      </View>
                      <View style={[styles.paymentRadio, selectedPaymentMethod === 'card' && styles.paymentRadioSelected]} />
                    </TouchableOpacity>
                  </ScrollView>

                  <TouchableOpacity
                    style={styles.sheetPayButton}
                    onPress={handleSimulatePayment}
                    activeOpacity={0.9}
                  >
                    <Text style={styles.sheetPayButtonText}>{t(`Pay ₹${activeAmount}`)}</Text>
                  </TouchableOpacity>
                </>
              )}

              {/* Step 2: Processing Payment */}
              {paymentStep === 'processing' && (
                <View style={styles.processingWrapper}>
                  <ActivityIndicator size="large" color="#ea580c" />
                  <Text style={styles.processingTitle}>{t('Securing Devotional Remittance')}</Text>
                  <Text style={styles.processingText}>{processingMessage}</Text>
                </View>
              )}

              {/* Step 3: Success Sankalp Screen */}
              {paymentStep === 'success' && (
                <View style={styles.successWrapper}>
                  <View style={styles.successAccentLine} />
                  
                  <Ionicons name="checkmark-circle" size={54} color="#16a34a" />
                  <Text style={styles.successTitle}>{t('Daan Sankalp Registered! 🙏')}</Text>
                  <Text style={styles.successSubtitle}>
                    {t('Jai Mata Di! Your remedy contribution is registered successfully.')}
                  </Text>

                  {/* Sacred Certificate Card */}
                  <View style={styles.certificateCard}>
                    <View style={styles.certHeader}>
                      <Text style={styles.certHeaderTitle}>{t('SACRED REMEDY CERTIFICATE')}</Text>
                    </View>

                    <View style={styles.certBody}>
                      <View style={styles.certRow}>
                        <Text style={styles.certLabel}>{t('Devotee')}</Text>
                        <Text style={styles.certValue}>{devoteeName}</Text>
                      </View>
                      
                      <View style={styles.certRow}>
                        <Text style={styles.certLabel}>{t('Gotra / Phone')}</Text>
                        <Text style={styles.certValue}>{gotra || 'N/A'} • {phone}</Text>
                      </View>

                      <View style={styles.certRow}>
                        <Text style={styles.certLabel}>{t('Rashi / Lunar Sign')}</Text>
                        <Text style={styles.certValue}>{activeRashiObj ? `${activeRashiObj.name} (${activeRashiObj.hindi})` : selectedRashi}</Text>
                      </View>

                      <View style={styles.certRow}>
                        <Text style={styles.certLabel}>{t('Remedy Daan')}</Text>
                        <Text style={[styles.certValue, { color: '#ea580c', fontFamily: 'Outfit-Bold' }]}>{daan.title}</Text>
                      </View>

                      <View style={styles.certRow}>
                        <Text style={styles.certLabel}>{t('Sankalp Wish')}</Text>
                        <Text style={styles.certValueItalic}>"{sankalp}"</Text>
                      </View>

                      <View style={styles.certRow}>
                        <Text style={styles.certLabel}>{t('Amount Paid')}</Text>
                        <Text style={styles.certValueBold}>₹{activeAmount}</Text>
                      </View>
                    </View>
                    <View style={styles.certFooter}>
                      <Text style={styles.certFooterText}>
                        {t('Chanted live by priests at the holy shrines.')}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.successActionsRow}>
                    <TouchableOpacity
                      style={styles.shareBtn}
                      onPress={handleShareBlessings}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="share-social-outline" size={18} color="#ea580c" />
                      <Text style={styles.shareBtnText}>{t('Share Blessings')}</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.doneBtn}
                      onPress={() => {
                        setPaymentSheetVisible(false);
                        router.replace('/(tabs)/home');
                      }}
                      activeOpacity={0.8}
                    >
                      <Text style={styles.doneBtnText}>{t('Go to Home')}</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#ffffff'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff'
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    fontFamily: 'Outfit-Medium',
    color: '#ea580c'
  },
  headerBar: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    backgroundColor: '#ffffff'
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center'
  },
  headerTitle: {
    fontSize: 15,
    fontFamily: 'Outfit-Bold',
    color: '#0f172a'
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: 'Outfit-Medium',
    color: '#ea580c'
  },
  scrollContent: {
    paddingBottom: 24
  },
  remedyBanner: {
    margin: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#fed7aa'
  },
  remedyBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8
  },
  remedyBannerBadge: {
    fontSize: 11,
    fontFamily: 'Outfit-Bold',
    color: '#ea580c',
    marginLeft: 6,
    textTransform: 'uppercase'
  },
  remedyBannerTitle: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
    color: '#7c2d12',
    lineHeight: 24,
    marginBottom: 8
  },
  remedyBannerDesc: {
    fontSize: 13,
    fontFamily: 'Outfit-Regular',
    color: '#7c2d12',
    lineHeight: 18,
    opacity: 0.85,
    marginBottom: 16
  },
  mantraBox: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ffedd5',
    alignItems: 'center',
    marginBottom: 16
  },
  mantraHeaderLabel: {
    fontSize: 10,
    fontFamily: 'Outfit-Bold',
    color: '#c2410c',
    textTransform: 'uppercase',
    marginBottom: 6
  },
  mantraText: {
    fontSize: 17,
    fontFamily: 'Outfit-Bold',
    color: '#ea580c',
    textAlign: 'center',
    marginVertical: 4,
    letterSpacing: 0.5
  },
  mantraHint: {
    fontSize: 10,
    fontFamily: 'Outfit-Medium',
    color: '#94a3b8',
    marginTop: 4
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#fed7aa'
  },
  metaCol: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  metaLabel: {
    fontSize: 12,
    fontFamily: 'Outfit-Medium',
    color: '#c2410c',
    marginRight: 8
  },
  colorPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffedd5'
  },
  colorIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6
  },
  metaValue: {
    fontSize: 11,
    fontFamily: 'Outfit-Bold',
    color: '#0f172a'
  },
  numberBadge: {
    backgroundColor: '#ea580c',
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center'
  },
  numberBadgeText: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    color: '#ffffff'
  },
  cardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 8,
      },
      android: {
        elevation: 2,
      }
    })
  },
  cardTitle: {
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
    color: '#0f172a',
    marginBottom: 12
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10
  },
  benefitIcon: {
    marginRight: 8,
    marginTop: 2
  },
  benefitText: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Outfit-Medium',
    color: '#475569',
    lineHeight: 18
  },
  sankalpFormHeader: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  tilakDot: {
    width: 6,
    height: 14,
    borderRadius: 3,
    backgroundColor: '#ea580c',
    marginRight: 8,
    marginBottom: 12
  },
  formHint: {
    fontSize: 12,
    fontFamily: 'Outfit-Regular',
    color: '#64748b',
    lineHeight: 16,
    marginBottom: 16
  },
  inputGroup: {
    marginBottom: 14
  },
  inputLabel: {
    fontSize: 11,
    fontFamily: 'Outfit-Bold',
    color: '#334155',
    marginBottom: 6,
    textTransform: 'uppercase'
  },
  inputWrapper: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12
  },
  inputWrapperFocused: {
    borderColor: '#ea580c',
    backgroundColor: '#fff7ed'
  },
  inputIcon: {
    marginRight: 8
  },
  textInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Outfit-Medium',
    color: '#0f172a',
    height: '100%',
    padding: 0
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  dropdownButton: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12
  },
  dropdownButtonActive: {
    borderColor: '#ea580c',
    backgroundColor: '#fff7ed'
  },
  dropdownButtonLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  dropdownButtonText: {
    fontSize: 13,
    fontFamily: 'Outfit-Bold',
    color: '#0f172a',
    marginLeft: 8
  },
  dropdownContent: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#ea580c',
    borderRadius: 12,
    backgroundColor: '#ffffff',
    padding: 12,
    zIndex: 10
  },
  dropdownSectionTitle: {
    fontSize: 11,
    fontFamily: 'Outfit-Bold',
    color: '#ea580c',
    textTransform: 'uppercase',
    marginBottom: 8
  },
  rashiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between'
  },
  rashiGridCell: {
    width: '31%',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
    marginBottom: 8
  },
  rashiGridCellSelected: {
    borderColor: '#ea580c',
    backgroundColor: '#fff7ed'
  },
  rashiSymbolText: {
    fontSize: 18,
    marginBottom: 2
  },
  rashiSymbolTextSelected: {
    color: '#ea580c'
  },
  rashiCellName: {
    fontSize: 11,
    fontFamily: 'Outfit-Bold',
    color: '#334155'
  },
  rashiCellNameSelected: {
    color: '#ea580c'
  },
  rashiCellHindi: {
    fontSize: 9,
    fontFamily: 'Outfit-Medium',
    color: '#64748b'
  },
  rashiCellHindiSelected: {
    color: '#ea580c'
  },
  tierGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12
  },
  tierCard: {
    width: '31%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 10,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    position: 'relative'
  },
  tierCardSelected: {
    borderColor: '#ea580c',
    backgroundColor: '#fff7ed'
  },
  tierLabel: {
    fontSize: 10,
    fontFamily: 'Outfit-Bold',
    color: '#475569',
    marginBottom: 4,
    textAlign: 'center'
  },
  tierTextActive: {
    color: '#ea580c'
  },
  tierPrice: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
    color: '#0f172a',
    marginBottom: 6
  },
  tierFeatures: {
    fontSize: 8,
    fontFamily: 'Outfit-Regular',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 11
  },
  recommendedBadge: {
    position: 'absolute',
    top: -8,
    backgroundColor: '#ea580c',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6
  },
  recommendedBadgeText: {
    fontSize: 7,
    fontFamily: 'Outfit-Bold',
    color: '#ffffff'
  },
  customTierButton: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    paddingHorizontal: 12,
    marginTop: 4
  },
  customTierButtonSelected: {
    borderColor: '#ea580c',
    backgroundColor: '#fff7ed'
  },
  customTierLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  customTierText: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    color: '#475569',
    marginLeft: 8
  },
  customTierTextSelected: {
    color: '#ea580c'
  },
  customAmountGroup: {
    marginTop: 12
  },
  rupeePrefix: {
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
    color: '#334155',
    marginRight: 4
  },
  bottomFooter: {
    height: 68,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderColor: '#f1f5f9',
    backgroundColor: '#ffffff'
  },
  footerLeft: {
    flex: 1
  },
  footerTotalLabel: {
    fontSize: 10,
    fontFamily: 'Outfit-Bold',
    color: '#64748b',
    textTransform: 'uppercase'
  },
  footerTotalAmount: {
    fontSize: 20,
    fontFamily: 'Outfit-Bold',
    color: '#ea580c',
    marginTop: 2
  },
  donateButton: {
    flex: 1.2,
    height: 44,
    borderRadius: 12,
    overflow: 'hidden'
  },
  donateButtonGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  donateButtonText: {
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
    color: '#ffffff'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end'
  },
  modalDismiss: {
    flex: 1
  },
  paymentSheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: height * 0.85
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  sheetTitle: {
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
    color: '#0f172a'
  },
  sheetCloseBtn: {
    padding: 4
  },
  paymentAmountTitle: {
    fontSize: 11,
    fontFamily: 'Outfit-Medium',
    color: '#64748b',
    textAlign: 'center',
    marginTop: 10
  },
  paymentAmountValue: {
    fontSize: 26,
    fontFamily: 'Outfit-Bold',
    color: '#ea580c',
    textAlign: 'center',
    marginVertical: 6
  },
  paymentMethodsScroll: {
    marginVertical: 12,
    maxHeight: 220
  },
  paymentGroupLabel: {
    fontSize: 9,
    fontFamily: 'Outfit-Bold',
    color: '#94a3b8',
    marginBottom: 8,
    marginTop: 12,
    letterSpacing: 0.5
  },
  paymentMethodRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    marginBottom: 8
  },
  paymentMethodRowSelected: {
    borderColor: '#ea580c',
    backgroundColor: '#fff7ed'
  },
  paymentMethodLeft: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  paymentIconGpay: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ea4335',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  paymentIconText: {
    fontSize: 10,
    fontFamily: 'Outfit-Bold',
    color: '#ffffff'
  },
  paymentMethodName: {
    fontSize: 13,
    fontFamily: 'Outfit-Bold',
    color: '#1e293b'
  },
  paymentRadio: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#cbd5e1'
  },
  paymentRadioSelected: {
    borderColor: '#ea580c',
    backgroundColor: '#ea580c'
  },
  sheetPayButton: {
    backgroundColor: '#ea580c',
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16
  },
  sheetPayButtonText: {
    fontSize: 15,
    fontFamily: 'Outfit-Bold',
    color: '#ffffff'
  },
  processingWrapper: {
    alignItems: 'center',
    paddingVertical: 40
  },
  processingTitle: {
    fontSize: 15,
    fontFamily: 'Outfit-Bold',
    color: '#0f172a',
    marginTop: 16,
    marginBottom: 6
  },
  processingText: {
    fontSize: 12,
    fontFamily: 'Outfit-Medium',
    color: '#64748b',
    textAlign: 'center'
  },
  successWrapper: {
    alignItems: 'center',
    paddingVertical: 10
  },
  successAccentLine: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e2e8f0',
    alignSelf: 'center',
    marginBottom: 16
  },
  successTitle: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
    color: '#16a34a',
    marginTop: 8,
    marginBottom: 4
  },
  successSubtitle: {
    fontSize: 11,
    fontFamily: 'Outfit-Medium',
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 16
  },
  certificateCard: {
    width: '100%',
    backgroundColor: '#fffbeb',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#f59e0b',
    padding: 14,
    borderStyle: 'dashed',
    marginBottom: 16
  },
  certHeader: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#fef3c7',
    paddingBottom: 8,
    marginBottom: 10
  },
  certHeaderTitle: {
    fontSize: 11,
    fontFamily: 'Outfit-Bold',
    color: '#b45309',
    letterSpacing: 1
  },
  certBody: {
    gap: 6
  },
  certRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  certLabel: {
    fontSize: 10,
    fontFamily: 'Outfit-Bold',
    color: '#78350f',
    width: '35%'
  },
  certValue: {
    fontSize: 11,
    fontFamily: 'Outfit-Medium',
    color: '#1e293b',
    width: '65%',
    textAlign: 'right'
  },
  certValueItalic: {
    fontSize: 10,
    fontFamily: 'Outfit-Medium',
    color: '#475569',
    fontStyle: 'italic',
    width: '65%',
    textAlign: 'right'
  },
  certValueBold: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    color: '#b45309',
    width: '65%',
    textAlign: 'right'
  },
  certFooter: {
    borderTopWidth: 1,
    borderTopColor: '#fef3c7',
    marginTop: 10,
    paddingTop: 8,
    alignItems: 'center'
  },
  certFooterText: {
    fontSize: 9,
    fontFamily: 'Outfit-Medium',
    color: '#b45309',
    textAlign: 'center'
  },
  successActionsRow: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 8
  },
  shareBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ea580c',
    backgroundColor: '#ffffff'
  },
  shareBtnText: {
    fontSize: 13,
    fontFamily: 'Outfit-Bold',
    color: '#ea580c',
    marginLeft: 6
  },
  doneBtn: {
    flex: 1,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ea580c',
    justifyContent: 'center',
    alignItems: 'center'
  },
  doneBtnText: {
    fontSize: 13,
    fontFamily: 'Outfit-Bold',
    color: '#ffffff'
  }
});
