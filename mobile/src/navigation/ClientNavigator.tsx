import React, { useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { ClientDashboardScreen } from '../screens/client/ClientDashboardScreen';
import { BookingScreen } from '../screens/client/BookingScreen';
import { EventSayaScreen } from '../screens/client/EventSayaScreen';
import { DetailEventClientScreen } from '../screens/client/DetailEventClientScreen';
import { InvoiceScreen } from '../screens/client/InvoiceScreen';
import { ProfileClientScreen } from '../screens/client/ProfileClientScreen';
import { LayananScreen } from '../screens/client/LayananScreen';
import { NotifikasiClientScreen } from '../screens/client/NotifikasiClientScreen';
import { EditProfileScreen } from '../screens/client/EditProfileScreen';
import { ChangePasswordClientScreen } from '../screens/client/ChangePasswordClientScreen';
import { SettingsClientScreen } from '../screens/client/SettingsClientScreen';
import { HelpClientScreen } from '../screens/client/HelpClientScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const BookingStack = createNativeStackNavigator();
const EventStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

// Beranda Stack to handle Client Dashboard and Notifications
const BerandaStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="BerandaHome" component={ClientDashboardScreen} />
    <Stack.Screen name="Notifikasi" component={NotifikasiClientScreen} />
    <Stack.Screen name="Layanan" component={LayananScreen} />
  </Stack.Navigator>
);

const BookingStackNavigator = () => (
  <BookingStack.Navigator screenOptions={{ headerShown: false }}>
    <BookingStack.Screen name="BookingHome" component={BookingScreen} />
    <BookingStack.Screen name="Layanan" component={LayananScreen} />
  </BookingStack.Navigator>
);

const EventStackNavigator = () => (
  <EventStack.Navigator screenOptions={{ headerShown: false }}>
    <EventStack.Screen name="EventSayaList" component={EventSayaScreen} />
    <EventStack.Screen name="DetailEventClient" component={DetailEventClientScreen} />
  </EventStack.Navigator>
);

const ProfileStackNavigator = () => (
  <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
    <ProfileStack.Screen name="ProfileMain" component={ProfileClientScreen} />
    <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} />
    <ProfileStack.Screen name="ChangePassword" component={ChangePasswordClientScreen} />
    <ProfileStack.Screen name="Settings" component={SettingsClientScreen} />
    <ProfileStack.Screen name="Help" component={HelpClientScreen} />
  </ProfileStack.Navigator>
);

const { width } = Dimensions.get('window');

const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const TAB_BAR_WIDTH = width - 40;
  const TAB_WIDTH = TAB_BAR_WIDTH / state.routes.length;
  
  const translateX = useSharedValue(0);

  useEffect(() => {
    translateX.value = withSpring(state.index * TAB_WIDTH, {
      damping: 20,
      stiffness: 250,
    });
  }, [state.index]);

  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
    };
  });

  return (
    <View style={styles.tabBarContainer}>
      <Animated.View style={[styles.indicator, indicatorStyle, { width: TAB_WIDTH - 20, left: 10 }]} />
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.title !== undefined ? options.title : route.name;
        const isFocused = state.index === index;

        const onPress = () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });

          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name, route.params);
          }
        };

        const icons: { [key: string]: keyof typeof Ionicons.glyphMap } = {
          Beranda: isFocused ? 'home' : 'home-outline',
          Booking: isFocused ? 'calendar' : 'calendar-outline',
          EventSaya: isFocused ? 'albums' : 'albums-outline',
          Invoice: isFocused ? 'receipt' : 'receipt-outline',
          Profil: isFocused ? 'person' : 'person-outline',
        };
        const iconName = icons[route.name] ?? 'ellipse-outline';

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            testID={options.tabBarButtonTestID}
            onPress={onPress}
            style={styles.tabItem}
          >
            <Ionicons name={iconName} size={22} color={isFocused ? '#F97316' : '#94A3B8'} />
            <Text style={[styles.tabLabel, { color: isFocused ? '#F97316' : '#94A3B8' }]}>
              {label as string}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

export const ClientNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen name="Beranda" component={BerandaStack} />
      <Tab.Screen name="Booking" component={BookingStackNavigator} />
      <Tab.Screen name="EventSaya" component={EventStackNavigator} options={{ title: 'Event Saya' }} />
      <Tab.Screen name="Invoice" component={InvoiceScreen} />
      <Tab.Screen name="Profil" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabBarContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    position: 'absolute',
    bottom: 24,
    left: 20,
    right: 20,
    height: 64,
    borderRadius: 32,
    elevation: 8,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    zIndex: 2,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '700',
    marginTop: 4,
  },
  indicator: {
    position: 'absolute',
    height: 48,
    backgroundColor: '#FFF7ED', // orange-50
    borderRadius: 24,
    zIndex: 1,
    top: 8,
  },
});
