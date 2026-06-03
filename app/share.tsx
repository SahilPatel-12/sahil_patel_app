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
  UIManager,
  Clipboard
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useLanguage } from '../context/LanguageContext';

const { width } = Dimensions.get('window');

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function ShareScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);
  const [shareStatus, setShareStatus] = useState<string | null>(null);
  
  const referralCode = 'DIVINE50';

  const handleCopyCode = () => {
    Clipboard.setString(referralCode);
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setCopied(true);
    setTimeout(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setCopied(false);
    }, 2000);
  };

  const triggerShareAction = (platform: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setShareStatus(`${t('Spreading holy blessings via')} ${platform}!`);
    setTimeout(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setShareStatus(null);
    }, 2500);
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

          <Text style={styles.headerTitleText}>{t('Share Blessings')}</Text>

          {/* Spacer */}
          <View style={{ width: 38 }} />
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {shareStatus && (
          <View style={styles.shareStatusPill}>
            <Ionicons name="paper-plane" size={14} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.shareStatusText}>{shareStatus}</Text>
          </View>
        )}

        {/* Invite & Earn Banner */}
        <LinearGradient
          colors={['#ea580c', '#f97316', '#b45309']}
          style={styles.invitationCard}
        >
          <View style={styles.invitationHeader}>
            <Text style={styles.invitationBadge}>{t('Vedic Referral Program')}</Text>
            <Ionicons name="gift" size={24} color="#ffffff" />
          </View>

          <Text style={styles.invitationTitle}>{t('Invite Friends & Earn Free Coins')}</Text>
          
          <Text style={styles.invitationDesc}>
            {t('Share the sacred experience of Mantra Puja. When your friends register using your unique link, they instantly receive')} <Text style={styles.boldGlow}>100 {t('Free Coins')}</Text> {t('and you earn')} <Text style={styles.boldGlow}>50 {t('Coins')}</Text> {t('for every successful refer!')}
          </Text>

          <View style={styles.cardDividerGlow} />

          <View style={styles.statsMiniRow}>
            <View style={styles.statBox}>
              <Text style={styles.statVal}>8</Text>
              <Text style={styles.statLabel}>{t('FRIENDS INVITED')}</Text>
            </View>
            <View style={styles.statBoxBorder} />
            <View style={styles.statBox}>
              <Text style={styles.statVal}>400</Text>
              <Text style={styles.statLabel}>{t('COINS EARNED')}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Referral Code Box */}
        <View style={styles.cardContainer}>
          <Text style={styles.sectionLabelTitle}>{t('YOUR UNIQUE REFERRAL CODE')}</Text>
          <Text style={styles.sectionDescText}>
            {t('Share this code with your loved ones to apply during login or booking setup.')}
          </Text>

          <View style={styles.referralCodeBox}>
            <View style={styles.codeColumn}>
              <Text style={styles.codeText}>{referralCode}</Text>
            </View>
            <TouchableOpacity
              style={[styles.copyBtn, copied && styles.copyBtnSuccess]}
              onPress={handleCopyCode}
              activeOpacity={0.8}
            >
              <Ionicons name={copied ? "checkmark-done" : "copy-outline"} size={16} color="#ffffff" style={{ marginRight: 4 }} />
              <Text style={styles.copyBtnText}>{copied ? t('COPIED!') : t('COPY CODE')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Social sharing links grid */}
        <View style={styles.cardContainer}>
          <Text style={styles.sectionLabelTitle}>{t('SHARE BLISSFUL LINK DIRECTLY')}</Text>
          <Text style={styles.sectionDescText}>
            {t('Send customized invitation templates directly using your favorite chat tools.')}
          </Text>

          <View style={styles.sharingGridRow}>
            <TouchableOpacity
              style={styles.sharingGridCell}
              onPress={() => triggerShareAction('WhatsApp')}
              activeOpacity={0.8}
            >
              <View style={[styles.socialIconBox, { backgroundColor: '#25d366' }]}>
                <Ionicons name="logo-whatsapp" size={24} color="#ffffff" />
              </View>
              <Text style={styles.socialLabel}>{t('WhatsApp')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sharingGridCell}
              onPress={() => triggerShareAction('Telegram')}
              activeOpacity={0.8}
            >
              <View style={[styles.socialIconBox, { backgroundColor: '#0088cc' }]}>
                <MaterialCommunityIcons name={"telegram" as any} size={24} color="#ffffff" />
              </View>
              <Text style={styles.socialLabel}>{t('Telegram')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sharingGridCell}
              onPress={() => triggerShareAction('Messenger')}
              activeOpacity={0.8}
            >
              <View style={[styles.socialIconBox, { backgroundColor: '#00c6ff' }]}>
                <MaterialCommunityIcons name={"facebook-messenger" as any} size={24} color="#ffffff" />
              </View>
              <Text style={styles.socialLabel}>{t('Messenger')}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.sharingGridCell}
              onPress={() => triggerShareAction('Message SMS')}
              activeOpacity={0.8}
            >
              <View style={[styles.socialIconBox, { backgroundColor: '#ea580c' }]}>
                <Ionicons name="chatbubble-ellipses" size={22} color="#ffffff" />
              </View>
              <Text style={styles.socialLabel}>{t('SMS Text')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Referral Milestones */}
        <View style={styles.cardContainer}>
          <Text style={styles.sectionLabelTitle}>{t('DEVOTIONAL REFERRAL REWARDS')}</Text>
          
          <View style={styles.milestoneCard}>
            <View style={styles.milestoneHeader}>
              <View style={styles.milestoneIconCircle}>
                <Ionicons name="ribbon" size={20} color="#ea580c" />
              </View>
              <View style={styles.milestoneHeaderInfo}>
                <Text style={styles.milestoneTitleText}>{t('Level 1: Golden Ganesha Pendant')}</Text>
                <Text style={styles.milestoneSubtitleText}>{t('Invite 10 friends to unlock consecrated brass deity wear.')}</Text>
              </View>
            </View>

            {/* Stepper Progress */}
            <View style={styles.progressSliderBg}>
              <View style={[styles.progressSliderFill, { width: '80%' }]} />
            </View>
            <View style={styles.progressSliderMetrics}>
              <Text style={styles.progressSliderText}>8 {t('referred')}</Text>
              <Text style={styles.progressSliderTextBold}>2 {t('more to go')}</Text>
            </View>
          </View>
        </View>
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
  scrollContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  shareStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginBottom: 16,
    alignSelf: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  shareStatusText: {
    color: '#ffffff',
    fontSize: 12.5,
    fontFamily: 'Outfit-Bold',
  },
  invitationCard: {
    borderRadius: 24,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#b45309',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  invitationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  invitationBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    color: '#ffffff',
    fontSize: 10,
    fontFamily: 'Outfit-Bold',
    textTransform: 'uppercase',
  },
  invitationTitle: {
    fontSize: 20,
    fontFamily: 'Outfit-ExtraBold',
    color: '#ffffff',
    lineHeight: 24,
    marginBottom: 8,
  },
  invitationDesc: {
    fontSize: 12.5,
    fontFamily: 'Outfit-Medium',
    color: 'rgba(255, 255, 255, 0.85)',
    lineHeight: 18,
    marginBottom: 16,
  },
  boldGlow: {
    fontFamily: 'Outfit-Bold',
    color: '#ffd60a',
  },
  cardDividerGlow: {
    width: '100%',
    height: 0.5,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginVertical: 14,
  },
  statsMiniRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statBoxBorder: {
    width: 0.5,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  statVal: {
    fontSize: 18,
    fontFamily: 'Outfit-ExtraBold',
    color: '#ffffff',
  },
  statLabel: {
    fontSize: 8.5,
    fontFamily: 'Outfit-Bold',
    color: 'rgba(255, 255, 255, 0.7)',
    letterSpacing: 0.5,
  },
  cardContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.01,
    shadowRadius: 8,
    elevation: 1,
  },
  sectionLabelTitle: {
    fontSize: 11,
    fontFamily: 'Outfit-Bold',
    color: '#94a3b8',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  sectionDescText: {
    fontSize: 12,
    fontFamily: 'Outfit-Medium',
    color: '#64748b',
    lineHeight: 17,
    marginBottom: 16,
  },
  referralCodeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#cbd5e1',
    borderStyle: 'dashed',
    padding: 8,
  },
  codeColumn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  codeText: {
    fontSize: 22,
    fontFamily: 'Outfit-ExtraBold',
    color: '#ea580c',
    letterSpacing: 2,
  },
  copyBtn: {
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#1e293b',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  copyBtnSuccess: {
    backgroundColor: '#059669',
  },
  copyBtnText: {
    color: '#ffffff',
    fontSize: 11.5,
    fontFamily: 'Outfit-Bold',
    letterSpacing: 0.2,
  },
  sharingGridRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  sharingGridCell: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  socialIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  socialLabel: {
    fontSize: 10.5,
    fontFamily: 'Outfit-Bold',
    color: '#64748b',
  },
  milestoneCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 14,
    marginTop: 6,
  },
  milestoneHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  milestoneIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#fff7ed',
    borderWidth: 1,
    borderColor: '#ffedd5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  milestoneHeaderInfo: {
    flex: 1,
  },
  milestoneTitleText: {
    fontSize: 13,
    fontFamily: 'Outfit-Bold',
    color: '#1e293b',
  },
  milestoneSubtitleText: {
    fontSize: 10.5,
    fontFamily: 'Outfit-Medium',
    color: '#64748b',
    marginTop: 1,
  },
  progressSliderBg: {
    width: '100%',
    height: 6,
    backgroundColor: '#e2e8f0',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressSliderFill: {
    height: '100%',
    backgroundColor: '#ea580c',
    borderRadius: 3,
  },
  progressSliderMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressSliderText: {
    fontSize: 11,
    fontFamily: 'Outfit-Medium',
    color: '#64748b',
  },
  progressSliderTextBold: {
    fontSize: 11,
    fontFamily: 'Outfit-Bold',
    color: '#ea580c',
  },
});
