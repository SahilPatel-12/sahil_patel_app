import { useFocusEffect } from '@react-navigation/native';
import { useAudioPlayer } from 'expo-audio';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Dimensions,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Modal,
  ActivityIndicator
} from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../services/supabase';
import { Image as ExpoImage } from 'expo-image';
import { safeStorage } from '../../services/storage';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';


const { width, height } = Dimensions.get('window');

const getFlowerSource = (name: string, imageUrl?: string) => {
  if (imageUrl && imageUrl.trim() !== '') {
    return { uri: imageUrl };
  }
  switch (name.toLowerCase()) {
    case 'rose':
      return { uri: 'https://i.postimg.cc/85zM6m7h/rose.png' };
    case 'lotus':
      return { uri: 'https://i.postimg.cc/zX2b6BdB/lotus.png' };
    case 'jasmine':
      return { uri: 'https://i.postimg.cc/9F7zH7q6/jasmine.png' };
    case 'marigold':
    default:
      return require('../../assets/God/flower1.png');
  }
};

const getThaliSource = (name: string, imageUrl?: string) => {
  if (imageUrl && imageUrl.trim() !== '') {
    return { uri: imageUrl };
  }
  switch (name.toLowerCase()) {
    case 'silver thali':
      return { uri: 'https://i.postimg.cc/J0vH4Z3H/silver-thali.png' };
    case 'golden thali':
      return { uri: 'https://i.postimg.cc/c1X8sZ13/golden-thali.png' };
    case 'brass thali':
    default:
      return require('../../assets/God/arti.gif');
  }
};

const GOD_DATA = [
  { id: '1', name: 'Shiv Ji', image: require('../../assets/bhagwan/shiva.png'), color: '#3498db' },
  { id: '2', name: 'Ma Laxmi', image: require('../../assets/bhagwan/lakshmi.png'), color: '#e74c3c' },
  { id: '3', name: 'Ganesha', image: require('../../assets/bhagwan/ganesha.png'), color: '#f39c12' },
  { id: '4', name: 'Hanuman', image: require('../../assets/bhagwan/hanuman.png'), color: '#e67e22' },
  { id: '5', name: 'Durga Ma', image: require('../../assets/bhagwan/durga.png'), color: '#c0392b' },
  { id: '6', name: 'Krishna Ji', image: require('../../assets/bhagwan/krishna.png'), color: '#9b59b6' },
  { id: '7', name: 'Venkateswara', image: require('../../assets/God/Lord Venkateswara Images Full Hd Wallpaper 1.png'), color: '#f1c40f' },
];

const FALLBACK_IMAGES: Record<string, any[]> = {
  'Shiv Ji': [
    { id: 'fb-shiva-1', image_url: '', local_image: require('../../assets/God/god1.png') }
  ],
  'Ma Laxmi': [
    { id: 'fb-laxmi-1', image_url: '', local_image: require('../../assets/God/god.png') }
  ],
  'Venkateswara': [
    { id: 'fb-venkateswara-1', image_url: '', local_image: require('../../assets/God/Lord Venkateswara Images Full Hd Wallpaper 1.png') }
  ],
  'Ganesha': [
    { id: 'fb-ganesha-1', image_url: '', local_image: require('../../assets/bhagwan/ganesha.png') }
  ],
  'Hanuman': [
    { id: 'fb-hanuman-1', image_url: '', local_image: require('../../assets/bhagwan/hanuman.png') }
  ],
  'Durga Ma': [
    { id: 'fb-durga-1', image_url: '', local_image: require('../../assets/bhagwan/durga.png') }
  ],
  'Krishna Ji': [
    { id: 'fb-krishna-1', image_url: '', local_image: require('../../assets/bhagwan/krishna.png') }
  ]
};

const FLOWER_OPTIONS = [
  { id: 'fl-1', name: 'Marigold', source: require('../../assets/God/flower1.png'), blossom_timing: 4000, shower_duration: 10000 },
  { id: 'fl-2', name: 'Rose', source: require('../../assets/God/flower1.png'), blossom_timing: 4000, shower_duration: 10000 },
  { id: 'fl-3', name: 'Lotus', source: require('../../assets/God/flower1.png'), blossom_timing: 4000, shower_duration: 10000 },
  { id: 'fl-4', name: 'Jasmine', source: require('../../assets/God/flower1.png'), blossom_timing: 4000, shower_duration: 10000 },
];

const THALI_OPTIONS = [
  { id: 'th-1', name: 'Brass Thali', source: require('../../assets/God/arti.gif') },
  { id: 'th-2', name: 'Silver Thali', source: require('../../assets/God/arti.gif') },
  { id: 'th-3', name: 'Golden Thali', source: require('../../assets/God/arti.gif') },
];

// Sub-component for individual flower animation
const AnimatedExpoImage = Animated.createAnimatedComponent(ExpoImage);

