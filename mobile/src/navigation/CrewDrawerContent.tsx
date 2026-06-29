import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { DrawerContentScrollView } from '@react-navigation/drawer';
import { Ionicons } from '@expo/vector-icons';
import { useDispatch, useSelector } from 'react-redux';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logout } from '../store/slices/authSlice';
import { RootState } from '../store';
import { api, getAssetUrl } from '../services/api';
import { initials } from '../utils/fnd';

const menuItems = [
  { name: 'Beranda', icon: 'home-outline', tab: 'Beranda' },
  { name: 'Tugas Saya', icon: 'calendar-outline', tab: 'Tugas' },
  { name: 'Check-In', icon: 'location-outline', tab: 'CheckIn' },
  { name: 'Dokumentasi', icon: 'images-outline', tab: 'Tugas', params: { screen: 'Dokumentasi' } },
  { name: 'Riwayat Tugas', icon: 'time-outline', tab: 'Profil', params: { screen: 'RiwayatTugas' } },
  { name: 'Notifikasi', icon: 'notifications-outline', tab: 'Notifikasi' },
  { name: 'Profil Saya', icon: 'person-outline', tab: 'Profil' },
];

const bottomMenuItems = [
  { name: 'Pengaturan', icon: 'settings-outline' },
  { name: 'Bantuan', icon: 'help-circle-outline' },
];

export const CrewDrawerContent = (props: any) => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const insets = useSafeAreaInsets();
  const avatarUrl = getAssetUrl(user?.avatar_url);

  // Helper to find leaf active screen in navigation state hierarchy
  const getActiveRoute = (state: any): string => {
    if (!state) return 'Beranda';
    const route = state.routes[state.index];
    if (route.state) return getActiveRoute(route.state);
    return route.name;
  };

  const activeScreenName = getActiveRoute(props.state);

  const getIsActive = (item: any) => {
    if (item.name === 'Beranda' && (activeScreenName === 'DashboardHome' || activeScreenName === 'Beranda')) return true;
    if (item.name === 'Tugas Saya' && (activeScreenName === 'TugasHome' || activeScreenName === 'DetailTugas')) return true;
    if (item.name === 'Check-In' && activeScreenName === 'CheckIn') return true;
    if (item.name === 'Dokumentasi' && activeScreenName === 'Dokumentasi') return true;
    if (item.name === 'Riwayat Tugas' && activeScreenName === 'RiwayatTugas') return true;
    if (item.name === 'Notifikasi' && (activeScreenName === 'NotifikasiHome' || activeScreenName === 'Notifikasi')) return true;
    if (item.name === 'Profil Saya' && (activeScreenName === 'ProfileHome' || activeScreenName === 'Profil')) return true;
    return false;
  };

  const navigateToTab = (screen: string, params?: any) => {
    props.navigation.navigate('CrewTabs', { screen, params });
    props.navigation.closeDrawer();
  };

  const handleLogout = async () => {
    const refreshToken = await AsyncStorage.getItem('refreshToken');
    await api.post('/auth/logout', { refreshToken }).catch(() => null);
    dispatch(logout());
  };

  return (
    <View className="flex-1 bg-[#0A1128] relative">
      {/* Decorative premium radial glows */}
      <View className="absolute -top-10 -right-10 h-40 w-40 rounded-full bg-crewAccent/10 blur-xl" pointerEvents="none" />
      <View className="absolute bottom-20 -left-10 h-32 w-32 rounded-full bg-blue-500/5 blur-xl" pointerEvents="none" />

      <DrawerContentScrollView {...props} contentContainerStyle={{ paddingTop: insets.top }}>
        <View className="px-6 pb-6 pt-5">
          {/* Logo and Branding */}
          <View className="mb-7 flex-row items-center">
            <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-crewAccent shadow-md shadow-crewAccent/30">
              <Text className="text-sm font-black text-white">FND</Text>
            </View>
            <View>
              <Text className="text-sm font-black tracking-wider text-white">FND Production</Text>
              <Text className="text-[8px] font-semibold tracking-widest text-slate-400">EVENT SPECIALIST</Text>
            </View>
          </View>

          <View className="h-px bg-white/5 mb-6" />

          {/* User Profile Snippet */}
          <View className="flex-row items-center">
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} className="h-11 w-11 rounded-full border-2 border-white/20" />
            ) : (
              <View className="h-11 w-11 items-center justify-center rounded-full border-2 border-white/20 bg-white/10">
                <Text className="font-bold text-white text-xs">{initials(user?.name)}</Text>
              </View>
            )}
            <View className="ml-3 flex-1">
              <Text className="text-sm font-bold text-white" numberOfLines={1}>{user?.name || 'Crew'}</Text>
              <Text className="text-[10px] text-slate-400">Sound Engineer</Text>
            </View>
            <View className="h-2 w-2 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
          </View>
        </View>

        <View className="h-px bg-white/5" />

        {/* Navigation List */}
        <View className="px-3 py-4">
          {menuItems.map((item) => {
            const active = getIsActive(item);
            return (
              <TouchableOpacity
                key={item.name}
                className="mb-1 flex-row items-center rounded-xl px-4 py-3"
                style={active ? { backgroundColor: '#F97316', shadowColor: '#F97316', shadowOpacity: 0.25, shadowRadius: 4, shadowOffset: { width: 0, height: 2 }, elevation: 4 } : {}}
                onPress={() => navigateToTab(item.tab, item.params)}
              >
                <Ionicons name={item.icon as any} size={20} color={active ? '#FFFFFF' : '#94A3B8'} />
                <Text className={`ml-4 text-sm font-semibold ${active ? 'text-white' : 'text-slate-300'}`}>{item.name}</Text>

              </TouchableOpacity>
            );
          })}
        </View>

        {/* Bottom Section */}
        <View className="mx-3 mt-2 border-t border-white/5 py-4">
          {bottomMenuItems.map((item) => (
            <TouchableOpacity key={item.name} className="mb-1 flex-row items-center rounded-xl px-4 py-3 hover:bg-white/5">
              <Ionicons name={item.icon as any} size={20} color="#64748B" />
              <Text className="ml-4 text-sm font-medium text-slate-400">{item.name}</Text>
            </TouchableOpacity>
          ))}

          <TouchableOpacity className="mt-2 flex-row items-center rounded-xl px-4 py-3 bg-red-500/10 border border-red-500/15" onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text className="ml-4 text-sm font-bold text-red-500">Keluar</Text>
          </TouchableOpacity>
        </View>
      </DrawerContentScrollView>
    </View>
  );
};
