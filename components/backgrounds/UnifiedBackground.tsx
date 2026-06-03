import React, { ReactNode } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '../../constants/Colors';
import Animated, {
  useAnimatedStyle,
  withRepeat,
  withTiming,
  useSharedValue,
  withSequence,
  withDelay
} from 'react-native-reanimated';

const { width, height } = Dimensions.get('window');

interface UnifiedBackgroundProps {
  children: ReactNode;
  mode?: 'cosmic' | 'saffron' | 'divine' | 'plain';
}

const Star = ({ top, left, size, delay }: { top: number, left: number, size: number, delay: number }) => {
  const opacity = useSharedValue(0.1);

  React.useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(0.8, { duration: 1500 + Math.random() * 1000 }),
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

export const UnifiedBackground: React.FC<UnifiedBackgroundProps> = ({ children, mode = 'plain' }) => {
  const renderCosmic = () => {
    return (
      <LinearGradient
        colors={[Colors.cosmicNavy[900], Colors.cosmicNavy[800], '#1e1b4b']}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Decorative Blobs */}
        <View style={[styles.blob, { top: -100, left: -50, backgroundColor: 'rgba(79, 70, 229, 0.15)', width: 300, height: 300 }]} />
        <View style={[styles.blob, { bottom: 100, right: -50, backgroundColor: 'rgba(192, 38, 211, 0.1)', width: 400, height: 400 }]} />

        {/* Stars */}
        {[...Array(20)].map((_, i) => (
          <Star
            key={i}
            top={Math.random() * height}
            left={Math.random() * width}
            size={2 + Math.random() * 3}
            delay={Math.random() * 2000}
          />
        ))}
      </LinearGradient>
    );
  };

  const renderSaffron = () => {
    return (
      <LinearGradient
        colors={['#fff7ed', '#ffedd5', '#fed7aa']}
        style={StyleSheet.absoluteFill}
      >
        <View style={[styles.blob, { top: 100, right: -100, backgroundColor: 'rgba(249, 115, 22, 0.05)', width: 500, height: 500 }]} />
      </LinearGradient>
    );
  };

  const renderDivine = () => {
    return (
      <LinearGradient
        colors={['#fff', '#fefce8', '#fef9c3']}
        style={StyleSheet.absoluteFill}
      >
        <View style={[styles.blob, { top: '20%', left: '10%', backgroundColor: 'rgba(234, 179, 8, 0.08)', width: 300, height: 300 }]} />
      </LinearGradient>
    );
  };

  const getBackground = () => {
    switch (mode) {
      case 'cosmic': return renderCosmic();
      case 'saffron': return renderSaffron();
      case 'divine': return renderDivine();
      default: return <View style={[StyleSheet.absoluteFill, { backgroundColor: '#ffffff' }]} />;
    }
  };

  return (
    <View style={styles.container}>
      {getBackground()}
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blob: {
    position: 'absolute',
    borderRadius: 1000,
    opacity: 0.6,
  },
  star: {
    position: 'absolute',
    backgroundColor: '#ffffff',
    shadowColor: '#ffffff',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 5,
  }
});   