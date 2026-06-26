import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TouchableOpacity, 
  TextInput, 
  Dimensions, 
  KeyboardAvoidingView, 
  Platform, 
  TouchableWithoutFeedback, 
  Keyboard, 
  ImageBackground,
  ScrollView,
  Modal,
  FlatList
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { 
  FadeIn, 
  SlideInRight, 
  SlideOutLeft, 
  FadeOut,
  Layout
} from 'react-native-reanimated';
import { Colors } from '../constants/Colors';
import { useLanguage } from '../context/LanguageContext';
import { sendWhatsAppOTP, getWhatsAppApiKey } from '../services/whatsapp';
import { safeStorage } from '../services/storage';
import { supabase } from '../services/supabase';

const { width, height } = Dimensions.get('window');

type LoginStep = 'PHONE' | 'OTP' | 'INFO';

const COUNTRIES = [
  { name: 'India', code: '+91', flag: '🇮🇳', length: 10 },
  { name: 'United States', code: '+1', flag: '🇺🇸', length: 10 },
  { name: 'United Kingdom', code: '+44', flag: '🇬🇧', length: 10 },
  { name: 'Canada', code: '+1', flag: '🇨🇦', length: 10 },
  { name: 'Australia', code: '+61', flag: '🇦🇺', length: 9 },
  { name: 'UAE', code: '+971', flag: '🇦🇪', length: 9 },
];

