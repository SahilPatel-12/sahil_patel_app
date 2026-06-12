import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../services/supabase';
import { safeStorage } from '../services/storage';

const { width } = Dimensions.get('window');

interface CartItem {
  id: string;
  title: string;
  subtitle: string;
  originalPrice: number;
  offerPrice: number;
  quantity: number;
  image: any;
  showCounter: boolean;
  isDeliverable: boolean;
}

const ALL_PRODUCT_METADATA: Record<string, {
  title: string;
  subtitle: string;
  originalPrice: number;
  offerPrice: number;
  image: any;
  isDeliverable: boolean;
}> = {
  // Puja items
  '1': {
    title: 'Ganesh Puja Special',
    subtitle: 'Siddhi Vinayak Mandir',
    originalPrice: 501,
    offerPrice: 1,
    image: require('../assets/God/god.png'),
    isDeliverable: false,
  },
  '2': {
    title: 'Laxmi Puja Special',
    subtitle: 'Mahalakshmi Priests',
    originalPrice: 1100,
    offerPrice: 1,
    image: require('../assets/God/Jai Mahalakshmi🩷🌷🙏.jpeg'),
    isDeliverable: false,
  },
  '3': {
    title: 'Shiv Puja Special',
    subtitle: 'Omkareshwar Dham',
    originalPrice: 351,
    offerPrice: 1,
    image: require('../assets/God/Omkarashwar.png'),
    isDeliverable: false,
  },
  '4': {
    title: 'Hanuman Puja Special',
    subtitle: 'Bajrang Dham',
    originalPrice: 251,
    offerPrice: 1,
    image: require('../assets/God/Mahakal Ujjain.png'),
    isDeliverable: false,
  },
  '5': {
    title: 'Kedarnath Puja Special',
    subtitle: 'Kedarnath Dham',
    originalPrice: 351,
    offerPrice: 1,
    image: require('../assets/God/Kedarnath.png'),
    isDeliverable: false,
  },
  '6': {
    title: 'Tirupati Puja Special',
    subtitle: 'Tirumala Devasthanam',
    originalPrice: 2100,
    offerPrice: 1,
    image: require('../assets/God/Lord Venkateswara Images Full Hd Wallpaper 1.png'),
    isDeliverable: false,
  },
  '7': {
    title: 'Shanti Path Special',
    subtitle: 'Haridwar Acharyas',
    originalPrice: 151,
    offerPrice: 1,
    image: require('../assets/God/god1.png'),
    isDeliverable: false,
  },
  '8': {
    title: 'Navgrah Homa Special',
    subtitle: 'Kashi Vedic Pandits',
    originalPrice: 1500,
    offerPrice: 1,
    image: require('../assets/God/_ (5).jpeg'),
    isDeliverable: false,
  },
  // Shop items
  'p4': {
    title: 'Premium Puja Kit',
    subtitle: 'Mantra Seva Bhandar',
    originalPrice: 1200,
    offerPrice: 599,
    image: require('../assets/shop/Untitled design (37) 1.png'),
    isDeliverable: true,
  },
  'p5': {
    title: 'Panchdhatu Ganesh Idol',
    subtitle: 'Divine Murti Kala',
    originalPrice: 899,
    offerPrice: 399,
    image: require('../assets/shop/Untitled design (37) 7.png'),
    isDeliverable: true,
  },
  'p6': {
    title: 'Sandalwood Paste (50g)',
    subtitle: 'Mysore Sandalwood Co.',
    originalPrice: 250,
    offerPrice: 120,
    image: require('../assets/God/god.png'),
    isDeliverable: true,
  },
  'p7': {
    title: 'Bhagavad Gita Pocket',
    subtitle: 'Gita Press Gorakhpur',
    originalPrice: 199,
    offerPrice: 99,
    image: require('../assets/shop/Untitled design (37) 9.png'),
    isDeliverable: true,
  },
  'p8': {
    title: 'Organic Incense Sticks',
    subtitle: 'Vedic Aroma Temple',
    originalPrice: 180,
    offerPrice: 89,
    image: require('../assets/shop/Untitled design (37) 10.png'),
    isDeliverable: true,
  },
  // Recommended additions & Addons
  'rec_1': {
    title: 'Panch Mewa Prasad Box',
    subtitle: '500 g',
    originalPrice: 325,
    offerPrice: 279,
    image: require('../assets/God/Kedarnath.png'),
    isDeliverable: true,
  },
  'rec_2': {
    title: 'Sandalwood Chandan Paste',
    subtitle: '60 ml',
    originalPrice: 35,
    offerPrice: 32,
    image: require('../assets/God/Lord Venkateswara Images Full Hd Wallpaper 1.png'),
    isDeliverable: true,
  },
  'rec_3': {
    title: 'Sacred Rudraksha Mala',
    subtitle: '108 Beads',
    originalPrice: 26,
    offerPrice: 21,
    image: require('../assets/God/Mahakal Ujjain.png'),
    isDeliverable: true,
  },
  'add_1': {
    title: 'Aromatic Kapur Tablets',
    subtitle: '100g Box',
    originalPrice: 249,
    offerPrice: 224,
    image: require('../assets/God/god1.png'),
    isDeliverable: true,
  },
};

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const { cart, dbMetadata, handleAddToCart, handleIncrement, handleDecrement, clearCart, user, refreshSession } = useCart();

  // Pandit Tip Dakshina
  const [panditTip, setPanditTip] = useState<number | null>(51);
  const [customTip, setCustomTip] = useState<string>('');

  // Form Inputs: Pujas
  const [devoteeName, setDevoteeName] = useState('');
  const [gotra, setGotra] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [specialWish, setSpecialWish] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [preferredTime, setPreferredTime] = useState('');

  // Form Inputs: Products
  const [shippingFullName, setShippingFullName] = useState('');
  const [shippingPhone, setShippingPhone] = useState('');
  const [shippingAddressLine1, setShippingAddressLine1] = useState('');
  const [shippingAddressLine2, setShippingAddressLine2] = useState('');
  const [shippingCity, setShippingCity] = useState('');
  const [shippingState, setShippingState] = useState('');
  const [shippingPincode, setShippingPincode] = useState('');
  const [shippingLandmark, setShippingLandmark] = useState('');

  useEffect(() => {
    refreshSession();
  }, []);

  // Redirect to login if guest
  useEffect(() => {
    const checkUser = async () => {
      const session = await safeStorage.getItem('user_session');
      if (!session) {
        router.replace({ pathname: '/login', params: { redirectTo: '/cart' } });
      }
    };
    checkUser();
  }, [user]);

  // Sync user info to fields if user session exists
  useEffect(() => {
    if (user) {
      if (!devoteeName) setDevoteeName(user.name || '');
      if (!contactPhone) setContactPhone(user.phone || '');
      if (!shippingFullName) setShippingFullName(user.name || '');
      if (!shippingPhone) setShippingPhone(user.phone || '');
    }
  }, [user]);

  // Derive cart items dynamically from context
  const cartItems: CartItem[] = Object.keys(cart).map((id) => {
    const meta = ALL_PRODUCT_METADATA[id];
    if (meta) {
      return {
        id,
        title: meta.title,
        subtitle: meta.subtitle,
        originalPrice: meta.originalPrice,
        offerPrice: meta.offerPrice,
        quantity: cart[id],
        image: meta.image,
        showCounter: true,
        isDeliverable: meta.isDeliverable,
      };
    }

    const dbMeta = dbMetadata[id];
    if (dbMeta) {
      return {
        id,
        title: dbMeta.title,
        subtitle: dbMeta.subtitle,
        originalPrice: dbMeta.originalPrice,
        offerPrice: dbMeta.offerPrice,
        quantity: cart[id],
        image: dbMeta.image,
        showCounter: true,
        isDeliverable: dbMeta.isDeliverable,
      };
    }

    return {
      id,
      title: t('Divine Offering') + ` (${id.substring(0, 8)})`,
      subtitle: t('Vedic Prasad & Sankalp'),
      originalPrice: 501,
      offerPrice: 1,
      quantity: cart[id],
      image: require('../assets/God/god.png'),
      showCounter: true,
      isDeliverable: false,
    };
  });

  const recommendedAddons = [
    { id: 'rec_1', ...ALL_PRODUCT_METADATA.rec_1 },
    { id: 'rec_2', ...ALL_PRODUCT_METADATA.rec_2 },
    { id: 'rec_3', ...ALL_PRODUCT_METADATA.rec_3 },
    { id: 'add_1', ...ALL_PRODUCT_METADATA.add_1 },
  ].filter(item => !cart[item.id]);

  const itemTotalOriginal = cartItems.reduce((sum, item) => sum + (item.originalPrice * item.quantity), 0);
  const itemTotalOffer = cartItems.reduce((sum, item) => sum + (item.offerPrice * item.quantity), 0);
  const discountAmount = itemTotalOriginal - itemTotalOffer;
  
  const selectedTip = panditTip === null ? (parseInt(customTip) || 0) : panditTip;
  const totalPayable = itemTotalOffer + selectedTip;

  const hasPujaItems = cartItems.some(item => !item.isDeliverable);
  const hasDeliverableItems = cartItems.some(item => item.isDeliverable);

  const handleCheckout = async () => {
    if (cartItems.length === 0) {
      Alert.alert(t('Empty Cart'), t('Please add some sacred offerings to your cart first.'));
      return;
    }

    if (!user) {
      Alert.alert(
        t('Login Required'),
        t('Please login to complete your checkout and register your sacred Sankalp.'),
        [
          { text: t('Cancel'), style: 'cancel' },
          {
            text: t('Login Now'),
            onPress: () => {
              router.push('/login');
            }
          }
        ]
      );
      return;
    }

    // Validate Puja details
    if (hasPujaItems) {
      if (!devoteeName.trim()) {
        Alert.alert(t('Name Required'), t('Please enter Devotee Name for the sacred Sankalp.'));
        return;
      }
      if (!contactPhone.trim() || contactPhone.length < 10) {
        Alert.alert(t('Invalid Phone'), t('Please enter a valid 10-digit contact number.'));
        return;
      }
      if (!preferredDate.trim()) {
        Alert.alert(t('Date Required'), t('Please enter a preferred Date for performing the Puja.'));
        return;
      }
      if (!preferredTime.trim()) {
        Alert.alert(t('Time Required'), t('Please enter a preferred Time slot for performing the Puja.'));
        return;
      }
    }

    // Validate Shipping details
    if (hasDeliverableItems) {
      if (!shippingFullName.trim()) {
        Alert.alert(t('Recipient Name Required'), t('Please enter recipient full name for physical shipping.'));
        return;
      }
      if (!shippingPhone.trim() || shippingPhone.length < 10) {
        Alert.alert(t('Shipping Phone Required'), t('Please enter a valid 10-digit phone number for delivery updates.'));
        return;
      }
      if (!shippingAddressLine1.trim()) {
        Alert.alert(t('Address Required'), t('Please enter Shipping Address Line 1.'));
        return;
      }
      if (!shippingCity.trim()) {
        Alert.alert(t('City Required'), t('Please enter Shipping City.'));
        return;
      }
      if (!shippingState.trim()) {
        Alert.alert(t('State Required'), t('Please enter Shipping State.'));
        return;
      }
      if (!shippingPincode.trim() || shippingPincode.length < 6) {
        Alert.alert(t('Pincode Required'), t('Please enter a valid 6-digit postal pincode.'));
        return;
      }
    }

    try {
      const orderType = hasPujaItems && hasDeliverableItems ? 'mixed' : (hasPujaItems ? 'puja' : 'product');
      
      // 1. Create order record
      const { data: newOrder, error: orderError } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          order_type: orderType,
          total_amount: totalPayable,
          payment_status: 'completed',
          order_status: 'Pending'
        })
        .select('id')
        .single();

      if (orderError) throw orderError;
      const orderId = newOrder.id;

      // 2. Insert order items
      const orderItemsToInsert = cartItems.map(item => ({
        order_id: orderId,
        item_type: item.isDeliverable ? 'product' : 'puja',
        item_id: item.id,
        quantity: item.quantity,
        price: item.offerPrice
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItemsToInsert);

      if (itemsError) throw itemsError;

      // 3. Insert Puja booking details
      if (hasPujaItems) {
        const { error: pujaError } = await supabase
          .from('puja_booking_details')
          .insert({
            order_id: orderId,
            devotee_name: devoteeName.trim(),
            gotra: gotra.trim() || null,
            special_notes: specialWish.trim() || null,
            preferred_date: preferredDate,
            preferred_time: preferredTime.trim()
          });

        if (pujaError) throw pujaError;
      }

      // 4. Insert Shipping address
      if (hasDeliverableItems) {
        const { error: shippingError } = await supabase
          .from('shipping_addresses')
          .insert({
            order_id: orderId,
            full_name: shippingFullName.trim(),
            phone: shippingPhone.trim(),
            address_line_1: shippingAddressLine1.trim(),
            address_line_2: shippingAddressLine2.trim() || null,
            city: shippingCity.trim(),
            state: shippingState.trim(),
            pincode: shippingPincode.trim(),
            landmark: shippingLandmark.trim() || null
          });

        if (shippingError) throw shippingError;
      }

      // 5. Clear cart in Supabase & local state
      await clearCart();

      Alert.alert(
        t('Order Placed Successfully!'),
        t('Jai Mata Di! Your booking and order details are registered. You can track perform status live in profile screen.'),
        [
          {
            text: t('Go to Orders'),
            onPress: () => {
              router.push({ pathname: '/settings_detail', params: { type: 'my_orders' } });
            }
          }
        ]
      );
    } catch (err) {
      console.error('Failed to create order transaction:', err);
      Alert.alert(t('Checkout Error'), t('We encountered a problem booking your order. Please try again.'));
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color="#0f172a" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>{t('Sacred Basket')}</Text>
            {cartItems.length > 0 && (
              <Text style={styles.headerSubtitle}>{cartItems.length} {t('Items selected')}</Text>
            )}
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
          >
            {cartItems.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Image
                  source={require('../assets/God/god.png')}
                  style={styles.emptyImage}
                  contentFit="contain"
                />
                <Text style={styles.emptyTitle}>{t('Your Basket is Empty')}</Text>
                <Text style={styles.emptySubtitle}>
                  {t('Explore our sacred Pujas and authentic divine offerings to start your spiritual journey.')}
                </Text>
                <TouchableOpacity
                  style={styles.exploreBtn}
                  onPress={() => router.replace('/(tabs)/home')}
                >
                  <Text style={styles.exploreBtnText}>{t('Explore Pujas')}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                {/* Cart Items List */}
                <View style={styles.cardContainer}>
                  <Text style={styles.sectionHeader}>{t('Selected Sacred Items')}</Text>
                  {cartItems.map((item) => (
                    <View key={item.id} style={styles.cartItemRow}>
                      <Image source={item.image} style={styles.itemImage} contentFit="cover" />
                      <View style={styles.itemDetails}>
                        <Text style={styles.itemTitle} numberOfLines={1}>{t(item.title)}</Text>
                        <Text style={styles.itemSubtitle}>{t(item.subtitle)}</Text>
                        <View style={styles.priceRow}>
                          <Text style={styles.itemOfferPrice}>₹{item.offerPrice * item.quantity}</Text>
                          {item.originalPrice > item.offerPrice && (
                            <Text style={styles.itemOriginalPrice}>₹{item.originalPrice * item.quantity}</Text>
                          )}
                        </View>
                      </View>

                      {/* Quantity Selector */}
                      <View style={styles.qtyContainer}>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => handleDecrement(item.id)}
                        >
                          <Ionicons name="remove" size={14} color="#ffffff" />
                        </TouchableOpacity>
                        <Text style={styles.qtyText}>{item.quantity}</Text>
                        <TouchableOpacity
                          style={styles.qtyBtn}
                          onPress={() => handleIncrement(item.id)}
                        >
                          <Ionicons name="add" size={14} color="#ffffff" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Pure Devotion Add-ons */}
                {recommendedAddons.length > 0 && (
                  <View style={styles.addonsContainer}>
                    <Text style={styles.sectionHeader}>{t('Recommended Add-ons')}</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.addonsScroll}
                    >
                      {recommendedAddons.map((item) => (
                        <View key={item.id} style={styles.addonCard}>
                          <Image source={item.image} style={styles.addonImage} contentFit="cover" />
                          <Text style={styles.addonTitle} numberOfLines={1}>{t(item.title)}</Text>
                          <Text style={styles.addonSubtitle}>{t(item.subtitle)}</Text>
                          <View style={styles.addonPriceRow}>
                            <Text style={styles.addonPrice}>₹{item.offerPrice}</Text>
                            <TouchableOpacity
                              style={styles.addonAddBtn}
                              onPress={() => handleAddToCart(item.id)}
                            >
                              <Text style={styles.addonAddText}>{t('ADD')}</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </ScrollView>
                  </View>
                )}

                {/* Devotee Sankalp Details Form (Rendered if Puja Items present) */}
                {hasPujaItems && (
                  <View style={styles.cardContainer}>
                    <View style={styles.sankalpHeaderRow}>
                      <View style={styles.tilakBox}>
                        <View style={styles.tilakDotInner} />
                      </View>
                      <Text style={styles.sectionHeader}>{t('Sacred Sankalp Details')}</Text>
                    </View>
                    <Text style={styles.formHint}>
                      {t('These details will be chanted by Panditji during the live online chanting session.')}
                    </Text>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>{t('Devotee Full Name')} *</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder={t('Enter full name')}
                        placeholderTextColor="#94a3b8"
                        value={devoteeName}
                        onChangeText={setDevoteeName}
                      />
                    </View>

                    <View style={styles.inputRow}>
                      <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                        <Text style={styles.inputLabel}>{t('Gotra (Optional)')}</Text>
                        <TextInput
                          style={styles.textInput}
                          placeholder={t('e.g., Kashyap')}
                          placeholderTextColor="#94a3b8"
                          value={gotra}
                          onChangeText={setGotra}
                        />
                      </View>
                      <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.inputLabel}>{t('Contact Phone')} *</Text>
                        <TextInput
                          style={styles.textInput}
                          placeholder={t('10-digit number')}
                          placeholderTextColor="#94a3b8"
                          keyboardType="phone-pad"
                          maxLength={10}
                          value={contactPhone}
                          onChangeText={setContactPhone}
                        />
                      </View>
                    </View>

                    <View style={styles.inputRow}>
                      <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                        <Text style={styles.inputLabel}>{t('Preferred Date')} (YYYY-MM-DD) *</Text>
                        <TextInput
                          style={styles.textInput}
                          placeholder={t('e.g. 2026-06-15')}
                          placeholderTextColor="#94a3b8"
                          value={preferredDate}
                          onChangeText={setPreferredDate}
                        />
                      </View>
                      <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.inputLabel}>{t('Preferred Time')} *</Text>
                        <TextInput
                          style={styles.textInput}
                          placeholder={t('e.g. 6:00 PM')}
                          placeholderTextColor="#94a3b8"
                          value={preferredTime}
                          onChangeText={setPreferredTime}
                        />
                      </View>
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>{t('Sankalp Wish / Special Request (Optional)')}</Text>
                      <TextInput
                        style={[styles.textInput, { height: 60, paddingTop: 10 }]}
                        placeholder={t('e.g., Family health, peace, success')}
                        placeholderTextColor="#94a3b8"
                        multiline
                        numberOfLines={3}
                        value={specialWish}
                        onChangeText={setSpecialWish}
                      />
                    </View>
                  </View>
                )}

                {/* Delivery Details (only shown if deliverable product items are inside cart) */}
                {hasDeliverableItems && (
                  <View style={styles.cardContainer}>
                    <View style={styles.sankalpHeaderRow}>
                      <Ionicons name="cube-outline" size={18} color="#ea580c" />
                      <Text style={styles.sectionHeader}>{t('Prasad Delivery Details')}</Text>
                    </View>
                    <Text style={styles.formHint}>
                      {t('Physical products and sacred Prasad boxes will be dispatched to this delivery coordinates.')}
                    </Text>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>{t('Recipient Full Name')} *</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder={t('Enter full name')}
                        placeholderTextColor="#94a3b8"
                        value={shippingFullName}
                        onChangeText={setShippingFullName}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>{t('Contact Phone Number')} *</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder={t('10-digit phone number')}
                        placeholderTextColor="#94a3b8"
                        keyboardType="phone-pad"
                        maxLength={10}
                        value={shippingPhone}
                        onChangeText={setShippingPhone}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>{t('Shipping Address Line 1')} *</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder={t('Flat/House no., building, street address')}
                        placeholderTextColor="#94a3b8"
                        value={shippingAddressLine1}
                        onChangeText={setShippingAddressLine1}
                      />
                    </View>

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>{t('Shipping Address Line 2 (Optional)')}</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder={t('Apartment, colony, area')}
                        placeholderTextColor="#94a3b8"
                        value={shippingAddressLine2}
                        onChangeText={setShippingAddressLine2}
                      />
                    </View>

                    <View style={styles.inputRow}>
                      <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                        <Text style={styles.inputLabel}>{t('City')} *</Text>
                        <TextInput
                          style={styles.textInput}
                          placeholder={t('City')}
                          placeholderTextColor="#94a3b8"
                          value={shippingCity}
                          onChangeText={setShippingCity}
                        />
                      </View>
                      <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.inputLabel}>{t('State')} *</Text>
                        <TextInput
                          style={styles.textInput}
                          placeholder={t('State')}
                          placeholderTextColor="#94a3b8"
                          value={shippingState}
                          onChangeText={setShippingState}
                        />
                      </View>
                    </View>

                    <View style={styles.inputRow}>
                      <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
                        <Text style={styles.inputLabel}>{t('Pincode')} *</Text>
                        <TextInput
                          style={styles.textInput}
                          placeholder={t('6-digit code')}
                          placeholderTextColor="#94a3b8"
                          keyboardType="number-pad"
                          maxLength={6}
                          value={shippingPincode}
                          onChangeText={setShippingPincode}
                        />
                      </View>
                      <View style={[styles.inputGroup, { flex: 1 }]}>
                        <Text style={styles.inputLabel}>{t('Landmark (Optional)')}</Text>
                        <TextInput
                          style={styles.textInput}
                          placeholder={t('e.g., Near Shiva Temple')}
                          placeholderTextColor="#94a3b8"
                          value={shippingLandmark}
                          onChangeText={setShippingLandmark}
                        />
                      </View>
                    </View>
                  </View>
                )}

                {/* Pandit Dakshina Selector */}
                <View style={styles.cardContainer}>
                  <Text style={styles.sectionHeader}>{t('Pandit Dakshina (Blessed Offering)')}</Text>
                  <Text style={styles.formHint}>
                    {t('Add a token of respect (Dakshina) for the performing Vedic Purohit.')}
                  </Text>

                  <View style={styles.dakshinaGrid}>
                    {[21, 51, 101, 251].map((option) => (
                      <TouchableOpacity
                        key={option}
                        style={[
                          styles.dakshinaBtn,
                          panditTip === option && styles.dakshinaBtnActive
                        ]}
                        onPress={() => {
                          setPanditTip(option);
                          setCustomTip('');
                        }}
                      >
                        <Text style={[styles.dakshinaPriceText, panditTip === option && styles.dakshinaPriceTextActive]}>
                          ₹{option}
                        </Text>
                        {option === 51 && (
                          <View style={styles.popularBadge}>
                            <Text style={styles.popularBadgeText}>{t('Popular')}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity
                    style={[
                      styles.customDakshinaBtn,
                      panditTip === null && styles.customDakshinaBtnActive
                    ]}
                    onPress={() => setPanditTip(null)}
                    activeOpacity={0.9}
                  >
                    <Ionicons
                      name={panditTip === null ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={panditTip === null ? '#ea580c' : '#64748b'}
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.customDakshinaLabel}>{t('Custom Dakshina')}</Text>
                    {panditTip === null && (
                      <TextInput
                        style={styles.customTipInput}
                        placeholder="₹ Amount"
                        placeholderTextColor="#94a3b8"
                        keyboardType="number-pad"
                        value={customTip}
                        onChangeText={setCustomTip}
                      />
                    )}
                  </TouchableOpacity>
                </View>

                {/* Vedic Invoice Summary Receipt */}
                <View style={styles.receiptCard}>
                  <View style={styles.receiptTopBorder} />
                  <Text style={styles.receiptTitle}>{t('Divine Invoice')}</Text>
                  <View style={styles.receiptLine} />

                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>{t('Item Subtotal (Base)')}</Text>
                    <Text style={styles.receiptValue}>₹{itemTotalOriginal}</Text>
                  </View>

                  {discountAmount > 0 && (
                    <View style={styles.receiptRow}>
                      <Text style={[styles.receiptLabel, { color: '#16a34a' }]}>{t('Divine Promo Discount')}</Text>
                      <Text style={[styles.receiptValue, { color: '#16a34a' }]}>- ₹{discountAmount}</Text>
                    </View>
                  )}

                  {selectedTip > 0 && (
                    <View style={styles.receiptRow}>
                      <Text style={styles.receiptLabel}>{t('Purohit Pandit Dakshina')}</Text>
                      <Text style={styles.receiptValue}>+ ₹{selectedTip}</Text>
                    </View>
                  )}

                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>{t('Temple Seva & GST Fee')}</Text>
                    <Text style={[styles.receiptValue, { color: '#16a34a', fontFamily: 'Outfit-Bold' }]}>{t('FREE')}</Text>
                  </View>

                  <View style={styles.receiptRow}>
                    <Text style={styles.receiptLabel}>{t('Sacred Prasad Delivery')}</Text>
                    <Text style={[styles.receiptValue, { color: '#16a34a', fontFamily: 'Outfit-Bold' }]}>{t('FREE')}</Text>
                  </View>

                  <View style={styles.receiptDashedLine} />

                  <View style={styles.receiptTotalRow}>
                    <Text style={styles.receiptTotalLabel}>{t('Total Sacred Payable')}</Text>
                    <Text style={styles.receiptTotalValue}>₹{totalPayable}</Text>
                  </View>

                  <View style={styles.safeShieldRow}>
                    <Ionicons name="shield-checkmark" size={16} color="#0f766e" />
                    <Text style={styles.safeShieldText}>{t('Secure Vedic checkout. Live Sankalp video recorded.')}</Text>
                  </View>
                </View>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Bottom Payment Button */}
        {cartItems.length > 0 && (
          <View style={[styles.footerContainer, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <TouchableOpacity
              style={styles.payButton}
              activeOpacity={0.9}
              onPress={handleCheckout}
            >
              <Text style={styles.payButtonText}>{t('CONFIRM & PAY')} • ₹{totalPayable}</Text>
              <Ionicons name="chevron-forward" size={20} color="#ffffff" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerBar: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 11,
    fontFamily: 'Outfit-Regular',
    color: '#64748b',
    marginTop: 1,
  },
  scrollContent: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyImage: {
    width: 140,
    height: 140,
    opacity: 0.3,
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontFamily: 'Outfit-Bold',
    color: '#0f172a',
    marginBottom: 10,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: 'Outfit-Regular',
    color: '#64748b',
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 20,
    marginBottom: 30,
  },
  exploreBtn: {
    backgroundColor: '#ea580c',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  exploreBtnText: {
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
    color: '#ffffff',
  },
  cardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  sectionHeader: {
    fontSize: 15.5,
    fontFamily: 'Outfit-Bold',
    color: '#0f172a',
    marginBottom: 12,
  },
  cartItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  itemImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#f8fafc',
  },
  itemDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  itemTitle: {
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
    color: '#0f172a',
  },
  itemSubtitle: {
    fontSize: 11,
    fontFamily: 'Outfit-Regular',
    color: '#64748b',
    marginTop: 2,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  itemOfferPrice: {
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
    color: '#ea580c',
  },
  itemOriginalPrice: {
    fontSize: 11,
    fontFamily: 'Outfit-Regular',
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  qtyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ea580c',
    borderRadius: 12,
    paddingHorizontal: 4,
    paddingVertical: 4,
    gap: 8,
  },
  qtyBtn: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 6,
  },
  qtyText: {
    fontSize: 12.5,
    fontFamily: 'Outfit-Bold',
    color: '#ffffff',
    minWidth: 16,
    textAlign: 'center',
  },
  addonsContainer: {
    marginBottom: 16,
  },
  addonsScroll: {
    paddingHorizontal: 4,
    gap: 12,
    paddingBottom: 4,
  },
  addonCard: {
    width: width * 0.38,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 10,
    borderWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  addonImage: {
    width: '100%',
    height: 90,
    borderRadius: 10,
    marginBottom: 8,
  },
  addonTitle: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    color: '#0f172a',
  },
  addonSubtitle: {
    fontSize: 10,
    fontFamily: 'Outfit-Regular',
    color: '#64748b',
    marginTop: 1,
  },
  addonPriceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  addonPrice: {
    fontSize: 12.5,
    fontFamily: 'Outfit-Bold',
    color: '#ea580c',
  },
  addonAddBtn: {
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  addonAddText: {
    fontSize: 9.5,
    fontFamily: 'Outfit-Bold',
    color: '#ea580c',
  },
  sankalpHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  tilakBox: {
    width: 10,
    height: 12,
    borderLeftWidth: 1.5,
    borderRightWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: '#f97316',
    borderBottomLeftRadius: 5,
    borderBottomRightRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -8,
  },
  tilakDotInner: {
    width: 3.5,
    height: 5,
    borderRadius: 1.75,
    backgroundColor: '#dc2626',
    marginTop: -1,
  },
  formHint: {
    fontSize: 11,
    fontFamily: 'Outfit-Regular',
    color: '#64748b',
    lineHeight: 15,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 11.5,
    fontFamily: 'Outfit-SemiBold',
    color: '#475569',
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    height: 40,
    paddingHorizontal: 12,
    fontSize: 13.5,
    fontFamily: 'Outfit-Regular',
    color: '#0f172a',
  },
  inputRow: {
    flexDirection: 'row',
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 16,
  },
  deliverySection: {
    marginTop: 4,
  },
  deliveryHeader: {
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
    color: '#0f172a',
    marginBottom: 12,
  },
  dakshinaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  dakshinaBtn: {
    flex: 1,
    minWidth: '22%',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dakshinaBtnActive: {
    backgroundColor: '#fff7ed',
    borderColor: '#ea580c',
  },
  dakshinaPriceText: {
    fontSize: 14.5,
    fontFamily: 'Outfit-Bold',
    color: '#475569',
  },
  dakshinaPriceTextActive: {
    color: '#ea580c',
  },
  popularBadge: {
    position: 'absolute',
    top: -8,
    backgroundColor: '#ea580c',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  popularBadgeText: {
    fontSize: 7.5,
    fontFamily: 'Outfit-Bold',
    color: '#ffffff',
  },
  customDakshinaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  customDakshinaBtnActive: {
    backgroundColor: '#fff7ed',
    borderColor: '#ea580c',
  },
  customDakshinaLabel: {
    fontSize: 13,
    fontFamily: 'Outfit-SemiBold',
    color: '#475569',
    flex: 1,
  },
  customTipInput: {
    width: 80,
    height: 28,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#ea580c',
    borderRadius: 6,
    paddingHorizontal: 8,
    fontSize: 12.5,
    fontFamily: 'Outfit-Bold',
    color: '#ea580c',
    textAlign: 'right',
  },
  receiptCard: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: '#fed7aa',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
    position: 'relative',
    overflow: 'hidden',
  },
  receiptTopBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: '#ea580c',
  },
  receiptTitle: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
    color: '#0f172a',
    textAlign: 'center',
    marginTop: 6,
  },
  receiptLine: {
    height: 1,
    backgroundColor: '#fed7aa',
    marginVertical: 12,
  },
  receiptRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  receiptLabel: {
    fontSize: 12.5,
    fontFamily: 'Outfit-Regular',
    color: '#475569',
  },
  receiptValue: {
    fontSize: 13,
    fontFamily: 'Outfit-SemiBold',
    color: '#0f172a',
  },
  receiptDashedLine: {
    borderWidth: 0.5,
    borderColor: '#fed7aa',
    borderStyle: 'dashed',
    marginVertical: 12,
  },
  receiptTotalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginVertical: 4,
  },
  receiptTotalLabel: {
    fontSize: 14.5,
    fontFamily: 'Outfit-Bold',
    color: '#0f172a',
    textTransform: 'uppercase',
  },
  receiptTotalValue: {
    fontSize: 20,
    fontFamily: 'Outfit-ExtraBold',
    color: '#ea580c',
  },
  safeShieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdfa',
    borderRadius: 8,
    padding: 8,
    marginTop: 16,
    gap: 6,
  },
  safeShieldText: {
    fontSize: 10,
    fontFamily: 'Outfit-Medium',
    color: '#0f766e',
  },
  footerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  payButton: {
    backgroundColor: '#ea580c',
    height: 48,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  payButtonText: {
    fontSize: 15,
    fontFamily: 'Outfit-Bold',
    color: '#ffffff',
    letterSpacing: 0.2,
  },
});