import React, { useState } from "react";
import { Text, View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, FlatList, Modal, Share, Alert } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, interpolateColor } from 'react-native-reanimated';
import { router } from 'expo-router';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../services/supabase';
import { Image } from 'expo-image';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useFocusEffect } from '@react-navigation/native';
import DraggableCalendarButton from '../../components/DraggableCalendarButton';


const { width } = Dimensions.get('window');

const PUJAS_DATA = [
  {
    id: '1',
    title: 'Ganesh Puja',
    image: require('../../assets/God/god.png'),
    rating: '4.8',
    time: '45-60 mins',
    price: '₹501',
    description: 'by Siddhi Vinayak Mandir'
  },
  {
    id: '2',
    title: 'Laxmi Puja',
    image: require('../../assets/God/Jai Mahalakshmi🩷🌷🙏.jpeg'),
    rating: '4.9',
    time: '60-90 mins',
    price: '₹1,100',
    description: 'by Mahalakshmi Priests'
  },
  {
    id: '3',
    title: 'Shiv Puja',
    image: require('../../assets/God/Omkarashwar.png'),
    rating: '4.7',
    time: '30-45 mins',
    price: '₹351',
    description: 'by Omkareshwar Dham'
  },
  {
    id: '4',
    title: 'Hanuman Puja',
    image: require('../../assets/God/Mahakal Ujjain.png'),
    rating: '4.9',
    time: '45 mins',
    price: '₹251',
    description: 'by Bajrang Dham'
  },
  {
    id: '5',
    title: 'Kedarnath Puja',
    image: require('../../assets/God/Kedarnath.png'),
    rating: '4.8',
    time: '45 mins',
    price: '₹351',
    description: 'by Kedarnath Dham Priests'
  },
  {
    id: '6',
    title: 'Tirupati Puja',
    image: require('../../assets/God/Lord Venkateswara Images Full Hd Wallpaper 1.png'),
    rating: '5.0',
    time: '120 mins',
    price: '₹2,100',
    description: 'by Tirumala Devasthanam'
  },
  {
    id: '7',
    title: 'Shanti Path',
    image: require('../../assets/God/god1.png'),
    rating: '4.9',
    time: '30 mins',
    price: '₹151',
    description: 'by Haridwar Acharyas'
  },
  {
    id: '8',
    title: 'Navgrah Homa',
    image: require('../../assets/God/_ (5).jpeg'),
    rating: '4.7',
    time: '90 mins',
    price: '₹1,500',
    description: 'by Kashi Vedic Pandits'
  }
];

const PROBLEMS_DATA = [
  {
    id: '1',
    title: 'Career Growth',
    image: 'https://images.unsplash.com/photo-1454165833767-1314d693e72c?q=80&w=400',
    rating: '4.6',
    time: '30 mins',
    price: 'Consultation',
    description: 'Vedic Astrology'
  },
  {
    id: '2',
    title: 'Marriage Issue',
    image: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?q=80&w=400',
    rating: '4.5',
    time: '45 mins',
    price: 'Consultation',
    description: 'Gun Milan Expert'
  },
  {
    id: '3',
    title: 'Health Healing',
    image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=400',
    rating: '4.8',
    time: '30 mins',
    price: 'Consultation',
    description: 'Healing Rituals'
  },
  {
    id: '4',
    title: 'Education Issue',
    image: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?q=80&w=400',
    rating: '4.7',
    time: '30 mins',
    price: 'Consultation',
    description: 'Vidya Expert'
  },
  {
    id: '5',
    title: 'Finance Issue',
    image: 'https://images.unsplash.com/photo-1554224155-169641357599?q=80&w=400',
    rating: '4.6',
    time: '30 mins',
    price: 'Consultation',
    description: 'Wealth Expert'
  },
  {
    id: '6',
    title: 'Evil Eye',
    image: 'https://images.unsplash.com/photo-1604881991720-f91add269bed?q=80&w=400',
    rating: '4.9',
    time: '45 mins',
    price: 'Protection',
    description: 'Nazar Dosha Expert'
  },
  {
    id: '7',
    title: 'Vastu Dosha',
    image: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?q=80&w=400',
    rating: '4.5',
    time: '60 mins',
    price: 'Consultation',
    description: 'Vastu Expert'
  },
  {
    id: '8',
    title: 'Property Dispute',
    image: 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?q=80&w=400',
    rating: '4.4',
    time: '45 mins',
    price: 'Consultation',
    description: 'Legal & Astrological'
  },
];

// RECOMMENDED_DATA has been fully replaced by dynamic Supabase queries



const STATIC_CURATED_DATA = [
  {
    id: 'c1',
    title: 'Mangal Dosh Special Puja',
    subtitle: 'Special rituals for marriage obstacles and Mangal Grah peace',
    bgImage: require('../../assets/banner/ChatGPT Image May 26, 2026, 11_56_57 AM.png'),
    items: [
      { id: 'm1', slug: 'mangal-dosh-puja', name: 'Mangal Dosh Puja', image: require('../../assets/God/god.png') },
      { id: 'm2', slug: 'kumbh-vivah', name: 'Kumbh Vivah', image: require('../../assets/God/Jai Mahalakshmi🩷🌷🙏.jpeg') },
      { id: 'm3', slug: 'rudrabhishek', name: 'Rudrabhishek', image: require('../../assets/God/Omkarashwar.png') },
      { id: 'm4', slug: 'hanuman-puja', name: 'Hanuman Puja', image: require('../../assets/God/Mahakal Ujjain.png') },
      { id: 'm5', slug: 'navgrah-shanti', name: 'Navgrah Shanti', image: require('../../assets/God/_ (5).jpeg') }
    ]
  },
  {
    id: 'c2',
    title: 'Monday Shiva Special Puja',
    subtitle: 'Divine Shiva rituals for peace, protection, and spiritual blessings',
    bgImage: require('../../assets/banner/ChatGPT Image May 26, 2026, 12_19_59 PM.png'),
    items: [
      { id: 's1', slug: 'rudrabhishek-puja', name: 'Rudrabhishek Puja', image: require('../../assets/God/Omkarashwar.png') },
      { id: 's2', slug: 'mahamrityunjaya-jaap', name: 'Mahamrityunjaya Jaap', image: require('../../assets/God/god1.png') },
      { id: 's3', slug: 'shiv-tandav-path', name: 'Shiv Tandav Path', image: require('../../assets/God/Kedarnath.png') },
      { id: 's4', slug: 'somvar-vrat-puja', name: 'Somvar Vrat Puja', image: require('../../assets/God/god.png') },
      { id: 's5', slug: 'shivling-jal-abhishek', name: 'Shivling Jal Abhishek', image: require('../../assets/God/Mahakal Ujjain.png') }
    ]
  }
];

