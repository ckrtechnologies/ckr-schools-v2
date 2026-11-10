import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator, 
  StatusBar, 
  Image, 
  Modal, 
  FlatList,
  Platform,
  KeyboardAvoidingView,
  ScrollView,
  Keyboard
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import CustomModal from '../../components/CustomModal';
import { loginStart, loginSuccess, loginFailure, setTenantSlug, setSchoolInfo } from '../../store/authSlice';
import { useRegisterFcmTokenMutation, useGetPublicSchoolsQuery } from '../../store/apiSlice';
import { requestUserPermission, getFCMToken } from '../../utils/notificationHandler';
import api from '../../api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import Icon from 'react-native-vector-icons/Feather';
import { colors, shadows } from '../../theme/colors';
import { SOCKET_URL } from '@env';

const CKR_DARK_GREEN = '#064e3b';
const DEFAULT_LOGO = require('../../assets/images/logo.jpeg');

const resolveAssetUrl = (url) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  let base = SOCKET_URL || 'http://localhost:5006';
  if (Platform.OS === 'android' && base.includes('localhost')) {
    base = base.replace('localhost', '10.0.2.2');
  }
  return `${base}${url.startsWith('/') ? '' : '/'}${url}`;
};

const LoginScreen = () => {
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [isSchoolModalOpen, setIsSchoolModalOpen] = useState(false);
  const [schoolSearchQuery, setSchoolSearchQuery] = useState('');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [modalState, setModalState] = useState({ visible: false, type: 'info', title: '', message: '' });
  
  const dispatch = useDispatch();
  const [registerFcmToken] = useRegisterFcmTokenMutation();
  const { loading, error } = useSelector((state) => state.auth);

  // Fetch all active school campuses on the CKR Schools platform
  const { data: schoolsRes, isLoading: loadingSchools, isError: schoolsError, refetch: refetchSchools } = useGetPublicSchoolsQuery();
  const availableSchools = schoolsRes?.data || [];

  // Restore saved school if previously selected
  useEffect(() => {
    const restoreSavedSchool = async () => {
      try {
        const savedSlug = await AsyncStorage.getItem('@tenant_slug');
        const savedSchoolInfo = await AsyncStorage.getItem('@school_info');
        if (savedSlug && savedSchoolInfo) {
          const parsed = JSON.parse(savedSchoolInfo);
          setSelectedSchool(parsed);
          dispatch(setTenantSlug(savedSlug));
          dispatch(setSchoolInfo(parsed));
        }
      } catch (e) {}
    };
    restoreSavedSchool();
  }, [dispatch]);

  // Handle selecting a school from the picker
  const handleSelectSchool = async (school) => {
    setSelectedSchool(school);
    setIsSchoolModalOpen(false);
    dispatch(setTenantSlug(school.slug));
    dispatch(setSchoolInfo(school));
    try {
      await AsyncStorage.setItem('@tenant_slug', school.slug);
      await AsyncStorage.setItem('@school_info', JSON.stringify(school));
    } catch (e) {}
  };

  const activeBrandColor = selectedSchool ? (selectedSchool.themeColor || selectedSchool.theme_color || '#0f5c49') : CKR_DARK_GREEN;
  const brandLogoUrl = selectedSchool?.logoUrl || selectedSchool?.logo_url;
  const resolvedLogoSource = brandLogoUrl ? { uri: resolveAssetUrl(brandLogoUrl) } : DEFAULT_LOGO;

  const filteredSchools = availableSchools.filter((s) => {
    if (!schoolSearchQuery) return true;
    const q = schoolSearchQuery.toLowerCase();
    return (
      s.name?.toLowerCase().includes(q) ||
      s.city?.toLowerCase().includes(q) ||
      s.state?.toLowerCase().includes(q) ||
      s.slug?.toLowerCase().includes(q)
    );
  });

  const handleLogin = async () => {
    Keyboard.dismiss();
    if (!selectedSchool) {
      setModalState({ visible: true, type: 'error', title: 'Select School', message: 'Please select your school campus first.' });
      return;
    }
    if (!email || !password) {
      setModalState({ visible: true, type: 'error', title: 'Error', message: 'Please enter your email and password' });
      return;
    }

    const activeSlug = selectedSchool.slug.toLowerCase().trim();
    dispatch(setTenantSlug(activeSlug));
    dispatch(loginStart());

    try {
      const response = await api.post('/user/loginUser', {
        data: { email, password }
      }, {
        headers: {
          'x-tenant-slug': activeSlug
        }
      });

      if (response.data.success) {
        const { user, token, accessToken } = response.data;
        const validToken = token || accessToken;
        
        if (validToken) {
          await Keychain.setGenericPassword('teacher_token', validToken);
          await AsyncStorage.setItem('@auth_token', validToken);
        }

        await AsyncStorage.setItem('@auth_user', JSON.stringify(user));
        
        dispatch(loginSuccess({ 
          user, 
          token: validToken, 
          tenantSlug: activeSlug,
          schoolInfo: selectedSchool
        }));

        const hasPermission = await requestUserPermission();
        if (hasPermission) {
          const fcmToken = await getFCMToken();
          if (fcmToken) {
            registerFcmToken({ fcm_token: fcmToken, device_type: 'android' })
              .unwrap()
              .catch(err => console.log('Failed to register FCM token:', err));
          }
        }
      } else {
        dispatch(loginFailure(response.data.message || 'Login failed'));
        setModalState({ visible: true, type: 'error', title: 'Login Failed', message: response.data.message || 'Invalid credentials' });
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.response?.data?.error?.message || err.message || 'Network error';
      dispatch(loginFailure(errorMessage));
      setModalState({ visible: true, type: 'error', title: 'Login Error', message: errorMessage });
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: activeBrandColor }]} edges={['bottom', 'left', 'right']}>
      {/* Unified Dark Green Notification Header Bar */}
      <StatusBar 
        barStyle="light-content" 
        backgroundColor={activeBrandColor} 
        translucent={Platform.OS === 'android'}
      />
      
      <KeyboardAvoidingView 
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View pointerEvents="none" style={[styles.topAccent, { backgroundColor: activeBrandColor }]} />
        
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            {/* Header Section */}
            <View style={styles.headerContainer}>
              {selectedSchool ? (
                <>
                  <View style={[styles.iconCircle, { backgroundColor: activeBrandColor + '15' }]}>
                    <Image source={resolvedLogoSource} style={{ width: 54, height: 54, borderRadius: 27 }} resizeMode="cover" />
                  </View>
                  <Text style={styles.title}>{selectedSchool.name}</Text>
                  <Text style={styles.subtitle}>
                    {selectedSchool.motto || 'Faculty & Teacher Portal'}
                  </Text>

                  {/* Change School Pill with clear hitSlop */}
                  <TouchableOpacity 
                    style={styles.changeSchoolPill} 
                    onPress={() => setIsSchoolModalOpen(true)}
                    hitSlop={{ top: 12, bottom: 12, left: 20, right: 20 }}
                    activeOpacity={0.6}
                  >
                    <Icon name="repeat" size={13} color={activeBrandColor} style={{ marginRight: 5 }} />
                    <Text style={[styles.changeSchoolText, { color: activeBrandColor }]}>Change Campus</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={[styles.iconCircle, { backgroundColor: CKR_DARK_GREEN + '15' }]}>
                    <Icon name="award" size={32} color={CKR_DARK_GREEN} />
                  </View>
                  <Text style={styles.title}>CKR Schools</Text>
                  <Text style={styles.subtitle}>Faculty & Teacher Portal</Text>
                </>
              )}
            </View>

            <View style={styles.formContainer}>
              {/* Step 1: School Selector (when no school selected) */}
              {!selectedSchool && (
                <View style={styles.schoolSelectorSection}>
                  <Text style={styles.stepInstruction}>Select your school campus to proceed:</Text>
                  <TouchableOpacity 
                    style={styles.schoolPickerTrigger}
                    onPress={() => setIsSchoolModalOpen(true)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.pickerLeft}>
                      <View style={styles.pickerIconWrapper}>
                        <Icon name="home" size={20} color={CKR_DARK_GREEN} />
                      </View>
                      <View>
                        <Text style={styles.pickerPlaceholderTitle}>Choose School Campus</Text>
                        <Text style={styles.pickerPlaceholderSub}>Tap to search all affiliated schools</Text>
                      </View>
                    </View>
                    <Icon name="chevron-right" size={20} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              )}

              {/* Step 2: Credentials Input (Visible once school is selected) */}
              {selectedSchool && (
                <>
                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Email Address</Text>
                    <View style={styles.inputWrapper}>
                      <Icon name="mail" size={20} color={colors.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter teacher email"
                        placeholderTextColor={colors.textMuted}
                        value={email}
                        onChangeText={setEmail}
                        keyboardType="email-address"
                        autoCapitalize="none"
                      />
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.label}>Password</Text>
                    <View style={styles.inputWrapper}>
                      <Icon name="lock" size={20} color={colors.textMuted} style={styles.inputIcon} />
                      <TextInput
                        style={styles.input}
                        placeholder="Enter your password"
                        placeholderTextColor={colors.textMuted}
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry={!showPassword}
                      />
                      <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                        <Icon name={showPassword ? "eye" : "eye-off"} size={20} color={colors.textMuted} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {error ? <Text style={styles.errorText}>{error}</Text> : null}

                  <TouchableOpacity 
                    style={[
                      styles.loginButton, 
                      { backgroundColor: activeBrandColor }, 
                      loading && styles.loginButtonDisabled
                    ]} 
                    onPress={handleLogin}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    {loading ? (
                      <ActivityIndicator color={colors.surface} />
                    ) : (
                      <Text style={styles.loginButtonText}>Sign In as Teacher</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Interactive School Selection Modal */}
      <Modal
        visible={isSchoolModalOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsSchoolModalOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalHeading}>Select School Campus</Text>
                <Text style={styles.modalSubheading}>Choose your institution from CKR network</Text>
              </View>
              <TouchableOpacity 
                style={styles.modalCloseButton} 
                onPress={() => setIsSchoolModalOpen(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Icon name="x" size={20} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Search Input */}
            <View style={styles.searchContainer}>
              <Icon name="search" size={18} color={colors.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by school name, city, or board..."
                placeholderTextColor={colors.textMuted}
                value={schoolSearchQuery}
                onChangeText={setSchoolSearchQuery}
                autoCapitalize="none"
              />
              {schoolSearchQuery ? (
                <TouchableOpacity onPress={() => setSchoolSearchQuery('')}>
                  <Icon name="x-circle" size={16} color={colors.textMuted} />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* School List */}
            {loadingSchools ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={CKR_DARK_GREEN} />
                <Text style={{ marginTop: 12, color: colors.textMuted }}>Loading campus directory...</Text>
              </View>
            ) : (
              <FlatList
                data={filteredSchools}
                keyExtractor={(item) => item.id || item.slug}
                contentContainerStyle={{ paddingBottom: 28 }}
                keyboardShouldPersistTaps="handled"
                renderItem={({ item }) => {
                  const isCurrent = selectedSchool?.slug === item.slug;
                  const itemLogoUrl = item.logoUrl || item.logo_url;
                  const itemLogo = itemLogoUrl ? { uri: resolveAssetUrl(itemLogoUrl) } : DEFAULT_LOGO;

                  return (
                    <TouchableOpacity
                      style={[styles.schoolItemCard, isCurrent && styles.schoolItemCardActive]}
                      onPress={() => handleSelectSchool(item)}
                      activeOpacity={0.7}
                    >
                      <Image source={itemLogo} style={styles.schoolItemLogo} resizeMode="cover" />
                      <View style={{ flex: 1, marginRight: 8 }}>
                        <Text style={styles.schoolItemName}>{item.name}</Text>
                        <Text style={styles.schoolItemDetails}>
                          {[item.city, item.state, item.affiliationBoard].filter(Boolean).join(' • ')}
                        </Text>
                        {item.motto ? (
                          <Text style={styles.schoolItemMotto} numberOfLines={1}>
                            "{item.motto}"
                          </Text>
                        ) : null}
                      </View>
                      {isCurrent ? (
                        <View style={styles.checkBadge}>
                          <Icon name="check" size={16} color="#ffffff" />
                        </View>
                      ) : (
                        <Icon name="chevron-right" size={20} color={colors.textMuted} />
                      )}
                    </TouchableOpacity>
                  );
                }}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Icon name="alert-circle" size={36} color={colors.textMuted} />
                    <Text style={styles.emptyText}>
                      {schoolsError ? "Unable to load schools from server." : "No schools match your search."}
                    </Text>
                    {schoolsError && (
                      <TouchableOpacity 
                        style={styles.retryButton} 
                        onPress={() => refetchSchools()}
                      >
                        <Icon name="refresh-cw" size={14} color="#ffffff" style={{ marginRight: 6 }} />
                        <Text style={styles.retryButtonText}>Retry Loading</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                }
              />
            )}
          </View>
        </View>
      </Modal>
      
      <CustomModal 
        visible={modalState.visible}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        primaryButtonText="OK"
        onPrimaryPress={() => setModalState(prev => ({ ...prev, visible: false }))}
        onClose={() => setModalState(prev => ({ ...prev, visible: false }))}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: CKR_DARK_GREEN,
  },
  keyboardContainer: {
    flex: 1,
  },
  topAccent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 380,
    backgroundColor: CKR_DARK_GREEN,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 16 : 32,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    ...shadows.card,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 4,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    fontWeight: '500',
    textAlign: 'center',
  },
  changeSchoolPill: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: 'rgba(0,0,0,0.06)',
  },
  changeSchoolText: {
    fontSize: 12,
    fontWeight: '700',
  },
  formContainer: {
    width: '100%',
  },
  schoolSelectorSection: {
    marginTop: 8,
  },
  stepInstruction: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textMuted,
    marginBottom: 10,
    textAlign: 'center',
  },
  schoolPickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  pickerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pickerIconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: CKR_DARK_GREEN + '15',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  pickerPlaceholderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  pickerPlaceholderSub: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    height: '100%',
  },
  eyeIcon: {
    padding: 8,
  },
  loginButton: {
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    ...shadows.button,
  },
  loginButtonDisabled: {
    opacity: 0.7,
  },
  loginButtonText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  errorText: {
    color: colors.danger,
    fontSize: 13,
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '600',
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 20,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalHeading: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
  },
  modalSubheading: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  modalCloseButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 12,
    height: 48,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
  },
  loaderContainer: {
    padding: 40,
    alignItems: 'center',
  },
  schoolItemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
  },
  schoolItemCardActive: {
    borderColor: CKR_DARK_GREEN,
    backgroundColor: CKR_DARK_GREEN + '08',
  },
  schoolItemLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
  },
  schoolItemName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  schoolItemDetails: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  schoolItemMotto: {
    fontSize: 11,
    fontStyle: 'italic',
    color: colors.textMuted,
    marginTop: 2,
  },
  checkBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: CKR_DARK_GREEN,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 8,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    backgroundColor: CKR_DARK_GREEN,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default LoginScreen;
