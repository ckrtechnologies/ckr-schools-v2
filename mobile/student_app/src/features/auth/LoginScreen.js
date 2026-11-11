import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Image,
  ScrollView,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Feather';
import { useLoginMutation, useRegisterFcmTokenMutation } from '../../store/apiSlice';
import { setCredentials, setTenantSlug, setSchoolInfo } from '../../store/authSlice';
import { colors, shadows } from '../../theme/colors';
import { SOCKET_URL } from '@env';

const DEFAULT_LOGO = require('../../assets/images/logo.jpeg');

const resolveAssetUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const base = SOCKET_URL || 'https://ckrschools.online';
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
};

const LoginScreen = ({ navigation }) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [login, { isLoading }] = useLoginMutation();
  const [registerFcmToken] = useRegisterFcmTokenMutation();
  const dispatch = useDispatch();

  const { tenantSlug, schoolInfo } = useSelector((state) => state.auth);

  // Restore saved school if previously selected
  useEffect(() => {
    const restoreSavedSchool = async () => {
      try {
        const savedSlug = await AsyncStorage.getItem('@tenant_slug');
        const savedSchoolInfo = await AsyncStorage.getItem('@school_info');
        if (savedSlug) {
          dispatch(setTenantSlug(savedSlug));
        }
        if (savedSchoolInfo) {
          const parsed = JSON.parse(savedSchoolInfo);
          dispatch(setSchoolInfo(parsed));
        }
      } catch (e) {}
    };
    if (!schoolInfo) {
      restoreSavedSchool();
    }
  }, [dispatch, schoolInfo]);

  const schoolName = schoolInfo?.name || 'CKR Schools';
  const schoolMotto = schoolInfo?.motto || 'Next-Gen School Operating System';
  const brandLogoUrl = schoolInfo?.logoUrl || schoolInfo?.logo_url;
  const resolvedLogoSource = brandLogoUrl ? { uri: resolveAssetUrl(brandLogoUrl) } : DEFAULT_LOGO;

  const handleLogin = async () => {
    Keyboard.dismiss();
    const cleanId = identifier.trim();
    if (!cleanId || !password) {
      Alert.alert('Required', 'Please enter your phone number / admission number and password.');
      return;
    }

    try {
      const response = await login({
        email: cleanId, // Backend accepts email, phone number, or admission number
        password,
      }).unwrap();

      if (response.success && (response.user.type === 'student' || response.user.type === 'parent')) {
        const siblings = response.siblings || response.data?.siblings || [];
        const activeStudent = response.activeStudent || response.data?.activeStudent || (siblings.length > 0 ? siblings[0] : null);
        const hasMultiple = (siblings && siblings.length > 1) || !!response.hasMultipleChildren;

        const token = response.token || response.accessToken;
        if (token) {
          await Keychain.setGenericPassword('token', token);
          await AsyncStorage.setItem('@auth_token', token);
        }
        await AsyncStorage.setItem('@auth_user', JSON.stringify(response.user));
        if (siblings.length > 0) {
          await AsyncStorage.setItem('@auth_siblings', JSON.stringify(siblings));
        }
        if (activeStudent) {
          await AsyncStorage.setItem('@auth_active_student', JSON.stringify(activeStudent));
        }

        dispatch(setCredentials({
          user: response.user,
          token,
          tenantSlug: response.user?.schoolSlug || tenantSlug || 'arc',
          schoolInfo: schoolInfo || {
            name: response.user?.schoolName,
            slug: response.user?.schoolSlug,
            logoUrl: response.user?.logoUrl,
          },
          siblings,
          activeStudent,
        }));

        // Register FCM Token
        try {
          const { requestUserPermission, getFCMToken } = require('../../utils/notificationHandler');
          const hasPermission = await requestUserPermission();
          if (hasPermission) {
            const fcmToken = await getFCMToken();
            if (fcmToken) {
              registerFcmToken({ fcm_token: fcmToken, device_type: Platform.OS })
                .unwrap()
                .catch((err) => console.log('Failed to register FCM token:', err));
            }
          }
        } catch (fcmErr) {
          console.log('FCM registration skipped:', fcmErr);
        }

        // Navigate based on sibling count
        if (hasMultiple) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'SiblingSelect' }],
          });
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'MainTabs' }],
          });
        }
      } else {
        Alert.alert('Access Denied', 'Only students and parents can login here.');
      }
    } catch (err) {
      console.log('Login error:', err);
      Alert.alert(
        'Login Failed',
        err?.data?.message || err?.message || 'Check your credentials and try again.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Top Bar: Change Campus Pill */}
          <View style={styles.topBar}>
            <TouchableOpacity
              style={styles.changeCampusPill}
              onPress={() => navigation.navigate('SchoolSelect')}
              activeOpacity={0.8}
            >
              <Icon name="home" size={13} color="#93C5FD" style={{ marginRight: 6 }} />
              <Text style={styles.changeCampusText} numberOfLines={1}>
                {schoolName} • <Text style={styles.changeCampusLink}>Change</Text>
              </Text>
            </TouchableOpacity>
          </View>

          {/* School Brand Header (Logo & Motto) */}
          <View style={styles.schoolHeader}>
            <View style={styles.logoCircle}>
              <Image source={resolvedLogoSource} style={styles.schoolLogoImg} resizeMode="cover" />
            </View>
            <Text style={styles.schoolTitle}>{schoolName}</Text>
            <Text style={styles.schoolSubtitle}>{schoolMotto}</Text>
          </View>

          {/* Login Card */}
          <View style={styles.card}>
            <Text style={styles.cardHeaderTitle}>Parent & Student Login</Text>
            <Text style={styles.cardHeaderSub}>Sign in with your registered phone or admission ID</Text>

            {/* Identifier Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Phone Number / Admission No / Email</Text>
              <View style={styles.inputWrapper}>
                <Icon name="phone" size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter phone or admission number"
                  placeholderTextColor="#94A3B8"
                  value={identifier}
                  onChangeText={setIdentifier}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Password</Text>
              <View style={styles.inputWrapper}>
                <Icon name="lock" size={18} color="#94A3B8" style={styles.inputIcon} />
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter password"
                  placeholderTextColor="#94A3B8"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeBtn}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Icon name={showPassword ? 'eye-off' : 'eye'} size={18} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            </View>

            {/* Sign In CTA */}
            <TouchableOpacity
              style={[styles.loginBtn, isLoading && styles.loginBtnDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
              activeOpacity={0.85}
            >
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.loginBtnText}>Sign In</Text>
                  <Icon name="arrow-right" size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
                </>
              )}
            </TouchableOpacity>

            {/* Quick Helper Note */}
            <View style={styles.helpFooter}>
              <Icon name="info" size={14} color="#64748B" style={{ marginRight: 6 }} />
              <Text style={styles.helpText}>
                Parents can log in with their registered mobile number.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryDark, // #0F172A
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 32,
  },
  topBar: {
    paddingHorizontal: 20,
    paddingTop: 8,
    alignItems: 'flex-end',
  },
  changeCampusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  changeCampusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    maxWidth: 220,
  },
  changeCampusLink: {
    color: '#93C5FD',
    fontWeight: '700',
  },
  schoolHeader: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    overflow: 'hidden',
  },
  schoolLogoImg: {
    width: 74,
    height: 74,
    borderRadius: 37,
  },
  schoolTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  schoolSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
  },
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 32,
  },
  cardHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
  },
  cardHeaderSub: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 18,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
  },
  inputIcon: {
    marginRight: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    height: '100%',
  },
  eyeBtn: {
    padding: 6,
  },
  loginBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.brandAccent, // #2563EB - Electric Royal Blue
    borderRadius: 12,
    height: 52,
    marginTop: 8,
    shadowColor: colors.brandAccent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  loginBtnDisabled: {
    opacity: 0.7,
  },
  loginBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  helpFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    paddingHorizontal: 10,
  },
  helpText: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
});

export default LoginScreen;
