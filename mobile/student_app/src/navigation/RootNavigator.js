import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSelector, useDispatch } from 'react-redux';
import { socket } from '../services/socket';
import { apiSlice } from '../store/apiSlice';
import { navigationRef } from './navigationRef';

// Screens
import SplashScreen from '../features/splash/SplashScreen';
import SchoolSelectScreen from '../features/auth/SchoolSelectScreen';
import LoginScreen from '../features/auth/LoginScreen';
import SiblingSelectScreen from '../features/auth/SiblingSelectScreen';
import TabNavigator from './TabNavigator';
import LiveChatScreen from '../features/communication/LiveChatScreen';
import ProfileScreen from '../features/profile/ProfileScreen';
import ChangePasswordScreen from '../features/profile/ChangePasswordScreen';
import ConsentsScreen from '../features/consents/ConsentsScreen';
import GalleryScreen from '../features/gallery/GalleryScreen';
import CourseWorkScreen from '../features/coursework/CourseWorkScreen';
import NewslettersScreen from '../features/newsletters/NewslettersScreen';
import AttendanceScreen from '../features/attendance/AttendanceScreen';
import AcademicCalendarScreen from '../features/academics/AcademicCalendarScreen';
import DateSheetScreen from '../features/academics/DateSheetScreen';
import NotificationsScreen from '../features/notifications/NotificationsScreen';
import CircularsScreen from '../features/circulars/CircularsScreen';
import ResultScreen from '../features/academics/ResultScreen';
import TimetableScreen from '../features/timetable/TimetableScreen';
import FeesScreen from '../features/finance/FeesScreen';
import CommunicationScreen from '../features/communication/CommunicationScreen';

const Stack = createNativeStackNavigator();

const RootNavigator = () => {
  const [showSplash, setShowSplash] = useState(true);
  const [initialRoute, setInitialRoute] = useState('SchoolSelect');
  const { isAuthenticated, user, hasMultipleChildren, activeStudentId, tenantSlug, schoolInfo } = useSelector((state) => state.auth);
  const dispatch = useDispatch();

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      if (!socket.connected) {
        socket.connect();
      }

      const onSocketConnect = () => {
        socket.emit('identify', user.id);
      };

      const onReceiveMessage = (newChat) => {
        if (newChat.sender_id !== user.id) {
          dispatch(apiSlice.util.invalidateTags(['LiveChat', 'Chats']));
        }
      };

      const onNewNotification = () => {
        dispatch(apiSlice.util.invalidateTags(['Notifications', 'Dashboard']));
      };

      socket.on('connect', onSocketConnect);
      socket.on('receive_message', onReceiveMessage);
      socket.on('new_notification', onNewNotification);

      if (socket.connected) {
        socket.emit('identify', user.id);
      }

      return () => {
        socket.off('connect', onSocketConnect);
        socket.off('receive_message', onReceiveMessage);
        socket.off('new_notification', onNewNotification);
        socket.disconnect();
      };
    }
  }, [isAuthenticated, user?.id, dispatch]);

  const handleSplashFinish = ({ hasSchool, isAuthenticated: authed, hasMultipleChildren: hasMultiple }) => {
    if (authed) {
      if (hasMultiple && !activeStudentId) {
        setInitialRoute('SiblingSelect');
      } else {
        setInitialRoute('MainTabs');
      }
    } else if (hasSchool || tenantSlug || schoolInfo) {
      setInitialRoute('Login');
    } else {
      setInitialRoute('SchoolSelect');
    }
    setShowSplash(false);
  };

  if (showSplash) {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName={initialRoute}
        screenOptions={{ headerShown: false, animation: 'slide_from_right' }}
      >
        {!isAuthenticated ? (
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SchoolSelect" component={SchoolSelectScreen} />
            <Stack.Screen name="SiblingSelect" component={SiblingSelectScreen} />
          </>
        ) : (
          <>
            {hasMultipleChildren && !activeStudentId ? (
              <Stack.Screen name="SiblingSelect" component={SiblingSelectScreen} />
            ) : null}

            <Stack.Screen name="MainTabs" component={TabNavigator} />
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen name="Home" component={TabNavigator} />
            <Stack.Screen name="SiblingSelect" component={SiblingSelectScreen} />
            <Stack.Screen name="SchoolSelect" component={SchoolSelectScreen} />
            <Stack.Screen name="Login" component={LoginScreen} />

            {/* Detail flows with auto-hidden bottom tabs */}
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Attendance" component={AttendanceScreen} />
            <Stack.Screen name="DateSheet" component={DateSheetScreen} />
            <Stack.Screen name="AcademicCalendar" component={AcademicCalendarScreen} />
            <Stack.Screen name="CourseWork" component={CourseWorkScreen} />
            <Stack.Screen name="Notifications" component={NotificationsScreen} />
            <Stack.Screen name="Circulars" component={CircularsScreen} />
            <Stack.Screen name="Gallery" component={GalleryScreen} />
            <Stack.Screen name="Newsletters" component={NewslettersScreen} />
            <Stack.Screen name="LiveChatScreen" component={LiveChatScreen} />
            <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
            <Stack.Screen name="Consents" component={ConsentsScreen} />

            {/* Core Academics, Result & Communication routes */}
            <Stack.Screen name="Result" component={ResultScreen} />
            <Stack.Screen name="Academics" component={ResultScreen} />
            <Stack.Screen name="Grades" component={ResultScreen} />
            <Stack.Screen name="Communication" component={CommunicationScreen} />
            <Stack.Screen name="Connect" component={CommunicationScreen} />
            <Stack.Screen name="Timetable" component={TimetableScreen} />
            <Stack.Screen name="Class" component={TimetableScreen} />
            <Stack.Screen name="Fees" component={FeesScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;
