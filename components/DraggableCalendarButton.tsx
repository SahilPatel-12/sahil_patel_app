import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  GestureResponderEvent,
  PanResponder,
  PanResponderGestureState,
  Platform,
  StyleSheet,
  View,
} from 'react-native';
import Svg, { Line, Rect, Text as SvgText } from 'react-native-svg';
import { safeStorage } from '../services/storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BUTTON_WIDTH = 70;
const BUTTON_HEIGHT = 70;
const SNAP_LEFT_X = 0;
const SNAP_RIGHT_X = SCREEN_WIDTH - BUTTON_WIDTH;

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

// Shared module-level state across all instances
let globalPosition = { x: SNAP_LEFT_X, y: SCREEN_HEIGHT * 0.45 };
const listeners = new Set<(pos: { x: number; y: number }, sourceId: string) => void>();
let hasLoadedFromStorage = false;

const generateId = () => Math.random().toString(36).substring(2, 9);

export default function DraggableCalendarButton() {
  const router = useRouter();
  const instanceId = useRef(generateId()).current;

  // Position animated value
  const pan = useRef(new Animated.ValueXY({ x: globalPosition.x, y: globalPosition.y })).current;
  const lastOffset = useRef({ x: globalPosition.x, y: globalPosition.y });

  // 0 when idle, 1 when actively dragged (controls lift, shadow, and icon scale)
  const dragProgress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Keep lastOffset updated
    const listenerId = pan.addListener((value) => {
      lastOffset.current = value;
    });

    // Register this instance's listener to receive position updates from other tabs
    const handleGlobalUpdate = (newPos: { x: number; y: number }, sourceId: string) => {
      if (sourceId !== instanceId) {
        Animated.spring(pan, {
          toValue: newPos,
          useNativeDriver: false,
          tension: 40,
          friction: 8,
        }).start();
      }
    };
    listeners.add(handleGlobalUpdate);

    // Initial load from storage (runs once globally)
    if (!hasLoadedFromStorage) {
      hasLoadedFromStorage = true;
      safeStorage.getItem('draggable_calendar_pos').then((stored) => {
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            if (parsed && typeof parsed.x === 'number' && typeof parsed.y === 'number') {
              globalPosition = parsed;
              listeners.forEach((l) => l(globalPosition, 'storage'));
            }
          } catch (e) {
            console.warn('[DraggableCalendarButton] Error parsing stored position:', e);
          }
        }
      });
    } else {
      pan.setValue({ x: globalPosition.x, y: globalPosition.y });
    }

    return () => {
      pan.removeListener(listenerId);
      listeners.delete(handleGlobalUpdate);
    };
  }, [pan, instanceId]);

  const handlePress = () => {
    console.log('[DraggableCalendarButton] Tapped, navigating to Spiritual Calendar page...');
    router.push('/spiritual_calendar');
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3;
      },
      onPanResponderGrant: () => {
        pan.setOffset({
          x: lastOffset.current.x,
          y: lastOffset.current.y,
        });
        pan.setValue({ x: 0, y: 0 });

        // Trigger lift and shadow scale animations
        Animated.spring(dragProgress, {
          toValue: 1,
          useNativeDriver: false,
          tension: 60,
          friction: 7,
        }).start();
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (e: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        pan.flattenOffset();

        // Release lift and shadow animations
        Animated.spring(dragProgress, {
          toValue: 0,
          useNativeDriver: false,
          tension: 60,
          friction: 7,
        }).start();

        // Check if movement is negligible, treat as pure click/tap
        if (Math.abs(gestureState.dx) < 6 && Math.abs(gestureState.dy) < 6) {
          handlePress();
          return;
        }

        // Determine nearest horizontal edge to snap to
        const currentX = lastOffset.current.x;
        const currentY = lastOffset.current.y;
        const snapX = currentX + BUTTON_WIDTH / 2 < SCREEN_WIDTH / 2 ? SNAP_LEFT_X : SNAP_RIGHT_X;

        // Keep button within safe vertical boundaries (avoid header and footer areas)
        const safeMinY = 90;
        const safeMaxY = SCREEN_HEIGHT - BUTTON_HEIGHT - 120;
        const snapY = Math.min(Math.max(currentY, safeMinY), safeMaxY);

        // Update shared coordinate state
        globalPosition = { x: snapX, y: snapY };

        // Save position to local safeStorage
        safeStorage.setItem('draggable_calendar_pos', JSON.stringify(globalPosition)).catch(() => { });

        // Broadcast to other tabs' button instances
        listeners.forEach((l) => l(globalPosition, instanceId));

        // Animate snap for this instance
        Animated.parallel([
          Animated.spring(pan.x, {
            toValue: snapX,
            useNativeDriver: false,
            tension: 40,
            friction: 7,
          }),
          Animated.spring(pan.y, {
            toValue: snapY,
            useNativeDriver: false,
            tension: 40,
            friction: 7,
          }),
        ]).start();
      },
    })
  ).current;

  // --- INTERPOLATIONS ---

  // Left Border Radius: 0 when docked on the left, morphs smoothly to 20 when dragged away (>60px), and to 35 when docked on the right
  const borderLeftRadius = pan.x.interpolate({
    inputRange: [0, 60, SNAP_RIGHT_X - 60, SNAP_RIGHT_X],
    outputRange: [0, 20, 20, 35],
    extrapolate: 'clamp',
  });

  // Right Border Radius: 35 when docked on the left, morphs smoothly to 20 when dragged away (>60px), and to 0 when docked on the right
  const borderRightRadius = pan.x.interpolate({
    inputRange: [0, 60, SNAP_RIGHT_X - 60, SNAP_RIGHT_X],
    outputRange: [35, 20, 20, 0],
    extrapolate: 'clamp',
  });

  // Button scale: scales up slightly on drag (1x to 1.05x)
  const buttonScale = dragProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05],
  });

  // Button vertical lift: translates upward slightly (-6px) on drag to represent depth
  const buttonLift = dragProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -6],
  });

  // Calendar icon scale: scales up slightly on drag (1x to 1.18x)
  const iconScale = dragProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.18],
  });

  // Icon vertical lift: translates upward within the button (-2px) on drag for dynamic separation
  const iconTranslateY = dragProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -2],
  });

  // iOS Shadow Opacity: deepens on drag for a beautiful glow effect
  const shadowOpacity = dragProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.75],
  });

  // iOS Shadow Radius: diffuses on drag
  const shadowRadius = dragProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [10, 22],
  });

  // Android Elevation: lifts up on drag
  const elevation = dragProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [6, 12],
  });

  return (
    <Animated.View
      style={[
        styles.draggable,
        {
          transform: [
            { translateX: pan.x },
            { translateY: Animated.add(pan.y, buttonLift) },
            { scale: buttonScale },
          ],
          borderTopLeftRadius: borderLeftRadius,
          borderBottomLeftRadius: borderLeftRadius,
          borderTopRightRadius: borderRightRadius,
          borderBottomRightRadius: borderRightRadius,
          shadowOpacity: shadowOpacity,
          shadowRadius: shadowRadius,
          elevation: elevation,
        },
      ]}
      {...panResponder.panHandlers}
    >
      <AnimatedLinearGradient
        colors={['#FF9500', '#FF7A00', '#F56B00']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.gradientBorder,
          {
            borderTopLeftRadius: borderLeftRadius,
            borderBottomLeftRadius: borderLeftRadius,
            borderTopRightRadius: borderRightRadius,
            borderBottomRightRadius: borderRightRadius,
          }
        ]}
      >
        <View style={styles.innerContent}>
          <Animated.View style={{ transform: [{ scale: iconScale }, { translateY: iconTranslateY }] }}>
            <Svg width={44} height={44} viewBox="0 0 24 24">
              <Rect
                x="3"
                y="5"
                width="18"
                height="16"
                rx="3.5"
                ry="3.5"
                fill="none"
                stroke="#ffffff"
                strokeWidth="2"
              />
              <Line
                x1="7"
                y1="2"
                x2="7"
                y2="6"
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <Line
                x1="17"
                y1="2"
                x2="17"
                y2="6"
                stroke="#ffffff"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <Line
                x1="3"
                y1="9"
                x2="21"
                y2="9"
                stroke="#ffffff"
                strokeWidth="1.5"
              />
              <SvgText
                x="12"
                y="19"
                fontSize="9.5"
                fontWeight="900"
                fill="#ffffff"
                textAnchor="middle"
                fontFamily="Outfit-Bold"
              >
                31
              </SvgText>
            </Svg>
          </Animated.View>
        </View>
      </AnimatedLinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  draggable: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: BUTTON_WIDTH,
    height: BUTTON_HEIGHT,
    zIndex: 999999,
    backgroundColor: 'transparent',
    ...Platform.select({
      ios: {
        shadowColor: '#F56B00', // Saffron-orange glowing shadow
        shadowOffset: { width: 0, height: 5 },
      },
    }),
  },
  gradientBorder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
    borderWidth: 1.2,
    borderColor: 'rgba(255, 255, 255, 0.35)', // Translucent glassmorphic edge highlight
  },
  innerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
