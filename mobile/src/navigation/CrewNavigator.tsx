import React, { useEffect, useRef } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Dimensions, Animated } from 'react-native';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

// Screens
import { CrewDashboardScreen } from '../screens/crew/CrewDashboardScreen';
import { TugasSayaScreen } from '../screens/crew/TugasSayaScreen';
import { CheckInScreen } from '../screens/crew/CheckInScreen';
import { DokumentasiScreen } from '../screens/crew/DokumentasiScreen';
import { RiwayatTugasScreen } from '../screens/crew/RiwayatTugasScreen';
import { NotifikasiCrewScreen } from '../screens/crew/NotifikasiCrewScreen';
import { ProfileCrewScreen } from '../screens/crew/ProfileCrewScreen';
import { DetailTugasScreen } from '../screens/crew/DetailTugasScreen';
import { PengaturanScreen } from '../screens/crew/PengaturanScreen';
import { BantuanScreen } from '../screens/crew/BantuanScreen';
import { DataPribadiScreen } from '../screens/crew/DataPribadiScreen';
import { KeahlianScreen } from '../screens/crew/KeahlianScreen';
import { RekeningScreen } from '../screens/crew/RekeningScreen';
import { CrewDrawerContent } from './CrewDrawerContent';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();
const Drawer = createDrawerNavigator();

// Dashboard Stack
const DashboardStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="DashboardHome" component={CrewDashboardScreen} />
    <Stack.Screen name="Notifikasi" component={NotifikasiCrewScreen} />
    <Stack.Screen name="DetailTugas" component={DetailTugasScreen} />
  </Stack.Navigator>
);

// Tugas Stack
const TugasStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="TugasHome" component={TugasSayaScreen} />
    <Stack.Screen name="DetailTugas" component={DetailTugasScreen} />
    <Stack.Screen name="CheckIn" component={CheckInScreen} />
    <Stack.Screen name="Dokumentasi" component={DokumentasiScreen} />
  </Stack.Navigator>
);

const NotifikasiStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="NotifikasiHome" component={NotifikasiCrewScreen} />
    <Stack.Screen name="DetailTugas" component={DetailTugasScreen} />
  </Stack.Navigator>
);

const ProfileStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="ProfileHome" component={ProfileCrewScreen} />
    <Stack.Screen name="RiwayatTugas" component={RiwayatTugasScreen} />
    <Stack.Screen name="DetailTugas" component={DetailTugasScreen} />
    <Stack.Screen name="DataPribadi" component={DataPribadiScreen} />
    <Stack.Screen name="Keahlian" component={KeahlianScreen} />
    <Stack.Screen name="Rekening" component={RekeningScreen} />
    <Stack.Screen name="PengaturanAkun" component={PengaturanScreen} />
  </Stack.Navigator>
);

const { width } = Dimensions.get('window');

const CustomTabBar = ({ state, descriptors, navigation }: BottomTabBarProps) => {
  const TAB_BAR_WIDTH = width - 40;
  const TAB_WIDTH = TAB_BAR_WIDTH / state.routes.length;
  
  const translateX = useRef(new Animated.Value(state.index * TAB_WIDTH)).current;

  useEffect(() => {
    Animated.spring(translateX, {
      toValue: state.index * TAB_WIDTH,
      damping: 20,
      stiffness: 250,
      useNativeDriver: true,
    }).start();
  }, [state.index]);

  return (
    <View style={styles.tabBarContainer}>
      <Animated.View style={[styles.indicator, { width: TAB_WIDTH - 20, left: 10, transform: [{ translateX }] }]} />
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.title !== undefined ? options.title : (options.tabBarLabel !== undefined ? options.tabBarLabel : route.name);
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
          Tugas: isFocused ? 'briefcase' : 'briefcase-outline',
          CheckIn: isFocused ? 'location' : 'location-outline',
          Notifikasi: isFocused ? 'notifications' : 'notifications-outline',
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

const CrewTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen name="Beranda" component={DashboardStack} options={{ tabBarLabel: 'Beranda' }} />
      <Tab.Screen name="Tugas" component={TugasStack} options={{ tabBarLabel: 'Tugas' }} />
      <Tab.Screen name="CheckIn" component={CheckInScreen} options={{ tabBarLabel: 'Check In' }} />
      <Tab.Screen name="Notifikasi" component={NotifikasiStack} options={{ tabBarLabel: 'Notifikasi' }} />
      <Tab.Screen name="Profil" component={ProfileStack} options={{ tabBarLabel: 'Profil' }} />
    </Tab.Navigator>
  );
};

// Drawer screens that are not in tabs
const DrawerStack = () => (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    <Stack.Screen name="CrewTabsInner" component={CrewTabs} />
    <Stack.Screen name="DrawerDokumentasi" component={DokumentasiScreen} />
    <Stack.Screen name="DrawerRiwayatTugas" component={RiwayatTugasScreen} />
    <Stack.Screen name="DrawerPengaturan" component={PengaturanScreen} />
    <Stack.Screen name="DrawerBantuan" component={BantuanScreen} />
    <Stack.Screen name="DrawerDetailTugas" component={DetailTugasScreen} />
  </Stack.Navigator>
);

export const CrewNavigator = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CrewDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerType: 'front',
        drawerStyle: { width: 300, backgroundColor: '#0D1B5E' },
        overlayColor: 'rgba(2, 6, 23, 0.55)',
      }}
    >
      <Drawer.Screen name="CrewTabs" component={DrawerStack} />
    </Drawer.Navigator>
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
    backgroundColor: '#FFF7ED',
    borderRadius: 24,
    zIndex: 1,
    top: 8,
  },
});

