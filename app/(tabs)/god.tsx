import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ImageBackground,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Colors } from '../../constants/Colors';
import { useLanguage } from '../../context/LanguageContext';
import { useAudioPlayer } from 'expo-audio';
import Animated, {
  FadeIn,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withDelay,
  withRepeat,
  Easing
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useCallback, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const GOD_DATA = [
  { id: '1', name: 'Shiv Ji', image: require('../../assets/bhagwan/shiva.png'), color: '#3498db' },
  { id: '2', name: 'Ma Laxmi', image: require('../../assets/bhagwan/lakshmi.png'), color: '#e74c3c' },
  { id: '3', name: 'Ganesha', image: require('../../assets/bhagwan/ganesha.png'), color: '#f39c12' },
  { id: '4', name: 'Hanuman', image: require('../../assets/bhagwan/hanuman.png'), color: '#e67e22' },
  { id: '5', name: 'Durga Ma', image: require('../../assets/bhagwan/durga.png'), color: '#c0392b' },
  { id: '6', name: 'Krishna Ji', image: require('../../assets/bhagwan/krishna.png'), color: '#9b59b6' },
  { id: '7', name: 'Venkateswara', image: require('../../assets/God/Lord Venkateswara Images Full Hd Wallpaper 1.png'), color: '#f1c40f' },
];

// Sub-component for individual flower animation
const FlowerItem = ({ data }: { data: any }) => {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(data.startX);
  const rotation = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(
      data.delay,
      withRepeat(
        withTiming(height + 100, { duration: data.duration, easing: Easing.linear }),
        -1,
        false
      )
    );
    translateX.value = withDelay(
      data.delay,
      withRepeat(
        withTiming(data.startX + 50, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
        -1,
        true
      )
    );
    rotation.value = withRepeat(
      withTiming(360, { duration: data.rotationSpeed, easing: Easing.linear }),
      -1,
      false
    );
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
    <Animated.Image
      source={require('../../assets/God/flower1.png')}
      style={animatedStyle}
    />
  );
};

export default function GodScreen() {
  const { t } = useLanguage();
  const [selectedGod, setSelectedGod] = useState(GOD_DATA[1]); // Default to Ma Laxmi
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
  
  const toggleFlowers = () => {
    if (!isFlowersActive) {
      setIsFlowersActive(true);
      // Generate 60 random flowers for a denser shower
      const newFlowers = Array.from({ length: 60 }).map((_, i) => ({
        id: i,
        startX: Math.random() * width,
        delay: Math.random() * 2000,
        duration: 3000 + Math.random() * 2000,
        rotationSpeed: 1000 + Math.random() * 1000,
        size: 20 + Math.random() * 20,
      }));
      setFlowers(newFlowers);
    } else {
      setIsFlowersActive(false);
      setFlowers([]);
    }
  };

  const toggleArti = () => {
    if (!isArtiActive) {
      setIsArtiActive(true);
      thaliProgress.value = withRepeat(
        withTiming(1, { duration: 4000, easing: Easing.linear }),
        -1,
        false
      );
    } else {
      setIsArtiActive(false);
      thaliProgress.value = 0;
    }
  };

  // Pre-load sound when focused
  useFocusEffect(
    useCallback(() => {
      // Trigger initial swing
      triggerSwing(leftBellRotation, true);
      triggerSwing(rightBellRotation, false);

      return () => {
        leftBellRotation.value = 0;
        rightBellRotation.value = 0;
      };
    }, [])
  );

  async function playBellSound() {
    try {
      if (bellPlayer) {
        if (bellPlayer.isLoaded) {
          await bellPlayer.seekTo(0).catch(err => {
            console.log('[GodScreen] Error seeking bell player:', err);
          });
        }
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
        { translateY: radius * Math.sin(angle) + 100 }, // Moved down from -50
      ],
      opacity: isArtiActive ? withTiming(1) : withTiming(0),
    };
  });

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
                {GOD_DATA.map((god) => (
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
                      <Image source={god.image} style={styles.chipAvatar} />
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
              data={GOD_DATA.filter(god => ['1', '2', '7'].includes(god.id))}
              keyExtractor={(item) => item.id}
              pagingEnabled
              snapToInterval={600}
              snapToAlignment="start"
              decelerationRate="fast"
              showsVerticalScrollIndicator={false}
              onMomentumScrollEnd={(event) => {
                const index = Math.round(event.nativeEvent.contentOffset.y / event.nativeEvent.layoutMeasurement.height);
                // Map back to the filtered data IDs to find the correct GOD_DATA item
                const filteredData = GOD_DATA.filter(god => ['1', '2', '7'].includes(god.id));
                setSelectedGod(filteredData[index]);
              }}
              renderItem={({ item }) => (
                <View style={styles.deityPage}>
                  <Image
                    source={item.id === '2' ? require('../../assets/God/god.png') :
                      item.id === '1' ? require('../../assets/God/god1.png') : 
                      item.id === '7' ? require('../../assets/God/Lord Venkateswara Images Full Hd Wallpaper 1.png') :
                      item.image}
                    style={[
                      styles.fullGodImage,
                      item.id === '1' && { marginTop: -10 }, // Move Shiv Ji higher
                      item.id === '2' && { marginTop: -70 },  // Move Ma Laxmi lower
                      item.id === '7' && { marginTop: 0 }    // Lord Venkateswara
                    ]}
                    resizeMode="contain"
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
            <Image
              source={require('../../assets/God/arti.gif')}
              style={styles.thaliImage}
              resizeMode="contain"
            />
          </Animated.View>
        </View>

        {/* Flower Shower Layer */}
        {isFlowersActive && (
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {flowers.map((flower) => (
              <FlowerItem key={flower.id} data={flower} />
            ))}
          </View>
        )}
      </View>

      {/* Floating Buttons Container */}
      <View style={styles.floatingButtonsContainer}>
        {/* Flower Toggle Button */}
        <TouchableOpacity
          onPress={toggleFlowers}
          style={[
            styles.flowerButton,
            isFlowersActive && styles.flowerButtonActive
          ]}
        >
          <Image
            source={require('../../assets/God/flower1.png')}
            style={styles.flowerButtonIcon}
          />
        </TouchableOpacity>

        {/* Floating Arti Toggle Button */}
        <TouchableOpacity
          onPress={toggleArti}
          style={[
            styles.artiButton,
            isArtiActive && styles.artiButtonActive
          ]}
        >
          <Image
            source={require('../../assets/God/arti.gif')}
            style={styles.artiButtonIcon}
          />
        </TouchableOpacity>
      </View>
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
});
