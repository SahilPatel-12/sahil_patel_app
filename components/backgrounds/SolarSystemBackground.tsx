import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions, Image } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
  Easing,
  withDelay,
  withSequence
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

const Star = ({ top, left, size, delay }: { top: number, left: number, size: number, delay: number }) => {
  const opacity = useSharedValue(0.1);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.4, { duration: 1500 + Math.random() * 1000 }),
          withTiming(0.1, { duration: 1500 + Math.random() * 1000 })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        styles.star,
        { top, left, width: size, height: size, borderRadius: size / 2 },
        animatedStyle
      ]}
    />
  );
};

const Planet = ({ radius, duration, size, color, delay = 0, icon }: { radius: number, duration: number, size: number, color: string, delay?: number, icon?: any }) => {
  const rotation = useSharedValue(0);

  useEffect(() => {
    rotation.value = withDelay(
      delay,
      withRepeat(
        withTiming(360, { duration, easing: Easing.linear }),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const angle = (rotation.value * Math.PI) / 180;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;

    return {
      transform: [
        { translateX: x },
        { translateY: y },
      ],
    };
  });

  return (
    <View style={[styles.orbitLine, { width: radius * 2, height: radius * 2, borderRadius: radius }]} pointerEvents="none">
      <Animated.View style={[styles.planetContainer, animatedStyle]}>
        {icon ? (
          <Image source={icon} style={{ width: size, height: size }} resizeMode="contain" />
        ) : (
          <View style={[styles.planet, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }]} />
        )}
      </Animated.View>
    </View>
  );
};

const FloatingIcon = ({ top, left, size, delay, icon }: { top: number, left: number, size: number, delay: number, icon: any }) => {
  const floatAnim = useSharedValue(0);

  useEffect(() => {
    floatAnim.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1, { duration: 3000 + Math.random() * 2000, easing: Easing.inOut(Easing.sin) }),
          withTiming(0, { duration: 3000 + Math.random() * 2000, easing: Easing.inOut(Easing.sin) })
        ),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: floatAnim.value * 10 }],
    opacity: 0.1,
  }));

  return (
    <Animated.View style={[styles.floatingIcon, { top, left }, animatedStyle]}>
      <Image source={icon} style={{ width: size, height: size }} resizeMode="contain" />
    </Animated.View>
  );
};

const SystemInstance = ({ style, sunStyle, scale = 1 }: { style: any, sunStyle: any, scale?: number }) => {
  return (
    <View style={[styles.systemWrapper, style, { transform: [{ scale }] }]}>
      {/* Sacred Mandala (Fortune Wheel) - Very Faint */}
      <Animated.View style={[styles.mandalaContainer, sunStyle, { opacity: 0.01 }]}>
        <Image
          source={require('../../assets/astrology/fortune-wheel.png')}
          style={{ width: 250, height: 250 }}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Central Sun - Matching the provided image gradient */}
      <View style={styles.sunContainer}>
        <LinearGradient
          colors={['#fff9c4', '#ffb74d', '#ff7043']}
          style={styles.sun}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        <View style={styles.sunGlow} />
      </View>

      {/* Planetary System - Exact match with provided design (Adjusted Size) */}
      <Planet radius={25} duration={10000} size={4.5} color="#9e9e9e" />
      <Planet radius={42} duration={15000} size={7} color="#ff9800" />
      <Planet radius={62} duration={20000} size={6} color="#42a5f5" />
      <Planet radius={88} duration={28000} size={9} color="#ef5350" />
      <Planet radius={118} duration={45000} size={14} color="#ffe0b2" />

      {/* Distant Vedic Symbol */}
      <Planet radius={150} duration={60000} size={18} color="transparent" icon={require('../../assets/diya.png')} />
    </View>
  );
};

export const SolarSystemBackground = () => {
  const sunRotation = useSharedValue(0);

  useEffect(() => {
    sunRotation.value = withRepeat(
      withTiming(360, { duration: 25000, easing: Easing.linear }),
      -1,
      false
    );
  }, []);

  const sunStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${sunRotation.value}deg` }],
  }));

  // CONFIGURATION: Edit these values to change icon placement and size
  // top: % from top (0-100), left: % from left (0-100), size: icon size in px
  const iconConfig = [
    { top: 25, left: 10, size: 25, icon: require('../../assets/zodiac/aries.png') },
    { top: 25, left: 25, size: 40, icon: require('../../assets/bhagwan/ganesha.png') },
    { top: 40, left: 15, size: 20, icon: require('../../assets/zodiac/leo.png') },
    { top: 60, left: 8, size: 35, icon: require('../../assets/kalasha.png') },
    { top: 80, left: 20, size: 22, icon: require('../../assets/bhagwan/shiv.png') },
    { top: 10, left: 85, size: 30, icon: require('../../assets/zodiac/libra.png') },
    { top: 35, left: 75, size: 45, icon: require('../../assets/bhagwan/surya.png') },
    { top: 55, left: 90, size: 28, icon: require('../../assets/diya.png') },
    { top: 75, left: 80, size: 38, icon: require('../../assets/zodiac/aries.png') },
    { top: 90, left: 65, size: 24, icon: require('../../assets/kalasha.png') },
  ];

  return (
    <View style={styles.container}>
      {/* Background Stars */}
      {[...Array(15)].map((_, i) => (
        <Star
          key={i}
          top={Math.random() * height}
          left={Math.random() * width}
          size={1 + Math.random() * 1.5}
          delay={Math.random() * 4000}
        />
      ))}

      {/* Scattered Floating Icons - Manually Positioned */}
      {iconConfig.map((item, i) => (
        <FloatingIcon
          key={`float-${i}`}
          top={(item.top / 100) * height}
          left={(item.left / 100) * width}
          size={item.size}
          delay={i * 400}
          icon={item.icon}
        />
      ))}

      {/* Top Right Solar System */}
      <SystemInstance
        style={{ top: -1, right: -30 }}
        sunStyle={sunStyle}
        scale={1}
      />

      {/* Bottom Left Solar System - Made Even Smaller */}
      <SystemInstance
        style={{ bottom: -40, left: -50 }}
        sunStyle={sunStyle}
        scale={0.5}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  systemWrapper: {
    position: 'absolute',
    width: 260,
    height: 260,
    justifyContent: 'center',
    alignItems: 'center',
  },
  star: {
    position: 'absolute',
    backgroundColor: '#ff9800',
  },
  floatingIcon: {
    position: 'absolute',
    opacity: 0.15,
  },
  mandalaContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: -1,
  },
  sunContainer: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sun: {
    width: 28,
    height: 28,
    borderRadius: 14,
    zIndex: 10,
  },
  sunGlow: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#fff9c4',
    opacity: 0.2,
  },
  orbitLine: {
    position: 'absolute',
    borderWidth: 1,
    borderColor: '#cfd8dc',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  planetContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  planet: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  }
});