const DAILY_RITUALS_DATA: { [key: number]: any } = {
  1: { // Monday
    title: 'Monday Shiva Special Puja',
    subtitle: 'Divine Shiva rituals for peace, protection, and spiritual blessings',
    bgImage: require('../../assets/banner/ChatGPT Image May 26, 2026, 12_19_59 PM.png'),
    items: [
      { id: 's1', slug: 'rudrabhishek-puja', name: 'Rudrabhishek Puja', image: require('../../assets/God/Omkarashwar.png') },
      { id: 's2', slug: 'mahamrityunjaya-jaap', name: 'Mahamrityunjaya Jaap', image: require('../../assets/God/god1.png') },
      { id: 's3', slug: 'shiv-tandav-path', name: 'Shiv Tandav Path', image: require('../../assets/God/Kedarnath.png') },
      { id: 's4', slug: 'somvar-vrat-puja', name: 'Somvar Vrat Puja', image: require('../../assets/God/god.png') },
      { id: 's5', slug: 'shivling-jal-abhishek', name: 'Shivling Jal Abhishek', image: require('../../assets/God/Mahakal Ujjain.png') }
    ]
  },
  2: { // Tuesday
    title: 'Tuesday Hanuman & Mangal Special',
    subtitle: 'Special rituals for strength, courage, and clearing Mangal Grah obstacles',
    bgImage: require('../../assets/banner/ChatGPT Image May 26, 2026, 11_56_57 AM.png'),
    items: [
      { id: 'm1', slug: 'mangal-dosh-puja', name: 'Mangal Dosh Puja', image: require('../../assets/God/god.png') },
      { id: 'm2', slug: 'kumbh-vivah', name: 'Kumbh Vivah', image: require('../../assets/God/Jai Mahalakshmi\uD83E\uDE77\uD83C\uDF37\uD83D\uDE4F.jpeg') },
      { id: 'm3', slug: 'rudrabhishek', name: 'Rudrabhishek', image: require('../../assets/God/Omkarashwar.png') },
      { id: 'm4', slug: 'hanuman-puja', name: 'Hanuman Puja', image: require('../../assets/God/Mahakal Ujjain.png') },
      { id: 'm5', slug: 'navgrah-shanti', name: 'Navgrah Shanti', image: require('../../assets/God/_ (5).jpeg') }
    ]
  },
  3: { // Wednesday
    title: 'Wednesday Ganesha Special Puja',
    subtitle: 'Invoke Lord Ganesha to remove obstacles and bring success & wisdom',
    bgImage: 'https://images.unsplash.com/photo-1609137144814-6c3614275f7e?auto=format&fit=crop&w=800&q=80',
    items: [
      { id: 'g1', slug: 'ganesh-puja', name: 'Ganesh Atharvashirsha', image: require('../../assets/God/god.png') },
      { id: 'g2', slug: 'vighnaharta-havan', name: 'Vighnaharta Havan', image: require('../../assets/God/god1.png') },
      { id: 'g3', slug: 'modak-arpan', name: 'Modak Arpan Seva', image: require('../../assets/God/gate.png') }
    ]
  },
  4: { // Thursday
    title: 'Thursday Lord Vishnu Special',
    subtitle: 'Vedic rituals for wealth, prosperity, and family harmony',
    bgImage: 'https://images.unsplash.com/photo-1545128485-c400e7702796?auto=format&fit=crop&w=800&q=80',
    items: [
      { id: 'v1', slug: 'satyanarayan-puja', name: 'Satyanarayan Katha', image: require('../../assets/God/Lord Venkateswara Images Full Hd Wallpaper 1.png') },
      { id: 'v2', slug: 'vishnu-sahasranamam', name: 'Vishnu Sahasranamam', image: require('../../assets/God/god1.png') },
      { id: 'v3', slug: 'brihaspati-puja', name: 'Brihaspati Graha Shanti', image: require('../../assets/God/_ (5).jpeg') }
    ]
  },
  5: { // Friday
    title: 'Friday Maha Laxmi Seva',
    subtitle: 'Divine offerings for wealth, financial abundance, and luck',
    bgImage: 'https://images.unsplash.com/photo-1608976328321-2f9b229f3e08?auto=format&fit=crop&w=800&q=80',
    items: [
      { id: 'l1', slug: 'mahalaxmi-puja', name: 'Maha Laxmi Puja', image: require('../../assets/God/Jai Mahalakshmi\uD83E\uDE77\uD83C\uDF37\uD83D\uDE4F.jpeg') },
      { id: 'l2', slug: 'kanakadhara-stotra', name: 'Kanakadhara Recitation', image: require('../../assets/God/god.png') },
      { id: 'l3', slug: 'shree-yantra-seva', name: 'Shree Yantra Archana', image: require('../../assets/God/gate.png') }
    ]
  },
  6: { // Saturday
    title: 'Saturday Shani Dev Shanti',
    subtitle: 'Powerful remedies to calm planetary doshas and clear negative energies',
    bgImage: 'https://images.unsplash.com/photo-1600861195091-690c92f1d2cc?auto=format&fit=crop&w=800&q=80',
    items: [
      { id: 'sh1', slug: 'shani-shanti', name: 'Shani Tailabhishek', image: require('../../assets/God/_ (5).jpeg') },
      { id: 'sh2', slug: 'mahakal-puja', name: 'Mahakal Shanti Havan', image: require('../../assets/God/Mahakal Ujjain.png') },
      { id: 'sh3', slug: 'sundarkand-saturday', name: 'Saturday Sundarkand Path', image: require('../../assets/God/Kedarnath.png') }
    ]
  },
  0: { // Sunday
    title: 'Sunday Surya Dev Aradhana',
    subtitle: 'Vedic rituals for health, vitality, leadership, and pure energy',
    bgImage: 'https://images.unsplash.com/photo-1507608869274-d3177c8bb4c7?auto=format&fit=crop&w=800&q=80',
    items: [
      { id: 'su1', slug: 'surya-graha-shanti', name: 'Surya Dev Aradhana', image: require('../../assets/God/god.png') },
      { id: 'su2', slug: 'gayatri-havan', name: 'Gayatri Mantra Havan', image: require('../../assets/God/god1.png') },
      { id: 'su3', slug: 'aditya-hrudaya', name: 'Aditya Hrudaya Recitation', image: require('../../assets/God/gate.png') }
    ]
  }
};

const DAYS_DATA = [

  {
    id: '1',
    day: 'Mon',
    deity: 'SHIVA',
    subtitle: 'Peace & Blessings',
    image: require('../../assets/Days/ChatGPT Image May 26, 2026, 01_34_02 PM.png'),
    color: '#3b82f6', // Rich deep blue
    bgColor: '#f0f7ff', // Baby Sky Blue background
    glowColor: '#bcd8f9', // Soft baby blue outline border
    dayNum: 1
  },
  {
    id: '2',
    day: 'Tue',
    deity: 'HANUMAN',
    subtitle: 'Strength',
    image: require('../../assets/Days/ChatGPT Image May 26, 2026, 01_34_08 PM.png'),
    color: '#f97316', // Rich deep orange
    bgColor: '#fff7ed', // Baby orange/peach background
    glowColor: '#fed7aa', // Soft baby peach/orange outline border
    dayNum: 2
  },
  {
    id: '3',
    day: 'Wed',
    deity: 'GANESHA',
    subtitle: 'Vighna Nashak',
    image: require('../../assets/Days/ChatGPT Image May 26, 2026, 01_34_12 PM.png'),
    color: '#f43f5e', // Vibrant coral red
    bgColor: '#fff1f2', // Baby rose/red background
    glowColor: '#fecdd3', // Soft baby rose outline border
    dayNum: 3
  },
  {
    id: '4',
    day: 'Thu',
    deity: 'VISHNU',
    subtitle: 'Auspicious',
    image: require('../../assets/Days/ChatGPT Image May 26, 2026, 01_34_15 PM.png'),
    color: '#ca8a04', // Vibrant gold
    bgColor: '#fefce8', // Baby yellow background
    glowColor: '#fef08a', // Soft baby yellow/gold outline border
    dayNum: 4
  },
  {
    id: '5',
    day: 'Fri',
    deity: 'LAXMI',
    subtitle: 'Prosperity',
    image: require('../../assets/Days/ChatGPT Image May 26, 2026, 01_34_19 PM.png'),
    color: '#ec4899', // Vibrant pink
    bgColor: '#fdf2f8', // Baby pink/rose background
    glowColor: '#fbcfe8', // Soft baby pink outline border
    dayNum: 5
  },
  {
    id: '6',
    day: 'Sat',
    deity: 'SHANI',
    subtitle: 'Discipline',
    image: require('../../assets/Days/ChatGPT Image May 26, 2026, 01_34_23 PM.png'),
    color: '#6366f1', // Vibrant indigo
    bgColor: '#faf5ff', // Baby lavender background
    glowColor: '#e9d5ff', // Soft baby purple outline border
    dayNum: 6
  },
  {
    id: '7',
    day: 'Sun',
    deity: 'SURYA',
    subtitle: 'Positive Energy',
    image: require('../../assets/Days/ChatGPT Image May 26, 2026, 01_35_05 PM.png'),
    color: '#f59e0b', // Vibrant amber
    bgColor: '#fffbeb', // Baby amber background
    glowColor: '#fed7aa', // Soft baby amber outline border
    dayNum: 0
  }
];

