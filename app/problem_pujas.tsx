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
import { router, useLocalSearchParams } from 'expo-router';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../services/supabase';

const { width } = Dimensions.get('window');
const CARD_WIDTH = Math.floor((width - 32 - 20) / 3) - 1.5;

const FALLBACK_PUJAS = [
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

const PROBLEM_CATEGORIES = ['Health', 'Wealth', 'Job & Career', 'Marriage & Love', 'Grah Dosh'];

export default function ProblemPujasScreen() {
  const { t } = useLanguage();
  const { cart, handleAddToCart, handleIncrement, handleDecrement, totalCartCount } = useCart();
  const params = useLocalSearchParams();

  // Resolve initial selected category from route params
  const getInitialCategory = () => {
    if (!params.category) return 'Health';
    const normalized = String(params.category).toLowerCase();
    if (normalized.includes('health')) return 'Health';
    if (normalized.includes('wealth') || normalized.includes('money')) return 'Wealth';
    if (normalized.includes('job') || normalized.includes('career')) return 'Job & Career';
    if (normalized.includes('marriage') || normalized.includes('love')) return 'Marriage & Love';
    if (normalized.includes('grah') || normalized.includes('dosh') || normalized.includes('shanti')) return 'Grah Dosh';
    return 'Health';
  };

  const [selectedCategory, setSelectedCategory] = React.useState(getInitialCategory());
  const [problemCategories, setProblemCategories] = React.useState<string[]>([]);
  const [problemPoojas, setProblemPoojas] = React.useState<any[]>([]);

  // Helper function to normalize DB categories to app select categories
  const normalizeCategoryName = (title: string): string => {
    const norm = title.toLowerCase();
    if (norm.includes('health')) return 'Health';
    if (norm.includes('wealth') || norm.includes('money')) return 'Wealth';
    if (norm.includes('job') || norm.includes('career')) return 'Job & Career';
    if (norm.includes('marriage') || norm.includes('love')) return 'Marriage & Love';
    if (norm.includes('grah') || norm.includes('dosh') || norm.includes('shanti')) return 'Grah Dosh';
    return title;
  };

  React.useEffect(() => {
    async function loadProblemCategories() {
      try {
        const { data, error } = await supabase
          .from('life_problems')
          .select('*')
          .order('sort_order', { ascending: true, nullsFirst: false })
          .order('created_at', { ascending: false });
        if (error) throw error;
        if (data && data.length > 0) {
          const mapped = data.map(p => normalizeCategoryName(p.title));
          const unique = Array.from(new Set(mapped));
          setProblemCategories(unique);
        }
      } catch (err) {
        console.error('[Problem Pujas] Error loading life problems categories:', err);
      }
    }

    async function loadProblemPoojas() {
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
            price: p.offer_price,
            rating: p.rating,
            reviews: p.reviews,
            provider: p.provider,
            problem_category: p.problem_category,
            image: p.image_url,
          }));
          setProblemPoojas(formatted);
        }
      } catch (err) {
        console.error('[Problem Pujas] Error loading problem poojas:', err);
      }
    }

    loadProblemCategories();
    loadProblemPoojas();

    // Subscribe to realtime updates
    const poojasSubscription = supabase
      .channel('store_problem_poojas_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'problem_poojas' }, (payload) => {
        console.log('[Problem Pujas] Realtime problem_poojas update caught!', payload);
        loadProblemPoojas();
      })
      .subscribe();

    const categoriesSubscription = supabase
      .channel('store_life_problems_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'life_problems' }, (payload) => {
        console.log('[Problem Pujas] Realtime life_problems update caught!', payload);
        loadProblemCategories();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(poojasSubscription);
      supabase.removeChannel(categoriesSubscription);
    };
  }, []);

  // Sync category param change if user clicks on different problem in home and page stays mounted
  React.useEffect(() => {
    if (params.category) {
      setSelectedCategory(getInitialCategory());
    }
  }, [params.category]);

  // Problem category filters mapping logic
  const filteredItems = React.useMemo(() => {
    if (problemPoojas.length > 0) {
      return problemPoojas.filter(p => p.problem_category.toLowerCase() === selectedCategory.toLowerCase());
    }

    const normalized = selectedCategory.toLowerCase();
    
    if (normalized.includes('health')) {
      return FALLBACK_PUJAS.filter(p => 
        p.title.toLowerCase().includes('shiv') || 
        p.title.toLowerCase().includes('shanti') || 
        p.title.toLowerCase().includes('hanuman')
      );
    }
    if (normalized.includes('wealth')) {
      return FALLBACK_PUJAS.filter(p => 
        p.title.toLowerCase().includes('laxmi') || 
        p.title.toLowerCase().includes('tirupati') || 
        p.title.toLowerCase().includes('navgrah')
      );
    }
    if (normalized.includes('job') || normalized.includes('career')) {
      return FALLBACK_PUJAS.filter(p => 
        p.title.toLowerCase().includes('ganesh') || 
        p.title.toLowerCase().includes('kedarnath') || 
        p.title.toLowerCase().includes('navgrah')
      );
    }
    if (normalized.includes('marriage') || normalized.includes('love')) {
      return FALLBACK_PUJAS.filter(p => 
        p.title.toLowerCase().includes('ganesh') || 
        p.title.toLowerCase().includes('shanti') || 
        p.title.toLowerCase().includes('tirupati')
      );
    }
    if (normalized.includes('grah') || normalized.includes('dosh')) {
      return FALLBACK_PUJAS.filter(p => 
        p.title.toLowerCase().includes('navgrah') || 
        p.title.toLowerCase().includes('hanuman') || 
        p.title.toLowerCase().includes('kedarnath')
      );
    }
    return FALLBACK_PUJAS;
  }, [selectedCategory, problemPoojas]);

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

        {/* Price Row: strike original, yellow badge */}
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
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" />
      
      {/* Dynamic Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.iconCircle}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={20} color="#0f172a" />
        </TouchableOpacity>
        
        <View style={styles.headerTitleContainer}>
          <View style={styles.badgeRow}>
            <View style={styles.vegBox}>
              <View style={styles.vegDot} />
            </View>
            <Text style={styles.headerTag}>{t('PROBLEMS SOLUTION')}</Text>
          </View>
          <Text style={styles.headerTitle}>{t('problemPujas')}</Text>
        </View>

        <TouchableOpacity 
          style={styles.iconCircle}
          onPress={() => router.push('/cart')}
        >
          <Ionicons name="cart-outline" size={20} color="#0f172a" />
          {totalCartCount > 0 && (
            <View style={styles.badgeCount}>
              <Text style={styles.badgeCountText}>{totalCartCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Horizontal Scroll Category Selector */}
      <View style={styles.categoryContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryScroll}
        >
          {(problemCategories.length > 0 ? problemCategories : PROBLEM_CATEGORIES).map((cat) => (
            <TouchableOpacity
              key={cat}
              style={[styles.categoryPill, selectedCategory === cat && styles.categoryPillActive]}
              onPress={() => setSelectedCategory(cat)}
              activeOpacity={0.8}
            >
              <Text style={[styles.categoryText, selectedCategory === cat && styles.categoryTextActive]}>
                {t(cat + ' Puja')}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Grid Content */}
      <ScrollView 
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.gridScroll}
      >
        {filteredItems.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={48} color="#94a3b8" />
            <Text style={styles.emptyText}>{t('No pujas available in this category.')}</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredItems.map(item => renderProductCard(item))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badgeCount: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  badgeCountText: {
    color: '#ffffff',
    fontSize: 8.5,
    fontWeight: 'bold',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 2,
  },
  vegBox: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: '#ea580c',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 1.5,
  },
  vegDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ea580c',
  },
  headerTag: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#ea580c',
    letterSpacing: 0.5,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  categoryContainer: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    paddingVertical: 10,
  },
  categoryScroll: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  categoryPillActive: {
    backgroundColor: '#ea580c',
    borderColor: '#ea580c',
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  categoryTextActive: {
    color: '#ffffff',
  },
  gridScroll: {
    padding: 12,
    paddingBottom: 40,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  productCard: {
    width: CARD_WIDTH,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    padding: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  productImageContainer: {
    width: '100%',
    height: 90,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#f1f5f9',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  addButton: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#ea580c',
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  quantityToggleContainer: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    backgroundColor: '#ea580c',
    borderRadius: 12,
    paddingVertical: 2,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 2,
  },
  miniQtyBtn: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyToggleText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold',
    minWidth: 10,
    textAlign: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    gap: 4,
    marginTop: 6,
    minHeight: 28,
  },
  tilakBox: {
    width: 9,
    height: 11,
    borderWidth: 1,
    borderColor: '#f97316',
    borderTopWidth: 0,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    flexShrink: 0,
  },
  tilakDotInner: {
    width: 3,
    height: 5,
    borderRadius: 1.5,
    backgroundColor: '#dc2626',
    marginTop: -2,
  },
  itemTitle: {
    fontSize: 10.5,
    fontWeight: 'bold',
    color: '#0f172a',
    flex: 1,
    lineHeight: 13,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
  },
  originalPrice: {
    fontSize: 9.5,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  priceBadge: {
    backgroundColor: '#ffd60a',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 2,
    borderWidth: 0.75,
    borderColor: '#000000',
    shadowColor: '#000000',
    shadowOffset: { width: 1, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 0,
  },
  priceBadgeText: {
    fontSize: 9,
    fontWeight: '900',
    color: '#000000',
  },
  ratingBadge: {
    backgroundColor: '#fff7ed',
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#ffedd5',
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  ratingText: {
    fontSize: 8,
    color: '#ea580c',
    fontWeight: 'bold',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 6,
  },
  providerText: {
    fontSize: 8.5,
    color: '#c2410c',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 8,
  }
});
