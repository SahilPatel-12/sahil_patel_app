import { useEffect } from 'react';
import { Stack } from "expo-router";
import * as SplashScreen from 'expo-splash-screen';
import { useFonts, Outfit_400Regular, Outfit_600SemiBold, Outfit_700Bold, Outfit_800ExtraBold } from '@expo-google-fonts/outfit';
import { DrawerProvider } from "../context/DrawerContext";
import { CartProvider } from "../context/CartContext";
import { LanguageProvider } from "../context/LanguageContext";

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'Outfit-Regular': Outfit_400Regular,
    'Outfit-SemiBold': Outfit_600SemiBold,
    'Outfit-Bold': Outfit_700Bold,
    'Outfit-ExtraBold': Outfit_800ExtraBold,
  });

  useEffect(() => {
    if (loaded || error) {
      SplashScreen.hideAsync();
    }
  }, [loaded, error]);

  // Avoid early return to prevent "Rendered fewer hooks than expected"
  // Instead, render the stack but hide it or show nothing until ready
  return (
    <LanguageProvider>
      <CartProvider>
        <DrawerProvider>
          {loaded || error ? (
            <Stack screenOptions={{ headerShown: false }} initialRouteName="index">
              <Stack.Screen name="index" />
              <Stack.Screen name="login" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="puja_detail" />
              <Stack.Screen name="combo_detail" />
              <Stack.Screen name="settings_detail" />
              <Stack.Screen name="notifications" />
              <Stack.Screen name="share" />
            </Stack>
          ) : null}
        </DrawerProvider>
      </CartProvider>
    </LanguageProvider>
  );
}
