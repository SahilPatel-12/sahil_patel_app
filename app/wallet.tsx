import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Dimensions,
  Modal,
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeInDown, Layout } from 'react-native-reanimated';
import { useLanguage } from '../context/LanguageContext';
import { safeStorage } from '../services/storage';
import { supabase } from '../services/supabase';
import { Image as ExpoImage } from 'expo-image';
import { Colors } from '../constants/Colors';

const { width } = Dimensions.get('window');

interface Transaction {
  id: string;
  amount: number;
  type: string;
  recipient_phone?: string;
  created_at: string;
}

const COIN_PACKS = [
  { id: 'pack-1', coins: 50, price: 50, title: 'Sankalp Starter', badge: 'Popular' },
  { id: 'pack-2', coins: 100, price: 90, title: 'Spiritual Bhakt', badge: 'Save 10%' },
  { id: 'pack-3', coins: 250, price: 200, title: 'Maha Devotee', badge: 'Best Value' },
];

export default function WalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  
  const [userId, setUserId] = useState<string | null>(null);
  const [userPhone, setUserPhone] = useState<string>('');
  const [balance, setBalance] = useState<number>(50);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  
  // Coin transfer form states
  const [transferPhone, setTransferPhone] = useState<string>('');
  const [transferAmount, setTransferAmount] = useState<string>('');
  const [isTransferring, setIsTransferring] = useState<boolean>(false);
  
  // Coin purchase states
  const [selectedPack, setSelectedPack] = useState<typeof COIN_PACKS[0] | null>(null);
  const [isPaying, setIsPaying] = useState<boolean>(false);

  const loadUserDataAndWallet = useCallback(async (showIndicator = true) => {
    if (showIndicator) setLoading(true);
    try {
      const sessionStr = await safeStorage.getItem('user_session');
      if (!sessionStr) {
        Alert.alert(
          t('Authentication Required'),
          t('Please log in to view and use the coin wallet system.'),
          [
            { text: t('Go to Login'), onPress: () => router.push('/login') },
            { text: t('Cancel'), style: 'cancel' }
          ]
        );
        setLoading(false);
        return;
      }
      
      const session = JSON.parse(sessionStr);
      const activeUserId = session.id;
      setUserId(activeUserId);
      setUserPhone(session.phone || '');

      // 1. Fetch/Initialize wallet
      const { data: walletData, error: walletError } = await supabase
        .from('user_wallets')
        .select('balance')
        .eq('user_id', activeUserId)
        .maybeSingle();

      if (walletError) throw walletError;

      let currentBalance = 50;
      if (!walletData) {
        // Self-heal: Create missing wallet for existing user
        console.log('[Wallet] Creating missing wallet for user:', activeUserId);
        await supabase
          .from('user_wallets')
          .insert({ user_id: activeUserId, balance: 50 });
        
        await supabase
          .from('coin_transactions')
          .insert({ user_id: activeUserId, amount: 50, type: 'signup_bonus' });
          
        currentBalance = 50;
      } else {
        currentBalance = walletData.balance;
      }
      setBalance(currentBalance);

      // 2. Fetch Transactions
      const { data: txData, error: txError } = await supabase
        .from('coin_transactions')
        .select('*')
        .eq('user_id', activeUserId)
        .order('created_at', { ascending: false });

      if (txError) throw txError;
      setTransactions(txData || []);

    } catch (err: any) {
      console.error('[Wallet] Error loading data:', err);
      Alert.alert(t('Error'), err.message || t('Failed to load wallet data.'));
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [router, t]);

  useEffect(() => {
    loadUserDataAndWallet();
  }, [loadUserDataAndWallet]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    loadUserDataAndWallet(false);
  };

  const handleTransfer = async () => {
    if (!userId) return;
    
    // Clean inputs
    const cleanPhone = transferPhone.trim();
    const amount = parseInt(transferAmount);

    if (!cleanPhone) {
      Alert.alert(t('Input Required'), t('Please enter a recipient phone number.'));
      return;
    }
    
    // Format recipient phone number to match DB formats
    let recipientPhoneFormatted = cleanPhone;
    if (!recipientPhoneFormatted.startsWith('+') && !recipientPhoneFormatted.startsWith('0')) {
      // Default prefix if missing, e.g. +91
      recipientPhoneFormatted = `+91${recipientPhoneFormatted}`;
    }

    if (isNaN(amount) || amount <= 0) {
      Alert.alert(t('Invalid Amount'), t('Please enter a positive amount of coins to share.'));
      return;
    }

    if (amount > balance) {
      Alert.alert(t('Insufficient Coins'), t('You do not have enough coins in your wallet.'));
      return;
    }

    if (recipientPhoneFormatted === userPhone) {
      Alert.alert(t('Invalid Transfer'), t('You cannot transfer coins to yourself.'));
      return;
    }

    setIsTransferring(true);
    try {
      // 1. Verify recipient devotee exists in database
      const { data: recipient, error: recError } = await supabase
        .from('app_users')
        .select('id, phone')
        .eq('phone', recipientPhoneFormatted)
        .maybeSingle();

      if (recError) throw recError;

      if (!recipient) {
        Alert.alert(
          t('User Not Found'),
          t('No devotee is registered under this phone number. Please verify the credentials.')
        );
        setIsTransferring(false);
        return;
      }

      // 2. Load recipient's current wallet to perform safe update
      const { data: recWallet } = await supabase
        .from('user_wallets')
        .select('balance')
        .eq('user_id', recipient.id)
        .maybeSingle();

      const recBalance = recWallet ? recWallet.balance : 50;

      // 3. Update databases atomically
      // Sender debit
      const { error: debitError } = await supabase
        .from('user_wallets')
        .upsert({ user_id: userId, balance: balance - amount, updated_at: new Date().toISOString() });

      if (debitError) throw debitError;

      // Recipient credit
      const { error: creditError } = await supabase
        .from('user_wallets')
        .upsert({ user_id: recipient.id, balance: recBalance + amount, updated_at: new Date().toISOString() });

      if (creditError) throw creditError;

      // Log transactions
      await supabase.from('coin_transactions').insert([
        {
          user_id: userId,
          amount: -amount,
          type: 'transfer_sent',
          recipient_phone: recipient.phone
        },
        {
          user_id: recipient.id,
          amount: amount,
          type: 'transfer_received'
        }
      ]);

      Alert.alert(t('Success'), `${amount} ` + t('coins shared successfully with devotee.'));
      setTransferPhone('');
      setTransferAmount('');
      loadUserDataAndWallet(false);

    } catch (err: any) {
      console.error('[Wallet] Transfer error:', err);
      Alert.alert(t('Transfer Failed'), err.message || t('Could not complete transaction.'));
    } finally {
      setIsTransferring(false);
    }
  };

  const handleBuyCoins = async () => {
    if (!userId || !selectedPack) return;

    setIsPaying(true);
    try {
      // Simulate Payment Gateway processing delay (1.5s)
      await new Promise(resolve => setTimeout(resolve, 1500));

      const newBalance = balance + selectedPack.coins;

      // 1. Update Wallet balance
      const { error: updateError } = await supabase
        .from('user_wallets')
        .upsert({ user_id: userId, balance: newBalance, updated_at: new Date().toISOString() });

      if (updateError) throw updateError;

      // 2. Log Purchase Transaction
      const { error: txError } = await supabase
        .from('coin_transactions')
        .insert({
          user_id: userId,
          amount: selectedPack.coins,
          type: 'purchase'
        });

      if (txError) throw txError;

      Alert.alert(
        t('Spiritual Coins Credited!'),
        `${selectedPack.coins} ` + t('coins successfully added to your spiritual wallet.')
      );
      
      setSelectedPack(null);
      loadUserDataAndWallet(false);
      
    } catch (err: any) {
      console.error('[Wallet] Purchase error:', err);
      Alert.alert(t('Purchase Failed'), err.message || t('Payment simulation failed.'));
    } finally {
      setIsPaying(false);
    }
  };

  const getTxTypeLabel = (type: string) => {
    switch (type) {
      case 'signup_bonus': return t('Welcome Gift');
      case 'purchase': return t('Wallet Top-up');
      case 'unlock_flower': return t('Unlocked Flower');
      case 'unlock_thali': return t('Unlocked Aarti Thali');
      case 'transfer_sent': return t('Coins Gifted');
      case 'transfer_received': return t('Coins Received');
      case 'admin_adjustment': return t('Admin Adjustment');
      case 'daily_puja_reward': return t('Devotional Reward');
      default: return t('Spiritual Action');
    }
  };

  const getTxTypeIcon = (type: string) => {
    switch (type) {
      case 'signup_bonus': return 'gift-outline';
      case 'purchase': return 'card-outline';
      case 'unlock_flower': return 'flower-outline';
      case 'unlock_thali': return 'flame-outline';
      case 'transfer_sent': return 'arrow-forward-outline';
      case 'transfer_received': return 'arrow-back-outline';
      case 'admin_adjustment': return 'construct-outline';
      case 'daily_puja_reward': return 'star-outline';
      default: return 'wallet-outline';
    }
  };

  const getTxIconColor = (amount: number) => {
    return amount > 0 ? '#10b981' : '#ef4444';
  };

  return (
    <View style={styles.mainContainer}>
      <StatusBar style="light" />
      <LinearGradient colors={['#1e293b', '#0f172a']} style={StyleSheet.absoluteFill} />

      <View style={[styles.header, { marginTop: Math.max(insets.top, 10) }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('Spiritual Wallet')}</Text>
        <TouchableOpacity style={styles.refreshButton} onPress={handleRefresh} disabled={isRefreshing}>
          <Ionicons name="refresh" size={20} color="#fff" style={isRefreshing && { transform: [{ rotate: '45deg' }] }} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#ea580c" />
          <Text style={styles.loaderText}>{t('Retrieving wallet details...')}</Text>
        </View>
      ) : (
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView 
              contentContainerStyle={styles.scrollContent} 
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Golden Balance Card */}
              <Animated.View entering={FadeInDown.duration(400)}>
                <LinearGradient
                  colors={['#ea580c', '#b45309', '#78350f']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.balanceCard}
                >
                  <View style={styles.balanceHeader}>
                    <Text style={styles.balanceLabel}>{t('Current Balance')}</Text>
                    <Ionicons name="medal-outline" size={24} color="#fef08a" />
                  </View>
                  <View style={styles.balanceValueRow}>
                    <Text style={styles.balanceSymbol}>🪙</Text>
                    <Text style={styles.balanceValue}>{balance}</Text>
                    <Text style={styles.balanceUnit}>{t('Coins')}</Text>
                  </View>
                  <Text style={styles.balanceDesc}>
                    {t('Use coins to unlock premium flower offerings (Rose, Lotus, Jasmine) for your pujas.')}
                  </Text>
                </LinearGradient>
              </Animated.View>

              {/* Buy Coins Packs Section */}
              <Text style={styles.sectionTitle}>{t('Get Spiritual Coins')}</Text>
              <View style={styles.packsGrid}>
                {COIN_PACKS.map((pack) => (
                  <TouchableOpacity
                    key={pack.id}
                    style={styles.packCard}
                    onPress={() => setSelectedPack(pack)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={['rgba(255, 255, 255, 0.05)', 'rgba(255, 255, 255, 0.01)']}
                      style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.packBadgeContainer}>
                      <Text style={styles.packBadge}>{t(pack.badge)}</Text>
                    </View>
                    <Text style={styles.packCoins}>🪙 {pack.coins}</Text>
                    <Text style={styles.packTitle}>{t(pack.title)}</Text>
                    <Text style={styles.packPrice}>₹{pack.price}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Share Coins Section */}
              <Text style={styles.sectionTitle}>{t('Gift Coins to Devotees')}</Text>
              <View style={styles.formCard}>
                <Text style={styles.formLabel}>{t('Recipient Phone Coordinates')}</Text>
                <View style={styles.inputRow}>
                  <Ionicons name="call-outline" size={20} color="#94a3b8" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. +91 9876543210"
                    placeholderTextColor="#64748b"
                    keyboardType="phone-pad"
                    value={transferPhone}
                    onChangeText={setTransferPhone}
                  />
                </View>

                <Text style={styles.formLabel}>{t('Amount to Transfer')}</Text>
                <View style={styles.inputRow}>
                  <Text style={styles.coinIndicator}>🪙</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 50"
                    placeholderTextColor="#64748b"
                    keyboardType="number-pad"
                    value={transferAmount}
                    onChangeText={setTransferAmount}
                  />
                </View>

                <TouchableOpacity
                  style={[styles.primaryButton, isTransferring && styles.disabledButton]}
                  onPress={handleTransfer}
                  disabled={isTransferring}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={['#ea580c', '#c2410c']}
                    style={styles.buttonGradient}
                  >
                    {isTransferring ? (
                      <ActivityIndicator size="small" color="#fff" />
                    ) : (
                      <>
                        <Ionicons name="paper-plane-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                        <Text style={styles.buttonText}>{t('Transfer Coins')}</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* Transaction History Section */}
              <Text style={styles.sectionTitle}>{t('Spiritual Transactions')}</Text>
              {transactions.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="time-outline" size={40} color="#475569" />
                  <Text style={styles.emptyText}>{t('No spiritual transactions logged yet.')}</Text>
                </View>
              ) : (
                <View style={styles.txList}>
                  {transactions.map((item) => (
                    <View key={item.id} style={styles.txItem}>
                      <View style={[styles.txIconContainer, { backgroundColor: getTxIconColor(item.amount) + '15' }]}>
                        <Ionicons name={getTxTypeIcon(item.type) as any} size={20} color={getTxIconColor(item.amount)} />
                      </View>
                      <View style={styles.txDetails}>
                        <Text style={styles.txTitle}>{getTxTypeLabel(item.type)}</Text>
                        <Text style={styles.txMeta}>
                          {new Date(item.created_at).toLocaleDateString()} {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {item.recipient_phone ? ` • ${t('To')}: ${item.recipient_phone}` : ''}
                        </Text>
                      </View>
                      <Text style={[styles.txAmount, { color: getTxIconColor(item.amount) }]}>
                        {item.amount > 0 ? `+${item.amount}` : item.amount}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </ScrollView>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      )}

      {/* Mock Payment Checkout Modal */}
      <Modal
        visible={selectedPack !== null}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedPack(null)}
      >
        <TouchableWithoutFeedback onPress={() => !isPaying && setSelectedPack(null)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                {selectedPack && (
                  <>
                    <View style={styles.modalHeader}>
                      <Text style={styles.modalTitle}>{t('Vedic Coin Checkout')}</Text>
                      {!isPaying && (
                        <TouchableOpacity onPress={() => setSelectedPack(null)}>
                          <Ionicons name="close" size={24} color="#94a3b8" />
                        </TouchableOpacity>
                      )}
                    </View>

                    <View style={styles.checkoutDetails}>
                      <View style={styles.checkoutItem}>
                        <Text style={styles.checkoutLabel}>{t('Selected Bundle')}</Text>
                        <Text style={styles.checkoutValue}>{t(selectedPack.title)}</Text>
                      </View>
                      <View style={styles.checkoutItem}>
                        <Text style={styles.checkoutLabel}>{t('Spiritual Coins')}</Text>
                        <Text style={styles.checkoutValue}>🪙 {selectedPack.coins}</Text>
                      </View>
                      <View style={[styles.checkoutItem, { borderBottomWidth: 0, paddingBottom: 0 }]}>
                        <Text style={styles.checkoutLabel}>{t('Payable Amount')}</Text>
                        <Text style={[styles.checkoutValue, styles.checkoutTotal]}>₹{selectedPack.price}</Text>
                      </View>
                    </View>

                    <Text style={styles.modalPrompt}>
                      {t('This is a simulated secure check-out. Tapping pay will immediately credit your coins.')}
                    </Text>

                    <TouchableOpacity
                      style={[styles.primaryButton, isPaying && styles.disabledButton]}
                      onPress={handleBuyCoins}
                      disabled={isPaying}
                      activeOpacity={0.8}
                    >
                      <LinearGradient
                        colors={['#10b981', '#059669']}
                        style={styles.buttonGradient}
                      >
                        {isPaying ? (
                          <ActivityIndicator size="small" color="#fff" />
                        ) : (
                          <>
                            <Ionicons name="shield-checkmark-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                            <Text style={styles.buttonText}>{t('Pay via Mock Gateway')}</Text>
                          </>
                        )}
                      </LinearGradient>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#0f172a',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  loaderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 15,
  },
  loaderText: {
    fontSize: 14,
    color: '#94a3b8',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 50,
  },
  balanceCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    elevation: 8,
    shadowColor: '#ea580c',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  balanceLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    textTransform: 'uppercase',
  },
  balanceValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
  },
  balanceSymbol: {
    fontSize: 28,
    marginRight: 6,
  },
  balanceValue: {
    fontSize: 38,
    fontWeight: '800',
    color: '#fff',
  },
  balanceUnit: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fef08a',
    marginLeft: 6,
  },
  balanceDesc: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.75)',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ea580c',
    marginBottom: 15,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  packsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 25,
  },
  packCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    overflow: 'hidden',
  },
  packBadgeContainer: {
    alignSelf: 'stretch',
    backgroundColor: '#b45309',
    marginHorizontal: -12,
    marginTop: -12,
    paddingVertical: 3,
    marginBottom: 10,
  },
  packBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'center',
  },
  packCoins: {
    fontSize: 16,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 4,
  },
  packTitle: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94a3b8',
    marginBottom: 12,
    textAlign: 'center',
  },
  packPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: '#10b981',
  },
  formCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 16,
    marginBottom: 25,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94a3b8',
    marginBottom: 6,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 15,
  },
  inputIcon: {
    marginRight: 8,
  },
  coinIndicator: {
    fontSize: 18,
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  primaryButton: {
    height: 48,
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
  },
  emptyContainer: {
    alignItems: 'center',
    padding: 40,
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.01)',
    borderRadius: 16,
  },
  emptyText: {
    fontSize: 13,
    color: '#475569',
    textAlign: 'center',
  },
  txList: {
    gap: 12,
  },
  txItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
  },
  txIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  txDetails: {
    flex: 1,
  },
  txTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 3,
  },
  txMeta: {
    fontSize: 11,
    color: '#64748b',
  },
  txAmount: {
    fontSize: 14,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: width - 40,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#fff',
  },
  checkoutDetails: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    marginBottom: 15,
  },
  checkoutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
    paddingBottom: 12,
    marginBottom: 12,
  },
  checkoutLabel: {
    fontSize: 13,
    color: '#94a3b8',
  },
  checkoutValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#fff',
  },
  checkoutTotal: {
    fontSize: 18,
    color: '#10b981',
  },
  modalPrompt: {
    fontSize: 11,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 16,
    marginBottom: 20,
  },
});
