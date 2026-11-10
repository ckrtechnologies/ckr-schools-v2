import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector, useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Feather';
import { setActiveStudent, logout } from '../../store/authSlice';
import { apiSlice } from '../../store/apiSlice';
import { colors } from '../../theme/colors';

const DEFAULT_AVATAR = require('../../assets/images/logo.jpeg');

const SiblingSelectScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { siblings, activeStudentId, user } = useSelector((state) => state.auth);
  const isSwitching = route.params?.isSwitching || false;

  const handleSelect = async (student) => {
    dispatch(setActiveStudent(student));
    await AsyncStorage.setItem('@auth_active_student', JSON.stringify(student));
    dispatch(apiSlice.util.invalidateTags([
      'Dashboard', 'Academics', 'Attendance', 'Timetable', 'CourseWork', 'Fees', 'Consents',
    ]));
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  const handleLogout = async () => {
    dispatch(logout());
    await AsyncStorage.clear();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  const renderSiblingItem = ({ item }) => {
    const isSelected = item.id === activeStudentId;
    const avatarUrl = item.avatar_url || item.avatarUrl;
    const initial = item.name ? item.name.charAt(0).toUpperCase() : 'S';

    return (
      <TouchableOpacity
        style={[styles.card, isSelected && styles.cardActive]}
        onPress={() => handleSelect(item)}
        activeOpacity={0.85}
      >
        <View style={styles.cardHeader}>
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={styles.avatar}
              resizeMode="cover"
            />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.primary }]}>
              <Text style={styles.avatarInitial}>{initial}</Text>
            </View>
          )}

          <View style={styles.infoCol}>
            <View style={styles.nameRow}>
              <Text style={styles.studentName} numberOfLines={1}>
                {item.name}
              </Text>
              {isSelected && (
                <View style={styles.activeBadge}>
                  <Text style={styles.activeBadgeText}>ACTIVE</Text>
                </View>
              )}
            </View>

            <View style={styles.pillRow}>
              <View style={styles.classPill}>
                <Icon name="book-open" size={12} color={colors.primary} style={{ marginRight: 4 }} />
                <Text style={styles.classPillText}>
                  Class {item.class_name || '-'}{item.class_section ? ` - ${item.class_section}` : ''}
                </Text>
              </View>

              {item.admission_number && (
                <View style={styles.admPill}>
                  <Text style={styles.admPillText}>Adm: {item.admission_number}</Text>
                </View>
              )}
            </View>
          </View>

          <View style={styles.arrowWrap}>
            <Icon name="chevron-right" size={20} color={colors.primary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoWrap}>
          <Image source={DEFAULT_AVATAR} style={styles.logo} />
        </View>
        <Text style={styles.schoolName}>{user?.schoolName || 'CKR Schools'}</Text>
        <Text style={styles.title}>Select Student Profile</Text>
        <Text style={styles.subtitle}>
          Choose which child's academic dashboard you wish to access
        </Text>
      </View>

      {/* Sibling List */}
      <FlatList
        data={siblings}
        keyExtractor={(item) => item.id}
        renderItem={renderSiblingItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />

      {/* Footer / Switch Cancel or Logout */}
      <View style={styles.footer}>
        {isSwitching ? (
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelBtnText}>Back to Dashboard</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Icon name="log-out" size={16} color={colors.danger} style={{ marginRight: 6 }} />
            <Text style={styles.logoutBtnText}>Sign Out</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: colors.primaryDark,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 32,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    alignItems: 'center',
  },
  logoWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    elevation: 4,
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  schoolName: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 280,
  },
  list: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  cardActive: {
    borderColor: colors.primary,
    backgroundColor: '#F0F9FF',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: colors.primary,
  },
  avatarPlaceholder: {
    width: 54,
    height: 54,
    borderRadius: 27,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
  },
  infoCol: {
    flex: 1,
    marginLeft: 14,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  studentName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    flexShrink: 1,
  },
  activeBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 8,
  },
  activeBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  classPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 128, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  classPillText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  admPill: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  admPillText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  arrowWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    alignItems: 'center',
  },
  cancelBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    backgroundColor: '#E2E8F0',
  },
  cancelBtnText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '700',
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 18,
  },
  logoutBtnText: {
    color: colors.danger,
    fontSize: 14,
    fontWeight: '700',
  },
});

export default SiblingSelectScreen;

