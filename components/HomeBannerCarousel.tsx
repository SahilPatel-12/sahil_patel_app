import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Text } from 'react-native';
import { Image } from 'expo-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  interpolate,
  Extrapolation,
  useAnimatedScrollHandler,
  withTiming,
  SharedValue,
} from 'react-native-reanimated';
import { Colors } from '../constants/Colors';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../context/LanguageContext';

const width = Dimensions.get('window').width;

const BANNERS = [
  {
    id: '1',
    title: 'Divine Blessings',
    subtitle: 'Book your personal Puja today',
    image: 'https://images.unsplash.com/photo-1605806616949-1e87b487cb2a?q=80&w=800&auto=format&fit=crop',
    color: '#f97316'
  },
  {
    id: '2',
    title: 'Astrology Insights',
    subtitle: 'Connect with expert Astrologers',
    image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=800&auto=format&fit=crop',
    color: '#8b5cf6'
  },
  {
    id: '3',
    title: 'Sacred Music',
    subtitle: 'Listen to powerful mantras',
    image: 'https://images.unsplash.com/photo-1507676184212-d0330a1516b2?q=80&w=800&auto=format&fit=crop',
    color: '#ec4899'
  }
];

const PaginationDot = ({ index, scrollX }: { index: number; scrollX: SharedValue<number> }) => {
  const dotStyle = useAnimatedStyle(() => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];
    
    const dotWidth = interpolate(
      scrollX.value,
      inputRange,
      [8, 24, 8],
      Extrapolation.CLAMP
    );
    
    const opacity = interpolate(
      scrollX.value,
      inputRange,
      [0.4, 1, 0.4],
      Extrapolation.CLAMP
    );

    return {
      width: dotWidth,
      opacity,
    };
  });

  return (
    <Animated.View
      style={[styles.dot, dotStyle]}
    />
  );
};

export default function HomeBannerCarousel() {
  const scrollX = useSharedValue(0);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<Animated.FlatList<any>>(null);
  const { t } = useLanguage();

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollX.value = event.contentOffset.x;
    },
  });

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems[0]) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  // Optional: Auto-play functionality
  useEffect(() => {
    const timer = setInterval(() => {
      if (currentIndex < BANNERS.length - 1) {
        flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
      } else {
        flatListRef.current?.scrollToIndex({ index: 0, animated: true });
      }
    }, 4000); // 4 seconds interval

    return () => clearInterval(timer);
  }, [currentIndex]);

  const renderItem = ({ item, index }: { item: typeof BANNERS[0], index: number }) => {
    return (
      <View style={styles.slide}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: item.image }}
            style={styles.image}
            contentFit="cover"
            transition={1000}
          />
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            style={styles.gradient}
          />
          <View style={styles.textContainer}>
            <View style={[styles.badge, { backgroundColor: item.color }]}>
              <Text style={styles.badgeText}>{t('Featured')}</Text>
            </View>
            <Text style={styles.title}>{t(item.title)}</Text>
            <Text style={styles.subtitle}>{t(item.subtitle)}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <Animated.FlatList
        ref={flatListRef}
        data={BANNERS}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
      />
      <View style={styles.pagination}>
        {BANNERS.map((_, index) => (
          <PaginationDot
            key={index.toString()}
            index={index}
            scrollX={scrollX}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 250,
    width: width, // Full width
    marginBottom: 24,
  },
  slide: {
    width: width,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageContainer: {
    width: width - 32, // Padding 16 on each side
    height: '100%',
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#1e293b',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  gradient: {
    ...StyleSheet.absoluteFillObject,
    top: '40%', // Start gradient from middle to bottom
  },
  textContainer: {
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 4,
  },
  subtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
    fontWeight: '500',
  },
  pagination: {
    position: 'absolute',
    bottom: -16,
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.saffron.DEFAULT,
    marginHorizontal: 4,
  },
});
