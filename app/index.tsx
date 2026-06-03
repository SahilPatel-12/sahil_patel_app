import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { safeStorage } from '../services/storage';

import { SolarSystemBackground } from '../components/backgrounds/SolarSystemBackground';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const gifSource = require('../assets/logo/loader_1.gif');

  useEffect(() => {
    // Check if user session exists and navigate accordingly after 4 seconds
    const checkSessionAndNavigate = async () => {
      try {
        const session = await safeStorage.getItem('user_session');
        if (session) {
          router.replace('/(tabs)/home');
        } else {
          router.replace('/login');
        }
      } catch (err) {
        console.error('Error checking user session:', err);
        router.replace('/login');
      }
    };

    const timer = setTimeout(() => {
      checkSessionAndNavigate();
    }, 4000); 

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <SolarSystemBackground />
      <StatusBar style="dark" translucent />
      
      <View style={styles.logoContainer}>
        <Image
          source={gifSource}
          style={styles.gif}
          resizeMode="contain"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  logoContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  gif: {
    width: 700,
    height: 700,
  },
});
