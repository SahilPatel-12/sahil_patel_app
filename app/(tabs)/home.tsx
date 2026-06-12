import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Platform,
  Modal,
  Share,
  Alert
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Colors } from '../../constants/Colors';
import { router } from 'expo-router';
import { useCart } from '../../context/CartContext';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../services/supabase';
import { useVideoPlayer, VideoView } from 'expo-video';
import { useFocusEffect } from '@react-navigation/native';


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
    image: require('../../assets/home_icon/Welth&Money.png'),
    color: '#a16207',
    gradientColors: ['#fef9c3', '#fef08a'],
  },
  {
    id: '3',
    title: 'JOB &\nCAREER',
    image: require('../../assets/home_icon/Job&career.png'),
    color: '#1d4ed8',
    gradientColors: ['#dbeafe', '#bfdbfe'],
  },
  {
    id: '4',
    title: 'MARRIAGE\n& LOVE',
    image: require('../../assets/home_icon/Marriage&Love.png'),
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

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { cart, handleAddToCart, handleIncrement, handleDecrement } = useCart();
  const { t } = useLanguage();

  const [heroData, setHeroData] = React.useState<any>(null);
  const [isHeroLoading, setIsHeroLoading] = React.useState(true);
  const [oneRupeeItems, setOneRupeeItems] = React.useState<any[]>([]);
  const [isOneRupeeLoading, setIsOneRupeeLoading] = React.useState(true);
  const [problemsList, setProblemsList] = React.useState<any[]>([]);
  const [homepageCategories, setHomepageCategories] = React.useState<any[]>([]);
  const [videoReviews, setVideoReviews] = React.useState<any[]>([]);
  const [activeReview, setActiveReview] = React.useState<any>(null);
  const [dbBanners, setDbBanners] = React.useState<any[]>([]);

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

  // Refresh dynamic data every time the screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      loadActiveHero();
      loadOneRupeePoojas();
      loadLifeProblems();
      loadHomepageCategories();
      loadVideoReviews();
      loadBanners();
    }, [
      loadActiveHero,
      loadOneRupeePoojas,
      loadLifeProblems,
      loadHomepageCategories,
      loadVideoReviews,
      loadBanners
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
        bounces={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Immersive Top Section */}
        <View style={styles.topSection}>
          {isHeroLoading ? (
            <View style={[styles.bannerBackground, { backgroundColor: '#0f172a', justifyContent: 'center', alignItems: 'center' }]}>
              <LinearGradient
                colors={['#1e293b', '#0f172a']}
                style={StyleSheet.absoluteFill}
              />
              <View style={{ width: 100, height: 14, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: 12 }} />
              <View style={{ width: 220, height: 24, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: 12 }} />
              <View style={{ width: 260, height: 12, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.08)', marginBottom: 6 }} />
              <View style={{ width: 180, height: 12, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.08)' }} />
            </View>
          ) : (
            <ImageBackground
              source={
                heroData?.background_image 
                  ? { uri: heroData.background_image } 
                  : require('../../assets/home/home_1.jpeg')
              }
              style={styles.bannerBackground}
            >
              <LinearGradient
                colors={['rgba(0, 0, 0, 0.55)', 'rgba(0, 0, 0, 0.15)', 'rgba(0, 0, 0, 1)']}
                style={StyleSheet.absoluteFill}
              />

              {/* Search Bar (Moved up slightly since header is gone) */}
              <View style={[styles.searchContainer, { paddingTop: Math.max(insets.top, 20) }]}>
                <View style={styles.searchBar}>
                  <Ionicons name="search" size={20} color="#fff" style={styles.searchIcon} />
                  <TextInput
                    placeholder={t("Search for Chadhava and Puja")}
                    placeholderTextColor="rgba(255,255,255,0.6)"
                    style={styles.searchInput}
                  />
                </View>
              </View>

              {/* Banner Content */}
              <View style={styles.bannerContent}>
                <Text style={styles.bannerDate}>
                  {heroData?.date_text ? t(heroData.date_text) : t('9 May 2026, Saturday')}
                </Text>
                <Text style={styles.bannerTitle}>
                  {heroData?.title ? t(heroData.title) : t('Saturday Kalashtami Special')}
                </Text>
                <Text style={styles.bannerSubtitle}>
                  {heroData?.subtitle 
                    ? t(heroData.subtitle) 
                    : t('For liberation from the sins of past births & for attaining family happiness & peace')}
                </Text>

                {heroData?.button_text && (
                  <TouchableOpacity
                    style={styles.bannerCTAButton}
                    activeOpacity={0.8}
                    onPress={() => {
                      if (heroData.button_link) {
                        router.push(heroData.button_link as any);
                      }
                    }}
                  >
                    <Text style={styles.bannerCTAButtonText}>{t(heroData.button_text)}</Text>
                    <Ionicons name="arrow-forward" size={14} color="#ffffff" style={{ marginLeft: 4 }} />
                  </TouchableOpacity>
                )}
              </View>
            </ImageBackground>
          )}
        </View>

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
                    router.push({ pathname: '/(tabs)/astro', params: { tab: 'kundli' } });
                  } else if (item.title === 'Panchang') {
                    router.push({ pathname: '/(tabs)/astro', params: { tab: 'panchang' } });
                  } else if (item.title === 'Rashi') {
                    router.push({ pathname: '/(tabs)/astro', params: { tab: 'rashi' } });
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
      {activeReview && (
        <ReviewVideoModal 
          url={activeReview.video_url} 
          devoteeName={activeReview.devotee_name} 
          pujaName={activeReview.puja_name} 
          onClose={() => setActiveReview(null)} 
        />
      )}
      <DraggableCalendarButton />
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
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
    marginTop: -20,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 20,
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
});
