import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useDrawer } from '../context/DrawerContext';
import { router } from 'expo-router';
import { useCart } from '../context/CartContext';
import { useLanguage } from '../context/LanguageContext';
import { safeStorage } from '../services/storage';
import { supabase } from '../services/supabase';

export default function Header() {
  const { openDrawer } = useDrawer();
  const { totalCartCount } = useCart();
  const { t } = useLanguage();

  const [userName, setUserName] = useState('Guest');
  const [avatarSeed, setAvatarSeed] = useState('Guest');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coinBalance, setCoinBalance] = useState<number | null>(null);

  useEffect(() => {
    let lastSessionStr = '';
    const checkSession = async () => {
      try {
        const sessionStr = await safeStorage.getItem('user_session');
        if (sessionStr && sessionStr !== lastSessionStr) {
          lastSessionStr = sessionStr;
          const parsed = JSON.parse(sessionStr);
          if (parsed) {
            if (parsed.name) {
              setUserName(parsed.name);
              setAvatarSeed(parsed.name);
            }
            setAvatarUrl(parsed.avatar_url || null);

            // Fetch wallet balance
            const { data } = await supabase
              .from('user_wallets')
              .select('balance')
              .eq('user_id', parsed.id)
              .maybeSingle();

            if (data) {
              setCoinBalance(data.balance);
            } else {
              setCoinBalance(50);
            }
          }
        } else if (!sessionStr) {
          setUserName('Guest');
          setAvatarSeed('Guest');
          setAvatarUrl(null);
          setCoinBalance(null);
        } else if (sessionStr && lastSessionStr) {
          // Keep balance updated in real-time
          const parsed = JSON.parse(sessionStr);
          const { data } = await supabase
            .from('user_wallets')
            .select('balance')
            .eq('user_id', parsed.id)
            .maybeSingle();
          if (data) {
            setCoinBalance(data.balance);
          }
        }
      } catch (err) {
        console.error('Error checking user session in Header:', err);
      }
    };

    checkSession();
    const interval = setInterval(checkSession, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <View style={styles.container}>
        {/* Left: Profile - Entire area is now explicitly wrapped and clickable */}
        <TouchableOpacity 
          style={styles.profileSection} 
          activeOpacity={0.6}
          onPress={openDrawer}
          hitSlop={{ top: 20, bottom: 20, left: 20, right: 60 }}
        >
          <View style={{ position: 'relative' }}>
            <View style={styles.avatarContainer}>
              <Image 
                source={avatarUrl ? { uri: avatarUrl } : `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(avatarSeed)}`} 
                style={styles.avatar} 
              />
            </View>
            <View style={styles.gearBadge}>
              <Ionicons name="settings" size={7} color="#ffffff" />
            </View>
          </View>
          <View style={styles.userInfo}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
              <Text style={styles.userName} numberOfLines={1}>{t(userName)}</Text>
              <Ionicons name="chevron-down" size={11} color="#64748b" style={{ marginTop: 1 }} />
            </View>
            <View style={styles.statusRow}>
              <View style={styles.statusDot} />
              <Text style={styles.userStatus}>{t('Online')}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Right: Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.iconBtn}
            activeOpacity={0.7}
            onPress={() => router.push('/cart')}
          >
            <View style={{ position: 'relative' }}>
              <Ionicons name="cart-outline" size={22} color="#334155" />
              {totalCartCount > 0 && (
                <View style={styles.cartBadge}>
                  <Text style={styles.cartBadgeText}>{totalCartCount}</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          {coinBalance !== null && (
            <TouchableOpacity
              style={styles.coinBalanceContainer}
              activeOpacity={0.7}
              onPress={() => router.push('/wallet')}
            >
              <Text style={styles.coinBalanceText}>🪙 {coinBalance}</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.75}
            onPress={() => router.push('/share')}
          >
            <Ionicons name="share-social-outline" size={22} color="#334155" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.iconBtn}
            activeOpacity={0.7}
            onPress={() => router.push('/notifications')}
          >
            <View>
              <Ionicons name="notifications-outline" size={22} color="#334155" />
              <View style={styles.badge} />
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#ffffff',
    zIndex: 1000,
    elevation: 10,
  },
  container: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    maxWidth: 1200,
    width: '100%',
    alignSelf: 'center',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    minWidth: 150,
  },
  avatarContainer: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f8fafc',
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  gearBadge: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    backgroundColor: '#f97316',
    width: 13,
    height: 13,
    borderRadius: 6.5,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  userInfo: {
    marginLeft: 8,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0f172a',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginRight: 4,
  },
  userStatus: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'flex-end',
  },
  iconBtn: {
    padding: 6,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#ef4444',
    borderWidth: 1.5,
    borderColor: '#ffffff',
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#ef4444',
    borderRadius: 8,
    width: 15,
    height: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ffffff',
  },
  cartBadgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontFamily: 'Outfit-Bold',
  },
  coinBalanceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#fed7aa',
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 4,
    gap: 3,
  },
  coinBalanceText: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
    color: '#ea580c',
  },
});
