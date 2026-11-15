import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Platform } from 'react-native';
import { SOCKET_URL, API_URL } from '@env';

export const getSafeImageUrl = (url) => {
  if (!url || typeof url !== 'string') return null;
  let trimmed = url.trim();
  if (!trimmed || trimmed === 'null' || trimmed === 'undefined') return null;

  // 1. Replace dead/legacy domains with schoolkarma.com
  trimmed = trimmed
    .replace(/https?:\/\/ckrschools\.online/gi, 'https://schoolkarma.com')
    .replace(/https?:\/\/ckrschools\.com/gi, 'https://schoolkarma.com')
    .replace(/https?:\/\/localhost(:\d+)?/gi, 'https://schoolkarma.com')
    .replace(/https?:\/\/127\.0\.0\.1(:\d+)?/gi, 'https://schoolkarma.com');

  // 2. Prepend host for relative URLs (/cdn/..., /uploads/..., uploads/..., cdn/...)
  const host = SOCKET_URL || (API_URL ? API_URL.replace(/\/api\/?$/, '') : 'https://schoolkarma.com');

  if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('file://') && !trimmed.startsWith('data:')) {
    const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    trimmed = `${host}${cleanPath}`;
  }

  // 3. Ensure HTTPS for non-local production URLs (prevents cleartext blocks)
  if (trimmed.startsWith('http://') && !trimmed.includes('10.0.2.2')) {
    trimmed = trimmed.replace(/^http:\/\//i, 'https://');
  }

  return trimmed;
};

const UserAvatar = ({
  url,
  name,
  size = 40,
  borderRadius,
  style,
  textStyle,
  placeholderBg = '#3B82F6',
  placeholderColor = '#FFFFFF',
  borderWidth = 0,
  borderColor = 'transparent',
  resizeMode = 'cover',
}) => {
  const [hasError, setHasError] = useState(false);
  const safeUrl = getSafeImageUrl(url);

  useEffect(() => {
    setHasError(false);
  }, [safeUrl]);

  const radius = borderRadius !== undefined ? borderRadius : size / 2;
  const initial = (name && typeof name === 'string')
    ? name.trim().charAt(0).toUpperCase()
    : 'U';

  const containerStyle = [
    styles.container,
    {
      width: size,
      height: size,
      borderRadius: radius,
      borderWidth,
      borderColor,
      backgroundColor: safeUrl && !hasError ? 'transparent' : placeholderBg,
    },
    style,
  ];

  if (safeUrl && !hasError) {
    return (
      <View style={containerStyle}>
        <Image
          source={{ uri: safeUrl }}
          style={[
            styles.image,
            {
              width: size - borderWidth * 2,
              height: size - borderWidth * 2,
              borderRadius: radius - borderWidth,
              resizeMode,
            },
          ]}
          onError={() => setHasError(true)}
        />
      </View>
    );
  }

  return (
    <View style={containerStyle}>
      <Text
        style={[
          styles.text,
          {
            color: placeholderColor,
            fontSize: Math.max(10, Math.round(size * 0.42)),
          },
          textStyle,
        ]}
      >
        {initial}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    backgroundColor: '#E2E8F0',
  },
  text: {
    fontWeight: '700',
    textAlign: 'center',
  },
});

export default UserAvatar;