// High-Fidelity video preview modal for Pandit Videos
function PanditVideoModal({ url, panditName, ritualName, onClose }: { url: string; panditName: string; ritualName: string; onClose: () => void }) {
  const player = useVideoPlayer(url, (p) => {
    p.loop = false;
    p.play();
  });

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Namaste! 🌸\n\nCheck out the sacred ritual video from ${panditName} performing the ${ritualName} on MantraPuja app! Watch the divine seva here:\n\n🎥 ${url}\n\nMay peace, health, and prosperity be with you! 🙏✨`,
        title: 'Blessed Pandit Ritual Video'
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
              <Text style={styles.modalVideoTitle} numberOfLines={1}>{panditName}</Text>
              <Text style={{ color: '#fdba74', fontSize: 10, fontFamily: 'Outfit-Bold' }} numberOfLines={1}>{ritualName}</Text>
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
              <Text style={styles.modalActionBtnText}>Share Video</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default function PujaScreen() {
  const { cart, handleAddToCart, handleIncrement, handleDecrement } = useCart();
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'Pujas' | 'Problems'>('Pujas');
  const transition = useSharedValue(0); // 0 for Pujas, 1 for Problems
  const insets = useSafeAreaInsets();
  const [showAllPujas, setShowAllPujas] = useState(false);

  const [oneRupeeItems, setOneRupeeItems] = useState<any[]>([]);
  const [generalPujas, setGeneralPujas] = useState<any[]>([]);
  const [problemPoojas, setProblemPoojas] = useState<any[]>([]);
  const [lifeProblems, setLifeProblems] = useState<any[]>([]);
  const [offerSections, setOfferSections] = useState<any[]>([]);
  const [selectedProblemTab, setSelectedProblemTab] = useState('Health');
  const [selectedDayNum, setSelectedDayNum] = useState<number>(new Date().getDay());
  const [dailySections, setDailySections] = useState<{ [key: number]: any }>({});
  const [panditVideos, setPanditVideos] = useState<any[]>([]);
  const [activePanditVideo, setActivePanditVideo] = useState<any>(null);
  const [pujaBanner, setPujaBanner] = useState<any>(null);

  const loadOneRupeePoojas = React.useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('one_rupee_poojas')
        .select('*')
        .eq('status', 'published')
        .eq('is_active', true)
        .order('sort_order_puja', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      
      console.log('[Puja Page] Fetched ₹1 Pujas:', data?.length);
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
      console.error('[Puja Screen] Error loading dynamic ₹1 poojas:', err);
    }
  }, []);

  const loadGeneralPoojas = React.useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('general_poojas')
        .select('*')
        .eq('status', 'published')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data) {
        const formatted = data.map(p => ({
          id: p.id,
          title: p.title,
          originalPrice: p.original_price || '',
          offerPrice: p.offer_price || '',
          price: p.offer_price || '',
          rating: p.rating || '5.0',
          reviews: p.reviews || '0',
          provider: p.provider || 'Vedic Pandits',
          description: p.tagline || '',
          time: '2 Hours',
          image: p.image_url || 'https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/god.png',
        }));
        setGeneralPujas(formatted);
      }
    } catch (err) {
      console.error('[Puja Screen] Error loading dynamic general poojas:', err);
    }
  }, []);

  const loadProblemPoojas = React.useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('problem_poojas')
        .select('*')
        .eq('status', 'published')
        .eq('is_active', true)
        .order('sort_order', { ascending: true, nullsFirst: false })
        .order('created_at', { ascending: false });
      if (error) throw error;
      if (data) {
        const formatted = data.map(p => ({
          id: p.id,
          title: p.title,
          originalPrice: p.original_price,
          offerPrice: p.offer_price,
          price: p.offer_price,
          rating: p.rating,
          reviews: p.reviews,
          provider: p.provider,
          description: 'by ' + p.provider,
          time: p.requirement || '45-60 mins',
          image: p.image_url,
          problem_category: p.problem_category
        }));
        setProblemPoojas(formatted);
      }
    } catch (err) {
      console.error('[Puja Screen] Error loading dynamic problem poojas:', err);
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
          image: p.image_url,
        }));
        setLifeProblems(formatted);
      }
    } catch (err) {
      console.error('[Puja Screen] Error loading dynamic life problems:', err);
    }
  }, []);

  const loadOfferSections = React.useCallback(async () => {
    try {
      const { data: sectionsData, error: secErr } = await supabase
        .from('offer_sections')
        .select('*')
        .eq('status', 'published')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (secErr) throw secErr;

      if (sectionsData && sectionsData.length > 0) {
        const sectionIds = sectionsData.map(s => s.id);
        const { data: pujasData, error: pujasErr } = await supabase
          .from('offer_pujas')
          .select('*')
          .eq('status', 'published')
          .eq('is_active', true)
          .in('section_id', sectionIds)
          .order('sort_order', { ascending: true });

        if (pujasErr) throw pujasErr;

        const mapped = sectionsData.map(sec => {
          const items = (pujasData || [])
            .filter(p => p.section_id === sec.id)
            .map(p => ({
              id: p.id,
              slug: p.slug,
              name: p.title,
              image: p.thumbnail_url || 'https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/god.png'
            }));
          return {
            id: sec.id,
            title: sec.title,
            subtitle: sec.subtitle,
            bgImage: sec.background_image_url || 'https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/god.png',
            items
          };
        });
        setOfferSections(mapped);
      } else {
        setOfferSections([]);
      }
    } catch (err) {
      console.error('[Puja Screen] Error loading dynamic offer sections:', err);
    }
  }, []);

  const loadDailySections = React.useCallback(async () => {
    try {
      const { data: sectionsData, error: secErr } = await supabase
        .from('daily_sections')
        .select('*');

      if (secErr) throw secErr;

      if (sectionsData && sectionsData.length > 0) {
        const { data: pujasData, error: pujasErr } = await supabase
          .from('daily_pujas')
          .select('*')
          .eq('is_active', true)
          .order('sort_order', { ascending: true });

        if (pujasErr) throw pujasErr;

        const mapped: { [key: number]: any } = {};
        sectionsData.forEach(sec => {
          const items = (pujasData || [])
            .filter(p => p.day_of_week === sec.day_of_week)
            .map(p => ({
              id: p.id,
              slug: p.slug,
              name: p.title,
              image: p.thumbnail_url || 'https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/god.png'
            }));
          mapped[sec.day_of_week] = {
            title: sec.title,
            subtitle: sec.subtitle,
            bgImage: sec.background_image_url || 'https://images.unsplash.com/photo-1608976328321-2f9b229f3e08?auto=format&fit=crop&w=800&q=80',
            items
          };
        });
        setDailySections(mapped);
      } else {
        setDailySections({});
      }
    } catch (err) {
      console.error('[Puja Screen] Error loading dynamic daily sections:', err);
    }
  }, []);

  const loadPanditVideos = React.useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('pandit_videos')
        .select('*')
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setPanditVideos(data);
      }
    } catch (err) {
      console.error('[Puja Screen] Error loading dynamic pandit videos:', err);
    }
  }, []);

  const loadPujaBanner = React.useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('puja_banners')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      setPujaBanner(data || null);
    } catch (err) {
      console.error('[Puja Screen] Error loading dynamic puja banner:', err);
    }
  }, []);

  // Reload everything on focus to guarantee fresh sync
  useFocusEffect(
    React.useCallback(() => {
      loadOneRupeePoojas();
      loadGeneralPoojas();
      loadProblemPoojas();
      loadLifeProblems();
      loadOfferSections();
      loadDailySections();
      loadPanditVideos();
      loadPujaBanner();
    }, [
      loadOneRupeePoojas,
      loadGeneralPoojas,
      loadProblemPoojas,
      loadLifeProblems,
      loadOfferSections,
      loadDailySections,
      loadPanditVideos,
      loadPujaBanner
    ])
  );

  React.useEffect(() => {
    // Live sync automatic reloading via Supabase Realtime channel
    const subscription = supabase
      .channel('puja_one_rupee_poojas_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'one_rupee_poojas' }, (payload) => {
        console.log('[Puja Screen] Realtime event caught, auto-reloading ₹1 feed...', payload);
        loadOneRupeePoojas();
      })
      .subscribe();

    const generalSubscription = supabase
      .channel('puja_general_poojas_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'general_poojas' }, (payload) => {
        console.log('[Puja Screen] Realtime event caught, auto-reloading general feed...', payload);
        loadGeneralPoojas();
      })
      .subscribe();

    const problemSubscription = supabase
      .channel('puja_problem_poojas_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'problem_poojas' }, (payload) => {
        console.log('[Puja Screen] Realtime event caught, auto-reloading problem poojas feed...', payload);
        loadProblemPoojas();
      })
      .subscribe();

    const lifeProblemsSubscription = supabase
      .channel('puja_life_problems_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'life_problems' }, (payload) => {
        console.log('[Puja Screen] Realtime event caught, auto-reloading life problems...', payload);
        loadLifeProblems();
      })
      .subscribe();

    const sectionSubscription = supabase
      .channel('offer_sections_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'offer_sections' }, (payload) => {
        console.log('[Puja Screen] Realtime event caught, auto-reloading offer sections...', payload);
        loadOfferSections();
      })
      .subscribe();

    const offerPujasSubscription = supabase
      .channel('offer_pujas_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'offer_pujas' }, (payload) => {
        console.log('[Puja Screen] Realtime event caught, auto-reloading offer pujas...', payload);
        loadOfferSections();
      })
      .subscribe();

    const dailySectionsSubscription = supabase
      .channel('daily_sections_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_sections' }, (payload) => {
        console.log('[Puja Screen] Realtime event caught, auto-reloading daily sections...', payload);
        loadDailySections();
      })
      .subscribe();

    const dailyPujasSubscription = supabase
      .channel('daily_pujas_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'daily_pujas' }, (payload) => {
        console.log('[Puja Screen] Realtime event caught, auto-reloading daily pujas...', payload);
        loadDailySections();
      })
      .subscribe();

    const panditVideosSubscription = supabase
      .channel('puja_pandit_videos_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pandit_videos' }, (payload) => {
        console.log('[Puja Screen] Realtime event caught, auto-reloading pandit videos...', payload);
        loadPanditVideos();
      })
      .subscribe();

    const pujaBannerSubscription = supabase
      .channel('puja_banners_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'puja_banners' }, (payload) => {
        console.log('[Puja Screen] Realtime event caught, auto-reloading puja banner...', payload);
        loadPujaBanner();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
      supabase.removeChannel(generalSubscription);
      supabase.removeChannel(problemSubscription);
      supabase.removeChannel(lifeProblemsSubscription);
      supabase.removeChannel(sectionSubscription);
      supabase.removeChannel(offerPujasSubscription);
      supabase.removeChannel(dailySectionsSubscription);
      supabase.removeChannel(dailyPujasSubscription);
      supabase.removeChannel(panditVideosSubscription);
      supabase.removeChannel(pujaBannerSubscription);
    };
  }, [
    loadOneRupeePoojas,
    loadGeneralPoojas,
    loadProblemPoojas,
    loadLifeProblems,
    loadOfferSections,
    loadDailySections,
    loadPanditVideos,
    loadPujaBanner
  ]);

  const displayedGeneralPujas = generalPujas.length > 0 ? generalPujas : PUJAS_DATA.map(p => ({
    id: p.id,
    title: p.title,
    originalPrice: p.price === '₹501' ? '₹1,501' : p.price === '₹1,100' ? '₹3,100' : p.price === '₹351' ? '₹999' : p.price === '₹251' ? '₹799' : p.price === '₹151' ? '₹499' : '₹4,500',
    offerPrice: p.price,
    price: p.price,
    rating: p.rating,
    reviews: '120',
    provider: p.description.replace('by ', ''),
    description: p.description,
    time: p.time,
    image: p.image,
  }));

  const displayedCurated = offerSections.length > 0 ? offerSections : STATIC_CURATED_DATA;

  const row1Items = oneRupeeItems.filter((_, index) => index % 2 === 0);
  const row2Items = oneRupeeItems.filter((_, index) => index % 2 !== 0);

  const PROBLEM_CATEGORIES = ['Health', 'Wealth', 'Job & Career', 'Marriage & Love', 'Grah Dosh', 'Education'];

  const filteredProblemPujas = React.useMemo(() => {
    if (problemPoojas.length > 0) {
      return problemPoojas.filter(p => p.problem_category.toLowerCase() === selectedProblemTab.toLowerCase());
    }

    const allPujas = generalPujas.length > 0 ? generalPujas : PUJAS_DATA.map(p => ({
      id: p.id,
      title: p.title,
      originalPrice: p.price === '₹501' ? '₹1,501' : p.price === '₹1,100' ? '₹3,100' : p.price === '₹351' ? '₹999' : p.price === '₹251' ? '₹799' : p.price === '₹151' ? '₹499' : '₹4,500',
      offerPrice: p.price,
      price: p.price,
      rating: p.rating,
      reviews: '120',
      provider: p.description.replace('by ', ''),
      description: p.description,
      time: p.time,
      image: p.image,
    }));
    
    const normalized = selectedProblemTab.toLowerCase();
    if (normalized.includes('health')) {
      return allPujas.filter(p => 
        p.title.toLowerCase().includes('shiv') || 
        p.title.toLowerCase().includes('shanti') || 
        p.title.toLowerCase().includes('hanuman')
      );
    }
    if (normalized.includes('wealth')) {
      return allPujas.filter(p => 
        p.title.toLowerCase().includes('laxmi') || 
        p.title.toLowerCase().includes('tirupati') || 
        p.title.toLowerCase().includes('navgrah')
      );
    }
    if (normalized.includes('job') || normalized.includes('career')) {
      return allPujas.filter(p => 
        p.title.toLowerCase().includes('ganesh') || 
        p.title.toLowerCase().includes('kedarnath') || 
        p.title.toLowerCase().includes('navgrah')
      );
    }
    if (normalized.includes('marriage') || normalized.includes('love')) {
      return allPujas.filter(p => 
        p.title.toLowerCase().includes('ganesh') || 
        p.title.toLowerCase().includes('shanti') || 
        p.title.toLowerCase().includes('tirupati')
      );
    }
    if (normalized.includes('grah') || normalized.includes('dosh')) {
      return allPujas.filter(p => 
        p.title.toLowerCase().includes('navgrah') || 
        p.title.toLowerCase().includes('hanuman') || 
        p.title.toLowerCase().includes('kedarnath')
      );
    }
    return allPujas;
  }, [selectedProblemTab, generalPujas, problemPoojas]);

  const renderProductCard = (item: any) => {
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
          <Image
            source={typeof item.image === 'number' ? item.image : { uri: item.image }}
            style={styles.productImage}
            contentFit="cover"
          />
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
        <View style={styles.productRatingBadge}>
          <Text style={styles.productRatingText}>★ {item.rating} ({item.reviews})</Text>
        </View>

        {/* Divider Line */}
        <View style={styles.cardDivider} />

        {/* Provider Detail */}
        <Text style={styles.providerText} numberOfLines={1}>{t(item.provider)}</Text>
      </TouchableOpacity>
    );
  };


  const handleToggle = () => {
    const newValue = activeTab === 'Pujas' ? 1 : 0;
    setActiveTab(activeTab === 'Pujas' ? 'Problems' : 'Pujas');
    transition.value = withTiming(newValue, { duration: 600 });
  };

  const renderItem = ({ item }: { item: any }) => {
    const isPuja = activeTab === 'Pujas';
    return (
      <TouchableOpacity
        style={[
          styles.categoryCard,
          !isPuja && { width: 85, marginRight: 10 }
        ]}
        activeOpacity={0.85}
        onPress={() => {
          if (isPuja) {
            router.push({
              pathname: '/puja_detail',
              params: { id: item.id }
            });
          } else {
            router.push({
              pathname: '/problem_pujas',
              params: { category: item.title }
            });
          }
        }}
      >
        <View style={[
          styles.categoryImageWrapper,
          !isPuja && { width: 78, height: 50, borderRadius: 10, borderWidth: 1 }
        ]}>
          <Image 
            source={typeof item.image === 'number' ? item.image : { uri: item.image }} 
            style={[
              styles.categoryImage,
              { width: '100%', height: '100%' }
            ]} 
            contentFit="cover"
          />
        </View>
        <Text 
          style={[
            styles.categoryTitle,
            !isPuja && { fontSize: 10, color: '#334155', fontWeight: '700', lineHeight: 12, marginTop: 2 }
          ]} 
          numberOfLines={2}
        >
          {t(item.title).replace('\\n', ' ').replace('\n', ' ')}
        </Text>
        {/* Active Indicator Line */}
        <View style={[
          styles.activeIndicator,
          { backgroundColor: activeTab === 'Pujas' && item.id === '1' ? '#E53935' : 'transparent' }
        ]} />
      </TouchableOpacity>
    );
  };

  const activeDailySection = dailySections[selectedDayNum] || DAILY_RITUALS_DATA[selectedDayNum];

  return (
    <View style={styles.safeArea}>
      <StatusBar style="dark" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>

        {/* Premium Banner Section with Floating Search Bar */}
        <View style={styles.bannerWrapper}>
          <View style={[styles.bannerContainer, { height: 280 + insets.top }]}>
            <LinearGradient
              colors={pujaBanner ? [pujaBanner.gradient_start, pujaBanner.gradient_end] : ['#f97316', '#ea580c']}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            />

            {/* Floating Search Bar */}
            <View style={[styles.floatingSearchContainer, { paddingTop: insets.top }]}>
              <View style={styles.searchBar}>
                <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
                <Text style={styles.searchPlaceholder}>{t("Search for 'Puja'")}</Text>
              </View>
            </View>

            <View style={styles.bannerContent}>
              {/* Left Side: Logo and CTA */}
              <View style={styles.textSection}>
                <View style={styles.logoContainer}>
                  <View style={styles.topLogoLine}>
                    <View style={styles.logoBorder} />
                    <Text style={styles.logoSmallText}>{pujaBanner?.small_title || 'MANTRAPUJA'}</Text>
                    <View style={styles.logoBorder} />
                  </View>
                  <Text style={styles.logoMainText}>{pujaBanner?.main_title || 'DEALS'}</Text>
                </View>

                <Text style={styles.bannerSubtitle}>
                  {pujaBanner ? (
                    pujaBanner.subtitle.split(/(\d+)/).map((part: string, idx: number) => {
                      if (/\d+/.test(part)) {
                        return <Text key={idx} style={styles.priceText}>{part}</Text>;
                      }
                      return part;
                    })
                  ) : (
                    <>
                      {t('Divine blessing packs')}{"\n"}{t('starting at')} <Text style={styles.priceText}>₹29</Text>
                    </>
                  )}
                </Text>

                <TouchableOpacity activeOpacity={0.9} style={styles.orderButton}>
                  <Text style={styles.orderButtonText}>{t(pujaBanner?.button_text || 'BOOK NOW')}</Text>
                </TouchableOpacity>
              </View>

              {/* Right Side: Arched Image Frame */}
              <View style={styles.imageSection}>
                {/* Arched Frame */}
                <View style={styles.archFrame}>
                  <Image
                    source={pujaBanner?.image_url ? { uri: pujaBanner.image_url } : require('../../assets/God/puja_banner_illustration.png')}
                    style={styles.bannerImage}
                    contentFit="cover"
                  />
                </View>

                {/* Floating Decorative Elements (Hearts equivalent) */}
                <Ionicons name="heart" size={20} color="#ff3b30" style={[styles.floatingIcon, { top: 20, left: -10 }]} />
                <Ionicons name="heart" size={16} color="#ff3b30" style={[styles.floatingIcon, { bottom: 60, left: -25 }]} />
                <Ionicons name="heart" size={24} color="#ff3b30" style={[styles.floatingIcon, { top: 40, right: 0 }]} />
                <Ionicons name="heart" size={14} color="#ff3b30" style={[styles.floatingIcon, { bottom: 20, right: 30 }]} />
              </View>
            </View>
          </View>
        </View>



        {/* Simplified Tab Section: Fixed Label on Right */}
        <View style={styles.tabSection}>
          <View style={styles.tabContentRow}>

            {/* The Active Tab Content (Left) */}
            <View style={styles.activeContentContainer}>
              <Text style={styles.activeTabHeader}>{activeTab}</Text>
              <Animated.FlatList
                horizontal
                key={activeTab} // Forces fresh mount for clean animation or use Reanimated Layout
                data={activeTab === 'Pujas' ? displayedGeneralPujas : (lifeProblems.length > 0 ? lifeProblems : PROBLEMS_DATA)}
                renderItem={renderItem}
                keyExtractor={(item) => item.id}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.itemsList}
              />
            </View>

            {/* The Toggler Box (Fixed Right) - Premium Switch Card */}
            <TouchableOpacity
              onPress={handleToggle}
              activeOpacity={0.85}
              style={styles.dealBoxContainer}
            >
              <LinearGradient
                colors={activeTab === 'Pujas' ? ['#fff7ed', '#ffedd5'] : ['#eff6ff', '#dbeafe']}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
              <View style={styles.dealContent}>
                <View style={[
                  styles.dealIconContainer,
                  { backgroundColor: activeTab === 'Pujas' ? '#ffedd5' : '#dbeafe' }
                ]}>
                  <Ionicons 
                    name={activeTab === 'Pujas' ? "flame-outline" : "sparkles-outline"} 
                    size={16} 
                    color={activeTab === 'Pujas' ? "#ea580c" : "#1d4ed8"} 
                  />
                </View>
                <Text style={[styles.dealLabel, { color: activeTab === 'Pujas' ? '#c2410c' : '#1e40af' }]}>
                  {activeTab === 'Pujas' ? t('Problems') : t('Pujas')}
                </Text>
                <View style={[
                  styles.dealBadge,
                  { backgroundColor: activeTab === 'Pujas' ? '#ea580c' : '#1d4ed8' }
                ]}>
                  <Text style={styles.dealBadgeText}>{t('SWITCH')}</Text>
                </View>
              </View>
            </TouchableOpacity>

          </View>
        </View>

        {activeTab === 'Pujas' ? (
          /* Horizontal Scroll Swiggy Style with Premium Burst — Stacked in 2 Rows */
          <View style={styles.categoriesSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeader}>{t('Puja under ₹1')}</Text>
              <TouchableOpacity onPress={() => router.push('/one_rupee_store')}>
                <Text style={styles.viewAllText}>{t('View all')} {'>'}</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.twoRowScrollContent}
            >
              <View style={styles.twoRowWrapper}>
                {/* Row 1 */}
                <View style={styles.horizontalRow}>
                  {row1Items.map((item) => renderProductCard(item))}
                </View>
                {/* Row 2 */}
                <View style={[styles.horizontalRow, { marginTop: 24 }]}>
                  {row2Items.map((item) => renderProductCard(item))}
                </View>
              </View>
            </ScrollView>
          </View>
        ) : (
          /* Problem Pujas Section */
          <View style={styles.categoriesSection}>
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionHeader}>{t('Problem Pujas')}</Text>
              <TouchableOpacity onPress={() => router.push({
                pathname: '/problem_pujas',
                params: { category: selectedProblemTab }
              })}>
                <Text style={styles.viewAllText}>{t('View all')} {'>'}</Text>
              </TouchableOpacity>
            </View>

            {/* Problem Category Tabs Scroll */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingHorizontal: 16, marginBottom: 16 }}
            >
              {PROBLEM_CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[
                    styles.problemPill,
                    selectedProblemTab === cat && styles.problemPillActive
                  ]}
                  onPress={() => setSelectedProblemTab(cat)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.problemPillText,
                    selectedProblemTab === cat && styles.problemPillTextActive
                  ]}>
                    {t(cat + ' Puja')}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Horizontal Scroll list of matching problem cards */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 12, paddingBottom: 10 }}
            >
              {filteredProblemPujas.map((item) => renderProductCard(item))}
            </ScrollView>
          </View>
        )}


        {/* First Curated Collection */}
        {displayedCurated.slice(0, 1).map((collection) => (
          <View key={collection.id} style={styles.curatedSection}>
            <Image source={typeof collection.bgImage === 'number' ? collection.bgImage : { uri: collection.bgImage }} style={styles.curatedBg} />
            <View style={styles.curatedOverlay}>
              <View style={styles.curatedTextSection}>
                <Text style={styles.curatedTitle}>{t(collection.title)}</Text>
                <Text style={styles.curatedSubtitle}>{t(collection.subtitle)}</Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.curatedItemsScroll}
              >
                {collection.items.map((subItem: any) => (
                  <TouchableOpacity
                    key={subItem.id}
                    style={styles.curatedItemCard}
                    activeOpacity={0.85}
                    onPress={() => router.push({
                      pathname: '/puja_detail',
                      params: { id: subItem.id, slug: subItem.slug }
                    })}
                  >
                    <Image source={typeof subItem.image === 'number' ? subItem.image : { uri: subItem.image }} style={styles.curatedItemImage} contentFit="cover" />
                    <View style={styles.curatedItemLabel}>
                      <Text style={styles.curatedItemText} numberOfLines={2}>{t(subItem.name)}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        ))}

        {/* Puja of Days Section - Now Between Collections */}
        <View style={styles.daysSection}>
          <View style={styles.daysHeaderRow}>
            <Text style={styles.daysSectionHeader}>{t('RITUALS OF THE DAY')}</Text>
            <View style={styles.todayEnergyBadge}>
              <Text style={styles.todayEnergyText}>{t("Today's Energy: Shiva ✨")}</Text>
            </View>
          </View>

          <View style={styles.daysScrollWrapper}>


            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.daysScrollContainer}
            >
              {DAYS_DATA.map((item, index) => {
                const currentDay = new Date().getDay(); // 0 is Sun, 1 is Mon, etc.
                const isToday = item.dayNum === currentDay;
                const isSelected = item.dayNum === selectedDayNum;

                return (
                  <TouchableOpacity 
                    key={item.id} 
                    style={styles.dayCircleWrapper} 
                    activeOpacity={0.85}
                    onPress={() => setSelectedDayNum(item.dayNum)}
                  >
                    {/* Dynamic Today Badge */}
                    {isToday && (
                      <View style={styles.todayIndicatorBadge}>
                        <Text style={styles.todayIndicatorText}>{t('Today')}</Text>
                      </View>
                    )}

                    {/* Ring Container representing circular glowing border */}
                    <View style={[
                      styles.dayCircleOuterRing,
                      {
                        borderColor: isSelected ? item.color : item.glowColor,
                        shadowColor: item.color,
                        backgroundColor: '#ffffff',
                        borderWidth: isSelected ? 3.5 : 1.5,
                        shadowOpacity: isSelected ? 0.35 : 0.08,
                        shadowRadius: isSelected ? 12 : 4,
                        elevation: isSelected ? 7 : 2,
                      }
                    ]}>
                      <View style={[styles.dayCircleInnerGlow, { backgroundColor: item.bgColor }]}>
                        <Image
                          source={item.image}
                          style={styles.dayCircleImage}
                          contentFit="contain"
                        />
                      </View>
                    </View>

                    {/* Deity Name */}
                    <Text style={styles.dayDeityNameText}>{t(item.deity)}</Text>

                    {/* Day name */}
                    <Text style={styles.daySubLabel}>{t(item.day)}</Text>

                    {/* Benefit/Vibe tag */}
                    <View style={[styles.benefitPill, { backgroundColor: item.bgColor }]}>
                      <Text style={[styles.benefitPillText, { color: item.color }]}>{t(item.subtitle)}</Text>
                    </View>

                    {/* Elegant Connector Line with Diamond */}
                    {index < DAYS_DATA.length - 1 && (
                      <View style={styles.absoluteConnector}>
                        <View style={[styles.connectorLine, { backgroundColor: item.color }]} />
                        <Text style={[styles.connectorDiamond, { color: item.color }]}>◆</Text>
                        <View style={[styles.connectorLine, { backgroundColor: item.color }]} />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Bottom Tap Pointer */}
          <View style={styles.tapPromptRow}>
            <Text style={styles.tapPromptStar}>✦</Text>
            <Ionicons name="finger-print-outline" size={13} color="#ca8a04" style={{ marginHorizontal: 4 }} />
            <Text style={styles.tapPromptText}>{t('Tap on any day to see recommended rituals')}</Text>
            <Text style={styles.tapPromptStar}>✦</Text>
          </View>
        </View>

        {/* Hardcoded Day-wise Curated Rituals Section */}
        {activeDailySection && (
          <View style={styles.curatedSection}>
            <Image 
              source={typeof activeDailySection.bgImage === 'number' 
                ? activeDailySection.bgImage 
                : { uri: activeDailySection.bgImage }} 
              style={styles.curatedBg} 
            />
            <View style={styles.curatedOverlay}>
              <View style={styles.curatedTextSection}>
                <Text style={styles.curatedTitle}>{t(activeDailySection.title)}</Text>
                <Text style={styles.curatedSubtitle}>{t(activeDailySection.subtitle)}</Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.curatedItemsScroll}
              >
                {activeDailySection.items && activeDailySection.items.map((subItem: any) => (
                  <TouchableOpacity
                    key={subItem.id}
                    style={styles.curatedItemCard}
                    activeOpacity={0.85}
                    onPress={() => router.push({
                      pathname: '/puja_detail',
                      params: { id: subItem.id, slug: subItem.slug }
                    })}
                  >
                    <Image 
                      source={typeof subItem.image === 'number' ? subItem.image : { uri: subItem.image }} 
                      style={styles.curatedItemImage} 
                      contentFit="cover"
                    />
                    <View style={styles.curatedItemLabel}>
                      <Text style={styles.curatedItemText} numberOfLines={2}>{t(subItem.name)}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        )}


        {/* Remaining Curated Collections */}
        {displayedCurated.slice(1).map((collection) => (
          <View key={collection.id} style={styles.curatedSection}>
            <Image source={typeof collection.bgImage === 'number' ? collection.bgImage : { uri: collection.bgImage }} style={styles.curatedBg} />
            <View style={styles.curatedOverlay}>
              <View style={styles.curatedTextSection}>
                <Text style={styles.curatedTitle}>{t(collection.title)}</Text>
                <Text style={styles.curatedSubtitle}>{t(collection.subtitle)}</Text>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.curatedItemsScroll}
              >
                {collection.items.map((subItem: any) => (
                  <TouchableOpacity
                    key={subItem.id}
                    style={styles.curatedItemCard}
                    activeOpacity={0.85}
                    onPress={() => router.push({
                      pathname: '/puja_detail',
                      params: { id: subItem.id, slug: subItem.slug }
                    })}
                  >
                    <Image source={typeof subItem.image === 'number' ? subItem.image : { uri: subItem.image }} style={styles.curatedItemImage} contentFit="cover" />
                    <View style={styles.curatedItemLabel}>
                      <Text style={styles.curatedItemText} numberOfLines={2}>{t(subItem.name)}</Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>
        ))}

        {/* All Puja Section - Premium Swiggy-Style Menu List */}
        <View style={styles.allPujaSection}>
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionHeader}>{t('All Puja')}</Text>
          </View>
          <View style={styles.pujaListContainer}>
            {displayedGeneralPujas.slice(0, 8).map((item) => (
              <View key={item.id} style={styles.pujaListItem}>
                {/* Left Side: Deity Thumbnail Container with Floating Rating */}
                <View style={styles.pujaListLeftColumn}>
                  <Image source={typeof item.image === 'number' ? item.image : { uri: item.image }} style={styles.pujaListImage} contentFit="cover" />
                  <View style={styles.pujaListRatingBadge}>
                    <Ionicons name="star" size={10} color="#ffffff" style={{ marginRight: 2 }} />
                    <Text style={styles.pujaListRatingText}>{item.rating}</Text>
                  </View>
                </View>

                {/* Right Side: Devotional Content Details */}
                <View style={styles.pujaListRightColumn}>
                  <View style={styles.pujaHeaderInfoRow}>
                    <View style={styles.spiritualBadge}>
                      <Ionicons name="sparkles" size={10} color="#ea580c" />
                      <Text style={styles.spiritualBadgeText}>{t('VEDIC SEVA')}</Text>
                    </View>
                    <Text style={styles.pujaTimeTag}>{item.time}</Text>
                  </View>

                  <Text style={styles.pujaListTitle} numberOfLines={1}>{t(item.title)}</Text>
                  <Text style={styles.pujaListDesc} numberOfLines={1}>{t(item.description)}</Text>

                  {/* Saffron subtext badge */}
                  <View style={styles.spiritualSubTextRow}>
                    <Ionicons name="gift-outline" size={12} color="#ea580c" />
                    <Text style={styles.spiritualSubText}>{t('Includes Sacred Prasad box')}</Text>
                  </View>

                  {/* Price Row + Book Seva Pill Action */}
                  <View style={styles.pujaCardBottomRow}>
                    <View style={styles.pujaCardPriceCol}>
                      <Text style={styles.pujaOfferPriceText}>{item.price}</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.bookSevaBtn}
                      activeOpacity={0.85}
                      onPress={() => router.push({
                        pathname: '/puja_detail',
                        params: { id: item.id }
                      })}
                    >
                      <Text style={styles.bookSevaBtnText}>{t('Book Seva')}</Text>
                      <Ionicons name="arrow-forward" size={12} color="#ffffff" style={{ marginLeft: 3 }} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* View All Pujas Button */}
          <TouchableOpacity
            style={styles.viewMoreButton}
            activeOpacity={0.8}
            onPress={() => router.push('/all_general_pujas')}
          >
            <Text style={styles.viewMoreText}>{t('View All Pujas')}</Text>
            <Ionicons name="arrow-forward" size={14} color="#f57c00" style={{ marginLeft: 6 }} />
          </TouchableOpacity>
        </View>

        {/* Puja Videos by Our Pandits Section */}
        <View style={styles.panditVideosSection}>
          <View style={styles.panditVideosHeader}>
            <Text style={styles.panditVideosTitle}>{t('Puja Videos by Our Pandits')}</Text>
            <Text style={styles.panditVideosSubtitle}>{t('Experience the divine energy of rituals performed by our certified acharyas')}</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.panditVideosScroll}
          >
            {(panditVideos.length > 0 ? panditVideos : [
              {
                id: 'fallback-pv1',
                pandit_name: 'Acharya Ramanand Shastri',
                temple: 'Kashi Vishwanath, Varanasi',
                ritual_name: 'Maha Rudrabhishek Havan',
                thumbnail_url: null,
                video_url: 'https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/video-reviews/fallback.mp4',
                duration: '3:45',
              },
              {
                id: 'fallback-pv2',
                pandit_name: 'Pandit Somnath Dwivedi',
                temple: 'Ganga Ghat, Haridwar',
                ritual_name: 'Daily Maha Ganga Aarti',
                thumbnail_url: null,
                video_url: 'https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/video-reviews/fallback.mp4',
                duration: '5:20',
              },
              {
                id: 'fallback-pv3',
                pandit_name: 'Acharya Devendra Bhatt',
                temple: 'Kedarnath Temple Special',
                ritual_name: 'Kedarnath Shravan Puja',
                thumbnail_url: null,
                video_url: 'https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/video-reviews/fallback.mp4',
                duration: '4:10',
              },
              {
                id: 'fallback-pv4',
                pandit_name: 'Pandit Vinayak Joshi',
                temple: 'Siddhivinayak Mandir, Mumbai',
                ritual_name: 'Ganesh Chaturthi Havan',
                thumbnail_url: null,
                video_url: 'https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/video-reviews/fallback.mp4',
                duration: '2:50',
              }
            ]).map((item, idx) => (
              <TouchableOpacity 
                key={item.id} 
                style={styles.panditVideoCard} 
                activeOpacity={0.9}
                onPress={() => setActivePanditVideo(item)}
              >
                {/* Background Video Thumbnail */}
                <Image
                  source={item.thumbnail_url ? { uri: item.thumbnail_url } : (idx === 0 || idx === 3 ? require('../../assets/review/celebration-navratri-deity_23-2151220009.avif') : idx === 1 ? require('../../assets/review/istockphoto-944138400-612x612.jpg') : require('../../assets/review/pngtree-indian-handsome-man-thinking-happy-young-dress-photo-image_15140676.jpg'))}
                  style={styles.panditVideoThumbnail}
                  contentFit="cover"
                />

                {/* Black Overlay for readability */}
                <LinearGradient
                  colors={['rgba(0, 0, 0, 0.1)', 'rgba(0, 0, 0, 0.4)', 'rgba(0, 0, 0, 0.85)']}
                  style={StyleSheet.absoluteFillObject}
                />

                {/* Floating Duration Tag */}
                <View style={styles.panditDurationBadge}>
                  <Ionicons name="videocam" size={9} color="#ffffff" style={styles.panditDurationIcon} />
                  <Text style={styles.panditDurationText}>{item.duration}</Text>
                </View>

                {/* Centered Glowing Play Button */}
                <View style={styles.panditPlayIconContainer}>
                  <Ionicons name="play" size={16} color="#ffffff" style={styles.panditPlayIcon} />
                </View>

                {/* Pandit details overlay at the bottom */}
                <View style={styles.panditVideoTextContent}>
                  {/* Temple / Location Row */}
                  <Text style={styles.panditTempleText} numberOfLines={1}>
                    {t(item.temple)}
                  </Text>

                  {/* Pandit Name */}
                  <Text style={styles.panditNameText} numberOfLines={1}>
                    {t(item.pandit_name)}
                  </Text>

                  {/* Ritual Name */}
                  <Text style={styles.panditRitualText} numberOfLines={1}>
                    {t(item.ritual_name)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

      </ScrollView>
      {activePanditVideo && (
        <PanditVideoModal 
          url={activePanditVideo.video_url} 
          panditName={activePanditVideo.pandit_name} 
          ritualName={activePanditVideo.ritual_name} 
          onClose={() => setActivePanditVideo(null)} 
        />
      )}
      <DraggableCalendarButton />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#fff",
  },
  floatingSearchContainer: {
    width: '100%',
    zIndex: 10,
    marginBottom: 10,
  },
  searchSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginTop: 0,
    marginBottom: 0,
    gap: 12,
  },
  searchBar: {
    marginHorizontal: 16,
    height: 48,
    backgroundColor: '#fff',
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchPlaceholder: {
    color: '#666',
    fontSize: 15,
  },
  vegToggleContainer: {
    backgroundColor: '#fff',
    borderRadius: 24,
    paddingHorizontal: 12,
    paddingVertical: 4,
    height: 48,
    justifyContent: 'center',
  },
  vegToggle: {
    alignItems: 'center',
  },
  vegText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#002910',
    marginBottom: 2,
  },
  toggleSwitch: {
    width: 26,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 1,
  },
  toggleCircle: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#002910',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  bannerWrapper: {
    marginTop: -21,
    width: '100%',
  },
  bannerContainer: {
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    height: 310,
    overflow: 'hidden',
    position: 'relative',
    padding: 15,
  },
  bannerContent: {
    flex: 1,
    flexDirection: 'row',
  },
  textSection: {
    flex: 1.1,
    justifyContent: 'center',
    paddingLeft: 10,
  },
  logoContainer: {
    marginBottom: 10,
    transform: [{ rotate: '-2deg' }],
  },
  topLogoLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  logoBorder: {
    flex: 1,
    height: 1,
    backgroundColor: '#fff',
  },
  logoSmallText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  logoMainText: {
    color: '#fff',
    fontSize: 48,
    fontWeight: '900',
    lineHeight: 52,
    marginTop: -5,
  },
  bannerSubtitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 18,
    opacity: 0.9,
  },
  priceText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 18,
  },
  orderButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 100,
    alignSelf: 'flex-start',
    marginTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  orderButtonText: {
    color: '#000',
    fontSize: 13,
    fontWeight: '900',
  },
  imageSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  archFrame: {
    width: width * 0.35,
    height: width * 0.45,
    backgroundColor: '#a21caf', // Purple bg in frame
    borderTopLeftRadius: 100,
    borderTopRightRadius: 100,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    transform: [{ scale: 1.1 }],
  },
  floatingIcon: {
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  tabSection: {
    backgroundColor: '#fff',
    marginTop: 0,
    paddingVertical: 10,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    paddingTop: 15,
  },
  tabContentRow: {
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 110,
    width: '100%',
    gap: 5,
  },
  dealBoxContainer: {
    minWidth: 80,
    minHeight: 90,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    backgroundColor: '#ffffff',
  },
  dealContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 6,
    gap: 4,
  },
  dealIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  dealLabel: {
    fontSize: 9.5,
    fontFamily: 'Outfit-Bold',
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  dealBadge: {
    paddingVertical: 2.5,
    paddingHorizontal: 7,
    borderRadius: 6,
    marginTop: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  dealBadgeText: {
    color: '#ffffff',
    fontSize: 7,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  activeContentContainer: {
    flex: 1,
    zIndex: 1,
  },
  activeTabHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: '#71717a',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  itemsList: {
    paddingRight: 5,
    alignItems: 'center',
  },
  categoryCard: {
    width: 65,
    alignItems: 'center',
    marginRight: 8,
    position: 'relative',
    paddingBottom: 5,
  },
  categoryImageWrapper: {
    width: 58,
    height: 58,
    borderRadius: 14,
    backgroundColor: '#fafafa',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 5,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#e4e4e7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  categoryImage: {
    width: '90%',
    height: '90%',
  },
  categoryTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#000',
    textAlign: 'center',
  },
  activeIndicator: {
    height: 2,
    width: '60%',
    marginTop: 4,
    borderRadius: 2,
  },
  horizontalScrollContainer: {
    paddingRight: 20,
    paddingLeft: 12,
    paddingTop: 12,
    gap: 15,
  },
  serviceCard: {
    width: 110, // Consistent with 3-col feel but scrollable
    backgroundColor: 'transparent',
    overflow: 'visible',
  },
  cardHeader: {
    width: '100%',
    height: 120,
    position: 'relative',
    borderRadius: 15,
    overflow: 'visible',
  },
  serviceImage: {
    width: '100%',
    height: '100%',
    borderRadius: 15,
  },
  priceBurst: {
    position: 'absolute',
    top: -8,
    left: -8,
    width: 38,
    height: 38,
    backgroundColor: '#e91e63',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#fff',
    zIndex: 100,
    elevation: 5,
  },
  burstSmall: {
    color: '#fff',
    fontSize: 5.5,
    fontWeight: '800',
    marginBottom: -1,
  },
  burstLarge: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '900',
  },
  ratingBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    backgroundColor: '#2e7d32',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    gap: 2,
  },
  ratingText: {
    color: '#fff',
    fontSize: 8,
    fontWeight: '900',
  },
  serviceContent: {
    paddingTop: 8,
  },
  serviceTitle: {
    fontSize: 12,
    fontWeight: '900',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  subtextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  subtext: {
    fontSize: 10,
    color: '#666',
    fontWeight: '700',
  },
  miniBookButton: {
    backgroundColor: '#f57c00', // Branded orange
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
    shadowColor: '#f57c00',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  miniBookButtonText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  categoriesSection: {
    padding: 16,
    marginTop: 5,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '900',
    color: '#1a1a1a',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  viewAllText: {
    fontSize: 12,
    color: '#f57c00', // Branded orange
    fontWeight: '800',
  },
  curatedSection: {
    width: '100%',
    minHeight: 295,
    marginTop: 15,
    overflow: 'hidden',
    position: 'relative',
  },
  curatedBg: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  curatedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,18,31,0.55)', // Elegant darker blue overlay
    paddingHorizontal: 15,
    paddingTop: 35, // Pushes everything down
    paddingBottom: 15,
    justifyContent: 'flex-end', // Pushes the text and cards down
  },
  curatedTextSection: {
    marginBottom: 10,
  },
  curatedTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#fff',
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  curatedSubtitle: {
    fontSize: 12.5,
    color: '#fff',
    fontWeight: '600',
    opacity: 0.9,
    width: '80%',
    lineHeight: 16,
  },
  curatedItemsScroll: {
    gap: 12,
    marginTop: 16, // Pushes the items DOWN elegantly separating them
  },
  curatedItemCard: {
    width: 120, // Increased size
    height: 125, // Increased size
    backgroundColor: '#fff',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#fff',
  },
  curatedItemImage: {
    width: '100%',
    height: 85, // Increased size
  },
  curatedItemLabel: {
    padding: 4,
    minHeight: 40, // Increased size
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  curatedItemText: {
    fontSize: 9.5, // Increased font size
    fontWeight: '900',
    color: '#333',
    textAlign: 'center',
    lineHeight: 12,
  },
  daysSection: {
    paddingHorizontal: 0,
    marginTop: 24,
    marginBottom: 20,
    backgroundColor: '#ffffff',
  },
  daysHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  daysSectionHeader: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
    color: '#0f172a',
    letterSpacing: -0.2,
  },
  todayEnergyBadge: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  todayEnergyText: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    color: '#1d4ed8',
  },
  daysScrollWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },

  daysScrollContainer: {
    paddingHorizontal: 18,
    paddingTop: 24, // Allocate space for floating Today badge
    paddingBottom: 8,
    gap: 16, // Spacious gaps to perfectly match reference layout
    zIndex: 2,
  },
  dayCircleWrapper: {
    alignItems: 'center',
    width: 80, // Compact, mathematically centered wrapper width
    position: 'relative',
    zIndex: 2,
  },
  todayIndicatorBadge: {
    position: 'absolute',
    top: -14, // Float exactly over the top border
    backgroundColor: '#2563eb', // Beautiful deep royal blue
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    zIndex: 12,
    shadowColor: '#2563eb',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  todayIndicatorText: {
    fontSize: 8.5,
    fontFamily: 'Outfit-Bold',
    color: '#ffffff',
    letterSpacing: 0.3,
  },
  dayCircleOuterRing: {
    width: 66, // Elevated circle width matching the premium design
    height: 66,
    borderRadius: 33,
    borderWidth: 1.5,
    padding: 3,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
    backgroundColor: '#ffffff',
    zIndex: 2,
  },
  dayCircleInnerGlow: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayCircleImage: {
    width: '90%',
    height: '90%',
  },
  absoluteConnector: {
    position: 'absolute',
    top: 33, // Centered vertically with the 66px circle
    left: 71, // Positions connector perfectly centered in the 16px gap with overlap
    width: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1, // Sit behind the circles
  },
  connectorLine: {
    flex: 1,
    height: 1.5,
    opacity: 0.3,
  },
  connectorDiamond: {
    fontSize: 7.5,
    marginHorizontal: 1,
    opacity: 0.85,
    marginTop: -1,
  },
  dayDeityNameText: {
    fontSize: 10.5,
    fontFamily: 'Outfit-Bold',
    color: '#1e293b',
    marginTop: 8,
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  daySubLabel: {
    fontSize: 10.5,
    fontFamily: 'Outfit-Regular',
    color: '#64748b',
    marginTop: 1,
    textAlign: 'center',
  },
  benefitPill: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 3.5,
    marginTop: 6,
    minWidth: 84,
    alignItems: 'center',
  },
  benefitPillText: {
    fontSize: 8.5,
    fontFamily: 'Outfit-Bold',
    textAlign: 'center',
    lineHeight: 10.5,
  },
  tapPromptRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 18,
    paddingVertical: 4,
    paddingHorizontal: 16,
  },
  tapPromptStar: {
    fontSize: 10,
    color: '#ca8a04',
    opacity: 0.7,
  },
  tapPromptText: {
    fontSize: 12,
    fontFamily: 'Outfit-Medium',
    color: '#854d0e',
    marginHorizontal: 4,
  },
  allPujaSection: {
    paddingHorizontal: 16,
    marginTop: 20,
    marginBottom: 20,
  },
  pujaListContainer: {
    marginTop: 10,
    gap: 14,
  },
  pujaListItem: {
    flexDirection: 'row',
    padding: 14,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    marginBottom: 12,
    alignItems: 'center',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 10,
    elevation: 3,
  },
  pujaListLeftColumn: {
    width: 120,
    height: 120,
    position: 'relative',
  },
  pujaListImage: {
    width: '100%',
    height: '100%',
    borderRadius: 16,
    backgroundColor: '#f8fafc',
  },
  pujaListRatingBadge: {
    position: 'absolute',
    bottom: -6,
    alignSelf: 'center',
    backgroundColor: '#059669',
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 2,
  },
  pujaListRatingText: {
    color: '#ffffff',
    fontSize: 9,
    fontFamily: 'Outfit-Bold',
  },
  pujaListRightColumn: {
    flex: 1,
    paddingLeft: 12,
    justifyContent: 'center',
  },
  pujaHeaderInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  spiritualBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    gap: 3,
  },
  spiritualBadgeText: {
    fontSize: 8.5,
    fontFamily: 'Outfit-Bold',
    color: '#ea580c',
  },
  pujaTimeTag: {
    fontSize: 9.5,
    fontFamily: 'Outfit-Medium',
    color: '#64748b',
  },
  pujaListTitle: {
    fontSize: 15,
    fontFamily: 'Outfit-Bold',
    color: '#0f172a',
  },
  pujaListDesc: {
    fontSize: 11,
    fontFamily: 'Outfit-Regular',
    color: '#64748b',
    marginTop: 2,
  },
  spiritualSubTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 6,
  },
  spiritualSubText: {
    fontSize: 10,
    fontFamily: 'Outfit-Medium',
    color: '#ea580c',
  },
  pujaCardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  pujaCardPriceCol: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  pujaOfferPriceText: {
    fontSize: 15,
    fontFamily: 'Outfit-ExtraBold',
    color: '#0f172a',
  },
  bookSevaBtn: {
    backgroundColor: '#059669',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  bookSevaBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontFamily: 'Outfit-Bold',
  },
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 15,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
  },
  viewMoreText: {
    fontSize: 13,
    fontFamily: 'Outfit-Bold',
    color: '#f57c00',
    marginRight: 6,
  },
  panditVideosSection: {
    marginVertical: 20,
    backgroundColor: '#ffffff',
    paddingBottom: 25,
  },
  panditVideosHeader: {
    paddingHorizontal: 20,
    marginBottom: 14,
  },
  panditVideosTitle: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
    color: '#0f172a',
  },
  panditVideosSubtitle: {
    fontSize: 11.5,
    fontFamily: 'Outfit-Medium',
    color: '#64748b',
    marginTop: 2,
  },
  panditVideosScroll: {
    paddingHorizontal: 20,
    gap: 14,
  },
  panditVideoCard: {
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
  panditVideoThumbnail: {
    ...StyleSheet.absoluteFillObject,
  },
  panditDurationBadge: {
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
  panditDurationIcon: {
    marginTop: 0.5,
  },
  panditDurationText: {
    color: '#ffffff',
    fontSize: 9,
    fontFamily: 'Outfit-Bold',
  },
  panditPlayIconContainer: {
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
  panditPlayIcon: {
    marginLeft: 2, // Compensate visual off-center of play arrow
  },
  panditVideoTextContent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    zIndex: 12,
  },
  panditTempleText: {
    color: '#cbd5e1',
    fontSize: 10.5,
    fontFamily: 'Outfit-Medium',
    marginBottom: 2,
  },
  panditNameText: {
    color: '#ffffff',
    fontSize: 13,
    fontFamily: 'Outfit-Bold',
    lineHeight: 16,
    marginBottom: 2,
  },
  panditRitualText: {
    color: '#fdba74', // Saffron overlay
    fontSize: 10.5,
    fontFamily: 'Outfit-Bold',
    lineHeight: 13,
  },
  twoRowScrollContent: {
    paddingHorizontal: 4,
    paddingVertical: 10,
  },
  twoRowWrapper: {
    flexDirection: 'column',
  },
  horizontalRow: {
    flexDirection: 'row',
    gap: 16,
  },
  productCard: {
    width: 110,
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
  addButton: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 22,
    height: 22,
    borderRadius: 11, // Perfectly rounded circular button
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
  productRatingBadge: {
    backgroundColor: '#fff7ed', // Soft warm amber background
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
    borderWidth: 0.5,
    borderColor: '#ffedd5',
  },
  productRatingText: {
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
    color: '#c2410c', // Elegant deep orange-700 for sacred temple name
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
  problemPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  problemPillActive: {
    backgroundColor: '#ea580c',
    borderColor: '#ea580c',
  },
  problemPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  problemPillTextActive: {
    color: '#ffffff',
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
});

