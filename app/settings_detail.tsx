import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Dimensions,
  StatusBar,
  LayoutAnimation,
  Platform,
  UIManager,
  Alert,
  ActivityIndicator,
  Modal,
  Share
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { Colors } from '../constants/Colors';
import { useLanguage } from '../context/LanguageContext';
import { safeStorage } from '../services/storage';
import { supabase } from '../services/supabase';
import { uploadToR2 } from '../services/r2';

const { width } = Dimensions.get('window');

// Enable LayoutAnimation for Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Internal High-Fidelity Video Preview Modal Sub-component
function VideoPreviewModal({ url, onClose }: { url: string; onClose: () => void }) {
  const player = useVideoPlayer(url, (p) => {
    p.loop = false;
    p.play();
  });

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Namaste! 🌸\n\nI just got my personal Puja performed, and the Acharya shared this sacred ritual recording. Watch the blessings here:\n\n🎥 ${url}\n\nMay peace, health, and prosperity be with you! 🙏✨`,
        title: 'Sacred Puja Video Recording'
      });
    } catch (error) {
      Alert.alert('Sharing Error', 'Unable to open share menu.');
    }
  };

  const handleDownload = async () => {
    try {
      // Open direct URL in system browser which has native download/save capabilities for video files
      await WebBrowser.openBrowserAsync(url);
    } catch (error) {
      Alert.alert('Download Error', 'Could not open video file in system browser.');
    }
  };

  return (
    <Modal
      visible={!!url}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalVideoContainer}>
          <View style={styles.modalVideoHeader}>
            <Text style={styles.modalVideoTitle}>Personal Puja Recording</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={20} color="#ffffff" />
            </TouchableOpacity>
          </View>
          <VideoView
            style={styles.modalVideoView}
            player={player}
            allowsFullscreen
            allowsPictureInPicture
          />
          <View style={styles.modalVideoFooter}>
            <TouchableOpacity style={styles.modalActionBtn} onPress={handleShare} activeOpacity={0.8}>
              <Ionicons name="share-social" size={16} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.modalActionBtnText}>Share Video</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.modalActionBtn, styles.modalActionBtnSecondary]} onPress={handleDownload} activeOpacity={0.8}>
              <Ionicons name="download" size={16} color="#ea580c" style={{ marginRight: 6 }} />
              <Text style={styles.modalActionBtnTextSecondary}>Download</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function SettingsDetailScreen() {
  const insets = useSafeAreaInsets();
  const { locale, setLocale, t } = useLanguage();

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    if (parts.length === 1 && parts[0].length > 0) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return 'DV';
  };
  const params = useLocalSearchParams();
  const rawType = (params.type as string) || 'my_profile';
  const type = rawType.toLowerCase();

  // Unified Save State Message
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const triggerSaveMessage = (msg: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setSaveMessage(msg);
    setTimeout(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setSaveMessage(null);
    }, 2500);
  };

  // ==========================================
  // STATE DEFINITIONS
  // ==========================================

  // 1. Profile State
  const [profileName, setProfileName] = useState('Guest');
  const [profileEmail, setProfileEmail] = useState('');
  const [profilePhone, setProfilePhone] = useState('');
  const [profileGotra, setProfileGotra] = useState('');
  const [profileRashi, setProfileRashi] = useState('');
  const [profileNakshatra, setProfileNakshatra] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handlePickAndUploadImage = async () => {
    if (!user) {
      Alert.alert(t('Devotee Required'), t('Please log in to upload a profile picture.'));
      return;
    }

    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(t('Permission Denied'), t('Permission to access photos is required to upload a profile picture.'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setUploading(true);
        try {
          const selectedUri = result.assets[0].uri;
          const publicUrl = await uploadToR2(selectedUri, 'profiles');
          setAvatarUrl(publicUrl);
          
          // Automatically update Supabase database profile URL immediately on upload
          const { error } = await supabase
            .from('profiles')
            .update({ avatar_url: publicUrl })
            .eq('id', user.id);

          if (error) throw error;

          // Also update user_session local cache just in case other screens read avatar_url from session
          const updatedSession = {
            ...user,
            avatar_url: publicUrl
          };
          await safeStorage.setItem('user_session', JSON.stringify(updatedSession));
          setUser(updatedSession);

          triggerSaveMessage(t('Holy profile photo uploaded successfully!'));
        } catch (uploadErr: any) {
          console.error('Failed to upload/save profile image:', uploadErr);
          Alert.alert(t('Upload Failed'), t('Could not upload image. Please try again.'));
        } finally {
          setUploading(false);
        }
      }
    } catch (err) {
      console.error('Error during image picker:', err);
    }
  };

  // 2. Preference Settings State
  const [prefMuhurta, setPrefMuhurta] = useState(true);
  const [prefMantraReminders, setPrefMantraReminders] = useState(true);
  const [prefBackgroundChants, setPrefBackgroundChants] = useState(false);
  const [prefGoldTheme, setPrefGoldTheme] = useState(true);

  // 3. My Orders state
  const [ordersTab, setOrdersTab] = useState<'active' | 'past' | 'store'>('active');
  const [orders, setOrders] = useState<any[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [templeCatalog, setTempleCatalog] = useState<Record<string, string>>({});
  const [itemNamesMap, setItemNamesMap] = useState<Record<string, string>>({});
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

  const fetchTempleCatalog = async () => {
    try {
      const mapping: Record<string, string> = {};

      const [general, website, oneRupee, problem] = await Promise.all([
        supabase.from('general_poojas').select('id, temple'),
        supabase.from('website_pooja_products').select('id, temple_association'),
        supabase.from('one_rupee_poojas').select('id, provider'),
        supabase.from('problem_poojas').select('id, temple')
      ]);

      if (general.data) {
        general.data.forEach(item => {
          if (item.temple) mapping[item.id] = item.temple;
        });
      }
      if (website.data) {
        website.data.forEach(item => {
          if (item.temple_association) mapping[item.id] = item.temple_association;
        });
      }
      if (oneRupee.data) {
        oneRupee.data.forEach(item => {
          if (item.provider) mapping[item.id] = item.provider;
        });
      }
      if (problem.data) {
        problem.data.forEach(item => {
          if (item.temple) mapping[item.id] = item.temple;
        });
      }

      setTempleCatalog(mapping);
    } catch (err) {
      console.error('Error fetching temple catalog:', err);
    }
  };

  const fetchItemNames = async (ordersList: any[]) => {
    const ids = new Set<string>();
    ordersList.forEach(order => {
      if (order.order_items) {
        order.order_items.forEach((item: any) => {
          const isUuid = /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$/.test(item.item_id);
          if (isUuid) {
            ids.add(item.item_id);
          }
        });
      }
    });

    const uniqueIds = Array.from(ids);
    if (uniqueIds.length === 0) return;

    const nameMap: Record<string, string> = {};
    await Promise.all(uniqueIds.map(async (id) => {
      try {
        const [oneRupee, general, website, problem, offer, daily] = await Promise.all([
          supabase.from('one_rupee_poojas').select('title').eq('id', id).maybeSingle(),
          supabase.from('general_poojas').select('title').eq('id', id).maybeSingle(),
          supabase.from('website_pooja_products').select('name').eq('id', id).maybeSingle(),
          supabase.from('problem_poojas').select('title').eq('id', id).maybeSingle(),
          supabase.from('offer_pujas').select('title').eq('id', id).maybeSingle(),
          supabase.from('daily_pujas').select('title').eq('id', id).maybeSingle()
        ]);

        if (oneRupee.data) {
          nameMap[id] = oneRupee.data.title;
        } else if (general.data) {
          nameMap[id] = general.data.title;
        } else if (website.data) {
          nameMap[id] = website.data.name;
        } else if (problem.data) {
          nameMap[id] = problem.data.title;
        } else if (offer.data) {
          nameMap[id] = offer.data.title;
        } else if (daily.data) {
          nameMap[id] = daily.data.title;
        }
      } catch (err) {
        console.error('Error fetching dynamic title:', err);
      }
    }));

    setItemNamesMap(prev => ({ ...prev, ...nameMap }));
  };

  const getBookingTempleName = (orderItems: any[]) => {
    const defaultTemple = 'Kashi Vishwanath Mandir, Varanasi';
    if (!orderItems || orderItems.length === 0) return t(defaultTemple);

    const firstItem = orderItems[0];
    const itemId = firstItem.item_id;

    const mockTemples: Record<string, string> = {
      '1': 'Siddhi Vinayak Mandir, Mumbai',
      '2': 'Mahalaxmi Temple, Mumbai',
      '3': 'Kashi Vishwanath Mandir, Varanasi',
      '4': 'Siddhabali Hanuman Shrine, Kotdwar',
      '5': 'Kedarnath Temple, Uttarakhand',
      '6': 'Tirupati Balaji Mandir, Andhra Pradesh',
      '7': 'Ganga Ghat, Rishikesh',
      '8': 'Shani Shingnapur, Maharashtra',
    };

    const templeName = mockTemples[itemId] || templeCatalog[itemId] || defaultTemple;
    return t(templeName);
  };

  const getGotraChantingLabel = () => {
    const translations: Record<string, string> = {
      'English': 'Gotra Chanting & Puja Performance',
      'Hindi': 'गोत्रोच्चारण एवं पूजा अनुष्ठान',
      'Sanskrit': 'गोत्रोच्चारणं पूजा-अनुष्ठानं च',
      'Gujarati': 'ગોત્ર ઉચ્ચારણ અને પૂજા વિધિ',
      'Marathi': 'गोत्रोच्चार आणि पूजा विधी',
      'Tamil': 'கோத்திரம் உச்சரிப்பு மற்றும் பூஜை சடங்கு',
      'Telugu': 'గోత్ర జపం & పూజా విధానం',
    };
    return translations[locale] || 'Gotra Chanting & Puja Performance';
  };

  const fetchOrders = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(*),
          puja_booking_details(*),
          shipping_addresses(*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
      if (data && data.length > 0) {
        await fetchItemNames(data);
      }
    } catch (err) {
      console.error('Error fetching orders:', err);
    }
  };

  useEffect(() => {
    let ordersSubscription: any = null;

    const initUserAndData = async () => {
      try {
        const sessionData = await safeStorage.getItem('user_session');
        if (sessionData) {
          const parsedUser = JSON.parse(sessionData);
          setUser(parsedUser);
          
          // Load profile info from profiles table
          const { data: profileData } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', parsedUser.id)
            .maybeSingle();

          if (profileData) {
            setProfileName(profileData.full_name || parsedUser.name || 'Devotee');
            setProfileEmail(profileData.email || parsedUser.email || '');
            setProfilePhone(profileData.phone || parsedUser.phone || '');
            setProfileGotra(profileData.gotra || '');
            setProfileRashi(profileData.rashi || '');
            setProfileNakshatra(profileData.nakshatra || '');
            setAvatarUrl(profileData.avatar_url || null);
          }

          // Fetch orders and temple catalog in parallel
          await Promise.all([
            fetchOrders(parsedUser.id),
            fetchTempleCatalog()
          ]);

          // Realtime subscription for changes to orders
          ordersSubscription = supabase
            .channel(`user-orders-${parsedUser.id}`)
            .on(
              'postgres_changes',
              {
                event: '*',
                schema: 'public',
                table: 'orders',
                filter: `user_id=eq.${parsedUser.id}`
              },
              () => {
                fetchOrders(parsedUser.id);
              }
            )
            .subscribe();
        } else {
          setProfileName('Guest');
          setProfileEmail('');
          setProfilePhone('');
          setProfileGotra('');
          setProfileRashi('');
          setProfileNakshatra('');
          setAvatarUrl(null);
        }
      } catch (err) {
        console.error('Error initializing user profile & orders:', err);
      } finally {
        setLoadingOrders(false);
      }
    };

    initUserAndData();

    return () => {
      if (ordersSubscription) {
        supabase.removeChannel(ordersSubscription);
      }
    };
  }, []);

  // 4. Wallet State
  const [walletCoins, setWalletCoins] = useState(240);
  const [isScratched, setIsScratched] = useState(false);
  const [scratchReward, setScratchReward] = useState<number | null>(null);

  const simulateRecharge = (amount: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setWalletCoins(prev => prev + amount);
    triggerSaveMessage(t('Added') + ' ' + amount + ' ' + t('Divine Coins to your Wallet!'));
  };

  const triggerScratch = () => {
    if (isScratched) return;
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const reward = Math.floor(Math.random() * 150) + 51; // Auspicious reward
    setScratchReward(reward);
    setWalletCoins(prev => prev + reward);
    setIsScratched(true);
  };

  // 5. Language State
  const languagesList = [
    { name: 'Sanskrit', native: 'संस्कृतम्' },
    { name: 'Hindi', native: 'हिन्दी' },
    { name: 'English', native: 'English' },
    { name: 'Gujarati', native: 'ગુજરાતી' },
    { name: 'Marathi', native: 'मराठी' },
    { name: 'Tamil', native: 'தமிழ்' },
    { name: 'Telugu', native: 'తెలుగు' }
  ];

  // 6. Help & Support State
  const [supportFeedback, setSupportFeedback] = useState('');
  const [feedbackRating, setFeedbackRating] = useState(5);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const faqs = [
    { q: 'How do I participate in my booked online puja?', a: 'Once booked, a specialized link is generated inside your Active Bookings panel. Our pandits will chant your name and Gotra live, which you can join in via video streaming.' },
    { q: 'When and how will I receive the sacred Prasad?', a: 'Prasad is consecrated inside the temple during the morning auspicious hours and immediately shipped using speed delivery. A tracking code is sent to your phone.' },
    { q: 'Can I add my entire family to a single Sankalp?', a: 'Yes! Our Family Pariwar package options allow adding up to 4 names and Gotras for combined spiritual shielding.' },
    { q: 'Are my transactions and payments fully secure?', a: 'Absolutely. All donations, dakshina offerings, and wallet credits are processed using highly secure encrypted payments.' }
  ];

  // Get localized title for header
  const getHeaderTitle = () => {
    switch (type) {
      case 'my_profile': return t('myProfile');
      case 'settings': return t('settings');
      case 'my_orders': return t('myOrders');
      case 'my_wallet': return t('myWallet');
      case 'language': return t('language');
      case 'help_&_support': return t('helpSupport');
      case 'about_us': return t('aboutUs');
      case 'logout': return t('logout');
      default: return 'Settings Detail';
    }
  };

  // ==========================================
  // RENDER HELPERS
  // ==========================================

  // 1. Profile Content Component
  const renderProfileView = () => (
    <View style={styles.contentCard}>
      {/* Profile Photo Header */}
      <View style={styles.profileAvatarHeader}>
        <View style={styles.bigAvatarCircle}>
          {uploading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : avatarUrl ? (
            <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={styles.bigAvatarText}>{getInitials(profileName)}</Text>
          )}
        </View>
        <TouchableOpacity 
          style={styles.editAvatarBtn} 
          activeOpacity={0.7}
          onPress={handlePickAndUploadImage}
          disabled={uploading}
        >
          <Ionicons name="camera" size={14} color="#ffffff" />
          <Text style={styles.editAvatarText}>{uploading ? t('Uploading...') : t('Change Photo')}</Text>
        </TouchableOpacity>
      </View>

      {/* Inputs Group */}
      <Text style={styles.subSectionTitle}>{t('Vedic Devotee Info')}</Text>
      
      <Text style={styles.inputLabel}>{t('FULL NAME')}</Text>
      <TextInput
        style={styles.profileInput}
        value={profileName === 'Guest' ? t('Guest') : profileName}
        onChangeText={setProfileName}
        placeholder={t("Enter your name")}
      />

      <Text style={styles.inputLabel}>{t('EMAIL ADDRESS')}</Text>
      <TextInput
        style={styles.profileInput}
        value={profileEmail}
        onChangeText={setProfileEmail}
        keyboardType="email-address"
        placeholder={t("Enter email address")}
      />

      <Text style={styles.inputLabel}>{t('PHONE NUMBER')}</Text>
      <TextInput
        style={styles.profileInput}
        value={profilePhone}
        onChangeText={setProfilePhone}
        keyboardType="phone-pad"
        placeholder={t("Enter phone number")}
      />

      <View style={styles.inputSplitRow}>
        <View style={styles.splitInputBox}>
          <Text style={styles.inputLabel}>{t('GOTRA')}</Text>
          <TextInput
            style={styles.profileInput}
            value={profileGotra}
            onChangeText={setProfileGotra}
            placeholder={t("e.g. Kashyap")}
          />
        </View>
        <View style={styles.splitInputBox}>
          <Text style={styles.inputLabel}>{t('RASHI')}</Text>
          <TextInput
            style={styles.profileInput}
            value={profileRashi}
            onChangeText={setProfileRashi}
            placeholder={t("e.g. Aries")}
          />
        </View>
      </View>

      <Text style={styles.inputLabel}>{t('NAKSHATRA')}</Text>
      <TextInput
        style={styles.profileInput}
        value={profileNakshatra}
        onChangeText={setProfileNakshatra}
        placeholder={t("e.g. Ashwini")}
      />

      <TouchableOpacity
        style={styles.primaryActionButton}
        activeOpacity={0.8}
        onPress={async () => {
          if (user) {
            try {
              // 1. Update profiles table
              const { error: profileErr } = await supabase
                .from('profiles')
                .upsert({
                  id: user.id,
                  full_name: profileName.trim(),
                  phone: profilePhone.trim(),
                  email: profileEmail.trim() || null,
                  gotra: profileGotra.trim() || null,
                  rashi: profileRashi.trim() || null,
                  nakshatra: profileNakshatra.trim() || null,
                  avatar_url: avatarUrl || null
                });
              if (profileErr) throw profileErr;

              // 2. Update app_users table
              const { error: appUserErr } = await supabase
                .from('app_users')
                .update({
                  name: profileName.trim(),
                  phone: profilePhone.trim(),
                  email: profileEmail.trim() || null,
                  updated_at: new Date().toISOString()
                })
                .eq('id', user.id);
              if (appUserErr) throw appUserErr;

              // 3. Update local user_session structure for instantaneous Header refresh
              const updatedSession = {
                ...user,
                name: profileName.trim(),
                phone: profilePhone.trim(),
                email: profileEmail.trim() || null,
                avatar_url: avatarUrl || null
              };
              await safeStorage.setItem('user_session', JSON.stringify(updatedSession));
              setUser(updatedSession);

              triggerSaveMessage(t('Vedic profile updated successfully!'));
            } catch (err) {
              console.error('Failed to update profile in database:', err);
              Alert.alert(t('Update Failed'), t('Could not update profile. Please try again.'));
            }
          } else {
            triggerSaveMessage(t('Vedic profile updated successfully!'));
          }
        }}
      >
        <Text style={styles.primaryActionButtonText}>{t('SAVE PROFILE DETAILS')}</Text>
      </TouchableOpacity>
    </View>
  );

  // 2. Settings Preferences Component
  const renderSettingsView = () => (
    <View style={styles.contentCard}>
      <Text style={styles.subSectionTitle}>{t('App Preferences')}</Text>
      <Text style={styles.sectionDescription}>
        {t('Configure notifications and sounds to align with auspicious timings.')}
      </Text>

      {/* Row 1: Shubh Muhurta Alerts */}
      <View style={styles.settingsSwitchRow}>
        <View style={styles.settingsSwitchInfo}>
          <Text style={styles.settingsSwitchLabel}>{t('Shubh Muhurta Alerts')}</Text>
          <Text style={styles.settingsSwitchDesc}>{t('Receive notifications for exact Brahma Muhurta and auspicious timings.')}</Text>
        </View>
        <Switch
          value={prefMuhurta}
          onValueChange={setPrefMuhurta}
          trackColor={{ false: '#cbd5e1', true: '#ea580c' }}
          thumbColor="#ffffff"
        />
      </View>

      <View style={styles.cardDivider} />

      {/* Row 2: Daily Mantra Reminders */}
      <View style={styles.settingsSwitchRow}>
        <View style={styles.settingsSwitchInfo}>
          <Text style={styles.settingsSwitchLabel}>{t('Daily Mantra Reminders')}</Text>
          <Text style={styles.settingsSwitchDesc}>{t('Gentle daily reminders to recite your selected chants and path.')}</Text>
        </View>
        <Switch
          value={prefMantraReminders}
          onValueChange={setPrefMantraReminders}
          trackColor={{ false: '#cbd5e1', true: '#ea580c' }}
          thumbColor="#ffffff"
        />
      </View>

      <View style={styles.cardDivider} />

      {/* Row 3: Background Temple Chants */}
      <View style={styles.settingsSwitchRow}>
        <View style={styles.settingsSwitchInfo}>
          <Text style={styles.settingsSwitchLabel}>{t('Temple Chants Audio')}</Text>
          <Text style={styles.settingsSwitchDesc}>{t('Enable subtle devotional background flute/sitar while browsing.')}</Text>
        </View>
        <Switch
          value={prefBackgroundChants}
          onValueChange={setPrefBackgroundChants}
          trackColor={{ false: '#cbd5e1', true: '#ea580c' }}
          thumbColor="#ffffff"
        />
      </View>

      <View style={styles.cardDivider} />

      {/* Row 4: Premium Saffron Theme */}
      <View style={styles.settingsSwitchRow}>
        <View style={styles.settingsSwitchInfo}>
          <Text style={styles.settingsSwitchLabel}>{t('Devotional Gold Interface')}</Text>
          <Text style={styles.settingsSwitchDesc}>{t('Apply deep saffron, gold highlights, and premium borders.')}</Text>
        </View>
        <Switch
          value={prefGoldTheme}
          onValueChange={setPrefGoldTheme}
          trackColor={{ false: '#cbd5e1', true: '#ea580c' }}
          thumbColor="#ffffff"
        />
      </View>

      <TouchableOpacity
        style={styles.primaryActionButton}
        activeOpacity={0.8}
        onPress={() => triggerSaveMessage(t('Auspicious settings saved successfully!'))}
      >
        <Text style={styles.primaryActionButtonText}>{t('APPLY CHANGES')}</Text>
      </TouchableOpacity>
    </View>
  );

  // 3. My Orders / Bookings Component
  const getOrderItemsTitle = (orderItems: any[]) => {
    if (!orderItems || orderItems.length === 0) return t('Divine Offering');
    const metadata: Record<string, string> = {
      '1': 'Ganesh Puja Special',
      '2': 'Laxmi Puja Special',
      '3': 'Shiv Puja Special',
      '4': 'Hanuman Puja Special',
      '5': 'Kedarnath Puja Special',
      '6': 'Tirupati Puja Special',
      '7': 'Shanti Path Special',
      '8': 'Navgrah Homa Special',
      'p4': 'Premium Puja Kit',
      'p5': 'Panchdhatu Ganesh Idol',
      'p6': 'Sandalwood Paste',
      'p7': 'Bhagavad Gita Pocket',
      'p8': 'Organic Incense Sticks',
      'rec_1': 'Panch Mewa Prasad Box',
      'rec_2': 'Sandalwood Chandan Paste',
      'rec_3': 'Sacred Rudraksha Mala',
      'add_1': 'Aromatic Kapur Tablets'
    };
    return orderItems.map((item: any) => {
      const name = metadata[item.item_id] || itemNamesMap[item.item_id] || item.item_id;
      return t(name);
    }).join(' + ');
  };

  const getPujaStepIndex = (status: string) => {
    switch (status) {
      case 'Pending': return 0;
      case 'Confirmed': return 1;
      case 'Processing': return 2;
      case 'Shipped':
      case 'Delivered':
      case 'Completed': return 3;
      default: return 0;
    }
  };

  // 3. My Orders / Bookings Component
  const renderOrdersView = () => {
    if (loadingOrders) {
      return (
        <View style={[styles.contentCard, { minHeight: 200, justifyContent: 'center', alignItems: 'center' }]}>
          <ActivityIndicator size="large" color="#ea580c" />
          <Text style={{ marginTop: 12, fontFamily: 'Outfit-Regular', color: '#64748b' }}>{t('Loading your sacred history...')}</Text>
        </View>
      );
    }

    if (!user) {
      return (
        <View style={[styles.contentCard, { paddingVertical: 40, alignItems: 'center' }]}>
          <Ionicons name="lock-closed-outline" size={48} color="#ea580c" style={{ marginBottom: 12 }} />
          <Text style={{ fontFamily: 'Outfit-Bold', fontSize: 16, color: '#1e293b', marginBottom: 8 }}>{t('Authentication Required')}</Text>
          <Text style={{ fontFamily: 'Outfit-Regular', fontSize: 13, color: '#64748b', textAlign: 'center', marginHorizontal: 24, marginBottom: 20 }}>
            {t('Please login to track your active Puja milestones and product shipments.')}
          </Text>
          <TouchableOpacity
            style={styles.primaryActionButton}
            onPress={() => router.push('/login')}
          >
            <Text style={styles.primaryActionButtonText}>{t('LOGIN NOW')}</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Filter orders
    const activePujas = orders.filter(o => 
      (o.order_type === 'puja' || o.order_type === 'mixed') && 
      o.order_status !== 'Completed' && 
      o.order_status !== 'Cancelled'
    );

    const pastPujas = orders.filter(o => 
      (o.order_type === 'puja' || o.order_type === 'mixed') && 
      (o.order_status === 'Completed' || o.order_status === 'Cancelled')
    );

    const storeShipments = orders.filter(o => 
      o.order_type === 'product' || o.order_type === 'mixed'
    );

    return (
      <View style={styles.contentCard}>
        {/* Category Tabs */}
        <View style={styles.tabsRow}>
          <TouchableOpacity
            style={[styles.tabBtn, ordersTab === 'active' && styles.tabBtnActive]}
            onPress={() => setOrdersTab('active')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabBtnText, ordersTab === 'active' && styles.tabBtnTextActive]}>{t('ACTIVE PUJAS')} ({activePujas.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, ordersTab === 'past' && styles.tabBtnActive]}
            onPress={() => setOrdersTab('past')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabBtnText, ordersTab === 'past' && styles.tabBtnTextActive]}>{t('PAST PUJAS')} ({pastPujas.length})</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, ordersTab === 'store' && styles.tabBtnActive]}
            onPress={() => setOrdersTab('store')}
            activeOpacity={0.8}
          >
            <Text style={[styles.tabBtnText, ordersTab === 'store' && styles.tabBtnTextActive]}>{t('SHIPMENTS')} ({storeShipments.length})</Text>
          </TouchableOpacity>
        </View>

        {/* Conditionally render based on active tab */}
        {ordersTab === 'active' && (
          <View style={styles.ordersListContainer}>
            {activePujas.length === 0 ? (
              <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                <Ionicons name="flower-outline" size={44} color="#cbd5e1" style={{ marginBottom: 8 }} />
                <Text style={{ fontFamily: 'Outfit-Medium', fontSize: 14, color: '#64748b', textAlign: 'center' }}>
                  {t('No active pujas booked yet. Explore our sacred rituals to invoke divine blessings!')}
                </Text>
              </View>
            ) : (
              activePujas.map((order) => {
                const pujaDetail = order.puja_booking_details?.[0] || {};
                const currentStep = getPujaStepIndex(order.order_status);
                const isPerforming = order.order_status === 'Processing';

                return (
                  <View key={order.id} style={styles.bookingStatusCard}>
                    <View style={styles.bookingHeader}>
                      {isPerforming ? (
                        <View style={styles.liveIndicator}>
                          <View style={styles.liveDot} />
                          <Text style={styles.liveIndicatorText}>{t('LIVE NOW')}</Text>
                        </View>
                      ) : (
                        <View style={{ backgroundColor: '#fff7ed', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 }}>
                          <Text style={{ fontSize: 10, fontFamily: 'Outfit-Bold', color: '#ea580c' }}>{t(order.order_status.toUpperCase())}</Text>
                        </View>
                      )}
                      <Text style={styles.bookingDateText}>
                        {pujaDetail.preferred_date ? `${pujaDetail.preferred_date} • ${pujaDetail.preferred_time || ''}` : t('Date TBD')}
                      </Text>
                    </View>

                    <Text style={styles.bookingTitleText}>{getOrderItemsTitle(order.order_items)}</Text>
                    <Text style={styles.bookingTempleText}>{getBookingTempleName(order.order_items)}</Text>
                    <Text style={styles.bookingPanditText}>
                      {t('Devotee')}: {pujaDetail.devotee_name || t('Guest')} {pujaDetail.gotra ? `• Gotra: ${pujaDetail.gotra}` : ''}
                    </Text>

                    <View style={styles.bookingDivider} />

                    {/* Stepper Progress */}
                    <Text style={styles.stepperHeader}>{t('PUJA RITUAL MILESTONES')}</Text>
                    <View style={styles.stepperWrapper}>
                      <View style={styles.stepperLine} />
                      
                      {/* Step 1: Sankalp Registered */}
                      <View style={styles.stepItem}>
                        <View style={[styles.stepCircle, styles.stepCircleActive]}>
                          <Ionicons name="checkmark" size={12} color="#ffffff" />
                        </View>
                        <Text style={styles.stepLabelActive}>{t('Sankalp Registered')}</Text>
                      </View>

                      {/* Step 2: Samagri Gathered */}
                      <View style={styles.stepItem}>
                        <View style={[styles.stepCircle, currentStep >= 1 ? styles.stepCircleActive : styles.stepCircleGray]}>
                          {currentStep >= 1 ? <Ionicons name="checkmark" size={12} color="#ffffff" /> : <View style={styles.stepCircleInnerGray} />}
                        </View>
                        <Text style={currentStep >= 1 ? styles.stepLabelActive : styles.stepLabelGray}>{t('Auspicious Samagri Gathered')}</Text>
                      </View>

                      {/* Step 3: Gotra Chanting */}
                      <View style={styles.stepItem}>
                        <View style={[
                          styles.stepCircle,
                          currentStep >= 2 ? styles.stepCircleActive : (currentStep === 1 ? styles.stepCirclePending : styles.stepCircleGray)
                        ]}>
                          {currentStep >= 2 ? (
                            <Ionicons name="checkmark" size={12} color="#ffffff" />
                          ) : (
                            currentStep === 1 ? <View style={styles.stepPulseDot} /> : <View style={styles.stepCircleInnerGray} />
                          )}
                        </View>
                        <Text style={currentStep >= 2 ? styles.stepLabelActive : (currentStep === 1 ? styles.stepLabelPending : styles.stepLabelGray)}>
                          {getGotraChantingLabel()}
                        </Text>
                      </View>

                      {/* Step 4: Sacred Prasad Dispatched */}
                      <View style={styles.stepItem}>
                        <View style={[
                          styles.stepCircle,
                          currentStep >= 3 ? styles.stepCircleActive : (currentStep === 2 ? styles.stepCirclePending : styles.stepCircleGray)
                        ]}>
                          {currentStep >= 3 ? (
                            <Ionicons name="checkmark" size={12} color="#ffffff" />
                          ) : (
                            currentStep === 2 ? <View style={styles.stepPulseDot} /> : <View style={styles.stepCircleInnerGray} />
                          )}
                        </View>
                        <Text style={currentStep >= 3 ? styles.stepLabelActive : (currentStep === 2 ? styles.stepLabelPending : styles.stepLabelGray)}>
                          {t('Sacred Prasad Dispatched')}
                        </Text>
                      </View>
                    </View>

                    {/* Live Stream Trigger Button or Play Consecrated Video */}
                    {pujaDetail.puja_video_url ? (
                      <TouchableOpacity
                        style={[styles.liveStreamButton, { backgroundColor: '#ea580c' }]}
                        activeOpacity={0.8}
                        onPress={() => setPreviewVideoUrl(pujaDetail.puja_video_url)}
                      >
                        <Ionicons name="play-circle" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                        <Text style={styles.liveStreamButtonText}>
                          {t('WATCH PERSONAL RITUAL RECORDING')}
                        </Text>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        style={[styles.liveStreamButton, !isPerforming && { backgroundColor: '#cbd5e1' }]}
                        activeOpacity={0.85}
                        disabled={!isPerforming}
                        onPress={() => Alert.alert(
                          t('Live Stream'),
                          t('Connecting you to Varanasi Brahma Muhurta desk zoom server. Acharya will chant your Sankalp Gotra in 1 minute...')
                        )}
                      >
                        <Ionicons name="videocam" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                        <Text style={styles.liveStreamButtonText}>
                          {isPerforming ? t('JOIN SECURE LIVE STREAM') : t('LIVE STREAM WILL ACTIVATE DURING RITUAL')}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}

        {ordersTab === 'past' && (
          <View style={styles.ordersListContainer}>
            {pastPujas.length === 0 ? (
              <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                <Ionicons name="checkmark-done" size={44} color="#cbd5e1" style={{ marginBottom: 8 }} />
                <Text style={{ fontFamily: 'Outfit-Medium', fontSize: 14, color: '#64748b', textAlign: 'center' }}>
                  {t('No past completed pujas found. Begin your spiritual journey today.')}
                </Text>
              </View>
            ) : (
              pastPujas.map((order) => {
                const pujaDetail = order.puja_booking_details?.[0] || {};
                const isCancelled = order.order_status === 'Cancelled';

                return (
                  <View key={order.id} style={styles.bookingStatusCard}>
                    <View style={styles.bookingHeader}>
                      <View style={[styles.completedBadge, isCancelled && { backgroundColor: '#fef2f2' }]}>
                        <Ionicons 
                          name={isCancelled ? "close-circle" : "checkmark-done"} 
                          size={12} 
                          color={isCancelled ? "#ef4444" : "#059669"} 
                          style={{ marginRight: 4 }} 
                        />
                        <Text style={[styles.completedBadgeText, isCancelled && { color: '#ef4444' }]}>
                          {t(order.order_status.toUpperCase())}
                        </Text>
                      </View>
                      <Text style={styles.bookingDateText}>
                        {order.created_at ? new Date(order.created_at).toLocaleDateString() : ''}
                      </Text>
                    </View>

                    <Text style={styles.bookingTitleText}>{getOrderItemsTitle(order.order_items)}</Text>
                    <Text style={styles.bookingTempleText}>{getBookingTempleName(order.order_items)}</Text>
                    <Text style={styles.bookingPanditText}>
                      {t('Devotee')}: {pujaDetail.devotee_name || t('Guest')} {pujaDetail.gotra ? `• Gotra: ${pujaDetail.gotra}` : ''}
                    </Text>

                    <View style={styles.bookingDivider} />

                    <Text style={{ fontSize: 12, fontFamily: 'Outfit-Regular', color: isCancelled ? '#ef4444' : '#059669' }}>
                      <Ionicons name={isCancelled ? "close" : "cube"} size={13} />{' '}
                      {isCancelled 
                        ? t('This sacred booking has been cancelled and refunded.') 
                        : t('Prasad Box Delivered successfully via SpeedPost.')}
                    </Text>

                    {/* Video Record Trigger */}
                    {!isCancelled && (
                      <TouchableOpacity
                        style={styles.recordingButton}
                        activeOpacity={0.8}
                        onPress={() => {
                          if (pujaDetail.puja_video_url) {
                            setPreviewVideoUrl(pujaDetail.puja_video_url);
                          } else {
                            Alert.alert(
                              t('Play Recording'),
                              t('Your sacred Puja Sankalp has been performed. Acharya is editing your personal recording and uploading it. Please check back in 1-2 hours!')
                            );
                          }
                        }}
                      >
                        <Ionicons name="play-circle" size={18} color="#ea580c" style={{ marginRight: 6 }} />
                        <Text style={styles.recordingButtonText}>
                          {pujaDetail.puja_video_url ? t('WATCH PERSONAL RITUAL RECORDING') : t('RECORDING PROCESSING...')}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}

        {ordersTab === 'store' && (
          <View style={styles.ordersListContainer}>
            {storeShipments.length === 0 ? (
              <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                <Ionicons name="cube-outline" size={44} color="#cbd5e1" style={{ marginBottom: 8 }} />
                <Text style={{ fontFamily: 'Outfit-Medium', fontSize: 14, color: '#64748b', textAlign: 'center' }}>
                  {t('No shipments in transit. Shop authentic pujas samagri, brass idols, and spiritual books.')}
                </Text>
              </View>
            ) : (
              storeShipments.map((order) => {
                const shipping = order.shipping_addresses?.[0] || {};
                const isCancelled = order.order_status === 'Cancelled';
                
                // shipment status tracking indicators
                const isPacked = ['Confirmed', 'Processing', 'Shipped', 'Delivered', 'Completed'].includes(order.order_status);
                const isInTransit = ['Shipped', 'Delivered', 'Completed'].includes(order.order_status);
                const isDelivered = ['Delivered', 'Completed'].includes(order.order_status);

                return (
                  <View key={order.id} style={styles.bookingStatusCard}>
                    <View style={styles.bookingHeader}>
                      <View style={[styles.shippedBadge, isCancelled && { backgroundColor: '#fef2f2' }]}>
                        <Ionicons 
                          name={isCancelled ? "close-circle" : "cube"} 
                          size={12} 
                          color={isCancelled ? "#ef4444" : "#2563eb"} 
                          style={{ marginRight: 4 }} 
                        />
                        <Text style={[styles.shippedBadgeText, isCancelled && { color: '#ef4444' }]}>
                          {t(order.order_status === 'Shipped' ? 'IN TRANSIT' : order.order_status.toUpperCase())}
                        </Text>
                      </View>
                      <Text style={styles.bookingDateText}>
                        {order.created_at ? new Date(order.created_at).toLocaleDateString() : ''}
                      </Text>
                    </View>

                    <Text style={styles.bookingTitleText}>{getOrderItemsTitle(order.order_items)}</Text>
                    <Text style={styles.bookingTempleText}>{t('Order ID')}: MP-ORDER-{order.id.substring(0, 8).toUpperCase()}</Text>
                    <Text style={styles.bookingPanditText}>
                      {t('Shipped to')}: {shipping.full_name || user.name}, {shipping.city || ''}, {shipping.state || ''} {shipping.pincode || ''}
                    </Text>

                    {!isCancelled && (
                      <>
                        <View style={styles.bookingDivider} />

                        <View style={styles.shipTrackRow}>
                          {/* Step 1: Packed */}
                          <View style={styles.shipTrackStep}>
                            {isPacked ? (
                              <Ionicons name="checkmark-circle" size={18} color="#059669" />
                            ) : (
                              <Ionicons name="ellipse-outline" size={18} color="#64748b" />
                            )}
                            <Text style={isPacked ? styles.shipTrackStepText : styles.shipTrackStepTextDisabled}>{t('Packed')}</Text>
                          </View>
                          
                          <Ionicons name="arrow-forward" size={14} color="#94a3b8" />
                          
                          {/* Step 2: In Transit */}
                          <View style={styles.shipTrackStep}>
                            {isDelivered ? (
                              <Ionicons name="checkmark-circle" size={18} color="#059669" />
                            ) : isInTransit ? (
                              <View style={styles.blueIndicatorCircle}>
                                <Ionicons name="sync" size={12} color="#ffffff" />
                              </View>
                            ) : (
                              <Ionicons name="ellipse-outline" size={18} color="#64748b" />
                            )}
                            <Text style={isInTransit ? styles.shipTrackStepTextActive : styles.shipTrackStepTextDisabled}>{t('In Transit')}</Text>
                          </View>
                          
                          <Ionicons name="arrow-forward" size={14} color="#94a3b8" />
                          
                          {/* Step 3: Delivered */}
                          <View style={styles.shipTrackStep}>
                            {isDelivered ? (
                              <Ionicons name="checkmark-circle" size={18} color="#059669" />
                            ) : (
                              <Ionicons name="ellipse-outline" size={18} color="#64748b" />
                            )}
                            <Text style={isDelivered ? styles.shipTrackStepText : styles.shipTrackStepTextDisabled}>{t('Delivery')}</Text>
                          </View>
                        </View>
                      </>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}
      </View>
    );
  };

  // 4. Wallet Preferences Component
  const renderWalletView = () => (
    <View style={[styles.contentCard, { overflow: 'hidden' }]}>
      {/* Wallet Balance Gold Gilt Card */}
      <LinearGradient
        colors={['#f59e0b', '#d97706', '#92400e']}
        style={styles.walletGoldCard}
      >
        <View style={styles.walletHeaderRow}>
          <Text style={styles.walletCardName}>{t('Mantra Devotional Wallet')}</Text>
          <MaterialCommunityIcons name="wallet-giftcard" size={28} color="#ffffff" />
        </View>
        
        <View style={styles.walletBodyRow}>
          <View style={styles.walletBalanceColumn}>
            <Text style={styles.walletLabel}>{t('DIVINE COIN BALANCE')}</Text>
            <View style={styles.coinsRow}>
              <Ionicons name="radio-button-on" size={28} color="#ffd60a" style={{ marginRight: 8 }} />
              <Text style={styles.walletValText}>{walletCoins} {t('Coins')}</Text>
            </View>
          </View>
        </View>
        
        <Text style={styles.walletDisclaimerText}>
          {t('Use your blessed coins to claim free prasads or unlock priority muhurtas.')}
        </Text>
      </LinearGradient>

      {/* Quick recharging */}
      <Text style={styles.subSectionTitle}>{t('Obtain Divine Coins')}</Text>
      <Text style={styles.sectionDescription}>
        {t('Instantly load auspicious count coins to your profile wallet.')}
      </Text>

      <View style={styles.rechargePillsGrid}>
        {[
          { amt: 108, name: 'Saraswati Pack' },
          { amt: 251, name: 'Ganesha Pack' },
          { amt: 501, name: 'Mahadev Pack' },
          { amt: 1008, name: 'Laxmi Pack' }
        ].map((pack) => (
          <TouchableOpacity
            key={pack.amt}
            style={styles.rechargeCellBtn}
            onPress={() => simulateRecharge(pack.amt)}
            activeOpacity={0.8}
            disabled={true}
          >
            <Text style={styles.rechargeCellAmtText}>+{pack.amt}</Text>
            <Text style={styles.rechargeCellNameText}>{t(pack.name)}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.cardDivider} />

      {/* Interactive scratch card */}
      <Text style={styles.subSectionTitle}>{t('Daily Devotional Rewards')}</Text>
      <Text style={styles.sectionDescription}>
        {t('Scratch your daily sacred shield to unlock free Vedic coins and discounts!')}
      </Text>

      <View style={styles.scratchAreaWrapper}>
        {!isScratched ? (
          <TouchableOpacity
            style={styles.scratchShieldCover}
            activeOpacity={0.9}
            onPress={triggerScratch}
            disabled={true}
          >
            <LinearGradient
              colors={['#ea580c', '#f97316', '#ffedd5']}
              style={StyleSheet.absoluteFillObject}
            />
            <MaterialCommunityIcons name="shield-star" size={54} color="#ffffff" />
            <Text style={styles.scratchPromptText}>{t('TAP SHIELD TO SCRATCH')}</Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.scratchRevealedBox}>
            <Ionicons name="sparkles" size={44} color="#ffd60a" style={{ marginBottom: 8 }} />
            <Text style={styles.revealTitleText}>{t('Blessed! You Won')}</Text>
            <Text style={styles.revealRewardAmt}>+{scratchReward} {t('Coins')}</Text>
            <Text style={styles.revealCoinsAddedText}>{t('Coins added successfully to your wallet')}</Text>
          </View>
        )}
      </View>

      {/* Coming Soon Overlay */}
      <View style={styles.comingSoonOverlay}>
        <View style={styles.comingSoonBadge}>
          <MaterialCommunityIcons name="clock-fast" size={38} color="#ea580c" />
          <Text style={styles.comingSoonTitle}>{t('Coming Soon')}</Text>
          <Text style={styles.comingSoonDesc}>
            {t('We are currently setting up secure payment gateways. The Devotional Wallet feature will be activated shortly!')}
          </Text>
        </View>
      </View>
    </View>
  );

  // 5. Language Select Grid Component
  const renderLanguageView = () => (
    <View style={styles.contentCard}>
      <Text style={styles.subSectionTitle}>{t('Select App Language')}</Text>
      <Text style={styles.sectionDescription}>
        {t('Enjoy reading texts, mantras, and stotrams in your preferred ancestral tongue.')}
      </Text>

      <View style={styles.languageListContainer}>
        {languagesList.map((lang) => {
          const isActive = locale === lang.name;
          return (
            <TouchableOpacity
              key={lang.name}
              style={[styles.languagePillCard, isActive && styles.languagePillCardActive]}
              onPress={() => setLocale(lang.name as any)}
              activeOpacity={0.85}
            >
              <View style={styles.languagePillBody}>
                <Text style={[styles.langMainText, isActive && styles.langMainTextActive]}>
                  {t(lang.name)}
                </Text>
                <Text style={styles.langNativeText}>{lang.native}</Text>
              </View>

              <View style={[styles.langRadioCircle, isActive && styles.langRadioCircleActive]}>
                {isActive && <View style={styles.langRadioDot} />}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity
        style={styles.primaryActionButton}
        activeOpacity={0.8}
        onPress={() => triggerSaveMessage(t('App language switched to') + ' ' + t(locale) + '!')}
      >
        <Text style={styles.primaryActionButtonText}>{t('CONFIRM LANGUAGE')}</Text>
      </TouchableOpacity>
    </View>
  );

  // 6. Help & Support Accordion Component
  const renderSupportView = () => (
    <View style={styles.contentCard}>
      <Text style={styles.subSectionTitle}>{t('Vedic Support Center')}</Text>
      <Text style={styles.sectionDescription}>
        {t('Connect directly with our temple coordinators and Vedic acharyas.')}
      </Text>

      {/* Specialized support triggers */}
      <View style={styles.supportTriggersRow}>
        <TouchableOpacity
          style={styles.supportBoxBtnGreen}
          activeOpacity={0.8}
          onPress={() => Alert.alert(t('Acharya Chat'), t('Connecting with our Varanasi temple desk via secure chat...'))}
        >
          <Ionicons name="logo-whatsapp" size={24} color="#ffffff" style={{ marginBottom: 6 }} />
          <Text style={styles.supportBoxBtnText}>{t('Varanasi WhatsApp')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.supportBoxBtnSaffron}
          activeOpacity={0.8}
          onPress={() => Alert.alert(t('Call Desk'), t('Connecting to Haridwar head office priest toll-free desk...'))}
        >
          <Ionicons name="call" size={24} color="#ffffff" style={{ marginBottom: 6 }} />
          <Text style={styles.supportBoxBtnText}>{t('Call Temple Desk')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.cardDivider} />

      {/* Frequently Asked Questions */}
      <Text style={styles.subSectionTitle}>{t('Frequently Asked Questions')}</Text>
      <View style={styles.faqListWrapper}>
        {faqs.map((faq, index) => {
          const isFaqExpanded = expandedFaq === index;
          return (
            <View key={index} style={styles.faqCard}>
              <TouchableOpacity
                style={styles.faqHeader}
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                  setExpandedFaq(isFaqExpanded ? null : index);
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.faqHeaderQuestionText}>{t(faq.q)}</Text>
                <Ionicons
                  name={isFaqExpanded ? "chevron-up" : "chevron-down"}
                  size={16}
                  color="#64748b"
                />
              </TouchableOpacity>
              {isFaqExpanded && (
                <View style={styles.faqBody}>
                  <Text style={styles.faqBodyText}>{t(faq.a)}</Text>
                </View>
              )}
            </View>
          );
        })}
      </View>

      <View style={styles.cardDivider} />

      {/* Feedback Form */}
      <Text style={styles.subSectionTitle}>{t('Share Your Holy Feedback')}</Text>
      <Text style={styles.sectionDescription}>
        {t('Let us know how your virtual puja went. Your feedback helps our pandits improve offerings.')}
      </Text>

      {/* Rating stars */}
      <View style={styles.ratingStarsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => setFeedbackRating(star)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={star <= feedbackRating ? "star" : "star-outline"}
              size={32}
              color="#ea580c"
              style={{ marginRight: 6 }}
            />
          </TouchableOpacity>
        ))}
      </View>

      <TextInput
        style={styles.feedbackInput}
        value={supportFeedback}
        onChangeText={setSupportFeedback}
        multiline
        placeholder={t("Write about your spiritual experience...")}
        placeholderTextColor="#94a3b8"
      />

      <TouchableOpacity
        style={styles.primaryActionButton}
        activeOpacity={0.8}
        onPress={() => {
          if (!supportFeedback.trim()) return;
          setSupportFeedback('');
          triggerSaveMessage(t('Blessed feedback submitted successfully!'));
        }}
      >
        <Text style={styles.primaryActionButtonText}>{t('SUBMIT FEEDBACK')}</Text>
      </TouchableOpacity>
    </View>
  );

  // 7. About Us Profile Component
  const renderAboutView = () => (
    <View style={styles.contentCard}>
      <Text style={styles.subSectionTitle}>{t('Our Devotional Mission')}</Text>
      
      <View style={styles.aboutAvatarRow}>
        <View style={styles.logoCircle}>
          <Text style={styles.logoCircleText}>ॐ</Text>
        </View>
        <View style={styles.logoInfo}>
          <Text style={styles.logoTitle}>{t('appName')}</Text>
          <Text style={styles.logoTagline}>{t('Authorized Vedic Sanctum')}</Text>
        </View>
      </View>

      <Text style={styles.aboutBodyParagraph}>
        {t('aboutMissionParagraph1')}
      </Text>

      <Text style={styles.aboutBodyParagraph}>
        {t('aboutMissionParagraph2')}
      </Text>

      <View style={styles.cardDivider} />

      {/* Certifications list */}
      <Text style={styles.subSectionTitle}>{t('Temple trust associations')}</Text>
      <View style={styles.certListContainer}>
        {[
          { trust: 'Kashi Vishwanath Mandir Trust Affiliate', auth: 'Govt. Priest Panel, Varanasi' },
          { trust: 'Ayodhya Hanuman Garhi Marg Priest Panel', auth: 'Temple Vendor Auth, UP' },
          { trust: 'Siddhabali Hanuman Shrine Priest Affiliation', auth: 'UK Shrine Consecrations' }
        ].map((item, index) => (
          <View key={index} style={styles.certItemCard}>
            <Ionicons name="ribbon" size={22} color="#ea580c" style={{ marginRight: 10 }} />
            <View style={styles.certItemBody}>
              <Text style={styles.certTrustText}>{t(item.trust)}</Text>
              <Text style={styles.certAuthText}>{t(item.auth)}</Text>
            </View>
          </View>
        ))}
      </View>

      <View style={styles.cardDivider} />

      {/* Temple offices coordinates */}
      <Text style={styles.subSectionTitle}>{t('Our Spiritual Headquarters')}</Text>
      <View style={styles.headquartersCard}>
        <View style={styles.hqAddressItem}>
          <Ionicons name="location" size={16} color="#ea580c" style={{ marginRight: 6 }} />
          <View style={styles.hqTextBody}>
            <Text style={styles.hqTitleText}>{t('VARANASI ASHRAM')}</Text>
            <Text style={styles.hqDescText}>{t('Varanasi Ashram Address')}</Text>
          </View>
        </View>

        <View style={styles.hqAddressItem}>
          <Ionicons name="location" size={16} color="#ea580c" style={{ marginRight: 6 }} />
          <View style={styles.hqTextBody}>
            <Text style={styles.hqTitleText}>{t('HARIDWAR HEAD OFFICE')}</Text>
            <Text style={styles.hqDescText}>{t('Haridwar Head Office Address')}</Text>
          </View>
        </View>
      </View>
    </View>
  );

  // 8. Logout Confirm Gate Component
  const renderLogoutView = () => (
    <View style={styles.logoutGateCard}>
      <View style={styles.logoutIconRing}>
        <Ionicons name="log-out" size={38} color="#ef4444" />
      </View>

      <Text style={styles.logoutHeaderTitle}>{t('End Devotional Session?')}</Text>
      <Text style={styles.logoutDescription}>
        {t('logoutConfirmText')}
      </Text>

      <TouchableOpacity
        style={styles.confirmLogoutBtn}
        activeOpacity={0.8}
        onPress={async () => {
          try {
            await safeStorage.removeItem('user_session');
          } catch (err) {
            console.error('Error clearing user session:', err);
          }
          Alert.alert(t('Signed Out'), t('You have been successfully signed out from your account.'));
          router.replace('/login');
        }}
      >
        <Text style={styles.confirmLogoutBtnText}>{t('SIGN OUT OF ACCOUNT')}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.cancelLogoutBtn}
        activeOpacity={0.8}
        onPress={() => router.back()}
      >
        <Text style={styles.cancelLogoutBtnText}>{t('CANCEL & STAY SIGNED IN')}</Text>
      </TouchableOpacity>
    </View>
  );

  // Selector logic
  const renderContentBody = () => {
    switch (type) {
      case 'my_profile': return renderProfileView();
      case 'settings': return renderSettingsView();
      case 'my_orders': return renderOrdersView();
      case 'my_wallet': return renderWalletView();
      case 'language': return renderLanguageView();
      case 'help_&_support': return renderSupportView();
      case 'about_us': return renderAboutView();
      case 'logout': return renderLogoutView();
      default: return renderProfileView();
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" />

      {/* Dynamic Header */}
      <View style={[styles.headerBar, { paddingTop: insets.top || 12 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color="#1e293b" />
          </TouchableOpacity>

          <Text style={styles.headerTitleText}>{getHeaderTitle()}</Text>

          {/* Placeholders to center title */}
          <View style={{ width: 38 }} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {/* Dynamic Toast / Save Message Ribbon */}
        {saveMessage && (
          <View style={styles.toastSavePill}>
            <Ionicons name="checkmark-circle" size={16} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.toastSaveText}>{saveMessage}</Text>
          </View>
        )}

        {renderContentBody()}
      </ScrollView>

      {/* Internal High-Fidelity Video Preview Player Overlay */}
      {previewVideoUrl && (
        <VideoPreviewModal
          url={previewVideoUrl}
          onClose={() => setPreviewVideoUrl(null)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerBar: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 3,
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
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  toastSavePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
    alignSelf: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  toastSaveText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontFamily: 'Outfit-Bold',
  },
  contentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 1,
  },
  subSectionTitle: {
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
    color: '#1e293b',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  sectionDescription: {
    fontSize: 12,
    fontFamily: 'Outfit-Medium',
    color: '#64748b',
    lineHeight: 18,
    marginBottom: 16,
  },
  profileAvatarHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  bigAvatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ea580c',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffedd5',
    marginBottom: 10,
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 37,
  },
  bigAvatarText: {
    color: '#ffffff',
    fontSize: 28,
    fontFamily: 'Outfit-ExtraBold',
  },
  editAvatarBtn: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  editAvatarText: {
    color: '#ffffff',
    fontSize: 10,
    fontFamily: 'Outfit-Bold',
  },
  inputLabel: {
    fontSize: 10,
    fontFamily: 'Outfit-Bold',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  profileInput: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    fontSize: 13.5,
    fontFamily: 'Outfit-Medium',
    color: '#1e293b',
    marginBottom: 16,
    backgroundColor: '#f8fafc',
  },
  inputSplitRow: {
    flexDirection: 'row',
    gap: 12,
  },
  splitInputBox: {
    flex: 1,
  },
  primaryActionButton: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ea580c',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryActionButtonText: {
    color: '#ffffff',
    fontSize: 13.5,
    fontFamily: 'Outfit-Bold',
    letterSpacing: 0.5,
  },
  cardDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 24,
  },
  familyItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ffedd5',
    padding: 12,
    marginBottom: 10,
  },
  familyIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ffedd5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  familyItemBody: {
    flex: 1,
  },
  familyNameText: {
    fontSize: 13,
    fontFamily: 'Outfit-Bold',
    color: '#1e293b',
  },
  familyRelationText: {
    fontSize: 11,
    fontFamily: 'Outfit-Medium',
    color: '#ea580c',
    marginTop: 1,
  },
  familyRemoveBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  addFamilyFormCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    padding: 16,
    marginTop: 12,
  },
  addFamilyFormTitle: {
    fontSize: 12.5,
    fontFamily: 'Outfit-Bold',
    color: '#1e293b',
    marginBottom: 12,
  },
  familyFormInput: {
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 12,
    fontSize: 13,
    fontFamily: 'Outfit-Medium',
    color: '#1e293b',
    backgroundColor: '#ffffff',
    marginBottom: 12,
  },
  relationSelectRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  relationPill: {
    flex: 1,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  relationPillActive: {
    borderColor: '#ea580c',
    backgroundColor: '#fff7ed',
  },
  relationPillText: {
    fontSize: 10.5,
    fontFamily: 'Outfit-Bold',
    color: '#64748b',
  },
  relationPillTextActive: {
    color: '#ea580c',
  },
  addMemberSubmitBtn: {
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginTop: 10,
  },
  addMemberSubmitBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontFamily: 'Outfit-Bold',
    letterSpacing: 0.2,
  },
  settingsSwitchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  settingsSwitchInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingsSwitchLabel: {
    fontSize: 13.5,
    fontFamily: 'Outfit-Bold',
    color: '#1e293b',
  },
  settingsSwitchDesc: {
    fontSize: 11,
    fontFamily: 'Outfit-Medium',
    color: '#64748b',
    lineHeight: 15,
    marginTop: 2,
  },
  tabsRow: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  tabBtn: {
    flex: 1,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 10.5,
    fontFamily: 'Outfit-Bold',
    color: '#64748b',
  },
  tabBtnTextActive: {
    color: '#ea580c',
  },
  ordersListContainer: {
    gap: 16,
  },
  bookingStatusCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.01,
    shadowRadius: 6,
    elevation: 1,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ef4444',
    marginRight: 4,
  },
  liveIndicatorText: {
    color: '#ef4444',
    fontSize: 9,
    fontFamily: 'Outfit-Bold',
    letterSpacing: 0.2,
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#d1fae5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  completedBadgeText: {
    color: '#059669',
    fontSize: 9,
    fontFamily: 'Outfit-Bold',
  },
  shippedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dbeafe',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  shippedBadgeText: {
    color: '#2563eb',
    fontSize: 9,
    fontFamily: 'Outfit-Bold',
  },
  bookingDateText: {
    fontSize: 11,
    fontFamily: 'Outfit-Bold',
    color: '#64748b',
  },
  bookingTitleText: {
    fontSize: 16,
    fontFamily: 'Outfit-ExtraBold',
    color: '#1e293b',
    lineHeight: 20,
    marginBottom: 4,
  },
  bookingTempleText: {
    fontSize: 12,
    fontFamily: 'Outfit-Medium',
    color: '#ea580c',
    marginBottom: 2,
  },
  bookingPanditText: {
    fontSize: 11,
    fontFamily: 'Outfit-Medium',
    color: '#64748b',
    marginBottom: 12,
  },
  bookingDivider: {
    width: '100%',
    height: 0.5,
    backgroundColor: '#cbd5e1',
    marginVertical: 14,
  },
  stepperHeader: {
    fontSize: 9.5,
    fontFamily: 'Outfit-Bold',
    color: '#94a3b8',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  stepperWrapper: {
    position: 'relative',
    paddingLeft: 20,
    gap: 16,
    marginBottom: 16,
  },
  stepperLine: {
    position: 'absolute',
    left: 7.5,
    top: 6,
    bottom: 6,
    width: 2,
    backgroundColor: '#cbd5e1',
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepCircle: {
    position: 'absolute',
    left: -20,
    width: 17,
    height: 17,
    borderRadius: 8.5,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  stepCircleActive: {
    backgroundColor: '#059669',
  },
  stepCirclePending: {
    backgroundColor: '#ea580c',
  },
  stepPulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
  },
  stepCircleGray: {
    backgroundColor: '#cbd5e1',
  },
  stepCircleInnerGray: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#94a3b8',
  },
  stepLabelActive: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    color: '#059669',
  },
  stepLabelPending: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    color: '#ea580c',
  },
  stepLabelGray: {
    fontSize: 12,
    fontFamily: 'Outfit-Medium',
    color: '#94a3b8',
  },
  liveStreamButton: {
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ea580c',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  liveStreamButtonText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontFamily: 'Outfit-Bold',
    letterSpacing: 0.2,
  },
  prasadShipText: {
    fontSize: 11.5,
    fontFamily: 'Outfit-Medium',
    color: '#059669',
    marginBottom: 12,
  },
  recordingButton: {
    height: 40,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#ffedd5',
    backgroundColor: '#fff7ed',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  recordingButtonText: {
    color: '#ea580c',
    fontSize: 11.5,
    fontFamily: 'Outfit-Bold',
  },
  shipTrackRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  shipTrackStep: {
    alignItems: 'center',
    gap: 4,
  },
  blueIndicatorCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shipTrackStepText: {
    fontSize: 11,
    fontFamily: 'Outfit-Bold',
    color: '#059669',
  },
  shipTrackStepTextActive: {
    fontSize: 11,
    fontFamily: 'Outfit-Bold',
    color: '#2563eb',
  },
  shipTrackStepTextDisabled: {
    fontSize: 11,
    fontFamily: 'Outfit-Medium',
    color: '#94a3b8',
  },
  walletGoldCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#92400e',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  walletHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  walletCardName: {
    color: '#ffffff',
    fontSize: 12.5,
    fontFamily: 'Outfit-Bold',
    letterSpacing: 0.5,
  },
  walletBodyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  walletBalanceColumn: {
    flexDirection: 'column',
  },
  walletLabel: {
    fontSize: 9.5,
    fontFamily: 'Outfit-Bold',
    color: 'rgba(255, 255, 255, 0.75)',
    letterSpacing: 0.5,
  },
  walletValText: {
    fontSize: 26,
    fontFamily: 'Outfit-ExtraBold',
    color: '#ffffff',
    marginTop: 2,
  },
  coinsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  walletCoinsText: {
    fontSize: 22,
    fontFamily: 'Outfit-ExtraBold',
    color: '#ffd60a',
  },
  walletDisclaimerText: {
    color: 'rgba(255, 255, 255, 0.65)',
    fontSize: 10,
    fontFamily: 'Outfit-Medium',
  },
  rechargePillsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  rechargeCellBtn: {
    width: (width - 72 - 30) / 2, // calculate correct width in card
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 12,
    alignItems: 'center',
  },
  rechargeCellAmtText: {
    fontSize: 16,
    fontFamily: 'Outfit-ExtraBold',
    color: '#ea580c',
  },
  rechargeCellNameText: {
    fontSize: 10,
    fontFamily: 'Outfit-Bold',
    color: '#64748b',
    marginTop: 2,
    textTransform: 'uppercase',
  },
  scratchAreaWrapper: {
    width: '100%',
    height: 180,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    position: 'relative',
    marginTop: 6,
  },
  scratchShieldCover: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  scratchPromptText: {
    color: '#ffffff',
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    letterSpacing: 0.5,
    marginTop: 10,
  },
  scratchRevealedBox: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fffbeb',
    justifyContent: 'center',
    alignItems: 'center',
  },
  revealTitleText: {
    fontSize: 13,
    fontFamily: 'Outfit-Bold',
    color: '#64748b',
  },
  revealRewardAmt: {
    fontSize: 28,
    fontFamily: 'Outfit-ExtraBold',
    color: '#ea580c',
    marginTop: 4,
  },
  revealCoinsAddedText: {
    fontSize: 10,
    fontFamily: 'Outfit-Medium',
    color: '#059669',
    marginTop: 4,
  },
  languageListContainer: {
    gap: 10,
    marginBottom: 20,
  },
  languagePillCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    padding: 14,
  },
  languagePillCardActive: {
    borderColor: '#ea580c',
    backgroundColor: '#fff7ed',
  },
  languagePillBody: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  langMainText: {
    fontSize: 14.5,
    fontFamily: 'Outfit-Bold',
    color: '#1e293b',
  },
  langMainTextActive: {
    color: '#ea580c',
  },
  langNativeText: {
    fontSize: 12,
    fontFamily: 'Outfit-Medium',
    color: '#64748b',
  },
  langRadioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
  },
  langRadioCircleActive: {
    borderColor: '#ea580c',
  },
  langRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#ea580c',
  },
  supportTriggersRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  supportBoxBtnGreen: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#25d366', // WhatsApp Brand Green
    padding: 14,
    alignItems: 'center',
    shadowColor: '#25d366',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  supportBoxBtnSaffron: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#ea580c',
    padding: 14,
    alignItems: 'center',
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 3,
  },
  supportBoxBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontFamily: 'Outfit-Bold',
  },
  faqListWrapper: {
    gap: 10,
    marginBottom: 12,
  },
  faqCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
  },
  faqHeaderQuestionText: {
    flex: 1,
    fontSize: 12.5,
    fontFamily: 'Outfit-Bold',
    color: '#1e293b',
    marginRight: 10,
  },
  faqBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 0.5,
    borderTopColor: '#f1f5f9',
    paddingTop: 10,
  },
  faqBodyText: {
    fontSize: 11.5,
    fontFamily: 'Outfit-Medium',
    color: '#64748b',
    lineHeight: 17,
  },
  ratingStarsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 12,
  },
  feedbackInput: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    padding: 14,
    fontSize: 13,
    fontFamily: 'Outfit-Medium',
    color: '#1e293b',
    minHeight: 100,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  aboutAvatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff7ed',
    borderWidth: 2,
    borderColor: '#ffedd5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoCircleText: {
    fontSize: 22,
    color: '#ea580c',
    fontWeight: '800',
  },
  logoInfo: {
    flexDirection: 'column',
  },
  logoTitle: {
    fontSize: 16,
    fontFamily: 'Outfit-ExtraBold',
    color: '#1e293b',
  },
  logoTagline: {
    fontSize: 11,
    fontFamily: 'Outfit-Bold',
    color: '#ea580c',
    marginTop: 1,
  },
  aboutBodyParagraph: {
    fontSize: 12.5,
    fontFamily: 'Outfit-Medium',
    color: '#475569',
    lineHeight: 18,
    marginBottom: 12,
  },
  certListContainer: {
    gap: 10,
  },
  certItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 12,
  },
  certItemBody: {
    flex: 1,
  },
  certTrustText: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    color: '#1e293b',
  },
  certAuthText: {
    fontSize: 10.5,
    fontFamily: 'Outfit-Medium',
    color: '#ea580c',
    marginTop: 1,
  },
  headquartersCard: {
    backgroundColor: '#fff7ed',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ffedd5',
    padding: 14,
    gap: 14,
  },
  hqAddressItem: {
    flexDirection: 'row',
  },
  hqTextBody: {
    flex: 1,
  },
  hqTitleText: {
    fontSize: 10,
    fontFamily: 'Outfit-Bold',
    color: '#ea580c',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  hqDescText: {
    fontSize: 11,
    fontFamily: 'Outfit-Medium',
    color: '#64748b',
    lineHeight: 15,
  },
  logoutGateCard: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#fee2e2',
    padding: 24,
    alignItems: 'center',
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.03,
    shadowRadius: 10,
    elevation: 2,
    marginTop: 20,
  },
  logoutIconRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fee2e2',
    marginBottom: 16,
  },
  logoutHeaderTitle: {
    fontSize: 18,
    fontFamily: 'Outfit-ExtraBold',
    color: '#1e293b',
    marginBottom: 8,
  },
  logoutDescription: {
    fontSize: 12.5,
    fontFamily: 'Outfit-Medium',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  confirmLogoutBtn: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    shadowColor: '#ef4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  confirmLogoutBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Outfit-Bold',
    letterSpacing: 0.5,
  },
  cancelLogoutBtn: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  cancelLogoutBtnText: {
    color: '#64748b',
    fontSize: 13,
    fontFamily: 'Outfit-Bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalVideoContainer: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#1e293b',
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#334155',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  modalVideoHeader: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  modalVideoTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalVideoView: {
    width: '100%',
    height: 280,
    backgroundColor: '#000000',
  },
  modalVideoFooter: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
    backgroundColor: '#0f172a',
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  modalActionBtn: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#ea580c',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  modalActionBtnSecondary: {
    backgroundColor: 'rgba(234, 88, 12, 0.1)',
    borderWidth: 1.5,
    borderColor: '#ea580c',
    shadowColor: 'transparent',
    elevation: 0,
  },
  modalActionBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontFamily: 'Outfit-Bold',
  },
  modalActionBtnTextSecondary: {
    color: '#ea580c',
    fontSize: 12.5,
    fontFamily: 'Outfit-Bold',
  },
  comingSoonOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 10,
  },
  comingSoonBadge: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
    width: '100%',
  },
  comingSoonTitle: {
    fontSize: 20,
    fontFamily: 'Outfit-Bold',
    color: '#0f172a',
    marginTop: 12,
    marginBottom: 8,
  },
  comingSoonDesc: {
    fontSize: 13,
    fontFamily: 'Outfit-Regular',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
});
