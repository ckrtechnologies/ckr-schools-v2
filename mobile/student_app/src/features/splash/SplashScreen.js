import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, StatusBar } from 'react-native';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/Feather';
import { setCredentials, setTenantSlug, setSchoolInfo } from '../../store/authSlice';
import { colors } from '../../theme/colors';

const SplashScreen = ({ onFinish }) => {
  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const textOpacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(30)).current;
  const dispatch = useDispatch();

  useEffect(() => {
    let hasSchool = false;
    let isAuthenticated = false;
    let hasMultiple = false;

    const restoreSession = async () => {
      try {
        const storedSlug = await AsyncStorage.getItem('@tenant_slug');
        const storedSchool = await AsyncStorage.getItem('@school_info');
        const storedUser = await AsyncStorage.getItem('@auth_user');
        const storedToken = await AsyncStorage.getItem('@auth_token');
        const storedSiblings = await AsyncStorage.getItem('@auth_siblings');
        const storedActiveStudent = await AsyncStorage.getItem('@auth_active_student');

        if (storedSlug) {
          hasSchool = true;
          dispatch(setTenantSlug(storedSlug));
        }

        if (storedSchool) {
          hasSchool = true;
          try {
            const parsed = JSON.parse(storedSchool);
            dispatch(setSchoolInfo(parsed));
          } catch (e) {}
        }

        if (storedUser && storedToken) {
          isAuthenticated = true;
          const userObj = JSON.parse(storedUser);
          const siblingsList = storedSiblings ? JSON.parse(storedSiblings) : [];
          const active = storedActiveStudent ? JSON.parse(storedActiveStudent) : (siblingsList[0] || null);
          hasMultiple = siblingsList.length > 1;

          dispatch(setCredentials({
            user: userObj,
            token: storedToken,
            tenantSlug: storedSlug || userObj.schoolSlug || 'arc',
            siblings: siblingsList,
            activeStudent: active,
          }));
        }
      } catch (err) {
        console.log('Error restoring session in splash:', err);
      }
    };

    restoreSession();

    Animated.sequence([
      // Step 1: Crest & Emblem spring in
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
      ]),
      // Step 2: CKR Schools title & tagline fade up
      Animated.parallel([
        Animated.timing(textOpacityAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]),
      // Step 3: Hold
      Animated.delay(1000),
      // Step 4: Smooth exit
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(textOpacityAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      if (onFinish) {
        onFinish({ hasSchool, isAuthenticated, hasMultipleChildren: hasMultiple });
      }
    });
  }, [scaleAnim, opacityAnim, textOpacityAnim, translateYAnim, dispatch, onFinish]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.primaryDark} />

      {/* CKR Schools Brand Crest & Emblem */}
      <Animated.View style={[styles.emblemContainer, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.outerGlow}>
          <View style={styles.crestCircle}>
            <Icon name="book-open" size={44} color={colors.primaryDark} />
          </View>
        </View>
      </Animated.View>

      <Animated.View style={[styles.textContainer, { opacity: textOpacityAnim, transform: [{ translateY: translateYAnim }] }]}>
        <Text style={styles.brandTitle}>CKR SCHOOLS</Text>
        <View style={styles.taglineBadge}>
          <Text style={styles.brandTagline}>NEXT-GEN SCHOOL OPERATING SYSTEM</Text>
        </View>
        <Text style={styles.portalLabel}>Student & Parent App</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A', // Midnight Dark Slate
    justifyContent: 'center',
    alignItems: 'center',
  },
  emblemContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  outerGlow: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  crestCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  textContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: 8,
  },
  taglineBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 10,
  },
  brandTagline: {
    fontSize: 10,
    fontWeight: '700',
    color: '#93C5FD', // Light Ice Blue
    letterSpacing: 1.2,
  },
  portalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    letterSpacing: 0.5,
  },
});

export default SplashScreen;
