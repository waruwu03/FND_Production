import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';

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

const CrewTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: '#F97316',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F1F5F9',
          height: 72,
          paddingBottom: 10,
          paddingTop: 8,
          elevation: 12,
          shadowColor: '#0D1B5E',
          shadowOpacity: 0.08,
          shadowRadius: 16,
          shadowOffset: { width: 0, height: -4 },
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 2,
        },
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;
          if (route.name === 'Beranda') iconName = focused ? 'home' : 'home-outline';
          else if (route.name === 'Tugas') iconName = focused ? 'briefcase' : 'briefcase-outline';
          else if (route.name === 'CheckIn') iconName = focused ? 'location' : 'location-outline';
          else if (route.name === 'Notifikasi') iconName = focused ? 'notifications' : 'notifications-outline';
          else if (route.name === 'Profil') iconName = focused ? 'person' : 'person-outline';
          return <Ionicons name={iconName} size={22} color={color} />;
        },
      })}
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
