import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, StatusBar, Dimensions } from 'react-native';
import { useDispatch } from 'react-redux';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { loginSuccess, setTenantSlug, setSchoolInfo } from '../../store/authSlice';
import Icon from 'react-native-vector-icons/Feather';

const { width } = Dimensions.get('window');

const SplashScreen = ({ onFinish }) => {
  const scaleAnim = useRef(new Animated.Value(0.6)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const textOpacityAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(40)).current;
  const dispatch = useDispatch();

  useEffect(() => {
    // Check local storage for persistent login & school info
    const checkLoginStatus = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('@auth_user');
        const storedToken = await AsyncStorage.getItem('@auth_token');
        const storedSlug = await AsyncStorage.getItem('@tenant_slug');
        const storedSchool = await AsyncStorage.getItem('@school_info');
        
        if (storedSlug) {
          dispatch(setTenantSlug(storedSlug));
        }

        if (storedSchool) {
          try {
            const parsed = JSON.parse(storedSchool);
            dispatch(setSchoolInfo(parsed));
          } catch (e) {}
        }

        if (storedUser && storedToken) {
          const userObj = JSON.parse(storedUser);
          dispatch(loginSuccess({ 
            user: userObj, 
            token: storedToken,
            tenantSlug: storedSlug || userObj.schoolSlug || 'arc',
            schoolInfo: storedSchool ? JSON.parse(storedSchool) : null
          }));
        }
      } catch (e) {
        console.error('Failed to restore login state', e);
      }
    };

    checkLoginStatus();
  }, [dispatch]);

  useEffect(() => {
    Animated.sequence([
      // Step 1: CKR Schools Badge & Logo scales in with spring
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 700,
          useNativeDriver: true,
        })
      ]),
      // Step 2: CKR Schools Title & Subtitle fade up
      Animated.parallel([
        Animated.timing(textOpacityAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        })
      ]),
      // Step 3: Hold
      Animated.delay(1200),
      // Step 4: Fade out smoothly
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(textOpacityAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.15,
          duration: 400,
          useNativeDriver: true,
        })
      ])
    ]).start(() => {
      if (onFinish) onFinish();
    });
  }, [scaleAnim, opacityAnim, textOpacityAnim, translateYAnim, onFinish]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#064e3b" />
      
      {/* CKR Schools Brand Crest & Emblem */}
      <Animated.View style={[styles.emblemContainer, { opacity: opacityAnim, transform: [{ scale: scaleAnim }] }]}>
        <View style={styles.outerGlow}>
          <View style={styles.crestCircle}>
            <Icon name="award" size={48} color="#064e3b" />
          </View>
        </View>
      </Animated.View>
      
      <Animated.View style={[styles.textContainer, { opacity: textOpacityAnim, transform: [{ translateY: translateYAnim }] }]}>
        <Text style={styles.brandTitle}>CKR SCHOOLS</Text>
        <View style={styles.taglineBadge}>
          <Text style={styles.brandTagline}>NEXT-GEN SCHOOL OPERATING SYSTEM</Text>
        </View>
        <Text style={styles.portalLabel}>Teacher & Staff App</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#064e3b', // Rich CKR Dark Green
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
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#ffffff',
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
    fontSize: 28,
    fontWeight: '900',
    color: '#ffffff',
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
    color: '#a7f3d0', // Light Emerald / Mint
    letterSpacing: 1.2,
  },
  portalLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
    letterSpacing: 0.5,
  },
});

export default SplashScreen;
