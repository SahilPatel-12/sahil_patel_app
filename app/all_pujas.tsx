import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../services/supabase';

const { width } = Dimensions.get('window');
// Mathematically calculate precise 3-column layout subtracting sub-pixel safety margins
const CARD_WIDTH = Math.floor((width - 32 - 20) / 3) - 1.5;

const PUJAS_DATA = [
  {
    id: '1',
    title: 'Ganesh Puja',
    image: require('../assets/God/god.png'),
    rating: '4.8',
    reviews: '120',
    time: '45-60 mins',
    price: '₹501',
    originalPrice: '₹1,501',
    description: 'by Siddhi Vinayak Mandir',
    category: 'Auspicious',
    provider: 'Siddhi Vinayak Mandir'
  },
  {
    id: '2',
    title: 'Laxmi Puja',
    image: require('../assets/God/Jai Mahalakshmi🩷🌷🙏.jpeg'),
    rating: '4.9',
    reviews: '280',
    time: '60-90 mins',
    price: '₹1,100',
    originalPrice: '₹3,100',
    description: 'by Mahalakshmi Priests',
    category: 'Wealth',
    provider: 'Mahalakshmi Priests'
  },
  {
    id: '3',
    title: 'Shiv Puja',
    image: require('../assets/God/Omkarashwar.png'),
    rating: '4.7',
    reviews: '190',
    time: '30-45 mins',
    price: '₹351',
    originalPrice: '₹999',
    description: 'by Omkareshwar Dham',
    category: 'Mahadev',
    provider: 'Omkareshwar Dham'
  },
  {
    id: '4',
    title: 'Hanuman Puja',
    image: require('../assets/God/Mahakal Ujjain.png'),
    rating: '4.9',
    reviews: '230',
    time: '45 mins',
    price: '₹251',
    originalPrice: '₹799',
    description: 'by Bajrang Dham',
    category: 'Protection',
    provider: 'Bajrang Dham'
  },
  {
    id: '5',
    title: 'Kedarnath Puja',
    image: require('../assets/God/Kedarnath.png'),
    rating: '4.8',
    reviews: '310',
    time: '45 mins',
    price: '₹351',
    originalPrice: '₹999',
    description: 'by Kedarnath Dham Priests',
    category: 'Mahadev',
    provider: 'Kedarnath Dham'
  },
  {
    id: '6',
    title: 'Tirupati Puja',
    image: require('../assets/God/Lord Venkateswara Images Full Hd Wallpaper 1.png'),
    rating: '5.0',
    reviews: '420',
    time: '120 mins',
    price: '₹2,100',
    originalPrice: '₹5,100',
    description: 'by Tirumala Devasthanam',
    category: 'Wealth',
    provider: 'Tirumala Devasthanam'
  },
  {
    id: '7',
    title: 'Shanti Path',
    image: require('../assets/God/god1.png'),
    rating: '4.9',
    reviews: '150',
    time: '30 mins',
    price: '₹151',
    originalPrice: '₹499',
    description: 'by Haridwar Acharyas',
    category: 'Peace',
    provider: 'Haridwar Acharyas'
  },
  {
    id: '8',
    title: 'Navgrah Homa',
    image: require('../assets/God/_ (5).jpeg'),
    rating: '4.7',
    reviews: '175',
    time: '90 mins',
    price: '₹1,500',
    originalPrice: '₹4,500',
    description: 'by Kashi Vedic Pandits',
    category: 'Protection',
    provider: 'Kashi Vedic Pandits'
  }
];

