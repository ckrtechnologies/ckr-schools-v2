import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Image,
  Modal,
  FlatList,
  Pressable,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Feather';
import { setActiveStudent } from '../store/authSlice';
import { apiSlice, useGetNotificationsQuery } from '../store/apiSlice';
import { colors } from '../theme/colors';
import { getSafeImageUrl } from './UserAvatar';

const DEFAULT_LOGO = require('../assets/images/logo.jpeg');

const CustomHeader = ({ title, showBack, rightComponent }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const dispatch = useDispatch();

  const { activeStudent, activeStudentId, siblings, user, schoolInfo } = useSelector((state) => state.auth);
  const [showSiblingModal, setShowSiblingModal] = useState(false);

  const { data: notificationsData } = useGetNotificationsQuery();
  const unreadCount = notificationsData?.data?.filter((n) => !n.is_read)?.length || 0;

  const headerBgColor = colors.primaryDark; // #022C22 - Deep Forest Midnight
  const brandAccent = colors.brandAccent || '#10B981';
  const schoolName = schoolInfo?.name || user?.schoolName || 'ARC School';
  const hasSiblings = siblings && siblings.length > 1;

  // School logo resolution
  const brandLogoUrl = schoolInfo?.logoUrl || schoolInfo?.logo_url || user?.logoUrl || user?.logo_url;
  const safeBrandLogo = getSafeImageUrl(brandLogoUrl);
  const logoSource = safeBrandLogo ? { uri: safeBrandLogo } : DEFAULT_LOGO;

  // Active student display name & class
  const studentName = activeStudent?.name || user?.name || 'Student';
  const classText = activeStudent?.class_name
    ? `Class ${activeStudent.class_name}${activeStudent.class_section ? `-${activeStudent.class_section}` : ''}`
    : '';

  const handleSwitchChild = async (sibling) => {
    dispatch(setActiveStudent(sibling));
    await AsyncStorage.setItem('@auth_active_student', JSON.stringify(sibling));
    // Invalidate cached student queries so fresh child data loads instantly
    dispatch(apiSlice.util.invalidateTags([
      'Dashboard', 'Academics', 'Attendance', 'Timetable', 'CourseWork', 'Fees', 'Consents',
    ]));
    setShowSiblingModal(false);
  };

  const renderSiblingItem = ({ item }) => {
    const isSelected = item.id === activeStudentId;
    const initial = item.name ? item.name.charAt(0).toUpperCase() : 'S';

    return (
      <TouchableOpacity
        style={[styles.siblingOption, isSelected && styles.siblingOptionActive]}
        onPress={() => handleSwitchChild(item)}
        activeOpacity={0.8}
      >
        {item.avatar_url ? (
          <Image source={{ uri: item.avatar_url }} style={styles.siblingModalAvatar} />
        ) : (
          <View style={[styles.siblingModalPlaceholder, { backgroundColor: brandAccent }]}>
            <Text style={styles.siblingModalInitial}>{initial}</Text>
          </View>
        )}

        <View style={styles.siblingModalInfo}>
          <Text style={[styles.siblingModalName, isSelected && { color: brandAccent }]}>
            {item.name}
          </Text>
          <Text style={styles.siblingModalClass}>
            Class {item.class_name || '-'}{item.class_section ? ` - ${item.class_section}` : ''}
            {item.admission_number ? ` • Adm: ${item.admission_number}` : ''}
          </Text>
        </View>

        {isSelected ? (
          <Icon name="check-circle" size={20} color={brandAccent} />
        ) : (
          <Icon name="circle" size={20} color="#CBD5E1" />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.header, { backgroundColor: headerBgColor, paddingTop: Math.max(insets.top, 20) }]}>
      <StatusBar barStyle="light-content" backgroundColor={headerBgColor} />

      <View style={styles.headerTop}>
        {/* Left: Back or School Logo */}
        {showBack ? (
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={22} color="#fff" />
          </TouchableOpacity>
        ) : (
          <View style={styles.schoolBrand}>
            <Image source={logoSource} style={styles.logo} resizeMode="contain" />
            <Text style={styles.schoolNameText} numberOfLines={1}>
              {title || schoolName}
            </Text>
          </View>
        )}

        {/* Center / Right: Child Switcher Pill */}
        <TouchableOpacity
          style={[styles.childPill, !hasSiblings && styles.childPillDisabled]}
          onPress={() => hasSiblings && setShowSiblingModal(true)}
          activeOpacity={hasSiblings ? 0.75 : 1}
        >
          <View style={styles.childAvatarSmall}>
            {activeStudent?.avatar_url ? (
              <Image source={{ uri: getSafeImageUrl(activeStudent.avatar_url) }} style={styles.childAvatarSmallImg} />
            ) : (
              <Text style={styles.childAvatarSmallText}>
                {studentName.charAt(0).toUpperCase()}
              </Text>
            )}
          </View>
          <View style={{ flexShrink: 1, marginRight: hasSiblings ? 4 : 0 }}>
            <Text style={styles.childPillName} numberOfLines={1}>
              {studentName}
            </Text>
            {classText ? (
              <Text style={styles.childPillClass} numberOfLines={1}>
                {classText}
              </Text>
            ) : null}
          </View>
          {hasSiblings && (
            <Icon name="chevron-down" size={14} color="#FFFFFF" style={{ marginLeft: 2 }} />
          )}
        </TouchableOpacity>

        {/* Right Controls: Notification Bell + Avatar */}
        <View style={styles.rightGroup}>
          {rightComponent ? (
            rightComponent
          ) : (
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => navigation.navigate('Notifications')}
            >
              {unreadCount > 0 && (
                <View style={styles.notificationBadge}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
              <Icon name="bell" size={20} color="#fff" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.avatarBtn}
            onPress={() => navigation.navigate('Profile')}
            activeOpacity={0.8}
          >
            {activeStudent?.avatar_url ? (
              <Image source={{ uri: getSafeImageUrl(activeStudent.avatar_url) }} style={styles.headerAvatarImg} />
            ) : (
              <Text style={styles.headerAvatarInitial}>
                {studentName.charAt(0).toUpperCase()}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Sibling Picker Bottom Sheet Modal */}
      <Modal
        visible={showSiblingModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSiblingModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowSiblingModal(false)}>
          <Pressable style={styles.modalSheet} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHandle} />
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Student Profile</Text>
              <Text style={styles.modalSubtitle}>
                Switch between children enrolled at {schoolName}
              </Text>
            </View>

            <FlatList
              data={siblings}
              keyExtractor={(item) => item.id}
              renderItem={renderSiblingItem}
              contentContainerStyle={{ paddingVertical: 8 }}
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  schoolBrand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexShrink: 1,
  },
  logo: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
  },
  schoolNameText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.3,
    maxWidth: 110,
  },
  childPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    maxWidth: 130,
    marginHorizontal: 6,
  },
  childPillDisabled: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  childAvatarSmall: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  childAvatarSmallImg: {
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  childAvatarSmallText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  childPillName: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  childPillClass: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 9,
    fontWeight: '600',
  },
  rightGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    padding: 6,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
  },
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.danger,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
    borderWidth: 1,
    borderColor: '#fff',
  },
  badgeText: {
    color: '#fff',
    fontSize: 9,
    fontWeight: 'bold',
  },
  avatarBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.8)',
  },
  headerAvatarImg: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  headerAvatarInitial: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '60%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 14,
  },
  modalHeader: {
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
  },
  siblingOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    marginBottom: 10,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  siblingOptionActive: {
    backgroundColor: '#F0FDF4',
    borderColor: '#10B981',
  },
  siblingModalAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  siblingModalPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  siblingModalInitial: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
  },
  siblingModalInfo: {
    flex: 1,
    marginLeft: 12,
  },
  siblingModalName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 2,
  },
  siblingModalClass: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
});

export default CustomHeader;
