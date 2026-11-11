import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Image, StatusBar } from 'react-native';
import { colors } from '../../theme/colors';
import { useGetThoughtOfDayQuery } from '../../store/apiSlice';

const ThoughtScreen = ({ navigation }) => {
  const { data: response, isLoading, isError } = useGetThoughtOfDayQuery();
  const [thought, setThought] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (response?.success && response?.data) {
      setThought(response.data);
    } else if (isError || (response && !response.success)) {
      setThought({ thought: "Learn as if you will live forever, live like you will die tomorrow.", author: "Mahatma Gandhi" });
    }
  }, [response, isError]);

  useEffect(() => {
    // Start fade-in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    // Navigate to Main after 3 seconds
    const timer = setTimeout(() => {
      navigation.replace('Main');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#022C22" />
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <View style={styles.logoWrap}>
          <Image
            source={require('../../assets/images/logo.jpeg')}
            style={styles.schoolLogo}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.schoolName}>ARC SCHOOL</Text>
        <Text style={styles.title}>Thought of the Day</Text>
        <Text style={styles.quote}>"{thought?.thought || '...'}"</Text>
        {thought?.author && <Text style={styles.author}>- {thought.author}</Text>}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#022C22', // Dark Forest Green
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: 30,
    borderRadius: 20,
    width: '100%',
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    overflow: 'hidden',
  },
  schoolLogo: {
    width: 62,
    height: 62,
    borderRadius: 31,
  },
  schoolName: {
    color: '#A7F3D0',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 2,
    marginBottom: 16,
    textTransform: 'uppercase',
  },
  title: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    opacity: 0.85,
  },
  quote: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    lineHeight: 30,
    fontStyle: 'italic',
    marginBottom: 16,
  },
  author: {
    color: '#A7F3D0',
    fontSize: 15,
    fontWeight: '600',
  }
});

export default ThoughtScreen;
