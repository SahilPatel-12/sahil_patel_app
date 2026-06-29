import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  LayoutAnimation,
  Platform,
  UIManager,
  StatusBar,
  ActivityIndicator,
  Modal,
  Image,
  TextInput,
  ImageBackground,
  Animated,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "../../constants/Colors";
import { useLanguage } from "../../context/LanguageContext";
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { usePlayback } from '../../context/PlaybackContext';
import { bhajanSupabase } from '../../services/bhajanSupabase';
import { supabase } from '../../services/supabase';
import { useLocalSearchParams, router } from 'expo-router';
import DraggableCalendarButton from "../../components/DraggableCalendarButton";
import AndroidWheelPicker from "../../components/AndroidWheelPicker";
import { AlarmSystem } from '../../services/AlarmSystem';
import { BlurView } from 'expo-blur';
import Svg, { Path, Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const { width, height } = Dimensions.get('window');

// Map categories to high-resolution, photographic deity images from assets/God
const getDeityAvatar = (name: string, iconUrl?: string) => {
  if (iconUrl && iconUrl.trim() !== '') {
    return { uri: iconUrl };
  }
  const normalized = name.toLowerCase();
  if (normalized.includes('shiv')) return require('../../assets/God/god1.png');
  if (normalized.includes('laxmi') || normalized.includes('lakshmi')) return require('../../assets/God/god.png');
  if (normalized.includes('ganesh')) return require('../../assets/God/Mahakal Ujjain.png');
  if (normalized.includes('hanuman')) return require('../../assets/God/_ (5).jpeg');
  if (normalized.includes('durga')) return require('../../assets/God/Kedarnath.png');
  if (normalized.includes('krishna')) return require('../../assets/God/Omkarashwar.png');
  if (normalized.includes('venkat')) return require('../../assets/God/Lord Venkateswara Images Full Hd Wallpaper 1.png');
  return require('../../assets/God/god1.png'); // Default fallback
};

export default function MusicScreen() {
  const { t } = useLanguage();
  const { playTrackId, search } = useLocalSearchParams<{ playTrackId?: string; search?: string }>();

  // Consume Global Playback Context
  const {
    player,
    status,
    tracks,
    setTracks,
    activeTrackIndex,
    setActiveTrackIndex,
    activeTrack,
    playbackSpeed,
    setPlaybackSpeed,
    playerVolume,
    setPlayerVolume,
    playTrack
  } = usePlayback();

  // Dynamic Chants and Categories state
  const [categories, setCategories] = useState<{name: string, icon_url?: string}[]>([{ name: 'All' }]);
  
  const [lyricIndex, setLyricIndex] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [loading, setLoading] = useState(true);
  
  // Navigation detail state
  const [selectedDetailCategory, setSelectedDetailCategory] = useState<string | null>(null);
  
  // Tab states matching mockups
  const [activeDiscoverTab, setActiveDiscoverTab] = useState<'Recently' | 'Popular' | 'Similar' | 'Trending'>('Recently');
  const [activeDetailTab, setActiveDetailTab] = useState<'Songs' | 'Artists' | 'Album' | 'Playlist'>('Songs');
  
  // Modal & Search states
  const [isPlayerModalVisible, setIsPlayerModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [likedTracks, setLikedTracks] = useState<Record<string, boolean>>({});
  const [visibleTracksCount, setVisibleTracksCount] = useState(10);
  const [isShuffleActive, setIsShuffleActive] = useState(false);
  const [showQueueInPlayer, setShowQueueInPlayer] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekProgress, setSeekProgress] = useState(0);
  const sliderWidthRef = useRef(0);

  const [waveHeights, setWaveHeights] = useState([8, 12, 16, 10, 14, 18, 12, 8, 14, 10, 16, 12, 18, 14, 10, 8]);

  // Bell count
  const [bellCount, setBellCount] = useState(0);

  // Alarm states
  const [isAlarmModalVisible, setIsAlarmModalVisible] = useState(false);
  const [alarmHour, setAlarmHour] = useState(6);
  const [alarmMinute, setAlarmMinute] = useState(0);
  const [alarmPeriod, setAlarmPeriod] = useState<'AM' | 'PM'>('AM');
  const [alarmLabel, setAlarmLabel] = useState('Morning Prayer');
  const [alarmRepeatType, setAlarmRepeatType] = useState<'ONCE' | 'DAILY' | 'WEEKDAYS' | 'CUSTOM' | 'SUNRISE' | 'SUNSET' | 'MUHURTA'>('DAILY');
  const [alarmWeekdaysMask, setAlarmWeekdaysMask] = useState(62); // Mon-Fri
  const [activeAlarmTrack, setActiveAlarmTrack] = useState<any>(null);
  const [isPermissionModalVisible, setIsPermissionModalVisible] = useState(false);
  const [pendingAlarmTrack, setPendingAlarmTrack] = useState<any>(null);
  const [permissionModalType, setPermissionModalType] = useState<'SYSTEM' | 'BATTERY'>('SYSTEM');
  const [isSavingAlarm, setIsSavingAlarm] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatusText, setDownloadStatusText] = useState('Downloading devotional chant...');

  // Android scroll wheel picker items and wrapping logic
  const hourItems = useMemo(() => ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"], []);
  const minuteItems = useMemo(() => Array.from({ length: 60 }, (_, i) => i < 10 ? '0' + i : i.toString()), []);
  const periodItems = useMemo(() => ["AM", "PM"], []);

  const incrementHour = () => {
    setAlarmHour(h => {
      let nextH = h === 12 ? 1 : h + 1;
      if (h === 11) {
        setAlarmPeriod(p => p === 'AM' ? 'PM' : 'AM');
      }
      return nextH;
    });
  };

  const decrementHour = () => {
    setAlarmHour(h => {
      let nextH = h === 1 ? 12 : h - 1;
      if (h === 12) {
        setAlarmPeriod(p => p === 'AM' ? 'PM' : 'AM');
      }
      return nextH;
    });
  };

  const handleHourChange = (newHourVal: string) => {
    const newH = parseInt(newHourVal, 10);
    const oldH = alarmHour;
    if (oldH !== newH) {
      if ((oldH === 11 && newH === 12) || (oldH === 12 && newH === 11)) {
        setAlarmPeriod(p => p === 'AM' ? 'PM' : 'AM');
      }
      setAlarmHour(newH);
    }
  };

  const handleMinuteChange = (newMinVal: string) => {
    const newMin = parseInt(newMinVal, 10);
    const oldMin = alarmMinute;
    
    if (oldMin !== newMin) {
      if (newMin - oldMin < -30) {
        incrementHour();
      } else if (newMin - oldMin > 30) {
        decrementHour();
      }
      setAlarmMinute(newMin);
    }
  };

  // Secondary player instance for Ringing Temple Bell overlay sound
  const bellSoundPlayer = useAudioPlayer(require('../../assets/Sound/bell_sound.mp3'));

  // Animated value for swinging the temple bell
  const bellRotation = useRef(new Animated.Value(0)).current;

  const bellRotateInterpolate = bellRotation.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-18deg', '0deg', '18deg']
  });

  // Floating animations state
  const [floaters, setFloaters] = useState<{ id: number; offset: number; anim: Animated.Value }[]>([]);
  const floaterIdRef = useRef(0);

  // Mandala pulse scale
  const mandalaScale = useRef(new Animated.Value(1)).current;

  // Milestone celebration states
  const [milestoneText, setMilestoneText] = useState<string | null>(null);
  const celebrationScale = useRef(new Animated.Value(0.5)).current;
  const celebrationOpacity = useRef(new Animated.Value(0)).current;

  // Ripples state
  const [ripples, setRipples] = useState<{ id: number; anim: Animated.Value }[]>([]);
  const rippleIdRef = useRef(0);

  // Bell audio visualizer waves
  const bellWaves = useRef(Array.from({ length: 11 }, () => new Animated.Value(0.15))).current;

  // Play/pause button mandala rotation animation
  const playMandalaRotation = useRef(new Animated.Value(0)).current;
  const playMandalaRotateInterpolate = playMandalaRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  const handleBellTap = () => {
    // 1. Tactile feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});

    // 2. Play chime sound overlay
    if (bellSoundPlayer) {
      bellSoundPlayer.seekTo(0);
      bellSoundPlayer.play();
    }

    // 3. Increment count & check milestone
    setBellCount(prev => {
      const newCount = prev + 1;
      setTimeout(() => {
        const isMilestone = newCount === 11 || newCount === 21 || newCount === 54 || newCount % 108 === 0;
        if (isMilestone) {
          setMilestoneText(`${newCount} Rings!`);
          celebrationScale.setValue(0.5);
          celebrationOpacity.setValue(0);
          Animated.parallel([
            Animated.sequence([
              Animated.timing(celebrationOpacity, {
                toValue: 1,
                duration: 200,
                useNativeDriver: true,
              }),
              Animated.delay(1200),
              Animated.timing(celebrationOpacity, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
              }),
            ]),
            Animated.sequence([
              Animated.spring(celebrationScale, {
                toValue: 1.3,
                friction: 6,
                tension: 40,
                useNativeDriver: true,
              }),
              Animated.timing(celebrationScale, {
                toValue: 1.8,
                duration: 600,
                useNativeDriver: true,
              })
            ])
          ]).start(() => {
            setMilestoneText(null);
          });
        }
      }, 0);
      return newCount;
    });

    // 4. Mandala pulse animation
    mandalaScale.setValue(1.0);
    Animated.sequence([
      Animated.timing(mandalaScale, {
        toValue: 1.15,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(mandalaScale, {
        toValue: 1.0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    // 5. Bell rotation swing
    bellRotation.setValue(0);
    Animated.sequence([
      Animated.timing(bellRotation, { toValue: -1, duration: 60, useNativeDriver: true }),
      Animated.timing(bellRotation, { toValue: 1, duration: 90, useNativeDriver: true }),
      Animated.timing(bellRotation, { toValue: -0.5, duration: 90, useNativeDriver: true }),
      Animated.timing(bellRotation, { toValue: 0.5, duration: 90, useNativeDriver: true }),
      Animated.timing(bellRotation, { toValue: 0, duration: 80, useNativeDriver: true })
    ]).start();

    // 6. Spawn a floater animation
    const newId = floaterIdRef.current++;
    const floaterAnim = new Animated.Value(0);
    const offset = Math.random() * 50 - 25;
    setFloaters(prev => [...prev, { id: newId, offset, anim: floaterAnim }]);

    Animated.timing(floaterAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start(() => {
      setFloaters(prev => prev.filter(item => item.id !== newId));
    });

    // 7. Spawn ripple wave animation
    const rId = rippleIdRef.current++;
    const rAnim = new Animated.Value(0);
    setRipples(prev => [...prev, { id: rId, anim: rAnim }]);
    Animated.timing(rAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start(() => {
      setRipples(prev => prev.filter(r => r.id !== rId));
    });

    // 8. Animate visualizer bars
    bellWaves.forEach((anim, idx) => {
      Animated.sequence([
        Animated.delay(idx * 25),
        Animated.timing(anim, {
          toValue: Math.random() * 0.85 + 0.15,
          duration: 140,
          useNativeDriver: true,
        }),
        Animated.timing(anim, {
          toValue: 0.15,
          duration: 500,
          useNativeDriver: true,
        })
      ]).start();
    });
  };

  // Global player and status are now retrieved from usePlayback() context

  // Run visualizer bars loop
  useEffect(() => {
    let intervalId: any;
    if (status.playing) {
      intervalId = setInterval(() => {
        setWaveHeights(prev => prev.map(() => Math.floor(Math.random() * 24) + 6));
      }, 120);
    } else {
      setWaveHeights(prev => prev.map(() => 4));
    }
    return () => clearInterval(intervalId);
  }, [status.playing]);

  // Continuous rotation for play button mandala background
  useEffect(() => {
    let animation: Animated.CompositeAnimation | null = null;
    if (status.playing) {
      playMandalaRotation.setValue(0);
      animation = Animated.loop(
        Animated.timing(playMandalaRotation, {
          toValue: 1,
          duration: 12000, // 12 seconds for slow, smooth meditative rotation
          useNativeDriver: true,
        })
      );
      animation.start();
    } else {
      playMandalaRotation.stopAnimation();
    }
    return () => {
      if (animation) {
        animation.stop();
      }
    };
  }, [status.playing]);

  // Reset visible tracks count on tab or query change
  useEffect(() => {
    setVisibleTracksCount(10);
  }, [activeDiscoverTab, selectedDetailCategory, searchQuery, activeCategory]);

  // Load deity categories from main database and chants from bhajan database
  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        // 1. Fetch Deity Categories from main Supabase
        const { data: catData, error: catErr } = await supabase
          .from('god_categories')
          .select('name, icon_url')
          .order('sort_order', { ascending: true });

        if (catErr) console.error('Error fetching god categories:', catErr);
        if (catData && catData.length > 0) {
          setCategories([{ name: 'All' }, ...catData]);
        } else {
          // Fallback static categories
          setCategories([
            { name: 'All' },
            { name: 'Shiv Ji' },
            { name: 'Ma Laxmi' },
            { name: 'Ganesha' },
            { name: 'Hanuman' },
            { name: 'Durga Ma' },
            { name: 'Krishna Ji' }
          ]);
        }

        // 2. Fetch Bhajans
        const { data: bhajanData, error: bhajanErr } = await bhajanSupabase
          .from('bhajans')
          .select('*')
          .eq('is_visible', true)
          .order('created_at', { ascending: false });

        if (bhajanErr) console.error('Error fetching bhajans:', bhajanErr);
        if (bhajanData && bhajanData.length > 0) {
          const formatted = bhajanData.map((b: any) => {
            const durationSec = b.duration || 200;
            const minutes = Math.floor(durationSec / 60);
            const seconds = durationSec % 60;
            const durationStr = `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;

            return {
              id: b.id,
              title: b.title,
              artist: b.category || 'Vedic Devotion',
              duration: durationStr,
              durationSec: durationSec,
              url: b.url,
              thumbnail: b.thumbnail,
              category: b.category,
              sub_type: b.sub_type,
              description: b.description || ''
            };
          });
          setTracks(formatted);
        }
      } catch (err) {
        console.error('Error loading data from databases:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Handle auto-playing from navigation parameters (like Bhajan of the Day card)
  useEffect(() => {
    if (playTrackId && tracks.length > 0) {
      const idx = tracks.findIndex(t => t.id === playTrackId);
      if (idx !== -1) {
        console.log(`[Music Screen] Navigation play parameter detected: track ${playTrackId} at index ${idx}. Auto-playing...`);
        playTrack(tracks[idx]);
        setIsPlayerModalVisible(true);
        setSelectedDetailCategory(null);
      }
    }
  }, [playTrackId, tracks]);

  // Handle search and auto-playing first result from navigation parameters
  useEffect(() => {
    if (search && tracks.length > 0) {
      console.log(`[Music Screen] Navigation search parameter detected: "${search}".`);
      setSearchQuery(search);
      setSelectedDetailCategory(null);
      
      const query = search.toLowerCase().trim();
      const idx = tracks.findIndex(t => 
        (t.title || '').toLowerCase().includes(query) || 
        (t.category || '').toLowerCase().includes(query) ||
        (t.description || '').toLowerCase().includes(query)
      );
      if (idx !== -1) {
        console.log(`[Music Screen] Auto-playing first search result at index ${idx}`);
        playTrack(tracks[idx]);
        setIsPlayerModalVisible(true);
      }
    }
  }, [search, tracks]);

  // Handle track auto-advance when finished
  useEffect(() => {
    if (status.didJustFinish) {
      handleNext();
    }
  }, [status.didJustFinish]);

  // Generate dynamic lyrics based on description or category fallbacks
  const lyricsArray = useMemo(() => {
    if (!activeTrack) return [];
    if (activeTrack.description && activeTrack.description.length > 5) {
      const lines = activeTrack.description
        .split(/[.\n,]/)
        .map((s: string) => s.trim())
        .filter((s: string) => s.length > 0);
      if (lines.length > 0) return lines;
    }
    // Fallbacks
    const cat = (activeTrack.category || '').toLowerCase();
    if (cat.includes('shiv') || cat.includes('mahadev')) {
      return [
        'Om Namah Shivaya...',
        'Har Har Mahadev...',
        'Karpur Gauram Karunavataram...',
        'Sansara Saram Bhujagendra Haram...',
        'Sada Vasantam Hridayaravinde...',
        'Bhavam Bhavani Sahitam Namami...'
      ];
    }
    if (cat.includes('krishna') || cat.includes('radha') || cat.includes('bihari')) {
      return [
        'Hare Krishna Hare Krishna...',
        'Krishna Krishna Hare Hare...',
        'Hare Rama Hare Rama...',
        'Rama Rama Hare Hare...',
        'Achyutam Keshavam Krishna Damodaram...',
        'Rama Narayanam Janakivallabham...'
      ];
    }
    if (cat.includes('hanuman') || cat.includes('chalisa') || cat.includes('bajrang')) {
      return [
        'Shree Guru Charan Saroj Raj...',
        'Nij Manu Mukuru Sudhari...',
        'Barnau Raghuvar Bimal Jasu...',
        'Jo Dayaku Phal Chari...',
        'Jai Hanuman Gyan Gun Sagar...',
        'Jai Kapis Tihun Lok Ujagar...'
      ];
    }
    if (cat.includes('ganesh') || cat.includes('vighna')) {
      return [
        'Vakratunda Mahakaya...',
        'Surya Koti Samaprabha...',
        'Nirvighnam Kuru Me Deva...',
        'Sarva Karyeshu Sarvada...',
        'Jai Ganesh Jai Ganesh Deva...',
        'Mata Jaki Parvati Pita Mahadeva...'
      ];
    }
    return [
      'Chanting divine names for peace & wisdom...',
      'May the light of truth guide your path...',
      'Connecting with the cosmic sound...',
      'Deep meditation and spiritual healing...'
    ];
  }, [activeTrack]);

  // Sync lyrics line with playback progress
  useEffect(() => {
    const duration = status.duration || (activeTrack ? activeTrack.durationSec : 0);
    if (duration > 0 && lyricsArray.length > 0) {
      const percentage = status.currentTime / duration;
      const index = Math.min(Math.floor(percentage * lyricsArray.length), lyricsArray.length - 1);
      setLyricIndex(index);
    }
  }, [status.currentTime, status.duration, lyricsArray]);

  const lyricsScrollViewRef = useRef<ScrollView>(null);
  useEffect(() => {
    if (lyricsScrollViewRef.current && lyricIndex >= 0) {
      const lineSize = 30; // height (22) + vertical margins (8)
      const containerHeight = 150 - 28; // height (150) - vertical padding (28)
      const centerYOffset = (containerHeight / 2) - (lineSize / 2);
      const targetScrollY = Math.max(0, (lyricIndex * lineSize) - centerYOffset);
      lyricsScrollViewRef.current.scrollTo({
        y: targetScrollY,
        animated: true,
      });
    }
  }, [lyricIndex]);

  // Matcher helper linking track categories to deity categories
  const matchTrackToCategory = (track: any, categoryName: string) => {
    if (categoryName === 'All') return true;
    const trackCat = (track.category || '').toLowerCase();
    const activeCat = categoryName.toLowerCase();
    
    if (activeCat.includes('shiv') && (trackCat.includes('shiv') || trackCat.includes('mahadev'))) return true;
    if ((activeCat.includes('laxmi') || activeCat.includes('lakshmi')) && (trackCat.includes('laxmi') || trackCat.includes('lakshmi'))) return true;
    if (activeCat.includes('ganesh') && (trackCat.includes('ganesh') || trackCat.includes('vighna'))) return true;
    if (activeCat.includes('hanuman') && (trackCat.includes('hanuman') || trackCat.includes('chalisa') || trackCat.includes('bajrang'))) return true;
    if (activeCat.includes('durga') && (trackCat.includes('durga') || trackCat.includes('devi') || trackCat.includes('shakti'))) return true;
    if (activeCat.includes('krishna') && (trackCat.includes('krishna') || trackCat.includes('bihari') || trackCat.includes('radha'))) return true;
    if (activeCat.includes('venkat') && (trackCat.includes('venkat') || trackCat.includes('balaji'))) return true;
    
    return trackCat.includes(activeCat) || activeCat.includes(trackCat);
  };

  // Filtered tracks under the actively selected category filter
  const filteredTracks = useMemo(() => {
    return tracks.filter(t => matchTrackToCategory(t, activeCategory));
  }, [activeCategory, tracks]);

  // Tracks for the category selected inside detail view (Image 3)
  const categoryDetailTracks = useMemo(() => {
    if (!selectedDetailCategory) return [];
    return tracks.filter(t => matchTrackToCategory(t, selectedDetailCategory));
  }, [selectedDetailCategory, tracks]);

  // Combined searched tracks list
  const searchedTracks = useMemo(() => {
    // Search across all tracks when on the Discover screen, otherwise filter within category details
    const list = selectedDetailCategory ? categoryDetailTracks : (searchQuery.trim() ? tracks : filteredTracks);
    if (!searchQuery.trim()) return list;
    const query = searchQuery.toLowerCase().trim();
    return list.filter(t => 
      (t.title || '').toLowerCase().includes(query) ||
      (t.artist || '').toLowerCase().includes(query) ||
      (t.category || '').toLowerCase().includes(query)
    );
  }, [searchQuery, filteredTracks, categoryDetailTracks, selectedDetailCategory, tracks]);

  const openAlarmModalForTrack = async (track: any) => {
    if (!track) return;
    if (!AlarmSystem.isBridgeAvailable()) {
      Alert.alert(
        'Devotional Alarms ⏰',
        'Alarms require a custom development build or production release build. They are not supported on iOS or inside the default Expo Go app.'
      );
      return;
    }

    try {
      const hasPermissions = await AlarmSystem.checkAlarmPermissions();
      if (!hasPermissions) {
        setPendingAlarmTrack(track);
        setPermissionModalType('SYSTEM');
        setIsPermissionModalVisible(true);
        return;
      }

      const batteryIgnored = await AlarmSystem.isBatteryOptimizationIgnored();
      if (!batteryIgnored) {
        setPendingAlarmTrack(track);
        setPermissionModalType('BATTERY');
        setIsPermissionModalVisible(true);
        return;
      }

      setActiveAlarmTrack(track);
      setIsAlarmModalVisible(true);
    } catch (e) {
      console.error('Failed to check permissions', e);
      setActiveAlarmTrack(track);
      setIsAlarmModalVisible(true);
    }
  };

  const handleSaveAlarm = async () => {
    if (!activeAlarmTrack) return;

    if (!AlarmSystem.isBridgeAvailable()) {
      Alert.alert(
        'Devotional Alarms ⏰',
        'Alarms require a custom development build or production release build. They are not supported on iOS or inside the default Expo Go app.'
      );
      return;
    }

    try {
      // Compute epoch nextTrigger
      const now = new Date();
      let hour24 = alarmHour;
      if (alarmPeriod === 'PM' && alarmHour < 12) hour24 += 12;
      if (alarmPeriod === 'AM' && alarmHour === 12) hour24 = 0;

      const triggerDate = new Date();
      triggerDate.setHours(hour24);
      triggerDate.setMinutes(alarmMinute);
      triggerDate.setSeconds(0);
      triggerDate.setMilliseconds(0);

      // If scheduled time has already passed for today, make it tomorrow
      if (triggerDate.getTime() <= now.getTime()) {
        triggerDate.setDate(triggerDate.getDate() + 1);
      }

      // Initialize UI saving/downloading state
      setIsSavingAlarm(true);
      setDownloadProgress(0.05);
      setDownloadStatusText('Connecting to server...');

      const alarmId = Math.random().toString(36).substring(7);

      // 4. Call native bridge createAlarm (format label as label|category)
      const success = await AlarmSystem.createAlarm({
        id: alarmId,
        label: `${alarmLabel}|${activeAlarmTrack.category || 'Shiv Ji'}`,
        musicId: activeAlarmTrack.id,
        downloadUrl: activeAlarmTrack.url,
        nextTrigger: triggerDate.getTime(),
        repeatType: alarmRepeatType,
        weekdaysMask: alarmRepeatType === 'DAILY' ? 127 : alarmRepeatType === 'WEEKDAYS' ? 62 : alarmWeekdaysMask,
        volume: 1.0,
        fadeInDuration: 10,
        vibration: true,
        flashlight: false
      });

      if (!success) {
        setIsSavingAlarm(false);
        Alert.alert('Error', 'Failed to configure alarm on native system.');
        return;
      }

      // 5. Smooth progress bar simulation
      let currentProgress = 0.05;
      const progressInterval = setInterval(() => {
        currentProgress += (1 - currentProgress) * 0.15; // asymptotic curve towards 100%
        setDownloadProgress(currentProgress);
        if (currentProgress < 0.3) {
          setDownloadStatusText('Downloading devotional chant...');
        } else if (currentProgress < 0.7) {
          setDownloadStatusText('Caching chant on device...');
        } else {
          setDownloadStatusText('Scheduling native alarm...');
        }
      }, 500);

      // 6. Poll database to check when isDownloaded changes to true
      let pollCount = 0;
      const pollInterval = setInterval(async () => {
        pollCount++;
        const alarmsList = await AlarmSystem.getAlarms();
        const matched = alarmsList.find(a => a.id === alarmId);
        
        if (matched && matched.isDownloaded) {
          // Success!
          clearInterval(progressInterval);
          clearInterval(pollInterval);
          setDownloadProgress(1);
          setDownloadStatusText('Alarm Set successfully! 🌸');
          
          setTimeout(() => {
            setIsSavingAlarm(false);
            setIsAlarmModalVisible(false);
          }, 1500);
        } else if (pollCount > 25) { 
          // Timeout after 25 seconds
          clearInterval(progressInterval);
          clearInterval(pollInterval);
          setIsSavingAlarm(false);
          Alert.alert(
            'Alarm Configured', 
            'Alarm is set. Chant is downloading in the background.'
          );
          setIsAlarmModalVisible(false);
        }
      }, 1000);

    } catch (e: any) {
      console.error(e);
      setIsSavingAlarm(false);
      Alert.alert('Alarm Config Error', e.message || 'An unexpected error occurred.');
    }
  };

  // Controller Handlers
  const handlePlayPause = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    if (status.playing) {
      player.pause();
    } else {
      player.play();
    }
  };

  const handleNext = () => {
    const list = selectedDetailCategory ? categoryDetailTracks : filteredTracks;
    if (list.length > 0) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
      setLyricIndex(0);
      const currentFilteredIndex = list.findIndex(t => t.id === activeTrack?.id);
      let nextFilteredIndex = currentFilteredIndex;
      if (isShuffleActive && list.length > 1) {
        while (nextFilteredIndex === currentFilteredIndex) {
          nextFilteredIndex = Math.floor(Math.random() * list.length);
        }
      } else {
        nextFilteredIndex = (currentFilteredIndex + 1) % list.length;
      }
      const originalIndex = tracks.findIndex(t => t.id === list[nextFilteredIndex].id);
      if (originalIndex !== -1) {
        setActiveTrackIndex(originalIndex);
      }
    }
  };

  const handlePrev = () => {
    const list = selectedDetailCategory ? categoryDetailTracks : filteredTracks;
    if (list.length > 0) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
      setLyricIndex(0);
      const currentFilteredIndex = list.findIndex(t => t.id === activeTrack?.id);
      let prevFilteredIndex = currentFilteredIndex;
      if (isShuffleActive && list.length > 1) {
        while (prevFilteredIndex === currentFilteredIndex) {
          prevFilteredIndex = Math.floor(Math.random() * list.length);
        }
      } else {
        prevFilteredIndex = (currentFilteredIndex - 1 + list.length) % list.length;
      }
      const originalIndex = tracks.findIndex(t => t.id === list[prevFilteredIndex].id);
      if (originalIndex !== -1) {
        setActiveTrackIndex(originalIndex);
      }
    }
  };

  const handlePlayPlaylist = (playlist: any[]) => {
    if (playlist.length > 0) {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
      const originalIndex = tracks.findIndex(t => t.id === playlist[0].id);
      if (originalIndex !== -1) {
        setActiveTrackIndex(originalIndex);
      }
      setIsPlayerModalVisible(true);
    }
  };

  const formatTime = (totalSec: number) => {
    const min = Math.floor(totalSec / 60);
    const sec = Math.floor(totalSec % 60);
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const toggleLike = (id: string) => {
    setLikedTracks(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const progressPercent = status.duration ? status.currentTime / status.duration : 0;
  const clampedProgress = Math.max(0, Math.min(1, progressPercent));
  const currentProgressRatio = isSeeking ? seekProgress : clampedProgress;

  // Touch Seeker Handlers
  const handleSliderTouch = (event: any) => {
    const { locationX } = event.nativeEvent;
    if (sliderWidthRef.current > 0) {
      let pct = Math.max(0, Math.min(1, locationX / sliderWidthRef.current));
      setSeekProgress(pct);
      setIsSeeking(true);
    }
  };

  const handleSliderMove = (event: any) => {
    const { locationX } = event.nativeEvent;
    if (sliderWidthRef.current > 0) {
      let pct = Math.max(0, Math.min(1, locationX / sliderWidthRef.current));
      setSeekProgress(pct);
    }
  };

  const handleSliderRelease = () => {
    if (isSeeking) {
      const duration = status.duration || (activeTrack ? activeTrack.durationSec : 0) || 0;
      if (duration > 0) {
        player.seekTo(seekProgress * duration);
      }
      setIsSeeking(false);
    }
  };

  const cycleSpeed = () => {
    let newSpeed = 1.0;
    if (playbackSpeed === 1.0) newSpeed = 1.25;
    else if (playbackSpeed === 1.25) newSpeed = 1.5;
    else if (playbackSpeed === 1.5) newSpeed = 2.0;
    else if (playbackSpeed === 2.0) newSpeed = 2.5;
    else if (playbackSpeed === 2.5) newSpeed = 0.8;
    else newSpeed = 1.0;
    
    setPlaybackSpeed(newSpeed);
    player.shouldCorrectPitch = true;
    player.setPlaybackRate(newSpeed);
  };

  const skipBackward10s = () => {
    const current = status.currentTime || 0;
    player.seekTo(Math.max(0, current - 10));
  };

  const skipForward10s = () => {
    const current = status.currentTime || 0;
    const duration = status.duration || (activeTrack ? activeTrack.durationSec : 0) || 0;
    if (duration > 0) {
      player.seekTo(Math.min(duration, current + 10));
    }
  };

  const increaseVolume = () => {
    const vol = Math.min(1.0, player.volume + 0.1);
    player.volume = vol;
    setPlayerVolume(vol);
  };
  
  const decreaseVolume = () => {
    const vol = Math.max(0.0, player.volume - 0.1);
    player.volume = vol;
    setPlayerVolume(vol);
  };

  // Dynamic Deity Trending lists for horizontal carousel (Reference 1)
  const trendingDeityCards = useMemo(() => {
    return categories
      .filter(c => c.name !== 'All')
      .map(cat => {
        let subtitle = 'Chants & Aarti';
        if (cat.name.includes('Shiv')) subtitle = 'Shiv Tandav & Mantras';
        else if (cat.name.includes('Krishna')) subtitle = 'Radhe Krishna Dhun';
        else if (cat.name.includes('Hanuman')) subtitle = 'Hanuman Chalisa';
        
        return {
          name: cat.name,
          subtitle: subtitle,
          icon_url: cat.icon_url
        };
      });
  }, [categories]);

  if (loading) {
    return (
      <View style={[styles.safeArea, { justifyContent: 'center', alignItems: 'center' }]}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <ActivityIndicator size="large" color="#ea580c" />
        <Text style={{ marginTop: 12, color: '#64748b', fontFamily: 'Outfit-Medium' }}>
          Loading Chants...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

      {/* RENDER DETAILED CATEGORY VIEW (3rd Image) IF CHOSEN */}
      {selectedDetailCategory ? (
        <View style={{ flex: 1 }}>
          {/* Header Cover Banner */}
          <ImageBackground
            source={getDeityAvatar(selectedDetailCategory)}
            style={styles.detailBannerImage}
            resizeMode="cover"
          >
            <LinearGradient
              colors={['rgba(15, 23, 42, 0.4)', 'rgba(255, 255, 255, 0.98)']}
              style={StyleSheet.absoluteFillObject}
            />
            
            <SafeAreaView style={[styles.detailHeaderTopRow, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]} edges={['top']}>
              <TouchableOpacity 
                style={styles.detailBackCircle} 
                onPress={() => setSelectedDetailCategory(null)}
                activeOpacity={0.8}
              >
                <Ionicons name="chevron-back" size={24} color="#0f172a" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.detailBackCircle} 
                onPress={() => router.push('/alarms')}
                activeOpacity={0.8}
              >
                <Ionicons name="alarm-outline" size={20} color="#0f172a" />
              </TouchableOpacity>
            </SafeAreaView>

            {/* Banner Metadata overlays inside glass curves */}
            <View style={styles.detailBannerInfoContainer}>
              <Text style={styles.detailCategoryName}>{selectedDetailCategory}</Text>
              <Text style={styles.detailCategoryMetadata}>
                {t('Divine Worship')} • {categoryDetailTracks.length} Chants
              </Text>
            </View>

            {/* Play Floating action button sitting on bottom border */}
            <TouchableOpacity 
              style={styles.floatingPlayFab}
              onPress={() => handlePlayPlaylist(categoryDetailTracks)}
              activeOpacity={0.9}
            >
              <LinearGradient
                colors={['#f97316', '#f59e0b']}
                style={styles.playFabGradient}
              >
                <Ionicons name="play" size={26} color="#ffffff" style={{ marginLeft: 3 }} />
              </LinearGradient>
            </TouchableOpacity>
          </ImageBackground>

          {/* Songs List of that category */}
          <View style={styles.detailListBody}>
            <View style={styles.detailTracksHeader}>
              <Text style={styles.detailTracksTitle}>{t('Music list')}</Text>
            </View>

            {/* Filter categories tabs inside details */}
            <View style={styles.detailTabsContainer}>
              {['Songs', 'Artists', 'Album', 'Playlist'].map((tab: any) => {
                const isSelected = activeDetailTab === tab;
                return (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => setActiveDetailTab(tab)}
                    style={styles.detailTabItem}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.detailTabText, isSelected && styles.detailTabTextActive]}>
                      {t(tab)}
                    </Text>
                    {isSelected && <View style={styles.detailTabUnderline} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 100 }}>
              {searchedTracks.length === 0 ? (
                <View style={styles.emptyPlaylistContainer}>
                  <Ionicons name="musical-note-outline" size={32} color="#94a3b8" />
                  <Text style={styles.emptyPlaylistText}>No chants matches query</Text>
                </View>
              ) : (
                <>
                  {searchedTracks.slice(0, visibleTracksCount).map((track) => {
                    const isCurrent = track.id === activeTrack?.id;
                    return (
                      <TouchableOpacity
                        key={track.id}
                        style={[styles.trackListItem, isCurrent && styles.trackListItemActive]}
                        activeOpacity={0.8}
                        onPress={() => {
                          const originalIdx = tracks.findIndex(t => t.id === track.id);
                          if (originalIdx !== -1) {
                            setActiveTrackIndex(originalIdx);
                          }
                          setIsPlayerModalVisible(true);
                        }}
                      >
                        <Image 
                          source={getDeityAvatar(track.category || '', track.thumbnail)} 
                          style={styles.trackListThumbnail}
                        />
                        <View style={styles.trackListInfoCol}>
                          <Text style={[styles.trackListItemTitle, isCurrent && styles.trackListItemTitleActive]} numberOfLines={1}>
                            {track.title}
                          </Text>
                          <Text style={styles.trackListItemArtist} numberOfLines={1}>
                            {track.artist}
                          </Text>
                        </View>
                        
                        <Text style={styles.trackListItemDuration}>{track.duration}</Text>

                        <TouchableOpacity
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: '#fff7ed',
                            borderWidth: 1,
                            borderColor: '#fed7aa',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginRight: 8,
                          }}
                          activeOpacity={0.7}
                          onPress={() => openAlarmModalForTrack(track)}
                        >
                          <Ionicons name="alarm" size={18} color="#ea580c" />
                        </TouchableOpacity>

                        <View style={styles.listPlayBtnGroup}>
                          {isCurrent && (
                            <Animated.Image
                              source={require('../../assets/imp_pngs/pngegg (2).png')}
                              style={[
                                styles.mandalaListPlayBg,
                                {
                                  transform: [{ rotate: playMandalaRotateInterpolate }]
                                }
                              ]}
                            />
                          )}
                          
                          <TouchableOpacity 
                            style={[styles.trackListPlayIconContainer, isCurrent && status.playing && styles.trackListPlayIconActive]}
                            onPress={() => {
                              const originalIdx = tracks.findIndex(t => t.id === track.id);
                              if (originalIdx !== -1) {
                                if (isCurrent) {
                                  handlePlayPause();
                                } else {
                                  setActiveTrackIndex(originalIdx);
                                }
                              }
                            }}
                          >
                            <Ionicons 
                              name={isCurrent && status.playing ? "pause" : "play"} 
                              size={12} 
                              color="#ffffff" 
                              style={!(isCurrent && status.playing) && { marginLeft: 1.5 }}
                            />
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    );
                  })}

                  {searchedTracks.length > visibleTracksCount && (
                    <TouchableOpacity
                      style={styles.addMoreButton}
                      activeOpacity={0.8}
                      onPress={() => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        setVisibleTracksCount(prev => prev + 10);
                      }}
                    >
                      <Text style={styles.addMoreButtonText}>{t('Add More')}</Text>
                      <Ionicons name="chevron-down" size={16} color="#ea580c" />
                    </TouchableOpacity>
                  )}
                </>
              )}
            </ScrollView>
          </View>
        </View>
      ) : (
        /* RENDER DISCOVER HOME SCREEN (1st Image) */
        <View style={{ flex: 1 }}>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.scrollContent, { paddingTop: 12 }]}>

            {/* Search Input Bar */}
            <View style={styles.searchBarWrapper}>
              <Ionicons name="search-outline" size={20} color="#94a3b8" style={styles.searchIcon} />
              <TextInput
                style={styles.searchBarInput}
                placeholder="Search your favorite"
                placeholderTextColor="#94a3b8"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.trim().length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={{ padding: 4 }} activeOpacity={0.7}>
                  <Ionicons name="close-circle" size={18} color="#94a3b8" />
                </TouchableOpacity>
              )}
            </View>

            {/* Music Trending Deity Cards Carousel */}
            <View style={styles.carouselSection}>
              <View style={styles.carouselHeaderRow}>
                <Text style={styles.sectionHeading}>{t('Music Trending')}</Text>
                <TouchableOpacity 
                  onPress={() => router.push('/alarms')}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    backgroundColor: '#fff7ed',
                    paddingHorizontal: 10,
                    paddingVertical: 5,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: '#fed7aa',
                    gap: 4
                  }}
                  activeOpacity={0.75}
                >
                  <Ionicons name="alarm-outline" size={16} color="#ea580c" />
                  <Text style={{ fontSize: 12, fontFamily: 'Outfit-Bold', color: '#ea580c' }}>
                    {t('Alarms')}
                  </Text>
                </TouchableOpacity>
              </View>
              
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.carouselScrollContent}
              >
                {trendingDeityCards.map((card, idx) => (
                  <TouchableOpacity
                    key={idx}
                    style={styles.trendingCard}
                    activeOpacity={0.9}
                    onPress={() => setSelectedDetailCategory(card.name)}
                  >
                    <Image 
                      source={getDeityAvatar(card.name, card.icon_url)} 
                      style={styles.trendingCardBg}
                    />
                    <LinearGradient
                      colors={['transparent', 'rgba(15,23,42,0.85)']}
                      style={StyleSheet.absoluteFillObject}
                    />
                    <View style={styles.trendingCardDetails}>
                      <Text style={styles.trendingCardTitle} numberOfLines={1}>{card.name}</Text>
                      <Text style={styles.trendingCardSubtitle} numberOfLines={1}>{card.subtitle}</Text>
                    </View>
                    <View style={styles.trendingCardPlayCircle}>
                      <Ionicons name="play" size={12} color="#ffffff" style={{ marginLeft: 2 }} />
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Tab list filters */}
            <View style={styles.tabsSection}>
              {['Recently', 'Popular', 'Similar', 'Trending'].map((tab: any) => {
                const isSelected = activeDiscoverTab === tab;
                return (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => {
                      setActiveDiscoverTab(tab);
                      // Custom mapping categories for testing filters
                      if (tab === 'Recently') setActiveCategory('All');
                      else if (tab === 'Popular') setActiveCategory('Shiv Ji');
                      else if (tab === 'Similar') setActiveCategory('Ma Laxmi');
                      else if (tab === 'Trending') setActiveCategory('Hanuman');
                    }}
                    style={styles.tabItem}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.tabText, isSelected && styles.tabTextActive]}>
                      {t(tab)}
                    </Text>
                    {isSelected && <View style={styles.tabUnderline} />}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Playlist Track rows */}
            <View style={styles.playlistSection}>
              {searchedTracks.length === 0 ? (
                <View style={styles.emptyPlaylistContainer}>
                  <Ionicons name="musical-note-outline" size={32} color="#94a3b8" />
                  <Text style={styles.emptyPlaylistText}>No chants found</Text>
                </View>
              ) : (
                <>
                  {searchedTracks.slice(0, visibleTracksCount).map((track) => {
                    const isCurrent = track.id === activeTrack?.id;
                    return (
                      <TouchableOpacity
                        key={track.id}
                        style={[styles.trackListItem, isCurrent && styles.trackListItemActive]}
                        activeOpacity={0.8}
                        onPress={() => {
                          const originalIdx = tracks.findIndex(t => t.id === track.id);
                          if (originalIdx !== -1) {
                            setActiveTrackIndex(originalIdx);
                          }
                          setIsPlayerModalVisible(true);
                        }}
                      >
                        <Image 
                          source={getDeityAvatar(track.category || '', track.thumbnail)} 
                          style={styles.trackListThumbnail}
                        />
                        <View style={styles.trackListInfoCol}>
                          <Text style={[styles.trackListItemTitle, isCurrent && styles.trackListItemTitleActive]} numberOfLines={1}>
                            {track.title}
                          </Text>
                          <Text style={styles.trackListItemArtist} numberOfLines={1}>
                            {track.artist}
                          </Text>
                        </View>
                        <Text style={styles.trackListItemDuration}>{track.duration}</Text>
                        
                        <TouchableOpacity
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 16,
                            backgroundColor: '#fff7ed',
                            borderWidth: 1,
                            borderColor: '#fed7aa',
                            justifyContent: 'center',
                            alignItems: 'center',
                            marginRight: 8,
                          }}
                          activeOpacity={0.7}
                          onPress={() => openAlarmModalForTrack(track)}
                        >
                          <Ionicons name="alarm" size={18} color="#ea580c" />
                        </TouchableOpacity>

                        <View style={styles.listPlayBtnGroup}>
                          {isCurrent && (
                            <Animated.Image
                              source={require('../../assets/imp_pngs/pngegg (2).png')}
                              style={[
                                styles.mandalaListPlayBg,
                                {
                                  transform: [{ rotate: playMandalaRotateInterpolate }]
                                }
                              ]}
                            />
                          )}
                          
                          <TouchableOpacity 
                            style={[styles.trackListPlayIconContainer, isCurrent && status.playing && styles.trackListPlayIconActive]}
                            onPress={() => {
                              const originalIdx = tracks.findIndex(t => t.id === track.id);
                              if (originalIdx !== -1) {
                                if (isCurrent) {
                                  handlePlayPause();
                                } else {
                                  setActiveTrackIndex(originalIdx);
                                }
                              }
                            }}
                          >
                            <Ionicons 
                              name={isCurrent && status.playing ? "pause" : "play"} 
                              size={12} 
                              color="#ffffff" 
                              style={!(isCurrent && status.playing) && { marginLeft: 1.5 }}
                            />
                          </TouchableOpacity>
                        </View>
                      </TouchableOpacity>
                    );
                  })}

                  {searchedTracks.length > visibleTracksCount && (
                    <TouchableOpacity
                      style={styles.addMoreButton}
                      activeOpacity={0.8}
                      onPress={() => {
                        LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
                        setVisibleTracksCount(prev => prev + 10);
                      }}
                    >
                      <Text style={styles.addMoreButtonText}>{t('Add More')}</Text>
                      <Ionicons name="chevron-down" size={16} color="#ea580c" />
                    </TouchableOpacity>
                  )}
                </>
              )}
            </View>

            <View style={{ height: 120 }} />
          </ScrollView>
        </View>
      )}

      {/* 5. Persistent Spotify Mini Player Bottom Bar (Light Mode) */}
      {activeTrack && (
        <TouchableOpacity 
          style={styles.miniPlayerBar}
          activeOpacity={0.9}
          onPress={() => setIsPlayerModalVisible(true)}
        >
          {/* Progress fill stripe at top of bar */}
          <View style={styles.miniPlayerProgressBackground}>
            <View style={[styles.miniPlayerProgressFill, { width: `${progressPercent * 100}%` }]} />
          </View>

          <View style={styles.miniPlayerContent}>
            <Image 
              source={getDeityAvatar(activeTrack.category || '', activeTrack.thumbnail)} 
              style={styles.miniPlayerThumbnail} 
            />
            <View style={styles.miniPlayerInfoCol}>
              <Text style={styles.miniPlayerTitle} numberOfLines={1}>{activeTrack.title}</Text>
              <Text style={styles.miniPlayerSubtitle} numberOfLines={1}>{activeTrack.artist}</Text>
            </View>
            <View style={styles.miniPlayerControlsRow}>
              <TouchableOpacity onPress={handlePlayPause} style={styles.miniPlayerControlBtn}>
                <Ionicons name={status.playing ? "pause" : "play"} size={22} color="#ea580c" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleNext} style={styles.miniPlayerControlBtn}>
                <Ionicons name="play-forward" size={20} color="#ea580c" />
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      )}

      {/* 6. Modern Glassmorphic Audio Player Modal Overlay (Reference Image 2) */}
      {activeTrack && (
        <Modal
          visible={isPlayerModalVisible}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={() => setIsPlayerModalVisible(false)}
        >
          <View style={styles.modalBackground}>
            <Image 
              source={getDeityAvatar(activeTrack.category || '', activeTrack.thumbnail)} 
              style={StyleSheet.absoluteFillObject}
              blurRadius={32}
            />
            <View style={styles.overlayShade} />

            <LinearGradient
              colors={['rgba(255, 250, 240, 0.85)', 'rgba(255, 255, 255, 0.98)']}
              style={StyleSheet.absoluteFillObject}
            />

            <SafeAreaView style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity 
                  onPress={() => setIsPlayerModalVisible(false)} 
                  style={styles.modalTopIconBtn}
                  activeOpacity={0.7}
                >
                  <Ionicons name="chevron-back" size={24} color="#0f172a" />
                </TouchableOpacity>
                <Text style={styles.modalPlayerTitle}>Player</Text>
                
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <TouchableOpacity 
                    onPress={() => activeTrack && openAlarmModalForTrack(activeTrack)} 
                    style={styles.modalTopIconBtn}
                    activeOpacity={0.7}
                  >
                    <Ionicons name="alarm-outline" size={22} color="#ea580c" />
                  </TouchableOpacity>

                  <TouchableOpacity 
                    onPress={() => toggleLike(activeTrack.id)} 
                    style={styles.modalTopIconBtn}
                    activeOpacity={0.7}
                  >
                    <Ionicons 
                      name={likedTracks[activeTrack.id] ? "heart" : "heart-outline"} 
                      size={22} 
                      color={likedTracks[activeTrack.id] ? "#ef4444" : "#64748b"} 
                    />
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.playerCardFrame}>
                <ScrollView 
                  contentContainerStyle={styles.modalScrollContent} 
                  showsVerticalScrollIndicator={false}
                >
                  <View style={styles.sheetHandleLine} />

                  <Text style={styles.listeningToLabel}>Listening to</Text>
                  
                  <View style={styles.playerCoverArtWrapper}>
                    <Image 
                      source={getDeityAvatar(activeTrack.category || '', activeTrack.thumbnail)} 
                      style={styles.playerCoverArt} 
                    />
                  </View>

                  <Text style={styles.playerTitleText} numberOfLines={1}>{activeTrack.title}</Text>
                  <Text style={styles.playerArtistText} numberOfLines={1}>{activeTrack.artist}</Text>

                  <View style={styles.sliderSection}>
                    <View 
                      style={styles.sliderTrackBackground}
                      onLayout={(e) => { sliderWidthRef.current = e.nativeEvent.layout.width; }}
                      onStartShouldSetResponder={() => true}
                      onMoveShouldSetResponder={() => true}
                      onResponderGrant={handleSliderTouch}
                      onResponderMove={handleSliderMove}
                      onResponderRelease={handleSliderRelease}
                    >
                      <View style={[styles.sliderTrackFill, { width: `${currentProgressRatio * 100}%` }]} />
                      <View style={[styles.sliderThumbIndicator, { left: `${currentProgressRatio * 98}%` }]} />
                    </View>
                    <View style={styles.sliderTimestampsRow}>
                      <Text style={styles.sliderTimeLabel}>
                        {formatTime(isSeeking ? Math.round(seekProgress * (status.duration || activeTrack.durationSec)) : status.currentTime)}
                      </Text>
                      <Text style={styles.sliderTimeLabel}>{formatTime(status.duration || activeTrack.durationSec)}</Text>
                    </View>
                  </View>
                  <View style={styles.mediaButtonsRow}>
                    <TouchableOpacity 
                      style={styles.mediaSideBtn} 
                      onPress={() => setIsShuffleActive(prev => !prev)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="shuffle" size={22} color={isShuffleActive ? "#ea580c" : "#94a3b8"} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.mediaControlBtn} onPress={handlePrev} activeOpacity={0.7}>
                      <Ionicons name="play-skip-back" size={28} color="#0f172a" />
                    </TouchableOpacity>

                    <View style={styles.playPauseGroupContainer}>
                      <Animated.Image
                        source={require('../../assets/imp_pngs/pngegg (2).png')}
                        style={[
                          styles.mandalaPlayBg,
                          {
                            transform: [{ rotate: playMandalaRotateInterpolate }]
                          }
                        ]}
                      />

                      <TouchableOpacity 
                        style={styles.largePlayCircleFab} 
                        onPress={handlePlayPause}
                        activeOpacity={0.85}
                      >
                        <LinearGradient
                          colors={['#f97316', '#f59e0b']}
                          style={styles.largePlayFabGradient}
                        >
                          <Ionicons 
                            name={status.playing ? "pause" : "play"} 
                            size={28} 
                            color="#ffffff" 
                            style={!status.playing && { marginLeft: 3 }}
                          />
                        </LinearGradient>
                      </TouchableOpacity>
                    </View>

                    <TouchableOpacity style={styles.mediaControlBtn} onPress={handleNext} activeOpacity={0.7}>
                      <Ionicons name="play-skip-forward" size={28} color="#0f172a" />
                    </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.mediaSideBtn} 
                      onPress={() => setShowQueueInPlayer(prev => !prev)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name={showQueueInPlayer ? "list" : "list-outline"} size={22} color={showQueueInPlayer ? "#ea580c" : "#94a3b8"} />
                    </TouchableOpacity>
                  </View>

                  {!showQueueInPlayer && (
                    <>
                      <View style={styles.visualizerRow}>
                        {waveHeights.map((h, i) => (
                          <View key={i} style={[styles.visualizerBar, { height: h }]} />
                        ))}
                      </View>


                      {/* Temple Bell Section with clean UI card */}
                      <View style={styles.divineBellCard}>
                        {/* Dynamic ripple waves in background */}
                        {ripples.map(r => {
                          const scale = r.anim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.8, 2.5],
                          });
                          const opacity = r.anim.interpolate({
                            inputRange: [0, 0.8, 1],
                            outputRange: [0.6, 0.3, 0],
                          });
                          return (
                            <Animated.View
                              key={r.id}
                              style={[
                                styles.rippleCircle,
                                {
                                  transform: [{ scale }],
                                  opacity,
                                }
                              ]}
                            />
                          );
                        })}

                        {/* Dynamic counter pill/badge */}
                        <View style={styles.bellCountBadge}>
                          <Ionicons name="notifications" size={14} color="#ea580c" />
                          <Text style={styles.bellCountText}>{bellCount}</Text>
                        </View>

                        {/* Target/Goal Badge */}
                        <View style={styles.bellTargetBadge}>
                          <Text style={styles.bellTargetText}>Target: 108</Text>
                        </View>

                        {/* Center Bell: glowing pulsating mandala, progress circle, and swinging temple bell */}
                        <View style={styles.centerBellContainer}>
                          {/* Dotted progress ring */}
                          <Svg width="126" height="126" style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
                            {/* Background dotted circle */}
                            <Circle
                              cx="63"
                              cy="63"
                              r="58"
                              stroke="rgba(217, 119, 6, 0.08)"
                              strokeWidth="2.5"
                              strokeDasharray="3, 5"
                              fill="transparent"
                            />
                            {/* Active dotted progress circle */}
                            <Circle
                              cx="63"
                              cy="63"
                              r="58"
                              stroke="#ea580c"
                              strokeWidth="3.2"
                              strokeDasharray="3, 5"
                              fill="transparent"
                              strokeDashoffset={2 * Math.PI * 58 * (1 - (bellCount % 108) / 108)}
                              strokeLinecap="round"
                            />
                          </Svg>

                          <Animated.View style={[
                            styles.haloInnerSolid,
                            { transform: [{ scale: mandalaScale }] }
                          ]}>
                            <Image
                              source={require('../../assets/imp_pngs/pngegg (2).png')}
                              style={styles.mandalaBgImage}
                            />
                          </Animated.View>

                          <TouchableOpacity
                            style={styles.divineBellTouchTarget}
                            onPress={handleBellTap}
                            activeOpacity={0.9}
                          >
                            <Animated.Image
                              source={require('../../assets/imp_pngs/pngegg (1).png')}
                              style={[
                                styles.divineBellImage,
                                { transform: [{ rotate: bellRotateInterpolate }] }
                              ]}
                            />
                          </TouchableOpacity>

                          {/* Floating "+1" text overlays */}
                          {floaters.map(f => {
                            const translateY = f.anim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0, -70],
                            });
                            const opacity = f.anim.interpolate({
                              inputRange: [0, 0.1, 0.8, 1],
                              outputRange: [0, 1, 1, 0],
                            });
                            const scale = f.anim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [0.7, 1.3],
                            });
                            return (
                              <Animated.View
                                key={f.id}
                                pointerEvents="none"
                                style={{
                                  position: 'absolute',
                                  top: 15,
                                  alignSelf: 'center',
                                  transform: [
                                    { translateY },
                                    { translateX: f.offset },
                                    { scale }
                                  ],
                                  opacity,
                                  zIndex: 99,
                                }}
                              >
                                <Text style={{
                                  color: '#ea580c',
                                  fontSize: 24,
                                  fontFamily: 'Outfit-ExtraBold',
                                  textShadowColor: 'rgba(255, 255, 255, 0.95)',
                                  textShadowOffset: { width: 1.5, height: 1.5 },
                                  textShadowRadius: 4,
                                }}>
                                  +1
                                </Text>
                              </Animated.View>
                            );
                          })}
                        </View>

                        {/* Bell Soundwave Visualizer Row */}
                        <View style={styles.bellVisualizerRow}>
                          {bellWaves.map((val, idx) => (
                            <Animated.View
                              key={idx}
                              style={[
                                styles.bellVisualizerBar,
                                {
                                  transform: [{ scaleY: val }]
                                }
                              ]}
                            />
                          ))}
                        </View>

                        {/* Milestone Celebration Toast */}
                        {milestoneText && (
                          <Animated.View
                            pointerEvents="none"
                            style={[
                              styles.celebrationContainer,
                              {
                                opacity: celebrationOpacity,
                                transform: [{ scale: celebrationScale }]
                              }
                            ]}
                          >
                            <Ionicons name="sparkles" size={20} color="#ea580c" />
                            <Text style={styles.celebrationText}>{milestoneText}</Text>
                            <Ionicons name="flower" size={24} color="#ea580c" style={{ marginTop: 4 }} />
                          </Animated.View>
                        )}
                      </View>

                      <View style={styles.benefitsCard}>
                        <View style={styles.benefitsHeaderRow}>
                          <Ionicons name="sparkles" size={14} color="#ea580c" />
                          <Text style={styles.benefitsHeaderTitle}>BENEFITS & SIGNIFICANCE</Text>
                        </View>
                        <Text style={styles.benefitsText}>
                          {activeTrack.description || 'Helps lower stress, clear negative blockages, and brings deep concentration and peace to the mind and body.'}
                        </Text>
                      </View>
                    </>
                  )}

                  {showQueueInPlayer && (
                    <View style={styles.queueBoardInsideCard}>
                      <Text style={styles.lyricsBoardTitle}>
                        {t('CHANTED QUEUE')}
                      </Text>
                      
                      <View style={{ maxHeight: 200, width: '100%', marginTop: 8 }}>
                        <ScrollView 
                          showsVerticalScrollIndicator={false}
                          contentContainerStyle={styles.queueScrollViewContent}
                          nestedScrollEnabled={true}
                        >
                          {(selectedDetailCategory ? categoryDetailTracks : filteredTracks).map((track) => {
                            const isCurrent = track.id === activeTrack.id;
                            return (
                              <TouchableOpacity
                                key={track.id}
                                style={[styles.playerQueueItem, isCurrent && styles.playerQueueItemActive]}
                                activeOpacity={0.7}
                                onPress={() => {
                                  const originalIdx = tracks.findIndex(t => t.id === track.id);
                                  if (originalIdx !== -1) {
                                    setActiveTrackIndex(originalIdx);
                                  }
                                }}
                              >
                                <Image 
                                  source={getDeityAvatar(track.category || '', track.thumbnail)} 
                                  style={styles.playerQueueThumbnail}
                                />
                                <View style={styles.playerQueueInfoCol}>
                                  <Text 
                                    style={[styles.playerQueueTitle, isCurrent && styles.playerQueueTitleActive]} 
                                    numberOfLines={1}
                                  >
                                    {track.title}
                                  </Text>
                                  <Text style={styles.playerQueueArtist} numberOfLines={1}>
                                    {track.artist}
                                  </Text>
                                </View>
                                {isCurrent && status.playing && (
                                  <Ionicons name="volume-medium" size={16} color="#ea580c" />
                                )}
                              </TouchableOpacity>
                            );
                          })}
                        </ScrollView>
                      </View>
                    </View>
                  )}

                </ScrollView>
              </View>

            </SafeAreaView>

          </View>
        </Modal>
      )}

      {/* 8. Premium Custom Permission Modal */}
      <Modal
        visible={isPermissionModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsPermissionModalVisible(false)}
      >
        <View style={styles.permissionModalOverlay}>
          <BlurView intensity={30} style={StyleSheet.absoluteFillObject} tint="dark" />
          <View style={styles.permissionModalContent}>
            
            {/* Header Icon */}
            <View style={styles.permissionModalHeaderIconContainer}>
              <LinearGradient
                colors={['#ffedd5', '#fed7aa']}
                style={styles.permissionHeaderGradient}
              >
                <Ionicons 
                  name={permissionModalType === 'SYSTEM' ? "notifications-circle-outline" : "battery-dead-outline"} 
                  size={48} 
                  color="#ea580c" 
                />
              </LinearGradient>
            </View>

            {/* Title */}
            <Text style={styles.permissionModalTitle}>
              {permissionModalType === 'SYSTEM' ? "Enable Alarm Settings" : "Optimize Battery Saver"}
            </Text>

            {/* Subtitle */}
            <Text style={styles.permissionModalDescription}>
              {permissionModalType === 'SYSTEM' 
                ? "Mantra Puja requires Exact Alarm & Notification permissions so the bhajan/mantra can ring precisely on time, even when the device is locked."
                : "Aggressive battery savers may stop alarms from ringing when the app is closed. Please disable battery optimization for Mantra Puja."}
            </Text>

            {/* Action Cards */}
            {permissionModalType === 'SYSTEM' ? (
              <View style={styles.permissionCardsList}>
                <View style={styles.permissionMiniCard}>
                  <Ionicons name="alarm-outline" size={20} color="#ea580c" />
                  <View style={styles.permissionMiniCardInfo}>
                    <Text style={styles.permissionMiniCardTitle}>Exact Alarms</Text>
                    <Text style={styles.permissionMiniCardText}>Allows alarms to trigger at the precise minute.</Text>
                  </View>
                </View>
                <View style={styles.permissionMiniCard}>
                  <Ionicons name="notifications-outline" size={20} color="#ea580c" />
                  <View style={styles.permissionMiniCardInfo}>
                    <Text style={styles.permissionMiniCardTitle}>Notification Alerts</Text>
                    <Text style={styles.permissionMiniCardText}>Shows snooze/dismiss controls on the lockscreen.</Text>
                  </View>
                </View>
              </View>
            ) : (
              <View style={styles.permissionCardsList}>
                <View style={styles.permissionMiniCard}>
                  <Ionicons name="flash-outline" size={20} color="#ea580c" />
                  <View style={styles.permissionMiniCardInfo}>
                    <Text style={styles.permissionMiniCardTitle}>Unrestricted Mode</Text>
                    <Text style={styles.permissionMiniCardText}>Allows playback & wake-locks when the screen is off.</Text>
                  </View>
                </View>
              </View>
            )}

            {/* Buttons */}
            <View style={styles.permissionModalActions}>
              <TouchableOpacity
                onPress={async () => {
                  setIsPermissionModalVisible(false);
                  if (permissionModalType === 'SYSTEM') {
                    await AlarmSystem.requestAlarmPermissions();
                  } else {
                    await AlarmSystem.requestBatteryOptimizationWaiver();
                    // Give a slight delay before showing the alarm config modal for the pending track
                    setTimeout(() => {
                      if (pendingAlarmTrack) {
                        setActiveAlarmTrack(pendingAlarmTrack);
                        setIsAlarmModalVisible(true);
                      }
                    }, 800);
                  }
                }}
                style={styles.permissionGrantBtn}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={['#ea580c', '#c2410c']}
                  style={styles.permissionGrantGradient}
                >
                  <Text style={styles.permissionGrantBtnText}>
                    {permissionModalType === 'SYSTEM' ? "Configure Settings" : "Ignore Optimization"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setIsPermissionModalVisible(false);
                  if (permissionModalType === 'BATTERY' && pendingAlarmTrack) {
                    // Let the user set the alarm anyway even if battery ignoring is skipped
                    setActiveAlarmTrack(pendingAlarmTrack);
                    setIsAlarmModalVisible(true);
                  }
                }}
                style={styles.permissionCancelBtn}
                activeOpacity={0.7}
              >
                <Text style={styles.permissionCancelBtnText}>
                  {permissionModalType === 'SYSTEM' ? "Cancel" : "Continue Anyway"}
                </Text>
              </TouchableOpacity>
            </View>

          </View>
        </View>
      </Modal>

      {/* 7. Premium Saffron Devotional Alarm Modal (Reference Phase 7) */}
      <Modal
        visible={isAlarmModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsAlarmModalVisible(false)}
      >
        <View style={styles.alarmModalOverlay}>
          <BlurView intensity={20} style={StyleSheet.absoluteFillObject} />
          <View style={styles.alarmModalContent}>
            <View style={styles.alarmModalHeader}>
              <Text style={styles.alarmModalTitle}>Schedule Alarm</Text>
              <TouchableOpacity onPress={() => setIsAlarmModalVisible(false)} style={styles.alarmModalCloseBtn}>
                <Ionicons name="close" size={22} color="#475569" />
              </TouchableOpacity>
            </View>

            {isSavingAlarm ? (
              <View style={{ paddingVertical: 45, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color="#ea580c" />
                <Text style={{
                  fontSize: 16,
                  fontFamily: 'Outfit-Bold',
                  color: '#0f172a',
                  marginTop: 20,
                  marginBottom: 10,
                  textAlign: 'center',
                }}>
                  {downloadStatusText}
                </Text>
                
                {/* Progress Bar */}
                <View style={{
                  width: '100%',
                  height: 6,
                  backgroundColor: '#f1f5f9',
                  borderRadius: 3,
                  overflow: 'hidden',
                  marginTop: 10,
                  marginBottom: 20,
                }}>
                  <View style={{
                    width: `${downloadProgress * 100}%`,
                    height: '100%',
                    backgroundColor: '#ea580c',
                    borderRadius: 3,
                  }} />
                </View>
                
                <Text style={{
                  fontSize: 13,
                  fontFamily: 'Outfit-Medium',
                  color: '#64748b',
                  textAlign: 'center',
                }}>
                  Downloading "{activeAlarmTrack?.title}" for offline playback.
                </Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.alarmModalScroll}>
                <Text style={styles.alarmModalSubtitle}>
                  Chant: <Text style={{ color: '#ea580c', fontFamily: 'Outfit-Bold' }}>{activeAlarmTrack?.title}</Text>
                </Text>

                {/* Time Picker Controls using Android Wheel Pickers */}
                <View style={{
                  flexDirection: 'row',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 12,
                  marginVertical: 20,
                }}>
                  <AndroidWheelPicker
                    items={hourItems}
                    selectedValue={alarmHour.toString()}
                    onValueChange={handleHourChange}
                    width={75}
                  />
                  
                  <Text style={{ fontSize: 24, fontFamily: 'Outfit-Bold', color: '#f97316' }}>:</Text>
                  
                  <AndroidWheelPicker
                    items={minuteItems}
                    selectedValue={alarmMinute < 10 ? '0' + alarmMinute : alarmMinute.toString()}
                    onValueChange={handleMinuteChange}
                    width={75}
                  />

                  <AndroidWheelPicker
                    items={periodItems}
                    selectedValue={alarmPeriod}
                    onValueChange={(val) => setAlarmPeriod(val as any)}
                    width={75}
                  />
                </View>

                {/* Alarm Label Input */}
                <Text style={styles.sectionLabel}>Alarm Label</Text>
                <TextInput
                  style={styles.labelInput}
                  placeholder="Morning Jaap, Sandhya Aarti..."
                  placeholderTextColor="#94a3b8"
                  value={alarmLabel}
                  onChangeText={setAlarmLabel}
                />

                {/* Repeat Options */}
                <Text style={styles.sectionLabel}>Repeat Interval</Text>
                <View style={styles.repeatGrid}>
                  {[
                    { label: 'Once', value: 'ONCE' },
                    { label: 'Daily', value: 'DAILY' },
                    { label: 'Weekdays', value: 'WEEKDAYS' },
                    { label: 'Custom', value: 'CUSTOM' },
                    { label: 'Brahma Muhurta', value: 'MUHURTA' }
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.value}
                      style={[styles.repeatPill, alarmRepeatType === item.value && styles.repeatPillActive]}
                      onPress={() => setAlarmRepeatType(item.value as any)}
                    >
                      <Text style={[styles.repeatPillText, alarmRepeatType === item.value && styles.repeatPillTextActive]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Custom Weekdays Picker Row */}
                {alarmRepeatType === 'CUSTOM' && (
                  <View style={styles.weekdaysRow}>
                    {[
                      { label: 'Su', mask: 1 },
                      { label: 'Mo', mask: 2 },
                      { label: 'Tu', mask: 4 },
                      { label: 'We', mask: 8 },
                      { label: 'Th', mask: 16 },
                      { label: 'Fr', mask: 32 },
                      { label: 'Sa', mask: 64 }
                    ].map((day) => {
                      const active = (alarmWeekdaysMask & day.mask) !== 0;
                      return (
                        <TouchableOpacity
                          key={day.mask}
                          style={[styles.weekdayCircle, active && styles.weekdayCircleActive]}
                          onPress={() => {
                            setAlarmWeekdaysMask(prev => active ? prev & ~day.mask : prev | day.mask);
                          }}
                        >
                          <Text style={[styles.weekdayText, active && styles.weekdayTextActive]}>
                            {day.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* Safe battery warning disclaimer */}
                <View style={styles.batteryWarningCard}>
                  <Ionicons name="shield-checkmark-outline" size={18} color="#059669" style={{ marginRight: 6 }} />
                  <Text style={styles.batteryWarningText}>
                    Alarms are scheduled offline. Make sure notifications are enabled for this app.
                  </Text>
                </View>

                {/* Action Buttons */}
                <View style={styles.modalActionsRow}>
                  <TouchableOpacity
                    onPress={() => setIsAlarmModalVisible(false)}
                    style={[styles.modalButton, styles.modalButtonCancel]}
                  >
                    <Text style={styles.modalButtonCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={handleSaveAlarm}
                    style={[styles.modalButton, styles.modalButtonSave]}
                  >
                    <Text style={styles.modalButtonSaveText}>Set Alarm</Text>
                  </TouchableOpacity>
                </View>

              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <DraggableCalendarButton />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  headerContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9'
  },
  headerRow: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  menuIconButton: {
    padding: 4
  },
  headerCenteredTitle: {
    fontSize: 19,
    fontFamily: 'Outfit-Bold',
    color: '#0f172a',
  },
  spotifyAvatarContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    overflow: 'hidden'
  },
  spotifyAvatar: {
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  greetingContainer: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  greetingText: {
    fontSize: 24,
    fontFamily: 'Outfit-ExtraBold',
    color: '#0f172a',
  },
  greetingSubtext: {
    fontSize: 13,
    fontFamily: 'Outfit-Medium',
    color: '#94a3b8',
    marginTop: 3
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#f1f5f9',
    borderRadius: 14,
    marginHorizontal: 20,
    marginTop: 20,
    paddingHorizontal: 12,
    height: 50,
  },
  searchIcon: {
    marginRight: 10
  },
  searchBarInput: {
    flex: 1,
    fontSize: 13,
    fontFamily: 'Outfit-Medium',
    color: '#0f172a',
    height: '100%'
  },
  filterButton: {
    padding: 6
  },
  carouselSection: {
    marginTop: 26,
  },
  carouselHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 14
  },
  sectionHeading: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
    color: '#0f172a'
  },
  showMoreText: {
    fontSize: 12.5,
    fontFamily: 'Outfit-Bold',
    color: '#94a3b8'
  },
  carouselScrollContent: {
    paddingHorizontal: 20,
    gap: 16
  },
  trendingCard: {
    width: 140,
    height: 190,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 3
  },
  trendingCardBg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  trendingCardDetails: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    zIndex: 2
  },
  trendingCardTitle: {
    fontSize: 13.5,
    fontFamily: 'Outfit-Bold',
    color: '#ffffff'
  },
  trendingCardSubtitle: {
    fontSize: 10,
    fontFamily: 'Outfit-Medium',
    color: '#cbd5e1',
    marginTop: 2
  },
  trendingCardPlayCircle: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ea580c',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 3,
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4
  },
  tabsSection: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 26,
    gap: 22
  },
  tabItem: {
    paddingVertical: 6,
    position: 'relative'
  },
  tabText: {
    fontSize: 14.5,
    fontFamily: 'Outfit-Bold',
    color: '#94a3b8'
  },
  tabTextActive: {
    color: '#ea580c'
  },
  tabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2.5,
    borderRadius: 1.5,
    backgroundColor: '#ea580c'
  },
  playlistSection: {
    marginTop: 20,
    paddingHorizontal: 20,
  },
  emptyPlaylistContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8
  },
  emptyPlaylistText: {
    fontSize: 13,
    color: '#94a3b8',
    fontFamily: 'Outfit-Medium'
  },
  trackListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  trackListItemActive: {
    borderColor: '#ea580c',
    backgroundColor: '#fff7ed'
  },
  trackListThumbnail: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#f1f5f9'
  },
  trackListInfoCol: {
    flex: 1,
    marginLeft: 14,
    justifyContent: 'center'
  },
  trackListItemTitle: {
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
    color: '#0f172a'
  },
  trackListItemTitleActive: {
    color: '#ea580c'
  },
  trackListItemArtist: {
    fontSize: 11.5,
    fontFamily: 'Outfit-Medium',
    color: '#64748b',
    marginTop: 3
  },
  trackListItemDuration: {
    fontSize: 12,
    fontFamily: 'Outfit-Medium',
    color: '#64748b',
    marginRight: 10
  },
  trackListPlayIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#ea580c',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 1
  },
  trackListPlayIconActive: {
    backgroundColor: '#ea580c'
  },
  trackDotsMenu: {
    padding: 6
  },
  visualizerWaveWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3.5,
    width: 24,
    height: 24,
    justifyContent: 'center'
  },
  waveLine: {
    width: 3,
    backgroundColor: '#ea580c',
    borderRadius: 1.5
  },
  miniPlayerBar: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ffedd5',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
    overflow: 'hidden'
  },
  miniPlayerProgressBackground: {
    height: 2.5,
    backgroundColor: '#f1f5f9',
    width: '100%'
  },
  miniPlayerProgressFill: {
    height: '100%',
    backgroundColor: '#ea580c'
  },
  miniPlayerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  miniPlayerThumbnail: {
    width: 38,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#f1f5f9'
  },
  miniPlayerInfoCol: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center'
  },
  miniPlayerTitle: {
    fontSize: 13.5,
    fontFamily: 'Outfit-Bold',
    color: '#0f172a'
  },
  miniPlayerSubtitle: {
    fontSize: 10.5,
    fontFamily: 'Outfit-Medium',
    color: '#64748b',
    marginTop: 2
  },
  miniPlayerControlsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16
  },
  miniPlayerControlBtn: {
    padding: 4
  },
  modalBackground: {
    flex: 1,
    backgroundColor: '#fffcf8'
  },
  overlayShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.45)'
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12
  },
  modalTopIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2
  },
  modalPlayerTitle: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
    color: '#0f172a'
  },
  modalScrollContent: {
    width: '100%',
    paddingBottom: 85,
    alignItems: 'center'
  },
  playerCardFrame: {
    flex: 1,
    width: '100%',
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingTop: 16,
    paddingHorizontal: 24,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 10,
    marginTop: 16,
    overflow: 'hidden'
  },
  listeningToLabel: {
    fontSize: 11,
    fontFamily: 'Outfit-Bold',
    color: '#94a3b8',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 8
  },
  playerCoverArtWrapper: {
    width: width * 0.46,
    height: width * 0.46,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 6,
    marginBottom: 10,
    backgroundColor: '#f1f5f9'
  },
  playerCoverArt: {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  },
  playerTitleText: {
    fontSize: 20,
    fontFamily: 'Outfit-Bold',
    color: '#0f172a',
    textAlign: 'center'
  },
  playerArtistText: {
    fontSize: 13,
    fontFamily: 'Outfit-Medium',
    color: '#64748b',
    textAlign: 'center',
    marginTop: 6
  },
  sliderSection: {
    width: '100%',
    marginTop: 12,
    paddingHorizontal: 4
  },
  sliderTrackBackground: {
    height: 4.5,
    backgroundColor: '#cbd5e1',
    borderRadius: 3,
    width: '100%',
    position: 'relative'
  },
  sliderTrackFill: {
    height: '100%',
    backgroundColor: '#ea580c',
    borderRadius: 3
  },
  sliderThumbIndicator: {
    position: 'absolute',
    top: -5,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#ffffff',
    borderWidth: 3,
    borderColor: '#ea580c',
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 1
  },
  sliderTimestampsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10
  },
  sliderTimeLabel: {
    fontSize: 11,
    fontFamily: 'Outfit-Medium',
    color: '#64748b'
  },
  mediaButtonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 14,
    paddingHorizontal: 6
  },
  mediaSideBtn: {
    padding: 8
  },
  mediaControlBtn: {
    padding: 8
  },
  playPauseGroupContainer: {
    width: 90,
    height: 90,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  mandalaPlayBg: {
    position: 'absolute',
    width: 90,
    height: 90,
    resizeMode: 'contain',
    opacity: 0.85,
  },
  largePlayCircleFab: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4
  },
  largePlayFabGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  lyricsBoardContainer: {
    width: width * 0.88,
    height: 150,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    borderWidth: 1.5,
    borderColor: 'rgba(234, 88, 12, 0.08)',
    borderRadius: 24,
    marginTop: 20,
    padding: 14,
    overflow: 'hidden',
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2
  },
  lyricsBoardTitle: {
    fontSize: 10,
    fontFamily: 'Outfit-Bold',
    color: '#ea580c',
    letterSpacing: 1.5,
    marginBottom: 6,
    textAlign: 'center'
  },
  lyricsScrollViewContent: {
    paddingVertical: 10,
    alignItems: 'center'
  },
  lyricLineText: {
    fontSize: 13.5,
    fontFamily: 'Outfit-Medium',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginVertical: 4,
    width: '90%'
  },
  lyricLineTextActive: {
    fontSize: 15,
    fontFamily: 'Outfit-Bold',
    color: '#ea580c',
    textShadowColor: 'rgba(234, 88, 12, 0.25)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 6
  },

  /* CATEGORY DETAIL STYLES (Reference 3) */
  detailBannerImage: {
    width: '100%',
    height: height * 0.36,
    justifyContent: 'space-between',
    position: 'relative'
  },
  detailHeaderTopRow: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  detailBackCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  detailBannerInfoContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24
  },
  detailCategoryName: {
    fontSize: 26,
    fontFamily: 'Outfit-ExtraBold',
    color: '#0f172a',
    textShadowColor: 'rgba(255, 255, 255, 0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4
  },
  detailCategoryMetadata: {
    fontSize: 13.5,
    fontFamily: 'Outfit-Medium',
    color: '#475569',
    marginTop: 4
  },
  floatingPlayFab: {
    position: 'absolute',
    bottom: -28,
    right: 28,
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    zIndex: 10
  },
  playFabGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center'
  },
  detailListBody: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    marginTop: -20,
    paddingTop: 24,
    paddingHorizontal: 20,
    shadowColor: '#64748b',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.04,
    shadowRadius: 12,
    elevation: 4
  },
  detailTracksHeader: {
    marginBottom: 12
  },
  detailTracksTitle: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
    color: '#0f172a'
  },
  detailTabsContainer: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingBottom: 4
  },
  detailTabItem: {
    paddingVertical: 6,
    position: 'relative'
  },
  detailTabText: {
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
    color: '#94a3b8'
  },
  detailTabTextActive: {
    color: '#ea580c'
  },
  detailTabUnderline: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2.5,
    borderRadius: 1.5,
    backgroundColor: '#ea580c'
  },
  addMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#ffedd5',
    borderRadius: 12,
    paddingVertical: 12,
    marginHorizontal: 20,
    marginTop: 12,
    marginBottom: 8,
    gap: 6,
  },
  addMoreButtonText: {
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
    color: '#ea580c',
  },
  sheetHandleLine: {
    width: 36,
    height: 4.5,
    borderRadius: 2.25,
    backgroundColor: '#cbd5e1',
    alignSelf: 'center',
    marginBottom: 10
  },
  queueScrollViewContent: {
    paddingVertical: 4,
  },
  playerQueueItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
    gap: 10,
  },
  playerQueueItemActive: {
    backgroundColor: '#fff7ed',
  },
  playerQueueThumbnail: {
    width: 32,
    height: 32,
    borderRadius: 6,
  },
  playerQueueInfoCol: {
    flex: 1,
  },
  playerQueueTitle: {
    fontSize: 13,
    fontFamily: 'Outfit-Bold',
    color: '#0f172a',
  },
  playerQueueTitleActive: {
    color: '#ea580c',
  },
  playerQueueArtist: {
    fontSize: 11,
    fontFamily: 'Outfit-Medium',
    color: '#64748b',
    marginTop: 1,
  },
  queueBoardInsideCard: {
    width: '100%',
    marginTop: 24,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9'
  },
  visualizerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
    gap: 4,
    marginTop: 10,
    marginBottom: 6,
    width: '100%',
  },
  visualizerBar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: '#ea580c',
  },
  speedRowAboveCard: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    width: '100%',
    paddingHorizontal: 4,
    marginTop: 10,
    marginBottom: 4,
  },
  speedPillBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    borderWidth: 1.2,
    borderColor: '#ffedd5',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
    gap: 4,
  },
  speedPillText: {
    fontSize: 11,
    fontFamily: 'Outfit-Bold',
    color: '#ea580c',
  },
  divineBellCard: {
    width: '100%',
    height: 154,
    borderRadius: 24,
    marginTop: 10,
    marginBottom: 8,
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#ffedd5',
    position: 'relative',
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    justifyContent: 'center',
  },
  rippleCircle: {
    position: 'absolute',
    alignSelf: 'center',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 1.5,
    borderColor: 'rgba(234, 88, 12, 0.25)',
    zIndex: 1,
  },
  bellCountBadge: {
    position: 'absolute',
    top: 12,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    borderWidth: 1.2,
    borderColor: '#ffedd5',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
    gap: 4,
    zIndex: 20,
  },
  bellCountText: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    color: '#ea580c',
  },
  bellTargetBadge: {
    position: 'absolute',
    top: 12,
    right: 16,
    backgroundColor: '#fffdfa',
    borderWidth: 1.2,
    borderColor: '#fef3c7',
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
    zIndex: 20,
  },
  bellTargetText: {
    fontSize: 11,
    fontFamily: 'Outfit-Bold',
    color: '#94a3b8',
  },
  centerBellContainer: {
    position: 'absolute',
    left: '50%',
    marginLeft: -60,
    top: 12,
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  haloInnerSolid: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255,253,248,0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#f59e0b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    position: 'absolute',
  },
  mandalaBgImage: {
    width: '100%',
    height: '100%',
    opacity: 0.15,
    resizeMode: 'contain',
  },
  divineBellTouchTarget: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 15,
  },
  divineBellImage: {
    width: 105,
    height: 105,
    resizeMode: 'contain',
  },
  bellVisualizerRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 4,
    position: 'absolute',
    bottom: 10,
    width: '100%',
    height: 24,
    zIndex: 5,
  },
  bellVisualizerBar: {
    width: 3,
    height: 16,
    backgroundColor: 'rgba(245, 158, 11, 0.4)',
    borderRadius: 1.5,
  },
  celebrationContainer: {
    position: 'absolute',
    alignSelf: 'center',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 253, 248, 0.98)',
    borderWidth: 1.5,
    borderColor: '#fbd38d',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 20,
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 100,
    top: '12%',
  },
  celebrationText: {
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
    color: '#ea580c',
    marginTop: 4,
    textAlign: 'center',
  },
  benefitsCard: {
    width: '100%',
    backgroundColor: '#fffbeb',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#fef3c7',
    marginTop: 8,
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
  },
  benefitsHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  benefitsHeaderTitle: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    color: '#ea580c',
    letterSpacing: 1,
  },
  benefitsText: {
    fontSize: 13,
    fontFamily: 'Outfit-Medium',
    color: '#78350f',
    lineHeight: 18,
  },
  listPlayBtnGroup: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  mandalaListPlayBg: {
    position: 'absolute',
    width: 44,
    height: 44,
    resizeMode: 'contain',
    opacity: 0.85,
  },
  alarmModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  alarmModalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '85%',
  },
  alarmModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  alarmModalTitle: {
    fontSize: 20,
    fontFamily: 'Outfit-Bold',
    color: '#0f172a',
  },
  alarmModalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  alarmModalScroll: {
    paddingBottom: 20,
  },
  alarmModalSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 20,
  },
  timePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 20,
    paddingVertical: 20,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    marginBottom: 24,
  },
  pickerCol: {
    alignItems: 'center',
    width: 80,
  },
  pickerArrow: {
    padding: 6,
  },
  pickerValue: {
    fontSize: 34,
    fontFamily: 'Outfit-Bold',
    color: '#ea580c',
    marginVertical: 4,
  },
  pickerLabel: {
    fontSize: 10,
    color: '#94a3b8',
    textTransform: 'uppercase',
    fontWeight: '700',
    marginTop: 4,
  },
  timeColon: {
    fontSize: 34,
    fontFamily: 'Outfit-Bold',
    color: '#ea580c',
    marginHorizontal: 10,
    paddingBottom: 20,
  },
  periodContainer: {
    alignItems: 'center',
    width: 80,
    justifyContent: 'center',
  },
  periodPill: {
    backgroundColor: '#ea580c',
    borderRadius: 15,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginVertical: 12,
  },
  periodText: {
    color: '#ffffff',
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
  },
  sectionLabel: {
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
    color: '#334155',
    marginBottom: 8,
    marginTop: 12,
  },
  labelInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 14,
    color: '#0f172a',
    marginBottom: 20,
  },
  repeatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  repeatPill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  repeatPillActive: {
    backgroundColor: '#fff7ed',
    borderColor: '#fdba74',
  },
  repeatPillText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  repeatPillTextActive: {
    color: '#ea580c',
    fontWeight: '700',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 20,
  },
  weekdayCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  weekdayCircleActive: {
    backgroundColor: '#ea580c',
    borderColor: '#ea580c',
  },
  weekdayText: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  weekdayTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  batteryWarningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
  },
  batteryWarningText: {
    flex: 1,
    fontSize: 11,
    color: '#065f46',
    lineHeight: 16,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  modalButtonCancelText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '700',
  },
  modalButtonSave: {
    backgroundColor: '#ea580c',
  },
  modalButtonSaveText: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: '700',
  },
  permissionModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  permissionModalContent: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 8,
  },
  permissionModalHeaderIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
    marginBottom: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionHeaderGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionModalTitle: {
    fontSize: 20,
    fontFamily: 'Outfit-Bold',
    color: '#0f172a',
    marginBottom: 8,
    textAlign: 'center',
  },
  permissionModalDescription: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  permissionCardsList: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  permissionMiniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    gap: 12,
  },
  permissionMiniCardInfo: {
    flex: 1,
  },
  permissionMiniCardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  permissionMiniCardText: {
    fontSize: 11,
    color: '#64748b',
    lineHeight: 15,
  },
  permissionModalActions: {
    width: '100%',
    gap: 10,
  },
  permissionGrantBtn: {
    width: '100%',
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  permissionGrantGradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionGrantBtnText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  permissionCancelBtn: {
    width: '100%',
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  permissionCancelBtnText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
});
