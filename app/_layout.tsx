import { useEffect } from 'react';
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Outfit_400Regular, Outfit_600SemiBold, Outfit_700Bold, Outfit_800ExtraBold } from '@expo-google-fonts/outfit';
import { DrawerProvider } from "../context/DrawerContext";
import { CartProvider } from "../context/CartContext";
import { LanguageProvider } from "../context/LanguageContext";
import { PlaybackProvider } from "../context/PlaybackContext";
import * as Linking from 'expo-linking';
import { safeStorage } from '../services/storage';
import { registerForPushNotificationsAsync, registerNotificationListeners } from '../services/notifications';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const [loaded, error] = useFonts({
    'Outfit-Regular': Outfit_400Regular,
    'Outfit-SemiBold': Outfit_600SemiBold,
    'Outfit-Bold': Outfit_700Bold,
    'Outfit-ExtraBold': Outfit_800ExtraBold,
  });

  useEffect(() => {
    // Register for push notifications on app startup
    registerForPushNotificationsAsync();

    // Set up notification foreground & selection listeners
    const cleanupListeners = registerNotificationListeners(
      (notification) => {
        console.log('[RootLayout] Push notification received in foreground:', notification.request.content.title);
      },
      (response) => {
        console.log('[RootLayout] User clicked push notification:', response.notification.request.content.title);
      }
    );

    const handleDeepLink = async (url: string | null) => {
      if (!url) return;
      try {
        const parsed = Linking.parse(url);
        console.log('[Deep Linking] Received URL:', url, 'Parsed:', parsed);
        if (parsed.queryParams && parsed.queryParams.code) {
          const code = parsed.queryParams.code as string;
          console.log('[Deep Linking] Saving pending referral code:', code);
          await safeStorage.setItem('pending_referral_code', code);
        }

        // Navigate to the God/Darshan tab if deep link contains god
        if (url.includes('/god') || url.includes('//god')) {
          console.log('[Deep Linking] Redirecting to god tab...');
          router.replace('/(tabs)/god');
        }
      } catch (err) {
        console.warn('Error parsing deep link:', err);
      }
    };

    // Check initial launch URL
    Linking.getInitialURL().then(handleDeepLink);

    // Listen to incoming URLs when app is running
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    return () => {
      subscription.remove();
      cleanupListeners();
    };
  }, []);

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  // Avoid early return to prevent "Rendered fewer hooks than expected"
  // Instead, render the stack but hide it or show nothing until ready
  return (
    <LanguageProvider>
      <PlaybackProvider>
        <CartProvider>
          <DrawerProvider>
            {loaded || error ? (
              <Stack screenOptions={{ headerShown: false }} initialRouteName="index">
                <Stack.Screen name="index" />
                <Stack.Screen name="login" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="puja_detail" />
                <Stack.Screen name="daan_detail" />
                <Stack.Screen name="settings_detail" />
                <Stack.Screen name="notifications" />
                <Stack.Screen name="share" />
                <Stack.Screen name="rashi" />
                <Stack.Screen name="kundli" />
                <Stack.Screen name="panchang" />
                <Stack.Screen name="book_pandit_puja" />
                <Stack.Screen name="astrologer_chat" />
                <Stack.Screen name="alarms" />
              </Stack>
            ) : null}
          </DrawerProvider>
        </CartProvider>
      </PlaybackProvider>
    </LanguageProvider>
  );
}
