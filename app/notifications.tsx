import React, { useState, useEffect } from 'react';
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
  UIManager,
  Image,
  ActivityIndicator
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useLanguage } from '../context/LanguageContext';
import { supabase } from '../services/supabase';
import { safeStorage } from '../services/storage';

const { width } = Dimensions.get('window');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface NotificationItem {
  id: string;
  title: string;
  body: string;
  image_url?: string;
  notification_type: 'vrat' | 'coins' | 'global' | 'generic';
  target_vrat_id?: string;
  coin_amount?: number;
  scheduled_date: string;
  scheduled_time: string;
  sent_at?: string;
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>([]);
  const [deletedNotificationIds, setDeletedNotificationIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch sent notifications from Supabase push_notifications table
  const fetchNotifications = async () => {
    setLoading(true);
    try {
      let loggedInUserId = null;
      const sessionStr = await safeStorage.getItem('user_session');
      if (sessionStr) {
        const session = JSON.parse(sessionStr);
        loggedInUserId = (session.user || session).id;
      }

      // Fetch sent notifications (global broadcasts)
      let query = supabase
        .from('push_notifications')
        .select('*')
        .eq('status', 'sent');

      const { data, error } = await query
        .order('scheduled_date', { ascending: false })
        .order('scheduled_time', { ascending: false });

      if (error) throw error;

      // Fetch read notification IDs from safeStorage
      const storedReadIds = await safeStorage.getItem('read_notification_ids');
      if (storedReadIds) {
        setReadNotificationIds(JSON.parse(storedReadIds));
      }

      // Fetch deleted notification IDs from safeStorage
      const storedDeletedIds = await safeStorage.getItem('deleted_notification_ids');
      if (storedDeletedIds) {
        setDeletedNotificationIds(JSON.parse(storedDeletedIds));
      }

      setNotifications(data || []);
    } catch (err) {
      console.error('[Notifications Screen] Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const markAllRead = async () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const allIds = notifications.map(n => n.id);
    setReadNotificationIds(allIds);
    await safeStorage.setItem('read_notification_ids', JSON.stringify(allIds));
  };

  const clearNotification = async (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const updatedDeleted = [...deletedNotificationIds, id];
    setDeletedNotificationIds(updatedDeleted);
    await safeStorage.setItem('deleted_notification_ids', JSON.stringify(updatedDeleted));
  };

  const clearAll = async () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const allIds = notifications.map(n => n.id);
    setDeletedNotificationIds(allIds);
    await safeStorage.setItem('deleted_notification_ids', JSON.stringify(allIds));
  };

  const toggleRead = async (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    let updatedRead;
    if (readNotificationIds.includes(id)) {
      updatedRead = readNotificationIds.filter(x => x !== id);
    } else {
      updatedRead = [...readNotificationIds, id];
    }
    setReadNotificationIds(updatedRead);
    await safeStorage.setItem('read_notification_ids', JSON.stringify(updatedRead));
  };

  const getCategoryIcon = (type: string) => {
    switch (type) {
      case 'vrat': return <MaterialCommunityIcons name="alarm-bell" size={20} color="#ea580c" />;
      case 'coins': return <Ionicons name="sparkles" size={18} color="#f59e0b" />;
      case 'global': return <Ionicons name="globe" size={18} color="#059669" />;
      case 'generic': return <Ionicons name="notifications" size={18} color="#6366f1" />;
      default: return <Ionicons name="notifications" size={18} color="#64748b" />;
    }
  };

  const formatNotificationTime = (dateStr: string, timeStr: string) => {
    try {
      const [yyyy, mm, dd] = dateStr.split('-');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthName = months[parseInt(mm) - 1] || mm;
      
      const parts = timeStr.split(':');
      const hour = parseInt(parts[0]);
      const min = parts[1] || '00';
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const formattedHour = hour % 12 || 12;

      return `${monthName} ${dd}, ${yyyy} • ${formattedHour}:${min} ${ampm}`;
    } catch (e) {
      return `${dateStr} ${timeStr}`;
    }
  };

  // Filter out locally deleted notifications
  const activeNotifications = notifications.filter(n => !deletedNotificationIds.includes(n.id));

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
        {activeNotifications.length > 0 && (
          <View style={styles.metaRow}>
            <Text style={styles.unreadCountText}>
              {activeNotifications.filter(n => !readNotificationIds.includes(n.id)).length} {t('unread notifications')}
            </Text>
            <TouchableOpacity onPress={clearAll} activeOpacity={0.7}>
              <Text style={styles.clearAllText}>{t('Clear All')}</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#ea580c" />
            <Text style={{ marginTop: 12, fontSize: 13, color: '#64748b', fontFamily: 'Outfit-Medium' }}>
              {t('Retrieving announcements...')}
            </Text>
          </View>
        ) : activeNotifications.length > 0 ? (
          <View style={styles.listContainer}>
            {activeNotifications.map((item) => {
              const isRead = readNotificationIds.includes(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[styles.notificationCard, !isRead && styles.notificationCardUnread]}
                  activeOpacity={0.9}
                  onPress={() => toggleRead(item.id)}
                >
                  {/* Left category icon circle */}
                  <View style={[styles.iconCircle, { backgroundColor: isRead ? '#f1f5f9' : '#fff7ed' }]}>
                    {getCategoryIcon(item.notification_type)}
                  </View>

                  {/* Body Column */}
                  <View style={styles.cardBody}>
                    <View style={styles.cardHeaderRow}>
                      <Text style={[styles.cardTitleText, !isRead && styles.cardTitleTextBold]}>
                        {t(item.title)}
                      </Text>
                      {!isRead && <View style={styles.unreadDot} />}
                    </View>

                    <Text style={styles.cardDescText}>{t(item.body)}</Text>

                    {item.image_url && (
                      <Image
                        source={{ uri: item.image_url }}
                        style={styles.notificationImage}
                        resizeMode="cover"
                      />
                    )}
                    
                    <View style={styles.footerRow}>
                      <Text style={styles.timeText}>
                        {formatNotificationTime(item.scheduled_date, item.scheduled_time)}
                      </Text>
                      {item.notification_type === 'coins' && item.coin_amount && (
                        <View style={styles.badge}>
                          <Ionicons name="sparkles" size={10} color="#eab308" />
                          <Text style={styles.badgeText}>+{item.coin_amount} Coins</Text>
                        </View>
                      )}
                      {item.notification_type === 'vrat' && item.target_vrat_id && (
                        <TouchableOpacity
                          style={styles.actionLink}
                          onPress={() => router.push({ pathname: '/spiritual_calendar', params: { viewDate: item.target_vrat_id } })}
                        >
                          <Text style={styles.actionLinkText}>{t('View Vrat')}</Text>
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
              );
            })}
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
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
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
  notificationImage: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    marginTop: 4,
    marginBottom: 10,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
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
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#fef9c3',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 9.5,
    fontFamily: 'Outfit-Bold',
    color: '#a16207',
  }
});
