import React from 'react';
import { View, StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Feather';
import { colors } from '../theme/colors';

// Screens
import DashboardScreen from '../features/dashboard/DashboardScreen';
import TimetableScreen from '../features/timetable/TimetableScreen';
import ResultScreen from '../features/academics/ResultScreen';
import FeesScreen from '../features/finance/FeesScreen';
import CommunicationScreen from '../features/communication/CommunicationScreen';

const Tab = createBottomTabNavigator();

const TabIcon = ({ name, color, focused }) => (
  <View style={[tabStyles.iconWrap, focused && tabStyles.iconWrapActive]}>
    <Icon name={name} size={22} color={color} />
  </View>
);

const tabStyles = StyleSheet.create({
  iconWrap: { padding: 4, borderRadius: 10 },
  iconWrapActive: { backgroundColor: (colors.brandAccent || '#2563EB') + '18' },
});

const iconMap = {
  Home: 'grid',
  Class: 'calendar',
  Academics: 'award',
  Fees: 'credit-card',
  Connect: 'message-circle',
};

const TabNavigator = () => {
  const insets = useSafeAreaInsets();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.brandAccent || '#2563EB',
        tabBarInactiveTintColor: colors.textMuted,
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700', marginBottom: 4 },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 16,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          paddingBottom: insets.bottom + 8,
          paddingTop: 6,
          height: 64 + insets.bottom,
        },
        tabBarIcon: ({ color, focused }) => (
          <TabIcon name={iconMap[route.name] || 'circle'} color={color} focused={focused} />
        ),
      })}
    >
      <Tab.Screen name="Home" component={DashboardScreen} />
      <Tab.Screen name="Class" component={TimetableScreen} />
      <Tab.Screen name="Academics" component={ResultScreen} />
      <Tab.Screen name="Fees" component={FeesScreen} />
      <Tab.Screen name="Connect" component={CommunicationScreen} />
    </Tab.Navigator>
  );
};

export default TabNavigator;