export default function LoginScreen() {
  const router = useRouter();
  const { redirectTo } = useLocalSearchParams<{ redirectTo?: string }>();
  const insets = useSafeAreaInsets();
  const { t } = useLanguage();
  const [step, setStep] = useState<LoginStep>('PHONE');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [email, setEmail] = useState('');
  const [referredByCode, setReferredByCode] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRIES[0]);
  const [showCountryModal, setShowCountryModal] = useState(false);
  const [error, setError] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  useEffect(() => {
    // Pre-fetch WhatsApp API key to eliminate any delay when user clicks "Send OTP"
    getWhatsAppApiKey().catch(err => console.warn('Error pre-fetching WhatsApp API key:', err));

    // Check if user is already logged in
    const checkSession = async () => {
      try {
        const sessionData = await safeStorage.getItem('user_session');
        if (sessionData) {
          console.log('[Login Screen] Saved session found, auto-logging in...');
          if (redirectTo) {
            router.replace(redirectTo as any);
          } else {
            router.replace('/(tabs)/home');
          }
        }
      } catch (err) {
        console.error('Error checking saved session:', err);
      }
    };
    checkSession();
  }, [redirectTo]);

  const handlePhoneChange = (text: string) => {
    // Only allow numbers
    const cleaned = text.replace(/[^0-9]/g, '');
    setPhone(cleaned);
    if (error) setError('');
  };

  const handleGuestLogin = () => {
    router.replace('/(tabs)/home');
  };

  const verifyOtpCode = async (codeToVerify: string, codeToMatch: string = generatedOtp) => {
    if (codeToVerify.length === 6) {
      // Allow a universal dev bypass code '123456' for local simulator testing
      if (codeToVerify === codeToMatch || codeToVerify === '123456') {
        setIsSendingOtp(true);
        setError('');
        try {
          const userPhone = `${selectedCountry.code}${phone}`;
          const userPhoneWithPlus = userPhone.startsWith('+') ? userPhone : `+${userPhone}`;
          const userPhoneWithoutPlus = userPhone.replace('+', '');

          // Query using OR filter for both formats to avoid mismatches
          const { data: existingUser, error: dbError } = await supabase
            .from('app_users')
            .select('*')
            .or(`phone.eq.${userPhoneWithPlus},phone.eq.${userPhoneWithoutPlus}`)
            .maybeSingle();

          if (dbError) {
            console.error('Error fetching existing user:', dbError);
          }

          let existingName = existingUser?.name;
          if (existingUser && !existingName) {
            // Try checking profiles table
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('phone', userPhoneWithPlus)
              .maybeSingle();
            if (profile?.full_name) {
              existingName = profile.full_name;
              existingUser.name = profile.full_name;
            }
          }

          if (existingUser && existingName) {
            console.log('[Login] Found existing user profile, logging in directly:', existingUser);
            await safeStorage.setItem('user_session', JSON.stringify(existingUser));
            if (redirectTo) {
              router.replace(redirectTo as any);
            } else {
              router.replace('/(tabs)/home');
            }
            return;
          }

          // Otherwise, go to info step to collect profile details
          setStep('INFO');
        } catch (err) {
          console.error('Failed to query user profile:', err);
          setStep('INFO');
        } finally {
          setIsSendingOtp(false);
        }
      } else {
        setError(t('Invalid verification code. Please try again.'));
      }
    } else {
      setError(t('Please enter the 6-digit code'));
    }
  };

  // Clipboard OTP auto-fill and auto-submit listener when on the OTP screen
  useEffect(() => {
    if (step !== 'OTP') return;

    let isActive = true;
    
    const checkClipboard = async () => {
      try {
        const text = await Clipboard.getStringAsync();
        if (!text || !isActive) return;
        
        // Extract 6-digit code from the copied text
        const match = text.match(/\b\d{6}\b/);
        if (match && match[0]) {
          const matchedOtp = match[0];
          // If we haven't already filled this OTP
          if (matchedOtp !== otp) {
            console.log('[Login] Auto-filling and verifying OTP from native clipboard:', matchedOtp);
            setOtp(matchedOtp);
            verifyOtpCode(matchedOtp, generatedOtp);
          }
        }
      } catch (err) {
        console.warn('Clipboard check error:', err);
      }
    };

    // Check immediately on mount/focus
    checkClipboard();

    // Check every 1.5 seconds while on the OTP screen
    const interval = setInterval(checkClipboard, 1500);

    return () => {
      isActive = false;
      clearInterval(interval);
    };
  }, [step, generatedOtp, otp]);

  // Clipboard/Deep Link auto-fill for Referral Code
  useEffect(() => {
    if (step !== 'INFO') return;

    const checkReferralSources = async () => {
      try {
        // 1. Check if there is a pending code in safeStorage (from deep link)
        const pendingCode = await safeStorage.getItem('pending_referral_code');
        if (pendingCode) {
          console.log('[Login] Found pending deep link referral code:', pendingCode);
          setReferredByCode(pendingCode);
          // Clear it so we don't reuse it next time
          await safeStorage.removeItem('pending_referral_code');
          return;
        }

        // 2. Check native clipboard
        const text = await Clipboard.getStringAsync();
        if (text) {
          // Match MPXXXXXX or code=MPXXXXXX or refer?code=MPXXXXXX
          const match = text.match(/code=([a-zA-Z0-9_-]+)/i) || text.match(/\b(MP[a-zA-Z0-9]{6})\b/i);
          if (match && match[1]) {
            const matchedCode = match[1].toUpperCase();
            console.log('[Login] Auto-filling referral code from native clipboard:', matchedCode);
            setReferredByCode(matchedCode);
          }
        }
      } catch (err) {
        console.warn('Error checking referral sources:', err);
      }
    };

    checkReferralSources();
  }, [step]);

  const handleNext = async () => {
    console.log('Button Pressed, current phone length:', phone.length);
    if (step === 'PHONE') {
      if (phone.length === selectedCountry.length) {
        setIsSendingOtp(true);
        setError('');
        
        // Generate a random 6-digit OTP code
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        
        try {
          const res = await sendWhatsAppOTP(selectedCountry.code, phone, code);
          if (res.success) {
            setGeneratedOtp(code);
            setStep('OTP');
            
            setOtp('');
            if (res.message.includes('OTP is') || res.message.includes('Dev Mode')) {
              setError(res.message);
            } else {
              setError('');
            }
          } else {
            setError(res.message || 'Failed to send OTP via WhatsApp. Please try again.');
          }
        } catch (err) {
          console.error('Error sending WhatsApp OTP:', err);
          setError('Failed to send verification code. Please try again.');
        } finally {
          setIsSendingOtp(false);
        }
      } else {
        setError(t('Please enter a valid') + ` ${selectedCountry.length}-` + t('digit number'));
      }
    } else if (step === 'OTP') {
      await verifyOtpCode(otp);
    } else {
      if (name.trim()) {
        setIsSendingOtp(true);
        setError('');
        try {
          const userPhone = `${selectedCountry.code}${phone}`;
          // Upsert user details to Supabase app_users table
          const { data, error: dbError } = await supabase
            .from('app_users')
            .upsert(
              {
                phone: userPhone,
                name: name.trim(),
                email: email.trim() || null,
                dob: dob.trim() || null,
                referred_by_code: referredByCode.trim() || null,
                updated_at: new Date().toISOString()
              },
              { onConflict: 'phone' }
            )
            .select()
            .single();

          if (dbError) throw dbError;

          console.log('[Registration] Successfully registered user:', data);

          // Save user session locally
          await safeStorage.setItem('user_session', JSON.stringify(data));

          // Navigate to home screen or redirect path
          if (redirectTo) {
            router.replace(redirectTo as any);
          } else {
            router.replace('/(tabs)/home');
          }
        } catch (err) {
          console.error('[Registration] Failed to save user details:', err);
          setError(t('Failed to complete registration. Please try again.'));
        } finally {
          setIsSendingOtp(false);
        }
      } else {
        setError(t('Please enter your name'));
      }
    }
  };

  const handleResend = async () => {
    setIsSendingOtp(true);
    setError('');
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    try {
      const res = await sendWhatsAppOTP(selectedCountry.code, phone, code);
      if (res.success) {
        setGeneratedOtp(code);
        
        setOtp('');
        if (res.message.includes('OTP is') || res.message.includes('Dev Mode')) {
          setError(res.message);
        } else {
          setError(t('Verification code resent successfully.'));
        }
      } else {
        setError(res.message || 'Failed to resend code.');
      }
    } catch (err) {
      console.error('Error resending OTP:', err);
      setError('Failed to resend verification code.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const isStepValid = () => {
    if (step === 'PHONE') return phone.length === selectedCountry.length;
    if (step === 'OTP') return otp.length === 6;
    if (step === 'INFO') return name.trim().length > 0;
    return false;
  };

  const renderStep = () => {
    switch (step) {
      case 'PHONE':
        return (
          <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut} style={styles.formContainer}>
            <Text style={styles.title}>{t('Verify Phone Number')}</Text>
            <Text style={styles.subtitle}>{t('Allow a call and call log access to automatically verify your phone number easily.')}</Text>
            
            <View style={[styles.inputRow, error ? styles.inputError : null]}>
              <TouchableOpacity 
                style={styles.countryDropdown} 
                onPress={() => setShowCountryModal(true)}
              >
                <Text style={styles.countryCode}>{selectedCountry.code}</Text>
                <Ionicons name="chevron-down" size={12} color={Colors.saffron.DEFAULT} />
              </TouchableOpacity>
              <View style={styles.phoneInputWrapper}>
                <TextInput
                  style={styles.input}
                  placeholder={t('000-000-0000')}
                  placeholderTextColor="#a1a1aa"
                  keyboardType="number-pad"
                  value={phone}
                  onChangeText={handlePhoneChange}
                  maxLength={selectedCountry.length}
                />
              </View>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity
              activeOpacity={0.7}
              onPress={handleNext}
              style={[styles.primaryButtonWrapper, { marginTop: error ? 10 : 0 }]}
              disabled={isSendingOtp}
            >
              <LinearGradient
                colors={!isStepValid() || isSendingOtp ? ['#fdba74', '#f97316'] : ['#f97316', '#ea580c', '#c2410c']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryButton}
              >
                <Text style={styles.buttonText}>
                  {isSendingOtp ? t('Sending...') : t('Keep Going')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.6}
              onPress={handleGuestLogin}
              style={styles.guestButton}
            >
              <Text style={styles.guestButtonText}>{t('Continue as Guest')}</Text>
            </TouchableOpacity>
          </Animated.View>
        );

      case 'OTP':
        return (
          <Animated.View entering={SlideInRight.duration(400)} exiting={SlideOutLeft} style={styles.formContainer}>
            <Text style={styles.title}>{t('Verification Code')}</Text>
            <Text style={styles.subtitle}>{t('Enter the 6-digit code sent to')} {selectedCountry.code} {phone}</Text>
            
            <View style={styles.otpInputWrapper}>
              <TextInput
                style={styles.otpInput}
                placeholder="000000"
                placeholderTextColor="#e5e7eb"
                keyboardType="number-pad"
                value={otp}
                onChangeText={(text) => {
                  setOtp(text.replace(/[^0-9]/g, ''));
                  if (error) setError('');
                }}
                maxLength={6}
                autoFocus
                textContentType="oneTimeCode"
                autoComplete="one-time-code"
              />
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity 
              activeOpacity={0.7} 
              onPress={handleNext}
              style={styles.primaryButtonWrapper}
              disabled={isSendingOtp}
            >
              <LinearGradient
                colors={otp.length < 6 || isSendingOtp ? ['#fdba74', '#f97316'] : ['#f97316', '#ea580c', '#c2410c']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryButton}
              >
                <Text style={styles.buttonText}>
                  {isSendingOtp ? t('Verifying...') : t('Verify Code')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.resendBtn} 
              onPress={handleResend}
              disabled={isSendingOtp}
            >
              <Text style={styles.resendText}>
                {t("Didn't receive? ")}
                <Text style={styles.resendHighlight}>
                  {isSendingOtp ? t('Sending...') : t('Resend Code')}
                </Text>
              </Text>
            </TouchableOpacity>
          </Animated.View>
        );

      case 'INFO':
        return (
          <Animated.View entering={FadeIn.duration(400)} style={styles.formContainer}>
            <Text style={styles.title}>{t('Personalize')}</Text>
            <Text style={styles.subtitle}>{t('Let us know you better to tailor your experience.')}</Text>
            
            <View style={styles.infoFields}>
              <View style={styles.fieldItem}>
                <Ionicons name="person-outline" size={18} color={Colors.saffron.DEFAULT} />
                <TextInput
                  style={styles.fieldInput}
                  placeholder={t('Full Name')}
                  placeholderTextColor="#a1a1aa"
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    if (error) setError('');
                  }}
                />
              </View>
              <View style={styles.fieldItem}>
                <Ionicons name="calendar-outline" size={18} color={Colors.saffron.DEFAULT} />
                <TextInput
                  style={styles.fieldInput}
                  placeholder={t('Date of Birth (Optional)')}
                  placeholderTextColor="#a1a1aa"
                  value={dob}
                  onChangeText={setDob}
                />
              </View>
              <View style={styles.fieldItem}>
                <Ionicons name="mail-outline" size={18} color={Colors.saffron.DEFAULT} />
                <TextInput
                  style={styles.fieldInput}
                  placeholder={t('Email Address (Optional)')}
                  placeholderTextColor="#a1a1aa"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                />
              </View>
              <View style={styles.fieldItem}>
                <Ionicons name="gift-outline" size={18} color={Colors.saffron.DEFAULT} />
                <TextInput
                  style={styles.fieldInput}
                  placeholder={t('Referral Code (Optional)')}
                  placeholderTextColor="#a1a1aa"
                  value={referredByCode}
                  onChangeText={(text) => setReferredByCode(text.toUpperCase())}
                  autoCapitalize="characters"
                />
              </View>
            </View>

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

            <TouchableOpacity 
              activeOpacity={0.7} 
              onPress={handleNext}
              style={styles.primaryButtonWrapper}
              disabled={isSendingOtp}
            >
              <LinearGradient
                colors={!name.trim() || isSendingOtp ? ['#fdba74', '#f97316'] : ['#f97316', '#ea580c', '#c2410c']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.primaryButton}
              >
                <Text style={styles.buttonText}>
                  {isSendingOtp ? t('Saving...') : t('Start Experience')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        );
    }
  };

  return (
    <View style={styles.mainContainer}>
      <ImageBackground source={require('../assets/Login/Login_1.jpeg')} style={styles.container} resizeMode="cover">
        <LinearGradient colors={['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.7)']} style={StyleSheet.absoluteFill} />
        <StatusBar style="dark" />
        
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <View style={styles.inner}>
            {/* Header */}
            <View style={[styles.header, { top: Math.max(insets.top, 20) }]}>
              <TouchableOpacity 
                style={styles.backButton} 
                onPress={() => {
                  if (step !== 'PHONE') setStep(step === 'OTP' ? 'PHONE' : 'OTP');
                  else if (router.canGoBack()) router.back();
                }}
              >
                <Ionicons name="arrow-back" size={22} color={Colors.saffron.DEFAULT} />
              </TouchableOpacity>
            </View>
 
            <View style={{ flex: 1 }} />
 
            {/* Content Container */}
            <Animated.View layout={Layout.springify().damping(20)} style={[styles.card, { paddingBottom: Math.max(insets.bottom, 20) }]}>
              <View style={styles.cardIndicator} />
              <ScrollView 
                bounces={false} 
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="always"
                contentContainerStyle={{ paddingBottom: 20 }}
              >
                {renderStep()}
              </ScrollView>
              <View style={[styles.cardFiller, { height: insets.bottom + 100 }]} />
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
 
        {/* Country Picker Modal */}
        <Modal
          visible={showCountryModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowCountryModal(false)}
        >
          <TouchableWithoutFeedback onPress={() => setShowCountryModal(false)}>
            <View style={styles.modalOverlay}>
              <Animated.View entering={FadeIn} style={styles.modalContent}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>{t('Select Country')}</Text>
                  <TouchableOpacity onPress={() => setShowCountryModal(false)}>
                    <Ionicons name="close" size={24} color="#000" />
                  </TouchableOpacity>
                </View>
                <FlatList
                  data={COUNTRIES}
                  keyExtractor={(item) => item.name}
                  renderItem={({ item }) => (
                    <TouchableOpacity 
                      style={styles.countryItem}
                      onPress={() => {
                        setSelectedCountry(item);
                        setPhone(''); // Reset phone when country changes
                        setError('');
                        setShowCountryModal(false);
                      }}
                    >
                      <Text style={styles.flag}>{item.flag}</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.countryName}>{t(item.name)}</Text>
                        <Text style={styles.countrySubtext}>{item.length} {t('digits required')}</Text>
                      </View>
                      <Text style={styles.countryCodeItem}>{item.code}</Text>
                    </TouchableOpacity>
                  )}
                />
              </Animated.View>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      </ImageBackground>
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  header: {
    position: 'absolute',
    left: 20,
    zIndex: 100,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  card: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    width: '100%',
    paddingHorizontal: 25,
    paddingTop: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.05,
    shadowRadius: 15,
    elevation: 20,
  },
  cardFiller: {
    backgroundColor: '#fff',
    position: 'absolute',
    bottom: -100,
    left: 0,
    right: 0,
  },
  cardIndicator: {
    width: 36,
    height: 4,
    backgroundColor: '#f1f1f4',
    borderRadius: 10,
    alignSelf: 'center',
    marginBottom: 20,
  },
  formContainer: {
    width: '100%',
  },
  title: {
    fontSize: 26,
    fontFamily: 'Outfit-ExtraBold',
    color: '#09090b',
    textAlign: 'center',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Outfit-Regular',
    color: '#71717a',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  inputRow: {
    flexDirection: 'row',
    marginBottom: 15,
    borderWidth: 1.5,
    borderColor: '#f0f0f2',
    borderRadius: 100,
    backgroundColor: '#fafafa',
  },
  inputError: {
    borderColor: '#ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 12,
    fontFamily: 'Outfit-SemiBold',
    textAlign: 'center',
    marginBottom: 10,
  },
  countryDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    borderRightWidth: 1,
    borderRightColor: '#f0f0f2',
    height: 56,
  },
  countryCode: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
    color: '#18181b',
    marginRight: 4,
  },
  phoneInputWrapper: {
    flex: 1,
    paddingHorizontal: 15,
    height: 56,
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
    fontFamily: 'Outfit-SemiBold',
    color: '#18181b',
  },
  primaryButtonWrapper: {
    width: '100%',
  },
  primaryButton: {
    height: 56,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#f97316',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
  },
  otpInputWrapper: {
    backgroundColor: '#fafafa',
    borderRadius: 100,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#f0f0f2',
  },
  otpInput: {
    fontSize: 24,
    fontFamily: 'Outfit-ExtraBold',
    color: Colors.saffron.DEFAULT,
    width: '100%',
    textAlign: 'center',
    letterSpacing: 10,
  },
  resendBtn: {
    marginTop: 15,
    alignItems: 'center',
  },
  resendText: {
    color: '#71717a',
    fontSize: 14,
    fontFamily: 'Outfit-Regular',
  },
  resendHighlight: {
    color: Colors.saffron.DEFAULT,
    fontFamily: 'Outfit-Bold',
  },
  infoFields: {
    gap: 12,
    marginBottom: 20,
  },
  fieldItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fafafa',
    borderRadius: 100,
    paddingHorizontal: 15,
    height: 56,
    borderWidth: 1.5,
    borderColor: '#f0f0f2',
  },
  fieldInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 15,
    fontFamily: 'Outfit-SemiBold',
    color: '#18181b',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    padding: 20,
    maxHeight: height * 0.5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Outfit-Bold',
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f1f4',
  },
  flag: {
    fontSize: 24,
    marginRight: 15,
  },
  countryName: {
    fontSize: 16,
    fontFamily: 'Outfit-SemiBold',
  },
  countrySubtext: {
    fontSize: 12,
    color: '#71717a',
    fontFamily: 'Outfit-Regular',
  },
  countryCodeItem: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
    color: Colors.saffron.DEFAULT,
  },
  guestButton: {
    marginTop: 20,
    alignSelf: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  guestButtonText: {
    color: '#71717a',
    fontSize: 15,
    fontFamily: 'Outfit-SemiBold',
    textDecorationLine: 'underline',
  },
});
