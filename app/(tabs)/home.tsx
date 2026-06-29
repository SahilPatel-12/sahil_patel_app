import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useVideoPlayer, VideoView } from 'expo-video';
import React from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  PanResponder,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  UIManager,
  LayoutAnimation
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { usePlayback } from '../../context/PlaybackContext';
import { requestAstro } from '../../services/api';
import { supabase } from '../../services/supabase';
import { safeStorage } from '../../services/storage';
import { bhajanSupabase } from '../../services/bhajanSupabase';



import DraggableCalendarButton from '../../components/DraggableCalendarButton';

const { width, height } = Dimensions.get('window');

const QUICK_ACTIONS = [
  {
    id: '4',
    title: 'Shop',
    image: require('../../assets/home_icon/home_icon1.png'),
    isBlueBg: true,
  },
  {
    id: '1',
    title: 'Kundli',
    image: require('../../assets/home_icon/kundli.png'),
  },
  {
    id: '2',
    title: 'Panchang',
    image: require('../../assets/home_icon/panchang.png'),
  },
  {
    id: '3',
    title: 'Rashi',
    image: require('../../assets/home_icon/rashi.png'),
  }
];

// Removed hardcoded ONE_RUPEE_ITEMS

interface LifeSolution {
  id: string;
  title: string;
  color: string;
  gradientColors: [string, string];
  image?: any;
  icon?: string;
  iconColor?: string;
}

const LIFE_SOLUTIONS: LifeSolution[] = [
  {
    id: '1',
    title: 'HEALTH\nPROBLEMS',
    image: require('../../assets/home_icon/health_problem.png'),
    color: '#b91c1c',
    gradientColors: ['#fee2e2', '#fecaca'],
  },
  {
    id: '2',
    title: 'WEALTH &\nMONEY',
    image: require('../../assets/home_icon/Welth_Money.png'),
    color: '#a16207',
    gradientColors: ['#fef9c3', '#fef08a'],
  },
  {
    id: '3',
    title: 'JOB &\nCAREER',
    image: require('../../assets/home_icon/Job_career.png'),
    color: '#1d4ed8',
    gradientColors: ['#dbeafe', '#bfdbfe'],
  },
  {
    id: '4',
    title: 'MARRIAGE\n& LOVE',
    image: require('../../assets/home_icon/Marriage_Love.png'),
    color: '#be185d',
    gradientColors: ['#fce7f3', '#fbcfe8'],
  },
  {
    id: '5',
    title: 'GRAH DOSH\n& SHANTI',
    image: require('../../assets/home_icon/grah_dosh.png'),
    color: '#6d28d9',
    gradientColors: ['#f3e8ff', '#e9d5ff'],
  }
];

const PROMO_BANNERS = [
  {
    id: '1',
    image: require('../../assets/banner/ChatGPT Image May 22, 2026, 06_04_52 PM.png'),
  },
  {
    id: '2',
    image: require('../../assets/banner/mantrapuja_banner.png'),
  }
];

const DATE_TABS = [
  { id: 'today', label: 'Today', subLabel: '25 May', icon: 'flash' },
  { id: 'tomorrow', label: 'Tomorrow', subLabel: '26 May', icon: 'calendar' },
  { id: 'ekadashi', label: 'Ekadashi', subLabel: '28 May', icon: 'star' },
  { id: 'saturday', label: 'Saturday', subLabel: '30 May', icon: 'shield' }
];



const SHOP_STORES = [
  {
    id: 's1',
    name: 'Pooja Kits',
    image: require('../../assets/shop/Untitled design (37) 1.png'),
    bgColor: '#ffe7db',
  },
  {
    id: 's2',
    name: 'Deity Idols',
    image: require('../../assets/shop/Untitled design (37) 7.png'),
    bgColor: '#fef3c7',
  },
  {
    id: 's3',
    name: 'Sacred Malas',
    image: require('../../assets/shop/Untitled design (37) 8.png'),
    bgColor: '#f0fdf4',
  },
  {
    id: 's4',
    name: 'Vedic Books',
    image: require('../../assets/shop/Untitled design (37) 9.png'),
    bgColor: '#e0f2fe',
  },
  {
    id: 's5',
    name: 'Incense & Oils',
    image: require('../../assets/shop/Untitled design (37) 10.png'),
    bgColor: '#f3e8ff',
  }
];

