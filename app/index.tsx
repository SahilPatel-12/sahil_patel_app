import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions, Image } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { safeStorage } from '../services/storage';

import { SolarSystemBackground } from '../components/backgrounds/SolarSystemBackground';

const { width } = Dimensions.get('window');

export default function SplashScreen() {
  const router = useRouter();
  const gifSource = require('../assets/logo/loader_1.gif');

  useEffect(() => {
    // Check native clipboard and session, then navigate accordingly after 4 seconds
    const checkClipboardAndSession = async () => {
      try {
        const text = await Clipboard.getStringAsync();
        if (text) {
          // Match code=MPXXXXXX or raw MPXXXXXX
          const match = text.match(/code=([a-zA-Z0-9_-]+)/i) || text.match(/\b(MP[a-zA-Z0-9]{6})\b/i);
          if (match && match[1]) {
            const matchedCode = match[1].toUpperCase();
            console.log('[Splash] Auto-fetched referral code from native system clipboard:', matchedCode);
            await safeStorage.setItem('pending_referral_code', matchedCode);
          }
        }
      } catch (err) {
        console.warn('[Splash] Error checking clipboard for referral:', err);
      }

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
      checkClipboardAndSession();
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
