import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Pressable, Platform, ScrollView } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  withSpring, 
  useSharedValue, 
  interpolate,
  runOnJS,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../context/LanguageContext';
import { safeStorage } from '../services/storage';
import { supabase } from '../services/supabase';


const { width, height } = Dimensions.get('window');
const DRAWER_WIDTH = width * 0.8;

interface SettingsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

const SETTINGS_ITEMS = [
  { icon: 'person-outline', label: 'My Profile', desc: 'Manage your personal info' },
  { icon: 'settings-outline', label: 'Settings', desc: 'Preferences and privacy' },
  { icon: 'receipt-outline', label: 'My Orders', desc: 'History and active bookings' },
  { icon: 'wallet-outline', label: 'My Wallet', desc: 'Balance and transactions', color: '#f59e0b' },
  { icon: 'language-outline', label: 'Language', desc: 'Change app language' },
  { icon: 'help-circle-outline', label: 'Help & Support', desc: 'FAQs and contact' },
  { icon: 'information-circle-outline', label: 'About Us', desc: 'Learn more about Mantra Puja' },
  { icon: 'log-out-outline', label: 'Logout', desc: 'Sign out from your account', color: '#ef4444' },
];

export default function SettingsDrawer({ isOpen, onClose }: SettingsDrawerProps) {
  const [isVisible, setIsVisible] = useState(isOpen);
  const progress = useSharedValue(0);
  const { t } = useLanguage();

  const [profileName, setProfileName] = useState('Guest');
  const [profileEmail, setProfileEmail] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [walletBalance, setWalletBalance] = useState<number>(50);
  const [isPundit, setIsPundit] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const loadSession = async () => {
        try {
          const sessionStr = await safeStorage.getItem('user_session');
          if (sessionStr) {
            const parsed = JSON.parse(sessionStr);
            if (parsed.name) setProfileName(parsed.name);
            if (parsed.email) setProfileEmail(parsed.email);
            else setProfileEmail('');
            if (parsed.avatar_url) setAvatarUrl(parsed.avatar_url);
            else setAvatarUrl(null);

            // Fetch wallet balance
            const { data } = await supabase
              .from('user_wallets')
              .select('balance')
              .eq('user_id', parsed.id)
              .maybeSingle();

            if (data) {
              setWalletBalance(data.balance);
            } else {
              // Self-heal
              await supabase.from('user_wallets').upsert({ user_id: parsed.id, balance: 50 });
              setWalletBalance(50);
            }

            // Check if user is a Pundit
            const { data: punditData } = await supabase
              .from('website_store_pundits')
              .select('id')
              .eq('user_id', parsed.id)
              .maybeSingle();

            setIsPundit(!!punditData);
          } else {
            setProfileName('Guest');
            setProfileEmail('');
            setAvatarUrl(null);
            setWalletBalance(50);
            setIsPundit(false);
          }
        } catch (err) {
          console.error('Error loading session in SettingsDrawer:', err);
        }
      };
      loadSession();
    }
  }, [isOpen]);

  const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    if (parts.length === 1 && parts[0].length > 0) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return 'DV';
  };

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      progress.value = withSpring(1, { damping: 20, stiffness: 120 });
    } else {
      progress.value = withSpring(0, { damping: 20, stiffness: 120 }, (finished) => {
        if (finished) {
          runOnJS(setIsVisible)(false);
        }
      });
    }
  }, [isOpen]);

  const drawerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(progress.value, [0, 1], [-DRAWER_WIDTH, 0]);
    return {
      transform: [{ translateX }],
    };
  });

  const backdropStyle = useAnimatedStyle(() => {
    const opacity = interpolate(progress.value, [0, 1], [0, 1]);
    return {
      opacity,
    };
  });

  if (!isVisible) return null;

  return (
    <View 
      style={[StyleSheet.absoluteFill, { zIndex: 999999 }]} 
      pointerEvents={isOpen ? 'auto' : 'none'}
    >
      {/* Backdrop */}
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={styles.flex} onPress={onClose} />
      </Animated.View>

      {/* Drawer */}
      <Animated.View style={[styles.drawer, drawerStyle]}>
        <View style={styles.header}>
          <View style={styles.profileSection}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarCircle}>
                {avatarUrl ? (
                  <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
                ) : (
                  <Text style={styles.avatarText}>{getInitials(profileName)}</Text>
                )}
              </View>
              <View style={styles.onlineStatus} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.name}>{t(profileName)}</Text>
              {profileEmail ? <Text style={styles.email}>{profileEmail}</Text> : null}
            </View>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeCircle}>
            <Ionicons name="close" size={24} color="#1e293b" />
          </TouchableOpacity>
        </View>

        <ScrollView 
          style={styles.scroll} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.statsContainer}>
            <TouchableOpacity 
              style={styles.statsCard}
              activeOpacity={0.9}
              onPress={() => {
                onClose();
                router.push('/wallet');
              }}
            >
              <LinearGradient
                colors={['#ea580c', '#d97706']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.statsGradient}
              >
                <View style={styles.coinIconContainer}>
                  <Ionicons name="wallet" size={22} color="#fef08a" />
                </View>
                <View style={styles.statsInfo}>
                  <Text style={styles.coinLabel}>{t('Spiritual Wallet')}</Text>
                  <View style={styles.coinValueRow}>
                    <Text style={styles.coinValue}>{walletBalance}</Text>
                    <Text style={styles.coinText}>{t('Coins')}</Text>
                  </View>
                </View>
                <View style={styles.arrowIconContainer}>
                  <Ionicons name="chevron-forward" size={18} color="#ffffff" />
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <View style={styles.itemsContainer}>
            <Text style={styles.sectionTitle}>{t('Account Settings')}</Text>
            {(() => {
              const menuItems = [...SETTINGS_ITEMS];
              if (isPundit) {
                menuItems.splice(3, 0, {
                  icon: 'calendar-outline',
                  label: 'Pundit Portal',
                  desc: 'Accept bookings and update profile',
                  color: '#ea580c'
                });
              }
              return menuItems.map((item, index) => (
                <TouchableOpacity 
                  key={index}
                  style={styles.item}
                  activeOpacity={0.7}
                  onPress={() => {
                    onClose();
                    if (item.label === 'My Wallet') {
                      router.push('/wallet');
                    } else {
                      router.push({
                        pathname: '/settings_detail',
                        params: { type: item.label.toLowerCase().replace(/\s+/g, '_') }
                      });
                    }
                  }}
                >
                  <View style={[styles.iconBox, item.color ? { backgroundColor: item.color + '15' } : { backgroundColor: '#f1f5f9' }]}>
                    <Ionicons name={item.icon as any} size={22} color={item.color || '#6366f1'} />
                  </View>
                  <View style={styles.itemBody}>
                    <Text style={[styles.itemLabel, item.color ? { color: item.color } : { color: '#1e293b' }]}>
                      {t(item.label)}
                    </Text>
                    <Text style={styles.itemDesc}>{t(item.desc)}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
                </TouchableOpacity>
              ));
            })()}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <Text style={styles.version}>{t('appName')} • v1.0.0</Text>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: DRAWER_WIDTH,
    backgroundColor: '#ffffff',
    borderTopRightRadius: 30,
    borderBottomRightRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 10, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 30,
    paddingTop: Platform.OS === 'ios' ? 60 : 50,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#f97316',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#fed7aa',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
    borderRadius: 26,
  },
  avatarText: {
    color: '#ffffff',
    fontSize: 20,
    fontWeight: '800',
  },
  onlineStatus: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  headerText: {
    gap: 2,
  },
  name: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1e293b',
  },
  email: {
    fontSize: 12,
    color: '#64748b',
  },
  closeCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  statsContainer: {
    marginHorizontal: 16,
    marginBottom: 20,
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  statsCard: {
    width: '100%',
  },
  statsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  coinIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  statsInfo: {
    flex: 1,
  },
  coinLabel: {
    fontSize: 10,
    color: '#ffedd5',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  coinValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
  },
  coinValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#ffffff',
  },
  coinText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#fef08a',
    marginLeft: 4,
  },
  arrowIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    marginLeft: 20,
    marginBottom: 12,
  },
  itemsContainer: {
    paddingHorizontal: 8,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  itemBody: {
    flex: 1,
  },
  itemLabel: {
    fontSize: 15,
    fontWeight: '700',
  },
  itemDesc: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 1,
  },
  footer: {
    paddingVertical: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  version: {
    fontSize: 11,
    color: '#cbd5e1',
    fontWeight: '700',
  },
});
