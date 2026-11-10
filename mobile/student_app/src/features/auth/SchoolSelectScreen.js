import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Feather';
import { useGetPublicSchoolsQuery } from '../../store/apiSlice';
import { setTenantSlug, setSchoolInfo } from '../../store/authSlice';
import { colors } from '../../theme/colors';
import { SOCKET_URL } from '@env';

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

const SchoolSelectScreen = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const dispatch = useDispatch();

  const { data: schoolsRes, isLoading, isError, refetch } = useGetPublicSchoolsQuery();
  const availableSchools = schoolsRes?.data || [];

  const filteredSchools = availableSchools.filter((school) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase().trim();
    return (
      school.name?.toLowerCase().includes(q) ||
      school.city?.toLowerCase().includes(q) ||
      school.state?.toLowerCase().includes(q) ||
      school.slug?.toLowerCase().includes(q)
    );
  });

  const handleSelectSchool = async (school) => {
    dispatch(setTenantSlug(school.slug));
    dispatch(setSchoolInfo(school));
    try {
      await AsyncStorage.setItem('@tenant_slug', school.slug);
      await AsyncStorage.setItem('@school_info', JSON.stringify(school));
    } catch (e) {
      console.log('Error saving selected school:', e);
    }
    navigation.navigate('Login');
  };

  const renderSchoolItem = ({ item }) => {
    const logoSource = item.logoUrl || item.logo_url
      ? { uri: resolveAssetUrl(item.logoUrl || item.logo_url) }
      : DEFAULT_LOGO;

    return (
      <TouchableOpacity
        style={styles.schoolCard}
        onPress={() => handleSelectSchool(item)}
        activeOpacity={0.75}
      >
        <View style={styles.logoWrap}>
          <Image source={logoSource} style={styles.schoolLogo} resizeMode="cover" />
        </View>

        <View style={styles.schoolDetails}>
          <Text style={styles.schoolName} numberOfLines={2}>
            {item.name}
          </Text>

          <View style={styles.metaRow}>
            {item.city ? (
              <View style={styles.badge}>
                <Icon name="map-pin" size={11} color="#475569" style={{ marginRight: 3 }} />
                <Text style={styles.badgeText}>
                  {item.city}{item.state ? `, ${item.state}` : ''}
                </Text>
              </View>
            ) : null}

            {item.affiliation_board || item.affiliationBoard ? (
              <View style={[styles.badge, styles.boardBadge]}>
                <Text style={styles.boardBadgeText}>
                  {item.affiliation_board || item.affiliationBoard}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.arrowCircle}>
          <Icon name="arrow-right" size={18} color={colors.brandAccent} />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />

      {/* Header Bar */}
      <View style={styles.header}>
        <View style={styles.headerBrandRow}>
          <View style={styles.brandIconCircle}>
            <Icon name="book-open" size={18} color="#FFFFFF" />
          </View>
          <Text style={styles.headerBrandText}>CKR SCHOOLS</Text>
        </View>
        <Text style={styles.headerTitle}>Select Your School Campus</Text>
        <Text style={styles.headerSubtitle}>
          Choose the school campus where your children are enrolled
        </Text>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Icon name="search" size={18} color="#94A3B8" style={{ marginRight: 10 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search school by name, city..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            clearButtonMode="while-editing"
            autoCorrect={false}
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Icon name="x-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {/* Content Area */}
      <View style={styles.content}>
        {isLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={colors.brandAccent} />
            <Text style={styles.loadingText}>Fetching available campuses...</Text>
          </View>
        ) : isError ? (
          <View style={styles.centerBox}>
            <Icon name="alert-circle" size={40} color={colors.danger} />
            <Text style={styles.errorText}>Unable to load schools list.</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={refetch}>
              <Text style={styles.retryBtnText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : filteredSchools.length === 0 ? (
          <View style={styles.centerBox}>
            <Icon name="search" size={40} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No Schools Found</Text>
            <Text style={styles.emptySubtitle}>Try searching with a different campus name or city.</Text>
          </View>
        ) : (
          <FlatList
            data={filteredSchools}
            keyExtractor={(item) => item.id || item.slug}
            renderItem={renderSchoolItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primaryDark, // #0F172A
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: colors.primaryDark,
  },
  headerBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  brandIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.brandAccent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBrandText: {
    color: '#93C5FD',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 48,
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
    height: '100%',
  },
  content: {
    flex: 1,
    backgroundColor: colors.background, // #F8FAFC
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  schoolCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  logoWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.border,
  },
  schoolLogo: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  schoolDetails: {
    flex: 1,
    marginLeft: 14,
    marginRight: 8,
  },
  schoolName: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
    lineHeight: 20,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    color: '#475569',
    fontWeight: '500',
  },
  boardBadge: {
    backgroundColor: '#EFF6FF',
  },
  boardBadgeText: {
    fontSize: 11,
    color: colors.brandAccent,
    fontWeight: '700',
  },
  arrowCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textMuted,
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.danger,
    fontWeight: '600',
  },
  retryBtn: {
    marginTop: 12,
    backgroundColor: colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  emptyTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  emptySubtitle: {
    marginTop: 4,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
});

export default SchoolSelectScreen;