// High-Fidelity video preview modal for Devotee Reviews
function ReviewVideoModal({ url, devoteeName, pujaName, onClose }: { url: string; devoteeName: string; pujaName: string; onClose: () => void }) {
  const player = useVideoPlayer(url, (p) => {
    p.loop = false;
    p.play();
  });

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Namaste! 🌸\n\nCheck out the divine video review from ${devoteeName} for the ${pujaName} on MantraPuja app! Watch their blessed experience here:\n\n🎥 ${url}\n\nMay peace, health, and prosperity be with you! 🙏✨`,
        title: 'Blessed Devotee Video Review'
      });
    } catch (error) {
      Alert.alert('Sharing Error', 'Unable to open share menu.');
    }
  };

  return (
    <Modal visible={true} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalVideoContainer}>
          <View style={styles.modalVideoHeader}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={styles.modalVideoTitle} numberOfLines={1}>{devoteeName}</Text>
              <Text style={{ color: '#fdba74', fontSize: 10, fontFamily: 'Outfit-Bold' }} numberOfLines={1}>{pujaName}</Text>
            </View>
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
              <Text style={styles.modalActionBtnText}>Share Review</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

interface AuspiciousRecommendation {
  color: string;
  colorValue: string;
  number: string;
  mantra: string;
  daan: string;
  daanBenefit: string;
  bhajan: string;
  bhajanBhagwan: string;
}

const getZodiacSign = (dobStr: string): string => {
  if (!dobStr) return '';
  try {
    let day = 0;
    let month = 0;

    const matchYmd = dobStr.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (matchYmd) {
      month = parseInt(matchYmd[2], 10);
      day = parseInt(matchYmd[3], 10);
    } else {
      const matchDmy = dobStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
      if (matchDmy) {
        day = parseInt(matchDmy[1], 10);
        month = parseInt(matchDmy[2], 10);
      } else {
        const parsed = new Date(dobStr);
        if (!isNaN(parsed.getTime())) {
          day = parsed.getDate();
          month = parsed.getMonth() + 1;
        }
      }
    }

    if (!day || !month || month < 1 || month > 12 || day < 1 || day > 31) {
      return '';
    }

    if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return 'aries';
    if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return 'taurus';
    if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return 'gemini';
    if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return 'cancer';
    if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return 'leo';
    if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return 'virgo';
    if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return 'libra';
    if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return 'scorpio';
    if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return 'sagittarius';
    if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return 'capricorn';
    if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return 'aquarius';
    if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) return 'pisces';
  } catch (e) {
    console.warn('[Zodiac Resolving] Date parsing failed:', e);
  }
  return '';
};

const mapRashiToSign = (rashi: string): string => {
  if (!rashi) return '';
  const r = rashi.toLowerCase().trim();
  
  if (r.includes('aries')) return 'aries';
  if (r.includes('taurus')) return 'taurus';
  if (r.includes('gemini')) return 'gemini';
  if (r.includes('cancer')) return 'cancer';
  if (r.includes('leo')) return 'leo';
  if (r.includes('virgo')) return 'virgo';
  if (r.includes('libra')) return 'libra';
  if (r.includes('scorpio')) return 'scorpio';
  if (r.includes('sagittarius')) return 'sagittarius';
  if (r.includes('capricorn')) return 'capricorn';
  if (r.includes('aquarius')) return 'aquarius';
  if (r.includes('pisces')) return 'pisces';

  if (r.includes('मेष') || r.includes('mesh')) return 'aries';
  if (r.includes('वृषभ') || r.includes('vrishab') || r.includes('vrish')) return 'taurus';
  if (r.includes('मिथुन') || r.includes('mithun')) return 'gemini';
  if (r.includes('कर्क') || r.includes('kark')) return 'cancer';
  if (r.includes('सिंह') || r.includes('simha') || r.includes('singh')) return 'leo';
  if (r.includes('कन्या') || r.includes('kanya')) return 'virgo';
  if (r.includes('तुला') || r.includes('tula')) return 'libra';
  if (r.includes('वृश्चिक') || r.includes('vrishchik') || r.includes('vrischika')) return 'scorpio';
  if (r.includes('धनु') || r.includes('dhanu')) return 'sagittarius';
  if (r.includes('मकर') || r.includes('makar')) return 'capricorn';
  if (r.includes('कुंभ') || r.includes('kumbh')) return 'aquarius';
  if (r.includes('मीन') || r.includes('meen')) return 'pisces';

  return '';
};

const getWeekdayRecommendation = (dayName: string): AuspiciousRecommendation => {
  const day = (dayName || '').toLowerCase().trim();
  
  if (day.includes('mon') || day.includes('som')) {
    return {
      color: 'White',
      colorValue: '#ffffff',
      number: '2',
      mantra: 'ॐ नमः शिवाय',
      daan: 'Donate Milk or White Rice',
      daanBenefit: 'Benefits: Mental Peace & Emotional Balance',
      bhajan: 'Shiv Tandav Stotram',
      bhajanBhagwan: 'shiva'
    };
  }
  if (day.includes('tue') || day.includes('mangal')) {
    return {
      color: 'Red',
      colorValue: '#ef4444',
      number: '9',
      mantra: 'ॐ हं हनुमते नमः',
      daan: 'Donate Masoor Dal or Red Cloth',
      daanBenefit: 'Benefits: Strength, Courage & Protection',
      bhajan: 'Hanuman Chalisa',
      bhajanBhagwan: 'hanuman'
    };
  }
  if (day.includes('wed') || day.includes('budh') || day.includes('buddh')) {
    return {
      color: 'Green',
      colorValue: '#22c55e',
      number: '5',
      mantra: 'ॐ गं गणपतये नमः',
      daan: 'Donate Green Grass or Moong Dal',
      daanBenefit: 'Benefits: Wisdom, Intelligence & Wealth',
      bhajan: 'Ganesh Chalisa / Aarti',
      bhajanBhagwan: 'ganesh'
    };
  }
  if (day.includes('thu') || day.includes('guru') || day.includes('brihaspati')) {
    return {
      color: 'Yellow',
      colorValue: '#eab308',
      number: '3',
      mantra: 'ॐ बृं बृहस्पतये नमः',
      daan: 'Donate Bananas, Chana Dal or Yellow Clothes',
      daanBenefit: 'Benefits: Knowledge, Wisdom & Good Fortune',
      bhajan: 'Vishnu Sahasranamam',
      bhajanBhagwan: 'vishnu'
    };
  }
  if (day.includes('fri') || day.includes('shukra')) {
    return {
      color: 'Pink / White',
      colorValue: '#ec4899',
      number: '6',
      mantra: 'ॐ श्रीं महालक्ष्म्यै नमः',
      daan: 'Donate Sugar, Rice or White Sweets',
      daanBenefit: 'Benefits: Wealth, Prosperity & Love',
      bhajan: 'Mahalakshmi Ashtakam',
      bhajanBhagwan: 'lakshmi'
    };
  }
  if (day.includes('sat') || day.includes('shani')) {
    return {
      color: 'Black / Dark Blue',
      colorValue: '#1e3a8a',
      number: '8',
      mantra: 'ॐ şं शनैશ્चराय नमः',
      daan: 'Donate Black Sesame or Mustard Oil',
      daanBenefit: 'Benefits: Wards off negative energies & obstacles',
      bhajan: 'Shani Chalisa',
      bhajanBhagwan: 'shani'
    };
  }
  return {
    color: 'Orange / Red',
    colorValue: '#f97316',
    number: '1',
    mantra: 'ॐ सूर्याय नमः',
    daan: 'Donate Wheat or Copper Vessels',
    daanBenefit: 'Benefits: Vitality, Health & Leadership',
    bhajan: 'Surya Ashtakam',
    bhajanBhagwan: 'surya'
  };
};

const getBhagwanImage = (name: string) => {
  const n = (name || '').toLowerCase().trim();
  if (n.includes('shiv') || n.includes('mahadev')) return require('../../assets/bhagwan/shiva.png');
  if (n.includes('hanuman')) return require('../../assets/bhagwan/hanuman.png');
  if (n.includes('ganesh') || n.includes('ganpati')) return require('../../assets/bhagwan/ganesha.png');
  if (n.includes('vishnu') || n.includes('ram') || n.includes('krishna') || n.includes('narayan')) return require('../../assets/bhagwan/vishnu.png');
  if (n.includes('lakshmi') || n.includes('laxmi')) return require('../../assets/bhagwan/lakshmi.png');
  if (n.includes('surya')) return require('../../assets/bhagwan/surya.png');
  if (n.includes('durga') || n.includes('devi') || n.includes('kali') || n.includes('shakti') || n.includes('navratri')) return require('../../assets/bhagwan/durga.png');
  return require('../../assets/bhagwan/shiva.png');
};

const getColorHex = (colorName: string): string => {
  const c = (colorName || '').toLowerCase().trim();
  if (c.includes('red')) return '#ef4444';
  if (c.includes('pink')) return '#ec4899';
  if (c.includes('green')) return '#22c55e';
  if (c.includes('white')) return '#ffffff';
  if (c.includes('gold') || c.includes('yellow')) return '#eab308';
  if (c.includes('blue')) return '#3b82f6';
  if (c.includes('maroon') || c.includes('brown')) return '#991b1b';
  if (c.includes('black') || c.includes('dark')) return '#1e293b';
  if (c.includes('orange')) return '#f97316';
  return '#fcd34d';
};

const formatTo12h = (timeRangeStr: string) => {
  const parts = timeRangeStr.split(' - ');
  if (parts.length !== 2) return timeRangeStr;
  
  const formatTime = (tStr: string) => {
    const segments = tStr.split(':');
    if (segments.length < 2) return tStr;
    let h = parseInt(segments[0], 10);
    const m = segments[1];
    if (h >= 24) {
      h = h % 24;
    }
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
  };

  return `${formatTime(parts[0])} - ${formatTime(parts[1])}`;
};

const checkIfSlotActive = (timeRangeStr: string, isNight: boolean): boolean => {
  try {
    const [startStr, endStr] = timeRangeStr.split(' - ');
    const parseToSeconds = (tStr: string) => {
      const parts = tStr.split(':');
      let h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const s = parseInt(parts[2], 10) || 0;
      return h * 3600 + m * 60 + s;
    };
    
    const startSec = parseToSeconds(startStr);
    const endSec = parseToSeconds(endStr);
    
    const now = new Date();
    const nowSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds();
    
    if (isNight) {
      if (startSec > endSec) {
        return nowSec >= startSec || nowSec < endSec;
      }
    }
    return nowSec >= startSec && nowSec < endSec;
  } catch (e) {
    return false;
  }
};

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { cart, handleAddToCart, handleIncrement, handleDecrement } = useCart();
  const { t } = useLanguage();

  // Consume Global Playback Context
  const { player, status, activeTrack, playTrack, togglePlay } = usePlayback();

  const [heroData, setHeroData] = React.useState<any>(null);
  const [isHeroLoading, setIsHeroLoading] = React.useState(true);
  const [oneRupeeItems, setOneRupeeItems] = React.useState<any[]>([]);
  const [isOneRupeeLoading, setIsOneRupeeLoading] = React.useState(true);
  const [problemsList, setProblemsList] = React.useState<any[]>([]);
  const [homepageCategories, setHomepageCategories] = React.useState<any[]>([]);
  const [videoReviews, setVideoReviews] = React.useState<any[]>([]);
  const [activeReview, setActiveReview] = React.useState<any>(null);
  const [dbBanners, setDbBanners] = React.useState<any[]>([]);

  const [detailsHeight, setDetailsHeight] = React.useState(420);
  const COLLAPSED_HEIGHT = 188;
  const EXPANDED_HEIGHT = COLLAPSED_HEIGHT + detailsHeight;
  const COLLAPSE_THRESHOLD = detailsHeight;

  const [panchangData, setPanchangData] = React.useState<any>(null);
  const panchangDataRef = React.useRef<any>(null);
  React.useEffect(() => {
    panchangDataRef.current = panchangData;
  }, [panchangData]);

  const [isPanchangLoading, setIsPanchangLoading] = React.useState(true);
  const [isCollapsed, setIsCollapsed] = React.useState(false);
  const [userProfile, setUserProfile] = React.useState<any>(null);
  const [userRashi, setUserRashi] = React.useState<string>('');
  const [rashiForecast, setRashiForecast] = React.useState<any>(null);
  const [isRashiLoading, setIsRashiLoading] = React.useState<boolean>(false);
  const [dailyDaan, setDailyDaan] = React.useState<any>(null);
  const [isDaanLoading, setIsDaanLoading] = React.useState<boolean>(true);
  const [allBhajans, setAllBhajans] = React.useState<any[]>([]);
  const [dailyBhajan, setDailyBhajan] = React.useState<any>(null);
  const [isChoghadiyaModalVisible, setIsChoghadiyaModalVisible] = React.useState<boolean>(false);
  const [choghadiyaModalTab, setChoghadiyaModalTab] = React.useState<'day' | 'night'>('day');


  const loadDailyDaan = React.useCallback(async (rashiSign: string, weekdayName: string) => {
    try {
      setIsDaanLoading(true);
      let query = supabase.from('daans').select('*');
      
      if (rashiSign) {
        query = query.eq('rashi', rashiSign.toLowerCase());
      } else {
        // Normalize day to match English seeded weekday values
        const day = (weekdayName || '').toLowerCase().trim();
        let normalizedDay = 'Sunday';
        if (day.includes('mon') || day.includes('som')) normalizedDay = 'Monday';
        else if (day.includes('tue') || day.includes('mang')) normalizedDay = 'Tuesday';
        else if (day.includes('wed') || day.includes('budh') || day.includes('buddh')) normalizedDay = 'Wednesday';
        else if (day.includes('thu') || day.includes('gur') || day.includes('brih')) normalizedDay = 'Thursday';
        else if (day.includes('fri') || day.includes('shuk')) normalizedDay = 'Friday';
        else if (day.includes('sat') || day.includes('shan')) normalizedDay = 'Saturday';
        else if (day.includes('sun') || day.includes('rav') || day.includes('adit')) normalizedDay = 'Sunday';
        else {
          normalizedDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        }
        query = query.eq('weekday', normalizedDay);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      if (data && data.length > 0) {
        const dateObj = new Date();
        const dateSeed = dateObj.getFullYear() * 10000 + (dateObj.getMonth() + 1) * 100 + dateObj.getDate();
        const index = dateSeed % data.length;
        setDailyDaan(data[index]);
      } else {
        setDailyDaan(null);
      }
    } catch (err) {
      console.warn('[Home Daily Daan] Error loading from database:', err);
      setDailyDaan(null);
    } finally {
      setIsDaanLoading(false);
    }
  }, []);

  // Choghadiya timings states
  const [choghadiyaData, setChoghadiyaData] = React.useState<any>(null);
  const [currentMuhurat, setCurrentMuhurat] = React.useState<{ name: string; time: string } | null>(null);
  const [nextMuhurat, setNextMuhurat] = React.useState<{ name: string; time: string } | null>(null);
  const currentDayName = panchangData?.day || panchangData?.panchang_for_today?.Day || panchangData?.panchang_for_today?.Weekday || new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const weekdayRec = getWeekdayRecommendation(currentDayName);
  const isCollapsedRef = React.useRef(false);
  const isExpandingRef = React.useRef(false);
  const collapseThresholdRef = React.useRef(COLLAPSE_THRESHOLD);

  React.useEffect(() => {
    isCollapsedRef.current = isCollapsed;
  }, [isCollapsed]);

  React.useEffect(() => {
    collapseThresholdRef.current = COLLAPSE_THRESHOLD;
  }, [COLLAPSE_THRESHOLD]);

  React.useEffect(() => {
    loadDailyDaan(userRashi, currentDayName);
  }, [userRashi, currentDayName, loadDailyDaan]);

  const scrollY = React.useRef(new Animated.Value(0)).current;
  const mainScrollRef = React.useRef<ScrollView>(null);
  const currentScrollYRef = React.useRef(0);
  const isReadyRef = React.useRef(false);

  const lastScrollYRef = React.useRef(0);

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        lastScrollYRef.current = currentScrollYRef.current;
      },
      onPanResponderMove: (evt, gestureState) => {
        let newY = lastScrollYRef.current - gestureState.dy;
        if (newY < 0) newY = 0;
        mainScrollRef.current?.scrollTo({ y: newY, animated: false });
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (!isCollapsedRef.current) {
          const y = currentScrollYRef.current;
          const threshold = collapseThresholdRef.current;
          if (y > 0 && y < threshold) {
            if (y > threshold / 2 || gestureState.dy < -50) {
              mainScrollRef.current?.scrollTo({ y: threshold, animated: true });
            } else {
              mainScrollRef.current?.scrollTo({ y: 0, animated: true });
            }
          }
        } else {
          if (gestureState.dy > 50) {
            handleTogglePanchangRef.current?.();
          }
        }
      }
    })
  ).current;

  // Dynamic layout values based on scroll offset and collapse state
  let cardHeight: any;
  let panchangMaxHeight: any;
  let panchangOpacity: any;
  let cardTop: any;
  let translateY: any;

  if (isCollapsed) {
    cardHeight = scrollY.interpolate({
      inputRange: [0, 1],
      outputRange: [COLLAPSED_HEIGHT, COLLAPSED_HEIGHT],
    });
    panchangMaxHeight = scrollY.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0],
    });
    panchangOpacity = scrollY.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 0],
    });
    cardTop = scrollY.interpolate({
      inputRange: [-1000, 0, 1000],
      outputRange: [1004, 4, -996],
      extrapolate: 'clamp',
    });
    translateY = scrollY.interpolate({
      inputRange: [0, 1],
      outputRange: [-COLLAPSE_THRESHOLD, -COLLAPSE_THRESHOLD],
    });
  } else {
    cardHeight = scrollY.interpolate({
      inputRange: [0, COLLAPSE_THRESHOLD],
      outputRange: [EXPANDED_HEIGHT, COLLAPSED_HEIGHT],
      extrapolate: 'clamp',
    });
    panchangMaxHeight = scrollY.interpolate({
      inputRange: [0, COLLAPSE_THRESHOLD],
      outputRange: [COLLAPSE_THRESHOLD, 0],
      extrapolate: 'clamp',
    });
    panchangOpacity = scrollY.interpolate({
      inputRange: [0, COLLAPSE_THRESHOLD / 2, COLLAPSE_THRESHOLD],
      outputRange: [1, 0.3, 0],
      extrapolate: 'clamp',
    });
    cardTop = scrollY.interpolate({
      inputRange: [-1000, 0, COLLAPSE_THRESHOLD, COLLAPSE_THRESHOLD + 1000],
      outputRange: [1004, 4, 4, 4 - 1000],
      extrapolate: 'clamp',
    });
    translateY = scrollY.interpolate({
      inputRange: [0, COLLAPSE_THRESHOLD],
      outputRange: [0, -COLLAPSE_THRESHOLD],
      extrapolate: 'clamp',
    });
  }

  const loadPanchang = React.useCallback(async () => {
    try {
      setIsPanchangLoading(true);
      const data = await requestAstro("panchang");
      if (data) {
        setPanchangData(data);
      }
    } catch (err) {
      console.log('[Home Panchang] Error fetching:', err);
    } finally {
      setIsPanchangLoading(false);
    }
  }, []);

  const calculateActiveMuhurats = React.useCallback((data: any) => {
    if (!data || !data.chaughadiya) return;
    const chaughadiya = data.chaughadiya;

    const todayStr = new Date().toISOString().split('T')[0];

    const parseToDate = (timeStr: string, isNightSegment: boolean, refDateStr: string) => {
      const [hPart, mPart, sPart] = timeStr.split(':');
      let hour = parseInt(hPart, 10);
      const minute = parseInt(mPart, 10);
      const second = parseInt(sPart, 10);

      const date = new Date(refDateStr + "T12:00:00");
      if (hour >= 24) {
        date.setDate(date.getDate() + 1);
        hour = hour % 24;
      } else if (isNightSegment && hour < 12) {
        date.setDate(date.getDate() + 1);
      }
      date.setHours(hour, minute, second, 0);
      return date;
    };

    const segments: Array<{ name: string; start: Date; end: Date }> = [];

    if (Array.isArray(chaughadiya.day)) {
      chaughadiya.day.forEach((item: any) => {
        const [startStr, endStr] = item.time.split(' - ');
        segments.push({
          name: item.muhurta,
          start: parseToDate(startStr.trim(), false, todayStr),
          end: parseToDate(endStr.trim(), false, todayStr)
        });
      });
    }

    if (Array.isArray(chaughadiya.night)) {
      chaughadiya.night.forEach((item: any) => {
        const [startStr, endStr] = item.time.split(' - ');
        segments.push({
          name: item.muhurta,
          start: parseToDate(startStr.trim(), true, todayStr),
          end: parseToDate(endStr.trim(), true, todayStr)
        });
      });
    }

    segments.sort((a, b) => a.start.getTime() - b.start.getTime());

    const now = new Date();
    let activeIdx = segments.findIndex(seg => now >= seg.start && now < seg.end);

    let activeSeg: any = null;
    let nextSeg: any = null;

    if (activeIdx === -1) {
      if (segments.length > 0) {
        if (now < segments[0].start) {
          activeSeg = segments[segments.length - 1];
          nextSeg = segments[0];
        } else {
          activeSeg = segments[segments.length - 1];
          nextSeg = segments[0];
        }
      }
    } else {
      activeSeg = segments[activeIdx];
      nextSeg = segments[(activeIdx + 1) % segments.length];
    }

    if (activeSeg && nextSeg) {
      const formatTimeRange = (start: Date, end: Date) => {
        const get12h = (d: Date) => {
          let h = d.getHours();
          const m = String(d.getMinutes()).padStart(2, '0');
          const ampm = h >= 12 ? 'PM' : 'AM';
          h = h % 12;
          if (h === 0) h = 12;
          return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
        };
        return `${get12h(start)} - ${get12h(end)}`;
      };

      setCurrentMuhurat({
        name: activeSeg.name,
        time: formatTimeRange(activeSeg.start, activeSeg.end)
      });
      setNextMuhurat({
        name: nextSeg.name,
        time: formatTimeRange(nextSeg.start, nextSeg.end)
      });
    }
  }, []);

  const getClientChoghadiyaFallback = React.useCallback(() => {
    const currentPanchang = panchangDataRef.current;
    // 1. Get Sunrise/Sunset
    const rawSunrise = currentPanchang?.sunrise || currentPanchang?.sun_moon_calculations?.['Sun Rise'] || currentPanchang?.sun_moon_calculations?.['Sunrise'] || '05:42 AM';
    const rawSunset = currentPanchang?.sunset || currentPanchang?.sun_moon_calculations?.['Sun Set'] || currentPanchang?.sun_moon_calculations?.['Sunset'] || '06:59 PM';

    const parseTimeToSeconds = (timeStr: string, defaultSec: number): number => {
      if (!timeStr) return defaultSec;
      try {
        const cleanStr = timeStr.trim().toUpperCase();
        const isPm = cleanStr.includes('PM');
        const isAm = cleanStr.includes('AM');
        const timeOnly = cleanStr.replace(/[AP]M/, '').trim();
        const parts = timeOnly.split(':');
        let hr = parseInt(parts[0], 10);
        const min = parts[1] ? parseInt(parts[1], 10) : 0;
        const sec = parts[2] ? parseInt(parts[2], 10) : 0;
        
        if (isPm && hr < 12) hr += 12;
        if (isAm && hr === 12) hr = 0;
        
        return hr * 3600 + min * 60 + sec;
      } catch (e) {
        return defaultSec;
      }
    };

    const dayStartSec = parseTimeToSeconds(rawSunrise, 5 * 3600 + 42 * 60); // default 05:42:00
    const dayEndSec = parseTimeToSeconds(rawSunset, 18 * 3600 + 59 * 60);   // default 18:59:00

    const dayDuration = dayEndSec - dayStartSec;
    const daySlotDuration = dayDuration / 8;

    const nightDuration = (24 * 3600 - dayEndSec) + dayStartSec;
    const nightSlotDuration = nightDuration / 8;

    const formatSecToTime = (totalSec: number) => {
      const sec = Math.floor(totalSec % 60);
      const min = Math.floor((totalSec / 60) % 60);
      const hr = Math.floor(totalSec / 3600);
      return `${String(hr).padStart(2, '0')}:${String(min).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    };

    const DAY_CHOGHADIYA_PATTERNS: Record<string, string[]> = {
      sunday: ['Udveg', 'Char', 'Labh', 'Amrit', 'Kaal', 'Shubh', 'Rog', 'Udveg'],
      monday: ['Amrit', 'Kaal', 'Shubh', 'Rog', 'Udveg', 'Char', 'Labh', 'Amrit'],
      tuesday: ['Rog', 'Udveg', 'Char', 'Labh', 'Amrit', 'Kaal', 'Shubh', 'Rog'],
      wednesday: ['Char', 'Labh', 'Amrit', 'Kaal', 'Shubh', 'Rog', 'Udveg', 'Char'],
      thursday: ['Shubh', 'Rog', 'Udveg', 'Char', 'Labh', 'Amrit', 'Kaal', 'Shubh'],
      friday: ['Char', 'Labh', 'Amrit', 'Kaal', 'Shubh', 'Rog', 'Udveg', 'Char'],
      saturday: ['Kaal', 'Shubh', 'Rog', 'Udveg', 'Char', 'Labh', 'Amrit', 'Kaal']
    };

    const NIGHT_CHOGHADIYA_PATTERNS: Record<string, string[]> = {
      sunday: ['Amrit', 'Char', 'Rog', 'Kaal', 'Labh', 'Udveg', 'Shubh', 'Amrit'],
      monday: ['Char', 'Labh', 'Amrit', 'Kaal', 'Shubh', 'Rog', 'Udveg', 'Char'],
      tuesday: ['Kaal', 'Shubh', 'Rog', 'Udveg', 'Char', 'Labh', 'Amrit', 'Kaal'],
      wednesday: ['Udveg', 'Char', 'Labh', 'Amrit', 'Kaal', 'Shubh', 'Rog', 'Udveg'],
      thursday: ['Amrit', 'Kaal', 'Shubh', 'Rog', 'Udveg', 'Char', 'Labh', 'Amrit'],
      friday: ['Rog', 'Udveg', 'Char', 'Labh', 'Amrit', 'Kaal', 'Shubh', 'Rog'],
      saturday: ['Shubh', 'Rog', 'Udveg', 'Char', 'Labh', 'Amrit', 'Kaal', 'Shubh']
    };

    const dayName = currentPanchang?.day || currentPanchang?.panchang_for_today?.Day || currentPanchang?.panchang_for_today?.Weekday || new Date().toLocaleDateString('en-US', { weekday: 'long' });
    const dayNameLower = dayName.toLowerCase().trim();
    let matchedDay = 'thursday';
    if (dayNameLower.includes('sun')) matchedDay = 'sunday';
    else if (dayNameLower.includes('mon')) matchedDay = 'monday';
    else if (dayNameLower.includes('tue')) matchedDay = 'tuesday';
    else if (dayNameLower.includes('wed')) matchedDay = 'wednesday';
    else if (dayNameLower.includes('thu')) matchedDay = 'thursday';
    else if (dayNameLower.includes('fri')) matchedDay = 'friday';
    else if (dayNameLower.includes('sat')) matchedDay = 'saturday';

    const dayMuhurtas = DAY_CHOGHADIYA_PATTERNS[matchedDay] || DAY_CHOGHADIYA_PATTERNS.thursday;
    const nightMuhurtas = NIGHT_CHOGHADIYA_PATTERNS[matchedDay] || NIGHT_CHOGHADIYA_PATTERNS.thursday;

    const daySlots: Array<{ time: string; muhurta: string }> = [];
    for (let i = 0; i < 8; i++) {
      const startSec = dayStartSec + i * daySlotDuration;
      const endSec = startSec + daySlotDuration;
      daySlots.push({
        time: `${formatSecToTime(startSec)} - ${formatSecToTime(endSec)}`,
        muhurta: dayMuhurtas[i]
      });
    }

    const nightSlots: Array<{ time: string; muhurta: string }> = [];
    for (let i = 0; i < 8; i++) {
      const startSec = dayEndSec + i * nightSlotDuration;
      const endSec = startSec + nightSlotDuration;
      nightSlots.push({
        time: `${formatSecToTime(startSec)} - ${formatSecToTime(endSec)}`,
        muhurta: nightMuhurtas[i]
      });
    }

    return {
      chaughadiya: {
        day: daySlots,
        night: nightSlots
      }
    };
  }, []);

  const loadChoghadiya = React.useCallback(async () => {
    try {
      const data = await requestAstro("choghadiya");
      if (data) {
        setChoghadiyaData(data);
        calculateActiveMuhurats(data);
      } else {
        throw new Error("No data returned");
      }
    } catch (err) {
      console.log('[Home Choghadiya] Error fetching, serving client fallback:', err);
      const fallbackData = getClientChoghadiyaFallback();
      setChoghadiyaData(fallbackData);
      calculateActiveMuhurats(fallbackData);
    }
  }, [calculateActiveMuhurats, getClientChoghadiyaFallback]);

  React.useEffect(() => {
    if (!choghadiyaData) return;
    
    calculateActiveMuhurats(choghadiyaData);

    const interval = setInterval(() => {
      calculateActiveMuhurats(choghadiyaData);
    }, 30000);

    return () => clearInterval(interval);
  }, [choghadiyaData, calculateActiveMuhurats]);

  React.useEffect(() => {
    if (panchangData) {
      loadChoghadiya();
    }
  }, [panchangData, loadChoghadiya]);

  const loadUserProfileAndHoroscope = React.useCallback(async () => {
    try {
      const sessionData = await safeStorage.getItem('user_session');
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        
        // Fetch profiles & app_users details
        const [profileRes, appUserRes] = await Promise.all([
          supabase.from('profiles').select('*').eq('id', parsed.id).maybeSingle(),
          supabase.from('app_users').select('dob, name').eq('id', parsed.id).maybeSingle()
        ]);

        const profileData: any = profileRes.data || {};
        const appUserData: any = appUserRes.data || {};

        const combinedProfile = {
          id: parsed.id,
          name: appUserData.name || profileData.full_name || parsed.name || 'Devotee',
          dob: appUserData.dob || '',
          rashi: profileData.rashi || '',
        };
        setUserProfile(combinedProfile);

        let resolvedSign = '';
        if (combinedProfile.rashi) {
          resolvedSign = mapRashiToSign(combinedProfile.rashi);
        }
        if (!resolvedSign && combinedProfile.dob) {
          resolvedSign = getZodiacSign(combinedProfile.dob);
        }

        if (resolvedSign) {
          setUserRashi(resolvedSign);
          setIsRashiLoading(true);
          try {
            console.log(`[Home Screen Horoscope] Fetching prediction for ${resolvedSign}...`);
            const forecast = await requestAstro(`horoscope?sign=${resolvedSign}&period=daily`);
            if (forecast) {
              setRashiForecast(forecast);
            }
          } catch (err) {
            console.error('[Home Screen Horoscope] Error:', err);
          } finally {
            setIsRashiLoading(false);
          }
        } else {
          setRashiForecast(null);
          setUserRashi('');
        }
      } else {
        setUserProfile(null);
        setRashiForecast(null);
        setUserRashi('');
      }
    } catch (err) {
      console.error('[Home Profile/Horoscope] Error loading:', err);
    }
  }, []);

  const convert24To12 = (timeStr: string): string => {
    if (!timeStr) return timeStr;
    return timeStr.replace(/\b(\d{1,2}):(\d{2})(?::(\d{2}))?(\s*[AP]M)?\b/gi, (match, hStr, mStr, sStr, ampmStr) => {
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

  const renderTimeText = (val: string) => {
    if (!val) return null;
    if (val.includes('Next Day')) {
      const timePart = val.replace(' (Next Day)', '').trim();
      return (
        <View style={{ alignItems: 'center' }}>
          <Text style={styles.sunMoonTimeText}>{timePart}</Text>
          <Text style={[styles.sunMoonLabelText, { color: '#ea580c', fontSize: 7.5, marginTop: 1, fontFamily: 'Outfit-Bold' }]}>
            {t("(Next Day)")}
          </Text>
        </View>
      );
    }
    return (
      <Text style={styles.sunMoonTimeText}>
        {val}
      </Text>
    );
  };

  const getPanchangDetail = (key: string, fallback: string) => {
    const getValue = () => {
      if (!panchangData) return fallback;
      switch (key) {
        case 'date':
          if (panchangData.reference_date) {
            const d = new Date(panchangData.reference_date + "T12:00:00");
            const dayNum = d.getDate();
            const monthName = d.toLocaleDateString('en-US', { month: 'long' });
            const yearNum = d.getFullYear();
            return `${dayNum} ${monthName} ${yearNum}`;
          }
          return fallback;
        case 'day':
          return panchangData.day || panchangData.panchang_for_today?.Day || panchangData.panchang_for_today?.Weekday || fallback;
        case 'tithi':
          return panchangData.tithi || panchangData.panchang_for_today?.Tithi || fallback;
        case 'paksha':
          return panchangData.paksha || panchangData.panchang_for_today?.Paksha || fallback;
        case 'sunrise':
          return panchangData.sunrise || panchangData.sun_moon_calculations?.['Sun Rise'] || panchangData.sun_moon_calculations?.['Sunrise'] || fallback;
        case 'sunset':
          return panchangData.sunset || panchangData.sun_moon_calculations?.['Sun Set'] || panchangData.sun_moon_calculations?.['Sunset'] || fallback;
        case 'moonrise':
          return panchangData.moonrise || panchangData.sun_moon_calculations?.['Moon Rise'] || panchangData.sun_moon_calculations?.['Moonrise'] || fallback;
        case 'moonset':
          return panchangData.moonset || panchangData.sun_moon_calculations?.['Moon Set'] || panchangData.sun_moon_calculations?.['Moonset'] || fallback;
        case 'shubh_color':
          return panchangData.shubh_color || 'Yellow';
        case 'lucky_number':
          return panchangData.lucky_number || '7';
        case 'mantra':
          return panchangData.mantra || 'ॐ नमः शिवाय';
        case 'current_muhurat':
          return panchangData.current_muhurat || 'Amrit';
        case 'current_muhurat_time':
          return panchangData.current_muhurat_time || '09:30 AM - 11:00 AM';
        case 'next_muhurat':
          return panchangData.next_muhurat || 'Shubh';
        case 'next_muhurat_time':
          return panchangData.next_muhurat_time || '11:00 AM - 12:30 PM';
        default:
          return fallback;
      }
    };
    return convert24To12(getValue());
  };

  const handleSharePanchang = async () => {
    try {
      let shareMsg = '';
      if (rashiForecast) {
        shareMsg = `🔮 Daily Rashifal - ${userRashi.charAt(0).toUpperCase() + userRashi.slice(1)} (${rashiForecast.date_label || 'Today'}) 🔮\n\n✨ Forecast: ${rashiForecast.content ? rashiForecast.content.substring(0, 150) + '...' : ''}\n🎨 Lucky Color: ${rashiForecast.lucky_color} | Lucky Number: ${rashiForecast.lucky_number}\n🛡️ Astro Remedy: ${rashiForecast.remedy}\n🕉️ Today's Mantra: ${weekdayRec.mantra}\n\nDownload MantraPuja App for personalized daily forecasts! 🙏✨`;
      } else {
        shareMsg = `🌸 Today's Panchang - ${getPanchangDetail('date', '18 June 2026')}, ${getPanchangDetail('day', 'Thursday')} 🌸\n\n✨ ${getPanchangDetail('paksha', 'Krishna Paksha')} • ${getPanchangDetail('tithi', 'Ekadashi Tithi')}\n🌅 Sunrise: ${getPanchangDetail('sunrise', '05:42 AM')} | Sunset: ${getPanchangDetail('sunset', '06:59 PM')}\n🌙 Moonrise: ${getPanchangDetail('moonrise', '09:14 PM')} | Moonset: ${getPanchangDetail('moonset', '08:10 AM')}\n🎨 Shubh Color: ${weekdayRec.color} | Lucky Number: ${weekdayRec.number}\n🕉️ Shubh Mantra: ${weekdayRec.mantra}\n🟢 Choghadiya Amrit: ${getPanchangDetail('current_muhurat_time', '09:30 AM - 11:00 AM')}\n🌾 Today's Daan: ${weekdayRec.daan}\n\nDownload MantraPuja App to share daily Panchang! 🙏`;
      }
      await Share.share({
        message: shareMsg,
        title: rashiForecast ? "My Daily Horoscope Forecast" : "Today's Panchang Details"
      });
    } catch (error) {
      Alert.alert('Sharing Error', 'Unable to open share menu.');
    }
  };

  const handleShareChoghadiya = async () => {
    try {
      const date = getPanchangDetail('date', new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }));
      let msg = `🚩 *Auspicious Choghadiya Timings* 🚩\n📅 *Date:* ${date} (${currentDayName})\n\n`;

      if (choghadiyaData?.chaughadiya) {
        msg += `☀️ *DAY MUHURATS (Sunrise to Sunset)*\n`;
        choghadiyaData.chaughadiya.day.forEach((slot: any) => {
          const mName = slot.muhurta.toLowerCase();
          const isAusp = mName.includes('amrit') || mName.includes('shubh') || mName.includes('labh');
          const isNeut = mName.includes('char') || mName.includes('chal');
          const type = isAusp ? '🟢 Auspicious' : isNeut ? '🟡 Neutral' : '🔴 Inauspicious';
          msg += `• *${slot.muhurta}* (${formatTo12h(slot.time)}) - _${type}_\n`;
        });

        msg += `\n🌙 *NIGHT MUHURATS (Sunset to Sunrise)*\n`;
        choghadiyaData.chaughadiya.night.forEach((slot: any) => {
          const mName = slot.muhurta.toLowerCase();
          const isAusp = mName.includes('amrit') || mName.includes('shubh') || mName.includes('labh');
          const isNeut = mName.includes('char') || mName.includes('chal');
          const type = isAusp ? '🟢 Auspicious' : isNeut ? '🟡 Neutral' : '🔴 Inauspicious';
          msg += `• *${slot.muhurta}* (${formatTo12h(slot.time)}) - _${type}_\n`;
        });
      }

      msg += `\n🙏 *Check real-time Panchang, active Choghadiya timers & planetary remedies on MantraPuja App!*`;

      await Share.share({
        message: msg,
        title: "Today's Choghadiya Muhurats"
      });
    } catch (e) {
      console.warn('Sharing Choghadiya failed:', e);
    }
  };

  const handleTogglePanchang = React.useCallback(() => {
    if (isCollapsed) {
      const scrollYOffset = currentScrollYRef.current;
      isExpandingRef.current = true;
      setIsCollapsed(false);

      // Instantly offset the scroll position to match the expanded spacer height
      scrollY.setValue(scrollYOffset + COLLAPSE_THRESHOLD);
      currentScrollYRef.current = scrollYOffset + COLLAPSE_THRESHOLD;
      mainScrollRef.current?.scrollTo({ y: scrollYOffset + COLLAPSE_THRESHOLD, animated: false });

      // Scroll back to 0 animatedly to expand the card
      setTimeout(() => {
        mainScrollRef.current?.scrollTo({ y: 0, animated: true });
      }, 16);
    } else {
      mainScrollRef.current?.scrollTo({ y: COLLAPSE_THRESHOLD, animated: true });
    }
  }, [isCollapsed, COLLAPSE_THRESHOLD]);

  const handleTogglePanchangRef = React.useRef(handleTogglePanchang);
  React.useEffect(() => {
    handleTogglePanchangRef.current = handleTogglePanchang;
  }, [handleTogglePanchang]);

  const handleMainScroll = (event: any) => {
    if (!isReadyRef.current) return;
    const y = event.nativeEvent.contentOffset.y;
    currentScrollYRef.current = y;

    if (isExpandingRef.current) {
      if (y <= 5) {
        isExpandingRef.current = false;
      }
      return;
    }
  };

  const handleScrollEnd = (y: number) => {
    if (!isReadyRef.current) return;
    if (!isCollapsed && y >= COLLAPSE_THRESHOLD) {
      setIsCollapsed(true);
      const newY = Math.max(0, y - COLLAPSE_THRESHOLD);
      scrollY.setValue(newY);
      lastScrollYRef.current = Math.max(0, lastScrollYRef.current - COLLAPSE_THRESHOLD);
      mainScrollRef.current?.scrollTo({ y: newY, animated: false });
    }
  };

  const activeBanners = dbBanners.length > 0
    ? dbBanners.map(b => ({
      id: b.id,
      image: { uri: b.image_url },
      title: b.title || '',
      redirect_url: b.redirect_url || ''
    }))
    : PROMO_BANNERS.map(b => ({
      id: b.id,
      image: b.image,
      title: '',
      redirect_url: ''
    }));

  const loadActiveHero = React.useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('homepage_hero')
        .select('*')
        .eq('is_active', true)
        .single();

      if (error) {
        console.log('[Home Hero] Fetch info:', error.message);
        setHeroData(null);
      } else {
        setHeroData(data);
      }
    } catch (err) {
      console.error('[Home Hero] Error fetching dynamic hero:', err);
    } finally {
      setIsHeroLoading(false);
    }
  }, []);

  const loadOneRupeePoojas = React.useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('one_rupee_poojas')
        .select('*')
        .eq('status', 'published')
        .eq('is_active_on_home', true)
        .order('sort_order_home', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      console.log('[Home Page] Fetched ₹1 Pujas:', data?.length);
      if (data) {
        const formatted = data.map(p => ({
          id: p.id,
          title: p.title,
          originalPrice: p.original_price,
          offerPrice: p.offer_price,
          rating: p.rating,
          reviews: p.reviews,
          provider: p.provider,
          image: p.image_url,
        }));
        setOneRupeeItems(formatted);
      }
    } catch (err) {
      console.error('[Home One Rupee] Error fetching dynamic data:', err);
    } finally {
      setIsOneRupeeLoading(false);
    }
  }, []);

  const loadLifeProblems = React.useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('life_problems')
        .select('*')
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        const formatted = data.map(p => ({
          id: p.id,
          title: p.title,
          color: p.color,
          gradientColors: [p.gradient_start, p.gradient_end],
          image: p.image_url ? { uri: p.image_url } : null
        }));
        setProblemsList(formatted);
      }
    } catch (err) {
      console.error('[Home Life Problems] Error fetching data:', err);
    }
  }, []);



  const loadHomepageCategories = React.useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('category_by_product')
        .select('*')
        .order('category', { ascending: true });

      if (error) throw error;
      if (data) {
        const formattedList = data.map((item: any) => ({
          id: item.id || `db-${item.category}`,
          name: item.category,
          image: item.image_url,
        }));
        setHomepageCategories(formattedList);
      }
    } catch (err) {
      console.error('[Home Categories] Error loading dynamic categories:', err);
    }
  }, []);

  const loadVideoReviews = React.useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('video_reviews')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setVideoReviews(data);
      }
    } catch (err) {
      console.error('[Home Video Reviews] Error fetching:', err);
    }
  }, []);

  const loadBanners = React.useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('banners')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setDbBanners(data);
      }
    } catch (err) {
      console.error('[Home Banners] Error fetching:', err);
    }
  }, []);

  const loadDailyBhajan = React.useCallback(async () => {
    try {
      const { data, error } = await bhajanSupabase
        .from('bhajans')
        .select('*')
        .eq('is_visible', true);

      if (error) throw error;

      if (data && data.length > 0) {
        setAllBhajans(data);
        const today = new Date();
        const dateSeed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
        const idx = dateSeed % data.length;
        setDailyBhajan(data[idx]);
      }
    } catch (err) {
      console.error('[Home Daily Bhajan] Error fetching:', err);
    }
  }, []);

  const getMantraTrack = React.useCallback(() => {
    return allBhajans.find((b: any) => {
      const title = (b.title || '').toLowerCase();
      const recBhajan = (weekdayRec.bhajan || '').toLowerCase();
      const recMantra = (weekdayRec.mantra || '').toLowerCase();
      const recBhagwan = (weekdayRec.bhajanBhagwan || '').toLowerCase();
      
      return title.includes(recBhajan) || title.includes(recMantra) || (title.includes('mantra') && title.includes(recBhagwan));
    });
  }, [allBhajans, weekdayRec]);

  const handleListenMantra = React.useCallback(() => {
    const match = getMantraTrack();
    if (match) {
      const isCurrentActive = activeTrack && activeTrack.id === match.id;
      if (isCurrentActive) {
        togglePlay();
      } else {
        playTrack(match);
      }
    } else {
      router.push({
        pathname: '/music',
        params: { search: weekdayRec.bhajan || weekdayRec.mantra }
      });
    }
  }, [getMantraTrack, activeTrack, playTrack, togglePlay, weekdayRec]);

  const handlePlayPauseBhajan = React.useCallback(() => {
    if (dailyBhajan) {
      const isCurrentActive = activeTrack && activeTrack.id === dailyBhajan.id;
      if (isCurrentActive) {
        togglePlay();
      } else {
        playTrack(dailyBhajan);
      }
    } else {
      router.push('/music');
    }
  }, [dailyBhajan, activeTrack, playTrack, togglePlay]);

  const mantraTrack = React.useMemo(() => getMantraTrack(), [getMantraTrack]);
  const isMantraPlaying = !!(activeTrack && mantraTrack && activeTrack.id === mantraTrack.id && status.playing);
  const isBhajanPlaying = !!(activeTrack && dailyBhajan && activeTrack.id === dailyBhajan.id && status.playing);

  // Refresh dynamic data every time the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadActiveHero();
      loadOneRupeePoojas();
      loadLifeProblems();
      loadHomepageCategories();
      loadVideoReviews();
      loadBanners();
      loadPanchang();
      loadUserProfileAndHoroscope();
      loadDailyBhajan();
      loadChoghadiya();

      // Enable scroll listener after short layout delay
      const timer = setTimeout(() => {
        isReadyRef.current = true;
      }, 150);

      return () => {
        clearTimeout(timer);
        isReadyRef.current = false;
      };
    }, [
      loadActiveHero,
      loadOneRupeePoojas,
      loadLifeProblems,
      loadHomepageCategories,
      loadVideoReviews,
      loadBanners,
      loadPanchang,
      loadUserProfileAndHoroscope,
      loadDailyBhajan,
      loadChoghadiya
    ])
  );

  React.useEffect(() => {
    // Subscribe to realtime updates for live sync with isolated dynamic channel names
    const subscription = supabase
      .channel(`home_one_rupee_poojas_${Math.random().toString(36).substring(7)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'one_rupee_poojas' }, (payload) => {
        console.log('[Home One Rupee] Realtime update received!', payload);
        loadOneRupeePoojas();
      })
      .subscribe();

    const subLifeProblems = supabase
      .channel(`home_life_problems_sync_${Math.random().toString(36).substring(7)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'life_problems' }, (payload) => {
        console.log('[Home Life Problems] Realtime update received!', payload);
        loadLifeProblems();
      })
      .subscribe();

    const subCategoryByProduct = supabase
      .channel(`home_category_by_product_sync_${Math.random().toString(36).substring(7)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'category_by_product' }, (payload) => {
        console.log('[Home Categories] Realtime category_by_product update received!', payload);
        loadHomepageCategories();
      })
      .subscribe();

    const subVideoReviews = supabase
      .channel(`home_video_reviews_sync_${Math.random().toString(36).substring(7)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'video_reviews' }, (payload) => {
        console.log('[Home Video Reviews] Realtime update received!', payload);
        loadVideoReviews();
      })
      .subscribe();

    const subBanners = supabase
      .channel(`home_banners_sync_${Math.random().toString(36).substring(7)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'banners' }, (payload) => {
        console.log('[Home Banners] Realtime update received!', payload);
        loadBanners();
      })
      .subscribe();

    const subHomepageHero = supabase
      .channel(`home_hero_sync_${Math.random().toString(36).substring(7)}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'homepage_hero' }, (payload) => {
        console.log('[Home Hero] Realtime update received!', payload);
        loadActiveHero();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
      supabase.removeChannel(subLifeProblems);
      supabase.removeChannel(subCategoryByProduct);
      supabase.removeChannel(subVideoReviews);
      supabase.removeChannel(subBanners);
      supabase.removeChannel(subHomepageHero);
    };
  }, [
    loadActiveHero,
    loadOneRupeePoojas,
    loadLifeProblems,
    loadHomepageCategories,
    loadVideoReviews,
    loadBanners
  ]);

  const bannerScrollRef = React.useRef<ScrollView>(null);
  const [activeBannerIndex, setActiveBannerIndex] = React.useState(0);
  const [activeDateTab, setActiveDateTab] = React.useState('today');

  React.useEffect(() => {
    if (activeBanners.length <= 1) return;
    const timer = setInterval(() => {
      const nextIndex = (activeBannerIndex + 1) % activeBanners.length;
      setActiveBannerIndex(nextIndex);

      const bannerWidth = width - 50; // card width
      bannerScrollRef.current?.scrollTo({
        x: nextIndex * (bannerWidth + 12), // width + gap
        animated: true,
      });
    }, 4000);

    return () => clearInterval(timer);
  }, [activeBannerIndex, activeBanners.length]);

  const handleScroll = (event: any) => {
    const slideSize = width - 50 + 12; // width + gap
    const index = Math.round(event.nativeEvent.contentOffset.x / slideSize);
    if (index !== activeBannerIndex) {
      setActiveBannerIndex(index);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar style="dark" />

      <ScrollView
        ref={mainScrollRef}
        bounces={true}
        showsVerticalScrollIndicator={false}
        onScroll={(event) => {
          if (!isReadyRef.current) return;
          scrollY.setValue(event.nativeEvent.contentOffset.y);
          handleMainScroll(event);
        }}
        onScrollEndDrag={(event) => handleScrollEnd(event.nativeEvent.contentOffset.y)}
        onMomentumScrollEnd={(event) => handleScrollEnd(event.nativeEvent.contentOffset.y)}
        scrollEventThrottle={16}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Spacer to reserve space for the absolutely-positioned Panchang Card */}
        <View style={{ height: isCollapsed ? COLLAPSED_HEIGHT + 24 : EXPANDED_HEIGHT + 24 }} />

        {/* Horizontal Quick Actions Row */}
        <View style={styles.actionsContainer}>
          <View style={styles.actionsHeader}>
            <Text style={styles.actionsHeaderTitle}>{t("What's on your mind?")}</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.actionsScroll}
            style={styles.actionsScrollContainer}
          >
            {QUICK_ACTIONS.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.actionItem}
                activeOpacity={0.8}
                onPress={() => {
                  if (item.title === 'Shop') {
                    router.push('/all_pujas');
                  } else if (item.title === 'Kundli') {
                    router.push('/kundli');
                  } else if (item.title === 'Panchang') {
                    router.push('/panchang');
                  } else if (item.title === 'Rashi') {
                    router.push('/rashi');
                  }
                }}
              >
                <View style={[
                  styles.smallBox,
                  item.isBlueBg ? styles.orangeBox : styles.circularBox
                ]}>
                  <Image
                    source={typeof item.image === 'number' ? item.image : { uri: item.image }}
                    style={[
                      styles.actionImage,
                      item.isBlueBg ? styles.orangeBoxImage : styles.circularBoxImage,
                      (item.title === 'Kundli' || item.title === 'Panchang') && !item.isBlueBg && styles.largeActionImage
                    ]}
                    contentFit="contain"
                  />
                </View>
                <Text style={styles.actionTitle}>{t(item.title)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* ₹1 Store Section */}
        <View style={styles.storeCardContainer}>
          {/* Header Row */}
          <View style={styles.storeHeaderRow}>
            <View style={styles.storeLogoContainer}>
              <LinearGradient
                colors={['#f97316', '#ea580c']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.storeLogoBadge}
              >
                <Text style={styles.storeLogoText}>₹1</Text>
              </LinearGradient>
              <Text style={styles.storeLogoTitle}>{t('tabPuja')}</Text>
            </View>
            <TouchableOpacity
              style={styles.viewAllContainer}
              onPress={() => router.push('/one_rupee_store')}
            >
              <Text style={styles.viewAllText}>{t('viewAll')}</Text>
              <Ionicons name="chevron-forward" size={14} color="#ea580c" />
            </TouchableOpacity>
          </View>

          {/* Sub Header / Bullet */}
          <View style={styles.storeSubHeader}>
            <Ionicons name="checkmark-circle" size={13} color="#ea580c" style={styles.checkmarkIcon} />
            <Text style={styles.storeSubHeaderText}>
              {t('Pujas at ₹1')} <Text style={styles.storeSubHeaderTextOrange}>{t('Divine Blessings')}</Text>
            </Text>
          </View>

          {/* Horizontal List of Product Cards */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.storeScroll}
          >
            {isOneRupeeLoading ? (
              <View style={{ paddingHorizontal: 20 }}>
                <Text>Loading...</Text>
              </View>
            ) : oneRupeeItems.map((item) => {
              const quantityInCart = cart[item.id] || 0;
              return (
                <TouchableOpacity
                  key={item.id}
                  style={styles.productCard}
                  activeOpacity={0.9}
                  onPress={() => router.push({
                    pathname: '/puja_detail',
                    params: { id: item.id }
                  })}
                >
                  {/* Image Container with Floating '+' Button / Qty Selector */}
                  <View style={styles.productImageContainer}>
                    {item.image ? (
                      <Image source={typeof item.image === 'number' ? item.image : { uri: item.image }} style={styles.productImage} contentFit="cover" />
                    ) : (
                      <LinearGradient
                        colors={['#ffedd5', '#fed7aa']}
                        style={styles.productImagePlaceholder}
                      >
                        <Ionicons name="sparkles" size={16} color="#ea580c" />
                      </LinearGradient>
                    )}
                    {quantityInCart === 0 ? (
                      <TouchableOpacity
                        style={styles.addButton}
                        activeOpacity={0.85}
                        onPress={(e) => {
                          e.stopPropagation();
                          handleAddToCart(item.id);
                        }}
                      >
                        <Ionicons name="add" size={12} color="#ffffff" />
                      </TouchableOpacity>
                    ) : (
                      <View
                        style={styles.quantityToggleContainer}
                        onStartShouldSetResponder={() => true}
                        onResponderRelease={(e) => e.stopPropagation()}
                      >
                        <TouchableOpacity
                          style={styles.miniQtyBtn}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleDecrement(item.id);
                          }}
                        >
                          <Ionicons name="remove" size={10} color="#ffffff" />
                        </TouchableOpacity>
                        <Text style={styles.qtyToggleText}>{quantityInCart}</Text>
                        <TouchableOpacity
                          style={styles.miniQtyBtn}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleIncrement(item.id);
                          }}
                        >
                          <Ionicons name="add" size={10} color="#ffffff" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>

                  {/* Tilak Dot + Title */}
                  <View style={styles.titleRow}>
                    <View style={styles.tilakBox}>
                      <View style={styles.tilakDotInner} />
                    </View>
                    <Text style={styles.itemTitle} numberOfLines={2}>{t(item.title)}</Text>
                  </View>

                  {/* Price Row: strike original, yellow badge for ₹1 */}
                  <View style={styles.priceRow}>
                    <Text style={styles.originalPrice}>{item.originalPrice}</Text>
                    <View style={styles.priceBadge}>
                      <Text style={styles.priceBadgeText}>{item.offerPrice}</Text>
                    </View>
                  </View>

                  {/* Rating Badge */}
                  <View style={styles.ratingBadge}>
                    <Text style={styles.ratingText}>★ {item.rating} ({item.reviews})</Text>
                  </View>

                  {/* Divider Line */}
                  <View style={styles.cardDivider} />

                  {/* Provider Detail */}
                  <Text style={styles.providerText} numberOfLines={1}>{t(item.provider)}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Life Problem Solution Section */}
        <View style={styles.solutionsContainer}>
          <Text style={styles.solutionsHeaderTitle}>{t('Life Problem Solution')}</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.solutionsScroll}
          >
            {(problemsList.length > 0 ? problemsList : LIFE_SOLUTIONS).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.solutionCard}
                activeOpacity={0.85}
                onPress={() => router.push({
                  pathname: '/problem_pujas',
                  params: { category: item.title }
                })}
              >
                {/* Text at the Top */}
                <Text style={[styles.solutionCardTitle, { color: item.color }]}>
                  {t(item.title)}
                </Text>

                {/* Visual Icon at the Bottom */}
                <View style={styles.solutionImageContainer}>
                  <LinearGradient
                    colors={item.gradientColors}
                    style={styles.solutionGradient}
                  >
                    {item.image ? (
                      <Image
                        source={item.image}
                        style={styles.solutionImage}
                        contentFit="cover"
                      />
                    ) : (
                      <Ionicons name={item.icon as any} size={28} color={item.iconColor} />
                    )}
                  </LinearGradient>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Auto-Scrolling Promo Banners */}
        <View style={styles.bannersContainer}>
          <ScrollView
            ref={bannerScrollRef}
            horizontal
            pagingEnabled={false}
            showsHorizontalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            contentContainerStyle={styles.bannersScroll}
            decelerationRate="fast"
            snapToInterval={width - 50 + 12}
            snapToAlignment="center"
          >
            {activeBanners.map((banner) => (
              <TouchableOpacity
                key={banner.id}
                activeOpacity={0.9}
                style={styles.promoCard}
                onPress={() => {
                  if (banner.redirect_url) {
                    if (banner.redirect_url.startsWith('/') || banner.redirect_url.startsWith('mantrapuja://')) {
                      router.push(banner.redirect_url as any);
                    } else {
                      console.log('[Banner Press] Target link:', banner.redirect_url);
                    }
                  }
                }}
              >
                <Image
                  source={banner.image}
                  style={styles.promoImage}
                  contentFit="cover"
                />
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Pagination Indicators */}
          <View style={styles.paginationDots}>
            {activeBanners.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dot,
                  activeBannerIndex === index ? styles.activeDot : styles.inactiveDot
                ]}
              />
            ))}
          </View>
        </View>



        {/* Shop by Category Section */}
        <View style={styles.shopStoreSection}>
          <View style={styles.shopStoreHeader}>
            <Text style={styles.shopStoreTitle}>{t('Shop by Category')}</Text>
            <TouchableOpacity onPress={() => router.push('/all_pujas')}>
              <Text style={styles.shopStoreViewAllText}>{t('viewAll')} {'>'}</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.shopStoreScroll}
          >
            {(homepageCategories.length > 0 ? homepageCategories : SHOP_STORES).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.shopStoreCard}
                activeOpacity={0.85}
                onPress={() => router.push({
                  pathname: '/all_pujas',
                  params: { category: item.name }
                })}
              >
                <View style={styles.storeArchContainer}>
                  <Image
                    source={typeof item.image === 'number' ? item.image : { uri: item.image }}
                    style={styles.storeArchImage}
                    contentFit="contain"
                  />
                </View>
                <Text style={styles.shopStoreName}>{t(item.name)}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Devotee Video Reviews Section */}
        <View style={styles.videoReviewsSection}>
          <View style={styles.videoReviewsHeader}>
            <Text style={styles.videoReviewsTitle}>{t('Devotee Video Reviews')}</Text>
            <Text style={styles.videoReviewsSubtitle}>{t('Listen to the divine experiences of our blessed families')}</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.videoReviewsScroll}
          >
            {(videoReviews.length > 0 ? videoReviews : [
              {
                id: 'fallback-v1',
                devotee_name: 'Rajesh & Family',
                location: 'Delhi NCR',
                puja_name: 'Ganesh Puja Special',
                rating: '5.0',
                thumbnail_url: null,
                video_url: 'https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/video-reviews/fallback.mp4',
                duration: '1:45',
              },
              {
                id: 'fallback-v2',
                devotee_name: 'Anjali Sharma',
                location: 'Mumbai',
                puja_name: 'Maha Laxmi Homa',
                rating: '4.9',
                thumbnail_url: null,
                video_url: 'https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/video-reviews/fallback.mp4',
                duration: '2:10',
              },
              {
                id: 'fallback-v3',
                devotee_name: 'Priyesh Patel',
                location: 'Ahmedabad',
                puja_name: 'Rudrabhishek Puja',
                rating: '5.0',
                thumbnail_url: null,
                video_url: 'https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/video-reviews/fallback.mp4',
                duration: '1:20',
              }
            ]).map((item, idx) => (
              <TouchableOpacity
                key={item.id}
                style={styles.videoReviewCard}
                activeOpacity={0.9}
                onPress={() => setActiveReview(item)}
              >
                {/* Background Video Thumbnail */}
                <Image
                  source={item.thumbnail_url ? { uri: item.thumbnail_url } : (idx === 0 ? require('../../assets/review/istockphoto-944138400-612x612.jpg') : idx === 1 ? require('../../assets/review/celebration-navratri-deity_23-2151220009.avif') : require('../../assets/review/pngtree-indian-handsome-man-thinking-happy-young-dress-photo-image_15140676.jpg'))}
                  style={styles.videoThumbnail}
                  contentFit="cover"
                />

                {/* Black Overlay for readability */}
                <LinearGradient
                  colors={['rgba(0, 0, 0, 0.1)', 'rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0.85)']}
                  style={StyleSheet.absoluteFillObject}
                />

                {/* Floating Duration Tag */}
                <View style={styles.durationBadge}>
                  <Ionicons name="videocam" size={9} color="#ffffff" style={styles.durationIcon} />
                  <Text style={styles.durationText}>{item.duration}</Text>
                </View>

                {/* Centered Glowing Play Button */}
                <View style={styles.playIconContainer}>
                  <Ionicons name="play" size={16} color="#ffffff" style={styles.playIcon} />
                </View>

                {/* Devotee details overlay at the bottom */}
                <View style={styles.videoTextContent}>
                  {/* Rating & Location Row */}
                  <View style={styles.videoRatingLocationRow}>
                    <View style={styles.starBadge}>
                      <Ionicons name="star" size={8} color="#065f46" />
                      <Text style={styles.starBadgeText}>{item.rating}</Text>
                    </View>
                    <Text style={styles.videoLocationText}>{t(item.location)}</Text>
                  </View>

                  {/* Devotee Name */}
                  <Text style={styles.devoteeNameText} numberOfLines={1}>
                    {t(item.devotee_name)}
                  </Text>

                  {/* Blessed Puja name */}
                  <Text style={styles.pujaNameText} numberOfLines={1}>
                    {t(item.puja_name)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Absolutely-positioned Panchang Card */}
      <Animated.View
        style={[
          styles.absoluteCard,
          {
            height: cardHeight,
            top: cardTop,
          }
        ]}
        pointerEvents="box-none"
      >
        <View style={[styles.panchangCardContainer, { height: '100%' }]} {...panResponder.panHandlers}>
          {/* Krishna Banner */}
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleTogglePanchang}
            style={{ position: 'relative', zIndex: 20 }}
          >
            <View style={styles.panchangHeroCard}>
              <Image
                source={require('../../assets/banner/ChatGPT Image Jun 19, 2026, 03_41_07 PM.png')}
                style={StyleSheet.absoluteFillObject}
                contentFit="cover"
              />
              <LinearGradient
                colors={['rgba(120,53,15,0.7)', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.75)']}
                style={StyleSheet.absoluteFillObject}
              />
              <View style={styles.panchangHeroContent}>
                <View style={styles.panchangHeroTop}>
                  <Text style={styles.panchangHeroTag}>
                    {rashiForecast ? `✦ Daily Rashifal - ${userRashi.charAt(0).toUpperCase() + userRashi.slice(1)} ✦` : "✦ Today's Panchang ✦"}
                  </Text>
                </View>

                <View style={{ marginTop: 6, maxWidth: '75%' }}>
                  <Text style={styles.panchangHeroDate}>
                    {rashiForecast ? `Namaste, ${userProfile?.name || 'Devotee'}!` : getPanchangDetail('date', '18 June 2026')}
                  </Text>
                  <Text style={styles.panchangHeroDay}>
                    {rashiForecast ? (rashiForecast.date_label || 'Your Forecast') : getPanchangDetail('day', 'Thursday')}
                  </Text>
                </View>

                <View style={[styles.panchangHeroTithiBadge, { maxWidth: '75%' }]}>
                  <Ionicons name={rashiForecast ? "sparkles" : "moon"} size={11} color="#fcd34d" style={{ marginRight: 4 }} />
                  <Text style={styles.panchangHeroTithiText}>
                    {rashiForecast 
                      ? `Lucky Color: ${rashiForecast.lucky_color} • Number: ${rashiForecast.lucky_number}`
                      : `${getPanchangDetail('paksha', 'Krishna Paksha')} • ${getPanchangDetail('tithi', 'Ekadashi Tithi')}`
                    }
                  </Text>
                </View>
              </View>
            </View>

            {/* Floating circular toggle arrow */}
            <View style={[
              styles.circularToggleButton,
              {
                backgroundColor: isCollapsed ? '#ffffff' : '#ea580c',
                borderWidth: isCollapsed ? 1.5 : 0,
                borderColor: '#ea580c',
              }
            ]}>
              <Ionicons
                name={isCollapsed ? "chevron-down" : "chevron-up"}
                size={18}
                color={isCollapsed ? "#ea580c" : "#ffffff"}
              />
            </View>
          </TouchableOpacity>

          {/* Collapsible Details (vertical list) */}
          <Animated.View
            style={{
              height: panchangMaxHeight,
              overflow: 'hidden',
              width: '100%',
              zIndex: 1,
            }}
          >
            <Animated.View
              style={[
                styles.panchangDetailsInner,
                { transform: [{ translateY }] }
              ]}
            >
              <Animated.View style={{ opacity: panchangOpacity, width: '100%' }}>
                <View 
                  style={{ width: '100%', paddingHorizontal: 4 }}
                  onLayout={(event) => {
                    const { height } = event.nativeEvent.layout;
                    const paddedHeight = height + 12;
                    if (height > 0 && Math.abs(detailsHeight - paddedHeight) > 1) {
                      setDetailsHeight(paddedHeight);
                    }
                  }}
                >
                  {/* Personal Daily Forecast (only if rashiForecast is available) */}
                  {rashiForecast && (
                    <View style={styles.horoscopeForecastCard}>
                      <View style={styles.horoscopeForecastHeader}>
                        <Ionicons name="sparkles" size={14} color="#ea580c" style={{ marginRight: 6 }} />
                        <Text style={styles.horoscopeForecastTitle}>{t("Your Daily Forecast")}</Text>
                      </View>
                      <Text style={styles.horoscopeForecastText} numberOfLines={6} ellipsizeMode="tail">
                        {rashiForecast.content}
                      </Text>
                    </View>
                  )}

                  {/* Sunrise & Sunset / Moonrise & Moonset Row (only in general Panchang mode) */}
                  {!rashiForecast && (
                    <View style={styles.sunMoonRow}>
                      {/* Sunrise & Sunset Card */}
                      <View style={styles.sunMoonCardContainer}>
                        <View style={styles.sunMoonCardHeader}>
                          <Ionicons name="sunny-outline" size={14} color="#ea580c" style={{ marginRight: 2 }} />
                          <Text style={[styles.sunMoonCardHeaderTitle, { color: '#ea580c' }]}>{t("Sunrise & Sunset")}</Text>
                        </View>
                        <View style={styles.sunMoonCardBody}>
                          <View style={styles.sunMoonCol}>
                            <Ionicons name="sunny-outline" size={18} color="#f59e0b" style={{ marginBottom: 2 }} />
                            <Text style={styles.sunMoonLabelText}>{t("Sunrise")}</Text>
                            {renderTimeText(getPanchangDetail('sunrise', '05:42 AM'))}
                          </View>
                          <View style={styles.sunMoonInnerDivider} />
                          <View style={styles.sunMoonCol}>
                            <Ionicons name="sunny" size={18} color="#d97706" style={{ marginBottom: 2 }} />
                            <Text style={styles.sunMoonLabelText}>{t("Sunset")}</Text>
                            {renderTimeText(getPanchangDetail('sunset', '06:59 PM'))}
                          </View>
                        </View>
                      </View>

                      {/* Moonrise & Moonset Card */}
                      <View style={styles.sunMoonCardContainer}>
                        <View style={styles.sunMoonCardHeader}>
                          <Ionicons name="moon-outline" size={14} color="#4f46e5" style={{ marginRight: 2 }} />
                          <Text style={[styles.sunMoonCardHeaderTitle, { color: '#4f46e5' }]}>{t("Moonrise & Moonset")}</Text>
                        </View>
                        <View style={styles.sunMoonCardBody}>
                          <View style={styles.sunMoonCol}>
                            <Ionicons name="moon-outline" size={18} color="#4f46e5" style={{ marginBottom: 2 }} />
                            <Text style={styles.sunMoonLabelText}>{t("Moonrise")}</Text>
                            {renderTimeText(getPanchangDetail('moonrise', '09:14 PM'))}
                          </View>
                          <View style={styles.sunMoonInnerDivider} />
                          <View style={styles.sunMoonCol}>
                            <Ionicons name="moon" size={18} color="#1e1b4b" style={{ marginBottom: 2 }} />
                            <Text style={styles.sunMoonLabelText}>{t("Moonset")}</Text>
                            {renderTimeText(getPanchangDetail('moonset', '08:10 AM'))}
                          </View>
                        </View>
                      </View>
                    </View>
                  )}

                  {/* Today's Auspicious Information */}
                  <View style={styles.auspiciousCard}>
                    <View style={styles.auspiciousHeader}>
                      <Ionicons name="sparkles" size={14} color="#d97706" />
                      <Text style={styles.auspiciousTitle}>
                        {rashiForecast ? t("Your Lucky Indicators") : t("Today's Auspicious Information")}
                      </Text>
                    </View>
                    <View style={styles.auspiciousGrid}>
                      <View style={styles.auspiciousItem}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.auspiciousLabel}>{t("Shubh Color")}</Text>
                          <Text style={styles.auspiciousValue}>
                            {t(rashiForecast ? rashiForecast.lucky_color : weekdayRec.color)}
                          </Text>
                        </View>
                        <View style={[
                          styles.colorCircle, 
                          { backgroundColor: getColorHex(rashiForecast ? rashiForecast.lucky_color : weekdayRec.color) }
                        ]} />
                      </View>
                      <View style={styles.auspiciousItem}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.auspiciousLabel}>{t("Lucky Number")}</Text>
                          <Text style={styles.auspiciousValue}>
                            {rashiForecast ? rashiForecast.lucky_number : weekdayRec.number}
                          </Text>
                        </View>
                        <View style={styles.numberCircle}>
                          <Text style={styles.numberCircleText}>
                            {rashiForecast ? rashiForecast.lucky_number : weekdayRec.number}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  {/* Today's Choghadiya */}
                  <TouchableOpacity
                    style={styles.choghadiyaCard}
                    activeOpacity={0.9}
                    onPress={() => router.push('/panchang')}
                  >
                    <View style={styles.choghadiyaHeader}>
                      <View style={styles.choghadiyaTitleRow}>
                        <Ionicons name="time-outline" size={14} color="#15803d" />
                        <Text style={styles.choghadiyaTitle}>{t("Today's Choghadiya")}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.choghadiyaViewAll}
                        activeOpacity={0.7}
                        onPress={(e) => {
                          e.stopPropagation();
                          setIsChoghadiyaModalVisible(true);
                        }}
                      >
                        <Text style={styles.choghadiyaViewAllText}>{t("View All")} ↗</Text>
                      </TouchableOpacity>
                    </View>
                    <View style={styles.choghadiyaGrid}>
                      <TouchableOpacity
                        style={styles.muhuratCard}
                        activeOpacity={0.8}
                        onPress={(e) => {
                          e.stopPropagation();
                          setIsChoghadiyaModalVisible(true);
                        }}
                      >
                        <View style={styles.muhuratHeader}>
                          <View style={styles.muhuratDot} />
                          <Text style={styles.muhuratLabel}>{t("Current Muhurat")}</Text>
                        </View>
                        <Text style={styles.muhuratName}>{t(currentMuhurat?.name || 'Amrit')}</Text>
                        <Text style={styles.muhuratTime}>{currentMuhurat?.time || '09:30 AM - 11:00 AM'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.muhuratCard}
                        activeOpacity={0.8}
                        onPress={(e) => {
                          e.stopPropagation();
                          setIsChoghadiyaModalVisible(true);
                        }}
                      >
                        <View style={styles.muhuratHeader}>
                          <View style={[styles.muhuratDot, { backgroundColor: '#94a3b8' }]} />
                          <Text style={styles.muhuratLabel}>{t("Next Muhurat")}</Text>
                        </View>
                        <Text style={[styles.muhuratName, { color: '#0284c7' }]}>{t(nextMuhurat?.name || 'Shubh')}</Text>
                        <Text style={styles.muhuratTime}>{nextMuhurat?.time || '11:00 AM - 12:30 PM'}</Text>
                      </TouchableOpacity>
                    </View>
                  </TouchableOpacity>

                  {/* Today's Daan / Remedy */}
                  <TouchableOpacity
                    style={styles.remedyCardFull}
                    activeOpacity={0.95}
                    onPress={() => {
                      const activeDaan = dailyDaan || {
                        id: 'fallback',
                        title: rashiForecast ? t("Daily Astro Remedy") : t(weekdayRec.daan),
                        description: rashiForecast ? rashiForecast.remedy : t(weekdayRec.daan),
                        benefit: rashiForecast ? t("Planetary Alignment & Remedial Healing") : t(weekdayRec.daanBenefit),
                        color: weekdayRec.color,
                        lucky_number: weekdayRec.number,
                        mantra: weekdayRec.mantra,
                        price: 251,
                        weekday: currentDayName
                      };
                      router.push({
                        pathname: '/daan_detail',
                        params: { daanData: JSON.stringify(activeDaan) }
                      });
                    }}
                  >
                    <View style={styles.remedyHeader}>
                      <Ionicons 
                        name={userRashi ? "shield-checkmark-outline" : "gift-outline"} 
                        size={14} 
                        color="#ea580c" 
                      />
                      <Text style={styles.remedyTitle}>
                        {userRashi ? t("Your Rashi Daan") : t("Today's Daan")}
                      </Text>
                    </View>
                    <Text style={styles.remedyValueFull} numberOfLines={2} ellipsizeMode="tail">
                      {dailyDaan ? dailyDaan.title : (rashiForecast ? rashiForecast.remedy : t(weekdayRec.daan))}
                    </Text>
                    <Text style={styles.remedyBenefitFull} numberOfLines={1}>
                      {dailyDaan ? dailyDaan.benefit : (rashiForecast ? t("Remedial Planetary Healing") : t(weekdayRec.daanBenefit))}
                    </Text>
                    <Image
                      source={require('../../assets/havan.png')}
                      style={styles.remedyImageFull}
                      contentFit="contain"
                    />
                  </TouchableOpacity>

                  {/* Mantra & Bhajan of the Day (Combined Section) */}
                  <View style={styles.daanBhajanRow}>
                    <View style={styles.mantraCardHalf}>
                      <View style={styles.mantraHeader}>
                        <Ionicons name="flower-outline" size={14} color="#7c3aed" />
                        <Text style={styles.mantraTitle}>{t("Shubh Mantra")}</Text>
                      </View>
                      <Text style={styles.mantraTextHalf} numberOfLines={1}>
                        {weekdayRec.mantra}
                      </Text>
                      <View style={styles.mantraHalfButtonsRow}>
                        <TouchableOpacity
                          style={styles.mantraButtonListenHalf}
                          activeOpacity={0.8}
                          onPress={handleListenMantra}
                        >
                          <Ionicons name={isMantraPlaying ? "pause" : "play"} size={13} color="#ffffff" style={{ marginRight: 3 }} />
                          <Text style={styles.mantraButtonListenTextHalf}>{isMantraPlaying ? t("Pause") : t("Listen")}</Text>
                        </TouchableOpacity>
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.bhajanCard}
                      activeOpacity={0.9}
                      onPress={() => {
                        router.push('/music');
                      }}
                    >
                      <View style={styles.bhajanHeader}>
                        <Ionicons name="musical-notes-outline" size={14} color="#2563eb" />
                        <Text style={styles.bhajanTitle}>{t("Bhajan of the Day")}</Text>
                      </View>
                      <Text style={styles.bhajanName} numberOfLines={1}>
                        {dailyBhajan ? dailyBhajan.title : t(weekdayRec.bhajan)}
                      </Text>
                      <TouchableOpacity
                        style={styles.bhajanPlayBtn}
                        activeOpacity={0.8}
                        onPress={(e) => {
                          e.stopPropagation();
                          handlePlayPauseBhajan();
                        }}
                      >
                        <Ionicons name={isBhajanPlaying ? "pause" : "play"} size={13} color="#ffffff" style={{ marginRight: 3 }} />
                        <Text style={styles.bhajanPlayText}>{isBhajanPlaying ? t("Pause") : t("Play Bhajan")}</Text>
                      </TouchableOpacity>
                    </TouchableOpacity>
                  </View>
                </View>
              </Animated.View>
            </Animated.View>
          </Animated.View>

          {/* Integrated CTA Footer */}
          <TouchableOpacity
            style={[styles.panchangCTAFooter, { zIndex: 10 }]}
            activeOpacity={0.8}
            onPress={handleSharePanchang}
          >
            <Ionicons name="share-social" size={15} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.panchangCTAFooterText}>
              {rashiForecast ? t("Share Daily Rashifal") : t("Share Today's Panchang")}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginLeft: 10 }}>
              <Ionicons name="logo-whatsapp" size={15} color="#ffffff" />
              <Ionicons name="logo-instagram" size={15} color="#ffffff" />
              <Ionicons name="logo-facebook" size={15} color="#ffffff" />
            </View>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {activeReview && (
        <ReviewVideoModal
          url={activeReview.video_url}
          devoteeName={activeReview.devotee_name}
          pujaName={activeReview.puja_name}
          onClose={() => setActiveReview(null)}
        />
      )}

      {isChoghadiyaModalVisible && (
        <Modal
          visible={isChoghadiyaModalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setIsChoghadiyaModalVisible(false)}
        >
          <View style={styles.choghadiyaModalOverlay}>
            <TouchableOpacity
              style={styles.choghadiyaModalCloseArea}
              activeOpacity={1}
              onPress={() => setIsChoghadiyaModalVisible(false)}
            />
            <View style={[styles.choghadiyaModalContent, { paddingBottom: Math.max(insets.bottom, 16) }]}>
              {/* Drag handle decoration */}
              <View style={styles.choghadiyaModalIndicator} />
              
              <View style={styles.choghadiyaModalHeader}>
                <View style={styles.choghadiyaModalTitleGroup}>
                  <Ionicons name="time" size={22} color="#15803d" />
                  <View style={{ marginLeft: 8 }}>
                    <Text style={styles.choghadiyaModalTitle}>{t("Choghadiya Muhurats")}</Text>
                    <Text style={styles.choghadiyaModalSubtitle}>
                      {getPanchangDetail('date', new Date().toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' }))} ({t(currentDayName)})
                    </Text>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.choghadiyaModalCloseBtn}
                  onPress={() => setIsChoghadiyaModalVisible(false)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle" size={26} color="#94a3b8" />
                </TouchableOpacity>
              </View>

              {/* Day/Night Tabs */}
              <View style={styles.choghadiyaModalTabs}>
                <TouchableOpacity
                  style={[
                    styles.choghadiyaModalTab,
                    choghadiyaModalTab === 'day' && styles.choghadiyaModalTabActiveDay
                  ]}
                  onPress={() => setChoghadiyaModalTab('day')}
                  activeOpacity={0.85}
                >
                  <Ionicons 
                    name="sunny" 
                    size={16} 
                    color={choghadiyaModalTab === 'day' ? '#ffffff' : '#eab308'} 
                  />
                  <Text style={[
                    styles.choghadiyaModalTabText,
                    choghadiyaModalTab === 'day' && styles.choghadiyaModalTabTextActive
                  ]}>
                    {t("Day Timings")}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.choghadiyaModalTab,
                    choghadiyaModalTab === 'night' && styles.choghadiyaModalTabActiveNight
                  ]}
                  onPress={() => setChoghadiyaModalTab('night')}
                  activeOpacity={0.85}
                >
                  <Ionicons 
                    name="moon" 
                    size={16} 
                    color={choghadiyaModalTab === 'night' ? '#ffffff' : '#7c3aed'} 
                  />
                  <Text style={[
                    styles.choghadiyaModalTabText,
                    choghadiyaModalTab === 'night' && styles.choghadiyaModalTabTextActive
                  ]}>
                    {t("Night Timings")}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Muhurats List */}
              <ScrollView 
                style={styles.choghadiyaModalScroll}
                contentContainerStyle={styles.choghadiyaModalScrollContent}
                showsVerticalScrollIndicator={false}
              >
                {choghadiyaData?.chaughadiya?.[choghadiyaModalTab]?.map((slot: any, idx: number) => {
                  const isActive = checkIfSlotActive(slot.time, choghadiyaModalTab === 'night');
                  const mName = slot.muhurta.toLowerCase();
                  const isAusp = mName.includes('amrit') || mName.includes('shubh') || mName.includes('labh');
                  const isNeut = mName.includes('char') || mName.includes('chal');
                  
                  let badgeBg = '#fee2e2';
                  let badgeText = '#b91c1c';
                  let badgeLabel = t('Inauspicious');
                  if (isAusp) {
                    badgeBg = '#dcfce7';
                    badgeText = '#15803d';
                    badgeLabel = t('Auspicious');
                  } else if (isNeut) {
                    badgeBg = '#fef9c3';
                    badgeText = '#854d0e';
                    badgeLabel = t('Neutral');
                  }

                  return (
                    <View 
                      key={idx} 
                      style={[
                        styles.choghadiyaModalSlotRow,
                        isActive && styles.choghadiyaModalSlotRowActive
                      ]}
                    >
                      <View style={styles.choghadiyaModalSlotLeft}>
                        {isActive ? (
                          <View style={styles.choghadiyaActiveSlotIndicatorContainer}>
                            <View style={styles.choghadiyaActiveSlotIndicatorPulse} />
                            <Text style={styles.choghadiyaActiveSlotText}>{t("ACTIVE")}</Text>
                          </View>
                        ) : (
                          <View style={styles.choghadiyaSlotDotPlaceholder} />
                        )}
                        <View style={{ flex: 1, marginLeft: 8 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <Text style={styles.choghadiyaModalSlotName}>{t(slot.muhurta)}</Text>
                            <View style={[styles.choghadiyaModalBadge, { backgroundColor: badgeBg }]}>
                              <Text style={[styles.choghadiyaModalBadgeText, { color: badgeText }]}>
                                {badgeLabel}
                              </Text>
                            </View>
                          </View>
                          <Text style={styles.choghadiyaModalSlotTime}>{formatTo12h(slot.time)}</Text>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </ScrollView>

              {/* Social Share Button */}
              <TouchableOpacity
                style={styles.choghadiyaModalShareBtn}
                activeOpacity={0.8}
                onPress={handleShareChoghadiya}
              >
                <Ionicons name="share-social" size={18} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.choghadiyaModalShareBtnText}>{t("Share Choghadiya Timings")}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      <DraggableCalendarButton />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  topSection: {
    height: height * 0.42,
    width: '100%',
  },
  bannerBackground: {
    flex: 1,
    width: '100%',
  },
  searchContainer: {
    paddingHorizontal: 20,
    zIndex: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    height: 46,
    paddingHorizontal: 15,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontFamily: 'Outfit-Regular',
    fontSize: 14,
  },
  bannerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    paddingBottom: 10,
  },
  bannerDate: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Outfit-SemiBold',
    marginBottom: 4,
    opacity: 0.8,
  },
  bannerTitle: {
    color: '#fbbf24',
    fontSize: 22,
    fontFamily: 'Outfit-ExtraBold',
    textAlign: 'center',
    marginBottom: 6,
  },
  bannerSubtitle: {
    color: '#fff',
    fontSize: 13,
    fontFamily: 'Outfit-Medium',
    textAlign: 'center',
    lineHeight: 18,
    opacity: 0.9,
  },
  bannerCTAButton: {
    marginTop: 12,
    backgroundColor: '#ea580c',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  bannerCTAButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Outfit-Bold',
  },
  actionsContainer: {
    backgroundColor: '#ffffff',
    paddingTop: 12,
    paddingBottom: 10,
    marginBottom: 24,
  },
  actionsHeader: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  actionsHeaderTitle: {
    fontSize: 19,
    fontFamily: 'Outfit-Bold',
    color: '#000000',
    letterSpacing: -0.3,
  },
  actionsScrollContainer: {
    flex: 1,
  },
  actionsScroll: {
    paddingHorizontal: 20,
    gap: 16,
  },
  actionItem: {
    alignItems: 'center',
    width: 75,
  },
  smallBox: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  orangeBox: {
    backgroundColor: 'transparent',
    padding: 0,
  },
  circularBox: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  actionImage: {
    width: '100%',
    height: '100%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  orangeBoxImage: {
    width: '100%',
    height: '100%',
    transform: [{ scale: 2.15 }],
  },
  circularBoxImage: {
    width: '85%',
    height: '85%',
  },
  largeActionImage: {
    transform: [{ scale: 1.35 }],
  },
  actionTitle: {
    color: '#475569',
    fontSize: 12.5,
    fontFamily: 'Outfit-Regular',
    textAlign: 'center',
    letterSpacing: 0,
  },
  storeCardContainer: {
    marginHorizontal: 20,
    backgroundColor: '#fff7ed',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: '#ffedd5',
    paddingVertical: 16,
    paddingHorizontal: 0,
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    overflow: 'hidden',
    marginBottom: 24,
  },
  storeHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
    paddingHorizontal: 14,
  },
  storeLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  storeLogoBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeLogoText: {
    color: '#ffffff',
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
  },
  storeLogoTitle: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
    color: '#000000',
    letterSpacing: -0.3,
  },
  viewAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingRight: 14,
  },
  viewAllText: {
    color: '#0284c7',
    fontSize: 11,
    fontFamily: 'Outfit-Bold',
  },
  storeSubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 12,
    paddingHorizontal: 14,
  },
  checkmarkIcon: {
    marginTop: 1,
  },
  storeSubHeaderText: {
    fontSize: 12.5,
    fontFamily: 'Outfit-Regular',
    color: '#64748b',
  },
  storeSubHeaderTextOrange: {
    color: '#ea580c',
  },
  storeScroll: {
    paddingHorizontal: 16,
    gap: 12,
  },
  productCard: {
    width: 110,
    marginRight: 2,
  },
  productImageContainer: {
    width: 110,
    height: 110,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 6,
    borderWidth: 1,
    borderColor: '#fed7aa', // Premium soft saffron border
    position: 'relative',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productImagePlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 22,
    height: 22,
    borderRadius: 11, // Circular add button
    backgroundColor: '#ea580c', // Solid vibrant saffron background
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    marginBottom: 4,
    minHeight: 34,
  },
  tilakBox: {
    width: 10,
    height: 12,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    borderTopWidth: 0,
    borderColor: '#f97316', // Saffron U-shaped Chandan
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
    marginRight: 2,
  },
  tilakDotInner: {
    width: 3.5,
    height: 5,
    borderRadius: 1.75,
    backgroundColor: '#dc2626', // Sacred red Kumkum vermilion dot
    marginTop: -1,
  },
  itemTitle: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    color: '#0f172a',
    flex: 1,
    lineHeight: 15,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 4,
  },
  originalPrice: {
    fontSize: 10.5,
    fontFamily: 'Outfit-Medium',
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  priceBadge: {
    backgroundColor: '#ffd60a',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderWidth: 1,
    borderColor: '#000000',
    borderRadius: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  priceBadgeText: {
    fontSize: 10.5,
    fontFamily: 'Outfit-ExtraBold',
    color: '#000000',
  },
  ratingBadge: {
    backgroundColor: '#fff7ed', // Soft warm amber background
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
    borderWidth: 0.5,
    borderColor: '#ffedd5',
  },
  ratingText: {
    fontSize: 8.5,
    fontFamily: 'Outfit-Bold',
    color: '#ea580c', // Bright saffron star/rating color
  },
  cardDivider: {
    width: 20,
    height: 1.5,
    backgroundColor: '#fed7aa', // Beautiful warm saffron divider
    marginBottom: 4,
    borderRadius: 1,
  },
  providerText: {
    fontSize: 9,
    fontFamily: 'Outfit-SemiBold',
    color: '#c2410c', // Elegant deep orange-700 for sacred temple/brand name
  },
  solutionsContainer: {
    marginBottom: 24,
  },
  solutionsHeaderTitle: {
    fontSize: 19,
    fontFamily: 'Outfit-Bold',
    color: '#000000',
    paddingHorizontal: 20,
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  solutionsScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  solutionCard: {
    width: 95,
    height: 125,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 0,
    paddingTop: 10,
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
    overflow: 'hidden',
  },
  solutionCardTitle: {
    fontSize: 11,
    fontFamily: 'Outfit-Bold',
    textAlign: 'center',
    lineHeight: 13.5,
    paddingHorizontal: 6,
  },
  solutionImageContainer: {
    width: '100%',
    height: 70,
    overflow: 'hidden',
  },
  solutionGradient: {
    flex: 1,
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  solutionImage: {
    width: '100%',
    height: '100%',
    transform: [{ scale: 1.05 }],
  },
  bannersContainer: {
    marginBottom: 24,
  },
  bannersScroll: {
    paddingHorizontal: 20,
    gap: 12,
  },
  promoCard: {
    width: width - 50,
    height: 138,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.07,
    shadowRadius: 8,
    elevation: 2,
  },
  promoImage: {
    width: '100%',
    height: '100%',
  },
  promoLeft: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 2,
  },
  promoBrand: {
    fontSize: 11,
    fontFamily: 'Outfit-Medium',
    color: '#94a3b8',
    marginBottom: 1,
  },
  promoTitle: {
    fontSize: 18,
    fontFamily: 'Outfit-ExtraBold',
    lineHeight: 22,
    marginBottom: 2,
  },
  promoSubtitle: {
    fontSize: 11.5,
    fontFamily: 'Outfit-Medium',
    color: '#64748b',
    marginBottom: 8,
  },
  promoButton: {
    backgroundColor: '#3d3d1a',
    borderRadius: 100,
    paddingHorizontal: 14,
    paddingVertical: 7,
    alignSelf: 'flex-start',
  },
  promoButtonText: {
    color: '#ffffff',
    fontSize: 10,
    fontFamily: 'Outfit-Bold',
    letterSpacing: 0.5,
  },
  promoTnc: {
    fontSize: 7.5,
    color: '#cbd5e1',
    marginTop: 3,
  },
  promoRight: {
    width: 120,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  promoIconBg: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  promoBrandBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: '#ffffff',
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 3,
  },
  promoBrandBadgeText: {
    fontSize: 18,
  },
  paginationDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 20,
    backgroundColor: '#ea580c',
  },
  inactiveDot: {
    width: 6,
    backgroundColor: '#e2e8f0',
  },

  shopStoreSection: {
    backgroundColor: '#ffffff',
    marginBottom: 24,
  },
  shopStoreHeader: {
    paddingHorizontal: 20,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  shopStoreTitle: {
    fontSize: 19,
    fontFamily: 'Outfit-Bold',
    color: '#000000',
    letterSpacing: -0.3,
  },
  shopStoreViewAllText: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    color: '#ea580c', // Saffron orange
  },
  shopStoreScroll: {
    paddingHorizontal: 20,
    gap: 16,
  },
  shopStoreCard: {
    alignItems: 'center',
    width: 95,
  },
  storeArchContainer: {
    width: 95,
    height: 95,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeArchImage: {
    width: '100%',
    height: '115%',
  },
  shopStoreName: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    color: '#334155',
    textAlign: 'center',
    marginTop: 2,
    lineHeight: 15,
  },
  videoReviewsSection: {
    backgroundColor: '#ffffff',
    marginBottom: 24,
  },
  videoReviewsHeader: {
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  videoReviewsTitle: {
    fontSize: 19,
    fontFamily: 'Outfit-Bold',
    color: '#000000',
    letterSpacing: -0.3,
  },
  videoReviewsSubtitle: {
    fontSize: 12.5,
    fontFamily: 'Outfit-Regular',
    color: '#64748b',
    marginTop: 4,
  },
  videoReviewsScroll: {
    paddingHorizontal: 20,
    gap: 14,
  },
  videoReviewCard: {
    width: 145,
    height: 230,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#1e293b',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  videoThumbnail: {
    ...StyleSheet.absoluteFillObject,
  },
  durationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 3,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    zIndex: 15,
  },
  durationIcon: {
    marginTop: 0.5,
  },
  durationText: {
    color: '#ffffff',
    fontSize: 9,
    fontFamily: 'Outfit-Bold',
  },
  playIconContainer: {
    position: 'absolute',
    alignSelf: 'center',
    top: '40%',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderWidth: 1.5,
    borderColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  playIcon: {
    marginLeft: 2, // Compensate visual off-center of play arrow
  },
  videoTextContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    zIndex: 12,
  },
  videoRatingLocationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  starBadge: {
    backgroundColor: '#d1fae5',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 1.5,
    borderRadius: 4,
    gap: 2,
  },
  starBadgeText: {
    fontSize: 8.5,
    fontFamily: 'Outfit-Bold',
    color: '#065f46',
  },
  videoLocationText: {
    color: '#cbd5e1',
    fontSize: 10,
    fontFamily: 'Outfit-Medium',
  },
  devoteeNameText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Outfit-Bold',
    lineHeight: 16,
    marginBottom: 2,
  },
  pujaNameText: {
    color: '#fdba74', // Saffron/light orange overlay
    fontSize: 10.5,
    fontFamily: 'Outfit-Bold',
    lineHeight: 13,
  },
  quantityToggleContainer: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 58,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ea580c', // Solid vibrant saffron background
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 3,
    zIndex: 10,
  },
  miniQtyBtn: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  qtyToggleText: {
    color: '#ffffff',
    fontSize: 10,
    fontFamily: 'Outfit-Bold',
    minWidth: 12,
    textAlign: 'center',
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
    shadowColor: '#000',
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
  modalActionBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontFamily: 'Outfit-Bold',
  },
  newSearchContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 6,
    backgroundColor: '#ffffff',
  },
  newSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    height: 40,
    paddingHorizontal: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 1,
  },
  newSearchInput: {
    flex: 1,
    color: '#0f172a',
    fontFamily: 'Outfit-Regular',
    fontSize: 13.5,
    paddingVertical: 0,
  },
  newSearchMic: {
    paddingLeft: 8,
  },
  panchangCardContainer: {
    backgroundColor: '#fffdf9',
    borderWidth: 1.5,
    borderColor: '#fed7aa',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  panchangHeroCard: {
    height: 140, // Reduced from 155 to fit screens and eliminate bottom clipping
    position: 'relative',
  },
  panchangHeroContent: {
    flex: 1,
    padding: 12,
    paddingBottom: 12,
    justifyContent: 'flex-start', // Group elements closer together to eliminate large gaps
    zIndex: 2,
  },
  panchangHeroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  panchangHeroTag: {
    color: '#fef3c7',
    fontSize: 13.5,
    fontFamily: 'Outfit-Bold',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  shareBadgeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  shareBadgeText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontFamily: 'Outfit-Bold',
    marginLeft: 4,
  },
  panchangHeroDate: {
    color: '#ffffff',
    fontSize: 22,
    lineHeight: 25,
    fontFamily: 'Outfit-ExtraBold',
  },
  panchangHeroDay: {
    color: '#ffffff',
    fontSize: 15,
    lineHeight: 17,
    fontFamily: 'Outfit-Bold',
    opacity: 0.9,
    marginTop: 1,
  },
  panchangHeroTithiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4.5,
    borderRadius: 20,
    borderWidth: 0.8,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    marginTop: 8, // Clean gap below the date/day
  },
  panchangHeroTithiText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontFamily: 'Outfit-Bold',
  },
  panchangHeroImage: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 130,
    height: 140, // Matches card height
    zIndex: 1,
  },

  auspiciousCard: {
    backgroundColor: '#fffbeb',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fef3c7',
    padding: 4,
    marginBottom: 3,
  },
  auspiciousHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 4,
  },
  auspiciousTitle: {
    fontSize: 11.5,
    fontFamily: 'Outfit-Bold',
    color: '#b45309',
  },
  auspiciousGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  auspiciousItem: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fef3c7',
    padding: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  auspiciousLabel: {
    fontSize: 9.5,
    fontFamily: 'Outfit-Medium',
    color: '#78350f',
  },
  auspiciousValue: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    color: '#0f172a',
    marginTop: 1,
  },
  colorCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  numberCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#ea580c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberCircleText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontFamily: 'Outfit-Bold',
  },
  mantraCard: {
    backgroundColor: '#faf5ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f3e8ff',
    padding: 6,
    marginBottom: 6,
  },
  mantraHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    gap: 5,
  },
  mantraTitle: {
    fontSize: 12.5,
    fontFamily: 'Outfit-Bold',
    color: '#6d28d9',
  },
  mantraContentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  mantraText: {
    fontSize: 28,
    fontFamily: 'Outfit-ExtraBold',
    color: '#1e1b4b',
    flex: 1,
  },
  mantraButtons: {
    flexDirection: 'column',
    gap: 4,
    alignItems: 'flex-end',
  },
  mantraButtonListen: {
    backgroundColor: '#7c3aed',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    borderRadius: 12,
    gap: 3,
  },
  mantraButtonListenText: {
    color: '#ffffff',
    fontSize: 11,
    fontFamily: 'Outfit-Bold',
  },
  mantraButtonMeaning: {
    borderWidth: 1,
    borderColor: '#7c3aed',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 4.5,
    borderRadius: 12,
    gap: 3,
  },
  mantraButtonMeaningText: {
    color: '#7c3aed',
    fontSize: 10.5,
    fontFamily: 'Outfit-Bold',
  },
  choghadiyaCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dcfce7',
    padding: 4,
    marginBottom: 3,
  },
  choghadiyaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  choghadiyaTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  choghadiyaTitle: {
    fontSize: 11.5,
    fontFamily: 'Outfit-Bold',
    color: '#15803d',
  },
  choghadiyaViewAll: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  choghadiyaViewAllText: {
    fontSize: 10,
    fontFamily: 'Outfit-Bold',
    color: '#15803d',
  },
  choghadiyaGrid: {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'stretch',
  },
  muhuratCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dcfce7',
    padding: 4,
  },
  muhuratHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 1,
  },
  muhuratDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#10b981',
  },
  muhuratLabel: {
    fontSize: 9.5,
    fontFamily: 'Outfit-Medium',
    color: '#64748b',
  },
  muhuratName: {
    fontSize: 12.5,
    fontFamily: 'Outfit-Bold',
    color: '#15803d',
  },
  muhuratTime: {
    fontSize: 9,
    fontFamily: 'Outfit-Regular',
    color: '#475569',
    marginTop: 0.5,
  },
  choghadiyaButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginTop: 6,
  },
  choghadiyaTabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dcfce7',
    borderRadius: 8,
    paddingVertical: 5,
    gap: 4,
  },
  choghadiyaTabBtnActiveDay: {
    backgroundColor: '#eab308',
    borderColor: '#eab308',
  },
  choghadiyaTabBtnActiveNight: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  choghadiyaTabBtnText: {
    fontSize: 10,
    fontFamily: 'Outfit-Bold',
    color: '#475569',
  },
  choghadiyaTabBtnTextActive: {
    color: '#ffffff',
  },
  choghadiyaExpandedList: {
    marginTop: 8,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dcfce7',
    padding: 6,
  },
  choghadiyaSectionTitle: {
    fontSize: 9.5,
    fontFamily: 'Outfit-Bold',
    color: '#15803d',
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#f0fdf4',
    paddingBottom: 4,
  },
  choghadiyaSlotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 6,
    marginBottom: 3,
  },
  choghadiyaSlotRowActive: {
    backgroundColor: '#f0fdf4',
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  choghadiyaSlotLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  activeSlotIndicatorPulse: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
  },
  choghadiyaSlotName: {
    fontSize: 11,
    fontFamily: 'Outfit-Medium',
    color: '#475569',
  },
  muhuratTypeBadge: {
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  muhuratTypeBadgeText: {
    fontSize: 7.5,
    fontFamily: 'Outfit-Bold',
  },
  choghadiyaSlotTime: {
    fontSize: 10,
    fontFamily: 'Outfit-Regular',
    color: '#64748b',
  },
  daanBhajanRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 0,
    alignItems: 'stretch',
  },
  remedyCard: {
    flex: 1,
    backgroundColor: '#fff7ed',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffedd5',
    padding: 5,
    position: 'relative',
    minHeight: 55,
  },
  remedyCardFull: {
    backgroundColor: '#fff7ed',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffedd5',
    padding: 4,
    position: 'relative',
    marginBottom: 3,
    width: '100%',
  },
  remedyValueFull: {
    fontSize: 12.5,
    fontFamily: 'Outfit-Bold',
    color: '#7c2d12',
    maxWidth: '75%',
    marginTop: 2,
  },
  remedyBenefitFull: {
    fontSize: 9.5,
    fontFamily: 'Outfit-Medium',
    color: '#9a3412',
    marginTop: 1,
    maxWidth: '75%',
  },
  remedyImageFull: {
    position: 'absolute',
    right: 8,
    bottom: 6,
    width: 36,
    height: 36,
    opacity: 0.9,
  },
  mantraCardHalf: {
    flex: 1,
    backgroundColor: '#faf5ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#f3e8ff',
    padding: 4,
    position: 'relative',
    minHeight: 48,
  },
  mantraTextHalf: {
    fontSize: 13.5,
    fontFamily: 'Outfit-Bold',
    color: '#1e1b4b',
    marginVertical: 4,
  },
  mantraHalfButtonsRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 2,
  },
  mantraButtonListenHalf: {
    backgroundColor: '#7c3aed',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5.5,
    borderRadius: 12,
  },
  mantraButtonListenTextHalf: {
    color: '#ffffff',
    fontSize: 11.5,
    fontFamily: 'Outfit-Bold',
  },
  mantraButtonMeaningHalf: {
    borderWidth: 1,
    borderColor: '#7c3aed',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  mantraButtonMeaningTextHalf: {
    color: '#7c3aed',
    fontSize: 9.5,
    fontFamily: 'Outfit-Bold',
  },
  bhajanCard: {
    flex: 1,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#dbeafe',
    padding: 4,
    position: 'relative',
    minHeight: 48,
  },
  remedyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 2,
  },
  remedyTitle: {
    fontSize: 11.5,
    fontFamily: 'Outfit-Bold',
    color: '#c2410c',
  },
  remedyValue: {
    fontSize: 12.5,
    fontFamily: 'Outfit-Bold',
    color: '#7c2d12',
    maxWidth: '65%',
  },
  remedyBenefit: {
    fontSize: 9.5,
    fontFamily: 'Outfit-Medium',
    color: '#9a3412',
    marginTop: 1,
    maxWidth: '65%',
  },
  remedyImage: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 32,
    height: 32,
    opacity: 0.9,
  },
  bhajanHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 2,
  },
  bhajanTitle: {
    fontSize: 11,
    fontFamily: 'Outfit-Bold',
    color: '#1d4ed8',
  },
  bhajanName: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    color: '#1e3a8a',
    maxWidth: '95%',
    marginBottom: 3,
  },
  bhajanPlayBtn: {
    backgroundColor: '#2563eb',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 5.5,
    borderRadius: 12,
    alignSelf: 'flex-start',
    gap: 2.5,
  },
  bhajanPlayText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontFamily: 'Outfit-Bold',
  },
  bhajanImage: {
    position: 'absolute',
    right: 4,
    bottom: 4,
    width: 32,
    height: 32,
    borderRadius: 6,
    opacity: 0.9,
  },
  panchangCTAFooter: {
    backgroundColor: '#ea580c',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 48,
    gap: 4,
  },
  panchangCTAFooterText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontFamily: 'Outfit-Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sunMoonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    marginBottom: 4,
  },
  sunMoonCardContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1.2,
    borderColor: '#fed7aa',
    borderRadius: 12,
    padding: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  sunMoonCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    marginBottom: 4,
    borderBottomWidth: 0.5,
    borderBottomColor: '#f3f4f6',
    paddingBottom: 2,
  },
  sunMoonCardHeaderTitle: {
    fontSize: 9.5,
    fontFamily: 'Outfit-Bold',
  },
  sunMoonCardBody: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  sunMoonCol: {
    alignItems: 'center',
    gap: 1.5,
    flex: 1,
  },
  sunMoonLabelText: {
    fontSize: 8,
    fontFamily: 'Outfit-Medium',
    color: '#64748b',
  },
  sunMoonTimeText: {
    fontSize: 9.5,
    fontFamily: 'Outfit-Bold',
    color: '#0f172a',
  },
  sunMoonInnerDivider: {
    width: 0.8,
    height: 28,
    backgroundColor: '#fed7aa',
    opacity: 0.5,
  },
  panchangDetailsInner: {
    backgroundColor: '#fffdf9',
    paddingHorizontal: 8,
    paddingTop: 6,
    paddingBottom: 8,
    overflow: 'hidden',
  },
  choghadiyaViewAllCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dcfce7',
    padding: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  choghadiyaViewAllCardText: {
    fontSize: 10.5,
    fontFamily: 'Outfit-Bold',
    color: '#15803d',
    marginTop: 2,
  },
  absoluteCard: {
    position: 'absolute',
    top: 4,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    zIndex: 5,
  },
  circularToggleButton: {
    position: 'absolute',
    bottom: -16,
    left: '50%',
    transform: [{ translateX: -16 }],
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 4,
    zIndex: 20,
  },
  pagerDotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
    marginBottom: 4,
    width: '100%',
  },
  pagerDot: {
    height: 6,
    borderRadius: 3,
  },
  pagerDotActive: {
    width: 14,
    backgroundColor: '#ea580c',
  },
  pagerDotInactive: {
    width: 6,
    backgroundColor: '#fed7aa',
  },
  horoscopeForecastCard: {
    backgroundColor: '#fff7ed',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#ffedd5',
    padding: 8,
    marginBottom: 4,
  },
  horoscopeForecastHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  horoscopeForecastTitle: {
    fontSize: 12.5,
    fontFamily: 'Outfit-Bold',
    color: '#ea580c',
  },
  horoscopeForecastText: {
    fontSize: 12,
    fontFamily: 'Outfit-Regular',
    color: '#334155',
    lineHeight: 16,
  },
  choghadiyaModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  choghadiyaModalCloseArea: {
    flex: 1,
  },
  choghadiyaModalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 12,
    maxHeight: '80%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  choghadiyaModalIndicator: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#e2e8f0',
    alignSelf: 'center',
    marginBottom: 12,
  },
  choghadiyaModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  choghadiyaModalTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  choghadiyaModalTitle: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
    color: '#0f172a',
  },
  choghadiyaModalSubtitle: {
    fontSize: 12,
    fontFamily: 'Outfit-Regular',
    color: '#64748b',
    marginTop: 2,
  },
  choghadiyaModalCloseBtn: {
    padding: 4,
  },
  choghadiyaModalTabs: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  choghadiyaModalTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingVertical: 10,
    gap: 6,
  },
  choghadiyaModalTabActiveDay: {
    backgroundColor: '#eab308',
    borderColor: '#eab308',
  },
  choghadiyaModalTabActiveNight: {
    backgroundColor: '#7c3aed',
    borderColor: '#7c3aed',
  },
  choghadiyaModalTabText: {
    fontSize: 13,
    fontFamily: 'Outfit-Bold',
    color: '#475569',
  },
  choghadiyaModalTabTextActive: {
    color: '#ffffff',
  },
  choghadiyaModalScroll: {
    maxHeight: 320,
  },
  choghadiyaModalScrollContent: {
    paddingBottom: 16,
  },
  choghadiyaModalSlotRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  choghadiyaModalSlotRowActive: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    borderWidth: 1,
    shadowColor: '#10b981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  choghadiyaModalSlotLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  choghadiyaActiveSlotIndicatorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 50,
  },
  choghadiyaActiveSlotIndicatorPulse: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22c55e',
  },
  choghadiyaActiveSlotText: {
    fontSize: 8,
    fontFamily: 'Outfit-Bold',
    color: '#22c55e',
    marginTop: 2,
  },
  choghadiyaSlotDotPlaceholder: {
    width: 50,
    alignItems: 'center',
  },
  choghadiyaModalSlotName: {
    fontSize: 15,
    fontFamily: 'Outfit-Bold',
    color: '#1e293b',
  },
  choghadiyaModalBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  choghadiyaModalBadgeText: {
    fontSize: 9,
    fontFamily: 'Outfit-Bold',
  },
  choghadiyaModalSlotTime: {
    fontSize: 12,
    fontFamily: 'Outfit-Regular',
    color: '#64748b',
    marginTop: 2,
  },
  choghadiyaModalShareBtn: {
    backgroundColor: '#7c3aed',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
    shadowColor: '#7c3aed',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  choghadiyaModalShareBtnText: {
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
    color: '#ffffff',
  },
});
