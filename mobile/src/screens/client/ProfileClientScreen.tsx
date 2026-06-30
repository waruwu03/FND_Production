import { PremiumAlert as Alert } from "../../components/PremiumAlert";
import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, Modal } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logout } from '../../store/slices/authSlice';
import { RootState } from '../../store';
import { api, getAssetUrl } from '../../services/api';
import { initials } from '../../utils/fnd';
import { ConfirmDialog } from '../../components/FndUi';

const MENU = [
  { label: 'Data Pribadi', icon: 'person-outline', screen: 'EditProfile' },
  { label: 'Ubah Password', icon: 'lock-closed-outline', screen: 'ChangePassword' },
  { label: 'Pengaturan', icon: 'settings-outline', screen: 'Settings' },
  { label: 'Bantuan', icon: 'help-circle-outline', screen: 'Help' },
];

export const ProfileClientScreen = ({ navigation }: any) => {
  const dispatch = useDispatch();
  const user = useSelector((state: RootState) => state.auth.user);
  const [events, setEvents] = useState<any[]>([]);
  const [logoutVisible, setLogoutVisible] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isAvatarModalVisible, setIsAvatarModalVisible] = useState(false);
  const avatarUrl = getAssetUrl(user?.avatar_url);

  useEffect(() => {
    api.get('/events')
      .then((response) => {
        if (response.data?.success) setEvents(response.data.data || []);
      })
      .catch(() => null);
  }, []);

  const completedEvents = useMemo(
    () => events.filter((event) => String(event.status).toLowerCase() === 'selesai').length,
    [events],
  );

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const refreshToken = await AsyncStorage.getItem('refreshToken');
      await api.post('/auth/logout', { refreshToken }).catch(() => null);
    } finally {
      dispatch(logout());
    }
  };



  return (
    <View className="flex-1 bg-white">
      <View className="bg-primary px-5 pb-16 pt-14">
        <View className="h-11 flex-row items-center justify-between">
          <TouchableOpacity className="h-10 w-10 items-center justify-center rounded-full" onPress={() => navigation.getParent()?.navigate('Beranda')}>
            <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text className="font-bold text-white">Profil Saya</Text>
          <TouchableOpacity className="h-10 w-10 items-center justify-center rounded-full">
            <Ionicons name="settings-outline" size={22} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView className="-mt-14 flex-1" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 104, paddingTop: 48 }}>
        {/* Avatar container outside of the card to prevent clipping */}
        <View style={{ alignItems: 'center', zIndex: 10, marginBottom: -48 }}>
          <TouchableOpacity onPress={() => setIsAvatarModalVisible(true)} className="relative">
            <View className="h-24 w-24 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-slate-100" style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 }}>
              {avatarUrl ? <Image key={avatarUrl} source={{ uri: avatarUrl }} className="h-full w-full" /> : <Text className="text-xl font-bold text-primary">{initials(user?.name)}</Text>}
            </View>
          </TouchableOpacity>
        </View>

        {/* Floating Profile Card */}
        <View className="mx-5 rounded-xl border border-slate-100 bg-white px-5 pb-5 pt-14" style={{ elevation: 4, shadowColor: '#0F172A', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } }}>
          <Text className="mt-3 text-center text-xl font-black text-primary">{user?.name || 'Client'}</Text>
          <Text className="mt-1 text-center text-sm text-slate-500">{user?.email || '-'}</Text>
          <Text className="mt-1 text-center text-xs text-slate-500">{user?.phone || 'Nomor belum diatur'}</Text>

          <View className="mt-5 flex-row">
            {[
              { value: events.length, label: 'Total Event' },
              { value: completedEvents, label: 'Selesai' },
              { value: '4.9', label: 'Rating Layanan' },
            ].map((item, index) => (
              <View key={item.label} className={`flex-1 items-center rounded-xl bg-orange-50 py-3 ${index < 2 ? 'mr-2' : ''}`}>
                <Text className="text-sm font-black text-primary">{item.value}</Text>
                <Text className="mt-1 text-[10px] text-slate-500">{item.label}</Text>
              </View>
            ))}
          </View>
        </View>

        <View className="mx-5 mt-5 overflow-hidden rounded-xl border border-slate-100 bg-white">
          {MENU.map((item, index) => (
            <TouchableOpacity
              key={item.label}
              onPress={() => navigation.navigate(item.screen)}
              className={`flex-row items-center px-4 py-4 ${index < MENU.length - 1 ? 'border-b border-slate-100' : ''}`}
            >
              <Ionicons name={item.icon as any} size={20} color="#64748B" />
              <Text className="ml-3 flex-1 font-semibold text-primary">{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color="#94A3B8" />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity className="mx-5 mt-5 flex-row items-center rounded-xl border border-red-100 bg-white px-4 py-4" onPress={() => setLogoutVisible(true)}>
          <Ionicons name="log-out-outline" size={20} color="#EF4444" />
          <Text className="ml-3 font-bold text-danger">Keluar Akun</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Premium Logout Popup */}
      <ConfirmDialog
        visible={logoutVisible}
        onClose={() => !isLoggingOut && setLogoutVisible(false)}
        onConfirm={handleLogout}
        loading={isLoggingOut}
        icon="log-out-outline"
        iconBg="#FEF2F2"
        iconColor="#EF4444"
        title="Keluar dari Akun?"
        description="Apakah Anda yakin ingin keluar dari sesi ini? Anda harus memasukkan kata sandi lagi saat masuk."
        confirmLabel="Ya, Keluar"
        confirmBg="#EF4444"
        cancelLabel="Batal"
      />

      {/* Avatar Viewer Modal */}
      <Modal
        visible={isAvatarModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsAvatarModalVisible(false)}
      >
        <View className="flex-1 items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.9)' }}>
          <TouchableOpacity 
            className="absolute top-12 right-6 h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}
            onPress={() => setIsAvatarModalVisible(false)}
          >
            <Ionicons name="close" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          
          {avatarUrl ? (
            <Image 
              source={{ uri: avatarUrl }} 
              className="w-full h-[500px]" 
              resizeMode="contain" 
            />
          ) : (
            <View className="w-48 h-48 items-center justify-center rounded-full bg-slate-200">
              <Text className="text-5xl font-bold text-primary">{initials(user?.name)}</Text>
            </View>
          )}
          
          <Text className="text-white mt-8 text-sm opacity-60">Foto profil</Text>
        </View>
      </Modal>
    </View>
  );
};