export default function AllPujasScreen() {
  const { t } = useLanguage();
  const { cart, handleAddToCart, handleIncrement, handleDecrement, totalCartCount } = useCart();
  const [selectedCategory, setSelectedCategory] = React.useState('All');
  const [generalPujas, setGeneralPujas] = React.useState<any[]>([]);
  const [viewAllSettings, setViewAllSettings] = React.useState({
    banner_image: 'https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/banner/ChatGPT Image May 26, 2026, 12_19_59 PM.png',
    title: 'pujas',
    heading: 'ALL',
    subheading: 'Pure Vedic Seva + Divine Blessings'
  });

  React.useEffect(() => {
    async function loadGeneralPoojas() {
      try {
        const { data, error } = await supabase
          .from('website_pooja_products')
          .select('*')
          .eq('is_published', true)
          .order('created_at', { ascending: false });
        if (error) throw error;
        if (data) {
          const formatted = data.map(p => ({
            id: p.id,
            title: p.name,
            originalPrice: p.original_price ? '₹' + p.original_price : '',
            price: p.price ? '₹' + p.price : '',
            rating: p.rating ? String(p.rating) : '5.0',
            reviews: p.reviews_count ? String(p.reviews_count) : '0',
            provider: p.temple_association || 'Vedic Shrine',
            category: p.category || 'All',
            image: p.image || 'https://pub-3027d8d3defe4496978413d3c630aa44.r2.dev/god.png',
          }));
          setGeneralPujas(formatted);
        }
      } catch (err) {
        console.error('[All Pujas Grid] Error loading dynamic general poojas:', err);
      }
    }

    async function loadSettings() {
      try {
        const { data, error } = await supabase
          .from('website_settings')
          .select('value')
          .eq('key', 'view_all_settings')
          .maybeSingle();
        if (error) throw error;
        if (data && data.value) {
          setViewAllSettings(data.value);
        }
      } catch (err) {
        console.error('[All Pujas Grid] Error loading view_all_settings:', err);
      }
    }

    loadGeneralPoojas();
    loadSettings();

    // Live sync automatic reloading via Supabase Realtime channel
    const productsSubscription = supabase
      .channel('all_general_poojas_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'website_pooja_products' }, (payload) => {
        console.log('[All Pujas Grid] Realtime event caught, auto-reloading general grid...', payload);
        loadGeneralPoojas();
      })
      .subscribe();

    // Live sync for website_settings changes
    const settingsSubscription = supabase
      .channel('website_settings_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'website_settings' }, (payload) => {
        console.log('[All Pujas Grid] Realtime settings event caught:', payload);
        const newRecord = payload.new as any;
        if (newRecord && newRecord.key === 'view_all_settings' && newRecord.value) {
          setViewAllSettings(newRecord.value);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(productsSubscription);
      supabase.removeChannel(settingsSubscription);
    };
  }, []);

  const activeGeneralPujas = generalPujas.length > 0 ? generalPujas : PUJAS_DATA.map(p => ({
    ...p,
    price: p.price,
    reviews: p.reviews,
    image: p.image,
  }));

  const dynamicCategories = React.useMemo(() => {
    const list = new Set<string>();
    list.add('All');
    activeGeneralPujas.forEach(p => {
      if (p.category) {
        list.add(p.category);
      }
    });
    return Array.from(list);
  }, [activeGeneralPujas]);

  const filteredItems = selectedCategory === 'All'
    ? activeGeneralPujas
    : activeGeneralPujas.filter(item => item.category === selectedCategory);

  const renderProductCard = (item: typeof PUJAS_DATA[0]) => {
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
        {/* Image Container with Floating '+' Button */}
        <View style={styles.productImageContainer}>
          <Image
            source={item.image}
            style={styles.productImage}
            contentFit="cover"
          />
          {/* Floating Add Button / Quantity Toggle */}
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

        {/* Price Row: strike original, yellow badge for current price */}
        <View style={styles.priceRow}>
          <Text style={styles.originalPrice}>{item.originalPrice}</Text>
          <View style={styles.priceBadge}>
            <Text style={styles.priceBadgeText}>{item.price}</Text>
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
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="light-content" />

      {/* Top Banner Header Section — Full-width custom banner image */}
      <View style={styles.headerContainer}>
        {/* Full-width Banner Image */}
        <Image
          source={
            viewAllSettings.banner_image && viewAllSettings.banner_image.startsWith('http')
              ? { uri: viewAllSettings.banner_image }
              : require('../assets/banner/ChatGPT Image May 26, 2026, 12_19_59 PM.png')
          }
          style={styles.bannerImage}
          contentFit="cover"
        />

        {/* Action Buttons overlaid on top of the banner image */}
        <SafeAreaView style={styles.bannerOverlay}>
          <View style={styles.headerActionRow}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.circleButton}
              activeOpacity={0.8}
            >
              <Ionicons name="arrow-back" size={20} color="#000000" />
            </TouchableOpacity>

            {/* Spacer */}
            <View />

            <View style={styles.headerRightActions}>
              <TouchableOpacity style={styles.circleButton} activeOpacity={0.8}>
                <Ionicons name="search" size={18} color="#000000" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.circleButton} activeOpacity={0.8}>
                <Ionicons name="share-social" size={18} color="#000000" />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.circleButton} 
                activeOpacity={0.8}
                onPress={() => router.push('/cart')}
              >
                <Ionicons name="cart-outline" size={18} color="#000000" />
                {totalCartCount > 0 && (
                  <View style={styles.cartBadge}>
                    <Text style={styles.cartBadgeText}>{totalCartCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* Product Content Scroll */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Title Header matching the home page style */}
        <View style={styles.sectionHeader}>
          <View style={styles.storeLogoContainer}>
            <View style={styles.storeLogoBadge}>
              <Text style={styles.storeLogoText}>{viewAllSettings.heading || 'ALL'}</Text>
            </View>
            <Text style={styles.storeLogoTitle}>{t(viewAllSettings.title || 'pujas')}</Text>
          </View>
          <View style={styles.storeSubHeader}>
            <Ionicons name="checkmark-circle" size={13} color="#ea580c" style={styles.checkmarkIcon} />
            <Text style={styles.storeSubHeaderText}>
              {viewAllSettings.subheading ? (
                viewAllSettings.subheading.includes('+') ? (
                  <>
                    {t(viewAllSettings.subheading.split('+')[0])}
                    <Text style={styles.storeSubHeaderTextOrange}>
                      {'+' + t(viewAllSettings.subheading.split('+')[1])}
                    </Text>
                  </>
                ) : (
                  t(viewAllSettings.subheading)
                )
              ) : (
                <>
                  {t('Pure Vedic Seva ')}
                  <Text style={styles.storeSubHeaderTextOrange}>{t('+ Divine Blessings')}</Text>
                </>
              )}
            </Text>
          </View>
        </View>

        {/* Categories Filter */}
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
          style={styles.categoryContainer}
        >
          {dynamicCategories.map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryPill, selectedCategory === cat && styles.categoryPillActive]}
              onPress={() => setSelectedCategory(cat)}
              activeOpacity={0.8}
            >
              <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>
                {t(cat)}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {filteredItems.length === 0 ? (
          <View style={{ padding: 20, alignItems: 'center' }}><Text>No Pujas found.</Text></View>
        ) : (
          <View style={styles.gridContainer}>
            {filteredItems.map((item) => renderProductCard(item))}
          </View>
        )}
      </ScrollView>

      {/* Floating Free Delivery Footer */}
      <View style={styles.footerContainer}>
        <View style={styles.footerInner}>
          <Text style={styles.footerText}>
            <Text style={styles.footerTextBold}>{t('FREE DELIVERY')}</Text>{t(' on orders above ')}<Text style={styles.footerTextBold}>₹149</Text>
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  headerContainer: {
    width: '100%',
    height: 240,
    position: 'relative',
    overflow: 'hidden',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  bannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  headerActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  circleButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 90,
  },
  categoryContainer: {
    marginBottom: 16,
  },
  categoryScroll: {
    paddingHorizontal: 20,
    gap: 10,
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  categoryPillActive: {
    backgroundColor: '#ea580c',
    borderColor: '#ea580c',
  },
  categoryText: {
    fontSize: 13,
    fontFamily: 'Outfit-Medium',
    color: '#475569',
  },
  categoryTextActive: {
    color: '#ffffff',
    fontFamily: 'Outfit-Bold',
  },
  sectionHeader: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  storeLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  storeLogoBadge: {
    backgroundColor: '#ea580c',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeLogoText: {
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
    color: '#ffffff',
  },
  storeLogoTitle: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
    color: '#000000',
    textTransform: 'lowercase',
  },
  storeSubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  checkmarkIcon: {
    marginRight: 4,
  },
  storeSubHeaderText: {
    fontSize: 12,
    fontFamily: 'Outfit-Medium',
    color: '#475569',
  },
  storeSubHeaderTextOrange: {
    color: '#ea580c',
    fontFamily: 'Outfit-Bold',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 16,
    paddingTop: 16,
    justifyContent: 'flex-start',
    gap: 10,
  },
  productCard: {
    width: CARD_WIDTH,
    marginBottom: 16,
  },
  productImageContainer: {
    width: CARD_WIDTH,
    height: CARD_WIDTH,
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
    color: '#c2410c', // Elegant deep orange-700 for sacred temple name
  },
  footerContainer: {
    position: 'absolute',
    bottom: 24, // Center-floats 24px above the bottom of the screen
    left: 20, // 20px margins on the sides
    right: 20,
    backgroundColor: '#f0fdfa', // Extremely soft pastel cyan/teal background
    borderWidth: 1,
    borderColor: '#ccfbf1', // Light cyan border
    borderRadius: 30, // Fully rounded pill shape
    shadowColor: '#0f766e',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  footerInner: {
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 11,
    fontFamily: 'Outfit-Medium',
    color: '#0f766e', // Deep rich teal text
    letterSpacing: 0.2,
  },
  footerTextBold: {
    fontFamily: 'Outfit-Bold',
    color: '#0d9488', // Highlighted teal bold text
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444', // Red badge
    borderRadius: 8,
    width: 15,
    height: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  cartBadgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontFamily: 'Outfit-Bold',
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
});
