import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  LayoutAnimation,
  Platform,
  UIManager
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useLanguage } from '../context/LanguageContext';

const { width } = Dimensions.get('window');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface NotificationItem {
  id: string;
  category: 'muhurta' | 'booking' | 'shipment' | 'astro';
  title: string;
  desc: string;
  time: string;
  isRead: boolean;
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: '1',
      category: 'muhurta',
      title: 'Brahma Muhurta Hour Active',
      desc: 'The auspicious spiritual hours have begun. It is the highly recommended time to recite your daily stotrams and mantra paths for supreme divine focus.',
      time: '4:30 AM Today',
      isRead: false
    },
    {
      id: '2',
      category: 'booking',
      title: 'Sankalp Chanted Successfully',
      desc: 'Acharya Raman Shastri has completed your personalized name Sahil Patel & Kashyap Gotra Sankalp dedication during the Maha Rudrabhishek ritual in Varanasi. Watch recording.',
      time: '6:45 PM Yesterday',
      isRead: false
    },
    {
      id: '3',
      category: 'shipment',
      title: 'Prasad Box Dispatched via SpeedPost',
      desc: 'Your consecrated Lal Peda prasad and energized Copper Shani Ring are out for delivery. Estimated arrival at Scheme No 64, Indore, is within 48 hours.',
      time: '11:15 AM Yesterday',
      isRead: true
    },
    {
      id: '4',
      category: 'astro',
      title: 'Auspicious Saturn Transit Alignment',
      desc: 'Saturn (Shani Dev) is transitioning into a highly favorable cosmic alignment. Discover how this affects Aries (Mesh Rashi) and view recommended pacifying homas.',
      time: 'May 24, 2026',
      isRead: true
    }
  ]);

  const markAllRead = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setNotifications(notifications.map(n => ({ ...n, isRead: true })));
  };

  const clearNotification = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setNotifications(notifications.filter(n => n.id !== id));
  };

  const clearAll = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setNotifications([]);
  };

  const toggleRead = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setNotifications(notifications.map(n => n.id === id ? { ...n, isRead: !n.isRead } : n));
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'muhurta': return <MaterialCommunityIcons name="alarm-bell" size={20} color="#ea580c" />;
      case 'booking': return <Ionicons name="sparkles" size={18} color="#f59e0b" />;
      case 'shipment': return <Ionicons name="cube" size={18} color="#059669" />;
      case 'astro': return <Ionicons name="moon" size={18} color="#6366f1" />;
      default: return <Ionicons name="notifications" size={18} color="#64748b" />;
    }
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar barStyle="dark-content" />

      {/* Header */}
      <View style={[styles.headerBar, { paddingTop: insets.top || 12 }]}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={24} color="#1e293b" />
          </TouchableOpacity>

          <Text style={styles.headerTitleText}>{t('Divine Notifications')}</Text>

          <TouchableOpacity onPress={markAllRead} style={styles.markReadBtn} activeOpacity={0.7}>
            <Text style={styles.markReadBtnText}>{t('Read All')}</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {notifications.length > 0 && (
          <View style={styles.metaRow}>
            <Text style={styles.unreadCountText}>
              {notifications.filter(n => !n.isRead).length} {t('unread alarms')}
            </Text>
            <TouchableOpacity onPress={clearAll} activeOpacity={0.7}>
              <Text style={styles.clearAllText}>{t('Clear All')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {notifications.length > 0 ? (
          <View style={styles.listContainer}>
            {notifications.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.notificationCard, !item.isRead && styles.notificationCardUnread]}
                activeOpacity={0.9}
                onPress={() => toggleRead(item.id)}
              >
                {/* Left category icon circle */}
                <View style={[styles.iconCircle, { backgroundColor: item.isRead ? '#f1f5f9' : '#fff7ed' }]}>
                  {getCategoryIcon(item.category)}
                </View>

                {/* Body Column */}
                <View style={styles.cardBody}>
                  <View style={styles.cardHeaderRow}>
                    <Text style={[styles.cardTitleText, !item.isRead && styles.cardTitleTextBold]}>
                      {t(item.title)}
                    </Text>
                    {!item.isRead && <View style={styles.unreadDot} />}
                  </View>

                  <Text style={styles.cardDescText}>{t(item.desc)}</Text>
                  
                  <View style={styles.footerRow}>
                    <Text style={styles.timeText}>{t(item.time)}</Text>
                    {item.category === 'booking' && (
                      <TouchableOpacity
                        style={styles.actionLink}
                        onPress={() => router.push({ pathname: '/settings_detail', params: { type: 'my_orders' } })}
                      >
                        <Text style={styles.actionLinkText}>{t('View Puja')}</Text>
                        <Ionicons name="arrow-forward" size={11} color="#ea580c" />
                      </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* Right delete button */}
                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => clearNotification(item.id)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="close-circle-outline" size={18} color="#cbd5e1" />
                </TouchableOpacity>
              </TouchableOpacity>
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="notifications-off-outline" size={44} color="#94a3b8" />
            </View>
            <Text style={styles.emptyMainText}>{t('All caught up!')}</Text>
            <Text style={styles.emptySubText}>
              {t('No divine announcements or booking alerts at this time.')}
            </Text>
            <TouchableOpacity onPress={() => router.back()} style={styles.backHomeBtn} activeOpacity={0.8}>
              <Text style={styles.backHomeBtnText}>{t('Go to Home Altars')}</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  headerBar: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderColor: '#f1f5f9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 3,
  },
  headerRow: {
    height: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleText: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
    color: '#0f172a',
  },
  markReadBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#fff7ed',
  },
  markReadBtnText: {
    fontSize: 11.5,
    fontFamily: 'Outfit-Bold',
    color: '#ea580c',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  unreadCountText: {
    fontSize: 12.5,
    fontFamily: 'Outfit-Bold',
    color: '#64748b',
  },
  clearAllText: {
    fontSize: 12.5,
    fontFamily: 'Outfit-Bold',
    color: '#ef4444',
  },
  listContainer: {
    gap: 12,
  },
  notificationCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.01,
    shadowRadius: 4,
    elevation: 1,
  },
  notificationCardUnread: {
    borderColor: '#ffedd5',
    backgroundColor: '#fffcf9',
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.02,
    shadowRadius: 6,
    elevation: 2,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardBody: {
    flex: 1,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    paddingRight: 10,
  },
  cardTitleText: {
    fontSize: 13.5,
    fontFamily: 'Outfit-Medium',
    color: '#475569',
    lineHeight: 18,
  },
  cardTitleTextBold: {
    fontFamily: 'Outfit-Bold',
    color: '#1e293b',
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#ea580c',
  },
  cardDescText: {
    fontSize: 12,
    fontFamily: 'Outfit-Medium',
    color: '#64748b',
    lineHeight: 16,
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 10.5,
    fontFamily: 'Outfit-Medium',
    color: '#94a3b8',
  },
  actionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  actionLinkText: {
    fontSize: 11,
    fontFamily: 'Outfit-Bold',
    color: '#ea580c',
  },
  deleteBtn: {
    padding: 2,
    alignSelf: 'flex-start',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyMainText: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
    color: '#1e293b',
    marginBottom: 6,
  },
  emptySubText: {
    fontSize: 12,
    fontFamily: 'Outfit-Medium',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
    paddingHorizontal: 40,
  },
  backHomeBtn: {
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ea580c',
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 3,
  },
  backHomeBtnText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontFamily: 'Outfit-Bold',
  },
});
