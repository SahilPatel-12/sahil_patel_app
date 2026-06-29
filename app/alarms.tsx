import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  StatusBar,
  Dimensions,
  Platform,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Colors } from '../constants/Colors';
import { AlarmSystem, AlarmDetails } from '../services/AlarmSystem';
import { bhajanSupabase } from '../services/bhajanSupabase';
import AndroidWheelPicker from '../components/AndroidWheelPicker';

const { width } = Dimensions.get('window');

// Map category to photographic deity images from assets/God (same as music.tsx)
const getDeityAvatar = (name: string, iconUrl?: string) => {
  if (iconUrl && iconUrl.trim() !== '') {
    return { uri: iconUrl };
  }
  const normalized = name.toLowerCase();
  if (normalized.includes('shiv')) return require('../assets/God/god1.png');
  if (normalized.includes('laxmi') || normalized.includes('lakshmi')) return require('../assets/God/god.png');
  if (normalized.includes('ganesh')) return require('../assets/God/Mahakal Ujjain.png');
  if (normalized.includes('hanuman')) return require('../assets/God/_ (5).jpeg');
  if (normalized.includes('durga')) return require('../assets/God/Kedarnath.png');
  if (normalized.includes('krishna')) return require('../assets/God/Omkarashwar.png');
  if (normalized.includes('venkat')) return require('../assets/God/Lord Venkateswara Images Full Hd Wallpaper 1.png');
  return require('../assets/God/god1.png');
};

