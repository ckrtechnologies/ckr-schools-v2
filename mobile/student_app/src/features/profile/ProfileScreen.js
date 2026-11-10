import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Alert,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import Icon from 'react-native-vector-icons/Feather';
import { apiSlice, useGetDashboardQuery } from '../../store/apiSlice';
import { logout } from '../../store/authSlice';
import { colors } from '../../theme/colors';
import Card from '../../components/Card';
import UserAvatar from '../../components/UserAvatar';

const InfoRow = ({ icon, label, value }) => (
  <View style={styles.infoRow}>
    <View style={styles.iconBox}>
      <Icon name={icon} size={18} color={colors.brandAccent} />
    </View>
    <View style={styles.infoContent}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || 'N/A'}</Text>
    </View>
  </View>
);

const ProfileScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user, schoolInfo } = useSelector((state) => state.auth);
  const { data, isFetching, refetch } = useGetDashboardQuery();

  const onRefresh = useCallback(async () => {
    try {
      await refetch();
    } catch (e) {
      console.error('Error refreshing profile:', e);
    }
  }, [refetch]);

  const profile = data?.data?.profile || {};
  const classInfo = data?.data?.classInfo || {};
  const schoolName = schoolInfo?.name || user?.schoolName || 'Profile';

  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove([
        '@auth_user',
        '@auth_token',
        '@auth_siblings',
        '@auth_active_student',
      ]);
      await Keychain.resetGenericPassword();
    } catch (e) {
      console.warn('Error clearing storage on logout:', e);
    }

    try {
      dispatch(apiSlice.util.resetApiState());
    } catch (e) {
      console.warn('Error resetting api state:', e);
    }

    dispatch(logout());
  };

  const confirmLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of your account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: handleLogout,
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Icon name="arrow-left" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {schoolName}
        </Text>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.navigate('Notifications')}
        >
          <Icon name="bell" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching || false}
            onRefresh={onRefresh}
            colors={[colors.brandAccent]}
          />
        }
      >
        {/* Profile Hero Card */}
        <View style={styles.heroCard}>
          <UserAvatar
            url={profile?.avatar_url || user?.avatar_url}
            name={profile?.name || user?.name || 'S'}
            size={74}
            placeholderBg="rgba(255,255,255,0.2)"
            borderWidth={2}
            borderColor="rgba(255,255,255,0.4)"
            placeholderColor="#FFFFFF"
            style={{ marginBottom: 12 }}
          />
          <Text style={styles.nameText}>{profile.name || user?.name || 'Student'}</Text>
          <Text style={styles.classText}>
            {user?.type === 'parent'
              ? 'Parent Account'
              : `Class ${classInfo?.name || '—'} ${classInfo?.section ? `- ${classInfo.section}` : ''}`}
          </Text>
        </View>

        <View style={styles.content}>
          {/* Student Info */}
          <Card variant="elevated">
            <Text style={styles.cardTitle}>Student Information</Text>
            <InfoRow icon="hash" label="Roll Number" value={profile.roll_number || 'N/A'} />
            <InfoRow icon="hash" label="Admission Number" value={profile.admission_number || 'N/A'} />
            <InfoRow icon="calendar" label="Date of Birth" value={profile.dob} />
            <InfoRow icon="home" label="House" value={profile.house} />
            <InfoRow icon="user" label="Father's Name" value={profile.father_name || user?.father_name || 'N/A'} />
            <InfoRow icon="user" label="Mother's Name" value={profile.mother_name || user?.mother_name || 'N/A'} />
          </Card>

          {/* Contact Details */}
          <Card variant="elevated">
            <Text style={styles.cardTitle}>Contact Details</Text>
            <InfoRow icon="mail" label="Email" value={user?.email || profile?.email} />
            <InfoRow icon="phone" label="Phone" value={user?.phone || user?.phone_number || profile?.phone} />
            <InfoRow icon="map-pin" label="Address" value={user?.address || profile?.address} />
          </Card>

          {/* Quick Actions */}
          <Card variant="elevated">
            <Text style={styles.cardTitle}>Quick Actions</Text>
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => navigation.navigate('Notifications')}
              activeOpacity={0.7}
            >
              <Icon name="bell" size={18} color={colors.brandAccent} />
              <Text style={styles.actionLabel}>Notifications</Text>
              <Icon name="chevron-right" size={16} color={colors.textMuted} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => navigation.navigate('ChangePassword')}
              activeOpacity={0.7}
            >
              <Icon name="lock" size={18} color={colors.textMuted} />
              <Text style={styles.actionLabel}>Change Password</Text>
              <Icon name="chevron-right" size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </Card>

          {/* Logout Button */}
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={confirmLogout}
            activeOpacity={0.85}
          >
            <Icon name="log-out" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 32 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.primaryDark, // #0F172A
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.primaryDark,
  },
  headerBtn: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 8,
  },
  scroll: {
    flex: 1,
    backgroundColor: colors.background,
  },
  heroCard: {
    backgroundColor: colors.primaryDark,
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  nameText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  classText: {
    fontSize: 14,
    color: '#93C5FD',
    fontWeight: '600',
  },
  content: {
    padding: 16,
    gap: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  actionLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginLeft: 12,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.danger, // #EF4444
    borderRadius: 14,
    height: 50,
    marginTop: 8,
    shadowColor: colors.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  logoutBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ProfileScreen;
