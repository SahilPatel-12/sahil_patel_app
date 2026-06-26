import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, useWindowDimensions, Text } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useLanguage } from '../context/LanguageContext';

const TABS = [
  { name: 'home', label: 'Home', icon: 'home' },
  { name: 'puja', label: 'Puja', icon: 'flame' },
  { name: 'god', label: 'Darshan', icon: 'flower' },
  { name: 'astro', label: 'Astro', icon: 'planet' },
  { name: 'music', label: 'Music', icon: 'musical-notes' },
];

const COLORS = {
  active: '#f97316', // Orange
  inactive: '#94a3b8',
  bg: '#ffffff'
};

const LIGHT_SVG = require('../assets/images/nav_bar/light.svg');

export default function AnimatedTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const { width } = useWindowDimensions();
  const TAB_WIDTH = width / TABS.length;
  const translateX = useSharedValue(0);

  const currentIndex = state.index;

  useEffect(() => {
    if (currentIndex !== -1) {
      translateX.value = withSpring(currentIndex * TAB_WIDTH, {
        damping: 15,
        stiffness: 100,
      });
    }
  }, [currentIndex, TAB_WIDTH]);

  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      width: TAB_WIDTH, // Dynamic width for indicator
    };
  });

  return (
    <View style={styles.container}>
      {/* Animated Light Effect */}
      <Animated.View style={[styles.lightContainer, indicatorStyle]}>
        <Image
          source={LIGHT_SVG}
          style={styles.lightImage}
          contentFit="contain"
        />
      </Animated.View>

      {/* Tab Items */}
      <View style={styles.tabItems}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          // Find matching tab info from our TABS array for the icon
          const tabInfo = TABS.find(t => t.name === route.name) || TABS[0];

          return (
            <TabItem
              key={route.key}
              tab={{ ...tabInfo, label }}
              isActive={isFocused}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
}

function TabItem({ tab, isActive, onPress }: { tab: any, isActive: boolean, onPress: () => void }) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(0.6);
  const { t } = useLanguage();

  useEffect(() => {
    scale.value = withSpring(isActive ? 1.2 : 1);
    opacity.value = withTiming(isActive ? 1 : 0.6);
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Animated.View style={animatedStyle}>
        <Ionicons
          name={isActive ? (tab.icon as any) : (`${tab.icon}-outline` as any)}
          size={24}
          color={isActive ? COLORS.active : COLORS.inactive}
        />
      </Animated.View>
      <Text
        style={[
          styles.label,
          { color: isActive ? COLORS.active : COLORS.inactive, fontWeight: isActive ? '700' : '500' }
        ]}
      >
        {t(tab.label)}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 85,
    backgroundColor: COLORS.bg,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    flexDirection: 'column',
    justifyContent: 'center',
    paddingBottom: 25,
    position: 'absolute',
    bottom: 0,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
    overflow: 'hidden',
  },
  lightContainer: {
    position: 'absolute',
    top: 0,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: -1,
  },
  lightImage: {
    width: 80, 
    height: 80,
    opacity: 0.6,
    top: 5, // Moved further down
  },
  tabItems: {
    flexDirection: 'row',
    height: '100%',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  label: {
    fontSize: 11,
  },
});