export default function AlarmsScreen() {
  const [alarms, setAlarms] = useState<AlarmDetails[]>([]);
  const [tracks, setTracks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Alarm creation / edit modal states
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [alarmHour, setAlarmHour] = useState(6);
  const [alarmMinute, setAlarmMinute] = useState(0);
  const [alarmPeriod, setAlarmPeriod] = useState<'AM' | 'PM'>('AM');
  const [alarmLabel, setAlarmLabel] = useState('Morning Puja');
  const [alarmRepeatType, setAlarmRepeatType] = useState<'ONCE' | 'DAILY' | 'WEEKDAYS' | 'CUSTOM' | 'MUHURTA'>('DAILY');
  const [alarmWeekdaysMask, setAlarmWeekdaysMask] = useState(62); // Mon-Fri
  const [selectedTrack, setSelectedTrack] = useState<any>(null);
  const [isChantDropdownVisible, setIsChantDropdownVisible] = useState(false);
  const [isSavingAlarm, setIsSavingAlarm] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadStatusText, setDownloadStatusText] = useState('Downloading devotional chant...');

  // Fetch alarms and tracks on mount
  const loadData = async () => {
    try {
      setLoading(true);
      // Fetch current alarms
      const list = await AlarmSystem.getAlarms();
      setAlarms(list);

      // Fetch bhajans/chants to link IDs to info
      const { data, error } = await bhajanSupabase
        .from('bhajans')
        .select('*')
        .eq('is_visible', true)
        .order('title', { ascending: true });

      if (error) console.error('Error loading bhajans in Alarms screen:', error);
      if (data) {
        const formatted = data.map((b: any) => ({
          id: b.id,
          title: b.title,
          artist: b.category || 'Vedic Devotion',
          url: b.url,
          thumbnail: b.thumbnail,
          category: b.category,
        }));
        setTracks(formatted);
        if (formatted.length > 0) {
          setSelectedTrack(formatted[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Time Picker helper arrays
  const hourItems = useMemo(() => ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12"], []);
  const minuteItems = useMemo(() => Array.from({ length: 60 }, (_, i) => i < 10 ? '0' + i : i.toString()), []);
  const periodItems = useMemo(() => ["AM", "PM"], []);

  const incrementHour = () => {
    setAlarmHour(h => {
      let nextH = h === 12 ? 1 : h + 1;
      if (h === 11) {
        setAlarmPeriod(p => p === 'AM' ? 'PM' : 'AM');
      }
      return nextH;
    });
  };

  const decrementHour = () => {
    setAlarmHour(h => {
      let nextH = h === 1 ? 12 : h - 1;
      if (h === 12) {
        setAlarmPeriod(p => p === 'AM' ? 'PM' : 'AM');
      }
      return nextH;
    });
  };

  const handleHourChange = (newHourVal: string) => {
    const newH = parseInt(newHourVal, 10);
    const oldH = alarmHour;
    if (oldH !== newH) {
      if ((oldH === 11 && newH === 12) || (oldH === 12 && newH === 11)) {
        setAlarmPeriod(p => p === 'AM' ? 'PM' : 'AM');
      }
      setAlarmHour(newH);
    }
  };

  const handleMinuteChange = (newMinVal: string) => {
    const newMin = parseInt(newMinVal, 10);
    const oldMin = alarmMinute;
    
    if (oldMin !== newMin) {
      if (newMin - oldMin < -30) {
        incrementHour();
      } else if (newMin - oldMin > 30) {
        decrementHour();
      }
      setAlarmMinute(newMin);
    }
  };

  const handleToggleAlarm = async (id: string, enabled: boolean) => {
    try {
      const success = await AlarmSystem.enableAlarm(id, enabled);
      if (success) {
        setAlarms(prev =>
          prev.map(a => (a.id === id ? { ...a, enabled } : a))
        );
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to toggle alarm status');
    }
  };

  const handleDeleteAlarm = async (id: string) => {
    Alert.alert('Delete Alarm', 'Are you sure you want to delete this devotional alarm?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            const success = await AlarmSystem.deleteAlarm(id);
            if (success) {
              setAlarms(prev => prev.filter(a => a.id !== id));
            }
          } catch (e) {
            Alert.alert('Error', 'Failed to delete alarm');
          }
        },
      },
    ]);
  };

  const handleSaveAlarm = async () => {
    if (!selectedTrack) {
      Alert.alert('Chant Required', 'Please select a devotional chant for this alarm.');
      return;
    }

    if (!AlarmSystem.isBridgeAvailable()) {
      Alert.alert(
        'Devotional Alarms ⏰',
        'Alarms require a custom development build or production release build. They are not supported on iOS or inside the default Expo Go app.'
      );
      return;
    }

    try {
      const now = new Date();
      let hour24 = alarmHour;
      if (alarmPeriod === 'PM' && alarmHour < 12) hour24 += 12;
      if (alarmPeriod === 'AM' && alarmHour === 12) hour24 = 0;

      const triggerDate = new Date();
      triggerDate.setHours(hour24);
      triggerDate.setMinutes(alarmMinute);
      triggerDate.setSeconds(0);
      triggerDate.setMilliseconds(0);

      if (triggerDate.getTime() <= now.getTime()) {
        triggerDate.setDate(triggerDate.getDate() + 1);
      }

      setIsSavingAlarm(true);
      setDownloadProgress(0.05);
      setDownloadStatusText('Connecting to server...');

      const id = Math.random().toString(36).substring(7);

      const success = await AlarmSystem.createAlarm({
        id,
        label: `${alarmLabel}|${selectedTrack.category || 'Shiv Ji'}`,
        musicId: selectedTrack.id,
        downloadUrl: selectedTrack.url,
        nextTrigger: triggerDate.getTime(),
        repeatType: alarmRepeatType,
        weekdaysMask: alarmRepeatType === 'DAILY' ? 127 : alarmRepeatType === 'WEEKDAYS' ? 62 : alarmWeekdaysMask,
        volume: 1.0,
        fadeInDuration: 10,
        vibration: true,
        flashlight: false
      });

      if (!success) {
        setIsSavingAlarm(false);
        Alert.alert('Error', 'Failed to configure alarm on device.');
        return;
      }

      // Smooth progress bar simulation
      let currentProgress = 0.05;
      const progressInterval = setInterval(() => {
        currentProgress += (1 - currentProgress) * 0.15; // asymptotic curve towards 100%
        setDownloadProgress(currentProgress);
        if (currentProgress < 0.3) {
          setDownloadStatusText('Downloading devotional chant...');
        } else if (currentProgress < 0.7) {
          setDownloadStatusText('Caching chant on device...');
        } else {
          setDownloadStatusText('Scheduling native alarm...');
        }
      }, 500);

      // Poll database to check when isDownloaded changes to true
      let pollCount = 0;
      const pollInterval = setInterval(async () => {
        pollCount++;
        const alarmsList = await AlarmSystem.getAlarms();
        const matched = alarmsList.find(a => a.id === id);
        
        if (matched && matched.isDownloaded) {
          // Success!
          clearInterval(progressInterval);
          clearInterval(pollInterval);
          setDownloadProgress(1);
          setDownloadStatusText('Alarm Set successfully! 🌸');
          
          setTimeout(async () => {
            setIsSavingAlarm(false);
            setIsModalVisible(false);
            // Refresh list
            const list = await AlarmSystem.getAlarms();
            setAlarms(list);
          }, 1500);
        } else if (pollCount > 25) { 
          // Timeout after 25 seconds
          clearInterval(progressInterval);
          clearInterval(pollInterval);
          setIsSavingAlarm(false);
          Alert.alert(
            'Alarm Configured', 
            'Alarm is set. Chant is downloading in the background.'
          );
          setIsModalVisible(false);
          // Refresh list anyway
          const list = await AlarmSystem.getAlarms();
          setAlarms(list);
        }
      }, 1000);

    } catch (e: any) {
      setIsSavingAlarm(false);
      Alert.alert('Alarm Config Error', e.message || 'An unexpected error occurred.');
    }
  };

  const formatAlarmTime = (timestampMs: number) => {
    const d = new Date(timestampMs);
    let hours = d.getHours();
    const minutes = d.getMinutes();
    const period = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12; // hour 0 is 12
    return `${hours}:${minutes < 10 ? '0' : ''}${minutes} ${period}`;
  };

  const formatWeekdays = (mask: number, repeatType: string) => {
    if (repeatType === 'DAILY') return 'Daily';
    if (repeatType === 'WEEKDAYS') return 'Weekdays (Mon-Fri)';
    if (repeatType === 'ONCE') return 'Once';
    if (repeatType === 'MUHURTA') return 'Brahma Muhurta';
    
    const days = [];
    if (mask & 1) days.push('Sun');
    if (mask & 2) days.push('Mon');
    if (mask & 4) days.push('Tue');
    if (mask & 8) days.push('Wed');
    if (mask & 16) days.push('Thu');
    if (mask & 32) days.push('Fri');
    if (mask & 64) days.push('Sat');

    if (days.length === 7) return 'Daily';
    if (days.length === 0) return 'Once';
    return days.join(', ');
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {/* Header Row */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={24} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Devotional Alarms</Text>
        <TouchableOpacity 
          style={styles.addHeaderBtn} 
          onPress={() => setIsModalVisible(true)} 
          activeOpacity={0.7}
        >
          <Ionicons name="add" size={26} color="#ea580c" />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#ea580c" />
          <Text style={styles.loaderText}>Loading alarms list...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
          {alarms.length === 0 ? (
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="alarm-outline" size={48} color="#ea580c" />
              </View>
              <Text style={styles.emptyTitle}>No Alarms Scheduled</Text>
              <Text style={styles.emptySubtitle}>
                Add an alarm to wake up or pray to your favorite divine chants and mantras.
              </Text>
              <TouchableOpacity 
                style={styles.createBtn} 
                onPress={() => setIsModalVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.createBtnText}>Create Devotional Alarm</Text>
              </TouchableOpacity>
            </View>
          ) : (
            alarms.map((alarm) => {
              // Find track corresponding to musicId
              const matchedTrack = tracks.find(t => t.id === alarm.musicId);
              return (
                <View key={alarm.id} style={[styles.alarmCard, !alarm.enabled && styles.alarmCardDisabled]}>
                  <View style={styles.alarmCardHeader}>
                    <View style={styles.alarmTimeCol}>
                      <Text style={[styles.alarmTimeText, !alarm.enabled && styles.alarmTimeTextDisabled]}>
                        {formatAlarmTime(alarm.nextTrigger)}
                      </Text>
                      <Text style={styles.alarmWeekdaysText}>
                        {formatWeekdays(alarm.weekdaysMask, alarm.repeatType)}
                      </Text>
                    </View>
                    <Switch
                      value={alarm.enabled}
                      onValueChange={(val) => handleToggleAlarm(alarm.id, val)}
                      trackColor={{ false: '#cbd5e1', true: '#fed7aa' }}
                      thumbColor={alarm.enabled ? '#ea580c' : '#94a3b8'}
                    />
                  </View>

                  <View style={styles.divider} />

                  <View style={styles.alarmCardFooter}>
                    <View style={styles.trackInfoRow}>
                      <Image
                        source={getDeityAvatar(matchedTrack?.category || '', matchedTrack?.thumbnail)}
                        style={styles.trackThumbnail}
                      />
                      <View style={styles.trackMetaCol}>
                        <Text style={styles.alarmLabelText} numberOfLines={1}>
                          {alarm.label.split('|')[0]}
                        </Text>
                        <Text style={styles.trackTitleText} numberOfLines={1}>
                          🎵 {matchedTrack ? matchedTrack.title : 'Devotional Chant'}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity 
                      style={styles.deleteCardBtn} 
                      onPress={() => handleDeleteAlarm(alarm.id)}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Alarm Modal Form */}
      <Modal
        visible={isModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={20} style={StyleSheet.absoluteFillObject} />
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Set Devotional Alarm</Text>
              <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color="#475569" />
              </TouchableOpacity>
            </View>

            {isSavingAlarm ? (
              <View style={{ paddingVertical: 45, paddingHorizontal: 10, alignItems: 'center', justifyContent: 'center' }}>
                <ActivityIndicator size="large" color="#ea580c" />
                <Text style={{
                  fontSize: 16,
                  fontFamily: 'Outfit-Bold',
                  color: '#0f172a',
                  marginTop: 20,
                  marginBottom: 10,
                  textAlign: 'center',
                }}>
                  {downloadStatusText}
                </Text>
                
                {/* Progress Bar */}
                <View style={{
                  width: '100%',
                  height: 6,
                  backgroundColor: '#f1f5f9',
                  borderRadius: 3,
                  overflow: 'hidden',
                  marginTop: 10,
                  marginBottom: 20,
                }}>
                  <View style={{
                    width: `${downloadProgress * 100}%`,
                    height: '100%',
                    backgroundColor: '#ea580c',
                    borderRadius: 3,
                  }} />
                </View>
                
                <Text style={{
                  fontSize: 13,
                  fontFamily: 'Outfit-Medium',
                  color: '#64748b',
                  textAlign: 'center',
                }}>
                  Downloading "{selectedTrack?.title}" for offline playback.
                </Text>
              </View>
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.modalScroll}>
                
                {/* Android-style scroll wheels */}
                <Text style={styles.sectionLabel}>Time</Text>
                <View style={styles.wheelPickerContainer}>
                  <AndroidWheelPicker
                    items={hourItems}
                    selectedValue={alarmHour.toString()}
                    onValueChange={handleHourChange}
                    width={75}
                  />
                  <Text style={styles.colonText}>:</Text>
                  <AndroidWheelPicker
                    items={minuteItems}
                    selectedValue={alarmMinute < 10 ? '0' + alarmMinute : alarmMinute.toString()}
                    onValueChange={handleMinuteChange}
                    width={75}
                  />
                  <AndroidWheelPicker
                    items={periodItems}
                    selectedValue={alarmPeriod}
                    onValueChange={(val) => setAlarmPeriod(val as any)}
                    width={75}
                  />
                </View>

                {/* Chant Selection */}
                <Text style={styles.sectionLabel}>Select Divine Chant</Text>
                <TouchableOpacity 
                  style={styles.chantSelectorBtn} 
                  onPress={() => setIsChantDropdownVisible(true)}
                  activeOpacity={0.75}
                >
                  <View style={styles.chantSelectorInfo}>
                    <Image
                      source={getDeityAvatar(selectedTrack?.category || '', selectedTrack?.thumbnail)}
                      style={styles.chantSelectorThumb}
                    />
                    <View style={{ marginLeft: 8 }}>
                      <Text style={styles.selectedChantTitle} numberOfLines={1}>
                        {selectedTrack ? selectedTrack.title : 'Choose a chant'}
                      </Text>
                      <Text style={styles.selectedChantArtist} numberOfLines={1}>
                        {selectedTrack ? selectedTrack.category : 'Vedic Chanting'}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-down" size={18} color="#ea580c" />
                </TouchableOpacity>

                {/* Alarm Label Input */}
                <Text style={styles.sectionLabel}>Alarm Label</Text>
                <TextInput
                  style={styles.labelInput}
                  placeholder="Morning Jaap, Evening Aarti..."
                  placeholderTextColor="#94a3b8"
                  value={alarmLabel}
                  onChangeText={setAlarmLabel}
                />

                {/* Repeat options */}
                <Text style={styles.sectionLabel}>Repeat Interval</Text>
                <View style={styles.repeatGrid}>
                  {[
                    { label: 'Once', value: 'ONCE' },
                    { label: 'Daily', value: 'DAILY' },
                    { label: 'Weekdays', value: 'WEEKDAYS' },
                    { label: 'Custom', value: 'CUSTOM' },
                    { label: 'Brahma Muhurta', value: 'MUHURTA' }
                  ].map((item) => (
                    <TouchableOpacity
                      key={item.value}
                      style={[styles.repeatPill, alarmRepeatType === item.value && styles.repeatPillActive]}
                      onPress={() => setAlarmRepeatType(item.value as any)}
                    >
                      <Text style={[styles.repeatPillText, alarmRepeatType === item.value && styles.repeatPillTextActive]}>
                        {item.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Custom Weekdays Picker Row */}
                {alarmRepeatType === 'CUSTOM' && (
                  <View style={styles.weekdaysRow}>
                    {[
                      { label: 'Su', mask: 1 },
                      { label: 'Mo', mask: 2 },
                      { label: 'Tu', mask: 4 },
                      { label: 'We', mask: 8 },
                      { label: 'Th', mask: 16 },
                      { label: 'Fr', mask: 32 },
                      { label: 'Sa', mask: 64 }
                    ].map((day) => {
                      const active = (alarmWeekdaysMask & day.mask) !== 0;
                      return (
                        <TouchableOpacity
                          key={day.mask}
                          style={[styles.weekdayCircle, active && styles.weekdayCircleActive]}
                          onPress={() => {
                            if (active) {
                              setAlarmWeekdaysMask(mask => mask & ~day.mask);
                            } else {
                              setAlarmWeekdaysMask(mask => mask | day.mask);
                            }
                          }}
                        >
                          <Text style={[styles.weekdayText, active && styles.weekdayTextActive]}>
                            {day.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )}

                {/* Save Button */}
                <TouchableOpacity 
                  style={styles.saveBtn} 
                  onPress={handleSaveAlarm}
                  activeOpacity={0.8}
                >
                  <Text style={styles.saveBtnText}>Save Alarm</Text>
                </TouchableOpacity>
                
                <View style={{ height: 40 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Chant Selection Modal Dropdown */}
      <Modal
        visible={isChantDropdownVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsChantDropdownVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <BlurView intensity={20} style={StyleSheet.absoluteFillObject} />
          <View style={[styles.modalContent, { height: '65%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Choose Divine Chant</Text>
              <TouchableOpacity onPress={() => setIsChantDropdownVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={22} color="#475569" />
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
              {tracks.map((track) => {
                const isSelected = selectedTrack?.id === track.id;
                return (
                  <TouchableOpacity
                    key={track.id}
                    style={[styles.trackSelectItem, isSelected && styles.trackSelectItemActive]}
                    onPress={() => {
                      setSelectedTrack(track);
                      setIsChantDropdownVisible(false);
                    }}
                  >
                    <Image
                      source={getDeityAvatar(track.category || '', track.thumbnail)}
                      style={styles.chantSelectorThumb}
                    />
                    <View style={{ flex: 1, marginLeft: 10 }}>
                      <Text style={[styles.trackSelectTitle, isSelected && styles.trackSelectTitleActive]}>
                        {track.title}
                      </Text>
                      <Text style={styles.trackSelectArtist}>{track.artist}</Text>
                    </View>
                    {isSelected && (
                      <Ionicons name="checkmark-circle" size={20} color="#ea580c" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
    color: '#0f172a',
  },
  addHeaderBtn: {
    padding: 4,
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748b',
    fontFamily: 'Outfit-Medium',
  },
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#fff7ed',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    borderWidth: 2,
    borderColor: '#ffedd5',
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
    color: '#0f172a',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    fontFamily: 'Outfit-Regular',
    lineHeight: 20,
    marginBottom: 24,
  },
  createBtn: {
    backgroundColor: '#ea580c',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 24,
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  createBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontFamily: 'Outfit-Bold',
  },
  alarmCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#f1f5f9',
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  alarmCardDisabled: {
    borderColor: '#f8fafc',
    backgroundColor: '#f8fafc',
  },
  alarmCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alarmTimeCol: {
    flex: 1,
  },
  alarmTimeText: {
    fontSize: 26,
    fontFamily: 'Outfit-Bold',
    color: '#0f172a',
  },
  alarmTimeTextDisabled: {
    color: '#94a3b8',
  },
  alarmWeekdaysText: {
    fontSize: 13,
    color: '#ea580c',
    fontFamily: 'Outfit-Medium',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 12,
  },
  alarmCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  trackInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  trackThumbnail: {
    width: 38,
    height: 38,
    borderRadius: 8,
  },
  trackMetaCol: {
    marginLeft: 10,
    flex: 1,
  },
  alarmLabelText: {
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
    color: '#1e293b',
  },
  trackTitleText: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'Outfit-Medium',
    marginTop: 2,
  },
  deleteCardBtn: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingHorizontal: 20,
    paddingTop: 16,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  modalTitle: {
    fontSize: 17,
    fontFamily: 'Outfit-Bold',
    color: '#0f172a',
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalScroll: {
    paddingTop: 16,
  },
  sectionLabel: {
    fontSize: 13,
    fontFamily: 'Outfit-Bold',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
    marginTop: 14,
  },
  wheelPickerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginVertical: 10,
  },
  colonText: {
    fontSize: 24,
    fontFamily: 'Outfit-Bold',
    color: '#f97316',
  },
  chantSelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff7ed',
    borderWidth: 1.5,
    borderColor: '#fed7aa',
    borderRadius: 16,
    padding: 12,
    marginBottom: 6,
  },
  chantSelectorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  chantSelectorThumb: {
    width: 40,
    height: 40,
    borderRadius: 8,
  },
  selectedChantTitle: {
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
    color: '#0f172a',
    maxWidth: width - 150,
  },
  selectedChantArtist: {
    fontSize: 12,
    color: '#ea580c',
    fontFamily: 'Outfit-Medium',
    marginTop: 2,
  },
  labelInput: {
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    fontFamily: 'Outfit-Medium',
    color: '#0f172a',
    marginBottom: 6,
    backgroundColor: '#f8fafc',
  },
  repeatGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 6,
  },
  repeatPill: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  repeatPillActive: {
    backgroundColor: '#ea580c',
    borderColor: '#ea580c',
  },
  repeatPillText: {
    fontSize: 13,
    color: '#475569',
    fontFamily: 'Outfit-Medium',
  },
  repeatPillTextActive: {
    color: '#ffffff',
    fontFamily: 'Outfit-Bold',
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 12,
  },
  weekdayCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayCircleActive: {
    backgroundColor: '#ea580c',
    borderColor: '#ea580c',
  },
  weekdayText: {
    fontSize: 12,
    color: '#475569',
    fontFamily: 'Outfit-Bold',
  },
  weekdayTextActive: {
    color: '#ffffff',
  },
  saveBtn: {
    backgroundColor: '#ea580c',
    borderRadius: 24,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  saveBtnText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
  },
  trackSelectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  trackSelectItemActive: {
    backgroundColor: '#fff7ed',
  },
  trackSelectTitle: {
    fontSize: 14,
    fontFamily: 'Outfit-Bold',
    color: '#0f172a',
  },
  trackSelectTitleActive: {
    color: '#ea580c',
  },
  trackSelectArtist: {
    fontSize: 12,
    color: '#64748b',
    fontFamily: 'Outfit-Medium',
    marginTop: 2,
  },
});
