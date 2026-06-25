import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { supabase } from './supabase';
import { safeStorage } from './storage';

// Dynamically load native modules to prevent load-time crash in Expo Go (SDK 53+)
let Notifications: any = null;
let Device: any = null;

const isExpoGo = Constants.appOwnership === 'expo';

if (Platform.OS !== 'web' && !isExpoGo) {
  try {
    Notifications = require('expo-notifications');
    Device = require('expo-device');

    // Configure notification behavior when app is in foreground
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (error) {
    console.warn('[Notifications] Failed to load native notification modules:', error);
  }
}

/**
 * Requests permissions, fetches the Expo Push Token, and registers it to Supabase.
 */
export async function registerForPushNotificationsAsync() {
  if (Platform.OS === 'web') {
    console.log('[Notifications] Push notifications are not supported on web.');
    return null;
  }

  if (isExpoGo) {
    console.log('[Notifications] Remote push notifications are disabled in Expo Go. Use a development client build instead.');
    return null;
  }

  if (!Notifications || !Device) {
    console.log('[Notifications] Notification modules not loaded.');
    return null;
  }

  if (!Device.isDevice) {
    console.log('[Notifications] Push notifications require a physical device.');
    return null;
  }

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('[Notifications] Failed to get push token for push notifications (permission not granted).');
      return null;
    }

    // Retrieve native device token (FCM token on Android) instead of Expo Push Token
    const tokenObj = await Notifications.getDevicePushTokenAsync();
    const token = tokenObj.data;
    console.log('[Notifications] Device Push Token obtained:', token);

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF9500',
      });

      // Dynamically register channels for all custom sounds registered in Supabase
      try {
        const { data: dbSounds } = await supabase
          .from('notification_sounds')
          .select('filename, name');
        
        if (dbSounds) {
          for (const s of dbSounds) {
            if (s.filename === 'default') continue;
            await Notifications.setNotificationChannelAsync(s.filename, {
              name: s.name,
              importance: Notifications.AndroidImportance.MAX,
              sound: `${s.filename}.mp3`,
              vibrationPattern: [0, 250, 250, 250],
              lightColor: '#FF9500',
            });
            console.log(`[Notifications] Registered Android channel for custom sound: ${s.filename}`);
          }
        }
      } catch (channelErr) {
        console.error('[Notifications] Failed to load custom sound channels:', channelErr);
      }
    }

    // Save token to Supabase
    await savePushTokenToSupabase(token);
    return token;
  } catch (error) {
    console.error('[Notifications] Error registering for push notifications:', error);
    return null;
  }
}

/**
 * Saves/updates push token in user_push_tokens Supabase table.
 */
export async function savePushTokenToSupabase(token: string) {
  try {
    const sessionStr = await safeStorage.getItem('user_session');
    let userId: string | null = null;
    if (sessionStr) {
      const session = JSON.parse(sessionStr);
      userId = session?.id || null;
    }

    const platform = Platform.OS;

    const { error } = await supabase
      .from('user_push_tokens')
      .upsert(
        {
          push_token: token,
          user_id: userId,
          platform: platform,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'push_token' }
      );

    if (error) {
      console.error('[Notifications] Failed to save push token to Supabase:', error);
    } else {
      console.log('[Notifications] Push token successfully synced with Supabase.');
    }
  } catch (err) {
    console.error('[Notifications] Error in savePushTokenToSupabase:', err);
  }
}

/**
 * Unlinks the current user's push token from their session (useful on logout).
 */
export async function removePushTokenFromSupabase(token: string) {
  try {
    const { error } = await supabase
      .from('user_push_tokens')
      .delete()
      .eq('push_token', token);

    if (error) {
      console.error('[Notifications] Failed to delete push token from Supabase:', error);
    } else {
      console.log('[Notifications] Push token successfully deleted from Supabase.');
    }
  } catch (err) {
    console.error('[Notifications] Error in removePushTokenFromSupabase:', err);
  }
}

/**
 * Registers notification listeners for foreground reception and click actions.
 */
export function registerNotificationListeners(
  onNotificationReceived?: (notification: any) => void,
  onNotificationResponse?: (response: any) => void
) {
  if (isExpoGo || !Notifications) {
    console.log('[Notifications] Listeners skipped in Expo Go / simulator.');
    return () => {};
  }

  // Foreground notification listener
  const notificationListener = Notifications.addNotificationReceivedListener((notification: any) => {
    console.log('[Notifications] Notification received in foreground:', notification);
    if (onNotificationReceived) {
      onNotificationReceived(notification);
    }
  });

  // Listener for when user clicks/taps on a notification
  const responseListener = Notifications.addNotificationResponseReceivedListener((response: any) => {
    console.log('[Notifications] Notification clicked:', response);
    if (onNotificationResponse) {
      onNotificationResponse(response);
    }
  });

  return () => {
    notificationListener.remove();
    responseListener.remove();
  };
}