const FlowerItem = ({ data, source }: { data: any; source: any }) => {
  const translateY = useSharedValue(data.startY);
  const translateX = useSharedValue(data.startX);
  const rotation = useSharedValue(0);

  useEffect(() => {
    const initialDistance = Math.max(50, (height + 100) - data.startY);
    const fullDistance = height + 150; // distance from -50 to height + 100
    const initialDuration = data.duration * (initialDistance / fullDistance);

    translateY.value = withSequence(
      withTiming(height + 100, { duration: initialDuration, easing: Easing.linear }),
      withTiming(-50, { duration: 0 }),
      withRepeat(
        withTiming(height + 100, { duration: data.duration, easing: Easing.linear }),
        -1,
        false
      )
    );

    translateX.value = withRepeat(
      withTiming(data.startX + 50, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
      -1,
      true
    );

    rotation.value = withRepeat(
      withTiming(360, { duration: data.rotationSpeed, easing: Easing.linear }),
      -1,
      false
    );

    return () => {
      cancelAnimation(translateY);
      cancelAnimation(translateX);
      cancelAnimation(rotation);
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotation.value}deg` }
    ],
    position: 'absolute',
    top: 0,
    left: 0,
    width: data.size,
    height: data.size,
  }));

  return (
    <AnimatedExpoImage
      source={source}
      style={animatedStyle}
      contentFit="contain"
    />
  );
};

export default function GodScreen() {
  const { t } = useLanguage();
  const [categories, setCategories] = useState<any[]>(GOD_DATA);
  const [selectedGod, setSelectedGod] = useState(GOD_DATA[1]); // Default to Ma Laxmi
  const [displayImages, setDisplayImages] = useState<any[]>([]);
  const [isLoadingImages, setIsLoadingImages] = useState(false);
  const [debugStatus, setDebugStatus] = useState<string>('');
  const flatListRef = useRef<FlatList>(null);

  const leftBellRotation = useSharedValue(0);
  const rightBellRotation = useSharedValue(0);
  const bellPlayer = useAudioPlayer(require('../../assets/Sound/bell_sound.mp3'), {
    downloadFirst: true,
    keepAudioSessionActive: true,
  });
  const [isFlowersActive, setIsFlowersActive] = useState(false);
  const [flowers, setFlowers] = useState<any[]>([]);
  const [isArtiActive, setIsArtiActive] = useState(false);
  const thaliProgress = useSharedValue(0);
  const thaliOpacity = useSharedValue(0);

  useEffect(() => {
    thaliOpacity.value = withTiming(isArtiActive ? 1 : 0, { duration: 300 });
  }, [isArtiActive]);

  const [flowerOptions, setFlowerOptions] = useState<any[]>(FLOWER_OPTIONS);
  const [thaliOptions, setThaliOptions] = useState<any[]>(THALI_OPTIONS);

  const [selectedFlower, setSelectedFlower] = useState<any>(FLOWER_OPTIONS[0]);
  const [selectedThali, setSelectedThali] = useState<any>(THALI_OPTIONS[0]);
  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [activePoojaTab, setActivePoojaTab] = useState<'flowers' | 'thali'>('flowers');

  const [coinBalance, setCoinBalance] = useState<number>(50);
  const [unlockedFlowerIds, setUnlockedFlowerIds] = useState<string[]>([]);
  const [unlockedThaliIds, setUnlockedThaliIds] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [itemToUnlock, setItemToUnlock] = useState<any>(null);
  const [unlockType, setUnlockType] = useState<'flower' | 'thali' | null>(null);
  const [isUnlocking, setIsUnlocking] = useState(false);

  const loadUserWalletAndUnlockedFlowers = useCallback(async () => {
    try {
      const sessionStr = await safeStorage.getItem('user_session');
      if (!sessionStr) return;
      const parsed = JSON.parse(sessionStr);
      setUserId(parsed.id);

      // Fetch wallet balance
      const { data: walletData } = await supabase
        .from('user_wallets')
        .select('balance')
        .eq('user_id', parsed.id)
        .maybeSingle();
      
      if (walletData) {
        setCoinBalance(walletData.balance);
      } else {
        // Self-heal
        await supabase.from('user_wallets').upsert({ user_id: parsed.id, balance: 50 });
        setCoinBalance(50);
      }

      // Fetch unlocked flowers
      const { data: unlockedData } = await supabase
        .from('user_unlocked_flowers')
        .select('flower_id')
        .eq('user_id', parsed.id);
      
      if (unlockedData) {
        setUnlockedFlowerIds(unlockedData.map((d: any) => d.flower_id));
      }

      // Fetch unlocked thalis
      const { data: unlockedThaliData } = await supabase
        .from('user_unlocked_thalis')
        .select('thali_id')
        .eq('user_id', parsed.id);
      
      if (unlockedThaliData) {
        setUnlockedThaliIds(unlockedThaliData.map((d: any) => d.thali_id));
      }
    } catch (err) {
      console.error('[GodScreen] Error loading wallet/unlocked flowers & thalis:', err);
    }
  }, []);

  const bottomSheetTranslateY = useSharedValue(height);
  const flowerTimerRef = useRef<any>(null);

  const openBottomSheet = (tab: 'flowers' | 'thali') => {
    setActivePoojaTab(tab);
    setIsBottomSheetOpen(true);
    bottomSheetTranslateY.value = withTiming(0, {
      duration: 350,
      easing: Easing.out(Easing.back(0.5)),
    });
  };

  const closeBottomSheet = () => {
    bottomSheetTranslateY.value = withTiming(height, {
      duration: 300,
      easing: Easing.in(Easing.ease),
    });
    setIsBottomSheetOpen(false);
  };

  const bottomSheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: bottomSheetTranslateY.value }],
  }));

  const handleOfferFlower = () => {
    if (flowerTimerRef.current) {
      clearTimeout(flowerTimerRef.current);
      flowerTimerRef.current = null;
    }

    if (isFlowersActive) {
      setIsFlowersActive(false);
      setFlowers([]);
    } else {
      setIsFlowersActive(true);
      const baselineDuration = selectedFlower.blossom_timing || 4000;
      const newFlowers = Array.from({ length: 60 }).map((_, i) => ({
        id: i,
        startX: Math.random() * width,
        startY: Math.random() * (height + 150) - 50,
        duration: baselineDuration + (Math.random() - 0.5) * 1500,
        rotationSpeed: 1000 + Math.random() * 1000,
        size: 20 + Math.random() * 20,
      }));
      setFlowers(newFlowers);

      const showerDuration = selectedFlower.shower_duration || 10000;
      flowerTimerRef.current = setTimeout(() => {
        setIsFlowersActive(false);
        setFlowers([]);
        flowerTimerRef.current = null;
      }, showerDuration);
    }
    closeBottomSheet();
  };

  const handleToggleAarti = () => {
    if (isArtiActive) {
      setIsArtiActive(false);
      cancelAnimation(thaliProgress);
    } else {
      setIsArtiActive(true);
      thaliProgress.value = 0;
      thaliProgress.value = withRepeat(
        withTiming(1, { duration: 4000, easing: Easing.linear }),
        -1,
        false
      );
    }
    closeBottomSheet();
  };

  const toggleFlowers = () => {
    if (flowerTimerRef.current) {
      clearTimeout(flowerTimerRef.current);
      flowerTimerRef.current = null;
    }

    if (!isFlowersActive) {
      setIsFlowersActive(true);
      const baselineDuration = selectedFlower.blossom_timing || 4000;
      // Generate 60 random flowers for a denser shower
      const newFlowers = Array.from({ length: 60 }).map((_, i) => ({
        id: i,
        startX: Math.random() * width,
        startY: Math.random() * (height + 150) - 50,
        duration: baselineDuration + (Math.random() - 0.5) * 1500,
        rotationSpeed: 1000 + Math.random() * 1000,
        size: 20 + Math.random() * 20,
      }));
      setFlowers(newFlowers);

      const showerDuration = selectedFlower.shower_duration || 10000;
      flowerTimerRef.current = setTimeout(() => {
        setIsFlowersActive(false);
        setFlowers([]);
        flowerTimerRef.current = null;
      }, showerDuration);
    } else {
      setIsFlowersActive(false);
      setFlowers([]);
    }
  };

  const toggleArti = () => {
    if (!isArtiActive) {
      setIsArtiActive(true);
      thaliProgress.value = 0;
      thaliProgress.value = withRepeat(
        withTiming(1, { duration: 4000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      setIsArtiActive(false);
      cancelAnimation(thaliProgress);
    }
  };

  const fetchGodImages = async (categoryName: string) => {
    console.log(`[GodScreen] fetchGodImages started for: "${categoryName}"`);
    setIsLoadingImages(true);
    setDebugStatus(`Querying database for "${categoryName}"...`);
    try {
      const { data, error } = await supabase
        .from('god_images')
        .select('*')
        .eq('category', categoryName)
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('[GodScreen] Supabase error fetching deity images:', error);
        setDebugStatus(`Supabase Error: ${error.message}`);
        useFallback(categoryName);
      } else {
        console.log(`[GodScreen] Supabase returned ${data?.length || 0} images for ${categoryName}`);
        setDebugStatus(`Loaded ${data?.length || 0} images from Supabase`);
        if (data && data.length > 0) {
          setDisplayImages(data);
          
          // Prefetch dynamic images for active category
          const urls = data.map(d => d.image_url).filter(Boolean);
          if (urls.length > 0) {
            console.log(`[GodScreen] Prefetching active category images:`, urls);
            ExpoImage.prefetch(urls);
          }
        } else {
          useFallback(categoryName);
        }
      }
    } catch (err: any) {
      console.error('[GodScreen] Exception fetching deity images:', err);
      setDebugStatus(`Exception: ${err.message || err}`);
      useFallback(categoryName);
    } finally {
      setIsLoadingImages(false);
    }
  };

  const useFallback = (categoryName: string) => {
    setDebugStatus(prev => `${prev} | Using fallback assets`);
    if (FALLBACK_IMAGES[categoryName]) {
      setDisplayImages(FALLBACK_IMAGES[categoryName]);
    } else {
      // Catch-all
      setDisplayImages([
        {
          id: `fb-${selectedGod.id}`,
          image_url: '',
          local_image: selectedGod.image
        }
      ]);
    }
  };

  const fetchGodCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('god_categories')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) {
        console.error('[GodScreen] Error fetching categories:', error);
      } else if (data && data.length > 0) {
        const mapped = data.map((cat) => {
          const defaultCat = GOD_DATA.find(d => d.name === cat.name);
          return {
            id: cat.id,
            name: cat.name,
            image: defaultCat ? defaultCat.image : (cat.icon_url ? { uri: cat.icon_url } : require('../../assets/bhagwan/shiva.png')),
            color: defaultCat ? defaultCat.color : '#e67e22',
            icon_url: cat.icon_url
          };
        });
        setCategories(mapped);

        // Prefetch dynamic custom category icons
        const dynamicIcons = data.map(cat => cat.icon_url).filter(Boolean);
        if (dynamicIcons.length > 0) {
          console.log(`[GodScreen] Prefetching category icon URLs:`, dynamicIcons);
          ExpoImage.prefetch(dynamicIcons);
        }

        const currentInDb = mapped.find(c => c.name === selectedGod.name);
        if (currentInDb) {
          setSelectedGod(currentInDb);
        } else {
          setSelectedGod(mapped[0]);
        }
      }
    } catch (err) {
      console.error('[GodScreen] Exception fetching categories:', err);
    }
  };

  const prefetchAdjacentCategories = async (categoryName: string) => {
    if (categories.length <= 1) return;
    const currentIndex = categories.findIndex(c => c.name === categoryName);
    if (currentIndex === -1) return;

    // Prefetch next and previous categories in background
    const indicesToPrefetch = [
      (currentIndex + 1) % categories.length,
      (currentIndex - 1 + categories.length) % categories.length
    ];

    for (const idx of indicesToPrefetch) {
      const catName = categories[idx]?.name;
      if (!catName) continue;

      try {
        const { data, error } = await supabase
          .from('god_images')
          .select('image_url')
          .eq('category', catName)
          .order('sort_order', { ascending: true });

        if (!error && data && data.length > 0) {
          const urls = data.map(d => d.image_url).filter(Boolean);
          if (urls.length > 0) {
            console.log(`[GodScreen] Background prefetching adjacent category "${catName}" images:`, urls);
            ExpoImage.prefetch(urls);
          }
        }
      } catch (err) {
        console.warn(`[GodScreen] Background prefetch failed for adjacent category ${catName}:`, err);
      }
    }
  };

  const fetchPujaOfferings = async () => {
    try {
      const { data: flowerData, error: flowerErr } = await supabase
        .from('god_flowers')
        .select('*')
        .order('sort_order', { ascending: true });

      if (!flowerErr && flowerData && flowerData.length > 0) {
        const mapped = flowerData.map((f: any) => ({
          id: f.id,
          name: f.name,
          image_url: f.image_url,
          blossom_timing: f.blossom_timing || 4000,
          shower_duration: f.shower_duration || 10000,
          unlock_cost: f.unlock_cost || 0,
          source: getFlowerSource(f.name, f.image_url)
        }));
        setFlowerOptions(mapped);
        setSelectedFlower(mapped[0]);

        // Prefetch urls in background
        const urls = flowerData.map((f: any) => f.image_url).filter(Boolean);
        if (urls.length > 0) {
          ExpoImage.prefetch(urls);
        }
      }

      const { data: thaliData, error: thaliErr } = await supabase
        .from('god_thalis')
        .select('*')
        .order('sort_order', { ascending: true });

      if (!thaliErr && thaliData && thaliData.length > 0) {
        const mapped = thaliData.map((t: any) => ({
          id: t.id,
          name: t.name,
          image_url: t.image_url,
          unlock_cost: t.unlock_cost || 0,
          source: getThaliSource(t.name, t.image_url)
        }));
        setThaliOptions(mapped);
        setSelectedThali(mapped[0]);

        // Prefetch urls in background
        const urls = thaliData.map((t: any) => t.image_url).filter(Boolean);
        if (urls.length > 0) {
          ExpoImage.prefetch(urls);
        }
      }
    } catch (err) {
      console.warn('[GodScreen] Error fetching puja offerings:', err);
    }
  };

  const selectedGodRef = useRef(selectedGod);
  useEffect(() => {
    selectedGodRef.current = selectedGod;
  }, [selectedGod]);

  useEffect(() => {
    fetchGodCategories();
    fetchPujaOfferings();
    loadUserWalletAndUnlockedFlowers();

    // Subscribe to realtime updates for category changes
    const categorySub = supabase
      .channel('realtime_god_categories')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'god_categories' }, (payload) => {
        console.log('[GodScreen] Category realtime update received:', payload);
        fetchGodCategories();
      })
      .subscribe();

    // Subscribe to realtime updates for flowers and thalis
    const offeringsSub = supabase
      .channel('realtime_god_offerings')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'god_flowers' }, (payload) => {
        console.log('[GodScreen] Flowers realtime update received:', payload);
        fetchPujaOfferings();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'god_thalis' }, (payload) => {
        console.log('[GodScreen] Thalis realtime update received:', payload);
        fetchPujaOfferings();
      })
      .subscribe();

    // Subscribe to realtime updates for deity images
    const imagesSub = supabase
      .channel('realtime_god_images')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'god_images' }, (payload) => {
        console.log('[GodScreen] Deity images realtime update received:', payload);
        fetchGodImages(selectedGodRef.current.name);
      })
      .subscribe();

    // Subscribe to realtime updates for user wallet
    const walletSub = supabase
      .channel('realtime_user_wallets')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_wallets' }, (payload) => {
        console.log('[GodScreen] Wallet realtime update received:', payload);
        loadUserWalletAndUnlockedFlowers();
      })
      .subscribe();

    // Subscribe to realtime updates for unlocked flowers
    const unlockedSub = supabase
      .channel('realtime_user_unlocked_flowers')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_unlocked_flowers' }, (payload) => {
        console.log('[GodScreen] Unlocked flowers realtime update received:', payload);
        loadUserWalletAndUnlockedFlowers();
      })
      .subscribe();

    // Subscribe to realtime updates for unlocked thalis
    const unlockedThaliSub = supabase
      .channel('realtime_user_unlocked_thalis')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'user_unlocked_thalis' }, (payload) => {
        console.log('[GodScreen] Unlocked thalis realtime update received:', payload);
        loadUserWalletAndUnlockedFlowers();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(categorySub);
      supabase.removeChannel(offeringsSub);
      supabase.removeChannel(imagesSub);
      supabase.removeChannel(walletSub);
      supabase.removeChannel(unlockedSub);
      supabase.removeChannel(unlockedThaliSub);
      if (flowerTimerRef.current) {
        clearTimeout(flowerTimerRef.current);
      }
    };
  }, [loadUserWalletAndUnlockedFlowers]);

  useEffect(() => {
    if (categories.length > 0) {
      prefetchAdjacentCategories(selectedGod.name);
    }
  }, [selectedGod, categories]);

  useEffect(() => {
    fetchGodImages(selectedGod.name);
    if (flatListRef.current) {
      flatListRef.current.scrollToOffset({ offset: 0, animated: false });
    }
  }, [selectedGod]);

  // Pre-load sound and wallet when focused
  useFocusEffect(
    useCallback(() => {
      // Trigger initial swing
      triggerSwing(leftBellRotation, true);
      triggerSwing(rightBellRotation, false);
      loadUserWalletAndUnlockedFlowers();

      return () => {
        leftBellRotation.value = 0;
        rightBellRotation.value = 0;
      };
    }, [loadUserWalletAndUnlockedFlowers])
  );

  async function playBellSound() {
    try {
      if (bellPlayer) {
        // Seek to start to allow replay on subsequent taps
        await bellPlayer.seekTo(0).catch(err => {
          console.log('[GodScreen] Error seeking bell player:', err);
        });
        bellPlayer.play();
      }
    } catch (error) {
      console.log('[GodScreen] Error playing sound:', error);
    }
  }

  const triggerSwing = (rotationValue: any, shouldPlaySound = true) => {
    if (shouldPlaySound) {
      playBellSound();
    }

    // Reset rotation first
    rotationValue.value = 0;

    const duration = 800;
    const easing = Easing.bezier(0.42, 0, 0.58, 1);

    rotationValue.value = withSequence(
      withTiming(15, { duration, easing }),
      withTiming(-12, { duration, easing }),
      withTiming(8, { duration, easing }),
      withTiming(-4, { duration, easing }),
      withTiming(1, { duration, easing }),
      withTiming(0, { duration, easing })
    );
  };

  const leftAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -100 },
      { rotate: `${leftBellRotation.value}deg` },
      { translateY: 100 }
    ],
  }));

  const rightAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: -100 },
      { rotate: `${rightBellRotation.value}deg` },
      { translateY: 100 }
    ],
  }));

  const thaliAnimatedStyle = useAnimatedStyle(() => {
    const radius = 60;
    const angle = thaliProgress.value * 2 * Math.PI;
    return {
      transform: [
        { translateX: radius * Math.cos(angle) },
        { translateY: radius * Math.sin(angle) + 100 },
      ],
      opacity: thaliOpacity.value,
    };
  });

  const handleUnlockItem = async () => {
    if (!userId || !itemToUnlock || !unlockType) return;
    
    if (coinBalance < itemToUnlock.unlock_cost) {
      Alert.alert(t('Insufficient Coins'), t('You do not have enough coins in your wallet.'));
      return;
    }

    setIsUnlocking(true);
    try {
      const table = unlockType === 'flower' ? 'user_unlocked_flowers' : 'user_unlocked_thalis';
      const foreignKey = unlockType === 'flower' ? 'flower_id' : 'thali_id';
      
      // 1. Insert unlock record
      const { error: unlockError } = await supabase
        .from(table)
        .insert({
          user_id: userId,
          [foreignKey]: itemToUnlock.id
        });

      if (unlockError) {
        // Handle race condition where another click already unlocked it
        if (!unlockError.message.includes('unique_user_')) {
          throw unlockError;
        }
      }

      // 2. Update wallet balance
      const newBalance = coinBalance - itemToUnlock.unlock_cost;
      const { error: walletError } = await supabase
        .from('user_wallets')
        .update({ balance: newBalance })
        .eq('user_id', userId);

      if (walletError) throw walletError;

      // 3. Log transaction
      const { error: txError } = await supabase
        .from('coin_transactions')
        .insert({
          user_id: userId,
          amount: -itemToUnlock.unlock_cost,
          type: unlockType === 'flower' ? 'unlock_flower' : 'unlock_thali'
        });

      if (txError) throw txError;

      // Update local states
      setCoinBalance(newBalance);
      if (unlockType === 'flower') {
        setUnlockedFlowerIds(prev => [...prev, itemToUnlock.id]);
        setSelectedFlower(itemToUnlock);
        
        // Start the blossom animation immediately!
        setIsFlowersActive(true);
        if (flowerTimerRef.current) {
          clearTimeout(flowerTimerRef.current);
          flowerTimerRef.current = null;
        }

        const baselineDuration = itemToUnlock.blossom_timing || 4000;
        const newFlowers = Array.from({ length: 60 }).map((_, i) => ({
          id: i,
          startX: Math.random() * width,
          startY: Math.random() * (height + 150) - 50,
          duration: baselineDuration + (Math.random() - 0.5) * 1500,
          rotationSpeed: 1000 + Math.random() * 1000,
          size: 20 + Math.random() * 20,
        }));
        setFlowers(newFlowers);

        const showerDuration = itemToUnlock.shower_duration || 10000;
        flowerTimerRef.current = setTimeout(() => {
          setIsFlowersActive(false);
          setFlowers([]);
          flowerTimerRef.current = null;
        }, showerDuration);
      } else {
        setUnlockedThaliIds(prev => [...prev, itemToUnlock.id]);
        setSelectedThali(itemToUnlock);
        
        // Start the aarti animation immediately!
        setIsArtiActive(true);
        thaliProgress.value = 0;
        thaliProgress.value = withRepeat(
          withTiming(1, { duration: 3000, easing: Easing.linear }),
          -1,
          false
        );
      }

      Alert.alert(t('Success'), `${t(itemToUnlock.name)} ${t('unlocked successfully!')}`);
      setIsUnlockModalOpen(false);
      setItemToUnlock(null);
      setUnlockType(null);
      closeBottomSheet();
      playBellSound(); // play a celebration chime/bell sound!

    } catch (err: any) {
      console.error('[GodScreen] Error unlocking offering:', err);
      Alert.alert(t('Failed to Unlock'), err.message || t('Something went wrong.'));
    } finally {
      setIsUnlocking(false);
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar style="dark" />

      {/* Top Header Area */}
      <View style={styles.headerArea}>
        <SafeAreaView edges={['top']}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {/* Stylized Bar for God List */}
            <View style={[styles.godListBar, { flex: 1 }]}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipScrollContent}
              >
                {categories.map((god) => (
                  <TouchableOpacity
                    key={god.id}
                    onPress={() => setSelectedGod(god)}
                    activeOpacity={0.8}
                    style={[
                      styles.godChip,
                      selectedGod.id === god.id ? styles.activeChip : styles.inactiveChip
                    ]}
                  >
                    <View style={styles.chipAvatarContainer}>
                      <ExpoImage source={god.image} style={styles.chipAvatar} contentFit="contain" cachePolicy="disk" />
                    </View>
                    <Text style={[
                      styles.chipText,
                      selectedGod.id === god.id ? styles.activeChipText : styles.inactiveChipText
                    ]}>
                      {t(god.name)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* Main Content Area */}
      <View style={styles.contentContainer}>
        {/* The Arch/Gate - Properly centered and scaled */}
        <View style={styles.visualComposition}>
          {/* Central Deity - Vertical Paging (Reels style) */}
          <View style={styles.deityContainer}>
            <FlatList
              ref={flatListRef}
              data={displayImages}
              keyExtractor={(item) => item.id.toString()}
              pagingEnabled
              snapToInterval={600}
              snapToAlignment="start"
              decelerationRate="fast"
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => (
                <View style={styles.deityPage}>
                  <ExpoImage
                    source={item.local_image ? item.local_image : { uri: item.image_url }}
                    style={[
                      styles.fullGodImage,
                      !item.local_image && { width: '106%', height: '107%' }, // 2% width & 1% height increase for dynamic images
                      selectedGod.name === 'Shiv Ji' && { marginTop: -10 }, // Move Shiv Ji higher
                      selectedGod.name === 'Ma Laxmi' && { marginTop: -70 },  // Move Ma Laxmi lower
                      selectedGod.name === 'Venkateswara' && { marginTop: 0 }    // Lord Venkateswara
                    ]}
                    contentFit="contain"
                    cachePolicy="disk"
                  />
                </View>
              )}
            />
          </View>

          {/* Hanging Bells - Interactive and Layered */}
          <View style={styles.bellsOverlay} pointerEvents="box-none">
            <TouchableOpacity
              activeOpacity={1}
              onPress={() => triggerSwing(leftBellRotation)}
            >
              <Animated.Image
                entering={FadeIn.delay(400).duration(800)}
                source={require('../../assets/God/bell.png')}
                style={[styles.bell, styles.leftBell, leftAnimatedStyle]}
              />
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={1}
              onPress={() => triggerSwing(rightBellRotation)}
            >
              <Animated.Image
                entering={FadeIn.delay(600).duration(800)}
                source={require('../../assets/God/bell.png')}
                style={[styles.bell, styles.rightBell, rightAnimatedStyle]}
              />
            </TouchableOpacity>
          </View>

          {/* The Arch/Gate - On top of everything */}
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <Image
              source={require('../../assets/God/gate.png')}
              style={styles.gateImage}
              resizeMode="contain"
            />
          </View>

          {/* Bottom Arti Thali - Animated rotation when active */}
          <Animated.View style={[styles.thaliOverlay, thaliAnimatedStyle]} pointerEvents="none">
            <ExpoImage
              source={selectedThali.source}
              style={styles.thaliImage}
              contentFit="contain"
              cachePolicy="disk"
            />
          </Animated.View>
        </View>

        {/* Flower Shower Layer */}
        {isFlowersActive && (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {flowers.map((flower) => (
              <FlowerItem key={`${selectedFlower.id}-${flower.id}`} data={flower} source={selectedFlower.source} />
            ))}
          </View>
        )}
      </View>

      {/* Floating Buttons Container */}
      <View style={styles.floatingButtonsContainer}>
        {/* Flower Selector Toggle Button */}
        <TouchableOpacity
          onPress={() => openBottomSheet('flowers')}
          style={[
            styles.flowerButton,
            isFlowersActive && styles.flowerButtonActive
          ]}
        >
          <ExpoImage
            source={selectedFlower ? selectedFlower.source : require('../../assets/God/flower1.png')}
            style={styles.flowerButtonIcon}
            contentFit="contain"
            cachePolicy="disk"
          />
        </TouchableOpacity>

        {/* Floating Arti Selector Toggle Button */}
        <TouchableOpacity
          onPress={() => openBottomSheet('thali')}
          style={[
            styles.artiButton,
            isArtiActive && styles.artiButtonActive
          ]}
        >
          <ExpoImage
            source={selectedThali ? selectedThali.source : require('../../assets/God/arti.gif')}
            style={styles.artiButtonIcon}
            contentFit="contain"
            cachePolicy="disk"
          />
        </TouchableOpacity>
      </View>

      {/* Debug Status Overlay - shown in development mode */}
      {__DEV__ && debugStatus ? (
        <View style={{
          position: 'absolute',
          bottom: 30,
          left: 20,
          right: 20,
          backgroundColor: 'rgba(0,0,0,0.85)',
          padding: 8,
          borderRadius: 8,
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.2)',
          zIndex: 9999,
          pointerEvents: 'none'
        }}>
          <Text style={{ color: '#fff', fontSize: 10, textAlign: 'center', fontFamily: 'monospace' }}>
            {debugStatus}
          </Text>
        </View>
      ) : null}

      {/* Dim Backdrop */}
      {isBottomSheetOpen && (
        <TouchableOpacity
          activeOpacity={1}
          style={styles.backdrop}
          onPress={closeBottomSheet}
        />
      )}

      {/* Bottom Sheet Modal */}
      {isBottomSheetOpen && (
        <Animated.View style={[styles.bottomSheet, bottomSheetAnimatedStyle]}>
          {/* Header */}
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>
              {activePoojaTab === 'flowers' 
                ? `${t("Offer Flower to")} ${t(selectedGod.name)}`
                : `${t("Perform Aarti to")} ${t(selectedGod.name)}`
              }
            </Text>
            <TouchableOpacity onPress={closeBottomSheet} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View style={styles.sheetTabs}>
            <TouchableOpacity 
              style={[styles.sheetTab, activePoojaTab === 'flowers' && styles.activeSheetTab]}
              onPress={() => setActivePoojaTab('flowers')}
            >
              <Text style={[styles.sheetTabText, activePoojaTab === 'flowers' && styles.activeSheetTabText]}>
                {t("Flowers")}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.sheetTab, activePoojaTab === 'thali' && styles.activeSheetTab]}
              onPress={() => setActivePoojaTab('thali')}
            >
              <Text style={[styles.sheetTabText, activePoojaTab === 'thali' && styles.activeSheetTabText]}>
                {t("Thali")}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Grid Selection */}
          <View style={styles.sheetContent}>
            {activePoojaTab === 'flowers' ? (
              <ScrollView contentContainerStyle={styles.gridContainer} showsVerticalScrollIndicator={false}>
                {flowerOptions.map((item) => {
                  const isLocked = item.unlock_cost > 0 && !unlockedFlowerIds.includes(item.id);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.gridItem,
                        selectedFlower.id === item.id && styles.activeGridItem
                      ]}
                      onPress={() => {
                        if (isLocked) {
                          setItemToUnlock(item);
                          setUnlockType('flower');
                          setIsUnlockModalOpen(true);
                          return;
                        }

                        setSelectedFlower(item);
                        setIsFlowersActive(true);

                        if (flowerTimerRef.current) {
                          clearTimeout(flowerTimerRef.current);
                          flowerTimerRef.current = null;
                        }

                        const baselineDuration = item.blossom_timing || 4000;
                        const newFlowers = Array.from({ length: 60 }).map((_, i) => ({
                          id: i,
                          startX: Math.random() * width,
                          startY: Math.random() * (height + 150) - 50,
                          duration: baselineDuration + (Math.random() - 0.5) * 1500,
                          rotationSpeed: 1000 + Math.random() * 1000,
                          size: 20 + Math.random() * 20,
                        }));
                        setFlowers(newFlowers);

                        const showerDuration = item.shower_duration || 10000;
                        flowerTimerRef.current = setTimeout(() => {
                          setIsFlowersActive(false);
                          setFlowers([]);
                          flowerTimerRef.current = null;
                        }, showerDuration);

                        closeBottomSheet();
                      }}
                    >
                      <View style={styles.itemImageContainer}>
                        <ExpoImage source={item.source} style={styles.gridItemImage} contentFit="contain" />
                        {isLocked && (
                          <View style={styles.lockOverlay}>
                            <Ionicons name="lock-closed" size={16} color="#ffd700" />
                          </View>
                        )}
                      </View>
                      <Text style={[
                        styles.gridItemText,
                        selectedFlower.id === item.id && styles.activeGridItemText
                      ]}>
                        {t(item.name)}
                      </Text>
                      {isLocked && (
                        <View style={styles.coinCostBadge}>
                          <Text style={styles.coinCostText}>🪙 {item.unlock_cost}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            ) : (
              <ScrollView contentContainerStyle={styles.gridContainer} showsVerticalScrollIndicator={false}>
                {thaliOptions.map((item) => {
                  const isLocked = item.unlock_cost > 0 && !unlockedThaliIds.includes(item.id);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[
                        styles.gridItem,
                        selectedThali.id === item.id && styles.activeGridItem
                      ]}
                      onPress={() => {
                        if (isLocked) {
                          setItemToUnlock(item);
                          setUnlockType('thali');
                          setIsUnlockModalOpen(true);
                          return;
                        }

                        setSelectedThali(item);
                        setIsArtiActive(true);
                        thaliProgress.value = 0;
                        thaliProgress.value = withRepeat(
                          withTiming(1, { duration: 3000, easing: Easing.linear }),
                          -1,
                          false
                        );
                        closeBottomSheet();
                      }}
                    >
                      <View style={styles.itemImageContainer}>
                        <ExpoImage
                          source={item.source}
                          style={styles.gridItemImage}
                          contentFit="contain"
                          cachePolicy="disk"
                        />
                        {isLocked && (
                          <View style={styles.lockOverlay}>
                            <Ionicons name="lock-closed" size={16} color="#ffd700" />
                          </View>
                        )}
                      </View>
                      <Text style={[
                        styles.gridItemText,
                        selectedThali.id === item.id && styles.activeGridItemText
                      ]}>
                        {t(item.name)}
                      </Text>
                      {isLocked && (
                        <View style={styles.coinCostBadge}>
                          <Text style={styles.coinCostText}>🪙 {item.unlock_cost}</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
          </View>

          {/* Footer Action Button */}
          <View style={styles.sheetFooter}>
            {activePoojaTab === 'flowers' ? (
              <TouchableOpacity 
                style={[styles.footerActionButton, isFlowersActive && styles.footerActionStopButton]} 
                onPress={handleOfferFlower}
              >
                <Text style={styles.footerActionButtonText}>
                  {isFlowersActive 
                    ? t("Stop Offering Flowers")
                    : `${t("Offer")} ${t(selectedFlower.name)}`
                  }
                </Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.footerActionButton, isArtiActive && styles.footerActionStopButton]} 
                onPress={handleToggleAarti}
              >
                <Text style={styles.footerActionButtonText}>
                  {isArtiActive 
                    ? t("Stop Aarti")
                    : `${t("Perform Aarti")}`
                  }
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      )}

      {/* Unlock Confirmation Modal */}
      <Modal
        visible={isUnlockModalOpen && itemToUnlock !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsUnlockModalOpen(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={styles.modalOverlay}
          onPress={() => !isUnlocking && setIsUnlockModalOpen(false)}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            {itemToUnlock && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{t('Unlock Offering')}</Text>
                  {!isUnlocking && (
                    <TouchableOpacity onPress={() => setIsUnlockModalOpen(false)} style={styles.closeModalButton}>
                      <Ionicons name="close" size={24} color="#94a3b8" />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.modalBody}>
                  <View style={styles.unlockImageContainer}>
                    <ExpoImage source={itemToUnlock.source} style={styles.unlockFlowerImage} contentFit="contain" />
                  </View>
                  
                  <Text style={styles.unlockFlowerName}>{t(itemToUnlock.name)}</Text>
                  
                  <Text style={styles.unlockPrompt}>
                    {t('Would you like to unlock this premium offering for your daily puja?')}
                  </Text>

                  <View style={styles.unlockStatsRow}>
                    <View style={styles.unlockStatBox}>
                      <Text style={styles.unlockStatLabel}>{t('Unlock Cost')}</Text>
                      <Text style={styles.unlockStatValue}>🪙 {itemToUnlock.unlock_cost}</Text>
                    </View>
                    <View style={styles.unlockStatBox}>
                      <Text style={styles.unlockStatLabel}>{t('Your Wallet')}</Text>
                      <Text style={[
                        styles.unlockStatValue,
                        coinBalance < itemToUnlock.unlock_cost ? styles.insufficientBalanceText : null
                      ]}>
                        🪙 {coinBalance}
                      </Text>
                    </View>
                  </View>

                  {coinBalance < itemToUnlock.unlock_cost && (
                    <Text style={styles.insufficientWarning}>
                      ⚠️ {t('You do not have enough coins to unlock this offering.')}
                    </Text>
                  )}
                </View>

                <View style={styles.modalFooter}>
                  {coinBalance >= itemToUnlock.unlock_cost ? (
                    <TouchableOpacity
                      style={[styles.modalActionButton, isUnlocking && styles.disabledModalButton]}
                      onPress={handleUnlockItem}
                      disabled={isUnlocking}
                    >
                      {isUnlocking ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <Text style={styles.modalActionButtonText}>
                          {t('Unlock for')} 🪙 {itemToUnlock.unlock_cost}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[styles.modalActionButton, { backgroundColor: '#ea580c' }]}
                      onPress={() => {
                        setIsUnlockModalOpen(false);
                        closeBottomSheet();
                        router.push('/wallet');
                      }}
                    >
                      <Text style={styles.modalActionButtonText}>
                        {t('Get Coins')}
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#eb984e',
  },
  headerArea: {
    zIndex: 10,
  },
  godListBar: {
    marginHorizontal: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 100,
    overflow: 'hidden',
    marginTop: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  chipScrollContent: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    gap: 8,
  },
  godChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
    paddingLeft: 4,
    paddingVertical: 4,
    borderRadius: 30,
  },
  activeChip: {
    backgroundColor: '#f39c12',
  },
  inactiveChip: {
    backgroundColor: '#fff',
  },
  chipAvatarContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: '#f8f9fa',
  },
  chipAvatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  activeChipText: {
    color: '#fff',
  },
  inactiveChipText: {
    color: '#333',
  },
  contentContainer: {
    flex: 1,
    marginTop: 10,
  },
  visualComposition: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginTop: -120, // Shifted upwards as requested
  },
  gateImage: {
    width: width * 1.0,
    height: height * 0.85,
    position: 'absolute',
    alignSelf: 'center',
    zIndex: 2, // Highest zIndex
  },
  deityContainer: {
    width: '100%',
    height: 600, // Restored to large size
    zIndex: 0,
    marginTop: 150,
  },
  deityPage: {
    width: width,
    height: 600, // Matches deityContainer exactly
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullGodImage: {
    width: '100%',
    height: '100%',
  },
  bellsOverlay: {
    position: 'absolute',
    top: '28%',
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: width * 0.12,
    zIndex: 1, // Above deity (0) but below gate (2)
  },
  bell: {
    width: 90,
    height: 180,
    resizeMode: 'contain',
  },
  leftBell: {
    // Left bell
  },
  rightBell: {
    // Right bell
  },
  thaliOverlay: {
    position: 'absolute',
    top: '45%', // Center in front of deity
    width: '100%',
    alignItems: 'center',
    zIndex: 4,
  },
  thaliImage: {
    width: width * 0.6,
    height: 120,
  },
  floatingButtonsContainer: {
    position: 'absolute',
    right: 20,
    bottom: 120,
    alignItems: 'center',
    gap: 15,
  },
  artiButton: {
    width: 65,
    height: 65,
    borderRadius: 32.5,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  flowerButton: {
    width: 55,
    height: 55,
    borderRadius: 27.5,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.6)',
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  flowerButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderColor: '#ffd700',
  },
  flowerButtonIcon: {
    width: '70%',
    height: '70%',
    resizeMode: 'contain',
  },
  artiButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    borderColor: '#fff',
    elevation: 5,
    shadowColor: '#fff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  artiButtonIcon: {
    width: '80%',
    height: '80%',
    resizeMode: 'contain',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 99,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 380,
    backgroundColor: '#1e293b',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    zIndex: 100,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sheetTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#ccc',
    fontSize: 16,
    fontWeight: '600',
  },
  sheetTabs: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  sheetTab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeSheetTab: {
    backgroundColor: 'rgba(234,88,12,0.15)',
    borderColor: '#ea580c',
  },
  sheetTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94a3b8',
  },
  activeSheetTabText: {
    color: '#ea580c',
  },
  sheetContent: {
    flex: 1,
    marginBottom: 20,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    paddingBottom: 10,
  },
  gridItem: {
    width: (width - 40 - 24) / 3 - 4,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  activeGridItem: {
    backgroundColor: 'rgba(234,88,12,0.05)',
    borderColor: '#ea580c',
  },
  itemImageContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
    overflow: 'hidden',
  },
  gridItemImage: {
    width: 35,
    height: 35,
  },
  gridItemText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    textAlign: 'center',
  },
  activeGridItemText: {
    color: '#ea580c',
  },
  sheetFooter: {
    paddingBottom: 10,
  },
  footerActionButton: {
    height: 50,
    borderRadius: 25,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerActionStopButton: {
    backgroundColor: '#ef4444',
  },
  footerActionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  lockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  coinCostBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 8,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  coinCostText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: width * 0.85,
    backgroundColor: '#1e293b',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    elevation: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  closeModalButton: {
    padding: 4,
  },
  modalBody: {
    alignItems: 'center',
    marginBottom: 20,
  },
  unlockImageContainer: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
    overflow: 'hidden',
  },
  unlockFlowerImage: {
    width: 60,
    height: 60,
  },
  unlockFlowerName: {
    fontSize: 20,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 10,
  },
  unlockPrompt: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  unlockStatsRow: {
    flexDirection: 'row',
    gap: 15,
    width: '100%',
    justifyContent: 'space-between',
  },
  unlockStatBox: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderRadius: 12,
    padding: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  unlockStatLabel: {
    fontSize: 10,
    color: '#64748b',
    textTransform: 'uppercase',
    fontWeight: '700',
    marginBottom: 4,
  },
  unlockStatValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#fff',
  },
  insufficientBalanceText: {
    color: '#ef4444',
  },
  insufficientWarning: {
    marginTop: 15,
    fontSize: 11,
    color: '#f97316',
    fontWeight: '600',
    textAlign: 'center',
  },
  modalFooter: {
    width: '100%',
  },
  modalActionButton: {
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalActionButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#fff',
  },
  disabledModalButton: {
    opacity: 0.6,
  },
});
